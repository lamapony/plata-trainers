/* Platå Dashboard — unified progress view */

const NON_DIAGNOSTIC_TAGS = new Set(["A0", "A1", "A2", "B1", "B2", "lesson", "repair"]);
let masteryCatalogCache = null;

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }
function escapeHtml(str) {
  return String(str || "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': '&quot;' }[c]));
}

function trainers() {
  return window.PlataCatalog && Array.isArray(window.PlataCatalog.trainers) ? window.PlataCatalog.trainers : [];
}

function competencyGraph() {
  return window.PlataCompetencies || null;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function loadLessonData() {
  const pending = trainers()
    .filter(trainer => trainer.lessonGlobal && trainer.lessonDataPath && !window[trainer.lessonGlobal])
    .map(trainer => loadScript(trainer.lessonDataPath));
  return pending.length ? Promise.all(pending) : null;
}

function sceneHref(path, sceneId, signalTag) {
  if (!sceneId) return path;
  if (!signalTag) return `${path}#${encodeURIComponent(sceneId)}`;
  const separator = path.indexOf("?") === -1 ? "?" : "&";
  return `${path}${separator}mode=repair&signal=${encodeURIComponent(signalTag)}#${encodeURIComponent(sceneId)}`;
}

function buildMasteryCatalog() {
  if (masteryCatalogCache) return masteryCatalogCache;
  const catalog = {};
  trainers().forEach(trainer => {
    const lesson = trainer.lessonGlobal ? window[trainer.lessonGlobal] : null;
    if (!lesson || !lesson.masteryMap) return;
    Object.entries(lesson.masteryMap).forEach(([tag, spec]) => {
      if (!catalog[tag]) {
        catalog[tag] = {
          tag,
          label: spec.label || tag,
          evidence: spec.evidence || "",
          competencyId: spec.competencyId || "",
          refs: []
        };
      }
      catalog[tag].refs.push({
        trainerId: trainer.id,
        trainerName: trainer.name,
        trainerIcon: trainer.icon,
        trainerPath: trainer.path,
        remediation: spec.remediation || null
      });
    });
  });
  masteryCatalogCache = catalog;
  return catalog;
}

function masterySpec(tag) {
  return buildMasteryCatalog()[tag] || null;
}

function remediationFor(spec, trainer) {
  if (!spec || !spec.refs || spec.refs.length === 0) return null;
  const ref = spec.refs.find(item => trainer && item.trainerId === trainer.id) || spec.refs[0];
  if (!ref.remediation) return null;
  return {
    cta: ref.remediation.cta || "Review scene",
    action: ref.remediation.action || "",
    sceneId: ref.remediation.sceneId || "",
    href: sceneHref(ref.trainerPath, ref.remediation.sceneId, spec.tag),
    trainerName: ref.trainerName,
    trainerIcon: ref.trainerIcon
  };
}

function isMasteryTag(tag) {
  return !!masterySpec(tag);
}

function enrichMasteryTag(weakTag, trainer) {
  const spec = masterySpec(weakTag.tag) || {};
  const signal = {
    ...weakTag,
    label: spec.label || weakTag.tag,
    evidence: spec.evidence || "",
    competencyId: spec.competencyId || "",
    remediation: remediationFor(spec, trainer)
  };
  const graph = competencyGraph();
  return graph && graph.enrichSignal ? graph.enrichSignal(signal) : signal;
}

function isRawDiagnosticTag(tag) {
  return !isMasteryTag(tag) && !NON_DIAGNOSTIC_TAGS.has(tag);
}

function loadTrainerState(trainerId) {
  const kernel = window.PlataKernel;
  if (!kernel) return null;
  const handle = kernel.createTrainerState({ trainerId, save: false });
  return handle.state;
}

function computeStats(state, trainer) {
  if (!state) return null;
  const kernel = window.PlataKernel;
  const meta = state.meta || {};
  const total = meta.totalAttempts || 0;
  const correct = meta.totalCorrect || 0;
  const byItemId = state.byItemId || {};
  const records = Object.values(byItemId);
  const mastered = records.filter(r => r.mastered).length;
  const totalItems = records.length;
  const weakTags = kernel.getWeakTags ? kernel.getWeakTags(state, 10) : [];
  const weakMastery = weakTags.filter(w => isMasteryTag(w.tag)).map(w => enrichMasteryTag(w, trainer));
  const graph = competencyGraph();
  const weakCompetencies = graph && graph.rank ? graph.rank(weakMastery) : [];
  const registerProfile = kernel.getRegisterProfile ? kernel.getRegisterProfile(state) : { formal: 0, informal: 0, neutral: 0, total: 0 };
  return {
    total,
    correct,
    accuracy: total ? Math.round((correct / total) * 100) : null,
    mastered,
    totalItems,
    currentStreak: meta.currentStreak || 0,
    longestStreak: meta.longestStreak || 0,
    lastSessionDate: meta.lastSessionDate || "",
    weakTags,
    weakMastery,
    weakCompetencies,
    registerProfile
  };
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getStreakLabel(streak) {
  if (streak === 0) return "No active streak";
  if (streak === 1) return "1 day";
  return `${streak} days`;
}

function renderTrainerCards() {
  const container = $("#trainer-cards");
  if (!container) return;
  container.innerHTML = "";

  trainers().forEach(trainer => {
    const state = loadTrainerState(trainer.id);
    const stats = computeStats(state, trainer);
    const hasData = stats && stats.total > 0;

    const card = document.createElement("article");
    card.className = "trainer-card";
    card.innerHTML = `
      <span class="tag">${trainer.icon} ${trainer.type === "lesson" ? "Narrative" : "Drill"}</span>
      <h3>${escapeHtml(trainer.name)}</h3>
      <p>${escapeHtml(trainer.description)}</p>
      ${hasData ? `
        <div class="stats-mini">
          <div><strong>${stats.total}</strong> attempts</div>
          <div><strong>${stats.accuracy !== null ? stats.accuracy + "%" : "—"}</strong> accuracy</div>
          <div><strong>${stats.mastered}/${stats.totalItems}</strong> mastered</div>
          <div><strong>${getStreakLabel(stats.currentStreak)}</strong> streak</div>
          <div class="last-session">Last: ${formatDate(stats.lastSessionDate)}</div>
        </div>
      ` : `
        <div class="stats-mini empty">No progress yet</div>
      `}
      <a class="card-link" href="${escapeHtml(trainer.path)}">${hasData ? "Continue" : "Start"} ${trainer.type === "lesson" ? "lesson" : "drill"} →</a>
    `;
    container.appendChild(card);
  });
}

function dashboardCandidates() {
  const planner = window.PlataPlanner;
  return trainers().map((trainer, index) => {
    const state = loadTrainerState(trainer.id);
    const stats = computeStats(state, trainer);
    if (!stats) return null;
    const decision = planner && planner.dashboardDecision ? planner.dashboardDecision({
      trainer,
      state,
      stats,
      weakMastery: stats.weakMastery,
      weakCompetencies: stats.weakCompetencies,
      weakTags: stats.weakTags,
      index
    }) : null;
    return { trainer, stats, decision, index };
  }).filter(x => x !== null && x.decision);
}

function renderPracticePlan(candidates) {
  const container = $("#practice-plan");
  if (!container) return;
  container.innerHTML = "";
  const planner = window.PlataPlanner;
  const compiled = planner && planner.practicePlan ? planner.practicePlan(candidates, { limit: 3 }) : null;
  const active = planner && planner.readPracticePlan ? planner.readPracticePlan() : null;
  let plan = active && active.steps && active.steps.length ? active : compiled;
  if ((!active || !active.steps || active.steps.length === 0) && planner && planner.savePracticePlan && compiled && compiled.steps && compiled.steps.length) {
    plan = planner.savePracticePlan(compiled);
  }
  if (planner && planner.planStatus && plan) {
    plan = planner.planStatus(plan, candidates);
  }
  if (!plan || !plan.steps || plan.steps.length === 0) {
    container.innerHTML = '<p class="narrative">Start any trainer to compile a short practice plan.</p>';
    return;
  }

  const canCompileNext = plan.completed && compiled && compiled.steps && compiled.steps.length
    && (!planner.planFingerprint || planner.planFingerprint(compiled) !== plan.fingerprint);

  container.innerHTML = `
    <article class="practice-plan-card ${escapeHtml(plan.kind || "continue")}">
      <div class="practice-plan-head">
        <div>
          <p class="eyebrow">${plan.completed ? "Completed plan" : "Active plan"}</p>
          <h3>${escapeHtml(plan.title)}</h3>
          <p>${escapeHtml(plan.copy)}</p>
          ${canCompileNext ? '<button class="btn" id="compile-next-plan" type="button">Compile next plan</button>' : ""}
        </div>
        <span>${escapeHtml(plan.meta || "")}</span>
      </div>
      <div class="plan-steps">
        ${plan.steps.map(step => `
          <div class="plan-step ${escapeHtml(step.kind)} ${escapeHtml(step.status || "open")}">
            <span class="plan-step-number">${step.number}</span>
            <div>
              <div class="plan-step-meta">
                <span>${escapeHtml(step.trainerIcon)} ${escapeHtml(step.trainerName)}</span>
                <span>${escapeHtml(step.minutes)}</span>
                <span class="plan-step-status ${escapeHtml(step.status || "open")}">${escapeHtml(step.statusLabel || "Open")}</span>
              </div>
              <h4>${escapeHtml(step.title)}</h4>
              <p>${escapeHtml(step.copy)}</p>
              ${step.competency ? `<span class="competency-chip">${escapeHtml(step.competency.label)}</span>` : ""}
              <a href="${escapeHtml(planner.planStepHref ? planner.planStepHref(plan, step) : step.primaryHref)}">${escapeHtml(step.primaryLabel)} →</a>
            </div>
          </div>
        `).join("")}
      </div>
    </article>
  `;

  $("#compile-next-plan")?.addEventListener("click", () => {
    if (planner && planner.savePracticePlan && compiled) {
      planner.savePracticePlan(compiled);
    }
    renderDashboard();
  });
}

function renderDueCards(candidates) {
  const container = $("#due-cards");
  if (!container) return;
  container.innerHTML = "";
  const planner = window.PlataPlanner;

  const due = planner && planner.rankDashboardDecisions
    ? planner.rankDashboardDecisions(candidates, 3)
    : candidates.slice(0, 3);

  if (due.length === 0) {
    container.innerHTML = '<p class="narrative">No progress data yet. Start a trainer to see recommendations.</p>';
    return;
  }

  due.forEach(({ trainer, stats, decision }) => {
    const topMastery = (decision.signals || []).filter(w => w.label).slice(0, 2);
    const topWeak = (decision.signals || []).filter(w => !w.label).slice(0, 3);
    const repair = decision.repair || null;
    const competency = decision.competency || null;
    const reasons = decision.reasons || [];
    const card = document.createElement("article");
    const decisionClass = String(decision.kind || "continue").replace(/[^a-z0-9-]/gi, "");
    card.className = `trainer-card due-card ${decisionClass}`;
    card.innerHTML = `
      <span class="tag due">${trainer.icon} ${escapeHtml(decision.badge || "Practice now")}</span>
      <h3>${escapeHtml(decision.title || trainer.name)}</h3>
      <p>${escapeHtml(decision.copy || trainer.description)}</p>
      <div class="due-reasons">
        ${topMastery.length ? `
          <div class="mastery-tags">
            <span class="eyebrow">Mastery signal</span>
            ${topMastery.map(w => `<span class="mastery-chip">${escapeHtml(w.label)} (${w.wrong}/${w.total})</span>`).join("")}
          </div>
        ` : ""}
        ${repair ? `
          <div class="repair-block compact">
            <span class="eyebrow">Repair path</span>
            <strong>${escapeHtml(repair.cta)}</strong>
            <p>${escapeHtml(repair.action)}</p>
          </div>
        ` : ""}
        ${competency ? `
          <div class="competency-chip-block">
            <span class="eyebrow">Root skill</span>
            <span class="competency-chip">${escapeHtml(competency.label)} · ${competency.signalCount} signal${competency.signalCount === 1 ? "" : "s"}</span>
          </div>
        ` : ""}
        ${topWeak.length ? `
          <div class="weak-tags">
            <span class="eyebrow">Weak tags</span>
            ${topWeak.map(w => `<span class="weak-tag">${escapeHtml(w.tag)} (${w.wrong}/${w.total})</span>`).join("")}
          </div>
        ` : ""}
        ${decision.meta && !repair ? `<div class="due-reason">${escapeHtml(decision.meta)}</div>` : ""}
        ${reasons.map(reason => `<div class="due-reason">${escapeHtml(reason)}</div>`).join("")}
        ${stats.accuracy !== null ? `<div class="due-reason">Current accuracy: ${stats.accuracy}%</div>` : ""}
      </div>
      <a class="card-link" href="${escapeHtml(decision.primaryHref || trainer.path)}">${escapeHtml(decision.primaryLabel || "Open trainer")} →</a>
    `;
    container.appendChild(card);
  });
}

function renderCompetencyList() {
  const container = $("#competency-list");
  if (!container) return;
  const graph = competencyGraph();
  if (!graph || !graph.rank) {
    container.innerHTML = '<p class="narrative">Competency graph is unavailable. Mastery signals still work normally.</p>';
    return;
  }

  const signals = [];
  trainers().forEach(trainer => {
    const state = loadTrainerState(trainer.id);
    const stats = computeStats(state, trainer);
    if (!stats) return;
    stats.weakMastery.forEach(signal => {
      signals.push({
        ...signal,
        trainerId: trainer.id,
        trainerName: trainer.name,
        trainerIcon: trainer.icon
      });
    });
  });

  const competencies = graph.rank(signals, 6);
  if (competencies.length === 0) {
    container.innerHTML = '<p class="narrative">No weak root skills yet. The graph appears after gold lesson mastery signals produce enough evidence.</p>';
    return;
  }

  container.innerHTML = competencies.map(item => {
    const primary = item.primarySignal || {};
    const repair = primary.remediation || null;
    return `
      <article class="mastery-card competency-card">
        <div class="mastery-card-head">
          <span class="mastery-key">${escapeHtml(item.id)}</span>
          <span class="mastery-score">${item.signalCount} signal${item.signalCount === 1 ? "" : "s"}</span>
        </div>
        <h3>${escapeHtml(item.label)}</h3>
        <p>${escapeHtml(item.copy)}</p>
        <div class="mastery-meta">
          <span>${item.wrong} wrong / ${item.total} total · ${Math.round(item.errorRate * 100)}% error rate</span>
          <span>${item.signals.map(signal => `${escapeHtml(signal.tag)} (${signal.wrong}/${signal.total})`).join(" · ")}</span>
        </div>
        ${repair ? `
          <div class="repair-block">
            <span class="eyebrow">Best first repair</span>
            <strong>${escapeHtml(primary.label || primary.tag)}</strong>
            <p>${escapeHtml(repair.action)}</p>
            <a href="${escapeHtml(repair.href)}">${escapeHtml(primary.trainerIcon || repair.trainerIcon || "")} Open scene →</a>
          </div>
        ` : ""}
      </article>
    `;
  }).join("");
}

function renderMasteryList() {
  const container = $("#mastery-list");
  if (!container) return;

  const signalMap = new Map();
  trainers().forEach(trainer => {
    const state = loadTrainerState(trainer.id);
    const stats = computeStats(state, trainer);
    if (!stats) return;
    stats.weakMastery.forEach(signal => {
      if (!signalMap.has(signal.tag)) {
        signalMap.set(signal.tag, {
          tag: signal.tag,
          label: signal.label,
          evidence: signal.evidence,
          total: 0,
          correct: 0,
          wrong: 0,
          score: 0,
          trainers: [],
          remediations: []
        });
      }
      const entry = signalMap.get(signal.tag);
      entry.total += signal.total;
      entry.correct += signal.correct;
      entry.wrong += signal.wrong;
      entry.score = entry.wrong / Math.max(1, entry.total);
      entry.trainers.push({ id: trainer.id, name: trainer.name, icon: trainer.icon });
      if (signal.remediation && !entry.remediations.some(item => item.href === signal.remediation.href)) {
        entry.remediations.push(signal.remediation);
      }
    });
  });

  const signals = Array.from(signalMap.values())
    .sort((a, b) => b.score - a.score || b.wrong - a.wrong || b.total - a.total)
    .slice(0, 6);

  if (signals.length === 0) {
    container.innerHTML = '<p class="narrative">No weak mastery signals yet. Gold lesson diagnostics will appear here after a missed concept-level attempt.</p>';
    return;
  }

  container.innerHTML = signals.map(signal => `
    <article class="mastery-card">
      <div class="mastery-card-head">
        <span class="mastery-key">${escapeHtml(signal.tag)}</span>
        <span class="mastery-score">${Math.round(signal.score * 100)}% error rate</span>
      </div>
      <h3>${escapeHtml(signal.label)}</h3>
      <p>${escapeHtml(signal.evidence)}</p>
      <div class="mastery-meta">
        <span>${signal.wrong} wrong / ${signal.total} total</span>
        <span>${signal.trainers.map(t => `${t.icon} ${escapeHtml(t.name)}`).join(" · ")}</span>
      </div>
      ${signal.remediations.length ? signal.remediations.slice(0, 2).map(repair => `
        <div class="repair-block">
          <span class="eyebrow">Repair path</span>
          <strong>${escapeHtml(repair.cta)}</strong>
          <p>${escapeHtml(repair.action)}</p>
          <a href="${escapeHtml(repair.href)}">${escapeHtml(repair.trainerIcon)} Open scene →</a>
        </div>
      `).join("") : ""}
    </article>
  `).join("");
}

function renderWeakList() {
  const container = $("#weak-list");
  if (!container) return;

  // Aggregate weak tags across all trainers
  const tagMap = new Map();
  trainers().forEach(trainer => {
    const state = loadTrainerState(trainer.id);
    const stats = computeStats(state, trainer);
    if (!stats) return;
    stats.weakTags.filter(w => isRawDiagnosticTag(w.tag)).forEach(w => {
      const key = `${trainer.id}::${w.tag}`;
      if (!tagMap.has(key)) tagMap.set(key, { ...w, trainers: [] });
      const entry = tagMap.get(key);
      entry.trainers.push({ id: trainer.id, name: trainer.name, icon: trainer.icon });
    });
  });

  const allWeak = Array.from(tagMap.values())
    .sort((a, b) => b.score - a.score || b.wrong - a.wrong)
    .slice(0, 15);

  if (allWeak.length === 0) {
    container.innerHTML = '<p class="narrative">No raw weak tags detected yet. Do more sessions to see general tag diagnostics.</p>';
    return;
  }

  container.innerHTML = allWeak.map(w => `
    <div class="weak-row">
      <div class="weak-main">
        <span class="weak-tag-large">${escapeHtml(w.tag)}</span>
        <span class="weak-trainers">${w.trainers.map(t => `${t.icon} ${escapeHtml(t.name)}`).join(" · ")}</span>
      </div>
      <div class="weak-stats">
        <span class="wrong">${w.wrong} wrong / ${w.total} total</span>
        <span class="score">${Math.round(w.score * 100)}% error rate</span>
      </div>
    </div>
  `).join("");
}

// Data tools
function exportAll() {
  const all = {};
  trainers().forEach(trainer => {
    const state = loadTrainerState(trainer.id);
    if (state) all[trainer.id] = state;
  });
  const kernel = window.PlataKernel;
  const planner = window.PlataPlanner;
  const practicePlan = planner && planner.readPracticePlan ? planner.readPracticePlan() : null;
  const payload = {
    exportedAt: new Date().toISOString(),
    profileSchemaVersion: 1,
    schemaVersion: kernel.schemaVersion,
    trainers: all,
    practicePlan: practicePlan || null
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `plata-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importAll() {
  const input = $("#import-file");
  input.click();
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const payload = JSON.parse(e.target.result);
        const kernel = window.PlataKernel;
        const statusEl = $("#import-status");
        let imported = 0;
        let skipped = 0;

        if (payload.trainers && typeof payload.trainers === "object") {
          Object.entries(payload.trainers).forEach(([trainerId, state]) => {
            try {
              const handle = kernel.createTrainerState({ trainerId });
              const importedState = kernel.importState(state, trainerId);
              handle.replace(importedState);
              imported++;
            } catch (err) {
              console.warn("Import failed for", trainerId, err);
              skipped++;
            }
          });
        }

        const planner = window.PlataPlanner;
        const hasPracticePlan = Object.prototype.hasOwnProperty.call(payload, "practicePlan");
        let restoredPlan = false;
        if (planner && planner.savePracticePlan && hasPracticePlan && payload.practicePlan) {
          const savedPlan = planner.savePracticePlan(payload.practicePlan);
          restoredPlan = !!(savedPlan && Array.isArray(savedPlan.steps) && savedPlan.steps.length);
          if (!restoredPlan) planner.clearPracticePlan?.();
        } else {
          planner?.clearPracticePlan?.();
        }

        const planText = restoredPlan ? ", restored active plan" : "";
        statusEl.textContent = `Imported ${imported} trainer state(s)${skipped ? `, skipped ${skipped}` : ""}${planText}. Refresh to see changes.`;
        statusEl.style.color = "var(--green)";
        setTimeout(() => { statusEl.textContent = ""; }, 5000);
      } catch (err) {
        $("#import-status").textContent = "Invalid JSON: " + err.message;
        $("#import-status").style.color = "var(--ember)";
      }
    };
    reader.readAsText(file);
  };
}

function renderDashboard() {
  masteryCatalogCache = null;
  const candidates = dashboardCandidates();
  renderTrainerCards();
  renderPracticePlan(candidates);
  renderDueCards(candidates);
  renderCompetencyList();
  renderMasteryList();
  renderWeakList();
}

// Init
function init() {
  const ready = loadLessonData();
  if (ready) {
    ready.then(renderDashboard).catch(err => {
      console.warn("Lesson data catalog load failed", err);
      renderDashboard();
    });
  } else {
    renderDashboard();
  }
  $("#export-all")?.addEventListener("click", exportAll);
  $("#import-trigger")?.addEventListener("click", importAll);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

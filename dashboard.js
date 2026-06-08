/* Platå Dashboard — unified progress view */

const NON_DIAGNOSTIC_TAGS = new Set(["A0", "A1", "A2", "B1", "B2", "lesson", "repair"]);
const MEMORY_DELETIONS_KEY = "plata:learner-memory:deleted-facts:v1";
const MEMORY_CORRECTIONS_KEY = "plata:learner-memory:corrections:v1";
const MEMORY_VAULT_KEY = "plata:learner-memory:vault:v1";
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

function countLabel(count, singular, plural) {
  count = Number(count || 0);
  return `${count} ${count === 1 ? singular : plural}`;
}

function missTryText(misses, tries) {
  return `${countLabel(misses, "miss", "misses")} / ${countLabel(tries, "try", "tries")}`;
}

function getStreakLabel(streak) {
  if (streak === 0) return "No active streak";
  if (streak === 1) return "1 day";
  return `${streak} days`;
}

function routeParam(name) {
  if (!window.location || !window.location.search) return "";
  const query = String(window.location.search || "").replace(/^\?/, "").split("&");
  for (const pair of query) {
    const parts = pair.split("=");
    let key = parts[0] || "";
    let value = parts.slice(1).join("=") || "";
    try {
      key = decodeURIComponent(key);
      value = decodeURIComponent(value.replace(/\+/g, " "));
    } catch (err) {
      // Keep the raw value if the URL contains malformed escapes.
    }
    if (key === name) return value;
  }
  return "";
}

function formatPlanDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function safeReadJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

function collectTrainerStates() {
  const all = {};
  trainers().forEach(trainer => {
    const state = loadTrainerState(trainer.id);
    if (state) all[trainer.id] = state;
  });
  return all;
}

function profileTrainerEntries(stateMap) {
  const all = stateMap || collectTrainerStates();
  return trainers()
    .map(trainer => ({ trainer, state: all[trainer.id] }))
    .filter(entry => entry.state);
}

function currentPracticePlan() {
  const planner = window.PlataPlanner;
  return planner && planner.readPracticePlan ? planner.readPracticePlan() : null;
}

function profileEventLogPayload(stateMap, practicePlan) {
  const events = window.PlataEvents;
  if (!events || !events.profileEventLog) return null;
  return events.profileEventLog({
    trainers: profileTrainerEntries(stateMap),
    practicePlan
  }, { kernel: window.PlataKernel });
}

function readDeletedMemoryFactIds() {
  const raw = window.localStorage ? window.localStorage.getItem(MEMORY_DELETIONS_KEY) : "";
  return safeReadJson(raw, []).filter(Boolean).map(String);
}

function writeDeletedMemoryFactIds(ids) {
  if (!window.localStorage) return;
  const unique = Array.from(new Set((ids || []).filter(Boolean).map(String))).sort();
  if (unique.length) {
    window.localStorage.setItem(MEMORY_DELETIONS_KEY, JSON.stringify(unique));
  } else {
    window.localStorage.removeItem(MEMORY_DELETIONS_KEY);
  }
}

function normalizeMemoryCorrection(record) {
  record = record && typeof record === "object" ? record : {};
  const factId = String(record.factId || record.id || "");
  if (!factId) return null;
  return {
    schemaVersion: 1,
    factId,
    reason: String(record.reason || "learner-marked-incorrect"),
    correctedAt: String(record.correctedAt || new Date().toISOString()),
    kind: String(record.kind || ""),
    signal: String(record.signal || ""),
    trainerId: String(record.trainerId || ""),
    sourceFingerprint: String(record.sourceFingerprint || "")
  };
}

function readMemoryCorrections() {
  const raw = window.localStorage ? window.localStorage.getItem(MEMORY_CORRECTIONS_KEY) : "";
  const parsed = safeReadJson(raw, []);
  const source = Array.isArray(parsed) ? parsed : Object.values(parsed || {});
  return source
    .map(normalizeMemoryCorrection)
    .filter(Boolean)
    .sort((a, b) => a.factId.localeCompare(b.factId));
}

function writeMemoryCorrections(records) {
  if (!window.localStorage) return;
  const unique = new Map();
  (records || []).map(normalizeMemoryCorrection).filter(Boolean).forEach(record => {
    unique.set(record.factId, record);
  });
  const rows = Array.from(unique.values()).sort((a, b) => a.factId.localeCompare(b.factId));
  if (rows.length) {
    window.localStorage.setItem(MEMORY_CORRECTIONS_KEY, JSON.stringify(rows));
  } else {
    window.localStorage.removeItem(MEMORY_CORRECTIONS_KEY);
  }
}

function readStoredMemoryVault() {
  const vaultApi = window.PlataMemoryVault;
  if (!vaultApi || !window.localStorage) return null;
  const vault = safeReadJson(window.localStorage.getItem(MEMORY_VAULT_KEY), null);
  if (!vault) return null;
  const result = vaultApi.validateVault ? vaultApi.validateVault(vault) : { status: "fail", issues: ["validator missing"] };
  if (result.status === "pass") return vault;
  console.warn("Stored memory vault ignored", result.issues);
  return null;
}

function writeStoredMemoryVault(vault) {
  if (!window.localStorage) return;
  if (!vault) {
    window.localStorage.removeItem(MEMORY_VAULT_KEY);
    return;
  }
  const vaultApi = window.PlataMemoryVault;
  const result = vaultApi && vaultApi.validateVault ? vaultApi.validateVault(vault) : { status: "fail", issues: ["validator missing"] };
  if (result.status !== "pass") throw new Error("Stored memory vault failed validation: " + result.issues.join("; "));
  window.localStorage.setItem(MEMORY_VAULT_KEY, JSON.stringify(vault));
}

function correctionRecordForFact(fact) {
  fact = fact || {};
  return normalizeMemoryCorrection({
    factId: fact.id || "",
    reason: "learner-marked-incorrect",
    correctedAt: new Date().toISOString(),
    kind: fact.kind || "",
    signal: fact.signal || "",
    trainerId: fact.trainerId || "",
    sourceFingerprint: fact.sourceFingerprint || ""
  });
}

function buildMemoryFacts(stateMap, practicePlan) {
  const memory = window.PlataMemory;
  if (!memory || !memory.compileMemoryFacts) {
    return { facts: [], visibleFacts: [], deletedIds: [], corrections: [], correctedIds: [], summary: null, fingerprint: "" };
  }
  let facts = memory.compileMemoryFacts({
    trainers: profileTrainerEntries(stateMap),
    practicePlan
  }, { kernel: window.PlataKernel });
  let deletedIds = readDeletedMemoryFactIds();
  let corrections = readMemoryCorrections();
  const storedVault = readStoredMemoryVault();
  if (storedVault && window.PlataMemoryVault && window.PlataMemoryVault.mergeVault) {
    try {
      const mergedVault = window.PlataMemoryVault.mergeVault({
        fingerprint: memory.memoryFingerprint ? memory.memoryFingerprint(facts) : "",
        summary: memory.summarizeMemoryFacts ? memory.summarizeMemoryFacts(facts) : null,
        facts,
        deletedFactIds: deletedIds,
        correctionRecords: corrections
      }, storedVault, { exportedAt: storedVault.exportedAt || new Date().toISOString() });
      facts = mergedVault.facts;
      deletedIds = mergedVault.deletedFactIds;
      corrections = mergedVault.correctionRecords;
    } catch (err) {
      console.warn("Stored memory vault merge failed", err);
    }
  }
  const deleted = new Set(deletedIds);
  const corrected = new Set(corrections.map(record => record.factId));
  const visibleFacts = facts.filter(fact => !deleted.has(fact.id) && !corrected.has(fact.id));
  return {
    facts,
    visibleFacts,
    deletedIds,
    corrections,
    correctedIds: Array.from(corrected).sort(),
    summary: memory.summarizeMemoryFacts ? memory.summarizeMemoryFacts(visibleFacts) : null,
    fingerprint: memory.memoryFingerprint ? memory.memoryFingerprint(visibleFacts) : ""
  };
}

function mergeImportedMemoryVault(vaultPayload, stateMap, practicePlan) {
  const vaultApi = window.PlataMemoryVault;
  if (!vaultApi || !vaultApi.mergeVault || !vaultPayload) return null;
  const bundle = buildMemoryFacts(stateMap, practicePlan);
  const mergedVault = vaultApi.mergeVault({
    fingerprint: bundle.fingerprint,
    summary: bundle.summary,
    facts: bundle.facts,
    deletedFactIds: bundle.deletedIds,
    correctionRecords: bundle.corrections
  }, vaultPayload, { exportedAt: new Date().toISOString() });
  writeStoredMemoryVault(mergedVault);
  writeDeletedMemoryFactIds(mergedVault.deletedFactIds);
  writeMemoryCorrections(mergedVault.correctionRecords);
  return mergedVault;
}

function deleteMemoryFact(factId) {
  const ids = readDeletedMemoryFactIds();
  if (!ids.includes(factId)) ids.push(factId);
  writeDeletedMemoryFactIds(ids);
  renderDashboard();
}

function restoreDeletedMemoryFacts() {
  writeDeletedMemoryFactIds([]);
  renderDashboard();
}

function correctMemoryFact(factId) {
  const bundle = buildMemoryFacts();
  const fact = bundle.facts.find(item => item.id === factId) || { id: factId };
  const record = correctionRecordForFact(fact);
  if (!record) return;
  const corrections = readMemoryCorrections().filter(item => item.factId !== record.factId);
  corrections.push(record);
  writeMemoryCorrections(corrections);
  writeDeletedMemoryFactIds(readDeletedMemoryFactIds().filter(id => id !== record.factId));
  renderDashboard();
}

function restoreMemoryCorrections() {
  writeMemoryCorrections([]);
  renderDashboard();
}

function restoreMemoryCorrection(factId) {
  const target = String(factId || "");
  if (!target) return;
  writeMemoryCorrections(readMemoryCorrections().filter(record => record.factId !== target));
  renderDashboard();
}

function ledgerDate(iso) {
  return formatPlanDateTime(iso) || "Recorded";
}

function planEvidenceText(step) {
  const evidence = step && step.completionEvidence || {};
  if (!evidence || typeof evidence !== "object") return step.completionReason || "";

  if (evidence.reason === "repair-correct") return "Correct repair answer recorded";
  if (evidence.reason === "repair-complete") return "Repair path completed";
  if (evidence.reason === "lesson-complete") return "Lesson completion recorded";

  if (evidence.reason === "drill-session-complete") {
    const total = Number(evidence.total || 0);
    const correct = Number(evidence.correct || 0);
    const accuracy = Number(evidence.accuracy);
    const count = total ? `${correct}/${total}` : "";
    const score = Number.isFinite(accuracy) ? `${accuracy}%` : "";
    const mode = evidence.mode ? ` · ${evidence.mode}` : "";
    return `Drill session completed${count ? `: ${count}` : ""}${score ? ` (${score})` : ""}${mode}`;
  }

  if (evidence.correct) return "Successful completion recorded";
  if (evidence.reason) return "Completion recorded";
  return step.completionReason || "";
}

function planStepLedgerHtml(step) {
  const rows = [];
  const started = formatPlanDateTime(step.startedAt);
  const completed = formatPlanDateTime(step.completedAt);
  const evidence = planEvidenceText(step);

  if (started) rows.push(`<span><strong>Started</strong>${escapeHtml(started)}</span>`);
  if (completed) rows.push(`<span><strong>Completed</strong>${escapeHtml(completed)}</span>`);
  if (evidence) rows.push(`<span><strong>Evidence</strong>${escapeHtml(evidence)}</span>`);

  return rows.length ? `<div class="plan-step-ledger">${rows.join("")}</div>` : "";
}

function planStepExplanationHtml(step, planner, options = {}) {
  const explanation = planner && planner.explainPracticePlanStep
    ? planner.explainPracticePlanStep(step)
    : step && step.explanation;
  if (!explanation || (!explanation.copy && (!explanation.facts || explanation.facts.length === 0))) return "";
  const facts = Array.isArray(explanation.facts) ? explanation.facts.slice(0, options.compact ? 3 : 5) : [];
  const className = options.compact ? "plan-step-explanation compact" : "plan-step-explanation";
  return `
    <div class="${className}">
      <span class="eyebrow">${escapeHtml(explanation.label || "Why this step")}</span>
      ${explanation.copy ? `<p>${escapeHtml(explanation.copy)}</p>` : ""}
      ${facts.length ? `<div class="plan-step-facts">${facts.map(fact => `<span>${escapeHtml(fact)}</span>`).join("")}</div>` : ""}
    </div>
  `;
}

function planPrimaryActionHtml(plan, planner) {
  if (!plan || plan.completed || !planner) return "";
  const step = planner.actionablePracticePlanStep ? planner.actionablePracticePlanStep(plan) : plan.primaryStep;
  if (!step) return "";
  const href = planner.planStepHref ? planner.planStepHref(plan, step) : step.primaryHref;
  const label = step.status === "active" ? "Continue current step" : "Start next step";
  const meta = `Step ${step.number} of ${plan.steps.length} · ${step.trainerName || "Practice"} · ${step.minutes}`;
  return `
    <div class="plan-primary-action">
      <a class="btn primary" href="${escapeHtml(href)}">${escapeHtml(label)}</a>
      <span>${escapeHtml(meta)}</span>
    </div>
    ${planStepExplanationHtml(step, planner, { compact: true })}
  `;
}

function advisorReceiptForPlan(plan) {
  const advisor = window.PlataAdvisor;
  const companionApi = window.PlataCompanion;
  const planner = window.PlataPlanner;
  if (!advisor || !advisor.advise || !plan || plan.completed || !planner) return null;
  const step = planner.actionablePracticePlanStep ? planner.actionablePracticePlanStep(plan) : plan.primaryStep;
  if (!step) return null;
  const memoryBundle = buildMemoryFacts(null, plan);
  if (!memoryBundle.visibleFacts.length) return null;
  const advice = advisorAdviceForPracticePlan(plan, memoryBundle.visibleFacts, step);
  if (!advice || !Array.isArray(advice.citedFacts) || advice.citedFacts.length === 0) return null;
  const companion = companionApi && companionApi.buildCard ? companionApi.buildCard({ advice }) : null;
  return {
    advice,
    companion,
    step,
    actionHref: planner.planStepHref ? planner.planStepHref(plan, step) : step.primaryHref
  };
}

function advisorAdviceForPracticePlan(plan, memoryFacts, step) {
  const advisor = window.PlataAdvisor;
  const planner = window.PlataPlanner;
  if (!advisor || !advisor.advise || !plan || plan.completed || !planner) return null;
  const target = step || (planner.actionablePracticePlanStep ? planner.actionablePracticePlanStep(plan) : plan.primaryStep);
  if (!target) return null;
  return advisor.advise({
    memoryFacts: memoryFacts || [],
    plannerDecision: target,
    limit: 3
  });
}

function advisorCitationHtml(fact) {
  const labels = [
    fact.kind || "",
    fact.signal || "",
    fact.sourceFingerprint || ""
  ].filter(Boolean);
  return `
    <span>
      <strong>${escapeHtml(fact.id || "memory fact")}</strong>
      ${escapeHtml(labels.join(" · "))}
    </span>
  `;
}

function advisorReceiptHtml(receipt) {
  if (!receipt || !receipt.advice) return "";
  const advice = receipt.advice;
  const companion = receipt.companion || null;
  const trace = advice.trace || {};
  const inputs = trace.inputs || {};
  const guardrails = companion && companion.guardrails || advice.guardrails || {};
  const next = companion && companion.nextAction || advice.nextAction || {};
  const actionLabel = next.label || "Open next step";
  const actionHref = receipt.actionHref || next.href || "#";
  const guardrailLabels = [
    guardrails.deterministic ? "Deterministic" : "",
    guardrails.requiresModel === false ? "No model call" : "",
    guardrails.usesOnlyCitedFacts ? "Cited facts only" : "",
    guardrails.containsRawAnswerText === false ? "No raw answers" : ""
  ].filter(Boolean);

  return `
    <aside class="advisor-receipt ${escapeHtml(companion && companion.kind || advice.kind || "inspect")}" aria-label="Study companion recommendation">
      <div class="advisor-receipt-head">
        <div>
          <p class="eyebrow">Study companion</p>
          <h4>${escapeHtml(companion && companion.headline || advice.title || "Companion note")}</h4>
        </div>
        <span>${escapeHtml(companion && companion.fingerprint || trace.fingerprint || "")}</span>
      </div>
      <p>${escapeHtml(companion && companion.message || advice.advice || "")}</p>
      ${companion && companion.why ? `<p class="narrative">${escapeHtml(companion.why)}</p>` : ""}
      <div class="advisor-chain">
        <span><strong>Planner</strong>${escapeHtml(inputs.plannerRule || receipt.step.trace && receipt.step.trace.rule || "practice-plan")}</span>
        <span><strong>Advice rule</strong>${escapeHtml(trace.rule || "")}</span>
        ${companion ? `<span><strong>Bridge</strong>${escapeHtml(companion.guardrails && companion.guardrails.externalAgentOptional ? "Hermes optional" : "Local only")}</span>` : ""}
        ${guardrailLabels.map(label => `<span><strong>Guardrail</strong>${escapeHtml(label)}</span>`).join("")}
      </div>
      <div class="advisor-citations">
        <span class="eyebrow">Cited memory</span>
        <div>${(advice.citedFacts || []).map(advisorCitationHtml).join("")}</div>
      </div>
      <div class="advisor-next-action">
        <strong>Next action</strong>
        <a href="${escapeHtml(actionHref)}">${escapeHtml(actionLabel)} →</a>
      </div>
    </aside>
  `;
}

function planReturnReceiptHtml(plan, planner) {
  if (!routeParam("ledger-return") || !plan || !plan.steps || !planner) return "";
  const returnedStepId = routeParam("step");
  const returnedStep = plan.steps.find(step => step.routeId === returnedStepId) || null;
  const nextStep = planner.actionablePracticePlanStep ? planner.actionablePracticePlanStep(plan) : plan.primaryStep;
  const returnedLabel = returnedStep
    ? `Step ${returnedStep.number} recorded`
    : "Plan updated";
  const returnedCopy = returnedStep
    ? `${returnedStep.title} is now in your practice record.`
    : "Your latest practice result is reflected below.";

  if (nextStep && !plan.completed) {
    const href = planner.planStepHref ? planner.planStepHref(plan, nextStep) : nextStep.primaryHref;
    return `
      <div class="plan-return-receipt">
        <div>
          <strong>${escapeHtml(returnedLabel)}</strong>
          <span>${escapeHtml(returnedCopy)}</span>
        </div>
        <a class="btn primary" href="${escapeHtml(href)}">Continue next step</a>
        <span class="plan-return-next">Step ${escapeHtml(nextStep.number)} of ${escapeHtml(plan.steps.length)} · ${escapeHtml(nextStep.trainerName || "Practice")} · ${escapeHtml(nextStep.minutes)}</span>
        ${planStepExplanationHtml(nextStep, planner, { compact: true })}
      </div>
    `;
  }

  return `
    <div class="plan-return-receipt complete">
      <div>
        <strong>${escapeHtml(returnedLabel)}</strong>
        <span>${escapeHtml(plan.completed ? "All tracked steps are complete." : returnedCopy)}</span>
      </div>
    </div>
  `;
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
  const stateMap = collectTrainerStates();
  const practicePlan = currentPracticePlan();
  const memoryBundle = buildMemoryFacts(stateMap, practicePlan);
  return trainers().map((trainer, index) => {
    const state = stateMap[trainer.id] || null;
    const stats = computeStats(state, trainer);
    if (!stats) return null;
    const decision = planner && planner.dashboardDecision ? planner.dashboardDecision({
      trainer,
      state,
      stats,
      weakMastery: stats.weakMastery,
      weakCompetencies: stats.weakCompetencies,
      weakTags: stats.weakTags,
      memoryFacts: memoryBundle.visibleFacts,
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
  const planProgress = plan.steps.length ? Math.round(((plan.completedCount || 0) / plan.steps.length) * 100) : 0;
  const advisorReceipt = advisorReceiptForPlan(plan);

  container.innerHTML = `
    <article class="practice-plan-card ${escapeHtml(plan.kind || "continue")}">
      <div class="practice-plan-head">
        <div>
          <p class="eyebrow">${plan.completed ? "Completed plan" : "Active plan"}</p>
          <h3>${escapeHtml(plan.title)}</h3>
          <p>${escapeHtml(plan.copy)}</p>
          ${planPrimaryActionHtml(plan, planner)}
          ${canCompileNext ? '<button class="btn" id="compile-next-plan" type="button">Compile next plan</button>' : ""}
        </div>
        <span>${escapeHtml(plan.meta || "")}</span>
      </div>
      <div class="plan-progress" aria-label="${planProgress}% complete">
        <span style="width: ${planProgress}%"></span>
      </div>
      ${advisorReceiptHtml(advisorReceipt)}
      ${planReturnReceiptHtml(plan, planner)}
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
              ${planStepExplanationHtml(step, planner)}
              ${planStepLedgerHtml(step)}
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
            ${topMastery.map(w => `<span class="mastery-chip">${escapeHtml(w.label)} · ${escapeHtml(missTryText(w.wrong, w.total))}</span>`).join("")}
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
            ${topWeak.map(w => `<span class="weak-tag">${escapeHtml(w.tag)} · ${escapeHtml(missTryText(w.wrong, w.total))}</span>`).join("")}
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

function buildEvidenceLedger() {
  const evidence = window.PlataEvidence;
  if (!evidence || !evidence.buildLedger) return [];
  const inputs = trainers().map(trainer => {
    const state = loadTrainerState(trainer.id);
    const stats = computeStats(state, trainer);
    return { trainer, state, stats };
  });
  return evidence.buildLedger(inputs, {
    kernel: window.PlataKernel,
    masterySpec,
    limit: 10,
    attemptLimit: 4
  });
}

function renderEvidenceLedger() {
  const container = $("#evidence-ledger");
  if (!container) return;
  const entries = buildEvidenceLedger();

  if (entries.length === 0) {
    container.innerHTML = '<p class="narrative">No evidence trail yet. Complete a trainer item and the dashboard will show which signals changed.</p>';
    return;
  }

  container.innerHTML = entries.map(entry => `
    <article class="ledger-row ${escapeHtml(entry.kind)}">
      <div class="ledger-status">
        <span>${escapeHtml(entry.status)}</span>
        <time>${escapeHtml(ledgerDate(entry.at))}</time>
      </div>
      <div class="ledger-main">
        <h3>${escapeHtml(entry.title)}</h3>
        <p>${escapeHtml(entry.copy)}</p>
        <div class="ledger-facts">
          <span>${escapeHtml(entry.trainer.icon)} ${escapeHtml(entry.trainer.name)}</span>
          ${(entry.facts || []).slice(0, 4).map(fact => `<span>${escapeHtml(fact)}</span>`).join("")}
        </div>
      </div>
    </article>
  `).join("");
}

function memoryEvidenceHtml(fact) {
  const rows = (fact.evidence || []).slice(0, 5);
  if (!rows.length) return "";
  return `
    <div class="memory-evidence">
      ${rows.map(row => `<span><strong>${escapeHtml(row.label)}</strong>${escapeHtml(row.value)}</span>`).join("")}
    </div>
  `;
}

function memoryCorrectionRowsHtml(records) {
  records = Array.isArray(records) ? records.slice(0, 10) : [];
  if (!records.length) return "";
  return `
    <div class="memory-corrections" aria-label="Corrected learner memory facts">
      <div class="memory-corrections-head">
        <span class="eyebrow">Corrected assumptions</span>
        <span>${records.length} record${records.length === 1 ? "" : "s"}</span>
      </div>
      ${records.map(record => `
        <article class="memory-correction-row">
          <div>
            <strong>${escapeHtml(record.factId)}</strong>
            <p>Marked incorrect${record.correctedAt ? ` · ${escapeHtml(formatPlanDateTime(record.correctedAt) || record.correctedAt)}` : ""}</p>
            <div class="memory-meta">
              ${record.kind ? `<span>${escapeHtml(record.kind)}</span>` : ""}
              ${record.signal ? `<span>${escapeHtml(record.signal)}</span>` : ""}
              ${record.sourceFingerprint ? `<span>${escapeHtml(record.sourceFingerprint)}</span>` : ""}
            </div>
          </div>
          <button class="memory-delete correction" type="button" data-memory-correction-restore="${escapeHtml(record.factId)}">Restore fact</button>
        </article>
      `).join("")}
    </div>
  `;
}

function renderMemoryFacts() {
  const container = $("#memory-facts");
  if (!container) return;
  const bundle = buildMemoryFacts();
  const facts = bundle.visibleFacts.slice(0, 12);
  const summary = bundle.summary || { total: 0, openSignals: 0, dueReviews: 0 };
  const hiddenCount = bundle.deletedIds.length;
  const correctedCount = bundle.corrections.length;

  if (!window.PlataMemory) {
    container.innerHTML = '<p class="narrative">Learner memory is unavailable. Progress tracking still works normally.</p>';
    return;
  }

  if (bundle.facts.length === 0 && bundle.corrections.length === 0) {
    container.innerHTML = '<p class="narrative">No learner memory facts yet. Complete a trainer or tracked practice step and this view will show what the system believes.</p>';
    return;
  }

  container.innerHTML = `
    <div class="memory-summary">
      <span><strong>${summary.total}</strong> visible facts</span>
      <span><strong>${summary.openSignals}</strong> open signals</span>
      <span><strong>${summary.dueReviews}</strong> due reviews</span>
      ${correctedCount ? `<span><strong>${correctedCount}</strong> corrected facts</span>` : ""}
      ${bundle.fingerprint ? `<span><strong>${escapeHtml(bundle.fingerprint)}</strong> fingerprint</span>` : ""}
      ${hiddenCount ? `<button class="btn" id="restore-memory-facts" type="button">Restore ${hiddenCount} hidden</button>` : ""}
      ${correctedCount ? `<button class="btn" id="restore-memory-corrections" type="button">Restore ${correctedCount} corrected</button>` : ""}
    </div>
    ${facts.length ? `
      <div class="memory-grid">
        ${facts.map(fact => `
        <article class="memory-card ${escapeHtml(fact.kind)}">
          <div class="memory-card-head">
            <span>${escapeHtml(fact.kind)}</span>
            <span>${Math.round(Number(fact.confidence || 0) * 100)}%</span>
          </div>
          <h3>${escapeHtml(fact.title)}</h3>
          <p>${escapeHtml(fact.copy)}</p>
          ${memoryEvidenceHtml(fact)}
          <div class="memory-meta">
            ${fact.trainerName ? `<span>${escapeHtml(fact.trainerName)}</span>` : ""}
            ${fact.signal ? `<span>${escapeHtml(fact.signal)}</span>` : ""}
            ${fact.sourceFingerprint ? `<span>${escapeHtml(fact.sourceFingerprint)}</span>` : ""}
          </div>
          <div class="memory-actions">
            <button class="memory-delete" type="button" data-memory-delete="${escapeHtml(fact.id)}">Hide fact</button>
            <button class="memory-delete correction" type="button" data-memory-correct="${escapeHtml(fact.id)}">Mark incorrect</button>
          </div>
        </article>
        `).join("")}
      </div>
    ` : '<p class="narrative">All current memory facts are hidden or corrected. Restore them if the planner needs them again.</p>'}
    ${memoryCorrectionRowsHtml(bundle.corrections)}
  `;

  $("#restore-memory-facts")?.addEventListener("click", restoreDeletedMemoryFacts);
  $("#restore-memory-corrections")?.addEventListener("click", restoreMemoryCorrections);
  $$("[data-memory-delete]").forEach(button => {
    button.addEventListener("click", () => deleteMemoryFact(button.getAttribute("data-memory-delete")));
  });
  $$("[data-memory-correct]").forEach(button => {
    button.addEventListener("click", () => correctMemoryFact(button.getAttribute("data-memory-correct")));
  });
  $$("[data-memory-correction-restore]").forEach(button => {
    button.addEventListener("click", () => restoreMemoryCorrection(button.getAttribute("data-memory-correction-restore")));
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
    container.innerHTML = '<p class="narrative">No root-skill pattern needs attention yet. This map appears once lesson evidence points to a broader skill.</p>';
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
          <span>${escapeHtml(missTryText(item.wrong, item.total))} · ${Math.round(item.errorRate * 100)}% error rate</span>
          <span>${item.signals.map(signal => `${escapeHtml(signal.tag)} · ${escapeHtml(missTryText(signal.wrong, signal.total))}`).join(" · ")}</span>
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
    container.innerHTML = '<p class="narrative">No repair pattern is active yet. When a lesson miss points to a concept, it will appear here with a source scene.</p>';
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
        <span>${escapeHtml(missTryText(signal.wrong, signal.total))}</span>
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
    container.innerHTML = '<p class="narrative">No raw weak tags yet. This developer view fills in after more tagged attempts.</p>';
    return;
  }

  container.innerHTML = allWeak.map(w => `
    <div class="weak-row">
      <div class="weak-main">
        <span class="weak-tag-large">${escapeHtml(w.tag)}</span>
        <span class="weak-trainers">${w.trainers.map(t => `${t.icon} ${escapeHtml(t.name)}`).join(" · ")}</span>
      </div>
      <div class="weak-stats">
        <span class="wrong">${escapeHtml(missTryText(w.wrong, w.total))}</span>
        <span class="score">${Math.round(w.score * 100)}% error rate</span>
      </div>
    </div>
  `).join("");
}

// Data tools
function exportAll() {
  const all = collectTrainerStates();
  const kernel = window.PlataKernel;
  const practicePlan = currentPracticePlan();
  const eventLog = profileEventLogPayload(all, practicePlan);
  const memoryBundle = buildMemoryFacts(all, practicePlan);
  const exportedAt = new Date().toISOString();
  const learnerModel = window.PlataLearnerModel ? window.PlataLearnerModel.buildModel(memoryBundle.visibleFacts, {
    generatedAt: exportedAt,
    now: exportedAt,
    memoryFingerprint: memoryBundle.fingerprint
  }) : null;
  const memoryVault = window.PlataMemoryVault ? window.PlataMemoryVault.createVault({
    fingerprint: memoryBundle.fingerprint,
    summary: memoryBundle.summary,
    facts: memoryBundle.visibleFacts,
    deletedFactIds: memoryBundle.deletedIds,
    correctionRecords: memoryBundle.corrections
  }, { exportedAt }) : null;
  const memoryBrief = window.PlataMemoryBrief && memoryVault ? window.PlataMemoryBrief.buildBrief(memoryVault, {
    generatedAt: exportedAt,
    catalog: window.PlataCatalog,
    competencyGraph: window.PlataCompetencies
  }) : null;
  const agentHandoff = window.PlataAgentHandoff && memoryBrief ? window.PlataAgentHandoff.buildHandoff(memoryBrief, {
    generatedAt: exportedAt
  }) : null;
  const companionAdvice = advisorAdviceForPracticePlan(practicePlan, memoryBundle.visibleFacts);
  const companion = window.PlataCompanion && window.PlataCompanion.buildCard && (companionAdvice || agentHandoff)
    ? window.PlataCompanion.buildCard({
      advice: companionAdvice,
      handoff: agentHandoff,
      generatedAt: exportedAt
    })
    : null;
  const hermesBrief = window.PlataCompanion && window.PlataCompanion.buildHermesBrief && companion
    ? window.PlataCompanion.buildHermesBrief(companion, agentHandoff, { generatedAt: exportedAt })
    : null;
  const payload = {
    exportedAt,
    profileSchemaVersion: 1,
    schemaVersion: kernel.schemaVersion,
    trainers: all,
    practicePlan: practicePlan || null,
    eventLog,
    memory: window.PlataMemory ? {
      schemaVersion: window.PlataMemory.memorySchemaVersion,
      fingerprint: memoryBundle.fingerprint,
      summary: memoryBundle.summary,
      facts: memoryBundle.visibleFacts,
      deletedFactIds: memoryBundle.deletedIds,
      correctionRecords: memoryBundle.corrections
    } : null,
    learnerModel,
    memoryVault,
    memoryBrief,
    agentHandoff,
    companion,
    hermesBrief
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
        const vaultApi = window.PlataMemoryVault;
        const vaultPayload = vaultApi && payload && payload.vaultType === vaultApi.vaultType ? payload : payload && payload.memoryVault;
        const standaloneVaultImport = !!(vaultPayload && payload && payload.vaultType === vaultApi.vaultType);
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
        if (!standaloneVaultImport) {
          if (planner && planner.savePracticePlan && hasPracticePlan && payload.practicePlan) {
            const savedPlan = planner.savePracticePlan(payload.practicePlan);
            restoredPlan = !!(savedPlan && Array.isArray(savedPlan.steps) && savedPlan.steps.length);
            if (!restoredPlan) planner.clearPracticePlan?.();
          } else {
            planner?.clearPracticePlan?.();
          }
        }

        if (Object.prototype.hasOwnProperty.call(payload, "memory") && payload.memory) {
          writeDeletedMemoryFactIds(Array.isArray(payload.memory.deletedFactIds) ? payload.memory.deletedFactIds : []);
          writeMemoryCorrections(Array.isArray(payload.memory.correctionRecords) ? payload.memory.correctionRecords : []);
        } else if (!standaloneVaultImport && !vaultPayload) {
          writeDeletedMemoryFactIds([]);
          writeMemoryCorrections([]);
          writeStoredMemoryVault(null);
        }

        const mergedVault = vaultPayload ? mergeImportedMemoryVault(vaultPayload, collectTrainerStates(), currentPracticePlan()) : null;
        const planText = restoredPlan ? ", restored active plan" : "";
        const vaultText = mergedVault ? `, merged memory vault (${mergedVault.factCount} fact(s))` : "";
        statusEl.textContent = standaloneVaultImport && mergedVault
          ? `Merged memory vault (${mergedVault.factCount} fact(s)). Refresh to see changes.`
          : `Imported ${imported} trainer state(s)${skipped ? `, skipped ${skipped}` : ""}${planText}${vaultText}. Refresh to see changes.`;
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
  renderEvidenceLedger();
  renderMemoryFacts();
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

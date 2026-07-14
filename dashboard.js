/* Platå Dashboard — unified progress view */

const NON_DIAGNOSTIC_TAGS = new Set(["A0", "A1", "A2", "B1", "B2", "lesson", "repair"]);
const MEMORY_DELETIONS_KEY = "plata:learner-memory:deleted-facts:v1";
const MEMORY_CORRECTIONS_KEY = "plata:learner-memory:corrections:v1";
const MEMORY_VAULT_KEY = "plata:learner-memory:vault:v1";
const DEMO_PROFILE_QUERY_VALUES = new Set(["1", "true", "learner", "sample"]);
let masteryCatalogCache = null;
let demoTrainerStateCache = null;

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
  const sceneRepair = {
    kind: "scene",
    cta: ref.remediation.cta || "Review scene",
    action: ref.remediation.action || "",
    sceneId: ref.remediation.sceneId || "",
    href: sceneHref(ref.trainerPath, ref.remediation.sceneId, spec.tag),
    trainerName: ref.trainerName,
    trainerIcon: ref.trainerIcon
  };
  const catalog = window.PlataCatalog;
  const drillRepair = catalog && catalog.drillRemediation
    ? catalog.drillRemediation(spec.tag, trainer && trainer.id)
    : null;
  const vocabRepair = catalog && catalog.buildVocabRemediation
    ? catalog.buildVocabRemediation(trainer && trainer.id, ref.remediation.sceneId || "")
    : null;
  const merged = Object.assign({}, sceneRepair, { drillRepair, vocabRepair });
  if (!drillRepair && !vocabRepair) return sceneRepair;
  return merged;
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
  if (isDemoMode()) return demoTrainerState(trainerId);
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
  const due = kernel.countDueItems ? kernel.countDueItems(state) : records.filter(r => !r.lastSeen || !r.nextDueAt).length;
  return {
    total,
    correct,
    accuracy: total ? Math.round((correct / total) * 100) : null,
    mastered,
    totalItems,
    due,
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

function headroom() {
  return window.PlataHeadroom || null;
}

function repairBlockHtml(repair) {
  if (!repair) return "";
  const isDrill = repair.kind === "drill";
  const isVocab = repair.kind === "vocab";
  const eyebrow = isDrill ? "Drill repair" : isVocab ? "Vocabulary recurrence" : "Scene repair";
  const linkLabel = isDrill ? "Open drill →" : isVocab ? "Open vocab SR →" : "Open scene →";
  return `
          <div class="repair-block ${isDrill ? "repair-block-drill" : isVocab ? "repair-block-vocab" : ""}">
            <span class="eyebrow">${eyebrow}</span>
            <strong>${escapeHtml(repair.cta)}</strong>
            <p>${escapeHtml(repair.action)}</p>
            <a href="${escapeHtml(repair.href)}">${escapeHtml(repair.trainerIcon || "")} ${linkLabel}</a>
          </div>
        `;
}

function headroomCard(interp, options) {
  const layer = headroom();
  if (!layer || !layer.renderCard) return "";
  return layer.renderCard(interp, options || {});
}

function aggregateMasterySignals() {
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
      if (signal.remediation) {
        const sceneRepair = Object.assign({ kind: "scene" }, signal.remediation);
        delete sceneRepair.drillRepair;
        if (!entry.remediations.some(item => item.href === sceneRepair.href)) {
          entry.remediations.push(sceneRepair);
        }
        const drillRepair = signal.remediation.drillRepair;
        if (drillRepair && !entry.remediations.some(item => item.href === drillRepair.href)) {
          entry.remediations.push(drillRepair);
        }
        const vocabRepair = signal.remediation.vocabRepair;
        if (vocabRepair && !entry.remediations.some(item => item.href === vocabRepair.href)) {
          entry.remediations.push(vocabRepair);
        }
      }
    });
  });
  return Array.from(signalMap.values())
    .sort((a, b) => b.score - a.score || b.wrong - a.wrong || b.total - a.total);
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

function isDemoMode() {
  return DEMO_PROFILE_QUERY_VALUES.has(String(routeParam("demo") || "").trim().toLowerCase());
}

function cloneJson(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function setDemoAttemptAt(state, index, at) {
  const attempt = state && state.attempts && state.attempts[index];
  if (!attempt) return;
  attempt.at = at;
  const item = state.byItemId && state.byItemId[attempt.itemId];
  if (item) item.lastSeen = at;
}

function rebuildDemoTimeline(state) {
  if (!state || !state.meta) return state;
  const daily = {};
  let latest = "";
  (state.attempts || []).forEach(attempt => {
    const at = String(attempt.at || "");
    if (!at) return;
    const day = at.slice(0, 10);
    daily[day] = (daily[day] || 0) + 1;
    if (!latest || at > latest) latest = at;
  });
  state.meta.dailyAttempts = daily;
  if (latest) {
    state.meta.lastSessionDate = latest.slice(0, 10);
    state.updatedAt = latest;
  }
  state.items = state.byItemId || {};
  return state;
}

function demoRecordAttempt(state, attempt, at) {
  const kernel = window.PlataKernel;
  if (!kernel || !kernel.recordAttempt) return;
  kernel.recordAttempt(state, attempt);
  setDemoAttemptAt(state, state.attempts.length - 1, at);
}

function demoRadiatorState(kernel) {
  const state = kernel.freshState("lesson-b2-radiator-register");
  demoRecordAttempt(state, {
    itemId: "official-reply-passive",
    correct: false,
    tags: ["B2", "lesson", "passive-agency"],
    mode: "lesson",
    register: "formal"
  }, "2026-06-01T08:00:00.000Z");
  demoRecordAttempt(state, {
    itemId: "official-reply-passive",
    correct: true,
    tags: ["B2", "repair", "passive-agency"],
    mode: "repair",
    register: "formal"
  }, "2026-06-02T08:00:00.000Z");
  if (kernel.recordRepairClosure) {
    kernel.recordRepairClosure(state, {
      signal: "passive-agency",
      itemId: "official-reply-passive",
      sceneId: "official-reply-passive",
      lessonId: "lesson-b2-radiator-register",
      label: "Read what was actually promised",
      action: "Name who promises what",
      resolvedAt: "2026-06-02T08:02:00.000Z",
      sourceMode: "repair",
      correct: true
    });
  }
  demoRecordAttempt(state, {
    itemId: "workplace-understatement",
    correct: false,
    tags: ["B2", "lesson", "understatement-with-agency", "passive-agency"],
    mode: "lesson",
    register: "workplace"
  }, "2026-06-06T08:00:00.000Z");
  demoRecordAttempt(state, {
    itemId: "two-registers",
    correct: true,
    tags: ["B2", "lesson", "formal-register-control"],
    mode: "lesson",
    register: "formal"
  }, "2026-06-07T08:00:00.000Z");
  return rebuildDemoTimeline(state);
}

function demoJobFollowupState(kernel) {
  const state = kernel.freshState("lesson-b2-job-followup");
  demoRecordAttempt(state, {
    itemId: "silence-pressure",
    correct: true,
    tags: ["B2", "lesson", "process-patience"],
    mode: "lesson",
    register: "professional"
  }, "2026-05-01T08:00:00.000Z");
  demoRecordAttempt(state, {
    itemId: "email-register",
    correct: false,
    tags: ["B2", "lesson", "professional-email-agency"],
    mode: "lesson",
    register: "formal"
  }, "2026-06-03T08:00:00.000Z");
  demoRecordAttempt(state, {
    itemId: "linkedin-choice",
    correct: false,
    tags: ["B2", "lesson", "platform-register-shift"],
    mode: "lesson",
    register: "professional"
  }, "2026-06-04T08:00:00.000Z");
  demoRecordAttempt(state, {
    itemId: "reply-consequence",
    correct: true,
    tags: ["B2", "lesson", "reply-tone-reading"],
    mode: "lesson",
    register: "professional"
  }, "2026-06-05T08:00:00.000Z");
  return rebuildDemoTimeline(state);
}

function demoTrainerStates() {
  const kernel = window.PlataKernel;
  if (!kernel || !kernel.freshState) return {};
  if (!demoTrainerStateCache) {
    demoTrainerStateCache = {
      "lesson-b2-radiator-register": demoRadiatorState(kernel),
      "lesson-b2-job-followup": demoJobFollowupState(kernel)
    };
  }
  return demoTrainerStateCache;
}

function demoTrainerState(trainerId) {
  const kernel = window.PlataKernel;
  const state = demoTrainerStates()[trainerId];
  if (state) return cloneJson(state);
  return kernel && kernel.freshState ? kernel.freshState(trainerId) : null;
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
  if (isDemoMode()) return null;
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
  if (isDemoMode()) return [];
  const raw = window.localStorage ? window.localStorage.getItem(MEMORY_DELETIONS_KEY) : "";
  return safeReadJson(raw, []).filter(Boolean).map(String);
}

function writeDeletedMemoryFactIds(ids) {
  if (isDemoMode()) return;
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
  if (isDemoMode()) return [];
  const raw = window.localStorage ? window.localStorage.getItem(MEMORY_CORRECTIONS_KEY) : "";
  const parsed = safeReadJson(raw, []);
  const source = Array.isArray(parsed) ? parsed : Object.values(parsed || {});
  return source
    .map(normalizeMemoryCorrection)
    .filter(Boolean)
    .sort((a, b) => a.factId.localeCompare(b.factId));
}

function writeMemoryCorrections(records) {
  if (isDemoMode()) return;
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
  if (isDemoMode()) return null;
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
  if (isDemoMode()) return;
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

  if (evidence.reason === "self-report-session-complete") {
    const total = Number(evidence.total || 0);
    const completed = Number(evidence.completed || 0);
    const needsRevision = Number(evidence.needsRevision || 0);
    const rate = Number(evidence.completionRate);
    const count = total ? `${completed}/${total} completed` : "completed";
    const score = Number.isFinite(rate) ? ` · ${rate}%` : "";
    const revision = needsRevision ? ` · ${needsRevision} need revision` : "";
    const mode = evidence.mode ? ` · ${evidence.mode}` : "";
    return `Writing practice: ${count}${score}${revision}${mode} · you assessed the text yourself`;
  }

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

function resolvePracticePlan(candidates) {
  const planner = window.PlataPlanner;
  const compiled = planner && planner.practicePlan ? planner.practicePlan(candidates, { limit: 3 }) : null;
  if (isDemoMode()) {
    const demoPlan = planner && planner.planStatus && compiled ? planner.planStatus(compiled, candidates) : compiled;
    return { planner, plan: demoPlan, compiled };
  }
  const active = planner && planner.readPracticePlan ? planner.readPracticePlan() : null;
  let plan = active && active.steps && active.steps.length ? active : compiled;
  if ((!active || !active.steps || active.steps.length === 0) && planner && planner.savePracticePlan && compiled && compiled.steps && compiled.steps.length) {
    plan = planner.savePracticePlan(compiled);
  }
  if (planner && planner.planStatus && plan) {
    plan = planner.planStatus(plan, candidates);
  }
  return { planner, plan, compiled };
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

function todayMetricHtml(label, value) {
  return `<span><strong>${escapeHtml(value)}</strong>${escapeHtml(label)}</span>`;
}

function todayFactHtml(fact) {
  const labels = [
    fact.kind || "",
    fact.signal || "",
    fact.sourceFingerprint || ""
  ].filter(Boolean);
  return `
    <span>
      <strong>${escapeHtml(fact.factId || fact.id || "fact")}</strong>
      ${escapeHtml(labels.join(" · "))}
    </span>
  `;
}

function todayStageStripHtml(activeKind) {
  const currentKind = ["repair", "continue", "review"].includes(activeKind) ? "active-plan" : activeKind;
  const stages = [
    { kind: "onboarding", label: "First visit", copy: "start here" },
    { kind: "active-plan", label: "In progress", copy: "current step" },
    { kind: "return", label: "Back from practice", copy: "result saved" },
    { kind: "memory-review", label: "Time to revisit", copy: "quick check" }
  ];
  return `
    <div class="today-stage-strip" aria-label="Practice progress">
      ${stages.map(stage => `
        <span class="${stage.kind === currentKind ? "active" : ""}">
          <strong>${escapeHtml(stage.label)}</strong>
          ${escapeHtml(stage.copy)}
        </span>
      `).join("")}
    </div>
  `;
}

function selectedMemoryFactsForStep(step) {
  const facts = step && step.trace && step.trace.inputs && step.trace.inputs.selectedMemoryFacts;
  return Array.isArray(facts) ? facts : [];
}

function friendlyPracticeFocus(signal) {
  const graph = window.PlataCompetencies;
  const competency = graph && graph.competencyForSignal
    ? graph.competencyForSignal({ tag: signal })
    : null;
  const labels = {
    "agency": "make the next step clear without sounding harsh",
    "register-control": "choose a tone that fits the situation",
    "stance-reading": "notice what small words do to the tone",
    "process-control": "make the process and next step clear",
    "consequence-awareness": "choose words that protect trust"
  };
  if (labels[signal]) return labels[signal];
  if (competency && labels[competency.id]) return labels[competency.id];
  const spec = masterySpec(signal);
  if (spec && spec.label) return String(spec.label).replace(/^Use\s+/i, "use ");
  return "work on one useful skill";
}

function friendlyCompanionMessage(companion, selectedFacts) {
  if (!companion) return "";
  const factKinds = selectedFacts.map(fact => fact && fact.kind).filter(Boolean);
  if (companion.kind === "repair" && factKinds.includes("root_competency_trap")) {
    return "This pattern showed up in more than one situation. A short focused scene will help you practise it without starting a whole new lesson.";
  }
  if (companion.kind === "repair" && factKinds.includes("recurring_trap")) {
    return "This has tripped you up more than once, so a short focused scene is more useful than adding new material.";
  }
  if (companion.kind === "repair") {
    return "A recent answer showed that this one small skill is worth practising before you move on.";
  }
  if (companion.kind === "maintain") {
    return "You already repaired this once. Keep moving and come back only if the same problem appears again.";
  }
  if (companion.kind === "continue") {
    return "Continue with one small practice block in the kind of situation that has worked for you before.";
  }
  return companion.message;
}

function todayReturnContext(plan) {
  if (!routeParam("ledger-return") || !plan || !Array.isArray(plan.steps)) return null;
  const returnedStepId = routeParam("step");
  const returnedStep = plan.steps.find(item => item.routeId === returnedStepId) || null;
  return { returnedStepId, returnedStep };
}

function resolveTodayProgramState(options) {
  options = options || {};
  const plan = options.plan || {};
  const step = options.step || null;
  const companion = options.companion || null;
  const advice = options.advice || null;
  const candidates = options.candidates || [];
  const visibleFacts = options.visibleFacts || [];
  const totalAttempts = candidates.reduce((sum, item) => sum + Number(item && item.stats && item.stats.total || 0), 0);
  const selectedFacts = selectedMemoryFactsForStep(step);
  const selectedSignalFact = selectedFacts.find(fact => fact && fact.signal);
  const selectedSignal = selectedSignalFact && selectedSignalFact.signal || "";
  const selectedReviewFact = selectedFacts.find(fact => fact.kind === "next_review_due" || fact.kind === "stale_skill") || null;
  const dueReviewFact = selectedReviewFact || visibleFacts.find(fact => fact.kind === "next_review_due") || visibleFacts.find(fact => fact.kind === "stale_skill") || null;
  const returnContext = todayReturnContext(plan);
  const base = {
    kind: companion && companion.kind || plan.kind || "continue",
    eyebrow: companion ? "Your suggestion" : plan.completed ? "Plan finished" : "Chosen for you",
    headline: companion && companion.kind === "repair" && selectedSignal
      ? `Practise how to ${friendlyPracticeFocus(selectedSignal)}`
      : companion && companion.headline || step && step.title || plan.title || "Your next practice",
    message: companion ? friendlyCompanionMessage(companion, selectedFacts) : step && step.copy || plan.copy || "Continue where you left off.",
    why: companion
      ? "Platå noticed this pattern in the practice saved in this browser."
      : "Platå chose this from the progress saved in this browser.",
    actionLabel: step ? (step.status === "active" ? "Continue" : companion ? "Try this practice" : step.primaryLabel || "Start") : "Review what you finished",
    routeMeta: step
      ? [`Step ${step.number} of ${plan.steps.length}`, step.trainerName || "Practice", step.minutes].filter(Boolean).join(" · ")
      : `${plan.steps.length} step${plan.steps.length === 1 ? "" : "s"} complete`,
    tags: []
  };

  if (returnContext) {
    const returned = returnContext.returnedStep;
    return Object.assign(base, {
      kind: "return",
      eyebrow: "Progress recorded",
      headline: step ? "Step recorded. Continue the route." : "Practice route updated.",
      message: returned
        ? `${returned.title || "The finished step"} is now in the saved practice record.`
        : "Your latest practice result is reflected in the saved route.",
      why: "You finished a step, so Platå can take you straight to the next one.",
      actionLabel: step ? "Continue" : "Review what you finished",
      routeMeta: step
        ? [`Returned from step ${returned && returned.number || "?"}`, `next step ${step.number} of ${plan.steps.length}`, step.trainerName || "Practice"].filter(Boolean).join(" · ")
        : `${plan.steps.length} tracked step${plan.steps.length === 1 ? "" : "s"} complete`,
      tags: ["Progress saved", "Next step ready"]
    });
  }

  if (dueReviewFact && (selectedReviewFact || base.kind === "review" || step && step.kind === "review")) {
    return Object.assign(base, {
      kind: "memory-review",
      eyebrow: "Quick review",
      headline: `Review ${dueReviewFact.signal || step && step.title || "a saved signal"}`,
      message: dueReviewFact.copy || "It has been a little while since you practised this.",
      why: "One of your saved skills is ready for a quick check before you add something new.",
      actionLabel: step ? "Review now" : base.actionLabel,
      routeMeta: [dueReviewFact.kind, dueReviewFact.signal, dueReviewFact.sourceFingerprint].filter(Boolean).join(" · "),
      tags: ["Ready to review", "Based on your progress"]
    });
  }

  if (step && step.status === "active") {
    return Object.assign(base, {
      kind: "active-plan",
      eyebrow: "Continue where you stopped",
      headline: `Resume ${step.title || "the current step"}`,
      message: step.copy || "This step is already in progress, so continuing it is more useful than starting a new route.",
      why: "You already started this step, so continuing it is more useful than opening something new.",
      actionLabel: "Continue",
      routeMeta: [`Started ${formatPlanDateTime(step.startedAt) || "earlier"}`, `Step ${step.number} of ${plan.steps.length}`, step.trainerName || "Practice"].filter(Boolean).join(" · "),
      tags: ["In progress", "Saved in this browser"]
    });
  }

  if (totalAttempts === 0 && visibleFacts.length === 0) {
    return Object.assign(base, {
      kind: "onboarding",
      eyebrow: "Start here",
      headline: "Your first real practice",
      message: "A short realistic situation. Feel the pressure, make choices, get one precise repair, and know exactly what to practise next.",
      why: "You have no saved practice yet, so Platå starts with a short, useful situation that shows how the whole method works.",
      actionLabel: step ? "Start your first session" : base.actionLabel,
      routeMeta: "No local history yet",
      tags: ["First session", "Saved in this browser"]
    });
  }

  return base;
}

function renderTodayProgram(candidates, context) {
  const container = $("#today-program");
  if (!container) return;
  const resolved = context || resolvePracticePlan(candidates);
  const planner = resolved.planner;
  const plan = resolved.plan;
  if (!planner || !plan || !plan.steps || plan.steps.length === 0) {
    container.innerHTML = '<p class="narrative">Try any lesson or drill and Platå will suggest what to do next.</p>';
    return;
  }

  const step = plan.completed ? null : (planner.actionablePracticePlanStep ? planner.actionablePracticePlanStep(plan) : plan.primaryStep);
  const actionHref = step ? (planner.planStepHref ? planner.planStepHref(plan, step) : step.primaryHref) : "";
  const receipt = advisorReceiptForPlan(plan);
  const companion = receipt && receipt.companion || null;
  const advice = receipt && receipt.advice || null;
  const memoryBundle = buildMemoryFacts(null, plan);
  const visibleFacts = memoryBundle.visibleFacts || [];
  const progress = plan.steps.length ? Math.min(100, Math.max(0, Math.round(((plan.completedCount || 0) / plan.steps.length) * 100))) : 0;
  const program = resolveTodayProgramState({ plan, step, companion, advice, candidates, visibleFacts });
  const citedFacts = companion && companion.citedFacts || [];
  const guardrailLabels = [
    companion ? "Study companion" : "Planner route",
    companion && companion.guardrails && companion.guardrails.externalAgentOptional ? "Hermes optional" : "",
    advice && advice.guardrails && advice.guardrails.requiresModel === false ? "No model call" : "",
    citedFacts.length ? "Cited memory" : "Local progress"
  ].concat(program.tags || []).filter(Boolean);

  const layer = headroom();
  const todayInterp = layer && layer.compressTodayProgram
    ? layer.compressTodayProgram({ program, step, actionHref, companion, visibleFacts, progress, guardrailLabels, citedFacts })
    : null;
  const todayHeadroomHtml = todayInterp ? headroomCard(todayInterp, { extraClass: "today-headroom" }) : "";
  const todayFactsHtml = `
    ${todayMetricHtml("due items", candidates.reduce(function (sum, entry) {
      const due = entry && entry.stats && typeof entry.stats.due === "number" ? entry.stats.due : 0;
      return sum + due;
    }, 0))}
    ${todayMetricHtml("program state", program.kind)}
    ${todayMetricHtml("visible memory facts", visibleFacts.length)}
    ${todayMetricHtml("open step", step ? step.number : "done")}
    ${todayMetricHtml("plan steps", plan.steps.length)}
    ${companion && companion.confidence ? todayMetricHtml("confidence", companion.confidence) : ""}
  `;
  const evidenceTagsHtml = Array.from(new Set(guardrailLabels)).map(label => `<span>${escapeHtml(label)}</span>`).join("")
    + (companion && companion.fingerprint ? `<span>${escapeHtml(companion.fingerprint)}</span>` : "");
  const citationsHtml = citedFacts.length
    ? `<div class="today-citations" aria-label="Cited companion memory">
        <span class="eyebrow">Cited memory</span>
        <div>${citedFacts.slice(0, 4).map(todayFactHtml).join("")}</div>
      </div>`
    : "";

  container.innerHTML = `
    <article class="today-program-card ${escapeHtml(program.kind)}">
      <div class="today-hero">
        <p class="eyebrow">${escapeHtml(program.eyebrow)}</p>
        <h3>${escapeHtml(program.headline)}</h3>
        <p class="today-message">${escapeHtml(program.message)}</p>
        ${step && actionHref ? `
          <div class="today-action">
            <a class="btn primary" href="${escapeHtml(actionHref)}">${escapeHtml(program.actionLabel)}</a>
          </div>
          <p class="today-outcome">${escapeHtml(program.why)}</p>
        ` : `<p class="today-outcome">${escapeHtml(program.why)}</p>`}
      </div>

      <details class="headroom-appendix today-evidence-appendix" style="margin: 0 1.5rem 1.5rem 1.5rem; border-top:1px solid var(--line); padding-top:1rem;">
        <summary style="cursor:pointer; font-size:0.85rem; color:var(--muted); font-weight:500;">Why this was suggested</summary>
        <div class="today-context" style="margin-top:1rem;">
          ${program.routeMeta ? `<p class="today-route-meta">${escapeHtml(program.routeMeta)}</p>` : ""}
          ${todayHeadroomHtml || ""}
          <div class="today-facts-panel">
            <span class="eyebrow">Session metrics</span>
            <div class="today-facts">${todayFactsHtml}</div>
            <div class="today-tags">${evidenceTagsHtml}</div>
          </div>
        </div>
        ${citationsHtml}
        ${todayStageStripHtml(program.kind)}
      </details>
    </article>
  `;
}

function guidedSessionForPlan(plan, planner) {
  const guided = window.PlataGuidedSession;
  if (!guided || !guided.buildSession) return null;
  const step = plan && !plan.completed && planner
    ? (planner.actionablePracticePlanStep ? planner.actionablePracticePlanStep(plan) : plan.primaryStep)
    : null;
  const receipt = advisorReceiptForPlan(plan);
  const memoryBundle = buildMemoryFacts(null, plan);
  const actionHref = step && planner
    ? (planner.planStepHref ? planner.planStepHref(plan, step) : step.primaryHref)
    : "";
  return guided.buildSession({
    plan,
    step,
    advisorReceipt: receipt || {},
    memoryFacts: memoryBundle.visibleFacts || [],
    actionHref,
    now: new Date().toISOString()
  });
}

function guidedSessionFactHtml(fact) {
  const labels = [
    fact.kind || "",
    fact.signal || "",
    fact.sourceFingerprint || ""
  ].filter(Boolean);
  return `
    <span>
      <strong>${escapeHtml(fact.factId || fact.id || "fact")}</strong>
      ${escapeHtml(labels.join(" · "))}
    </span>
  `;
}

function guidedSessionStepHtml(step, index) {
  return `
    <li class="guided-step ${escapeHtml(step.status || "pending")}">
      <span class="guided-step-number">${index + 1}</span>
      <div>
        <div class="guided-step-meta">
          <span>${escapeHtml(step.kind || "step")}</span>
          <span>${escapeHtml(step.status || "pending")}</span>
        </div>
        <h4>${escapeHtml(step.title)}</h4>
        <p>${escapeHtml(step.copy)}</p>
        ${step.action && step.action.href ? `<a href="${escapeHtml(step.action.href)}">${escapeHtml(step.action.label || "Open step")} →</a>` : ""}
      </div>
    </li>
  `;
}

function guidedOutcomeLedgerHtml(ledger) {
  const outcomes = ledger && Array.isArray(ledger.outcomes) ? ledger.outcomes.slice(0, 3) : [];
  if (!outcomes.length) return "";
  return `
    <div class="guided-outcome-ledger" aria-label="Guided session outcome history">
      <div class="guided-outcome-ledger-head">
        <p class="eyebrow">Outcome history</p>
        <span>${escapeHtml(outcomes.length)} recent</span>
      </div>
      <div class="guided-outcome-rows">
        ${outcomes.map(item => {
          const receipt = item.outcomeReceipt || {};
          const goal = item.goal || {};
          const evidence = item.completionEvidence || {};
          const facts = Array.isArray(receipt.citedFacts) ? receipt.citedFacts.slice(0, 2) : [];
          const meta = [
            formatPlanDateTime(item.completedAt),
            evidence.reason || "",
            item.stepRouteId || ""
          ].filter(Boolean).join(" · ");
          return `
            <article class="guided-outcome-row">
              <div>
                <span class="eyebrow">${escapeHtml(goal.kind || "session")} outcome</span>
                <h4>${escapeHtml(goal.title || receipt.title || "Completed step")}</h4>
                <p>${escapeHtml(receipt.summary || "A guided session step was recorded.")}</p>
                <div class="guided-session-tags">
                  ${goal.signal ? `<span><strong>Signal</strong>${escapeHtml(goal.signal)}</span>` : ""}
                  ${goal.rootCompetency ? `<span><strong>Root skill</strong>${escapeHtml(goal.rootCompetency)}</span>` : ""}
                  ${meta ? `<span><strong>Evidence</strong>${escapeHtml(meta)}</span>` : ""}
                  ${item.fingerprint ? `<span><strong>Receipt</strong>${escapeHtml(item.fingerprint)}</span>` : ""}
                </div>
              </div>
              ${facts.length ? `<div class="guided-outcome-row-facts">${facts.map(guidedSessionFactHtml).join("")}</div>` : ""}
            </article>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function guidedSessionPanelHtml(session, outcomeLedger, options) {
  options = options || {};
  const companionMode = Boolean(options.companionMode);
  if (!session) return '<p class="narrative">Start any trainer to build a guided session.</p>';
  const goal = session.goal || {};
  const route = session.route || {};
  const outcome = session.outcomeReceipt || {};
  const facts = Array.isArray(outcome.citedFacts) ? outcome.citedFacts.slice(0, 4) : [];
  const guardrails = [
    session.guardrails && session.guardrails.deterministic ? "Deterministic" : "",
    session.guardrails && session.guardrails.requiresModel === false ? "No model call" : "",
    session.guardrails && session.guardrails.usesOnlyCitedFacts ? "Cited facts only" : "",
    session.guardrails && session.guardrails.containsRawAnswerText === false ? "No raw answers" : ""
  ].filter(Boolean);
  const validation = session.validation || {};
  return `
    <article class="guided-session-card ${escapeHtml(session.status || "ready")} ${escapeHtml(goal.kind || "continue")}${companionMode ? " guided-session-companion" : ""}">
      <div class="guided-session-head">
        <div>
          <p class="eyebrow">${companionMode ? "Walkthrough" : "Guided session"}</p>
          <h3>${escapeHtml(goal.title || "Focused session")}</h3>
          <p>${escapeHtml(goal.reason || "The route comes from local practice evidence.")}</p>
          ${route.href ? (
            companionMode
              ? `<p class="guided-session-same-step">Same step as <strong>Today</strong> above — open it when you want the full walkthrough.</p>`
              : `
            <div class="guided-session-action">
              <a class="btn primary" href="${escapeHtml(route.href)}">${escapeHtml(route.label || "Start session")}</a>
              <span>${escapeHtml([route.trainerId, route.stepRouteId].filter(Boolean).join(" · "))}</span>
            </div>
          `
          ) : ""}
        </div>
        <details class="guided-session-receipt-appendix">
          <summary>Session trace</summary>
          <div class="guided-session-receipt">
            <span>${escapeHtml(session.fingerprint || "")}</span>
            <strong>${escapeHtml(session.status || "ready")}</strong>
            <small>${escapeHtml(goal.signal || "starter-route")}</small>
          </div>
        </details>
      </div>
      <ol class="guided-session-steps">
        ${(session.steps || []).map(guidedSessionStepHtml).join("")}
      </ol>
      <div class="guided-outcome">
        <div>
          <p class="eyebrow">Outcome receipt</p>
          <h4>${escapeHtml(outcome.title || "Expected outcome")}</h4>
          <p>${escapeHtml(outcome.summary || "")}</p>
          <div class="guided-session-tags">
            ${(outcome.trainedSignals || []).map(signal => `<span><strong>Signal</strong>${escapeHtml(signal)}</span>`).join("")}
            ${outcome.rootCompetency ? `<span><strong>Root skill</strong>${escapeHtml(outcome.rootCompetency)}</span>` : ""}
            ${guardrails.map(label => `<span><strong>Guardrail</strong>${escapeHtml(label)}</span>`).join("")}
            ${validation.status ? `<span><strong>Contract</strong>${escapeHtml(validation.status)}</span>` : ""}
          </div>
        </div>
        ${facts.length ? `
          <div class="guided-citations" aria-label="Guided session cited memory">
            <span class="eyebrow">Cited memory</span>
            <div>${facts.map(guidedSessionFactHtml).join("")}</div>
          </div>
        ` : ""}
      </div>
      ${guidedOutcomeLedgerHtml(outcomeLedger)}
    </article>
  `;
}

function renderGuidedSession(candidates, context) {
  const container = $("#guided-session-panel");
  if (!container) return;
  const resolved = context || resolvePracticePlan(candidates);
  const planner = resolved.planner;
  const plan = resolved.plan;
  const step = plan && !plan.completed && planner
    ? (planner.actionablePracticePlanStep ? planner.actionablePracticePlanStep(plan) : plan.primaryStep)
    : null;
  const todayActionHref = step && planner
    ? (planner.planStepHref ? planner.planStepHref(plan, step) : step.primaryHref)
    : "";
  const session = guidedSessionForPlan(plan, planner);
  const companionMode = Boolean(
    session && session.route && session.route.href && todayActionHref && session.route.href === todayActionHref
  );
  const outcomeLedger = window.PlataGuidedSession && window.PlataGuidedSession.readOutcomeLedger
    ? window.PlataGuidedSession.readOutcomeLedger()
    : null;
  container.innerHTML = guidedSessionPanelHtml(session, outcomeLedger, { companionMode });
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
    const layer = headroom();
    const trainerInterp = layer && layer.compressTrainerStats
      ? layer.compressTrainerStats({ trainer, stats: hasData ? stats : { total: 0 } })
      : null;
    const headroomHtml = trainerInterp ? headroomCard(trainerInterp, { extraClass: "trainer-headroom" }) : "";
    const statsHtml = hasData ? `
        <div class="stats-mini">
          <div><strong>${stats.total}</strong> attempts</div>
          <div><strong>${stats.due}</strong> due</div>
          <div><strong>${stats.accuracy !== null ? stats.accuracy + "%" : "—"}</strong> accuracy</div>
          <div><strong>${stats.mastered}/${stats.totalItems}</strong> mastered</div>
          <div><strong>${getStreakLabel(stats.currentStreak)}</strong> streak</div>
          <div class="last-session">Last: ${formatDate(stats.lastSessionDate)}</div>
        </div>
      ` : `
        <div class="stats-mini empty">No progress yet</div>
      `;
    card.innerHTML = `
      <span class="tag">${trainer.type === "lesson" ? "Lesson" : "Drill"}</span>
      <h3>${escapeHtml(trainer.name)}</h3>
      <p>${escapeHtml(trainer.description)}</p>
      ${headroomHtml}
      <details class="headroom-appendix trainer-stats-appendix">
        <summary>Trainer metrics</summary>
        ${statsHtml}
      </details>
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

function renderPracticePlan(candidates, context) {
  const container = $("#practice-plan");
  if (!container) return;
  container.innerHTML = "";
  const { planner, plan, compiled } = context || resolvePracticePlan(candidates);
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
      <div class="plan-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${planProgress}" aria-label="${planProgress}% complete">
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
    const layer = headroom();
    const dueInterp = layer && layer.compressDueDecision
      ? layer.compressDueDecision({ trainer, stats, decision })
      : null;
    const headroomHtml = dueInterp ? headroomCard(dueInterp, { extraClass: "due-headroom" }) : "";
    const technicalHtml = `
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
    `;
    const card = document.createElement("article");
    const decisionClass = String(decision.kind || "continue").replace(/[^a-z0-9-]/gi, "");
    card.className = `trainer-card due-card ${decisionClass}`;
    card.innerHTML = `
      <span class="tag due">${escapeHtml(decision.badge || "Practice now")}</span>
      <h3>${escapeHtml(decision.title || trainer.name)}</h3>
      <p>${escapeHtml(decision.copy || trainer.description)}</p>
      ${headroomHtml}
      <details class="headroom-appendix due-technical">
        <summary>Recommendation evidence</summary>
        <div class="due-reasons">${technicalHtml}</div>
      </details>
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
          <span>${escapeHtml(entry.trainer.name)}</span>
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
    const technicalHtml = `
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
        ${repair ? repairBlockHtml(repair) : ""}
        ${repair && repair.drillRepair ? repairBlockHtml(repair.drillRepair) : ""}
        ${repair && repair.vocabRepair ? repairBlockHtml(repair.vocabRepair) : ""}
    `;
    const layer = headroom();
    if (layer && layer.compressCompetency) {
      return headroomCard(layer.compressCompetency(item), {
        extraClass: "mastery-card competency-card",
        technicalHtml
      });
    }
    return `
      <article class="mastery-card competency-card">
        ${technicalHtml}
      </article>
    `;
  }).join("");
}

function renderMasteryList() {
  const container = $("#mastery-list");
  if (!container) return;

  const signals = aggregateMasterySignals().slice(0, 6);

  if (signals.length === 0) {
    container.innerHTML = '<p class="narrative">No repair pattern is active yet. When a lesson miss points to a concept, it will appear here with a source scene.</p>';
    return;
  }

  container.innerHTML = signals.map(signal => {
    const technicalHtml = `
        <div class="mastery-card-head">
          <span class="mastery-key">${escapeHtml(signal.tag)}</span>
          <span class="mastery-score">${Math.round(signal.score * 100)}% error rate</span>
        </div>
        <h3>${escapeHtml(signal.label)}</h3>
        <p>${escapeHtml(signal.evidence)}</p>
        <div class="mastery-meta">
          <span>${escapeHtml(missTryText(signal.wrong, signal.total))}</span>
          <span>${signal.trainers.map(t => `${escapeHtml(t.name)}`).join(" · ")}</span>
        </div>
        ${signal.remediations.length ? signal.remediations.slice(0, 3).map(repair => repairBlockHtml(repair)).join("") : ""}
    `;
    const layer = headroom();
    if (layer && layer.compressMasterySignal) {
      return headroomCard(layer.compressMasterySignal(signal), {
        extraClass: "mastery-card",
        technicalHtml
      });
    }
    return `<article class="mastery-card">${technicalHtml}</article>`;
  }).join("");
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
        <span class="weak-trainers">${w.trainers.map(t => `${escapeHtml(t.name)}`).join(" · ")}</span>
      </div>
      <div class="weak-stats">
        <span class="wrong">${escapeHtml(missTryText(w.wrong, w.total))}</span>
        <span class="score">${Math.round(w.score * 100)}% error rate</span>
      </div>
    </div>
  `).join("");
}

// Data tools
function profilePortabilitySnapshot(stateMap, practicePlan) {
  const all = stateMap || (isDemoMode() ? demoTrainerStates() : collectTrainerStates());
  let plan = practicePlan;
  if (plan === undefined) {
    plan = isDemoMode()
      ? (resolvePracticePlan(dashboardCandidates()).plan || null)
      : currentPracticePlan();
  }
  const memoryBundle = buildMemoryFacts(all, plan);
  const guided = window.PlataGuidedSession && window.PlataGuidedSession.readOutcomeLedger
    ? window.PlataGuidedSession.readOutcomeLedger()
    : null;
  const guidedOutcomes = guided && guided.totals
    ? guided.totals.outcomes
    : (guided && Array.isArray(guided.outcomes) ? guided.outcomes.length : 0);
  return {
    trainerCount: Object.keys(all).length,
    planSteps: plan && Array.isArray(plan.steps) ? plan.steps.length : 0,
    planPreserved: !!(plan && Array.isArray(plan.steps) && plan.steps.length),
    vaultFacts: memoryBundle.visibleFacts.length,
    memoryCorrections: memoryBundle.corrections.length,
    guidedOutcomes
  };
}

function summarizeExportPayload(payload) {
  payload = payload && typeof payload === "object" ? payload : {};
  const trainerCount = payload.trainers && typeof payload.trainers === "object"
    ? Object.keys(payload.trainers).length
    : 0;
  const plan = payload.practicePlan;
  const planSteps = plan && Array.isArray(plan.steps) ? plan.steps.length : 0;
  const vaultFacts = payload.memoryVault && typeof payload.memoryVault.factCount === "number"
    ? payload.memoryVault.factCount
    : (payload.memory && Array.isArray(payload.memory.facts) ? payload.memory.facts.length : 0);
  const guidedOutcomes = payload.guidedSessionOutcomes && payload.guidedSessionOutcomes.totals
    ? payload.guidedSessionOutcomes.totals.outcomes
    : (payload.guidedSessionOutcomes && Array.isArray(payload.guidedSessionOutcomes.outcomes)
      ? payload.guidedSessionOutcomes.outcomes.length
      : 0);
  return {
    operation: "export",
    trainerCount,
    planPreserved: planSteps > 0,
    planSteps,
    vaultFacts,
    memoryCorrections: payload.memory && Array.isArray(payload.memory.correctionRecords)
      ? payload.memory.correctionRecords.length
      : 0,
    guidedOutcomes,
    standaloneVault: payload.vaultType === "plata.memory-vault",
    exportedAt: payload.exportedAt || null
  };
}

function summarizeImportResult(result) {
  result = result && typeof result === "object" ? result : {};
  return {
    operation: "import",
    trainerCount: Number(result.imported || 0),
    skippedTrainers: Number(result.skipped || 0),
    planPreserved: !!result.restoredPlan,
    planSteps: Number(result.planSteps || 0),
    vaultFacts: Number(result.vaultFacts || 0),
    memoryCorrections: Number(result.memoryCorrections || 0),
    guidedOutcomes: Number(result.guidedOutcomes || 0),
    standaloneVault: !!result.standaloneVault
  };
}

function profilePortabilityInventoryHtml(snapshot) {
  snapshot = snapshot || profilePortabilitySnapshot();
  const planDetail = snapshot.planPreserved
    ? `${snapshot.planSteps} step(s) in current profile`
    : "none in current profile";
  return `
    <ul class="profile-portability-inventory narrative">
      <li><strong>Trainer states</strong> — progress, weak tags, and review timers for each lesson or drill you have started (${snapshot.trainerCount} trainer(s) now).</li>
      <li><strong>Practice plan</strong> — your active route, step status, and completion receipts (${planDetail}).</li>
      <li><strong>Memory vault summary</strong> — derived learner-memory facts and corrections only; raw answer text stays out of this dashboard view (${snapshot.vaultFacts} visible fact(s) now).</li>
      <li><strong>Guided outcomes</strong> — walkthrough completion receipts when present (${snapshot.guidedOutcomes} receipt(s) now).</li>
    </ul>
  `;
}

function profilePortabilityDiagnosticsHtml(summary) {
  if (!summary) {
    return '<p class="narrative">Run Export or Import above to see a diagnostic summary here.</p>';
  }
  const rows = [];
  if (summary.operation === "export") {
    rows.push(["Exported trainers", summary.trainerCount]);
    rows.push(["Plan steps in file", summary.planPreserved ? summary.planSteps : "not included"]);
    rows.push(["Memory vault facts", summary.vaultFacts]);
    rows.push(["Memory corrections", summary.memoryCorrections]);
    rows.push(["Guided outcomes", summary.guidedOutcomes]);
    if (summary.exportedAt) rows.push(["Exported at", formatPlanDateTime(summary.exportedAt) || summary.exportedAt]);
  } else {
    rows.push(["Imported trainers", summary.trainerCount]);
    if (summary.skippedTrainers) rows.push(["Skipped trainers", summary.skippedTrainers]);
    rows.push(["Plan preserved", summary.planPreserved ? `yes (${summary.planSteps} step(s))` : "no"]);
    rows.push(["Vault facts merged", summary.vaultFacts]);
    rows.push(["Memory corrections restored", summary.memoryCorrections]);
    rows.push(["Guided outcomes restored", summary.guidedOutcomes]);
    if (summary.standaloneVault) rows.push(["Import kind", "memory vault only"]);
  }
  const label = summary.operation === "export" ? "Last export" : "Last import";
  const errorNote = summary.error
    ? `<p class="narrative" style="color: var(--ember);">${escapeHtml(summary.error)}</p>`
    : "";
  return `
    <div class="profile-portability-result">
      <p class="eyebrow">${escapeHtml(label)}</p>
      <dl class="headroom-technical profile-portability-metrics">
        ${rows.map(([dt, dd]) => `<div><dt>${escapeHtml(dt)}</dt><dd>${escapeHtml(String(dd))}</dd></div>`).join("")}
      </dl>
      ${errorNote}
    </div>
  `;
}

function openProfilePortabilityDrawer() {
  const drawer = $("#profile-portability-drawer");
  if (drawer) drawer.open = true;
}

function renderProfilePortabilityDrawer(lastSummary) {
  const inventory = $("#profile-portability-inventory");
  const diagnostics = $("#profile-portability-diagnostics");
  const demoNote = $("#profile-portability-demo-note");
  if (!inventory || !diagnostics) return;

  inventory.innerHTML = profilePortabilityInventoryHtml(profilePortabilitySnapshot());
  diagnostics.innerHTML = profilePortabilityDiagnosticsHtml(lastSummary);

  if (demoNote) {
    if (isDemoMode()) {
      demoNote.hidden = false;
      demoNote.textContent = "Demo mode is read-only. You can export the sample JSON, but import stays disabled so your real browser progress is never overwritten.";
    } else {
      demoNote.hidden = true;
      demoNote.textContent = "";
    }
  }
}

function renderProfilePortabilityDiagnostics(summary) {
  const diagnostics = $("#profile-portability-diagnostics");
  if (!diagnostics) return;
  diagnostics.innerHTML = profilePortabilityDiagnosticsHtml(summary);
  openProfilePortabilityDrawer();
}

function profileImportAdapters() {
  const kernel = window.PlataKernel;
  const planner = window.PlataPlanner;
  const knownTrainerIds = new Set(trainers().map(trainer => trainer.id));
  const assertKnownTrainer = (trainerId) => {
    if (!knownTrainerIds.has(trainerId)) throw new Error(`Unknown trainer in backup: ${trainerId}`);
  };
  return {
    readTrainers: () => collectTrainerStates(),
    readPracticePlan: () => currentPracticePlan(),
    readMemoryDeletedIds: () => readDeletedMemoryFactIds(),
    readMemoryCorrections: () => readMemoryCorrections(),
    readMemoryVault: () => readStoredMemoryVault(),
    readGuidedOutcomes: () => (
      window.PlataGuidedSession && window.PlataGuidedSession.readOutcomeLedger
        ? window.PlataGuidedSession.readOutcomeLedger()
        : null
    ),
    replaceTrainer: (trainerId, state) => {
      assertKnownTrainer(trainerId);
      const handle = kernel.createTrainerState({ trainerId });
      const importedState = kernel.importState(state, trainerId);
      handle.replace(importedState);
    },
    clearTrainer: (trainerId) => {
      assertKnownTrainer(trainerId);
      const handle = kernel.createTrainerState({ trainerId });
      handle.fresh();
    },
    replaceTrainers: (map) => {
      const snapshot = map || {};
      knownTrainerIds.forEach((trainerId) => {
        const handle = kernel.createTrainerState({ trainerId });
        if (snapshot[trainerId]) handle.replace(kernel.importState(snapshot[trainerId], trainerId));
        else handle.fresh();
      });
    },
    writePracticePlan: (plan) => planner && planner.savePracticePlan ? planner.savePracticePlan(plan) : null,
    clearPracticePlan: () => planner && planner.clearPracticePlan && planner.clearPracticePlan(),
    writeMemoryDeletedIds: (ids) => writeDeletedMemoryFactIds(ids),
    writeMemoryCorrections: (records) => writeMemoryCorrections(records),
    writeMemoryVault: (vault) => writeStoredMemoryVault(vault),
    writeGuidedOutcomes: (ledger) => {
      if (window.PlataGuidedSession && window.PlataGuidedSession.saveOutcomeLedger) {
        window.PlataGuidedSession.saveOutcomeLedger(ledger || { updatedAt: new Date().toISOString(), outcomes: [] });
      }
    },
    mergeMemoryVault: (vaultPayload) => mergeImportedMemoryVault(vaultPayload, collectTrainerStates(), currentPracticePlan())
  };
}

function renderImportPreview(preview, requiresConfirm) {
  const statusEl = $("#import-status");
  if (!statusEl || !preview) return;
  const lines = (preview.summaryLines || []).map((line) => `• ${line}`).join("\n");
  statusEl.textContent = (requiresConfirm
    ? "Preview (confirm required):\n"
    : "Preview:\n") + lines + (requiresConfirm ? "\nClick Import again and confirm the clear." : "\nApply this import?");
  statusEl.style.color = requiresConfirm ? "var(--ember)" : "var(--ink)";
  statusEl.style.whiteSpace = "pre-wrap";
}

function exportAll() {
  const all = collectTrainerStates();
  const kernel = window.PlataKernel;
  const profileApi = window.PlataProfile;
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
  const guidedSessionOutcomes = window.PlataGuidedSession && window.PlataGuidedSession.readOutcomeLedger
    ? window.PlataGuidedSession.readOutcomeLedger()
    : null;
  const payload = profileApi && profileApi.buildProfileBackup
    ? profileApi.buildProfileBackup({
      demoProfile: isDemoMode() ? "learner" : null,
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
      hermesBrief,
      guidedSessionOutcomes
    }, { exportedAt })
    : {
      exportedAt,
      demoProfile: isDemoMode() ? "learner" : null,
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
      hermesBrief,
      guidedSessionOutcomes
    };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `plata-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  renderProfilePortabilityDiagnostics(summarizeExportPayload(payload));
}

let pendingImportPrepared = null;

function importAll() {
  if (isDemoMode()) {
    const statusEl = $("#import-status");
    if (statusEl) {
      statusEl.textContent = "Demo mode is read-only. Leave demo mode before importing a real profile.";
      statusEl.style.color = "var(--ember)";
    }
    return;
  }
  const profileApi = window.PlataProfile;
  if (!profileApi || !profileApi.prepareImport || !profileApi.commitImport) {
    $("#import-status").textContent = "Profile import module missing.";
    $("#import-status").style.color = "var(--ember)";
    return;
  }

  const input = $("#import-file");
  input.value = "";
  input.click();
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        let prepared = profileApi.prepareImport(e.target.result, { confirmClearNulls: false });
        if (!prepared.ok && !prepared.requiresConfirm) {
          pendingImportPrepared = null;
          $("#import-status").textContent = prepared.error || "Invalid import file";
          $("#import-status").style.color = "var(--ember)";
          renderProfilePortabilityDiagnostics({
            operation: "import",
            trainerCount: 0,
            skippedTrainers: 0,
            planPreserved: false,
            planSteps: 0,
            vaultFacts: 0,
            memoryCorrections: 0,
            guidedOutcomes: 0,
            standaloneVault: false,
            error: prepared.error
          });
          return;
        }

        renderImportPreview(prepared.preview, prepared.requiresConfirm);
        const previewLines = (prepared.preview && prepared.preview.summaryLines) || [];
        if (prepared.requiresConfirm) {
          const confirmed = window.confirm(
            previewLines.concat([
              "",
              "This backup sets one or more sections to null.",
              "Clear those sections and continue?"
            ]).join("\n")
          );
          if (!confirmed) {
            pendingImportPrepared = null;
            $("#import-status").textContent = "Import cancelled — local data unchanged.";
            $("#import-status").style.color = "var(--ink)";
            return;
          }
          prepared = profileApi.prepareImport(e.target.result, { confirmClearNulls: true });
          if (!prepared.ok) {
            $("#import-status").textContent = prepared.error || "Import confirmation failed";
            $("#import-status").style.color = "var(--ember)";
            return;
          }
        } else {
          const apply = window.confirm(previewLines.concat(["", "Apply this import?"]).join("\n"));
          if (!apply) {
            pendingImportPrepared = null;
            $("#import-status").textContent = "Import cancelled — local data unchanged.";
            $("#import-status").style.color = "var(--ink)";
            return;
          }
        }

        pendingImportPrepared = null;
        applyPreparedImport(prepared, prepared.requiresConfirm);
      } catch (err) {
        pendingImportPrepared = null;
        $("#import-status").textContent = "Invalid JSON: " + err.message;
        $("#import-status").style.color = "var(--ember)";
        renderProfilePortabilityDiagnostics({
          operation: "import",
          trainerCount: 0,
          skippedTrainers: 0,
          planPreserved: false,
          planSteps: 0,
          vaultFacts: 0,
          memoryCorrections: 0,
          guidedOutcomes: 0,
          standaloneVault: false,
          error: err.message
        });
      }
    };
    reader.readAsText(file);
  };
}

function applyPreparedImport(prepared, confirmClearNulls) {
  const statusEl = $("#import-status");
  const result = window.PlataProfile.commitImport(prepared, profileImportAdapters(), {
    confirmClearNulls: !!confirmClearNulls
  });
  if (!result.ok) {
    statusEl.textContent = result.error || "Import failed";
    statusEl.style.color = "var(--ember)";
    renderProfilePortabilityDiagnostics({
      operation: "import",
      trainerCount: 0,
      skippedTrainers: result.skipped || 0,
      planPreserved: false,
      planSteps: 0,
      vaultFacts: 0,
      memoryCorrections: 0,
      guidedOutcomes: 0,
      standaloneVault: false,
      error: result.error
    });
    return;
  }
  const planText = result.restoredPlan ? ", restored active plan" : "";
  const vaultText = result.vaultFacts ? `, merged memory vault (${result.vaultFacts} fact(s))` : "";
  statusEl.style.whiteSpace = "normal";
  statusEl.textContent = result.standaloneVault && result.vaultFacts
    ? `Merged memory vault (${result.vaultFacts} fact(s)). Refresh to see changes.`
    : `Imported ${result.imported} trainer state(s)${result.skipped ? `, skipped ${result.skipped}` : ""}${planText}${vaultText}. Refresh to see changes.`;
  statusEl.style.color = "var(--green)";
  renderProfilePortabilityDiagnostics(summarizeImportResult(result));
  setTimeout(() => { statusEl.textContent = ""; }, 5000);
}

function renderDemoProfileBanner() {
  const banner = $("#demo-profile");
  const exportButton = $("#export-all");
  const importButton = $("#import-trigger");
  if (!isDemoMode()) {
    if (banner) {
      banner.hidden = true;
      banner.innerHTML = "";
    }
    if (exportButton) exportButton.textContent = "Export profile JSON";
    if (importButton) {
      importButton.disabled = false;
      importButton.removeAttribute?.("aria-disabled");
      importButton.textContent = "Import profile JSON";
    }
    return;
  }

  if (banner) {
    banner.hidden = false;
    banner.innerHTML = `
      <div>
        <p class="eyebrow">Example learner</p>
        <h2>See what Platå notices after a few sessions</h2>
        <p>This is a made-up B2 learner with a few realistic strengths and trouble spots. Explore the suggestion below without changing your own progress.</p>
      </div>
      <div class="demo-profile-actions">
        <a class="btn primary" href="./lessons/lesson-b2-radiator/?mode=repair&signal=understatement-with-agency#workplace-understatement">Try the suggested practice</a>
        <a class="btn" href="./dashboard.html">Show my own progress</a>
      </div>
    `;
  }
  if (exportButton) exportButton.textContent = "Export demo JSON";
  if (importButton) {
    importButton.disabled = true;
    importButton.setAttribute?.("aria-disabled", "true");
    importButton.textContent = "Import disabled in demo";
  }
}

function renderLearnerHeadroom(candidates, planContext) {
  const container = $("#learner-headroom");
  const layer = headroom();
  if (!container || !layer || !layer.compressDashboardSnapshot || !layer.renderBar) return;

  const resolved = planContext || resolvePracticePlan(candidates);
  const plan = resolved.plan;
  const planner = resolved.planner;
  const step = plan && !plan.completed && planner
    ? (planner.actionablePracticePlanStep ? planner.actionablePracticePlanStep(plan) : plan.primaryStep)
    : null;
  const actionHref = step && planner
    ? (planner.planStepHref ? planner.planStepHref(plan, step) : step.primaryHref)
    : "";
  const receipt = advisorReceiptForPlan(plan);
  const companion = receipt && receipt.companion || null;
  const memoryBundle = buildMemoryFacts(null, plan);
  const visibleFacts = memoryBundle.visibleFacts || [];
  const progress = plan && plan.steps && plan.steps.length
    ? Math.min(100, Math.max(0, Math.round(((plan.completedCount || 0) / plan.steps.length) * 100)))
    : 0;
  const program = plan ? resolveTodayProgramState({ plan, step, companion, advice: receipt && receipt.advice, candidates, visibleFacts }) : null;
  const todayInterp = program && layer.compressTodayProgram
    ? layer.compressTodayProgram({ program, step, actionHref, companion, visibleFacts, progress })
    : null;
  const topSignal = aggregateMasterySignals()[0] || null;
  const totalAttempts = candidates.reduce((sum, item) => sum + Number(item && item.stats && item.stats.total || 0), 0);
  const snapshot = layer.compressDashboardSnapshot({
    today: todayInterp,
    topSignal,
    totalAttempts
  });

  if (!totalAttempts && !topSignal && (!plan || !plan.steps || plan.steps.length === 0)) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  container.hidden = false;
  container.innerHTML = layer.renderBar(snapshot);
}

function renderDashboard() {
  masteryCatalogCache = null;
  const candidates = dashboardCandidates();
  const planContext = resolvePracticePlan(candidates);
  const dueSection = $("#due");
  if (dueSection) {
    dueSection.hidden = !isDemoMode() && planContext.plan && planContext.plan.kind === "start";
  }
  renderDemoProfileBanner();
  renderTrainerCards();
  renderTodayProgram(candidates, planContext);
  renderGuidedSession(candidates, planContext);
  renderPracticePlan(candidates, planContext);
  renderDueCards(candidates);
  renderEvidenceLedger();
  renderMemoryFacts();
  renderCompetencyList();
  renderMasteryList();
  renderWeakList();
  renderProfilePortabilityDrawer();
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

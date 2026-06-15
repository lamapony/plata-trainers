#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const {
  buildReplayDebugReport,
  createReplayContext
} = require("./debug-profile-replay.js");

const repoRoot = path.resolve(__dirname, "..");
const fixedNow = "2026-06-08T09:00:00.000Z";
const dashboardSources = [
  "shared/plata-kernel.js",
  "shared/plata-catalog.js",
  "lessons/lesson-01/data.js",
  "lessons/lesson-b2-radiator/data.js",
  "lessons/lesson-b2-job-followup/data.js",
  "lessons/lesson-b2-ordstilling/data.js",
  "shared/plata-competencies.js",
  "shared/plata-planner.js",
  "shared/plata-evidence.js",
  "shared/plata-events.js",
  "shared/plata-memory.js",
  "shared/plata-learner-model.js",
  "shared/plata-memory-vault.js",
  "shared/plata-memory-brief.js",
  "shared/plata-agent-handoff.js",
  "shared/plata-advisor.js",
  "shared/plata-companion.js",
  "shared/plata-guided-session.js",
  "dashboard.js"
];

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function sourceRoot(options) {
  if (typeof options === "string") return path.resolve(options);
  return path.resolve(options && options.root || repoRoot);
}

function displayRel(file, root = repoRoot) {
  const absolute = path.resolve(file);
  const workspaceRel = path.relative(repoRoot, absolute);
  if (!workspaceRel.startsWith("..") && !path.isAbsolute(workspaceRel)) return workspaceRel.replaceAll(path.sep, "/");
  return path.relative(root, absolute).replaceAll(path.sep, "/");
}

function readText(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stableJson(value) {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function stableHash(value) {
  const text = String(value || "");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function fixedDateConstructor() {
  const RealDate = Date;
  function FixedDate(...args) {
    if (!(this instanceof FixedDate)) {
      return (args.length ? new RealDate(...args) : new RealDate(fixedNow)).toString();
    }
    return args.length ? new RealDate(...args) : new RealDate(fixedNow);
  }
  Object.setPrototypeOf(FixedDate, RealDate);
  FixedDate.prototype = RealDate.prototype;
  FixedDate.now = () => new RealDate(fixedNow).getTime();
  FixedDate.parse = RealDate.parse;
  FixedDate.UTC = RealDate.UTC;
  return FixedDate;
}

function makeElement(tagName) {
  return {
    tagName,
    className: "",
    href: "",
    innerHTML: "",
    textContent: "",
    download: "",
    hidden: false,
    disabled: false,
    style: {},
    attributes: {},
    children: [],
    files: [],
    onchange: null,
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    addEventListener() {},
    click() {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    }
  };
}

function makeDashboardContext() {
  const storage = {};
  const elements = {
    "#trainer-cards": makeElement("div"),
    "#demo-profile": makeElement("section"),
    "#today-program": makeElement("div"),
    "#guided-session-panel": makeElement("div"),
    "#due-cards": makeElement("div"),
    "#practice-plan": makeElement("div"),
    "#evidence-ledger": makeElement("div"),
    "#memory-facts": makeElement("div"),
    "#competency-list": makeElement("div"),
    "#mastery-list": makeElement("div"),
    "#weak-list": makeElement("div"),
    "#export-all": makeElement("button"),
    "#import-trigger": makeElement("button"),
    "#import-file": makeElement("input"),
    "#import-status": makeElement("p")
  };
  const context = {
    console: { log() {}, info() {}, warn() {}, error() {} },
    Date: fixedDateConstructor(),
    JSON,
    Object,
    Math,
    Number,
    String,
    Array,
    Map,
    Set,
    encodeURIComponent,
    decodeURIComponent,
    location: { search: "", hash: "#due" },
    URL: {
      createObjectURL(blob) {
        context.__lastBlob = blob;
        return "blob:profile-portability";
      },
      revokeObjectURL() {}
    },
    Blob: function Blob(parts, blobOptions) {
      this.parts = parts || [];
      this.options = blobOptions || {};
      context.__lastBlob = this;
    },
    FileReader: function FileReader() {
      this.onload = null;
      this.result = "";
      this.readAsText = file => {
        this.result = file ? (file.content || file.text || file.result || "") : "";
        if (typeof this.onload === "function") this.onload({ target: { result: this.result } });
      };
    },
    document: {
      readyState: "complete",
      head: makeElement("head"),
      querySelector(selector) {
        return elements[selector] || null;
      },
      querySelectorAll() {
        return [];
      },
      createElement(tagName) {
        return makeElement(tagName);
      },
      addEventListener() {}
    },
    localStorage: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
      },
      setItem(key, value) {
        storage[key] = String(value);
      },
      removeItem(key) {
        delete storage[key];
      },
      key(index) {
        return Object.keys(storage)[index] || null;
      },
      get length() {
        return Object.keys(storage).length;
      }
    },
    setTimeout(fn) {
      if (typeof fn === "function") fn();
      return 1;
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  return { context, elements, storage };
}

function runSource(env, root, relPath) {
  vm.runInContext(readText(root, relPath), env.context, { filename: relPath });
}

function seedPortableLearner(env) {
  const kernel = env.context.PlataKernel;
  const state = kernel.freshState("lesson-b2-radiator-register");
  kernel.recordAttempt(state, {
    itemId: "official-reply-passive",
    correct: false,
    tags: ["B2", "lesson", "passive-agency"],
    mode: "lesson",
    expected: "portable secret expected",
    given: "portable secret given"
  });
  kernel.recordAttempt(state, {
    itemId: "official-reply-passive",
    correct: true,
    tags: ["B2", "repair", "passive-agency"],
    mode: "repair",
    expected: "portable secret expected",
    given: "portable secret expected"
  });
  kernel.recordRepairClosure(state, {
    signal: "passive-agency",
    itemId: "official-reply-passive",
    sceneId: "official-reply-passive",
    lessonId: "lesson-b2-radiator-register",
    label: "Read passive agency",
    action: "Name the missing actor",
    correct: true
  });
  kernel.recordAttempt(state, {
    itemId: "workplace-understatement",
    correct: false,
    tags: ["B2", "lesson", "understatement-with-agency"],
    mode: "lesson",
    expected: "another portable secret expected",
    given: "another portable secret given"
  });
  kernel.recordAttempt(state, {
    itemId: "channel-transfer-lab",
    correct: true,
    tags: ["B2", "lesson", "formal-register-control", "passive-agency", "consequence-aware-tone", "register-transfer"],
    mode: "lesson",
    expected: "flagship channel-transfer reason",
    given: "flagship channel-transfer reason"
  });
  env.storage[kernel.stateKey("lesson-b2-radiator-register")] = JSON.stringify(state);
}

function loadDashboardRuntime(root, options = {}) {
  const env = makeDashboardContext();
  runSource(env, root, "shared/plata-kernel.js");
  if (options.seed) options.seed(env);
  dashboardSources.filter(relPath => relPath !== "shared/plata-kernel.js").forEach(relPath => {
    if (!fs.existsSync(path.join(root, relPath))) return;
    runSource(env, root, relPath);
  });
  return env;
}

function invoke(env, expression) {
  return vm.runInContext(expression, env.context, { filename: "profile-portability.vm.js" });
}

function parseLastExport(env) {
  const blob = env.context.__lastBlob;
  if (!blob || !Array.isArray(blob.parts)) throw new Error("dashboard export did not create a JSON blob");
  return JSON.parse(blob.parts.map(part => String(part)).join(""));
}

function exportProfile(env) {
  invoke(env, "exportAll()");
  return parseLastExport(env);
}

function importProfile(env, payload) {
  invoke(env, "importAll()");
  env.elements["#import-file"].files = [{ content: JSON.stringify(payload) }];
  if (typeof env.elements["#import-file"].onchange !== "function") throw new Error("dashboard import did not register an onchange handler");
  env.elements["#import-file"].onchange();
  invoke(env, "renderDashboard()");
}

function firstVisibleMemoryFact(env) {
  const bundle = invoke(env, "buildMemoryFacts()");
  return (bundle.visibleFacts || bundle.facts || []).find(fact => fact && fact.id) || null;
}

function completeFirstPlanStep(env) {
  const planner = env.context.PlataPlanner;
  const guided = env.context.PlataGuidedSession;
  const plan = planner.readPracticePlan();
  if (!plan || !Array.isArray(plan.steps) || !plan.steps.length) throw new Error("dashboard did not create a practice plan");
  const step = plan.steps[0];
  step.startedAt = "2026-06-08T08:00:00.000Z";
  step.completedAt = "2026-06-08T08:08:00.000Z";
  step.completionEvidence = {
    reason: "profile-portability-proof",
    trainerId: step.trainerId,
    correct: true
  };
  planner.savePracticePlan(plan);
  guided.recordOutcome({
    plan,
    step,
    evidence: step.completionEvidence,
    completedAt: step.completedAt,
    recordedAt: step.completedAt,
    source: "profile-portability-report"
  });
  invoke(env, "renderDashboard()");
  return planner.readPracticePlan();
}

function buildSourceProfile(root) {
  const env = loadDashboardRuntime(root, { seed: seedPortableLearner });
  const completedPlan = completeFirstPlanStep(env);
  const correctedFact = firstVisibleMemoryFact(env);
  if (correctedFact) invoke(env, `correctMemoryFact(${JSON.stringify(correctedFact.id)})`);
  const payload = exportProfile(env);
  return { env, completedPlan, correctedFact, payload };
}

function compactPayload(payload) {
  const trainers = payload && payload.trainers && typeof payload.trainers === "object" ? payload.trainers : {};
  const flagshipAttempts = [];
  const trainerRows = Object.keys(trainers).sort().map(trainerId => {
    const state = trainers[trainerId] || {};
    const meta = state.meta || {};
    (Array.isArray(state.attempts) ? state.attempts : []).forEach(attempt => {
      if (attempt && attempt.itemId === "channel-transfer-lab") {
        flagshipAttempts.push({
          trainerId,
          itemId: attempt.itemId,
          correct: attempt.correct === true,
          mode: attempt.mode || "",
          tags: Array.isArray(attempt.tags) ? attempt.tags.slice().sort() : []
        });
      }
    });
    return {
      trainerId,
      attempts: Number(meta.totalAttempts || 0),
      correct: Number(meta.totalCorrect || 0),
      weakTags: Object.keys(state.weakTags || {}).sort()
    };
  });
  const outcomeLedger = payload.guidedSessionOutcomes || {};
  const outcomes = Array.isArray(outcomeLedger.outcomes) ? outcomeLedger.outcomes : [];
  return {
    profileSchemaVersion: payload.profileSchemaVersion || null,
    exportedAt: payload.exportedAt || "",
    trainerCount: trainerRows.length,
    trainers: trainerRows,
    practicePlan: payload.practicePlan ? {
      planToken: payload.practicePlan.planToken || "",
      kind: payload.practicePlan.kind || "",
      stepCount: Array.isArray(payload.practicePlan.steps) ? payload.practicePlan.steps.length : 0,
      completedSteps: (payload.practicePlan.steps || []).filter(step => step.completedAt).length,
      firstStepRouteId: payload.practicePlan.steps && payload.practicePlan.steps[0] && payload.practicePlan.steps[0].routeId || ""
    } : null,
    eventLog: payload.eventLog ? {
      fingerprint: payload.eventLog.fingerprint || "",
      events: Array.isArray(payload.eventLog.events) ? payload.eventLog.events.length : 0,
      replayEvents: payload.eventLog.replay && payload.eventLog.replay.eventCount || 0
    } : null,
    memory: payload.memory ? {
      fingerprint: payload.memory.fingerprint || "",
      visibleFacts: Array.isArray(payload.memory.facts) ? payload.memory.facts.length : 0,
      corrections: Array.isArray(payload.memory.correctionRecords) ? payload.memory.correctionRecords.length : 0
    } : null,
    memoryVault: payload.memoryVault ? {
      fingerprint: payload.memoryVault.fingerprint || "",
      factCount: Array.isArray(payload.memoryVault.facts) ? payload.memoryVault.facts.length : 0,
      derivedFactsOnly: Boolean(payload.memoryVault.privacy && payload.memoryVault.privacy.derivedFactsOnly)
    } : null,
    learnerModel: payload.learnerModel ? {
      fingerprint: payload.learnerModel.fingerprint || "",
      focusKind: payload.learnerModel.recommendedFocus && payload.learnerModel.recommendedFocus.kind || ""
    } : null,
    companion: payload.companion ? {
      fingerprint: payload.companion.fingerprint || "",
      citedFacts: Array.isArray(payload.companion.citedFacts) ? payload.companion.citedFacts.length : 0
    } : null,
    hermesBrief: payload.hermesBrief ? {
      fingerprint: payload.hermesBrief.fingerprint || "",
      readOnlyBridge: Boolean(payload.hermesBrief.guardrails && payload.hermesBrief.guardrails.readOnlyBridge)
    } : null,
    guidedSessionOutcomes: {
      ledgerType: outcomeLedger.ledgerType || "",
      outcomes: outcomes.length,
      firstFingerprint: outcomes[0] && outcomes[0].fingerprint || ""
    },
    flagshipExerciseOutcome: {
      lessonId: "lesson-b2-radiator-register",
      sceneId: "channel-transfer-lab",
      attempts: flagshipAttempts.length,
      correct: flagshipAttempts.filter(attempt => attempt.correct).length,
      memorySignal: "passive-agency",
      proofReport: "reports/exercise-value.json",
      attemptsSummary: flagshipAttempts
    }
  };
}

function derivedPayloadForPrivacy(payload) {
  return {
    eventLog: payload.eventLog,
    memory: payload.memory,
    learnerModel: payload.learnerModel,
    memoryVault: payload.memoryVault,
    memoryBrief: payload.memoryBrief,
    agentHandoff: payload.agentHandoff,
    companion: payload.companion,
    hermesBrief: payload.hermesBrief,
    guidedSessionOutcomes: payload.guidedSessionOutcomes
  };
}

function forbiddenLeaks() {
  return [
    "portable secret expected",
    "portable secret given",
    "another portable secret expected",
    "another portable secret given",
    "should not leak"
  ];
}

function assertNoLeaks(label, value, issues) {
  const text = JSON.stringify(value || {});
  forbiddenLeaks().forEach(secret => {
    if (text.includes(secret)) issues.push(`${label} leaked raw learner text: ${secret}`);
  });
}

function stage(id, title, assertions, evidence = {}) {
  const issues = assertions.filter(item => !item.pass).map(item => item.issue);
  return {
    id,
    title,
    status: issues.length ? "fail" : "pass",
    assertions,
    evidence,
    issues
  };
}

function replaySummary(report) {
  return {
    source: report.source,
    fingerprint: report.fingerprint,
    eventCount: report.eventCount,
    warnings: report.warnings,
    trainers: report.trainers.map(trainer => ({
      trainerId: trainer.trainerId,
      attempts: trainer.attempts,
      correct: trainer.correct,
      openSignals: trainer.openSignals.map(signal => signal.tag),
      closedSignals: trainer.closedSignals.map(signal => signal.tag)
    })),
    plans: report.plans.map(plan => ({
      planToken: plan.planToken,
      stepCount: plan.stepCount,
      completedSteps: plan.completedSteps,
      openSteps: plan.openSteps
    })),
    memory: report.memory
  };
}

function buildProfilePortabilityReport(options = {}) {
  const root = sourceRoot(options);
  const source = buildSourceProfile(root);
  const sourcePayload = clone(source.payload);
  if (typeof options.payloadMutator === "function") options.payloadMutator(sourcePayload);
  const sourceSummary = compactPayload(sourcePayload);
  const replay = buildReplayDebugReport(sourcePayload, { context: createReplayContext() });
  const importEnv = loadDashboardRuntime(root);
  importProfile(importEnv, sourcePayload);
  const importedPlan = importEnv.context.PlataPlanner.readPracticePlan();
  const importedPayload = exportProfile(importEnv);
  const importedSummary = compactPayload(importedPayload);
  const importedReplay = buildReplayDebugReport(importedPayload, { context: createReplayContext() });
  const sourcePlan = sourcePayload.practicePlan || {};
  const sourceOutcomes = sourcePayload.guidedSessionOutcomes && sourcePayload.guidedSessionOutcomes.outcomes || [];
  const importedOutcomes = importedPayload.guidedSessionOutcomes && importedPayload.guidedSessionOutcomes.outcomes || [];
  const correctedFactId = source.correctedFact && source.correctedFact.id || "";
  const importedMemoryHtml = importEnv.elements["#memory-facts"].innerHTML;
  const importedGuidedHtml = importEnv.elements["#guided-session-panel"].innerHTML;
  const correctionIndex = importedMemoryHtml.indexOf("Corrected assumptions");
  const correctionAuditText = correctionIndex === -1
    ? ""
    : stripHtml(importedMemoryHtml.slice(Math.max(0, correctionIndex - 80)));
  const outcomeIndex = importedGuidedHtml.indexOf("Outcome history");
  const outcomeHistoryText = outcomeIndex === -1
    ? ""
    : stripHtml(importedGuidedHtml.slice(Math.max(0, outcomeIndex - 80)));
  const privacyIssues = [];
  assertNoLeaks("source derived payload", derivedPayloadForPrivacy(sourcePayload), privacyIssues);
  assertNoLeaks("source replay report", replay, privacyIssues);
  assertNoLeaks("imported derived payload", derivedPayloadForPrivacy(importedPayload), privacyIssues);
  assertNoLeaks("imported replay report", importedReplay, privacyIssues);

  const stages = [
    stage("source-profile", "Create a real local learner profile", [
      { key: "has-trainer-state", pass: sourceSummary.trainerCount >= 1 && sourceSummary.trainers.some(row => row.attempts >= 3), issue: "source profile does not contain a real trainer attempt history" },
      { key: "has-practice-plan", pass: Boolean(sourceSummary.practicePlan && sourceSummary.practicePlan.planToken && sourceSummary.practicePlan.stepCount >= 1), issue: "source profile does not contain a practice plan" },
      { key: "has-completed-step", pass: Boolean(sourceSummary.practicePlan && sourceSummary.practicePlan.completedSteps >= 1), issue: "source practice plan does not contain completed execution evidence" },
      { key: "has-corrected-memory", pass: Boolean(correctedFactId && sourceSummary.memory && sourceSummary.memory.corrections >= 1), issue: "source profile does not contain a learner memory correction" },
      { key: "has-guided-outcome", pass: Boolean(sourceSummary.guidedSessionOutcomes.outcomes >= 1 && sourceSummary.guidedSessionOutcomes.firstFingerprint.startsWith("gdo-")), issue: "source profile does not contain a guided outcome receipt" },
      { key: "has-flagship-exercise-outcome", pass: Boolean(sourceSummary.flagshipExerciseOutcome.correct >= 1), issue: "source profile does not contain a flagship exercise outcome" }
    ], {
      payload: sourceSummary,
      correctedFactId
    }),
    stage("export-payload", "Export the local profile as a portable backup", [
      { key: "schema-version", pass: sourceSummary.profileSchemaVersion === 1, issue: "export payload profile schema version drifted" },
      { key: "event-log-present", pass: Boolean(sourceSummary.eventLog && sourceSummary.eventLog.fingerprint && sourceSummary.eventLog.events > 0), issue: "export payload lost the event log" },
      { key: "memory-present", pass: Boolean(sourceSummary.memory && sourceSummary.memory.fingerprint && sourceSummary.memory.visibleFacts > 0), issue: "export payload lost memory facts" },
      { key: "model-present", pass: Boolean(sourceSummary.learnerModel && sourceSummary.learnerModel.fingerprint), issue: "export payload lost learner model" },
      { key: "vault-derived", pass: Boolean(sourceSummary.memoryVault && sourceSummary.memoryVault.derivedFactsOnly), issue: "export payload memory vault is not derived-facts-only" },
      { key: "companion-present", pass: Boolean(sourceSummary.companion && sourceSummary.companion.fingerprint && sourceSummary.companion.citedFacts > 0), issue: "export payload lost the cited companion card" },
      { key: "hermes-readonly", pass: Boolean(sourceSummary.hermesBrief && sourceSummary.hermesBrief.readOnlyBridge), issue: "export payload Hermes bridge is not read-only" },
      { key: "derived-privacy", pass: privacyIssues.length === 0, issue: privacyIssues.join("; ") || "derived payload privacy drifted" }
    ], {
      payload: sourceSummary
    }),
    stage("replay-debug", "Replay the exported profile deterministically", [
      { key: "uses-exported-log", pass: replay.source === "exported-event-log", issue: "replay did not use the exported event log" },
      { key: "no-warnings", pass: replay.warnings.length === 0, issue: `replay emitted warnings: ${replay.warnings.join("; ")}` },
      { key: "event-count", pass: sourceSummary.eventLog && replay.eventCount === sourceSummary.eventLog.events, issue: "replay event count does not match exported event log" },
      { key: "plan-completion", pass: replay.plans.some(plan => plan.planToken === sourcePlan.planToken && plan.completedSteps >= 1), issue: "replay did not preserve completed practice-plan facts" },
      { key: "memory-corrections", pass: replay.memory.correctedFactCount >= 1, issue: "replay did not preserve memory correction facts" }
    ], {
      replay: replaySummary(replay)
    }),
    stage("import-profile", "Import the backup into a clean dashboard runtime", [
      { key: "plan-token", pass: Boolean(importedPlan && importedPlan.planToken === sourcePlan.planToken), issue: "imported practice plan token drifted" },
      { key: "plan-completed-at", pass: Boolean(importedPlan && importedPlan.steps && importedPlan.steps[0] && importedPlan.steps[0].completedAt === sourcePlan.steps[0].completedAt), issue: "imported practice plan execution ledger drifted" },
      { key: "memory-correction-rendered", pass: /Corrected assumptions/.test(importedMemoryHtml) && (!correctedFactId || importedMemoryHtml.includes(correctedFactId)), issue: "imported dashboard did not render memory correction audit trail" },
      { key: "guided-outcome-rendered", pass: /Outcome history/.test(importedGuidedHtml) && /gdo-/.test(importedGuidedHtml), issue: "imported dashboard did not render guided outcome history" },
      { key: "outcome-fingerprint", pass: Boolean(sourceOutcomes[0] && importedOutcomes[0] && sourceOutcomes[0].fingerprint === importedOutcomes[0].fingerprint), issue: "imported guided outcome fingerprint drifted" },
      { key: "flagship-outcome-imported", pass: Boolean(importedSummary.flagshipExerciseOutcome.correct === sourceSummary.flagshipExerciseOutcome.correct && importedSummary.flagshipExerciseOutcome.correct >= 1), issue: "imported profile did not preserve flagship exercise outcome" }
    ], {
      rendered: {
        memory: stripHtml(importedMemoryHtml).slice(0, 420),
        correctionAudit: correctionAuditText.slice(0, 520),
        guidedSession: stripHtml(importedGuidedHtml).slice(0, 420),
        outcomeHistory: outcomeHistoryText.slice(0, 520)
      },
      imported: importedSummary
    }),
    stage("post-import-replay", "Replay the imported profile again", [
      { key: "fingerprint-stable", pass: importedReplay.fingerprint === replay.fingerprint, issue: "imported replay fingerprint drifted from source replay" },
      { key: "event-count-stable", pass: importedReplay.eventCount === replay.eventCount, issue: "imported replay event count drifted" },
      { key: "plan-stable", pass: importedReplay.plans.some(plan => plan.planToken === sourcePlan.planToken && plan.completedSteps >= 1), issue: "imported replay did not preserve completed plan" },
      { key: "memory-correction-stable", pass: importedReplay.memory.correctedFactCount === replay.memory.correctedFactCount, issue: "imported replay memory correction count drifted" },
      { key: "outcomes-stable", pass: importedSummary.guidedSessionOutcomes.firstFingerprint === sourceSummary.guidedSessionOutcomes.firstFingerprint, issue: "imported profile export did not preserve guided outcome receipt" },
      { key: "flagship-outcome-stable", pass: importedSummary.flagshipExerciseOutcome.correct === sourceSummary.flagshipExerciseOutcome.correct, issue: "imported profile export did not preserve flagship exercise outcome" }
    ], {
      replay: replaySummary(importedReplay)
    })
  ];

  const issues = stages.flatMap(item => item.issues.map(issue => `${item.id}: ${issue}`));
  const traceSource = stages.map(item => ({
    id: item.id,
    status: item.status,
    evidence: item.evidence
  }));

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    fixedNow,
    status: issues.length ? "fail" : "pass",
    traceId: `profileport-${stableHash(stableJson(traceSource))}`,
    totals: {
      stages: stages.length,
      passedStages: stages.filter(item => item.status === "pass").length,
      trainerCount: sourceSummary.trainerCount,
      eventCount: sourceSummary.eventLog && sourceSummary.eventLog.events || 0,
      memoryFacts: sourceSummary.memory && sourceSummary.memory.visibleFacts || 0,
      memoryCorrections: sourceSummary.memory && sourceSummary.memory.corrections || 0,
      guidedOutcomes: sourceSummary.guidedSessionOutcomes.outcomes,
      flagshipExerciseOutcomes: sourceSummary.flagshipExerciseOutcome.correct,
      issues: issues.length
    },
    guarantees: [
      { key: "real-profile-exported", label: "A non-demo local profile with attempts, plan execution, memory correction, and guided outcome can be exported", pass: stages[0].status === "pass" && stages[1].status === "pass" },
      { key: "export-replay-deterministic", label: "The exported event log replays without warnings and preserves plan completion", pass: stages[2].status === "pass" },
      { key: "import-restores-user-state", label: "A clean dashboard import restores the active plan, correction audit trail, and guided outcome history", pass: stages[3].status === "pass" },
      { key: "post-import-replay-stable", label: "The imported profile exports and replays to the same timeline fingerprint", pass: stages[4].status === "pass" },
      { key: "flagship-exercise-outcome-portable", label: "The flagship exercise outcome survives export, import, and replay proof", pass: sourceSummary.flagshipExerciseOutcome.correct >= 1 && importedSummary.flagshipExerciseOutcome.correct === sourceSummary.flagshipExerciseOutcome.correct },
      { key: "derived-packets-private", label: "Derived memory/model/agent/companion/outcome packets exclude raw learner answer text", pass: privacyIssues.length === 0 }
    ],
    stages,
    issues
  };
}

function formatProfilePortabilityReport(report) {
  const lines = [
    "Profile Portability Report",
    `status: ${report.status}`,
    `trace: ${report.traceId}`,
    `stages: ${report.totals.passedStages}/${report.totals.stages}`,
    `events: ${report.totals.eventCount}`,
    `memory facts: ${report.totals.memoryFacts}`,
    `guided outcomes: ${report.totals.guidedOutcomes}`,
    `flagship exercise outcomes: ${report.totals.flagshipExerciseOutcomes}`,
    "",
    "Guarantees:"
  ];
  report.guarantees.forEach(item => {
    lines.push(`- ${item.pass ? "pass" : "fail"} ${item.key}: ${item.label}`);
  });
  lines.push("", "Stages:");
  report.stages.forEach(item => {
    lines.push(`- ${item.status} ${item.id}`);
  });
  lines.push("", "Issues:");
  if (report.issues.length) report.issues.forEach(issue => lines.push(`- ${issue}`));
  else lines.push("none");
  return lines.join("\n");
}

function writeProfilePortabilityReport(outPath, options = {}) {
  const root = sourceRoot(options);
  const report = buildProfilePortabilityReport({ root });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  if (options.text) console.log(formatProfilePortabilityReport(report));
  if (report.status !== "pass") {
    console.error(`profile portability report failed with ${report.totals.issues} issue(s)`);
    report.issues.forEach(issue => console.error(`- ${issue}`));
    process.exit(1);
  }
  if (!options.text) {
    console.log(`profile portability report built: ${displayRel(outPath, root)} (${report.totals.stages} stage(s), ${report.traceId})`);
  }
  return report;
}

function main() {
  const root = argValue("--root") || repoRoot;
  const out = argValue("--out") || path.join(repoRoot, ".dist", "profile-portability.json");
  const report = buildProfilePortabilityReport({ root });
  if (hasFlag("--json")) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    if (report.status !== "pass") process.exit(1);
    return;
  }
  writeProfilePortabilityReport(path.resolve(repoRoot, out), { root, text: hasFlag("--text") });
}

if (require.main === module) main();

module.exports = {
  buildProfilePortabilityReport,
  formatProfilePortabilityReport,
  writeProfilePortabilityReport
};

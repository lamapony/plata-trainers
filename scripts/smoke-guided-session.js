#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(repoRoot, "shared", "plata-guided-session.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadApi() {
  const storage = {};
  const context = {
    console,
    Date,
    JSON,
    Object,
    Math,
    String,
    Array,
    encodeURIComponent,
    localStorage: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
      },
      setItem(key, value) {
        storage[key] = String(value);
      },
      removeItem(key) {
        delete storage[key];
      }
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "shared/plata-guided-session.js" });
  context.PlataGuidedSession.__storage = storage;
  return context.PlataGuidedSession;
}

function memoryFact(overrides = {}) {
  return Object.assign({
    id: "mem-passive-agency",
    kind: "weak_signal",
    status: "open",
    trainerId: "lesson-b2-radiator-register",
    signal: "passive-agency",
    competencyId: "agency-responsibility",
    sourceFingerprint: "memsrc-passive",
    confidence: 0.78
  }, overrides);
}

function repairPlan(stepOverrides = {}, planOverrides = {}) {
  const step = Object.assign({
    number: 1,
    kind: "repair",
    trainerId: "lesson-b2-radiator-register",
    trainerName: "B2: Register & Particles",
    title: "Repair passive-agency",
    copy: "Practice naming the missing actor in official replies.",
    primaryLabel: "Open repair",
    primaryHref: "./lessons/lesson-b2-radiator/?mode=repair&signal=passive-agency#official-reply-passive",
    signalTag: "passive-agency",
    routeId: "s1-passive",
    status: "open",
    statusLabel: "Open",
    minutes: "8 min",
    competency: { id: "agency-responsibility", label: "Agency and responsibility" }
  }, stepOverrides);
  return Object.assign({
    kind: "repair",
    title: "Repair plan",
    copy: "Repair the highest open mastery signal.",
    planToken: "plan-passive",
    fingerprint: "plan-passive-fp",
    steps: [step],
    completedCount: step.completedAt ? 1 : 0,
    openCount: step.completedAt ? 0 : 1,
    completed: Boolean(step.completedAt),
    primaryStep: step
  }, planOverrides);
}

function advisorReceipt(step, fact) {
  return {
    step,
    actionHref: "./lessons/lesson-b2-radiator/?mode=repair&signal=passive-agency&plan=plan-passive&step=s1-passive#official-reply-passive",
    advice: {
      title: "Repair passive-agency",
      advice: "Use the cited weak signal to keep this session narrow.",
      citedFacts: [fact],
      trace: { fingerprint: "adv-passive", rule: "weak-signal" },
      guardrails: {
        deterministic: true,
        requiresModel: false,
        usesOnlyCitedFacts: true,
        containsRawAnswerText: false
      }
    },
    companion: {
      kind: "repair",
      headline: "Repair passive-agency",
      message: "Keep this session on the missing actor signal.",
      why: "A cited memory fact shows this signal is still open.",
      fingerprint: "cmp-passive",
      citedFacts: [fact],
      guardrails: {
        deterministic: true,
        requiresModel: false,
        usesOnlyCitedFacts: true,
        containsRawAnswerText: false
      }
    }
  };
}

function buildRepairSession(api, stepOverrides = {}, planOverrides = {}) {
  const fact = memoryFact();
  const plan = repairPlan(stepOverrides, planOverrides);
  const step = plan.steps[0];
  return api.buildSession({
    plan,
    step: plan.completed ? null : step,
    advisorReceipt: advisorReceipt(step, fact),
    memoryFacts: [fact],
    now: "2026-06-08T09:00:00.000Z"
  });
}

function runReadyRepairSmoke(api) {
  const session = buildRepairSession(api);
  assert(session.status === "ready", "open repair step should produce a ready guided session");
  assert(session.goal.title === "Repair passive-agency", "guided session should keep companion/advisor focus");
  assert(session.goal.signal === "passive-agency", "guided session should expose the trained signal");
  assert(session.goal.rootCompetency === "Agency and responsibility", "guided session should expose root competency");
  assert(session.steps.length === 4, "guided session should always contain four steps");
  assert(session.steps[1].action.href.includes("plan=plan-passive"), "practice step should carry active plan token");
  assert(session.outcomeReceipt.citedFacts.length >= 1, "outcome receipt should cite memory facts");
  assert(session.guardrails.requiresModel === false, "guided session should not require a model call");
  assert(session.guardrails.containsRawAnswerText === false, "guided session should declare no raw answer text");
  assert(session.validation.status === "pass", `guided session validation should pass: ${session.validation.issues.join(", ")}`);

  const again = buildRepairSession(api);
  assert(again.fingerprint === session.fingerprint, "guided session fingerprint should be stable for the same inputs");
}

function runActiveAndCompleteSmoke(api) {
  const active = buildRepairSession(api, { status: "active", statusLabel: "In progress", startedAt: "2026-06-08T08:30:00.000Z" });
  assert(active.status === "active", "started step should produce an active session");
  assert(active.steps[0].status === "done", "active session should mark orientation done");
  assert(active.steps[1].status === "active", "active session should mark practice active");
  assert(active.steps[2].status === "ready", "active session should make reflection ready");

  const complete = buildRepairSession(api, { status: "done", statusLabel: "Done", completedAt: "2026-06-08T08:50:00.000Z" }, { completed: true, completedCount: 1, openCount: 0 });
  assert(complete.status === "complete", "completed plan should produce complete session");
  assert(complete.steps.every(step => step.status === "done"), "complete session should mark every step done");
  assert(complete.outcomeReceipt.title === "Route complete", "complete session should render route completion receipt");
}

function runEmptySmoke(api) {
  const session = api.buildSession({ plan: null, step: null, memoryFacts: [], now: "2026-06-08T09:00:00.000Z" });
  assert(session.status === "empty", "missing plan should produce empty guided session");
  assert(session.goal.title === "Create the first evidence trail", "empty session should be honest first-run UX");
  assert(session.steps.length === 4, "empty session should still keep the four-step shell");
  assert(session.validation.status === "pass", `empty session validation should pass: ${session.validation.issues.join(", ")}`);
}

function runRawLeakSmoke(api) {
  const session = buildRepairSession(api);
  const mutated = JSON.parse(JSON.stringify(session));
  mutated.steps[1].expected = "secret expected text";
  const validation = api.validateSession(mutated);
  assert(validation.status === "fail", "validator should reject raw answer-like keys");
  assert(validation.issues.some(issue => issue.includes("raw answer-like key")), "validator should explain raw key rejection");

  const textLeak = JSON.parse(JSON.stringify(session));
  textLeak.outcomeReceipt.summary = "raw weak expected";
  const textValidation = api.validateSession(textLeak);
  assert(textValidation.status === "fail", "validator should reject fixture-like raw answer text");
}

function runOutcomeLedgerSmoke(api) {
  const fact = memoryFact();
  const plan = repairPlan({
    completedAt: "2026-06-08T08:50:00.000Z",
    completionEvidence: {
      reason: "repair-correct",
      mode: "repair",
      trainerId: "lesson-b2-radiator-register",
      itemId: "official-reply-passive",
      sceneId: "official-reply-passive",
      correct: true
    },
    trace: {
      fingerprint: "ptr-passive",
      inputs: { selectedMemoryFacts: [fact] }
    }
  });
  const outcome = api.recordOutcome({
    plan,
    step: plan.steps[0],
    evidence: plan.steps[0].completionEvidence,
    completedAt: plan.steps[0].completedAt,
    recordedAt: "2026-06-08T08:50:00.000Z",
    source: "smoke"
  });
  assert(outcome.outcomeType === api.outcomeType, "recorded outcome should use guided outcome type");
  assert(outcome.fingerprint.startsWith("gdo-"), "recorded outcome should have an outcome fingerprint");
  assert(outcome.validation.status === "pass", `recorded outcome should validate: ${outcome.validation.issues.join(", ")}`);
  assert(outcome.outcomeReceipt.citedFacts.length === 1, "recorded outcome should cite planner-selected memory facts");
  assert(outcome.completionEvidence.reason === "repair-correct", "recorded outcome should preserve sanitized completion evidence");

  const ledger = api.readOutcomeLedger();
  assert(ledger.ledgerType === api.outcomeLedgerType, "outcome ledger should expose its type");
  assert(ledger.totals.outcomes === 1, "outcome ledger should store one receipt");
  assert(ledger.totals.citedFacts === 1, "outcome ledger should count cited facts");
  assert(ledger.outcomes[0].fingerprint === outcome.fingerprint, "outcome ledger should store the same receipt fingerprint");

  api.recordOutcome({
    plan,
    step: plan.steps[0],
    evidence: plan.steps[0].completionEvidence,
    completedAt: plan.steps[0].completedAt,
    recordedAt: "2026-06-08T08:50:00.000Z",
    source: "smoke"
  });
  assert(api.readOutcomeLedger().totals.outcomes === 1, "outcome ledger should dedupe repeated completion writes");

  const mutated = JSON.parse(JSON.stringify(outcome));
  mutated.completionEvidence.expected = "secret expected text";
  const validation = api.validateOutcome(mutated);
  assert(validation.status === "fail", "outcome validator should reject raw answer-like evidence keys");
  mutated.outcomeReceipt.summary = "raw weak expected";
  const sanitizedLedger = api.saveOutcomeLedger({ updatedAt: "2026-06-08T08:51:00.000Z", outcomes: [mutated] });
  assert(sanitizedLedger.totals.issues >= 1, "outcome ledger should report rejected invalid receipts");
  assert(sanitizedLedger.totals.outcomes === 0, "outcome ledger should not persist invalid receipts");
  assert(api.readOutcomeLedger().totals.outcomes === 0, "outcome ledger read should hide invalid receipts");
}

function run() {
  const api = loadApi();
  assert(api && api.buildSession, "PlataGuidedSession API should load");
  runReadyRepairSmoke(api);
  runActiveAndCompleteSmoke(api);
  runEmptySmoke(api);
  runRawLeakSmoke(api);
  runOutcomeLedgerSmoke(api);
  console.log("ok - guided session builds deterministic learner-facing sessions");
  console.log("ok - guided session tracks ready, active, complete, and empty states");
  console.log("ok - guided session records portable outcome receipts");
  console.log("ok - guided session rejects raw learner answer leaks");
}

run();

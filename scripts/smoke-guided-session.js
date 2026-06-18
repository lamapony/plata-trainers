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
  assert(session.goal.title === "Start B2 job follow-up", "empty session should promote B2 follow-up as primary first action");
  assert(session.goal.trainerId === "lesson-b2-job-followup", "empty session should target job-followup lesson");
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

function runGoldLessonSmoke(api) {
  const ordFact = memoryFact({
    id: "mem-v2-placement",
    signal: "v2-placement",
    trainerId: "lesson-b2-ordstilling",
    competencyId: "register-control",
    sourceFingerprint: "memsrc-v2"
  });
  const ordStep = {
    kind: "drill-repair",
    trainerId: "ordstilling",
    trainerName: "Ordstilling drill",
    title: "Run Ordstilling drill",
    primaryHref: "./ordstilling-drill/?signal=v2-placement&from=lesson-b2-ordstilling&cat=v2",
    signalTag: "v2-placement",
    routeId: "s1-v2"
  };
  const ordSession = api.buildSession({
    plan: repairPlan(ordStep, {
      kind: "repair",
      planToken: "plan-v2",
      fingerprint: "plan-v2-fp"
    }),
    step: repairPlan(ordStep).steps[0],
    advisorReceipt: advisorReceipt(repairPlan(ordStep).steps[0], ordFact),
    memoryFacts: [ordFact],
    actionHref: "./ordstilling-drill/?signal=v2-placement&from=lesson-b2-ordstilling&cat=v2&plan=plan-v2&step=s1-v2",
    now: "2026-06-08T09:00:00.000Z"
  });
  assert(ordSession.status === "ready", "ordstilling drill repair should produce ready guided session");
  assert(ordSession.goal.trainerId === "ordstilling", "ordstilling guided session should target ordstilling drill");
  assert(ordSession.route.href.includes("ordstilling-drill"), "ordstilling guided session route should open ordstilling drill");

  const followStep = {
    kind: "continue",
    trainerId: "lesson-b2-job-followup",
    trainerName: "Efter interviews",
    title: "Continue job follow-up",
    primaryHref: "./lessons/lesson-b2-job-followup/",
    signalTag: "",
    routeId: "s1-follow"
  };
  const followSession = api.buildSession({
    plan: repairPlan(followStep, {
      kind: "continue",
      planToken: "plan-follow",
      fingerprint: "plan-follow-fp"
    }),
    step: repairPlan(followStep).steps[0],
    memoryFacts: [],
    actionHref: "./lessons/lesson-b2-job-followup/?plan=plan-follow&step=s1-follow",
    now: "2026-06-08T09:00:00.000Z"
  });
  assert(followSession.status === "ready", "job follow-up continue should produce ready guided session");
  assert(followSession.goal.trainerId === "lesson-b2-job-followup", "job follow-up guided session should target gold lesson");

  const boligFact = memoryFact({
    id: "mem-agency-without-pressure",
    signal: "agency-without-pressure",
    trainerId: "lesson-b1-bolig",
    competencyId: "agency",
    sourceFingerprint: "memsrc-bolig-agency"
  });
  const boligStep = {
    kind: "repair",
    trainerId: "lesson-b1-bolig",
    trainerName: "Bolig og udlejer",
    title: "Repair agency-without-pressure",
    primaryHref: "./lessons/lesson-b1-bolig/?mode=repair&signal=agency-without-pressure#professional-response",
    signalTag: "agency-without-pressure",
    routeId: "s1-bolig-agency"
  };
  const boligSession = api.buildSession({
    plan: repairPlan(boligStep, {
      kind: "repair",
      planToken: "plan-bolig-agency",
      fingerprint: "plan-bolig-agency-fp"
    }),
    step: repairPlan(boligStep).steps[0],
    advisorReceipt: advisorReceipt(repairPlan(boligStep).steps[0], boligFact),
    memoryFacts: [boligFact],
    actionHref: "./lessons/lesson-b1-bolig/?mode=repair&signal=agency-without-pressure&plan=plan-bolig-agency&step=s1-bolig-agency#professional-response",
    now: "2026-06-08T09:00:00.000Z"
  });
  assert(boligSession.status === "ready", "bolig scene repair should produce ready guided session");
  assert(boligSession.goal.trainerId === "lesson-b1-bolig", "bolig guided session should target bolig gold lesson");
  assert(boligSession.route.href.includes("lesson-b1-bolig"), "bolig guided session route should open bolig lesson repair");

  const radFact = memoryFact({
    id: "mem-formal-register",
    signal: "formal-register-control",
    trainerId: "lesson-b2-radiator-register",
    competencyId: "register-control",
    sourceFingerprint: "memsrc-formal-register"
  });
  const radStep = {
    kind: "drill-repair",
    trainerId: "register",
    trainerName: "Register drill",
    title: "Run Register drill",
    primaryHref: "./register-drill/?signal=formal-register-control&from=lesson-b2-radiator-register&cat=channel",
    signalTag: "formal-register-control",
    routeId: "s1-formal-register"
  };
  const radSession = api.buildSession({
    plan: repairPlan(radStep, {
      kind: "repair",
      planToken: "plan-formal-register",
      fingerprint: "plan-formal-register-fp"
    }),
    step: repairPlan(radStep).steps[0],
    advisorReceipt: advisorReceipt(repairPlan(radStep).steps[0], radFact),
    memoryFacts: [radFact],
    actionHref: "./register-drill/?signal=formal-register-control&from=lesson-b2-radiator-register&cat=channel&plan=plan-formal-register&step=s1-formal-register",
    now: "2026-06-08T09:00:00.000Z"
  });
  assert(radSession.status === "ready", "radiator register drill repair should produce ready guided session");
  assert(radSession.goal.trainerId === "register", "radiator guided session should target register drill");
  assert(radSession.route.href.includes("register-drill"), "radiator guided session route should open register drill");

  const bsFact = memoryFact({
    id: "mem-clarification-without-panic",
    signal: "clarification-without-panic",
    trainerId: "lesson-b1-borgerservice",
    competencyId: "agency",
    sourceFingerprint: "memsrc-borgerservice-clarify"
  });
  const bsStep = {
    kind: "repair",
    trainerId: "lesson-b1-borgerservice",
    trainerName: "Når systemet siger nej",
    title: "Repair clarification-without-panic",
    primaryHref: "./lessons/lesson-b1-borgerservice/?mode=repair&signal=clarification-without-panic#clarify-misunderstanding",
    signalTag: "clarification-without-panic",
    routeId: "s1-borgerservice-clarify"
  };
  const bsSession = api.buildSession({
    plan: repairPlan(bsStep, {
      kind: "repair",
      planToken: "plan-borgerservice-clarify",
      fingerprint: "plan-borgerservice-clarify-fp"
    }),
    step: repairPlan(bsStep).steps[0],
    advisorReceipt: advisorReceipt(repairPlan(bsStep).steps[0], bsFact),
    memoryFacts: [bsFact],
    actionHref: "./lessons/lesson-b1-borgerservice/?mode=repair&signal=clarification-without-panic&plan=plan-borgerservice-clarify&step=s1-borgerservice-clarify#clarify-misunderstanding",
    now: "2026-06-08T09:00:00.000Z"
  });
  assert(bsSession.status === "ready", "borgerservice scene repair should produce ready guided session");
  assert(bsSession.goal.trainerId === "lesson-b1-borgerservice", "borgerservice guided session should target borgerservice gold lesson");
  assert(bsSession.route.href.includes("lesson-b1-borgerservice"), "borgerservice guided session route should open borgerservice lesson repair");

  const docFact = memoryFact({
    id: "mem-symptom-duration",
    signal: "symptom-duration",
    trainerId: "lesson-a2-doctor",
    competencyId: "process-control",
    sourceFingerprint: "memsrc-doctor-duration"
  });
  const docStep = {
    kind: "repair",
    trainerId: "lesson-a2-doctor",
    trainerName: "Hvor længe har du haft det sådan?",
    title: "Repair symptom-duration",
    primaryHref: "./lessons/lesson-a2-doctor/?mode=repair&signal=symptom-duration#symptom-duration",
    signalTag: "symptom-duration",
    routeId: "s1-doctor-duration"
  };
  const docSession = api.buildSession({
    plan: repairPlan(docStep, {
      kind: "repair",
      planToken: "plan-doctor-duration",
      fingerprint: "plan-doctor-duration-fp"
    }),
    step: repairPlan(docStep).steps[0],
    advisorReceipt: advisorReceipt(repairPlan(docStep).steps[0], docFact),
    memoryFacts: [docFact],
    actionHref: "./lessons/lesson-a2-doctor/?mode=repair&signal=symptom-duration&plan=plan-doctor-duration&step=s1-doctor-duration#symptom-duration",
    now: "2026-06-08T09:00:00.000Z"
  });
  assert(docSession.status === "ready", "doctor scene repair should produce ready guided session");
  assert(docSession.goal.trainerId === "lesson-a2-doctor", "doctor guided session should target doctor gold lesson");
  assert(docSession.route.href.includes("lesson-a2-doctor"), "doctor guided session route should open doctor lesson repair");
}

function run() {
  const api = loadApi();
  assert(api && api.buildSession, "PlataGuidedSession API should load");
  runReadyRepairSmoke(api);
  runActiveAndCompleteSmoke(api);
  runEmptySmoke(api);
  runGoldLessonSmoke(api);
  runRawLeakSmoke(api);
  runOutcomeLedgerSmoke(api);
  console.log("ok - guided session builds deterministic learner-facing sessions");
  console.log("ok - guided session tracks ready, active, complete, and empty states");
  console.log("ok - guided session records portable outcome receipts");
  console.log("ok - guided session covers all six gold lesson repair and continue routes");
  console.log("ok - guided session rejects raw learner answer leaks");
}

run();

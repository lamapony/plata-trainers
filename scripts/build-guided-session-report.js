#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { buildExerciseValueReport } = require("./build-exercise-value-report.js");

const repoRoot = path.resolve(__dirname, "..");
const fixedNow = "2026-06-08T09:00:00.000Z";

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

function loadGuidedSessionApi(root) {
  const context = { console, Date, JSON, Object, Math, String, Array };
  const storage = {};
  context.localStorage = {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
    },
    setItem(key, value) {
      storage[key] = String(value);
    },
    removeItem(key) {
      delete storage[key];
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  const source = fs.readFileSync(path.join(root, "shared", "plata-guided-session.js"), "utf8");
  vm.runInContext(source, context, { filename: "shared/plata-guided-session.js" });
  return context.PlataGuidedSession;
}

function fact(overrides = {}) {
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

function planStep(overrides = {}) {
  return Object.assign({
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
  }, overrides);
}

function appendQueryParams(href, params) {
  const raw = String(href || "#");
  const hashIndex = raw.indexOf("#");
  const base = hashIndex === -1 ? raw : raw.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : raw.slice(hashIndex);
  const pairs = Object.keys(params || {}).filter(key => params[key] !== undefined && params[key] !== null && params[key] !== "").map(key => {
    return `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`;
  });
  if (!pairs.length) return raw;
  return `${base}${base.includes("?") ? "&" : "?"}${pairs.join("&")}${hash}`;
}

function plan(overrides = {}, stepOverrides = {}) {
  const step = planStep(stepOverrides);
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
  }, overrides);
}

function starterPlan() {
  const step = planStep({
    kind: "continue",
    trainerId: "lesson-b2-job-followup",
    trainerName: "Efter interviews — tone, tak, og tålmodighed",
    title: "Start B2 job follow-up",
    copy: "Begin with the B2 job-follow-up lesson and create the first evidence trail.",
    primaryLabel: "Start first session",
    primaryHref: "./lessons/lesson-b2-job-followup/",
    signalTag: "",
    routeId: "s1-start",
    competency: null,
    minutes: "15 min"
  });
  return {
    kind: "starter",
    title: "Starter plan",
    copy: "Start with the B2 follow-up route.",
    planToken: "plan-starter",
    fingerprint: "plan-starter-fp",
    steps: [step],
    completedCount: 0,
    openCount: 1,
    completed: false,
    primaryStep: step
  };
}

function advisorReceipt(step, citedFact, overrides = {}) {
  return Object.assign({
    step,
    actionHref: step && appendQueryParams(step.primaryHref, { plan: "plan-passive", step: step.routeId }),
    advice: {
      title: "Repair passive-agency",
      advice: "Use the cited weak signal to keep this session narrow.",
      citedFacts: citedFact ? [citedFact] : [],
      trace: { fingerprint: "adv-passive", rule: "weak-signal" },
      guardrails: {
        deterministic: true,
        requiresModel: false,
        usesOnlyCitedFacts: true,
        containsRawAnswerText: false
      }
    },
    companion: citedFact ? {
      kind: "repair",
      headline: "Repair passive-agency",
      message: "Keep this session on the missing actor signal.",
      why: "A cited memory fact shows this signal is still open.",
      fingerprint: "cmp-passive",
      citedFacts: [citedFact],
      guardrails: {
        deterministic: true,
        requiresModel: false,
        usesOnlyCitedFacts: true,
        containsRawAnswerText: false
      }
    } : null
  }, overrides);
}

function compactFact(row) {
  row = row || {};
  return {
    factId: row.factId || row.id || "",
    kind: row.kind || "",
    status: row.status || "",
    trainerId: row.trainerId || "",
    signal: row.signal || "",
    competencyId: row.competencyId || "",
    sourceFingerprint: row.sourceFingerprint || "",
    role: row.role || ""
  };
}

function compactSession(session) {
  return {
    schemaVersion: session.schemaVersion,
    sessionType: session.sessionType,
    status: session.status,
    fingerprint: session.fingerprint,
    goal: session.goal,
    route: session.route,
    steps: session.steps.map(step => ({
      id: step.id,
      kind: step.kind,
      title: step.title,
      status: step.status,
      hasAction: Boolean(step.action && step.action.href),
      evidence: (step.evidence || []).map(compactFact)
    })),
    outcomeReceipt: {
      title: session.outcomeReceipt.title,
      summary: session.outcomeReceipt.summary,
      trainedSignals: session.outcomeReceipt.trainedSignals,
      rootCompetency: session.outcomeReceipt.rootCompetency,
      citedFacts: (session.outcomeReceipt.citedFacts || []).map(compactFact),
      completionCriteria: session.outcomeReceipt.completionCriteria,
      trustBoundaries: session.outcomeReceipt.trustBoundaries
    },
    guardrails: session.guardrails,
    trace: session.trace,
    validation: session.validation
  };
}

function compactOutcome(outcome) {
  return {
    schemaVersion: outcome.schemaVersion,
    outcomeType: outcome.outcomeType,
    fingerprint: outcome.fingerprint,
    completedAt: outcome.completedAt,
    planToken: outcome.planToken,
    stepRouteId: outcome.stepRouteId,
    trainerId: outcome.trainerId,
    goal: outcome.goal,
    completionEvidence: outcome.completionEvidence,
    outcomeReceipt: {
      title: outcome.outcomeReceipt.title,
      summary: outcome.outcomeReceipt.summary,
      trainedSignals: outcome.outcomeReceipt.trainedSignals,
      rootCompetency: outcome.outcomeReceipt.rootCompetency,
      citedFacts: (outcome.outcomeReceipt.citedFacts || []).map(compactFact),
      completionCriteria: outcome.outcomeReceipt.completionCriteria,
      trustBoundaries: outcome.outcomeReceipt.trustBoundaries
    },
    guardrails: outcome.guardrails,
    trace: outcome.trace,
    validation: outcome.validation
  };
}

function buildFlagshipExerciseOutcomeProof(exerciseValueReport, recordedOutcome, citedFact) {
  const chain = (exerciseValueReport.lessons || [])
    .flatMap(lesson => lesson.flagshipChains || [])
    .find(item => item.lessonId === "lesson-b2-radiator-register" && item.sceneId === "channel-transfer-lab") || null;
  const checks = [
    {
      key: "exercise-value-report-pass",
      pass: exerciseValueReport.status === "pass",
      issue: "exercise-value report does not pass"
    },
    {
      key: "flagship-chain-present",
      pass: Boolean(chain && chain.status === "pass"),
      issue: "channel-transfer-lab flagship chain is not present and passing"
    },
    {
      key: "memory-signal-aligned",
      pass: Boolean(chain && chain.memoryCue && citedFact && chain.memoryCue.signal === citedFact.signal),
      issue: "flagship chain memory cue does not align with guided session memory signal"
    },
    {
      key: "guided-outcome-recorded",
      pass: Boolean(recordedOutcome && recordedOutcome.fingerprint && recordedOutcome.fingerprint.startsWith("gdo-")),
      issue: "guided session did not record a portable outcome receipt"
    },
    {
      key: "reason-evidence-required",
      pass: Boolean(chain && (chain.checks || []).some(item => item.key === "explain-your-choice" && item.pass)),
      issue: "flagship chain does not require reason evidence"
    }
  ];
  return {
    status: checks.every(item => item.pass) ? "pass" : "fail",
    lessonId: "lesson-b2-radiator-register",
    sceneId: "channel-transfer-lab",
    routeHref: "./lessons/lesson-b2-radiator/?mode=repair&signal=passive-agency#channel-transfer-lab",
    publicReport: "reports/exercise-value.json",
    guidedReport: "reports/guided-session.json",
    profileReport: "reports/profile-portability.json",
    memorySignal: citedFact && citedFact.signal || "",
    guidedOutcomeFingerprint: recordedOutcome && recordedOutcome.fingerprint || "",
    exerciseArchetypes: chain ? chain.archetypes : [],
    checks,
    issues: checks.filter(item => !item.pass).map(item => item.issue)
  };
}

function forbiddenLeaks() {
  return [
    "raw weak expected",
    "raw weak given",
    "raw correct expected",
    "raw correct given",
    "raw due-review expected",
    "raw due-review given",
    "De lover, at radiatoren bliver fikset hurtigt"
  ];
}

function scenario(api, spec) {
  const input = spec.input();
  const session = api.buildSession(Object.assign({ now: fixedNow }, input));
  const validation = api.validateSession(session);
  const text = JSON.stringify(session);
  const leaks = forbiddenLeaks().filter(value => text.includes(value));
  const issues = [];
  if (session.status !== spec.expectedStatus) issues.push(`expected status ${spec.expectedStatus}, got ${session.status}`);
  if (validation.status !== "pass") issues.push(...validation.issues);
  if (session.steps.length !== 4) issues.push("session does not have four guided steps");
  if (spec.requiresAction && !(session.route && session.route.href)) issues.push("session route is missing action href");
  if (spec.requiresCitations && !(session.outcomeReceipt.citedFacts || []).length) issues.push("session outcome lacks cited memory facts");
  if (leaks.length) issues.push(`raw learner text leaked: ${leaks.join(", ")}`);
  return {
    id: spec.id,
    title: spec.title,
    expectedStatus: spec.expectedStatus,
    status: issues.length ? "fail" : "pass",
    issues,
    session: compactSession(session)
  };
}

function buildGuidedSessionReport(options = {}) {
  const root = sourceRoot(options);
  const api = loadGuidedSessionApi(root);
  const exerciseValueReport = buildExerciseValueReport({ root });
  const weakFact = fact();
  const reviewFact = fact({
    id: "mem-formal-review",
    kind: "next_review_due",
    status: "due",
    signal: "formal-register-control",
    competencyId: "register-control",
    sourceFingerprint: "memsrc-review"
  });
  const openPlan = plan();
  const activePlan = plan({}, { status: "active", statusLabel: "In progress", startedAt: "2026-06-08T08:30:00.000Z" });
  const completePlan = plan({ completed: true, completedCount: 1, openCount: 0 }, { status: "done", statusLabel: "Done", completedAt: "2026-06-08T08:50:00.000Z" });
  const outcomePlan = plan(
    { completed: true, completedCount: 1, openCount: 0 },
    {
      status: "done",
      statusLabel: "Done",
      completedAt: "2026-06-08T08:50:00.000Z",
      completionEvidence: { reason: "repair-correct", mode: "repair", trainerId: "lesson-b2-radiator-register", correct: 1, total: 1 },
      trace: {
        fingerprint: "step-trace-passive",
        inputs: { selectedMemoryFacts: [weakFact] }
      }
    }
  );
  const specs = [
    {
      id: "first-session",
      title: "First guided session from a starter plan",
      expectedStatus: "ready",
      requiresAction: true,
      requiresCitations: false,
      input: () => ({
        plan: starterPlan(),
        step: starterPlan().steps[0],
        memoryFacts: [],
        actionHref: "./lessons/lesson-b2-job-followup/?plan=plan-starter&step=s1-start"
      })
    },
    {
      id: "memory-backed-repair",
      title: "Repair session with cited learner memory",
      expectedStatus: "ready",
      requiresAction: true,
      requiresCitations: true,
      input: () => ({
        plan: openPlan,
        step: openPlan.steps[0],
        advisorReceipt: advisorReceipt(openPlan.steps[0], weakFact),
        memoryFacts: [weakFact]
      })
    },
    {
      id: "active-saved-route",
      title: "Resume an already opened guided session",
      expectedStatus: "active",
      requiresAction: true,
      requiresCitations: true,
      input: () => ({
        plan: activePlan,
        step: activePlan.steps[0],
        advisorReceipt: advisorReceipt(activePlan.steps[0], weakFact),
        memoryFacts: [weakFact]
      })
    },
    {
      id: "due-review-context",
      title: "Guided session can carry due review memory",
      expectedStatus: "ready",
      requiresAction: true,
      requiresCitations: true,
      input: () => ({
        plan: plan({ kind: "review", title: "Review plan" }, { kind: "review", signalTag: "formal-register-control", title: "Review formal register", primaryHref: "./lessons/lesson-b2-job-followup/#linkedin-choice" }),
        step: plan({ kind: "review", title: "Review plan" }, { kind: "review", signalTag: "formal-register-control", title: "Review formal register", primaryHref: "./lessons/lesson-b2-job-followup/#linkedin-choice" }).steps[0],
        advisorReceipt: advisorReceipt(plan().steps[0], reviewFact, {
          actionHref: "./lessons/lesson-b2-job-followup/?plan=plan-review&step=s1-review#linkedin-choice",
          advice: {
            title: "Review formal-register-control",
            advice: "The cited memory fact is due for review.",
            citedFacts: [reviewFact],
            trace: { fingerprint: "adv-review", rule: "next-review-due" },
            guardrails: {
              deterministic: true,
              requiresModel: false,
              usesOnlyCitedFacts: true,
              containsRawAnswerText: false
            }
          },
          companion: null
        }),
        memoryFacts: [reviewFact]
      })
    },
    {
      id: "ordstilling-gold-repair",
      title: "Ordstilling gold lesson guided drill repair",
      expectedStatus: "ready",
      requiresAction: true,
      requiresCitations: true,
      input: () => {
        const ordFact = fact({
          id: "mem-v2-placement",
          signal: "v2-placement",
          trainerId: "lesson-b2-ordstilling",
          competencyId: "register-control",
          sourceFingerprint: "memsrc-v2"
        });
        const ordStep = planStep({
          kind: "drill-repair",
          trainerId: "ordstilling",
          trainerName: "Ordstilling drill",
          title: "Run Ordstilling drill",
          copy: "Repair V2 placement with a short ordstilling session mapped from the narrative miss.",
          primaryLabel: "Open drill",
          primaryHref: "./ordstilling-drill/?signal=v2-placement&from=lesson-b2-ordstilling&cat=v2",
          signalTag: "v2-placement",
          routeId: "s1-v2",
          badge: "Gym",
          minutes: "5-8 min"
        });
        const ordPlan = plan({ kind: "repair", title: "Ordstilling repair", planToken: "plan-v2", fingerprint: "plan-v2-fp" }, ordStep);
        return {
          plan: ordPlan,
          step: ordPlan.steps[0],
          advisorReceipt: advisorReceipt(ordPlan.steps[0], ordFact, {
            actionHref: "./ordstilling-drill/?signal=v2-placement&from=lesson-b2-ordstilling&cat=v2&plan=plan-v2&step=s1-v2",
            advice: {
              title: "Repair v2-placement",
              advice: "Keep this session on the mapped ordstilling category.",
              citedFacts: [ordFact],
              trace: { fingerprint: "adv-v2", rule: "weak-signal" },
              guardrails: {
                deterministic: true,
                requiresModel: false,
                usesOnlyCitedFacts: true,
                containsRawAnswerText: false
              }
            },
            companion: null
          }),
          memoryFacts: [ordFact]
        };
      }
    },
    {
      id: "job-followup-gold-continue",
      title: "Job follow-up gold lesson guided continue route",
      expectedStatus: "ready",
      requiresAction: true,
      requiresCitations: false,
      input: () => ({
        plan: starterPlan(),
        step: starterPlan().steps[0],
        memoryFacts: [],
        actionHref: "./lessons/lesson-b2-job-followup/?plan=plan-starter&step=s1-start"
      })
    },
    {
      id: "bolig-gold-repair",
      title: "Bolig gold lesson guided scene repair",
      expectedStatus: "ready",
      requiresAction: true,
      requiresCitations: true,
      input: () => {
        const boligFact = fact({
          id: "mem-agency-without-pressure",
          signal: "agency-without-pressure",
          trainerId: "lesson-b1-bolig",
          competencyId: "agency",
          sourceFingerprint: "memsrc-bolig-agency"
        });
        const boligStep = planStep({
          kind: "repair",
          trainerId: "lesson-b1-bolig",
          trainerName: "Bolig og udlejer",
          title: "Repair agency-without-pressure",
          copy: "Rerun the bolig response scene and keep both agency and a low-pressure next step.",
          primaryLabel: "Open repair",
          primaryHref: "./lessons/lesson-b1-bolig/?mode=repair&signal=agency-without-pressure#professional-response",
          signalTag: "agency-without-pressure",
          routeId: "s1-bolig-agency",
          competency: { id: "agency", label: "Agency and responsibility" },
          minutes: "12 min"
        });
        const boligPlan = plan({ kind: "repair", title: "Bolig repair", planToken: "plan-bolig-agency", fingerprint: "plan-bolig-agency-fp" }, boligStep);
        return {
          plan: boligPlan,
          step: boligPlan.steps[0],
          advisorReceipt: advisorReceipt(boligPlan.steps[0], boligFact, {
            actionHref: "./lessons/lesson-b1-bolig/?mode=repair&signal=agency-without-pressure&plan=plan-bolig-agency&step=s1-bolig-agency#professional-response",
            advice: {
              title: "Repair agency-without-pressure",
              advice: "Keep this session on the bolig response scene and cited weak signal.",
              citedFacts: [boligFact],
              trace: { fingerprint: "adv-bolig-agency", rule: "weak-signal" },
              guardrails: {
                deterministic: true,
                requiresModel: false,
                usesOnlyCitedFacts: true,
                containsRawAnswerText: false
              }
            },
            companion: null
          }),
          memoryFacts: [boligFact]
        };
      }
    },
    {
      id: "radiator-gold-repair",
      title: "Radiator gold lesson guided register drill repair",
      expectedStatus: "ready",
      requiresAction: true,
      requiresCitations: true,
      input: () => {
        const radFact = fact({
          id: "mem-formal-register",
          signal: "formal-register-control",
          trainerId: "lesson-b2-radiator-register",
          competencyId: "register-control",
          sourceFingerprint: "memsrc-formal-register"
        });
        const radStep = planStep({
          kind: "drill-repair",
          trainerId: "register",
          trainerName: "Register drill",
          title: "Run Register drill",
          copy: "Repair formal register control with a short register session mapped from the radiator narrative miss.",
          primaryLabel: "Open drill",
          primaryHref: "./register-drill/?signal=formal-register-control&from=lesson-b2-radiator-register&cat=channel",
          signalTag: "formal-register-control",
          routeId: "s1-formal-register",
          badge: "Gym",
          minutes: "5-8 min",
          competency: { id: "register-control", label: "Register control" }
        });
        const radPlan = plan({ kind: "repair", title: "Radiator register repair", planToken: "plan-formal-register", fingerprint: "plan-formal-register-fp" }, radStep);
        return {
          plan: radPlan,
          step: radPlan.steps[0],
          advisorReceipt: advisorReceipt(radPlan.steps[0], radFact, {
            actionHref: "./register-drill/?signal=formal-register-control&from=lesson-b2-radiator-register&cat=channel&plan=plan-formal-register&step=s1-formal-register",
            advice: {
              title: "Repair formal-register-control",
              advice: "Keep this session on the mapped register channel category.",
              citedFacts: [radFact],
              trace: { fingerprint: "adv-formal-register", rule: "weak-signal" },
              guardrails: {
                deterministic: true,
                requiresModel: false,
                usesOnlyCitedFacts: true,
                containsRawAnswerText: false
              }
            },
            companion: null
          }),
          memoryFacts: [radFact]
        };
      }
    },
    {
      id: "completed-route",
      title: "Completed route outcome receipt",
      expectedStatus: "complete",
      requiresAction: false,
      requiresCitations: true,
      input: () => ({
        plan: completePlan,
        step: null,
        advisorReceipt: advisorReceipt(completePlan.steps[0], weakFact),
        memoryFacts: [weakFact]
      })
    }
  ];
  const scenarios = specs.map(spec => scenario(api, spec));
  const recordedOutcome = api.recordOutcome({
    plan: outcomePlan,
    step: outcomePlan.steps[0],
    evidence: outcomePlan.steps[0].completionEvidence,
    completedAt: outcomePlan.steps[0].completedAt,
    recordedAt: fixedNow,
    source: "guided-session-report"
  });
  const rawOutcomeLedger = api.readOutcomeLedger();
  const outcomeLedger = {
    schemaVersion: rawOutcomeLedger.schemaVersion,
    ledgerType: rawOutcomeLedger.ledgerType,
    storageKey: rawOutcomeLedger.storageKey,
    updatedAt: rawOutcomeLedger.updatedAt,
    totals: rawOutcomeLedger.totals,
    outcomes: rawOutcomeLedger.outcomes.map(compactOutcome)
  };
  const outcomeIssues = [];
  if (recordedOutcome.validation.status !== "pass") outcomeIssues.push(...recordedOutcome.validation.issues);
  if (rawOutcomeLedger.ledgerType !== api.outcomeLedgerType) outcomeIssues.push("outcome ledger type mismatch");
  if (rawOutcomeLedger.totals.outcomes !== 1) outcomeIssues.push(`expected one outcome receipt, got ${rawOutcomeLedger.totals.outcomes}`);
  if (rawOutcomeLedger.totals.issues !== 0) outcomeIssues.push(`outcome ledger has ${rawOutcomeLedger.totals.issues} validation issue(s)`);
  if (!recordedOutcome.fingerprint.startsWith("gdo-")) outcomeIssues.push("outcome receipt fingerprint missing gdo prefix");
  if (!(recordedOutcome.outcomeReceipt.citedFacts || []).length) outcomeIssues.push("outcome receipt lacks cited memory facts");
  const outcomeLeaks = forbiddenLeaks().filter(value => JSON.stringify(outcomeLedger).includes(value));
  if (outcomeLeaks.length) outcomeIssues.push(`outcome ledger leaked raw learner text: ${outcomeLeaks.join(", ")}`);
  const flagshipExerciseOutcomeProof = buildFlagshipExerciseOutcomeProof(exerciseValueReport, recordedOutcome, weakFact);
  const issues = [
    ...scenarios.flatMap(item => item.issues.map(issue => `${item.id}: ${issue}`)),
    ...outcomeIssues.map(issue => `outcome-ledger: ${issue}`),
    ...flagshipExerciseOutcomeProof.issues.map(issue => `flagship-exercise-outcome: ${issue}`)
  ];
  const statuses = Array.from(new Set(scenarios.map(item => item.session.status))).sort();
  const stepCount = scenarios.reduce((sum, item) => sum + item.session.steps.length, 0);
  const citedFacts = scenarios.reduce((sum, item) => sum + item.session.outcomeReceipt.citedFacts.length, 0);

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    fixedNow,
    status: issues.length ? "fail" : "pass",
    totals: {
      scenarios: scenarios.length,
      sessions: scenarios.length,
      statuses: statuses.length,
      steps: stepCount,
      citedFacts,
      outcomeReceipts: outcomeLedger.totals.outcomes,
      flagshipExerciseOutcomeProofs: flagshipExerciseOutcomeProof.status === "pass" ? 1 : 0,
      issues: issues.length
    },
    statuses,
    guarantees: [
      "Every guided session has four learner-facing steps.",
      "Ready and active sessions include a route action.",
      "Memory-backed sessions cite derived memory facts.",
      "Completed practice steps write portable outcome receipts.",
      "The flagship exercise outcome is visible from guided-session proof and linked to exercise-value/profile proof.",
      "Sessions and outcome receipts are deterministic, model-free, and exclude raw learner answers."
    ],
    issues,
    scenarios,
    outcomeLedger,
    flagshipExerciseOutcomeProof
  };
}

function formatGuidedSessionReport(report) {
  const lines = [
    "Guided Session Report",
    `status: ${report.status}`,
    `scenarios: ${report.totals.scenarios}`,
    `outcome receipts: ${report.totals.outcomeReceipts}`,
    `flagship outcome proofs: ${report.totals.flagshipExerciseOutcomeProofs}`,
    `statuses: ${report.statuses.join(", ")}`,
    "",
    "Scenarios:"
  ];
  report.scenarios.forEach(item => {
    lines.push(`- ${item.id}: ${item.status} -> ${item.session.status} / ${item.session.goal.title}`);
  });
  lines.push("", "Issues:");
  if (report.issues.length) report.issues.forEach(issue => lines.push(`- ${issue}`));
  else lines.push("none");
  return lines.join("\n");
}

function writeGuidedSessionReport(outPath, options = {}) {
  const root = sourceRoot(options);
  const report = buildGuidedSessionReport({ root });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  if (options.text) console.log(formatGuidedSessionReport(report));
  if (report.status !== "pass") {
    console.error(`guided session report failed with ${report.totals.issues} issue(s)`);
    report.issues.forEach(issue => console.error(`- ${issue}`));
    process.exit(1);
  }
  if (!options.text) {
    console.log(`guided session report built: ${displayRel(outPath, root)} (${report.totals.scenarios} scenario(s), ${report.totals.statuses} status(es))`);
  }
  return report;
}

function main() {
  const root = argValue("--root") || repoRoot;
  const out = argValue("--out") || path.join(repoRoot, ".dist", "guided-session.json");
  const report = buildGuidedSessionReport({ root });
  if (hasFlag("--json")) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    if (report.status !== "pass") process.exit(1);
    return;
  }
  writeGuidedSessionReport(path.resolve(repoRoot, out), { root, text: hasFlag("--text") });
}

if (require.main === module) main();

module.exports = {
  buildGuidedSessionReport,
  formatGuidedSessionReport,
  writeGuidedSessionReport
};

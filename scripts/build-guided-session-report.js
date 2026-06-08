#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

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
    trainerId: "lesson-01",
    trainerName: "Lesson 01",
    title: "Start Lesson 01",
    copy: "Begin with a short story lesson and create the first evidence trail.",
    primaryLabel: "Start first session",
    primaryHref: "./lessons/lesson-01/",
    signalTag: "",
    routeId: "s1-start",
    competency: null,
    minutes: "6 min"
  });
  return {
    kind: "starter",
    title: "Starter plan",
    copy: "Start with the first short route.",
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
    actionHref: step && `${step.primaryHref}${step.primaryHref.includes("?") ? "&" : "?"}plan=plan-passive&step=${step.routeId}`,
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
        actionHref: "./lessons/lesson-01/?plan=plan-starter&step=s1-start"
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
  const issues = scenarios.flatMap(item => item.issues.map(issue => `${item.id}: ${issue}`));
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
      issues: issues.length
    },
    statuses,
    guarantees: [
      "Every guided session has four learner-facing steps.",
      "Ready and active sessions include a route action.",
      "Memory-backed sessions cite derived memory facts.",
      "Sessions are deterministic, model-free, and exclude raw learner answers."
    ],
    issues,
    scenarios
  };
}

function formatGuidedSessionReport(report) {
  const lines = [
    "Guided Session Report",
    `status: ${report.status}`,
    `scenarios: ${report.totals.scenarios}`,
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

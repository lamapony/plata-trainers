#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const fixedNow = "2026-06-08T09:00:00.000Z";
const sources = [
  "shared/plata-kernel.js",
  "shared/plata-catalog.js",
  "lessons/lesson-01/data.js",
  "lessons/lesson-b2-radiator/data.js",
  "lessons/lesson-b2-job-followup/data.js",
  "lessons/lesson-b2-ordstilling/data.js",
  "lessons/lesson-b1-bolig/data.js",
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

function readRootSource(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
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
    style: {},
    children: [],
    files: [],
    onchange: null,
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    addEventListener() {},
    click() {}
  };
}

function makeContext(initialStorage, options = {}) {
  const storage = Object.assign({}, initialStorage || {});
  const elements = {
    "#trainer-cards": makeElement("div"),
    "#today-program": makeElement("div"),
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
    console,
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
    location: {
      search: options.locationSearch || "",
      hash: options.locationHash || ""
    },
    URL: {
      createObjectURL() {
        return "blob:today-program-report";
      },
      revokeObjectURL() {}
    },
    Blob: function Blob(parts, blobOptions) {
      this.parts = parts || [];
      this.options = blobOptions || {};
    },
    FileReader: function FileReader() {},
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
  return { context, storage, elements };
}

function runSource(env, root, relPath) {
  vm.runInContext(readRootSource(root, relPath), env.context, { filename: relPath });
}

function runSourceIfPresent(env, root, relPath) {
  if (!fs.existsSync(path.join(root, relPath))) return;
  runSource(env, root, relPath);
}

function loadAll(env, root) {
  sources.forEach(relPath => runSourceIfPresent(env, root, relPath));
}

function invoke(env, expression) {
  return vm.runInContext(expression, env.context, { filename: "today-program-report.vm.js" });
}

function setAttemptAt(state, index, at) {
  const attempt = state.attempts && state.attempts[index];
  if (!attempt) return;
  attempt.at = at;
  const item = state.byItemId && state.byItemId[attempt.itemId];
  if (item) item.lastSeen = at;
  state.meta.lastSessionDate = at.slice(0, 10);
  state.updatedAt = at;
}

function seedWeakMasteryState(env) {
  const kernel = env.context.PlataKernel;
  const state = kernel.freshState("lesson-b2-radiator-register");
  kernel.recordAttempt(state, {
    itemId: "official-reply-passive",
    correct: false,
    tags: ["B2", "lesson", "passive-agency"],
    mode: "lesson",
    expected: "raw weak expected",
    given: "raw weak given"
  });
  kernel.recordAttempt(state, {
    itemId: "two-registers",
    correct: true,
    tags: ["B2", "lesson", "formal-register-control"],
    mode: "lesson",
    expected: "raw correct expected",
    given: "raw correct given"
  });
  env.storage[kernel.stateKey("lesson-b2-radiator-register")] = JSON.stringify(state);
}

function seedDueReviewState(env) {
  const kernel = env.context.PlataKernel;
  const state = kernel.freshState("lesson-b2-job-followup");
  kernel.recordAttempt(state, {
    itemId: "linkedin-choice",
    correct: true,
    tags: ["B2", "lesson", "formal-register-control"],
    mode: "lesson",
    expected: "raw due-review expected",
    given: "raw due-review given"
  });
  setAttemptAt(state, 0, "2026-05-01T08:00:00.000Z");
  env.storage[kernel.stateKey("lesson-b2-job-followup")] = JSON.stringify(state);
}

function prepareStartedPlan(env) {
  const planner = env.context.PlataPlanner;
  const candidates = invoke(env, "dashboardCandidates()");
  let plan = planner.practicePlan(candidates, { limit: 3 });
  plan = planner.savePracticePlan(plan);
  plan.steps[0].startedAt = "2026-06-08T08:30:00.000Z";
  planner.savePracticePlan(plan);
  invoke(env, "renderDashboard()");
}

function prepareReturnPlan(env) {
  const planner = env.context.PlataPlanner;
  const plan = planner.savePracticePlan({
    kind: "continue",
    title: "Two-step plan",
    copy: "Return from a completed step.",
    steps: [
      {
        number: 1,
        kind: "continue",
        trainerId: "lesson-b2-radiator-register",
        trainerName: "B2: Register & Particles",
        title: "Repair workplace answer",
        primaryLabel: "Review",
        primaryHref: "./lessons/lesson-b2-radiator/",
        completedAt: "2026-06-08T08:10:00.000Z"
      },
      {
        number: 2,
        kind: "continue",
        trainerId: "vocab",
        trainerName: "Vocab SR",
        title: "Vocabulary stabilizer",
        primaryLabel: "Open vocab",
        primaryHref: "./vocab-sr/",
        minutes: "5 min"
      }
    ]
  });
  env.context.location.search = `?ledger-return=1&plan=${encodeURIComponent(plan.planToken)}&step=${encodeURIComponent(plan.steps[0].routeId)}`;
  invoke(env, "renderDashboard()");
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderedFacts(html) {
  const text = stripHtml(html);
  const activeStageMatch = String(html || "").match(/<span class="active">\s*<strong>([^<]+)<\/strong>\s*([^<]+)\s*<\/span>/);
  return {
    hasAction: /class="btn primary"/.test(html),
    hasStageStrip: /today-stage-strip/.test(html),
    activeStage: activeStageMatch ? `${activeStageMatch[1].trim()} ${activeStageMatch[2].trim()}` : "",
    guardrails: ["Study companion", "Hermes optional", "No model call", "Cited memory", "Local progress", "Planner route"].filter(label => text.includes(label)),
    textSample: text.slice(0, 260)
  };
}

function compactFact(fact) {
  fact = fact || {};
  return {
    id: fact.id || fact.factId || "",
    kind: fact.kind || "",
    signal: fact.signal || "",
    status: fact.status || "",
    sourceFingerprint: fact.sourceFingerprint || "",
    confidence: fact.confidence === undefined ? null : Number(fact.confidence)
  };
}

function compactStep(step) {
  if (!step) return null;
  return {
    number: Number(step.number || 0),
    routeId: step.routeId || "",
    kind: step.kind || "",
    status: step.status || "",
    statusLabel: step.statusLabel || "",
    trainerId: step.trainerId || "",
    signalTag: step.signalTag || "",
    title: step.title || "",
    primaryHref: step.primaryHref || "",
    startedAt: step.startedAt || "",
    completedAt: step.completedAt || "",
    selectedMemoryFacts: (((step.trace || {}).inputs || {}).selectedMemoryFacts || []).map(compactFact)
  };
}

function extractTodayProgram(env, id, expectedState, forbiddenLeaks) {
  invoke(env, "renderDashboard()");
  const summary = invoke(env, `(() => {
    const candidates = dashboardCandidates();
    const resolved = resolvePracticePlan(candidates);
    const planner = resolved.planner;
    const plan = resolved.plan;
    const step = plan && !plan.completed ? (planner.actionablePracticePlanStep ? planner.actionablePracticePlanStep(plan) : plan.primaryStep) : null;
    const receipt = advisorReceiptForPlan(plan);
    const memoryBundle = buildMemoryFacts(null, plan);
    const program = resolveTodayProgramState({
      plan,
      step,
      companion: receipt && receipt.companion || null,
      advice: receipt && receipt.advice || null,
      candidates,
      visibleFacts: memoryBundle.visibleFacts || []
    });
    const actionHref = step ? (planner.planStepHref ? planner.planStepHref(plan, step) : step.primaryHref) : "";
    return {
      candidateCount: candidates.length,
      totalAttempts: candidates.reduce((sum, item) => sum + Number(item && item.stats && item.stats.total || 0), 0),
      program,
      actionHref,
      plan: {
        kind: plan && plan.kind || "",
        title: plan && plan.title || "",
        planToken: plan && plan.planToken || "",
        completedCount: Number(plan && plan.completedCount || 0),
        openCount: Number(plan && plan.openCount || 0),
        stepCount: plan && plan.steps ? plan.steps.length : 0
      },
      step,
      memory: {
        fingerprint: memoryBundle.fingerprint || "",
        summary: memoryBundle.summary || null,
        visibleFacts: (memoryBundle.visibleFacts || []).map(fact => ({
          id: fact.id || "",
          kind: fact.kind || "",
          signal: fact.signal || "",
          status: fact.status || "",
          sourceFingerprint: fact.sourceFingerprint || "",
          confidence: fact.confidence === undefined ? null : Number(fact.confidence)
        })).slice(0, 8)
      },
      companion: receipt && receipt.companion ? {
        kind: receipt.companion.kind || "",
        fingerprint: receipt.companion.fingerprint || "",
        confidence: receipt.companion.confidence || "",
        citedFacts: (receipt.companion.citedFacts || []).map(fact => ({
          id: fact.factId || fact.id || "",
          kind: fact.kind || "",
          signal: fact.signal || "",
          sourceFingerprint: fact.sourceFingerprint || ""
        }))
      } : null
    };
  })()`);
  const html = env.elements["#today-program"].innerHTML || "";
  const rendered = renderedFacts(html);
  const text = stripHtml(html);
  const leakMatches = (forbiddenLeaks || []).filter(value => value && text.includes(value));
  const issues = [];

  if (summary.program.kind !== expectedState) issues.push(`expected state ${expectedState}, got ${summary.program.kind}`);
  if (!rendered.hasAction) issues.push("missing primary action");
  if (!rendered.hasStageStrip) issues.push("missing stage strip");
  if (leakMatches.length) issues.push(`raw learner text leaked: ${leakMatches.join(", ")}`);
  if (expectedState === "memory-review") {
    const selectedKinds = compactStep(summary.step).selectedMemoryFacts.map(fact => fact.kind);
    if (!selectedKinds.includes("next_review_due") && !selectedKinds.includes("stale_skill")) issues.push("memory-review state lacks selected review memory fact");
    if (!rendered.guardrails.includes("Cited memory")) issues.push("memory-review state is not visibly cited");
  }
  if (expectedState === "return" && !String(env.context.location.search || "").includes("ledger-return=1")) issues.push("return state lacks ledger-return route");
  if (expectedState === "active-plan" && compactStep(summary.step).status !== "active") issues.push("active-plan state lacks active planner step");
  if (expectedState === "onboarding" && summary.totalAttempts !== 0) issues.push("onboarding state should have no attempts");

  return {
    id,
    expectedState,
    status: issues.length ? "fail" : "pass",
    issues,
    program: summary.program,
    actionHref: summary.actionHref,
    rendered,
    plan: summary.plan,
    step: compactStep(summary.step),
    memory: summary.memory,
    companion: summary.companion,
    routeSearch: env.context.location.search || ""
  };
}

function scenario(root, spec) {
  const env = makeContext();
  if (spec.seed === "weak-mastery" || spec.seed === "due-review") {
    runSource(env, root, "shared/plata-kernel.js");
    if (spec.seed === "weak-mastery") seedWeakMasteryState(env);
    if (spec.seed === "due-review") seedDueReviewState(env);
    sources.filter(relPath => relPath !== "shared/plata-kernel.js").forEach(relPath => runSourceIfPresent(env, root, relPath));
  } else {
    loadAll(env, root);
  }
  if (spec.prepare === "started-plan") prepareStartedPlan(env);
  if (spec.prepare === "return-plan") prepareReturnPlan(env);
  return extractTodayProgram(env, spec.id, spec.expectedState, spec.forbiddenLeaks || []);
}

function buildTodayProgramReport(options = {}) {
  const root = sourceRoot(options);
  const specs = [
    {
      id: "first-session",
      expectedState: "onboarding"
    },
    {
      id: "active-saved-route",
      expectedState: "active-plan",
      seed: "weak-mastery",
      prepare: "started-plan",
      forbiddenLeaks: ["raw weak expected", "raw weak given"]
    },
    {
      id: "lesson-return",
      expectedState: "return",
      prepare: "return-plan"
    },
    {
      id: "due-memory-review",
      expectedState: "memory-review",
      seed: "due-review",
      forbiddenLeaks: ["raw due-review expected", "raw due-review given"]
    }
  ];
  const scenarios = specs.map(spec => scenario(root, spec));
  const states = Array.from(new Set(scenarios.map(item => item.program.kind))).sort();
  const issues = scenarios.flatMap(item => item.issues.map(issue => `${item.id}: ${issue}`));

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    fixedNow,
    status: issues.length ? "fail" : "pass",
    totals: {
      scenarios: scenarios.length,
      states: states.length,
      issues: issues.length
    },
    states,
    issues,
    scenarios
  };
}

function formatTodayProgramReport(report) {
  const lines = [
    "Today Program Report",
    `status: ${report.status}`,
    `scenarios: ${report.totals.scenarios}`,
    `states: ${report.states.join(", ")}`,
    "",
    "Scenarios:"
  ];
  report.scenarios.forEach(item => {
    lines.push(`- ${item.id}: ${item.status} -> ${item.program.kind} / ${item.program.headline}`);
  });
  lines.push("", "Issues:");
  if (report.issues.length) report.issues.forEach(issue => lines.push(`- ${issue}`));
  else lines.push("none");
  return lines.join("\n");
}

function writeTodayProgramReport(outPath, options = {}) {
  const root = sourceRoot(options);
  const report = buildTodayProgramReport({ root });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  if (options.text) console.log(formatTodayProgramReport(report));
  if (report.status !== "pass") {
    console.error(`today program report failed with ${report.totals.issues} issue(s)`);
    report.issues.forEach(issue => console.error(`- ${issue}`));
    process.exit(1);
  }
  if (!options.text) {
    console.log(`today program report built: ${displayRel(outPath, root)} (${report.totals.scenarios} scenario(s), ${report.totals.states} state(s))`);
  }
  return report;
}

function main() {
  const root = argValue("--root") || repoRoot;
  const out = argValue("--out") || path.join(repoRoot, ".dist", "today-program.json");
  const report = buildTodayProgramReport({ root });
  if (hasFlag("--json")) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    if (report.status !== "pass") process.exit(1);
    return;
  }
  writeTodayProgramReport(path.resolve(repoRoot, out), { root, text: hasFlag("--text") });
}

if (require.main === module) main();

module.exports = {
  buildTodayProgramReport,
  formatTodayProgramReport,
  writeTodayProgramReport
};

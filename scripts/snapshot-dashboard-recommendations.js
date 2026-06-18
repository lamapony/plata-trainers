#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const fixturePath = path.join(repoRoot, "scripts", "fixtures", "dashboard-recommendations.snapshot.json");
const fixedNow = "2026-06-08T09:00:00.000Z";
const sources = [
  "shared/plata-kernel.js",
  "shared/plata-catalog.js",
  "lessons/lesson-01/data.js",
  "lessons/lesson-b2-radiator/data.js",
  "lessons/lesson-b2-job-followup/data.js",
  "lessons/lesson-b2-ordstilling/data.js",
  "lessons/lesson-b1-bolig/data.js",
  "lessons/lesson-b1-borgerservice/data.js",
  "lessons/lesson-a2-doctor/data.js",
  "shared/plata-competencies.js",
  "shared/plata-planner.js",
  "shared/plata-evidence.js",
  "shared/plata-events.js",
  "shared/plata-memory.js",
  "shared/plata-advisor.js",
  "dashboard.js"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

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

function makeContext(initialStorage) {
  const storage = Object.assign({}, initialStorage || {});
  const elements = {
    "#trainer-cards": makeElement("div"),
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
    location: { search: "", hash: "" },
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
  return vm.runInContext(expression, env.context, { filename: "dashboard-snapshot.vm.js" });
}

function seedWeakMasteryState(env) {
  const kernel = env.context.PlataKernel;
  const state = kernel.freshState("lesson-b2-radiator-register");
  kernel.recordAttempt(state, {
    itemId: "official-reply-passive",
    correct: false,
    tags: ["B2", "lesson", "passive-agency"],
    mode: "lesson",
    expected: "De har registreret sagen, men de lover ikke en dato.",
    given: "De lover, at radiatoren bliver fikset hurtigt."
  });
  kernel.recordAttempt(state, {
    itemId: "two-registers",
    correct: true,
    tags: ["B2", "lesson", "formal-register-control"],
    mode: "lesson",
    expected: "Jeg vil gerne bede om en mere præcis dato...",
    given: "Jeg vil gerne bede om en mere præcis dato..."
  });
  env.storage[kernel.stateKey("lesson-b2-radiator-register")] = JSON.stringify(state);
}

function buildScenario(root, seed) {
  const env = makeContext();
  if (seed === "weak-mastery") {
    runSource(env, root, "shared/plata-kernel.js");
    seedWeakMasteryState(env);
    sources.filter(relPath => relPath !== "shared/plata-kernel.js").forEach(relPath => runSourceIfPresent(env, root, relPath));
  } else {
    loadAll(env, root);
  }
  return normalizeSurface(env, seed);
}

function compactStats(stats) {
  stats = stats || {};
  return {
    total: Number(stats.total || 0),
    correct: Number(stats.correct || 0),
    accuracy: stats.accuracy === undefined ? null : stats.accuracy,
    mastered: Number(stats.mastered || 0),
    totalItems: Number(stats.totalItems || 0),
    today: Number(stats.today || 0),
    lastSessionDate: stats.lastSessionDate || "",
    weakTags: (stats.weakTags || []).map(signal => signal.tag),
    weakMastery: (stats.weakMastery || []).map(signal => signal.tag),
    weakCompetencies: (stats.weakCompetencies || []).map(item => item.id)
  };
}

function compactSignal(signal) {
  if (!signal) return null;
  return {
    tag: signal.tag || "",
    label: signal.label || "",
    competencyId: signal.competencyId || signal.competency && signal.competency.id || "",
    wrong: Number(signal.wrong || signal.stats && signal.stats.wrong || 0),
    correct: Number(signal.correct || signal.stats && signal.stats.correct || 0),
    total: Number(signal.total || signal.stats && signal.stats.total || 0),
    score: Number(signal.score || signal.stats && signal.stats.score || 0),
    remediationHref: signal.remediation && signal.remediation.href || ""
  };
}

function compactCompetency(competency) {
  if (!competency) return null;
  return {
    id: competency.id || "",
    label: competency.label || "",
    score: Number(competency.score || 0),
    signalCount: Number(competency.signalCount || 0),
    primarySignal: competency.primarySignal && competency.primarySignal.tag || "",
    signals: (competency.signals || []).map(compactSignal)
  };
}

function compactTrace(trace) {
  if (!trace) return null;
  return {
    rule: trace.rule || "",
    fingerprint: trace.fingerprint || "",
    selected: {
      kind: trace.selected && trace.selected.kind || "",
      targetKind: trace.selected && trace.selected.targetKind || "",
      trainerId: trace.selected && trace.selected.trainerId || "",
      signalTag: trace.selected && trace.selected.signalTag || "",
      primaryHref: trace.selected && trace.selected.primaryHref || ""
    },
    score: Number(trace.score || 0),
    scoreBreakdown: (trace.scoreBreakdown || []).map(part => ({
      label: part.label || "",
      value: Number(part.value || 0)
    })),
    inputs: compactTraceInputs(trace.inputs || {}),
    reasons: (trace.reasons || []).slice()
  };
}

function compactTraceInputs(inputs) {
  const out = {};
  if (inputs.trainer) out.trainer = inputs.trainer;
  if (inputs.stats) out.stats = inputs.stats;
  if (inputs.threshold !== undefined) out.threshold = inputs.threshold;
  if (inputs.weakMasteryCount !== undefined) out.weakMasteryCount = inputs.weakMasteryCount;
  if (inputs.weakTagCount !== undefined) out.weakTagCount = inputs.weakTagCount;
  if (inputs.weakCompetencyCount !== undefined) out.weakCompetencyCount = inputs.weakCompetencyCount;
  if (inputs.memoryFactCount !== undefined) out.memoryFactCount = inputs.memoryFactCount;
  if (inputs.selectedSignal) out.selectedSignal = inputs.selectedSignal;
  if (inputs.selectedCompetency) out.selectedCompetency = inputs.selectedCompetency;
  if (inputs.selectedMemoryFacts) out.selectedMemoryFacts = inputs.selectedMemoryFacts;
  return out;
}

function compactExplanation(explanation) {
  if (!explanation) return null;
  return {
    label: explanation.label || "",
    copy: explanation.copy || "",
    facts: (explanation.facts || []).slice(),
    source: explanation.source || ""
  };
}

function compactDecision(decision) {
  decision = decision || {};
  return {
    kind: decision.kind || "",
    targetKind: decision.targetKind || "",
    trainerId: decision.trainerId || "",
    signalTag: decision.signalTag || "",
    score: Number(decision.score || 0),
    badge: decision.badge || decision.eyebrow || "",
    title: decision.title || "",
    primaryLabel: decision.primaryLabel || "",
    primaryHref: decision.primaryHref || "",
    meta: decision.meta || "",
    reasons: (decision.reasons || []).slice(),
    competency: decision.competency ? {
      id: decision.competency.id || "",
      label: decision.competency.label || "",
      signalCount: Number(decision.competency.signalCount || 0)
    } : null,
    repair: decision.repair ? {
      cta: decision.repair.cta || "",
      action: decision.repair.action || "",
      sceneId: decision.repair.sceneId || "",
      href: decision.repair.href || ""
    } : null,
    signals: (decision.signals || []).map(compactSignal),
    trace: compactTrace(decision.trace)
  };
}

function compactCandidate(item) {
  return {
    trainerId: item.trainer && item.trainer.id || "",
    trainerName: item.trainer && item.trainer.name || "",
    index: Number(item.index || 0),
    stats: compactStats(item.stats),
    decision: compactDecision(item.decision)
  };
}

function compactCandidateSummary(item) {
  const decision = item.decision || {};
  return {
    trainerId: item.trainer && item.trainer.id || "",
    total: Number(item.stats && item.stats.total || 0),
    accuracy: item.stats && item.stats.accuracy === undefined ? null : item.stats && item.stats.accuracy,
    weakMastery: (item.stats && item.stats.weakMastery || []).map(signal => signal.tag),
    decision: {
      kind: decision.kind || "",
      trainerId: decision.trainerId || "",
      signalTag: decision.signalTag || "",
      score: Number(decision.score || 0),
      title: decision.title || "",
      primaryHref: decision.primaryHref || "",
      traceRule: decision.trace && decision.trace.rule || "",
      traceFingerprint: decision.trace && decision.trace.fingerprint || ""
    }
  };
}

function compactPlan(plan, planner) {
  if (!plan) return null;
  return {
    kind: plan.kind || "",
    title: plan.title || "",
    fingerprint: plan.fingerprint || "",
    planToken: plan.planToken || "",
    meta: plan.meta || "",
    completedCount: Number(plan.completedCount || 0),
    openCount: Number(plan.openCount || 0),
    primaryStepRouteId: plan.primaryStep && plan.primaryStep.routeId || "",
    steps: (plan.steps || []).map(step => ({
      number: Number(step.number || 0),
      routeId: step.routeId || "",
      kind: step.kind || "",
      targetKind: step.targetKind || "",
      trainerId: step.trainerId || "",
      signalTag: step.signalTag || "",
      title: step.title || "",
      primaryLabel: step.primaryLabel || "",
      primaryHref: step.primaryHref || "",
      routedHref: planner && planner.planStepHref ? planner.planStepHref(plan, step) : step.primaryHref || "",
      minutes: step.minutes || "",
      score: Number(step.score || 0),
      attemptsAtStart: Number(step.attemptsAtStart || 0),
      status: step.status || "",
      statusLabel: step.statusLabel || "",
      competency: step.competency ? {
        id: step.competency.id || "",
        label: step.competency.label || "",
        signalCount: Number(step.competency.signalCount || 0)
      } : null,
      explanation: compactExplanation(step.explanation),
      trace: compactTrace(step.trace)
    }))
  };
}

function compactLedgerEntry(entry) {
  return {
    kind: entry.kind || "",
    status: entry.status || "",
    title: entry.title || "",
    trainerId: entry.trainer && entry.trainer.id || "",
    score: Number(entry.score || 0),
    facts: (entry.facts || []).slice()
  };
}

function compactAdvisorReceipt(receipt) {
  if (!receipt || !receipt.advice) return null;
  const advice = receipt.advice || {};
  const trace = advice.trace || {};
  return {
    kind: advice.kind || "",
    title: advice.title || "",
    advice: advice.advice || "",
    nextAction: {
      label: advice.nextAction && advice.nextAction.label || "",
      href: receipt.actionHref || advice.nextAction && advice.nextAction.href || ""
    },
    citedFacts: (advice.citedFacts || []).map(fact => ({
      id: fact.id || "",
      kind: fact.kind || "",
      signal: fact.signal || "",
      sourceFingerprint: fact.sourceFingerprint || ""
    })),
    guardrails: {
      deterministic: !!(advice.guardrails && advice.guardrails.deterministic),
      requiresModel: !!(advice.guardrails && advice.guardrails.requiresModel),
      usesOnlyCitedFacts: !!(advice.guardrails && advice.guardrails.usesOnlyCitedFacts),
      containsRawAnswerText: !!(advice.guardrails && advice.guardrails.containsRawAnswerText)
    },
    traceRule: trace.rule || "",
    traceFingerprint: trace.fingerprint || ""
  };
}

function normalizeSurface(env, seed) {
  const candidates = invoke(env, "dashboardCandidates()");
  const planner = env.context.PlataPlanner;
  const graph = env.context.PlataCompetencies;
  const due = planner.rankDashboardDecisions(candidates, 3);
  const activePlan = planner.planStatus(planner.readPracticePlan(), candidates);
  const advisorReceipt = invoke(env, "advisorReceiptForPlan(PlataPlanner.planStatus(PlataPlanner.readPracticePlan(), dashboardCandidates()))");
  const ledger = invoke(env, "buildEvidenceLedger()");
  const weakSignals = candidates.flatMap(item => (item.stats.weakMastery || []).map(signal => ({
    ...signal,
    trainerId: item.trainer.id,
    trainerName: item.trainer.name
  })));
  const competencies = graph.rank(weakSignals, 6);

  assert(candidates.length === env.context.PlataCatalog.trainers.length, `${seed}: candidate count drifted`);
  assert(activePlan && activePlan.steps.length, `${seed}: dashboard did not compile an active practice plan`);

  return {
    id: seed,
    candidateOrder: candidates.map(item => item.trainer.id),
    candidates: candidates.map(compactCandidateSummary),
    due: due.map(compactCandidate),
    practicePlan: compactPlan(activePlan, planner),
    advisorReceipt: compactAdvisorReceipt(advisorReceipt),
    evidenceLedger: ledger.map(compactLedgerEntry),
    weakCompetencies: competencies.map(compactCompetency)
  };
}

function buildDashboardRecommendationSnapshot(options = {}) {
  const root = sourceRoot(options);
  return {
    schemaVersion: 1,
    fixedNow,
    scenarios: [
      buildScenario(root, "empty-profile"),
      buildScenario(root, "weak-mastery")
    ]
  };
}

function snapshotText(snapshot) {
  return JSON.stringify(snapshot, null, 2) + "\n";
}

function firstDiff(expected, actual) {
  const expectedLines = expected.split("\n");
  const actualLines = actual.split("\n");
  const max = Math.max(expectedLines.length, actualLines.length);
  for (let i = 0; i < max; i++) {
    if (expectedLines[i] !== actualLines[i]) {
      return [
        `first diff at line ${i + 1}`,
        `expected: ${expectedLines[i] === undefined ? "(missing)" : expectedLines[i]}`,
        `actual:   ${actualLines[i] === undefined ? "(missing)" : actualLines[i]}`
      ].join("\n");
    }
  }
  return "snapshot differs";
}

function writeSnapshot(outPath, snapshot) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, snapshotText(snapshot));
}

function run() {
  const snapshot = buildDashboardRecommendationSnapshot({ root: argValue("--root") || repoRoot });
  if (hasFlag("--json")) {
    process.stdout.write(snapshotText(snapshot));
    return;
  }
  const out = argValue("--out");
  if (out) writeSnapshot(path.resolve(repoRoot, out), snapshot);

  if (hasFlag("--update")) {
    writeSnapshot(fixturePath, snapshot);
    console.log(`dashboard recommendation snapshot updated: ${path.relative(repoRoot, fixturePath)}`);
    return;
  }

  const actual = snapshotText(snapshot);
  const expected = fs.readFileSync(fixturePath, "utf8");
  if (actual !== expected) {
    console.error("dashboard recommendation snapshot changed");
    console.error(firstDiff(expected, actual));
    console.error("Run `node scripts/snapshot-dashboard-recommendations.js --update` if this recommendation change is intentional.");
    process.exit(1);
  }
  console.log("ok - dashboard recommendation snapshot matches fixture");
}

if (require.main === module) run();

module.exports = {
  buildDashboardRecommendationSnapshot,
  snapshotText
};

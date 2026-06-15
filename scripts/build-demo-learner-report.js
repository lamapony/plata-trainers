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
    disabled: false,
    style: {},
    children: [],
    files: [],
    attributes: {},
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
      return this.attributes[name] || null;
    }
  };
}

function makeContext() {
  const storage = {};
  const elements = {
    "#trainer-cards": makeElement("div"),
    "#demo-profile": makeElement("section"),
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
    location: { search: "?demo=learner", hash: "" },
    URL: {
      createObjectURL(blob) {
        context.__lastBlob = blob;
        return "blob:demo-learner-report";
      },
      revokeObjectURL() {}
    },
    Blob: function Blob(parts, blobOptions) {
      this.parts = parts || [];
      this.options = blobOptions || {};
      context.__lastBlob = this;
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
  return vm.runInContext(expression, env.context, { filename: "demo-learner-report.vm.js" });
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function buildDemoLearnerReport(options = {}) {
  const root = sourceRoot(options);
  const env = makeContext();
  loadAll(env, root);
  invoke(env, "renderDashboard()");

  const extracted = invoke(env, `(() => {
    const candidates = dashboardCandidates();
    const resolved = resolvePracticePlan(candidates);
    const planner = resolved.planner;
    const plan = resolved.plan;
    const step = plan && !plan.completed ? (planner.actionablePracticePlanStep ? planner.actionablePracticePlanStep(plan) : plan.primaryStep) : null;
    const receipt = advisorReceiptForPlan(plan);
    const memoryBundle = buildMemoryFacts(null, plan);
    const states = collectTrainerStates();
    const trainerRows = profileTrainerEntries(states).map(entry => ({
      trainerId: entry.trainer.id,
      trainerName: entry.trainer.name,
      totalAttempts: Number(entry.state && entry.state.meta && entry.state.meta.totalAttempts || 0),
      totalCorrect: Number(entry.state && entry.state.meta && entry.state.meta.totalCorrect || 0),
      lastSessionDate: entry.state && entry.state.meta && entry.state.meta.lastSessionDate || "",
      itemIds: Object.keys(entry.state && entry.state.byItemId || {}).sort()
    }));
    const totalAttempts = trainerRows.reduce((sum, row) => sum + row.totalAttempts, 0);
    const totalCorrect = trainerRows.reduce((sum, row) => sum + row.totalCorrect, 0);
    return {
      routeSearch: location.search || "",
      trainerRows,
      totalAttempts,
      totalCorrect,
      accuracy: totalAttempts ? Math.round(totalCorrect / totalAttempts * 100) : null,
      candidates: candidates.map(item => ({
        trainerId: item.trainer.id,
        decisionKind: item.decision && item.decision.kind || "",
        title: item.decision && item.decision.title || "",
        signalTag: item.decision && item.decision.signalTag || ""
      })),
      plan: {
        kind: plan && plan.kind || "",
        title: plan && plan.title || "",
        planToken: plan && plan.planToken || "",
        completedCount: Number(plan && plan.completedCount || 0),
        openCount: Number(plan && plan.openCount || 0),
        stepCount: plan && plan.steps ? plan.steps.length : 0,
        steps: (plan && plan.steps || []).map(planStep => ({
          number: Number(planStep.number || 0),
          kind: planStep.kind || "",
          status: planStep.status || "",
          trainerId: planStep.trainerId || "",
          signalTag: planStep.signalTag || "",
          title: planStep.title || "",
          primaryHref: planStep.primaryHref || "",
          routeId: planStep.routeId || "",
          selectedMemoryFacts: (((planStep.trace || {}).inputs || {}).selectedMemoryFacts || []).map(fact => ({
            id: fact.id || "",
            kind: fact.kind || "",
            signal: fact.signal || "",
            sourceFingerprint: fact.sourceFingerprint || ""
          }))
        }))
      },
      actionableStep: step ? {
        number: Number(step.number || 0),
        kind: step.kind || "",
        status: step.status || "",
        trainerId: step.trainerId || "",
        signalTag: step.signalTag || "",
        title: step.title || ""
      } : null,
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
        }))
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

  const todayStripped = stripHtml(env.elements["#today-program"].innerHTML);
  const rendered = {
    banner: stripHtml(env.elements["#demo-profile"].innerHTML),
    today: todayStripped.slice(0, 900),
    practicePlan: stripHtml(env.elements["#practice-plan"].innerHTML).slice(0, 420),
    evidence: stripHtml(env.elements["#evidence-ledger"].innerHTML).slice(0, 420),
    memory: stripHtml(env.elements["#memory-facts"].innerHTML).slice(0, 420),
    importDisabled: !!env.elements["#import-trigger"].disabled,
    exportLabel: env.elements["#export-all"].textContent || ""
  };
  const storageWrites = Object.keys(env.storage).sort();
  const issues = [];
  const facts = extracted.memory.visibleFacts.map(compactFact);
  const factKinds = Array.from(new Set(facts.map(fact => fact.kind))).sort();
  const factSignals = Array.from(new Set(facts.map(fact => fact.signal).filter(Boolean))).sort();
  const selectedFacts = (extracted.plan.steps || []).flatMap(step => step.selectedMemoryFacts || []);
  const rawJson = JSON.stringify({ extracted, rendered });
  const forbiddenLeaks = ["raw weak", "raw due-review", "De lover, at radiatoren bliver fikset hurtigt."];

  if (extracted.routeSearch !== "?demo=learner") issues.push("demo route search drifted");
  if (!rendered.banner.includes("Sample B2 plateau profile")) issues.push("demo banner missing");
  if (!todayStripped.includes("Study companion")) issues.push("Today surface is not companion-backed");
  if (todayStripped.toLowerCase().includes("onboarding")) issues.push("demo Today surface fell back to onboarding");
  if (!todayStripped.includes("Cited memory")) issues.push("Today surface does not cite memory");
  if (!rendered.importDisabled) issues.push("demo import is not disabled");
  if (storageWrites.length) issues.push(`demo wrote localStorage keys: ${storageWrites.join(", ")}`);
  if (extracted.totalAttempts !== 8) issues.push(`expected 8 demo attempts, got ${extracted.totalAttempts}`);
  if (extracted.accuracy !== 50) issues.push(`expected 50% demo accuracy, got ${extracted.accuracy}`);
  if (extracted.plan.kind !== "repair") issues.push(`expected repair plan, got ${extracted.plan.kind}`);
  if (extracted.plan.stepCount < 2) issues.push("demo plan should have at least two steps");
  if (!extracted.companion || !extracted.companion.fingerprint) issues.push("demo companion receipt missing fingerprint");
  if (facts.length < 7) issues.push(`expected at least 7 visible memory facts, got ${facts.length}`);
  ["root_competency_trap", "recurring_trap", "weak_signal", "next_review_due"].forEach(kind => {
    if (!factKinds.includes(kind)) issues.push(`missing memory fact kind ${kind}`);
  });
  ["agency", "passive-agency", "understatement-with-agency", "professional-email-agency", "process-patience"].forEach(signal => {
    if (!factSignals.includes(signal)) issues.push(`missing memory signal ${signal}`);
  });
  if (!selectedFacts.some(fact => fact.kind === "root_competency_trap")) issues.push("plan does not select root competency memory");
  if (!selectedFacts.every(fact => fact.sourceFingerprint)) issues.push("selected memory fact missing source fingerprint");
  forbiddenLeaks.forEach(text => {
    if (rawJson.includes(text)) issues.push(`raw learner text leaked: ${text}`);
  });

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    fixedNow,
    status: issues.length ? "fail" : "pass",
    url: "dashboard.html?demo=learner",
    totals: {
      attempts: extracted.totalAttempts,
      correct: extracted.totalCorrect,
      accuracy: extracted.accuracy,
      trainers: extracted.trainerRows.filter(row => row.totalAttempts > 0).length,
      candidates: extracted.candidates.length,
      planSteps: extracted.plan.stepCount,
      visibleMemoryFacts: facts.length,
      memoryFactKinds: factKinds.length,
      storageWrites: storageWrites.length,
      issues: issues.length
    },
    guarantees: [
      { key: "read-only-storage", label: "Demo learner renders without localStorage writes", pass: storageWrites.length === 0 },
      { key: "companion-backed-today", label: "Today surface is companion-backed and cites memory", pass: todayStripped.includes("Study companion") && todayStripped.includes("Cited memory") },
      { key: "rich-returning-profile", label: "Demo profile contains attempts, weak signals, root skill memory, and due review", pass: facts.length >= 7 && factKinds.includes("root_competency_trap") && factKinds.includes("next_review_due") },
      { key: "privacy-no-raw-answers", label: "Report excludes raw learner answer text", pass: forbiddenLeaks.every(text => !rawJson.includes(text)) }
    ],
    issues,
    storageWrites,
    rendered,
    profile: {
      routeSearch: extracted.routeSearch,
      trainerRows: extracted.trainerRows,
      totalAttempts: extracted.totalAttempts,
      totalCorrect: extracted.totalCorrect,
      accuracy: extracted.accuracy
    },
    plan: extracted.plan,
    actionableStep: extracted.actionableStep,
    memory: {
      fingerprint: extracted.memory.fingerprint,
      summary: extracted.memory.summary,
      factKinds,
      factSignals,
      visibleFacts: facts
    },
    companion: extracted.companion
  };
}

function formatDemoLearnerReport(report) {
  const lines = [
    "Demo Learner Report",
    `status: ${report.status}`,
    `url: ${report.url}`,
    `attempts: ${report.totals.attempts}`,
    `visible memory facts: ${report.totals.visibleMemoryFacts}`,
    `plan steps: ${report.totals.planSteps}`,
    "",
    "Guarantees:"
  ];
  report.guarantees.forEach(item => {
    lines.push(`- ${item.pass ? "pass" : "fail"} ${item.key}: ${item.label}`);
  });
  lines.push("", "Issues:");
  if (report.issues.length) report.issues.forEach(issue => lines.push(`- ${issue}`));
  else lines.push("none");
  return lines.join("\n");
}

function writeDemoLearnerReport(outPath, options = {}) {
  const root = sourceRoot(options);
  const report = buildDemoLearnerReport({ root });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  if (options.text) console.log(formatDemoLearnerReport(report));
  if (report.status !== "pass") {
    console.error(`demo learner report failed with ${report.totals.issues} issue(s)`);
    report.issues.forEach(issue => console.error(`- ${issue}`));
    process.exit(1);
  }
  if (!options.text) {
    console.log(`demo learner report built: ${displayRel(outPath, root)} (${report.totals.visibleMemoryFacts} memory fact(s), ${report.totals.planSteps} plan step(s))`);
  }
  return report;
}

function main() {
  const root = argValue("--root") || repoRoot;
  const out = argValue("--out") || path.join(repoRoot, ".dist", "demo-learner.json");
  const report = buildDemoLearnerReport({ root });
  if (hasFlag("--json")) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    if (report.status !== "pass") process.exit(1);
    return;
  }
  writeDemoLearnerReport(path.resolve(repoRoot, out), { root, text: hasFlag("--text") });
}

if (require.main === module) main();

module.exports = {
  buildDemoLearnerReport,
  formatDemoLearnerReport,
  writeDemoLearnerReport
};

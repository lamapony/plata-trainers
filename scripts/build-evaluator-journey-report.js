#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { buildDemoLearnerReport } = require("./build-demo-learner-report.js");
const { buildGuidedSessionReport } = require("./build-guided-session-report.js");
const { buildEvaluatorPathReport } = require("./build-evaluator-path-report.js");
const { buildCapabilityMap } = require("./build-capability-map.js");

const repoRoot = path.resolve(__dirname, "..");
const fixedNow = "2026-06-08T09:00:00.000Z";
const dashboardSources = [
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

function hasId(html, id) {
  return new RegExp(`\\bid="${String(id || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`, "i").test(String(html || ""));
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

function localUrl(href) {
  return new URL(String(href || ""), "https://plata.local/");
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

function makeDashboardContext(locationSearch) {
  const storage = {};
  const writes = [];
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
    location: {
      search: locationSearch || "",
      hash: "#due"
    },
    URL: {
      createObjectURL(blob) {
        context.__lastBlob = blob;
        return "blob:evaluator-journey";
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
        writes.push({ key, value: String(value) });
        storage[key] = String(value);
      },
      removeItem(key) {
        writes.push({ key, value: null });
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
  return { context, elements, storage, writes };
}

function runDashboardSource(env, root, relPath) {
  vm.runInContext(readText(root, relPath), env.context, { filename: relPath });
}

function renderDemoReturnTrace(root, demo) {
  const step = demo && demo.plan && demo.plan.steps && demo.plan.steps[0] || null;
  const planToken = demo && demo.plan && demo.plan.planToken || "";
  const stepRouteId = step && step.routeId || "";
  const search = `?demo=learner&ledger-return=1&plan=${encodeURIComponent(planToken)}&step=${encodeURIComponent(stepRouteId)}`;
  const env = makeDashboardContext(search);
  dashboardSources.forEach(relPath => {
    if (!fs.existsSync(path.join(root, relPath))) return;
    runDashboardSource(env, root, relPath);
  });
  const todayText = stripHtml(env.elements["#today-program"].innerHTML);
  const practicePlanHtml = env.elements["#practice-plan"].innerHTML;
  const practicePlanText = stripHtml(env.elements["#practice-plan"].innerHTML);
  const guidedText = stripHtml(env.elements["#guided-session-panel"].innerHTML);
  const demoText = stripHtml(env.elements["#demo-profile"].innerHTML);
  const receiptIndex = practicePlanHtml.indexOf("plan-return-receipt");
  const returnReceiptText = receiptIndex === -1 ? "" : stripHtml(practicePlanHtml.slice(Math.max(0, receiptIndex - 80)));
  const issues = [];

  if (!planToken) issues.push("demo return route is missing plan token");
  if (!stepRouteId) issues.push("demo return route is missing step route id");
  if (!/Progress recorded/.test(todayText)) issues.push("dashboard return Today state did not render progress recorded");
  if (!/Step recorded\. Continue the route\./.test(todayText)) issues.push("dashboard return Today state did not confirm the recorded step");
  if (!/Return/.test(todayText)) issues.push("dashboard return Today state did not expose the return stage");
  if (!/plan-return-receipt/.test(practicePlanHtml)) issues.push("dashboard return receipt did not render");
  if (!/Step 1 recorded/.test(practicePlanText)) issues.push("dashboard return receipt did not name the returned step");
  if (!/Continue next step/.test(practicePlanText)) issues.push("dashboard return receipt did not offer the next step");
  if (!/Guided session|Walkthrough/.test(guidedText)) issues.push("dashboard guided session panel did not render on return");
  if (!/See what Platå notices after a few sessions/.test(demoText)) issues.push("dashboard return did not stay on the demo learner profile");
  if (env.writes.length) issues.push(`dashboard demo return wrote localStorage keys: ${env.writes.map(item => item.key).join(", ")}`);

  return {
    status: issues.length ? "fail" : "pass",
    url: `dashboard.html${search}#due`,
    planToken,
    stepRouteId,
    storageWrites: env.writes.map(item => item.key).sort(),
    rendered: {
      today: todayText.slice(0, 700),
      practicePlan: practicePlanText.slice(0, 900),
      returnReceipt: returnReceiptText.slice(0, 520),
      guidedSession: guidedText.slice(0, 700),
      demoProfile: demoText.slice(0, 260)
    },
    issues
  };
}

function distributionGateStatus(root) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const scripts = pkg.scripts || {};
  const command = scripts["check:distribution"] || "";
  const inCheck = String(scripts.check || "").includes("check:distribution");
  if (!command || !inCheck) return "fail";
  const sourcePath = command.replace(/^node\s+/, "").trim();
  if (sourcePath && !fs.existsSync(path.join(root, sourcePath))) return "fail";
  return "pass";
}

function stage(id, title, url, assertions, evidence = {}) {
  const issues = assertions.filter(item => !item.pass).map(item => item.issue);
  return {
    id,
    title,
    url,
    status: issues.length ? "fail" : "pass",
    assertions,
    evidence,
    issues
  };
}

function buildEvaluatorJourneyReport(options = {}) {
  const root = sourceRoot(options);
  const indexHtml = options.indexHtml || readText(root, "index.html");
  const proofHtml = options.proofHtml || readText(root, "proof.html");
  const demo = options.demo || buildDemoLearnerReport({ root });
  const guided = options.guided || buildGuidedSessionReport({ root });
  const capabilities = options.capabilities || buildCapabilityMap({ root });
  const evaluator = options.evaluator || buildEvaluatorPathReport({ root, demo, guided, capabilities });
  const returnTrace = options.returnTrace || renderDemoReturnTrace(root, demo);
  const memoryBacked = (guided.scenarios || []).find(item => item.id === "memory-backed-repair") || {};
  const session = memoryBacked.session || {};
  const route = session.route || {};
  const routeUrl = localUrl(route.href || "");
  const proofCapability = (capabilities.capabilities || []).find(item => item.id === "public-github-proof-surface") || {};
  const proofGates = (proofCapability.proofGates || []).map(gate => gate.id);
  const proofReports = (proofCapability.publicReports || []).map(report => report.id);
  const demoStep = demo.plan && demo.plan.steps && demo.plan.steps[0] || {};
  const outcome = guided.outcomeLedger && guided.outcomeLedger.outcomes && guided.outcomeLedger.outcomes[0] || {};
  const distributionGateStatusValue = options.distributionGateStatus || distributionGateStatus(root);

  const stages = [
    stage("home-evaluator-entry", "Start at the public evaluator entry", "index.html#evaluate", [
      { key: "home-has-evaluate", pass: /id="evaluate"/.test(indexHtml), issue: "home page is missing #evaluate" },
      { key: "links-demo", pass: evaluator.entry.links.some(link => link.href === "./dashboard.html?demo=learner"), issue: "home evaluator entry does not link the demo learner" },
      { key: "links-proof-walkthrough", pass: evaluator.entry.links.some(link => link.href === "./proof.html#proof-walkthrough-title"), issue: "home evaluator entry does not link the proof walkthrough" },
      { key: "no-report-shortcut", pass: !/href="\.\.?\/?reports\//i.test(indexHtml), issue: "home page links directly to generated reports" }
    ], { links: evaluator.entry.links.map(link => ({ href: link.href, text: link.text })) }),
    stage("demo-learner-dashboard", "Open the read-only demo learner", demo.url || "dashboard.html?demo=learner", [
      { key: "demo-report-pass", pass: demo.status === "pass", issue: "demo learner report is not passing" },
      { key: "demo-read-only", pass: demo.totals && demo.totals.storageWrites === 0, issue: "demo learner dashboard is not read-only" },
      { key: "demo-has-memory", pass: demo.totals && demo.totals.visibleMemoryFacts >= 7, issue: "demo learner does not expose rich memory facts" },
      { key: "demo-actionable-step", pass: Boolean(demoStep.primaryHref && demoStep.routeId), issue: "demo learner has no actionable route step" },
      { key: "demo-companion-cited", pass: Boolean(demo.companion && demo.companion.fingerprint && (demo.companion.citedFacts || []).length), issue: "demo learner companion receipt is missing cited facts" }
    ], {
      planToken: demo.plan && demo.plan.planToken || "",
      stepRouteId: demoStep.routeId || "",
      primaryHref: demoStep.primaryHref || "",
      companionFingerprint: demo.companion && demo.companion.fingerprint || ""
    }),
    stage("proof-walkthrough", "Inspect the proof walkthrough", "proof.html#proof-walkthrough-title", [
      { key: "proof-target-exists", pass: hasId(proofHtml, "proof-walkthrough-title"), issue: "proof walkthrough target missing" },
      { key: "proof-container-exists", pass: hasId(proofHtml, "proof-walkthrough"), issue: "proof walkthrough container missing" },
      { key: "proof-page-cites-journey", pass: proofGates.includes("check:evaluator-journey"), issue: "public proof capability does not cite check:evaluator-journey" },
      { key: "journey-report-cited", pass: proofReports.includes("evaluator-journey"), issue: "public proof capability does not cite evaluator journey report" }
    ], { report: "reports/evaluator-journey.json" }),
    stage("distribution-proof", "Inspect offline distribution proof", "proof.html#proof-distribution-title", [
      { key: "distribution-target-exists", pass: hasId(proofHtml, "proof-distribution-title"), issue: "proof distribution hash target missing" },
      { key: "distribution-container-exists", pass: hasId(proofHtml, "proof-distribution"), issue: "proof distribution container missing" },
      { key: "distribution-gate-pass", pass: distributionGateStatusValue === "pass", issue: "check:distribution gate is not passing" },
      { key: "distribution-zip-contract", pass: /Standalone ZIP for backend-free review/.test(proofHtml), issue: "proof page does not explain the offline distribution bundle" }
    ], {
      gate: "check:distribution",
      gateStatus: distributionGateStatusValue,
      zipPath: ".dist/plata-offline-bundle.zip",
      manifestPath: ".dist/plata-offline-bundle.manifest.json"
    }),
    stage("guided-session-route", "Follow the guided session route", route.href || "", [
      { key: "guided-report-pass", pass: guided.status === "pass", issue: "guided session report is not passing" },
      { key: "memory-backed-ready", pass: memoryBacked.status === "pass" && session.status === "ready", issue: "memory-backed guided session is not ready" },
      { key: "route-has-query-plan", pass: Boolean(routeUrl.searchParams.get("plan")), issue: "guided session route does not expose plan query parameter" },
      { key: "route-has-query-step", pass: Boolean(routeUrl.searchParams.get("step")), issue: "guided session route does not expose step query parameter" },
      { key: "route-hash-preserved", pass: Boolean(routeUrl.hash), issue: "guided session route does not preserve the lesson hash target" },
      { key: "route-token-match", pass: routeUrl.searchParams.get("plan") === route.planToken && routeUrl.searchParams.get("step") === route.stepRouteId, issue: "guided session route query tokens do not match the session route" },
      { key: "four-guided-steps", pass: (session.steps || []).length === 4, issue: "guided session does not expose four learner-facing steps" }
    ], {
      planToken: route.planToken || "",
      stepRouteId: route.stepRouteId || "",
      hash: routeUrl.hash || "",
      sessionFingerprint: session.fingerprint || ""
    }),
    stage("dashboard-return", "Return to the dashboard with route evidence", returnTrace.url, [
      { key: "return-render-pass", pass: returnTrace.status === "pass", issue: "dashboard return trace did not render cleanly" },
      { key: "return-demo-read-only", pass: returnTrace.storageWrites.length === 0, issue: "dashboard demo return wrote localStorage" },
      { key: "return-plan-token", pass: returnTrace.planToken === (demo.plan && demo.plan.planToken), issue: "dashboard return plan token drifted from demo plan" },
      { key: "return-step-token", pass: returnTrace.stepRouteId === demoStep.routeId, issue: "dashboard return step token drifted from demo step" },
      { key: "outcome-receipt-exists", pass: Boolean(outcome.fingerprint && (outcome.outcomeReceipt || {}).citedFacts && outcome.outcomeReceipt.citedFacts.length), issue: "guided outcome receipt is missing cited facts" }
    ], {
      planToken: returnTrace.planToken,
      stepRouteId: returnTrace.stepRouteId,
      outcomeFingerprint: outcome.fingerprint || "",
      rendered: returnTrace.rendered
    })
  ];

  const issues = [
    ...stages.flatMap(item => item.issues.map(issue => `${item.id}: ${issue}`)),
    ...returnTrace.issues.map(issue => `dashboard-return: ${issue}`)
  ];
  const traceSource = stages.map(item => ({
    id: item.id,
    url: item.url,
    status: item.status,
    evidence: item.evidence
  }));

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    fixedNow,
    status: issues.length ? "fail" : "pass",
    traceId: `evaljourney-${stableHash(stableJson(traceSource))}`,
    entry: "index.html#evaluate",
    exit: returnTrace.url,
    totals: {
      stages: stages.length,
      passedStages: stages.filter(item => item.status === "pass").length,
      issues: issues.length,
      storageWrites: returnTrace.storageWrites.length
    },
    guarantees: [
      { key: "one-public-entry", label: "Journey starts from the public home evaluator entry", pass: stages[0].status === "pass" },
      { key: "read-only-demo", label: "Demo learner and demo return do not write local storage", pass: demo.totals && demo.totals.storageWrites === 0 && returnTrace.storageWrites.length === 0 },
      { key: "proof-walkthrough-targeted", label: "Proof walkthrough has a stable public hash target and public report citation", pass: stages[2].status === "pass" },
      { key: "distribution-proof-targeted", label: "Offline distribution proof has a stable hash target and passing publish gate", pass: stages[3].status === "pass" },
      { key: "guided-route-handoff", label: "Guided route carries plan and step query tokens before the lesson hash", pass: stages[4].status === "pass" },
      { key: "dashboard-return-rendered", label: "Dashboard renders a return receipt from plan and step ids", pass: stages[5].status === "pass" }
    ],
    stages,
    returnTrace,
    issues
  };
}

function formatEvaluatorJourneyReport(report) {
  const lines = [
    "Evaluator Journey Report",
    `status: ${report.status}`,
    `trace: ${report.traceId}`,
    `entry: ${report.entry}`,
    `exit: ${report.exit}`,
    `stages: ${report.totals.passedStages}/${report.totals.stages}`,
    "",
    "Guarantees:"
  ];
  report.guarantees.forEach(item => {
    lines.push(`- ${item.pass ? "pass" : "fail"} ${item.key}: ${item.label}`);
  });
  lines.push("", "Stages:");
  report.stages.forEach(item => {
    lines.push(`- ${item.status} ${item.id}: ${item.url}`);
  });
  lines.push("", "Issues:");
  if (report.issues.length) report.issues.forEach(issue => lines.push(`- ${issue}`));
  else lines.push("none");
  return lines.join("\n");
}

function writeEvaluatorJourneyReport(outPath, options = {}) {
  const root = sourceRoot(options);
  const report = buildEvaluatorJourneyReport({ root });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  if (options.text) console.log(formatEvaluatorJourneyReport(report));
  if (report.status !== "pass") {
    console.error(`evaluator journey report failed with ${report.totals.issues} issue(s)`);
    report.issues.forEach(issue => console.error(`- ${issue}`));
    process.exit(1);
  }
  if (!options.text) {
    console.log(`evaluator journey report built: ${displayRel(outPath, root)} (${report.totals.stages} stage(s), ${report.traceId})`);
  }
  return report;
}

function main() {
  const root = argValue("--root") || repoRoot;
  const out = argValue("--out") || path.join(repoRoot, ".dist", "evaluator-journey.json");
  const report = buildEvaluatorJourneyReport({ root });
  if (hasFlag("--json")) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    if (report.status !== "pass") process.exit(1);
    return;
  }
  writeEvaluatorJourneyReport(path.resolve(repoRoot, out), { root, text: hasFlag("--text") });
}

if (require.main === module) main();

module.exports = {
  buildEvaluatorJourneyReport,
  formatEvaluatorJourneyReport,
  writeEvaluatorJourneyReport
};

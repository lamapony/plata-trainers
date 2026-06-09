#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildDemoLearnerReport } = require("./build-demo-learner-report.js");
const { buildCapabilityMap } = require("./build-capability-map.js");
const {
  buildEvaluatorPathReport,
  formatEvaluatorPathReport
} = require("./build-evaluator-path-report.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function capability(report, id) {
  return (report.capabilities || []).find(item => item.id === id) || null;
}

function runBaseSmoke() {
  const report = buildEvaluatorPathReport();
  assert(report.status === "pass", `evaluator path should pass:\n${report.issues.join("\n")}`);
  assert(report.entry.links.some(link => link.href === "./dashboard.html?demo=learner"), "evaluator path should link the demo learner");
  assert(report.entry.links.some(link => link.href === "./proof.html#proof-guided-title"), "evaluator path should link guided proof");
  assert(report.backingReports.capabilityMap.proofSurfaceReports.includes("evaluator-path"), "evaluator path should be cited as a public proof report");
  assert(report.backingReports.demoLearner.storageWrites === 0, "evaluator demo should stay read-only");
  assert(report.backingReports.guidedSession.outcomeReceipts >= 1, "evaluator guided proof should expose outcome receipts");
}

function runMutationSmoke() {
  const missingGuided = buildEvaluatorPathReport({
    indexHtml: readText(repoRoot, "index.html").replace("./proof.html#proof-guided-title", "./proof.html#missing-guided-title")
  });
  assert(missingGuided.status === "fail", "evaluator path should fail when guided proof link drifts");
  assert(missingGuided.issues.some(issue => issue.includes("guided proof link")), "evaluator path should explain the missing guided proof link");

  const readOnlyDemo = buildDemoLearnerReport();
  const demoWrites = buildEvaluatorPathReport({
    demo: Object.assign({}, readOnlyDemo, {
      totals: Object.assign({}, readOnlyDemo.totals, { storageWrites: 1 })
    })
  });
  assert(demoWrites.status === "fail", "evaluator path should fail when demo learner writes storage");
  assert(demoWrites.issues.some(issue => issue.includes("read-only")), "evaluator path should explain read-only demo drift");

  const capabilities = buildCapabilityMap();
  const proof = capability(capabilities, "public-github-proof-surface");
  proof.proofGates = (proof.proofGates || []).filter(gate => gate.id !== "check:evaluator-path");
  const missingGate = buildEvaluatorPathReport({ capabilities });
  assert(missingGate.status === "fail", "evaluator path should fail when capability map stops citing its gate");
  assert(missingGate.issues.some(issue => issue.includes("check:evaluator-path")), "evaluator path should explain capability gate drift");
}

function main() {
  const report = buildEvaluatorPathReport();
  if (process.argv.includes("--json")) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    if (report.status !== "pass") process.exit(1);
    return;
  }
  if (process.argv.includes("--text")) {
    process.stdout.write(formatEvaluatorPathReport(report) + "\n");
    if (report.status !== "pass") process.exit(1);
    return;
  }
  runBaseSmoke();
  runMutationSmoke();
  console.log("ok - evaluator path links home, demo learner, and proof sections");
  console.log("ok - evaluator path is backed by demo, guided-session, and capability reports");
  console.log("ok - evaluator path mutations catch link, read-only, and capability drift");
}

if (require.main === module) main();

module.exports = {
  buildEvaluatorPathReport,
  formatEvaluatorPathReport
};

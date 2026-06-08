#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { buildDemoLearnerReport } = require("./build-demo-learner-report.js");
const {
  compareDemoLearnerReports,
  formatDemoLearnerDiff
} = require("./diff-demo-learner-report.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeReviewChange(report) {
  const next = clone(report);
  next.rendered.exportLabel = "Export sample JSON";
  next.plan.title = "Repair route";
  next.companion.fingerprint = "cmp-review-only";
  return next;
}

function makeRegression(report) {
  const next = clone(report);
  next.status = "fail";
  next.totals.storageWrites = 1;
  next.storageWrites = ["plata:practice-plan:v1"];
  next.guarantees.find(item => item.key === "read-only-storage").pass = false;
  next.rendered.importDisabled = false;
  next.rendered.today = next.rendered.today.replace("Study companion", "Planner route").replace("Cited memory", "Local progress");
  next.companion = null;
  next.memory.factKinds = next.memory.factKinds.filter(kind => kind !== "root_competency_trap" && kind !== "next_review_due");
  next.memory.factSignals = next.memory.factSignals.filter(signal => signal !== "agency" && signal !== "process-patience");
  next.memory.visibleFacts = next.memory.visibleFacts.filter(fact => fact.kind !== "root_competency_trap" && fact.kind !== "next_review_due");
  next.plan.steps.forEach(step => {
    step.selectedMemoryFacts = (step.selectedMemoryFacts || []).filter(fact => fact.kind !== "root_competency_trap");
  });
  next.issues.push("demo wrote localStorage keys: plata:practice-plan:v1");
  next.totals.issues = next.issues.length;
  return next;
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function runCli(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "diff-demo-learner-report.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

const base = buildDemoLearnerReport();
const same = compareDemoLearnerReports(base, clone(base));
assert(same.status === "unchanged", "unchanged demo reports should stay unchanged");
assert(same.summary.changes === 0, "unchanged demo reports should not emit changes");

const reviewReport = makeReviewChange(base);
const reviewDiff = compareDemoLearnerReports(base, reviewReport);
assert(reviewDiff.status === "changed", "review-only demo report changes should require review");
assert(reviewDiff.summary.regressions === 0, "review-only demo report changes should not be regressions");
assert(reviewDiff.changes.some(entry => entry.message.includes("export label changed")), "review diff should include export label change");
assert(reviewDiff.changes.some(entry => entry.message.includes("fingerprint changed")), "review diff should include companion fingerprint change");
assert(formatDemoLearnerDiff(reviewDiff).includes("Demo learner diff: changed"), "formatted review diff should include status");

const regressionReport = makeRegression(base);
const regressionDiff = compareDemoLearnerReports(base, regressionReport);
assert(regressionDiff.status === "regression", "lost demo contract should be a regression");
assert(regressionDiff.regressions.some(entry => entry.message.includes("storage writes changed")), "regression diff should include storage write regression");
assert(regressionDiff.regressions.some(entry => entry.message.includes("guarantee pass changed")), "regression diff should include failed guarantee");
assert(regressionDiff.regressions.some(entry => entry.message.includes("fact kind removed: root_competency_trap")), "regression diff should include lost root competency facts");
assert(regressionDiff.regressions.some(entry => entry.message.includes("fact kind removed: next_review_due")), "regression diff should include lost due-review facts");
assert(regressionDiff.regressions.some(entry => entry.message.includes("Companion receipt removed")), "regression diff should include lost companion receipt");
assert(regressionDiff.regressions.some(entry => entry.message.includes("selected memory fact removed")), "regression diff should include lost planner citations");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-demo-learner-diff-"));
try {
  const baseFile = path.join(tmp, "base.json");
  const reviewFile = path.join(tmp, "review.json");
  const regressionFile = path.join(tmp, "regression.json");
  writeJson(baseFile, base);
  writeJson(reviewFile, reviewReport);
  writeJson(regressionFile, regressionReport);

  const unchanged = runCli(["--base", baseFile, "--head", baseFile, "--fail-on-change"]);
  assert(unchanged.status === 0, `CLI should pass unchanged reports\n${unchanged.stdout}\n${unchanged.stderr}`);
  assert(unchanged.stdout.includes("Demo learner diff: unchanged"), "CLI unchanged text should include status");

  const jsonReview = runCli(["--base", baseFile, "--head", reviewFile, "--json"]);
  assert(jsonReview.status === 0, `CLI JSON review diff should render\n${jsonReview.stdout}\n${jsonReview.stderr}`);
  assert(JSON.parse(jsonReview.stdout).status === "changed", "CLI JSON should include changed status");

  const passingReview = runCli(["--base", baseFile, "--head", reviewFile, "--fail-on-regression"]);
  assert(passingReview.status === 0, "CLI should pass review-only changes with fail-on-regression");

  const failingChange = runCli(["--base", baseFile, "--head", reviewFile, "--fail-on-change"]);
  assert(failingChange.status === 1, "CLI should fail on any change when requested");

  const failingRegression = runCli(["--base", baseFile, "--head", regressionFile, "--fail-on-regression"]);
  assert(failingRegression.status === 1, "CLI should fail on regression when requested");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("ok - demo learner diff detects unchanged reports");
console.log("ok - demo learner diff summarizes review-only drift");
console.log("ok - demo learner diff marks read-only, memory, and companion loss as regressions");
console.log("ok - demo learner diff CLI supports JSON and fail modes");

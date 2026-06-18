#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { buildGuidedSessionReport } = require("./build-guided-session-report.js");
const {
  compareGuidedSessionReports,
  formatGuidedSessionDiff
} = require("./diff-guided-session-report.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function scenario(report, id) {
  const found = report.scenarios.find(item => item.id === id);
  assert(found, `missing scenario ${id}`);
  return found;
}

function firstOutcome(report) {
  const outcome = report.outcomeLedger && report.outcomeLedger.outcomes && report.outcomeLedger.outcomes[0];
  assert(outcome, "missing outcome receipt");
  return outcome;
}

function makeReviewChange(report) {
  const next = clone(report);
  const repair = scenario(next, "memory-backed-repair");
  repair.session.goal.title = "Repair passive-agency with one receipt";
  repair.session.outcomeReceipt.summary = "A review-only wording change for the guided session receipt.";
  firstOutcome(next).outcomeReceipt.summary = "A review-only wording change for the stored outcome receipt.";
  firstOutcome(next).fingerprint = "gdo-reviewonly";
  return next;
}

function makeRegression(report) {
  const next = clone(report);
  next.statuses = next.statuses.filter(status => status !== "complete");
  next.status = "fail";
  next.issues.push("completed-route: complete state disappeared");
  next.totals.issues = next.issues.length;

  const completed = scenario(next, "completed-route");
  completed.status = "fail";
  completed.issues.push("completed route lost receipt evidence");
  completed.session.status = "active";
  completed.session.outcomeReceipt.citedFacts = [];
  completed.session.guardrails.containsRawAnswerText = true;

  next.outcomeLedger.totals.outcomes = 0;
  next.outcomeLedger.totals.citedFacts = 0;
  next.outcomeLedger.totals.issues = 1;
  next.outcomeLedger.outcomes = [];
  next.totals.outcomeReceipts = 0;
  return next;
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function runCli(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "diff-guided-session-report.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function runArchiveBaseBuild() {
  const archiveDir = fs.mkdtempSync(path.join(os.tmpdir(), "plata-guided-base-"));
  const extract = spawnSync("sh", ["-c", `git archive main | tar -x -C ${JSON.stringify(archiveDir)}`], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  assert(extract.status === 0, `main archive extract should succeed\n${extract.stderr}`);
  const build = spawnSync(process.execPath, [
    path.join(repoRoot, "scripts", "build-guided-session-report.js"),
    "--root",
    archiveDir,
    "--json"
  ], { cwd: repoRoot, encoding: "utf8" });
  assert(build.status === 0, `guided session report should build against main archive\n${build.stderr}`);
  const report = JSON.parse(build.stdout);
  assert(report.schemaVersion === 1, "archive base report should include schemaVersion");
  fs.rmSync(archiveDir, { recursive: true, force: true });
  return report;
}

const base = buildGuidedSessionReport();
const same = compareGuidedSessionReports(base, clone(base));
assert(same.status === "unchanged", "unchanged guided reports should stay unchanged");
assert(same.summary.changes === 0, "unchanged guided reports should not emit changes");

const reviewReport = makeReviewChange(base);
const reviewDiff = compareGuidedSessionReports(base, reviewReport);
assert(reviewDiff.status === "changed", "guided wording/fingerprint drift should require review");
assert(reviewDiff.summary.regressions === 0, "review-only guided changes should not be regressions");
assert(reviewDiff.changes.some(entry => entry.message.includes("goal title changed")), "review diff should include goal title change");
assert(reviewDiff.changes.some(entry => entry.message.includes("receipt summary changed")), "review diff should include receipt summary change");
assert(formatGuidedSessionDiff(reviewDiff).includes("Guided session diff: changed"), "formatted review diff should include status");

const regressionReport = makeRegression(base);
const regressionDiff = compareGuidedSessionReports(base, regressionReport);
assert(regressionDiff.status === "regression", "lost guided outcome contract should be a regression");
assert(regressionDiff.regressions.some(entry => entry.message.includes("session status removed: complete")), "regression diff should include removed complete status");
assert(regressionDiff.regressions.some(entry => entry.message.includes("receipt cited fact removed")), "regression diff should include lost cited facts");
assert(regressionDiff.regressions.some(entry => entry.message.includes("raw-answer guardrail changed")), "regression diff should include raw-answer guardrail loss");
assert(regressionDiff.regressions.some(entry => entry.message.includes("outcome receipts changed 1 -> 0")), "regression diff should include lost outcome receipt count");
assert(regressionDiff.regressions.some(entry => entry.message.includes("Outcome receipt removed")), "regression diff should include removed outcome receipt");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-guided-session-diff-"));
try {
  const baseFile = path.join(tmp, "base.json");
  const reviewFile = path.join(tmp, "review.json");
  const regressionFile = path.join(tmp, "regression.json");
  writeJson(baseFile, base);
  writeJson(reviewFile, reviewReport);
  writeJson(regressionFile, regressionReport);

  const unchanged = runCli(["--base", baseFile, "--head", baseFile, "--fail-on-change"]);
  assert(unchanged.status === 0, `CLI should pass unchanged reports\n${unchanged.stdout}\n${unchanged.stderr}`);
  assert(unchanged.stdout.includes("Guided session diff: unchanged"), "CLI unchanged text should include status");

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

runArchiveBaseBuild();

console.log("ok - guided session diff detects unchanged reports");
console.log("ok - guided session diff summarizes review-only receipt drift");
console.log("ok - guided session diff marks lost status, citations, guardrails, and outcome receipts as regressions");
console.log("ok - guided session diff CLI supports JSON and fail modes");
console.log("ok - guided session report builds against main archive without missing lesson ENOENT");

#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { buildDashboardRecommendationSnapshot } = require("./snapshot-dashboard-recommendations.js");
const {
  compareDashboardSnapshots,
  formatDashboardSnapshotDiff
} = require("./diff-dashboard-snapshot.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function scenario(snapshot, id) {
  const found = snapshot.scenarios.find(item => item.id === id);
  assert(found, `missing scenario ${id}`);
  return found;
}

function makeReviewChange(snapshot) {
  const next = clone(snapshot);
  const weak = scenario(next, "weak-mastery");
  weak.due[0].decision.trace.rule = "dashboard.repair.reviewed-rule";
  weak.due[0].decision.trace.fingerprint = "ptr-reviewed";
  weak.practicePlan.steps[0].trace.rule = "dashboard.repair.reviewed-rule";
  weak.practicePlan.steps[0].trace.fingerprint = "ptr-reviewed";
  return next;
}

function makeRegression(snapshot) {
  const next = clone(snapshot);
  const weak = scenario(next, "weak-mastery");
  weak.evidenceLedger = weak.evidenceLedger.filter(entry => !(entry.kind === "open" && entry.title === "Read passive agency"));
  weak.weakCompetencies = [];
  return next;
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function runCli(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "diff-dashboard-snapshot.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function runSnapshot(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "snapshot-dashboard-recommendations.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

const base = buildDashboardRecommendationSnapshot();
const same = compareDashboardSnapshots(base, clone(base));
assert(same.status === "unchanged", "unchanged snapshots should have unchanged status");
assert(same.summary.changes === 0, "unchanged snapshots should not emit changes");

const reviewSnapshot = makeReviewChange(base);
const reviewDiff = compareDashboardSnapshots(base, reviewSnapshot);
assert(reviewDiff.status === "changed", "trace-only snapshot changes should require review");
assert(reviewDiff.summary.changes >= 2, "review diff should include due and plan trace changes");
assert(reviewDiff.summary.regressions === 0, "review-only diff should not mark regressions");
assert(reviewDiff.changes.some(entry => entry.message.includes("trace rule changed")), "review diff should include trace rule change");
assert(formatDashboardSnapshotDiff(reviewDiff).includes("Dashboard snapshot diff: changed"), "formatted review diff should include status");

const regressionSnapshot = makeRegression(base);
const regressionDiff = compareDashboardSnapshots(base, regressionSnapshot);
assert(regressionDiff.status === "regression", "removed open ledger/root skill should be a regression");
assert(regressionDiff.regressions.some(entry => entry.message.includes("Ledger row removed")), "regression diff should include removed ledger row");
assert(regressionDiff.regressions.some(entry => entry.message.includes("Root competency removed")), "regression diff should include removed root competency");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-dashboard-snapshot-diff-"));
try {
  const baseFile = path.join(tmp, "base.json");
  const headFile = path.join(tmp, "head.json");
  writeJson(baseFile, base);
  writeJson(headFile, regressionSnapshot);

  const jsonSnapshot = runSnapshot(["--json"]);
  assert(jsonSnapshot.status === 0, `snapshot --json should render current snapshot\n${jsonSnapshot.stdout}\n${jsonSnapshot.stderr}`);
  assert(JSON.parse(jsonSnapshot.stdout).scenarios.length === base.scenarios.length, "snapshot --json should include scenarios");

  const unchanged = runCli(["--base", baseFile, "--head", baseFile, "--fail-on-change"]);
  assert(unchanged.status === 0, `CLI should pass unchanged snapshots\n${unchanged.stdout}\n${unchanged.stderr}`);
  assert(unchanged.stdout.includes("Dashboard snapshot diff: unchanged"), "CLI unchanged text should include status");

  const json = runCli(["--base", baseFile, "--head", headFile, "--json"]);
  assert(json.status === 0, `CLI JSON diff should render\n${json.stdout}\n${json.stderr}`);
  assert(JSON.parse(json.stdout).status === "regression", "CLI JSON output should include regression status");

  const failingRegression = runCli(["--base", baseFile, "--head", headFile, "--fail-on-regression"]);
  assert(failingRegression.status === 1, "CLI should fail on regression when requested");

  const failingChange = runCli(["--base", baseFile, "--head", headFile, "--fail-on-change"]);
  assert(failingChange.status === 1, "CLI should fail on any change when requested");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("ok - dashboard snapshot diff detects unchanged snapshots");
console.log("ok - dashboard snapshot diff summarizes review changes");
console.log("ok - dashboard snapshot diff marks missing ledger/root-skill rows as regressions");
console.log("ok - dashboard snapshot diff CLI supports JSON and fail modes");

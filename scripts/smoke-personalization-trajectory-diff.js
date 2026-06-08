#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  evaluatePersonalizationTrajectories
} = require("./smoke-personalization-trajectory.js");
const {
  comparePersonalizationTrajectoryReports,
  formatPersonalizationTrajectoryDiff
} = require("./diff-personalization-trajectory.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stage(report, trajectoryId, stageId) {
  const found = report.stages.find(row => row.trajectoryId === trajectoryId && row.stageId === stageId);
  assert(found, `missing trajectory stage ${trajectoryId}/${stageId}`);
  return found;
}

function makeReviewChange(report) {
  const next = clone(report);
  const row = stage(next, "repair-review-reopen", "after-review-pass");
  row.memoryFingerprint = "mem-review-only";
  row.modelFocusFactIds = row.modelFocusFactIds.map(id => `${id}-reviewed`);
  row.advisorCitedFactIds = row.advisorCitedFactIds.map(id => `${id}-reviewed`);
  return next;
}

function makeRegression(report) {
  const next = clone(report);
  const root = stage(next, "cross-lesson-root-skill", "cross-root-emerges");
  root.memoryKinds = root.memoryKinds.filter(kind => kind !== "root_competency_trap");
  root.modelRule = "learner-model.focus.weak-signal";
  root.modelFocusKinds = root.modelFocusKinds.filter(kind => kind !== "root_competency_trap");
  root.plannerSelectedKinds = root.plannerSelectedKinds.filter(kind => kind !== "root_competency_trap");
  root.advisorRule = "advisor.repair.memory-backed";
  root.advisorCitedKinds = root.advisorCitedKinds.filter(kind => kind !== "root_competency_trap");
  root.rootCompetencies = [];
  next.stages = next.stages.filter(row => !(row.trajectoryId === "repair-review-reopen" && row.stageId === "after-spacing-gap"));
  next.stageCount = next.stages.length;
  return next;
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function runCli(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "diff-personalization-trajectory.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function runTrajectory(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "smoke-personalization-trajectory.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

const base = evaluatePersonalizationTrajectories();
const same = comparePersonalizationTrajectoryReports(base, clone(base));
assert(same.status === "unchanged", "unchanged trajectory reports should remain unchanged");
assert(same.summary.changes === 0, "unchanged trajectory reports should not emit changes");

const reviewReport = makeReviewChange(base);
const review = comparePersonalizationTrajectoryReports(base, reviewReport);
assert(review.status === "changed", "citation/fingerprint-only drift should be reviewable");
assert(review.summary.regressions === 0, "review-only trajectory drift should not be a regression");
assert(review.changes.some(entry => entry.message.includes("memory fingerprint changed")), "review diff should include fingerprint drift");
assert(review.changes.some(entry => entry.message.includes("model focus fact removed")), "review diff should include focus fact drift");
assert(formatPersonalizationTrajectoryDiff(review).includes("Personalization trajectory diff: changed"), "formatted review diff should include status");

const regressionReport = makeRegression(base);
const regression = comparePersonalizationTrajectoryReports(base, regressionReport);
assert(regression.status === "regression", "lost root skill/stage should be a regression");
assert(regression.regressions.some(entry => entry.message.includes("Trajectory stage removed")), "regression diff should include removed stage");
assert(regression.regressions.some(entry => entry.message.includes("memory kind removed: root_competency_trap")), "regression diff should include removed root memory kind");
assert(regression.regressions.some(entry => entry.message.includes("root competency removed")), "regression diff should include removed root competency");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-personalization-trajectory-diff-"));
try {
  const baseFile = path.join(tmp, "base.json");
  const reviewFile = path.join(tmp, "review.json");
  const regressionFile = path.join(tmp, "regression.json");
  writeJson(baseFile, base);
  writeJson(reviewFile, reviewReport);
  writeJson(regressionFile, regressionReport);

  const jsonReport = runTrajectory(["--json"]);
  assert(jsonReport.status === 0, `trajectory --json should render current report\n${jsonReport.stdout}\n${jsonReport.stderr}`);
  assert(JSON.parse(jsonReport.stdout).status === "pass", "trajectory --json output should include pass status");

  const unchanged = runCli(["--base", baseFile, "--head", baseFile, "--fail-on-change"]);
  assert(unchanged.status === 0, `CLI should pass unchanged trajectory reports\n${unchanged.stdout}\n${unchanged.stderr}`);
  assert(unchanged.stdout.includes("Personalization trajectory diff: unchanged"), "CLI unchanged output should include status");

  const reviewCli = runCli(["--base", baseFile, "--head", reviewFile, "--fail-on-regression"]);
  assert(reviewCli.status === 0, `CLI should pass review-only changes with fail-on-regression\n${reviewCli.stdout}\n${reviewCli.stderr}`);
  assert(reviewCli.stdout.includes("Review changes"), "CLI review output should include review section");

  const json = runCli(["--base", baseFile, "--head", regressionFile, "--json"]);
  assert(json.status === 0, `CLI JSON diff should render\n${json.stdout}\n${json.stderr}`);
  assert(JSON.parse(json.stdout).status === "regression", "CLI JSON output should include regression status");

  const failingRegression = runCli(["--base", baseFile, "--head", regressionFile, "--fail-on-regression"]);
  assert(failingRegression.status === 1, "CLI should fail on regression when requested");

  const failingChange = runCli(["--base", baseFile, "--head", reviewFile, "--fail-on-change"]);
  assert(failingChange.status === 1, "CLI should fail on any change when requested");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("ok - personalization trajectory diff detects unchanged reports");
console.log("ok - personalization trajectory diff summarizes review-only drift");
console.log("ok - personalization trajectory diff marks lost stages/root skills as regressions");
console.log("ok - personalization trajectory diff CLI supports JSON and fail modes");

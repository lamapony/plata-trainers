#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { buildTodayProgramReport } = require("./build-today-program-report.js");
const {
  compareTodayProgramReports,
  formatTodayProgramDiff
} = require("./diff-today-program-report.js");

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

function makeReviewChange(report) {
  const next = clone(report);
  const first = scenario(next, "first-session");
  first.program.headline = "Start with the first useful lesson";
  first.program.message = "A gentler first-session copy changed for review.";
  return next;
}

function makeRegression(report) {
  const next = clone(report);
  next.states = next.states.filter(state => state !== "memory-review");
  const review = scenario(next, "due-memory-review");
  review.program.kind = "active-plan";
  review.rendered.hasAction = false;
  review.rendered.hasStageStrip = false;
  review.rendered.guardrails = review.rendered.guardrails.filter(label => label !== "Cited memory");
  review.step.selectedMemoryFacts = [];
  review.status = "fail";
  review.issues.push("memory-review state lost cited memory");
  next.status = "fail";
  next.issues.push("due-memory-review: memory-review state lost cited memory");
  next.totals.issues = next.issues.length;
  return next;
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function runCli(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "diff-today-program-report.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

const base = buildTodayProgramReport();
const same = compareTodayProgramReports(base, clone(base));
assert(same.status === "unchanged", "unchanged Today reports should stay unchanged");
assert(same.summary.changes === 0, "unchanged Today reports should not emit changes");

const reviewReport = makeReviewChange(base);
const reviewDiff = compareTodayProgramReports(base, reviewReport);
assert(reviewDiff.status === "changed", "copy-only Today report changes should require review");
assert(reviewDiff.summary.regressions === 0, "copy-only Today report changes should not be regressions");
assert(reviewDiff.changes.some(entry => entry.message.includes("headline changed")), "review diff should include headline change");
assert(formatTodayProgramDiff(reviewDiff).includes("Today program diff: changed"), "formatted review diff should include status");

const regressionReport = makeRegression(base);
const regressionDiff = compareTodayProgramReports(base, regressionReport);
assert(regressionDiff.status === "regression", "lost memory-review contract should be a regression");
assert(regressionDiff.regressions.some(entry => entry.message.includes("state removed: memory-review")), "regression diff should include removed state");
assert(regressionDiff.regressions.some(entry => entry.message.includes("primary action changed")), "regression diff should include missing action");
assert(regressionDiff.regressions.some(entry => entry.message.includes("guardrail removed: Cited memory")), "regression diff should include removed cited-memory guardrail");
assert(regressionDiff.regressions.some(entry => entry.message.includes("selected memory fact removed")), "regression diff should include lost selected memory fact");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-today-program-diff-"));
try {
  const baseFile = path.join(tmp, "base.json");
  const reviewFile = path.join(tmp, "review.json");
  const regressionFile = path.join(tmp, "regression.json");
  writeJson(baseFile, base);
  writeJson(reviewFile, reviewReport);
  writeJson(regressionFile, regressionReport);

  const unchanged = runCli(["--base", baseFile, "--head", baseFile, "--fail-on-change"]);
  assert(unchanged.status === 0, `CLI should pass unchanged reports\n${unchanged.stdout}\n${unchanged.stderr}`);
  assert(unchanged.stdout.includes("Today program diff: unchanged"), "CLI unchanged text should include status");

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

console.log("ok - Today program diff detects unchanged reports");
console.log("ok - Today program diff summarizes review-only copy changes");
console.log("ok - Today program diff marks lost state/action/citation contracts as regressions");
console.log("ok - Today program diff CLI supports JSON and fail modes");

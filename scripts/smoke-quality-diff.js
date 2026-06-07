#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { buildQualityReport } = require("./build-quality-report.js");
const { compareQualityReports, formatQualityDiff } = require("./diff-quality-report.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeRegression(report) {
  const next = clone(report);
  const lesson = next.lessons.find(item => item.id === "lesson-b2-radiator-register");
  assert(lesson, "radiator lesson missing from quality report");
  next.status = "fail";
  next.totals.issues += 1;
  lesson.status = "fail";
  lesson.issues.push("synthetic issue for quality diff smoke test");
  const guarantee = lesson.evidenceMatrix.guarantees.find(item => item.key === "simulation-scene-coverage");
  assert(guarantee, "simulation guarantee missing from quality report");
  guarantee.pass = false;
  lesson.evidenceMatrix.sceneRows = lesson.evidenceMatrix.sceneRows.filter(row => row.id !== "workplace-understatement");
  next.totals.evidenceRows -= 1;
  return next;
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function runCli(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "diff-quality-report.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function runReportBuilder(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "build-quality-report.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

const base = buildQualityReport();
const same = compareQualityReports(base, clone(base));
assert(same.status === "unchanged", "unchanged reports should have unchanged diff status");
assert(same.summary.changes === 0, "unchanged reports should not emit changes");

const regressionReport = makeRegression(base);
const regression = compareQualityReports(base, regressionReport);
assert(regression.status === "regression", "regression report should produce regression diff status");
assert(regression.summary.regressions >= 4, "regression diff should include report, lesson, issue, guarantee, or row regression");
assert(formatQualityDiff(regression).includes("Quality diff: regression"), "formatted regression diff should include status");
assert(regression.regressions.some(entry => entry.message.includes("Issue added")), "regression diff should include added issue");
assert(regression.regressions.some(entry => entry.message.includes("Guarantee simulation-scene-coverage changed")), "regression diff should include failed guarantee");
assert(regression.regressions.some(entry => entry.message.includes("Evidence row removed")), "regression diff should include removed evidence row");

const improvement = compareQualityReports(regressionReport, base);
assert(improvement.status === "changed", "fixed report should be changed without regressions");
assert(improvement.summary.improvements >= 3, "fixed report should include improvements");
assert(improvement.summary.regressions === 0, "fixed report should not include regressions");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-quality-diff-"));
try {
  const baseFile = path.join(tmp, "base.json");
  const headFile = path.join(tmp, "head.json");
  const rootBuiltFile = path.join(tmp, "root-built.json");
  writeJson(baseFile, base);
  writeJson(headFile, regressionReport);

  const rootBuilt = runReportBuilder(["--root", repoRoot, "--out", rootBuiltFile]);
  assert(rootBuilt.status === 0, `quality report --root should build current report\n${rootBuilt.stdout}\n${rootBuilt.stderr}`);
  assert(compareQualityReports(base, JSON.parse(fs.readFileSync(rootBuiltFile, "utf8"))).status === "unchanged", "--root report should match current report");

  const failing = runCli(["--base", baseFile, "--head", headFile, "--json", "--fail-on-regression"]);
  assert(failing.status === 1, `CLI should fail on regression, got ${failing.status}\n${failing.stdout}\n${failing.stderr}`);
  assert(JSON.parse(failing.stdout).status === "regression", "CLI JSON output should include regression status");

  const passing = runCli(["--base", baseFile, "--head", baseFile, "--fail-on-regression"]);
  assert(passing.status === 0, `CLI should pass on unchanged reports\n${passing.stdout}\n${passing.stderr}`);
  assert(passing.stdout.includes("Quality diff: unchanged"), "CLI text output should include unchanged status");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("ok - quality diff detects unchanged reports");
console.log("ok - quality diff detects regressions and improvements");
console.log("ok - quality diff CLI fails only on regressions");

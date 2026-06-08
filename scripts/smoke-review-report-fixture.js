#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const fixtureRoot = path.join(repoRoot, "scripts", "fixtures", "review-report-golden");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function fixture(file) {
  return path.join(fixtureRoot, file);
}

function runCli(extraArgs) {
  const args = [
    path.join(repoRoot, "scripts", "build-review-report.js"),
    "--quality-diff", fixture("quality-diff.json"),
    "--dashboard-diff", fixture("dashboard-diff.json"),
    "--demo-diff", fixture("demo-diff.json"),
    "--today-diff", fixture("today-diff.json"),
    "--trajectory-diff", fixture("personalization-diff.json"),
    ...extraArgs
  ];
  return spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function assertBefore(text, first, second, message) {
  const firstIndex = text.indexOf(first);
  const secondIndex = text.indexOf(second);
  assert(firstIndex !== -1, `${message}: missing ${first}`);
  assert(secondIndex !== -1, `${message}: missing ${second}`);
  assert(firstIndex < secondIndex, `${message}: expected ${first} before ${second}`);
}

function surface(report, id) {
  return report.surfaces.find(item => item.id === id);
}

[
  "quality-diff.json",
  "dashboard-diff.json",
  "demo-diff.json",
  "today-diff.json",
  "personalization-diff.json"
].forEach(file => {
  assert(fs.existsSync(fixture(file)), `golden review fixture missing ${file}`);
});

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-review-golden-"));
try {
  const reviewOut = path.join(tmp, "review-report.json");
  const summaryOut = path.join(tmp, "step-summary.md");
  const result = runCli([
    "--out", reviewOut,
    "--summary-out", summaryOut,
    "--summary-limit", "2",
    "--summary-message-limit", "72"
  ]);
  assert(result.status === 0, `golden review fixture should render\n${result.stdout}\n${result.stderr}`);
  assert(result.stdout.includes("Review report: regression"), "golden fixture text output should report regression status");
  assert(fs.existsSync(reviewOut), "golden fixture should write review-report.json");
  assert(fs.existsSync(summaryOut), "golden fixture should write Markdown step summary");

  const report = JSON.parse(fs.readFileSync(reviewOut, "utf8"));
  assert(report.status === "regression", "golden fixture JSON should be a regression report");
  assert(report.summary.surfaces === 5, "golden fixture should cover all review surfaces");
  assert(report.summary.changes === 26, "golden fixture should preserve full change count");
  assert(report.summary.regressions === 8, "golden fixture should preserve full regression count");
  assert(report.summary.reviewChanges === 9, "golden fixture should preserve full review count");
  assert(report.summary.improvements === 4, "golden fixture should preserve full improvement count");
  assert(report.summary.infoChanges === 5, "golden fixture should preserve full info count");
  assert(surface(report, "quality").status === "regression", "golden fixture should keep quality status");
  assert(surface(report, "dashboard").status === "regression", "golden fixture should keep dashboard status");
  assert(surface(report, "demo").status === "changed", "golden fixture should keep demo status");
  assert(surface(report, "today").status === "regression", "golden fixture should keep Today status");
  assert(surface(report, "personalization").status === "regression", "golden fixture should keep personalization status");
  assert(JSON.stringify(report).includes("dashboard.a-ledger"), "full JSON should keep entries hidden from Markdown");
  assert(JSON.stringify(report).includes("very-long-quality-regression-detail very-long-quality-regression-detail very-long-quality-regression-detail"), "full JSON should keep untruncated messages");

  const markdown = fs.readFileSync(summaryOut, "utf8");
  assert(markdown.includes("# PR Review Report"), "golden summary should include title");
  assert(markdown.includes("Full details stay in `.dist/review-report.json`"), "golden summary should point to full JSON");
  assert(markdown.includes("| Quality | regression | 6 | 2 | 1 |"), "golden summary should include quality row");
  assert(markdown.includes("| Demo learner | changed | 4 | 0 | 1 |"), "golden summary should include demo row");
  assertBefore(markdown, "a-quality-contract", "z-quality-contract", "golden regression summary should sort by surface and scope");
  assertBefore(markdown, "z-quality-contract", "+6 more in JSON artifact", "golden regression summary should cap after visible entries");
  assert(!markdown.includes("dashboard.a-ledger"), "golden Markdown should hide lower-priority regressions past the cap");
  assert(!markdown.includes("very-long-quality-regression-detail very-long-quality-regression-detail very-long-quality-regression-detail"), "golden Markdown should truncate long messages");
  assert(markdown.includes("+6 more in JSON artifact"), "golden regression summary should disclose hidden regressions");
  assert(markdown.includes("+7 more in JSON artifact"), "golden review summary should disclose hidden review changes");
  assert(markdown.includes("+2 more in JSON artifact"), "golden improvement summary should disclose hidden improvements");
  assert(markdown.includes("+3 more in JSON artifact"), "golden info summary should disclose hidden info changes");

  const markdownOnly = runCli(["--markdown", "--summary-limit", "2", "--summary-message-limit", "72"]);
  assert(markdownOnly.status === 0, `golden fixture Markdown CLI should pass\n${markdownOnly.stdout}\n${markdownOnly.stderr}`);
  assert(markdownOnly.stdout.includes("+6 more in JSON artifact"), "Markdown CLI should apply golden fixture caps");

  const failingRegression = runCli(["--fail-on-regression"]);
  assert(failingRegression.status === 1, "golden fixture should fail fail-on-regression mode");

  const failingChange = runCli(["--fail-on-change"]);
  assert(failingChange.status === 1, "golden fixture should fail fail-on-change mode");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("ok - golden review fixture covers all PR review surfaces");
console.log("ok - golden review fixture preserves full JSON while capping Markdown");
console.log("ok - golden review fixture proves stable ordering, truncation, and fail modes");

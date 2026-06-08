#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  buildReviewReport,
  formatReviewReport
} = require("./build-review-report.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function diff(status, changes) {
  changes = changes || [];
  return {
    schemaVersion: 1,
    status,
    changes,
    regressions: changes.filter(item => item.severity === "regression"),
    improvements: changes.filter(item => item.severity === "improvement"),
    summary: {
      changes: changes.length,
      regressions: changes.filter(item => item.severity === "regression").length,
      improvements: changes.filter(item => item.severity === "improvement").length
    }
  };
}

function unchangedInput() {
  return {
    quality: diff("unchanged"),
    dashboard: diff("unchanged"),
    demo: diff("unchanged"),
    today: diff("unchanged"),
    personalization: diff("unchanged")
  };
}

function reviewInput() {
  return {
    quality: diff("unchanged"),
    dashboard: diff("changed", [{
      severity: "review",
      scope: "weak-mastery.decision.lesson-b2-radiator-register",
      message: "trace fingerprint changed"
    }]),
    demo: diff("changed", [{
      severity: "review",
      scope: "demo.companion",
      message: "fingerprint changed"
    }]),
    today: diff("changed", [{
      severity: "review",
      scope: "today.first-session",
      message: "headline changed"
    }]),
    personalization: diff("changed", [{
      severity: "info",
      scope: "repair-review-reopen/after-review-pass",
      message: "advisor cited fact added: mem-reviewed"
    }])
  };
}

function regressionInput() {
  return {
    quality: diff("regression", [{
      severity: "regression",
      scope: "lesson-b2-radiator-register",
      message: "Issue added: missing evidence row"
    }]),
    dashboard: diff("changed", [{
      severity: "review",
      scope: "weak-mastery.practicePlan",
      message: "trace rule changed"
    }]),
    demo: diff("regression", [{
      severity: "regression",
      scope: "demo.memory",
      message: "fact kind removed: root_competency_trap"
    }]),
    today: diff("regression", [{
      severity: "regression",
      scope: "today.due-memory-review",
      message: "guardrail removed: Cited memory"
    }]),
    personalization: diff("regression", [{
      severity: "regression",
      scope: "cross-lesson-root-skill/cross-root-emerges",
      message: "root competency removed: agency"
    }])
  };
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function runCli(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "build-review-report.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

const unchanged = buildReviewReport(unchangedInput());
assert(unchanged.status === "unchanged", "unchanged review report should stay unchanged");
assert(unchanged.summary.changes === 0, "unchanged review report should have no changes");

const review = buildReviewReport(reviewInput());
assert(review.status === "changed", "review-only report should be changed");
assert(review.summary.regressions === 0, "review-only report should have no regressions");
assert(review.summary.reviewChanges === 3, "review-only report should count review changes");
assert(formatReviewReport(review).includes("Dashboard recommendations"), "formatted report should include surface label");
assert(formatReviewReport(review).includes("Demo learner"), "formatted report should include demo surface label");
assert(formatReviewReport(review).includes("Today program"), "formatted report should include Today surface label");

const regression = buildReviewReport(regressionInput());
assert(regression.status === "regression", "regression report should be regression");
assert(regression.summary.regressions === 4, "regression report should count all regressions");
assert(regression.regressions.some(item => item.label === "Quality"), "regression report should include quality regression");
assert(regression.regressions.some(item => item.label === "Demo learner"), "regression report should include demo regression");
assert(regression.regressions.some(item => item.label === "Today program"), "regression report should include Today regression");
assert(regression.regressions.some(item => item.label === "Personalization trajectory"), "regression report should include personalization regression");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-review-report-"));
try {
  const quality = path.join(tmp, "quality.json");
  const dashboard = path.join(tmp, "dashboard.json");
  const demo = path.join(tmp, "demo.json");
  const today = path.join(tmp, "today.json");
  const trajectory = path.join(tmp, "trajectory.json");

  writeJson(quality, reviewInput().quality);
  writeJson(dashboard, reviewInput().dashboard);
  writeJson(demo, reviewInput().demo);
  writeJson(today, reviewInput().today);
  writeJson(trajectory, reviewInput().personalization);
  const passingReview = runCli(["--quality-diff", quality, "--dashboard-diff", dashboard, "--demo-diff", demo, "--today-diff", today, "--trajectory-diff", trajectory, "--fail-on-regression"]);
  assert(passingReview.status === 0, `CLI should pass review-only changes with fail-on-regression\n${passingReview.stdout}\n${passingReview.stderr}`);
  assert(passingReview.stdout.includes("Review report: changed"), "CLI should print changed review report");

  const failingChange = runCli(["--quality-diff", quality, "--dashboard-diff", dashboard, "--demo-diff", demo, "--today-diff", today, "--trajectory-diff", trajectory, "--fail-on-change"]);
  assert(failingChange.status === 1, "CLI should fail on any change when requested");

  writeJson(quality, regressionInput().quality);
  writeJson(dashboard, regressionInput().dashboard);
  writeJson(demo, regressionInput().demo);
  writeJson(today, regressionInput().today);
  writeJson(trajectory, regressionInput().personalization);
  const jsonRegression = runCli(["--quality-diff", quality, "--dashboard-diff", dashboard, "--demo-diff", demo, "--today-diff", today, "--trajectory-diff", trajectory, "--json"]);
  assert(jsonRegression.status === 0, `CLI JSON should render regression report\n${jsonRegression.stdout}\n${jsonRegression.stderr}`);
  assert(JSON.parse(jsonRegression.stdout).status === "regression", "CLI JSON should include regression status");

  const failingRegression = runCli(["--quality-diff", quality, "--dashboard-diff", dashboard, "--demo-diff", demo, "--today-diff", today, "--trajectory-diff", trajectory, "--fail-on-regression"]);
  assert(failingRegression.status === 1, "CLI should fail on regression when requested");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("ok - review report aggregates unchanged, review, and regression surfaces");
console.log("ok - review report formats quality, dashboard, demo, Today, and personalization summaries");
console.log("ok - review report CLI supports JSON and fail modes");

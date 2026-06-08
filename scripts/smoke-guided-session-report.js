#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  buildGuidedSessionReport,
  formatGuidedSessionReport
} = require("./build-guided-session-report.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runCli(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "build-guided-session-report.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function runBaseSmoke() {
  const report = buildGuidedSessionReport();
  assert(report.status === "pass", `guided session report should pass:\n${report.issues.join("\n")}`);
  assert(report.totals.scenarios === 5, "guided session report should cover five core scenarios");
  ["active", "complete", "ready"].forEach(status => {
    assert(report.statuses.includes(status), `guided session report should include ${status}`);
  });
  assert(report.totals.steps === report.totals.scenarios * 4, "each guided session should have four steps");
  assert(report.totals.citedFacts >= 4, "memory-backed guided sessions should cite facts");

  const first = report.scenarios.find(item => item.id === "first-session");
  assert(first && first.session.goal.kind === "onboarding", "first session should use onboarding goal");
  assert(first.session.steps[1].hasAction, "first session should include a practice action");

  const repair = report.scenarios.find(item => item.id === "memory-backed-repair");
  assert(repair && repair.session.goal.signal === "passive-agency", "repair session should preserve target signal");
  assert(repair.session.outcomeReceipt.citedFacts.length >= 1, "repair session should cite memory");
  assert(repair.session.guardrails.requiresModel === false, "repair session should be model-free");

  const active = report.scenarios.find(item => item.id === "active-saved-route");
  assert(active && active.session.status === "active", "active route scenario should stay active");
  assert(active.session.steps.some(step => step.status === "active"), "active route should mark a step active");

  const completed = report.scenarios.find(item => item.id === "completed-route");
  assert(completed && completed.session.status === "complete", "completed route should report complete");
  assert(completed.session.steps.every(step => step.status === "done"), "completed route should mark all session steps done");

  const serialized = JSON.stringify(report);
  ["raw weak expected", "raw weak given", "De lover"].forEach(secret => {
    assert(!serialized.includes(secret), `guided session report should not leak ${secret}`);
  });

  const formatted = formatGuidedSessionReport(report);
  assert(formatted.includes("Guided Session Report"), "formatter should include report title");
  assert(formatted.includes("Issues:\nnone"), "formatter should show empty issues");
}

function runCliSmoke() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-guided-session-"));
  try {
    const out = path.join(tmp, "guided-session.json");
    const built = runCli(["--out", out]);
    assert(built.status === 0, `CLI build should pass\n${built.stdout}\n${built.stderr}`);
    const report = JSON.parse(fs.readFileSync(out, "utf8"));
    assert(report.status === "pass", "CLI output report should pass");
    assert(report.scenarios.some(item => item.id === "memory-backed-repair"), "CLI output should include repair scenario");

    const json = runCli(["--json"]);
    assert(json.status === 0, `CLI JSON should pass\n${json.stdout}\n${json.stderr}`);
    assert(JSON.parse(json.stdout).statuses.includes("complete"), "CLI JSON should include complete status");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function run() {
  runBaseSmoke();
  runCliSmoke();
  console.log("ok - guided session report covers user-facing session states");
  console.log("ok - guided session report rejects raw learner answer leaks");
  console.log("ok - guided session report CLI writes JSON artifacts");
}

run();

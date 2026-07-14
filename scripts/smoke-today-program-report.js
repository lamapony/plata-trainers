#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  buildTodayProgramReport,
  formatTodayProgramReport
} = require("./build-today-program-report.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runCli(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "build-today-program-report.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function runBaseSmoke() {
  const report = buildTodayProgramReport();
  assert(report.status === "pass", `today program report should pass:\n${report.issues.join("\n")}`);
  assert(report.totals.scenarios === 4, "today program report should cover the four program shell scenarios");
  ["onboarding", "active-plan", "return", "memory-review"].forEach(kind => {
    assert(report.states.includes(kind), `today program report should include ${kind}`);
  });

  const first = report.scenarios.find(item => item.id === "first-session");
  assert(first && first.program.kind === "onboarding", "first-session should render onboarding");
  assert(first.program.why.includes("no saved practice yet"), "onboarding should avoid fake personalization");
  assert(first.rendered.activeStage.includes("First visit"), "onboarding stage should be active");

  const active = report.scenarios.find(item => item.id === "active-saved-route");
  assert(active && active.program.kind === "active-plan", "active saved route should render active-plan");
  assert(active.step.status === "active", "active saved route should cite an active step");
  assert(active.rendered.activeStage.includes("In progress"), "active route stage should be active");

  const returned = report.scenarios.find(item => item.id === "lesson-return");
  assert(returned && returned.program.kind === "return", "lesson return should render return");
  assert(returned.routeSearch.includes("ledger-return=1"), "lesson return should preserve the route handoff");
  assert(returned.program.actionLabel === "Continue", "lesson return should continue the next step");

  const review = report.scenarios.find(item => item.id === "due-memory-review");
  assert(review && review.program.kind === "memory-review", "due review should render memory-review");
  assert(review.step.selectedMemoryFacts.some(fact => fact.kind === "next_review_due"), "due review should cite next_review_due");
  assert(review.rendered.guardrails.includes("Cited memory"), "due review should visibly cite memory");
  assert(!JSON.stringify(review).includes("raw due-review"), "due review report should not leak raw answers");

  const formatted = formatTodayProgramReport(report);
  assert(formatted.includes("Today Program Report"), "formatter should include report title");
  assert(formatted.includes("Issues:\nnone"), "formatter should show empty issues");
}

function runCliSmoke() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-today-program-"));
  try {
    const out = path.join(tmp, "today-program.json");
    const built = runCli(["--out", out]);
    assert(built.status === 0, `CLI build should pass\n${built.stdout}\n${built.stderr}`);
    const report = JSON.parse(fs.readFileSync(out, "utf8"));
    assert(report.status === "pass", "CLI output report should pass");
    assert(report.scenarios.some(item => item.id === "memory-review" || item.program.kind === "memory-review"), "CLI output should include memory-review");

    const json = runCli(["--json"]);
    assert(json.status === 0, `CLI JSON should pass\n${json.stdout}\n${json.stderr}`);
    assert(JSON.parse(json.stdout).states.includes("return"), "CLI JSON should include return state");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function run() {
  runBaseSmoke();
  runCliSmoke();
  console.log("ok - Today program report covers user-facing shell states");
  console.log("ok - Today program report rejects raw learner answer leaks");
  console.log("ok - Today program report CLI writes JSON artifacts");
}

run();

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
  assert(report.totals.scenarios === 12, "guided session report should cover twelve core scenarios");
  ["active", "complete", "ready"].forEach(status => {
    assert(report.statuses.includes(status), `guided session report should include ${status}`);
  });
  assert(report.totals.steps === report.totals.scenarios * 4, "each guided session should have four steps");
  assert(report.totals.citedFacts >= 4, "memory-backed guided sessions should cite facts");
  assert(report.totals.outcomeReceipts === 1, "guided session report should include one portable outcome receipt");
  assert(report.totals.flagshipExerciseOutcomeProofs === 1, "guided session report should expose one flagship exercise outcome proof");
  assert(report.outcomeLedger && report.outcomeLedger.ledgerType === "plata.guided-session-outcome-ledger.v1", "guided session report should expose the outcome ledger type");
  assert(report.outcomeLedger.totals.outcomes === 1, "guided session report should include one stored outcome");
  assert(report.outcomeLedger.totals.issues === 0, "guided session report outcome ledger should validate cleanly");
  assert(report.outcomeLedger.outcomes[0].fingerprint.startsWith("gdo-"), "guided outcome receipt should have a gdo fingerprint");
  assert(report.outcomeLedger.outcomes[0].completionEvidence.reason === "repair-correct", "guided outcome receipt should preserve completion evidence");
  assert(report.outcomeLedger.outcomes[0].outcomeReceipt.citedFacts.length === 1, "guided outcome receipt should cite memory");
  assert(report.flagshipExerciseOutcomeProof.status === "pass", "flagship exercise outcome proof should pass");
  assert(report.flagshipExerciseOutcomeProof.sceneId === "channel-transfer-lab", "flagship exercise outcome should point to the flagship chain");
  assert(report.flagshipExerciseOutcomeProof.publicReport === "reports/exercise-value.json", "flagship exercise outcome should cite exercise value report");

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

  const ordstilling = report.scenarios.find(item => item.id === "ordstilling-gold-repair");
  assert(ordstilling && ordstilling.session.goal.trainerId === "ordstilling", "ordstilling scenario should target ordstilling drill");
  assert(ordstilling.session.route.href.includes("ordstilling-drill"), "ordstilling scenario should link ordstilling drill");

  const jobFollowup = report.scenarios.find(item => item.id === "job-followup-gold-continue");
  assert(jobFollowup && jobFollowup.session.goal.trainerId === "lesson-b2-job-followup", "job follow-up scenario should target gold lesson");

  const bolig = report.scenarios.find(item => item.id === "bolig-gold-repair");
  assert(bolig && bolig.session.goal.trainerId === "lesson-b1-bolig", "bolig scenario should target bolig gold lesson");
  assert(bolig.session.goal.signal === "agency-without-pressure", "bolig scenario should preserve agency-without-pressure signal");
  assert(bolig.session.route.href.includes("lesson-b1-bolig"), "bolig scenario should link bolig lesson repair");

  const radiator = report.scenarios.find(item => item.id === "radiator-gold-repair");
  assert(radiator && radiator.session.goal.trainerId === "register", "radiator scenario should target register drill");
  assert(radiator.session.goal.signal === "formal-register-control", "radiator scenario should preserve formal-register-control signal");
  assert(radiator.session.route.href.includes("register-drill"), "radiator scenario should link register drill");

  const borgerservice = report.scenarios.find(item => item.id === "borgerservice-gold-repair");
  assert(borgerservice && borgerservice.session.goal.trainerId === "lesson-b1-borgerservice", "borgerservice scenario should target borgerservice gold lesson");
  assert(borgerservice.session.goal.signal === "clarification-without-panic", "borgerservice scenario should preserve clarification-without-panic signal");
  assert(borgerservice.session.route.href.includes("lesson-b1-borgerservice"), "borgerservice scenario should link borgerservice lesson repair");

  const doctor = report.scenarios.find(item => item.id === "doctor-gold-repair");
  assert(doctor && doctor.session.goal.trainerId === "lesson-a2-doctor", "doctor scenario should target doctor gold lesson");
  assert(doctor.session.goal.signal === "symptom-duration", "doctor scenario should preserve symptom-duration signal");
  assert(doctor.session.route.href.includes("lesson-a2-doctor"), "doctor scenario should link doctor lesson repair");

  const doctorSkrive = report.scenarios.find(item => item.id === "doctor-skrive-repair");
  assert(doctorSkrive && doctorSkrive.session.goal.trainerId === "skrive", "doctor-skrive scenario should target skrive drill");
  assert(doctorSkrive.session.goal.signal === "symptom-severity", "doctor-skrive scenario should preserve symptom-severity signal");
  assert(doctorSkrive.session.route.href.includes("skrive-drill"), "doctor-skrive scenario should link skrive sundhed repair");

  const completed = report.scenarios.find(item => item.id === "completed-route");
  assert(completed && completed.session.status === "complete", "completed route should report complete");
  assert(completed.session.steps.every(step => step.status === "done"), "completed route should mark all session steps done");

  const serialized = JSON.stringify(report);
  ["raw weak expected", "raw weak given", "De lover"].forEach(secret => {
    assert(!serialized.includes(secret), `guided session report should not leak ${secret}`);
  });

  const formatted = formatGuidedSessionReport(report);
  assert(formatted.includes("Guided Session Report"), "formatter should include report title");
  assert(formatted.includes("outcome receipts: 1"), "formatter should include outcome receipt count");
  assert(formatted.includes("flagship outcome proofs: 1"), "formatter should include flagship outcome proof count");
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

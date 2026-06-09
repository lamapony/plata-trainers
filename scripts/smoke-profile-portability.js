#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  buildProfilePortabilityReport,
  formatProfilePortabilityReport
} = require("./build-profile-portability-report.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runCli(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "build-profile-portability-report.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function stage(report, id) {
  const found = report.stages.find(item => item.id === id);
  assert(found, `missing profile portability stage ${id}`);
  return found;
}

function runBaseSmoke() {
  const report = buildProfilePortabilityReport();
  assert(report.status === "pass", `profile portability report should pass:\n${report.issues.join("\n")}`);
  assert(report.traceId.startsWith("profileport-"), "profile portability report should expose a stable trace id");
  assert(report.totals.stages === 5, "profile portability report should cover five stages");
  assert(report.totals.passedStages === 5, "all profile portability stages should pass");
  assert(report.totals.eventCount >= 5, "profile portability report should replay a meaningful event log");
  assert(report.totals.memoryCorrections >= 1, "profile portability report should include memory correction proof");
  assert(report.totals.guidedOutcomes === 1, "profile portability report should include one guided outcome receipt");
  assert(report.totals.flagshipExerciseOutcomes === 1, "profile portability report should include one flagship exercise outcome");

  const source = stage(report, "source-profile");
  assert(source.evidence.correctedFactId, "source stage should expose corrected memory fact id");
  assert(source.evidence.payload.practicePlan.completedSteps >= 1, "source stage should expose completed plan evidence");
  assert(source.evidence.payload.flagshipExerciseOutcome.sceneId === "channel-transfer-lab", "source stage should expose flagship exercise outcome");

  const replay = stage(report, "replay-debug");
  assert(replay.evidence.replay.source === "exported-event-log", "replay stage should use exported event log");
  assert(replay.evidence.replay.warnings.length === 0, "replay stage should be warning-free");

  const imported = stage(report, "import-profile");
  assert(imported.evidence.rendered.correctionAudit.includes("Corrected assumptions"), "import stage should render memory correction audit trail");
  assert(imported.evidence.rendered.outcomeHistory.includes("Outcome history"), "import stage should render guided outcome history");
  assert(imported.evidence.imported.flagshipExerciseOutcome.correct === 1, "import stage should preserve flagship exercise outcome");

  const formatted = formatProfilePortabilityReport(report);
  assert(formatted.includes("Profile Portability Report"), "formatter should include report title");
  assert(formatted.includes("Issues:\nnone"), "formatter should show empty issues");
}

function runMutationSmoke() {
  const missingEventLog = buildProfilePortabilityReport({
    payloadMutator(payload) {
      delete payload.eventLog;
    }
  });
  assert(missingEventLog.status === "fail", "profile portability should fail when export loses eventLog");
  assert(missingEventLog.issues.some(issue => issue.includes("event log")), "profile portability should explain missing event log");

  const missingCorrection = buildProfilePortabilityReport({
    payloadMutator(payload) {
      payload.memory.correctionRecords = [];
    }
  });
  assert(missingCorrection.status === "fail", "profile portability should fail when memory corrections are lost");
  assert(missingCorrection.issues.some(issue => issue.includes("memory correction")), "profile portability should explain missing memory correction");

  const missingOutcome = buildProfilePortabilityReport({
    payloadMutator(payload) {
      payload.guidedSessionOutcomes.outcomes = [];
      payload.guidedSessionOutcomes.totals.outcomes = 0;
    }
  });
  assert(missingOutcome.status === "fail", "profile portability should fail when guided outcomes are lost");
  assert(missingOutcome.issues.some(issue => issue.includes("guided outcome")), "profile portability should explain missing guided outcome");

  const missingFlagshipOutcome = buildProfilePortabilityReport({
    payloadMutator(payload) {
      Object.values(payload.trainers || {}).forEach(state => {
        state.attempts = (state.attempts || []).filter(attempt => attempt.itemId !== "channel-transfer-lab");
      });
    }
  });
  assert(missingFlagshipOutcome.status === "fail", "profile portability should fail when flagship exercise outcome is lost");
  assert(missingFlagshipOutcome.issues.some(issue => issue.includes("flagship exercise outcome")), "profile portability should explain missing flagship exercise outcome");

  const rawLeak = buildProfilePortabilityReport({
    payloadMutator(payload) {
      payload.memory.facts[0].copy = "portable secret expected";
    }
  });
  assert(rawLeak.status === "fail", "profile portability should fail when derived memory leaks raw text");
  assert(rawLeak.issues.some(issue => issue.includes("raw learner text")), "profile portability should explain raw text leakage");
}

function runCliSmoke() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-profile-portability-"));
  try {
    const out = path.join(tmp, "profile-portability.json");
    const built = runCli(["--out", out]);
    assert(built.status === 0, `CLI build should pass\n${built.stdout}\n${built.stderr}`);
    const report = JSON.parse(fs.readFileSync(out, "utf8"));
    assert(report.status === "pass", "CLI output report should pass");
    assert(report.stages.some(item => item.id === "post-import-replay"), "CLI output should include post-import replay stage");

    const json = runCli(["--json"]);
    assert(json.status === 0, `CLI JSON should pass\n${json.stdout}\n${json.stderr}`);
    assert(JSON.parse(json.stdout).traceId.startsWith("profileport-"), "CLI JSON should include trace id");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function run() {
  runBaseSmoke();
  runMutationSmoke();
  runCliSmoke();
  console.log("ok - profile portability proves export, import, and replay");
  console.log("ok - profile portability catches event log, correction, outcome, and privacy drift");
  console.log("ok - profile portability CLI writes public JSON artifacts");
}

run();

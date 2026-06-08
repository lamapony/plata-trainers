#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  buildReplayDebugReport,
  createReplayContext,
  formatReplayDebugReport
} = require("./debug-profile-replay.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function trainer() {
  return {
    id: "lesson-b2-radiator-register",
    name: "B2: Register & Particles",
    path: "./lessons/lesson-b2-radiator/"
  };
}

function seedState(context) {
  const kernel = context.PlataKernel;
  const state = kernel.freshState("lesson-b2-radiator-register");
  kernel.recordAttempt(state, {
    itemId: "official-reply-passive",
    correct: false,
    tags: ["B2", "lesson", "passive-agency"],
    mode: "lesson",
    expected: "secret expected text",
    given: "secret given text"
  });
  kernel.recordAttempt(state, {
    itemId: "official-reply-passive",
    correct: true,
    tags: ["B2", "repair", "passive-agency"],
    mode: "repair",
    expected: "secret expected text",
    given: "secret expected text"
  });
  kernel.recordRepairClosure(state, {
    signal: "passive-agency",
    itemId: "official-reply-passive",
    sceneId: "official-reply-passive",
    lessonId: "lesson-b2-radiator-register",
    label: "Read passive agency",
    action: "Name the missing actor",
    correct: true
  });
  kernel.recordAttempt(state, {
    itemId: "official-reply-passive-later",
    correct: false,
    tags: ["B2", "lesson", "passive-agency"],
    mode: "lesson",
    expected: "another secret expected text",
    given: "another secret given text"
  });
  return state;
}

function practicePlan() {
  return {
    schemaVersion: 1,
    trackedAt: "2026-06-08T08:00:00.000Z",
    kind: "repair",
    title: "Repair plan",
    fingerprint: "repair::lesson-b2-radiator-register::passive-agency",
    planToken: "ptest-replay",
    steps: [{
      number: 1,
      routeId: "s1-replay",
      kind: "repair",
      trainerId: "lesson-b2-radiator-register",
      signalTag: "passive-agency",
      title: "Repair passive agency",
      primaryHref: "./lessons/lesson-b2-radiator/?mode=repair&signal=passive-agency#official-reply-passive",
      startedAt: "2026-06-08T08:01:00.000Z",
      completedAt: "2026-06-08T08:05:00.000Z",
      completionEvidence: {
        reason: "smoke-test",
        correct: true,
        expected: "should not be exported in event evidence"
      }
    }]
  };
}

function seedPayload(context) {
  const state = seedState(context);
  const plan = practicePlan();
  const eventLog = context.PlataEvents.profileEventLog({
    trainers: [{ trainer: trainer(), state }],
    practicePlan: plan
  }, { kernel: context.PlataKernel });
  return {
    exportedAt: "2026-06-08T08:06:00.000Z",
    profileSchemaVersion: 1,
    schemaVersion: context.PlataKernel.schemaVersion,
    trainers: {
      "lesson-b2-radiator-register": state
    },
    practicePlan: plan,
    eventLog
  };
}

function runExportedReplaySmoke() {
  const context = createReplayContext();
  const payload = seedPayload(context);
  const report = buildReplayDebugReport(payload, { context });
  assert(report.source === "exported-event-log", "debugger should use exported event log when present");
  assert(report.eventCount === payload.eventLog.events.length, "debugger should replay every exported event");
  assert(report.warnings.length === 0, "fresh exported profile should not warn");
  assert(report.trainers[0].trainerId === "lesson-b2-radiator-register", "debugger should list trainer");
  assert(report.trainers[0].openSignals.some(signal => signal.tag === "passive-agency" && signal.reopenCount === 1), "debugger should show reopened open signal");
  assert(report.plans[0].planToken === "ptest-replay", "debugger should list replayed plan");
  assert(report.plans[0].completedSteps === 1, "debugger should replay completed plan steps");
  assert(!JSON.stringify(report).includes("secret expected text"), "debug report should not include raw expected text");
  assert(!JSON.stringify(report).includes("secret given text"), "debug report should not include raw given text");

  const formatted = formatReplayDebugReport(report);
  assert(formatted.includes("Profile Replay Debug Report"), "formatter should include report title");
  assert(formatted.includes("passive-agency"), "formatter should include signal");
  assert(formatted.includes("Warnings:\nnone"), "formatter should show no warnings");
}

function runLegacyReplaySmoke() {
  const context = createReplayContext();
  const payload = seedPayload(context);
  delete payload.eventLog;
  const report = buildReplayDebugReport(payload, { context });
  assert(report.source === "derived-from-profile", "legacy profile should derive event log");
  assert(report.warnings.some(warning => warning.includes("did not include eventLog")), "legacy profile should warn about derived replay");
  assert(report.trainers[0].openSignals.some(signal => signal.tag === "passive-agency"), "legacy derived replay should keep open signal");
}

function runTamperedReplaySmoke() {
  const context = createReplayContext();
  const payload = seedPayload(context);
  payload.eventLog.fingerprint = "ev-tampered";
  payload.eventLog.replay.eventCount = 1;
  const report = buildReplayDebugReport(payload, { context });
  assert(report.warnings.some(warning => warning.includes("fingerprint mismatch")), "tampered event log should warn about fingerprint");
  assert(report.warnings.some(warning => warning.includes("event count mismatch")), "tampered event log should warn about replay count");
}

function runCliSmoke() {
  const context = createReplayContext();
  const payload = seedPayload(context);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "plata-profile-replay-"));
  try {
    const file = path.join(dir, "profile.json");
    fs.writeFileSync(file, JSON.stringify(payload, null, 2));
    const result = spawnSync(process.execPath, ["scripts/debug-profile-replay.js", "--file", file], {
      cwd: repoRoot,
      encoding: "utf8"
    });
    assert(result.status === 0, `debug CLI failed:\n${result.stderr || result.stdout}`);
    assert(result.stdout.includes("Profile Replay Debug Report"), "debug CLI should print report title");
    assert(result.stdout.includes("ptest-replay"), "debug CLI should print plan token");
    assert(result.stdout.includes("passive-agency"), "debug CLI should print signal");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function run() {
  runExportedReplaySmoke();
  runLegacyReplaySmoke();
  runTamperedReplaySmoke();
  runCliSmoke();
  console.log("ok - profile replay debugger reads exported event logs");
  console.log("ok - profile replay debugger derives legacy profile timelines");
  console.log("ok - profile replay debugger reports tampered replay warnings");
  console.log("ok - profile replay debugger CLI renders maintainer summaries");
}

run();

#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..");
const kernelSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-kernel.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeContext(initialStorage) {
  const storage = Object.assign({}, initialStorage || {});
  const context = {
    console,
    window: {},
    globalThis: {},
    localStorage: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
      },
      setItem(key, value) {
        storage[key] = String(value);
      },
      removeItem(key) {
        delete storage[key];
      }
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(kernelSource, context, { filename: "shared/plata-kernel.js" });
  return { context, storage, kernel: context.PlataKernel };
}

function run() {
  let env = makeContext();
  let kernel = env.kernel;
  let handle = kernel.createTrainerState({ trainerId: "test", save: false });
  let state = handle.state;
  assert(state.schemaVersion === 2, "fresh state has schema version 2");
  assert(state.trainerId === "test", "fresh state has trainerId");
  assert(state.meta.totalAttempts === 0, "fresh state starts empty");
  assert(state.meta.gradedAttempts === 0, "fresh state tracks gradedAttempts");

  env = makeContext({
    "plata-old-v0": JSON.stringify({
      byItemId: { "x::1": { box: 3, correct: 2, wrong: 1, lastSeen: null, mastered: false } },
      meta: { createdAt: "2026-01-01T00:00:00.000Z", totalAttempts: 3, totalCorrect: 2, currentStreak: 1, longestStreak: 2 }
    })
  });
  kernel = env.kernel;
  handle = kernel.createTrainerState({ trainerId: "legacy", oldKeys: ["plata-old-v0"], save: false });
  state = handle.state;
  assert(state.schemaVersion === 2, "legacy migrates to schema v2");
  assert(state.byItemId["x::1"].box === 3, "old byItemId migrated");
  assert(state.createdAt === "2026-01-01T00:00:00.000Z", "old createdAt migrated");

  kernel.recordAttempt(state, {
    itemId: "x::1",
    correct: true,
    tags: ["verber", "nutid"],
    mode: "verber",
    expected: "går",
    given: "går",
    responseTimeMs: 1200,
    tries: 1
  });
  let rec = state.byItemId["x::1"];
  assert(state.meta.totalAttempts === 4, "recordAttempt increments total attempts");
  assert(state.meta.gradedAttempts === 4, "gradedAttempts preserves legacy lifetime totals and tracks the new objective attempt");
  assert(state.attempts[state.attempts.length - 1].assessmentKind === "objective", "default assessment is objective");
  assert(state.attempts[state.attempts.length - 1].responseTimeMs === 1200, "responseTimeMs preserved");
  assert(state.attempts[state.attempts.length - 1].tries === 1, "tries preserved");
  assert(state.meta.totalCorrect >= 1, "recordAttempt increments total correct");
  assert(rec.box === 4, "recordAttempt advances box");
  assert(rec.intervalDays === kernel.LEITNER_INTERVAL_DAYS[4], "correct answer schedules Leitner interval for new box");
  assert(typeof rec.nextDueAt === "string" && rec.nextDueAt.length > 10, "correct answer sets nextDueAt");

  kernel.recordAttempt(state, { itemId: "x::1", correct: false, tags: ["verber"] });
  rec = state.byItemId["x::1"];
  assert(rec.box === 1, "wrong answer resets box to 1");
  assert(rec.intervalDays === 1, "wrong answer schedules next day");
  assert(kernel.isItemDue(rec, rec.nextDueAt), "wrong answer is due at nextDueAt boundary");

  const exportDue = kernel.countDueItems(state);
  assert(typeof exportDue === "number", "countDueItems returns a number");

  const nowFixed = "2026-07-14T12:00:00.000Z";
  const pickItems = [
    { id: "overdue", rec: { box: 2, lastSeen: "2026-07-01T00:00:00.000Z", nextDueAt: "2026-07-10T00:00:00.000Z", wrong: 1, correct: 0 } },
    { id: "future", rec: { box: 3, lastSeen: "2026-07-13T00:00:00.000Z", nextDueAt: "2026-07-20T00:00:00.000Z", wrong: 0, correct: 2 } },
    { id: "fresh", rec: { box: 1, lastSeen: null, nextDueAt: null, wrong: 0, correct: 0 } }
  ];
  const picked = kernel.pickSessionItems(pickItems, { size: 2, now: nowFixed });
  assert(picked[0].id === "overdue", "picker prioritizes overdue items");
  assert(picked[1].id === "fresh", "picker takes new items before future-dated weak ones");

  const exported = kernel.exportState(state);
  const imported = kernel.importState(exported, "legacy");
  assert(imported.trainerId === "legacy", "import keeps trainerId");
  assert(imported.schemaVersion === 2, "import preserves schema v2");
  assert(imported.byItemId["x::1"].correct === rec.correct, "export/import preserves item record");

  const longHistory = kernel.migrateState({
    schemaVersion: 2,
    trainerId: "long-history",
    attempts: Array.from({ length: 1005 }, (_, i) => ({
      at: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString(),
      itemId: `long::${i}`,
      correct: true,
      assessmentKind: "objective",
      tags: ["long-history"]
    })),
    meta: {
      totalAttempts: 2500,
      gradedAttempts: 2200,
      totalCorrect: 1800,
      currentStreak: 1100,
      longestStreak: 1500
    }
  }, "long-history");
  assert(longHistory.attempts.length === 1000, "attempt history stays capped");
  assert(longHistory.meta.totalAttempts === 2500, "migration preserves lifetime attempts beyond the capped log");
  assert(longHistory.meta.gradedAttempts === 2200, "migration preserves lifetime graded attempts beyond the capped log");
  assert(longHistory.meta.totalCorrect === 1800, "migration preserves lifetime correct attempts beyond the capped log");
  assert(longHistory.meta.currentStreak === 1100, "migration preserves a streak longer than the capped log");

  const gateState = kernel.freshState("gate");
  for (let i = 0; i < 99; i++) {
    kernel.recordAttempt(gateState, { itemId: "verb::" + i, correct: true, tags: ["verber", "nutid"], mode: "verber" });
  }
  let gate = kernel.computeGate(gateState, { name: "M0 verber gate", tags: ["verber"], mode: "verber", minAttempts: 100, minAccuracy: 0.8 });
  assert(gate.ready === false && gate.total === 99, "gate not ready before 100 attempts");
  kernel.recordAttempt(gateState, { itemId: "verb::99", correct: false, tags: ["verber", "datid"], mode: "verber" });
  gate = kernel.computeGate(gateState, { name: "M0 verber gate", tags: ["verber"], mode: "verber", minAttempts: 100, minAccuracy: 0.8 });
  assert(gate.ready === true && gate.total === 100 && gate.correct === 99, "gate ready at >=80% over 100 attempts");

  for (let i = 0; i < 100; i++) {
    kernel.recordAttempt(gateState, {
      itemId: "noun-fill::" + i,
      correct: i < 90,
      tags: ["substantiver", "flertal"],
      mode: "substantiver"
    });
  }
  const nounGate = kernel.computeGate(gateState, {
    name: "M0 nouns",
    tags: ["substantiver"],
    mode: "substantiver",
    minAttempts: 100,
    minAccuracy: 0.9
  });
  assert(nounGate.ready === true && nounGate.total === 100 && nounGate.correct === 90, "noun gate ready at >=90% over 100 attempts");
  const nounShort = kernel.computeGate(gateState, {
    name: "M0 nouns strict",
    tags: ["substantiver"],
    mode: "substantiver",
    minAttempts: 100,
    minAccuracy: 0.91
  });
  assert(nounShort.ready === false, "noun gate not ready below 90% threshold when set higher");

  kernel.recordAttempt(gateState, { itemId: "noun::1", correct: false, tags: ["substantiver", "flertal"], mode: "substantiver" });
  kernel.recordAttempt(gateState, { itemId: "noun::2", correct: false, tags: ["substantiver", "flertal"], mode: "substantiver" });
  const weak = kernel.getWeakTags(gateState, 3);
  assert(weak.length > 0, "weak tags returned");
  assert(weak.some((tag) => tag.tag === "substantiver"), "weak tags include low-performing tag");

  const closureState = kernel.freshState("closure");
  kernel.recordAttempt(closureState, { itemId: "tone::1", correct: false, tags: ["tone", "passive-agency"], mode: "lesson" });
  assert(kernel.getWeakTags(closureState, 5).some((tag) => tag.tag === "passive-agency"), "open weak signal is visible");
  kernel.recordAttempt(closureState, { itemId: "tone::1", correct: true, tags: ["tone", "passive-agency"], mode: "repair" });
  const closure = kernel.recordRepairClosure(closureState, {
    signal: "passive-agency",
    itemId: "tone::1",
    sceneId: "tone::1",
    lessonId: "closure",
    label: "Read passive agency",
    action: "Name the missing actor",
    correct: true
  });
  assert(closure && closure.signal === "passive-agency", "repair closure records signal");
  assert(closure.attemptCount === closureState.attempts.length, "repair closure records attempt boundary");
  assert(kernel.isSignalResolved(closureState, "passive-agency"), "closed signal is resolved");
  assert(!kernel.getWeakTags(closureState, 5).some((tag) => tag.tag === "passive-agency"), "resolved weak signal is retired by default");
  assert(kernel.getWeakTags(closureState, 5, { includeResolved: true }).some((tag) => tag.tag === "passive-agency"), "resolved weak signal stays available for diagnostics");
  kernel.recordAttempt(closureState, { itemId: "tone::2", correct: false, tags: ["tone", "passive-agency"], mode: "lesson" });
  assert(!kernel.isSignalResolved(closureState, "passive-agency"), "later miss reopens a repaired signal");
  assert(kernel.getWeakTags(closureState, 5).some((tag) => tag.tag === "passive-agency"), "reopened weak signal is visible again");

  const rolloverClosure = kernel.freshState("rollover-closure");
  rolloverClosure.attempts = Array.from({ length: 1000 }, (_, i) => ({
    at: `2026-01-01T00:${String(Math.floor(i / 60)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}.000Z`,
    itemId: `old::${i}`,
    assessmentKind: "objective",
    correct: true,
    completed: true,
    tags: ["other"],
    mode: "lesson",
    expected: "",
    given: ""
  }));
  rolloverClosure.meta.totalAttempts = 1000;
  rolloverClosure.meta.gradedAttempts = 1000;
  rolloverClosure.meta.totalCorrect = 1000;
  rolloverClosure.meta.repairClosures["rollover-signal"] = {
    signal: "rollover-signal",
    correct: true,
    resolvedAt: "2026-01-02T00:00:00.000Z",
    attemptCount: 1000
  };
  rolloverClosure.attempts.shift();
  rolloverClosure.attempts.push({
    at: "2026-01-03T00:00:00.000Z",
    itemId: "new-miss",
    assessmentKind: "objective",
    correct: false,
    completed: true,
    tags: ["rollover-signal"],
    mode: "lesson",
    expected: "",
    given: ""
  });
  assert(!kernel.isSignalResolved(rolloverClosure, "rollover-signal"), "post-rollover miss reopens a repaired signal by timestamp");

  // Self-report must not inflate accuracy, box, mastery, or streak
  const skrive = kernel.freshState("skrive");
  kernel.recordAttempt(skrive, {
    itemId: "w::bolig::1",
    assessmentKind: "self-report",
    correct: null,
    completed: true,
    tags: ["skrive", "bolig"],
    reason: "self-grade",
    rubricPassed: true,
    lengthPassed: true,
    charCount: 80
  });
  assert(skrive.meta.totalAttempts === 1, "self-report counts toward totalAttempts");
  assert(skrive.meta.gradedAttempts === 0, "self-report does not count toward gradedAttempts");
  assert(skrive.meta.totalCorrect === 0, "self-report does not raise totalCorrect");
  assert(skrive.meta.currentStreak === 0, "self-report does not raise streak");
  assert(skrive.byItemId["w::bolig::1"].box === 1, "self-report does not advance box");
  assert(skrive.byItemId["w::bolig::1"].mastered === false, "self-report does not master");
  assert(kernel.getStats(skrive).accuracyPct === null, "accuracy ignores self-report-only activity");
  assert(skrive.attempts[0].correct === null, "self-report stores correct as null");
  assert(skrive.attempts[0].completed === true, "self-report stores completed");

  // Legacy skrive v1 → v2 reclassify + one-time backup
  env = makeContext({
    [kernel.stateKey("skrive")]: JSON.stringify({
      schemaVersion: 1,
      trainerId: "skrive",
      byItemId: {
        "w::bolig::legacy": { box: 5, correct: 4, wrong: 0, mastered: true, lastSeen: "2026-01-02T00:00:00.000Z" }
      },
      attempts: [
        { at: "2026-01-02T00:00:00.000Z", itemId: "w::bolig::legacy", correct: true, tags: ["skrive"], reason: "self-grade" }
      ],
      meta: { totalAttempts: 1, totalCorrect: 1, currentStreak: 1, longestStreak: 1 }
    })
  });
  kernel = env.kernel;
  handle = kernel.createTrainerState({ trainerId: "skrive", save: true });
  state = handle.state;
  assert(state.schemaVersion === 2, "skrive migrates to v2");
  assert(state.attempts[0].assessmentKind === "self-report", "legacy skrive attempts reclassified");
  assert(state.byItemId["w::bolig::legacy"].mastered === false, "legacy skrive mastery cleared");
  assert(state.byItemId["w::bolig::legacy"].box === 1, "legacy skrive box reset");
  assert(state.meta.gradedAttempts === 0, "legacy skrive gradedAttempts is zero");
  assert(state.meta.totalCorrect === 0, "legacy skrive totalCorrect is cleared");
  assert(state.meta.currentStreak === 0 && state.meta.longestStreak === 0, "legacy skrive correctness streaks are cleared");
  assert(env.storage[kernel.SKRIVE_LEGACY_BACKUP_KEY], "legacy skrive backup written once");

  console.log("ok - fresh state creation");
  console.log("ok - old-state migration shape");
  console.log("ok - recordAttempt totals/streak/item box + Leitner schedule");
  console.log("ok - Leitner picker overdue → new");
  console.log("ok - export/import roundtrip");
  console.log("ok - M0 gate readiness");
  console.log("ok - weak tag extraction");
  console.log("ok - repair closure retires and reopens weak signals");
  console.log("ok - self-report isolation");
  console.log("ok - legacy skrive reclassify + backup");
}

run();

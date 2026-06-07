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
  assert(state.schemaVersion === 1, "fresh state has schema version");
  assert(state.trainerId === "test", "fresh state has trainerId");
  assert(state.meta.totalAttempts === 0, "fresh state starts empty");

  env = makeContext({
    "plata-old-v0": JSON.stringify({
      byItemId: { "x::1": { box: 3, correct: 2, wrong: 1, lastSeen: null, mastered: false } },
      meta: { createdAt: "2026-01-01T00:00:00.000Z", totalAttempts: 3, totalCorrect: 2, currentStreak: 1, longestStreak: 2 }
    })
  });
  kernel = env.kernel;
  handle = kernel.createTrainerState({ trainerId: "legacy", oldKeys: ["plata-old-v0"], save: false });
  state = handle.state;
  assert(state.byItemId["x::1"].box === 3, "old byItemId migrated");
  assert(state.createdAt === "2026-01-01T00:00:00.000Z", "old createdAt migrated");

  kernel.recordAttempt(state, { itemId: "x::1", correct: true, tags: ["verber", "nutid"], mode: "verber", expected: "går", given: "går" });
  let rec = state.byItemId["x::1"];
  assert(state.meta.totalAttempts === 4, "recordAttempt increments total attempts");
  assert(state.meta.totalCorrect === 3, "recordAttempt increments total correct");
  assert(state.meta.currentStreak === 2, "recordAttempt increments streak");
  assert(rec.box === 4, "recordAttempt advances box");

  const exported = kernel.exportState(state);
  const imported = kernel.importState(exported, "legacy");
  assert(imported.trainerId === "legacy", "import keeps trainerId");
  assert(imported.byItemId["x::1"].correct === rec.correct, "export/import preserves item record");

  const gateState = kernel.freshState("gate");
  for (let i = 0; i < 99; i++) {
    kernel.recordAttempt(gateState, { itemId: "verb::" + i, correct: true, tags: ["verber", "nutid"], mode: "verber" });
  }
  let gate = kernel.computeGate(gateState, { name: "M0 verber gate", tags: ["verber"], mode: "verber", minAttempts: 100, minAccuracy: 0.8 });
  assert(gate.ready === false && gate.total === 99, "gate not ready before 100 attempts");
  kernel.recordAttempt(gateState, { itemId: "verb::99", correct: false, tags: ["verber", "datid"], mode: "verber" });
  gate = kernel.computeGate(gateState, { name: "M0 verber gate", tags: ["verber"], mode: "verber", minAttempts: 100, minAccuracy: 0.8 });
  assert(gate.ready === true && gate.total === 100 && gate.correct === 99, "gate ready at >=80% over 100 attempts");

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

  console.log("ok - fresh state creation");
  console.log("ok - old-state migration shape");
  console.log("ok - recordAttempt totals/streak/item box");
  console.log("ok - export/import roundtrip");
  console.log("ok - M0 gate readiness");
  console.log("ok - weak tag extraction");
  console.log("ok - repair closure retires and reopens weak signals");
}

run();

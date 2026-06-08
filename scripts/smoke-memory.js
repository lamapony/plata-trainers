#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const kernelSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-kernel.js"), "utf8");
const eventsSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-events.js"), "utf8");
const memorySource = fs.readFileSync(path.join(repoRoot, "shared", "plata-memory.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeContext() {
  const context = {
    console,
    Date,
    JSON,
    Math,
    Number,
    Object,
    String,
    Array,
    localStorage: {
      getItem() { return null; },
      setItem() {},
      removeItem() {}
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(kernelSource, context, { filename: "shared/plata-kernel.js" });
  vm.runInContext(eventsSource, context, { filename: "shared/plata-events.js" });
  vm.runInContext(memorySource, context, { filename: "shared/plata-memory.js" });
  return context;
}

function trainer() {
  return {
    id: "lesson-b2-radiator-register",
    name: "B2: Register & Particles",
    path: "./lessons/lesson-b2-radiator/"
  };
}

function setAttemptAt(state, index, at) {
  state.attempts[index].at = at;
  state.updatedAt = at;
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
  setAttemptAt(state, 0, "2026-05-01T08:00:00.000Z");

  kernel.recordAttempt(state, {
    itemId: "official-reply-passive",
    correct: false,
    tags: ["B2", "lesson", "passive-agency"],
    mode: "lesson",
    expected: "another secret expected text",
    given: "another secret given text"
  });
  setAttemptAt(state, 1, "2026-05-03T08:00:00.000Z");

  kernel.recordAttempt(state, {
    itemId: "official-reply-passive",
    correct: true,
    tags: ["B2", "lesson", "passive-agency"],
    mode: "lesson"
  });
  setAttemptAt(state, 2, "2026-05-05T08:00:00.000Z");

  kernel.recordAttempt(state, {
    itemId: "group-chat-particles",
    correct: false,
    tags: ["B2", "lesson", "modal-particle-stance"],
    mode: "lesson"
  });
  setAttemptAt(state, 3, "2026-05-06T08:00:00.000Z");

  kernel.recordAttempt(state, {
    itemId: "group-chat-particles",
    correct: true,
    tags: ["B2", "repair", "modal-particle-stance"],
    mode: "repair"
  });
  setAttemptAt(state, 4, "2026-05-07T08:00:00.000Z");
  kernel.recordRepairClosure(state, {
    signal: "modal-particle-stance",
    itemId: "group-chat-particles",
    sceneId: "group-chat-particles",
    lessonId: "lesson-b2-radiator-register",
    label: "Read particle stance",
    action: "Name the stance before choosing advice",
    correct: true
  });
  state.meta.repairClosures["modal-particle-stance"].resolvedAt = "2026-05-07T08:05:00.000Z";

  ["2026-06-06T08:00:00.000Z", "2026-06-07T08:00:00.000Z", "2026-06-08T08:00:00.000Z"].forEach((at) => {
    kernel.recordAttempt(state, {
      itemId: "two-registers",
      correct: true,
      tags: ["B2", "lesson", "formal-register-control"],
      mode: "lesson"
    });
    setAttemptAt(state, state.attempts.length - 1, at);
  });

  return state;
}

function practicePlan() {
  return {
    planToken: "p-memory-smoke",
    fingerprint: "plan-memory-smoke",
    kind: "repair",
    title: "Repair plan",
    trackedAt: "2026-06-08T08:00:00.000Z",
    steps: [{
      number: 1,
      routeId: "s1-memory",
      kind: "repair",
      trainerId: "lesson-b2-radiator-register",
      signalTag: "passive-agency",
      title: "Repair passive agency",
      primaryHref: "./lessons/lesson-b2-radiator/?mode=repair&signal=passive-agency#official-reply-passive",
      completedAt: "2026-06-08T08:15:00.000Z",
      completionEvidence: {
        reason: "unit-test",
        trainerId: "lesson-b2-radiator-register",
        correct: true,
        expected: "should not leak"
      }
    }]
  };
}

function byKind(facts, kind) {
  return facts.filter(fact => fact.kind === kind);
}

function findFact(facts, kind, signal) {
  return facts.find(fact => fact.kind === kind && fact.signal === signal);
}

function run() {
  const context = makeContext();
  const state = seedState(context);
  const input = {
    trainers: [{ trainer: trainer(), state }],
    practicePlan: practicePlan()
  };
  const options = {
    kernel: context.PlataKernel,
    now: "2026-06-08T12:00:00.000Z",
    reviewDays: 7,
    staleDays: 21
  };
  const facts = context.PlataMemory.compileMemoryFacts(input, options);
  const factsAgain = context.PlataMemory.compileMemoryFacts(input, options);

  assert(facts.length >= 6, "memory compiler returns multiple fact types");
  assert(JSON.stringify(facts) === JSON.stringify(factsAgain), "memory facts are deterministic");
  assert(context.PlataMemory.memoryFingerprint(facts) === context.PlataMemory.memoryFingerprint(factsAgain), "memory fingerprint is stable");

  const weak = findFact(facts, "weak_signal", "passive-agency");
  assert(weak, "memory includes open weak signal");
  assert(weak.status === "open", "weak signal is open");
  assert(weak.sourceEventIds.length >= 3, "weak signal cites source event ids");
  assert(/^memsrc-/.test(weak.sourceFingerprint), "weak signal has source fingerprint");
  assert(weak.confidence > 0.5 && weak.confidence <= 0.98, "weak signal confidence is bounded");

  const trap = findFact(facts, "recurring_trap", "passive-agency");
  assert(trap, "memory includes recurring trap");
  assert(trap.evidence.some(row => row.label === "recurrence"), "recurring trap explains recurrence");

  const repaired = findFact(facts, "repaired_signal", "modal-particle-stance");
  assert(repaired && repaired.status === "resolved", "memory includes repaired signal");

  const strength = findFact(facts, "stable_strength", "formal-register-control");
  assert(strength && strength.status === "stable", "memory includes stable strength");

  const stale = findFact(facts, "stale_skill", "passive-agency");
  assert(stale && stale.evidence.some(row => row.label === "daysSinceLastSeen"), "memory includes stale skill with age evidence");

  const due = findFact(facts, "next_review_due", "passive-agency");
  assert(due && due.status === "due", "memory includes due review");

  const contextFact = byKind(facts, "preferred_context")[0];
  assert(contextFact && contextFact.signal === "repair", "memory includes completed practice context");

  const summary = context.PlataMemory.summarizeMemoryFacts(facts);
  assert(summary.total === facts.length, "memory summary counts facts");
  assert(summary.byKind.weak_signal >= 1, "memory summary counts weak signals");
  assert(summary.openSignals >= 2, "memory summary counts open weak/trap facts");

  const serialized = JSON.stringify(facts);
  assert(!serialized.includes("secret expected text"), "memory facts exclude raw expected answer text");
  assert(!serialized.includes("secret given text"), "memory facts exclude raw given answer text");
  assert(!serialized.includes("should not leak"), "memory facts exclude raw practice-plan answer text");
  assert(facts.every(fact => fact.privacy && fact.privacy.containsRawAnswerText === false), "memory facts carry privacy marker");

  console.log("ok - memory facts compile weak, repaired, stale, due, strength, and context facts");
  console.log("ok - memory facts are deterministic and source-fingerprinted");
  console.log("ok - memory facts stay privacy-conscious");
}

run();

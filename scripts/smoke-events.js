#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const kernelSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-kernel.js"), "utf8");
const plannerSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-planner.js"), "utf8");
const eventsSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-events.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeContext() {
  const storage = {};
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
  vm.runInContext(plannerSource, context, { filename: "shared/plata-planner.js" });
  vm.runInContext(eventsSource, context, { filename: "shared/plata-events.js" });
  return context;
}

function trainer() {
  return {
    id: "lesson-b2-radiator-register",
    name: "B2: Register & Particles",
    path: "./lessons/lesson-b2-radiator/"
  };
}

function seedReopenedSignal(context) {
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

function eventTypes(events) {
  return events.map(event => event.type);
}

function runTrainerEventSmoke(context) {
  const state = seedReopenedSignal(context);
  const log = context.PlataEvents.profileEventLog({
    trainers: [{ trainer: trainer(), state }]
  }, { kernel: context.PlataKernel });

  assert(log.schemaVersion === 1, "profile event log marks schema version");
  assert(log.fingerprint === context.PlataEvents.profileEventLog({ trainers: [{ trainer: trainer(), state }] }, { kernel: context.PlataKernel }).fingerprint, "profile event fingerprint is stable");
  assert(log.events.length === 5, "profile event log derives attempts, closure, and reopen event");
  assert(eventTypes(log.events).filter(type => type === "attempt.recorded").length === 3, "event log records every attempt");
  assert(log.events.some(event => event.type === "repair.closed"), "event log records repair closure");
  assert(log.events.some(event => event.type === "signal.reopened"), "event log records later reopened signal");
  assert(!JSON.stringify(log.events).includes("secret expected text"), "event log excludes raw expected answer text");
  assert(!JSON.stringify(log.events).includes("secret given text"), "event log excludes raw given answer text");

  const attempt = log.events.find(event => event.type === "attempt.recorded" && event.correct === false);
  assert(attempt.diagnosticTags.join("|") === "passive-agency", "attempt events keep diagnostic tags only");
  assert(attempt.privacy.hasExpectedText && attempt.privacy.hasGivenText, "attempt events keep privacy flags");

  const replay = log.replay.trainers["lesson-b2-radiator-register"];
  assert(replay.attempts === 3, "replay rebuilds trainer attempt count");
  assert(replay.correct === 1 && replay.wrong === 2, "replay rebuilds correct and wrong counts");
  assert(replay.signals["passive-agency"].status === "open", "replay applies reopened signal status");
  assert(replay.signals["passive-agency"].reopenCount === 1, "replay counts signal reopen events");
}

function runClosedSignalSmoke(context) {
  const kernel = context.PlataKernel;
  const state = kernel.freshState("lesson-b2-radiator-register");
  kernel.recordAttempt(state, {
    itemId: "official-reply-passive",
    correct: false,
    tags: ["B2", "lesson", "passive-agency"],
    mode: "lesson"
  });
  kernel.recordAttempt(state, {
    itemId: "official-reply-passive",
    correct: true,
    tags: ["B2", "repair", "passive-agency"],
    mode: "repair"
  });
  kernel.recordRepairClosure(state, {
    signal: "passive-agency",
    itemId: "official-reply-passive",
    correct: true
  });

  const log = context.PlataEvents.profileEventLog({
    trainers: [{ trainer: trainer(), state }]
  }, { kernel });
  assert(!log.events.some(event => event.type === "signal.reopened"), "closed signal does not emit reopen event");
  assert(log.replay.trainers["lesson-b2-radiator-register"].signals["passive-agency"].status === "closed", "replay keeps resolved signal closed");
}

function runPracticePlanEventSmoke(context) {
  const planner = context.PlataPlanner;
  const plan = planner.savePracticePlan({
    kind: "repair",
    title: "Repair plan",
    copy: "Track a repair step.",
    steps: [{
      number: 1,
      kind: "repair",
      trainerId: "lesson-b2-radiator-register",
      signalTag: "passive-agency",
      title: "Repair passive agency",
      primaryLabel: "Open repair scene",
      primaryHref: "./lessons/lesson-b2-radiator/?mode=repair&signal=passive-agency#official-reply-passive"
    }]
  });
  plan.steps[0].startedAt = "2026-06-08T08:00:00.000Z";
  plan.steps[0].completedAt = "2026-06-08T08:05:00.000Z";
  plan.steps[0].completionEvidence = {
    reason: "unit-test",
    trainerId: "lesson-b2-radiator-register",
    correct: true,
    expected: "should be dropped"
  };

  const log = context.PlataEvents.profileEventLog({ practicePlan: plan });
  assert(eventTypes(log.events).join("|") === "plan.compiled|plan.step.started|plan.step.completed", "practice-plan events are ordered");
  assert(log.events[2].evidence.reason === "unit-test", "completion event keeps allowed evidence");
  assert(!Object.prototype.hasOwnProperty.call(log.events[2].evidence, "expected"), "completion event drops raw text evidence");
  assert(log.replay.plans[plan.planToken].startedSteps === 1, "replay counts started plan steps");
  assert(log.replay.plans[plan.planToken].completedSteps === 1, "replay counts completed plan steps");
}

function run() {
  const context = makeContext();
  runTrainerEventSmoke(context);
  runClosedSignalSmoke(context);
  runPracticePlanEventSmoke(context);
  console.log("ok - events derive attempts, repairs, and reopened signals");
  console.log("ok - events keep exported payloads privacy-conscious");
  console.log("ok - events replay trainer and practice-plan facts deterministically");
}

run();

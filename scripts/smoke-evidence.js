#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const kernelSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-kernel.js"), "utf8");
const evidenceSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-evidence.js"), "utf8");
const radiatorLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-radiator", "data.js"), "utf8");

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
    Array
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(kernelSource, context, { filename: "shared/plata-kernel.js" });
  vm.runInContext(evidenceSource, context, { filename: "shared/plata-evidence.js" });
  vm.runInContext(radiatorLessonSource, context, { filename: "lessons/lesson-b2-radiator/data.js" });
  return context;
}

function trainer() {
  return {
    id: "lesson-b2-radiator-register",
    name: "B2: Register & Particles",
    icon: "B2",
    path: "./lessons/lesson-b2-radiator/"
  };
}

function masterySignal() {
  return {
    tag: "passive-agency",
    label: "Read passive agency",
    evidence: "The learner notices missing actors in passive process language.",
    wrong: 1,
    correct: 0,
    total: 1,
    score: 1,
    competency: { label: "Agency and responsibility" },
    remediation: { action: "Name the missing actor" }
  };
}

function seedMiss(context) {
  const state = context.PlataKernel.freshState("lesson-b2-radiator-register");
  context.PlataKernel.recordAttempt(state, {
    itemId: "official-reply-passive",
    correct: false,
    tags: ["B2", "passive", "passive-agency"],
    mode: "lesson",
    expected: "The case is registered without a promised date.",
    given: "They promise a fast repair."
  });
  return state;
}

function build(context, state, weakMastery) {
  return context.PlataEvidence.buildLedger([{
    trainer: trainer(),
    state,
    stats: { weakMastery: weakMastery || [] }
  }], {
    kernel: context.PlataKernel,
    masterySpec(tag) {
      return context.PLATA_LESSON_B2_RADIATOR.masteryMap[tag] || null;
    }
  });
}

function runOpenSignalSmoke(context) {
  const state = seedMiss(context);
  const entries = build(context, state, [masterySignal()]);
  assert(entries[0].kind === "open", "evidence ledger prioritizes open mastery signals");
  assert(entries[0].title === "Read passive agency", "open evidence entry uses mastery label");
  assert(entries[0].facts.includes("1 wrong / 1 total"), "open evidence entry includes signal counts");
  assert(entries[0].facts.some(fact => fact.includes("Root skill: Agency and responsibility")), "open evidence entry includes root skill");
  assert(entries.some(entry => entry.kind === "miss"), "evidence ledger keeps recent missed attempts");
}

function runClosedAndReopenedSmoke(context) {
  const state = seedMiss(context);
  context.PlataKernel.recordAttempt(state, {
    itemId: "official-reply-passive",
    correct: true,
    tags: ["B2", "passive", "passive-agency"],
    mode: "repair",
    expected: "The case is registered without a promised date.",
    given: "The case is registered without a promised date."
  });
  context.PlataKernel.recordRepairClosure(state, {
    signal: "passive-agency",
    itemId: "official-reply-passive",
    sceneId: "official-reply-passive",
    lessonId: "lesson-b2-radiator-register",
    label: "Read passive agency",
    action: "Name the missing actor",
    correct: true
  });

  const closed = build(context, state, []);
  assert(closed[0].kind === "closed", "resolved repair closure becomes a closed evidence entry");
  assert(closed[0].facts.includes("passive-agency"), "closed evidence entry keeps the signal key");
  assert(closed[0].facts.some(fact => fact.includes("Closed after 2 attempts")), "closed evidence entry records attempt boundary");

  context.PlataKernel.recordAttempt(state, {
    itemId: "official-reply-passive-later",
    correct: false,
    tags: ["B2", "passive", "passive-agency"],
    mode: "lesson",
    expected: "The case is registered without a promised date.",
    given: "They promise a fast repair."
  });
  const reopened = build(context, state, []);
  assert(reopened[0].kind === "reopened", "later miss after repair closure reopens the evidence entry");
  assert(reopened[0].copy.includes("Later evidence"), "reopened evidence entry explains why it is active again");
}

function runUtilitySmoke(context) {
  const evidence = context.PlataEvidence;
  const tags = evidence.diagnosticTags(["B2", "lesson", "repair", "passive-agency", "modal-particle-stance"], { limit: 2 });
  assert(tags.join("|") === "passive-agency|modal-particle-stance", "diagnosticTags drops non-diagnostic tags");
  assert(evidence.entriesForTrainer({}).length === 0, "entriesForTrainer tolerates missing state");
}

function run() {
  const context = makeContext();
  runOpenSignalSmoke(context);
  runClosedAndReopenedSmoke(context);
  runUtilitySmoke(context);
  console.log("ok - evidence ledger ranks open, closed, and reopened signals");
  console.log("ok - evidence ledger preserves repair closure and attempt facts");
}

run();

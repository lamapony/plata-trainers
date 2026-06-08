#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const fixturePath = path.join(repoRoot, "scripts", "fixtures", "learner-memory-profiles.json");
const sourceFiles = [
  "shared/plata-events.js",
  "shared/plata-competencies.js",
  "shared/plata-memory.js",
  "shared/plata-memory-vault.js"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableJson(value) {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function fixedDateConstructor(fixedNow) {
  const RealDate = Date;
  function FixedDate(...args) {
    if (!(this instanceof FixedDate)) {
      return (args.length ? new RealDate(...args) : new RealDate(fixedNow)).toString();
    }
    return args.length ? new RealDate(...args) : new RealDate(fixedNow);
  }
  Object.setPrototypeOf(FixedDate, RealDate);
  FixedDate.prototype = RealDate.prototype;
  FixedDate.now = () => new RealDate(fixedNow).getTime();
  FixedDate.parse = RealDate.parse;
  FixedDate.UTC = RealDate.UTC;
  return FixedDate;
}

function makeContext(fixedNow) {
  const context = {
    console,
    Date: fixedDateConstructor(fixedNow),
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
  sourceFiles.forEach(relPath => {
    vm.runInContext(fs.readFileSync(path.join(repoRoot, relPath), "utf8"), context, { filename: relPath });
  });
  return context;
}

function compileCrossLessonFacts(context, fixedNow) {
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const profile = fixture.profiles.find(item => item.id === "cross-lesson-agency-trap");
  assert(profile, "cross-lesson memory profile fixture is required");
  return context.PlataMemory.compileMemoryFacts({ events: profile.events }, {
    now: fixedNow,
    reviewDays: Number(profile.reviewDays || 7),
    staleDays: Number(profile.staleDays || 21)
  });
}

function createSampleVault(context, facts, fixedNow) {
  return context.PlataMemoryVault.createVault({
    fingerprint: context.PlataMemory.memoryFingerprint(facts),
    summary: context.PlataMemory.summarizeMemoryFacts(facts),
    facts,
    deletedFactIds: ["mem-hidden-later"],
    correctionRecords: [{
      schemaVersion: 1,
      factId: facts[0].id,
      reason: "learner-marked-incorrect",
      correctedAt: fixedNow,
      kind: facts[0].kind,
      signal: facts[0].signal,
      trainerId: facts[0].trainerId,
      sourceFingerprint: facts[0].sourceFingerprint
    }]
  }, {
    exportedAt: fixedNow
  });
}

function runMutation(name, mutate, expectedMessage) {
  const context = makeContext("2026-06-08T12:00:00.000Z");
  const facts = compileCrossLessonFacts(context, "2026-06-08T12:00:00.000Z");
  const input = {
    fingerprint: context.PlataMemory.memoryFingerprint(facts),
    summary: context.PlataMemory.summarizeMemoryFacts(facts),
    facts
  };
  const vault = createSampleVault(context, facts, "2026-06-08T12:00:00.000Z");
  try {
    mutate({ context, input, vault });
  } catch (err) {
    assert(String(err.message || "").includes(expectedMessage), `${name}: expected "${expectedMessage}", got "${err.message}"`);
    console.log(`ok - memory vault mutation caught: ${name}`);
    return;
  }
  throw new Error(`${name}: mutation should have failed`);
}

function run() {
  const fixedNow = "2026-06-08T12:00:00.000Z";
  const context = makeContext(fixedNow);
  const facts = compileCrossLessonFacts(context, fixedNow);
  const vault = createSampleVault(context, facts, fixedNow);
  const validation = context.PlataMemoryVault.validateVault(vault);

  assert(validation.status === "pass", `vault should validate: ${validation.issues.join("; ")}`);
  assert(vault.vaultType === "plata.memory-vault", "vault type should be explicit");
  assert(vault.factCount === facts.length, "vault fact count should match compacted facts");
  assert(vault.facts.some(fact => fact.kind === "root_competency_trap"), "vault should preserve root competency facts");
  assert(vault.facts.every(fact => !Object.prototype.hasOwnProperty.call(fact, "sourceEventIds")), "vault should strip source event ids");
  assert(vault.privacy.derivedFactsOnly === true, "vault should declare derived-fact-only privacy");
  assert(vault.privacy.excludesTrainerState === true, "vault should exclude trainer state");
  assert(vault.privacy.excludesEventLog === true, "vault should exclude event logs");
  assert(vault.privacy.excludesRawAnswers === true, "vault should exclude raw answers");
  assert(vault.fingerprint === context.PlataMemoryVault.vaultFingerprint(vault), "vault fingerprint should be stable");

  const serialized = JSON.stringify(vault);
  assert(!serialized.includes("raw-cross-secret"), "vault should not contain fixture raw answer text");
  assert(!serialized.includes("sourceEventIds"), "vault should not contain source event ids");
  assert(!serialized.includes("eventLog"), "vault should not contain event logs");
  assert(!serialized.includes("practicePlan"), "vault should not contain practice plans");
  assert(!Object.prototype.hasOwnProperty.call(vault, "trainers"), "vault should not contain trainer states");

  runMutation("raw expected key", ({ context, input }) => {
    input.facts[0].expected = "secret expected text";
    context.PlataMemoryVault.createVault(input);
  }, "raw answer-like key");
  runMutation("raw text value", ({ context, input }) => {
    input.facts[0].copy = "secret given text";
    context.PlataMemoryVault.createVault(input);
  }, "raw learner answer text");
  runMutation("event log payload", ({ context, input }) => {
    input.eventLog = { events: [] };
    context.PlataMemoryVault.createVault(input);
  }, "forbidden account-vault key");
  runMutation("source event ids in vault", ({ context, vault }) => {
    vault.facts[0].sourceEventIds = ["event-1"];
    const result = context.PlataMemoryVault.validateVault(vault);
    if (result.status === "fail" && result.issues.some(issue => issue.includes("sourceEventIds"))) {
      throw new Error("sourceEventIds should fail validation");
    }
  }, "sourceEventIds should fail validation");
  runMutation("duplicate fact ids", ({ context, vault }) => {
    vault.facts.push(clone(vault.facts[0]));
    vault.fingerprint = context.PlataMemoryVault.vaultFingerprint(vault);
    const result = context.PlataMemoryVault.validateVault(vault);
    if (result.status === "fail" && result.issues.some(issue => issue.includes("duplicate fact id"))) {
      throw new Error("duplicate fact id should fail validation");
    }
  }, "duplicate fact id should fail validation");
  runMutation("privacy flag drift", ({ context, vault }) => {
    vault.privacy.excludesRawAnswers = false;
    const result = context.PlataMemoryVault.validateVault(vault);
    if (result.status === "fail" && result.issues.some(issue => issue.includes("privacy.excludesRawAnswers"))) {
      throw new Error("privacy flag drift should fail validation");
    }
  }, "privacy flag drift should fail validation");
  runMutation("fact count drift", ({ context, vault }) => {
    vault.factCount = vault.facts.length + 1;
    const result = context.PlataMemoryVault.validateVault(vault);
    if (result.status === "fail" && result.issues.some(issue => issue.includes("factCount"))) {
      throw new Error("factCount drift should fail validation");
    }
  }, "factCount drift should fail validation");
  runMutation("correction reason drift", ({ context, vault }) => {
    vault.correctionRecords[0].reason = "silent-account-edit";
    vault.fingerprint = context.PlataMemoryVault.vaultFingerprint(vault);
    const result = context.PlataMemoryVault.validateVault(vault);
    if (result.status === "fail" && result.issues.some(issue => issue.includes("unsupported reason"))) {
      throw new Error("correction reason drift should fail validation");
    }
  }, "correction reason drift should fail validation");
  runMutation("tampered incoming fingerprint", ({ context, vault }) => {
    vault.fingerprint = "vault-tampered";
    context.PlataMemoryVault.mergeVault({ facts: [] }, vault);
  }, "incoming memory vault validation failed");

  const oldDuplicate = clone(facts[1]);
  oldDuplicate.id = "merge-old-source";
  oldDuplicate.sourceFingerprint = "memsrc-merge-shared";
  oldDuplicate.copy = "older account memory";
  oldDuplicate.at = "2026-06-01T12:00:00.000Z";
  const freshDuplicate = clone(oldDuplicate);
  freshDuplicate.id = "merge-fresh-source";
  freshDuplicate.copy = "newer account memory";
  freshDuplicate.at = "2026-06-08T12:00:00.000Z";
  const tombstonedFact = clone(facts[2]);
  tombstonedFact.id = "merge-deleted-fact";
  const correctedFact = clone(facts[3]);
  correctedFact.id = "merge-corrected-fact";
  correctedFact.sourceFingerprint = "memsrc-merge-corrected";
  const incomingVault = context.PlataMemoryVault.createVault({
    fingerprint: "mem-incoming-merge",
    facts: [freshDuplicate, tombstonedFact, correctedFact],
    deletedFactIds: [tombstonedFact.id],
    correctionRecords: [{
      schemaVersion: 1,
      factId: correctedFact.id,
      reason: "learner-marked-incorrect",
      correctedAt: fixedNow,
      kind: correctedFact.kind,
      signal: correctedFact.signal,
      trainerId: correctedFact.trainerId,
      sourceFingerprint: correctedFact.sourceFingerprint
    }]
  }, { exportedAt: fixedNow });
  const mergedVault = context.PlataMemoryVault.mergeVault({
    fingerprint: "mem-local-merge",
    facts: [oldDuplicate, tombstonedFact, correctedFact],
    deletedFactIds: ["local-hidden-fact"],
    correctionRecords: []
  }, incomingVault, { exportedAt: fixedNow });
  const mergedValidation = context.PlataMemoryVault.validateVault(mergedVault);
  assert(mergedValidation.status === "pass", `merged vault should validate: ${mergedValidation.issues.join("; ")}`);
  assert(mergedVault.facts.some(fact => fact.id === freshDuplicate.id && fact.copy === "newer account memory"), "merge should keep newer duplicate-source fact");
  assert(!mergedVault.facts.some(fact => fact.id === oldDuplicate.id), "merge should drop older duplicate-source fact");
  assert(!mergedVault.facts.some(fact => fact.id === tombstonedFact.id), "merge should not resurrect deleted facts");
  assert(!mergedVault.facts.some(fact => fact.id === correctedFact.id), "merge should not resurrect corrected facts");
  assert(mergedVault.deletedFactIds.includes("local-hidden-fact"), "merge should preserve local tombstones");
  assert(mergedVault.deletedFactIds.includes(tombstonedFact.id), "merge should import incoming tombstones");
  assert(mergedVault.correctionRecords.some(record => record.factId === correctedFact.id), "merge should import corrections");
  const repeatedMerge = context.PlataMemoryVault.mergeVault(mergedVault, incomingVault, { exportedAt: fixedNow });
  assert(stableJson(repeatedMerge) === stableJson(mergedVault), "merge should be idempotent for repeated vault imports");

  console.log("ok - memory vault stores portable derived facts only");
  console.log("ok - memory vault preserves root competency facts without raw history");
  console.log("ok - memory vault merges imports without resurrecting deleted or corrected facts");
  console.log("ok - memory vault mutations prove unsafe sync payloads fail");
}

run();

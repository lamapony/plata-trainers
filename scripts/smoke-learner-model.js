#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const fixtureRelPath = "scripts/fixtures/learner-memory-profiles.json";
const snapshotRelPath = "scripts/fixtures/learner-model.snapshot.json";
const sourceFiles = [
  "shared/plata-events.js",
  "shared/plata-competencies.js",
  "shared/plata-memory.js",
  "shared/plata-learner-model.js"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? "" : process.argv[index + 1] || "";
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function rootDir(options = {}) {
  if (typeof options === "string") return path.resolve(options);
  return path.resolve(options.root || repoRoot);
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

function makeContext(root, fixedNow) {
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
    vm.runInContext(fs.readFileSync(path.join(root, relPath), "utf8"), context, { filename: relPath });
  });
  return context;
}

function readProfiles(root) {
  return JSON.parse(fs.readFileSync(path.join(root, fixtureRelPath), "utf8")).profiles || [];
}

function compileFacts(context, profile, fixedNow, options = {}) {
  let facts = context.PlataMemory.compileMemoryFacts({ events: profile.events || [] }, {
    now: fixedNow,
    reviewDays: Number(profile.reviewDays || 7),
    staleDays: Number(profile.staleDays || 21)
  });
  if (typeof options.filterFacts === "function") facts = facts.filter(options.filterFacts);
  return facts;
}

function buildPipeline(context, profile, fixedNow, options = {}) {
  const facts = compileFacts(context, profile, fixedNow, options);
  const memoryFingerprint = context.PlataMemory.memoryFingerprint(facts);
  const model = context.PlataLearnerModel.buildModel(facts, {
    generatedAt: fixedNow,
    now: fixedNow,
    memoryFingerprint
  });
  return { facts, memoryFingerprint, model };
}

function snapshotShape(model) {
  return {
    fingerprint: model.fingerprint,
    sourceMemoryFingerprint: model.sourceMemoryFingerprint,
    recommendedFocus: {
      kind: model.recommendedFocus.kind,
      rule: model.recommendedFocus.rule,
      title: model.recommendedFocus.title,
      signal: model.recommendedFocus.signal || "",
      competencyId: model.recommendedFocus.competencyId || "",
      pressure: model.recommendedFocus.pressure || 0,
      citedFactIds: model.recommendedFocus.citedFactIds || [],
      sourceFingerprints: model.recommendedFocus.sourceFingerprints || []
    },
    priorities: model.priorities.slice(0, 6).map(row => ({
      factId: row.factId,
      kind: row.kind,
      priorityKind: row.priorityKind,
      trainerId: row.trainerId,
      signal: row.signal,
      competencyId: row.competencyId || "",
      pressure: row.pressure,
      confidence: row.confidence,
      ageDays: row.ageDays,
      sourceFingerprint: row.sourceFingerprint
    })),
    openRisks: model.openRisks.map(row => ({
      factId: row.factId,
      kind: row.kind,
      signal: row.signal,
      competencyId: row.competencyId || "",
      pressure: row.pressure
    })),
    reviewQueue: model.reviewQueue.map(row => ({
      factId: row.factId,
      kind: row.kind,
      signal: row.signal,
      pressure: row.pressure
    })),
    rootCompetencies: model.rootCompetencies.map(row => ({
      competencyId: row.competencyId,
      riskScore: row.riskScore,
      factIds: row.factIds,
      signals: row.signals,
      trainerIds: row.trainerIds
    })),
    summary: model.summary,
    policyVersion: model.policy.version,
    guardrails: model.guardrails
  };
}

function assertNoRawText(profile, model) {
  const serialized = JSON.stringify(model);
  (profile.forbiddenText || []).forEach(text => {
    assert(!serialized.includes(text), `${profile.id}: private text leaked into learner model: ${text}`);
  });
  ["secret expected text", "secret given text", "should not leak"].forEach(text => {
    assert(!serialized.includes(text), `${profile.id}: smoke secret leaked into learner model: ${text}`);
  });
}

function assertModel(profile, context, facts, memoryFingerprint, model) {
  const validation = context.PlataLearnerModel.validateModel(model);
  assert(validation.status === "pass", `${profile.id}: learner model should validate: ${validation.issues.join("; ")}`);
  assert(model.modelType === "plata.learner-model", `${profile.id}: model type should be explicit`);
  assert(model.sourceMemoryFingerprint === memoryFingerprint, `${profile.id}: model should cite memory fingerprint`);
  assert(model.sourceFactCount === facts.length, `${profile.id}: model should preserve source fact count`);
  assert(model.policy && model.policy.version === "learner-model-policy-v1", `${profile.id}: model should declare scoring policy`);
  assert(model.guardrails && model.guardrails.requiresModel === false, `${profile.id}: model must not require a model`);
  assert(model.guardrails && model.guardrails.usesOnlyCitedFacts === true, `${profile.id}: model must use only cited facts`);
  assert(model.guardrails && model.guardrails.containsRawAnswerText === false, `${profile.id}: model must declare raw-text guardrail`);
  assert(!Object.prototype.hasOwnProperty.call(model, "sourceEventIds"), `${profile.id}: model must not expose source event ids`);
  assert(!Object.prototype.hasOwnProperty.call(model, "eventLog"), `${profile.id}: model must not embed event logs`);
  assert(Array.isArray(model.priorities), `${profile.id}: model priorities should be an array`);
  if (model.recommendedFocus.kind !== "inspect") {
    assert(model.recommendedFocus.citedFactIds.length > 0, `${profile.id}: recommended focus should cite fact ids`);
    assert(model.recommendedFocus.sourceFingerprints.length > 0, `${profile.id}: recommended focus should cite source fingerprints`);
  }
  const known = new Set(model.priorities.map(row => row.factId));
  (model.recommendedFocus.citedFactIds || []).forEach(factId => assert(known.has(factId), `${profile.id}: focus cited unknown priority fact ${factId}`));
  assertNoRawText(profile, model);
}

function assertProfileSpecific(profile, model) {
  if (profile.id === "cross-lesson-agency-trap") {
    assert(model.recommendedFocus.kind === "repair", "cross-lesson model should recommend repair");
    assert(model.recommendedFocus.rule === "learner-model.focus.root-competency", "cross-lesson model should focus root competency");
    assert(model.rootCompetencies.some(row => row.competencyId === "agency"), "cross-lesson model should preserve agency root competency");
    assert(model.openRisks[0] && model.openRisks[0].kind === "root_competency_trap", "cross-lesson model should rank root competency as top risk");
  }
  if (profile.id === "stale-skill-review") {
    assert(model.recommendedFocus.kind === "review", "stale-skill model should recommend review");
    assert(model.reviewQueue.some(row => row.kind === "next_review_due"), "stale-skill model should include due review");
  }
  if (profile.id === "returning-learner-context") {
    assert(model.recommendedFocus.kind === "continue", "returning learner model should continue from stable context");
  }
  if (profile.id === "repaired-signal-retained") {
    assert(model.recommendedFocus.kind === "maintain", "repaired signal model should preserve maintenance focus");
  }
}

function expectValidationFailure(context, model, expectedMessage) {
  const result = context.PlataLearnerModel.validateModel(model);
  if (result.status === "fail" && result.issues.some(issue => issue.includes(expectedMessage))) {
    throw new Error(expectedMessage);
  }
}

function runMutation(root, name, mutate, expectedMessage) {
  const fixedNow = "2026-06-08T12:00:00.000Z";
  const context = makeContext(root, fixedNow);
  const profile = readProfiles(root).find(item => item.id === "cross-lesson-agency-trap");
  assert(profile, "cross-lesson profile is required");
  const pipeline = buildPipeline(context, profile, fixedNow);
  try {
    mutate(Object.assign({ context, profile, fixedNow }, pipeline));
  } catch (err) {
    assert(String(err.message || "").includes(expectedMessage), `${name}: expected "${expectedMessage}", got "${err.message}"`);
    console.log(`ok - learner model mutation caught: ${name}`);
    return;
  }
  throw new Error(`${name}: mutation should have failed`);
}

function evaluateLearnerModelFixtures(options = {}) {
  const root = rootDir(options);
  const update = !!options.update;
  const fixedNow = "2026-06-08T12:00:00.000Z";
  const context = makeContext(root, fixedNow);
  const profiles = readProfiles(root);
  const actual = {
    schemaVersion: 1,
    generatedAt: fixedNow,
    profiles: {}
  };

  profiles.forEach(profile => {
    const { facts, memoryFingerprint, model } = buildPipeline(context, profile, fixedNow);
    assertModel(profile, context, facts, memoryFingerprint, model);
    assertProfileSpecific(profile, model);
    actual.profiles[profile.id] = snapshotShape(model);
  });

  if (update) {
    fs.writeFileSync(path.join(root, snapshotRelPath), JSON.stringify(actual, null, 2) + "\n");
  } else {
    const expected = JSON.parse(fs.readFileSync(path.join(root, snapshotRelPath), "utf8"));
    assert(stableJson(actual) === stableJson(expected), "learner model snapshot drifted; run node scripts/smoke-learner-model.js --update if intentional");
  }

  return {
    status: "pass",
    schemaVersion: actual.schemaVersion,
    fixedNow: actual.generatedAt,
    profileCount: Object.keys(actual.profiles).length,
    profiles: Object.keys(actual.profiles).map(id => ({
      id,
      focusKind: actual.profiles[id].recommendedFocus.kind,
      focusRule: actual.profiles[id].recommendedFocus.rule,
      topPriorityKind: actual.profiles[id].priorities[0] && actual.profiles[id].priorities[0].kind || ""
    }))
  };
}

function runCli() {
  const root = argValue("--root") || repoRoot;
  const update = hasFlag("--update");
  const result = evaluateLearnerModelFixtures({ root, update });

  runMutation(root, "raw text in source facts", ({ context, facts, fixedNow, memoryFingerprint }) => {
    const unsafeFacts = clone(facts);
    unsafeFacts[0].copy = "secret given text";
    context.PlataLearnerModel.buildModel(unsafeFacts, { generatedAt: fixedNow, now: fixedNow, memoryFingerprint });
  }, "raw learner answer text");
  runMutation(root, "source fact missing fingerprint", ({ context, facts, fixedNow, memoryFingerprint }) => {
    const unsafeFacts = clone(facts);
    unsafeFacts[0].sourceFingerprint = "";
    context.PlataLearnerModel.buildModel(unsafeFacts, { generatedAt: fixedNow, now: fixedNow, memoryFingerprint });
  }, "sourceFingerprint is required");
  runMutation(root, "citationless recommended focus", ({ context, model }) => {
    const broken = clone(model);
    broken.recommendedFocus.citedFactIds = [];
    broken.fingerprint = context.PlataLearnerModel.learnerModelFingerprint(broken);
    expectValidationFailure(context, broken, "recommendedFocus must cite fact ids");
  }, "recommendedFocus must cite fact ids");
  runMutation(root, "priority missing source fingerprint", ({ context, model }) => {
    const broken = clone(model);
    broken.priorities[0].sourceFingerprint = "";
    broken.fingerprint = context.PlataLearnerModel.learnerModelFingerprint(broken);
    expectValidationFailure(context, broken, "sourceFingerprint");
  }, "sourceFingerprint");
  runMutation(root, "lost root competency risk", ({ context, profile, fixedNow }) => {
    const pipeline = buildPipeline(context, profile, fixedNow, {
      filterFacts: fact => fact.kind !== "root_competency_trap"
    });
    assertProfileSpecific(profile, pipeline.model);
  }, "cross-lesson model should focus root competency");
  runMutation(root, "raw history payload", ({ context, model }) => {
    const broken = clone(model);
    broken.eventLog = { events: [] };
    broken.fingerprint = context.PlataLearnerModel.learnerModelFingerprint(broken);
    expectValidationFailure(context, broken, "raw history container key");
  }, "raw history container key");
  runMutation(root, "fingerprint drift", ({ context, model }) => {
    const broken = clone(model);
    broken.recommendedFocus.kind = "inspect";
    expectValidationFailure(context, broken, "fingerprint drifted");
  }, "fingerprint drifted");

  if (update) console.log(`${snapshotRelPath} updated`);
  result.profiles.forEach(profile => {
    console.log(`ok - learner model fixture ${profile.id} -> ${profile.focusKind}`);
  });
  console.log("ok - learner model ranks memory facts with a deterministic scoring policy");
  console.log("ok - learner model mutations prove unsafe adaptive profiles fail");
}

if (require.main === module) runCli();

module.exports = {
  evaluateLearnerModelFixtures
};

#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const fixturePath = path.join(repoRoot, "scripts", "fixtures", "learner-memory-profiles.json");
const snapshotPath = path.join(repoRoot, "scripts", "fixtures", "memory-brief.snapshot.json");
const sourceFiles = [
  "shared/plata-events.js",
  "shared/plata-catalog.js",
  "shared/plata-competencies.js",
  "shared/plata-memory.js",
  "shared/plata-memory-vault.js",
  "shared/plata-memory-brief.js"
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

function readProfiles() {
  return JSON.parse(fs.readFileSync(fixturePath, "utf8")).profiles || [];
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

function createVault(context, profile, facts, fixedNow, options = {}) {
  return context.PlataMemoryVault.createVault({
    fingerprint: context.PlataMemory.memoryFingerprint(facts),
    summary: context.PlataMemory.summarizeMemoryFacts(facts),
    facts,
    deletedFactIds: options.deletedFactIds || [],
    correctionRecords: options.correctionRecords || []
  }, {
    exportedAt: fixedNow
  });
}

function buildBrief(context, vault, fixedNow) {
  return context.PlataMemoryBrief.buildBrief(vault, {
    generatedAt: fixedNow,
    catalog: context.PlataCatalog,
    competencyGraph: context.PlataCompetencies
  });
}

function snapshotShape(brief) {
  return {
    fingerprint: brief.fingerprint,
    sourceVaultFingerprint: brief.sourceVaultFingerprint,
    headline: brief.headline,
    focus: {
      kind: brief.focus.kind,
      rule: brief.focus.rule,
      title: brief.focus.title,
      competencyId: brief.focus.competencyId || "",
      signal: brief.focus.signal || "",
      citedFactIds: brief.focus.citedFactIds || [],
      sourceFingerprints: brief.focus.sourceFingerprints || []
    },
    topFacts: brief.topFacts.map(fact => ({
      factId: fact.factId,
      kind: fact.kind,
      signal: fact.signal,
      competencyId: fact.competencyId || "",
      sourceFingerprint: fact.sourceFingerprint
    })),
    rootSkillRisks: brief.rootSkillRisks.map(risk => ({
      competencyId: risk.competencyId,
      signals: risk.signals,
      trainerIds: risk.trainerIds,
      citedFactIds: risk.citedFactIds
    })),
    dueReviews: brief.dueReviews.map(fact => ({
      factId: fact.factId,
      kind: fact.kind,
      signal: fact.signal
    })),
    counts: {
      topFacts: brief.topFacts.length,
      rootSkillRisks: brief.rootSkillRisks.length,
      dueReviews: brief.dueReviews.length,
      corrected: brief.correctedAssumptions.count,
      hidden: brief.hiddenAssumptions.count
    },
    guardrails: brief.guardrails
  };
}

function assertNoRawText(profile, brief) {
  const serialized = JSON.stringify(brief);
  (profile.forbiddenText || []).forEach(text => {
    assert(!serialized.includes(text), `${profile.id}: private text leaked into memory brief: ${text}`);
  });
  ["secret expected text", "secret given text", "should not leak"].forEach(text => {
    assert(!serialized.includes(text), `${profile.id}: smoke secret leaked into memory brief: ${text}`);
  });
}

function assertBrief(profile, context, brief, vault) {
  const validation = context.PlataMemoryBrief.validateBrief(brief);
  assert(validation.status === "pass", `${profile.id}: memory brief should validate: ${validation.issues.join("; ")}`);
  assert(brief.briefType === "plata.memory-brief", `${profile.id}: brief type should be explicit`);
  assert(brief.sourceVaultFingerprint === vault.fingerprint, `${profile.id}: brief should cite source vault fingerprint`);
  assert(brief.guardrails && brief.guardrails.requiresModel === false, `${profile.id}: brief must not require a model`);
  assert(brief.guardrails && brief.guardrails.usesOnlyCitedFacts === true, `${profile.id}: brief must use only cited facts`);
  assert(brief.guardrails && brief.guardrails.containsRawAnswerText === false, `${profile.id}: brief must declare raw-text guardrail`);
  assert(brief.topFacts.length <= 8, `${profile.id}: brief should stay compact`);
  if (brief.focus.kind !== "inspect") {
    assert(brief.focus.citedFactIds.length > 0, `${profile.id}: non-inspect focus must cite fact ids`);
    assert(brief.focus.sourceFingerprints.length > 0, `${profile.id}: non-inspect focus must cite source fingerprints`);
  }
  const knownFactIds = new Set((vault.facts || []).map(fact => fact.id));
  (brief.focus.citedFactIds || []).forEach(factId => assert(knownFactIds.has(factId), `${profile.id}: focus cited unknown fact ${factId}`));
  (brief.topFacts || []).forEach(fact => assert(knownFactIds.has(fact.factId), `${profile.id}: top fact cited unknown fact ${fact.factId}`));
  assertNoRawText(profile, brief);
}

function assertCrossLessonBrief(brief) {
  assert(brief.focus.rule === "brief.focus.root-competency", "cross-lesson brief should focus root competency repair");
  assert(brief.rootSkillRisks.some(risk => risk.competencyId === "agency"), "cross-lesson brief should preserve agency root skill risk");
}

function runMutation(name, mutate, expectedMessage) {
  const fixedNow = "2026-06-08T12:00:00.000Z";
  const context = makeContext(fixedNow);
  const profile = readProfiles().find(item => item.id === "cross-lesson-agency-trap");
  assert(profile, "cross-lesson profile is required");
  const facts = compileFacts(context, profile, fixedNow);
  const vault = createVault(context, profile, facts, fixedNow);
  const brief = buildBrief(context, vault, fixedNow);
  try {
    mutate({ context, profile, facts, vault, brief, fixedNow });
  } catch (err) {
    assert(String(err.message || "").includes(expectedMessage), `${name}: expected "${expectedMessage}", got "${err.message}"`);
    console.log(`ok - memory brief mutation caught: ${name}`);
    return;
  }
  throw new Error(`${name}: mutation should have failed`);
}

function run() {
  const update = process.argv.includes("--update");
  const fixedNow = "2026-06-08T12:00:00.000Z";
  const context = makeContext(fixedNow);
  const profiles = readProfiles();
  const actual = {
    schemaVersion: 1,
    generatedAt: fixedNow,
    profiles: {}
  };

  profiles.forEach(profile => {
    const facts = compileFacts(context, profile, fixedNow);
    const vault = createVault(context, profile, facts, fixedNow);
    const brief = buildBrief(context, vault, fixedNow);
    assertBrief(profile, context, brief, vault);
    if (profile.id === "cross-lesson-agency-trap") assertCrossLessonBrief(brief);
    if (profile.id === "stale-skill-review") {
      assert(brief.focus.kind === "review", "stale-skill brief should choose review focus");
      assert(brief.dueReviews.length > 0, "stale-skill brief should include due review facts");
    }
    actual.profiles[profile.id] = snapshotShape(brief);
  });

  const correctionProfile = profiles.find(profile => profile.id === "cross-lesson-agency-trap");
  const correctionFacts = compileFacts(context, correctionProfile, fixedNow);
  const correctedFact = correctionFacts[0];
  const correctedVault = createVault(context, correctionProfile, correctionFacts, fixedNow, {
    deletedFactIds: ["brief-hidden-fact"],
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
  });
  const correctedBrief = buildBrief(context, correctedVault, fixedNow);
  assert(correctedBrief.correctedAssumptions.count === 1, "brief should count corrected assumptions");
  assert(correctedBrief.hiddenAssumptions.count === 1, "brief should count hidden assumptions");
  assert(!(correctedBrief.focus.citedFactIds || []).includes(correctedFact.id), "brief should not cite corrected focus facts");

  if (update) {
    fs.writeFileSync(snapshotPath, JSON.stringify(actual, null, 2) + "\n");
  } else {
    const expected = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
    assert(stableJson(actual) === stableJson(expected), "memory brief snapshot drifted; run node scripts/smoke-memory-brief.js --update if intentional");
  }

  runMutation("raw text in source vault", ({ context, vault, fixedNow }) => {
    vault.facts[0].copy = "secret given text";
    vault.fingerprint = context.PlataMemoryVault.vaultFingerprint(vault);
    context.PlataMemoryBrief.buildBrief(vault, { generatedAt: fixedNow });
  }, "raw learner answer text");
  runMutation("citationless focus", ({ context, brief }) => {
    brief.focus.citedFactIds = [];
    brief.fingerprint = context.PlataMemoryBrief.briefFingerprint(brief);
    const result = context.PlataMemoryBrief.validateBrief(brief);
    if (result.status === "fail" && result.issues.some(issue => issue.includes("focus must cite fact ids"))) {
      throw new Error("focus must cite fact ids");
    }
  }, "focus must cite fact ids");
  runMutation("missing root competency risk", ({ context, profile, fixedNow }) => {
    const facts = compileFacts(context, profile, fixedNow, {
      filterFacts: fact => fact.kind !== "root_competency_trap"
    });
    const vault = createVault(context, profile, facts, fixedNow);
    const brief = buildBrief(context, vault, fixedNow);
    assertCrossLessonBrief(brief);
  }, "cross-lesson brief should focus root competency repair");
  runMutation("top fact source fingerprint drift", ({ context, brief }) => {
    brief.topFacts[0].sourceFingerprint = "";
    brief.fingerprint = context.PlataMemoryBrief.briefFingerprint(brief);
    const result = context.PlataMemoryBrief.validateBrief(brief);
    if (result.status === "fail" && result.issues.some(issue => issue.includes("sourceFingerprint"))) {
      throw new Error("sourceFingerprint should fail validation");
    }
  }, "sourceFingerprint should fail validation");

  console.log("ok - memory brief snapshots match learner memory profiles");
  console.log("ok - memory brief cites vault facts without raw history");
  console.log("ok - memory brief mutations prove unsafe agent context fails");
}

run();

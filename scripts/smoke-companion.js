#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const fixtureRelPath = "scripts/fixtures/learner-memory-profiles.json";
const sourceFiles = [
  "shared/plata-events.js",
  "shared/plata-catalog.js",
  "shared/plata-competencies.js",
  "shared/plata-memory.js",
  "shared/plata-memory-vault.js",
  "shared/plata-memory-brief.js",
  "shared/plata-agent-handoff.js",
  "shared/plata-planner.js",
  "shared/plata-advisor.js",
  "shared/plata-companion.js"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? "" : process.argv[index + 1] || "";
}

function rootDir(options = {}) {
  if (typeof options === "string") return path.resolve(options);
  return path.resolve(options.root || repoRoot);
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
    Array,
    encodeURIComponent,
    localStorage: {
      getItem() { return null; },
      setItem() {},
      removeItem() {}
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  sourceFiles.forEach(relPath => {
    vm.runInContext(fs.readFileSync(path.join(root, relPath), "utf8"), context, { filename: relPath });
  });
  return context;
}

function compileProfile(context, profile, fixedNow) {
  const facts = context.PlataMemory.compileMemoryFacts({ events: profile.events || [] }, {
    now: fixedNow,
    reviewDays: Number(profile.reviewDays || 7),
    staleDays: Number(profile.staleDays || 21)
  });
  const vault = context.PlataMemoryVault.createVault({
    fingerprint: context.PlataMemory.memoryFingerprint(facts),
    summary: context.PlataMemory.summarizeMemoryFacts(facts),
    facts,
    deletedFactIds: [],
    correctionRecords: []
  }, { exportedAt: fixedNow });
  const brief = context.PlataMemoryBrief.buildBrief(vault, {
    generatedAt: fixedNow,
    catalog: context.PlataCatalog,
    competencyGraph: context.PlataCompetencies
  });
  const handoff = context.PlataAgentHandoff.buildHandoff(brief, { generatedAt: fixedNow });
  const plannerDecision = profile.planner ? context.PlataPlanner.dashboardDecision(Object.assign({}, profile.planner.input || {}, {
    memoryFacts: facts
  })) : null;
  const advice = context.PlataAdvisor.advise({
    memoryFacts: facts,
    plannerDecision
  });
  const companion = context.PlataCompanion.buildCard({
    advice,
    handoff,
    generatedAt: fixedNow
  });
  const hermesBrief = context.PlataCompanion.buildHermesBrief(companion, handoff, {
    generatedAt: fixedNow
  });
  return { facts, vault, brief, handoff, plannerDecision, advice, companion, hermesBrief };
}

function assertNoRawText(profile, payload, label) {
  const serialized = JSON.stringify(payload);
  (profile.forbiddenText || []).forEach(text => {
    assert(!serialized.includes(text), `${profile.id}: private text leaked into ${label}: ${text}`);
  });
  ["secret expected text", "secret given text", "should not leak"].forEach(text => {
    assert(!serialized.includes(text), `${profile.id}: smoke secret leaked into ${label}: ${text}`);
  });
}

function assertCompanion(profile, context, compiled) {
  const cardValidation = context.PlataCompanion.validateCard(compiled.companion);
  assert(cardValidation.status === "pass", `${profile.id}: companion card should validate: ${cardValidation.issues.join("; ")}`);
  assert(compiled.companion.companionType === "plata.companion-card", `${profile.id}: companion type should be explicit`);
  assert(compiled.companion.guardrails.requiresModel === false, `${profile.id}: companion must not require a model`);
  assert(compiled.companion.guardrails.externalAgentOptional === true, `${profile.id}: companion must keep external agents optional`);
  assert(compiled.companion.guardrails.usesOnlyCitedFacts === true, `${profile.id}: companion must use cited facts`);
  assert(compiled.companion.allowedActions.length >= 3, `${profile.id}: companion should constrain allowed actions`);
  assert(compiled.companion.blockedActions.includes("act as an autonomous agent"), `${profile.id}: companion should block autonomous-agent behavior`);
  assert(compiled.companion.nextAction && compiled.companion.nextAction.label, `${profile.id}: companion should preserve one next action`);
  assert(!Object.prototype.hasOwnProperty.call(compiled.companion, "eventLog"), `${profile.id}: companion must not embed event log`);
  assert(!Object.prototype.hasOwnProperty.call(compiled.companion, "practicePlan"), `${profile.id}: companion must not embed practice plan`);
  if (compiled.advice.kind !== "inspect") {
    assert(compiled.companion.citedFacts.length > 0, `${profile.id}: non-inspect companion must cite memory facts`);
  }
  const knownFactIds = new Set(compiled.facts.map(fact => fact.id));
  compiled.companion.citedFacts.forEach(fact => {
    assert(knownFactIds.has(fact.factId), `${profile.id}: companion cited unknown fact ${fact.factId}`);
  });
  assertNoRawText(profile, compiled.companion, "companion card");
}

function assertHermesBrief(profile, context, compiled) {
  const briefValidation = context.PlataCompanion.validateHermesBrief(compiled.hermesBrief);
  assert(briefValidation.status === "pass", `${profile.id}: Hermes bridge should validate: ${briefValidation.issues.join("; ")}`);
  assert(compiled.hermesBrief.briefType === "plata.hermes-bridge-brief", `${profile.id}: Hermes bridge type should be explicit`);
  assert(compiled.hermesBrief.sourceCompanionFingerprint === compiled.companion.fingerprint, `${profile.id}: Hermes bridge should cite companion fingerprint`);
  assert(compiled.hermesBrief.sourceHandoffFingerprint === compiled.handoff.fingerprint, `${profile.id}: Hermes bridge should cite handoff fingerprint`);
  assert(compiled.hermesBrief.guardrails.readOnlyBridge === true, `${profile.id}: Hermes bridge must be read-only`);
  assert(compiled.hermesBrief.guardrails.requiresModel === false, `${profile.id}: Hermes bridge must not make models mandatory`);
  assert(compiled.hermesBrief.responseContract.maxRecommendations === 1, `${profile.id}: Hermes bridge should allow one recommendation`);
  assert(compiled.hermesBrief.responseContract.mustPreserveNextAction === true, `${profile.id}: Hermes bridge must preserve Plata next action`);
  assert(compiled.hermesBrief.blockedActions.includes("write Plata memory or planner state"), `${profile.id}: Hermes bridge must block memory writes`);
  assert(!Object.prototype.hasOwnProperty.call(compiled.hermesBrief, "eventLog"), `${profile.id}: Hermes bridge must not embed event log`);
  assert(!Object.prototype.hasOwnProperty.call(compiled.hermesBrief, "memoryVault"), `${profile.id}: Hermes bridge must not embed memory vault`);
  assertNoRawText(profile, compiled.hermesBrief, "Hermes bridge");
}

function runMutation(name, mutate, expectedMessage) {
  const fixture = JSON.parse(fs.readFileSync(path.join(repoRoot, fixtureRelPath), "utf8"));
  const fixedNow = fixture.fixedNow || "2026-06-08T12:00:00.000Z";
  const context = makeContext(repoRoot, fixedNow);
  const profile = (fixture.profiles || []).find(item => item.id === "cross-lesson-agency-trap");
  const compiled = compileProfile(context, profile, fixedNow);
  mutate({ context, compiled });
  const validation = context.PlataCompanion.validateCard(compiled.companion);
  assert(validation.status === "fail", `${name}: mutation should fail`);
  assert(validation.issues.join("; ").includes(expectedMessage), `${name}: expected "${expectedMessage}", got "${validation.issues.join("; ")}"`);
  console.log(`ok - companion mutation caught: ${name}`);
}

function evaluateCompanionFixtures(options = {}) {
  const root = rootDir(options);
  const fixture = JSON.parse(fs.readFileSync(path.join(root, fixtureRelPath), "utf8"));
  const fixedNow = fixture.fixedNow || "2026-06-08T12:00:00.000Z";
  const context = makeContext(root, fixedNow);
  const rows = [];

  (fixture.profiles || []).forEach(profile => {
    const compiled = compileProfile(context, profile, fixedNow);
    assertCompanion(profile, context, compiled);
    assertHermesBrief(profile, context, compiled);
    rows.push({
      id: profile.id,
      kind: compiled.companion.kind,
      companionFingerprint: compiled.companion.fingerprint,
      hermesFingerprint: compiled.hermesBrief.fingerprint,
      citedFacts: compiled.companion.citedFacts.map(fact => fact.factId)
    });
  });

  return {
    status: "pass",
    schemaVersion: fixture.schemaVersion || null,
    fixedNow,
    profileCount: rows.length,
    profiles: rows
  };
}

function runCli() {
  try {
    const root = argValue("--root") || repoRoot;
    const result = evaluateCompanionFixtures({ root });
    result.profiles.forEach(profile => {
      console.log(`ok - companion fixture ${profile.id} -> ${profile.kind}`);
    });
    runMutation("model-required companion", ({ compiled }) => {
      compiled.companion.guardrails.requiresModel = true;
    }, "guardrails.requiresModel must be false");
    runMutation("raw-text companion", ({ compiled }) => {
      compiled.companion.message = "should not leak";
    }, "raw learner answer text");
    console.log("ok - companion cards and Hermes bridge briefs are deterministic, cited, and read-only");
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

if (require.main === module) runCli();

module.exports = {
  evaluateCompanionFixtures
};

#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const fixtureRelPath = "scripts/fixtures/learner-memory-profiles.json";
const snapshotRelPath = "scripts/fixtures/agent-handoff.snapshot.json";
const sourceFiles = [
  "shared/plata-events.js",
  "shared/plata-catalog.js",
  "shared/plata-competencies.js",
  "shared/plata-memory.js",
  "shared/plata-memory-vault.js",
  "shared/plata-memory-brief.js",
  "shared/plata-agent-handoff.js"
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

function createVault(context, facts, fixedNow, options = {}) {
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

function buildPipeline(context, profile, fixedNow, options = {}) {
  const facts = compileFacts(context, profile, fixedNow, options);
  const vault = createVault(context, facts, fixedNow, options);
  const brief = buildBrief(context, vault, fixedNow);
  const handoff = context.PlataAgentHandoff.buildHandoff(brief, { generatedAt: fixedNow });
  return { facts, vault, brief, handoff };
}

function snapshotShape(handoff) {
  return {
    fingerprint: handoff.fingerprint,
    sourceBriefFingerprint: handoff.sourceBriefFingerprint,
    sourceVaultFingerprint: handoff.sourceVaultFingerprint,
    task: {
      kind: handoff.task.kind,
      priority: handoff.task.priority,
      title: handoff.task.title,
      objective: handoff.task.objective,
      focusRule: handoff.task.focus.rule,
      focusKind: handoff.task.focus.kind,
      focusCompetencyId: handoff.task.focus.competencyId || "",
      focusSignal: handoff.task.focus.signal || "",
      requiredCitationCount: handoff.task.requiredCitationCount
    },
    requiredCitations: handoff.requiredCitations.map(citation => ({
      factId: citation.factId,
      sourceFingerprint: citation.sourceFingerprint,
      role: citation.role,
      kind: citation.kind,
      signal: citation.signal
    })),
    topFacts: handoff.agentContext.topFacts.map(fact => ({
      factId: fact.factId,
      kind: fact.kind,
      signal: fact.signal,
      competencyId: fact.competencyId || "",
      sourceFingerprint: fact.sourceFingerprint
    })),
    rootSkillRisks: handoff.agentContext.rootSkillRisks.map(risk => ({
      competencyId: risk.competencyId,
      signals: risk.signals,
      trainerIds: risk.trainerIds,
      citedFactIds: risk.citedFactIds
    })),
    allowedActions: handoff.allowedActions,
    blockedActions: handoff.blockedActions,
    responseContract: handoff.responseContract,
    guardrails: handoff.guardrails,
    trace: handoff.trace
  };
}

function knownBriefFactIds(brief) {
  const known = new Set();
  (brief.focus && brief.focus.citedFactIds || []).forEach(id => known.add(id));
  (brief.topFacts || []).forEach(fact => known.add(fact.factId));
  (brief.rootSkillRisks || []).forEach(risk => (risk.citedFactIds || []).forEach(id => known.add(id)));
  return known;
}

function assertNoRawText(profile, handoff) {
  const serialized = JSON.stringify(handoff);
  (profile.forbiddenText || []).forEach(text => {
    assert(!serialized.includes(text), `${profile.id}: private text leaked into agent handoff: ${text}`);
  });
  ["secret expected text", "secret given text", "should not leak"].forEach(text => {
    assert(!serialized.includes(text), `${profile.id}: smoke secret leaked into agent handoff: ${text}`);
  });
}

function assertHandoff(profile, context, handoff, brief, vault) {
  const validation = context.PlataAgentHandoff.validateHandoff(handoff);
  assert(validation.status === "pass", `${profile.id}: agent handoff should validate: ${validation.issues.join("; ")}`);
  assert(handoff.handoffType === "plata.agent-handoff", `${profile.id}: handoff type should be explicit`);
  assert(handoff.sourceBriefFingerprint === brief.fingerprint, `${profile.id}: handoff should cite source brief fingerprint`);
  assert(handoff.sourceVaultFingerprint === vault.fingerprint, `${profile.id}: handoff should cite source vault fingerprint`);
  assert(handoff.guardrails && handoff.guardrails.requiresModel === false, `${profile.id}: handoff must not require a model`);
  assert(handoff.guardrails && handoff.guardrails.usesOnlyCitedFacts === true, `${profile.id}: handoff must use only cited facts`);
  assert(handoff.guardrails && handoff.guardrails.containsRawAnswerText === false, `${profile.id}: handoff must declare raw-text guardrail`);
  assert(handoff.responseContract && handoff.responseContract.maxRecommendations === 1, `${profile.id}: handoff should allow one recommendation`);
  assert(Array.isArray(handoff.allowedActions) && handoff.allowedActions.length >= 3, `${profile.id}: handoff should define allowed actions`);
  assert(Array.isArray(handoff.blockedActions) && handoff.blockedActions.length >= 3, `${profile.id}: handoff should define blocked actions`);
  assert(!Object.prototype.hasOwnProperty.call(handoff, "memoryVault"), `${profile.id}: handoff must not embed memory vault`);
  assert(!Object.prototype.hasOwnProperty.call(handoff, "eventLog"), `${profile.id}: handoff must not embed event log`);
  assert(!Object.prototype.hasOwnProperty.call(handoff, "practicePlan"), `${profile.id}: handoff must not embed practice plans`);
  if (handoff.task.kind !== "inspect-memory") {
    assert(handoff.requiredCitations.length >= handoff.task.requiredCitationCount, `${profile.id}: non-inspect handoff must include required citations`);
    assert(handoff.responseContract.mustCiteFactIds === true, `${profile.id}: non-inspect handoff must require fact-id citations`);
    assert(handoff.responseContract.mustCiteSourceFingerprints === true, `${profile.id}: non-inspect handoff must require source-fingerprint citations`);
  }

  const knownFactIds = knownBriefFactIds(brief);
  (handoff.requiredCitations || []).forEach(citation => {
    assert(knownFactIds.has(citation.factId), `${profile.id}: handoff cited unknown brief fact ${citation.factId}`);
  });
  assertNoRawText(profile, handoff);
}

function assertProfileSpecific(profile, brief, handoff) {
  if (profile.id === "cross-lesson-agency-trap") {
    assert(handoff.task.kind === "prepare-repair", "cross-lesson handoff should prepare root competency repair");
    assert(handoff.task.focus.rule === "brief.focus.root-competency" || handoff.task.focus.competencyId === "agency", "cross-lesson handoff should preserve agency focus");
    assert(handoff.agentContext.rootSkillRisks.some(risk => risk.competencyId === "agency"), "cross-lesson handoff should include agency root-skill risk");
  }
  if (profile.id === "stale-skill-review") {
    assert(brief.focus.kind === "review", "stale-skill brief should choose review focus");
    assert(handoff.task.kind === "prepare-review", "stale-skill handoff should prepare review");
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
    console.log(`ok - agent handoff mutation caught: ${name}`);
    return;
  }
  throw new Error(`${name}: mutation should have failed`);
}

function expectValidationFailure(context, handoff, expectedMessage) {
  const result = context.PlataAgentHandoff.validateHandoff(handoff);
  if (result.status === "fail" && result.issues.some(issue => issue.includes(expectedMessage))) {
    throw new Error(expectedMessage);
  }
}

function evaluateAgentHandoffFixtures(options = {}) {
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
    const { vault, brief, handoff } = buildPipeline(context, profile, fixedNow);
    assertHandoff(profile, context, handoff, brief, vault);
    assertProfileSpecific(profile, brief, handoff);
    actual.profiles[profile.id] = snapshotShape(handoff);
  });

  if (update) {
    fs.writeFileSync(path.join(root, snapshotRelPath), JSON.stringify(actual, null, 2) + "\n");
  } else {
    const expected = JSON.parse(fs.readFileSync(path.join(root, snapshotRelPath), "utf8"));
    assert(stableJson(actual) === stableJson(expected), "agent handoff snapshot drifted; run node scripts/smoke-agent-handoff.js --update if intentional");
  }

  return {
    status: "pass",
    schemaVersion: actual.schemaVersion,
    fixedNow: actual.generatedAt,
    profileCount: Object.keys(actual.profiles).length,
    profiles: Object.keys(actual.profiles).map(id => ({
      id,
      taskKind: actual.profiles[id].task.kind,
      focusRule: actual.profiles[id].task.focusRule,
      citations: actual.profiles[id].requiredCitations.map(citation => citation.factId)
    }))
  };
}

function runCli() {
  const root = argValue("--root") || repoRoot;
  const update = hasFlag("--update");
  const result = evaluateAgentHandoffFixtures({ root, update });

  runMutation(root, "raw text in source brief", ({ context, brief, fixedNow }) => {
    const unsafeBrief = clone(brief);
    unsafeBrief.focus.summary = "secret given text";
    unsafeBrief.fingerprint = context.PlataMemoryBrief.briefFingerprint(unsafeBrief);
    context.PlataAgentHandoff.buildHandoff(unsafeBrief, { generatedAt: fixedNow });
  }, "raw learner answer text");
  runMutation(root, "missing required citations", ({ context, handoff }) => {
    const broken = clone(handoff);
    broken.requiredCitations = [];
    broken.fingerprint = context.PlataAgentHandoff.handoffFingerprint(broken);
    expectValidationFailure(context, broken, "requiredCitations");
  }, "requiredCitations");
  runMutation(root, "disabled citation response contract", ({ context, handoff }) => {
    const broken = clone(handoff);
    broken.responseContract.mustCiteFactIds = false;
    broken.fingerprint = context.PlataAgentHandoff.handoffFingerprint(broken);
    expectValidationFailure(context, broken, "responseContract.mustCiteFactIds");
  }, "responseContract.mustCiteFactIds");
  runMutation(root, "missing action constraints", ({ context, handoff }) => {
    const broken = clone(handoff);
    broken.allowedActions = [];
    broken.fingerprint = context.PlataAgentHandoff.handoffFingerprint(broken);
    expectValidationFailure(context, broken, "allowedActions");
  }, "allowedActions");
  runMutation(root, "lost root competency focus", ({ context, profile, fixedNow }) => {
    const pipeline = buildPipeline(context, profile, fixedNow, {
      filterFacts: fact => fact.kind !== "root_competency_trap"
    });
    assertProfileSpecific(profile, pipeline.brief, pipeline.handoff);
  }, "cross-lesson handoff should include agency root-skill risk");
  runMutation(root, "fingerprint drift", ({ context, handoff }) => {
    const broken = clone(handoff);
    broken.task.kind = "inspect-memory";
    expectValidationFailure(context, broken, "fingerprint drifted");
  }, "fingerprint drifted");

  if (update) console.log(`${snapshotRelPath} updated`);
  result.profiles.forEach(profile => {
    console.log(`ok - agent handoff fixture ${profile.id} -> ${profile.taskKind}`);
  });
  console.log("ok - agent handoff cites memory brief facts without raw history");
  console.log("ok - agent handoff mutations prove unsafe agent packets fail");
}

if (require.main === module) runCli();

module.exports = {
  evaluateAgentHandoffFixtures
};

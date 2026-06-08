#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const fixtureRelPath = "scripts/fixtures/learner-memory-profiles.json";
const sourceFiles = [
  "shared/plata-events.js",
  "shared/plata-competencies.js",
  "shared/plata-memory.js",
  "shared/plata-learner-model.js",
  "shared/plata-planner.js",
  "shared/plata-advisor.js"
];

const contracts = {
  "returning-learner-context": {
    modelFocusKind: "continue",
    modelFocusRule: "learner-model.focus.context",
    advisorKind: "continue",
    advisorRule: "advisor.continue.returning-learner"
  },
  "stale-skill-review": {
    modelFocusKind: "review",
    modelFocusRule: "learner-model.focus.review",
    plannerKind: "stale",
    plannerRule: "dashboard.review.memory-due",
    advisorKind: "review",
    advisorRule: "advisor.review.memory-due",
    plannerMustSelectModelFocus: true
  },
  "repaired-signal-retained": {
    modelFocusKind: "maintain",
    modelFocusRule: "learner-model.focus.maintenance",
    plannerKind: "continue",
    plannerRule: "dashboard.continue.healthy-progress",
    advisorKind: "maintain",
    advisorRule: "advisor.maintain.repaired-signal"
  },
  "recurring-trap-repair": {
    modelFocusKind: "repair",
    modelFocusRule: "learner-model.focus.recurring-trap",
    plannerKind: "repair",
    plannerRule: "dashboard.repair.highest-open-mastery",
    advisorKind: "repair",
    advisorRule: "advisor.repair.memory-backed",
    plannerMustSelectModelFocus: true
  },
  "cross-lesson-agency-trap": {
    modelFocusKind: "repair",
    modelFocusRule: "learner-model.focus.root-competency",
    plannerKind: "repair",
    plannerRule: "dashboard.repair.highest-open-mastery",
    advisorKind: "repair",
    advisorRule: "advisor.repair.root-competency",
    plannerMustSelectModelFocus: true,
    mustPreserveRootCompetency: "agency",
    counterfactualForbiddenRule: "learner-model.focus.root-competency"
  }
};

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

function readFixture(root) {
  return JSON.parse(fs.readFileSync(path.join(root, fixtureRelPath), "utf8"));
}

function compileProfile(context, profile, fixedNow, options = {}) {
  let facts = context.PlataMemory.compileMemoryFacts({ events: profile.events || [] }, {
    now: fixedNow,
    reviewDays: Number(profile.reviewDays || 7),
    staleDays: Number(profile.staleDays || 21)
  });
  if (typeof options.filterFacts === "function") facts = facts.filter(options.filterFacts);

  const memoryFingerprint = context.PlataMemory.memoryFingerprint(facts);
  const learnerModel = context.PlataLearnerModel.buildModel(facts, {
    generatedAt: fixedNow,
    now: fixedNow,
    memoryFingerprint
  });
  const plannerInput = profile.planner && profile.planner.input || null;
  const plannerDecision = plannerInput ? context.PlataPlanner.dashboardDecision(Object.assign({}, plannerInput, {
    memoryFacts: facts
  })) : null;
  const advice = context.PlataAdvisor.advise({
    memoryFacts: facts,
    plannerDecision
  });
  return { facts, memoryFingerprint, learnerModel, plannerDecision, advice };
}

function ids(rows) {
  return new Set((rows || []).map(row => row && (row.id || row.factId)).filter(Boolean));
}

function plannerSelectedFacts(plannerDecision) {
  return plannerDecision && plannerDecision.trace
    && plannerDecision.trace.inputs
    && plannerDecision.trace.inputs.selectedMemoryFacts || [];
}

function plannerRule(plannerDecision) {
  return plannerDecision && plannerDecision.trace && plannerDecision.trace.rule || "";
}

function advisorRule(advice) {
  return advice && advice.trace && advice.trace.rule || "";
}

function modelFocusFacts(learnerModel) {
  return learnerModel && learnerModel.recommendedFocus
    && learnerModel.recommendedFocus.citedFactIds || [];
}

function assertNoRawText(profile, compiled, label) {
  const serialized = JSON.stringify({
    learnerModel: compiled.learnerModel,
    plannerTrace: compiled.plannerDecision && compiled.plannerDecision.trace,
    advice: compiled.advice
  });
  (profile.forbiddenText || []).forEach(text => {
    assert(!serialized.includes(text), `${profile.id} ${label}: private text leaked into learner-model alignment output: ${text}`);
  });
  ["secret expected text", "secret given text", "should not leak"].forEach(text => {
    assert(!serialized.includes(text), `${profile.id} ${label}: smoke secret leaked into learner-model alignment output: ${text}`);
  });
}

function assertKnownFacts(profile, compiled) {
  const known = ids(compiled.facts);
  const modelFactIds = modelFocusFacts(compiled.learnerModel);
  modelFactIds.forEach(factId => assert(known.has(factId), `${profile.id}: learner model focus cited unknown fact ${factId}`));

  plannerSelectedFacts(compiled.plannerDecision).forEach(fact => {
    assert(known.has(fact.id), `${profile.id}: planner selected unknown memory fact ${fact.id}`);
    assert(fact.sourceFingerprint, `${profile.id}: planner selected fact without source fingerprint ${fact.id}`);
  });

  (compiled.advice.citedFacts || []).forEach(fact => {
    assert(known.has(fact.id), `${profile.id}: advisor cited unknown fact ${fact.id}`);
    assert(fact.sourceFingerprint, `${profile.id}: advisor cited fact without source fingerprint ${fact.id}`);
  });
}

function assertBaseline(profile, compiled) {
  const contract = contracts[profile.id];
  assert(contract, `${profile.id}: missing learner-model alignment contract`);
  const modelValidation = compiled.learnerModel && compiled.learnerModel.modelType
    ? compiled.learnerModel
    : null;
  assert(modelValidation, `${profile.id}: learner model is required`);
  assert(compiled.learnerModel.recommendedFocus.kind === contract.modelFocusKind, `${profile.id}: learner model focus should be ${contract.modelFocusKind}`);
  assert(compiled.learnerModel.recommendedFocus.rule === contract.modelFocusRule, `${profile.id}: learner model rule should be ${contract.modelFocusRule}`);
  if (contract.plannerKind) assert(compiled.plannerDecision && compiled.plannerDecision.kind === contract.plannerKind, `${profile.id}: planner kind should be ${contract.plannerKind}`);
  if (contract.plannerRule) assert(plannerRule(compiled.plannerDecision) === contract.plannerRule, `${profile.id}: planner rule should be ${contract.plannerRule}`);
  assert(compiled.advice.kind === contract.advisorKind, `${profile.id}: advisor kind should be ${contract.advisorKind}`);
  assert(advisorRule(compiled.advice) === contract.advisorRule, `${profile.id}: advisor rule should be ${contract.advisorRule}`);

  assertKnownFacts(profile, compiled);
  const modelFactIds = modelFocusFacts(compiled.learnerModel);
  const advisorFactIds = ids(compiled.advice.citedFacts || []);
  modelFactIds.forEach(factId => assert(advisorFactIds.has(factId), `${profile.id}: advisor did not cite learner-model focus fact ${factId}`));

  if (contract.plannerMustSelectModelFocus) {
    const selectedFactIds = ids(plannerSelectedFacts(compiled.plannerDecision));
    modelFactIds.forEach(factId => assert(selectedFactIds.has(factId), `${profile.id}: planner did not select learner-model focus fact ${factId}`));
  }

  if (contract.mustPreserveRootCompetency) {
    assert(compiled.learnerModel.rootCompetencies.some(row => row.competencyId === contract.mustPreserveRootCompetency), `${profile.id}: learner model lost root competency ${contract.mustPreserveRootCompetency}`);
  }
  assert(compiled.learnerModel.guardrails && compiled.learnerModel.guardrails.usesOnlyCitedFacts === true, `${profile.id}: learner model must use cited facts`);
  assert(compiled.advice.guardrails && compiled.advice.guardrails.usesOnlyCitedFacts === true, `${profile.id}: advisor must use cited facts`);
  assertNoRawText(profile, compiled, "baseline");
}

function assertCounterfactual(profile, baseline, mutant) {
  const removed = new Set(modelFocusFacts(baseline.learnerModel));
  if (!removed.size) return;
  const mutantModelFactIds = modelFocusFacts(mutant.learnerModel);
  mutantModelFactIds.forEach(factId => assert(!removed.has(factId), `${profile.id}: learner model still cites removed focus fact ${factId}`));
  plannerSelectedFacts(mutant.plannerDecision).forEach(fact => {
    assert(!removed.has(fact.id), `${profile.id}: planner still selected removed learner-model focus fact ${fact.id}`);
  });
  (mutant.advice.citedFacts || []).forEach(fact => {
    assert(!removed.has(fact.id), `${profile.id}: advisor still cited removed learner-model focus fact ${fact.id}`);
  });
  const contract = contracts[profile.id] || {};
  if (contract.counterfactualForbiddenRule) {
    assert(mutant.learnerModel.recommendedFocus.rule !== contract.counterfactualForbiddenRule, `${profile.id}: learner model focus did not move away from ${contract.counterfactualForbiddenRule}`);
  }
  assertKnownFacts(profile, mutant);
  assertNoRawText(profile, mutant, "counterfactual");
}

function evaluateLearnerModelAlignment(options = {}) {
  const root = rootDir(options);
  const fixture = readFixture(root);
  const context = makeContext(root, fixture.fixedNow);
  const rows = [];

  (fixture.profiles || []).forEach(profile => {
    const baseline = compileProfile(context, profile, fixture.fixedNow);
    assertBaseline(profile, baseline);
    const focusFacts = new Set(modelFocusFacts(baseline.learnerModel));
    const mutant = compileProfile(context, profile, fixture.fixedNow, {
      filterFacts: fact => !focusFacts.has(fact.id)
    });
    assertCounterfactual(profile, baseline, mutant);
    rows.push({
      id: profile.id,
      modelRule: baseline.learnerModel.recommendedFocus.rule,
      plannerRule: plannerRule(baseline.plannerDecision),
      advisorRule: advisorRule(baseline.advice),
      modelFocusFacts: modelFocusFacts(baseline.learnerModel),
      counterfactualModelRule: mutant.learnerModel.recommendedFocus.rule
    });
  });

  return {
    status: "pass",
    schemaVersion: fixture.schemaVersion || null,
    fixedNow: fixture.fixedNow || "",
    profileCount: rows.length,
    profiles: rows
  };
}

function runCli() {
  try {
    const root = argValue("--root") || repoRoot;
    const result = evaluateLearnerModelAlignment({ root });
    result.profiles.forEach(profile => {
      console.log(`ok - learner model alignment ${profile.id} -> ${profile.modelRule}`);
    });
    console.log("ok - learner model alignment links model focus, planner citations, advisor citations, and counterfactual drift");
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

if (require.main === module) runCli();

module.exports = {
  evaluateLearnerModelAlignment
};

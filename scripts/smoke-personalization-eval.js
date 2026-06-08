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
  "shared/plata-planner.js",
  "shared/plata-advisor.js"
];

const profileContracts = {
  "returning-learner-context": {
    advisorKind: "continue",
    advisorRule: "advisor.continue.returning-learner",
    requiredKinds: ["stable_strength", "preferred_context"],
    removalKinds: ["stable_strength", "preferred_context"],
    mutantAdvisorKind: "inspect"
  },
  "stale-skill-review": {
    plannerKind: "stale",
    plannerRule: "dashboard.review.memory-due",
    advisorKind: "review",
    advisorRule: "advisor.review.memory-due",
    selectedKinds: ["next_review_due"],
    requiredKinds: ["stale_skill", "next_review_due"],
    removalKinds: ["stale_skill", "next_review_due"],
    forbiddenMutantPlannerRule: "dashboard.review.memory-due",
    forbiddenMutantAdvisorKind: "review"
  },
  "repaired-signal-retained": {
    plannerKind: "continue",
    plannerRule: "dashboard.continue.healthy-progress",
    advisorKind: "maintain",
    advisorRule: "advisor.maintain.repaired-signal",
    requiredKinds: ["repaired_signal"],
    removalKinds: ["repaired_signal"],
    forbiddenMutantAdvisorKind: "maintain"
  },
  "recurring-trap-repair": {
    plannerKind: "repair",
    plannerRule: "dashboard.repair.highest-open-mastery",
    advisorKind: "repair",
    advisorRule: "advisor.repair.memory-backed",
    selectedKinds: ["recurring_trap", "weak_signal"],
    requiredKinds: ["recurring_trap", "weak_signal"],
    removalKinds: ["recurring_trap", "weak_signal"],
    mutantAdvisorRule: "advisor.repair.current-evidence",
    mutantPlannerScoreDrops: true,
    mutantHasNoSelectedMemory: true,
    mutantMustNotMentionMemory: true
  },
  "cross-lesson-agency-trap": {
    plannerKind: "repair",
    plannerRule: "dashboard.repair.highest-open-mastery",
    advisorKind: "repair",
    advisorRule: "advisor.repair.root-competency",
    selectedKinds: ["root_competency_trap", "weak_signal"],
    requiredKinds: ["root_competency_trap", "weak_signal"],
    removalKinds: ["root_competency_trap"],
    mutantAdvisorRule: "advisor.repair.memory-backed",
    mutantPlannerScoreDrops: true,
    forbiddenMutantSelectedKinds: ["root_competency_trap"]
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

function compileProfile(context, profile, fixedNow, options = {}) {
  let facts = context.PlataMemory.compileMemoryFacts({ events: profile.events || [] }, {
    now: fixedNow,
    reviewDays: Number(profile.reviewDays || 7),
    staleDays: Number(profile.staleDays || 21)
  });
  if (typeof options.filterFacts === "function") {
    facts = facts.filter(options.filterFacts);
  }

  const plannerInput = profile.planner && profile.planner.input || null;
  const plannerDecision = plannerInput ? context.PlataPlanner.dashboardDecision(Object.assign({}, plannerInput, {
    memoryFacts: facts
  })) : null;
  const plannerExplanation = plannerDecision
    ? context.PlataPlanner.explainDecision(plannerDecision, plannerInput && plannerInput.stats || {})
    : null;
  const advice = context.PlataAdvisor.advise({
    memoryFacts: facts,
    plannerDecision
  });

  return { facts, plannerDecision, plannerExplanation, advice };
}

function factIds(facts) {
  return new Set((facts || []).map(fact => fact.id).filter(Boolean));
}

function factKinds(facts) {
  return (facts || []).map(fact => fact.kind || "").filter(Boolean);
}

function selectedMemoryFacts(plannerDecision) {
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

function containsEvery(source, expected) {
  const set = new Set(source);
  return (expected || []).every(item => set.has(item));
}

function removeKindsFilter(kinds) {
  const removed = new Set(kinds || []);
  return fact => !removed.has(fact.kind);
}

function assertKnownCitations(profileId, compiled) {
  const known = factIds(compiled.facts);
  const cited = compiled.advice.citedFacts || [];
  cited.forEach(fact => {
    assert(known.has(fact.id), `${profileId}: advisor cited unknown fact ${fact.id}`);
    assert(fact.sourceFingerprint, `${profileId}: advisor cited fact without source fingerprint ${fact.id}`);
  });

  const selected = selectedMemoryFacts(compiled.plannerDecision);
  selected.forEach(fact => {
    assert(known.has(fact.id), `${profileId}: planner selected unknown memory fact ${fact.id}`);
    assert(fact.sourceFingerprint, `${profileId}: planner selected fact without source fingerprint ${fact.id}`);
  });

  if (selected.length) {
    const citedIds = factIds(cited);
    selected.forEach(fact => assert(citedIds.has(fact.id), `${profileId}: advisor did not cite planner-selected fact ${fact.id}`));
  }
}

function assertNoRawText(profile, compiled, label) {
  const serialized = JSON.stringify({
    facts: compiled.facts,
    plannerTrace: compiled.plannerDecision && compiled.plannerDecision.trace,
    plannerExplanation: compiled.plannerExplanation,
    advice: compiled.advice
  });
  (profile.forbiddenText || []).forEach(text => {
    assert(!serialized.includes(text), `${profile.id} ${label}: private text leaked into personalization output: ${text}`);
  });
}

function assertBaselineContract(profile, compiled) {
  const contract = profileContracts[profile.id];
  assert(contract, `${profile.id}: missing personalization evaluation contract`);

  if (contract.plannerKind) {
    assert(compiled.plannerDecision && compiled.plannerDecision.kind === contract.plannerKind, `${profile.id}: planner kind should be ${contract.plannerKind}`);
  }
  if (contract.plannerRule) {
    assert(plannerRule(compiled.plannerDecision) === contract.plannerRule, `${profile.id}: planner rule should be ${contract.plannerRule}`);
  }
  assert(compiled.advice.kind === contract.advisorKind, `${profile.id}: advisor kind should be ${contract.advisorKind}`);
  assert(advisorRule(compiled.advice) === contract.advisorRule, `${profile.id}: advisor rule should be ${contract.advisorRule}`);
  assert(containsEvery(factKinds(compiled.facts), contract.requiredKinds), `${profile.id}: required memory kinds are missing`);

  if (contract.selectedKinds) {
    assert(containsEvery(factKinds(selectedMemoryFacts(compiled.plannerDecision)), contract.selectedKinds), `${profile.id}: planner did not select required memory kinds`);
  }

  assert(compiled.advice.guardrails && compiled.advice.guardrails.deterministic === true, `${profile.id}: advisor must be deterministic`);
  assert(compiled.advice.guardrails && compiled.advice.guardrails.requiresModel === false, `${profile.id}: advisor must not require a model`);
  assert(compiled.advice.guardrails && compiled.advice.guardrails.usesOnlyCitedFacts === true, `${profile.id}: advisor must declare cited-fact guardrail`);
  assert(compiled.advice.guardrails && compiled.advice.guardrails.containsRawAnswerText === false, `${profile.id}: advisor must declare raw-text guardrail`);
  assert(compiled.facts.every(fact => fact.privacy && fact.privacy.containsRawAnswerText === false), `${profile.id}: every memory fact needs a privacy marker`);
  assertKnownCitations(profile.id, compiled);
  assertNoRawText(profile, compiled, "baseline");
}

function assertCounterfactualContract(profile, baseline, mutant) {
  const contract = profileContracts[profile.id];
  if (!contract.removalKinds || !contract.removalKinds.length) return;

  assertNoRawText(profile, mutant, "counterfactual");
  assertKnownCitations(`${profile.id} counterfactual`, mutant);

  if (contract.mutantAdvisorKind) {
    assert(mutant.advice.kind === contract.mutantAdvisorKind, `${profile.id}: memory removal should produce advisor kind ${contract.mutantAdvisorKind}`);
  }
  if (contract.forbiddenMutantPlannerRule) {
    assert(plannerRule(mutant.plannerDecision) !== contract.forbiddenMutantPlannerRule, `${profile.id}: memory removal should change planner rule away from ${contract.forbiddenMutantPlannerRule}`);
  }
  if (contract.forbiddenMutantAdvisorKind) {
    assert(mutant.advice.kind !== contract.forbiddenMutantAdvisorKind, `${profile.id}: memory removal should change advisor kind away from ${contract.forbiddenMutantAdvisorKind}`);
  }
  if (contract.mutantAdvisorRule) {
    assert(advisorRule(mutant.advice) === contract.mutantAdvisorRule, `${profile.id}: memory removal should produce advisor rule ${contract.mutantAdvisorRule}`);
  }
  if (contract.mutantPlannerScoreDrops) {
    assert(mutant.plannerDecision && baseline.plannerDecision && mutant.plannerDecision.score < baseline.plannerDecision.score, `${profile.id}: memory removal should lower planner score`);
  }
  if (contract.mutantHasNoSelectedMemory) {
    assert(selectedMemoryFacts(mutant.plannerDecision).length === 0, `${profile.id}: memory removal should clear planner-selected memory facts`);
  }
  if (contract.forbiddenMutantSelectedKinds) {
    const selectedKinds = new Set(factKinds(selectedMemoryFacts(mutant.plannerDecision)));
    contract.forbiddenMutantSelectedKinds.forEach(kind => {
      assert(!selectedKinds.has(kind), `${profile.id}: memory removal should drop selected memory kind ${kind}`);
    });
  }
  if (contract.mutantMustNotMentionMemory) {
    const adviceText = `${mutant.advice.title} ${mutant.advice.advice}`.toLowerCase();
    assert(!adviceText.includes("learner memory"), `${profile.id}: citationless counterfactual advice must not claim learner memory evidence`);
  }
}

function evaluatePersonalizationProfiles(options = {}) {
  const root = rootDir(options);
  const fixture = JSON.parse(fs.readFileSync(path.join(root, fixtureRelPath), "utf8"));
  const context = makeContext(root, fixture.fixedNow);
  const rows = [];

  (fixture.profiles || []).forEach(profile => {
    const baseline = compileProfile(context, profile, fixture.fixedNow);
    assertBaselineContract(profile, baseline);

    const contract = profileContracts[profile.id];
    const mutant = compileProfile(context, profile, fixture.fixedNow, {
      filterFacts: removeKindsFilter(contract.removalKinds || [])
    });
    assertCounterfactualContract(profile, baseline, mutant);

    rows.push({
      id: profile.id,
      plannerRule: plannerRule(baseline.plannerDecision),
      advisorRule: advisorRule(baseline.advice),
      citedFactCount: (baseline.advice.citedFacts || []).length,
      counterfactualAdvisorRule: advisorRule(mutant.advice),
      counterfactualPlannerRule: plannerRule(mutant.plannerDecision)
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
    const result = evaluatePersonalizationProfiles({ root });
    result.profiles.forEach(profile => {
      console.log(`ok - personalization eval ${profile.id} -> ${profile.advisorRule || profile.plannerRule}`);
    });
    console.log("ok - personalization eval links memory, planner, advisor, and counterfactual drift");
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

if (require.main === module) runCli();

module.exports = {
  evaluatePersonalizationProfiles
};

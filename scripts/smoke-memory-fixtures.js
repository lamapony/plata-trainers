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
  "shared/plata-planner.js"
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

function fixturePath(root) {
  return path.join(root, fixtureRelPath);
}

function readSource(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function stableJson(value) {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return "[" + value.map(stableJson).join(",") + "]";
  if (typeof value === "object") {
    return "{" + Object.keys(value).sort().map(key => JSON.stringify(key) + ":" + stableJson(value[key])).join(",") + "}";
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
    vm.runInContext(readSource(root, relPath), context, { filename: relPath });
  });
  return context;
}

function compactConfidence(value) {
  return Number(Number(value || 0).toFixed(3));
}

function compactFact(fact) {
  return {
    id: fact.id || "",
    kind: fact.kind || "",
    status: fact.status || "",
    trainerId: fact.trainerId || "",
    signal: fact.signal || "",
    confidence: compactConfidence(fact.confidence),
    sourceFingerprint: fact.sourceFingerprint || ""
  };
}

function compactPlannerFact(fact) {
  return {
    id: fact.id || "",
    kind: fact.kind || "",
    status: fact.status || "",
    trainerId: fact.trainerId || "",
    signal: fact.signal || "",
    confidence: compactConfidence(fact.confidence),
    sourceFingerprint: fact.sourceFingerprint || ""
  };
}

function matchesFact(fact, matcher) {
  return Object.keys(matcher || {}).every(key => {
    if (key === "id" || key === "sourceFingerprint" || key === "confidence") return true;
    return fact[key] === matcher[key];
  });
}

function findFact(facts, matcher, profileId) {
  const found = facts.find(fact => matchesFact(fact, matcher));
  assert(found, `${profileId}: missing memory fact ${stableJson(matcher)}`);
  return found;
}

function expectedSummary(memoryApi, facts) {
  const summary = memoryApi.summarizeMemoryFacts(facts);
  return {
    total: summary.total,
    byKind: summary.byKind,
    openSignals: summary.openSignals,
    dueReviews: summary.dueReviews
  };
}

function compileProfile(context, profile, fixedNow) {
  const options = {
    now: fixedNow,
    reviewDays: Number(profile.reviewDays || 7),
    staleDays: Number(profile.staleDays || 21)
  };
  const events = Array.isArray(profile.events) ? profile.events : [];
  const facts = context.PlataMemory.compileMemoryFacts({ events }, options);
  const planner = profile.planner ? context.PlataPlanner.dashboardDecision(Object.assign({}, profile.planner.input || {}, {
    memoryFacts: facts
  })) : null;
  const plannerExplanation = planner ? context.PlataPlanner.explainDecision(planner, profile.planner.input && profile.planner.input.stats || {}) : null;
  return {
    events,
    facts,
    planner,
    plannerExplanation,
    eventFingerprint: context.PlataEvents.eventFingerprint(events),
    memoryFingerprint: context.PlataMemory.memoryFingerprint(facts),
    summary: expectedSummary(context.PlataMemory, facts)
  };
}

function plannerExpectation(profile, compiled) {
  if (!profile.planner || !compiled.planner) return null;
  const trace = compiled.planner.trace || {};
  const memoryFacts = trace.inputs && trace.inputs.selectedMemoryFacts || [];
  return {
    kind: compiled.planner.kind || "",
    rule: trace.rule || "",
    score: Number(compiled.planner.score || 0),
    traceFingerprint: trace.fingerprint || "",
    signalTag: compiled.planner.signalTag || "",
    selectedMemoryFacts: memoryFacts.map(compactPlannerFact),
    memoryScoreLabels: (trace.scoreBreakdown || []).filter(part => /^memory /.test(part.label || "")).map(part => part.label),
    memoryExplanationFacts: (compiled.plannerExplanation && compiled.plannerExplanation.facts || []).filter(fact => /^Memory:/.test(fact))
  };
}

function expectedForProfile(profile, compiled) {
  const requiredFacts = (profile.requiredFacts || []).map(matcher => compactFact(findFact(compiled.facts, matcher, profile.id)));
  const expected = {
    eventFingerprint: compiled.eventFingerprint,
    memoryFingerprint: compiled.memoryFingerprint,
    summary: compiled.summary,
    requiredFacts
  };

  const planner = plannerExpectation(profile, compiled);
  if (planner) expected.planner = planner;

  return expected;
}

function assertStable(name, actual, expected) {
  assert(stableJson(actual) === stableJson(expected), `${name} drifted\nexpected: ${stableJson(expected)}\nactual:   ${stableJson(actual)}`);
}

function assertProfile(profile, compiled, expected) {
  assert(expected, `${profile.id}: expected snapshot is missing; run node scripts/smoke-memory-fixtures.js --update`);
  assert(compiled.eventFingerprint === expected.eventFingerprint, `${profile.id}: event fingerprint drifted`);
  assert(compiled.memoryFingerprint === expected.memoryFingerprint, `${profile.id}: memory fingerprint drifted`);
  assertStable(`${profile.id}: memory summary`, compiled.summary, expected.summary);

  const actualFacts = (profile.requiredFacts || []).map(matcher => compactFact(findFact(compiled.facts, matcher, profile.id)));
  assertStable(`${profile.id}: required memory facts`, actualFacts, expected.requiredFacts || []);

  if (profile.planner) {
    const actualPlanner = plannerExpectation(profile, compiled);
    assertStable(`${profile.id}: planner expectation`, actualPlanner, expected.planner);
  }

  const serialized = JSON.stringify({
    facts: compiled.facts,
    plannerTrace: compiled.planner && compiled.planner.trace,
    plannerExplanation: compiled.plannerExplanation
  });
  (profile.forbiddenText || []).forEach(text => {
    assert(!serialized.includes(text), `${profile.id}: private text leaked into memory/planner output: ${text}`);
  });
  assert(compiled.facts.every(fact => fact.privacy && fact.privacy.containsRawAnswerText === false), `${profile.id}: every memory fact needs a privacy marker`);
}

function evaluateLearnerMemoryFixtures(options = {}) {
  const root = rootDir(options);
  const file = fixturePath(root);
  const update = !!options.update;
  const fixture = JSON.parse(fs.readFileSync(file, "utf8"));
  const context = makeContext(root, fixture.fixedNow);
  const profiles = fixture.profiles || [];
  const rows = [];

  profiles.forEach(profile => {
    const compiled = compileProfile(context, profile, fixture.fixedNow);
    const expected = expectedForProfile(profile, compiled);
    if (update) {
      if (profile.expected && profile.expected.advisor) expected.advisor = profile.expected.advisor;
      profile.expected = expected;
    } else {
      assertProfile(profile, compiled, profile.expected);
    }
    rows.push({
      id: profile.id,
      title: profile.title || profile.id,
      eventFingerprint: compiled.eventFingerprint,
      memoryFingerprint: compiled.memoryFingerprint,
      factCount: compiled.facts.length,
      requiredFacts: (profile.requiredFacts || []).map(fact => `${fact.kind}:${fact.signal || ""}`),
      plannerRule: compiled.planner && compiled.planner.trace && compiled.planner.trace.rule || ""
    });
  });

  if (update) {
    fs.writeFileSync(file, JSON.stringify(fixture, null, 2) + "\n");
  }

  return {
    status: "pass",
    schemaVersion: fixture.schemaVersion || null,
    fixedNow: fixture.fixedNow || "",
    profileCount: profiles.length,
    profiles: rows
  };
}

function runCli() {
  try {
    const root = argValue("--root") || repoRoot;
    const update = hasFlag("--update");
    const result = evaluateLearnerMemoryFixtures({ root, update });
    if (update) {
      console.log(`learner memory fixture snapshot updated: ${fixtureRelPath}`);
    } else {
      result.profiles.forEach(profile => {
        console.log(`ok - learner memory fixture ${profile.id} (${profile.factCount} fact(s))`);
      });
      console.log("ok - learner memory fixtures are deterministic and planner-cited");
    }
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

if (require.main === module) runCli();

module.exports = {
  evaluateLearnerMemoryFixtures
};

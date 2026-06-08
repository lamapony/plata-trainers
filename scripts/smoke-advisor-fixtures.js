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
    vm.runInContext(fs.readFileSync(path.join(root, relPath), "utf8"), context, { filename: relPath });
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

function compileProfile(context, profile, fixedNow) {
  const facts = context.PlataMemory.compileMemoryFacts({ events: profile.events || [] }, {
    now: fixedNow,
    reviewDays: Number(profile.reviewDays || 7),
    staleDays: Number(profile.staleDays || 21)
  });
  const plannerDecision = profile.planner ? context.PlataPlanner.dashboardDecision(Object.assign({}, profile.planner.input || {}, {
    memoryFacts: facts
  })) : null;
  const advice = context.PlataAdvisor.advise({
    memoryFacts: facts,
    plannerDecision
  });
  return { facts, plannerDecision, advice };
}

function adviceExpectation(compiled) {
  const advice = compiled.advice;
  return {
    advisorId: advice.advisorId,
    kind: advice.kind,
    title: advice.title,
    advice: advice.advice,
    nextAction: advice.nextAction,
    citedFacts: (advice.citedFacts || []).map(compactFact),
    evidenceSummary: advice.evidenceSummary || [],
    guardrails: advice.guardrails,
    traceRule: advice.trace && advice.trace.rule || "",
    traceFingerprint: advice.trace && advice.trace.fingerprint || "",
    plannerRule: advice.trace && advice.trace.inputs && advice.trace.inputs.plannerRule || ""
  };
}

function assertStable(name, actual, expected) {
  assert(stableJson(actual) === stableJson(expected), `${name} drifted\nexpected: ${stableJson(expected)}\nactual:   ${stableJson(actual)}`);
}

function assertAdvice(profile, compiled, expected) {
  assert(expected, `${profile.id}: expected advisor snapshot is missing; run node scripts/smoke-advisor-fixtures.js --update`);
  const actual = adviceExpectation(compiled);
  assertStable(`${profile.id}: advisor advice`, actual, expected);

  const knownFactIds = new Set(compiled.facts.map(fact => fact.id));
  (compiled.advice.citedFacts || []).forEach(fact => {
    assert(knownFactIds.has(fact.id), `${profile.id}: advisor cited unknown fact ${fact.id}`);
  });
  assert(compiled.advice.citedFacts && compiled.advice.citedFacts.length > 0, `${profile.id}: advisor must cite at least one memory fact`);
  assert(compiled.advice.guardrails && compiled.advice.guardrails.usesOnlyCitedFacts === true, `${profile.id}: advisor must declare cited-fact guardrail`);
  assert(compiled.advice.guardrails && compiled.advice.guardrails.containsRawAnswerText === false, `${profile.id}: advisor must declare privacy guardrail`);

  const serialized = JSON.stringify(compiled.advice);
  (profile.forbiddenText || []).forEach(text => {
    assert(!serialized.includes(text), `${profile.id}: private text leaked into advisor output: ${text}`);
  });
}

function evaluateAdvisorFixtures(options = {}) {
  const root = rootDir(options);
  const fixturePath = path.join(root, fixtureRelPath);
  const update = !!options.update;
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const context = makeContext(root, fixture.fixedNow);
  const rows = [];

  (fixture.profiles || []).forEach(profile => {
    const compiled = compileProfile(context, profile, fixture.fixedNow);
    const expected = adviceExpectation(compiled);
    if (update) {
      profile.expected = Object.assign({}, profile.expected || {}, { advisor: expected });
    } else {
      assertAdvice(profile, compiled, profile.expected && profile.expected.advisor);
    }
    rows.push({
      id: profile.id,
      kind: compiled.advice.kind,
      traceRule: compiled.advice.trace && compiled.advice.trace.rule || "",
      citedFacts: (compiled.advice.citedFacts || []).map(fact => fact.id)
    });
  });

  if (update) {
    fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2) + "\n");
  }

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
    const update = hasFlag("--update");
    const result = evaluateAdvisorFixtures({ root, update });
    if (update) {
      console.log(`advisor fixture snapshot updated: ${fixtureRelPath}`);
    } else {
      result.profiles.forEach(profile => {
        console.log(`ok - advisor fixture ${profile.id} -> ${profile.kind}`);
      });
      console.log("ok - advisor fixtures are deterministic and evidence-backed");
    }
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

if (require.main === module) runCli();

module.exports = {
  evaluateAdvisorFixtures
};

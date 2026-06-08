#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const sourceFiles = [
  "shared/plata-events.js",
  "shared/plata-competencies.js",
  "shared/plata-memory.js",
  "shared/plata-learner-model.js",
  "shared/plata-planner.js",
  "shared/plata-advisor.js"
];

const trainers = {
  radiator: {
    id: "lesson-b2-radiator-register",
    name: "B2: Register & Particles",
    type: "lesson",
    path: "./lessons/lesson-b2-radiator/",
    description: "Complaints, tone, modal particles"
  },
  followup: {
    id: "lesson-b2-job-followup",
    name: "B2: Job Follow-up",
    type: "lesson",
    path: "./lessons/lesson-b2-job-followup/",
    description: "Post-interview follow-up and professional agency"
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

function event(id, type, at, data) {
  return Object.assign({
    schemaVersion: 1,
    id,
    type,
    at,
    source: "trajectory-fixture"
  }, data || {});
}

function attempt(id, at, trainer, itemId, signal, correct, mode, secret) {
  const out = event(id, "attempt.recorded", at, {
    trainerId: trainer.id,
    trainerName: trainer.name,
    itemId,
    mode: mode || "lesson",
    correct: !!correct,
    diagnosticTags: [signal],
    tags: ["B2", mode || "lesson", signal]
  });
  if (secret) {
    out.expected = `${secret} expected`;
    out.given = `${secret} given`;
  }
  return out;
}

function repairClosed(id, at, trainer, itemId, signal, label, action) {
  return event(id, "repair.closed", at, {
    trainerId: trainer.id,
    trainerName: trainer.name,
    signal,
    label,
    action,
    itemId,
    sceneId: itemId,
    lessonId: trainer.id,
    correct: true,
    diagnosticTags: [signal],
    tags: [signal]
  });
}

function signalReopened(id, at, trainer, itemId, signal, label, attemptId) {
  return event(id, "signal.reopened", at, {
    trainerId: trainer.id,
    trainerName: trainer.name,
    signal,
    label,
    itemId,
    sceneId: itemId,
    lessonId: trainer.id,
    reopenedByAttemptId: attemptId || "",
    diagnosticTags: [signal],
    tags: [signal]
  });
}

function masterySignal(tag, options = {}) {
  return {
    tag,
    label: options.label || tag,
    wrong: Number(options.wrong || 1),
    correct: Number(options.correct || 0),
    total: Number(options.total || 1),
    score: Number(options.score === undefined ? 1 : options.score),
    remediation: {
      href: options.href || `./lessons/lesson-b2-radiator/?mode=repair&signal=${encodeURIComponent(tag)}#${encodeURIComponent(options.sceneId || tag)}`,
      action: options.action || "Open the smallest repair scene."
    }
  };
}

function plannerInput(stage) {
  const trainer = trainers[stage.trainer || "radiator"];
  assert(trainer, `${stage.id}: unknown trainer ${stage.trainer}`);
  return {
    trainer,
    stats: Object.assign({
      total: 2,
      correct: 2,
      accuracy: 100,
      today: 0,
      lastSessionDate: stage.lastSessionDate || "2026-06-01"
    }, stage.stats || {}),
    weakMastery: stage.weakMastery || [],
    weakTags: stage.weakTags || [],
    index: Number(stage.index || 4)
  };
}

function factKinds(facts) {
  return new Set((facts || []).map(fact => fact.kind).filter(Boolean));
}

function factsById(facts) {
  const out = new Map();
  (facts || []).forEach(fact => {
    if (fact && fact.id) out.set(fact.id, fact);
  });
  return out;
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

function ids(rows) {
  return new Set((rows || []).map(row => row && (row.id || row.factId)).filter(Boolean));
}

function sorted(values) {
  return (values || []).filter(Boolean).slice().sort();
}

function stageReport(trajectory, stage, compiled) {
  const factById = factsById(compiled.facts);
  const focusFactIds = modelFocusFacts(compiled.learnerModel);
  const plannerFacts = plannerSelectedFacts(compiled.plannerDecision);
  const advisorFacts = compiled.advice.citedFacts || [];
  return {
    trajectoryId: trajectory.id,
    stageId: stage.id,
    eventCount: compiled.eventCount,
    memoryFingerprint: compiled.memoryFingerprint,
    memoryKinds: sorted([...factKinds(compiled.facts)]),
    modelKind: compiled.learnerModel.recommendedFocus.kind,
    modelRule: compiled.learnerModel.recommendedFocus.rule,
    modelFocusFactIds: sorted(focusFactIds),
    modelFocusKinds: sorted(focusFactIds.map(factId => factById.get(factId) && factById.get(factId).kind)),
    plannerKind: compiled.plannerDecision.kind,
    plannerRule: plannerRule(compiled.plannerDecision),
    plannerSelectedFactIds: sorted(plannerFacts.map(fact => fact.id)),
    plannerSelectedKinds: sorted(plannerFacts.map(fact => fact.kind)),
    advisorKind: compiled.advice.kind,
    advisorRule: advisorRule(compiled.advice),
    advisorCitedFactIds: sorted(advisorFacts.map(fact => fact.id)),
    advisorCitedKinds: sorted(advisorFacts.map(fact => fact.kind)),
    rootCompetencies: sorted((compiled.learnerModel.rootCompetencies || []).map(row => row.competencyId))
  };
}

function containsEvery(source, expected) {
  return (expected || []).every(item => source.has(item));
}

function compileStage(context, trajectory, stage) {
  context.Date = fixedDateConstructor(stage.now);
  const events = trajectory.events.slice(0, stage.take);
  const facts = context.PlataMemory.compileMemoryFacts({ events }, {
    now: stage.now,
    reviewDays: Number(stage.reviewDays || 7),
    staleDays: Number(stage.staleDays || 21)
  });
  const memoryFingerprint = context.PlataMemory.memoryFingerprint(facts);
  const learnerModel = context.PlataLearnerModel.buildModel(facts, {
    generatedAt: stage.now,
    now: stage.now,
    memoryFingerprint
  });
  const plannerDecision = context.PlataPlanner.dashboardDecision(Object.assign(plannerInput(stage), {
    memoryFacts: facts
  }));
  const advice = context.PlataAdvisor.advise({ memoryFacts: facts, plannerDecision });
  return {
    id: stage.id,
    eventCount: events.length,
    facts,
    memoryFingerprint,
    learnerModel,
    plannerDecision,
    advice
  };
}

function assertKnownCitations(trajectory, stage, compiled) {
  const known = factsById(compiled.facts);
  modelFocusFacts(compiled.learnerModel).forEach(factId => {
    assert(known.has(factId), `${trajectory.id}/${stage.id}: learner model focus cited unknown fact ${factId}`);
  });
  plannerSelectedFacts(compiled.plannerDecision).forEach(fact => {
    assert(known.has(fact.id), `${trajectory.id}/${stage.id}: planner selected unknown memory fact ${fact.id}`);
    assert(fact.sourceFingerprint, `${trajectory.id}/${stage.id}: planner selected fact without source fingerprint ${fact.id}`);
  });
  (compiled.advice.citedFacts || []).forEach(fact => {
    assert(known.has(fact.id), `${trajectory.id}/${stage.id}: advisor cited unknown memory fact ${fact.id}`);
    assert(fact.sourceFingerprint, `${trajectory.id}/${stage.id}: advisor cited fact without source fingerprint ${fact.id}`);
  });
}

function assertNoRawText(trajectory, stage, compiled) {
  const serialized = JSON.stringify({
    facts: compiled.facts,
    learnerModel: compiled.learnerModel,
    plannerTrace: compiled.plannerDecision && compiled.plannerDecision.trace,
    advice: compiled.advice
  });
  (trajectory.forbiddenText || []).forEach(text => {
    assert(!serialized.includes(text), `${trajectory.id}/${stage.id}: private text leaked into trajectory output: ${text}`);
  });
  ["trajectory-secret", "cross-trajectory-secret"].forEach(text => {
    assert(!serialized.includes(text), `${trajectory.id}/${stage.id}: smoke secret leaked into trajectory output: ${text}`);
  });
}

function assertStage(trajectory, stage, compiled, previous) {
  const kinds = factKinds(compiled.facts);
  assert(compiled.eventCount === stage.take, `${trajectory.id}/${stage.id}: replay should use ${stage.take} events`);
  assert(containsEvery(kinds, stage.expect.factKinds || []), `${trajectory.id}/${stage.id}: expected memory fact kind ${(stage.expect.factKinds || []).find(kind => !kinds.has(kind))}`);
  (stage.expect.absentFactKinds || []).forEach(kind => {
    assert(!kinds.has(kind), `${trajectory.id}/${stage.id}: memory fact kind should be absent ${kind}`);
  });

  assert(compiled.learnerModel.recommendedFocus.kind === stage.expect.modelKind, `${trajectory.id}/${stage.id}: learner model kind should be ${stage.expect.modelKind}`);
  assert(compiled.learnerModel.recommendedFocus.rule === stage.expect.modelRule, `${trajectory.id}/${stage.id}: learner model rule should be ${stage.expect.modelRule}`);
  assert(compiled.plannerDecision.kind === stage.expect.plannerKind, `${trajectory.id}/${stage.id}: planner kind should be ${stage.expect.plannerKind}`);
  assert(plannerRule(compiled.plannerDecision) === stage.expect.plannerRule, `${trajectory.id}/${stage.id}: planner rule should be ${stage.expect.plannerRule}`);
  assert(compiled.advice.kind === stage.expect.advisorKind, `${trajectory.id}/${stage.id}: advisor kind should be ${stage.expect.advisorKind}`);
  assert(advisorRule(compiled.advice) === stage.expect.advisorRule, `${trajectory.id}/${stage.id}: advisor rule should be ${stage.expect.advisorRule}`);

  const factById = factsById(compiled.facts);
  const focusKinds = modelFocusFacts(compiled.learnerModel).map(factId => factById.get(factId) && factById.get(factId).kind).filter(Boolean);
  assert(containsEvery(new Set(focusKinds), stage.expect.modelFocusKinds || []), `${trajectory.id}/${stage.id}: learner model did not focus required fact kind`);

  const selectedKinds = plannerSelectedFacts(compiled.plannerDecision).map(fact => fact.kind);
  assert(containsEvery(new Set(selectedKinds), stage.expect.plannerSelectedKinds || []), `${trajectory.id}/${stage.id}: planner did not select required memory fact kind`);

  const citedIds = ids(compiled.advice.citedFacts || []);
  modelFocusFacts(compiled.learnerModel).forEach(factId => {
    assert(citedIds.has(factId), `${trajectory.id}/${stage.id}: advisor did not cite learner-model focus fact ${factId}`);
  });

  if (stage.expect.rootCompetency) {
    assert(compiled.learnerModel.rootCompetencies.some(row => row.competencyId === stage.expect.rootCompetency), `${trajectory.id}/${stage.id}: learner model lost root competency ${stage.expect.rootCompetency}`);
  }

  if (previous && stage.expectChangedFromPrevious) {
    const checks = {
      memoryFingerprint: compiled.memoryFingerprint !== previous.memoryFingerprint,
      modelRule: compiled.learnerModel.recommendedFocus.rule !== previous.learnerModel.recommendedFocus.rule,
      plannerRule: plannerRule(compiled.plannerDecision) !== plannerRule(previous.plannerDecision),
      advisorRule: advisorRule(compiled.advice) !== advisorRule(previous.advice)
    };
    stage.expectChangedFromPrevious.forEach(key => {
      assert(checks[key], `${trajectory.id}/${stage.id}: expected ${key} to change from previous stage`);
    });
  }

  assert(compiled.learnerModel.guardrails && compiled.learnerModel.guardrails.usesOnlyCitedFacts === true, `${trajectory.id}/${stage.id}: learner model must use cited facts`);
  assert(compiled.advice.guardrails && compiled.advice.guardrails.usesOnlyCitedFacts === true, `${trajectory.id}/${stage.id}: advisor must use cited facts`);
  assertKnownCitations(trajectory, stage, compiled);
  assertNoRawText(trajectory, stage, compiled);
}

function trajectories() {
  return [
    {
      id: "repair-review-reopen",
      title: "Repair closes, spacing reviews, then a later miss reopens",
      forbiddenText: ["trajectory-secret"],
      events: [
        attempt("traj-passive-1", "2026-06-01T08:00:00.000Z", trainers.radiator, "official-reply-passive", "passive-agency", false, "lesson", "trajectory-secret"),
        attempt("traj-passive-2", "2026-06-01T08:05:00.000Z", trainers.radiator, "official-reply-passive", "passive-agency", true, "repair", "trajectory-secret"),
        repairClosed("traj-passive-close", "2026-06-01T08:06:00.000Z", trainers.radiator, "official-reply-passive", "passive-agency", "Read passive agency", "Name the missing actor"),
        attempt("traj-passive-review-1", "2026-06-08T08:08:00.000Z", trainers.radiator, "official-reply-passive", "passive-agency", true, "review", "trajectory-secret"),
        attempt("traj-passive-review-2", "2026-06-08T08:10:00.000Z", trainers.radiator, "official-reply-passive", "passive-agency", true, "review", "trajectory-secret"),
        attempt("traj-passive-review-3", "2026-06-08T08:12:00.000Z", trainers.radiator, "official-reply-passive", "passive-agency", true, "review", "trajectory-secret"),
        attempt("traj-passive-3", "2026-06-12T08:00:00.000Z", trainers.radiator, "official-reply-passive-later", "passive-agency", false, "lesson", "trajectory-secret"),
        signalReopened("traj-passive-reopen", "2026-06-12T08:00:01.000Z", trainers.radiator, "official-reply-passive-later", "passive-agency", "Read passive agency", "traj-passive-3"),
        attempt("traj-passive-4", "2026-06-12T08:02:00.000Z", trainers.radiator, "official-reply-passive-later", "passive-agency", false, "lesson", "trajectory-secret"),
        attempt("traj-passive-5", "2026-06-12T08:04:00.000Z", trainers.radiator, "official-reply-passive-later", "passive-agency", false, "lesson", "trajectory-secret")
      ],
      stages: [
        {
          id: "after-first-miss",
          take: 1,
          now: "2026-06-01T08:01:00.000Z",
          weakMastery: [masterySignal("passive-agency", { label: "Read passive agency", sceneId: "official-reply-passive" })],
          expect: {
            factKinds: ["weak_signal"],
            absentFactKinds: ["repaired_signal", "next_review_due"],
            modelKind: "repair",
            modelRule: "learner-model.focus.weak-signal",
            modelFocusKinds: ["weak_signal"],
            plannerKind: "repair",
            plannerRule: "dashboard.repair.highest-open-mastery",
            plannerSelectedKinds: ["weak_signal"],
            advisorKind: "repair",
            advisorRule: "advisor.repair.memory-backed"
          }
        },
        {
          id: "after-repair-closure",
          take: 3,
          now: "2026-06-01T08:07:00.000Z",
          expectChangedFromPrevious: ["memoryFingerprint", "modelRule", "plannerRule", "advisorRule"],
          expect: {
            factKinds: ["repaired_signal"],
            absentFactKinds: ["weak_signal", "recurring_trap", "next_review_due"],
            modelKind: "maintain",
            modelRule: "learner-model.focus.maintenance",
            modelFocusKinds: ["repaired_signal"],
            plannerKind: "continue",
            plannerRule: "dashboard.continue.healthy-progress",
            advisorKind: "maintain",
            advisorRule: "advisor.maintain.repaired-signal"
          }
        },
        {
          id: "after-spacing-gap",
          take: 3,
          now: "2026-06-08T08:07:00.000Z",
          lastSessionDate: "2026-06-01",
          expectChangedFromPrevious: ["memoryFingerprint", "modelRule", "plannerRule", "advisorRule"],
          expect: {
            factKinds: ["next_review_due", "repaired_signal"],
            absentFactKinds: ["weak_signal", "recurring_trap"],
            modelKind: "review",
            modelRule: "learner-model.focus.review",
            modelFocusKinds: ["next_review_due"],
            plannerKind: "stale",
            plannerRule: "dashboard.review.memory-due",
            plannerSelectedKinds: ["next_review_due"],
            advisorKind: "review",
            advisorRule: "advisor.review.memory-due"
          }
        },
        {
          id: "after-review-pass",
          take: 6,
          now: "2026-06-08T08:13:00.000Z",
          stats: { total: 5, correct: 4, accuracy: 80, lastSessionDate: "2026-06-08" },
          expectChangedFromPrevious: ["memoryFingerprint", "modelRule", "plannerRule", "advisorRule"],
          expect: {
            factKinds: ["repaired_signal", "stable_strength"],
            absentFactKinds: ["weak_signal", "recurring_trap", "next_review_due"],
            modelKind: "maintain",
            modelRule: "learner-model.focus.maintenance",
            modelFocusKinds: ["repaired_signal"],
            plannerKind: "continue",
            plannerRule: "dashboard.continue.healthy-progress",
            advisorKind: "maintain",
            advisorRule: "advisor.maintain.repaired-signal"
          }
        },
        {
          id: "after-new-miss-reopens",
          take: 10,
          now: "2026-06-12T08:05:00.000Z",
          stats: { total: 8, correct: 4, accuracy: 50, lastSessionDate: "2026-06-12" },
          weakMastery: [masterySignal("passive-agency", { label: "Read passive agency", sceneId: "official-reply-passive-later", wrong: 4, correct: 4, total: 8, score: 0.5 })],
          expectChangedFromPrevious: ["memoryFingerprint", "modelRule", "plannerRule"],
          expect: {
            factKinds: ["weak_signal", "recurring_trap"],
            absentFactKinds: ["repaired_signal", "next_review_due"],
            modelKind: "repair",
            modelRule: "learner-model.focus.recurring-trap",
            modelFocusKinds: ["recurring_trap"],
            plannerKind: "repair",
            plannerRule: "dashboard.repair.highest-open-mastery",
            plannerSelectedKinds: ["recurring_trap"],
            advisorKind: "repair",
            advisorRule: "advisor.repair.memory-backed"
          }
        }
      ]
    },
    {
      id: "cross-lesson-root-skill",
      title: "Single weak signal becomes root-competency focus only after a cross-lesson miss",
      forbiddenText: ["cross-trajectory-secret"],
      events: [
        attempt("traj-cross-1", "2026-06-04T08:00:00.000Z", trainers.radiator, "official-reply-passive", "passive-agency", false, "lesson", "cross-trajectory-secret"),
        attempt("traj-cross-2", "2026-06-05T09:00:00.000Z", trainers.followup, "email-opener", "professional-email-agency", false, "lesson", "cross-trajectory-secret")
      ],
      stages: [
        {
          id: "single-lesson-signal",
          take: 1,
          now: "2026-06-04T08:01:00.000Z",
          weakMastery: [masterySignal("passive-agency", { label: "Read passive agency", sceneId: "official-reply-passive" })],
          expect: {
            factKinds: ["weak_signal"],
            absentFactKinds: ["root_competency_trap"],
            modelKind: "repair",
            modelRule: "learner-model.focus.weak-signal",
            modelFocusKinds: ["weak_signal"],
            plannerKind: "repair",
            plannerRule: "dashboard.repair.highest-open-mastery",
            plannerSelectedKinds: ["weak_signal"],
            advisorKind: "repair",
            advisorRule: "advisor.repair.memory-backed"
          }
        },
        {
          id: "cross-root-emerges",
          take: 2,
          now: "2026-06-05T09:01:00.000Z",
          trainer: "followup",
          stats: { total: 1, correct: 0, accuracy: 0, lastSessionDate: "2026-06-05" },
          weakMastery: [masterySignal("professional-email-agency", {
            label: "Write warm formal agency",
            sceneId: "email-opener",
            href: "./lessons/lesson-b2-job-followup/?mode=repair&signal=professional-email-agency#email-opener"
          })],
          expectChangedFromPrevious: ["memoryFingerprint", "modelRule", "advisorRule"],
          expect: {
            factKinds: ["root_competency_trap", "weak_signal"],
            modelKind: "repair",
            modelRule: "learner-model.focus.root-competency",
            modelFocusKinds: ["root_competency_trap"],
            rootCompetency: "agency",
            plannerKind: "repair",
            plannerRule: "dashboard.repair.highest-open-mastery",
            plannerSelectedKinds: ["root_competency_trap", "weak_signal"],
            advisorKind: "repair",
            advisorRule: "advisor.repair.root-competency"
          }
        }
      ]
    }
  ];
}

function evaluatePersonalizationTrajectories(options = {}) {
  const root = rootDir(options);
  const all = trajectories();
  const context = makeContext(root, "2026-06-08T12:00:00.000Z");
  const rows = [];

  all.forEach(trajectory => {
    let previous = null;
    trajectory.stages.forEach(stage => {
      const compiled = compileStage(context, trajectory, stage);
      assertStage(trajectory, stage, compiled, previous);
      rows.push(stageReport(trajectory, stage, compiled));
      previous = compiled;
    });
  });

  return {
    status: "pass",
    trajectoryCount: all.length,
    stageCount: rows.length,
    stages: rows
  };
}

function runCli() {
  try {
    const root = argValue("--root") || repoRoot;
    const result = evaluatePersonalizationTrajectories({ root });
    if (process.argv.includes("--json")) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    result.stages.forEach(stage => {
      console.log(`ok - personalization trajectory ${stage.trajectoryId}/${stage.stageId} -> ${stage.modelRule} / ${stage.advisorRule}`);
    });
    console.log("ok - personalization trajectories replay repair, review, reopen, and root-skill transitions");
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

if (require.main === module) runCli();

module.exports = {
  evaluatePersonalizationTrajectories
};

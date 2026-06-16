#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const sharedSources = [
  "shared/plata-kernel.js",
  "shared/plata-competencies.js",
  "shared/plata-planner.js",
  "shared/plata-catalog.js"
];
const lessonSources = [
  "lessons/lesson-b2-radiator/data.js",
  "lessons/lesson-b2-job-followup/data.js"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sceneTrainsTag(scene, tag) {
  if ((scene.masteryTags || []).includes(tag)) return true;
  return (scene.options || []).some(option => (option.weakTags || []).includes(tag));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeContext() {
  const storage = {};
  const context = {
    console,
    Date,
    JSON,
    Math,
    Number,
    Object,
    String,
    Array,
    encodeURIComponent,
    decodeURIComponent,
    localStorage: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
      },
      setItem(key, value) {
        storage[key] = String(value);
      },
      removeItem(key) {
        delete storage[key];
      }
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  sharedSources.forEach(relPath => {
    vm.runInContext(fs.readFileSync(path.join(repoRoot, relPath), "utf8"), context, { filename: relPath });
  });
  lessonSources.forEach(relPath => {
    vm.runInContext(fs.readFileSync(path.join(repoRoot, relPath), "utf8"), context, { filename: relPath });
  });
  return context;
}

function catalogGoldLessons(context) {
  return context.PlataCatalog.trainers
    .filter(trainer => trainer.lessonGlobal && context[trainer.lessonGlobal] && context[trainer.lessonGlobal].qualityTier === "gold")
    .map(trainer => ({ trainer, lesson: context[trainer.lessonGlobal] }));
}

function lessonWithMutation(context, lessonId, mutate) {
  return catalogGoldLessons(context).map(entry => {
    const next = { trainer: clone(entry.trainer), lesson: clone(entry.lesson) };
    if (next.lesson.id === lessonId) mutate(next.lesson);
    return next;
  });
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function scenesById(lesson) {
  const map = {};
  (lesson.scenes || []).forEach(scene => {
    if (scene && scene.id) map[scene.id] = scene;
  });
  return map;
}

function seedWeakState(context, lesson, scene, tag) {
  const state = context.PlataKernel.freshState(lesson.id);
  context.PlataKernel.recordAttempt(state, {
    itemId: scene.id,
    correct: false,
    tags: [lesson.level || "lesson", "lesson", tag],
    mode: "lesson",
    expected: "redacted expected answer",
    given: "redacted learner answer"
  });
  return state;
}

function statsForState(context, state) {
  const plannerStats = context.PlataPlanner.statsFromState(state);
  return {
    total: plannerStats.total,
    correct: plannerStats.correct,
    accuracy: plannerStats.accuracy,
    today: plannerStats.today,
    lastSessionDate: plannerStats.lastSessionDate
  };
}

function assertPlannerRepairContract(context, entry, tag, spec, scene) {
  const planner = context.PlataPlanner;
  const graph = context.PlataCompetencies;
  const state = seedWeakState(context, entry.lesson, scene, tag);
  const weak = context.PlataKernel.getWeakTags(state, 20).find(item => item.tag === tag);
  assert(weak, "kernel did not expose weak mastery tag");

  const lessonDecision = planner.lessonDecision({
    lesson: entry.lesson,
    state,
    rootPrefix: "../../"
  });
  assert(lessonDecision.kind === "repair", "lessonDecision did not choose repair");
  assert(lessonDecision.signalTag === tag, `lessonDecision selected ${lessonDecision.signalTag || "(empty)"} instead`);
  assert(lessonDecision.primaryHref.includes("mode=repair"), "lessonDecision repair href is missing repair mode");
  assert(lessonDecision.primaryHref.includes("signal=" + encodeURIComponent(tag)), "lessonDecision repair href is missing signal");
  assert(lessonDecision.primaryHref.includes("#" + encodeURIComponent(scene.id)), "lessonDecision repair href is missing scene hash");
  assert(lessonDecision.trace && lessonDecision.trace.rule === "lesson.repair.weak-mastery", "lessonDecision repair trace is missing");

  const remediation = {
    cta: spec.remediation.cta,
    action: spec.remediation.action,
    sceneId: spec.remediation.sceneId,
    href: planner.sceneHref(entry.trainer.path, spec.remediation.sceneId, tag)
  };
  const signal = graph.enrichSignal({
    ...weak,
    label: spec.label,
    evidence: spec.evidence,
    competencyId: spec.competencyId,
    remediation
  });
  const stats = statsForState(context, state);
  const decision = planner.dashboardDecision({
    trainer: entry.trainer,
    state,
    stats,
    weakMastery: [signal],
    weakTags: [weak],
    weakCompetencies: graph.rank([signal]),
    index: 0
  });
  assert(decision.kind === "repair", "dashboardDecision did not choose repair");
  assert(decision.signalTag === tag, `dashboardDecision selected ${decision.signalTag || "(empty)"} instead`);
  assert(decision.primaryHref === remediation.href, "dashboardDecision repair href does not match remediation href");
  assert(decision.competency && decision.competency.id === spec.competencyId, "dashboardDecision lost the expected competency");
  assert(decision.trace && decision.trace.inputs && decision.trace.inputs.selectedSignal.tag === tag, "dashboardDecision trace lost selected signal");
  assert(decision.trace.scoreBreakdown.some(part => part.label === "root competency boost"), "dashboardDecision trace lost score breakdown");
  const explanation = planner.explainDecision(decision, stats);
  assert(explanation.copy && explanation.facts.length, "dashboardDecision explanation is empty");

  const plan = planner.practicePlan([{ trainer: entry.trainer, state, stats, decision, index: 0 }], { limit: 1 });
  assert(plan.steps.length === 1, "practicePlan did not preserve repair step");
  assert(plan.steps[0].primaryHref === remediation.href, "practicePlan repair href drifted");
  assert(plan.steps[0].trace && plan.steps[0].trace.fingerprint, "practicePlan step is missing planner trace");
  assert(plan.steps[0].explanation && plan.steps[0].explanation.facts.length, "practicePlan step is missing explanation");
  const saved = planner.savePracticePlan(plan);
  assert(saved.steps[0].trace.fingerprint === plan.steps[0].trace.fingerprint, "saved practicePlan lost trace fingerprint");
  const routed = planner.planStepHref(saved, saved.steps[0]);
  assert(routed.includes("plan=" + encodeURIComponent(saved.planToken)), "practicePlan route is missing plan token");
  assert(routed.includes("step=" + encodeURIComponent(saved.steps[0].routeId)), "practicePlan route is missing step id");
  assert(routed.includes("signal=" + encodeURIComponent(tag)), "practicePlan route is missing repair signal");
}

function issuesForPlannerContracts(context, entries) {
  const graph = context.PlataCompetencies;
  const knownCompetencies = new Set(graph.definitions().map(def => def.id));
  const issues = [];

  entries.forEach(entry => {
    const lesson = entry.lesson;
    const sceneMap = scenesById(lesson);
    Object.entries(lesson.masteryMap || {}).forEach(([tag, spec]) => {
      const prefix = `${lesson.id}.${tag}`;
      try {
        assert(spec && typeof spec === "object", "mastery spec is required");
        assert(nonEmpty(spec.label), "mastery label is required");
        assert(nonEmpty(spec.evidence), "mastery evidence is required");
        assert(nonEmpty(spec.competencyId), "competencyId is required");
        assert(knownCompetencies.has(spec.competencyId), `unknown competencyId ${spec.competencyId}`);
        assert(spec.remediation && typeof spec.remediation === "object", "remediation object is required");
        assert(nonEmpty(spec.remediation.sceneId), "remediation.sceneId is required");
        assert(nonEmpty(spec.remediation.cta), "remediation.cta is required");
        assert(nonEmpty(spec.remediation.action), "remediation.action is required");
        const scene = sceneMap[spec.remediation.sceneId];
        assert(scene, `remediation scene ${spec.remediation.sceneId} does not exist`);
        assert(sceneTrainsTag(scene, tag), `remediation scene ${scene.id} does not train ${tag}`);
        assertPlannerRepairContract(context, entry, tag, spec, scene);
      } catch (err) {
        issues.push(`${prefix}: ${err.message}`);
      }
    });
  });
  return issues;
}

function assertCleanBase(context) {
  const issues = issuesForPlannerContracts(context, catalogGoldLessons(context));
  assert(issues.length === 0, "base planner contract has issues:\n" + issues.join("\n"));
  console.log("ok - planner contract accepts current gold lesson remediation paths");
}

function runMutation(context, spec) {
  const entries = lessonWithMutation(context, "lesson-b2-radiator-register", spec.mutate);
  const issues = issuesForPlannerContracts(context, entries);
  assert(issues.length > 0, `${spec.name}: expected planner contract to fail`);
  spec.expectedIssues.forEach(expected => {
    assert(issues.some(issue => issue.includes(expected)), `${spec.name}: missing issue "${expected}"\n${issues.join("\n")}`);
  });
  console.log(`ok - planner mutation caught: ${spec.name}`);
}

function run() {
  const context = makeContext();
  assertCleanBase(context);
  [
    {
      name: "unknown competency id",
      mutate(lesson) {
        lesson.masteryMap["passive-agency"].competencyId = "ghost-competency";
      },
      expectedIssues: ["unknown competencyId ghost-competency"]
    },
    {
      name: "missing remediation scene",
      mutate(lesson) {
        lesson.masteryMap["passive-agency"].remediation.sceneId = "missing-scene";
      },
      expectedIssues: ["remediation scene missing-scene does not exist"]
    },
    {
      name: "remediation scene does not train signal",
      mutate(lesson) {
        lesson.masteryMap["passive-agency"].remediation.sceneId = "group-chat-particles";
      },
      expectedIssues: ["remediation scene group-chat-particles does not train passive-agency"]
    },
    {
      name: "missing remediation action",
      mutate(lesson) {
        lesson.masteryMap["passive-agency"].remediation.action = "";
      },
      expectedIssues: ["remediation.action is required"]
    },
    {
      name: "scene lost mastery tag",
      mutate(lesson) {
        const scene = lesson.scenes.find(item => item.id === "official-reply-passive");
        scene.masteryTags = [];
      },
      expectedIssues: ["remediation scene official-reply-passive does not train passive-agency"]
    },
    {
      name: "missing mastery evidence",
      mutate(lesson) {
        lesson.masteryMap["passive-agency"].evidence = "";
      },
      expectedIssues: ["mastery evidence is required"]
    }
  ].forEach(spec => runMutation(context, spec));

  console.log("ok - planner mutation checks prove bad pedagogy contracts fail");
}

run();

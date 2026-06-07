#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const competencySource = fs.readFileSync(path.join(repoRoot, "shared", "plata-competencies.js"), "utf8");
const lessonSources = [
  fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-radiator", "data.js"), "utf8"),
  fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-job-followup", "data.js"), "utf8")
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeContext() {
  const context = { console };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(competencySource, context, { filename: "shared/plata-competencies.js" });
  lessonSources.forEach((source, index) => {
    vm.runInContext(source, context, { filename: `lesson-${index}.js` });
  });
  return context;
}

function runGraphContractSmoke(context) {
  const graph = context.PlataCompetencies;
  const definitions = graph.definitions();
  assert(definitions.length >= 5, "competency graph exposes root skills");
  assert(graph.competencyIdForTag("passive-agency") === "agency", "tag index maps passive agency to agency");
  assert(graph.competencyIdForTag("platform-register-shift") === "register-control", "tag index maps platform shift to register control");

  const ranked = graph.rank([
    { tag: "passive-agency", wrong: 1, correct: 0, total: 1, score: 1 },
    { tag: "professional-email-agency", wrong: 1, correct: 0, total: 1, score: 1 },
    { tag: "modal-particle-stance", wrong: 1, correct: 1, total: 2, score: 0.5 }
  ]);
  assert(ranked[0].id === "agency", "competency ranking groups related weak signals");
  assert(ranked[0].signalCount === 2, "competency ranking counts grouped signals");
  assert(ranked[0].wrong === 2, "competency ranking aggregates wrong attempts");
  assert(ranked[0].primarySignal.tag === "passive-agency", "competency ranking keeps a primary repair signal");
}

function runGoldLessonMappingSmoke(context) {
  const graph = context.PlataCompetencies;
  const known = new Set(graph.definitions().map(def => def.id));
  [context.PLATA_LESSON_B2_RADIATOR, context.PLATA_LESSON_B2_JOB_FOLLOWUP].forEach(lesson => {
    assert(lesson && lesson.masteryMap, "gold lesson data loaded");
    Object.entries(lesson.masteryMap).forEach(([tag, spec]) => {
      assert(known.has(spec.competencyId), `${lesson.id}.${tag} has known competencyId`);
      assert(graph.enrichSignal({ tag, competencyId: spec.competencyId }).competency.id === spec.competencyId, `${lesson.id}.${tag} enriches to its competency`);
    });
  });
}

function run() {
  const context = makeContext();
  runGraphContractSmoke(context);
  runGoldLessonMappingSmoke(context);
  console.log("ok - competency graph ranks root skills");
  console.log("ok - gold mastery signals declare known competencies");
}

run();

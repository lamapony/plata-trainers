#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..");
const kernelSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-kernel.js"), "utf8");
const competencySource = fs.readFileSync(path.join(repoRoot, "shared", "plata-competencies.js"), "utf8");
const plannerSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-planner.js"), "utf8");
const radiatorLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-radiator", "data.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
  vm.runInContext(kernelSource, context, { filename: "shared/plata-kernel.js" });
  vm.runInContext(competencySource, context, { filename: "shared/plata-competencies.js" });
  vm.runInContext(plannerSource, context, { filename: "shared/plata-planner.js" });
  vm.runInContext(radiatorLessonSource, context, { filename: "lessons/lesson-b2-radiator/data.js" });
  return context;
}

function seedWeakLesson(context) {
  const kernel = context.PlataKernel;
  const state = kernel.freshState("lesson-b2-radiator-register");
  kernel.recordAttempt(state, {
    itemId: "official-reply-passive",
    correct: false,
    tags: ["B2", "passive", "passive-agency"],
    mode: "lesson",
    expected: "De har registreret sagen, men de lover ikke en dato.",
    given: "De lover, at radiatoren bliver fikset hurtigt."
  });
  return state;
}

function runLessonDecisionSmoke(context) {
  const kernel = context.PlataKernel;
  const state = seedWeakLesson(context);
  const decision = context.PlataPlanner.lessonDecision({
    lesson: context.PLATA_LESSON_B2_RADIATOR,
    state,
    rootPrefix: "../../"
  });

  assert(decision.kind === "repair", "weak lesson should recommend repair");
  assert(decision.score > 100, "repair decision should have high score");
  assert(decision.primaryHref.includes("mode=repair"), "repair decision should open repair mode");
  assert(decision.primaryHref.includes("signal=passive-agency"), "repair decision should carry signal");
  assert(decision.primaryHref.includes("#official-reply-passive"), "repair decision should carry source scene");
  assert(decision.competency.id === "agency", "lesson repair carries root competency");

  kernel.recordAttempt(state, {
    itemId: "official-reply-passive",
    correct: true,
    tags: ["B2", "passive", "passive-agency"],
    mode: "repair",
    expected: "De har registreret sagen, men de lover ikke en dato.",
    given: "De har registreret sagen, men de lover ikke en dato."
  });
  kernel.recordRepairClosure(state, {
    signal: "passive-agency",
    itemId: "official-reply-passive",
    sceneId: "official-reply-passive",
    lessonId: "lesson-b2-radiator-register",
    label: "Read passive agency",
    action: "Name the missing actor",
    correct: true
  });
  const afterRepair = context.PlataPlanner.lessonDecision({
    lesson: context.PLATA_LESSON_B2_RADIATOR,
    state,
    rootPrefix: "../../"
  });
  assert(afterRepair.kind !== "repair", "closed weak lesson should not recommend repair");
  assert(!kernel.getWeakTags(state, 10).some(item => item.tag === "passive-agency"), "planner sees only open weak signals");
  assert(kernel.getWeakTags(state, 10, { includeResolved: true }).some(item => item.tag === "passive-agency"), "planner diagnostics can inspect repaired weak signals");

  kernel.recordAttempt(state, {
    itemId: "official-reply-passive-later",
    correct: false,
    tags: ["B2", "passive", "passive-agency"],
    mode: "lesson",
    expected: "De har registreret sagen, men de lover ikke en dato.",
    given: "De lover en hurtig reparation."
  });
  const reopened = context.PlataPlanner.lessonDecision({
    lesson: context.PLATA_LESSON_B2_RADIATOR,
    state,
    rootPrefix: "../../"
  });
  assert(reopened.kind === "repair", "later miss should reopen lesson repair");
}

function runDrillDecisionSmoke(context) {
  const kernel = context.PlataKernel;
  const planner = context.PlataPlanner;
  const state = kernel.freshState("bojning");

  const repeat = planner.drillDecision({
    trainerId: "bojning",
    state,
    sessionResults: [{ correct: true }, { correct: false }],
    rootPrefix: "../"
  });
  assert(repeat.kind === "repeat", "drill with mistakes should recommend repeat");
  assert(repeat.primaryHref === "#again-btn", "repeat decision should target another session");

  const clean = planner.drillDecision({
    trainerId: "bojning",
    state,
    sessionResults: [{ correct: true }, { correct: true }],
    rootPrefix: "../"
  });
  assert(clean.kind === "continue", "clean drill should continue the chain");
  assert(clean.primaryHref === "../ordstilling-drill/", "bojning chain should move to ordstilling");

  state.meta.dailyAttempts[new Date().toISOString().slice(0, 10)] = 20;
  const enough = planner.drillDecision({
    trainerId: "bojning",
    state,
    sessionResults: [{ correct: true }, { correct: true }],
    rootPrefix: "../"
  });
  assert(enough.kind === "enough", "daily threshold should recommend stopping");
  assert(enough.primaryHref === "../dashboard.html", "enough decision should send to dashboard");
}

function runDashboardDecisionSmoke(context) {
  const kernel = context.PlataKernel;
  const planner = context.PlataPlanner;
  const trainer = {
    id: "lesson-b2-radiator-register",
    name: "B2: Register & Particles",
    type: "lesson",
    path: "./lessons/lesson-b2-radiator/",
    description: "Complaints, tone, modal particles",
    icon: "⚖️"
  };
  const lesson = context.PLATA_LESSON_B2_RADIATOR;
  const state = seedWeakLesson(context);
  const weak = kernel.getWeakTags(state, 10).find(item => item.tag === "passive-agency");
  const spec = lesson.masteryMap["passive-agency"];
  const remediation = {
    cta: spec.remediation.cta,
    action: spec.remediation.action,
    href: planner.sceneHref(trainer.path, spec.remediation.sceneId, "passive-agency")
  };

  const repair = planner.dashboardDecision({
    trainer,
    state,
    stats: { total: 1, correct: 0, accuracy: 0, today: 1, lastSessionDate: state.meta.lastSessionDate },
    weakMastery: [{ ...weak, label: spec.label, evidence: spec.evidence, remediation }],
    weakTags: [weak],
    index: 4
  });

  assert(repair.kind === "repair", "dashboard should prioritize repair decisions");
  assert(repair.title.includes("Read passive agency"), "dashboard repair should use mastery label");
  assert(repair.primaryHref.includes("mode=repair"), "dashboard repair should link repair mode");
  assert(repair.competency.id === "agency", "dashboard repair exposes root competency");

  const mismatchedRoot = planner.dashboardDecision({
    trainer,
    state,
    stats: { total: 3, correct: 0, accuracy: 0, today: 3, lastSessionDate: state.meta.lastSessionDate },
    weakMastery: [
      { tag: "understatement-with-agency", label: "Use understatement with agency", evidence: "Agency signal", wrong: 1, correct: 0, total: 1, score: 1, competencyId: "agency", remediation },
      { tag: "modal-particle-stance", label: "Read particle stance", evidence: "Stance signal", wrong: 5, correct: 0, total: 5, score: 1, competencyId: "stance-reading", remediation: { ...remediation, href: "./lessons/lesson-b2-radiator/?mode=repair&signal=modal-particle-stance#group-chat-particles" } }
    ],
    weakTags: [weak],
    index: 4
  });
  assert(mismatchedRoot.signalTag === "understatement-with-agency", "dashboard repair keeps the selected repair signal");
  assert(mismatchedRoot.competency.id === "agency", "dashboard repair uses competency for the selected signal");

  const start = planner.dashboardDecision({
    trainer: { id: "bojning", name: "Bojning drill", type: "drill", path: "./bojning-drill/", description: "Forms" },
    state: kernel.freshState("bojning"),
    stats: { total: 0, correct: 0, accuracy: null, today: 0, lastSessionDate: "" },
    weakMastery: [],
    weakTags: [],
    index: 0
  });
  assert(start.kind === "start", "empty trainer should produce a start decision");

  const lessonStart = planner.dashboardDecision({
    trainer: { id: "lesson-01-arrival", name: "Lesson 01: First Morning", type: "lesson", path: "./lessons/lesson-01/", description: "Story onboarding" },
    state: kernel.freshState("lesson-01-arrival"),
    stats: { total: 0, correct: 0, accuracy: null, today: 0, lastSessionDate: "" },
    weakMastery: [],
    weakTags: [],
    index: 3
  });
  assert(lessonStart.score > start.score, "Lesson 01 should be the preferred empty-profile starter");

  const ranked = planner.rankDashboardDecisions([
    { trainer, decision: start, index: 0 },
    { trainer, decision: repair, index: 1 }
  ], 1);
  assert(ranked[0].decision.kind === "repair", "ranker should put higher score first");
}

function run() {
  const context = makeContext();
  runLessonDecisionSmoke(context);
  runDrillDecisionSmoke(context);
  runDashboardDecisionSmoke(context);
  console.log("ok - planner recommends lesson repair from weak mastery");
  console.log("ok - planner ranks drill repeat, continue, and enough decisions");
  console.log("ok - planner ranks dashboard decisions from the same contract");
}

run();

#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const sharedSources = [
  "shared/plata-kernel.js",
  "shared/plata-lesson-engine.js",
  "shared/plata-catalog.js"
];
const lessonSources = [
  "lessons/lesson-b2-radiator/data.js",
  "lessons/lesson-b2-job-followup/data.js"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
    Object,
    String,
    Array,
    Set,
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

function goldLessons(context) {
  return context.PlataCatalog.trainers
    .filter(trainer => trainer.lessonGlobal && context[trainer.lessonGlobal] && context[trainer.lessonGlobal].qualityTier === "gold")
    .map(trainer => clone(context[trainer.lessonGlobal]));
}

function goldLessonById(context, lessonId) {
  const lesson = goldLessons(context).find(candidate => candidate.id === lessonId);
  assert(lesson, `gold lesson not found: ${lessonId}`);
  return lesson;
}

function sceneById(lesson, sceneId) {
  const scene = (lesson.scenes || []).find(candidate => candidate.id === sceneId);
  assert(scene, `${lesson.id}: scene not found: ${sceneId}`);
  return scene;
}

function optionById(lesson, scene, optionId) {
  const option = (scene.options || []).find(candidate => candidate.id === optionId);
  assert(option, `${lesson.id}.${scene.id}: option not found: ${optionId}`);
  return option;
}

function correctLabel(scene) {
  const correct = (scene.options || []).find(option => option.correct);
  return correct ? correct.label : "";
}

function correctReasonLabel(option) {
  const correct = (option.reasonOptions || []).find(reason => reason.correct === true);
  return correct ? correct.label : "";
}

function applyEffects(variables, effects) {
  Object.entries(effects || {}).forEach(([key, value]) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) variables[key] += Number(value || 0);
  });
}

function checkCompletion(scene, value) {
  const lower = String(value || "").toLowerCase();
  if (scene.acceptKeywordGroups && scene.acceptKeywordGroups.length) {
    const missing = scene.acceptKeywordGroups
      .filter(group => !(group.keywords || []).some(keyword => lower.includes(keyword)))
      .map(group => group.name || "required signal");
    return { ok: missing.length === 0, missing };
  }
  if (scene.acceptKeywords && scene.acceptKeywords.length) {
    return { ok: scene.acceptKeywords.some(keyword => lower.includes(keyword)), missing: [] };
  }
  return { ok: lower.trim().length > 0, missing: [] };
}

function variableNameFromCondition(key) {
  const match = /^(min|max)([A-Z].*)$/.exec(key);
  if (!match) return null;
  return match[2].charAt(0).toLowerCase() + match[2].slice(1);
}

function endingRuleMatches(rule, variables) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) return false;
  return Object.entries(rule).every(([key, expected]) => {
    const variableName = variableNameFromCondition(key);
    if (!variableName || !Object.prototype.hasOwnProperty.call(variables, variableName)) return false;
    if (key.startsWith("min")) return variables[variableName] >= Number(expected);
    if (key.startsWith("max")) return variables[variableName] <= Number(expected);
    return false;
  });
}

function resolveEnding(lesson, variables) {
  if (!lesson.endingLogic) return null;
  const endingIds = lesson.endings && lesson.endings.length
    ? lesson.endings.map(ending => ending.id)
    : Object.keys(lesson.endingLogic);
  return endingIds.find(id => endingRuleMatches(lesson.endingLogic[id], variables)) || null;
}

function recordAttempt(context, state, scene, correct, given, expected) {
  const tags = context.PlataLessonEngine.getSceneAttemptTags(scene);
  context.PlataKernel.recordAttempt(state, {
    itemId: scene.id,
    correct,
    tags,
    mode: "lesson",
    expected,
    given
  });
}

function actionMapForPath(lesson, pathSpec) {
  const map = new Map();
  (pathSpec.actions || []).forEach(action => {
    assert(action && action.sceneId, `${lesson.id}.${pathSpec.id}: action missing sceneId`);
    assert(!map.has(action.sceneId), `${lesson.id}.${pathSpec.id}: duplicate action for ${action.sceneId}`);
    map.set(action.sceneId, action);
  });
  (lesson.scenes || []).forEach(scene => {
    assert(map.has(scene.id), `${lesson.id}.${pathSpec.id}: missing action for ${scene.id}`);
  });
  return map;
}

function simulateChoice(context, state, lesson, variables, scene, action) {
  const option = optionById(lesson, scene, action.optionId);
  applyEffects(variables, option.effects);
  recordAttempt(context, state, scene, !!option.correct, option.label, correctLabel(scene));
  return 1;
}

function simulateMatch(context, state, lesson, scene, action) {
  assert(action.matchAll === true, `${lesson.id}.${scene.id}: counterfactual match action requires matchAll`);
  (scene.pairs || []).forEach(pair => {
    recordAttempt(context, state, scene, true, `${pair.left} -> ${pair.right}`, `${pair.left} -> ${pair.right}`);
  });
  return (scene.pairs || []).length;
}

function simulateCompletion(context, state, lesson, variables, scene, action) {
  assert(typeof action.answer === "string", `${lesson.id}.${scene.id}: completion action requires answer`);
  const checked = checkCompletion(scene, action.answer);
  if (checked.ok) applyEffects(variables, scene.effects);
  recordAttempt(context, state, scene, checked.ok, `${scene.prefix || ""} ${action.answer}`.trim(), `${scene.prefix || ""} + action`.trim());
  return 1;
}

function simulateFlagshipChain(context, state, lesson, variables, scene, action) {
  assert(action.optionId, `${lesson.id}.${scene.id}: flagship-chain action requires optionId`);
  const option = optionById(lesson, scene, action.optionId);
  let ok = option.correct === true;
  let given = option.label;
  let expected = correctLabel(scene);
  if (option.correct === true && option.reasonOptions && option.reasonOptions.length) {
    assert(action.reasonId, `${lesson.id}.${scene.id}.${option.id}: correct flagship-chain action requires reasonId`);
    const reason = option.reasonOptions.find(candidate => candidate.id === action.reasonId);
    assert(reason, `${lesson.id}.${scene.id}.${option.id}: unknown reasonId ${action.reasonId}`);
    ok = reason.correct === true;
    given = `${option.label} / ${reason.label}`;
    expected = `${option.label} / ${correctReasonLabel(option)}`;
  }
  if (!option.correct || ok) applyEffects(variables, option.effects);
  recordAttempt(context, state, scene, ok, given, expected);
  return 1;
}

function weakMasteryTags(context, state, lesson) {
  const masteryKeys = Object.keys(lesson.masteryMap || {});
  return context.PlataKernel.getWeakTags(state, 50)
    .filter(weak => masteryKeys.includes(weak.tag))
    .map(weak => weak.tag)
    .sort();
}

function simulateLearnerProfile(context, lesson, pathSpec) {
  const state = context.PlataKernel.freshState(`${lesson.id}::counterfactual::${pathSpec.id}`);
  const variables = Object.assign({}, lesson.variables || {});
  const actionMap = actionMapForPath(lesson, pathSpec);
  let attempts = 0;

  (lesson.scenes || []).forEach(scene => {
    const action = actionMap.get(scene.id);
    if (scene.type === "choice") attempts += simulateChoice(context, state, lesson, variables, scene, action);
    else if (scene.type === "match") attempts += simulateMatch(context, state, lesson, scene, action);
    else if (scene.type === "completion") attempts += simulateCompletion(context, state, lesson, variables, scene, action);
    else if (scene.type === "flagship-chain") attempts += simulateFlagshipChain(context, state, lesson, variables, scene, action);
    else throw new Error(`${lesson.id}.${scene.id}: unsupported scene type ${scene.type}`);
  });

  const weakMastery = weakMasteryTags(context, state, lesson);
  const wrong = attempts - state.meta.totalCorrect;
  return {
    lessonId: lesson.id,
    profileId: pathSpec.id,
    attempts,
    correct: state.meta.totalCorrect,
    wrong,
    accuracyPct: attempts ? Math.round(state.meta.totalCorrect / attempts * 100) : null,
    endingId: resolveEnding(lesson, variables),
    variables,
    weakMastery,
    weakMasteryCount: weakMastery.length,
    repairLoad: wrong + weakMastery.length
  };
}

function summarizeProfiles(profiles) {
  const weakSignals = new Set();
  profiles.forEach(profile => profile.weakMastery.forEach(tag => weakSignals.add(tag)));
  return {
    profiles: profiles.length,
    attempts: profiles.reduce((sum, profile) => sum + profile.attempts, 0),
    correct: profiles.reduce((sum, profile) => sum + profile.correct, 0),
    wrong: profiles.reduce((sum, profile) => sum + profile.wrong, 0),
    repairLoad: profiles.reduce((sum, profile) => sum + profile.repairLoad, 0),
    weakSignals: Array.from(weakSignals).sort()
  };
}

function simulateLesson(context, lesson) {
  assert(lesson.qualityTier === "gold", `${lesson.id}: counterfactual simulator only accepts gold lessons`);
  assert(lesson.simulation && Array.isArray(lesson.simulation.paths), `${lesson.id}: missing simulation paths`);
  const profiles = lesson.simulation.paths.map(pathSpec => simulateLearnerProfile(context, lesson, pathSpec));
  return {
    lessonId: lesson.id,
    profiles,
    summary: summarizeProfiles(profiles)
  };
}

function setDelta(baseValues, headValues) {
  const base = new Set(baseValues || []);
  const head = new Set(headValues || []);
  return {
    added: Array.from(head).filter(value => !base.has(value)).sort(),
    removed: Array.from(base).filter(value => !head.has(value)).sort()
  };
}

function profileMap(report) {
  const map = {};
  report.profiles.forEach(profile => {
    map[profile.profileId] = profile;
  });
  return map;
}

function compareLessonReports(base, head) {
  assert(base.lessonId === head.lessonId, "cannot compare different lessons");
  const baseMap = profileMap(base);
  const headMap = profileMap(head);
  const profiles = Object.keys(baseMap).sort().map(profileId => {
    const before = baseMap[profileId];
    const after = headMap[profileId];
    assert(after, `${head.lessonId}: missing profile in head report: ${profileId}`);
    const weak = setDelta(before.weakMastery, after.weakMastery);
    return {
      profileId,
      correctDelta: after.correct - before.correct,
      wrongDelta: after.wrong - before.wrong,
      repairLoadDelta: after.repairLoad - before.repairLoad,
      weakSignalsAdded: weak.added,
      weakSignalsRemoved: weak.removed,
      endingBefore: before.endingId,
      endingAfter: after.endingId,
      endingChanged: before.endingId !== after.endingId
    };
  });
  return {
    lessonId: base.lessonId,
    summary: {
      correctDelta: head.summary.correct - base.summary.correct,
      wrongDelta: head.summary.wrong - base.summary.wrong,
      repairLoadDelta: head.summary.repairLoad - base.summary.repairLoad
    },
    profiles
  };
}

function assertBaselineMatchesDeclared(context) {
  goldLessons(context).forEach(lesson => {
    const report = simulateLesson(context, lesson);
    const profiles = profileMap(report);
    (lesson.simulation.paths || []).forEach(pathSpec => {
      const profile = profiles[pathSpec.id];
      assert(profile, `${lesson.id}.${pathSpec.id}: missing simulated profile`);
      assert(profile.endingId === pathSpec.expectedEndingId, `${lesson.id}.${pathSpec.id}: expected ending ${pathSpec.expectedEndingId}, got ${profile.endingId}`);
      if (typeof pathSpec.expectedCorrect === "number") {
        assert(profile.correct === pathSpec.expectedCorrect, `${lesson.id}.${pathSpec.id}: expected ${pathSpec.expectedCorrect} correct, got ${profile.correct}`);
      }
      const expectedWeak = (pathSpec.expectedWeakMastery || []).slice().sort().join(",");
      const actualWeak = profile.weakMastery.join(",");
      assert(actualWeak === expectedWeak, `${lesson.id}.${pathSpec.id}: expected weak mastery [${expectedWeak}], got [${actualWeak}]`);
    });
  });
  console.log("ok - counterfactual baseline matches declared gold learner profiles");
}

function lessonVariant(context, lessonId, mutate) {
  const lesson = goldLessonById(context, lessonId);
  mutate(lesson);
  return lesson;
}

function assertProfileDelta(diff, profileId, predicate, message) {
  const profile = diff.profiles.find(item => item.profileId === profileId);
  assert(profile, `${diff.lessonId}: missing profile diff ${profileId}`);
  assert(predicate(profile), `${message}\n${JSON.stringify(profile, null, 2)}`);
}

function runCounterfactualSmoke(context) {
  const lessonId = "lesson-b2-radiator-register";
  const baseline = simulateLesson(context, goldLessonById(context, lessonId));

  const strictRegression = simulateLesson(context, lessonVariant(context, lessonId, lesson => {
    optionById(lesson, sceneById(lesson, "official-reply-passive"), "accurate").correct = false;
  }));
  const strictDiff = compareLessonReports(baseline, strictRegression);
  assertProfileDelta(strictDiff, "diplomatic", profile =>
    profile.repairLoadDelta > 0 && profile.weakSignalsAdded.includes("passive-agency"),
  "strict counterfactual should expose new repair pressure on the successful profile");

  const maskedRepair = simulateLesson(context, lessonVariant(context, lessonId, lesson => {
    optionById(lesson, sceneById(lesson, "official-reply-passive"), "too-trusting").correct = true;
    optionById(lesson, sceneById(lesson, "channel-transfer-lab"), "email-soft-near-miss").correct = true;
  }));
  const maskedDiff = compareLessonReports(baseline, maskedRepair);
  assertProfileDelta(maskedDiff, "passive", profile =>
    profile.repairLoadDelta < 0 && profile.weakSignalsRemoved.includes("passive-agency"),
  "lenient counterfactual should expose masked repair pressure on the passive profile");

  const endingDrift = simulateLesson(context, lessonVariant(context, lessonId, lesson => {
    optionById(lesson, sceneById(lesson, "two-registers"), "formal-aggressive").effects.landlordTension = -3;
  }));
  const endingDiff = compareLessonReports(baseline, endingDrift);
  assertProfileDelta(endingDiff, "aggressive", profile =>
    profile.endingChanged && profile.endingBefore === "aggressive" && profile.endingAfter === "diplomatic",
  "social-variable counterfactual should expose ending drift");

  console.log("ok - counterfactual simulator detects stricter-answer regressions");
  console.log("ok - counterfactual simulator detects masked repair pressure");
  console.log("ok - counterfactual simulator detects social ending drift");
}

function run() {
  const context = makeContext();
  assertBaselineMatchesDeclared(context);
  runCounterfactualSmoke(context);
  console.log("ok - counterfactual learner simulator compares lesson edits");
}

if (require.main === module) run();

module.exports = {
  simulateLesson,
  compareLessonReports
};

#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadContext() {
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

  for (const relPath of ["shared/plata-kernel.js", "shared/plata-lesson-engine.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, relPath), "utf8"), context, { filename: relPath });
  }
  return context;
}

function loadLesson(context, relPath) {
  const before = new Set(Object.keys(context).filter(k => k.startsWith("PLATA_LESSON_")));
  vm.runInContext(fs.readFileSync(path.join(root, relPath), "utf8"), context, { filename: relPath });
  const key = Object.keys(context).find(k => k.startsWith("PLATA_LESSON_") && !before.has(k));
  return key ? context[key] : null;
}

function findLessonDataFiles() {
  const lessonsRoot = path.join(root, "lessons");
  return fs.readdirSync(lessonsRoot)
    .filter(dir => fs.statSync(path.join(lessonsRoot, dir)).isDirectory())
    .map(dir => path.join("lessons", dir, "data.js"))
    .filter(relPath => fs.existsSync(path.join(root, relPath)));
}

function correctLabel(options) {
  const correct = options.find(option => option.correct === true);
  return correct ? correct.label : "";
}

function applyEffects(variables, effects) {
  if (!effects) return;
  Object.keys(effects).forEach(key => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) variables[key] += effects[key];
  });
}

function checkCompletion(scene, value) {
  const lower = String(value || "").toLowerCase();
  if (scene.acceptKeywordGroups && scene.acceptKeywordGroups.length) {
    const missing = [];
    scene.acceptKeywordGroups.forEach(group => {
      const keywords = group.keywords || [];
      const matched = keywords.some(keyword => lower.includes(keyword));
      if (!matched) missing.push(group.name || "required signal");
    });
    return { ok: missing.length === 0, missing };
  }
  if (scene.acceptKeywords && scene.acceptKeywords.length) {
    return { ok: scene.acceptKeywords.some(keyword => lower.includes(keyword)), missing: [] };
  }
  return { ok: lower.trim().length > 0, missing: [] };
}

function resolveEnding(lesson, variables) {
  if (!lesson.endingLogic) return null;
  const logic = lesson.endingLogic;
  const v = variables;
  if (logic.diplomatic && v.landlordTension <= (logic.diplomatic.maxLandlordTension || 0) && v.workplaceTrust >= (logic.diplomatic.minWorkplaceTrust || 1)) return "diplomatic";
  if (logic.aggressive && v.landlordTension >= (logic.aggressive.minLandlordTension || 2)) return "aggressive";
  if (logic.passive) return "passive";
  return null;
}

function recordSceneAttempt(context, state, lesson, scene, correct, given, expected) {
  const tags = context.PlataLessonEngine.getSceneAttemptTags(scene);
  scene.masteryTags.forEach(tag => {
    assert(tags.includes(tag), `${lesson.id}::${scene.id}: missing recorded mastery tag ${tag}`);
  });
  context.PlataKernel.recordAttempt(state, {
    itemId: scene.id,
    correct,
    tags,
    mode: "lesson",
    expected,
    given
  });
}

function simulateGoldLesson(context, lesson) {
  assert(lesson.qualityTier === "gold", `${lesson.id}: simulator only accepts gold lessons`);
  assert(lesson.masteryMap && typeof lesson.masteryMap === "object", `${lesson.id}: missing masteryMap`);
  assert(lesson.simulation && lesson.simulation.expectedEndingId, `${lesson.id}: missing simulation.expectedEndingId`);

  const kernel = context.PlataKernel;
  const state = kernel.freshState(lesson.id);
  const variables = Object.assign({}, lesson.variables || {});
  let expectedAttempts = 0;

  lesson.scenes.forEach(scene => {
    assert(Array.isArray(scene.masteryTags) && scene.masteryTags.length > 0, `${lesson.id}::${scene.id}: missing masteryTags`);

    if (scene.type === "choice") {
      scene.options.forEach(option => {
        assert(/^Diagnostic:/.test(option.feedback), `${lesson.id}::${scene.id}.${option.id}: choice feedback should be diagnostic`);
      });
      const correct = scene.options.find(option => option.correct === true);
      assert(correct, `${lesson.id}::${scene.id}: no correct option`);
      applyEffects(variables, correct.effects);
      recordSceneAttempt(context, state, lesson, scene, true, correct.label, correctLabel(scene.options));
      expectedAttempts += 1;
      return;
    }

    if (scene.type === "match") {
      scene.pairs.forEach(pair => {
        assert(pair.feedback && pair.feedback.length > 0, `${lesson.id}::${scene.id}.${pair.id}: missing pair feedback`);
        recordSceneAttempt(context, state, lesson, scene, true, `${pair.left} -> ${pair.right}`, `${pair.left} -> ${pair.right}`);
        expectedAttempts += 1;
      });
      return;
    }

    if (scene.type === "completion") {
      const answerSpec = lesson.simulation.completionAnswers && lesson.simulation.completionAnswers[scene.id];
      assert(answerSpec, `${lesson.id}::${scene.id}: missing simulation.completionAnswers entry`);
      (answerSpec.reject || []).forEach(answer => {
        const checked = checkCompletion(scene, answer);
        assert(!checked.ok, `${lesson.id}::${scene.id}: weak answer should fail: ${answer}`);
      });
      const accepted = checkCompletion(scene, answerSpec.accept);
      assert(accepted.ok, `${lesson.id}::${scene.id}: full answer should pass`);
      applyEffects(variables, scene.effects);
      recordSceneAttempt(context, state, lesson, scene, true, `${scene.prefix} ${answerSpec.accept}`, `${scene.prefix} + action`);
      expectedAttempts += 1;
      return;
    }

    throw new Error(`${lesson.id}::${scene.id}: unsupported simulator type ${scene.type}`);
  });

  const endingId = resolveEnding(lesson, variables);
  assert(endingId === lesson.simulation.expectedEndingId, `${lesson.id}: expected ending ${lesson.simulation.expectedEndingId}, got ${endingId}`);
  kernel.recordSocialSnapshot(state, variables);

  const masteredSignals = new Set();
  const masteryKeys = Object.keys(lesson.masteryMap);
  state.attempts.forEach(attempt => {
    attempt.tags.forEach(tag => {
      if (masteryKeys.includes(tag)) masteredSignals.add(tag);
    });
  });
  masteryKeys.forEach(tag => {
    assert(masteredSignals.has(tag), `${lesson.id}: mastery tag not exercised by simulation: ${tag}`);
  });

  assert(state.meta.totalAttempts === expectedAttempts, `${lesson.id}: expected ${expectedAttempts} attempts, got ${state.meta.totalAttempts}`);
  assert(state.meta.totalCorrect === expectedAttempts, `${lesson.id}: correct path should have all attempts correct`);
  assert((state.meta.socialSnapshots || []).length === 1, `${lesson.id}: expected one social snapshot`);

  return {
    lessonId: lesson.id,
    attempts: expectedAttempts,
    masterySignals: masteredSignals.size,
    endingId
  };
}

function run() {
  const context = loadContext();
  const mergedTags = context.PlataLessonEngine.getSceneAttemptTags({ tags: ["B2", "register"], masteryTags: ["register", "formal-register-control"] });
  assert(mergedTags.join(",") === "B2,register,formal-register-control", "lesson engine should merge and dedupe mastery tags");

  const lessons = findLessonDataFiles()
    .map(relPath => loadLesson(context, relPath))
    .filter(Boolean)
    .filter(lesson => lesson.qualityTier === "gold");

  assert(lessons.length > 0, "no gold lessons found");
  const results = lessons.map(lesson => simulateGoldLesson(context, lesson));
  const attempts = results.reduce((sum, result) => sum + result.attempts, 0);
  const signals = results.reduce((sum, result) => sum + result.masterySignals, 0);
  console.log(`Gold lesson simulation passed: ${results.length} lesson(s), ${attempts} attempt(s), ${signals} mastery signal(s)`);
}

run();

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

function variableNameFromCondition(key) {
  const match = /^(min|max)([A-Z].*)$/.exec(key);
  if (!match) return null;
  return match[2].charAt(0).toLowerCase() + match[2].slice(1);
}

function endingRuleMatches(rule, variables) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) return false;
  return Object.entries(rule).every(([key, expected]) => {
    const variableName = variableNameFromCondition(key);
    if (!variableName || !Object.prototype.hasOwnProperty.call(variables, variableName) || typeof expected !== "number") return false;
    if (key.startsWith("min")) return variables[variableName] >= expected;
    if (key.startsWith("max")) return variables[variableName] <= expected;
    return false;
  });
}

function resolveEnding(lesson, variables) {
  if (!lesson.endingLogic) return null;
  const logic = lesson.endingLogic;
  const endingIds = lesson.endings && lesson.endings.length
    ? lesson.endings.map(ending => ending.id)
    : Object.keys(logic);
  const matched = endingIds.find(id => Object.prototype.hasOwnProperty.call(logic, id) && endingRuleMatches(logic[id], variables));
  if (matched) return matched;
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

function getActionMap(lesson, pathSpec) {
  assert(Array.isArray(pathSpec.actions), `${lesson.id}::path[${pathSpec.id}]: missing actions array`);
  const actionMap = new Map();
  pathSpec.actions.forEach((action, index) => {
    assert(action && action.sceneId, `${lesson.id}::path[${pathSpec.id}].actions[${index}]: missing sceneId`);
    assert(!actionMap.has(action.sceneId), `${lesson.id}::path[${pathSpec.id}]: duplicate action for ${action.sceneId}`);
    actionMap.set(action.sceneId, action);
  });
  lesson.scenes.forEach(scene => {
    assert(actionMap.has(scene.id), `${lesson.id}::path[${pathSpec.id}]: missing action for ${scene.id}`);
  });
  return actionMap;
}

function assertExpectedVariables(lesson, pathSpec, variables) {
  const expected = pathSpec.expectedVariables || {};
  Object.keys(expected).forEach(key => {
    assert(variables[key] === expected[key], `${lesson.id}::path[${pathSpec.id}]: expected ${key}=${expected[key]}, got ${variables[key]}`);
  });
}

function getWeakMasteryTags(context, state, lesson) {
  const masteryKeys = Object.keys(lesson.masteryMap);
  return context.PlataKernel.getWeakTags(state, 50)
    .filter(weak => masteryKeys.includes(weak.tag))
    .map(weak => weak.tag)
    .sort();
}

function assertExpectedWeakMastery(context, state, lesson, pathSpec) {
  const expected = (pathSpec.expectedWeakMastery || []).slice().sort();
  const actual = getWeakMasteryTags(context, state, lesson);
  assert(actual.join(",") === expected.join(","), `${lesson.id}::path[${pathSpec.id}]: expected weak mastery [${expected.join(", ")}], got [${actual.join(", ")}]`);
}

function simulateChoiceAction(context, state, lesson, variables, scene, action) {
  assert(action.optionId, `${lesson.id}::${scene.id}: choice action requires optionId`);
  const option = scene.options.find(candidate => candidate.id === action.optionId);
  assert(option, `${lesson.id}::${scene.id}: unknown optionId ${action.optionId}`);
  if (typeof action.expectCorrect === "boolean") {
    assert(option.correct === action.expectCorrect, `${lesson.id}::${scene.id}.${option.id}: expected correctness ${action.expectCorrect}, got ${option.correct}`);
  }
  applyEffects(variables, option.effects);
  recordSceneAttempt(context, state, lesson, scene, !!option.correct, option.label, correctLabel(scene.options));
  return 1;
}

function simulateMatchAction(context, state, lesson, scene, action) {
  assert(action.matchAll === true, `${lesson.id}::${scene.id}: match action currently requires matchAll: true`);
  scene.pairs.forEach(pair => {
    assert(pair.feedback && pair.feedback.length > 0, `${lesson.id}::${scene.id}.${pair.id}: missing pair feedback`);
    recordSceneAttempt(context, state, lesson, scene, true, `${pair.left} -> ${pair.right}`, `${pair.left} -> ${pair.right}`);
  });
  return scene.pairs.length;
}

function simulateCompletionAction(context, state, lesson, variables, scene, action) {
  assert(typeof action.answer === "string", `${lesson.id}::${scene.id}: completion action requires answer`);
  assert(typeof action.expectCorrect === "boolean", `${lesson.id}::${scene.id}: completion action requires expectCorrect`);
  const checked = checkCompletion(scene, action.answer);
  assert(checked.ok === action.expectCorrect, `${lesson.id}::${scene.id}: answer "${action.answer}" expected ${action.expectCorrect ? "pass" : "fail"}`);
  if (checked.ok) applyEffects(variables, scene.effects);
  recordSceneAttempt(context, state, lesson, scene, checked.ok, `${scene.prefix} ${action.answer}`, `${scene.prefix} + action`);
  return 1;
}

function simulatePath(context, lesson, pathSpec) {
  assert(pathSpec && pathSpec.id, `${lesson.id}: simulation path missing id`);
  assert(pathSpec.expectedEndingId, `${lesson.id}::path[${pathSpec.id}]: missing expectedEndingId`);

  const kernel = context.PlataKernel;
  const state = kernel.freshState(`${lesson.id}::${pathSpec.id}`);
  const variables = Object.assign({}, lesson.variables || {});
  const actionMap = getActionMap(lesson, pathSpec);
  let expectedAttempts = 0;

  lesson.scenes.forEach(scene => {
    assert(Array.isArray(scene.masteryTags) && scene.masteryTags.length > 0, `${lesson.id}::${scene.id}: missing masteryTags`);
    const action = actionMap.get(scene.id);

    if (scene.type === "choice") {
      scene.options.forEach(option => {
        assert(/^Diagnostic:/.test(option.feedback), `${lesson.id}::${scene.id}.${option.id}: choice feedback should be diagnostic`);
      });
      expectedAttempts += simulateChoiceAction(context, state, lesson, variables, scene, action);
      return;
    }

    if (scene.type === "match") {
      expectedAttempts += simulateMatchAction(context, state, lesson, scene, action);
      return;
    }

    if (scene.type === "completion") {
      expectedAttempts += simulateCompletionAction(context, state, lesson, variables, scene, action);
      return;
    }

    throw new Error(`${lesson.id}::${scene.id}: unsupported simulator type ${scene.type}`);
  });

  const endingId = resolveEnding(lesson, variables);
  assert(endingId === pathSpec.expectedEndingId, `${lesson.id}::path[${pathSpec.id}]: expected ending ${pathSpec.expectedEndingId}, got ${endingId}`);
  assertExpectedVariables(lesson, pathSpec, variables);
  kernel.recordSocialSnapshot(state, variables);

  assert(state.meta.totalAttempts === expectedAttempts, `${lesson.id}::path[${pathSpec.id}]: expected ${expectedAttempts} attempts, got ${state.meta.totalAttempts}`);
  if (typeof pathSpec.expectedCorrect === "number") {
    assert(state.meta.totalCorrect === pathSpec.expectedCorrect, `${lesson.id}::path[${pathSpec.id}]: expected ${pathSpec.expectedCorrect} correct attempts, got ${state.meta.totalCorrect}`);
  }
  assert((state.meta.socialSnapshots || []).length === 1, `${lesson.id}::path[${pathSpec.id}]: expected one social snapshot`);
  assertExpectedWeakMastery(context, state, lesson, pathSpec);

  return {
    pathId: pathSpec.id,
    attempts: expectedAttempts,
    correct: state.meta.totalCorrect,
    endingId,
    weakMastery: getWeakMasteryTags(context, state, lesson)
  };
}

function validateCompletionAnswerSpecs(lesson) {
  lesson.scenes.filter(scene => scene.type === "completion").forEach(scene => {
    const answerSpec = lesson.simulation.completionAnswers && lesson.simulation.completionAnswers[scene.id];
    assert(answerSpec, `${lesson.id}::${scene.id}: missing simulation.completionAnswers entry`);
    (answerSpec.reject || []).forEach(answer => {
      const checked = checkCompletion(scene, answer);
      assert(!checked.ok, `${lesson.id}::${scene.id}: weak answer should fail: ${answer}`);
    });
    const accepted = checkCompletion(scene, answerSpec.accept);
    assert(accepted.ok, `${lesson.id}::${scene.id}: full answer should pass`);
  });
}

function validateRepairContexts(context, lesson) {
  Object.entries(lesson.masteryMap).forEach(([tag, spec]) => {
    const remediation = spec.remediation || {};
    assert(remediation.sceneId, `${lesson.id}.masteryMap[${tag}]: missing remediation scene`);
    context.location = {
      pathname: `/lessons/${lesson.id}/`,
      search: `?mode=repair&signal=${encodeURIComponent(tag)}`,
      hash: `#${encodeURIComponent(remediation.sceneId)}`
    };
    const repair = context.PlataLessonEngine.getRepairContext(lesson);
    assert(repair && repair.active, `${lesson.id}.masteryMap[${tag}]: repair context did not resolve`);
    assert(repair.tag === tag, `${lesson.id}.masteryMap[${tag}]: expected repair tag ${tag}, got ${repair && repair.tag}`);
    assert(repair.sceneId === remediation.sceneId, `${lesson.id}.masteryMap[${tag}]: expected repair scene ${remediation.sceneId}, got ${repair && repair.sceneId}`);
  });
}

function simulateGoldLesson(context, lesson) {
  assert(lesson.qualityTier === "gold", `${lesson.id}: simulator only accepts gold lessons`);
  assert(lesson.masteryMap && typeof lesson.masteryMap === "object", `${lesson.id}: missing masteryMap`);
  assert(lesson.simulation && Array.isArray(lesson.simulation.paths) && lesson.simulation.paths.length > 0, `${lesson.id}: missing simulation.paths`);

  validateCompletionAnswerSpecs(lesson);
  validateRepairContexts(context, lesson);

  const pathResults = lesson.simulation.paths.map(pathSpec => simulatePath(context, lesson, pathSpec));
  const exercisedSignals = new Set();
  const masteryKeys = Object.keys(lesson.masteryMap);
  pathResults.forEach(pathResult => {
    pathResult.weakMastery.forEach(tag => exercisedSignals.add(tag));
  });
  masteryKeys.forEach(tag => {
    const inAnyScene = lesson.scenes.some(scene => (scene.masteryTags || []).includes(tag));
    assert(inAnyScene, `${lesson.id}: mastery tag not attached to any scene: ${tag}`);
  });

  const endings = new Set(pathResults.map(result => result.endingId));
  (lesson.endings || []).forEach(ending => {
    assert(endings.has(ending.id), `${lesson.id}: ending not covered by simulation paths: ${ending.id}`);
  });

  return {
    lessonId: lesson.id,
    paths: pathResults.length,
    attempts: pathResults.reduce((sum, result) => sum + result.attempts, 0),
    weakMasterySignals: exercisedSignals.size,
    endings: endings.size
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
  const paths = results.reduce((sum, result) => sum + result.paths, 0);
  const endings = results.reduce((sum, result) => sum + result.endings, 0);
  console.log(`Gold lesson simulation passed: ${results.length} lesson(s), ${paths} path(s), ${attempts} attempt(s), ${endings} ending(s) covered`);
}

run();

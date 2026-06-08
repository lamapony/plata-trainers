#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");

const EDITORIAL_PHRASE_RULES = [
  {
    id: "interesse-common-gender",
    pattern: /\bmit\s+(?:[a-zæøå]+\s+){0,3}interesse\b/i,
    message: "`interesse` is common gender; use `min ... interesse` unless the error is explicitly being taught."
  },
  {
    id: "foregik-person",
    pattern: /\bdu foregik korrekt\b/i,
    message: "`foregik` describes an event taking place, not a person proceeding correctly."
  },
  {
    id: "vender-retur",
    pattern: /\bvender retur\b/i,
    message: "Prefer `vender tilbage` in learner-facing professional Danish."
  },
  {
    id: "trykke-for-meget",
    pattern: /\btrykkede for meget\b/i,
    message: "Use `pressede for meget` for social pressure in this context."
  },
  {
    id: "vaere-saa-god",
    pattern: /\bhvis De vil være så god\b/i,
    message: "Use `hvis De vil være så venlig` for the over-formal politeness distractor."
  },
  {
    id: "besked-paa-at",
    pattern: /\bder gives besked på, at\b/i,
    message: "Use `der gives besked om, at`; the passive can stay evasive without becoming ungrammatical."
  }
];

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function resolveInputPath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(repoRoot, inputPath);
}

function relInputPath(inputPath) {
  return path.relative(repoRoot, resolveInputPath(inputPath)).replaceAll(path.sep, "/");
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function findLessonDataFiles() {
  const lessonsRoot = path.join(repoRoot, "lessons");
  return fs.readdirSync(lessonsRoot)
    .filter(dir => fs.statSync(path.join(lessonsRoot, dir)).isDirectory())
    .map(dir => path.join("lessons", dir, "data.js"))
    .filter(relPath => fs.existsSync(path.join(repoRoot, relPath)));
}

function selectedLessonFiles() {
  const file = argValue("--file");
  if (!file) return findLessonDataFiles();
  const fullPath = resolveInputPath(file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Lesson file not found: ${file}`);
  }
  return [relInputPath(file)];
}

function loadLesson(relPath) {
  const source = fs.readFileSync(resolveInputPath(relPath), "utf8");
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: relPath });
  const key = Object.keys(context.window).find(candidate => candidate.startsWith("PLATA_LESSON_"));
  return key ? context.window[key] : null;
}

function checkCompletion(scene, value) {
  const lower = String(value || "").toLowerCase();
  if (scene.acceptKeywordGroups && scene.acceptKeywordGroups.length) {
    const missing = [];
    scene.acceptKeywordGroups.forEach(group => {
      const keywords = group.keywords || [];
      const matched = keywords.some(keyword => lower.includes(String(keyword || "").toLowerCase()));
      if (!matched) missing.push(group.name || "required signal");
    });
    return { ok: missing.length === 0, missing };
  }
  if (scene.acceptKeywords && scene.acceptKeywords.length) {
    return {
      ok: scene.acceptKeywords.some(keyword => lower.includes(String(keyword || "").toLowerCase())),
      missing: []
    };
  }
  return { ok: String(value || "").trim().length > 0, missing: [] };
}

function addIssue(issues, lesson, location, message) {
  const lessonId = lesson && lesson.id ? lesson.id : "unknown-lesson";
  issues.push(`${lessonId}${location ? "::" + location : ""}: ${message}`);
}

function scanStrings(value, visitor, location) {
  if (typeof value === "string") {
    visitor(value, location);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanStrings(item, visitor, `${location}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    Object.keys(value).forEach(key => scanStrings(value[key], visitor, location ? `${location}.${key}` : key));
  }
}

function auditEditorialPhrases(lesson, issues) {
  scanStrings(lesson, (text, location) => {
    EDITORIAL_PHRASE_RULES.forEach(rule => {
      if (rule.pattern.test(text)) {
        addIssue(issues, lesson, location, `${rule.id}: ${rule.message}`);
      }
    });
  }, "");
}

function auditChoiceScene(lesson, scene, location, issues) {
  const options = asArray(scene.options);
  const labelMap = new Map();
  const idMap = new Map();
  options.forEach((option, index) => {
    const optionLocation = `${location}.options[${index}]`;
    const label = normalizeText(option && option.label);
    const id = normalizeText(option && option.id);
    if (label) {
      if (labelMap.has(label)) {
        addIssue(issues, lesson, optionLocation, `duplicate option label also used at ${labelMap.get(label)}`);
      } else {
        labelMap.set(label, optionLocation);
      }
    }
    if (id) {
      if (idMap.has(id)) {
        addIssue(issues, lesson, optionLocation, `duplicate option id also used at ${idMap.get(id)}`);
      } else {
        idMap.set(id, optionLocation);
      }
    }
  });
}

function auditMatchScene(lesson, scene, location, issues) {
  const leftMap = new Map();
  const rightMap = new Map();
  asArray(scene.pairs).forEach((pair, index) => {
    const pairLocation = `${location}.pairs[${index}]`;
    const left = normalizeText(pair && pair.left);
    const right = normalizeText(pair && pair.right);
    if (left) {
      if (leftMap.has(left)) addIssue(issues, lesson, pairLocation, `duplicate match left text also used at ${leftMap.get(left)}`);
      else leftMap.set(left, pairLocation);
    }
    if (right) {
      if (rightMap.has(right)) addIssue(issues, lesson, pairLocation, `duplicate match right text also used at ${rightMap.get(right)}`);
      else rightMap.set(right, pairLocation);
    }
  });
}

function auditCompletionScene(lesson, scene, location, issues) {
  const hasKeywordGate = asArray(scene.acceptKeywords).length > 0 || asArray(scene.acceptKeywordGroups).length > 0;
  const learnerText = [
    scene.prompt,
    scene.placeholder,
    scene.success,
    scene.failure,
    scene.carry
  ].join(" ");

  if (hasKeywordGate && /\bany name works\b/i.test(learnerText)) {
    addIssue(issues, lesson, location, "`Any name works` conflicts with keyword-gated completion validation.");
  }

  if (/\byour name\b/i.test(learnerText) && hasKeywordGate && !checkCompletion(scene, "Lene").ok) {
    addIssue(issues, lesson, location, "name completion rejects `Lene`, even though the learner-facing text asks for a name.");
  }

  const keywordGroups = asArray(scene.acceptKeywordGroups);
  const keywordOwners = new Map();
  keywordGroups.forEach((group, groupIndex) => {
    asArray(group && group.keywords).forEach((keyword, keywordIndex) => {
      const normalized = normalizeText(keyword);
      if (!normalized) return;
      const keywordLocation = `${location}.acceptKeywordGroups[${groupIndex}].keywords[${keywordIndex}]`;
      if (keywordOwners.has(normalized)) {
        addIssue(issues, lesson, keywordLocation, `keyword also appears at ${keywordOwners.get(normalized)}`);
      } else {
        keywordOwners.set(normalized, keywordLocation);
      }
    });
  });
}

function auditSimulationCompletionAnswers(lesson, scene, location, issues) {
  const answerSpec = lesson.simulation
    && lesson.simulation.completionAnswers
    && lesson.simulation.completionAnswers[scene.id];
  if (!answerSpec) return;

  if (nonEmptyString(answerSpec.accept) && !checkCompletion(scene, answerSpec.accept).ok) {
    addIssue(issues, lesson, `${location}.simulation.accept`, `simulation accept answer fails completion validation: ${JSON.stringify(answerSpec.accept)}`);
  }
  asArray(answerSpec.reject).forEach((answer, index) => {
    if (checkCompletion(scene, answer).ok) {
      addIssue(issues, lesson, `${location}.simulation.reject[${index}]`, `simulation reject answer passes completion validation: ${JSON.stringify(answer)}`);
    }
  });
}

function auditLesson(lesson) {
  const issues = [];
  if (!lesson || !Array.isArray(lesson.scenes)) {
    addIssue(issues, lesson, "", "missing lesson or scenes array");
    return issues;
  }

  auditEditorialPhrases(lesson, issues);

  lesson.scenes.forEach((scene, index) => {
    const location = `scene[${index}](${scene && scene.id || "no-id"})`;
    if (!scene || typeof scene !== "object") return;
    if (scene.type === "choice") auditChoiceScene(lesson, scene, location, issues);
    if (scene.type === "match") auditMatchScene(lesson, scene, location, issues);
    if (scene.type === "completion") {
      auditCompletionScene(lesson, scene, location, issues);
      auditSimulationCompletionAnswers(lesson, scene, location, issues);
    }
  });

  return issues;
}

function run() {
  const files = selectedLessonFiles();
  const issues = [];
  let lessonCount = 0;
  let sceneCount = 0;

  files.forEach(relPath => {
    const lesson = loadLesson(relPath);
    if (lesson) {
      lessonCount += 1;
      sceneCount += asArray(lesson.scenes).length;
    }
    const lessonIssues = auditLesson(lesson);
    lessonIssues.forEach(issue => issues.push(`${relPath}: ${issue}`));
  });

  if (issues.length) {
    console.error(`Lesson exercise audit failed: ${issues.length} issue(s)`);
    issues.forEach(issue => console.error("- " + issue));
    process.exit(1);
  }

  console.log(`Lesson exercise audit passed: ${lessonCount} lesson(s), ${sceneCount} scene(s) checked`);
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(error && error.message ? error.message : String(error));
    process.exit(1);
  }
}

module.exports = {
  auditLesson,
  checkCompletion,
  EDITORIAL_PHRASE_RULES
};

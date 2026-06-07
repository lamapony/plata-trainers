#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const issues = [];
const warnings = [];

function issue(message) { issues.push(message); }
function warn(message) { warnings.push(message); }

function loadLesson(relPath) {
  const source = fs.readFileSync(resolveInputPath(relPath), "utf8");
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: relPath });
  // Find the lesson object (PLATA_LESSON_*)
  const keys = Object.keys(context.window).filter(k => k.startsWith("PLATA_LESSON_"));
  if (keys.length === 0) return null;
  return context.window[keys[0]];
}

function loadCompetencyIds() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, "shared", "plata-competencies.js"), "utf8"), context, { filename: "shared/plata-competencies.js" });
  const graph = context.window.PlataCompetencies;
  if (!graph || typeof graph.definitions !== "function") return new Set();
  return new Set(graph.definitions().map(def => def.id));
}

function resolveInputPath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(root, inputPath);
}

function relInputPath(inputPath) {
  return path.relative(root, resolveInputPath(inputPath)).replaceAll(path.sep, "/");
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function selectedLessons() {
  const file = argValue("--file");
  if (!file) return findLessons();
  const fullPath = resolveInputPath(file);
  if (!fs.existsSync(fullPath)) {
    console.error(`Lesson file not found: ${file}`);
    process.exit(1);
  }
  const relPath = relInputPath(file);
  return [{ id: path.basename(path.dirname(fullPath)), dataPath: relPath }];
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function findLessons() {
  const lessonsDir = path.join(root, "lessons");
  const dirs = fs.readdirSync(lessonsDir).filter(d => fs.statSync(path.join(lessonsDir, d)).isDirectory());
  const lessons = [];
  for (const dir of dirs) {
    const dataPath = path.join("lessons", dir, "data.js");
    const fullPath = path.join(root, dataPath);
    if (fs.existsSync(fullPath)) {
      lessons.push({ id: dir, dataPath });
    }
  }
  return lessons;
}

const REQUIRED_SCENE_FIELDS = ["id", "type", "eyebrow", "title", "pressure", "narrative", "prompt", "carry", "tags"];
const VALID_TYPES = ["choice", "input", "match", "completion"];
const KNOWN_COMPETENCIES = loadCompetencyIds();
const DENSITY_STOPWORDS = new Set([
  "alle", "alt", "altid", "anden", "andre", "bare", "den", "der", "det",
  "dig", "din", "dit", "dine", "du", "eller", "for", "fra", "gerne", "har", "havde",
  "hos", "hun", "hvad", "hvem", "hvor", "hvornår", "ind", "jeg", "jer",
  "jeres", "kan", "kun", "kunne", "man", "med", "men", "mig", "mod", "når", "også",
  "om", "over", "sig", "skal", "som", "til", "ud", "uden", "var", "være",
  "været", "ville"
]);

function wordsFromText(value) {
  return String(value || "").replace(/\[[^\]]+\]/g, " ").toLowerCase().match(/[a-zæøå]{3,}/g) || [];
}

function buildSupportWords(lesson, scene) {
  const supportText = [
    scene.notice || "",
    scene.prompt || "",
    scene.carry || "",
    scene.success || "",
    scene.failure || "",
    scene.placeholder || "",
    ...((scene.options || []).map(o => [o.detail, o.feedback].join(" "))),
    ...((lesson.languagePhenomena || []).map(p => [p.item, p.function].join(" ")))
  ].join(" ");
  return new Set(wordsFromText(supportText));
}

function isB2Lesson(lesson) {
  return lesson.level === "B2" || (lesson.variables && Object.keys(lesson.variables).length > 0);
}

function isGoldLesson(lesson) {
  return lesson.qualityTier === "gold";
}

function sceneQualityText(scene) {
  return [
    scene.pressure || "",
    scene.narrative || "",
    scene.notice || "",
    scene.prompt || "",
    scene.carry || "",
    scene.success || "",
    scene.failure || "",
    scene.placeholder || "",
    scene.prefix || "",
    scene.acceptPrefix || "",
    ...(scene.acceptKeywords || []),
    ...((scene.acceptKeywordGroups || []).flatMap(group => group.keywords || [])),
    ...(scene.dialogue || []).map(d => d.line),
    ...(scene.options || []).map(o => [o.label, o.detail, o.feedback].join(" ")),
    ...(scene.pairs || []).map(p => [p.left, p.right, p.feedback].join(" "))
  ].join(" ");
}

function validateSourceNotes(lessonMeta, lesson) {
  if (!isB2Lesson(lesson)) return;
  const notes = lesson.sourceNotes;
  if (!Array.isArray(notes) || notes.length < 2) {
    issue(`${lessonMeta.id}: B2 lessons require at least two sourceNotes`);
    return;
  }
  notes.forEach((note, ni) => {
    const prefix = `${lessonMeta.id}.sourceNotes[${ni}]`;
    if (!nonEmptyString(note.title)) issue(`${prefix}.title: required non-empty string`);
    if (!nonEmptyString(note.url) || !/^https:\/\/[^ ]+$/i.test(note.url)) issue(`${prefix}.url: required https URL`);
    if (!Array.isArray(note.supports) || note.supports.length === 0) {
      issue(`${prefix}.supports: required non-empty array`);
    } else {
      note.supports.forEach((support, si) => {
        if (!nonEmptyString(support)) issue(`${prefix}.supports[${si}]: required non-empty string`);
      });
    }
  });
}

function validateGoldMasteryMap(lessonMeta, lesson) {
  if (!isGoldLesson(lesson)) return new Set();
  const map = lesson.masteryMap;
  const knownSources = new Set((lesson.sourceNotes || []).map(note => note.title));
  const scenesById = new Map((lesson.scenes || []).map(scene => [scene.id, scene]));
  if (!map || typeof map !== "object" || Array.isArray(map)) {
    issue(`${lessonMeta.id}.masteryMap: gold lessons require a masteryMap object`);
    return new Set();
  }

  const keys = Object.keys(map);
  if (keys.length === 0) issue(`${lessonMeta.id}.masteryMap: must define at least one mastery tag`);

  keys.forEach((key) => {
    const prefix = `${lessonMeta.id}.masteryMap["${key}"]`;
    const spec = map[key];
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) issue(`${prefix}: key must be kebab-case`);
    if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
      issue(`${prefix}: required object`);
      return;
    }
    if (!nonEmptyString(spec.label)) issue(`${prefix}.label: required non-empty string`);
    if (!nonEmptyString(spec.evidence)) issue(`${prefix}.evidence: required non-empty string`);
    if (!spec.remediation || typeof spec.remediation !== "object" || Array.isArray(spec.remediation)) {
      issue(`${prefix}.remediation: required object`);
    } else {
      if (!nonEmptyString(spec.remediation.sceneId)) {
        issue(`${prefix}.remediation.sceneId: required non-empty string`);
      } else if (!scenesById.has(spec.remediation.sceneId)) {
        issue(`${prefix}.remediation.sceneId: unknown scene "${spec.remediation.sceneId}"`);
      } else if (!((scenesById.get(spec.remediation.sceneId).masteryTags || []).includes(key))) {
        issue(`${prefix}.remediation.sceneId: scene "${spec.remediation.sceneId}" does not train mastery tag "${key}"`);
      }
      if (!nonEmptyString(spec.remediation.cta)) issue(`${prefix}.remediation.cta: required non-empty string`);
      if (!nonEmptyString(spec.remediation.action)) issue(`${prefix}.remediation.action: required non-empty string`);
    }
    if (!nonEmptyString(spec.competencyId)) {
      issue(`${prefix}.competencyId: required known competency id`);
    } else if (!KNOWN_COMPETENCIES.has(spec.competencyId)) {
      issue(`${prefix}.competencyId: unknown competency "${spec.competencyId}"`);
    }
    if (!Array.isArray(spec.sourceRefs) || spec.sourceRefs.length === 0) {
      issue(`${prefix}.sourceRefs: required non-empty array`);
    } else {
      spec.sourceRefs.forEach((ref, ri) => {
        if (!nonEmptyString(ref)) {
          issue(`${prefix}.sourceRefs[${ri}]: required non-empty string`);
        } else if (!knownSources.has(ref)) {
          issue(`${prefix}.sourceRefs[${ri}]: unknown source reference "${ref}"`);
        }
      });
    }
  });

  return new Set(keys);
}

function validateGoldSimulationContract(lessonMeta, lesson) {
  if (!isGoldLesson(lesson)) return;
  if (!lesson.variables || !lesson.endings) return;

  const sim = lesson.simulation;
  if (!sim || typeof sim !== "object" || Array.isArray(sim)) {
    issue(`${lessonMeta.id}.simulation: gold lessons with endings require a simulation object`);
    return;
  }

  const completionScenes = (lesson.scenes || []).filter(scene => scene.type === "completion");
  completionScenes.forEach(scene => {
    const answerSpec = sim.completionAnswers && sim.completionAnswers[scene.id];
    const prefix = `${lessonMeta.id}.simulation.completionAnswers["${scene.id}"]`;
    if (!answerSpec || typeof answerSpec !== "object" || Array.isArray(answerSpec)) {
      issue(`${prefix}: required object`);
      return;
    }
    if (!Array.isArray(answerSpec.reject) || answerSpec.reject.length === 0) issue(`${prefix}.reject: required non-empty array`);
    if (!nonEmptyString(answerSpec.accept)) issue(`${prefix}.accept: required non-empty string`);
  });

  if (!Array.isArray(sim.paths) || sim.paths.length === 0) {
    issue(`${lessonMeta.id}.simulation.paths: required non-empty array`);
    return;
  }

  const sceneById = new Map((lesson.scenes || []).map(scene => [scene.id, scene]));
  const endingIds = new Set((lesson.endings || []).map(ending => ending.id));
  const pathIds = new Set();
  sim.paths.forEach((pathSpec, pi) => {
    const prefix = `${lessonMeta.id}.simulation.paths[${pi}]`;
    if (!pathSpec || typeof pathSpec !== "object" || Array.isArray(pathSpec)) {
      issue(`${prefix}: required object`);
      return;
    }
    if (!nonEmptyString(pathSpec.id)) {
      issue(`${prefix}.id: required non-empty string`);
    } else if (pathIds.has(pathSpec.id)) {
      issue(`${prefix}.id: duplicate path id "${pathSpec.id}"`);
    } else {
      pathIds.add(pathSpec.id);
    }
    if (!nonEmptyString(pathSpec.expectedEndingId)) {
      issue(`${prefix}.expectedEndingId: required non-empty string`);
    } else if (!endingIds.has(pathSpec.expectedEndingId)) {
      issue(`${prefix}.expectedEndingId: unknown ending "${pathSpec.expectedEndingId}"`);
    }
    if (pathSpec.expectedVariables !== undefined && (!pathSpec.expectedVariables || typeof pathSpec.expectedVariables !== "object" || Array.isArray(pathSpec.expectedVariables))) {
      issue(`${prefix}.expectedVariables: must be an object when present`);
    }
    if (pathSpec.expectedCorrect !== undefined && (!Number.isInteger(pathSpec.expectedCorrect) || pathSpec.expectedCorrect < 0)) {
      issue(`${prefix}.expectedCorrect: must be a non-negative integer when present`);
    }
    if (pathSpec.expectedWeakMastery !== undefined && !Array.isArray(pathSpec.expectedWeakMastery)) {
      issue(`${prefix}.expectedWeakMastery: must be an array when present`);
    }
    if (!Array.isArray(pathSpec.actions) || pathSpec.actions.length !== sceneById.size) {
      issue(`${prefix}.actions: must include exactly one action for each scene`);
      return;
    }

    const actionSceneIds = new Set();
    pathSpec.actions.forEach((action, ai) => {
      const actionPrefix = `${prefix}.actions[${ai}]`;
      if (!action || typeof action !== "object" || Array.isArray(action)) {
        issue(`${actionPrefix}: required object`);
        return;
      }
      if (!nonEmptyString(action.sceneId)) {
        issue(`${actionPrefix}.sceneId: required non-empty string`);
        return;
      }
      if (actionSceneIds.has(action.sceneId)) issue(`${actionPrefix}.sceneId: duplicate scene "${action.sceneId}"`);
      actionSceneIds.add(action.sceneId);
      const scene = sceneById.get(action.sceneId);
      if (!scene) {
        issue(`${actionPrefix}.sceneId: unknown scene "${action.sceneId}"`);
        return;
      }
      if (scene.type === "choice") {
        if (!nonEmptyString(action.optionId)) issue(`${actionPrefix}.optionId: choice action requires optionId`);
        if (typeof action.expectCorrect !== "boolean") issue(`${actionPrefix}.expectCorrect: choice action requires boolean`);
      }
      if (scene.type === "match" && action.matchAll !== true) {
        issue(`${actionPrefix}.matchAll: match action requires true`);
      }
      if (scene.type === "completion") {
        if (!nonEmptyString(action.answer)) issue(`${actionPrefix}.answer: completion action requires answer`);
        if (typeof action.expectCorrect !== "boolean") issue(`${actionPrefix}.expectCorrect: completion action requires boolean`);
      }
    });
  });

  const coveredEndings = new Set(sim.paths.map(pathSpec => pathSpec && pathSpec.expectedEndingId).filter(Boolean));
  endingIds.forEach(endingId => {
    if (!coveredEndings.has(endingId)) issue(`${lessonMeta.id}.simulation.paths: ending "${endingId}" is not covered by any path`);
  });
}

function validateGoldComicStoryboard(lessonMeta, lesson, knownMasteryTags) {
  if (!isGoldLesson(lesson)) return;
  const storyboard = lesson.comicStoryboard;
  const sceneById = new Map((lesson.scenes || []).map(scene => [scene.id, scene]));
  const knownSources = new Set((lesson.sourceNotes || []).map(note => note.title));
  if (!storyboard || typeof storyboard !== "object" || Array.isArray(storyboard)) {
    issue(`${lessonMeta.id}.comicStoryboard: gold lessons require a comicStoryboard object`);
    return;
  }
  if (!nonEmptyString(storyboard.style)) issue(`${lessonMeta.id}.comicStoryboard.style: required non-empty string`);
  if (!["1:1", "4:3", "16:9", "3:2"].includes(storyboard.aspectRatio)) {
    issue(`${lessonMeta.id}.comicStoryboard.aspectRatio: must be one of 1:1, 4:3, 16:9, 3:2`);
  }
  if (!["0.5K", "1K", "2K", "4K"].includes(storyboard.imageSize)) {
    issue(`${lessonMeta.id}.comicStoryboard.imageSize: must be one of 0.5K, 1K, 2K, 4K`);
  }
  if (!Array.isArray(storyboard.panels) || storyboard.panels.length !== sceneById.size) {
    issue(`${lessonMeta.id}.comicStoryboard.panels: must include exactly one panel for each scene`);
    return;
  }

  const panelSceneIds = new Set();
  const panelIds = new Set();
  storyboard.panels.forEach((panel, pi) => {
    const prefix = `${lessonMeta.id}.comicStoryboard.panels[${pi}]`;
    if (!panel || typeof panel !== "object" || Array.isArray(panel)) {
      issue(`${prefix}: required object`);
      return;
    }
    if (!nonEmptyString(panel.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(panel.id)) {
      issue(`${prefix}.id: required kebab-case string`);
    } else if (panelIds.has(panel.id)) {
      issue(`${prefix}.id: duplicate panel id "${panel.id}"`);
    } else {
      panelIds.add(panel.id);
    }
    if (!nonEmptyString(panel.sceneId)) {
      issue(`${prefix}.sceneId: required non-empty string`);
      return;
    }
    if (panelSceneIds.has(panel.sceneId)) issue(`${prefix}.sceneId: duplicate scene "${panel.sceneId}"`);
    panelSceneIds.add(panel.sceneId);
    const scene = sceneById.get(panel.sceneId);
    if (!scene) {
      issue(`${prefix}.sceneId: unknown scene "${panel.sceneId}"`);
      return;
    }
    if (!nonEmptyString(panel.assetPath) || !/^\.\/assets\/comic\/[a-z0-9-]+\.(png|webp|jpg|jpeg)$/i.test(panel.assetPath)) {
      issue(`${prefix}.assetPath: must point to ./assets/comic/<panel>.png|webp|jpg|jpeg`);
    }
    if (!nonEmptyString(panel.alt) || panel.alt.trim().split(/\s+/).length < 8) {
      issue(`${prefix}.alt: required descriptive alt text with at least eight words`);
    }
    if (!nonEmptyString(panel.prompt) || panel.prompt.trim().split(/\s+/).length < 30) {
      issue(`${prefix}.prompt: required image prompt with at least 30 words`);
    }
    if (!Array.isArray(panel.mustInclude) || panel.mustInclude.length < 2) issue(`${prefix}.mustInclude: required array with at least two items`);
    if (!Array.isArray(panel.avoid) || panel.avoid.length < 2) issue(`${prefix}.avoid: required array with at least two items`);

    if (!Array.isArray(panel.sourceRefs) || panel.sourceRefs.length === 0) {
      issue(`${prefix}.sourceRefs: required non-empty array`);
    } else {
      panel.sourceRefs.forEach((ref, ri) => {
        if (!nonEmptyString(ref)) {
          issue(`${prefix}.sourceRefs[${ri}]: required non-empty string`);
        } else if (!knownSources.has(ref)) {
          issue(`${prefix}.sourceRefs[${ri}]: unknown source reference "${ref}"`);
        } else if (!(scene.sourceRefs || []).includes(ref)) {
          issue(`${prefix}.sourceRefs[${ri}]: source "${ref}" is not attached to scene "${panel.sceneId}"`);
        }
      });
    }
    if (!Array.isArray(panel.masteryTags) || panel.masteryTags.length === 0) {
      issue(`${prefix}.masteryTags: required non-empty array`);
    } else {
      panel.masteryTags.forEach((tag, ti) => {
        if (!nonEmptyString(tag)) {
          issue(`${prefix}.masteryTags[${ti}]: required non-empty string`);
        } else if (!knownMasteryTags.has(tag)) {
          issue(`${prefix}.masteryTags[${ti}]: unknown mastery tag "${tag}"`);
        } else if (!(scene.masteryTags || []).includes(tag)) {
          issue(`${prefix}.masteryTags[${ti}]: tag "${tag}" is not attached to scene "${panel.sceneId}"`);
        }
      });
    }
  });

  sceneById.forEach((scene, sceneId) => {
    if (!panelSceneIds.has(sceneId)) issue(`${lessonMeta.id}.comicStoryboard.panels: missing panel for scene "${sceneId}"`);
  });
}

function validateGoldSceneContract(lessonMeta, lesson, scene, si) {
  if (!isGoldLesson(lesson)) return;
  const prefix = `${lessonMeta.id}::scene[${si}]`;
  if (!nonEmptyString(scene.learningGoal)) issue(`${prefix}.learningGoal: gold lessons require a scene learning goal`);

  const knownSources = new Set((lesson.sourceNotes || []).map(note => note.title));
  if (!Array.isArray(scene.sourceRefs) || scene.sourceRefs.length === 0) {
    issue(`${prefix}.sourceRefs: gold lessons require at least one source reference`);
    return;
  }
  scene.sourceRefs.forEach((ref, ri) => {
    if (!nonEmptyString(ref)) {
      issue(`${prefix}.sourceRefs[${ri}]: required non-empty string`);
    } else if (!knownSources.has(ref)) {
      issue(`${prefix}.sourceRefs[${ri}]: unknown source reference "${ref}"`);
    }
  });
}

function validateSceneMasteryTags(lessonMeta, lesson, scene, si, knownMasteryTags) {
  if (!isGoldLesson(lesson)) return;
  const prefix = `${lessonMeta.id}::scene[${si}]`;
  if (!Array.isArray(scene.masteryTags) || scene.masteryTags.length === 0) {
    issue(`${prefix}.masteryTags: gold scenes require at least one mastery tag`);
    return;
  }
  const seen = new Set();
  scene.masteryTags.forEach((tag, ti) => {
    if (!nonEmptyString(tag)) {
      issue(`${prefix}.masteryTags[${ti}]: required non-empty string`);
    } else if (!knownMasteryTags.has(tag)) {
      issue(`${prefix}.masteryTags[${ti}]: unknown mastery tag "${tag}"`);
    } else if (seen.has(tag)) {
      issue(`${prefix}.masteryTags[${ti}]: duplicate mastery tag "${tag}"`);
    } else {
      seen.add(tag);
    }
  });
}

function validateTargetPhrases(lessonMeta, lesson, scene, si) {
  if (!isB2Lesson(lesson)) return;
  const prefix = `${lessonMeta.id}::scene[${si}]`;
  if (!Array.isArray(scene.targetPhrases) || scene.targetPhrases.length < 2) {
    issue(`${prefix}.targetPhrases: B2 scenes require at least two target phrases`);
    return;
  }

  const sceneWords = new Set(wordsFromText(sceneQualityText(scene)));
  scene.targetPhrases.forEach((phrase, pi) => {
    if (!nonEmptyString(phrase)) {
      issue(`${prefix}.targetPhrases[${pi}]: required non-empty string`);
      return;
    }
    const contentWords = wordsFromText(phrase).filter(w => !DENSITY_STOPWORDS.has(w));
    if (contentWords.length === 0) {
      issue(`${prefix}.targetPhrases[${pi}]: phrase has no content words`);
      return;
    }
    const missing = contentWords.filter(w => !sceneWords.has(w));
    if (missing.length) {
      issue(`${prefix}.targetPhrases[${pi}]: word(s) not found in scene content: ${missing.join(", ")}`);
    }
  });
}

function validateLesson(lessonMeta, lesson) {
  if (!lesson) {
    issue(`${lessonMeta.id}: no lesson object found in ${lessonMeta.dataPath}`);
    return;
  }

  if (!nonEmptyString(lesson.id)) issue(`${lessonMeta.id}: missing id`);
  if (!nonEmptyString(lesson.title)) issue(`${lessonMeta.id}: missing title`);

  if (!Array.isArray(lesson.scenes) || lesson.scenes.length === 0) {
    issue(`${lessonMeta.id}: scenes must be a non-empty array`);
    return;
  }

  validateSourceNotes(lessonMeta, lesson);
  const knownMasteryTags = validateGoldMasteryMap(lessonMeta, lesson);
  validateGoldSimulationContract(lessonMeta, lesson);
  validateGoldComicStoryboard(lessonMeta, lesson, knownMasteryTags);

  // Track word appearances across scenes for "empty word" detection
  const wordAppearances = new Map(); // word -> { count: number, scenes: Set<string>, supportMentions: Set<string> }

  lesson.scenes.forEach((scene, si) => {
    const prefix = `${lessonMeta.id}::scene[${si}]`;
    validateGoldSceneContract(lessonMeta, lesson, scene, si);
    validateSceneMasteryTags(lessonMeta, lesson, scene, si, knownMasteryTags);
    validateTargetPhrases(lessonMeta, lesson, scene, si);

    // Required fields
    REQUIRED_SCENE_FIELDS.forEach(field => {
      if (field === "dialogue") {
        if (!scene.dialogue || !Array.isArray(scene.dialogue) || scene.dialogue.length === 0) {
          issue(`${prefix}.dialogue: required non-empty array`);
        } else {
          scene.dialogue.forEach((line, li) => {
            if (!nonEmptyString(line.speaker)) issue(`${prefix}.dialogue[${li}].speaker: empty`);
            if (!nonEmptyString(line.line)) issue(`${prefix}.dialogue[${li}].line: empty`);
          });
        }
      } else if (field === "tags") {
        if (!Array.isArray(scene.tags) || scene.tags.length === 0) {
          warn(`${prefix}.tags: empty array (add skill tags for kernel tracking)`);
        }
      } else if (!nonEmptyString(scene[field])) {
        issue(`${prefix}.${field}: required non-empty string`);
      }
    });

    // Type validation
    if (!VALID_TYPES.includes(scene.type)) {
      issue(`${prefix}.type: must be one of ${VALID_TYPES.join(", ")}, got "${scene.type}"`);
    }

    // Per-type validation
    if (scene.type === "choice") {
      if (!Array.isArray(scene.options) || scene.options.length < 2) {
        issue(`${prefix}: choice requires options array (min 2)`);
      } else {
        const correctCount = scene.options.filter(o => o.correct === true).length;
        if (correctCount !== 1) issue(`${prefix}: exactly one option must have correct: true (found ${correctCount})`);
        const diagnostics = new Set();
        scene.options.forEach((opt, oi) => {
          if (!nonEmptyString(opt.id)) issue(`${prefix}.options[${oi}].id: empty`);
          if (!nonEmptyString(opt.label)) issue(`${prefix}.options[${oi}].label: empty`);
          if (!nonEmptyString(opt.detail)) issue(`${prefix}.options[${oi}].detail: empty`);
          if (!nonEmptyString(opt.feedback)) issue(`${prefix}.options[${oi}].feedback: empty`);
          if (isGoldLesson(lesson)) {
            if (!nonEmptyString(opt.diagnostic)) {
              issue(`${prefix}.options[${oi}].diagnostic: gold choice options require a diagnostic key`);
            } else if (diagnostics.has(opt.diagnostic)) {
              issue(`${prefix}.options[${oi}].diagnostic: duplicate diagnostic "${opt.diagnostic}"`);
            } else {
              diagnostics.add(opt.diagnostic);
            }
          }
        });
      }
    }

    if (scene.type === "input") {
      if (!nonEmptyString(scene.acceptPrefix)) issue(`${prefix}: input requires acceptPrefix`);
      if (!nonEmptyString(scene.placeholder)) issue(`${prefix}: input requires placeholder`);
      if (!nonEmptyString(scene.success)) issue(`${prefix}: input requires success message`);
      if (!nonEmptyString(scene.failure)) issue(`${prefix}: input requires failure message`);
    }

    if (scene.type === "match") {
      if (!Array.isArray(scene.pairs) || scene.pairs.length < 2) {
        issue(`${prefix}: match requires pairs array (min 2)`);
      } else {
        scene.pairs.forEach((pair, pi) => {
          if (!nonEmptyString(pair.id)) issue(`${prefix}.pairs[${pi}].id: empty`);
          if (!nonEmptyString(pair.left)) issue(`${prefix}.pairs[${pi}].left: empty`);
          if (!nonEmptyString(pair.right)) issue(`${prefix}.pairs[${pi}].right: empty`);
          if (isB2Lesson(lesson) && !nonEmptyString(pair.feedback)) issue(`${prefix}.pairs[${pi}].feedback: B2 match pairs require diagnostic feedback`);
        });
      }
    }

    if (scene.type === "completion") {
      if (!nonEmptyString(scene.prefix)) issue(`${prefix}: completion requires prefix`);
      if (!nonEmptyString(scene.placeholder)) issue(`${prefix}: completion requires placeholder`);
      if (!nonEmptyString(scene.success)) issue(`${prefix}: completion requires success message`);
      if (!nonEmptyString(scene.failure)) issue(`${prefix}: completion requires failure message`);
      if (scene.acceptKeywordGroups) {
        if (!Array.isArray(scene.acceptKeywordGroups) || scene.acceptKeywordGroups.length === 0) {
          issue(`${prefix}.acceptKeywordGroups: must be a non-empty array when present`);
        } else {
          scene.acceptKeywordGroups.forEach((group, gi) => {
            if (!nonEmptyString(group.name)) issue(`${prefix}.acceptKeywordGroups[${gi}].name: empty`);
            if (!Array.isArray(group.keywords) || group.keywords.length === 0) {
              issue(`${prefix}.acceptKeywordGroups[${gi}].keywords: required non-empty array`);
            } else {
              group.keywords.forEach((keyword, ki) => {
                if (!nonEmptyString(keyword)) issue(`${prefix}.acceptKeywordGroups[${gi}].keywords[${ki}]: empty`);
              });
            }
          });
        }
      }
      if (isGoldLesson(lesson) && (!Array.isArray(scene.acceptKeywordGroups) || scene.acceptKeywordGroups.length < 2)) {
        issue(`${prefix}.acceptKeywordGroups: gold completion scenes require at least two keyword groups`);
      }
    }

    // Extract Danish words from Danish-language content only for density check
    // Exclude: distractor option labels (correct: false), acceptKeywords (accepted answers, not taught vocab)
    const danishSources = [
      ...(scene.dialogue || []).map(d => d.line),
      scene.danish || "",
      ...(scene.options || []).filter(o => o.correct !== false).map(o => o.label),
      ...(scene.pairs || []).map(p => p.left),
      scene.prefix || "",
      scene.acceptPrefix || ""
      // acceptKeywords intentionally excluded: they are accepted answers, not vocabulary targets
    ];
    const danishText = danishSources.join(" ").toLowerCase();
    const supportWords = buildSupportWords(lesson, scene);

    // Simple Danish word extraction (letters + æøå, ignore short words)
    const words = wordsFromText(danishText).filter(w => !DENSITY_STOPWORDS.has(w));
    words.forEach(w => {
      if (!wordAppearances.has(w)) wordAppearances.set(w, { count: 0, scenes: new Set(), supportMentions: new Set() });
      const entry = wordAppearances.get(w);
      entry.count += 1;
      entry.scenes.add(`scene[${si}]`);
      // Check if the lesson explicitly supports the word in carry-forward, notices, prompts, feedback, or phenomena notes.
      if (supportWords.has(w)) {
        entry.supportMentions.add(`scene[${si}]`);
      }
    });
  });

  // Density check: words appearing only once and not in any teaching support
  const singletons = [];
  wordAppearances.forEach((entry, word) => {
    if (entry.count === 1 && entry.supportMentions.size === 0) {
      singletons.push({ word, scene: [...entry.scenes][0] });
    }
  });

  if (singletons.length > 0) {
    // Only warn, don't fail - some flavour words are OK
    warn(`${lessonMeta.id}: ${singletons.length} word(s) appear only once without teaching support:`);
    singletons.slice(0, 10).forEach(s => warn(`  - "${s.word}" in ${s.scene}`));
  }

  // Ending system validation (for B2-style lessons)
  if (lesson.variables && Object.keys(lesson.variables).length > 0) {
    if (!lesson.endingLogic) warn(`${lessonMeta.id}: has variables but no endingLogic`);
    if (!lesson.endings || !Array.isArray(lesson.endings) || lesson.endings.length === 0) {
      warn(`${lessonMeta.id}: has variables but no endings array`);
    }
  }

  // Check that carry-forward text is substantial (not just a word)
  lesson.scenes.forEach((scene, si) => {
    if (nonEmptyString(scene.carry) && scene.carry.trim().split(/\s+/).length < 5) {
      warn(`${lessonMeta.id}::scene[${si}].carry: very short (${scene.carry.trim().split(/\s+/).length} words) - consider more substance`);
    }
  });
}

// Main
const lessons = selectedLessons();
if (lessons.length === 0) {
  console.error("No lessons found in lessons/*/data.js");
  process.exit(1);
}

lessons.forEach(meta => {
  const lesson = loadLesson(meta.dataPath);
  validateLesson(meta, lesson);
});

if (warnings.length) {
  console.warn(`Lesson validation warnings: ${warnings.length}`);
  warnings.forEach(w => console.warn("⚠ " + w));
}

if (issues.length) {
  console.error(`Lesson validation failed: ${issues.length} issue(s)`);
  issues.forEach(i => console.error("✗ " + i));
  process.exit(1);
}

console.log(`Lesson validation passed: ${lessons.length} lesson(s) validated`);

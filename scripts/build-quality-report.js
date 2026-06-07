#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function rel(file, root = repoRoot) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function loadWindowScript(relPath) {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(repoRoot, relPath), "utf8"), context, { filename: relPath });
  return context.window;
}

function loadCatalog() {
  return loadWindowScript("shared/plata-catalog.js").PlataCatalog;
}

function findLessonDataFiles() {
  const lessonsRoot = path.join(repoRoot, "lessons");
  return fs.readdirSync(lessonsRoot)
    .filter(dir => fs.statSync(path.join(lessonsRoot, dir)).isDirectory())
    .map(dir => path.join("lessons", dir, "data.js").replaceAll(path.sep, "/"))
    .filter(relPath => fs.existsSync(path.join(repoRoot, relPath)));
}

function loadLesson(relPath) {
  const win = loadWindowScript(relPath);
  const key = Object.keys(win).find(name => name.startsWith("PLATA_LESSON_"));
  return key ? { globalName: key, lesson: win[key], dataPath: relPath } : null;
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

function attemptCountForPath(lesson, pathSpec) {
  const scenes = new Map((lesson.scenes || []).map(scene => [scene.id, scene]));
  return (pathSpec.actions || []).reduce((sum, action) => {
    const scene = scenes.get(action.sceneId);
    if (!scene) return sum;
    return sum + (scene.type === "match" ? (scene.pairs || []).length : 1);
  }, 0);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function summarizeLesson(entry, catalogById) {
  const { lesson, globalName, dataPath } = entry;
  const scenes = asArray(lesson.scenes);
  const masteryMap = lesson.masteryMap || {};
  const masteryKeys = Object.keys(masteryMap);
  const endings = asArray(lesson.endings);
  const simulationPaths = asArray(lesson.simulation && lesson.simulation.paths);
  const sceneById = new Map(scenes.map(scene => [scene.id, scene]));
  const sourceTitles = new Set(asArray(lesson.sourceNotes).map(note => note.title));
  const issues = [];

  const catalogEntry = catalogById.get(lesson.id);
  if (!catalogEntry) issues.push("missing catalog entry");
  if (lesson.qualityTier === "gold") {
    if (!masteryKeys.length) issues.push("gold lesson missing masteryMap");
    if (!simulationPaths.length) issues.push("gold lesson missing simulation.paths");
    if (endings.length && !simulationPaths.length) issues.push("gold lesson endings are not simulated");

    masteryKeys.forEach(key => {
      const spec = masteryMap[key] || {};
      const remediation = spec.remediation || {};
      if (!remediation.sceneId || !sceneById.has(remediation.sceneId)) issues.push(`mastery ${key} has invalid remediation scene`);
      asArray(spec.sourceRefs).forEach(ref => {
        if (!sourceTitles.has(ref)) issues.push(`mastery ${key} references unknown source ${ref}`);
      });
    });

    scenes.forEach(scene => {
      if (!scene.learningGoal) issues.push(`${scene.id} missing learningGoal`);
      if (!asArray(scene.masteryTags).length) issues.push(`${scene.id} missing masteryTags`);
      asArray(scene.sourceRefs).forEach(ref => {
        if (!sourceTitles.has(ref)) issues.push(`${scene.id} references unknown source ${ref}`);
      });
      if (scene.type === "choice") {
        const diagnostics = asArray(scene.options).map(option => option.diagnostic).filter(Boolean);
        if (diagnostics.length !== asArray(scene.options).length) issues.push(`${scene.id} has choice option without diagnostic`);
        if (diagnostics.length !== new Set(diagnostics).size) issues.push(`${scene.id} has duplicate choice diagnostics`);
      }
      if (scene.type === "completion" && asArray(scene.acceptKeywordGroups).length < 2) {
        issues.push(`${scene.id} completion has fewer than two keyword groups`);
      }
    });

    const endingIds = new Set(endings.map(ending => ending.id));
    const coveredEndings = new Set(simulationPaths.map(pathSpec => pathSpec.expectedEndingId).filter(Boolean));
    endingIds.forEach(endingId => {
      if (!coveredEndings.has(endingId)) issues.push(`ending ${endingId} is not covered by simulation`);
    });

    scenes.filter(scene => scene.type === "completion").forEach(scene => {
      const spec = lesson.simulation && lesson.simulation.completionAnswers && lesson.simulation.completionAnswers[scene.id];
      if (!spec) {
        issues.push(`${scene.id} missing simulation completion answer spec`);
        return;
      }
      asArray(spec.reject).forEach(answer => {
        if (checkCompletion(scene, answer).ok) issues.push(`${scene.id} reject answer passes: ${answer}`);
      });
      if (!checkCompletion(scene, spec.accept).ok) issues.push(`${scene.id} accept answer fails`);
    });
  }

  const sceneTypes = scenes.reduce((acc, scene) => {
    acc[scene.type] = (acc[scene.type] || 0) + 1;
    return acc;
  }, {});
  const sourceRefs = unique([
    ...scenes.flatMap(scene => asArray(scene.sourceRefs)),
    ...masteryKeys.flatMap(key => asArray(masteryMap[key].sourceRefs))
  ]);

  return {
    id: lesson.id,
    title: lesson.title,
    level: lesson.level || "",
    qualityTier: lesson.qualityTier || "standard",
    dataPath,
    globalName,
    catalog: catalogEntry ? {
      name: catalogEntry.name,
      path: catalogEntry.path,
      lessonDataPath: catalogEntry.lessonDataPath || "",
      lessonGlobal: catalogEntry.lessonGlobal || ""
    } : null,
    status: issues.length ? "fail" : "pass",
    issues,
    counts: {
      scenes: scenes.length,
      choiceScenes: sceneTypes.choice || 0,
      matchScenes: sceneTypes.match || 0,
      completionScenes: sceneTypes.completion || 0,
      sourceNotes: asArray(lesson.sourceNotes).length,
      sourceRefs: sourceRefs.length,
      masterySignals: masteryKeys.length,
      endings: endings.length,
      simulationPaths: simulationPaths.length,
      simulatedAttempts: simulationPaths.reduce((sum, pathSpec) => sum + attemptCountForPath(lesson, pathSpec), 0)
    },
    masterySignals: masteryKeys.map(key => ({
      key,
      label: masteryMap[key].label || key,
      remediationSceneId: masteryMap[key].remediation && masteryMap[key].remediation.sceneId || "",
      sourceRefs: asArray(masteryMap[key].sourceRefs)
    })),
    sourceNotes: asArray(lesson.sourceNotes).map(note => ({
      title: note.title,
      url: note.url,
      supports: asArray(note.supports)
    })),
    simulation: {
      paths: simulationPaths.map(pathSpec => ({
        id: pathSpec.id,
        expectedEndingId: pathSpec.expectedEndingId,
        expectedCorrect: pathSpec.expectedCorrect,
        expectedWeakMastery: asArray(pathSpec.expectedWeakMastery),
        attempts: attemptCountForPath(lesson, pathSpec)
      })),
      coveredEndings: unique(simulationPaths.map(pathSpec => pathSpec.expectedEndingId)),
      declaredEndings: unique(endings.map(ending => ending.id))
    }
  };
}

function buildQualityReport() {
  const catalog = loadCatalog();
  const catalogById = new Map(asArray(catalog && catalog.trainers).map(trainer => [trainer.id, trainer]));
  const lessons = findLessonDataFiles()
    .map(loadLesson)
    .filter(Boolean)
    .map(entry => summarizeLesson(entry, catalogById))
    .sort((a, b) => a.id.localeCompare(b.id));

  const totals = lessons.reduce((acc, lesson) => {
    acc.lessons += 1;
    if (lesson.qualityTier === "gold") acc.goldLessons += 1;
    acc.scenes += lesson.counts.scenes;
    acc.masterySignals += lesson.counts.masterySignals;
    acc.simulationPaths += lesson.counts.simulationPaths;
    acc.simulatedAttempts += lesson.counts.simulatedAttempts;
    acc.endings += lesson.counts.endings;
    acc.issues += lesson.issues.length;
    return acc;
  }, {
    lessons: 0,
    goldLessons: 0,
    scenes: 0,
    masterySignals: 0,
    simulationPaths: 0,
    simulatedAttempts: 0,
    endings: 0,
    issues: 0
  });

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: totals.issues ? "fail" : "pass",
    totals,
    lessons
  };
}

function writeQualityReport(outPath) {
  const report = buildQualityReport();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  if (report.status !== "pass") {
    console.error(`quality report failed with ${report.totals.issues} issue(s)`);
    report.lessons.forEach(lesson => {
      lesson.issues.forEach(issue => console.error(`- ${lesson.id}: ${issue}`));
    });
    process.exit(1);
  }
  console.log(`quality report built: ${rel(outPath)} (${report.totals.goldLessons} gold lesson(s), ${report.totals.simulationPaths} path(s))`);
  return report;
}

function main() {
  const out = argValue("--out") || path.join(repoRoot, ".dist", "pages", "reports", "quality.json");
  writeQualityReport(path.resolve(repoRoot, out));
}

if (require.main === module) main();

module.exports = {
  buildQualityReport,
  writeQualityReport
};

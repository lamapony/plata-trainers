#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { validateLessonAudio } = require("./validate-lesson-audio");

const repoRoot = path.resolve(__dirname, "..");

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function rel(file, root = repoRoot) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function displayRel(file, root = repoRoot) {
  const absolute = path.resolve(file);
  const workspaceRel = path.relative(repoRoot, absolute);
  if (!workspaceRel.startsWith("..") && !path.isAbsolute(workspaceRel)) return workspaceRel.replaceAll(path.sep, "/");
  return rel(absolute, root);
}

function reportRoot(options) {
  if (typeof options === "string") return path.resolve(options);
  return path.resolve(options && options.root || repoRoot);
}

function loadWindowScript(root, relPath) {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, relPath), "utf8"), context, { filename: relPath });
  return context.window;
}

function loadCatalog(root) {
  return loadWindowScript(root, "shared/plata-catalog.js").PlataCatalog;
}

function findLessonDataFiles(root) {
  const lessonsRoot = path.join(root, "lessons");
  return fs.readdirSync(lessonsRoot)
    .filter(dir => fs.statSync(path.join(lessonsRoot, dir)).isDirectory())
    .map(dir => path.join("lessons", dir, "data.js").replaceAll(path.sep, "/"))
    .filter(relPath => fs.existsSync(path.join(root, relPath)));
}

function loadLesson(root, relPath) {
  const win = loadWindowScript(root, relPath);
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

function sceneTrainsTag(scene, tag) {
  if (asArray(scene.masteryTags).includes(tag)) return true;
  return asArray(scene.options).some(option => asArray(option.weakTags).includes(tag));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function assetPathForPanel(root, dataPath, assetPath) {
  if (!assetPath || !dataPath) return "";
  return path.join(root, path.dirname(dataPath), assetPath);
}

function simulationPathsForScene(sceneId, simulationPaths) {
  return simulationPaths
    .filter(pathSpec => asArray(pathSpec.actions).some(action => action.sceneId === sceneId))
    .map(pathSpec => pathSpec.id);
}

function diagnosticSummary(lesson, scene) {
  if (scene.type === "choice") {
    const options = asArray(scene.options);
    return {
      kind: "choice",
      optionCount: options.length,
      correctOptions: options.filter(option => option.correct).length,
      incorrectOptions: options.filter(option => !option.correct).length,
      diagnostics: unique(options.map(option => option.diagnostic)),
      effectKeys: unique(options.flatMap(option => Object.keys(option.effects || {})))
    };
  }
  if (scene.type === "match") {
    const pairs = asArray(scene.pairs);
    return {
      kind: "match",
      pairCount: pairs.length,
      feedbackCount: pairs.filter(pair => pair.feedback).length,
      pairIds: pairs.map(pair => pair.id).filter(Boolean)
    };
  }
  if (scene.type === "completion") {
    const answerSpec = lesson.simulation && lesson.simulation.completionAnswers && lesson.simulation.completionAnswers[scene.id];
    return {
      kind: "completion",
      keywordGroups: asArray(scene.acceptKeywordGroups).map(group => ({
        name: group.name || "required signal",
        keywordCount: asArray(group.keywords).length
      })),
      simulationAccept: answerSpec && answerSpec.accept || "",
      simulationRejects: answerSpec ? asArray(answerSpec.reject).length : 0
    };
  }
  if (scene.type === "flagship-chain") {
    const options = asArray(scene.options);
    return {
      kind: "flagship-chain",
      archetypes: asArray(scene.archetypes),
      channelVersions: asArray(scene.channelVersions).map(channel => channel.id || channel.label).filter(Boolean),
      optionCount: options.length,
      nearMisses: options.filter(option => option.nearMiss === true).length,
      consequences: options.filter(option => option.consequence).length,
      repairLadders: options.filter(option => asArray(option.repairLadder).length >= 3).length,
      explainOptions: options.filter(option => asArray(option.reasonOptions).length >= 2).length,
      memorySignal: scene.memoryCue && scene.memoryCue.signal || ""
    };
  }
  return { kind: scene.type || "unknown" };
}

function sceneChecks(lesson, scene, sourceTitles, masteryMap, simulationPaths) {
  const sourceRefs = asArray(scene.sourceRefs);
  const masteryTags = asArray(scene.masteryTags);
  const simulatedBy = simulationPathsForScene(scene.id, simulationPaths);
  const checks = [
    {
      key: "learning-goal",
      label: "Goal",
      pass: Boolean(scene.learningGoal)
    },
    {
      key: "source-linked",
      label: "Sources",
      pass: sourceRefs.length > 0 && sourceRefs.every(ref => sourceTitles.has(ref))
    },
    {
      key: "mastery-linked",
      label: "Mastery",
      pass: masteryTags.length > 0 && masteryTags.every(tag => masteryMap[tag])
    },
    {
      key: "simulation-covered",
      label: "Simulated",
      pass: simulatedBy.length > 0
    }
  ];

  if (scene.type === "choice") {
    const diagnostics = asArray(scene.options).map(option => option.diagnostic).filter(Boolean);
    checks.push({
      key: "diagnostics",
      label: "Diagnostics",
      pass: diagnostics.length === asArray(scene.options).length && diagnostics.length === new Set(diagnostics).size
    });
  }
  if (scene.type === "match") {
    checks.push({
      key: "pair-feedback",
      label: "Feedback",
      pass: asArray(scene.pairs).length > 0 && asArray(scene.pairs).every(pair => pair.feedback)
    });
  }
  if (scene.type === "completion") {
    const answerSpec = lesson.simulation && lesson.simulation.completionAnswers && lesson.simulation.completionAnswers[scene.id];
    checks.push({
      key: "completion-contract",
      label: "Answer Spec",
      pass: asArray(scene.acceptKeywordGroups).length >= 2 && Boolean(answerSpec && answerSpec.accept)
    });
  }
  if (scene.type === "flagship-chain") {
    const requiredArchetypes = [
      "consequence-exercise",
      "near-miss",
      "repair-ladder",
      "same-intent-different-channel",
      "memory-backed-recurrence",
      "explain-your-choice"
    ];
    const archetypes = asArray(scene.archetypes);
    const options = asArray(scene.options);
    checks.push(
      {
        key: "flagship-archetypes",
        label: "Archetypes",
        pass: requiredArchetypes.every(archetype => archetypes.includes(archetype))
      },
      {
        key: "near-miss",
        label: "Near miss",
        pass: options.some(option => option.nearMiss === true && option.correct === false && option.grammarStatus === "grammatical")
      },
      {
        key: "repair-ladder",
        label: "Repair ladder",
        pass: options.length > 0 && options.every(option => asArray(option.repairLadder).length >= 3)
      },
      {
        key: "channel-transfer",
        label: "Channels",
        pass: asArray(scene.channelVersions).length >= 3
      },
      {
        key: "explain-choice",
        label: "Explain",
        pass: options.some(option => option.correct === true && asArray(option.reasonOptions).filter(reason => reason.correct === true).length === 1)
      }
    );
  }

  return checks;
}

function buildEvidenceMatrix(lesson, scenes, masteryMap, sourceTitles, simulationPaths, endings) {
  const masteryEntries = Object.entries(masteryMap);
  const comicPanels = asArray(lesson.comicStoryboard && lesson.comicStoryboard.panels);
  const comicPanelSceneIds = new Set(comicPanels.map(panel => panel.sceneId).filter(Boolean));
  const sourceRows = asArray(lesson.sourceNotes).map(note => ({
    title: note.title,
    url: note.url,
    supports: asArray(note.supports),
    sceneRefs: scenes
      .filter(scene => asArray(scene.sourceRefs).includes(note.title))
      .map(scene => scene.id),
    masteryRefs: masteryEntries
      .filter(([, spec]) => asArray(spec.sourceRefs).includes(note.title))
      .map(([key]) => key)
  }));
  const sceneRows = scenes.map(scene => {
    const remediationFor = masteryEntries
      .filter(([, spec]) => spec.remediation && spec.remediation.sceneId === scene.id)
      .map(([key, spec]) => ({ key, label: spec.label || key }));
    return {
      id: scene.id,
      type: scene.type || "unknown",
      title: scene.title || scene.id,
      learningGoal: scene.learningGoal || "",
      sourceRefs: asArray(scene.sourceRefs),
      masteryTags: asArray(scene.masteryTags),
      remediationFor,
      simulatedBy: simulationPathsForScene(scene.id, simulationPaths),
      diagnostics: diagnosticSummary(lesson, scene),
      checks: sceneChecks(lesson, scene, sourceTitles, masteryMap, simulationPaths)
    };
  });
  const coveredEndings = new Set(simulationPaths.map(pathSpec => pathSpec.expectedEndingId).filter(Boolean));
  const guarantees = [
    {
      key: "source-goal-mastery",
      label: "Every scene links goal, source, and mastery",
      pass: sceneRows.every(row => row.checks.filter(check => ["learning-goal", "source-linked", "mastery-linked"].includes(check.key)).every(check => check.pass))
    },
    {
      key: "simulation-scene-coverage",
      label: "Every scene is replayed by simulation",
      pass: sceneRows.every(row => row.simulatedBy.length > 0)
    },
    {
      key: "remediation-targets-trained-signal",
      label: "Every remediation target trains its signal",
      pass: masteryEntries.every(([key, spec]) => {
        const remediation = spec.remediation || {};
        const target = scenes.find(scene => scene.id === remediation.sceneId);
        return target && asArray(target.masteryTags).includes(key);
      })
    },
    {
      key: "ending-coverage",
      label: "Every declared ending is covered",
      pass: endings.every(ending => coveredEndings.has(ending.id))
    },
    {
      key: "comic-scene-coverage",
      label: "Every scene has a comic panel",
      pass: scenes.every(scene => comicPanelSceneIds.has(scene.id))
    }
  ];

  return { guarantees, sceneRows, sourceRows };
}

function summarizeLesson(entry, catalogById, root) {
  const { lesson, globalName, dataPath } = entry;
  const scenes = asArray(lesson.scenes);
  const masteryMap = lesson.masteryMap || {};
  const masteryKeys = Object.keys(masteryMap);
  const endings = asArray(lesson.endings);
  const simulationPaths = asArray(lesson.simulation && lesson.simulation.paths);
  const comicStoryboard = lesson.comicStoryboard || null;
  const comicPanels = asArray(comicStoryboard && comicStoryboard.panels);
  const sceneById = new Map(scenes.map(scene => [scene.id, scene]));
  const sourceTitles = new Set(asArray(lesson.sourceNotes).map(note => note.title));
  const issues = [];

  const catalogEntry = catalogById.get(lesson.id);
  if (!catalogEntry) issues.push("missing catalog entry");
  if (lesson.qualityTier === "gold") {
    if (!masteryKeys.length) issues.push("gold lesson missing masteryMap");
    if (!simulationPaths.length) issues.push("gold lesson missing simulation.paths");
    if (endings.length && !simulationPaths.length) issues.push("gold lesson endings are not simulated");
    if (!comicStoryboard || typeof comicStoryboard !== "object" || Array.isArray(comicStoryboard)) {
      issues.push("gold lesson missing comicStoryboard");
    } else {
      const panelSceneIds = new Set();
      if (!comicStoryboard.style) issues.push("comicStoryboard missing style");
      if (!comicPanels.length) issues.push("comicStoryboard missing panels");
      comicPanels.forEach(panel => {
        if (!panel.sceneId || !sceneById.has(panel.sceneId)) issues.push(`comic panel ${panel.id || "unknown"} has invalid sceneId`);
        if (panel.sceneId && panelSceneIds.has(panel.sceneId)) issues.push(`comic panel duplicate sceneId ${panel.sceneId}`);
        if (panel.sceneId) panelSceneIds.add(panel.sceneId);
        if (!panel.prompt) issues.push(`comic panel ${panel.id || panel.sceneId || "unknown"} missing prompt`);
        if (!panel.alt) issues.push(`comic panel ${panel.id || panel.sceneId || "unknown"} missing alt`);
        asArray(panel.sourceRefs).forEach(ref => {
          if (!sourceTitles.has(ref)) issues.push(`comic panel ${panel.id || panel.sceneId || "unknown"} references unknown source ${ref}`);
        });
        asArray(panel.masteryTags).forEach(tag => {
          if (!masteryMap[tag]) issues.push(`comic panel ${panel.id || panel.sceneId || "unknown"} references unknown mastery ${tag}`);
        });
      });
      scenes.forEach(scene => {
        if (!panelSceneIds.has(scene.id)) issues.push(`${scene.id} missing comic panel`);
      });
    }

    masteryKeys.forEach(key => {
      const spec = masteryMap[key] || {};
      const remediation = spec.remediation || {};
      if (!remediation.sceneId || !sceneById.has(remediation.sceneId)) issues.push(`mastery ${key} has invalid remediation scene`);
      const remediationScene = sceneById.get(remediation.sceneId);
      if (remediationScene && !sceneTrainsTag(remediationScene, key)) {
        issues.push(`mastery ${key} remediation scene does not train the signal`);
      }
      if (!scenes.some(scene => sceneTrainsTag(scene, key))) {
        issues.push(`mastery ${key} is not attached to any scene`);
      }
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
      if (!simulationPathsForScene(scene.id, simulationPaths).length) {
        issues.push(`${scene.id} is not covered by any simulation path`);
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
  const evidenceMatrix = lesson.qualityTier === "gold"
    ? buildEvidenceMatrix(lesson, scenes, masteryMap, sourceTitles, simulationPaths, endings)
    : { guarantees: [], sceneRows: [], sourceRows: [] };
  const audioReport = validateLessonAudio(path.join(root, path.dirname(dataPath)), {});
  audioReport.issues.forEach(audioIssue => issues.push(`audio: ${audioIssue}`));
  audioReport.invalid.forEach(entry => issues.push(`audio ${entry.utteranceId}: ${entry.problems.join("; ")}`));

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
      comicPanels: comicPanels.length,
      comicAssets: comicPanels.filter(panel => fs.existsSync(assetPathForPanel(root, dataPath, panel.assetPath))).length,
      endings: endings.length,
      simulationPaths: simulationPaths.length,
      simulatedAttempts: simulationPaths.reduce((sum, pathSpec) => sum + attemptCountForPath(lesson, pathSpec), 0),
      audioRequired: audioReport.required,
      audioValid: audioReport.valid,
      audioGenerated: audioReport.generatedClips,
      audioAssetBytes: audioReport.assetBytes,
      audioOrphans: audioReport.orphans.length
    },
    audio: {
      configured: Boolean(lesson.audio),
      publicationStatus: audioReport.publicationStatus,
      coveragePercent: audioReport.coveragePercent,
      required: audioReport.required,
      valid: audioReport.valid,
      missing: audioReport.missing,
      stale: audioReport.stale,
      invalid: audioReport.invalid.map(entry => entry.utteranceId),
      orphans: audioReport.orphans,
      humanReviewApproved: audioReport.humanReviewApproved,
      validationStatus: audioReport.validationStatus,
      generatedClips: audioReport.generatedClips,
      assetFiles: audioReport.assetFiles,
      assetBytes: audioReport.assetBytes,
      averageAssetBytes: audioReport.averageAssetBytes,
      voices: audioReport.voices,
      configuredVoices: audioReport.configuredVoices,
      formats: audioReport.formats,
      validFormats: audioReport.validFormats,
      mimeTypes: audioReport.mimeTypes,
      providers: audioReport.providers,
      models: audioReport.models,
      configuredProvider: audioReport.configuredProvider,
      configuredModel: audioReport.configuredModel,
      configuredFormat: audioReport.configuredFormat,
      configuredVoiceProfile: audioReport.configuredVoiceProfile,
      loudnessRangeDb: audioReport.loudnessRangeDb,
      lastGeneratedAt: audioReport.lastGeneratedAt,
      manifestHash: audioReport.manifestHash,
      notes: audioReport.warnings
    },
    masterySignals: masteryKeys.map(key => ({
      key,
      label: masteryMap[key].label || key,
      competencyId: masteryMap[key].competencyId || "",
      remediationSceneId: masteryMap[key].remediation && masteryMap[key].remediation.sceneId || "",
      sourceRefs: asArray(masteryMap[key].sourceRefs)
    })),
    sourceNotes: asArray(lesson.sourceNotes).map(note => ({
      title: note.title,
      url: note.url,
      supports: asArray(note.supports)
    })),
    comicStoryboard: comicStoryboard ? {
      style: comicStoryboard.style || "",
      aspectRatio: comicStoryboard.aspectRatio || "",
      imageSize: comicStoryboard.imageSize || "",
      panels: comicPanels.map(panel => ({
        id: panel.id,
        sceneId: panel.sceneId,
        assetPath: panel.assetPath || "",
        assetExists: fs.existsSync(assetPathForPanel(root, dataPath, panel.assetPath)),
        alt: panel.alt || "",
        prompt: panel.prompt || "",
        sourceRefs: asArray(panel.sourceRefs),
        masteryTags: asArray(panel.masteryTags),
        mustInclude: asArray(panel.mustInclude),
        avoid: asArray(panel.avoid)
      }))
    } : null,
    evidenceMatrix,
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

function buildQualityReport(options = {}) {
  const root = reportRoot(options);
  const catalog = loadCatalog(root);
  const catalogById = new Map(asArray(catalog && catalog.trainers).map(trainer => [trainer.id, trainer]));
  const lessons = findLessonDataFiles(root)
    .map(relPath => loadLesson(root, relPath))
    .filter(Boolean)
    .map(entry => summarizeLesson(entry, catalogById, root))
    .sort((a, b) => a.id.localeCompare(b.id));

  const totals = lessons.reduce((acc, lesson) => {
    acc.lessons += 1;
    if (lesson.qualityTier === "gold") acc.goldLessons += 1;
    acc.scenes += lesson.counts.scenes;
    acc.masterySignals += lesson.counts.masterySignals;
    acc.comicPanels += lesson.counts.comicPanels;
    acc.comicAssets += lesson.counts.comicAssets;
    acc.simulationPaths += lesson.counts.simulationPaths;
    acc.simulatedAttempts += lesson.counts.simulatedAttempts;
    acc.endings += lesson.counts.endings;
    acc.evidenceRows += lesson.evidenceMatrix.sceneRows.length;
    if (lesson.audio.configured) acc.audioConfiguredLessons += 1;
    if (lesson.audio.publicationStatus === "published") acc.audioPublishedLessons += 1;
    acc.audioRequired += lesson.audio.required;
    acc.audioValid += lesson.audio.valid;
    acc.audioGenerated += lesson.audio.generatedClips;
    acc.audioAssetFiles += lesson.audio.assetFiles;
    acc.audioAssetBytes += lesson.audio.assetBytes;
    acc.audioVoices = unique(acc.audioVoices.concat(lesson.audio.voices));
    acc.audioConfiguredVoices = unique(acc.audioConfiguredVoices.concat(lesson.audio.configuredVoices));
    acc.audioFormats = unique(acc.audioFormats.concat(lesson.audio.formats));
    acc.audioProviders = unique(acc.audioProviders.concat(lesson.audio.providers));
    acc.audioOrphans += lesson.audio.orphans.length;
    if (lesson.audio.humanReviewApproved) acc.audioHumanReviewedLessons += 1;
    acc.issues += lesson.issues.length;
    return acc;
  }, {
    lessons: 0,
    goldLessons: 0,
    scenes: 0,
    masterySignals: 0,
    comicPanels: 0,
    comicAssets: 0,
    simulationPaths: 0,
    simulatedAttempts: 0,
    endings: 0,
    evidenceRows: 0,
    audioConfiguredLessons: 0,
    audioPublishedLessons: 0,
    audioHumanReviewedLessons: 0,
    audioRequired: 0,
    audioValid: 0,
    audioGenerated: 0,
    audioAssetFiles: 0,
    audioAssetBytes: 0,
    audioVoices: [],
    audioConfiguredVoices: [],
    audioFormats: [],
    audioProviders: [],
    audioOrphans: 0,
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

function writeQualityReport(outPath, options = {}) {
  const root = reportRoot(options);
  const report = buildQualityReport({ root });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  if (report.status !== "pass") {
    console.error(`quality report failed with ${report.totals.issues} issue(s)`);
    report.lessons.forEach(lesson => {
      lesson.issues.forEach(issue => console.error(`- ${lesson.id}: ${issue}`));
    });
    process.exit(1);
  }
  console.log(`quality report built: ${displayRel(outPath, root)} (${report.totals.goldLessons} gold lesson(s), ${report.totals.simulationPaths} path(s))`);
  return report;
}

function main() {
  const out = argValue("--out") || path.join(repoRoot, ".dist", "pages", "reports", "quality.json");
  const root = argValue("--root") || repoRoot;
  writeQualityReport(path.resolve(repoRoot, out), { root });
}

if (require.main === module) main();

module.exports = {
  buildQualityReport,
  writeQualityReport
};

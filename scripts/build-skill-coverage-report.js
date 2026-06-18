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

function hasFlag(name) {
  return process.argv.includes(name);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
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

function findLessonDataFiles(root) {
  const lessonsRoot = path.join(root, "lessons");
  if (!fs.existsSync(lessonsRoot)) return [];
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

function graphRows(definitions) {
  const rows = [];
  definitions.forEach(def => {
    asArray(def.tags).forEach(tag => {
      rows.push({
        tag,
        competencyId: def.id,
        competencyLabel: def.label || def.id
      });
    });
  });
  return rows;
}

function duplicateGraphTags(rows) {
  const seen = new Map();
  rows.forEach(row => {
    if (!seen.has(row.tag)) seen.set(row.tag, []);
    seen.get(row.tag).push(row.competencyId);
  });
  return [...seen.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([tag, ids]) => ({ tag, competencyIds: unique(ids) }));
}

function sceneTrainsTag(scene, tag) {
  if (asArray(scene.masteryTags).includes(tag)) return true;
  return asArray(scene.options).some(option => asArray(option.weakTags).includes(tag));
}

function sceneIdsForTag(scenes, tag) {
  return scenes
    .filter(scene => sceneTrainsTag(scene, tag))
    .map(scene => scene.id)
    .filter(Boolean)
    .sort();
}

function simulationPathIdsForScenes(simulationPaths, sceneIds) {
  const wanted = new Set(sceneIds);
  return simulationPaths
    .filter(pathSpec => asArray(pathSpec.actions).some(action => wanted.has(action.sceneId)))
    .map(pathSpec => pathSpec.id)
    .filter(Boolean)
    .sort();
}

function catalogById(catalog) {
  return new Map(asArray(catalog && catalog.trainers).map(trainer => [trainer.id, trainer]));
}

function summarizeGoldLesson(entry, catalogIndex, graph, knownCompetencies) {
  const lesson = entry.lesson;
  const scenes = asArray(lesson.scenes);
  const simulationPaths = asArray(lesson.simulation && lesson.simulation.paths);
  const masteryMap = lesson.masteryMap || {};
  const masteryKeys = Object.keys(masteryMap).sort();
  const sceneMasteryTags = unique(scenes.flatMap(scene => asArray(scene.masteryTags)));
  const issues = [];

  if (!catalogIndex.has(lesson.id)) issues.push("gold lesson is not listed in catalog");

  sceneMasteryTags.forEach(tag => {
    if (!masteryMap[tag]) issues.push(`scene declares mastery tag ${tag} that is missing from masteryMap`);
  });

  const signals = masteryKeys.map(tag => {
    const spec = masteryMap[tag] || {};
    const graphCompetencyId = graph.competencyIdForTag(tag);
    const specCompetencyId = spec.competencyId || "";
    const sceneIds = sceneIdsForTag(scenes, tag);
    const simulationPathIds = simulationPathIdsForScenes(simulationPaths, sceneIds);
    const remediation = spec.remediation || {};
    const remediationScene = scenes.find(scene => scene.id === remediation.sceneId);
    const signalIssues = [];

    if (!specCompetencyId) signalIssues.push("missing competencyId");
    if (specCompetencyId && !knownCompetencies.has(specCompetencyId)) signalIssues.push(`unknown competencyId ${specCompetencyId}`);
    if (!graphCompetencyId) signalIssues.push("not declared in competency graph");
    if (graphCompetencyId && specCompetencyId && graphCompetencyId !== specCompetencyId) {
      signalIssues.push(`competency mismatch: masteryMap=${specCompetencyId}, graph=${graphCompetencyId}`);
    }
    if (!sceneIds.length) signalIssues.push("not attached to any scene");
    if (!simulationPathIds.length) signalIssues.push("not covered by simulation paths");
    if (!remediation.sceneId) {
      signalIssues.push("missing remediation scene");
    } else if (!remediationScene) {
      signalIssues.push(`remediation scene ${remediation.sceneId} does not exist`);
    } else if (!sceneTrainsTag(remediationScene, tag)) {
      signalIssues.push(`remediation scene ${remediation.sceneId} does not train the signal`);
    }

    signalIssues.forEach(issue => issues.push(`${tag}: ${issue}`));

    return {
      tag,
      label: spec.label || tag,
      evidence: spec.evidence || "",
      competencyId: specCompetencyId,
      graphCompetencyId,
      sceneIds,
      sceneCount: sceneIds.length,
      simulationPathIds,
      simulationPathCount: simulationPathIds.length,
      remediationSceneId: remediation.sceneId || "",
      sourceRefs: asArray(spec.sourceRefs),
      status: signalIssues.length ? "fail" : "pass",
      issues: signalIssues
    };
  });

  return {
    id: lesson.id,
    title: lesson.title || lesson.id,
    level: lesson.level || "",
    qualityTier: lesson.qualityTier || "standard",
    dataPath: entry.dataPath,
    globalName: entry.globalName,
    catalog: catalogIndex.has(lesson.id),
    status: issues.length ? "fail" : "pass",
    issues,
    counts: {
      scenes: scenes.length,
      sceneMasteryTags: sceneMasteryTags.length,
      masterySignals: signals.length,
      competencies: unique(signals.map(signal => signal.competencyId)).length,
      simulationPaths: simulationPaths.length
    },
    sceneMasteryTags,
    signals
  };
}

function summarizeCompetencies(definitions, graphTagRows, lessonRows) {
  const signals = lessonRows.flatMap(lesson => lesson.signals.map(signal => ({
    ...signal,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    dataPath: lesson.dataPath
  })));
  const signalTags = new Set(signals.map(signal => signal.tag));

  return definitions.map(def => {
    const graphTags = asArray(def.tags).slice().sort();
    const competencySignals = signals
      .filter(signal => signal.competencyId === def.id || signal.graphCompetencyId === def.id)
      .sort((a, b) => a.tag.localeCompare(b.tag) || a.lessonId.localeCompare(b.lessonId));
    const activeTags = unique(competencySignals.map(signal => signal.tag));
    return {
      id: def.id,
      label: def.label || def.id,
      copy: def.copy || "",
      status: competencySignals.length ? "covered" : "empty",
      graphTags,
      coveredGraphTags: graphTags.filter(tag => signalTags.has(tag)),
      uncoveredGraphTags: graphTags.filter(tag => !signalTags.has(tag)),
      activeSignalTags: activeTags,
      signalCount: competencySignals.length,
      lessonCount: unique(competencySignals.map(signal => signal.lessonId)).length,
      sceneCount: competencySignals.reduce((sum, signal) => sum + signal.sceneCount, 0),
      simulationPathCount: unique(competencySignals.flatMap(signal => signal.simulationPathIds)).length,
      signals: competencySignals.map(signal => ({
        tag: signal.tag,
        label: signal.label,
        lessonId: signal.lessonId,
        sceneIds: signal.sceneIds,
        simulationPathIds: signal.simulationPathIds,
        status: signal.status
      }))
    };
  }).sort((a, b) => a.id.localeCompare(b.id));
}

function buildSkillCoverageReport(options = {}) {
  const root = reportRoot(options);
  const graph = loadWindowScript(root, "shared/plata-competencies.js").PlataCompetencies;
  const catalog = loadWindowScript(root, "shared/plata-catalog.js").PlataCatalog;
  const definitions = graph.definitions();
  const knownCompetencies = new Set(definitions.map(def => def.id));
  const graphTagRows = graphRows(definitions);
  const duplicateTags = duplicateGraphTags(graphTagRows);
  const catalogIndex = catalogById(catalog);
  const lessons = findLessonDataFiles(root)
    .map(relPath => loadLesson(root, relPath))
    .filter(Boolean)
    .filter(entry => entry.lesson && entry.lesson.qualityTier === "gold")
    .map(entry => summarizeGoldLesson(entry, catalogIndex, graph, knownCompetencies))
    .sort((a, b) => a.id.localeCompare(b.id));
  const competencies = summarizeCompetencies(definitions, graphTagRows, lessons);
  const issues = [];
  const warnings = [];

  duplicateTags.forEach(item => {
    issues.push(`competency graph tag ${item.tag} is declared by multiple competencies: ${item.competencyIds.join(", ")}`);
  });

  definitions.forEach(def => {
    if (!def.id) issues.push("competency definition is missing id");
    if (!def.label) issues.push(`competency ${def.id || "(missing id)"} is missing label`);
    if (!asArray(def.tags).length) issues.push(`competency ${def.id || "(missing id)"} has no graph tags`);
  });

  lessons.forEach(lesson => {
    lesson.issues.forEach(issue => issues.push(`${lesson.id}: ${issue}`));
  });

  competencies.forEach(competency => {
    if (!competency.signalCount) issues.push(`competency ${competency.id} has no gold mastery signals`);
    competency.uncoveredGraphTags.forEach(tag => {
      warnings.push(`competency ${competency.id} graph tag ${tag} has no gold mastery signal yet`);
    });
  });

  const allGraphTags = unique(graphTagRows.map(row => row.tag));
  const allSignalTags = unique(lessons.flatMap(lesson => lesson.signals.map(signal => signal.tag)));
  const coveredGraphTags = allGraphTags.filter(tag => allSignalTags.includes(tag));
  const uncoveredGraphTags = allGraphTags.filter(tag => !allSignalTags.includes(tag));
  const guarantees = [
    {
      key: "graph-tags-unique",
      label: "Competency graph tags are unique",
      pass: duplicateTags.length === 0
    },
    {
      key: "gold-signals-declared-in-graph",
      label: "Every gold mastery signal is declared in the competency graph",
      pass: lessons.every(lesson => lesson.signals.every(signal => Boolean(signal.graphCompetencyId)))
    },
    {
      key: "gold-signal-competency-match",
      label: "Every gold mastery signal uses the competency chosen by the graph",
      pass: lessons.every(lesson => lesson.signals.every(signal => !signal.graphCompetencyId || signal.graphCompetencyId === signal.competencyId))
    },
    {
      key: "gold-signals-scene-covered",
      label: "Every gold mastery signal is attached to at least one scene",
      pass: lessons.every(lesson => lesson.signals.every(signal => signal.sceneCount > 0))
    },
    {
      key: "gold-signals-simulated",
      label: "Every gold mastery signal is exercised by simulation paths",
      pass: lessons.every(lesson => lesson.signals.every(signal => signal.simulationPathCount > 0))
    },
    {
      key: "root-competencies-covered",
      label: "Every root competency has at least one gold mastery signal",
      pass: competencies.every(competency => competency.signalCount > 0)
    }
  ];

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: issues.length ? "fail" : "pass",
    totals: {
      goldLessons: lessons.length,
      rootCompetencies: definitions.length,
      graphTags: allGraphTags.length,
      coveredGraphTags: coveredGraphTags.length,
      uncoveredGraphTags: uncoveredGraphTags.length,
      goldMasterySignals: allSignalTags.length,
      lessonSignalRows: lessons.reduce((sum, lesson) => sum + lesson.signals.length, 0),
      duplicateGraphTags: duplicateTags.length,
      issues: issues.length,
      warnings: warnings.length
    },
    guarantees,
    issues,
    warnings,
    duplicateGraphTags: duplicateTags,
    competencies,
    lessons
  };
}

function formatSkillCoverageReport(report) {
  const lines = [
    "Skill Graph Coverage Report",
    `status: ${report.status}`,
    `gold lessons: ${report.totals.goldLessons}`,
    `root competencies: ${report.totals.rootCompetencies}`,
    `gold mastery signals: ${report.totals.goldMasterySignals}`,
    `graph tags: ${report.totals.graphTags} (${report.totals.coveredGraphTags} covered, ${report.totals.uncoveredGraphTags} planned)`,
    "",
    "Competencies:"
  ];
  report.competencies.forEach(competency => {
    const planned = competency.uncoveredGraphTags.length ? `; planned: ${competency.uncoveredGraphTags.join(", ")}` : "";
    lines.push(`- ${competency.id}: ${competency.signalCount} signal(s), ${competency.lessonCount} lesson(s), ${competency.sceneCount} scene(s)${planned}`);
    competency.signals.forEach(signal => {
      lines.push(`  - ${signal.tag} (${signal.lessonId}; scenes: ${signal.sceneIds.join(", ") || "none"})`);
    });
  });
  lines.push("", "Issues:");
  if (report.issues.length) report.issues.forEach(issue => lines.push(`- ${issue}`));
  else lines.push("none");
  lines.push("", "Warnings:");
  if (report.warnings.length) report.warnings.forEach(warning => lines.push(`- ${warning}`));
  else lines.push("none");
  return lines.join("\n");
}

function writeSkillCoverageReport(outPath, options = {}) {
  const root = reportRoot(options);
  const report = buildSkillCoverageReport({ root });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  if (options.text) console.log(formatSkillCoverageReport(report));
  if (report.status !== "pass") {
    console.error(`skill coverage report failed with ${report.totals.issues} issue(s)`);
    report.issues.forEach(issue => console.error(`- ${issue}`));
    process.exit(1);
  }
  if (!options.text) {
    console.log(`skill coverage report built: ${displayRel(outPath, root)} (${report.totals.rootCompetencies} root skill(s), ${report.totals.goldMasterySignals} signal(s))`);
  }
  return report;
}

function main() {
  const out = argValue("--out") || path.join(repoRoot, ".dist", "skill-coverage.json");
  const root = argValue("--root") || repoRoot;
  writeSkillCoverageReport(path.resolve(repoRoot, out), { root, text: hasFlag("--text") });
}

if (require.main === module) main();

module.exports = {
  buildSkillCoverageReport,
  formatSkillCoverageReport,
  writeSkillCoverageReport
};

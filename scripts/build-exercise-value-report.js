#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const requiredArchetypes = [
  "consequence-exercise",
  "near-miss",
  "repair-ladder",
  "same-intent-different-channel",
  "memory-backed-recurrence",
  "explain-your-choice"
];

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function sourceRoot(options = {}) {
  if (typeof options === "string") return path.resolve(options);
  return path.resolve(options.root || repoRoot);
}

function displayRel(file, root = repoRoot) {
  const absolute = path.resolve(file);
  const workspaceRel = path.relative(repoRoot, absolute);
  if (!workspaceRel.startsWith("..") && !path.isAbsolute(workspaceRel)) return workspaceRel.replaceAll(path.sep, "/");
  return path.relative(root, absolute).replaceAll(path.sep, "/");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function findLessonDataFiles(root) {
  const lessonsRoot = path.join(root, "lessons");
  return fs.readdirSync(lessonsRoot)
    .filter(dir => fs.statSync(path.join(lessonsRoot, dir)).isDirectory())
    .map(dir => path.join("lessons", dir, "data.js").replaceAll(path.sep, "/"))
    .filter(relPath => fs.existsSync(path.join(root, relPath)));
}

function loadLesson(root, relPath) {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, relPath), "utf8"), context, { filename: relPath });
  const key = Object.keys(context.window).find(name => name.startsWith("PLATA_LESSON_"));
  return key ? context.window[key] : null;
}

function check(key, label, pass, issue) {
  return { key, label, pass: !!pass, issue: pass ? "" : issue };
}

function summarizeOption(option) {
  return {
    id: option.id || "",
    channel: option.channel || "",
    correct: option.correct === true,
    nearMiss: option.nearMiss === true,
    grammarStatus: option.grammarStatus || "",
    pragmaticStatus: option.pragmaticStatus || "",
    diagnostic: option.diagnostic || "",
    hasConsequence: nonEmpty(option.consequence),
    repairSteps: asArray(option.repairLadder).length,
    reasonOptions: asArray(option.reasonOptions).length
  };
}

function flagshipSceneRow(lesson, dataPath, scene) {
  const archetypes = asArray(scene.archetypes);
  const options = asArray(scene.options);
  const correctOptions = options.filter(option => option.correct === true);
  const nearMisses = options.filter(option => option.nearMiss === true && option.correct === false && option.grammarStatus === "grammatical");
  const checks = [
    check(
      "not-flat-quiz",
      "Uses a dedicated flagship-chain archetype with context",
      scene.type === "flagship-chain" && nonEmpty(scene.intent) && asArray(scene.channelVersions).length >= 3,
      "scene can collapse back into a flat quiz without intent and channel context"
    ),
    check(
      "all-archetypes-present",
      "Declares every flagship exercise archetype",
      requiredArchetypes.every(archetype => archetypes.includes(archetype)),
      "missing one or more flagship archetype declarations"
    ),
    check(
      "consequence-feedback",
      "Every option explains social consequence",
      options.length >= 3 && options.every(option => nonEmpty(option.consequence)),
      "one or more options do not explain consequence"
    ),
    check(
      "grammatical-near-miss",
      "Contains a grammatical but pragmatically bad near miss",
      nearMisses.length >= 1,
      "no incorrect grammatical near-miss option"
    ),
    check(
      "repair-ladder",
      "Every option carries a raw -> safer -> ready repair ladder",
      options.length >= 3 && options.every(option => asArray(option.repairLadder).length >= 3),
      "one or more options do not carry a three-step repair ladder"
    ),
    check(
      "same-intent-channel-transfer",
      "Shows the same intent across channels",
      asArray(scene.channelVersions).length >= 3,
      "fewer than three channel versions"
    ),
    check(
      "memory-backed-recurrence",
      "Names the recurring learner signal",
      scene.memoryCue && nonEmpty(scene.memoryCue.signal) && nonEmpty(scene.memoryCue.copy),
      "missing memory-backed recurrence cue"
    ),
    check(
      "explain-your-choice",
      "A correct answer requires reason evidence",
      correctOptions.some(option => asArray(option.reasonOptions).filter(reason => reason.correct === true).length === 1),
      "correct option does not require a reason choice"
    ),
    check(
      "diagnostic-signals",
      "Every option writes a diagnostic key",
      options.length >= 3 && options.every(option => nonEmpty(option.diagnostic)),
      "one or more options lack diagnostic keys"
    ),
    check(
      "mastery-linked",
      "Scene writes durable mastery tags",
      asArray(scene.masteryTags).length >= 1,
      "scene lacks mastery tags"
    )
  ];

  return {
    lessonId: lesson.id,
    lessonTitle: lesson.title || lesson.id,
    dataPath,
    sceneId: scene.id,
    title: scene.title || scene.id,
    learningGoal: scene.learningGoal || "",
    userValue: "Shows why plateau practice must handle context, social consequence, repair, and evidence instead of only correctness.",
    intent: scene.intent || "",
    memoryCue: scene.memoryCue || null,
    archetypes,
    channels: asArray(scene.channelVersions).map(channel => ({
      id: channel.id || "",
      label: channel.label || "",
      sample: channel.sample || "",
      risk: channel.risk || ""
    })),
    options: options.map(summarizeOption),
    checks,
    status: checks.every(item => item.pass) ? "pass" : "fail",
    issues: checks.filter(item => !item.pass).map(item => item.issue)
  };
}

function buildExerciseValueReport(options = {}) {
  const root = sourceRoot(options);
  const issues = [];
  const lessons = [];
  const files = findLessonDataFiles(root);
  files.forEach(dataPath => {
    const lesson = loadLesson(root, dataPath);
    if (!lesson || !Array.isArray(lesson.scenes)) return;
    const cloned = JSON.parse(JSON.stringify(lesson));
    if (typeof options.lessonMutator === "function") options.lessonMutator(cloned, dataPath);
    const flagshipChains = asArray(cloned.scenes)
      .filter(scene => scene.type === "flagship-chain")
      .map(scene => flagshipSceneRow(cloned, dataPath, scene));
    if (flagshipChains.length) {
      lessons.push({
        id: cloned.id,
        title: cloned.title || cloned.id,
        dataPath,
        flagshipChains
      });
    }
  });

  const chains = lessons.flatMap(lesson => lesson.flagshipChains);
  chains.forEach(row => {
    row.issues.forEach(issue => issues.push(`${row.lessonId}::${row.sceneId}: ${issue}`));
  });
  if (chains.length === 0) issues.push("no flagship-chain exercises found");

  const archetypeCoverage = requiredArchetypes.map(archetype => ({
    id: archetype,
    scenes: chains.filter(row => row.archetypes.includes(archetype)).map(row => `${row.lessonId}::${row.sceneId}`),
    pass: chains.some(row => row.archetypes.includes(archetype))
  }));
  archetypeCoverage.filter(row => !row.pass).forEach(row => issues.push(`archetype ${row.id}: no scene coverage`));

  const guarantees = [
    {
      key: "flagship-chain-present",
      label: "At least one lesson demonstrates a radical exercise chain",
      pass: chains.length >= 1
    },
    {
      key: "all-archetypes-covered",
      label: "The flagship chain covers consequence, near miss, repair ladder, channel transfer, memory recurrence, and explain-your-choice",
      pass: archetypeCoverage.every(row => row.pass)
    },
    {
      key: "not-flat-quiz",
      label: "Flagship chains cannot pass as ordinary context-free quizzes",
      pass: chains.length > 0 && chains.every(row => row.checks.find(item => item.key === "not-flat-quiz").pass)
    },
    {
      key: "near-miss-and-repair-proven",
      label: "Grammatical near misses are paired with repair ladders and consequences",
      pass: chains.length > 0 && chains.every(row => (
        row.checks.find(item => item.key === "grammatical-near-miss").pass
        && row.checks.find(item => item.key === "repair-ladder").pass
        && row.checks.find(item => item.key === "consequence-feedback").pass
      ))
    },
    {
      key: "memory-and-evidence-proven",
      label: "At least one chain names a recurring memory signal and requires reason evidence",
      pass: chains.length > 0 && chains.every(row => (
        row.checks.find(item => item.key === "memory-backed-recurrence").pass
        && row.checks.find(item => item.key === "explain-your-choice").pass
      ))
    }
  ];
  guarantees.filter(item => !item.pass).forEach(item => issues.push(`guarantee failed: ${item.key}`));

  const totals = {
    lessons: lessons.length,
    flagshipChains: chains.length,
    archetypesCovered: archetypeCoverage.filter(row => row.pass).length,
    channelVersions: chains.reduce((sum, row) => sum + row.channels.length, 0),
    nearMisses: chains.reduce((sum, row) => sum + row.options.filter(option => option.nearMiss).length, 0),
    repairLadders: chains.reduce((sum, row) => sum + row.options.filter(option => option.repairSteps >= 3).length, 0),
    explainChoiceScenes: chains.filter(row => row.checks.some(item => item.key === "explain-your-choice" && item.pass)).length,
    issues: issues.length
  };

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: issues.length ? "fail" : "pass",
    headline: issues.length ? "Exercise value proof needs attention" : "Flagship exercises prove value beyond ordinary quiz correctness.",
    requiredArchetypes,
    totals,
    guarantees,
    archetypeCoverage,
    lessons,
    issues
  };
}

function formatExerciseValueReport(report) {
  const lines = [
    "Exercise Value Report",
    `status: ${report.status}`,
    `flagship chains: ${report.totals.flagshipChains}`,
    `archetypes covered: ${report.totals.archetypesCovered}/${report.requiredArchetypes.length}`,
    `near misses: ${report.totals.nearMisses}`,
    `repair ladders: ${report.totals.repairLadders}`,
    "",
    "Guarantees:"
  ];
  report.guarantees.forEach(item => {
    lines.push(`- ${item.pass ? "pass" : "fail"} ${item.key}: ${item.label}`);
  });
  lines.push("", "Flagship chains:");
  report.lessons.forEach(lesson => {
    lesson.flagshipChains.forEach(chain => lines.push(`- ${chain.status} ${lesson.id}::${chain.sceneId} (${chain.archetypes.length} archetype(s))`));
  });
  lines.push("", "Issues:");
  if (report.issues.length) report.issues.forEach(issue => lines.push(`- ${issue}`));
  else lines.push("none");
  return lines.join("\n");
}

function writeExerciseValueReport(outPath, options = {}) {
  const root = sourceRoot(options);
  const report = buildExerciseValueReport({ root });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  if (options.text) console.log(formatExerciseValueReport(report));
  if (report.status !== "pass") {
    console.error(`exercise value report failed with ${report.totals.issues} issue(s)`);
    report.issues.forEach(issue => console.error(`- ${issue}`));
    process.exit(1);
  }
  if (!options.text) {
    console.log(`exercise value report built: ${displayRel(outPath, root)} (${report.totals.flagshipChains} flagship chain(s))`);
  }
  return report;
}

function main() {
  const root = argValue("--root") || repoRoot;
  const out = argValue("--out") || path.join(repoRoot, ".dist", "exercise-value.json");
  const report = buildExerciseValueReport({ root });
  if (hasFlag("--json")) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    if (report.status !== "pass") process.exit(1);
    return;
  }
  writeExerciseValueReport(path.resolve(repoRoot, out), { root, text: hasFlag("--text") });
}

if (require.main === module) main();

module.exports = {
  buildExerciseValueReport,
  formatExerciseValueReport,
  writeExerciseValueReport,
  requiredArchetypes
};

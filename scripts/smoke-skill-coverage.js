#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const {
  buildSkillCoverageReport,
  formatSkillCoverageReport
} = require("./build-skill-coverage-report.js");

const repoRoot = path.resolve(__dirname, "..");
const lessonFiles = [
  {
    relPath: "lessons/lesson-b2-radiator/data.js",
    globalName: "PLATA_LESSON_B2_RADIATOR",
    id: "lesson-b2-radiator-register"
  },
  {
    relPath: "lessons/lesson-b2-job-followup/data.js",
    globalName: "PLATA_LESSON_B2_JOB_FOLLOWUP",
    id: "lesson-b2-job-followup"
  }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readWindowScript(file) {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  return context.window;
}

function readLesson(spec) {
  const win = readWindowScript(path.join(repoRoot, spec.relPath));
  return clone(win[spec.globalName]);
}

function writeLesson(root, spec, lesson) {
  const target = path.join(root, spec.relPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `window.${spec.globalName} = ${JSON.stringify(lesson, null, 2)};\n`);
}

function copyBaseRoot(root) {
  fs.mkdirSync(path.join(root, "shared"), { recursive: true });
  ["plata-competencies.js", "plata-catalog.js"].forEach(file => {
    fs.copyFileSync(path.join(repoRoot, "shared", file), path.join(root, "shared", file));
  });
  lessonFiles.forEach(spec => writeLesson(root, spec, readLesson(spec)));
}

function runBaseCoverageSmoke() {
  const report = buildSkillCoverageReport();
  assert(report.status === "pass", `base skill coverage should pass:\n${report.issues.join("\n")}`);
  assert(report.totals.goldLessons >= 2, "coverage should inspect gold lessons");
  assert(report.totals.rootCompetencies >= 5, "coverage should inspect root competencies");
  assert(report.totals.goldMasterySignals >= 10, "coverage should count gold mastery signals");
  assert(report.guarantees.every(item => item.pass), "all base coverage guarantees should pass");

  const agency = report.competencies.find(item => item.id === "agency");
  assert(agency, "agency competency should be reported");
  assert(agency.signalCount >= 3, "agency should include cross-lesson signals");
  assert(agency.lessonCount >= 2, "agency should span multiple gold lessons");
  assert(agency.signals.some(signal => signal.tag === "passive-agency"), "agency should include passive-agency");
  assert(agency.signals.some(signal => signal.tag === "agency-without-pressure"), "agency should include bolig gold lesson signal");
  assert(!agency.uncoveredGraphTags.includes("agency-without-pressure"), "agency-without-pressure should be covered by bolig gold lesson");

  const formatted = formatSkillCoverageReport(report);
  assert(formatted.includes("Skill Graph Coverage Report"), "formatter should include title");
  assert(formatted.includes("graph tags:"), "formatter should include graph tag totals");
  assert(formatted.includes("passive-agency"), "formatter should include signal rows");
  assert(formatted.includes("Issues:\nnone"), "formatter should show empty issue list");
}

function runMutation(spec) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plata-skill-coverage-"));
  try {
    copyBaseRoot(root);
    if (spec.mutateLesson) {
      const lessonSpec = lessonFiles.find(item => item.id === "lesson-b2-radiator-register");
      const lesson = readLesson(lessonSpec);
      spec.mutateLesson(lesson);
      writeLesson(root, lessonSpec, lesson);
    }
    if (spec.mutateGraphSource) {
      const file = path.join(root, "shared", "plata-competencies.js");
      fs.writeFileSync(file, spec.mutateGraphSource(fs.readFileSync(file, "utf8")));
    }

    const report = buildSkillCoverageReport({ root });
    assert(report.status === "fail", `${spec.name}: expected skill coverage report to fail`);
    const issueText = report.issues.join("\n");
    spec.expectedIssues.forEach(expected => {
      assert(issueText.includes(expected), `${spec.name}: missing issue "${expected}"\n${issueText}`);
    });
    console.log(`ok - skill coverage mutation caught: ${spec.name}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runMutations() {
  [
    {
      name: "mastery graph mismatch",
      mutateLesson(lesson) {
        lesson.masteryMap["passive-agency"].competencyId = "stance-reading";
      },
      expectedIssues: ["passive-agency: competency mismatch: masteryMap=stance-reading, graph=agency"]
    },
    {
      name: "lesson signal missing from graph",
      mutateLesson(lesson) {
        lesson.masteryMap["unmapped-live-signal"] = {
          label: "Unmapped live signal",
          evidence: "Mutation-only signal",
          competencyId: "agency",
          sourceRefs: ["Danmarks Domstole - sprog og ansvar"],
          remediation: {
            sceneId: "official-reply-passive",
            cta: "Review unmapped signal",
            action: "Check graph coverage"
          }
        };
        const scene = lesson.scenes.find(item => item.id === "official-reply-passive");
        scene.masteryTags.push("unmapped-live-signal");
      },
      expectedIssues: ["unmapped-live-signal: not declared in competency graph"]
    },
    {
      name: "scene tag missing from mastery map",
      mutateLesson(lesson) {
        const scene = lesson.scenes.find(item => item.id === "official-reply-passive");
        scene.masteryTags.push("scene-only-signal");
      },
      expectedIssues: ["scene declares mastery tag scene-only-signal that is missing from masteryMap"]
    },
    {
      name: "duplicate graph tag",
      mutateGraphSource(source) {
        return source.replace(
          'tags: ["modal-particle-stance", "reply-tone-reading"]',
          'tags: ["modal-particle-stance", "reply-tone-reading", "passive-agency"]'
        );
      },
      expectedIssues: ["competency graph tag passive-agency is declared by multiple competencies"]
    }
  ].forEach(runMutation);
}

function run() {
  runBaseCoverageSmoke();
  runMutations();
  console.log("ok - skill coverage report maps gold signals to root competencies");
  console.log("ok - skill coverage report keeps planned graph gaps visible");
  console.log("ok - skill coverage mutations prove graph/content drift fails CI");
}

run();

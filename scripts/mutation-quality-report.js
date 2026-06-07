#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { buildQualityReport } = require("./build-quality-report.js");

const repoRoot = path.resolve(__dirname, "..");
const lessonRelPath = "lessons/lesson-b2-radiator/data.js";
const lessonGlobal = "PLATA_LESSON_B2_RADIATOR";
const lessonId = "lesson-b2-radiator-register";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readWindowScript(file) {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  return context.window;
}

function readBaseLesson() {
  const win = readWindowScript(path.join(repoRoot, lessonRelPath));
  return JSON.parse(JSON.stringify(win[lessonGlobal]));
}

function writeLesson(root, lesson) {
  const target = path.join(root, lessonRelPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `window.${lessonGlobal} = ${JSON.stringify(lesson, null, 2)};\n`);
}

function copyFixture(root) {
  fs.mkdirSync(path.join(root, "shared"), { recursive: true });
  fs.copyFileSync(
    path.join(repoRoot, "shared", "plata-catalog.js"),
    path.join(root, "shared", "plata-catalog.js")
  );
}

function issuesFor(report) {
  return report.lessons.flatMap(lesson => lesson.issues.map(issue => `${lesson.id}: ${issue}`));
}

function targetLesson(report) {
  const lesson = report.lessons.find(item => item.id === lessonId);
  assert(lesson, "mutated report did not include target lesson");
  return lesson;
}

function guarantee(lesson, key) {
  return (lesson.evidenceMatrix.guarantees || []).find(item => item.key === key);
}

function runMutation(spec) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plata-quality-mutation-"));
  try {
    copyFixture(root);
    const lesson = readBaseLesson();
    spec.mutate(lesson);
    writeLesson(root, lesson);

    const report = buildQualityReport({ root });
    assert(report.status === "fail", `${spec.name}: expected quality report to fail`);
    const issueText = issuesFor(report).join("\n");
    spec.expectedIssues.forEach(expected => {
      assert(issueText.includes(expected), `${spec.name}: missing issue "${expected}"\n${issueText}`);
    });

    const lessonReport = targetLesson(report);
    (spec.expectedFailedGuarantees || []).forEach(key => {
      const item = guarantee(lessonReport, key);
      assert(item, `${spec.name}: missing guarantee ${key}`);
      assert(item.pass === false, `${spec.name}: expected guarantee ${key} to fail`);
    });
    console.log(`ok - mutation caught: ${spec.name}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

[
  {
    name: "unknown scene source",
    mutate(lesson) {
      const scene = lesson.scenes.find(item => item.id === "official-reply-passive");
      scene.sourceRefs = ["Imaginary source"];
    },
    expectedIssues: ["official-reply-passive references unknown source Imaginary source"],
    expectedFailedGuarantees: ["source-goal-mastery"]
  },
  {
    name: "uncovered simulation scene",
    mutate(lesson) {
      lesson.simulation.paths.forEach(pathSpec => {
        pathSpec.actions = pathSpec.actions.filter(action => action.sceneId !== "workplace-understatement");
      });
    },
    expectedIssues: ["workplace-understatement is not covered by any simulation path"],
    expectedFailedGuarantees: ["simulation-scene-coverage"]
  },
  {
    name: "remediation target does not train signal",
    mutate(lesson) {
      lesson.masteryMap["passive-agency"].remediation.sceneId = "group-chat-particles";
    },
    expectedIssues: ["mastery passive-agency remediation scene does not train the signal"],
    expectedFailedGuarantees: ["remediation-targets-trained-signal"]
  },
  {
    name: "completion accept answer fails",
    mutate(lesson) {
      lesson.simulation.completionAnswers["workplace-understatement"].accept = "varme";
    },
    expectedIssues: ["workplace-understatement accept answer fails"]
  },
  {
    name: "duplicate choice diagnostic",
    mutate(lesson) {
      const scene = lesson.scenes.find(item => item.id === "official-reply-passive");
      scene.options[1].diagnostic = scene.options[0].diagnostic;
    },
    expectedIssues: ["official-reply-passive has duplicate choice diagnostics"]
  },
  {
    name: "comic panel references unknown scene",
    mutate(lesson) {
      lesson.comicStoryboard.panels[0].sceneId = "missing-scene";
    },
    expectedIssues: ["comic panel official-reply-passive has invalid sceneId"],
    expectedFailedGuarantees: ["comic-scene-coverage"]
  }
].forEach(runMutation);

console.log("ok - quality report mutation checks prove negative contracts");

#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  buildExerciseValueReport,
  formatExerciseValueReport,
  requiredArchetypes
} = require("./build-exercise-value-report.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runCli(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "build-exercise-value-report.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function firstChain(report) {
  const chains = report.lessons.flatMap(lesson => lesson.flagshipChains);
  assert(chains.length > 0, "exercise value report should include at least one flagship chain");
  return chains[0];
}

function flagshipScene(lesson) {
  return lesson.scenes && lesson.scenes.find(scene => scene.id === "channel-transfer-lab");
}

function runBaseSmoke() {
  const report = buildExerciseValueReport();
  assert(report.status === "pass", `exercise value report should pass:\n${report.issues.join("\n")}`);
  assert(report.totals.flagshipChains >= 1, "exercise value report should count flagship chains");
  assert(report.totals.archetypesCovered === requiredArchetypes.length, "exercise value report should cover every radical archetype");
  assert(report.totals.nearMisses >= 2, "exercise value report should count grammatical near misses");
  assert(report.totals.channelVersions >= 4, "exercise value report should count same-intent channel versions");
  assert(report.totals.repairLadders >= 3, "exercise value report should count repair ladders");
  assert(report.totals.explainChoiceScenes >= 1, "exercise value report should count explain-your-choice scenes");
  assert(report.guarantees.every(guarantee => guarantee.pass), "exercise value guarantees should pass");

  const chain = report.lessons.flatMap(lesson => lesson.flagshipChains).find(c => c.sceneId === "channel-transfer-lab");
  assert(chain && chain.sceneId === "channel-transfer-lab", "B2 radiator flagship chain should be present in the proof rows");
  assert(chain.checks.some(check => check.key === "not-flat-quiz" && check.pass), "flagship chain should prove it is not a flat quiz");
  assert(chain.checks.some(check => check.key === "memory-backed-recurrence" && check.pass), "flagship chain should prove memory-backed recurrence");
  assert(chain.options.some(option => option.nearMiss && option.grammarStatus === "grammatical"), "flagship chain should expose grammatical near misses");

  const formatted = formatExerciseValueReport(report);
  assert(formatted.includes("Exercise Value Report"), "formatter should include title");
  assert(formatted.includes("Issues:\nnone"), "formatter should show empty issues");
}

function runMutationSmoke() {
  const withoutNearMiss = buildExerciseValueReport({
    lessonMutator(lesson) {
      const scene = flagshipScene(lesson);
      if (!scene) return;
      scene.options.forEach(option => {
        option.nearMiss = false;
      });
    }
  });
  assert(withoutNearMiss.status === "fail", "exercise value should fail when near misses disappear");
  assert(withoutNearMiss.issues.some(issue => issue.includes("near-miss")), "exercise value should explain missing near miss");

  const withoutRepair = buildExerciseValueReport({
    lessonMutator(lesson) {
      const scene = flagshipScene(lesson);
      if (scene) scene.options[0].repairLadder = [];
    }
  });
  assert(withoutRepair.status === "fail", "exercise value should fail when repair ladders disappear");
  assert(withoutRepair.issues.some(issue => issue.includes("repair ladder")), "exercise value should explain missing repair ladder");

  const withoutMemory = buildExerciseValueReport({
    lessonMutator(lesson) {
      const scene = flagshipScene(lesson);
      if (scene) delete scene.memoryCue;
    }
  });
  assert(withoutMemory.status === "fail", "exercise value should fail when memory recurrence disappears");
  assert(withoutMemory.issues.some(issue => issue.includes("memory")), "exercise value should explain missing memory cue");

  const withoutChannels = buildExerciseValueReport({
    lessonMutator(lesson) {
      const scene = flagshipScene(lesson);
      if (scene) scene.channelVersions = [];
    }
  });
  assert(withoutChannels.status === "fail", "exercise value should fail when channel transfer disappears");
  assert(withoutChannels.issues.some(issue => issue.includes("channel")), "exercise value should explain missing channels");

  const withoutReasons = buildExerciseValueReport({
    lessonMutator(lesson) {
      const scene = flagshipScene(lesson);
      if (scene) scene.options.find(option => option.correct).reasonOptions = [];
    }
  });
  assert(withoutReasons.status === "fail", "exercise value should fail when explain-your-choice disappears");
  assert(withoutReasons.issues.some(issue => issue.includes("reason") || issue.includes("evidence")), "exercise value should explain missing reason proof");
}

function runCliSmoke() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-exercise-value-"));
  try {
    const out = path.join(tmp, "exercise-value.json");
    const built = runCli(["--out", out]);
    assert(built.status === 0, `CLI build should pass\n${built.stdout}\n${built.stderr}`);
    const report = JSON.parse(fs.readFileSync(out, "utf8"));
    assert(report.status === "pass", "CLI output report should pass");
    assert(report.lessons.some(lesson => lesson.flagshipChains.some(chain => chain.sceneId === "channel-transfer-lab")), "CLI output should include the flagship chain");

    const json = runCli(["--json"]);
    assert(json.status === 0, `CLI JSON should pass\n${json.stdout}\n${json.stderr}`);
    assert(JSON.parse(json.stdout).totals.flagshipChains >= 1, "CLI JSON should include flagship totals");

    const text = runCli(["--text"]);
    assert(text.status === 0, `CLI text should pass\n${text.stdout}\n${text.stderr}`);
    assert(text.stdout.includes("Exercise Value Report"), "CLI text should include report title");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

runBaseSmoke();
runMutationSmoke();
runCliSmoke();

console.log("ok - exercise value report proves radical exercise archetypes");
console.log("ok - exercise value mutations catch flat exercise drift");
console.log("ok - exercise value CLI writes JSON and text artifacts");

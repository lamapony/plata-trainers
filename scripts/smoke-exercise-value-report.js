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

function doctorTransferChain(report) {
  const chain = asArray(report.transferChains).find(item => item.id === "doctor-apotek-skrive-sundhed");
  assert(chain, "doctor apotek → skrive transfer chain should be present");
  return chain;
}

function bojningTrapChain(report) {
  const chain = asArray(report.transferChains).find(item => item.id === "job-followup-bojning-gender-trap");
  assert(chain, "job follow-up → bojning gender trap repair chain should be present");
  return chain;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function runBaseSmoke() {
  const report = buildExerciseValueReport();
  assert(report.status === "pass", `exercise value report should pass:\n${report.issues.join("\n")}`);
  assert(report.totals.flagshipChains >= 2, "exercise value report should count at least two flagship chains");
  assert(report.totals.transferChains >= 2, "exercise value report should count transfer and repair chains");
  assert(report.totals.exerciseChains >= 4, "exercise value report should count flagship and transfer/repair chains together");
  assert(report.totals.archetypesCovered === requiredArchetypes.length, "exercise value report should cover every radical archetype");
  assert(report.totals.nearMisses >= 2, "exercise value report should count grammatical near misses");
  assert(report.totals.channelVersions >= 6, "exercise value report should count same-intent channel versions");
  assert(report.totals.repairLadders >= 4, "exercise value report should count repair ladders");
  assert(report.totals.explainChoiceScenes >= 1, "exercise value report should count explain-your-choice scenes");
  assert(report.guarantees.every(guarantee => guarantee.pass), "exercise value guarantees should pass");

  const chain = report.lessons.flatMap(lesson => lesson.flagshipChains).find(c => c.sceneId === "channel-transfer-lab");
  assert(chain && chain.sceneId === "channel-transfer-lab", "B2 radiator flagship chain should be present in the proof rows");
  assert(chain.checks.some(check => check.key === "not-flat-quiz" && check.pass), "flagship chain should prove it is not a flat quiz");
  assert(chain.checks.some(check => check.key === "memory-backed-recurrence" && check.pass), "flagship chain should prove memory-backed recurrence");
  assert(chain.options.some(option => option.nearMiss && option.grammarStatus === "grammatical"), "flagship chain should expose grammatical near misses");

  const doctorChain = doctorTransferChain(report);
  assert(doctorChain.status === "pass", `doctor transfer chain should pass:\n${doctorChain.issues.join("\n")}`);
  assert(doctorChain.archetypes.includes("same-intent-different-channel"), "doctor transfer chain should declare same-intent-different-channel");
  assert(doctorChain.archetypes.includes("repair-ladder"), "doctor transfer chain should declare repair-ladder");
  assert(doctorChain.missSceneId === "symptom-severity", "doctor transfer chain should cite symptom-severity miss scene");
  assert(doctorChain.signal === "symptom-severity", "doctor transfer chain should preserve symptom-severity signal");
  assert(doctorChain.sceneRepairHref.includes("./lessons/lesson-a2-doctor/"), "doctor transfer chain should link lesson scene repair");
  assert(doctorChain.sceneRepairHref.includes("signal=symptom-severity"), "doctor transfer chain should carry symptom-severity repair signal");
  assert(doctorChain.drillRepairHref.includes("./skrive-drill/"), "doctor transfer chain should link skrive drill");
  assert(doctorChain.drillRepairHref.includes("cat=sundhed"), "doctor transfer chain should open skrive sundhed category");
  assert(doctorChain.drillRepairHref.includes("from=lesson-a2-doctor"), "doctor transfer chain should cite source lesson");
  assert(doctorChain.alternateMisses.some(item => item.signal === "symptom-duration" && item.drillRepairHref.includes("cat=sundhed")), "doctor transfer chain should map symptom-duration to skrive sundhed");
  assert(report.archetypeCoverage.find(row => row.id === "same-intent-different-channel").scenes.includes("doctor-apotek-skrive-sundhed"), "archetype coverage should cite doctor transfer chain");

  const bojningChain = bojningTrapChain(report);
  assert(bojningChain.status === "pass", `bojning trap repair chain should pass:\n${bojningChain.issues.join("\n")}`);
  assert(bojningChain.kind === "repair-chain", "bojning trap chain should declare repair-chain kind");
  assert(bojningChain.archetypes.includes("near-miss"), "bojning trap chain should declare near-miss");
  assert(bojningChain.archetypes.includes("repair-ladder"), "bojning trap chain should declare repair-ladder");
  assert(bojningChain.archetypes.includes("memory-backed-recurrence"), "bojning trap chain should declare memory-backed-recurrence");
  assert(bojningChain.missSceneId === "email-register", "bojning trap chain should cite email-register miss scene");
  assert(bojningChain.missOptionId === "gender-trap", "bojning trap chain should cite gender-trap miss option");
  assert(bojningChain.signal === "common-gender-noun", "bojning trap chain should preserve common-gender-noun signal");
  assert(bojningChain.sceneRepairHref.includes("./lessons/lesson-b2-job-followup/"), "bojning trap chain should link lesson scene repair");
  assert(bojningChain.sceneRepairHref.includes("signal=common-gender-noun"), "bojning trap chain should carry common-gender-noun repair signal");
  assert(bojningChain.drillRepairHref.includes("./bojning-drill/"), "bojning trap chain should link bojning drill");
  assert(bojningChain.drillRepairHref.includes("cat=common-gender"), "bojning trap chain should open common-gender trap category");
  assert(bojningChain.drillRepairHref.includes("from=lesson-b2-job-followup"), "bojning trap chain should cite source lesson");
  assert(bojningChain.alternateMisses.some(item => item.signal === "irregular-plural-noun" && item.drillRepairHref.includes("cat=irregular-plural")), "bojning trap chain should map irregular-plural-noun");
  assert(bojningChain.alternateMisses.some(item => item.signal === "strong-verb-past" && item.drillRepairHref.includes("cat=strong-verb")), "bojning trap chain should map strong-verb-past");
  assert(report.archetypeCoverage.find(row => row.id === "near-miss").scenes.includes("job-followup-bojning-gender-trap"), "archetype coverage should cite bojning trap chain for near-miss");

  const formatted = formatExerciseValueReport(report);
  assert(formatted.includes("Exercise Value Report"), "formatter should include title");
  assert(formatted.includes("Transfer chains:"), "formatter should include transfer chain section");
  assert(formatted.includes("doctor-apotek-skrive-sundhed"), "formatter should include doctor transfer chain");
  assert(formatted.includes("job-followup-bojning-gender-trap"), "formatter should include bojning trap repair chain");
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

  const withoutSkriveDrill = buildExerciseValueReport({
    transferChainMutator(spec) {
      if (spec.id === "doctor-apotek-skrive-sundhed") spec.channelVersions = [];
    }
  });
  assert(withoutSkriveDrill.status === "fail", "exercise value should fail when doctor transfer channels disappear");
  assert(withoutSkriveDrill.issues.some(issue => issue.includes("doctor-apotek-skrive-sundhed") && issue.includes("channel")), "exercise value should explain missing doctor transfer channels");

  const withoutBojningDrill = buildExerciseValueReport({
    transferChainMutator(spec) {
      if (spec.id === "job-followup-bojning-gender-trap") spec.repairLadder = [];
    }
  });
  assert(withoutBojningDrill.status === "fail", "exercise value should fail when bojning trap repair ladder disappears");
  assert(withoutBojningDrill.issues.some(issue => issue.includes("job-followup-bojning-gender-trap") && issue.includes("repair ladder")), "exercise value should explain missing bojning trap repair ladder");
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
    assert(report.transferChains.some(chain => chain.id === "doctor-apotek-skrive-sundhed"), "CLI output should include the doctor transfer chain");
    assert(report.transferChains.some(chain => chain.id === "job-followup-bojning-gender-trap"), "CLI output should include the bojning trap repair chain");

    const json = runCli(["--json"]);
    assert(json.status === 0, `CLI JSON should pass\n${json.stdout}\n${json.stderr}`);
    assert(JSON.parse(json.stdout).totals.exerciseChains >= 4, "CLI JSON should include exercise chain totals");

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
console.log("ok - exercise value report documents doctor apotek to skrive sundhed transfer");
console.log("ok - exercise value report documents job follow-up gender trap to bojning drill repair");
console.log("ok - exercise value mutations catch flat exercise drift");
console.log("ok - exercise value CLI writes JSON and text artifacts");

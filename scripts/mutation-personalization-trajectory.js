#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  evaluatePersonalizationTrajectories
} = require("./smoke-personalization-trajectory.js");

const repoRoot = path.resolve(__dirname, "..");
const mutationSources = [
  "shared/plata-events.js",
  "shared/plata-competencies.js",
  "shared/plata-memory.js",
  "shared/plata-learner-model.js",
  "shared/plata-planner.js",
  "shared/plata-advisor.js",
  "scripts/smoke-personalization-trajectory.js"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function copyMutationSources(root) {
  mutationSources.forEach(relPath => {
    const target = path.join(root, relPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(repoRoot, relPath), target);
  });
}

function replaceInFile(root, relPath, before, after) {
  const file = path.join(root, relPath);
  const source = fs.readFileSync(file, "utf8");
  assert(source.includes(before), `${relPath}: mutation target not found`);
  fs.writeFileSync(file, source.replace(before, after));
}

function runMutation(spec) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plata-personalization-trajectory-"));
  try {
    copyMutationSources(root);
    spec.mutate(root);
    try {
      evaluatePersonalizationTrajectories({ root });
    } catch (err) {
      const message = String(err && err.message || "");
      assert(message.includes(spec.expectedMessage), `${spec.name}: expected "${spec.expectedMessage}", got "${message}"`);
      console.log(`ok - personalization trajectory mutation caught: ${spec.name}`);
      return;
    }
    throw new Error(`${spec.name}: mutation should have failed`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function run() {
  evaluatePersonalizationTrajectories({ root: repoRoot });
  console.log("ok - personalization trajectory mutation base contract passes");

  [
    {
      name: "memory ignores signal reopened event",
      mutate(root) {
        replaceInFile(
          root,
          "shared/plata-memory.js",
          '} else if (event.type === "signal.reopened") {',
          '} else if (event.type === "signal.reopened-disabled") {'
        );
      },
      expectedMessage: "after-new-miss-reopens: expected memory fact kind weak_signal"
    },
    {
      name: "review due boundary drifts after exact interval",
      mutate(root) {
        replaceInFile(
          root,
          "shared/plata-memory.js",
          "if (total > 0 && ageDays !== null && ageDays >= reviewDays) {",
          "if (total > 0 && ageDays !== null && ageDays > reviewDays) {"
        );
      },
      expectedMessage: "after-spacing-gap: expected memory fact kind next_review_due"
    },
    {
      name: "learner model deprioritizes root competency traps",
      mutate(root) {
        replaceInFile(
          root,
          "shared/plata-learner-model.js",
          "root_competency_trap: 124",
          "root_competency_trap: 1"
        );
      },
      expectedMessage: "cross-root-emerges: learner model rule should be learner-model.focus.root-competency"
    },
    {
      name: "planner stops selecting root competency memory",
      mutate(root) {
        replaceInFile(
          root,
          "shared/plata-planner.js",
          'var rootMatch = fact.kind === "root_competency_trap" && competencyId && fact.trainerId === "profile" && fact.signal === competencyId;',
          'var rootMatch = false && fact.kind === "root_competency_trap" && competencyId && fact.trainerId === "profile" && fact.signal === competencyId;'
        );
      },
      expectedMessage: "cross-root-emerges: advisor rule should be advisor.repair.root-competency"
    }
  ].forEach(runMutation);

  console.log("ok - personalization trajectory mutations prove broken replay transitions fail");
}

run();

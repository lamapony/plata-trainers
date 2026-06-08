#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  evaluateLearnerModelAlignment
} = require("./smoke-learner-model-alignment.js");

const repoRoot = path.resolve(__dirname, "..");
const mutationSources = [
  "shared/plata-events.js",
  "shared/plata-competencies.js",
  "shared/plata-memory.js",
  "shared/plata-learner-model.js",
  "shared/plata-planner.js",
  "shared/plata-advisor.js",
  "scripts/fixtures/learner-memory-profiles.json"
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plata-learner-model-alignment-"));
  try {
    copyMutationSources(root);
    spec.mutate(root);
    try {
      evaluateLearnerModelAlignment({ root });
    } catch (err) {
      const message = String(err && err.message || "");
      assert(message.includes(spec.expectedMessage), `${spec.name}: expected "${spec.expectedMessage}", got "${message}"`);
      console.log(`ok - learner model alignment mutation caught: ${spec.name}`);
      return;
    }
    throw new Error(`${spec.name}: mutation should have failed`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function run() {
  evaluateLearnerModelAlignment({ root: repoRoot });
  console.log("ok - learner model alignment base contract passes");

  [
    {
      name: "model drops root competency priority",
      mutate(root) {
        replaceInFile(
          root,
          "shared/plata-learner-model.js",
          "root_competency_trap: 124",
          "root_competency_trap: 1"
        );
      },
      expectedMessage: "learner model rule should be learner-model.focus.root-competency"
    },
    {
      name: "planner corrupts selected citation ids",
      mutate(root) {
        replaceInFile(
          root,
          "shared/plata-planner.js",
          '      id: fact.id || "",',
          '      id: "mutated-" + (fact.id || ""),'
        );
      },
      expectedMessage: "planner selected unknown memory fact"
    },
    {
      name: "advisor drops selected focus facts",
      mutate(root) {
        replaceInFile(
          root,
          "shared/plata-advisor.js",
          "    var selected = selectedPlannerFacts(memoryFacts, plannerDecision);\n    if (!selected.length) selected = fallbackFacts(memoryFacts, plannerDecision);",
          "    var selected = [];\n    if (!selected.length) selected = [];"
        );
      },
      expectedMessage: "advisor kind should be continue"
    },
    {
      name: "planner ignores review due facts",
      mutate(root) {
        replaceInFile(
          root,
          "shared/plata-planner.js",
          '["next_review_due", "stale_skill"]',
          '["stale_skill"]'
        );
      },
      expectedMessage: "advisor did not cite learner-model focus fact"
    }
  ].forEach(runMutation);

  console.log("ok - learner model alignment mutations prove model/planner/advisor drift fails");
}

run();

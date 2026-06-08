#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  evaluatePersonalizationProfiles
} = require("./smoke-personalization-eval.js");

const repoRoot = path.resolve(__dirname, "..");
const mutationSources = [
  "shared/plata-events.js",
  "shared/plata-memory.js",
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plata-personalization-eval-"));
  try {
    copyMutationSources(root);
    spec.mutate(root);
    try {
      evaluatePersonalizationProfiles({ root });
    } catch (err) {
      const message = String(err && err.message || "");
      assert(message.includes(spec.expectedMessage), `${spec.name}: expected "${spec.expectedMessage}", got "${message}"`);
      console.log(`ok - personalization mutation caught: ${spec.name}`);
      return;
    }
    throw new Error(`${spec.name}: mutation should have failed`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function run() {
  evaluatePersonalizationProfiles({ root: repoRoot });
  console.log("ok - personalization mutation base contract passes");

  [
    {
      name: "citationless repair marked memory-backed",
      mutate(root) {
        replaceInFile(
          root,
          "shared/plata-advisor.js",
          'rule: "advisor.repair.current-evidence"',
          'rule: "advisor.repair.memory-backed"'
        );
      },
      expectedMessage: "memory removal should produce advisor rule advisor.repair.current-evidence"
    },
    {
      name: "advisor drops fallback facts",
      mutate(root) {
        replaceInFile(
          root,
          "shared/plata-advisor.js",
          "    var selected = selectedPlannerFacts(memoryFacts, plannerDecision);\n    if (!selected.length) selected = fallbackFacts(memoryFacts, plannerDecision);",
          "    var selected = [];\n    if (!selected.length) selected = [];"
        );
      },
      expectedMessage: "returning-learner-context: advisor kind should be continue"
    },
    {
      name: "planner corrupts selected memory fact ids",
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
      name: "planner ignores next-review due memory",
      mutate(root) {
        replaceInFile(
          root,
          "shared/plata-planner.js",
          '["next_review_due", "stale_skill"]',
          '["stale_skill"]'
        );
      },
      expectedMessage: "planner did not select required memory kinds"
    },
    {
      name: "advisor raw-text guardrail drifts",
      mutate(root) {
        replaceInFile(
          root,
          "shared/plata-advisor.js",
          "containsRawAnswerText: false",
          "containsRawAnswerText: true"
        );
      },
      expectedMessage: "advisor must declare raw-text guardrail"
    }
  ].forEach(runMutation);

  console.log("ok - personalization mutations prove bad memory/advisor contracts fail");
}

run();

#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  buildDashboardRecommendationSnapshot,
  snapshotText
} = require("./snapshot-dashboard-recommendations.js");

const repoRoot = path.resolve(__dirname, "..");
const fixturePath = path.join(repoRoot, "scripts", "fixtures", "dashboard-recommendations.snapshot.json");
const snapshotSources = [
  "shared/plata-kernel.js",
  "shared/plata-catalog.js",
  "lessons/lesson-01/data.js",
  "lessons/lesson-b2-radiator/data.js",
  "lessons/lesson-b2-job-followup/data.js",
  "lessons/lesson-b2-ordstilling/data.js",
  "lessons/lesson-b1-bolig/data.js",
  "lessons/lesson-b1-borgerservice/data.js",
  "shared/plata-competencies.js",
  "shared/plata-planner.js",
  "shared/plata-evidence.js",
  "shared/plata-events.js",
  "shared/plata-memory.js",
  "shared/plata-advisor.js",
  "dashboard.js"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function copySnapshotSources(root) {
  snapshotSources.forEach(relPath => {
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

function scenario(snapshot, id) {
  const found = snapshot.scenarios.find(item => item.id === id);
  assert(found, `missing snapshot scenario ${id}`);
  return found;
}

function runMutation(baseText, spec) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plata-dashboard-snapshot-"));
  try {
    copySnapshotSources(root);
    spec.mutate(root);
    const mutated = buildDashboardRecommendationSnapshot({ root });
    const mutatedText = snapshotText(mutated);
    assert(mutatedText !== baseText, `${spec.name}: expected snapshot text to change`);
    spec.assert(mutated);
    console.log(`ok - dashboard snapshot mutation caught: ${spec.name}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function run() {
  const base = buildDashboardRecommendationSnapshot();
  const baseText = snapshotText(base);
  const fixtureText = fs.readFileSync(fixturePath, "utf8");
  assert(baseText === fixtureText, "dashboard snapshot fixture is out of date; run check:dashboard-snapshot first");

  [
    {
      name: "preferred start path drift",
      mutate(root) {
        replaceInFile(
          root,
          "shared/plata-planner.js",
          'if (trainer.id === "lesson-b2-job-followup") {',
          'if (trainer.id === "lesson-b2-radiator-register") {'
        );
      },
      assert(snapshot) {
        const empty = scenario(snapshot, "empty-profile");
        assert(empty.due[0].trainerId === "lesson-b2-radiator-register", "mutated start path did not reach due-card snapshot");
      }
    },
    {
      name: "repair trace rule drift",
      mutate(root) {
        replaceInFile(
          root,
          "shared/plata-planner.js",
          'rule: "dashboard.repair.highest-open-mastery",',
          'rule: "dashboard.repair.mutated-rule",'
        );
      },
      assert(snapshot) {
        const weak = scenario(snapshot, "weak-mastery");
        assert(weak.due[0].decision.trace.rule === "dashboard.repair.mutated-rule", "mutated trace rule did not reach due-card snapshot");
      }
    },
    {
      name: "open mastery ledger drift",
      mutate(root) {
        replaceInFile(
          root,
          "shared/plata-evidence.js",
          "    pushOpenMastery(entries, input, options);\n    pushRepairClosures(entries, input, options);",
          "    pushRepairClosures(entries, input, options);"
        );
      },
      assert(snapshot) {
        const weak = scenario(snapshot, "weak-mastery");
        assert(!weak.evidenceLedger.some(entry => entry.kind === "open" && entry.title === "Read passive agency"), "mutated ledger still exposes open mastery row");
      }
    }
  ].forEach(spec => runMutation(baseText, spec));

  console.log("ok - dashboard snapshot mutations prove recommendation drift fails review");
}

run();

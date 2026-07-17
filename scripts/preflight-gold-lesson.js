#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function resolveInputPath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(root, inputPath);
}

function relInputPath(inputPath) {
  return path.relative(root, resolveInputPath(inputPath)).replaceAll(path.sep, "/");
}

function readGoldLessonIds() {
  const lessonsRoot = path.join(root, "lessons");
  return fs.readdirSync(lessonsRoot)
    .filter(dir => fs.statSync(path.join(lessonsRoot, dir)).isDirectory())
    .map(dir => {
      const dataPath = path.join(lessonsRoot, dir, "data.js");
      if (!fs.existsSync(dataPath)) return null;
      const source = fs.readFileSync(dataPath, "utf8");
      if (!/qualityTier:\s*["']gold["']/.test(source)) return null;
      return { id: dir, dataPath: `lessons/${dir}/data.js` };
    })
    .filter(Boolean);
}

function resolveTargets() {
  const file = argValue("--file");
  if (file) {
    const fullPath = resolveInputPath(file);
    if (!fs.existsSync(fullPath)) {
      console.error(`Lesson file not found: ${file}`);
      process.exit(1);
    }
    const id = path.basename(path.dirname(fullPath));
    return [{ id, dataPath: relInputPath(file) }];
  }

  const lesson = argValue("--lesson");
  if (lesson) {
    const slug = lesson
      .replace(/^lessons\//, "")
      .replace(/\/data\.js$/, "")
      .replace(/\/$/, "");
    const dataPath = `lessons/${slug}/data.js`;
    const fullPath = path.join(root, dataPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`Lesson not found: ${slug} (expected ${dataPath})`);
      process.exit(1);
    }
    return [{ id: slug, dataPath }];
  }

  const gold = readGoldLessonIds();
  if (!gold.length) {
    console.error("No gold lessons found under lessons/");
    process.exit(1);
  }
  return gold;
}

function runNodeStep(label, args) {
  process.stdout.write(`\n▸ ${label}\n`);
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe"
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed`);
    process.exit(result.status || 1);
  }
  console.log(`✓ ${label}`);
}

function runNpmStep(label, scriptName) {
  process.stdout.write(`\n▸ ${label}\n`);
  const result = spawnSync("npm", ["run", scriptName], {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe",
    shell: process.platform === "win32"
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed (${scriptName})`);
    process.exit(result.status || 1);
  }
  console.log(`✓ ${label}`);
}

function runLessonScoped(target) {
  const fileArgs = ["--file", target.dataPath];
  console.log(`\n=== Gold lesson preflight: ${target.id} ===`);
  runNodeStep("Schema + source/mastery/remediation contract", ["scripts/validate-lesson.js", ...fileArgs]);
  runNodeStep("Danish audio contract + publication-state gate", ["scripts/validate-lesson-audio.js", "--lesson", target.id]);
  runNodeStep("Gold simulation paths + mastery coverage", ["scripts/simulate-gold-lessons.js", ...fileArgs]);
  runNodeStep("Lesson engine replay + LocalStorage attempts", ["scripts/smoke-lesson-engine.js", ...fileArgs]);
}

function runRepoWide(targets) {
  console.log("\n=== Repo-wide gold reports ===");
  runNpmStep("Catalog + gallery wiring", "check:catalog");

  const counterfactualLessons = new Set(["lesson-b2-radiator", "lesson-b2-radiator-register"]);
  const needsCounterfactual = targets.some(target => counterfactualLessons.has(target.id));
  if (needsCounterfactual) {
    runNpmStep("Counterfactual learner profiles (radiator)", "check:counterfactuals");
  } else {
    console.log("\n▸ Counterfactual learner profiles");
    console.log("  skip — profile pack only covers lesson-b2-radiator today");
  }

  runNpmStep("Quality report (sources, simulation, comic, remediation)", "check:quality-report");
  runNpmStep("Flagship exercise value chain", "check:exercise-value-report");
  runNpmStep("Comic storyboard prompt manifest", "check:comic-prompts");
}

function main() {
  const targets = resolveTargets();
  const scopeLabel = targets.length === 1 ? targets[0].id : `${targets.length} gold lessons`;
  console.log(`Platå gold lesson preflight — ${scopeLabel}`);
  console.log("Faster than npm run check; does not replace the full suite before merge.");

  targets.forEach(runLessonScoped);
  runRepoWide(targets);

  console.log(`\n✓ Gold lesson preflight passed (${scopeLabel})`);
}

main();

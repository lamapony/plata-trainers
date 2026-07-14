#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { normalizeRequest, validateDelivery } = require("./lib/lesson-request.js");

const repoRoot = path.resolve(__dirname, "..");

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? "" : (process.argv[index + 1] || "");
}

function loadLesson(dataPath) {
  const source = fs.readFileSync(dataPath, "utf8");
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: dataPath, timeout: 2000 });
  const lessonKeys = Object.keys(context.window).filter(key => key.startsWith("PLATA_LESSON_"));
  if (lessonKeys.length !== 1) {
    throw new Error(`Expected one PLATA_LESSON_* export, found ${lessonKeys.length}`);
  }
  return { lesson: context.window[lessonKeys[0]], source };
}

function runPreflight(slug) {
  const result = spawnSync(process.execPath, [
    "scripts/preflight-gold-lesson.js",
    "--lesson",
    slug
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe"
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status || 1);
}

function main() {
  const slug = argValue("--lesson");
  if (!slug) {
    console.error("Usage: npm run lesson:verify -- --lesson lesson-b1-your-topic");
    process.exit(1);
  }
  if (!/^lesson-(a2|b1|b2)-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    console.error("Lesson slug must start with lesson-a2-, lesson-b1-, or lesson-b2-");
    process.exit(1);
  }

  const lessonDir = path.join(repoRoot, "lessons", slug);
  const requestPath = path.join(lessonDir, "lesson-request.json");
  const dataPath = path.join(lessonDir, "data.js");
  if (!fs.existsSync(requestPath)) {
    console.error(`Missing request contract: lessons/${slug}/lesson-request.json`);
    process.exit(1);
  }
  if (!fs.existsSync(dataPath)) {
    console.error(`Missing lesson data: lessons/${slug}/data.js`);
    process.exit(1);
  }

  try {
    const request = normalizeRequest(JSON.parse(fs.readFileSync(requestPath, "utf8")));
    const loaded = loadLesson(dataPath);
    const issues = validateDelivery(request, loaded.lesson, loaded.source);
    if (issues.length) {
      console.error(`Agent lesson delivery failed (${issues.length} issue(s)):`);
      issues.forEach(issue => console.error(`- ${issue}`));
      process.exit(1);
    }
    console.log(`Agent lesson request contract passed: ${slug}`);
    console.log(`- outcome: ${request.learnerGoal}`);
    console.log(`- objective tags: ${request.delivery.objectiveTags.join(", ")}`);
    console.log(`- reviewed sources: ${request.delivery.reviewedSourceUrls.length}`);
  } catch (err) {
    console.error(`Agent lesson delivery failed: ${err.message}`);
    process.exit(1);
  }

  runPreflight(slug);
  console.log(`\n✓ Agent-created lesson is delivery-ready: ${slug}`);
}

main();

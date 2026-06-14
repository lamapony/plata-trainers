#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const issues = [];

function issue(message) {
  issues.push(message);
}

function rel(...parts) {
  return path.join(...parts).replaceAll(path.sep, "/");
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function loadCatalog() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, "shared", "plata-catalog.js"), "utf8"), context, { filename: "shared/plata-catalog.js" });
  return context.window.PlataCatalog;
}

function loadLesson(relPath) {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, relPath), "utf8"), context, { filename: relPath });
  const keys = Object.keys(context.window).filter(key => key.startsWith("PLATA_LESSON_"));
  return {
    globalName: keys[0] || "",
    lesson: keys[0] ? context.window[keys[0]] : null
  };
}

function findLessonDataFiles() {
  const lessonsRoot = path.join(root, "lessons");
  return fs.readdirSync(lessonsRoot)
    .filter(dir => fs.statSync(path.join(lessonsRoot, dir)).isDirectory())
    .map(dir => rel("lessons", dir, "data.js"))
    .filter(exists);
}

const catalog = loadCatalog();
if (!catalog || !Array.isArray(catalog.trainers)) {
  issue("shared/plata-catalog.js: expected window.PlataCatalog.trainers array");
} else {
  const ids = new Set();
  const catalogById = new Map();

  catalog.trainers.forEach((trainer, index) => {
    const prefix = `PlataCatalog.trainers[${index}]`;
    if (!trainer || typeof trainer !== "object" || Array.isArray(trainer)) {
      issue(`${prefix}: required object`);
      return;
    }
    ["id", "name", "type", "path", "description", "icon"].forEach(field => {
      if (!nonEmptyString(trainer[field])) issue(`${prefix}.${field}: required non-empty string`);
    });
    if (ids.has(trainer.id)) issue(`${prefix}.id: duplicate id "${trainer.id}"`);
    ids.add(trainer.id);
    catalogById.set(trainer.id, trainer);

    if (trainer.path && !exists(trainer.path)) issue(`${prefix}.path: missing target ${trainer.path}`);
    if (trainer.lessonDataPath && !exists(trainer.lessonDataPath)) issue(`${prefix}.lessonDataPath: missing target ${trainer.lessonDataPath}`);
    if (trainer.lessonGlobal && !trainer.lessonDataPath) issue(`${prefix}.lessonDataPath: required when lessonGlobal is present`);
    if (trainer.lessonDataPath && !trainer.lessonGlobal) issue(`${prefix}.lessonGlobal: required when lessonDataPath is present`);

    if (!trainer.gallery || typeof trainer.gallery !== "object" || Array.isArray(trainer.gallery)) {
      issue(`${prefix}.gallery: required object`);
    } else {
      const gallery = trainer.gallery;
      if (!nonEmptyString(gallery.tag)) issue(`${prefix}.gallery.tag: required non-empty string`);
      if (typeof gallery.estimatedMinutes !== "number" || gallery.estimatedMinutes <= 0) {
        issue(`${prefix}.gallery.estimatedMinutes: required positive number`);
      }
      if (trainer.type === "lesson") {
        ["level", "status", "signalFamily"].forEach(field => {
          if (!nonEmptyString(gallery[field])) issue(`${prefix}.gallery.${field}: required for lessons`);
        });
        if (!Array.isArray(gallery.outcomes) || gallery.outcomes.length < 3) {
          issue(`${prefix}.gallery.outcomes: lessons need at least three outcome strings`);
        }
      }
      if (trainer.type === "drill") {
        if (gallery.role !== "repair") issue(`${prefix}.gallery.role: drills must use role "repair"`);
        if (!nonEmptyString(gallery.repairs) && !nonEmptyString(gallery.theme)) {
          issue(`${prefix}.gallery.repairs: drills need repairs or theme metadata`);
        }
      }
    }
  });

  findLessonDataFiles().forEach(dataPath => {
    const loaded = loadLesson(dataPath);
    const lesson = loaded.lesson;
    if (!lesson || !nonEmptyString(lesson.id)) {
      issue(`${dataPath}: missing lesson id`);
      return;
    }

    const trainer = catalogById.get(lesson.id);
    if (!trainer) {
      issue(`${dataPath}: lesson id "${lesson.id}" is missing from PlataCatalog.trainers`);
      return;
    }
    if (trainer.path !== `./${path.dirname(dataPath).replaceAll(path.sep, "/")}/`) {
      issue(`${trainer.id}.path: expected ./${path.dirname(dataPath).replaceAll(path.sep, "/")}/, got ${trainer.path}`);
    }
    if (lesson.qualityTier === "gold") {
      if (trainer.lessonDataPath !== `./${dataPath}`) issue(`${trainer.id}.lessonDataPath: gold lesson must point to ./${dataPath}`);
      if (trainer.lessonGlobal !== loaded.globalName) issue(`${trainer.id}.lessonGlobal: expected ${loaded.globalName}, got ${trainer.lessonGlobal || "(empty)"}`);
    }
  });
}

if (issues.length) {
  console.error(`catalog validation failed: ${issues.length} issue(s)`);
  issues.forEach(item => console.error("- " + item));
  process.exit(1);
}

console.log(`catalog validation passed: ${catalog.trainers.length} trainer(s)`);

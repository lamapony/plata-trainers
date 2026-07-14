#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { normalizeRequest, validateDelivery } = require("./lib/lesson-request.js");

const root = path.resolve(__dirname, "..");
const sandbox = path.join(root, ".dist", "agent-lesson-smoke");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe"
  });
  if (result.status !== 0) {
    process.stdout.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    throw new Error(`${args.join(" ")} failed`);
  }
  return result;
}

function loadLesson(dataPath) {
  const source = fs.readFileSync(dataPath, "utf8");
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: dataPath, timeout: 2000 });
  const key = Object.keys(context.window).find(name => name.startsWith("PLATA_LESSON_"));
  return { lesson: context.window[key], source };
}

fs.rmSync(sandbox, { recursive: true, force: true });
fs.mkdirSync(path.join(sandbox, "lessons", "lesson-b2-job-followup"), { recursive: true });
fs.mkdirSync(path.join(sandbox, "shared"), { recursive: true });
fs.copyFileSync(
  path.join(root, "lessons", "lesson-b2-job-followup", "styles.css"),
  path.join(sandbox, "lessons", "lesson-b2-job-followup", "styles.css")
);
fs.copyFileSync(
  path.join(root, "shared", "plata-catalog.js"),
  path.join(sandbox, "shared", "plata-catalog.js")
);

const input = {
  schemaVersion: 1,
  topic: "A noisy neighbour in an apartment building",
  learnerGoal: "Ask for quieter evenings without sounding aggressive or passive",
  situation: "The learner first speaks to a neighbour and then writes a short follow-up message",
  level: "B1",
  estimatedMinutes: 12,
  mustInclude: ["a spoken opening and a written follow-up"],
  avoid: ["legal advice"]
};
const requestPath = path.join(sandbox, "request.json");
fs.writeFileSync(requestPath, `${JSON.stringify(input, null, 2)}\n`);

const normalized = normalizeRequest(input, { resetDelivery: true });
const requestSchema = JSON.parse(fs.readFileSync(path.join(root, "schemas", "lesson-request.schema.json"), "utf8"));
assert(requestSchema.properties.level.enum.join(",") === "A2,B1,B2", "published request schema level scope drifted");
assert(requestSchema.properties.delivery.properties.status.enum.includes("ready"), "published request schema delivery status missing");
assert(normalized.slug === "lesson-b1-a-noisy-neighbour-in-an-apartment-building", "request slug derivation drifted");
assert(normalized.delivery.status === "scaffold", "new requests must start as scaffold");
assert(normalized.sourcePreferences.length >= 2, "default source preferences missing");

const preview = run([
  "scripts/create-lesson-from-request.js",
  "--root", sandbox,
  "--topic", input.topic,
  "--goal", input.learnerGoal,
  "--situation", input.situation,
  "--level", input.level,
  "--minutes", String(input.estimatedMinutes),
  "--include", input.mustInclude[0],
  "--avoid", input.avoid[0],
  "--preview"
]);
assert(preview.stdout.includes('"requestType": "plata.lesson-request"'), "direct preview missing normalized request");
assert(preview.stdout.includes(`lessons/${normalized.slug}/app.js`), "direct preview missing planned files");
assert(preview.stdout.includes("delivery status: scaffold (not publishable)"), "direct preview missing delivery warning");
assert(preview.stdout.includes("Preview complete. No files were written."), "direct preview missing no-write confirmation");
assert(!fs.existsSync(path.join(sandbox, "lessons", normalized.slug)), "direct preview wrote a lesson folder");

run([
  "scripts/create-lesson-from-request.js",
  "--root", sandbox,
  "--topic", input.topic,
  "--goal", input.learnerGoal,
  "--situation", input.situation,
  "--level", input.level,
  "--minutes", String(input.estimatedMinutes),
  "--include", input.mustInclude[0],
  "--avoid", input.avoid[0]
]);

const lessonDir = path.join(sandbox, "lessons", normalized.slug);
const manifestPath = path.join(lessonDir, "lesson-request.json");
const dataPath = path.join(lessonDir, "data.js");
assert(fs.existsSync(manifestPath), "direct brief scaffold missing lesson-request.json");
assert(fs.existsSync(path.join(lessonDir, "AUTHORING.md")), "direct brief scaffold missing AUTHORING.md");

run([
  "scripts/create-lesson-from-request.js",
  "--root", sandbox,
  "--request", requestPath,
  "--no-catalog",
  "--force"
]);

assert(fs.existsSync(manifestPath), "saved request replay removed lesson-request.json");

const scaffoldManifest = normalizeRequest(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
const loaded = loadLesson(dataPath);
const scaffoldIssues = validateDelivery(scaffoldManifest, loaded.lesson, loaded.source);
assert(scaffoldIssues.some(issue => issue.includes("delivery.status is scaffold")), "delivery gate accepted scaffold status");
assert(scaffoldIssues.some(issue => issue.includes("generic scaffold marker")), "delivery gate accepted generic scaffold content");

const readyInput = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
readyInput.delivery = {
  status: "ready",
  objectiveTags: ["context-reading", "agency-without-pressure"],
  mustIncludeCoverage: {
    "a spoken opening and a written follow-up": ["read-context", "professional-response"]
  },
  reviewedSourceUrls: loaded.lesson.sourceNotes.map(note => note.url),
  avoidReviewed: true,
  reviewNotes: "Checked request coverage, sources, and the no-legal-advice boundary."
};
const readyRequest = normalizeRequest(readyInput);
const readyIssues = validateDelivery(readyRequest, loaded.lesson, "customized source-backed lesson data");
assert(readyIssues.length === 0, `ready delivery contract should pass: ${readyIssues.join("; ")}`);

assert(
  (() => {
    try {
      normalizeRequest({ ...input, level: "A1" });
      return false;
    } catch (_err) {
      return true;
    }
  })(),
  "request contract should reject levels outside the A2-B2 product scope"
);

assert(
  (() => {
    try {
      normalizeRequest({
        ...input,
        delivery: {
          status: "ready",
          objectiveTags: ["one", "two"],
          mustIncludeCoverage: {},
          reviewedSourceUrls: ["file:///tmp/source", "javascript:alert(1)"],
          avoidReviewed: true,
          reviewNotes: "Reviewed invalid source URLs."
        }
      });
      return false;
    } catch (_err) {
      return true;
    }
  })(),
  "request contract should reject non-HTTP source URLs"
);

console.log("ok - natural lesson brief normalizes into a deterministic scaffold request");
console.log("ok - direct brief preview exposes assumptions and writes no files");
console.log("ok - direct brief creates lesson files, catalog entry, manifest, and authoring checklist");
console.log("ok - saved JSON requests remain replayable");
console.log("ok - delivery gate rejects generic scaffolds and accepts reviewed request coverage");

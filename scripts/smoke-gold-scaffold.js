#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const sandboxRoot = path.join(root, ".dist", "scaffold-smoke");
const catalogSandboxRoot = path.join(root, ".dist", "scaffold-catalog-smoke");
const slug = "lesson-b2-scaffold-smoke";
const catalogSlug = "lesson-b2-catalog-smoke";
const dataPath = path.join(sandboxRoot, "lessons", slug, "data.js");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe"
  });
  if (result.status !== 0) {
    process.stdout.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
  return result;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

fs.rmSync(sandboxRoot, { recursive: true, force: true });
fs.mkdirSync(path.join(sandboxRoot, "lessons", "lesson-b2-job-followup"), { recursive: true });
fs.copyFileSync(
  path.join(root, "lessons", "lesson-b2-job-followup", "styles.css"),
  path.join(sandboxRoot, "lessons", "lesson-b2-job-followup", "styles.css")
);

run(process.execPath, [
  "scripts/scaffold-gold-lesson.js",
  "--root", sandboxRoot,
  "--slug", slug,
  "--title", "Scaffold Smoke",
  "--name", "B2: Scaffold Smoke",
  "--description", "Generated gold lesson scaffold smoke test",
  "--subtitle", "A generated B2 gold lesson used to prove the authoring scaffold remains valid.",
  "--icon", "🧪",
  "--no-catalog"
]);

["index.html", "app.js", "data.js", "styles.css"].forEach(file => {
  assert(fs.existsSync(path.join(sandboxRoot, "lessons", slug, file)), `missing generated ${file}`);
});

run(process.execPath, ["--check", dataPath]);
run(process.execPath, ["--check", path.join(sandboxRoot, "lessons", slug, "app.js")]);
run(process.execPath, ["scripts/validate-lesson.js", "--file", dataPath]);
run(process.execPath, ["scripts/simulate-gold-lessons.js", "--file", dataPath]);
run(process.execPath, ["scripts/smoke-lesson-engine.js", "--file", dataPath]);

const dataSource = fs.readFileSync(dataPath, "utf8");
assert(dataSource.includes("qualityTier: \"gold\""), "generated lesson is not gold");
assert(dataSource.includes("simulation:"), "generated lesson missing simulation contract");
assert(dataSource.includes("masteryMap:"), "generated lesson missing mastery map");
assert(dataSource.includes("comicStoryboard:"), "generated lesson missing comic storyboard");
assert(dataSource.includes("./assets/comic/read-context.png"), "generated lesson missing comic asset path");
assert(dataSource.includes("assetReady: false"), "generated lesson must not publish unreviewed comic assets");

const invalidAssetPath = path.join(sandboxRoot, "lessons", "lesson-b2-scaffold-asset-missing", "data.js");
fs.mkdirSync(path.dirname(invalidAssetPath), { recursive: true });
fs.writeFileSync(invalidAssetPath, dataSource.replace("assetReady: false", "assetReady: true"));
const invalidAssetResult = spawnSync(process.execPath, ["scripts/validate-lesson.js", "--file", invalidAssetPath], {
  cwd: root,
  encoding: "utf8",
  stdio: "pipe"
});
assert(invalidAssetResult.status !== 0, "validator accepted assetReady=true without a committed asset");
assert(`${invalidAssetResult.stdout}\n${invalidAssetResult.stderr}`.includes("true requires a non-empty committed file"), "validator did not explain the missing ready asset");

console.log("ok - gold lesson scaffold generates a validator-clean lesson");
console.log("ok - generated gold lesson passes simulator and runtime replay");
console.log("ok - generated comic assets remain unpublished until reviewed and committed");

fs.rmSync(catalogSandboxRoot, { recursive: true, force: true });
fs.mkdirSync(path.join(catalogSandboxRoot, "lessons", "lesson-b2-job-followup"), { recursive: true });
fs.mkdirSync(path.join(catalogSandboxRoot, "shared"), { recursive: true });
fs.copyFileSync(
  path.join(root, "lessons", "lesson-b2-job-followup", "styles.css"),
  path.join(catalogSandboxRoot, "lessons", "lesson-b2-job-followup", "styles.css")
);
fs.copyFileSync(
  path.join(root, "shared", "plata-catalog.js"),
  path.join(catalogSandboxRoot, "shared", "plata-catalog.js")
);

run(process.execPath, [
  "scripts/scaffold-gold-lesson.js",
  "--root", catalogSandboxRoot,
  "--slug", catalogSlug,
  "--title", "Catalog Smoke",
  "--name", "B2: Catalog Smoke",
  "--description", "Generated catalog insertion smoke test",
  "--subtitle", "A generated lesson used to prove catalog insertion remains valid.",
  "--icon", "🧪"
]);

const catalogSource = fs.readFileSync(path.join(catalogSandboxRoot, "shared", "plata-catalog.js"), "utf8");
const context = { window: {} };
context.globalThis = context.window;
vm.createContext(context);
vm.runInContext(catalogSource, context, { filename: "shared/plata-catalog.js" });
const inserted = context.window.PlataCatalog.trainers.find(trainer => trainer.id === catalogSlug);
assert(inserted, "generated catalog entry missing");
assert(inserted.lessonGlobal === "PLATA_LESSON_B2_CATALOG_SMOKE", "generated catalog entry has wrong lessonGlobal");
assert(inserted.lessonDataPath === `./lessons/${catalogSlug}/data.js`, "generated catalog entry has wrong lessonDataPath");

console.log("ok - gold lesson scaffold inserts a valid catalog entry");

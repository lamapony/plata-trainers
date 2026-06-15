#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { writePrecacheManifest } = require("./build-precache-manifest.js");
const { writeQualityReport } = require("./build-quality-report.js");
const { writeSkillCoverageReport } = require("./build-skill-coverage-report.js");
const { writeDemoLearnerReport } = require("./build-demo-learner-report.js");
const { writeTodayProgramReport } = require("./build-today-program-report.js");
const { writeGuidedSessionReport } = require("./build-guided-session-report.js");
const { writeEvaluatorPathReport } = require("./build-evaluator-path-report.js");
const { writeEvaluatorJourneyReport } = require("./build-evaluator-journey-report.js");
const { writeProfilePortabilityReport } = require("./build-profile-portability-report.js");
const { writeExerciseValueReport } = require("./build-exercise-value-report.js");
const { writeCapabilityMap } = require("./build-capability-map.js");
const { writeProjectHealthManifest } = require("./build-project-health-manifest.js");
const { writeQuickstartProof } = require("./build-quickstart-proof.js");
const { writeProofDigest } = require("./build-proof-digest.js");

const root = path.resolve(__dirname, "..");
const outRoot = path.join(root, ".dist", "pages");
const proofDigestPublicIndex = "reports/proof-digest.json";
const quickstartProofPublicIndex = "reports/quickstart-proof/quickstart.json";

const rootFiles = [
  "404.html",
  "dashboard.html",
  "dashboard.js",
  "home.js",
  "index.html",
  "program.html",
  "program.js",
  "proof.html",
  "proof.js",
  "quality.html",
  "quality.js",
  "robots.txt",
  "site.webmanifest",
  "sitemap.xml",
  "styles.css",
  "sw.js"
];

const publicDirs = [
  "assets",
  "bojning-drill",
  "lessons",
  "ordstilling-drill",
  "register-drill",
  "shared",
  "vocab-sr"
];

const ignoredNames = new Set([".DS_Store", "Thumbs.db"]);
const disallowedTopLevel = new Set([".git", ".github", "docs", "opendesign", "scripts", "package.json"]);
const publicExtensions = new Set([
  ".css",
  ".gif",
  ".html",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".json",
  ".m4a",
  ".mp3",
  ".mp4",
  ".ogg",
  ".pdf",
  ".png",
  ".svg",
  ".txt",
  ".wav",
  ".webm",
  ".webmanifest",
  ".webp",
  ".xml"
]);

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function assertExists(source) {
  if (!fs.existsSync(source)) {
    console.error(`pages artifact build failed: missing ${rel(source)}`);
    process.exit(1);
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(source, target) {
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
}

function shouldSkip(name) {
  return name.startsWith(".") || ignoredNames.has(name);
}

function isPublicFile(name) {
  return publicExtensions.has(path.extname(name).toLowerCase());
}

function copyDir(sourceDir, targetDir) {
  assertExists(sourceDir);
  ensureDir(targetDir);
  fs.readdirSync(sourceDir, { withFileTypes: true }).forEach(entry => {
    if (shouldSkip(entry.name)) return;
    const source = path.join(sourceDir, entry.name);
    const target = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(source, target);
      return;
    }
    if (entry.isFile() && isPublicFile(entry.name)) copyFile(source, target);
  });
}

function walkFiles(dir) {
  const files = [];
  function walk(current) {
    fs.readdirSync(current, { withFileTypes: true }).forEach(entry => {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        return;
      }
      if (entry.isFile()) files.push(full);
    });
  }
  walk(dir);
  return files;
}

const iconBuild = spawnSync(process.execPath, [path.join(__dirname, "build-pwa-icons.js")], {
  cwd: root,
  encoding: "utf8"
});
if (iconBuild.status !== 0) {
  console.error(`pages artifact build failed: PWA icon build\n${iconBuild.stdout}\n${iconBuild.stderr}`);
  process.exit(1);
}

fs.rmSync(outRoot, { recursive: true, force: true });
ensureDir(outRoot);

rootFiles.forEach(file => {
  const source = path.join(root, file);
  assertExists(source);
  copyFile(source, path.join(outRoot, file));
});

publicDirs.forEach(dir => {
  copyDir(path.join(root, dir), path.join(outRoot, dir));
});

fs.writeFileSync(path.join(outRoot, ".nojekyll"), "");
writeQualityReport(path.join(outRoot, "reports", "quality.json"));
writeSkillCoverageReport(path.join(outRoot, "reports", "skill-coverage.json"));
writeDemoLearnerReport(path.join(outRoot, "reports", "demo-learner.json"));
writeTodayProgramReport(path.join(outRoot, "reports", "today-program.json"));
writeGuidedSessionReport(path.join(outRoot, "reports", "guided-session.json"));
writeEvaluatorPathReport(path.join(outRoot, "reports", "evaluator-path.json"));
writeEvaluatorJourneyReport(path.join(outRoot, "reports", "evaluator-journey.json"));
writeProfilePortabilityReport(path.join(outRoot, "reports", "profile-portability.json"));
writeExerciseValueReport(path.join(outRoot, "reports", "exercise-value.json"));
writeCapabilityMap(path.join(outRoot, "reports", "capabilities.json"));
writeProjectHealthManifest(path.join(outRoot, "reports", "project-health.json"));
writeQuickstartProof(path.join(outRoot, "reports", "quickstart-proof"));
writeProofDigest(path.join(outRoot, proofDigestPublicIndex));

if (!fs.existsSync(path.join(outRoot, proofDigestPublicIndex))) {
  console.error(`pages artifact build failed: missing ${proofDigestPublicIndex}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(outRoot, quickstartProofPublicIndex))) {
  console.error(`pages artifact build failed: missing ${quickstartProofPublicIndex}`);
  process.exit(1);
}

const precache = writePrecacheManifest(outRoot);
if (!fs.existsSync(path.join(outRoot, "precache-manifest.json"))) {
  console.error("pages artifact build failed: missing precache-manifest.json");
  process.exit(1);
}

const topLevel = fs.readdirSync(outRoot);
const leaked = topLevel.filter(name => disallowedTopLevel.has(name));
if (leaked.length) {
  console.error(`pages artifact build failed: disallowed top-level item(s): ${leaked.join(", ")}`);
  process.exit(1);
}

const files = walkFiles(outRoot)
  .map(file => path.relative(outRoot, file).replaceAll(path.sep, "/"))
  .sort();

rootFiles.forEach(file => {
  if (!files.includes(file)) {
    console.error(`pages artifact build failed: missing public root file ${file}`);
    process.exit(1);
  }
});

console.log(`pages artifact built: ${rel(outRoot)} (${files.length} file(s), precache ${precache.version})`);

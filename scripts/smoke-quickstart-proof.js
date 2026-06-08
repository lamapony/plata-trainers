#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  writeQuickstartProof
} = require("./build-quickstart-proof.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runCli(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "build-quickstart-proof.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertFile(root, file) {
  const fullPath = path.join(root, file);
  assert(fs.existsSync(fullPath), `quickstart artifact missing ${file}`);
  return fullPath;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-quickstart-proof-"));
try {
  const proof = writeQuickstartProof(tmp);
  assert(proof.status === "pass", "quickstart proof should pass");
  assert(proof.commands.includes("npm run proof:quickstart"), "quickstart proof should include proof command");
  assert(proof.commands.includes("npm run check:quickstart-proof"), "quickstart proof should include smoke command");
  assert(proof.commands.includes("npm run check"), "quickstart proof should include full QA command");
  assert(proof.artifacts.length === 7, "quickstart proof should list every written artifact");
  assert(proof.checks.every(item => item.status === "pass"), "quickstart proof checks should pass");

  const demoFile = assertFile(tmp, "demo-learner.json");
  const capabilitiesFile = assertFile(tmp, "capabilities.json");
  const healthFile = assertFile(tmp, "project-health.json");
  const reviewFile = assertFile(tmp, "review-report.json");
  const summaryFile = assertFile(tmp, "review-summary.md");
  const quickstartJsonFile = assertFile(tmp, "quickstart.json");
  const quickstartMdFile = assertFile(tmp, "quickstart.md");

  assert(readJson(demoFile).status === "pass", "quickstart demo learner artifact should pass");
  assert(readJson(capabilitiesFile).status === "pass", "quickstart capability artifact should pass");
  assert(readJson(healthFile).status === "pass", "quickstart project health artifact should pass");
  assert(readJson(reviewFile).status === "regression", "quickstart review artifact should preserve golden regression status");
  assert(readJson(quickstartJsonFile).status === "pass", "quickstart JSON summary should pass");
  assert(fs.readFileSync(summaryFile, "utf8").includes("+6 more in JSON artifact"), "quickstart review summary should show capped hidden regressions");
  assert(fs.readFileSync(quickstartMdFile, "utf8").includes("Contributor Proof Quickstart"), "quickstart markdown should include title");

  const cliDir = path.join(tmp, "cli");
  const cliJson = runCli(["--out", cliDir, "--json"]);
  assert(cliJson.status === 0, `quickstart CLI JSON should pass\n${cliJson.stdout}\n${cliJson.stderr}`);
  assert(JSON.parse(cliJson.stdout).status === "pass", "quickstart CLI JSON stdout should pass");
  assert(fs.existsSync(path.join(cliDir, "quickstart.md")), "quickstart CLI should write markdown artifact");

  const cliText = runCli(["--out", path.join(tmp, "cli-text"), "--text"]);
  assert(cliText.status === 0, `quickstart CLI text should pass\n${cliText.stdout}\n${cliText.stderr}`);
  assert(cliText.stdout.includes("Contributor Proof Quickstart"), "quickstart CLI text should print markdown summary");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("ok - contributor quickstart proof builds core artifacts");
console.log("ok - contributor quickstart proof links commands, checks, and reviewer surfaces");
console.log("ok - contributor quickstart proof CLI supports JSON and text modes");

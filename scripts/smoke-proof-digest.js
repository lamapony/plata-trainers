#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  buildProofDigest,
  formatProofDigest,
  writeProofDigest
} = require("./build-proof-digest.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runCli(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "build-proof-digest.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function runBaseSmoke() {
  const digest = buildProofDigest();
  assert(digest.status === "pass", `proof digest should pass:\n${digest.issues.join("\n")}`);
  assert(digest.headline.includes("checked in public"), "proof digest should produce a visitor-facing headline");
  assert(digest.whatThisProves.length === 6, "proof digest should explain the main proof claims");
  assert(digest.whatChanged.length === 4, "proof digest should explain the current public proof changes");
  assert(digest.trustBoundaries.length >= 4, "proof digest should state trust boundaries");
  assert(digest.sourceReports.includes("reports/project-health.json"), "proof digest should cite project health");
  assert(digest.sourceReports.includes("reports/evaluator-path.json"), "proof digest should cite the evaluator path report");
  assert(digest.sourceReports.includes("reports/evaluator-journey.json"), "proof digest should cite the evaluator journey report");
  assert(digest.sourceReports.includes("reports/profile-portability.json"), "proof digest should cite profile portability proof");
  assert(digest.sourceReports.includes("reports/exercise-value.json"), "proof digest should cite exercise value proof");
  assert(digest.sourceReports.includes("reports/guided-session.json"), "proof digest should cite guided session proof");
  assert(digest.sourceReports.includes("reports/quickstart-proof/review-report.json"), "proof digest should cite golden review JSON");
  assert(digest.whatThisProves.some(item => item.id === "private-personalization" && item.status === "pass" && item.takeaway.includes("writes nothing")), "proof digest should explain read-only personalization");
  assert(digest.whatThisProves.some(item => item.id === "profile-portability" && item.status === "pass" && item.takeaway.includes("practice event") && item.evidence.includes("check:profile-portability")), "proof digest should explain real profile portability");
  assert(digest.whatThisProves.some(item => item.id === "flagship-exercise-value" && item.status === "pass" && item.evidence.includes("check:exercise-value-report") && item.takeaway.includes("almost-right")), "proof digest should explain flagship exercise value");
  assert(digest.whatThisProves.some(item => item.id === "reviewer-output-contract" && item.evidence.includes("check:review-report-fixture")), "proof digest should cite reviewer fixture proof");
  assert(digest.whatChanged.some(item => item.id === "visitor-proof-walkthrough" && item.evidence.includes("reports/evaluator-path.json") && item.evidence.includes("reports/evaluator-journey.json") && item.evidence.includes("check:evaluator-journey") && item.takeaway.includes("example learner")), "proof digest should describe the deterministic evaluator journey");
  assert(digest.whatChanged.some(item => item.id === "plain-language-digest" && item.evidence.includes("check:proof-digest")), "proof digest should describe itself as a checked artifact");

  const formatted = formatProofDigest(digest);
  assert(formatted.includes("Proof Digest"), "formatter should include report title");
  assert(formatted.includes("What this proves:"), "formatter should include proof claims");
  assert(formatted.includes("Issues:\nnone"), "formatter should show empty issues");
}

function runCliSmoke() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-proof-digest-"));
  try {
    const out = path.join(tmp, "proof-digest.json");
    const digest = writeProofDigest(out);
    assert(digest.status === "pass", "written digest should pass");
    assert(JSON.parse(fs.readFileSync(out, "utf8")).status === "pass", "written digest file should pass");

    const cliJson = runCli(["--json"]);
    assert(cliJson.status === 0, `proof digest CLI JSON should pass\n${cliJson.stdout}\n${cliJson.stderr}`);
    assert(JSON.parse(cliJson.stdout).whatChanged.some(item => item.id === "quickstart-proof-published"), "CLI JSON should include quickstart change");

    const cliText = runCli(["--text"]);
    assert(cliText.status === 0, `proof digest CLI text should pass\n${cliText.stdout}\n${cliText.stderr}`);
    assert(cliText.stdout.includes("Trust boundaries:"), "CLI text should include trust boundaries");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

runBaseSmoke();
runCliSmoke();

console.log("ok - proof digest translates generated reports into visitor-facing claims");
console.log("ok - proof digest CLI writes JSON and text artifacts");

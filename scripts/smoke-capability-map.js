#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  buildCapabilityMap,
  formatCapabilityMap
} = require("./build-capability-map.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function copyDir(source, target) {
  fs.cpSync(source, target, {
    recursive: true,
    filter(file) {
      const name = path.basename(file);
      return name !== ".git" && name !== ".dist" && name !== ".DS_Store";
    }
  });
}

function copyCapabilityRoot(root) {
  [
    "package.json",
    "README.md",
    "CONTRIBUTING.md",
    "ROADMAP.md",
    "index.html",
    "dashboard.html",
    "program.html",
    "program.js",
    "proof.html",
    "proof.js",
    "quality.html",
    "dashboard.js"
  ].forEach(file => {
    fs.copyFileSync(path.join(repoRoot, file), path.join(root, file));
  });
  [".github", "docs", "shared", "lessons", "scripts"].forEach(dir => {
    copyDir(path.join(repoRoot, dir), path.join(root, dir));
  });
}

function runCli(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "build-capability-map.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function capability(report, id) {
  return report.capabilities.find(item => item.id === id);
}

function hasGate(item, gateId) {
  return item.proofGates.some(gate => gate.id === gateId && gate.status === "pass");
}

function hasReport(item, reportId) {
  return item.publicReports.some(report => report.id === reportId && report.status === "pass");
}

function hasDoc(item, docPath) {
  return item.docs.some(doc => doc.path === docPath && doc.exists);
}

function hasSurface(item, surface) {
  return item.surfaces.includes(surface);
}

function hasSource(item, sourcePath) {
  return item.sourcePaths.some(source => source.path === sourcePath && source.exists);
}

function runBaseSmoke() {
  const report = buildCapabilityMap();
  assert(report.status === "pass", `capability map should pass:\n${report.issues.join("\n")}`);
  assert(report.totals.capabilities >= 9, "capability map should describe the full product surface");
  assert(report.totals.proofGates >= 35, "capability map should cite the substantial QA gate surface");
  assert(report.publicReports.some(row => row.id === "capabilities" && row.pagesPath === "reports/capabilities.json"), "capability report should be part of the public report surface");
  assert(report.publicReports.some(row => row.id === "demo-learner" && row.pagesPath === "reports/demo-learner.json"), "demo learner report should be part of the public report surface");
  assert(report.publicReports.some(row => row.id === "evaluator-path" && row.pagesPath === "reports/evaluator-path.json"), "evaluator path report should be part of the public report surface");
  assert(report.publicReports.some(row => row.id === "evaluator-journey" && row.pagesPath === "reports/evaluator-journey.json"), "evaluator journey report should be part of the public report surface");
  assert(report.publicReports.some(row => row.id === "profile-portability" && row.pagesPath === "reports/profile-portability.json"), "profile portability report should be part of the public report surface");
  assert(report.publicReports.some(row => row.id === "exercise-value" && row.pagesPath === "reports/exercise-value.json"), "exercise value report should be part of the public report surface");
  assert(report.publicReports.some(row => row.id === "guided-session" && row.pagesPath === "reports/guided-session.json"), "guided session report should be part of the public report surface");
  assert(report.guarantees.every(guarantee => guarantee.pass), "capability guarantees should all pass");

  const gold = capability(report, "gold-lesson-quality-engine");
  assert(gold && hasGate(gold, "check:quality-report"), "gold capability should cite the quality report gate");
  assert(gold && hasGate(gold, "check:exercise-value-report"), "gold capability should cite the exercise value report gate");
  assert(gold && hasReport(gold, "quality"), "gold capability should cite the public quality report");
  assert(gold && hasReport(gold, "exercise-value"), "gold capability should cite the public exercise value report");
  assert(gold && hasSource(gold, "scripts/build-exercise-value-report.js"), "gold capability should cite the exercise value builder");

  const memory = capability(report, "private-learner-memory");
  assert(memory && hasGate(memory, "check:memory-vault"), "memory capability should cite the memory vault gate");
  assert(memory && hasGate(memory, "check:profile-portability"), "memory capability should cite the profile portability gate");
  assert(memory && hasReport(memory, "profile-portability"), "memory capability should cite the public profile portability report");
  assert(memory && hasSource(memory, "scripts/build-profile-portability-report.js"), "memory capability should cite the profile portability builder");
  assert(memory && hasDoc(memory, "docs/LEARNER_MEMORY_AGENT_RFC.md"), "memory capability should cite the learner memory RFC");

  const today = capability(report, "today-program-shell");
  assert(today && hasGate(today, "check:demo-learner-report"), "Today capability should cite the demo learner report gate");
  assert(today && hasGate(today, "check:demo-learner-diff"), "Today capability should cite the demo learner diff gate");
  assert(today && hasGate(today, "check:today-program-report"), "Today capability should cite the Today report gate");
  assert(today && hasReport(today, "demo-learner"), "Today capability should cite the public demo learner report");
  assert(today && hasGate(today, "check:today-program-diff"), "Today capability should cite the Today diff gate");
  assert(today && hasReport(today, "today-program"), "Today capability should cite the public Today report");

  const guided = capability(report, "guided-session-outcome-loop");
  assert(guided && hasGate(guided, "check:guided-session"), "guided session capability should cite the runtime gate");
  assert(guided && hasGate(guided, "check:guided-session-report"), "guided session capability should cite the report gate");
  assert(guided && hasGate(guided, "check:guided-session-diff"), "guided session capability should cite the diff review gate");
  assert(guided && hasReport(guided, "guided-session"), "guided session capability should cite the public report");
  assert(guided && hasSurface(guided, "Dashboard Guided session section"), "guided session capability should cite the dashboard surface");

  const bridge = capability(report, "lightweight-companion-bridge");
  assert(bridge && hasGate(bridge, "check:companion"), "companion capability should cite the companion gate");
  assert(bridge && hasDoc(bridge, "docs/COMPANION_ARCHITECTURE.md"), "companion capability should cite companion architecture");

  const proof = capability(report, "public-github-proof-surface");
  assert(proof && hasGate(proof, "check:home"), "proof surface should cite the home evaluator path gate");
  assert(proof && hasGate(proof, "check:evaluator-path"), "proof surface should cite the evaluator path gate");
  assert(proof && hasGate(proof, "check:evaluator-journey"), "proof surface should cite the evaluator journey gate");
  assert(proof && hasGate(proof, "check:profile-portability"), "proof surface should cite the profile portability gate");
  assert(proof && hasGate(proof, "check:exercise-value-report"), "proof surface should cite the exercise value gate");
  assert(proof && hasGate(proof, "check:capability-map"), "proof surface should cite its own gate");
  assert(proof && hasGate(proof, "check:demo-learner-diff"), "proof surface should cite the demo learner diff gate");
  assert(proof && hasGate(proof, "check:review-report-fixture"), "proof surface should cite the golden review fixture gate");
  assert(proof && hasGate(proof, "check:quickstart-proof"), "proof surface should cite the contributor quickstart gate");
  assert(proof && hasGate(proof, "check:proof-digest"), "proof surface should cite the proof digest gate");
  assert(proof && hasGate(proof, "check:proof-page"), "proof surface should cite the public proof page gate");
  assert(proof && hasGate(proof, "check:public-runtime"), "proof surface should cite the public runtime gate");
  assert(proof && hasGate(proof, "check:public-runtime-mutations"), "proof surface should cite the public runtime mutation gate");
  assert(proof && hasReport(proof, "capabilities"), "proof surface should cite the capability map report");
  assert(proof && hasReport(proof, "demo-learner"), "proof surface should cite the demo learner report");
  assert(proof && hasReport(proof, "evaluator-path"), "proof surface should cite the evaluator path report");
  assert(proof && hasReport(proof, "evaluator-journey"), "proof surface should cite the evaluator journey report");
  assert(proof && hasReport(proof, "profile-portability"), "proof surface should cite the profile portability report");
  assert(proof && hasReport(proof, "exercise-value"), "proof surface should cite the exercise value report");
  assert(proof && hasReport(proof, "guided-session"), "proof surface should cite the guided session report");
  assert(proof && hasReport(proof, "quickstart-proof"), "proof surface should cite the public quickstart proof report");
  assert(proof && hasReport(proof, "proof-digest"), "proof surface should cite the public proof digest report");
  assert(proof && hasSurface(proof, "index.html"), "proof surface should cite the home page surface");
  assert(proof && hasSurface(proof, "Home evaluator path"), "proof surface should cite the home evaluator path");
  assert(proof && hasSurface(proof, "proof.html"), "proof surface should cite the proof page surface");
  assert(proof && hasSurface(proof, "reports/evaluator-path.json"), "proof surface should cite the evaluator path public report surface");
  assert(proof && hasSurface(proof, "reports/evaluator-journey.json"), "proof surface should cite the evaluator journey public report surface");
  assert(proof && hasSurface(proof, "reports/profile-portability.json"), "proof surface should cite the profile portability public report surface");
  assert(proof && hasSurface(proof, "reports/exercise-value.json"), "proof surface should cite the exercise value public report surface");
  assert(proof && hasSurface(proof, "reports/proof-digest.json"), "proof surface should cite the proof digest surface");
  assert(proof && hasSurface(proof, "GitHub Step Summary"), "proof surface should cite the GitHub review summary surface");
  assert(proof && hasSurface(proof, "Contributor proof quickstart"), "proof surface should cite the contributor proof quickstart surface");
  assert(proof && hasSource(proof, "scripts/build-evaluator-path-report.js"), "proof surface should cite the evaluator path report builder");
  assert(proof && hasSource(proof, "scripts/build-evaluator-journey-report.js"), "proof surface should cite the evaluator journey report builder");
  assert(proof && hasSource(proof, "scripts/smoke-evaluator-journey.js"), "proof surface should cite the evaluator journey harness");
  assert(proof && hasSource(proof, "scripts/build-profile-portability-report.js"), "proof surface should cite the profile portability builder");
  assert(proof && hasSource(proof, "scripts/smoke-profile-portability.js"), "proof surface should cite the profile portability harness");
  assert(proof && hasSource(proof, "scripts/build-exercise-value-report.js"), "proof surface should cite the exercise value builder");
  assert(proof && hasSource(proof, "scripts/smoke-exercise-value-report.js"), "proof surface should cite the exercise value harness");
  assert(proof && hasSource(proof, "scripts/smoke-public-runtime.js"), "proof surface should cite the public runtime harness");
  assert(proof && hasSource(proof, "scripts/mutation-public-runtime.js"), "proof surface should cite the public runtime mutation harness");

  const formatted = formatCapabilityMap(report);
  assert(formatted.includes("Product Capability Map"), "formatter should include report title");
  assert(formatted.includes("Issues:\nnone"), "formatter should show empty issues");
}

function runCliSmoke() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-capabilities-"));
  try {
    const out = path.join(tmp, "capabilities.json");
    const built = runCli(["--out", out]);
    assert(built.status === 0, `CLI build should pass\n${built.stdout}\n${built.stderr}`);
    const report = JSON.parse(fs.readFileSync(out, "utf8"));
    assert(report.status === "pass", "CLI output report should pass");
    assert(report.capabilities.some(item => item.id === "public-github-proof-surface"), "CLI output should include the proof surface");

    const json = runCli(["--json"]);
    assert(json.status === 0, `CLI JSON should pass\n${json.stdout}\n${json.stderr}`);
    assert(JSON.parse(json.stdout).publicReports.some(item => item.id === "capabilities"), "CLI JSON should include capabilities report metadata");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function runMissingGateSmoke() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plata-capabilities-"));
  try {
    copyCapabilityRoot(root);
    const packagePath = path.join(root, "package.json");
    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    delete pkg.scripts["check:today-program-report"];
    pkg.scripts.check = pkg.scripts.check.replace(" && npm run check:today-program-report", "");
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");

    const report = buildCapabilityMap({ root });
    assert(report.status === "fail", "capability map should fail when a declared gate is missing");
    assert(report.issues.some(issue => issue.includes("today-program-shell: check:today-program-report: missing package script")), "capability map should report the missing Today gate script");
    assert(report.issues.some(issue => issue.includes("today-program-shell: check:today-program-report: not included in npm run check")), "capability map should report the missing Today gate sequence");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runMissingPagesReportSmoke() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plata-capabilities-"));
  try {
    copyCapabilityRoot(root);
    const pagesPath = path.join(root, "scripts", "build-pages-artifact.js");
    const source = fs.readFileSync(pagesPath, "utf8")
      .replace(/\nwriteCapabilityMap\(path\.join\(outRoot, "reports", "capabilities\.json"\)\);/, "");
    fs.writeFileSync(pagesPath, source);

    const report = buildCapabilityMap({ root });
    assert(report.status === "fail", "capability map should fail when Pages does not publish its report");
    assert(report.issues.some(issue => issue.includes("capabilities: Pages artifact does not publish reports/capabilities.json")), "capability map should report the unpublished capability report");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function run() {
  runBaseSmoke();
  runCliSmoke();
  runMissingGateSmoke();
  runMissingPagesReportSmoke();
  console.log("ok - capability map links user-facing capabilities to proof gates");
  console.log("ok - capability map publishes and formats a JSON proof surface");
  console.log("ok - capability map catches missing gate and Pages publishing contracts");
}

run();

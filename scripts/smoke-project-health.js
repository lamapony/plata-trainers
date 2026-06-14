#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  buildProjectHealthManifest,
  formatProjectHealthManifest
} = require("./build-project-health-manifest.js");

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

function copyHealthRoot(root) {
  ["package.json", "README.md", "CONTRIBUTING.md", "ROADMAP.md", "index.html", "dashboard.html", "program.html", "program.js", "proof.html", "proof.js", "quality.html", "dashboard.js"].forEach(file => {
    fs.copyFileSync(path.join(repoRoot, file), path.join(root, file));
  });
  [".github", "docs", "shared", "lessons", "scripts"].forEach(dir => {
    copyDir(path.join(repoRoot, dir), path.join(root, dir));
  });
}

function runBaseSmoke() {
  const manifest = buildProjectHealthManifest();
  assert(manifest.status === "pass", `project health manifest should pass:\n${manifest.issues.join("\n")}`);
  assert(manifest.totals.gates >= 28, "manifest should enumerate the full QA gate set");
  assert(manifest.gates.some(gate => gate.id === "check:learner-model" && gate.requiredInCheck), "manifest should require local learner model contracts");
  assert(manifest.gates.some(gate => gate.id === "check:learner-model-alignment" && gate.requiredInCheck), "manifest should require learner model alignment contracts");
  assert(manifest.gates.some(gate => gate.id === "check:learner-model-alignment-mutations" && gate.requiredInCheck), "manifest should require learner model alignment mutation proof");
  assert(manifest.gates.some(gate => gate.id === "check:memory-fixtures" && gate.requiredInCheck), "manifest should require learner memory fixtures");
  assert(manifest.gates.some(gate => gate.id === "check:memory-corrections" && gate.requiredInCheck), "manifest should require learner memory correction contracts");
  assert(manifest.gates.some(gate => gate.id === "check:memory-vault" && gate.requiredInCheck), "manifest should require learner memory vault contracts");
  assert(manifest.gates.some(gate => gate.id === "check:memory-brief" && gate.requiredInCheck), "manifest should require learner memory brief contracts");
  assert(manifest.gates.some(gate => gate.id === "check:agent-handoff" && gate.requiredInCheck), "manifest should require agent handoff contracts");
  assert(manifest.gates.some(gate => gate.id === "check:advisor" && gate.requiredInCheck), "manifest should require advisor fixtures");
  assert(manifest.gates.some(gate => gate.id === "check:companion" && gate.requiredInCheck), "manifest should require lightweight companion fixtures");
  assert(manifest.gates.some(gate => gate.id === "check:guided-session" && gate.requiredInCheck), "manifest should require guided session runtime contracts");
  assert(manifest.gates.some(gate => gate.id === "check:personalization-eval" && gate.requiredInCheck), "manifest should require personalization evaluation");
  assert(manifest.gates.some(gate => gate.id === "check:personalization-mutations" && gate.requiredInCheck), "manifest should require personalization mutation proof");
  assert(manifest.gates.some(gate => gate.id === "check:personalization-trajectory" && gate.requiredInCheck), "manifest should require personalization trajectory replay");
  assert(manifest.gates.some(gate => gate.id === "check:personalization-trajectory-mutations" && gate.requiredInCheck), "manifest should require personalization trajectory mutation proof");
  assert(manifest.gates.some(gate => gate.id === "check:personalization-trajectory-diff" && gate.requiredInCheck), "manifest should require personalization trajectory diff review");
  assert(manifest.gates.some(gate => gate.id === "check:profile-portability" && gate.requiredInCheck), "manifest should require profile portability replay proof");
  assert(manifest.gates.some(gate => gate.id === "check:review-report" && gate.requiredInCheck), "manifest should require unified review report");
  assert(manifest.gates.some(gate => gate.id === "check:review-report-fixture" && gate.requiredInCheck), "manifest should require golden PR review fixture");
  assert(manifest.gates.some(gate => gate.id === "check:quickstart-proof" && gate.requiredInCheck), "manifest should require contributor proof quickstart");
  assert(manifest.gates.some(gate => gate.id === "check:proof-digest" && gate.requiredInCheck), "manifest should require the public proof digest");
  assert(manifest.gates.some(gate => gate.id === "check:demo-learner-report" && gate.requiredInCheck), "manifest should require demo learner report");
  assert(manifest.gates.some(gate => gate.id === "check:demo-learner-diff" && gate.requiredInCheck), "manifest should require demo learner diff review");
  assert(manifest.gates.some(gate => gate.id === "check:today-program-report" && gate.requiredInCheck), "manifest should require Today program report");
  assert(manifest.gates.some(gate => gate.id === "check:today-program-diff" && gate.requiredInCheck), "manifest should require Today program diff review");
  assert(manifest.gates.some(gate => gate.id === "check:guided-session-report" && gate.requiredInCheck), "manifest should require guided session report");
  assert(manifest.gates.some(gate => gate.id === "check:guided-session-diff" && gate.requiredInCheck), "manifest should require guided session diff review");
  assert(manifest.gates.some(gate => gate.id === "check:evaluator-path" && gate.requiredInCheck), "manifest should require the first-visit evaluator path");
  assert(manifest.gates.some(gate => gate.id === "check:headroom" && gate.requiredInCheck), "manifest should require learner headroom compression contracts");
  assert(manifest.gates.some(gate => gate.id === "check:evaluator-journey" && gate.requiredInCheck), "manifest should require the deterministic evaluator journey");
  assert(manifest.gates.some(gate => gate.id === "check:exercise-value-report" && gate.requiredInCheck), "manifest should require the exercise value report");
  assert(manifest.gates.some(gate => gate.id === "check:program-page" && gate.requiredInCheck), "manifest should require the user-facing program page");
  assert(manifest.gates.some(gate => gate.id === "check:proof-page" && gate.requiredInCheck), "manifest should require the public proof page");
  assert(manifest.gates.some(gate => gate.id === "check:capability-map" && gate.requiredInCheck), "manifest should require the product capability map");
  assert(manifest.gates.some(gate => gate.id === "check:public-runtime" && gate.requiredInCheck), "manifest should require the public runtime harness");
  assert(manifest.gates.some(gate => gate.id === "check:public-runtime-mutations" && gate.requiredInCheck), "manifest should require the public runtime mutation harness");
  assert(manifest.publicReports.some(report => report.id === "quality" && report.pagesPath === "reports/quality.json"), "manifest should link the quality report");
  assert(manifest.publicReports.some(report => report.id === "skill-coverage" && report.pagesPath === "reports/skill-coverage.json"), "manifest should link the skill coverage report");
  assert(manifest.publicReports.some(report => report.id === "demo-learner" && report.pagesPath === "reports/demo-learner.json"), "manifest should link the demo learner report");
  assert(manifest.publicReports.some(report => report.id === "evaluator-path" && report.pagesPath === "reports/evaluator-path.json"), "manifest should link the evaluator path report");
  assert(manifest.publicReports.some(report => report.id === "evaluator-journey" && report.pagesPath === "reports/evaluator-journey.json"), "manifest should link the evaluator journey report");
  assert(manifest.publicReports.some(report => report.id === "profile-portability" && report.pagesPath === "reports/profile-portability.json"), "manifest should link the profile portability report");
  assert(manifest.publicReports.some(report => report.id === "exercise-value" && report.pagesPath === "reports/exercise-value.json"), "manifest should link the exercise value report");
  assert(manifest.publicReports.some(report => report.id === "today-program" && report.pagesPath === "reports/today-program.json"), "manifest should link the Today program report");
  assert(manifest.publicReports.some(report => report.id === "guided-session" && report.pagesPath === "reports/guided-session.json"), "manifest should link the guided session report");
  assert(manifest.publicReports.some(report => report.id === "capabilities" && report.pagesPath === "reports/capabilities.json"), "manifest should link the capability map report");
  assert(manifest.publicReports.some(report => report.id === "project-health" && report.pagesPath === "reports/project-health.json"), "manifest should link itself as a public report");
  assert(manifest.workflows.every(workflow => workflow.runsFullCheck && workflow.nodeVersion === "24"), "manifest should link full-check workflows");
  assert(manifest.workflows.some(workflow => workflow.id === "qa" && workflow.requiredSnippets.includes("diff-personalization-trajectory.js")), "manifest should require personalization trajectory PR diff");
  assert(manifest.workflows.some(workflow => workflow.id === "qa" && workflow.requiredSnippets.includes("diff-dashboard-snapshot.js")), "manifest should require dashboard snapshot PR diff");
  assert(manifest.workflows.some(workflow => workflow.id === "qa" && workflow.requiredSnippets.includes("diff-demo-learner-report.js")), "manifest should require demo learner PR diff");
  assert(manifest.workflows.some(workflow => workflow.id === "qa" && workflow.requiredSnippets.includes("diff-today-program-report.js")), "manifest should require Today program PR diff");
  assert(manifest.workflows.some(workflow => workflow.id === "qa" && workflow.requiredSnippets.includes("diff-guided-session-report.js")), "manifest should require guided session PR diff");
  assert(manifest.workflows.some(workflow => workflow.id === "qa" && workflow.requiredSnippets.includes("guided-session-diff.json")), "manifest should require guided session PR diff artifact");
  assert(manifest.workflows.some(workflow => workflow.id === "qa" && workflow.requiredSnippets.includes("build-review-report.js")), "manifest should require unified PR review report");
  assert(manifest.workflows.some(workflow => workflow.id === "qa" && workflow.requiredSnippets.includes("review-report.json")), "manifest should require unified PR review JSON artifact");
  assert(manifest.workflows.some(workflow => workflow.id === "qa" && workflow.requiredSnippets.includes("GITHUB_STEP_SUMMARY")), "manifest should require unified PR review step summary");
  assert(manifest.workflows.some(workflow => workflow.id === "qa" && workflow.requiredSnippets.includes("summary-limit")), "manifest should require capped PR review summaries");
  assert(manifest.workflows.some(workflow => workflow.id === "qa" && workflow.requiredSnippets.includes("summary-message-limit")), "manifest should require bounded PR review messages");
  assert(manifest.workflows.some(workflow => workflow.id === "qa" && workflow.requiredSnippets.includes("proof.html")), "manifest should require proof page file checks");
  assert(manifest.deterministicFixtures.some(fixture => fixture.id === "dashboard-recommendations" && fixture.fresh), "manifest should link fresh deterministic fixtures");
  assert(manifest.deterministicFixtures.some(fixture => fixture.id === "learner-model-profiles" && fixture.fresh), "manifest should link fresh learner model fixtures");
  assert(manifest.deterministicFixtures.some(fixture => fixture.id === "learner-memory-profiles" && fixture.fresh), "manifest should link fresh learner memory fixtures");
  assert(manifest.deterministicFixtures.some(fixture => fixture.id === "agent-advice-profiles" && fixture.fresh), "manifest should link fresh agent advice fixtures");
  assert(manifest.deterministicFixtures.some(fixture => fixture.id === "companion-profiles" && fixture.fresh), "manifest should link fresh companion fixtures");
  assert(manifest.deterministicFixtures.some(fixture => fixture.id === "agent-handoff-profiles" && fixture.fresh), "manifest should link fresh agent handoff fixtures");
  assert(manifest.guarantees.every(guarantee => guarantee.pass), "manifest guarantees should all pass");

  const formatted = formatProjectHealthManifest(manifest);
  assert(formatted.includes("Project Health Manifest"), "formatter should include report title");
  assert(formatted.includes("fixtures-fresh-and-proven"), "formatter should include fixture guarantee");
  assert(formatted.includes("Issues:\nnone"), "formatter should show empty issue list");
}

function runMissingGateSmoke() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plata-health-"));
  try {
    copyHealthRoot(root);
    const packagePath = path.join(root, "package.json");
    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    delete pkg.scripts["check:dashboard-snapshot-mutations"];
    pkg.scripts.check = pkg.scripts.check.replace(" && npm run check:dashboard-snapshot-mutations", "");
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");

    const manifest = buildProjectHealthManifest({ root });
    assert(manifest.status === "fail", "manifest should fail when a required gate is missing");
    assert(manifest.issues.some(issue => issue.includes("check:dashboard-snapshot-mutations: missing package script")), "manifest should report missing gate script");
    assert(manifest.issues.some(issue => issue.includes("check:dashboard-snapshot-mutations: not included in npm run check")), "manifest should report missing check-chain gate");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runStaleFixtureSmoke() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plata-health-"));
  try {
    copyHealthRoot(root);
    const fixturePath = path.join(root, "scripts", "fixtures", "dashboard-recommendations.snapshot.json");
    const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
    fixture.scenarios[0].candidateOrder = fixture.scenarios[0].candidateOrder.slice().reverse();
    fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2) + "\n");

    const manifest = buildProjectHealthManifest({ root });
    assert(manifest.status === "fail", "manifest should fail when deterministic fixture is stale");
    assert(manifest.issues.some(issue => issue.includes("dashboard-recommendations fixture: fixture is stale")), "manifest should report stale fixture");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runStaleMemoryFixtureSmoke() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plata-health-"));
  try {
    copyHealthRoot(root);
    const fixturePath = path.join(root, "scripts", "fixtures", "learner-memory-profiles.json");
    const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
    fixture.profiles[0].expected.memoryFingerprint = "mem-mutated";
    fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2) + "\n");

    const manifest = buildProjectHealthManifest({ root });
    assert(manifest.status === "fail", "manifest should fail when learner memory fixtures are stale");
    assert(manifest.issues.some(issue => issue.includes("learner-memory-profiles fixture: fixture is stale")), "manifest should report stale learner memory fixtures");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runStaleAdvisorFixtureSmoke() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plata-health-"));
  try {
    copyHealthRoot(root);
    const fixturePath = path.join(root, "scripts", "fixtures", "learner-memory-profiles.json");
    const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
    fixture.profiles[0].expected.advisor.traceFingerprint = "adv-mutated";
    fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2) + "\n");

    const manifest = buildProjectHealthManifest({ root });
    assert(manifest.status === "fail", "manifest should fail when advisor fixtures are stale");
    assert(manifest.issues.some(issue => issue.includes("agent-advice-profiles fixture: fixture is stale")), "manifest should report stale advisor fixtures");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function run() {
  runBaseSmoke();
  runMissingGateSmoke();
  runStaleFixtureSmoke();
  runStaleMemoryFixtureSmoke();
  runStaleAdvisorFixtureSmoke();
  console.log("ok - project health manifest links gates, reports, workflows, and fixtures");
  console.log("ok - project health manifest catches missing QA gates");
  console.log("ok - project health manifest catches stale deterministic fixtures");
}

run();

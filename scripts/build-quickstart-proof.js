#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildDemoLearnerReport } = require("./build-demo-learner-report.js");
const { buildCapabilityMap } = require("./build-capability-map.js");
const { buildProjectHealthManifest } = require("./build-project-health-manifest.js");
const { buildGuidedSessionReport } = require("./build-guided-session-report.js");
const { buildExerciseValueReport } = require("./build-exercise-value-report.js");
const {
  buildReviewReport,
  formatReviewMarkdown
} = require("./build-review-report.js");

const repoRoot = path.resolve(__dirname, "..");
const reviewFixtureFiles = {
  quality: "scripts/fixtures/review-report-golden/quality-diff.json",
  dashboard: "scripts/fixtures/review-report-golden/dashboard-diff.json",
  demo: "scripts/fixtures/review-report-golden/demo-diff.json",
  today: "scripts/fixtures/review-report-golden/today-diff.json",
  guided: "scripts/fixtures/review-report-golden/guided-diff.json",
  personalization: "scripts/fixtures/review-report-golden/personalization-diff.json"
};

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function reportRoot(options = {}) {
  return path.resolve(options.root || repoRoot);
}

function rel(file, root = repoRoot) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function displayRel(file, root = repoRoot) {
  const absolute = path.resolve(file);
  const workspaceRel = path.relative(repoRoot, absolute);
  if (!workspaceRel.startsWith("..") && !path.isAbsolute(workspaceRel)) return workspaceRel.replaceAll(path.sep, "/");
  return rel(absolute, root);
}

function readJson(root, relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function writeText(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value.endsWith("\n") ? value : `${value}\n`);
}

function status(pass) {
  return pass ? "pass" : "fail";
}

function artifact(id, file, statusValue, label) {
  return {
    id,
    file,
    status: statusValue,
    label
  };
}

function buildGoldenReview(root) {
  const input = Object.fromEntries(
    Object.entries(reviewFixtureFiles).map(([id, relPath]) => [id, readJson(root, relPath)])
  );
  const report = buildReviewReport(input);
  const markdown = formatReviewMarkdown(report, {
    entryLimit: 2,
    messageLimit: 72
  });
  return { report, markdown };
}

function checkRows(demoLearner, capabilityMap, projectHealth, goldenReview, goldenMarkdown, guidedSession, exerciseValue) {
  const doctorChain = exerciseValue.transferChains.find(row => row.id === "doctor-apotek-skrive-sundhed");
  const bojningChain = exerciseValue.transferChains.find(row => row.id === "job-followup-bojning-gender-trap");
  const distributionGate = projectHealth.gates.find(row => row.id === "check:distribution");
  return [
    {
      id: "demo-learner",
      status: status(demoLearner.status === "pass"),
      detail: `${demoLearner.totals.visibleMemoryFacts} memory fact(s), ${demoLearner.totals.planSteps} plan step(s), ${demoLearner.totals.storageWrites} storage write(s)`
    },
    {
      id: "capability-map",
      status: status(capabilityMap.status === "pass"),
      detail: `${capabilityMap.totals.capabilities} capability(ies), ${capabilityMap.totals.proofGates} proof gate(s)`
    },
    {
      id: "project-health",
      status: status(projectHealth.status === "pass"),
      detail: `${projectHealth.totals.gates} gate(s), ${projectHealth.totals.publicReports} public report(s)`
    },
    {
      id: "golden-review-fixture",
      status: status(goldenReview.status === "regression"
        && goldenReview.summary.surfaces === 6
        && goldenReview.summary.regressions === 10
        && goldenMarkdown.includes("+8 more in JSON artifact")),
      detail: `${goldenReview.summary.changes} change(s), ${goldenReview.summary.regressions} regression(s), ${goldenReview.summary.reviewChanges} review change(s)`
    },
    {
      id: "week4-guided-scenarios",
      status: status(guidedSession.status === "pass" && guidedSession.totals.scenarios === 12),
      detail: `${guidedSession.totals.scenarios} guided scenario(s), ${guidedSession.totals.outcomeReceipts} outcome receipt(s)`
    },
    {
      id: "week4-doctor-skrive-chain",
      status: status(exerciseValue.status === "pass" && doctorChain && doctorChain.status === "pass"),
      detail: doctorChain
        ? `${doctorChain.id} transfer chain (${doctorChain.channels.length} channel(s))`
        : "doctor-apotek-skrive-sundhed transfer chain missing"
    },
    {
      id: "week4-bojning-trap-chain",
      status: status(!bojningChain || (exerciseValue.status === "pass" && bojningChain.status === "pass")),
      detail: bojningChain
        ? `${bojningChain.id} repair chain (${bojningChain.channels.length} trap category(ies))`
        : "job-followup-bojning-gender-trap repair chain skipped (gender-trap option not on branch)"
    },
    {
      id: "week4-distribution-gate",
      status: status(Boolean(distributionGate && distributionGate.status === "pass" && distributionGate.checkOrder !== null)),
      detail: distributionGate
        ? `${distributionGate.id} in npm run check (${projectHealth.totals.gates} gate(s) total)`
        : "check:distribution gate missing from project health"
    }
  ];
}

function formatQuickstartProof(proof) {
  return [
    "# Contributor Proof Quickstart",
    "",
    `status: ${proof.status}`,
    "",
    "Run this path when you want a fast, inspectable picture of the project before a deeper contribution.",
    "",
    "## Commands",
    ...proof.commands.map((command, index) => `${index + 1}. \`${command}\``),
    "",
    "## Artifacts",
    "| Artifact | Status | What it proves |",
    "| --- | --- | --- |",
    ...proof.artifacts.map(item => `| \`${item.file}\` | ${item.status} | ${item.label} |`),
    "",
    "## Checks",
    "| Check | Status | Detail |",
    "| --- | --- | --- |",
    ...proof.checks.map(item => `| ${item.id} | ${item.status} | ${item.detail} |`),
    ""
  ].join("\n");
}

function writeQuickstartProof(outDir, options = {}) {
  const root = reportRoot(options);
  outDir = path.resolve(repoRoot, outDir || path.join(repoRoot, ".dist", "quickstart-proof"));
  fs.mkdirSync(outDir, { recursive: true });

  const demoLearner = buildDemoLearnerReport({ root });
  const capabilityMap = buildCapabilityMap({ root });
  const projectHealth = buildProjectHealthManifest({ root });
  const guidedSession = buildGuidedSessionReport({ root });
  const exerciseValue = buildExerciseValueReport({ root });
  const golden = buildGoldenReview(root);
  const checks = checkRows(
    demoLearner,
    capabilityMap,
    projectHealth,
    golden.report,
    golden.markdown,
    guidedSession,
    exerciseValue
  );
  const overallStatus = checks.every(item => item.status === "pass") ? "pass" : "fail";
  const artifacts = [
    artifact("demo-learner", "demo-learner.json", demoLearner.status, "Read-only rich learner profile and privacy guarantees"),
    artifact("capabilities", "capabilities.json", capabilityMap.status, "User-facing claims linked to gates, reports, docs, and source files"),
    artifact("project-health", "project-health.json", projectHealth.status, "Required gates, workflows, public reports, and deterministic fixtures"),
    artifact("review-report", "review-report.json", golden.report.status, "Full golden PR diff aggregation across all review surfaces"),
    artifact("review-summary", "review-summary.md", overallStatus, "Capped reviewer-facing Markdown summary over the full JSON artifact"),
    artifact("quickstart-json", "quickstart.json", overallStatus, "Machine-readable quickstart index"),
    artifact("quickstart-markdown", "quickstart.md", overallStatus, "Human-readable quickstart summary")
  ];
  const proof = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: overallStatus,
    outputDir: displayRel(outDir, root),
    commands: [
      "npm run proof:quickstart",
      "npm run check:quickstart-proof",
      "npm run check"
    ],
    artifacts,
    checks
  };

  writeJson(path.join(outDir, "demo-learner.json"), demoLearner);
  writeJson(path.join(outDir, "capabilities.json"), capabilityMap);
  writeJson(path.join(outDir, "project-health.json"), projectHealth);
  writeJson(path.join(outDir, "review-report.json"), golden.report);
  writeText(path.join(outDir, "review-summary.md"), golden.markdown);
  writeJson(path.join(outDir, "quickstart.json"), proof);
  writeText(path.join(outDir, "quickstart.md"), formatQuickstartProof(proof));
  return proof;
}

function main() {
  const outDir = argValue("--out") || path.join(repoRoot, ".dist", "quickstart-proof");
  const root = argValue("--root") || repoRoot;
  const proof = writeQuickstartProof(outDir, { root });
  if (hasFlag("--json")) {
    process.stdout.write(JSON.stringify(proof, null, 2) + "\n");
  } else if (hasFlag("--text")) {
    process.stdout.write(formatQuickstartProof(proof) + "\n");
  } else {
    console.log(`quickstart proof built: ${displayRel(path.resolve(repoRoot, outDir), root)} (${proof.artifacts.length} artifact(s), ${proof.checks.length} check(s))`);
  }
  if (proof.status !== "pass") process.exit(1);
}

if (require.main === module) main();

module.exports = {
  buildGoldenReview,
  formatQuickstartProof,
  writeQuickstartProof
};

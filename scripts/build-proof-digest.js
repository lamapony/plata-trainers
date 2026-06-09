#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { buildDemoLearnerReport } = require("./build-demo-learner-report.js");
const { buildCapabilityMap } = require("./build-capability-map.js");
const { buildProjectHealthManifest } = require("./build-project-health-manifest.js");
const { buildEvaluatorJourneyReport } = require("./build-evaluator-journey-report.js");
const { buildProfilePortabilityReport } = require("./build-profile-portability-report.js");
const { buildExerciseValueReport } = require("./build-exercise-value-report.js");
const { writeQuickstartProof } = require("./build-quickstart-proof.js");

const repoRoot = path.resolve(__dirname, "..");

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function sourceRoot(options = {}) {
  if (typeof options === "string") return path.resolve(options);
  return path.resolve(options.root || repoRoot);
}

function displayRel(file, root = repoRoot) {
  const absolute = path.resolve(file);
  const workspaceRel = path.relative(repoRoot, absolute);
  if (!workspaceRel.startsWith("..") && !path.isAbsolute(workspaceRel)) return workspaceRel.replaceAll(path.sep, "/");
  return path.relative(root, absolute).replaceAll(path.sep, "/");
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function status(pass) {
  return pass ? "pass" : "fail";
}

function countLabel(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function capability(report, id) {
  return (report.capabilities || []).find(item => item.id === id) || null;
}

function hasGate(capabilityRow, gateId) {
  return !!capabilityRow && (capabilityRow.proofGates || []).some(gate => gate.id === gateId && gate.status === "pass");
}

function hasSurface(capabilityRow, surface) {
  return !!capabilityRow && (capabilityRow.surfaces || []).includes(surface);
}

function hasReport(capabilityRow, reportId) {
  return !!capabilityRow && (capabilityRow.publicReports || []).some(report => report.id === reportId && report.status === "pass");
}

function buildGoldenQuickstart(root) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-proof-digest-"));
  try {
    const quickstart = writeQuickstartProof(tmp, { root });
    const review = JSON.parse(fs.readFileSync(path.join(tmp, "review-report.json"), "utf8"));
    const summary = fs.readFileSync(path.join(tmp, "review-summary.md"), "utf8");
    return { quickstart, review, summary };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function row(id, title, takeaway, evidence, pass, detail) {
  return {
    id,
    title,
    status: status(pass),
    takeaway,
    evidence,
    detail
  };
}

function buildProofDigest(options = {}) {
  const root = sourceRoot(options);
  const demo = buildDemoLearnerReport({ root });
  const capabilities = buildCapabilityMap({ root });
  const journey = buildEvaluatorJourneyReport({ root, demo, capabilities });
  const portability = buildProfilePortabilityReport({ root });
  const exerciseValue = buildExerciseValueReport({ root });
  const health = buildProjectHealthManifest({ root });
  const golden = buildGoldenQuickstart(root);
  const proofCapability = capability(capabilities, "public-github-proof-surface");
  const issues = [];

  const allHealthPass = health.status === "pass" && health.totals.issues === 0;
  const allCapabilityPass = capabilities.status === "pass" && capabilities.totals.issues === 0;
  const demoReadOnly = demo.status === "pass" && demo.totals.storageWrites === 0 && demo.totals.visibleMemoryFacts > 0;
  const quickstartPass = golden.quickstart.status === "pass" && golden.quickstart.artifacts.length >= 7;
  const reviewFixturePass = golden.review.status === "regression"
    && golden.review.summary.surfaces === 6
    && golden.review.summary.regressions > 0
    && golden.summary.includes("more in JSON artifact");
  const proofPagePass = hasGate(proofCapability, "check:proof-page") && hasSurface(proofCapability, "proof.html");
  const visitorWalkthroughPass = proofPagePass
    && hasGate(proofCapability, "check:evaluator-path")
    && hasGate(proofCapability, "check:evaluator-journey")
    && hasSurface(proofCapability, "Home evaluator path")
    && hasReport(proofCapability, "evaluator-path")
    && hasReport(proofCapability, "evaluator-journey")
    && hasReport(proofCapability, "demo-learner")
    && hasReport(proofCapability, "guided-session")
    && journey.status === "pass"
    && journey.totals.passedStages === journey.totals.stages;
  const profilePortabilityPass = hasGate(proofCapability, "check:profile-portability")
    && hasReport(proofCapability, "profile-portability")
    && hasSurface(proofCapability, "reports/profile-portability.json")
    && portability.status === "pass"
    && portability.totals.passedStages === portability.totals.stages;
  const exerciseValuePass = hasGate(proofCapability, "check:exercise-value-report")
    && hasReport(proofCapability, "exercise-value")
    && hasSurface(proofCapability, "reports/exercise-value.json")
    && exerciseValue.status === "pass"
    && exerciseValue.totals.flagshipChains >= 1
    && exerciseValue.totals.archetypesCovered === exerciseValue.requiredArchetypes.length;
  const digestPublished = hasGate(proofCapability, "check:proof-digest")
    && hasSurface(proofCapability, "reports/proof-digest.json")
    && hasReport(proofCapability, "proof-digest");
  const quickstartPublished = hasReport(proofCapability, "quickstart-proof")
    && hasSurface(proofCapability, "reports/quickstart-proof/quickstart.json");

  [
    [allHealthPass, "project health is not passing"],
    [allCapabilityPass, "capability map is not passing"],
    [demoReadOnly, "demo learner is not proving read-only personalization"],
    [quickstartPass, "quickstart proof is not passing"],
    [reviewFixturePass, "golden review fixture is not proving reviewer behavior"],
    [proofPagePass, "proof page is not linked from the public proof capability"],
    [visitorWalkthroughPass, "proof page walkthrough is not backed by demo and guided reports"],
    [profilePortabilityPass, "profile portability proof is not linked from the public proof capability"],
    [exerciseValuePass, "exercise value proof is not linked from the public proof capability"],
    [digestPublished, "proof digest is not linked from the public proof capability"],
    [quickstartPublished, "quickstart proof is not linked from the public proof capability"]
  ].forEach(([pass, issue]) => {
    if (!pass) issues.push(issue);
  });

  const whatThisProves = [
    row(
      "static-public-artifact",
      "The project can be evaluated from public static files.",
      `Pages publishes a checked artifact with ${countLabel(capabilities.totals.publicReports, "public report", "public reports")} and ${countLabel(health.totals.gates, "required gate", "required gates")}.`,
      ["check:pages", "check:static", "reports/project-health.json", "reports/capabilities.json"],
      allHealthPass && allCapabilityPass,
      "A visitor can inspect the same generated reports that CI uses before deployment."
    ),
    row(
      "private-personalization",
      "Personalization is inspectable without writing visitor data.",
      `The demo learner exposes ${countLabel(demo.totals.visibleMemoryFacts, "memory fact", "memory facts")} and ${countLabel(demo.totals.planSteps, "plan step", "plan steps")} with ${demo.totals.storageWrites} storage writes.`,
      ["dashboard.html?demo=learner", "reports/demo-learner.json", "check:demo-learner-report"],
      demoReadOnly,
      "The demo profile proves memory, planner, and companion behavior without touching local progress."
    ),
    row(
      "profile-portability",
      "A real local profile can be exported, imported, and replayed.",
      `The portability trace ${portability.traceId} replays ${countLabel(portability.totals.eventCount, "event", "events")}, ${countLabel(portability.totals.memoryCorrections, "memory correction", "memory corrections")}, and ${countLabel(portability.totals.guidedOutcomes, "guided outcome", "guided outcomes")}.`,
      ["reports/profile-portability.json", "check:profile-portability", "scripts/debug-profile-replay.js"],
      profilePortabilityPass,
      "This proves a non-demo learner can move progress between browser sessions without losing plan execution, correction audit, guided receipts, or privacy guardrails."
    ),
    row(
      "flagship-exercise-value",
      "The flagship exercises are not ordinary context-free quizzes.",
      `The exercise value report covers ${countLabel(exerciseValue.totals.flagshipChains, "flagship chain", "flagship chains")}, ${exerciseValue.totals.archetypesCovered}/${exerciseValue.requiredArchetypes.length} radical archetypes, ${countLabel(exerciseValue.totals.nearMisses, "near miss", "near misses")}, and ${countLabel(exerciseValue.totals.repairLadders, "repair ladder", "repair ladders")}.`,
      ["reports/exercise-value.json", "check:exercise-value-report", "lessons/lesson-b2-radiator/data.js"],
      exerciseValuePass,
      "The report fails if the exercise loses consequence, grammatical near-miss, repair ladder, channel transfer, memory recurrence, or explain-your-choice proof."
    ),
    row(
      "reviewer-output-contract",
      "Reviewer output is tested as a product surface.",
      `The golden fixture covers ${countLabel(golden.review.summary.surfaces, "review surface", "review surfaces")} with capped Markdown and full JSON behind it.`,
      ["check:review-report-fixture", "reports/quickstart-proof/review-report.json", "reports/quickstart-proof/review-summary.md"],
      reviewFixturePass,
      "The fixture intentionally contains regressions so fail modes, grouping, ordering, and truncation stay proven."
    ),
    row(
      "fast-contributor-proof",
      "A contributor has a short proof path before the full suite.",
      `The quickstart writes ${countLabel(golden.quickstart.artifacts.length, "artifact", "artifacts")} and links ${countLabel(golden.quickstart.checks.length, "check", "checks")}.`,
      ["npm run proof:quickstart", "check:quickstart-proof", "reports/quickstart-proof/quickstart.json"],
      quickstartPass,
      "The fast path is not a replacement for full QA; it is an orientation layer over the same core claims."
    )
  ];

  const whatChanged = [
    row(
      "proof-page-front-door",
      "Proof is now one readable page, not scattered CI output.",
      "The public proof capability links `proof.html`, the renderer, and the page smoke gate.",
      ["proof.html", "proof.js", "check:proof-page"],
      proofPagePass,
      "This gives non-maintainers one place to inspect the proof surface before opening raw reports."
    ),
    row(
      "visitor-proof-walkthrough",
      "A visitor can follow one deterministic learner loop before opening raw JSON.",
      `The proof page now connects the first-visit evaluator path, demo learner, Today recommendation, guided route, dashboard return receipt, outcome receipt, and audit trail through ${journey.traceId}.`,
      ["reports/evaluator-path.json", "reports/evaluator-journey.json", "dashboard.html?demo=learner", "reports/demo-learner.json", "reports/guided-session.json", "check:evaluator-path", "check:evaluator-journey", "check:proof-page"],
      visitorWalkthroughPass,
      "This turns the generated reports into one inspectable acceptance path for first-time evaluators."
    ),
    row(
      "quickstart-proof-published",
      "Quickstart proof is published with the Pages artifact.",
      "The local contributor proof index is also available under `reports/quickstart-proof/` on Pages.",
      ["reports/quickstart-proof/quickstart.json", "reports/quickstart-proof/quickstart.md", "check:quickstart-proof"],
      quickstartPublished,
      "A visitor can compare the friendly page with the machine-readable quickstart index."
    ),
    row(
      "plain-language-digest",
      "The proof page has a plain-language digest over the generated reports.",
      "The digest is generated and checked instead of being hard-coded into the HTML.",
      ["reports/proof-digest.json", "check:proof-digest", "check:proof-page"],
      digestPublished,
      "This keeps the public explanation aligned with the underlying reports."
    )
  ];

  const trustBoundaries = [
    "The digest summarizes generated reports; the JSON artifacts remain the source of truth.",
    "The golden PR review fixture is expected to contain regressions so the reviewer fail path stays visible.",
    "The public demo learner is read-only and in-memory; real learner progress remains local to the browser.",
    "No account sync or model-backed companion is required for the current proof surface."
  ];

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: issues.length ? "fail" : "pass",
    headline: issues.length ? "Proof digest needs attention" : "The public proof surface is coherent and inspectable.",
    summary: "This digest translates generated reports into product-level claims for visitors, contributors, and reviewers.",
    totals: {
      claims: whatThisProves.length,
      changes: whatChanged.length,
      trustBoundaries: trustBoundaries.length,
      issues: issues.length
    },
    sourceReports: [
      "reports/evaluator-path.json",
      "reports/evaluator-journey.json",
      "reports/profile-portability.json",
      "reports/exercise-value.json",
      "reports/demo-learner.json",
      "reports/guided-session.json",
      "reports/capabilities.json",
      "reports/project-health.json",
      "reports/quickstart-proof/quickstart.json",
      "reports/quickstart-proof/review-report.json"
    ],
    issues,
    whatThisProves,
    whatChanged,
    trustBoundaries
  };
}

function formatProofDigest(digest) {
  const lines = [
    "Proof Digest",
    `status: ${digest.status}`,
    digest.headline,
    "",
    "What this proves:"
  ];
  digest.whatThisProves.forEach(item => {
    lines.push(`- ${item.status} ${item.title}`);
    lines.push(`  ${item.takeaway}`);
  });
  lines.push("", "What changed:");
  digest.whatChanged.forEach(item => {
    lines.push(`- ${item.status} ${item.title}`);
  });
  lines.push("", "Trust boundaries:");
  digest.trustBoundaries.forEach(item => lines.push(`- ${item}`));
  lines.push("", "Issues:");
  if (digest.issues.length) digest.issues.forEach(issue => lines.push(`- ${issue}`));
  else lines.push("none");
  return lines.join("\n");
}

function writeProofDigest(outPath, options = {}) {
  const root = sourceRoot(options);
  const digest = buildProofDigest({ root });
  writeJson(outPath, digest);
  if (options.text) console.log(formatProofDigest(digest));
  return digest;
}

function main() {
  const root = argValue("--root") || repoRoot;
  const out = argValue("--out") || path.join(repoRoot, ".dist", "proof-digest.json");
  const digest = buildProofDigest({ root });
  if (hasFlag("--json")) {
    process.stdout.write(JSON.stringify(digest, null, 2) + "\n");
  } else if (hasFlag("--text")) {
    process.stdout.write(formatProofDigest(digest) + "\n");
  } else {
    writeJson(path.resolve(repoRoot, out), digest);
    console.log(`proof digest built: ${displayRel(path.resolve(repoRoot, out), root)} (${digest.totals.claims} claim(s), ${digest.totals.changes} change(s))`);
  }
  if (digest.status !== "pass") process.exit(1);
}

if (require.main === module) main();

module.exports = {
  buildProofDigest,
  formatProofDigest,
  writeProofDigest
};

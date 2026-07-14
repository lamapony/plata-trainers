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
      "The live site is the same version the checks approved.",
      `Before publication, Platå runs ${countLabel(health.totals.gates, "required check", "required checks")} and publishes ${countLabel(capabilities.totals.publicReports, "public result", "public results")}.`,
      ["check:pages", "check:static", "reports/project-health.json", "reports/capabilities.json"],
      allHealthPass && allCapabilityPass,
      "Anyone can inspect the same results that decide whether the site is ready to publish."
    ),
    row(
      "private-personalization",
      "The example learner is safe to explore.",
      `The example contains ${countLabel(demo.totals.visibleMemoryFacts, "saved clue", "saved clues")} and ${countLabel(demo.totals.planSteps, "practice step", "practice steps")}, but writes nothing to your own progress.`,
      ["dashboard.html?demo=learner", "reports/demo-learner.json", "check:demo-learner-report"],
      demoReadOnly,
      "You can see how Platå chooses a next step without changing anything in your browser."
    ),
    row(
      "profile-portability",
      "You can take your progress with you.",
      `The move-progress check replays ${countLabel(portability.totals.eventCount, "practice event", "practice events")}, ${countLabel(portability.totals.memoryCorrections, "correction", "corrections")}, and ${countLabel(portability.totals.guidedOutcomes, "completed result", "completed results")}.`,
      ["reports/profile-portability.json", "check:profile-portability", "scripts/debug-profile-replay.js"],
      profilePortabilityPass,
      "Exporting and importing your profile keeps your plan and progress while leaving raw answers out of the file."
    ),
    row(
      "flagship-exercise-value",
      "Exercises react to the kind of mistake you make.",
      `The lesson checks cover ${countLabel(exerciseValue.totals.flagshipChains, "complete learning path", "complete learning paths")}, ${countLabel(exerciseValue.totals.nearMisses, "realistic almost-right answer", "realistic almost-right answers")}, and ${countLabel(exerciseValue.totals.repairLadders, "step-by-step repair", "step-by-step repairs")}.`,
      ["reports/exercise-value.json", "check:exercise-value-report", "lessons/lesson-b2-radiator/data.js"],
      exerciseValuePass,
      "A lesson fails its check if every wrong answer leads to the same generic explanation or if a promised repair disappears."
    ),
    row(
      "reviewer-output-contract",
      "The review process is tested too.",
      `A deliberately broken example checks that reviewers can still see and understand problems across ${countLabel(golden.review.summary.surfaces, "part of the product", "parts of the product")}.`,
      ["check:review-report-fixture", "reports/quickstart-proof/review-report.json", "reports/quickstart-proof/review-summary.md"],
      reviewFixturePass,
      "The test makes sure real regressions are grouped clearly instead of disappearing in a wall of technical output."
    ),
    row(
      "fast-contributor-proof",
      "Contributors can check a change quickly.",
      `A short preflight creates ${countLabel(golden.quickstart.artifacts.length, "review file", "review files")} and links ${countLabel(golden.quickstart.checks.length, "important check", "important checks")}.`,
      ["npm run proof:quickstart", "check:quickstart-proof", "reports/quickstart-proof/quickstart.json"],
      quickstartPass,
      "It gives a useful first answer before the complete test suite runs."
    )
  ];

  const whatChanged = [
    row(
      "proof-page-front-door",
      "The evidence now has one front door.",
      "Visitors can start with this page instead of hunting through build logs and JSON files.",
      ["proof.html", "proof.js", "check:proof-page"],
      proofPagePass,
      "Technical reports remain available, but they are no longer the required starting point."
    ),
    row(
      "visitor-proof-walkthrough",
      "A visitor can follow one complete learner story.",
      "The page connects an example learner, one recommendation, a short practice, and the result that comes back.",
      ["reports/evaluator-path.json", "reports/evaluator-journey.json", "dashboard.html?demo=learner", "reports/demo-learner.json", "reports/guided-session.json", "check:evaluator-path", "check:evaluator-journey", "check:proof-page"],
      visitorWalkthroughPass,
      "The human story comes first; the technical trail is still there for anyone who wants to verify it."
    ),
    row(
      "quickstart-proof-published",
      "The short contributor check is public.",
      "The same quick review used by contributors is published with the site.",
      ["reports/quickstart-proof/quickstart.json", "reports/quickstart-proof/quickstart.md", "check:quickstart-proof"],
      quickstartPublished,
      "A curious visitor can compare this explanation with the machine-readable result."
    ),
    row(
      "plain-language-digest",
      "The plain-language explanation stays connected to the checks.",
      "This summary is rebuilt from the current reports instead of being a hand-written promise that can go stale.",
      ["reports/proof-digest.json", "check:proof-digest", "check:proof-page"],
      digestPublished,
      "If the underlying evidence changes, this page changes with it."
    )
  ];

  const trustBoundaries = [
    "This page summarizes the checks; the downloadable reports remain the exact record.",
    "One test example is broken on purpose so the review process can prove that it catches failures.",
    "The example learner cannot change your progress. Your real practice stays in your browser.",
    "Platå does not need an account, cloud sync, or a hidden AI model to choose the next practice."
  ];

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: issues.length ? "fail" : "pass",
    headline: issues.length ? "Some promises still need evidence" : "The important promises are checked in public.",
    summary: "Here is what Platå checks before a lesson or product claim is treated as ready.",
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

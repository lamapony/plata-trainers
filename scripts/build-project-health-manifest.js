#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildQualityReport } = require("./build-quality-report.js");
const { buildSkillCoverageReport } = require("./build-skill-coverage-report.js");
const { buildDemoLearnerReport } = require("./build-demo-learner-report.js");
const { buildTodayProgramReport } = require("./build-today-program-report.js");
const { buildCapabilityMap } = require("./build-capability-map.js");
const {
  buildDashboardRecommendationSnapshot,
  snapshotText
} = require("./snapshot-dashboard-recommendations.js");
const {
  evaluateLearnerMemoryFixtures
} = require("./smoke-memory-fixtures.js");
const {
  evaluateAdvisorFixtures
} = require("./smoke-advisor-fixtures.js");
const {
  evaluateCompanionFixtures
} = require("./smoke-companion.js");
const {
  evaluateLearnerModelFixtures
} = require("./smoke-learner-model.js");
const {
  evaluateAgentHandoffFixtures
} = require("./smoke-agent-handoff.js");
const {
  evaluatePersonalizationProfiles
} = require("./smoke-personalization-eval.js");

const repoRoot = path.resolve(__dirname, "..");

const requiredGates = [
  { id: "check:syntax", category: "static", contract: "All JavaScript files parse before deeper checks run." },
  { id: "check:kernel", category: "state", contract: "Shared progress state, migration, import/export, weak tags, and repair closure behavior." },
  { id: "check:competencies", category: "pedagogy", contract: "Root competency graph groups gold mastery signals." },
  { id: "check:skill-coverage", category: "pedagogy", contract: "Gold mastery signals map cleanly to the root skill graph." },
  { id: "check:evidence", category: "diagnostics", contract: "Evidence ledger ranks open, closed, reopened, miss, and correct facts." },
  { id: "check:events", category: "replay", contract: "Privacy-conscious learning events replay deterministic profile facts." },
  { id: "check:memory", category: "personalization", contract: "Local learner memory facts compile from redacted events with source fingerprints and no raw answers." },
  { id: "check:learner-model", category: "personalization", contract: "Local adaptive learner model ranks memory facts with explicit weights, citations, and privacy guardrails." },
  { id: "check:learner-model-alignment", category: "personalization", contract: "Learner model focus stays aligned with planner-selected and advisor-cited memory facts." },
  { id: "check:learner-model-alignment-mutations", category: "mutation", contract: "Bad learner-model, planner, and advisor alignment contracts fail CI." },
  { id: "check:memory-fixtures", category: "personalization", contract: "Returning, stale, repaired, and recurring-trap learner memory fixtures remain deterministic and planner-cited." },
  { id: "check:memory-corrections", category: "personalization", contract: "Learner-corrected memory facts keep a strict schema, source fingerprints, and no raw answers." },
  { id: "check:memory-vault", category: "personalization", contract: "Optional account memory vaults contain derived facts only, reject raw answer history, and merge imports without resurrecting hidden/corrected facts." },
  { id: "check:memory-brief", category: "personalization", contract: "Agent-readable memory briefs cite vault facts, preserve root-skill focus, and exclude raw history." },
  { id: "check:agent-handoff", category: "personalization", contract: "Agent handoff packets cite memory-brief facts, constrain allowed actions, and reject raw history." },
  { id: "check:advisor", category: "personalization", contract: "Deterministic advisor advice cites learner memory facts and rejects privacy leaks." },
  { id: "check:companion", category: "personalization", contract: "Lightweight companion cards and Hermes bridge briefs stay cited, read-only, and deterministic." },
  { id: "check:personalization-eval", category: "personalization", contract: "Fixed learner profiles prove memory, planner, advisor, and counterfactual drift stay aligned." },
  { id: "check:personalization-mutations", category: "mutation", contract: "Bad personalization advisor/planner contracts fail the cross-layer evaluation harness." },
  { id: "check:personalization-trajectory", category: "replay", contract: "Personalization trajectories prove repair, review, reopen, and root-skill transitions over time." },
  { id: "check:personalization-trajectory-mutations", category: "mutation", contract: "Broken personalization replay transitions fail CI." },
  { id: "check:personalization-trajectory-diff", category: "review", contract: "Personalization trajectory changes produce compact review diffs and regression flags." },
  { id: "check:profile-replay", category: "debug", contract: "Dashboard JSON exports can be replay-debugged by maintainers." },
  { id: "check:planner", category: "planner", contract: "Planner decisions and practice plans preserve traces and explanations." },
  { id: "check:planner-mutations", category: "mutation", contract: "Bad mastery/remediation planner contracts fail CI." },
  { id: "check:catalog", category: "catalog", contract: "Trainer registry and gold lesson data paths resolve." },
  { id: "check:home", category: "runtime", contract: "Home launcher routes starter, continue, repair, and active-plan flows." },
  { id: "check:lesson-engine", category: "runtime", contract: "Gold simulation paths replay through the real lesson engine." },
  { id: "check:dashboard", category: "runtime", contract: "Dashboard renders diagnostics, plans, ledger, catalog loading, and profile portability." },
  { id: "check:demo-learner-report", category: "report", contract: "Read-only demo learner profile builds as a deterministic public contract report." },
  { id: "check:demo-learner-diff", category: "review", contract: "Demo learner report changes produce compact review diffs and regression flags." },
  { id: "check:today-program-report", category: "report", contract: "Today program shell states build as a deterministic user-facing contract report." },
  { id: "check:today-program-diff", category: "review", contract: "Today program report changes produce compact review diffs and regression flags." },
  { id: "check:dashboard-snapshot", category: "snapshot", contract: "Dashboard recommendation surface matches deterministic fixtures." },
  { id: "check:dashboard-snapshot-mutations", category: "mutation", contract: "Snapshot fixtures prove preferred-entry, repair trace, and evidence drift are caught." },
  { id: "check:dashboard-snapshot-diff", category: "review", contract: "Dashboard snapshot changes produce compact review diffs and regression flags." },
  { id: "check:data", category: "content", contract: "Drill data has valid item shapes and coverage." },
  { id: "check:static", category: "static", contract: "Static HTML files satisfy no-dependency page QA." },
  { id: "check:lessons", category: "schema", contract: "Narrative lesson data satisfies the lesson schema." },
  { id: "check:exercise-audit", category: "content", contract: "Lesson exercises avoid contradictory completion gates, duplicate answers, and known Danish editorial slips." },
  { id: "check:gold-lessons", category: "simulation", contract: "Gold lesson simulations cover paths, endings, attempts, and weak signals." },
  { id: "check:counterfactuals", category: "simulation", contract: "Lesson edits are compared against deterministic learner profiles." },
  { id: "check:gold-scaffold", category: "authoring", contract: "Generated gold lesson scaffolds remain validator, simulator, and runtime clean." },
  { id: "check:comic-prompts", category: "assets", contract: "Comic prompt manifests build without network access." },
  { id: "check:quality-report", category: "report", contract: "Public gold lesson quality report builds cleanly." },
  { id: "check:quality-mutations", category: "mutation", contract: "Quality report proves broken gold lesson contracts fail." },
  { id: "check:quality-diff", category: "review", contract: "Quality report diffs fail only on regressions." },
  { id: "check:review-report", category: "review", contract: "Unified PR review report combines quality, dashboard, demo learner, Today program, and personalization diffs with JSON and Markdown reviewer output." },
  { id: "check:review-report-fixture", category: "review", contract: "Golden PR review fixture proves large reviewer summaries, JSON artifacts, ordering, caps, and fail modes end to end." },
  { id: "check:quickstart-proof", category: "onboarding", contract: "Contributor proof quickstart builds the core local artifacts and links commands to reviewable project claims." },
  { id: "check:proof-digest", category: "report", contract: "Proof digest translates generated project reports into visitor-facing claims, current proof changes, and trust boundaries." },
  { id: "check:quality-page", category: "report", contract: "Quality page renderer consumes generated report data." },
  { id: "check:program-page", category: "report", contract: "Program page renders the product capability map as a user-facing proof surface." },
  { id: "check:proof-page", category: "report", contract: "Proof / Health page renders public health, capability, demo learner, quickstart, and golden review artifacts." },
  { id: "check:capability-map", category: "report", contract: "Product capability map links user-facing claims to checks, public reports, source files, and docs." },
  { id: "check:health", category: "report", contract: "Project health manifest links gates, reports, workflows, and fixtures." },
  { id: "check:pages", category: "publish", contract: "Pages artifact builds and public files pass static QA." }
];

const publicReportSpecs = [
  {
    id: "quality",
    title: "Gold lesson quality report",
    builderScript: "scripts/build-quality-report.js",
    checkScript: "check:quality-report",
    pagesPath: "reports/quality.json"
  },
  {
    id: "skill-coverage",
    title: "Skill graph coverage report",
    builderScript: "scripts/build-skill-coverage-report.js",
    checkScript: "check:skill-coverage",
    pagesPath: "reports/skill-coverage.json"
  },
  {
    id: "demo-learner",
    title: "Demo learner report",
    builderScript: "scripts/build-demo-learner-report.js",
    checkScript: "check:demo-learner-report",
    pagesPath: "reports/demo-learner.json"
  },
  {
    id: "today-program",
    title: "Today program shell report",
    builderScript: "scripts/build-today-program-report.js",
    checkScript: "check:today-program-report",
    pagesPath: "reports/today-program.json"
  },
  {
    id: "capabilities",
    title: "Product capability map",
    builderScript: "scripts/build-capability-map.js",
    checkScript: "check:capability-map",
    pagesPath: "reports/capabilities.json"
  },
  {
    id: "project-health",
    title: "Project health manifest",
    builderScript: "scripts/build-project-health-manifest.js",
    checkScript: "check:health",
    pagesPath: "reports/project-health.json"
  }
];

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function reportRoot(options) {
  if (typeof options === "string") return path.resolve(options);
  return path.resolve(options && options.root || repoRoot);
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

function readText(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function fileExists(root, relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function lineCount(root, relPath) {
  if (!fileExists(root, relPath)) return 0;
  return readText(root, relPath).split(/\r?\n/).length - 1;
}

function scriptPathFromCommand(command) {
  const match = String(command || "").match(/\bnode\s+([^\s]+)/);
  return match ? match[1] : "";
}

function checkSequence(pkg) {
  return String(pkg.scripts && pkg.scripts.check || "")
    .split("&&")
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => part.replace(/^npm run\s+/, ""));
}

function gateRows(root, pkg, issues) {
  const scripts = pkg.scripts || {};
  const sequence = checkSequence(pkg);
  const sequenceIndex = new Map(sequence.map((id, index) => [id, index]));
  const rows = requiredGates.map(spec => {
    const command = scripts[spec.id] || "";
    const sourcePath = scriptPathFromCommand(command);
    const rowIssues = [];
    if (!command) rowIssues.push("missing package script");
    if (!sequenceIndex.has(spec.id)) rowIssues.push("not included in npm run check");
    if (sourcePath && !fileExists(root, sourcePath)) rowIssues.push(`missing source file ${sourcePath}`);
    rowIssues.forEach(issue => issues.push(`${spec.id}: ${issue}`));
    return {
      id: spec.id,
      category: spec.category,
      contract: spec.contract,
      command,
      sourcePath,
      requiredInCheck: true,
      checkOrder: sequenceIndex.has(spec.id) ? sequenceIndex.get(spec.id) + 1 : null,
      status: rowIssues.length ? "fail" : "pass",
      issues: rowIssues
    };
  });

  if (sequence.length !== requiredGates.length) {
    const expected = new Set(requiredGates.map(gate => gate.id));
    sequence.filter(id => !expected.has(id)).forEach(id => issues.push(`npm run check includes untracked gate ${id}`));
  }

  return rows;
}

function workflowRows(root, issues) {
  const specs = [
    {
      id: "qa",
      path: ".github/workflows/qa.yml",
      expectedRun: "npm run check",
      requiredSnippets: ["diff-quality-report.js", "diff-personalization-trajectory.js", "diff-dashboard-snapshot.js", "diff-demo-learner-report.js", "diff-today-program-report.js", "build-review-report.js", "review-report.json", "GITHUB_STEP_SUMMARY", "summary-limit", "summary-message-limit", "proof.html"]
    },
    { id: "pages", path: ".github/workflows/pages.yml", expectedRun: "npm run check" }
  ];
  return specs.map(spec => {
    const rowIssues = [];
    const source = fileExists(root, spec.path) ? readText(root, spec.path) : "";
    if (!source) rowIssues.push("workflow file missing");
    if (source && !source.includes(spec.expectedRun)) rowIssues.push(`workflow does not run ${spec.expectedRun}`);
    if (source && !/node-version:\s*["']?24["']?/.test(source)) rowIssues.push("workflow does not pin Node 24");
    (spec.requiredSnippets || []).forEach(snippet => {
      if (source && !source.includes(snippet)) rowIssues.push(`workflow does not include ${snippet}`);
    });
    rowIssues.forEach(issue => issues.push(`${spec.path}: ${issue}`));
    return {
      id: spec.id,
      path: spec.path,
      runsFullCheck: source.includes(spec.expectedRun),
      nodeVersion: /node-version:\s*["']?24["']?/.test(source) ? "24" : "",
      requiredSnippets: spec.requiredSnippets || [],
      status: rowIssues.length ? "fail" : "pass",
      issues: rowIssues
    };
  });
}

function reportRows(root, quality, skillCoverage, demoLearner, todayProgram, capabilityMap, issues) {
  const pagesBuild = fileExists(root, "scripts/build-pages-artifact.js")
    ? readText(root, "scripts/build-pages-artifact.js")
    : "";
  const summaries = {
    quality: {
      status: quality.status,
      totals: {
        goldLessons: quality.totals.goldLessons,
        masterySignals: quality.totals.masterySignals,
        simulationPaths: quality.totals.simulationPaths,
        issues: quality.totals.issues
      }
    },
    "skill-coverage": {
      status: skillCoverage.status,
      totals: {
        rootCompetencies: skillCoverage.totals.rootCompetencies,
        goldMasterySignals: skillCoverage.totals.goldMasterySignals,
        coveredGraphTags: skillCoverage.totals.coveredGraphTags,
        issues: skillCoverage.totals.issues,
        warnings: skillCoverage.totals.warnings
      }
    },
    "demo-learner": {
      status: demoLearner.status,
      totals: {
        attempts: demoLearner.totals.attempts,
        visibleMemoryFacts: demoLearner.totals.visibleMemoryFacts,
        planSteps: demoLearner.totals.planSteps,
        storageWrites: demoLearner.totals.storageWrites,
        issues: demoLearner.totals.issues
      }
    },
    "today-program": {
      status: todayProgram.status,
      totals: {
        scenarios: todayProgram.totals.scenarios,
        states: todayProgram.totals.states,
        issues: todayProgram.totals.issues
      }
    },
    capabilities: {
      status: capabilityMap.status,
      totals: {
        capabilities: capabilityMap.totals.capabilities,
        proofGates: capabilityMap.totals.proofGates,
        publicReports: capabilityMap.totals.publicReports,
        issues: capabilityMap.totals.issues
      }
    },
    "project-health": {
      status: "pass",
      totals: {}
    }
  };

  return publicReportSpecs.map(spec => {
    const rowIssues = [];
    const reportFile = spec.pagesPath.split("/").pop();
    const pagesWritesReport = pagesBuild.includes(spec.pagesPath)
      || pagesBuild.includes(`"reports", "${reportFile}"`)
      || pagesBuild.includes(`'reports', '${reportFile}'`);
    if (!fileExists(root, spec.builderScript)) rowIssues.push(`missing builder ${spec.builderScript}`);
    if (!pagesWritesReport) rowIssues.push(`Pages artifact does not publish ${spec.pagesPath}`);
    const summary = summaries[spec.id] || { status: "unknown", totals: {} };
    if (summary.status !== "pass") rowIssues.push(`source report status is ${summary.status}`);
    rowIssues.forEach(issue => issues.push(`${spec.id}: ${issue}`));
    return {
      id: spec.id,
      title: spec.title,
      builderScript: spec.builderScript,
      checkScript: spec.checkScript,
      pagesPath: spec.pagesPath,
      sourceStatus: summary.status,
      totals: summary.totals,
      status: rowIssues.length ? "fail" : "pass",
      issues: rowIssues
    };
  });
}

function fixtureRows(root, issues) {
  const rows = [];

  const dashboardFixturePath = "scripts/fixtures/dashboard-recommendations.snapshot.json";
  const dashboardBuilderScript = "scripts/snapshot-dashboard-recommendations.js";
  const dashboardMutationScript = "scripts/mutation-dashboard-snapshot.js";
  const dashboardIssues = [];
  let dashboardFixture = null;
  let dashboardFresh = false;
  if (!fileExists(root, dashboardFixturePath)) {
    dashboardIssues.push("fixture file missing");
  } else {
    dashboardFixture = readJson(root, dashboardFixturePath);
    dashboardFresh = snapshotText(buildDashboardRecommendationSnapshot({ root })) === readText(root, dashboardFixturePath);
    if (!dashboardFresh) dashboardIssues.push("fixture is stale");
  }
  if (!fileExists(root, dashboardBuilderScript)) dashboardIssues.push(`missing builder ${dashboardBuilderScript}`);
  if (!fileExists(root, dashboardMutationScript)) dashboardIssues.push(`missing mutation proof ${dashboardMutationScript}`);
  dashboardIssues.forEach(issue => issues.push(`dashboard-recommendations fixture: ${issue}`));
  rows.push({
    id: "dashboard-recommendations",
    title: "Dashboard recommendation snapshot",
    fixturePath: dashboardFixturePath,
    builderScript: dashboardBuilderScript,
    checkScript: "check:dashboard-snapshot",
    updateCommand: "node scripts/snapshot-dashboard-recommendations.js --update",
    mutationScript: dashboardMutationScript,
    mutationCheckScript: "check:dashboard-snapshot-mutations",
    schemaVersion: dashboardFixture && dashboardFixture.schemaVersion || null,
    fixedNow: dashboardFixture && dashboardFixture.fixedNow || "",
    scenarios: dashboardFixture && Array.isArray(dashboardFixture.scenarios) ? dashboardFixture.scenarios.map(item => item.id) : [],
    lineCount: lineCount(root, dashboardFixturePath),
    fresh: dashboardFresh,
    status: dashboardIssues.length ? "fail" : "pass",
    issues: dashboardIssues
  });

  const memoryFixturePath = "scripts/fixtures/learner-memory-profiles.json";
  const memoryScript = "scripts/smoke-memory-fixtures.js";
  const memoryIssues = [];
  let memoryFixture = null;
  let memoryEvaluation = null;
  if (!fileExists(root, memoryFixturePath)) {
    memoryIssues.push("fixture file missing");
  } else {
    memoryFixture = readJson(root, memoryFixturePath);
    try {
      memoryEvaluation = evaluateLearnerMemoryFixtures({ root });
    } catch (err) {
      memoryIssues.push(`fixture is stale: ${err.message.split(/\r?\n/)[0]}`);
    }
  }
  if (!fileExists(root, memoryScript)) memoryIssues.push(`missing checker ${memoryScript}`);
  memoryIssues.forEach(issue => issues.push(`learner-memory-profiles fixture: ${issue}`));
  rows.push({
    id: "learner-memory-profiles",
    title: "Learner memory profile fixtures",
    fixturePath: memoryFixturePath,
    builderScript: memoryScript,
    checkScript: "check:memory-fixtures",
    updateCommand: "node scripts/smoke-memory-fixtures.js --update",
    schemaVersion: memoryFixture && memoryFixture.schemaVersion || null,
    fixedNow: memoryFixture && memoryFixture.fixedNow || "",
    scenarios: memoryFixture && Array.isArray(memoryFixture.profiles) ? memoryFixture.profiles.map(item => item.id) : [],
    lineCount: lineCount(root, memoryFixturePath),
    fresh: memoryIssues.length === 0 && !!memoryEvaluation,
    status: memoryIssues.length ? "fail" : "pass",
    issues: memoryIssues
  });

  const learnerModelFixturePath = "scripts/fixtures/learner-model.snapshot.json";
  const learnerModelScript = "scripts/smoke-learner-model.js";
  const learnerModelIssues = [];
  let learnerModelFixture = null;
  let learnerModelEvaluation = null;
  if (!fileExists(root, learnerModelFixturePath)) {
    learnerModelIssues.push("fixture file missing");
  } else {
    learnerModelFixture = readJson(root, learnerModelFixturePath);
    try {
      learnerModelEvaluation = evaluateLearnerModelFixtures({ root });
    } catch (err) {
      learnerModelIssues.push(`fixture is stale: ${err.message.split(/\r?\n/)[0]}`);
    }
  }
  if (!fileExists(root, learnerModelScript)) learnerModelIssues.push(`missing checker ${learnerModelScript}`);
  learnerModelIssues.forEach(issue => issues.push(`learner-model-profiles fixture: ${issue}`));
  rows.push({
    id: "learner-model-profiles",
    title: "Learner model profile fixtures",
    fixturePath: learnerModelFixturePath,
    builderScript: learnerModelScript,
    checkScript: "check:learner-model",
    updateCommand: "node scripts/smoke-learner-model.js --update",
    schemaVersion: learnerModelFixture && learnerModelFixture.schemaVersion || null,
    fixedNow: learnerModelFixture && learnerModelFixture.generatedAt || "",
    scenarios: learnerModelEvaluation ? learnerModelEvaluation.profiles.map(item => item.id) : [],
    lineCount: lineCount(root, learnerModelFixturePath),
    fresh: learnerModelIssues.length === 0 && !!learnerModelEvaluation,
    status: learnerModelIssues.length ? "fail" : "pass",
    issues: learnerModelIssues
  });

  const advisorScript = "scripts/smoke-advisor-fixtures.js";
  const advisorIssues = [];
  let advisorEvaluation = null;
  if (!fileExists(root, memoryFixturePath)) {
    advisorIssues.push("fixture file missing");
  } else {
    try {
      advisorEvaluation = evaluateAdvisorFixtures({ root });
    } catch (err) {
      advisorIssues.push(`fixture is stale: ${err.message.split(/\r?\n/)[0]}`);
    }
  }
  if (!fileExists(root, advisorScript)) advisorIssues.push(`missing checker ${advisorScript}`);
  advisorIssues.forEach(issue => issues.push(`agent-advice-profiles fixture: ${issue}`));
  rows.push({
    id: "agent-advice-profiles",
    title: "Agent advice profile fixtures",
    fixturePath: memoryFixturePath,
    builderScript: advisorScript,
    checkScript: "check:advisor",
    updateCommand: "node scripts/smoke-advisor-fixtures.js --update",
    schemaVersion: memoryFixture && memoryFixture.schemaVersion || null,
    fixedNow: memoryFixture && memoryFixture.fixedNow || "",
    scenarios: advisorEvaluation ? advisorEvaluation.profiles.map(item => item.id) : [],
    lineCount: lineCount(root, memoryFixturePath),
    fresh: advisorIssues.length === 0 && !!advisorEvaluation,
    status: advisorIssues.length ? "fail" : "pass",
    issues: advisorIssues
  });

  const companionScript = "scripts/smoke-companion.js";
  const companionIssues = [];
  let companionEvaluation = null;
  if (!fileExists(root, memoryFixturePath)) {
    companionIssues.push("fixture file missing");
  } else {
    try {
      companionEvaluation = evaluateCompanionFixtures({ root });
    } catch (err) {
      companionIssues.push(`fixture is stale: ${err.message.split(/\r?\n/)[0]}`);
    }
  }
  if (!fileExists(root, companionScript)) companionIssues.push(`missing checker ${companionScript}`);
  companionIssues.forEach(issue => issues.push(`companion-profiles fixture: ${issue}`));
  rows.push({
    id: "companion-profiles",
    title: "Companion and Hermes bridge profile fixtures",
    fixturePath: memoryFixturePath,
    builderScript: companionScript,
    checkScript: "check:companion",
    schemaVersion: memoryFixture && memoryFixture.schemaVersion || null,
    fixedNow: memoryFixture && memoryFixture.fixedNow || "",
    scenarios: companionEvaluation ? companionEvaluation.profiles.map(item => item.id) : [],
    lineCount: lineCount(root, memoryFixturePath),
    fresh: companionIssues.length === 0 && !!companionEvaluation,
    status: companionIssues.length ? "fail" : "pass",
    issues: companionIssues
  });

  const agentHandoffFixturePath = "scripts/fixtures/agent-handoff.snapshot.json";
  const agentHandoffScript = "scripts/smoke-agent-handoff.js";
  const agentHandoffIssues = [];
  let agentHandoffFixture = null;
  let agentHandoffEvaluation = null;
  if (!fileExists(root, agentHandoffFixturePath)) {
    agentHandoffIssues.push("fixture file missing");
  } else {
    agentHandoffFixture = readJson(root, agentHandoffFixturePath);
    try {
      agentHandoffEvaluation = evaluateAgentHandoffFixtures({ root });
    } catch (err) {
      agentHandoffIssues.push(`fixture is stale: ${err.message.split(/\r?\n/)[0]}`);
    }
  }
  if (!fileExists(root, agentHandoffScript)) agentHandoffIssues.push(`missing checker ${agentHandoffScript}`);
  agentHandoffIssues.forEach(issue => issues.push(`agent-handoff-profiles fixture: ${issue}`));
  rows.push({
    id: "agent-handoff-profiles",
    title: "Agent handoff profile fixtures",
    fixturePath: agentHandoffFixturePath,
    builderScript: agentHandoffScript,
    checkScript: "check:agent-handoff",
    updateCommand: "node scripts/smoke-agent-handoff.js --update",
    schemaVersion: agentHandoffFixture && agentHandoffFixture.schemaVersion || null,
    fixedNow: agentHandoffFixture && agentHandoffFixture.generatedAt || "",
    scenarios: agentHandoffEvaluation ? agentHandoffEvaluation.profiles.map(item => item.id) : [],
    lineCount: lineCount(root, agentHandoffFixturePath),
    fresh: agentHandoffIssues.length === 0 && !!agentHandoffEvaluation,
    status: agentHandoffIssues.length ? "fail" : "pass",
    issues: agentHandoffIssues
  });

  const personalizationScript = "scripts/smoke-personalization-eval.js";
  const personalizationMutationScript = "scripts/mutation-personalization-eval.js";
  const personalizationIssues = [];
  let personalizationEvaluation = null;
  if (!fileExists(root, memoryFixturePath)) {
    personalizationIssues.push("fixture file missing");
  } else {
    try {
      personalizationEvaluation = evaluatePersonalizationProfiles({ root });
    } catch (err) {
      personalizationIssues.push(`evaluation failed: ${err.message.split(/\r?\n/)[0]}`);
    }
  }
  if (!fileExists(root, personalizationScript)) personalizationIssues.push(`missing checker ${personalizationScript}`);
  if (!fileExists(root, personalizationMutationScript)) personalizationIssues.push(`missing mutation proof ${personalizationMutationScript}`);
  personalizationIssues.forEach(issue => issues.push(`personalization-evaluation fixture: ${issue}`));
  rows.push({
    id: "personalization-evaluation",
    title: "Personalization evaluation harness",
    fixturePath: memoryFixturePath,
    builderScript: personalizationScript,
    checkScript: "check:personalization-eval",
    mutationScript: personalizationMutationScript,
    mutationCheckScript: "check:personalization-mutations",
    schemaVersion: memoryFixture && memoryFixture.schemaVersion || null,
    fixedNow: memoryFixture && memoryFixture.fixedNow || "",
    scenarios: personalizationEvaluation ? personalizationEvaluation.profiles.map(item => item.id) : [],
    lineCount: lineCount(root, memoryFixturePath),
    fresh: personalizationIssues.length === 0 && !!personalizationEvaluation,
    status: personalizationIssues.length ? "fail" : "pass",
    issues: personalizationIssues
  });

  return rows;
}

function guarantees(gates, reports, workflows, fixtures) {
  return [
    {
      key: "all-required-gates-in-check",
      label: "Every required gate is included in npm run check",
      pass: gates.every(gate => gate.requiredInCheck && gate.checkOrder !== null)
    },
    {
      key: "public-reports-published",
      label: "Every public report is built into the Pages artifact",
      pass: reports.every(report => report.status === "pass")
    },
    {
      key: "workflows-run-full-check",
      label: "QA and Pages workflows both run npm run check on Node 24",
      pass: workflows.every(workflow => workflow.status === "pass")
    },
    {
      key: "fixtures-fresh-and-proven",
      label: "Deterministic fixtures are fresh and backed by mutation checks",
      pass: fixtures.every(fixture => fixture.status === "pass")
    }
  ];
}

function buildProjectHealthManifest(options = {}) {
  const root = reportRoot(options);
  const pkg = readJson(root, "package.json");
  const issues = [];
  const quality = buildQualityReport({ root });
  const skillCoverage = buildSkillCoverageReport({ root });
  const demoLearner = buildDemoLearnerReport({ root });
  const todayProgram = buildTodayProgramReport({ root });
  const capabilityMap = buildCapabilityMap({ root });
  const gates = gateRows(root, pkg, issues);
  const reports = reportRows(root, quality, skillCoverage, demoLearner, todayProgram, capabilityMap, issues);
  const workflows = workflowRows(root, issues);
  const fixtures = fixtureRows(root, issues);
  const gateCategories = gates.reduce((acc, gate) => {
    acc[gate.category] = (acc[gate.category] || 0) + 1;
    return acc;
  }, {});
  const guaranteeRows = guarantees(gates, reports, workflows, fixtures);
  guaranteeRows.filter(item => !item.pass).forEach(item => issues.push(`guarantee failed: ${item.key}`));

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: issues.length ? "fail" : "pass",
    totals: {
      gates: gates.length,
      gateCategories,
      publicReports: reports.length,
      workflows: workflows.length,
      deterministicFixtures: fixtures.length,
      issues: issues.length
    },
    guarantees: guaranteeRows,
    issues,
    gates,
    publicReports: reports,
    workflows,
    deterministicFixtures: fixtures
  };
}

function formatProjectHealthManifest(manifest) {
  const lines = [
    "Project Health Manifest",
    `status: ${manifest.status}`,
    `gates: ${manifest.totals.gates}`,
    `public reports: ${manifest.totals.publicReports}`,
    `deterministic fixtures: ${manifest.totals.deterministicFixtures}`,
    "",
    "Guarantees:"
  ];
  manifest.guarantees.forEach(item => lines.push(`- ${item.pass ? "pass" : "fail"} ${item.key}: ${item.label}`));
  lines.push("", "Reports:");
  manifest.publicReports.forEach(report => lines.push(`- ${report.id}: ${report.sourceStatus} -> ${report.pagesPath}`));
  lines.push("", "Issues:");
  if (manifest.issues.length) manifest.issues.forEach(issue => lines.push(`- ${issue}`));
  else lines.push("none");
  return lines.join("\n");
}

function writeProjectHealthManifest(outPath, options = {}) {
  const root = reportRoot(options);
  const manifest = buildProjectHealthManifest({ root });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");
  if (options.text) console.log(formatProjectHealthManifest(manifest));
  if (manifest.status !== "pass") {
    console.error(`project health manifest failed with ${manifest.totals.issues} issue(s)`);
    manifest.issues.forEach(issue => console.error(`- ${issue}`));
    process.exit(1);
  }
  if (!options.text) {
    console.log(`project health manifest built: ${displayRel(outPath, root)} (${manifest.totals.gates} gate(s), ${manifest.totals.publicReports} report(s))`);
  }
  return manifest;
}

function main() {
  const out = argValue("--out") || path.join(repoRoot, ".dist", "project-health.json");
  const root = argValue("--root") || repoRoot;
  writeProjectHealthManifest(path.resolve(repoRoot, out), { root, text: hasFlag("--text") });
}

if (require.main === module) main();

module.exports = {
  buildProjectHealthManifest,
  formatProjectHealthManifest,
  writeProjectHealthManifest,
  requiredGates
};

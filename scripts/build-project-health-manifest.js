#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildQualityReport } = require("./build-quality-report.js");
const { buildSkillCoverageReport } = require("./build-skill-coverage-report.js");
const {
  buildDashboardRecommendationSnapshot,
  snapshotText
} = require("./snapshot-dashboard-recommendations.js");

const repoRoot = path.resolve(__dirname, "..");

const requiredGates = [
  { id: "check:syntax", category: "static", contract: "All JavaScript files parse before deeper checks run." },
  { id: "check:kernel", category: "state", contract: "Shared progress state, migration, import/export, weak tags, and repair closure behavior." },
  { id: "check:competencies", category: "pedagogy", contract: "Root competency graph groups gold mastery signals." },
  { id: "check:skill-coverage", category: "pedagogy", contract: "Gold mastery signals map cleanly to the root skill graph." },
  { id: "check:evidence", category: "diagnostics", contract: "Evidence ledger ranks open, closed, reopened, miss, and correct facts." },
  { id: "check:events", category: "replay", contract: "Privacy-conscious learning events replay deterministic profile facts." },
  { id: "check:profile-replay", category: "debug", contract: "Dashboard JSON exports can be replay-debugged by maintainers." },
  { id: "check:planner", category: "planner", contract: "Planner decisions and practice plans preserve traces and explanations." },
  { id: "check:planner-mutations", category: "mutation", contract: "Bad mastery/remediation planner contracts fail CI." },
  { id: "check:catalog", category: "catalog", contract: "Trainer registry and gold lesson data paths resolve." },
  { id: "check:home", category: "runtime", contract: "Home launcher routes starter, continue, repair, and active-plan flows." },
  { id: "check:lesson-engine", category: "runtime", contract: "Gold simulation paths replay through the real lesson engine." },
  { id: "check:dashboard", category: "runtime", contract: "Dashboard renders diagnostics, plans, ledger, catalog loading, and profile portability." },
  { id: "check:dashboard-snapshot", category: "snapshot", contract: "Dashboard recommendation surface matches deterministic fixtures." },
  { id: "check:dashboard-snapshot-mutations", category: "mutation", contract: "Snapshot fixtures prove preferred-entry, repair trace, and evidence drift are caught." },
  { id: "check:dashboard-snapshot-diff", category: "review", contract: "Dashboard snapshot changes produce compact review diffs and regression flags." },
  { id: "check:data", category: "content", contract: "Drill data has valid item shapes and coverage." },
  { id: "check:static", category: "static", contract: "Static HTML files satisfy no-dependency page QA." },
  { id: "check:lessons", category: "schema", contract: "Narrative lesson data satisfies the lesson schema." },
  { id: "check:gold-lessons", category: "simulation", contract: "Gold lesson simulations cover paths, endings, attempts, and weak signals." },
  { id: "check:counterfactuals", category: "simulation", contract: "Lesson edits are compared against deterministic learner profiles." },
  { id: "check:gold-scaffold", category: "authoring", contract: "Generated gold lesson scaffolds remain validator, simulator, and runtime clean." },
  { id: "check:comic-prompts", category: "assets", contract: "Comic prompt manifests build without network access." },
  { id: "check:quality-report", category: "report", contract: "Public gold lesson quality report builds cleanly." },
  { id: "check:quality-mutations", category: "mutation", contract: "Quality report proves broken gold lesson contracts fail." },
  { id: "check:quality-diff", category: "review", contract: "Quality report diffs fail only on regressions." },
  { id: "check:quality-page", category: "report", contract: "Quality page renderer consumes generated report data." },
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
    { id: "qa", path: ".github/workflows/qa.yml", expectedRun: "npm run check" },
    { id: "pages", path: ".github/workflows/pages.yml", expectedRun: "npm run check" }
  ];
  return specs.map(spec => {
    const rowIssues = [];
    const source = fileExists(root, spec.path) ? readText(root, spec.path) : "";
    if (!source) rowIssues.push("workflow file missing");
    if (source && !source.includes(spec.expectedRun)) rowIssues.push(`workflow does not run ${spec.expectedRun}`);
    if (source && !/node-version:\s*["']?24["']?/.test(source)) rowIssues.push("workflow does not pin Node 24");
    rowIssues.forEach(issue => issues.push(`${spec.path}: ${issue}`));
    return {
      id: spec.id,
      path: spec.path,
      runsFullCheck: source.includes(spec.expectedRun),
      nodeVersion: /node-version:\s*["']?24["']?/.test(source) ? "24" : "",
      status: rowIssues.length ? "fail" : "pass",
      issues: rowIssues
    };
  });
}

function reportRows(root, quality, skillCoverage, issues) {
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
  const fixturePath = "scripts/fixtures/dashboard-recommendations.snapshot.json";
  const builderScript = "scripts/snapshot-dashboard-recommendations.js";
  const mutationScript = "scripts/mutation-dashboard-snapshot.js";
  const rowIssues = [];
  let fixture = null;
  let fresh = false;
  if (!fileExists(root, fixturePath)) {
    rowIssues.push("fixture file missing");
  } else {
    fixture = readJson(root, fixturePath);
    fresh = snapshotText(buildDashboardRecommendationSnapshot({ root })) === readText(root, fixturePath);
    if (!fresh) rowIssues.push("fixture is stale");
  }
  if (!fileExists(root, builderScript)) rowIssues.push(`missing builder ${builderScript}`);
  if (!fileExists(root, mutationScript)) rowIssues.push(`missing mutation proof ${mutationScript}`);
  rowIssues.forEach(issue => issues.push(`dashboard-recommendations fixture: ${issue}`));
  return [{
    id: "dashboard-recommendations",
    title: "Dashboard recommendation snapshot",
    fixturePath,
    builderScript,
    checkScript: "check:dashboard-snapshot",
    updateCommand: "node scripts/snapshot-dashboard-recommendations.js --update",
    mutationScript,
    mutationCheckScript: "check:dashboard-snapshot-mutations",
    schemaVersion: fixture && fixture.schemaVersion || null,
    fixedNow: fixture && fixture.fixedNow || "",
    scenarios: fixture && Array.isArray(fixture.scenarios) ? fixture.scenarios.map(item => item.id) : [],
    lineCount: lineCount(root, fixturePath),
    fresh,
    status: rowIssues.length ? "fail" : "pass",
    issues: rowIssues
  }];
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
  const gates = gateRows(root, pkg, issues);
  const reports = reportRows(root, quality, skillCoverage, issues);
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

#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

const publicReportSpecs = {
  quality: {
    title: "Gold lesson quality report",
    builderScript: "scripts/build-quality-report.js",
    checkScript: "check:quality-report",
    pagesPath: "reports/quality.json"
  },
  "skill-coverage": {
    title: "Skill graph coverage report",
    builderScript: "scripts/build-skill-coverage-report.js",
    checkScript: "check:skill-coverage",
    pagesPath: "reports/skill-coverage.json"
  },
  "demo-learner": {
    title: "Demo learner report",
    builderScript: "scripts/build-demo-learner-report.js",
    checkScript: "check:demo-learner-report",
    pagesPath: "reports/demo-learner.json"
  },
  "today-program": {
    title: "Today program shell report",
    builderScript: "scripts/build-today-program-report.js",
    checkScript: "check:today-program-report",
    pagesPath: "reports/today-program.json"
  },
  "guided-session": {
    title: "Guided session outcome-loop report",
    builderScript: "scripts/build-guided-session-report.js",
    checkScript: "check:guided-session-report",
    pagesPath: "reports/guided-session.json"
  },
  "evaluator-path": {
    title: "First-visit evaluator path report",
    builderScript: "scripts/build-evaluator-path-report.js",
    checkScript: "check:evaluator-path",
    pagesPath: "reports/evaluator-path.json"
  },
  "evaluator-journey": {
    title: "Deterministic evaluator journey report",
    builderScript: "scripts/build-evaluator-journey-report.js",
    checkScript: "check:evaluator-journey",
    pagesPath: "reports/evaluator-journey.json"
  },
  "profile-portability": {
    title: "Profile portability acceptance report",
    builderScript: "scripts/build-profile-portability-report.js",
    checkScript: "check:profile-portability",
    pagesPath: "reports/profile-portability.json"
  },
  "exercise-value": {
    title: "Flagship exercise value report",
    builderScript: "scripts/build-exercise-value-report.js",
    checkScript: "check:exercise-value-report",
    pagesPath: "reports/exercise-value.json"
  },
  "project-health": {
    title: "Project health manifest",
    builderScript: "scripts/build-project-health-manifest.js",
    checkScript: "check:health",
    pagesPath: "reports/project-health.json"
  },
  capabilities: {
    title: "Product capability map",
    builderScript: "scripts/build-capability-map.js",
    checkScript: "check:capability-map",
    pagesPath: "reports/capabilities.json"
  },
  "quickstart-proof": {
    title: "Contributor proof quickstart",
    builderScript: "scripts/build-quickstart-proof.js",
    checkScript: "check:quickstart-proof",
    pagesPath: "reports/quickstart-proof/quickstart.json"
  },
  "proof-digest": {
    title: "Plain-language proof digest",
    builderScript: "scripts/build-proof-digest.js",
    checkScript: "check:proof-digest",
    pagesPath: "reports/proof-digest.json"
  }
};

const capabilitySpecs = [
  {
    id: "static-forkable-runtime",
    title: "Static, forkable trainer runtime",
    stage: "shipped",
    userValue: "Learners, teachers, and forks can run the program from static files without accounts, servers, analytics, or a build step.",
    surfaces: ["index.html", "dashboard.html", "GitHub Pages artifact", "Local file/server use"],
    proofGates: ["check:syntax", "check:kernel", "check:catalog", "check:home", "check:static", "check:pages"],
    publicReports: ["project-health"],
    docs: ["README.md", "CONTRIBUTING.md"],
    sourcePaths: ["index.html", "dashboard.html", "shared/plata-kernel.js", "shared/plata-catalog.js", "scripts/build-pages-artifact.js", ".github/workflows/pages.yml"],
    contracts: [
      "No backend dependency for basic practice.",
      "Shared progress state migrates old trainer storage into stable v1 keys.",
      "Home page exposes a root-safe evaluator path into the read-only demo and proof walkthrough.",
      "Pages deploys only checked public files."
    ]
  },
  {
    id: "gold-lesson-quality-engine",
    title: "Gold lesson quality engine",
    stage: "shipped",
    userValue: "Important lessons are not just authored pages: they carry sources, mastery signals, simulations, remediation, endings, and comic prompt coverage.",
    surfaces: ["Gold narrative lessons", "Flagship exercise chains", "quality.html", "reports/quality.json", "reports/exercise-value.json"],
    proofGates: ["check:lessons", "check:lesson-engine", "check:repair-bridge", "check:exercise-value-report", "check:gold-lessons", "check:counterfactuals", "check:comic-prompts", "check:quality-report", "check:quality-mutations", "check:quality-diff", "check:quality-page"],
    publicReports: ["quality", "exercise-value", "skill-coverage", "project-health"],
    docs: ["docs/GOLD_LESSON_QUALITY_ENGINE.md", "docs/LESSON_SCHEMA.md", "docs/lessons/lesson-b2-radiator-register.md"],
    sourcePaths: ["scripts/build-quality-report.js", "scripts/build-exercise-value-report.js", "scripts/smoke-exercise-value-report.js", "scripts/smoke-repair-bridge.js", "scripts/simulate-gold-lessons.js", "scripts/counterfactual-learner-simulator.js", "scripts/generate-comic-assets-openrouter.js", "shared/plata-repair-bridge.js", "lessons/lesson-b2-radiator/data.js", "lessons/lesson-b2-job-followup/data.js"],
    contracts: [
      "Gold scenes must have source refs, learning goals, mastery tags, simulation paths, remediation targets, and comic storyboard coverage.",
      "Flagship exercise chains must prove consequence, grammatical near-miss, repair ladder, channel transfer, memory recurrence, and explain-your-choice evidence.",
      "Broken gold contracts are mutation-tested.",
      "Quality report diffs distinguish review drift from regressions."
    ]
  },
  {
    id: "root-skill-coverage",
    title: "Root skill coverage map",
    stage: "shipped",
    userValue: "Content gaps are visible as root skill gaps instead of disappearing inside lesson prose.",
    surfaces: ["Skill graph", "Gold mastery maps", "reports/skill-coverage.json"],
    proofGates: ["check:competencies", "check:skill-coverage", "check:planner", "check:planner-mutations"],
    publicReports: ["skill-coverage", "project-health"],
    docs: ["docs/GOLD_LESSON_QUALITY_ENGINE.md", "docs/DEVELOPMENT_JOURNAL.md"],
    sourcePaths: ["shared/plata-competencies.js", "shared/plata-planner.js", "scripts/build-skill-coverage-report.js", "scripts/smoke-competencies.js", "scripts/smoke-planner.js"],
    contracts: [
      "Every gold mastery signal maps to the competency graph.",
      "Root competencies can show planned but uncovered tags.",
      "Planner mutation tests catch bad mastery and remediation wiring."
    ]
  },
  {
    id: "private-learner-memory",
    title: "Private learner memory pipeline",
    stage: "shipped",
    userValue: "Personalization is derived locally from redacted learning events, not from raw answer history or opaque analytics.",
    surfaces: ["Dashboard memory inspector", "Profile export/import", "Memory vault payload"],
    proofGates: ["check:events", "check:memory", "check:memory-fixtures", "check:memory-corrections", "check:memory-vault", "check:memory-brief", "check:profile-replay", "check:profile-portability"],
    publicReports: ["demo-learner", "profile-portability", "project-health"],
    docs: ["docs/LEARNER_MEMORY_AGENT_RFC.md", "docs/DEVELOPMENT_JOURNAL.md"],
    sourcePaths: ["shared/plata-events.js", "shared/plata-memory.js", "shared/plata-memory-vault.js", "shared/plata-memory-brief.js", "scripts/debug-profile-replay.js", "scripts/build-profile-portability-report.js", "scripts/smoke-profile-portability.js", "scripts/fixtures/learner-memory-profiles.json"],
    contracts: [
      "Memory facts cite source fingerprints and exclude raw expected/given answer text.",
      "Hidden and corrected facts survive export/import without rewriting the event log.",
      "Optional vault sync is derived-facts-only.",
      "Profile export/import/replay preserves active plans, memory corrections, guided outcomes, and derived privacy guardrails."
    ]
  },
  {
    id: "adaptive-planner-and-advisor",
    title: "Deterministic adaptive planner and advisor",
    stage: "shipped",
    userValue: "The next recommendation explains its evidence, cites memory facts, and can be replayed in CI before any model call enters the loop.",
    surfaces: ["Dashboard due cards", "Practice plan", "Demo learner profile", "Advisor fixtures", "Personalization trajectory"],
    proofGates: ["check:dashboard", "check:learner-model", "check:learner-model-alignment", "check:learner-model-alignment-mutations", "check:advisor", "check:personalization-eval", "check:personalization-mutations", "check:personalization-trajectory", "check:personalization-trajectory-mutations", "check:personalization-trajectory-diff", "check:demo-learner-diff"],
    publicReports: ["project-health"],
    docs: ["docs/LEARNER_MEMORY_AGENT_RFC.md", "docs/DEVELOPMENT_JOURNAL.md"],
    sourcePaths: ["dashboard.js", "shared/plata-learner-model.js", "shared/plata-advisor.js", "shared/plata-planner.js", "scripts/build-demo-learner-report.js", "scripts/diff-demo-learner-report.js", "scripts/smoke-demo-learner-report.js", "scripts/smoke-demo-learner-diff.js", "scripts/smoke-dashboard.js", "scripts/smoke-personalization-eval.js", "scripts/smoke-personalization-trajectory.js", "scripts/diff-personalization-trajectory.js"],
    contracts: [
      "Learner-model focus must stay aligned with planner-selected and advisor-cited facts.",
      "Demo learner mode proves a rich returning profile without writing fixture data into local storage.",
      "Profile fixtures prove returning, stale, recurring, and cross-lesson routes.",
      "Trajectory diffs make protected personalization drift reviewable."
    ]
  },
  {
    id: "today-program-shell",
    title: "Stateful Today program shell",
    stage: "shipped",
    userValue: "The first screen gives a friendly next step for onboarding, active plans, returns, and memory reviews instead of exposing diagnostics first.",
    surfaces: ["Dashboard Today section", "dashboard.html?demo=learner", "reports/today-program.json", "Dashboard recommendation snapshot"],
    proofGates: ["check:dashboard", "check:demo-learner-report", "check:demo-learner-diff", "check:today-program-report", "check:today-program-diff", "check:dashboard-snapshot", "check:dashboard-snapshot-mutations", "check:dashboard-snapshot-diff"],
    publicReports: ["demo-learner", "today-program", "project-health"],
    docs: ["docs/COMPANION_ARCHITECTURE.md", "docs/DEVELOPMENT_JOURNAL.md"],
    sourcePaths: ["dashboard.js", "dashboard.html", "scripts/build-demo-learner-report.js", "scripts/diff-demo-learner-report.js", "scripts/smoke-demo-learner-report.js", "scripts/smoke-demo-learner-diff.js", "scripts/smoke-dashboard.js", "scripts/build-today-program-report.js", "scripts/diff-today-program-report.js", "scripts/snapshot-dashboard-recommendations.js", "scripts/fixtures/dashboard-recommendations.snapshot.json"],
    contracts: [
      "Today state classification is deterministic over planner, URL handoff, active plan, and memory facts.",
      "Demo learner mode renders a companion-backed Today state from in-memory evidence only.",
      "The public report covers onboarding, active-route, return, and memory-review states.",
      "Copy, action, citation, and guardrail drift is reviewable."
    ]
  },
  {
    id: "guided-session-outcome-loop",
    title: "Guided session outcome loop",
    stage: "shipped",
    userValue: "Learners get one focused session that turns planner, memory, advisor, and companion signals into a concrete, portable outcome receipt instead of exposing diagnostics first.",
    surfaces: ["Dashboard Guided session section", "Dashboard guided outcome history", "dashboard.html?demo=learner", "reports/guided-session.json", "Practice plan route handoff", "Portable profile export/import"],
    proofGates: ["check:guided-session", "check:lesson-engine", "check:dashboard", "check:guided-session-report", "check:guided-session-diff", "check:health", "check:pages"],
    publicReports: ["guided-session", "project-health"],
    docs: ["docs/COMPANION_ARCHITECTURE.md", "docs/DEVELOPMENT_JOURNAL.md"],
    sourcePaths: ["shared/plata-guided-session.js", "shared/plata-planner.js", "dashboard.js", "dashboard.html", "styles.css", "scripts/smoke-guided-session.js", "scripts/smoke-lesson-engine.js", "scripts/smoke-dashboard.js", "scripts/build-guided-session-report.js", "scripts/smoke-guided-session-report.js", "scripts/diff-guided-session-report.js", "scripts/smoke-guided-session-diff.js", "scripts/build-pages-artifact.js"],
    contracts: [
      "Every guided session has four learner-facing steps: orient, practice, notice, and receipt.",
      "Ready and active sessions carry planner route handoff ids so the dashboard can continue after lesson return.",
      "Memory-backed sessions cite derived memory facts and reject raw answer history.",
      "Completed route handoff writes compact outcome receipts with stable gdo fingerprints.",
      "Dashboard profile export/import preserves guided outcome receipts without embedding raw answers.",
      "Guided session and outcome receipt drift is reviewable in pull requests.",
      "The public report covers first session, repair, active route, due review, completed-route states, and the outcome ledger."
    ]
  },
  {
    id: "lightweight-companion-bridge",
    title: "Lightweight companion and read-only bridge",
    stage: "guarded",
    userValue: "A user-facing companion can explain the next action while external Hermes/OpenClaw-style tools remain optional and unable to override memory or planner state.",
    surfaces: ["Study companion card", "plata.companion-card", "plata.hermes-bridge-brief"],
    proofGates: ["check:companion", "check:agent-handoff", "check:memory-brief", "check:advisor", "check:personalization-eval"],
    publicReports: ["project-health"],
    docs: ["docs/COMPANION_ARCHITECTURE.md", "docs/LEARNER_MEMORY_AGENT_RFC.md"],
    sourcePaths: ["shared/plata-companion.js", "shared/plata-agent-handoff.js", "shared/plata-memory-brief.js", "scripts/smoke-companion.js", "scripts/smoke-agent-handoff.js"],
    contracts: [
      "Companion cards contain one next action, citations, guardrails, and a stable fingerprint.",
      "Hermes bridge briefs are read-only and exclude raw history.",
      "External agents can explain or schedule around a recommendation but cannot write memory or override the planner."
    ]
  },
  {
    id: "contributor-authoring-toolkit",
    title: "Contributor authoring toolkit",
    stage: "shipped",
    userValue: "A contributor can add or repair learning material through checked schemas, audits, scaffolds, and issue templates instead of guessing hidden rules.",
    surfaces: ["Lesson schema", "Gold scaffold CLI", "Exercise audit", "GitHub issue templates"],
    proofGates: ["check:data", "check:lessons", "check:exercise-audit", "check:gold-scaffold", "check:catalog", "check:comic-prompts"],
    publicReports: ["quality", "skill-coverage", "project-health"],
    docs: ["CONTRIBUTING.md", "docs/LESSON_SCHEMA.md", "docs/GOLD_LESSON_QUALITY_ENGINE.md"],
    sourcePaths: ["scripts/scaffold-gold-lesson.js", "scripts/smoke-gold-scaffold.js", "scripts/audit-lesson-exercises.js", ".github/ISSUE_TEMPLATE/exercise_data.yml", ".github/ISSUE_TEMPLATE/lesson_idea.yml"],
    contracts: [
      "Scaffolded gold lessons must validate, simulate, and run through the lesson engine.",
      "Exercise audits catch duplicate answers, contradictory gates, and known editorial slips.",
      "Issue templates collect enough data for maintainers to reproduce content bugs."
    ]
  },
  {
    id: "public-github-proof-surface",
    title: "Public GitHub proof surface",
    stage: "shipped",
    userValue: "Visitors can inspect the project's claims as generated JSON reports, a readable proof page, and focused PR drift instead of trusting prose.",
    surfaces: ["index.html", "Home evaluator path", "proof.html", "program.html", "dashboard.html?demo=learner", "dashboard.html?demo=learner&ledger-return=1", "reports/evaluator-path.json", "reports/evaluator-journey.json", "reports/profile-portability.json", "reports/exercise-value.json", "reports/demo-learner.json", "reports/guided-session.json", "reports/capabilities.json", "reports/project-health.json", "reports/proof-digest.json", "reports/quickstart-proof/quickstart.json", "Pull-request QA review report", "GitHub Step Summary", "Contributor proof quickstart", "README"],
    proofGates: ["check:home", "check:program-page", "check:proof-page", "check:capability-map", "check:evaluator-path", "check:evaluator-journey", "check:profile-portability", "check:exercise-value-report", "check:proof-digest", "check:health", "check:public-runtime", "check:public-runtime-mutations", "check:pages", "check:quality-report", "check:demo-learner-report", "check:demo-learner-diff", "check:today-program-report", "check:guided-session-report", "check:guided-session-diff", "check:review-report", "check:review-report-fixture", "check:quickstart-proof"],
    publicReports: ["capabilities", "demo-learner", "evaluator-path", "evaluator-journey", "profile-portability", "exercise-value", "guided-session", "project-health", "proof-digest", "quality", "quickstart-proof", "skill-coverage", "today-program"],
    docs: ["README.md", "docs/DEVELOPMENT_JOURNAL.md"],
    sourcePaths: ["index.html", "proof.html", "proof.js", "program.html", "program.js", "dashboard.html", "dashboard.js", "shared/plata-guided-session.js", "scripts/build-demo-learner-report.js", "scripts/diff-demo-learner-report.js", "scripts/smoke-demo-learner-report.js", "scripts/smoke-demo-learner-diff.js", "scripts/build-guided-session-report.js", "scripts/smoke-guided-session-report.js", "scripts/diff-guided-session-report.js", "scripts/smoke-guided-session-diff.js", "scripts/build-evaluator-path-report.js", "scripts/smoke-evaluator-path.js", "scripts/build-evaluator-journey-report.js", "scripts/smoke-evaluator-journey.js", "scripts/build-profile-portability-report.js", "scripts/smoke-profile-portability.js", "scripts/build-exercise-value-report.js", "scripts/smoke-exercise-value-report.js", "scripts/smoke-home.js", "scripts/smoke-program-page.js", "scripts/smoke-proof-page.js", "scripts/smoke-public-runtime.js", "scripts/mutation-public-runtime.js", "scripts/smoke-dashboard.js", "scripts/build-capability-map.js", "scripts/build-project-health-manifest.js", "scripts/build-proof-digest.js", "scripts/smoke-proof-digest.js", "scripts/build-review-report.js", "scripts/smoke-review-report-fixture.js", "scripts/build-quickstart-proof.js", "scripts/smoke-quickstart-proof.js", "scripts/fixtures/review-report-golden/quality-diff.json", "scripts/fixtures/review-report-golden/guided-diff.json", "scripts/build-pages-artifact.js", ".github/workflows/qa.yml"],
    contracts: [
      "Every declared capability links to checks, source files, docs, and public reports.",
      "Program and home pages expose the read-only demo learner dashboard for first-time evaluators.",
      "Home evaluator path links the read-only demo learner, guided proof, and proof walkthrough without root links to Pages-only reports.",
      "Evaluator path report makes first-visit route drift inspectable on the public proof page.",
      "Evaluator journey report proves the demo-to-proof-to-guided-return path as a deterministic acceptance trace.",
      "Profile portability report proves real local profile export/import/replay as a public acceptance trace.",
      "Exercise value report proves the flagship lesson is not a context-free quiz.",
      "Project health verifies full-check workflows and report publishing.",
      "Proof / Health renders the reports and golden review fixture as one readable public surface.",
      "Proof / Health renders a visitor walkthrough from demo learner to guided outcome receipt.",
      "Proof / Health renders a compact capability matrix that traces user-facing claims to gates, reports, and source.",
      "Proof / Health explains the guided outcome-loop report, diff gate, and source contracts.",
      "Public runtime QA serves the built Pages artifact over HTTP and renders the public JS surfaces against generated reports.",
      "Public runtime mutation QA proves broken evaluator, read-only demo, report-link, and responsive contracts fail before publish.",
      "Proof digest translates generated reports into visitor-facing claims and trust boundaries.",
      "PR review output writes a full JSON artifact plus a capped GitHub Step Summary that groups regressions, review changes, improvements, and informational drift.",
      "The contributor proof quickstart builds the core local proof artifacts with one command."
    ]
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

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
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

function proofGateRow(root, pkg, sequenceIndex, gateId) {
  const command = pkg.scripts && pkg.scripts[gateId] || "";
  const sourcePath = scriptPathFromCommand(command);
  const issues = [];
  if (!command) issues.push("missing package script");
  if (!sequenceIndex.has(gateId)) issues.push("not included in npm run check");
  if (sourcePath && !fileExists(root, sourcePath)) issues.push(`missing source file ${sourcePath}`);
  return {
    id: gateId,
    command,
    sourcePath,
    checkOrder: sequenceIndex.has(gateId) ? sequenceIndex.get(gateId) + 1 : null,
    status: issues.length ? "fail" : "pass",
    issues
  };
}

function pagesPublishesReport(root, pagesPath) {
  const pagesBuild = fileExists(root, "scripts/build-pages-artifact.js")
    ? readText(root, "scripts/build-pages-artifact.js")
    : "";
  const reportFile = pagesPath.split("/").pop();
  return pagesBuild.includes(pagesPath)
    || pagesBuild.includes(`"reports", "${reportFile}"`)
    || pagesBuild.includes(`'reports', '${reportFile}'`);
}

function publicReportRows(root, pkg) {
  return Object.entries(publicReportSpecs).map(([id, spec]) => {
    const issues = [];
    if (!fileExists(root, spec.builderScript)) issues.push(`missing builder ${spec.builderScript}`);
    if (!pkg.scripts || !pkg.scripts[spec.checkScript]) issues.push(`missing package script ${spec.checkScript}`);
    if (!pagesPublishesReport(root, spec.pagesPath)) issues.push(`Pages artifact does not publish ${spec.pagesPath}`);
    return {
      id,
      title: spec.title,
      builderScript: spec.builderScript,
      checkScript: spec.checkScript,
      pagesPath: spec.pagesPath,
      status: issues.length ? "fail" : "pass",
      issues
    };
  });
}

function fileRows(root, paths) {
  return unique(paths).map(relPath => ({
    path: relPath,
    exists: fileExists(root, relPath),
    status: fileExists(root, relPath) ? "pass" : "fail"
  }));
}

function capabilityRow(root, pkg, sequenceIndex, reportIndex, spec) {
  const rowIssues = [];
  const proofGates = asArray(spec.proofGates).map(gateId => {
    const row = proofGateRow(root, pkg, sequenceIndex, gateId);
    row.issues.forEach(issue => rowIssues.push(`${gateId}: ${issue}`));
    return row;
  });
  const reports = asArray(spec.publicReports).map(reportId => {
    const row = reportIndex.get(reportId);
    if (!row) {
      rowIssues.push(`unknown public report ${reportId}`);
      return { id: reportId, status: "fail", issues: ["unknown public report"] };
    }
    row.issues.forEach(issue => rowIssues.push(`${reportId}: ${issue}`));
    return {
      id: row.id,
      title: row.title,
      pagesPath: row.pagesPath,
      status: row.status,
      issues: row.issues
    };
  });
  const docs = fileRows(root, spec.docs);
  const sourcePaths = fileRows(root, spec.sourcePaths);

  docs.filter(row => !row.exists).forEach(row => rowIssues.push(`missing doc ${row.path}`));
  sourcePaths.filter(row => !row.exists).forEach(row => rowIssues.push(`missing source ${row.path}`));
  if (!spec.userValue) rowIssues.push("missing userValue");
  if (!asArray(spec.surfaces).length) rowIssues.push("missing user-facing surfaces");
  if (!asArray(spec.contracts).length) rowIssues.push("missing contracts");
  if (!asArray(spec.proofGates).length) rowIssues.push("missing proof gates");

  return {
    id: spec.id,
    title: spec.title,
    stage: spec.stage || "shipped",
    userValue: spec.userValue || "",
    surfaces: asArray(spec.surfaces),
    contracts: asArray(spec.contracts),
    status: rowIssues.length ? "fail" : "pass",
    issues: rowIssues,
    proofGates,
    publicReports: reports,
    docs,
    sourcePaths
  };
}

function buildCapabilityMap(options = {}) {
  const root = reportRoot(options);
  const pkg = readJson(root, "package.json");
  const sequence = checkSequence(pkg);
  const sequenceIndex = new Map(sequence.map((id, index) => [id, index]));
  const publicReports = publicReportRows(root, pkg);
  const reportIndex = new Map(publicReports.map(report => [report.id, report]));
  const capabilities = capabilitySpecs.map(spec => capabilityRow(root, pkg, sequenceIndex, reportIndex, spec));
  const issues = [
    ...publicReports.flatMap(report => report.issues.map(issue => `${report.id}: ${issue}`)),
    ...capabilities.flatMap(capability => capability.issues.map(issue => `${capability.id}: ${issue}`))
  ];
  const usedProofGates = unique(capabilities.flatMap(capability => capability.proofGates.map(gate => gate.id)));
  const usedReports = unique(capabilities.flatMap(capability => capability.publicReports.map(report => report.id)));
  const usedDocs = unique(capabilities.flatMap(capability => capability.docs.map(row => row.path)));
  const usedSources = unique(capabilities.flatMap(capability => capability.sourcePaths.map(row => row.path)));
  const guarantees = [
    {
      key: "declared-capabilities-have-proof-gates",
      label: "Every declared capability has at least one npm run check gate",
      pass: capabilities.every(capability => capability.proofGates.length && capability.proofGates.every(gate => gate.status === "pass"))
    },
    {
      key: "declared-capabilities-link-docs-and-source",
      label: "Every declared capability links existing docs and source files",
      pass: capabilities.every(capability => capability.docs.every(row => row.exists) && capability.sourcePaths.every(row => row.exists))
    },
    {
      key: "public-report-surface-published",
      label: "Every public report named by the map is built into the Pages artifact",
      pass: usedReports.every(id => {
        const report = reportIndex.get(id);
        return report && report.status === "pass";
      })
    },
    {
      key: "capability-map-is-self-hosted",
      label: "The capability map itself is checked, documented, and published",
      pass: Boolean(pkg.scripts && pkg.scripts["check:capability-map"])
        && sequence.includes("check:capability-map")
        && pagesPublishesReport(root, publicReportSpecs.capabilities.pagesPath)
    }
  ];
  guarantees.filter(item => !item.pass).forEach(item => issues.push(`guarantee failed: ${item.key}`));

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: issues.length ? "fail" : "pass",
    totals: {
      capabilities: capabilities.length,
      proofGates: usedProofGates.length,
      publicReports: usedReports.length,
      docs: usedDocs.length,
      sourcePaths: usedSources.length,
      issues: issues.length
    },
    guarantees,
    issues,
    publicReports,
    capabilities
  };
}

function formatCapabilityMap(report) {
  const lines = [
    "Product Capability Map",
    `status: ${report.status}`,
    `capabilities: ${report.totals.capabilities}`,
    `proof gates: ${report.totals.proofGates}`,
    `public reports: ${report.totals.publicReports}`,
    "",
    "Guarantees:"
  ];
  report.guarantees.forEach(item => lines.push(`- ${item.pass ? "pass" : "fail"} ${item.key}: ${item.label}`));
  lines.push("", "Capabilities:");
  report.capabilities.forEach(capability => {
    const reports = capability.publicReports.map(item => item.id).join(", ") || "none";
    lines.push(`- ${capability.id}: ${capability.status} (${capability.proofGates.length} gate(s), reports: ${reports})`);
  });
  lines.push("", "Issues:");
  if (report.issues.length) report.issues.forEach(issue => lines.push(`- ${issue}`));
  else lines.push("none");
  return lines.join("\n");
}

function writeCapabilityMap(outPath, options = {}) {
  const root = reportRoot(options);
  const report = buildCapabilityMap({ root });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  if (options.text) console.log(formatCapabilityMap(report));
  if (report.status !== "pass") {
    console.error(`capability map failed with ${report.totals.issues} issue(s)`);
    report.issues.forEach(issue => console.error(`- ${issue}`));
    process.exit(1);
  }
  if (!options.text) {
    console.log(`capability map built: ${displayRel(outPath, root)} (${report.totals.capabilities} capability(ies), ${report.totals.proofGates} proof gate(s))`);
  }
  return report;
}

function main() {
  const root = argValue("--root") || repoRoot;
  const out = argValue("--out") || path.join(repoRoot, ".dist", "capabilities.json");
  const report = buildCapabilityMap({ root });
  if (hasFlag("--json")) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    if (report.status !== "pass") process.exit(1);
    return;
  }
  writeCapabilityMap(path.resolve(repoRoot, out), { root, text: hasFlag("--text") });
}

if (require.main === module) main();

module.exports = {
  buildCapabilityMap,
  formatCapabilityMap,
  writeCapabilityMap,
  capabilitySpecs,
  publicReportSpecs
};

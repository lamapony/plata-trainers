#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildDemoLearnerReport } = require("./build-demo-learner-report.js");
const { buildGuidedSessionReport } = require("./build-guided-session-report.js");
const { buildCapabilityMap } = require("./build-capability-map.js");

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

function readText(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeLocalHref(href) {
  return String(href || "").replace(/^\.\//, "");
}

function hrefHash(href) {
  return String(href || "").includes("#") ? String(href).slice(String(href).indexOf("#")) : "";
}

function sectionById(html, id) {
  const pattern = new RegExp(`<section\\b(?=[^>]*\\bid="${escapeRegExp(id)}")[\\s\\S]*?<\\/section>`, "i");
  const match = String(html || "").match(pattern);
  return match ? match[0] : "";
}

function linkRows(html) {
  return Array.from(String(html || "").matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)).map(match => ({
    href: match[1],
    text: stripHtml(match[2])
  }));
}

function hasId(html, id) {
  return new RegExp(`\\bid="${escapeRegExp(id)}"`, "i").test(String(html || ""));
}

function capability(report, id) {
  return (report.capabilities || []).find(item => item.id === id) || null;
}

function hasGate(row, id) {
  return !!row && (row.proofGates || []).some(gate => gate.id === id && gate.status === "pass");
}

function hasSurface(row, surface) {
  return !!row && (row.surfaces || []).includes(surface);
}

function hasReport(row, reportId) {
  return !!row && (row.publicReports || []).some(report => report.id === reportId && report.status === "pass");
}

function displayRel(file, root = repoRoot) {
  const absolute = path.resolve(file);
  const workspaceRel = path.relative(repoRoot, absolute);
  if (!workspaceRel.startsWith("..") && !path.isAbsolute(workspaceRel)) return workspaceRel.replaceAll(path.sep, "/");
  return path.relative(root, absolute).replaceAll(path.sep, "/");
}

function buildEvaluatorPathReport(options = {}) {
  const root = sourceRoot(options);
  const indexHtml = options.indexHtml || readText(root, "index.html");
  const proofHtml = options.proofHtml || readText(root, "proof.html");
  const demo = options.demo || buildDemoLearnerReport({ root });
  const guided = options.guided || buildGuidedSessionReport({ root });
  const capabilities = options.capabilities || buildCapabilityMap({ root });
  const issues = [];
  const evaluatorSection = sectionById(indexHtml, "evaluate");
  const evaluatorLinks = linkRows(evaluatorSection);
  const homeLinks = linkRows(indexHtml);
  const requiredHomeLinks = [
    { href: "./dashboard.html?demo=learner", label: "read-only demo learner" },
    { href: "./proof.html#proof-walkthrough-title", label: "proof walkthrough" },
    { href: "./proof.html#proof-guided-title", label: "guided proof" }
  ];
  const requiredEvaluatorLinks = requiredHomeLinks;
  const routeTargets = [
    { href: "./dashboard.html?demo=learner", targetFile: "dashboard.html" },
    { href: "./proof.html#proof-walkthrough-title", targetFile: "proof.html", targetId: "proof-walkthrough-title" },
    { href: "./proof.html#proof-guided-title", targetFile: "proof.html", targetId: "proof-guided-title" }
  ];

  if (!evaluatorSection) issues.push("home page is missing #evaluate section");
  requiredHomeLinks.forEach(item => {
    if (!homeLinks.some(link => link.href === item.href)) issues.push(`home page missing ${item.label} link ${item.href}`);
  });
  requiredEvaluatorLinks.forEach(item => {
    if (!evaluatorLinks.some(link => link.href === item.href)) issues.push(`home evaluator path missing ${item.label} link ${item.href}`);
  });
  if (/href="\.\.?\/?reports\//i.test(evaluatorSection)) {
    issues.push("home evaluator path links directly to report URLs from the root page");
  }
  routeTargets.forEach(route => {
    if (!fs.existsSync(path.join(root, route.targetFile))) issues.push(`route target missing: ${route.href} -> ${route.targetFile}`);
    if (route.targetId && !hasId(proofHtml, route.targetId)) issues.push(`proof route target missing id: ${route.targetId}`);
  });

  if (demo.status !== "pass") issues.push("demo learner report is not passing");
  if (normalizeLocalHref(requiredEvaluatorLinks[0].href) !== demo.url) {
    issues.push(`demo learner URL drifted: expected ${normalizeLocalHref(requiredEvaluatorLinks[0].href)}, got ${demo.url}`);
  }
  if ((demo.totals && demo.totals.storageWrites) !== 0) issues.push("demo learner is not read-only");
  if (!(demo.totals && demo.totals.visibleMemoryFacts >= 7)) issues.push("demo learner does not expose a rich memory profile");
  if (!(demo.plan && demo.plan.kind === "repair" && demo.plan.stepCount >= 2)) issues.push("demo learner does not produce a repair plan with multiple steps");
  if (!(demo.actionableStep && demo.actionableStep.kind === "repair" && demo.actionableStep.signalTag)) issues.push("demo learner does not expose a repair actionable step");
  if (!(demo.companion && demo.companion.fingerprint && (demo.companion.citedFacts || []).length)) {
    issues.push("demo learner does not expose a cited companion receipt");
  }

  const memoryBacked = (guided.scenarios || []).find(item => item.id === "memory-backed-repair") || null;
  const memorySession = memoryBacked && memoryBacked.session || null;
  if (guided.status !== "pass") issues.push("guided session report is not passing");
  if (!(guided.totals && guided.totals.outcomeReceipts >= 1)) issues.push("guided session report has no outcome receipt");
  if (!(memoryBacked && memoryBacked.status === "pass")) issues.push("guided session report is missing the passing memory-backed repair scenario");
  if (!(memorySession && memorySession.status === "ready")) issues.push("memory-backed guided session is not ready");
  if (!(memorySession && (memorySession.steps || []).length === 4)) issues.push("memory-backed guided session does not have four learner-facing steps");
  if (!(memorySession && memorySession.route && /[?&]plan=/.test(memorySession.route.href) && /[?&]step=/.test(memorySession.route.href))) {
    issues.push("memory-backed guided session route does not carry plan and step tokens");
  }
  if (!(memorySession && memorySession.guardrails && memorySession.guardrails.requiresModel === false && memorySession.guardrails.containsRawAnswerText === false)) {
    issues.push("memory-backed guided session guardrails drifted");
  }

  const proof = capability(capabilities, "public-github-proof-surface");
  if (capabilities.status !== "pass") issues.push("capability map is not passing");
  if (!hasSurface(proof, "index.html")) issues.push("public proof capability does not cite index.html");
  if (!hasSurface(proof, "Home evaluator path")) issues.push("public proof capability does not cite the Home evaluator path surface");
  if (!hasGate(proof, "check:evaluator-path")) issues.push("public proof capability does not cite check:evaluator-path");
  if (!hasGate(proof, "check:home")) issues.push("public proof capability does not cite check:home");
  if (!hasGate(proof, "check:proof-page")) issues.push("public proof capability does not cite check:proof-page");
  if (!hasReport(proof, "demo-learner")) issues.push("public proof capability does not cite demo learner report");
  if (!hasReport(proof, "evaluator-path")) issues.push("public proof capability does not cite evaluator path report");
  if (!hasReport(proof, "guided-session")) issues.push("public proof capability does not cite guided session report");

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: issues.length ? "fail" : "pass",
    entry: {
      page: "index.html",
      hash: "#evaluate",
      title: "Evaluator path",
      links: evaluatorLinks
    },
    routeTargets: routeTargets.map(route => ({
      href: route.href,
      targetFile: route.targetFile,
      targetHash: hrefHash(route.href),
      targetId: route.targetId || "",
      targetExists: fs.existsSync(path.join(root, route.targetFile)),
      hashTargetExists: route.targetId ? hasId(proofHtml, route.targetId) : true
    })),
    backingReports: {
      demoLearner: {
        status: demo.status,
        url: demo.url,
        storageWrites: demo.totals && demo.totals.storageWrites,
        visibleMemoryFacts: demo.totals && demo.totals.visibleMemoryFacts,
        planKind: demo.plan && demo.plan.kind,
        actionableStep: demo.actionableStep,
        companionFingerprint: demo.companion && demo.companion.fingerprint
      },
      guidedSession: {
        status: guided.status,
        outcomeReceipts: guided.totals && guided.totals.outcomeReceipts,
        memoryBackedStatus: memoryBacked && memoryBacked.status,
        memoryBackedFingerprint: memorySession && memorySession.fingerprint
      },
      capabilityMap: {
        status: capabilities.status,
        proofSurfaceGates: proof ? (proof.proofGates || []).map(gate => gate.id) : [],
        proofSurfaceReports: proof ? (proof.publicReports || []).map(report => report.id) : []
      }
    },
    issues
  };
}

function formatEvaluatorPathReport(report) {
  const lines = [
    "Evaluator Path Report",
    `status: ${report.status}`,
    `entry: ${report.entry.page}${report.entry.hash}`,
    `links: ${report.entry.links.length}`,
    "",
    "Route targets:"
  ];
  report.routeTargets.forEach(route => {
    lines.push(`- ${route.href}: ${route.targetExists && route.hashTargetExists ? "pass" : "fail"}`);
  });
  lines.push("", "Backing reports:");
  lines.push(`- demo learner: ${report.backingReports.demoLearner.status} / ${report.backingReports.demoLearner.visibleMemoryFacts} memory fact(s) / ${report.backingReports.demoLearner.storageWrites} storage write(s)`);
  lines.push(`- guided session: ${report.backingReports.guidedSession.status} / ${report.backingReports.guidedSession.outcomeReceipts} outcome receipt(s)`);
  lines.push(`- capability map: ${report.backingReports.capabilityMap.status}`);
  lines.push("", "Issues:");
  if (report.issues.length) report.issues.forEach(issue => lines.push(`- ${issue}`));
  else lines.push("none");
  return lines.join("\n");
}

function writeEvaluatorPathReport(outPath, options = {}) {
  const root = sourceRoot(options);
  const report = buildEvaluatorPathReport({ root });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  if (options.text) console.log(formatEvaluatorPathReport(report));
  if (report.status !== "pass") {
    console.error(`evaluator path report failed with ${report.issues.length} issue(s)`);
    report.issues.forEach(issue => console.error(`- ${issue}`));
    process.exit(1);
  }
  if (!options.text) {
    console.log(`evaluator path report built: ${displayRel(outPath, root)} (${report.entry.links.length} link(s), ${report.routeTargets.length} route target(s))`);
  }
  return report;
}

function main() {
  const root = argValue("--root") || repoRoot;
  const out = argValue("--out") || path.join(repoRoot, ".dist", "evaluator-path.json");
  const report = buildEvaluatorPathReport({ root });
  if (hasFlag("--json")) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    if (report.status !== "pass") process.exit(1);
    return;
  }
  writeEvaluatorPathReport(path.resolve(repoRoot, out), { root, text: hasFlag("--text") });
}

if (require.main === module) main();

module.exports = {
  buildEvaluatorPathReport,
  formatEvaluatorPathReport,
  writeEvaluatorPathReport
};

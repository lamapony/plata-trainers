#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildTodayProgramReport } = require("./build-today-program-report.js");

const repoRoot = path.resolve(__dirname, "..");

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function sortedUnion(a, b) {
  return [...new Set([...a, ...b].filter(Boolean))].sort();
}

function byKey(items, keyFn) {
  return new Map(asArray(items).map(item => [keyFn(item), item]).filter(([key]) => key));
}

function readReport(file) {
  if (!file || file === "current") return buildTodayProgramReport();
  return JSON.parse(fs.readFileSync(path.resolve(repoRoot, file), "utf8"));
}

function change(diff, severity, scope, message, details = {}) {
  const entry = { severity, scope, message, details };
  diff.changes.push(entry);
  if (severity === "regression") diff.regressions.push(entry);
  if (severity === "improvement") diff.improvements.push(entry);
}

function compareField(diff, severity, scope, label, before, after) {
  const left = before === undefined || before === null ? "" : before;
  const right = after === undefined || after === null ? "" : after;
  if (left === right) return;
  change(diff, severity, scope, `${label} changed ${JSON.stringify(left)} -> ${JSON.stringify(right)}`, { before: left, after: right });
}

function compareBoolean(diff, scope, label, before, after) {
  if (!!before === !!after) return;
  const severity = before && !after ? "regression" : "improvement";
  change(diff, severity, scope, `${label} changed ${before ? "present" : "missing"} -> ${after ? "present" : "missing"}`, { before: !!before, after: !!after });
}

function compareSet(diff, scope, label, baseValues, headValues, removedSeverity = "review", addedSeverity = "info") {
  const base = asArray(baseValues).filter(Boolean);
  const head = asArray(headValues).filter(Boolean);
  const baseSet = new Set(base);
  const headSet = new Set(head);
  base.filter(value => !headSet.has(value)).forEach(value => change(diff, removedSeverity, scope, `${label} removed: ${value}`));
  head.filter(value => !baseSet.has(value)).forEach(value => change(diff, addedSeverity, scope, `${label} added: ${value}`));
}

function factKey(fact) {
  return [fact && fact.kind || "", fact && fact.signal || "", fact && fact.sourceFingerprint || fact && fact.id || ""].join(":");
}

function compareSelectedFacts(diff, scope, before, after) {
  const baseFacts = asArray(before && before.step && before.step.selectedMemoryFacts).map(factKey).filter(Boolean);
  const headFacts = asArray(after && after.step && after.step.selectedMemoryFacts).map(factKey).filter(Boolean);
  compareSet(diff, scope, "selected memory fact", baseFacts, headFacts, "regression", "info");
}

function compareScenario(diff, before, after) {
  const id = before && before.id || after && after.id || "unknown";
  const scope = `today.${id}`;
  const leftProgram = before && before.program || {};
  const rightProgram = after && after.program || {};

  compareField(diff, before.status === "pass" && after.status === "fail" ? "regression" : "improvement", scope, "status", before.status, after.status);
  compareField(diff, "regression", scope, "program state", leftProgram.kind, rightProgram.kind);
  compareField(diff, "review", scope, "headline", leftProgram.headline, rightProgram.headline);
  compareField(diff, "review", scope, "message", leftProgram.message, rightProgram.message);
  compareField(diff, "review", scope, "why", leftProgram.why, rightProgram.why);
  compareField(diff, "review", scope, "action label", leftProgram.actionLabel, rightProgram.actionLabel);
  compareField(diff, "review", scope, "action href", before.actionHref, after.actionHref);
  compareField(diff, "review", scope, "active stage", before.rendered && before.rendered.activeStage, after.rendered && after.rendered.activeStage);
  compareBoolean(diff, scope, "primary action", before.rendered && before.rendered.hasAction, after.rendered && after.rendered.hasAction);
  compareBoolean(diff, scope, "stage strip", before.rendered && before.rendered.hasStageStrip, after.rendered && after.rendered.hasStageStrip);
  compareSet(diff, scope, "guardrail", before.rendered && before.rendered.guardrails, after.rendered && after.rendered.guardrails, "regression", "info");
  compareSelectedFacts(diff, scope, before, after);

  const baseIssues = asArray(before.issues);
  const headIssues = asArray(after.issues);
  headIssues.filter(issue => !baseIssues.includes(issue)).forEach(issue => change(diff, "regression", scope, `Issue added: ${issue}`));
  baseIssues.filter(issue => !headIssues.includes(issue)).forEach(issue => change(diff, "improvement", scope, `Issue removed: ${issue}`));
}

function compareTodayProgramReports(base, head) {
  const diff = {
    schemaVersion: 1,
    status: "unchanged",
    base: {
      status: base.status || "",
      states: asArray(base.states),
      scenarios: asArray(base.scenarios).map(item => item.id)
    },
    head: {
      status: head.status || "",
      states: asArray(head.states),
      scenarios: asArray(head.scenarios).map(item => item.id)
    },
    changes: [],
    regressions: [],
    improvements: []
  };

  compareField(diff, base.status === "pass" && head.status === "fail" ? "regression" : "improvement", "today.report", "status", base.status, head.status);
  compareSet(diff, "today.report", "state", base.states, head.states, "regression", "info");

  const baseScenarios = byKey(base.scenarios, item => item.id);
  const headScenarios = byKey(head.scenarios, item => item.id);
  sortedUnion([...baseScenarios.keys()], [...headScenarios.keys()]).forEach(id => {
    const before = baseScenarios.get(id);
    const after = headScenarios.get(id);
    if (before && !after) {
      change(diff, "regression", "today.report", `Scenario removed: ${id}`);
      return;
    }
    if (!before && after) {
      change(diff, "info", "today.report", `Scenario added: ${id}`);
      return;
    }
    compareScenario(diff, before, after);
  });

  if (diff.regressions.length) diff.status = "regression";
  else if (diff.changes.length) diff.status = "changed";
  diff.summary = {
    changes: diff.changes.length,
    regressions: diff.regressions.length,
    improvements: diff.improvements.length
  };
  return diff;
}

function formatSection(title, entries) {
  if (!entries.length) return [`${title}: none`];
  return [
    `${title}: ${entries.length}`,
    ...entries.map(entry => `- [${entry.scope}] ${entry.message}`)
  ];
}

function formatTodayProgramDiff(diff) {
  const review = diff.changes.filter(entry => entry.severity === "review");
  const info = diff.changes.filter(entry => entry.severity === "info");
  return [
    `Today program diff: ${diff.status}`,
    `Base states: ${diff.base.states.join(", ") || "none"}`,
    `Head states: ${diff.head.states.join(", ") || "none"}`,
    ...formatSection("Regressions", diff.regressions),
    ...formatSection("Review changes", review),
    ...formatSection("Improvements", diff.improvements),
    ...formatSection("Other changes", info)
  ].join("\n");
}

function main() {
  const basePath = argValue("--base");
  const headPath = argValue("--head") || "current";
  if (!basePath) {
    console.error("usage: node scripts/diff-today-program-report.js --base <report.json> [--head <report.json|current>] [--json] [--fail-on-change] [--fail-on-regression]");
    process.exit(2);
  }
  const diff = compareTodayProgramReports(readReport(basePath), readReport(headPath));
  if (hasFlag("--json")) console.log(JSON.stringify(diff, null, 2));
  else console.log(formatTodayProgramDiff(diff));
  if (hasFlag("--fail-on-regression") && diff.regressions.length) process.exit(1);
  if (hasFlag("--fail-on-change") && diff.changes.length) process.exit(1);
}

if (require.main === module) main();

module.exports = {
  compareTodayProgramReports,
  formatTodayProgramDiff,
  readReport
};

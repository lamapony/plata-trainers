#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildGuidedSessionReport } = require("./build-guided-session-report.js");

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
  if (!file || file === "current") return buildGuidedSessionReport();
  return JSON.parse(fs.readFileSync(path.resolve(repoRoot, file), "utf8"));
}

function change(diff, severity, scope, message, details = {}) {
  const entry = { severity, scope, message, details };
  diff.changes.push(entry);
  if (severity === "regression") diff.regressions.push(entry);
  if (severity === "improvement") diff.improvements.push(entry);
}

function statusSeverity(before, after) {
  if (before === "pass" && after !== "pass") return "regression";
  if (before !== "pass" && after === "pass") return "improvement";
  return "review";
}

function compareField(diff, severity, scope, label, before, after) {
  const left = before === undefined || before === null ? "" : before;
  const right = after === undefined || after === null ? "" : after;
  if (left === right) return;
  change(diff, severity, scope, `${label} changed ${JSON.stringify(left)} -> ${JSON.stringify(right)}`, { before: left, after: right });
}

function compareNumber(diff, scope, label, before, after, direction = "review") {
  before = Number(before || 0);
  after = Number(after || 0);
  if (before === after) return;
  let severity = "review";
  if (direction === "decrease-regression" && after < before) severity = "regression";
  if (direction === "increase-regression" && after > before) severity = "regression";
  if (direction === "increase-improvement" && after > before) severity = "improvement";
  change(diff, severity, scope, `${label} changed ${before} -> ${after}`, { before, after });
}

function compareBoolean(diff, scope, label, before, after) {
  if (!!before === !!after) return;
  const severity = before && !after ? "regression" : "improvement";
  change(diff, severity, scope, `${label} changed ${before ? "present" : "missing"} -> ${after ? "present" : "missing"}`, { before: !!before, after: !!after });
}

function compareSet(diff, scope, label, baseValues, headValues, removedSeverity = "regression", addedSeverity = "info") {
  const base = asArray(baseValues).filter(Boolean);
  const head = asArray(headValues).filter(Boolean);
  const baseSet = new Set(base);
  const headSet = new Set(head);
  base.filter(value => !headSet.has(value)).forEach(value => change(diff, removedSeverity, scope, `${label} removed: ${value}`));
  head.filter(value => !baseSet.has(value)).forEach(value => change(diff, addedSeverity, scope, `${label} added: ${value}`));
}

function factKey(fact) {
  fact = fact || {};
  return [fact.kind || "", fact.signal || "", fact.sourceFingerprint || fact.factId || fact.id || ""].join(":");
}

function receiptFacts(receipt) {
  return asArray(receipt && receipt.citedFacts).map(factKey).filter(Boolean);
}

function stepKey(step) {
  return step && step.id || "";
}

function compareStep(diff, scope, before, after) {
  compareField(diff, before.status === "done" && after.status !== "done" ? "regression" : "review", scope, "step status", before.status, after.status);
  compareField(diff, "review", scope, "step title", before.title, after.title);
  compareBoolean(diff, scope, "step action", before.hasAction, after.hasAction);
  compareSet(diff, scope, "step evidence fact", asArray(before.evidence).map(factKey), asArray(after.evidence).map(factKey), "regression", "info");
}

function compareScenario(diff, before, after) {
  const id = before && before.id || after && after.id || "unknown";
  const scope = `guided.${id}`;
  const leftSession = before && before.session || {};
  const rightSession = after && after.session || {};
  const leftReceipt = leftSession.outcomeReceipt || {};
  const rightReceipt = rightSession.outcomeReceipt || {};

  compareField(diff, statusSeverity(before.status, after.status), scope, "scenario status", before.status, after.status);
  compareField(diff, before.expectedStatus !== after.expectedStatus ? "regression" : "review", scope, "expected status", before.expectedStatus, after.expectedStatus);
  compareField(diff, leftSession.status !== rightSession.status ? "regression" : "review", scope, "session status", leftSession.status, rightSession.status);
  compareField(diff, "review", scope, "session fingerprint", leftSession.fingerprint, rightSession.fingerprint);
  compareField(diff, "review", scope, "goal title", leftSession.goal && leftSession.goal.title, rightSession.goal && rightSession.goal.title);
  compareField(diff, "review", scope, "goal signal", leftSession.goal && leftSession.goal.signal, rightSession.goal && rightSession.goal.signal);
  compareField(diff, "review", scope, "route href", leftSession.route && leftSession.route.href, rightSession.route && rightSession.route.href);
  compareBoolean(diff, scope, "route action", leftSession.route && leftSession.route.href, rightSession.route && rightSession.route.href);

  compareField(diff, "review", scope, "receipt title", leftReceipt.title, rightReceipt.title);
  compareField(diff, "review", scope, "receipt summary", leftReceipt.summary, rightReceipt.summary);
  compareSet(diff, scope, "trained signal", leftReceipt.trainedSignals, rightReceipt.trainedSignals, "regression", "info");
  compareSet(diff, scope, "receipt cited fact", receiptFacts(leftReceipt), receiptFacts(rightReceipt), "regression", "info");
  compareSet(diff, scope, "completion criterion", leftReceipt.completionCriteria, rightReceipt.completionCriteria, "regression", "info");
  compareSet(diff, scope, "trust boundary", leftReceipt.trustBoundaries, rightReceipt.trustBoundaries, "regression", "info");

  compareBoolean(diff, scope, "deterministic guardrail", leftSession.guardrails && leftSession.guardrails.deterministic, rightSession.guardrails && rightSession.guardrails.deterministic);
  compareBoolean(diff, scope, "model-free guardrail", leftSession.guardrails && leftSession.guardrails.requiresModel === false, rightSession.guardrails && rightSession.guardrails.requiresModel === false);
  compareBoolean(diff, scope, "raw-answer guardrail", leftSession.guardrails && leftSession.guardrails.containsRawAnswerText === false, rightSession.guardrails && rightSession.guardrails.containsRawAnswerText === false);

  const baseSteps = byKey(leftSession.steps, stepKey);
  const headSteps = byKey(rightSession.steps, stepKey);
  sortedUnion([...baseSteps.keys()], [...headSteps.keys()]).forEach(key => {
    const left = baseSteps.get(key);
    const right = headSteps.get(key);
    if (left && !right) {
      change(diff, "regression", `${scope}.step.${key}`, `Guided step removed: ${key}`);
      return;
    }
    if (!left && right) {
      change(diff, "info", `${scope}.step.${key}`, `Guided step added: ${key}`);
      return;
    }
    compareStep(diff, `${scope}.step.${key}`, left, right);
  });

  const baseIssues = asArray(before.issues);
  const headIssues = asArray(after.issues);
  headIssues.filter(issue => !baseIssues.includes(issue)).forEach(issue => change(diff, "regression", scope, `Issue added: ${issue}`));
  baseIssues.filter(issue => !headIssues.includes(issue)).forEach(issue => change(diff, "improvement", scope, `Issue removed: ${issue}`));
}

function compareOutcomeLedger(diff, base, head) {
  const before = base.outcomeLedger || {};
  const after = head.outcomeLedger || {};
  compareField(diff, "regression", "guided.outcome-ledger", "ledger type", before.ledgerType, after.ledgerType);
  compareNumber(diff, "guided.outcome-ledger", "outcome receipts", before.totals && before.totals.outcomes, after.totals && after.totals.outcomes, "decrease-regression");
  compareNumber(diff, "guided.outcome-ledger", "ledger issues", before.totals && before.totals.issues, after.totals && after.totals.issues, "increase-regression");
  compareNumber(diff, "guided.outcome-ledger", "cited facts", before.totals && before.totals.citedFacts, after.totals && after.totals.citedFacts, "decrease-regression");

  const baseOutcomes = byKey(before.outcomes, item => item.stepRouteId || item.fingerprint);
  const headOutcomes = byKey(after.outcomes, item => item.stepRouteId || item.fingerprint);
  sortedUnion([...baseOutcomes.keys()], [...headOutcomes.keys()]).forEach(key => {
    const left = baseOutcomes.get(key);
    const right = headOutcomes.get(key);
    const scope = `guided.outcome.${key}`;
    if (left && !right) {
      change(diff, "regression", scope, `Outcome receipt removed: ${key}`);
      return;
    }
    if (!left && right) {
      change(diff, "info", scope, `Outcome receipt added: ${key}`);
      return;
    }
    compareField(diff, "review", scope, "fingerprint", left.fingerprint, right.fingerprint);
    compareField(diff, "review", scope, "goal title", left.goal && left.goal.title, right.goal && right.goal.title);
    compareField(diff, "review", scope, "receipt summary", left.outcomeReceipt && left.outcomeReceipt.summary, right.outcomeReceipt && right.outcomeReceipt.summary);
    compareField(diff, "review", scope, "completion reason", left.completionEvidence && left.completionEvidence.reason, right.completionEvidence && right.completionEvidence.reason);
    compareSet(diff, scope, "outcome cited fact", receiptFacts(left.outcomeReceipt), receiptFacts(right.outcomeReceipt), "regression", "info");
    compareBoolean(diff, scope, "gdo fingerprint", left.fingerprint && left.fingerprint.startsWith("gdo-"), right.fingerprint && right.fingerprint.startsWith("gdo-"));
    compareBoolean(diff, scope, "outcome model-free guardrail", left.guardrails && left.guardrails.requiresModel === false, right.guardrails && right.guardrails.requiresModel === false);
    compareBoolean(diff, scope, "outcome raw-answer guardrail", left.guardrails && left.guardrails.containsRawAnswerText === false, right.guardrails && right.guardrails.containsRawAnswerText === false);
    compareField(diff, statusSeverity(left.validation && left.validation.status, right.validation && right.validation.status), scope, "validation status", left.validation && left.validation.status, right.validation && right.validation.status);
  });
}

function compareIssues(diff, base, head) {
  const baseIssues = asArray(base.issues);
  const headIssues = asArray(head.issues);
  headIssues.filter(issue => !baseIssues.includes(issue)).forEach(issue => change(diff, "regression", "guided.report", `Issue added: ${issue}`));
  baseIssues.filter(issue => !headIssues.includes(issue)).forEach(issue => change(diff, "improvement", "guided.report", `Issue removed: ${issue}`));
}

function compareGuidedSessionReports(base, head) {
  const diff = {
    schemaVersion: 1,
    status: "unchanged",
    base: {
      status: base.status || "",
      statuses: asArray(base.statuses),
      scenarios: asArray(base.scenarios).map(item => item.id),
      outcomeReceipts: Number(base.totals && base.totals.outcomeReceipts || 0)
    },
    head: {
      status: head.status || "",
      statuses: asArray(head.statuses),
      scenarios: asArray(head.scenarios).map(item => item.id),
      outcomeReceipts: Number(head.totals && head.totals.outcomeReceipts || 0)
    },
    changes: [],
    regressions: [],
    improvements: []
  };

  compareField(diff, statusSeverity(base.status, head.status), "guided.report", "status", base.status, head.status);
  compareSet(diff, "guided.report", "session status", base.statuses, head.statuses, "regression", "info");
  compareNumber(diff, "guided.report", "scenario count", base.totals && base.totals.scenarios, head.totals && head.totals.scenarios, "decrease-regression");
  compareNumber(diff, "guided.report", "guided steps", base.totals && base.totals.steps, head.totals && head.totals.steps, "decrease-regression");
  compareNumber(diff, "guided.report", "cited facts", base.totals && base.totals.citedFacts, head.totals && head.totals.citedFacts, "decrease-regression");
  compareNumber(diff, "guided.report", "issues", base.totals && base.totals.issues, head.totals && head.totals.issues, "increase-regression");
  compareSet(diff, "guided.report", "guarantee", base.guarantees, head.guarantees, "regression", "info");

  const baseScenarios = byKey(base.scenarios, item => item.id);
  const headScenarios = byKey(head.scenarios, item => item.id);
  sortedUnion([...baseScenarios.keys()], [...headScenarios.keys()]).forEach(id => {
    const before = baseScenarios.get(id);
    const after = headScenarios.get(id);
    if (before && !after) {
      change(diff, "regression", "guided.report", `Scenario removed: ${id}`);
      return;
    }
    if (!before && after) {
      change(diff, "info", "guided.report", `Scenario added: ${id}`);
      return;
    }
    compareScenario(diff, before, after);
  });
  compareOutcomeLedger(diff, base, head);
  compareIssues(diff, base, head);

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

function formatGuidedSessionDiff(diff) {
  const review = diff.changes.filter(entry => entry.severity === "review");
  const info = diff.changes.filter(entry => entry.severity === "info");
  return [
    `Guided session diff: ${diff.status}`,
    `Base statuses: ${diff.base.statuses.join(", ") || "none"}`,
    `Head statuses: ${diff.head.statuses.join(", ") || "none"}`,
    `Outcome receipts: ${diff.base.outcomeReceipts} -> ${diff.head.outcomeReceipts}`,
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
    console.error("usage: node scripts/diff-guided-session-report.js --base <report.json> [--head <report.json|current>] [--json] [--fail-on-change] [--fail-on-regression]");
    process.exit(2);
  }
  const diff = compareGuidedSessionReports(readReport(basePath), readReport(headPath));
  if (hasFlag("--json")) console.log(JSON.stringify(diff, null, 2));
  else console.log(formatGuidedSessionDiff(diff));
  if (hasFlag("--fail-on-regression") && diff.regressions.length) process.exit(1);
  if (hasFlag("--fail-on-change") && diff.changes.length) process.exit(1);
}

if (require.main === module) main();

module.exports = {
  compareGuidedSessionReports,
  formatGuidedSessionDiff,
  readReport
};

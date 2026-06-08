#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildDashboardRecommendationSnapshot } = require("./snapshot-dashboard-recommendations.js");

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

function byKey(items, keyFn) {
  return new Map(asArray(items).map(item => [keyFn(item), item]).filter(([key]) => key));
}

function sortedUnion(a, b) {
  return [...new Set([...a, ...b].filter(Boolean))].sort();
}

function readSnapshot(file) {
  if (!file || file === "current") return buildDashboardRecommendationSnapshot();
  return JSON.parse(fs.readFileSync(path.resolve(repoRoot, file), "utf8"));
}

function change(diff, severity, scope, message, details = {}) {
  const entry = { severity, scope, message, details };
  diff.changes.push(entry);
  if (severity === "regression") diff.regressions.push(entry);
  if (severity === "improvement") diff.improvements.push(entry);
}

function signature(values) {
  return asArray(values).filter(value => value !== undefined && value !== null && String(value).trim()).join(" | ");
}

function compareField(diff, severity, scope, label, before, after) {
  const left = before === undefined || before === null ? "" : before;
  const right = after === undefined || after === null ? "" : after;
  if (left === right) return;
  change(diff, severity, scope, `${label} changed ${JSON.stringify(left)} -> ${JSON.stringify(right)}`, { before: left, after: right });
}

function compareSet(diff, scope, label, baseValues, headValues, severityWhenRemoved = "regression", severityWhenAdded = "info") {
  const base = asArray(baseValues).filter(Boolean);
  const head = asArray(headValues).filter(Boolean);
  const headSet = new Set(head);
  const baseSet = new Set(base);
  base.filter(id => !headSet.has(id)).forEach(id => change(diff, severityWhenRemoved, scope, `${label} removed: ${id}`));
  head.filter(id => !baseSet.has(id)).forEach(id => change(diff, severityWhenAdded, scope, `${label} added: ${id}`));
}

function decisionScope(scenarioId, trainerId) {
  return `${scenarioId}.decision.${trainerId || "unknown"}`;
}

function compactDecisionFields(decision) {
  decision = decision || {};
  return {
    kind: decision.kind || "",
    trainerId: decision.trainerId || "",
    signalTag: decision.signalTag || "",
    score: Number(decision.score || 0),
    title: decision.title || "",
    primaryHref: decision.primaryHref || "",
    traceRule: decision.traceRule || decision.trace && decision.trace.rule || "",
    traceFingerprint: decision.traceFingerprint || decision.trace && decision.trace.fingerprint || ""
  };
}

function compareDecision(diff, scenarioId, trainerId, before, after) {
  const scope = decisionScope(scenarioId, trainerId);
  const left = compactDecisionFields(before);
  const right = compactDecisionFields(after);
  const kindSeverity = left.kind === "repair" && right.kind !== "repair" ? "regression" : "review";
  compareField(diff, kindSeverity, scope, "kind", left.kind, right.kind);
  compareField(diff, "review", scope, "signalTag", left.signalTag, right.signalTag);
  compareField(diff, "review", scope, "score", left.score, right.score);
  compareField(diff, "review", scope, "title", left.title, right.title);
  compareField(diff, "review", scope, "primaryHref", left.primaryHref, right.primaryHref);
  compareField(diff, "review", scope, "trace rule", left.traceRule, right.traceRule);
  compareField(diff, "review", scope, "trace fingerprint", left.traceFingerprint, right.traceFingerprint);
}

function compareCandidates(diff, scenarioId, before, after) {
  compareField(
    diff,
    "review",
    scenarioId,
    "candidate order",
    signature(before.candidateOrder),
    signature(after.candidateOrder)
  );
  const base = byKey(before.candidates, item => item.trainerId);
  const head = byKey(after.candidates, item => item.trainerId);
  sortedUnion([...base.keys()], [...head.keys()]).forEach(id => {
    const left = base.get(id);
    const right = head.get(id);
    if (left && !right) {
      change(diff, "regression", scenarioId, `Candidate removed: ${id}`);
      return;
    }
    if (!left && right) {
      change(diff, "info", scenarioId, `Candidate added: ${id}`);
      return;
    }
    compareField(diff, "review", `${scenarioId}.candidate.${id}`, "total attempts", left.total, right.total);
    compareField(diff, "review", `${scenarioId}.candidate.${id}`, "accuracy", left.accuracy, right.accuracy);
    compareSet(diff, `${scenarioId}.candidate.${id}`, "weak mastery", left.weakMastery, right.weakMastery, "regression", "info");
    compareDecision(diff, scenarioId, id, left.decision, right.decision);
  });
}

function compareDue(diff, scenarioId, baseDue, headDue) {
  const baseOrder = asArray(baseDue).map(item => `${item.trainerId}:${item.decision && item.decision.kind || ""}:${item.decision && item.decision.signalTag || ""}`);
  const headOrder = asArray(headDue).map(item => `${item.trainerId}:${item.decision && item.decision.kind || ""}:${item.decision && item.decision.signalTag || ""}`);
  compareField(diff, "review", scenarioId, "due order", signature(baseOrder), signature(headOrder));

  const max = Math.max(asArray(baseDue).length, asArray(headDue).length);
  for (let i = 0; i < max; i++) {
    const left = baseDue[i];
    const right = headDue[i];
    const scope = `${scenarioId}.due[${i + 1}]`;
    if (left && !right) {
      change(diff, "regression", scope, `Due card removed: ${left.trainerId}`);
      continue;
    }
    if (!left && right) {
      change(diff, "info", scope, `Due card added: ${right.trainerId}`);
      continue;
    }
    compareField(diff, "review", scope, "trainerId", left.trainerId, right.trainerId);
    compareDecision(diff, scenarioId, `${i + 1}:${left.trainerId}`, left.decision, right.decision);
  }
}

function comparePlan(diff, scenarioId, before, after) {
  const scope = `${scenarioId}.practicePlan`;
  before = before || {};
  after = after || {};
  compareField(diff, "review", scope, "kind", before.kind, after.kind);
  compareField(diff, "review", scope, "title", before.title, after.title);
  compareField(diff, "review", scope, "fingerprint", before.fingerprint, after.fingerprint);
  compareField(diff, "review", scope, "plan token", before.planToken, after.planToken);
  compareField(diff, "review", scope, "primary step route", before.primaryStepRouteId, after.primaryStepRouteId);
  compareField(diff, "review", scope, "meta", before.meta, after.meta);

  const baseSteps = byKey(before.steps, item => String(item.number || item.routeId || ""));
  const headSteps = byKey(after.steps, item => String(item.number || item.routeId || ""));
  sortedUnion([...baseSteps.keys()], [...headSteps.keys()]).forEach(key => {
    const left = baseSteps.get(key);
    const right = headSteps.get(key);
    const stepScope = `${scope}.step.${key}`;
    if (left && !right) {
      change(diff, "regression", stepScope, `Plan step removed: ${left.title || key}`);
      return;
    }
    if (!left && right) {
      change(diff, "info", stepScope, `Plan step added: ${right.title || key}`);
      return;
    }
    compareField(diff, "review", stepScope, "routeId", left.routeId, right.routeId);
    compareField(diff, left.kind === "repair" && right.kind !== "repair" ? "regression" : "review", stepScope, "kind", left.kind, right.kind);
    compareField(diff, "review", stepScope, "trainerId", left.trainerId, right.trainerId);
    compareField(diff, "review", stepScope, "signalTag", left.signalTag, right.signalTag);
    compareField(diff, "review", stepScope, "title", left.title, right.title);
    compareField(diff, "review", stepScope, "primaryHref", left.primaryHref, right.primaryHref);
    compareField(diff, "review", stepScope, "routedHref", left.routedHref, right.routedHref);
    compareField(diff, "review", stepScope, "score", left.score, right.score);
    compareField(diff, "review", stepScope, "status", left.status, right.status);
    compareField(diff, "review", stepScope, "competency", left.competency && left.competency.id || "", right.competency && right.competency.id || "");
    compareField(diff, "review", stepScope, "explanation", left.explanation && left.explanation.copy || "", right.explanation && right.explanation.copy || "");
    compareDecision(diff, scenarioId, `plan-step-${key}`, { ...left, traceRule: left.trace && left.trace.rule, traceFingerprint: left.trace && left.trace.fingerprint }, { ...right, traceRule: right.trace && right.trace.rule, traceFingerprint: right.trace && right.trace.fingerprint });
  });
}

function ledgerKey(entry) {
  return [entry.kind, entry.title, entry.trainerId].join("::");
}

function compareLedger(diff, scenarioId, before, after) {
  const base = byKey(before, ledgerKey);
  const head = byKey(after, ledgerKey);
  sortedUnion([...base.keys()], [...head.keys()]).forEach(key => {
    const left = base.get(key);
    const right = head.get(key);
    const scope = `${scenarioId}.ledger`;
    if (left && !right) {
      change(diff, left.kind === "open" ? "regression" : "review", scope, `Ledger row removed: ${key}`);
      return;
    }
    if (!left && right) {
      change(diff, "info", scope, `Ledger row added: ${key}`);
      return;
    }
    compareField(diff, "review", `${scope}.${key}`, "status", left.status, right.status);
    compareField(diff, "review", `${scope}.${key}`, "score", left.score, right.score);
    compareField(diff, "review", `${scope}.${key}`, "facts", signature(left.facts), signature(right.facts));
  });
}

function compareCompetencies(diff, scenarioId, before, after) {
  const base = byKey(before, item => item.id);
  const head = byKey(after, item => item.id);
  sortedUnion([...base.keys()], [...head.keys()]).forEach(id => {
    const left = base.get(id);
    const right = head.get(id);
    const scope = `${scenarioId}.competency.${id}`;
    if (left && !right) {
      change(diff, "regression", scope, `Root competency removed: ${id}`);
      return;
    }
    if (!left && right) {
      change(diff, "info", scope, `Root competency added: ${id}`);
      return;
    }
    compareField(diff, "review", scope, "score", left.score, right.score);
    compareField(diff, "review", scope, "signalCount", left.signalCount, right.signalCount);
    compareField(diff, "review", scope, "primarySignal", left.primarySignal, right.primarySignal);
    compareField(diff, "review", scope, "signals", signature(asArray(left.signals).map(signal => signal.tag)), signature(asArray(right.signals).map(signal => signal.tag)));
  });
}

function compareScenario(diff, before, after) {
  const scenarioId = before.id || after.id;
  compareCandidates(diff, scenarioId, before, after);
  compareDue(diff, scenarioId, before.due, after.due);
  comparePlan(diff, scenarioId, before.practicePlan, after.practicePlan);
  compareLedger(diff, scenarioId, before.evidenceLedger, after.evidenceLedger);
  compareCompetencies(diff, scenarioId, before.weakCompetencies, after.weakCompetencies);
}

function compareDashboardSnapshots(base, head) {
  const diff = {
    schemaVersion: 1,
    status: "unchanged",
    base: {
      fixedNow: base.fixedNow || "",
      scenarios: asArray(base.scenarios).map(item => item.id)
    },
    head: {
      fixedNow: head.fixedNow || "",
      scenarios: asArray(head.scenarios).map(item => item.id)
    },
    changes: [],
    regressions: [],
    improvements: []
  };

  compareField(diff, "review", "snapshot", "fixedNow", base.fixedNow || "", head.fixedNow || "");
  const baseScenarios = byKey(base.scenarios, item => item.id);
  const headScenarios = byKey(head.scenarios, item => item.id);
  sortedUnion([...baseScenarios.keys()], [...headScenarios.keys()]).forEach(id => {
    const before = baseScenarios.get(id);
    const after = headScenarios.get(id);
    if (before && !after) {
      change(diff, "regression", "snapshot", `Scenario removed: ${id}`);
      return;
    }
    if (!before && after) {
      change(diff, "info", "snapshot", `Scenario added: ${id}`);
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

function formatDashboardSnapshotDiff(diff) {
  const review = diff.changes.filter(entry => entry.severity === "review");
  const info = diff.changes.filter(entry => entry.severity === "info");
  return [
    `Dashboard snapshot diff: ${diff.status}`,
    `Base scenarios: ${diff.base.scenarios.join(", ") || "none"}`,
    `Head scenarios: ${diff.head.scenarios.join(", ") || "none"}`,
    ...formatSection("Regressions", diff.regressions),
    ...formatSection("Review changes", review),
    ...formatSection("Other changes", info)
  ].join("\n");
}

function main() {
  const basePath = argValue("--base");
  const headPath = argValue("--head") || "current";
  if (!basePath) {
    console.error("usage: node scripts/diff-dashboard-snapshot.js --base <snapshot.json> [--head <snapshot.json|current>] [--json] [--fail-on-change] [--fail-on-regression]");
    process.exit(2);
  }
  const diff = compareDashboardSnapshots(readSnapshot(basePath), readSnapshot(headPath));
  if (hasFlag("--json")) console.log(JSON.stringify(diff, null, 2));
  else console.log(formatDashboardSnapshotDiff(diff));
  if (hasFlag("--fail-on-regression") && diff.regressions.length) process.exit(1);
  if (hasFlag("--fail-on-change") && diff.changes.length) process.exit(1);
}

if (require.main === module) main();

module.exports = {
  compareDashboardSnapshots,
  formatDashboardSnapshotDiff,
  readSnapshot
};

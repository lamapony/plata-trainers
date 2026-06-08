#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildDemoLearnerReport } = require("./build-demo-learner-report.js");

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
  if (!file || file === "current") return buildDemoLearnerReport();
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

function compareNumber(diff, scope, label, before, after, direction = "review") {
  before = Number(before || 0);
  after = Number(after || 0);
  if (before === after) return;
  let severity = "review";
  if (direction === "decrease-regression" && after < before) severity = "regression";
  if (direction === "increase-regression" && after > before) severity = "regression";
  if (direction === "decrease-improvement" && after < before) severity = "improvement";
  change(diff, severity, scope, `${label} changed ${before} -> ${after}`, { before, after });
}

function compareBoolean(diff, scope, label, before, after) {
  if (!!before === !!after) return;
  const severity = before && !after ? "regression" : "improvement";
  change(diff, severity, scope, `${label} changed ${before ? "present" : "missing"} -> ${after ? "present" : "missing"}`, { before: !!before, after: !!after });
}

function statusSeverity(before, after) {
  if (before === "pass" && after !== "pass") return "regression";
  if (before !== "pass" && after === "pass") return "improvement";
  return "review";
}

function compareSet(diff, scope, label, baseValues, headValues, removedSeverity = "regression", addedSeverity = "info") {
  const base = asArray(baseValues).filter(Boolean);
  const head = asArray(headValues).filter(Boolean);
  const baseSet = new Set(base);
  const headSet = new Set(head);
  base.filter(value => !headSet.has(value)).forEach(value => change(diff, removedSeverity, scope, `${label} removed: ${value}`));
  head.filter(value => !baseSet.has(value)).forEach(value => change(diff, addedSeverity, scope, `${label} added: ${value}`));
}

function guaranteeKey(guarantee) {
  return guarantee && guarantee.key || "";
}

function factKey(fact) {
  fact = fact || {};
  return [fact.kind || "", fact.signal || "", fact.sourceFingerprint || fact.id || ""].join(":");
}

function compactFact(fact) {
  fact = fact || {};
  return {
    id: fact.id || "",
    kind: fact.kind || "",
    signal: fact.signal || "",
    sourceFingerprint: fact.sourceFingerprint || "",
    confidence: Number(fact.confidence || 0)
  };
}

function compareGuarantees(diff, base, head) {
  const baseRows = byKey(base.guarantees, guaranteeKey);
  const headRows = byKey(head.guarantees, guaranteeKey);
  sortedUnion([...baseRows.keys()], [...headRows.keys()]).forEach(key => {
    const before = baseRows.get(key);
    const after = headRows.get(key);
    const scope = `demo.guarantee.${key || "unknown"}`;
    if (before && !after) {
      change(diff, "regression", scope, `Guarantee removed: ${key}`);
      return;
    }
    if (!before && after) {
      change(diff, after.pass ? "info" : "regression", scope, `Guarantee added: ${key}`);
      return;
    }
    compareBoolean(diff, scope, "guarantee pass", before.pass, after.pass);
    compareField(diff, "review", scope, "label", before.label, after.label);
  });
}

function compareProfile(diff, base, head) {
  const baseProfile = base.profile || {};
  const headProfile = head.profile || {};
  compareNumber(diff, "demo.profile", "attempts", baseProfile.totalAttempts, headProfile.totalAttempts, "decrease-regression");
  compareNumber(diff, "demo.profile", "correct", baseProfile.totalCorrect, headProfile.totalCorrect, "review");
  compareNumber(diff, "demo.profile", "accuracy", baseProfile.accuracy, headProfile.accuracy, "review");

  const baseRows = byKey(baseProfile.trainerRows, row => row.trainerId);
  const headRows = byKey(headProfile.trainerRows, row => row.trainerId);
  sortedUnion([...baseRows.keys()], [...headRows.keys()]).forEach(id => {
    const before = baseRows.get(id);
    const after = headRows.get(id);
    const scope = `demo.profile.${id}`;
    if (before && !after) {
      change(diff, Number(before.totalAttempts || 0) ? "regression" : "review", scope, `Trainer row removed: ${id}`);
      return;
    }
    if (!before && after) {
      change(diff, "info", scope, `Trainer row added: ${id}`);
      return;
    }
    compareNumber(diff, scope, "trainer attempts", before.totalAttempts, after.totalAttempts, "decrease-regression");
    compareNumber(diff, scope, "trainer correct", before.totalCorrect, after.totalCorrect, "review");
    compareSet(diff, scope, "item", before.itemIds, after.itemIds, "review", "info");
  });
}

function comparePlan(diff, base, head) {
  const before = base.plan || {};
  const after = head.plan || {};
  const kindSeverity = before.kind === "repair" && after.kind !== "repair" ? "regression" : "review";
  compareField(diff, kindSeverity, "demo.plan", "kind", before.kind, after.kind);
  compareField(diff, "review", "demo.plan", "title", before.title, after.title);
  compareNumber(diff, "demo.plan", "step count", before.stepCount || asArray(before.steps).length, after.stepCount || asArray(after.steps).length, "decrease-regression");
  compareNumber(diff, "demo.plan", "open count", before.openCount, after.openCount, "review");

  const baseSteps = byKey(before.steps, step => String(step.number || step.routeId || ""));
  const headSteps = byKey(after.steps, step => String(step.number || step.routeId || ""));
  sortedUnion([...baseSteps.keys()], [...headSteps.keys()]).forEach(key => {
    const left = baseSteps.get(key);
    const right = headSteps.get(key);
    const scope = `demo.plan.step.${key}`;
    if (left && !right) {
      change(diff, left.kind === "repair" ? "regression" : "review", scope, `Plan step removed: ${left.title || key}`);
      return;
    }
    if (!left && right) {
      change(diff, "info", scope, `Plan step added: ${right.title || key}`);
      return;
    }
    compareField(diff, left.kind === "repair" && right.kind !== "repair" ? "regression" : "review", scope, "kind", left.kind, right.kind);
    compareField(diff, "review", scope, "status", left.status, right.status);
    compareField(diff, "review", scope, "trainerId", left.trainerId, right.trainerId);
    compareField(diff, "review", scope, "signalTag", left.signalTag, right.signalTag);
    compareField(diff, "review", scope, "title", left.title, right.title);
    compareField(diff, "review", scope, "primaryHref", left.primaryHref, right.primaryHref);
    compareSet(diff, scope, "selected memory fact", asArray(left.selectedMemoryFacts).map(factKey), asArray(right.selectedMemoryFacts).map(factKey), "regression", "info");
  });
}

function compareMemory(diff, base, head) {
  const before = base.memory || {};
  const after = head.memory || {};
  compareField(diff, "review", "demo.memory", "fingerprint", before.fingerprint, after.fingerprint);
  compareSet(diff, "demo.memory", "fact kind", before.factKinds, after.factKinds, "regression", "info");
  compareSet(diff, "demo.memory", "fact signal", before.factSignals, after.factSignals, "regression", "info");
  compareNumber(diff, "demo.memory", "visible facts", asArray(before.visibleFacts).length, asArray(after.visibleFacts).length, "decrease-regression");

  const baseFacts = byKey(before.visibleFacts, factKey);
  const headFacts = byKey(after.visibleFacts, factKey);
  sortedUnion([...baseFacts.keys()], [...headFacts.keys()]).forEach(key => {
    const left = baseFacts.get(key);
    const right = headFacts.get(key);
    const scope = `demo.memory.${key}`;
    if (left && !right) {
      const protectedKind = ["root_competency_trap", "recurring_trap", "weak_signal", "next_review_due"].includes(left.kind);
      change(diff, protectedKind ? "regression" : "review", scope, `Memory fact removed: ${key}`);
      return;
    }
    if (!left && right) {
      change(diff, "info", scope, `Memory fact added: ${key}`);
      return;
    }
    const compactLeft = compactFact(left);
    const compactRight = compactFact(right);
    compareNumber(diff, scope, "confidence", Math.round(compactLeft.confidence * 100), Math.round(compactRight.confidence * 100), "review");
    compareField(diff, "review", scope, "id", compactLeft.id, compactRight.id);
  });
}

function compareCompanion(diff, base, head) {
  const before = base.companion || null;
  const after = head.companion || null;
  if (before && !after) {
    change(diff, "regression", "demo.companion", "Companion receipt removed");
    return;
  }
  if (!before && after) {
    change(diff, "info", "demo.companion", "Companion receipt added");
    return;
  }
  if (!before || !after) return;
  compareField(diff, "review", "demo.companion", "kind", before.kind, after.kind);
  compareField(diff, "review", "demo.companion", "fingerprint", before.fingerprint, after.fingerprint);
  compareField(diff, "review", "demo.companion", "confidence", before.confidence, after.confidence);
  compareSet(diff, "demo.companion", "cited fact", asArray(before.citedFacts).map(factKey), asArray(after.citedFacts).map(factKey), "regression", "info");
}

function compareRendered(diff, base, head) {
  const before = base.rendered || {};
  const after = head.rendered || {};
  compareBoolean(diff, "demo.rendered", "import disabled", before.importDisabled, after.importDisabled);
  compareField(diff, "review", "demo.rendered", "export label", before.exportLabel, after.exportLabel);
  compareField(diff, before.today && !after.today ? "regression" : "review", "demo.rendered", "Today sample", before.today, after.today);
}

function compareIssues(diff, base, head) {
  const baseIssues = asArray(base.issues);
  const headIssues = asArray(head.issues);
  headIssues.filter(issue => !baseIssues.includes(issue)).forEach(issue => change(diff, "regression", "demo.report", `Issue added: ${issue}`));
  baseIssues.filter(issue => !headIssues.includes(issue)).forEach(issue => change(diff, "improvement", "demo.report", `Issue removed: ${issue}`));
}

function compareDemoLearnerReports(base, head) {
  const diff = {
    schemaVersion: 1,
    status: "unchanged",
    base: {
      status: base.status || "",
      url: base.url || "",
      factKinds: asArray(base.memory && base.memory.factKinds),
      factSignals: asArray(base.memory && base.memory.factSignals)
    },
    head: {
      status: head.status || "",
      url: head.url || "",
      factKinds: asArray(head.memory && head.memory.factKinds),
      factSignals: asArray(head.memory && head.memory.factSignals)
    },
    changes: [],
    regressions: [],
    improvements: []
  };

  compareField(diff, statusSeverity(base.status, head.status), "demo.report", "status", base.status, head.status);
  compareField(diff, "review", "demo.report", "url", base.url, head.url);
  compareNumber(diff, "demo.report", "storage writes", base.totals && base.totals.storageWrites, head.totals && head.totals.storageWrites, "increase-regression");
  compareGuarantees(diff, base, head);
  compareProfile(diff, base, head);
  comparePlan(diff, base, head);
  compareMemory(diff, base, head);
  compareCompanion(diff, base, head);
  compareRendered(diff, base, head);
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

function formatDemoLearnerDiff(diff) {
  const review = diff.changes.filter(entry => entry.severity === "review");
  const info = diff.changes.filter(entry => entry.severity === "info");
  return [
    `Demo learner diff: ${diff.status}`,
    `Base facts: ${diff.base.factKinds.join(", ") || "none"}`,
    `Head facts: ${diff.head.factKinds.join(", ") || "none"}`,
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
    console.error("usage: node scripts/diff-demo-learner-report.js --base <report.json> [--head <report.json|current>] [--json] [--fail-on-change] [--fail-on-regression]");
    process.exit(2);
  }
  const diff = compareDemoLearnerReports(readReport(basePath), readReport(headPath));
  if (hasFlag("--json")) console.log(JSON.stringify(diff, null, 2));
  else console.log(formatDemoLearnerDiff(diff));
  if (hasFlag("--fail-on-regression") && diff.regressions.length) process.exit(1);
  if (hasFlag("--fail-on-change") && diff.changes.length) process.exit(1);
}

if (require.main === module) main();

module.exports = {
  compareDemoLearnerReports,
  formatDemoLearnerDiff,
  readReport
};

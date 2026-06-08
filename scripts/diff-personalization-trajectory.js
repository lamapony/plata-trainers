#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  evaluatePersonalizationTrajectories
} = require("./smoke-personalization-trajectory.js");

const repoRoot = path.resolve(__dirname, "..");
const protectedKinds = new Set([
  "root_competency_trap",
  "recurring_trap",
  "weak_signal",
  "next_review_due",
  "repaired_signal"
]);
const protectedRules = new Set([
  "learner-model.focus.root-competency",
  "learner-model.focus.recurring-trap",
  "learner-model.focus.review",
  "learner-model.focus.maintenance",
  "dashboard.repair.highest-open-mastery",
  "dashboard.review.memory-due",
  "advisor.repair.root-competency",
  "advisor.repair.memory-backed",
  "advisor.review.memory-due",
  "advisor.maintain.repaired-signal"
]);

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

function byStage(items) {
  return new Map(asArray(items).map(item => [`${item.trajectoryId}/${item.stageId}`, item]).filter(([key]) => key !== "/"));
}

function sortedUnion(a, b) {
  return [...new Set([...a, ...b].filter(Boolean))].sort();
}

function signature(values) {
  return asArray(values).filter(value => value !== undefined && value !== null && String(value).trim()).join(" | ");
}

function readTrajectoryReport(file) {
  if (!file || file === "current") return evaluatePersonalizationTrajectories();
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

function compareSet(diff, scope, label, baseValues, headValues, options = {}) {
  const base = asArray(baseValues).filter(Boolean);
  const head = asArray(headValues).filter(Boolean);
  const baseSet = new Set(base);
  const headSet = new Set(head);
  base.filter(value => !headSet.has(value)).forEach(value => {
    const severity = options.regressionWhenRemoved && options.regressionWhenRemoved(value) ? "regression" : options.removedSeverity || "review";
    change(diff, severity, scope, `${label} removed: ${value}`);
  });
  head.filter(value => !baseSet.has(value)).forEach(value => {
    change(diff, options.addedSeverity || "info", scope, `${label} added: ${value}`);
  });
}

function ruleSeverity(before, after) {
  if (!before || before === after) return "review";
  if (protectedRules.has(before) && !protectedRules.has(after)) return "regression";
  if (before.includes("root-competency") && !String(after || "").includes("root-competency")) return "regression";
  if (before.includes("recurring-trap") && !String(after || "").includes("recurring-trap")) return "regression";
  if (before.includes("review") && !String(after || "").includes("review")) return "regression";
  if (before.includes("memory-due") && !String(after || "").includes("memory-due")) return "regression";
  return "review";
}

function kindSeverity(before, after) {
  if (!before || before === after) return "review";
  if ((before === "repair" || before === "review" || before === "maintain") && after === "inspect") return "regression";
  if (before === "repair" && after !== "repair") return "regression";
  if (before === "review" && after !== "review") return "regression";
  return "review";
}

function compareStage(diff, before, after) {
  const scope = `${before.trajectoryId || after.trajectoryId}/${before.stageId || after.stageId}`;
  compareField(diff, "review", scope, "event count", before.eventCount, after.eventCount);
  compareField(diff, "review", scope, "memory fingerprint", before.memoryFingerprint, after.memoryFingerprint);
  compareSet(diff, scope, "memory kind", before.memoryKinds, after.memoryKinds, {
    regressionWhenRemoved: value => protectedKinds.has(value),
    addedSeverity: "info"
  });
  compareField(diff, kindSeverity(before.modelKind, after.modelKind), scope, "model kind", before.modelKind, after.modelKind);
  compareField(diff, ruleSeverity(before.modelRule, after.modelRule), scope, "model rule", before.modelRule, after.modelRule);
  compareSet(diff, scope, "model focus kind", before.modelFocusKinds, after.modelFocusKinds, {
    regressionWhenRemoved: value => protectedKinds.has(value),
    addedSeverity: "info"
  });
  compareSet(diff, scope, "model focus fact", before.modelFocusFactIds, after.modelFocusFactIds, {
    removedSeverity: "review",
    addedSeverity: "review"
  });
  compareField(diff, kindSeverity(before.plannerKind, after.plannerKind), scope, "planner kind", before.plannerKind, after.plannerKind);
  compareField(diff, ruleSeverity(before.plannerRule, after.plannerRule), scope, "planner rule", before.plannerRule, after.plannerRule);
  compareSet(diff, scope, "planner selected kind", before.plannerSelectedKinds, after.plannerSelectedKinds, {
    regressionWhenRemoved: value => protectedKinds.has(value),
    addedSeverity: "info"
  });
  compareSet(diff, scope, "planner selected fact", before.plannerSelectedFactIds, after.plannerSelectedFactIds, {
    removedSeverity: "review",
    addedSeverity: "review"
  });
  compareField(diff, kindSeverity(before.advisorKind, after.advisorKind), scope, "advisor kind", before.advisorKind, after.advisorKind);
  compareField(diff, ruleSeverity(before.advisorRule, after.advisorRule), scope, "advisor rule", before.advisorRule, after.advisorRule);
  compareSet(diff, scope, "advisor cited kind", before.advisorCitedKinds, after.advisorCitedKinds, {
    regressionWhenRemoved: value => protectedKinds.has(value),
    addedSeverity: "info"
  });
  compareSet(diff, scope, "advisor cited fact", before.advisorCitedFactIds, after.advisorCitedFactIds, {
    removedSeverity: "review",
    addedSeverity: "review"
  });
  compareSet(diff, scope, "root competency", before.rootCompetencies, after.rootCompetencies, {
    removedSeverity: "regression",
    addedSeverity: "info"
  });
}

function comparePersonalizationTrajectoryReports(base, head) {
  const diff = {
    schemaVersion: 1,
    status: "unchanged",
    base: {
      status: base.status || "",
      trajectoryCount: Number(base.trajectoryCount || 0),
      stageCount: Number(base.stageCount || 0),
      stages: asArray(base.stages).map(stage => `${stage.trajectoryId}/${stage.stageId}`)
    },
    head: {
      status: head.status || "",
      trajectoryCount: Number(head.trajectoryCount || 0),
      stageCount: Number(head.stageCount || 0),
      stages: asArray(head.stages).map(stage => `${stage.trajectoryId}/${stage.stageId}`)
    },
    changes: [],
    regressions: [],
    improvements: []
  };

  if (base.status !== head.status) {
    change(diff, base.status === "pass" && head.status !== "pass" ? "regression" : "improvement", "trajectory", `status changed ${base.status || "unknown"} -> ${head.status || "unknown"}`);
  }
  compareField(diff, "review", "trajectory", "trajectory count", diff.base.trajectoryCount, diff.head.trajectoryCount);
  compareField(diff, "review", "trajectory", "stage count", diff.base.stageCount, diff.head.stageCount);

  const baseStages = byStage(base.stages);
  const headStages = byStage(head.stages);
  sortedUnion([...baseStages.keys()], [...headStages.keys()]).forEach(key => {
    const before = baseStages.get(key);
    const after = headStages.get(key);
    if (before && !after) {
      change(diff, "regression", key, `Trajectory stage removed: ${key}`);
      return;
    }
    if (!before && after) {
      change(diff, "info", key, `Trajectory stage added: ${key}`);
      return;
    }
    compareStage(diff, before, after);
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

function formatPersonalizationTrajectoryDiff(diff) {
  const review = diff.changes.filter(entry => entry.severity === "review");
  const info = diff.changes.filter(entry => entry.severity === "info");
  return [
    `Personalization trajectory diff: ${diff.status}`,
    `Base: ${diff.base.trajectoryCount} trajector${diff.base.trajectoryCount === 1 ? "y" : "ies"}, ${diff.base.stageCount} stage(s)`,
    `Head: ${diff.head.trajectoryCount} trajector${diff.head.trajectoryCount === 1 ? "y" : "ies"}, ${diff.head.stageCount} stage(s)`,
    ...formatSection("Regressions", diff.regressions),
    ...formatSection("Review changes", review),
    ...formatSection("Other changes", info)
  ].join("\n");
}

function main() {
  const basePath = argValue("--base");
  const headPath = argValue("--head") || "current";
  if (!basePath) {
    console.error("usage: node scripts/diff-personalization-trajectory.js --base <trajectory.json> [--head <trajectory.json|current>] [--json] [--fail-on-change] [--fail-on-regression]");
    process.exit(2);
  }
  const diff = comparePersonalizationTrajectoryReports(readTrajectoryReport(basePath), readTrajectoryReport(headPath));
  if (hasFlag("--json")) console.log(JSON.stringify(diff, null, 2));
  else console.log(formatPersonalizationTrajectoryDiff(diff));
  if (hasFlag("--fail-on-regression") && diff.regressions.length) process.exit(1);
  if (hasFlag("--fail-on-change") && diff.changes.length) process.exit(1);
}

if (require.main === module) main();

module.exports = {
  comparePersonalizationTrajectoryReports,
  formatPersonalizationTrajectoryDiff,
  readTrajectoryReport
};

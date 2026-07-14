#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildQualityReport } = require("./build-quality-report.js");

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

function byKey(items, key) {
  return new Map(asArray(items).map(item => [item[key], item]));
}

function sortedUnion(a, b) {
  return [...new Set([...a, ...b].filter(Boolean))].sort();
}

function readReport(file) {
  if (!file || file === "current") return buildQualityReport();
  return JSON.parse(fs.readFileSync(path.resolve(repoRoot, file), "utf8"));
}

function change(diff, severity, scope, message, details = {}) {
  const entry = { severity, scope, message, details };
  diff.changes.push(entry);
  if (severity === "regression") diff.regressions.push(entry);
  if (severity === "improvement") diff.improvements.push(entry);
}

function numericDeltas(base, head) {
  const out = {};
  sortedUnion(Object.keys(base || {}), Object.keys(head || {})).forEach(key => {
    const before = Number(base && base[key] || 0);
    const after = Number(head && head[key] || 0);
    const delta = after - before;
    if (delta) out[key] = { before, after, delta };
  });
  return out;
}

function compareIdSet(diff, scope, label, baseItems, headItems, severityWhenRemoved = "info", severityWhenAdded = "info") {
  const baseIds = asArray(baseItems).map(item => item.id || item.key).filter(Boolean);
  const headIds = asArray(headItems).map(item => item.id || item.key).filter(Boolean);
  const baseSet = new Set(baseIds);
  const headSet = new Set(headIds);
  baseIds.filter(id => !headSet.has(id)).forEach(id => {
    change(diff, severityWhenRemoved, scope, `${label} removed: ${id}`);
  });
  headIds.filter(id => !baseSet.has(id)).forEach(id => {
    change(diff, severityWhenAdded, scope, `${label} added: ${id}`);
  });
}

function compareReplaceableReferences(diff, scope, label, baseValues, headValues) {
  const base = asArray(baseValues).filter(Boolean);
  const head = asArray(headValues).filter(Boolean);
  const baseSet = new Set(base);
  const headSet = new Set(head);
  const removed = base.filter(value => !headSet.has(value)).sort();
  const added = head.filter(value => !baseSet.has(value)).sort();
  const replacements = Math.min(removed.length, added.length);

  for (let index = 0; index < replacements; index++) {
    change(
      diff,
      "review",
      scope,
      `${label} changed ${JSON.stringify(removed[index])} -> ${JSON.stringify(added[index])}`,
      { before: removed[index], after: added[index] }
    );
  }
  removed.slice(replacements).forEach(value => {
    change(diff, "regression", scope, `${label} removed: ${value}`);
  });
  added.slice(replacements).forEach(value => {
    change(diff, "info", scope, `${label} added: ${value}`);
  });
}

function compareIssues(diff, lessonId, baseIssues, headIssues) {
  const baseSet = new Set(asArray(baseIssues));
  const headSet = new Set(asArray(headIssues));
  asArray(headIssues).filter(issue => !baseSet.has(issue)).forEach(issue => {
    change(diff, "regression", lessonId, `Issue added: ${issue}`);
  });
  asArray(baseIssues).filter(issue => !headSet.has(issue)).forEach(issue => {
    change(diff, "improvement", lessonId, `Issue removed: ${issue}`);
  });
}

function compareGuarantees(diff, lessonId, baseGuarantees, headGuarantees) {
  const baseByKey = byKey(baseGuarantees, "key");
  const headByKey = byKey(headGuarantees, "key");
  sortedUnion([...baseByKey.keys()], [...headByKey.keys()]).forEach(key => {
    const before = baseByKey.get(key);
    const after = headByKey.get(key);
    if (before && !after) {
      change(diff, before.pass ? "regression" : "info", lessonId, `Guarantee removed: ${key}`);
      return;
    }
    if (!before && after) {
      change(diff, after.pass ? "improvement" : "regression", lessonId, `Guarantee added: ${key}`);
      return;
    }
    if (before.pass !== after.pass) {
      change(diff, after.pass ? "improvement" : "regression", lessonId, `Guarantee ${key} changed ${before.pass ? "pass" : "fail"} -> ${after.pass ? "pass" : "fail"}`);
    }
  });
}

function compareSceneChecks(diff, lessonId, baseRow, headRow) {
  const baseChecks = byKey(baseRow.checks, "key");
  const headChecks = byKey(headRow.checks, "key");
  sortedUnion([...baseChecks.keys()], [...headChecks.keys()]).forEach(key => {
    const before = baseChecks.get(key);
    const after = headChecks.get(key);
    if (before && !after) {
      change(diff, before.pass ? "regression" : "info", lessonId, `Scene ${baseRow.id} check removed: ${key}`);
      return;
    }
    if (!before && after) {
      change(diff, after.pass ? "info" : "regression", lessonId, `Scene ${baseRow.id} check added: ${key}`);
      return;
    }
    if (before.pass !== after.pass) {
      change(diff, after.pass ? "improvement" : "regression", lessonId, `Scene ${baseRow.id} check ${key} changed ${before.pass ? "pass" : "fail"} -> ${after.pass ? "pass" : "fail"}`);
    }
  });
}

function compareEvidenceRows(diff, lessonId, baseRows, headRows) {
  const baseById = byKey(baseRows, "id");
  const headById = byKey(headRows, "id");
  sortedUnion([...baseById.keys()], [...headById.keys()]).forEach(id => {
    const before = baseById.get(id);
    const after = headById.get(id);
    if (before && !after) {
      change(diff, "regression", lessonId, `Evidence row removed: ${id}`);
      return;
    }
    if (!before && after) {
      change(diff, "info", lessonId, `Evidence row added: ${id}`);
      return;
    }
    compareSceneChecks(diff, lessonId, before, after);
    compareReplaceableReferences(diff, lessonId, `Scene ${id} source`, before.sourceRefs, after.sourceRefs);
    compareIdSet(diff, lessonId, `Scene ${id} mastery`, asArray(before.masteryTags).map(key => ({ key })), asArray(after.masteryTags).map(key => ({ key })), "regression", "info");
    compareIdSet(diff, lessonId, `Scene ${id} simulation path`, asArray(before.simulatedBy).map(key => ({ key })), asArray(after.simulatedBy).map(key => ({ key })), "regression", "info");
  });
}

function compareLesson(diff, before, after) {
  const scope = after.id || before.id;
  if (before.status !== after.status) {
    const severity = before.status === "pass" && after.status === "fail" ? "regression" : "improvement";
    change(diff, severity, scope, `Lesson status changed ${before.status} -> ${after.status}`);
  }
  if (before.qualityTier !== after.qualityTier) {
    const severity = before.qualityTier === "gold" && after.qualityTier !== "gold" ? "regression" : "info";
    change(diff, severity, scope, `Quality tier changed ${before.qualityTier} -> ${after.qualityTier}`);
  }
  compareIssues(diff, scope, before.issues, after.issues);
  compareIdSet(diff, scope, "Mastery signal", before.masterySignals, after.masterySignals, "regression", "info");
  compareIdSet(diff, scope, "Simulation path", before.simulation && before.simulation.paths, after.simulation && after.simulation.paths, "regression", "info");
  compareIdSet(diff, scope, "Comic panel", before.comicStoryboard && before.comicStoryboard.panels, after.comicStoryboard && after.comicStoryboard.panels, "regression", "info");
  compareGuarantees(diff, scope, before.evidenceMatrix && before.evidenceMatrix.guarantees, after.evidenceMatrix && after.evidenceMatrix.guarantees);
  compareEvidenceRows(diff, scope, before.evidenceMatrix && before.evidenceMatrix.sceneRows, after.evidenceMatrix && after.evidenceMatrix.sceneRows);
}

function compareQualityReports(base, head) {
  const diff = {
    schemaVersion: 1,
    status: "unchanged",
    base: { status: base.status, totals: base.totals },
    head: { status: head.status, totals: head.totals },
    totalsDelta: numericDeltas(base.totals, head.totals),
    changes: [],
    regressions: [],
    improvements: []
  };

  if (base.status !== head.status) {
    const severity = base.status === "pass" && head.status === "fail" ? "regression" : "improvement";
    change(diff, severity, "report", `Report status changed ${base.status} -> ${head.status}`);
  }

  const baseLessons = byKey(base.lessons, "id");
  const headLessons = byKey(head.lessons, "id");
  sortedUnion([...baseLessons.keys()], [...headLessons.keys()]).forEach(id => {
    const before = baseLessons.get(id);
    const after = headLessons.get(id);
    if (before && !after) {
      change(diff, before.qualityTier === "gold" ? "regression" : "info", id, `Lesson removed: ${id}`);
      return;
    }
    if (!before && after) {
      change(diff, after.qualityTier === "gold" ? "improvement" : "info", id, `Lesson added: ${id}`);
      return;
    }
    compareLesson(diff, before, after);
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

function formatQualityDiff(diff) {
  const totals = diff.totalsDelta;
  const totalLines = Object.keys(totals).length
    ? Object.keys(totals).sort().map(key => `- ${key}: ${totals[key].before} -> ${totals[key].after} (${totals[key].delta > 0 ? "+" : ""}${totals[key].delta})`)
    : ["- no total changes"];
  const info = diff.changes.filter(entry => entry.severity === "info");
  return [
    `Quality diff: ${diff.status}`,
    `Base: ${diff.base.status}, ${diff.base.totals.goldLessons} gold, ${diff.base.totals.issues} issue(s), ${diff.base.totals.evidenceRows} evidence row(s)`,
    `Head: ${diff.head.status}, ${diff.head.totals.goldLessons} gold, ${diff.head.totals.issues} issue(s), ${diff.head.totals.evidenceRows} evidence row(s)`,
    "Totals:",
    ...totalLines,
    ...formatSection("Regressions", diff.regressions),
    ...formatSection("Improvements", diff.improvements),
    ...formatSection("Other changes", info)
  ].join("\n");
}

function main() {
  const basePath = argValue("--base");
  const headPath = argValue("--head") || "current";
  if (!basePath) {
    console.error("usage: node scripts/diff-quality-report.js --base <report.json> [--head <report.json|current>] [--json] [--fail-on-regression]");
    process.exit(2);
  }
  const diff = compareQualityReports(readReport(basePath), readReport(headPath));
  if (hasFlag("--json")) console.log(JSON.stringify(diff, null, 2));
  else console.log(formatQualityDiff(diff));
  if (hasFlag("--fail-on-regression") && diff.regressions.length) process.exit(1);
}

if (require.main === module) main();

module.exports = {
  compareQualityReports,
  formatQualityDiff,
  readReport
};

#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const surfaces = [
  { id: "quality", label: "Quality", flag: "--quality-diff" },
  { id: "dashboard", label: "Dashboard recommendations", flag: "--dashboard-diff" },
  { id: "demo", label: "Demo learner", flag: "--demo-diff" },
  { id: "today", label: "Today program", flag: "--today-diff" },
  { id: "personalization", label: "Personalization trajectory", flag: "--trajectory-diff" }
];

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

function ensureDir(file) {
  const dir = path.dirname(path.resolve(repoRoot, file));
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(repoRoot, file), "utf8"));
}

function entry(surface, item) {
  return {
    surface: surface.id,
    label: surface.label,
    severity: item.severity || "info",
    scope: item.scope || "",
    message: item.message || "",
    details: item.details || {}
  };
}

function summarize(surface, diff) {
  const changes = asArray(diff.changes);
  const regressions = asArray(diff.regressions);
  const improvements = asArray(diff.improvements);
  return {
    id: surface.id,
    label: surface.label,
    status: diff.status || "unknown",
    summary: {
      changes: diff.summary && Number(diff.summary.changes || 0) || changes.length,
      regressions: diff.summary && Number(diff.summary.regressions || 0) || regressions.length,
      improvements: diff.summary && Number(diff.summary.improvements || 0) || improvements.length
    },
    regressions: regressions.map(item => entry(surface, item)),
    improvements: improvements.map(item => entry(surface, item)),
    reviewChanges: changes.filter(item => item.severity === "review").map(item => entry(surface, item)),
    infoChanges: changes.filter(item => item.severity === "info").map(item => entry(surface, item))
  };
}

function buildReviewReport(input) {
  const rows = surfaces.map(surface => {
    const diff = input[surface.id];
    if (!diff) throw new Error(`missing ${surface.id} diff`);
    return summarize(surface, diff);
  });
  const regressions = rows.flatMap(row => row.regressions);
  const improvements = rows.flatMap(row => row.improvements);
  const reviewChanges = rows.flatMap(row => row.reviewChanges);
  const infoChanges = rows.flatMap(row => row.infoChanges);
  const changeCount = rows.reduce((sum, row) => sum + row.summary.changes, 0);
  const status = regressions.length ? "regression" : changeCount ? "changed" : "unchanged";
  return {
    schemaVersion: 1,
    status,
    surfaces: rows.map(row => ({
      id: row.id,
      label: row.label,
      status: row.status,
      summary: row.summary
    })),
    summary: {
      surfaces: rows.length,
      changes: changeCount,
      regressions: regressions.length,
      improvements: improvements.length,
      reviewChanges: reviewChanges.length,
      infoChanges: infoChanges.length
    },
    regressions,
    improvements,
    reviewChanges,
    infoChanges
  };
}

function formatSection(title, entries) {
  if (!entries.length) return [`${title}: none`];
  return [
    `${title}: ${entries.length}`,
    ...entries.map(item => `- [${item.label} / ${item.scope || "report"}] ${item.message}`)
  ];
}

function formatReviewReport(report) {
  return [
    `Review report: ${report.status}`,
    "Surfaces:",
    ...report.surfaces.map(surface => `- ${surface.label}: ${surface.status} (${surface.summary.changes} change(s), ${surface.summary.regressions} regression(s), ${surface.summary.improvements} improvement(s))`),
    ...formatSection("Regressions", report.regressions),
    ...formatSection("Review changes", report.reviewChanges),
    ...formatSection("Improvements", report.improvements),
    ...formatSection("Other changes", report.infoChanges)
  ].join("\n");
}

function markdownCell(value) {
  return String(value === undefined || value === null ? "" : value)
    .replaceAll("|", "\\|")
    .replace(/\s+/g, " ")
    .trim();
}

function formatMarkdownEntries(entries) {
  if (!entries.length) return ["None."];
  return entries.map(item => `- **${item.label} / ${item.scope || "report"}**: ${item.message}`);
}

function formatReviewMarkdown(report) {
  return [
    "# PR Review Report",
    "",
    `Status: **${report.status}**`,
    "",
    `Surfaces: ${report.summary.surfaces} | Changes: ${report.summary.changes} | Regressions: ${report.summary.regressions} | Review changes: ${report.summary.reviewChanges} | Improvements: ${report.summary.improvements}`,
    "",
    "| Surface | Status | Changes | Regressions | Improvements |",
    "| --- | --- | ---: | ---: | ---: |",
    ...report.surfaces.map(surface => `| ${markdownCell(surface.label)} | ${markdownCell(surface.status)} | ${surface.summary.changes} | ${surface.summary.regressions} | ${surface.summary.improvements} |`),
    "",
    "## Regressions",
    ...formatMarkdownEntries(report.regressions),
    "",
    "## Review Changes",
    ...formatMarkdownEntries(report.reviewChanges),
    "",
    "## Improvements",
    ...formatMarkdownEntries(report.improvements),
    "",
    "## Other Changes",
    ...formatMarkdownEntries(report.infoChanges),
    ""
  ].join("\n");
}

function writeJson(file, value) {
  ensureDir(file);
  fs.writeFileSync(path.resolve(repoRoot, file), JSON.stringify(value, null, 2) + "\n");
}

function writeSummary(file, markdown) {
  ensureDir(file);
  fs.appendFileSync(path.resolve(repoRoot, file), markdown + "\n");
}

function readCliInput() {
  const input = {};
  surfaces.forEach(surface => {
    const file = argValue(surface.flag);
    if (!file) return;
    input[surface.id] = readJson(file);
  });
  return input;
}

function usage() {
  return "usage: node scripts/build-review-report.js --quality-diff <quality.json> --dashboard-diff <dashboard.json> --demo-diff <demo.json> --today-diff <today.json> --trajectory-diff <trajectory.json> [--out <review.json>] [--summary-out <summary.md>] [--json] [--markdown] [--fail-on-change] [--fail-on-regression]";
}

function main() {
  const input = readCliInput();
  const missing = surfaces.filter(surface => !input[surface.id]).map(surface => surface.flag);
  if (missing.length) {
    console.error(usage());
    console.error(`missing: ${missing.join(", ")}`);
    process.exit(2);
  }
  const report = buildReviewReport(input);
  const outPath = argValue("--out");
  const summaryPath = argValue("--summary-out");
  const markdown = formatReviewMarkdown(report);
  if (outPath) writeJson(outPath, report);
  if (summaryPath) writeSummary(summaryPath, markdown);
  if (hasFlag("--json")) console.log(JSON.stringify(report, null, 2));
  else if (hasFlag("--markdown")) console.log(markdown);
  else console.log(formatReviewReport(report));
  if (hasFlag("--fail-on-regression") && report.regressions.length) process.exit(1);
  if (hasFlag("--fail-on-change") && report.summary.changes) process.exit(1);
}

if (require.main === module) main();

module.exports = {
  buildReviewReport,
  formatReviewMarkdown,
  formatReviewReport
};

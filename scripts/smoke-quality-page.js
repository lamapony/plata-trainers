#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const qualityHtml = fs.readFileSync(path.join(root, "quality.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertQualityPageHtml() {
  assert(qualityHtml.includes("id=\"quality-channel-title\""), "quality page should expose channel transfer section");
  assert(qualityHtml.includes("proof.html#proof-capability-title"), "quality page should link proof capability matrix anchor");
  assert(qualityHtml.includes("proof.html#proof-walkthrough"), "quality page should link proof walkthrough anchor");
  assert(qualityHtml.includes("lesson-a2-doctor"), "quality page should cite doctor gold lesson");
  assert(qualityHtml.includes("doctor-apotek-skrive-sundhed"), "quality page should cite doctor transfer chain id");
  assert(qualityHtml.includes("reports/exercise-value.json"), "quality page should name exercise value report path");
  assert(/apotek.*patientportal|patientportal.*apotek/i.test(qualityHtml), "quality page should describe apotek to patientportal transfer");
  assert(!qualityHtml.includes('href="./reports/exercise-value.json"'), "quality page should not link exercise value JSON directly");
  assert(!qualityHtml.includes('href="./reports/quality.json"'), "quality page should not link quality JSON directly in static HTML");
  assert(qualityHtml.includes("id=\"quality-channel-callout\""), "quality page should expose doctor callout target");
}

if (require.main === module) {
  assertQualityPageHtml();
  console.log("ok - quality page exposes doctor channel transfer without broken report hrefs");
}

module.exports = { assertQualityPageHtml };

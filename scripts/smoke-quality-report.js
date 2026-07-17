#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { buildQualityReport } = require("./build-quality-report.js");
const { assertQualityPageHtml } = require("./smoke-quality-page.js");

const root = path.resolve(__dirname, "..");
const report = buildQualityReport();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeElement(selector) {
  return {
    selector,
    className: "",
    textContent: "",
    innerHTML: "",
    href: "",
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    removeAttribute(name) {
      delete this.attributes[name];
    }
  };
}

async function run() {
  assertQualityPageHtml();
  const flagshipAudio = report.lessons.find(lesson => lesson.id === "lesson-b2-job-followup").audio;
  assert(report.totals.audioConfiguredLessons === 1, "quality report must count audio-ready lessons");
  assert(report.totals.audioAssetBytes === 0, "draft fixture must report factual zero audio bytes");
  assert(Array.isArray(report.totals.audioFormats) && Array.isArray(report.totals.audioVoices), "quality totals must expose formats and voices");
  assert(report.totals.audioConfiguredVoices.includes("cedar") && report.totals.audioConfiguredVoices.includes("marin"), "quality report must expose planned flagship casting separately");
  assert(flagshipAudio.generatedClips === 0 && flagshipAudio.assetBytes === 0, "flagship draft must not imply generated clips");
  assert(flagshipAudio.lastGeneratedAt === null && flagshipAudio.manifestHash === null, "flagship draft must not fabricate generation evidence");
  assert(flagshipAudio.validationStatus === "draft-pass", "flagship draft contract must remain valid but non-published");

  const elements = {};
  [
    "#quality-status",
    "#quality-summary",
    "#quality-generated",
    "#quality-metrics",
    "#quality-evidence",
    "#quality-lessons",
    "#quality-json-link",
    "#quality-channel-callout"
  ].forEach(selector => {
    elements[selector] = makeElement(selector);
  });
  elements["#quality-json-link"].attributes["aria-disabled"] = "true";

  const context = {
    console,
    Date,
    String,
    document: {
      querySelector(selector) {
        return elements[selector] || null;
      }
    },
    fetch(url) {
      assert(url === "./reports/quality.json", `unexpected fetch url ${url}`);
      return Promise.resolve({
        ok: true,
        json() {
          return Promise.resolve(report);
        }
      });
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, "quality.js"), "utf8"), context, { filename: "quality.js" });
  await new Promise(resolve => setImmediate(resolve));

  assert(elements["#quality-status"].textContent === "All checks passing", "quality page did not render passing status");
  assert(elements["#quality-summary"].innerHTML.includes("Checked lessons"), "quality page did not render summary");
  assert(elements["#quality-summary"].innerHTML.includes("Storyboard panels"), "quality page did not render comic summary");
  assert(elements["#quality-metrics"].innerHTML.includes("Routes tested"), "quality page did not render metrics");
  assert(elements["#quality-metrics"].innerHTML.includes("Storyboard panels"), "quality page did not render comic metrics");
  assert(elements["#quality-metrics"].innerHTML.includes("Evidence links"), "quality page did not render evidence metric");
  assert(elements["#quality-metrics"].innerHTML.includes("Audio asset size"), "quality page did not render factual audio size");
  assert(elements["#quality-metrics"].innerHTML.includes("Audio formats"), "quality page did not render audio formats");
  assert(elements["#quality-metrics"].innerHTML.includes("Audio voices"), "quality page did not render audio voices");
  assert(elements["#quality-metrics"].innerHTML.includes("Configured audio voices"), "quality page did not render planned casting");
  assert(elements["#quality-evidence"].innerHTML.includes("official-reply-passive"), "quality page did not render scene evidence rows");
  assert(elements["#quality-evidence"].innerHTML.includes("Every scene is replayed by simulation"), "quality page did not render evidence guarantees");
  assert(elements["#quality-evidence"].innerHTML.includes("ok Sources"), "quality page did not render scene check labels");
  assert(elements["#quality-lessons"].innerHTML.includes("lesson-b2-radiator-register"), "quality page did not render radiator lesson");
  assert(elements["#quality-lessons"].innerHTML.includes("lesson-a2-doctor"), "quality page did not render doctor gold lesson");
  assert(elements["#quality-lessons"].innerHTML.includes("id=\"lesson-a2-doctor\""), "quality page did not anchor doctor lesson card");
  assert(
    elements["#quality-lessons"].innerHTML.indexOf("lesson-a2-doctor") <
      elements["#quality-lessons"].innerHTML.indexOf("lesson-b2-radiator-register"),
    "quality page should surface doctor lesson before other gold lessons"
  );
  assert(elements["#quality-channel-callout"].innerHTML.includes("lesson-a2-doctor"), "quality page did not render doctor channel callout");
  assert(elements["#quality-channel-callout"].innerHTML.includes("apotek → skrive sundhed"), "quality page did not render doctor repair ladder");
  assert(elements["#quality-lessons"].innerHTML.includes("lesson-b2-job-followup"), "quality page did not render job lesson");
  assert(elements["#quality-lessons"].innerHTML.includes("0 clips"), "quality page must expose zero generated flagship clips honestly");
  assert(elements["#quality-lessons"].innerHTML.includes("not generated"), "quality page must expose missing generation evidence honestly");
  assert(elements["#quality-lessons"].innerHTML.includes("planned voices cedar, marin"), "quality page must expose planned flagship voices without claiming generated audio");
  assert(elements["#quality-lessons"].innerHTML.includes("official-reply-passive"), "quality page did not render generated comic panel status");
  assert(elements["#quality-lessons"].innerHTML.includes("group-chat-particles (prompt)"), "quality page did not render comic panel prompt status");
  assert(elements["#quality-json-link"].href === "./reports/quality.json", "quality JSON link was not enabled");
  assert(!Object.prototype.hasOwnProperty.call(elements["#quality-json-link"].attributes, "aria-disabled"), "quality JSON link remains disabled");

  console.log("ok - quality report builds from lesson contracts");
  console.log("ok - quality page renders generated report data");
}

run().catch(err => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});

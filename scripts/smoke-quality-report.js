#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { buildQualityReport } = require("./build-quality-report.js");

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
  const elements = {};
  [
    "#quality-status",
    "#quality-summary",
    "#quality-generated",
    "#quality-metrics",
    "#quality-evidence",
    "#quality-lessons",
    "#quality-json-link"
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

  assert(elements["#quality-status"].textContent === "Passing", "quality page did not render passing status");
  assert(elements["#quality-summary"].innerHTML.includes("Gold lessons"), "quality page did not render summary");
  assert(elements["#quality-summary"].innerHTML.includes("Comic panels"), "quality page did not render comic summary");
  assert(elements["#quality-metrics"].innerHTML.includes("Simulation Paths"), "quality page did not render metrics");
  assert(elements["#quality-metrics"].innerHTML.includes("Comic Panels"), "quality page did not render comic metrics");
  assert(elements["#quality-metrics"].innerHTML.includes("Evidence Rows"), "quality page did not render evidence metric");
  assert(elements["#quality-evidence"].innerHTML.includes("official-reply-passive"), "quality page did not render scene evidence rows");
  assert(elements["#quality-evidence"].innerHTML.includes("Every scene is replayed by simulation"), "quality page did not render evidence guarantees");
  assert(elements["#quality-evidence"].innerHTML.includes("ok Sources"), "quality page did not render scene check labels");
  assert(elements["#quality-lessons"].innerHTML.includes("lesson-b2-radiator-register"), "quality page did not render radiator lesson");
  assert(elements["#quality-lessons"].innerHTML.includes("lesson-b2-job-followup"), "quality page did not render job lesson");
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

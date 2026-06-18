#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { buildCapabilityMap } = require("./build-capability-map.js");

const root = path.resolve(__dirname, "..");
const report = buildCapabilityMap();
const programHtml = fs.readFileSync(path.join(root, "program.html"), "utf8");

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
    removeAttribute(name) {
      delete this.attributes[name];
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    }
  };
}

async function run() {
  assert(programHtml.includes("dashboard.html?demo=learner"), "program page does not link the demo learner dashboard");
  assert(programHtml.includes("proof.html#proof-walkthrough"), "program page should link reviewer walkthrough on proof");
  assert(programHtml.includes("proof.html#proof-distribution-title"), "program page should link offline distribution proof");
  assert(programHtml.includes("reports/exercise-value.json"), "program page should link exercise value report");
  assert(/apotek.*patientportal|patientportal.*apotek/i.test(programHtml), "program page should describe apotek to patientportal channel transfer");
  assert(programHtml.includes("job-followup-bojning-gender-trap"), "program page should cite bojning trap repair chain");
  assert(programHtml.includes("proof.html#proof-capability-title"), "program page should link proof capability matrix for bojning trap chain");
  assert(programHtml.includes("Demo learner → Today → guided session → gates"), "program page should expose the reviewer path headline");

  const elements = {};
  [
    "#program-status",
    "#program-summary",
    "#program-generated",
    "#program-pillars",
    "#program-capabilities",
    "#program-guarantees",
    "#program-reports",
    "#program-json-link"
  ].forEach(selector => {
    elements[selector] = makeElement(selector);
  });
  elements["#program-json-link"].attributes["aria-disabled"] = "true";

  const context = {
    console,
    Date,
    String,
    encodeURIComponent,
    document: {
      querySelector(selector) {
        return elements[selector] || null;
      }
    },
    fetch(url) {
      assert(url === "./reports/capabilities.json", `unexpected fetch url ${url}`);
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
  vm.runInContext(fs.readFileSync(path.join(root, "program.js"), "utf8"), context, { filename: "program.js" });
  await new Promise(resolve => setImmediate(resolve));

  assert(elements["#program-status"].textContent === "Proof map passing", "program page did not render passing status");
  assert(elements["#program-summary"].innerHTML.includes("Capabilities"), "program page did not render summary");
  assert(elements["#program-pillars"].innerHTML.includes("Break the plateau one step at a time"), "program page did not render learner pillar");
  assert(elements["#program-pillars"].innerHTML.includes("Personalization stays explainable"), "program page did not render personalization pillar");
  assert(elements["#program-capabilities"].innerHTML.includes("Stateful Today program shell"), "program page did not render Today capability");
  assert(elements["#program-capabilities"].innerHTML.includes("Lightweight companion and read-only bridge"), "program page did not render companion capability");
  assert(elements["#program-capabilities"].innerHTML.includes("capability map"), "program page did not render proof surface text");
  assert(elements["#program-guarantees"].innerHTML.includes("Every declared capability"), "program page did not render guarantees");
  assert(elements["#program-reports"].innerHTML.includes("reports/capabilities.json"), "program page did not render public capability report");
  assert(elements["#program-json-link"].href === "./reports/capabilities.json", "program JSON link was not enabled");
  assert(!Object.prototype.hasOwnProperty.call(elements["#program-json-link"].attributes, "aria-disabled"), "program JSON link remains disabled");

  console.log("ok - program page renders the capability map for learners");
  console.log("ok - program page exposes public reports, gates, and guarantees");
}

run().catch(err => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});

#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { buildDemoLearnerReport } = require("./build-demo-learner-report.js");
const { buildCapabilityMap } = require("./build-capability-map.js");
const { buildProjectHealthManifest } = require("./build-project-health-manifest.js");
const { writeQuickstartProof } = require("./build-quickstart-proof.js");

const root = path.resolve(__dirname, "..");
const proofHtml = fs.readFileSync(path.join(root, "proof.html"), "utf8");

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
  assert(proofHtml.includes("Proof / Health"), "proof page should have a readable title");
  assert(proofHtml.includes("id=\"proof-health-link\""), "proof page should expose the health link target");
  assert(!proofHtml.includes("href=\"./reports/"), "proof page should not break root static QA with pre-build report links");

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-proof-page-"));
  try {
    const demo = buildDemoLearnerReport();
    const capabilities = buildCapabilityMap();
    const health = buildProjectHealthManifest();
    const quickstart = writeQuickstartProof(tmp);
    const review = JSON.parse(fs.readFileSync(path.join(tmp, "review-report.json"), "utf8"));
    const summary = fs.readFileSync(path.join(tmp, "review-summary.md"), "utf8");
    const responses = {
      "./reports/demo-learner.json": { json: demo },
      "./reports/capabilities.json": { json: capabilities },
      "./reports/project-health.json": { json: health },
      "./reports/quickstart-proof/quickstart.json": { json: quickstart },
      "./reports/quickstart-proof/review-report.json": { json: review },
      "./reports/quickstart-proof/review-summary.md": { text: summary }
    };

    const elements = {};
    [
      "#proof-status",
      "#proof-summary",
      "#proof-generated",
      "#proof-artifacts",
      "#proof-surfaces",
      "#proof-health",
      "#proof-review",
      "#proof-health-link",
      "#proof-capabilities-link",
      "#proof-quickstart-link"
    ].forEach(selector => {
      elements[selector] = makeElement(selector);
    });
    ["#proof-health-link", "#proof-capabilities-link", "#proof-quickstart-link"].forEach(selector => {
      elements[selector].attributes["aria-disabled"] = "true";
    });

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
        const response = responses[url];
        assert(response, `unexpected fetch url ${url}`);
        return Promise.resolve({
          ok: true,
          json() {
            return Promise.resolve(response.json);
          },
          text() {
            return Promise.resolve(response.text);
          }
        });
      }
    };
    context.window = context;
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(root, "proof.js"), "utf8"), context, { filename: "proof.js" });
    await new Promise(resolve => setImmediate(resolve));

    assert(elements["#proof-status"].textContent === "Proof passing", "proof page did not render passing status");
    assert(elements["#proof-summary"].innerHTML.includes("Health gates"), "proof page did not render health summary");
    assert(elements["#proof-summary"].innerHTML.includes("Review regressions"), "proof page did not render review summary");
    assert(elements["#proof-artifacts"].innerHTML.includes("npm run proof:quickstart"), "proof page did not render quickstart command");
    assert(elements["#proof-artifacts"].innerHTML.includes("review-report.json"), "proof page did not render review artifact link");
    assert(elements["#proof-surfaces"].innerHTML.includes("Demo learner"), "proof page did not render demo learner surface");
    assert(elements["#proof-surfaces"].innerHTML.includes("Capability map"), "proof page did not render capability map surface");
    assert(elements["#proof-surfaces"].innerHTML.includes("Golden review fixture"), "proof page did not render golden review surface");
    assert(elements["#proof-health"].innerHTML.includes("Gate categories"), "proof page did not render gate categories");
    assert(elements["#proof-health"].innerHTML.includes("all-required-gates-in-check"), "proof page did not render health guarantees");
    assert(elements["#proof-review"].innerHTML.includes("Quality"), "proof page did not render review surface rows");
    assert(elements["#proof-review"].innerHTML.includes("Open full review JSON"), "proof page did not render review links");
    assert(elements["#proof-health-link"].href === "./reports/project-health.json", "proof health link was not enabled");
    assert(elements["#proof-capabilities-link"].href === "./reports/capabilities.json", "proof capability link was not enabled");
    assert(elements["#proof-quickstart-link"].href === "./reports/quickstart-proof/quickstart.md", "proof quickstart link was not enabled");
    assert(!Object.prototype.hasOwnProperty.call(elements["#proof-health-link"].attributes, "aria-disabled"), "proof health link remains disabled");
    assert(!Object.prototype.hasOwnProperty.call(elements["#proof-capabilities-link"].attributes, "aria-disabled"), "proof capability link remains disabled");
    assert(!Object.prototype.hasOwnProperty.call(elements["#proof-quickstart-link"].attributes, "aria-disabled"), "proof quickstart link remains disabled");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log("ok - proof page renders public health, capability, demo learner, and quickstart artifacts");
  console.log("ok - proof page exposes golden PR review proof without breaking root static QA");
}

run().catch(err => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});

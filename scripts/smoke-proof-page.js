#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { buildDemoLearnerReport } = require("./build-demo-learner-report.js");
const { buildCapabilityMap } = require("./build-capability-map.js");
const { buildProjectHealthManifest } = require("./build-project-health-manifest.js");
const { buildGuidedSessionReport } = require("./build-guided-session-report.js");
const { buildEvaluatorPathReport } = require("./build-evaluator-path-report.js");
const { buildEvaluatorJourneyReport } = require("./build-evaluator-journey-report.js");
const { buildProfilePortabilityReport } = require("./build-profile-portability-report.js");
const { buildExerciseValueReport } = require("./build-exercise-value-report.js");
const { writeQuickstartProof } = require("./build-quickstart-proof.js");
const { buildProofDigest } = require("./build-proof-digest.js");

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
    hidden: true,
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
    scrollIntoView(options) {
      this.scrollIntoViewCalls = this.scrollIntoViewCalls || [];
      this.scrollIntoViewCalls.push(options || {});
    }
  };
}

async function run() {
  assert(proofHtml.includes("Why you can trust Platå"), "proof page should have a readable title");
  assert(proofHtml.includes("id=\"proof-health-link\""), "proof page should expose the health link target");
  assert(proofHtml.includes("id=\"proof-digest\""), "proof page should expose the plain-language digest target");
  assert(proofHtml.includes("id=\"proof-walkthrough\""), "proof page should expose the visitor proof walkthrough target");
  assert(proofHtml.includes("id=\"proof-headroom\""), "proof page should expose the plain-language proof headroom target");
  assert(proofHtml.includes("See the 60-second walkthrough"), "proof page should expose reviewer path hero action");
  assert(proofHtml.includes("id=\"proof-evaluator\""), "proof page should expose the evaluator path report target");
  assert(proofHtml.includes("id=\"proof-capability-matrix\""), "proof page should expose the capability proof matrix target");
  assert(proofHtml.includes("id=\"proof-distribution\""), "proof page should expose the offline distribution proof target");
  assert(proofHtml.includes("id=\"proof-distribution-title\""), "proof page should expose the offline distribution hash target");
  assert(proofHtml.includes("Standalone ZIP for backend-free review"), "proof page should explain the offline distribution bundle");
  assert(!proofHtml.includes("href=\"./reports/"), "proof page should not break root static QA with pre-build report links");

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-proof-page-"));
  try {
    const demo = buildDemoLearnerReport();
    const evaluator = buildEvaluatorPathReport();
    const journey = buildEvaluatorJourneyReport();
    const portability = buildProfilePortabilityReport();
    const exerciseValue = buildExerciseValueReport();
    const guided = buildGuidedSessionReport();
    const capabilities = buildCapabilityMap();
    const health = buildProjectHealthManifest();
    const digest = buildProofDigest();
    const quickstart = writeQuickstartProof(tmp);
    const review = JSON.parse(fs.readFileSync(path.join(tmp, "review-report.json"), "utf8"));
    const summary = fs.readFileSync(path.join(tmp, "review-summary.md"), "utf8");
    const responses = {
      "./reports/proof-digest.json": { json: digest },
      "./reports/demo-learner.json": { json: demo },
      "./reports/evaluator-path.json": { json: evaluator },
      "./reports/evaluator-journey.json": { json: journey },
      "./reports/profile-portability.json": { json: portability },
      "./reports/exercise-value.json": { json: exerciseValue },
      "./reports/guided-session.json": { json: guided },
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
      "#proof-digest",
      "#proof-walkthrough",
      "#proof-headroom",
      "#proof-evaluator",
      "#proof-artifacts",
      "#proof-surfaces",
      "#proof-distribution",
      "#proof-capability-matrix",
      "#proof-guided",
      "#proof-health",
      "#proof-review",
      "#proof-digest-link",
      "#proof-health-link",
      "#proof-capabilities-link",
      "#proof-evaluator-link",
      "#proof-journey-link",
      "#proof-portability-link",
      "#proof-exercise-link",
      "#proof-guided-link",
      "#proof-quickstart-link",
      "#proof-walkthrough-title",
      "#proof-evaluator-title",
      "#proof-guided-title",
      "#proof-distribution-title"
    ].forEach(selector => {
      elements[selector] = makeElement(selector);
    });
    ["#proof-digest-link", "#proof-health-link", "#proof-capabilities-link", "#proof-evaluator-link", "#proof-journey-link", "#proof-portability-link", "#proof-exercise-link", "#proof-guided-link", "#proof-quickstart-link"].forEach(selector => {
      elements[selector].attributes["aria-disabled"] = "true";
    });

    const eventListeners = {};
    const context = {
      console,
      Date,
      String,
      document: {
        querySelector(selector) {
          return elements[selector] || null;
        }
      },
      location: {
        hash: "#proof-walkthrough-title"
      },
      addEventListener(name, handler) {
        eventListeners[name] = handler;
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
    vm.runInContext(fs.readFileSync(path.join(root, "shared", "plata-headroom.js"), "utf8"), context, { filename: "shared/plata-headroom.js" });
    vm.runInContext(fs.readFileSync(path.join(root, "proof.js"), "utf8"), context, { filename: "proof.js" });
    await new Promise(resolve => setImmediate(resolve));

    assert(elements["#proof-status"].textContent === "All checks passing", "proof page did not render passing status");
    assert(elements["#proof-headroom"].innerHTML.includes("headroom-bar"), "proof page did not render plain-language headroom bar");
    assert(elements["#proof-headroom"].innerHTML.includes("checked in public"), "proof page headroom should summarize digest headline");
    assert(elements["#proof-headroom"].innerHTML.includes("Follow the 60-second walkthrough"), "proof page headroom should link reviewer path");
    assert(!elements["#proof-headroom"].hidden, "proof page headroom should be visible after load");
    assert(elements["#proof-summary"].innerHTML.includes("Required checks"), "proof page did not render health summary");
    assert(elements["#proof-summary"].innerHTML.includes("Test failures exercised"), "proof page did not render review summary");
    assert(elements["#proof-digest"].innerHTML.includes("The important promises are checked in public"), "proof page did not render digest headline");
    assert(elements["#proof-digest"].innerHTML.includes("What changed"), "proof page did not render digest changes");
    assert(elements["#proof-digest"].innerHTML.includes("Trust boundaries"), "proof page did not render digest trust boundaries");
    assert(elements["#proof-digest"].innerHTML.includes("reports/proof-digest.json"), "proof page did not render digest evidence links");
    assert(elements["#proof-walkthrough"].innerHTML.includes("From one suggestion to a useful result"), "proof page did not render walkthrough summary");
    assert(elements["#proof-walkthrough"].innerHTML.includes("proof-reviewer-route"), "proof page did not render reviewer route strip");
    assert(elements["#proof-walkthrough"].innerHTML.includes("1 · Example learner"), "proof page did not render reviewer route demo link");
    assert(elements["#proof-walkthrough"].innerHTML.includes("4 · Works offline"), "proof page did not render offline ZIP in reviewer route");
    assert(elements["#proof-walkthrough"].innerHTML.includes("proof-distribution-title"), "proof page did not link distribution proof from reviewer route");
    assert(elements["#proof-walkthrough"].innerHTML.includes("5 · Lesson checks"), "proof page did not render quality gates in reviewer route");
    assert(elements["#proof-walkthrough"].innerHTML.includes("6 · Technical map"), "proof page did not render capability map in reviewer route");
    assert(elements["#proof-walkthrough"].innerHTML.includes("quality.html"), "proof page did not link quality report from reviewer route");
    assert(elements["#proof-walkthrough"].innerHTML.includes("evaljourney-"), "proof page did not render evaluator journey trace");
    assert(elements["#proof-walkthrough"].innerHTML.includes("evaluator-journey.json"), "proof page did not link evaluator journey report");
    assert(elements["#proof-journey-link"].href === "./reports/evaluator-journey.json", "proof page did not enable the evaluator journey report link");
    assert(elements["#proof-walkthrough"].innerHTML.includes("Meet a fictional learner"), "proof page did not render demo walkthrough step");
    assert(elements["#proof-walkthrough"].innerHTML.includes("See why this practice comes next"), "proof page did not render demo recommendation in walkthrough");
    assert(elements["#proof-walkthrough"].innerHTML.includes("Meet the example learner"), "proof page did not link demo dashboard from walkthrough");
    assert(elements["#proof-walkthrough"].innerHTML.includes("Come back without losing your place"), "proof page did not render dashboard return walkthrough step");
    assert(elements["#proof-walkthrough"].innerHTML.includes("See the return"), "proof page did not link dashboard return route from walkthrough");
    assert(elements["#proof-walkthrough"].innerHTML.includes("outcome receipt"), "proof page did not render outcome receipt in walkthrough");
    assert(elements["#proof-walkthrough"].innerHTML.includes("gdo-"), "proof page did not render guided outcome fingerprint in walkthrough");
    assert(elements["#proof-walkthrough"].innerHTML.includes("check:guided-session-diff"), "proof page did not render guided diff gate in walkthrough");
    assert(elements["#proof-walkthrough"].innerHTML.includes("shared/plata-guided-session.js") || elements["#proof-walkthrough"].innerHTML.includes("guided source"), "proof page did not link guided source from walkthrough");
    assert(elements["#proof-evaluator"].innerHTML.includes("First-visit evaluator path"), "proof page did not render evaluator path report");
    assert(elements["#proof-evaluator"].innerHTML.includes("evaluator-path.json"), "proof page did not link the evaluator path report");
    assert(elements["#proof-evaluator"].innerHTML.includes("0 storage writes"), "proof page did not render read-only evaluator proof");
    assert(elements["#proof-evaluator"].innerHTML.includes("guided proof"), "proof page did not render guided proof backing");
    assert(elements["#proof-evaluator"].innerHTML.includes("check:evaluator-path"), "proof page did not render evaluator gate backing");
    assert(elements["#proof-artifacts"].innerHTML.includes("npm run proof:quickstart"), "proof page did not render quickstart command");
    assert(elements["#proof-artifacts"].innerHTML.includes("review-report.json"), "proof page did not render review artifact link");
    assert(elements["#proof-surfaces"].innerHTML.includes("Demo learner"), "proof page did not render demo learner surface");
    assert(elements["#proof-surfaces"].innerHTML.includes("Take your progress with you"), "proof page did not render profile portability surface");
    assert(elements["#proof-surfaces"].innerHTML.includes("profileport-"), "proof page did not render profile portability trace");
    assert(elements["#proof-surfaces"].innerHTML.includes("profile-portability.json"), "proof page did not link profile portability report");
    assert(elements["#proof-surfaces"].innerHTML.includes("Practice that changes what you can do"), "proof page did not render exercise value surface");
    assert(elements["#proof-surfaces"].innerHTML.includes("6/6 archetypes"), "proof page did not render exercise archetype coverage");
    assert(elements["#proof-surfaces"].innerHTML.includes("flagship outcome"), "proof page did not render profile flagship outcome proof");
    assert(elements["#proof-surfaces"].innerHTML.includes("guided outcome proof"), "proof page did not render guided flagship outcome proof");
    assert(elements["#proof-surfaces"].innerHTML.includes("profile outcome portable"), "proof page did not render profile outcome portability proof");
    assert(elements["#proof-surfaces"].innerHTML.includes("exercise-value.json"), "proof page did not link exercise value report");
    assert(elements["#proof-surfaces"].innerHTML.includes("Claims you can verify"), "proof page did not render capability map surface");
    assert(elements["#proof-surfaces"].innerHTML.includes("A realistic code review"), "proof page did not render golden review surface");
    assert(elements["#proof-distribution"].innerHTML.includes("Offline ZIP bundle"), "proof page did not render offline distribution summary");
    assert(elements["#proof-distribution"].innerHTML.includes("plata-offline-bundle.zip"), "proof page did not render distribution zip path");
    assert(elements["#proof-distribution"].innerHTML.includes("110 files"), "proof page did not render distribution file count");
    assert(elements["#proof-distribution"].innerHTML.includes("v0.4.0"), "proof page did not render distribution version");
    assert(elements["#proof-distribution"].innerHTML.includes("check:distribution"), "proof page did not render distribution gate");
    assert(elements["#proof-distribution"].innerHTML.includes("no backend"), "proof page did not render backend-free proof");
    assert(elements["#proof-distribution"].innerHTML.includes("PWA-ready"), "proof page did not render PWA-ready proof");
    assert(elements["#proof-distribution"].innerHTML.includes("precache-manifest.json"), "proof page did not render distribution required entries");
    assert(elements["#proof-distribution"].innerHTML.includes("npm run build:distribution"), "proof page did not render distribution build command");
    assert(elements["#proof-distribution"].innerHTML.includes("build-distribution-bundle.js"), "proof page did not link distribution bundle builder");
    assert(elements["#proof-capability-matrix"].innerHTML.includes("11 capabilities"), "proof page did not render capability matrix summary");
    assert(elements["#proof-capability-matrix"].innerHTML.includes("Static, forkable trainer runtime"), "proof page did not render capability rows");
    assert(elements["#proof-capability-matrix"].innerHTML.includes("Public GitHub proof surface"), "proof page did not render public proof capability row");
    assert(elements["#proof-capability-matrix"].innerHTML.includes("Reviewed Danish lesson audio"), "proof page did not render Danish audio capability row");
    assert(elements["#proof-capability-matrix"].innerHTML.includes("./reports/capabilities.json"), "proof page did not link the capability map report from the matrix");
    assert(elements["#proof-capability-matrix"].innerHTML.includes("./reports/profile-portability.json"), "proof page did not link profile portability report from the matrix");
    assert(elements["#proof-capability-matrix"].innerHTML.includes("./reports/exercise-value.json"), "proof page did not link exercise value report from the matrix");
    assert(elements["#proof-capability-matrix"].innerHTML.includes("./reports/guided-session.json"), "proof page did not link guided public report from the matrix");
    assert(elements["#proof-capability-matrix"].innerHTML.includes("proof-page"), "proof page did not render proof-page gate in the matrix");
    assert(elements["#proof-guided"].innerHTML.includes("Generated guided-session report"), "proof page did not render guided report card");
    assert(elements["#proof-guided"].innerHTML.includes("Guided drift is reviewable"), "proof page did not render guided review card");
    assert(elements["#proof-guided"].innerHTML.includes("check:guided-session-diff"), "proof page did not render guided diff gate");
    assert(elements["#proof-guided"].innerHTML.includes("scripts/diff-guided-session-report.js") || elements["#proof-guided"].innerHTML.includes("PR diff"), "proof page did not render guided diff source");
    assert(elements["#proof-guided"].innerHTML.includes("outcome receipt"), "proof page did not render guided outcome receipt proof");
    assert(elements["#proof-health"].innerHTML.includes("Gate categories"), "proof page did not render gate categories");
    assert(elements["#proof-health"].innerHTML.includes("all-required-gates-in-check"), "proof page did not render health guarantees");
    assert(elements["#proof-review"].innerHTML.includes("Quality"), "proof page did not render review surface rows");
    assert(elements["#proof-review"].innerHTML.includes("Open full review JSON"), "proof page did not render review links");
    assert(elements["#proof-digest-link"].href === "./reports/proof-digest.json", "proof digest link was not enabled");
    assert(elements["#proof-health-link"].href === "./reports/project-health.json", "proof health link was not enabled");
    assert(elements["#proof-capabilities-link"].href === "./reports/capabilities.json", "proof capability link was not enabled");
    assert(elements["#proof-evaluator-link"].href === "./reports/evaluator-path.json", "proof evaluator link was not enabled");
    assert(elements["#proof-portability-link"].href === "./reports/profile-portability.json", "proof profile portability link was not enabled");
    assert(elements["#proof-exercise-link"].href === "./reports/exercise-value.json", "proof exercise value link was not enabled");
    assert(elements["#proof-guided-link"].href === "./reports/guided-session.json", "proof guided link was not enabled");
    assert(elements["#proof-quickstart-link"].href === "./reports/quickstart-proof/quickstart.md", "proof quickstart link was not enabled");
    assert(!Object.prototype.hasOwnProperty.call(elements["#proof-digest-link"].attributes, "aria-disabled"), "proof digest link remains disabled");
    assert(!Object.prototype.hasOwnProperty.call(elements["#proof-health-link"].attributes, "aria-disabled"), "proof health link remains disabled");
    assert(!Object.prototype.hasOwnProperty.call(elements["#proof-capabilities-link"].attributes, "aria-disabled"), "proof capability link remains disabled");
    assert(!Object.prototype.hasOwnProperty.call(elements["#proof-evaluator-link"].attributes, "aria-disabled"), "proof evaluator link remains disabled");
    assert(!Object.prototype.hasOwnProperty.call(elements["#proof-portability-link"].attributes, "aria-disabled"), "proof profile portability link remains disabled");
    assert(!Object.prototype.hasOwnProperty.call(elements["#proof-exercise-link"].attributes, "aria-disabled"), "proof exercise value link remains disabled");
    assert(!Object.prototype.hasOwnProperty.call(elements["#proof-guided-link"].attributes, "aria-disabled"), "proof guided link remains disabled");
    assert(!Object.prototype.hasOwnProperty.call(elements["#proof-quickstart-link"].attributes, "aria-disabled"), "proof quickstart link remains disabled");
    assert(elements["#proof-walkthrough-title"].scrollIntoViewCalls && elements["#proof-walkthrough-title"].scrollIntoViewCalls.length === 1, "proof page should restore hash scroll after async report rendering");
    assert(elements["#proof-walkthrough-title"].scrollIntoViewCalls[0].behavior === "auto", "proof page should use deterministic hash scroll behavior");
    assert(typeof eventListeners.hashchange === "function", "proof page should restore hash scroll after same-page hash changes");
    context.location.hash = "#proof-guided-title";
    eventListeners.hashchange();
    assert(elements["#proof-guided-title"].scrollIntoViewCalls && elements["#proof-guided-title"].scrollIntoViewCalls.length === 1, "proof page should scroll to the new hash target after hashchange");
    context.location.hash = "#proof-evaluator-title";
    eventListeners.hashchange();
    assert(elements["#proof-evaluator-title"].scrollIntoViewCalls && elements["#proof-evaluator-title"].scrollIntoViewCalls.length === 1, "proof page should scroll to the evaluator proof target after hashchange");
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

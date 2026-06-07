#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..");
const kernelSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-kernel.js"), "utf8");
const radiatorLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-radiator", "data.js"), "utf8");
const dashboardSource = fs.readFileSync(path.join(repoRoot, "dashboard.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeElement(tagName) {
  return {
    tagName,
    className: "",
    innerHTML: "",
    textContent: "",
    style: {},
    children: [],
    files: [],
    appendChild(child) {
      this.children.push(child);
    },
    addEventListener() {},
    click() {}
  };
}

function makeContext(initialStorage) {
  const storage = Object.assign({}, initialStorage || {});
  const elements = {
    "#trainer-cards": makeElement("div"),
    "#due-cards": makeElement("div"),
    "#mastery-list": makeElement("div"),
    "#weak-list": makeElement("div"),
    "#export-all": makeElement("button"),
    "#import-trigger": makeElement("button"),
    "#import-file": makeElement("input"),
    "#import-status": makeElement("p")
  };

  const context = {
    console,
    Date,
    JSON,
    Object,
    Math,
    String,
    Array,
    Map,
    encodeURIComponent,
    URL: {
      createObjectURL() { return "blob:mock"; },
      revokeObjectURL() {}
    },
    Blob: function Blob() {},
    FileReader: function FileReader() {},
    document: {
      readyState: "complete",
      querySelector(selector) {
        return elements[selector] || null;
      },
      querySelectorAll() {
        return [];
      },
      createElement(tagName) {
        return makeElement(tagName);
      },
      addEventListener() {}
    },
    localStorage: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
      },
      setItem(key, value) {
        storage[key] = String(value);
      },
      removeItem(key) {
        delete storage[key];
      },
      key(index) {
        return Object.keys(storage)[index] || null;
      },
      get length() {
        return Object.keys(storage).length;
      }
    },
    setTimeout(fn) {
      if (typeof fn === "function") fn();
      return 1;
    }
  };

  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  return { context, elements, storage };
}

function loadKernelAndDashboard(env) {
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  vm.runInContext(radiatorLessonSource, env.context, { filename: "lessons/lesson-b2-radiator/data.js" });
  vm.runInContext(dashboardSource, env.context, { filename: "dashboard.js" });
}

function seedWeakMasteryState(env) {
  const kernel = env.context.PlataKernel;
  const state = kernel.freshState("lesson-b2-radiator-register");
  kernel.recordAttempt(state, {
    itemId: "official-reply-passive",
    correct: false,
    tags: ["B2", "passive", "passive-agency"],
    mode: "lesson",
    expected: "De har registreret sagen, men de lover ikke en dato.",
    given: "De lover, at radiatoren bliver fikset hurtigt."
  });
  kernel.recordAttempt(state, {
    itemId: "two-registers",
    correct: true,
    tags: ["B2", "formal-register-control"],
    mode: "lesson",
    expected: "Jeg vil gerne bede om en mere præcis dato...",
    given: "Jeg vil gerne bede om en mere præcis dato..."
  });
  env.storage[kernel.stateKey("lesson-b2-radiator-register")] = JSON.stringify(state);
}

function runEmptyDashboardSmoke() {
  const env = makeContext();
  loadKernelAndDashboard(env);

  assert(env.elements["#trainer-cards"].children.length === 6, "dashboard renders all trainer cards");
  assert(env.elements["#due-cards"].children.length === 3, "dashboard renders practice recommendations");
  assert(/No weak mastery signals/.test(env.elements["#mastery-list"].innerHTML), "dashboard renders empty mastery state");
  assert(/No raw weak tags detected/.test(env.elements["#weak-list"].innerHTML), "dashboard renders empty raw weak-tag state");
}

function runSeededMasterySmoke() {
  const env = makeContext();
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  seedWeakMasteryState(env);
  vm.runInContext(radiatorLessonSource, env.context, { filename: "lessons/lesson-b2-radiator/data.js" });
  vm.runInContext(dashboardSource, env.context, { filename: "dashboard.js" });

  assert(/Read passive agency/.test(env.elements["#mastery-list"].innerHTML), "dashboard renders weak mastery label");
  assert(/passive-agency/.test(env.elements["#mastery-list"].innerHTML), "dashboard renders mastery tag key");
  assert(/registration\/process language/.test(env.elements["#mastery-list"].innerHTML), "dashboard renders lesson-owned mastery evidence");
  assert(/Review Scene 1/.test(env.elements["#mastery-list"].innerHTML), "dashboard renders mastery repair CTA");
  assert(/official-reply-passive/.test(env.elements["#mastery-list"].innerHTML), "mastery repair CTA links to the source scene");
  assert(/Read passive agency/.test(env.elements["#due-cards"].children[0].innerHTML), "practice recommendation highlights weak mastery");
  assert(/Open repair scene/.test(env.elements["#due-cards"].children[0].innerHTML), "practice recommendation opens the repair scene");
}

function run() {
  runEmptyDashboardSmoke();
  runSeededMasterySmoke();

  console.log("ok - dashboard renders without runtime errors");
  console.log("ok - dashboard renders mastery signal diagnostics");
  console.log("ok - dashboard renders mastery repair paths");
}

run();

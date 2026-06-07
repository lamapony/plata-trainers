#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..");
const kernelSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-kernel.js"), "utf8");
const catalogSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-catalog.js"), "utf8");
const competencySource = fs.readFileSync(path.join(repoRoot, "shared", "plata-competencies.js"), "utf8");
const plannerSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-planner.js"), "utf8");
const radiatorLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-radiator", "data.js"), "utf8");
const jobFollowupLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-job-followup", "data.js"), "utf8");
const dashboardSource = fs.readFileSync(path.join(repoRoot, "dashboard.js"), "utf8");
const dynamicLessonSources = {
  "./lessons/lesson-b2-radiator/data.js": radiatorLessonSource,
  "./lessons/lesson-b2-job-followup/data.js": jobFollowupLessonSource
};

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

function makeContext(initialStorage, options) {
  const storage = Object.assign({}, initialStorage || {});
  options = options || {};
  const elements = {
    "#trainer-cards": makeElement("div"),
    "#due-cards": makeElement("div"),
    "#practice-plan": makeElement("div"),
    "#competency-list": makeElement("div"),
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
      head: null,
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
  context.document.head = makeElement("head");
  context.document.head.appendChild = function appendChild(child) {
    this.children.push(child);
    if (options.dynamicLessonScripts && dynamicLessonSources[child.src]) {
      vm.runInContext(dynamicLessonSources[child.src], context, { filename: child.src.replace(/^\.\//, "") });
      if (typeof child.onload === "function") child.onload();
      return child;
    }
    if (typeof child.onerror === "function") child.onerror();
    return child;
  };

  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  return { context, elements, storage };
}

function loadKernelAndDashboard(env) {
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  vm.runInContext(catalogSource, env.context, { filename: "shared/plata-catalog.js" });
  vm.runInContext(radiatorLessonSource, env.context, { filename: "lessons/lesson-b2-radiator/data.js" });
  vm.runInContext(jobFollowupLessonSource, env.context, { filename: "lessons/lesson-b2-job-followup/data.js" });
  vm.runInContext(competencySource, env.context, { filename: "shared/plata-competencies.js" });
  vm.runInContext(plannerSource, env.context, { filename: "shared/plata-planner.js" });
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

function seedClosedMasteryState(env) {
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
    itemId: "official-reply-passive",
    correct: true,
    tags: ["B2", "passive", "passive-agency"],
    mode: "repair",
    expected: "De har registreret sagen, men de lover ikke en dato.",
    given: "De har registreret sagen, men de lover ikke en dato."
  });
  kernel.recordRepairClosure(state, {
    signal: "passive-agency",
    itemId: "official-reply-passive",
    sceneId: "official-reply-passive",
    lessonId: "lesson-b2-radiator-register",
    label: "Read passive agency",
    action: "Name the missing actor",
    correct: true
  });
  env.storage[kernel.stateKey("lesson-b2-radiator-register")] = JSON.stringify(state);
}

function runEmptyDashboardSmoke() {
  const env = makeContext();
  loadKernelAndDashboard(env);

  assert(env.elements["#trainer-cards"].children.length === 6, "dashboard renders all trainer cards");
  assert(env.elements["#due-cards"].children.length === 3, "dashboard renders practice recommendations");
  assert(/Starter plan/.test(env.elements["#practice-plan"].innerHTML), "dashboard renders starter practice plan");
  assert(/Start Lesson 01/.test(env.elements["#practice-plan"].innerHTML), "dashboard starter plan includes first lesson");
  assert(/No weak root skills/.test(env.elements["#competency-list"].innerHTML), "dashboard renders empty competency graph state");
  assert(/No weak mastery signals/.test(env.elements["#mastery-list"].innerHTML), "dashboard renders empty mastery state");
  assert(/No raw weak tags detected/.test(env.elements["#weak-list"].innerHTML), "dashboard renders empty raw weak-tag state");
}

function runSeededMasterySmoke() {
  const env = makeContext();
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  seedWeakMasteryState(env);
  vm.runInContext(catalogSource, env.context, { filename: "shared/plata-catalog.js" });
  vm.runInContext(radiatorLessonSource, env.context, { filename: "lessons/lesson-b2-radiator/data.js" });
  vm.runInContext(jobFollowupLessonSource, env.context, { filename: "lessons/lesson-b2-job-followup/data.js" });
  vm.runInContext(competencySource, env.context, { filename: "shared/plata-competencies.js" });
  vm.runInContext(plannerSource, env.context, { filename: "shared/plata-planner.js" });
  vm.runInContext(dashboardSource, env.context, { filename: "dashboard.js" });

  assert(env.context.PlataCatalog.trainers.length === 6, "dashboard reads trainer catalog");
  assert(/Read passive agency/.test(env.elements["#mastery-list"].innerHTML), "dashboard renders weak mastery label");
  assert(/passive-agency/.test(env.elements["#mastery-list"].innerHTML), "dashboard renders mastery tag key");
  assert(/registration\/process language/.test(env.elements["#mastery-list"].innerHTML), "dashboard renders lesson-owned mastery evidence");
  assert(/Review Scene 1/.test(env.elements["#mastery-list"].innerHTML), "dashboard renders mastery repair CTA");
  assert(/official-reply-passive/.test(env.elements["#mastery-list"].innerHTML), "mastery repair CTA links to the source scene");
  assert(/mode=repair/.test(env.elements["#mastery-list"].innerHTML), "mastery repair CTA opens repair mode");
  assert(/signal=passive-agency/.test(env.elements["#mastery-list"].innerHTML), "mastery repair CTA carries the mastery signal");
  assert(/Agency and responsibility/.test(env.elements["#competency-list"].innerHTML), "dashboard renders root competency label");
  assert(/passive-agency/.test(env.elements["#competency-list"].innerHTML), "dashboard competency graph lists source signal");
  assert(/Root skill/.test(env.elements["#due-cards"].children[0].innerHTML), "practice recommendation carries root competency");
  assert(/Repair plan/.test(env.elements["#practice-plan"].innerHTML), "dashboard renders repair practice plan");
  assert(/Agency and responsibility/.test(env.elements["#practice-plan"].innerHTML), "dashboard repair plan shows root competency");
  assert(/mode=repair/.test(env.elements["#practice-plan"].innerHTML), "dashboard repair plan links repair mode");
  assert(/Read passive agency/.test(env.elements["#due-cards"].children[0].innerHTML), "practice recommendation highlights weak mastery");
  assert(/Open repair scene/.test(env.elements["#due-cards"].children[0].innerHTML), "practice recommendation opens the repair scene");
}

function runClosedMasterySmoke() {
  const env = makeContext();
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  seedClosedMasteryState(env);
  vm.runInContext(catalogSource, env.context, { filename: "shared/plata-catalog.js" });
  vm.runInContext(radiatorLessonSource, env.context, { filename: "lessons/lesson-b2-radiator/data.js" });
  vm.runInContext(jobFollowupLessonSource, env.context, { filename: "lessons/lesson-b2-job-followup/data.js" });
  vm.runInContext(competencySource, env.context, { filename: "shared/plata-competencies.js" });
  vm.runInContext(plannerSource, env.context, { filename: "shared/plata-planner.js" });
  vm.runInContext(dashboardSource, env.context, { filename: "dashboard.js" });

  const dueHtml = env.elements["#due-cards"].children.map(child => child.innerHTML).join("\n");
  const planHtml = env.elements["#practice-plan"].innerHTML;
  assert(/No weak mastery signals/.test(env.elements["#mastery-list"].innerHTML), "dashboard retires closed mastery signal");
  assert(/No weak root skills/.test(env.elements["#competency-list"].innerHTML), "dashboard retires closed root competency");
  assert(!/signal=passive-agency/.test(env.elements["#mastery-list"].innerHTML), "dashboard closed mastery list has no repair link");
  assert(!/signal=passive-agency/.test(dueHtml), "dashboard closed due cards have no repair link");
  assert(!/signal=passive-agency/.test(planHtml), "dashboard closed practice plan has no repair link");
  assert(!/Open repair scene/.test(dueHtml), "dashboard closed due cards do not use repair CTA");
}

async function runDynamicCatalogSmoke() {
  const env = makeContext(null, { dynamicLessonScripts: true });
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  seedWeakMasteryState(env);
  vm.runInContext(catalogSource, env.context, { filename: "shared/plata-catalog.js" });
  vm.runInContext(competencySource, env.context, { filename: "shared/plata-competencies.js" });
  vm.runInContext(plannerSource, env.context, { filename: "shared/plata-planner.js" });
  vm.runInContext(dashboardSource, env.context, { filename: "dashboard.js" });
  await Promise.resolve();
  await Promise.resolve();

  assert(env.context.PLATA_LESSON_B2_RADIATOR, "dashboard loads gold lesson data from catalog");
  assert(env.context.PLATA_LESSON_B2_JOB_FOLLOWUP, "dashboard loads job follow-up lesson data from catalog");
  assert(/Read passive agency/.test(env.elements["#mastery-list"].innerHTML), "dynamic catalog load renders mastery diagnostics");
  assert(/Agency and responsibility/.test(env.elements["#competency-list"].innerHTML), "dynamic catalog load renders competency diagnostics");
  assert(/Repair plan/.test(env.elements["#practice-plan"].innerHTML), "dynamic catalog load renders compiled practice plan");
}

async function run() {
  runEmptyDashboardSmoke();
  runSeededMasterySmoke();
  runClosedMasterySmoke();
  await runDynamicCatalogSmoke();

  console.log("ok - dashboard renders without runtime errors");
  console.log("ok - dashboard renders mastery signal diagnostics");
  console.log("ok - dashboard renders competency graph diagnostics");
  console.log("ok - dashboard renders compiled practice plans");
  console.log("ok - dashboard renders mastery repair paths");
  console.log("ok - dashboard retires closed mastery repairs");
  console.log("ok - dashboard loads lesson data from catalog");
}

run().catch(err => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});

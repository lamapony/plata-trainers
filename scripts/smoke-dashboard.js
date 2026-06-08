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
const evidenceSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-evidence.js"), "utf8");
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
    href: "",
    innerHTML: "",
    textContent: "",
    download: "",
    style: {},
    children: [],
    files: [],
    onchange: null,
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
    "#evidence-ledger": makeElement("div"),
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
    decodeURIComponent,
    location: {
      search: options.locationSearch || "",
      hash: options.locationHash || ""
    },
    URL: {
      createObjectURL(blob) {
        context.__lastObjectUrlBlob = blob;
        return "blob:mock";
      },
      revokeObjectURL() {}
    },
    Blob: function Blob(parts, options) {
      this.parts = parts || [];
      this.options = options || {};
      context.__lastBlob = this;
    },
    FileReader: function FileReader() {
      this.onload = null;
      this.result = "";
      this.readAsText = file => {
        const text = file ? (file.content || file.text || file.result || "") : "";
        this.result = text;
        if (typeof this.onload === "function") {
          this.onload({ target: { result: text } });
        }
      };
    },
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
  vm.runInContext(evidenceSource, env.context, { filename: "shared/plata-evidence.js" });
  vm.runInContext(dashboardSource, env.context, { filename: "dashboard.js" });
}

function invokeDashboardFunction(env, name) {
  if (typeof env.context[name] === "function") return env.context[name]();
  return vm.runInContext(`${name}()`, env.context, { filename: "dashboard.js" });
}

function parseLastExport(env) {
  const blob = env.context.__lastBlob;
  assert(blob && Array.isArray(blob.parts), "dashboard export creates a JSON blob");
  return JSON.parse(blob.parts.map(part => String(part)).join(""));
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
  assert(/Active plan/.test(env.elements["#practice-plan"].innerHTML), "dashboard labels the current tracked plan");
  assert(/plan-step-status open/.test(env.elements["#practice-plan"].innerHTML), "dashboard marks starter plan step as open");
  assert(/Start Lesson 01/.test(env.elements["#practice-plan"].innerHTML), "dashboard starter plan includes first lesson");
  assert(/plan=/.test(env.elements["#practice-plan"].innerHTML), "dashboard plan links carry active plan token");
  assert(/step=/.test(env.elements["#practice-plan"].innerHTML), "dashboard plan links carry step route id");
  assert(/Why this step/.test(env.elements["#practice-plan"].innerHTML), "dashboard renders planner explanations in the practice plan");
  assert(/no local progress yet/.test(env.elements["#practice-plan"].innerHTML), "dashboard explains starter plan evidence");
  assert(env.storage[env.context.PlataPlanner.practicePlanStorageKey], "dashboard persists active practice plan");
  assert(/No learning evidence yet/.test(env.elements["#evidence-ledger"].innerHTML), "dashboard renders empty evidence ledger state");
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
  vm.runInContext(evidenceSource, env.context, { filename: "shared/plata-evidence.js" });
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
  assert(/Active plan/.test(env.elements["#practice-plan"].innerHTML), "dashboard renders repair plan as the active tracked plan");
  assert(/plan-step-status open/.test(env.elements["#practice-plan"].innerHTML), "dashboard marks repair step as open before closure");
  assert(/Agency and responsibility/.test(env.elements["#practice-plan"].innerHTML), "dashboard repair plan shows root competency");
  assert(/highest open mastery signal/.test(env.elements["#practice-plan"].innerHTML), "dashboard explains why the repair step is first");
  assert(/Evidence: 1 wrong \/ 1 total/.test(env.elements["#practice-plan"].innerHTML), "dashboard renders repair evidence counts");
  assert(/mode=repair/.test(env.elements["#practice-plan"].innerHTML), "dashboard repair plan links repair mode");
  assert(/plan=/.test(env.elements["#practice-plan"].innerHTML), "dashboard repair plan links carry active plan token");
  assert(/step=/.test(env.elements["#practice-plan"].innerHTML), "dashboard repair plan links carry step route id");
  assert(env.storage[env.context.PlataPlanner.practicePlanStorageKey], "dashboard stores repair plan tracker state");
  assert(/Read passive agency/.test(env.elements["#due-cards"].children[0].innerHTML), "practice recommendation highlights weak mastery");
  assert(/Open repair scene/.test(env.elements["#due-cards"].children[0].innerHTML), "practice recommendation opens the repair scene");
  assert(/Open mastery signal/.test(env.elements["#evidence-ledger"].innerHTML), "dashboard evidence ledger shows open mastery signals");
  assert(/Read passive agency/.test(env.elements["#evidence-ledger"].innerHTML), "dashboard evidence ledger names the open signal");
  assert(/1 wrong \/ 1 total/.test(env.elements["#evidence-ledger"].innerHTML), "dashboard evidence ledger includes signal counts");
}

function runStartedPlanSmoke() {
  const env = makeContext();
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  seedWeakMasteryState(env);
  vm.runInContext(catalogSource, env.context, { filename: "shared/plata-catalog.js" });
  vm.runInContext(radiatorLessonSource, env.context, { filename: "lessons/lesson-b2-radiator/data.js" });
  vm.runInContext(jobFollowupLessonSource, env.context, { filename: "lessons/lesson-b2-job-followup/data.js" });
  vm.runInContext(competencySource, env.context, { filename: "shared/plata-competencies.js" });
  vm.runInContext(plannerSource, env.context, { filename: "shared/plata-planner.js" });
  vm.runInContext(evidenceSource, env.context, { filename: "shared/plata-evidence.js" });

  const planner = env.context.PlataPlanner;
  const plan = planner.savePracticePlan({
    kind: "repair",
    title: "Repair plan",
    copy: "Track an active repair step.",
    steps: [{
      number: 1,
      kind: "repair",
      trainerId: "lesson-b2-radiator-register",
      title: "Repair Read passive agency",
      copy: "Replay the source scene.",
      primaryLabel: "Open repair scene",
      primaryHref: "./lessons/lesson-b2-radiator/?mode=repair&signal=passive-agency#official-reply-passive",
      minutes: "4-6 min"
    }]
  });
  plan.steps[0].startedAt = "2026-06-08T00:00:00.000Z";
  planner.savePracticePlan(plan);

  vm.runInContext(dashboardSource, env.context, { filename: "dashboard.js" });

  assert(/plan-step repair active/.test(env.elements["#practice-plan"].innerHTML), "dashboard renders started repair as active");
  assert(/In progress/.test(env.elements["#practice-plan"].innerHTML), "dashboard labels started plan step in progress");
  assert(/plan-step-ledger/.test(env.elements["#practice-plan"].innerHTML), "dashboard renders started plan ledger");
  assert(/Started/.test(env.elements["#practice-plan"].innerHTML), "dashboard explains when a plan step started");
}

function runPrimaryPlanActionSmoke() {
  const env = makeContext();
  loadKernelAndDashboard(env);
  const planner = env.context.PlataPlanner;
  planner.savePracticePlan({
    kind: "continue",
    title: "Two-step plan",
    copy: "Continue the first unfinished step.",
    steps: [
      {
        number: 1,
        kind: "continue",
        trainerId: "lesson-b2-radiator-register",
        trainerName: "B2: Register & Particles",
        primaryLabel: "Review",
        primaryHref: "./lessons/lesson-b2-radiator/",
        completedAt: "2026-06-08T00:10:00.000Z"
      },
      {
        number: 2,
        kind: "continue",
        trainerId: "vocab",
        trainerName: "Vocab SR",
        primaryLabel: "Open vocab",
        primaryHref: "./vocab-sr/",
        minutes: "5 min"
      }
    ]
  });
  invokeDashboardFunction(env, "renderDashboard");
  const html = env.elements["#practice-plan"].innerHTML;
  assert(/plan-primary-action/.test(html), "dashboard renders one primary plan action");
  assert(/Start next step/.test(html), "dashboard primary action starts the next unfinished step");
  assert(/Step 2 of 2/.test(html), "dashboard primary action identifies the next plan step");
  assert(html.includes("./vocab-sr/"), "dashboard primary action links to the next unfinished step");
}

function runPlanReturnReceiptSmoke() {
  const env = makeContext();
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  vm.runInContext(catalogSource, env.context, { filename: "shared/plata-catalog.js" });
  vm.runInContext(radiatorLessonSource, env.context, { filename: "lessons/lesson-b2-radiator/data.js" });
  vm.runInContext(jobFollowupLessonSource, env.context, { filename: "lessons/lesson-b2-job-followup/data.js" });
  vm.runInContext(competencySource, env.context, { filename: "shared/plata-competencies.js" });
  vm.runInContext(plannerSource, env.context, { filename: "shared/plata-planner.js" });
  vm.runInContext(evidenceSource, env.context, { filename: "shared/plata-evidence.js" });
  const planner = env.context.PlataPlanner;
  const plan = planner.savePracticePlan({
    kind: "continue",
    title: "Two-step plan",
    copy: "Return from a completed step.",
    steps: [
      {
        number: 1,
        kind: "continue",
        trainerId: "lesson-b2-radiator-register",
        trainerName: "B2: Register & Particles",
        title: "Repair workplace answer",
        primaryLabel: "Review",
        primaryHref: "./lessons/lesson-b2-radiator/",
        completedAt: "2026-06-08T00:10:00.000Z"
      },
      {
        number: 2,
        kind: "continue",
        trainerId: "vocab",
        trainerName: "Vocab SR",
        title: "Vocabulary stabilizer",
        primaryLabel: "Open vocab",
        primaryHref: "./vocab-sr/",
        minutes: "5 min"
      }
    ]
  });
  env.context.location.search = `?ledger-return=1&plan=${encodeURIComponent(plan.planToken)}&step=${encodeURIComponent(plan.steps[0].routeId)}`;
  vm.runInContext(dashboardSource, env.context, { filename: "dashboard.js" });
  const html = env.elements["#practice-plan"].innerHTML;
  assert(/plan-return-receipt/.test(html), "dashboard renders return receipt after a plan step handoff");
  assert(/Step 1 recorded/.test(html), "dashboard return receipt confirms the completed step");
  assert(/Repair workplace answer is in the plan ledger/.test(html), "dashboard return receipt names the returned step");
  assert(/Continue next step/.test(html), "dashboard return receipt offers the next step");
  assert(/Step 2 of 2/.test(html), "dashboard return receipt identifies the next step");
  assert(/Chosen from the saved practice plan/.test(html), "dashboard return receipt explains the next saved step");
  assert(html.includes("./vocab-sr/"), "dashboard return receipt links to the next unfinished step");
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
  vm.runInContext(evidenceSource, env.context, { filename: "shared/plata-evidence.js" });
  vm.runInContext(dashboardSource, env.context, { filename: "dashboard.js" });

  const dueHtml = env.elements["#due-cards"].children.map(child => child.innerHTML).join("\n");
  const planHtml = env.elements["#practice-plan"].innerHTML;
  assert(/No weak mastery signals/.test(env.elements["#mastery-list"].innerHTML), "dashboard retires closed mastery signal");
  assert(/No weak root skills/.test(env.elements["#competency-list"].innerHTML), "dashboard retires closed root competency");
  assert(!/signal=passive-agency/.test(env.elements["#mastery-list"].innerHTML), "dashboard closed mastery list has no repair link");
  assert(!/signal=passive-agency/.test(dueHtml), "dashboard closed due cards have no repair link");
  assert(!/signal=passive-agency/.test(planHtml), "dashboard closed practice plan has no repair link");
  assert(!/Open repair scene/.test(dueHtml), "dashboard closed due cards do not use repair CTA");
  assert(/Closed repair/.test(env.elements["#evidence-ledger"].innerHTML), "dashboard evidence ledger shows closed repairs");
  assert(/Read passive agency/.test(env.elements["#evidence-ledger"].innerHTML), "dashboard evidence ledger names the closed signal");
  assert(/Name the missing actor/.test(env.elements["#evidence-ledger"].innerHTML), "dashboard evidence ledger shows repair closure action");
}

async function runDynamicCatalogSmoke() {
  const env = makeContext(null, { dynamicLessonScripts: true });
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  seedWeakMasteryState(env);
  vm.runInContext(catalogSource, env.context, { filename: "shared/plata-catalog.js" });
  vm.runInContext(competencySource, env.context, { filename: "shared/plata-competencies.js" });
  vm.runInContext(plannerSource, env.context, { filename: "shared/plata-planner.js" });
  vm.runInContext(evidenceSource, env.context, { filename: "shared/plata-evidence.js" });
  vm.runInContext(dashboardSource, env.context, { filename: "dashboard.js" });
  await Promise.resolve();
  await Promise.resolve();

  assert(env.context.PLATA_LESSON_B2_RADIATOR, "dashboard loads gold lesson data from catalog");
  assert(env.context.PLATA_LESSON_B2_JOB_FOLLOWUP, "dashboard loads job follow-up lesson data from catalog");
  assert(/Read passive agency/.test(env.elements["#mastery-list"].innerHTML), "dynamic catalog load renders mastery diagnostics");
  assert(/Agency and responsibility/.test(env.elements["#competency-list"].innerHTML), "dynamic catalog load renders competency diagnostics");
  assert(/Repair plan/.test(env.elements["#practice-plan"].innerHTML), "dynamic catalog load renders compiled practice plan");
}

function runPortableProfileSmoke() {
  const exportEnv = makeContext();
  loadKernelAndDashboard(exportEnv);
  const planner = exportEnv.context.PlataPlanner;
  const plan = planner.readPracticePlan();
  assert(plan && plan.steps && plan.steps.length, "dashboard has an active plan to export");
  plan.steps[0].startedAt = "2026-06-08T00:00:00.000Z";
  plan.steps[0].completedAt = "2026-06-08T00:10:00.000Z";
  plan.steps[0].completionEvidence = {
    reason: "smoke-test",
    trainerId: plan.steps[0].trainerId,
    correct: true
  };
  planner.savePracticePlan(plan);
  invokeDashboardFunction(exportEnv, "renderDashboard");
  assert(/plan-progress/.test(exportEnv.elements["#practice-plan"].innerHTML), "dashboard renders practice plan progress");
  assert(/plan-step-ledger/.test(exportEnv.elements["#practice-plan"].innerHTML), "dashboard renders practice plan execution ledger");
  assert(/Completed/.test(exportEnv.elements["#practice-plan"].innerHTML), "dashboard explains when a plan step completed");
  assert(/Successful completion recorded/.test(exportEnv.elements["#practice-plan"].innerHTML), "dashboard explains plan completion evidence");

  invokeDashboardFunction(exportEnv, "exportAll");
  const payload = parseLastExport(exportEnv);
  assert(payload.profileSchemaVersion === 1, "dashboard export marks profile schema version");
  assert(payload.practicePlan && payload.practicePlan.steps.length, "dashboard export includes active practice plan");
  assert(payload.practicePlan.steps[0].completedAt === plan.steps[0].completedAt, "dashboard export includes plan execution ledger");

  const importEnv = makeContext();
  loadKernelAndDashboard(importEnv);
  invokeDashboardFunction(importEnv, "importAll");
  importEnv.elements["#import-file"].files = [{ content: JSON.stringify(payload) }];
  importEnv.elements["#import-file"].onchange();
  const importedPlan = importEnv.context.PlataPlanner.readPracticePlan();
  assert(importedPlan && importedPlan.steps.length, "dashboard import restores active practice plan");
  assert(importedPlan.steps[0].completedAt === payload.practicePlan.steps[0].completedAt, "dashboard import restores plan execution ledger");

  const legacyEnv = makeContext();
  loadKernelAndDashboard(legacyEnv);
  assert(legacyEnv.context.PlataPlanner.readPracticePlan(), "dashboard starts with a plan before legacy import");
  invokeDashboardFunction(legacyEnv, "importAll");
  legacyEnv.elements["#import-file"].files = [{ content: JSON.stringify({ schemaVersion: 2, trainers: {} }) }];
  legacyEnv.elements["#import-file"].onchange();
  assert(!legacyEnv.context.PlataPlanner.readPracticePlan(), "legacy dashboard import clears stale active plan");
}

async function run() {
  runEmptyDashboardSmoke();
  runSeededMasterySmoke();
  runStartedPlanSmoke();
  runPrimaryPlanActionSmoke();
  runPlanReturnReceiptSmoke();
  runClosedMasterySmoke();
  await runDynamicCatalogSmoke();
  runPortableProfileSmoke();

  console.log("ok - dashboard renders without runtime errors");
  console.log("ok - dashboard renders mastery signal diagnostics");
  console.log("ok - dashboard renders competency graph diagnostics");
  console.log("ok - dashboard renders compiled practice plans");
  console.log("ok - dashboard persists active practice-plan tracking");
  console.log("ok - dashboard renders active practice-plan execution state");
  console.log("ok - dashboard promotes the next actionable practice-plan step");
  console.log("ok - dashboard confirms plan-step returns from trainer routes");
  console.log("ok - dashboard explains why planner steps were selected");
  console.log("ok - dashboard explains practice-plan execution evidence");
  console.log("ok - dashboard renders the learning evidence ledger");
  console.log("ok - dashboard renders mastery repair paths");
  console.log("ok - dashboard retires closed mastery repairs");
  console.log("ok - dashboard loads lesson data from catalog");
  console.log("ok - dashboard exports and imports portable practice profiles");
}

run().catch(err => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});

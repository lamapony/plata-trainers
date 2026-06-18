#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..");
const catalogSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-catalog.js"), "utf8");
const kernelSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-kernel.js"), "utf8");
const plannerSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-planner.js"), "utf8");
const bridgeSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-repair-bridge.js"), "utf8");
const radiatorSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-radiator", "data.js"), "utf8");
const ordstillingSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-ordstilling", "data.js"), "utf8");
const doctorSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-a2-doctor", "data.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadContext() {
  const storage = {};
  const context = {
    console,
    Date,
    JSON,
    Object,
    Math,
    String,
    Array,
    encodeURIComponent,
    localStorage: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
      },
      setItem(key, value) {
        storage[key] = String(value);
      },
      removeItem(key) {
        delete storage[key];
      }
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(kernelSource, context, { filename: "shared/plata-kernel.js" });
  vm.runInContext(catalogSource, context, { filename: "shared/plata-catalog.js" });
  vm.runInContext(plannerSource, context, { filename: "shared/plata-planner.js" });
  vm.runInContext(bridgeSource, context, { filename: "shared/plata-repair-bridge.js" });
  vm.runInContext(radiatorSource, context, { filename: "lessons/lesson-b2-radiator/data.js" });
  vm.runInContext(ordstillingSource, context, { filename: "lessons/lesson-b2-ordstilling/data.js" });
  vm.runInContext(doctorSource, context, { filename: "lessons/lesson-a2-doctor/data.js" });
  return { context, storage };
}

function run() {
  const { context } = loadContext();
  const bridge = context.PlataRepairBridge;
  const catalog = context.PlataCatalog;
  const lesson = context.PLATA_LESSON_B2_RADIATOR;
  const scene = lesson.scenes.find(item => item.id === "official-reply-passive");
  assert(scene, "radiator scene missing for bridge smoke");

  const signal = bridge.resolveMissSignal(lesson, scene, { correct: false, id: "too-trusting" });
  assert(signal === "passive-agency", "miss signal resolves from scene mastery tags");

  const bundle = bridge.remediationBundle(lesson, scene, signal, "../../");
  assert(bundle && bundle.drillRepair, "passive-agency maps to register drill repair");
  assert(bundle.drillRepair.href.includes("../../register-drill/"), "drill href is prefixed for lesson runtime");
  assert(bundle.drillRepair.href.includes("signal=passive-agency"), "drill href carries signal deep link");
  assert(bundle.drillRepair.href.includes("from=lesson-b2-radiator-register"), "drill href cites source lesson");

  const panel = bridge.renderMissRepairPanel({ lesson, scene, signalTag: signal, rootPrefix: "../../" });
  assert(/Match → Gym/.test(panel), "miss repair panel names the product loop");
  assert(/register-drill/.test(panel), "miss repair panel links register drill");

  const plan = bridge.persistMissPlan({ lesson, scene, signalTag: signal, rootPrefix: "../../" });
  assert(plan && plan.steps.length === 2, "miss plan compiles scene repair + drill follow-up");
  assert(plan.steps[0].kind === "repair", "first plan step repairs the scene");
  assert(plan.steps[1].kind === "drill-repair", "second plan step opens mapped drill");
  assert(plan.steps[1].primaryHref.includes("register-drill"), "saved drill step keeps drill href");

  const ordLink = catalog.drillRepairLink(
    catalog.trainers.find(item => item.id === "ordstilling"),
    "v2-placement",
    "lesson-b2-ordstilling",
    { cat: "v2" }
  );
  assert(ordLink.includes("signal=v2-placement"), "catalog drill link preserves signal param");
  assert(ordLink.includes("cat=v2"), "catalog drill link preserves category param");
  assert(ordLink.includes("from=lesson-b2-ordstilling"), "catalog drill link preserves source lesson");

  const ordLesson = context.PLATA_LESSON_B2_ORDSTILLING;
  const ordScene = ordLesson.scenes.find(item => item.id === "signup-email");
  assert(ordScene, "ordstilling scene missing for bridge smoke");
  const ordSignal = bridge.resolveMissSignal(ordLesson, ordScene, { correct: false, id: "no-inversion" });
  assert(ordSignal === "inversion-fronted-adverbial", "ordstilling miss resolves inversion-fronted-adverbial signal");
  const ordBundle = bridge.remediationBundle(ordLesson, ordScene, ordSignal, "../../");
  assert(ordBundle && ordBundle.drillRepair, "inversion-fronted-adverbial maps to ordstilling drill repair");
  assert(ordBundle.drillRepair.href.includes("../../ordstilling-drill/"), "ordstilling drill href is prefixed");
  assert(ordBundle.drillRepair.href.includes("cat=inversion"), "ordstilling drill href carries category deep link");
  const ordPlan = bridge.persistMissPlan({ lesson: ordLesson, scene: ordScene, signalTag: ordSignal, rootPrefix: "../../" });
  assert(ordPlan && ordPlan.steps.length === 2, "ordstilling miss plan includes scene + drill steps");

  const docLesson = context.PLATA_LESSON_A2_DOCTOR;
  const docScene = docLesson.scenes.find(item => item.id === "symptom-severity");
  assert(docScene, "doctor severity scene missing for bridge smoke");
  const docOption = docScene.options.find(item => item.id === "too-vague");
  assert(docOption, "doctor severity miss option missing");
  const docSignal = bridge.resolveMissSignal(docLesson, docScene, docOption);
  assert(docSignal === "symptom-severity", "doctor miss resolves symptom-severity signal");
  const docBundle = bridge.remediationBundle(docLesson, docScene, docSignal, "../../");
  assert(docBundle && docBundle.drillRepair, "symptom-severity maps to skrive drill repair");
  assert(docBundle.drillRepair.href.includes("../../skrive-drill/"), "doctor drill href targets skrive drill");
  assert(docBundle.drillRepair.href.includes("cat=sundhed"), "doctor drill href opens sundhed category");
  assert(docBundle.drillRepair.href.includes("from=lesson-a2-doctor"), "doctor drill href cites source lesson");
  assert(/patientportalen|apotek/i.test(docBundle.drillRepair.action), "doctor drill action explains spoken-to-written transfer");
  const docPanel = bridge.renderMissRepairPanel({ lesson: docLesson, scene: docScene, signalTag: docSignal, rootPrefix: "../../" });
  assert(/skrive-drill/.test(docPanel), "doctor miss repair panel links skrive drill");
  const docPlan = bridge.persistMissPlan({ lesson: docLesson, scene: docScene, signalTag: docSignal, rootPrefix: "../../" });
  assert(docPlan && docPlan.steps.length === 2, "doctor miss plan includes scene + skrive drill steps");
  assert(docPlan.steps[1].primaryHref.includes("skrive-drill"), "doctor saved drill step keeps skrive href");

  console.log("ok - repair bridge resolves miss signals and drill deep links");
  console.log("ok - repair bridge persists scene + drill practice plans");
}

run();

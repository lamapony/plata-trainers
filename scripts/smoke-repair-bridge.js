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

  console.log("ok - repair bridge resolves miss signals and drill deep links");
  console.log("ok - repair bridge persists scene + drill practice plans");
}

run();

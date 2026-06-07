#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const kernelSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-kernel.js"), "utf8");
const catalogSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-catalog.js"), "utf8");
const plannerSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-planner.js"), "utf8");
const radiatorLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-radiator", "data.js"), "utf8");
const jobFollowupLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-job-followup", "data.js"), "utf8");
const homeSource = fs.readFileSync(path.join(repoRoot, "home.js"), "utf8");
const dynamicLessonSources = {
  "./lessons/lesson-b2-radiator/data.js": radiatorLessonSource,
  "./lessons/lesson-b2-job-followup/data.js": jobFollowupLessonSource
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeElement(tagName, selector) {
  const element = {
    tagName,
    selector,
    className: "",
    textContent: "",
    innerHTML: "",
    href: "",
    children: [],
    parentElement: null,
    addEventListener() {},
    appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
      return child;
    },
    insertBefore(child, reference) {
      child.parentElement = this;
      const index = reference ? this.children.indexOf(reference) : -1;
      if (index === -1) this.children.push(child);
      else this.children.splice(index, 0, child);
      return child;
    },
    remove() {
      if (!this.parentElement) return;
      this.parentElement.children = this.parentElement.children.filter(child => child !== this);
      this.parentElement = null;
    },
    querySelector(query) {
      if (query === ".card-link") return this.children.find(child => child.className === "card-link") || null;
      if (query === ".friendly-progress") return this.children.find(child => child.className === "friendly-progress") || null;
      return null;
    }
  };
  return element;
}

function makeTrainerCard(id) {
  const card = makeElement("article", `[data-trainer-id="${id}"]`);
  card.trainerId = id;
  const link = makeElement("a", ".card-link");
  link.className = "card-link";
  link.textContent = "Open →";
  card.appendChild(link);
  return card;
}

function makeContext(initialStorage) {
  const storage = Object.assign({}, initialStorage || {});
  const ids = {
    "#home-primary-action": makeElement("a", "#home-primary-action"),
    "#home-start-title": makeElement("h2", "#home-start-title"),
    "#home-start-copy": makeElement("p", "#home-start-copy"),
    "#home-start-link": makeElement("a", "#home-start-link"),
    "#home-start-meta": makeElement("p", "#home-start-meta")
  };
  const cards = [
    "bojning",
    "ordstilling",
    "vocab",
    "lesson-01-arrival",
    "lesson-b2-radiator-register",
    "lesson-b2-job-followup"
  ].map(makeTrainerCard);

  const context = {
    console,
    Date,
    JSON,
    Object,
    Math,
    String,
    Array,
    document: {
      readyState: "complete",
      head: null,
      querySelector(selector) {
        if (ids[selector]) return ids[selector];
        const match = /^\[data-trainer-id="([^"]+)"\]$/.exec(selector);
        if (match) return cards.find(card => card.trainerId === match[1]) || null;
        return null;
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
      }
    }
  };
  context.document.head = makeElement("head", "head");
  context.document.head.appendChild = function appendChild(child) {
    this.children.push(child);
    if (dynamicLessonSources[child.src]) {
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
  return { context, ids, cards, storage };
}

function loadKernelAndCatalog(env) {
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  vm.runInContext(catalogSource, env.context, { filename: "shared/plata-catalog.js" });
  vm.runInContext(plannerSource, env.context, { filename: "shared/plata-planner.js" });
}

function seedProgress(env, trainerId) {
  const kernel = env.context.PlataKernel;
  const state = kernel.freshState(trainerId);
  kernel.recordAttempt(state, {
    itemId: "friendly-smoke",
    correct: true,
    tags: ["smoke"],
    mode: "lesson",
    expected: "expected",
    given: "expected"
  });
  env.storage[kernel.stateKey(trainerId)] = JSON.stringify(state);
}

function seedWeakMastery(env) {
  const kernel = env.context.PlataKernel;
  const state = kernel.freshState("lesson-b2-radiator-register");
  kernel.recordAttempt(state, {
    itemId: "workplace-understatement",
    correct: false,
    tags: ["B2", "understatement-with-agency"],
    mode: "lesson",
    expected: "Jeg kan sende et kort forslag inden fredag...",
    given: "Det er nok fint."
  });
  env.storage[kernel.stateKey("lesson-b2-radiator-register")] = JSON.stringify(state);
}

async function runHome(env) {
  vm.runInContext(homeSource, env.context, { filename: "home.js" });
  await Promise.resolve();
  await Promise.resolve();
}

async function runEmptyHomeSmoke() {
  const env = makeContext();
  loadKernelAndCatalog(env);
  await runHome(env);

  assert(env.ids["#home-start-title"].textContent === "New here?", "home recommends starter path for new users");
  assert(env.ids["#home-start-link"].href === "./lessons/lesson-01/", "home starter link points to Lesson 01");
  assert(env.ids["#home-primary-action"].textContent === "Start Lesson 01", "home primary CTA starts Lesson 01");
  const lessonCard = env.cards.find(card => card.trainerId === "lesson-01-arrival");
  assert(/Not started/.test(lessonCard.querySelector(".friendly-progress").innerHTML), "home labels unstarted trainer cards");
}

async function runProgressHomeSmoke() {
  const env = makeContext();
  loadKernelAndCatalog(env);
  seedProgress(env, "vocab");
  await runHome(env);

  assert(env.ids["#home-start-title"].textContent === "Continue Vocab SR", "home recommends continuing existing progress");
  assert(env.ids["#home-start-link"].href === "./vocab-sr/", "home continue link points to latest trainer");
  assert(env.ids["#home-primary-action"].textContent === "Continue", "home primary CTA continues the latest drill");
  const vocabCard = env.cards.find(card => card.trainerId === "vocab");
  assert(/Continue:<\/strong> 1 attempt/.test(vocabCard.querySelector(".friendly-progress").innerHTML), "home labels started trainer cards");
  assert(vocabCard.querySelector(".card-link").textContent === "Continue →", "home card CTA changes to continue");
}

async function runWeakMasteryHomeSmoke() {
  const env = makeContext();
  loadKernelAndCatalog(env);
  seedWeakMastery(env);
  await runHome(env);

  assert(env.ids["#home-start-title"].textContent === "Repair Use understatement with agency", "home promotes planner repair");
  assert(/mode=repair/.test(env.ids["#home-start-link"].href), "home repair link opens repair mode");
  assert(/signal=understatement-with-agency/.test(env.ids["#home-start-link"].href), "home repair link carries signal");
  assert(/workplace-understatement/.test(env.ids["#home-start-link"].href), "home repair link targets source scene");
  assert(env.ids["#home-primary-action"].textContent === "Open repair scene", "home primary CTA uses repair action");
}

async function run() {
  await runEmptyHomeSmoke();
  await runProgressHomeSmoke();
  await runWeakMasteryHomeSmoke();

  console.log("ok - home launcher recommends a starter path");
  console.log("ok - home launcher continues existing local progress");
  console.log("ok - home launcher promotes planner repair paths");
}

run().catch(err => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});

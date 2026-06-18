#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const kernelSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-kernel.js"), "utf8");
const catalogSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-catalog.js"), "utf8");
const competencySource = fs.readFileSync(path.join(repoRoot, "shared", "plata-competencies.js"), "utf8");
const plannerSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-planner.js"), "utf8");
const radiatorLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-radiator", "data.js"), "utf8");
const jobFollowupLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-job-followup", "data.js"), "utf8");
const lesson01Source = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-01", "data.js"), "utf8");
const ordstillingLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-ordstilling", "data.js"), "utf8");
const boligLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b1-bolig", "data.js"), "utf8");
const homeSource = fs.readFileSync(path.join(repoRoot, "home.js"), "utf8");
const indexHtml = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
const dynamicLessonSources = {
  "./lessons/lesson-b2-radiator/data.js": radiatorLessonSource,
  "./lessons/lesson-b2-job-followup/data.js": jobFollowupLessonSource,
  "./lessons/lesson-01/data.js": lesson01Source,
  "./lessons/lesson-b2-ordstilling/data.js": ordstillingLessonSource,
  "./lessons/lesson-b1-bolig/data.js": boligLessonSource
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
    trainerId: "",
    addEventListener() {},
    setAttribute(name, value) {
      if (name === "data-trainer-id") this.trainerId = value;
      if (name === "class") this.className = value;
    },
    getAttribute(name) {
      if (name === "data-trainer-id") return this.trainerId || null;
      return null;
    },
    appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
      return child;
    },
    removeChild(child) {
      this.children = this.children.filter(item => item !== child);
      if (child.parentElement === this) child.parentElement = null;
      return child;
    },
    get firstChild() {
      return this.children[0] || null;
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
    },
    scrollIntoView(options) {
      this.scrollIntoViewCalls = this.scrollIntoViewCalls || [];
      this.scrollIntoViewCalls.push(options || {});
    }
  };
  return element;
}

function findTrainerCard(root, trainerId, galleryCards) {
  const fromGallery = galleryCards.find(card => card.trainerId === trainerId);
  if (fromGallery) return fromGallery;
  if (!root || !root.children) return null;
  return root.children.find(child => child.trainerId === trainerId) || null;
}

function makeContext(initialStorage) {
  const storage = Object.assign({}, initialStorage || {});
  const galleryCards = [];
  const narrativeGallery = makeElement("div", "#narrative-gallery");
  const drillGallery = makeElement("div", "#drill-gallery");
  const ids = {
    "#home-primary-action": (function () {
      const el = makeElement("a", "#home-primary-action");
      el.textContent = "Try B2 follow-up lesson";
      el.href = "./lessons/lesson-b2-job-followup/";
      return el;
    })(),
    "#home-start-title": makeElement("h2", "#home-start-title"),
    "#home-start-copy": makeElement("p", "#home-start-copy"),
    "#home-start-link": makeElement("a", "#home-start-link"),
    "#home-start-meta": makeElement("p", "#home-start-meta"),
    "#evaluate": makeElement("section", "#evaluate"),
    "#narrative-gallery": narrativeGallery,
    "#drill-gallery": drillGallery,
    "#your-practice": makeElement("section", "#your-practice"),
    "#home-headroom": makeElement("div", "#home-headroom")
  };

  function trackGalleryCard(child) {
    if (child && child.trainerId) galleryCards.push(child);
  }

  narrativeGallery.appendChild = function appendChild(child) {
    trackGalleryCard(child);
    child.parentElement = this;
    this.children.push(child);
    return child;
  };
  drillGallery.appendChild = function appendChild(child) {
    trackGalleryCard(child);
    child.parentElement = this;
    this.children.push(child);
    return child;
  };
  function removeGalleryChild(child) {
    this.children = this.children.filter(item => item !== child);
    const index = galleryCards.indexOf(child);
    if (index !== -1) galleryCards.splice(index, 1);
    if (child.parentElement === this) child.parentElement = null;
    return child;
  }
  narrativeGallery.removeChild = removeGalleryChild;
  drillGallery.removeChild = removeGalleryChild;

  const eventListeners = {};
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
        if (match) return galleryCards.find(card => card.trainerId === match[1]) || null;
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
    location: {
      hash: "#evaluate"
    },
    addEventListener(name, handler) {
      eventListeners[name] = handler;
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
  return { context, ids, galleryCards, storage, eventListeners };
}

function loadKernelAndCatalog(env) {
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  vm.runInContext(catalogSource, env.context, { filename: "shared/plata-catalog.js" });
  vm.runInContext(competencySource, env.context, { filename: "shared/plata-competencies.js" });
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

function seedClosedWeakMastery(env) {
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
  kernel.recordAttempt(state, {
    itemId: "workplace-understatement",
    correct: true,
    tags: ["B2", "understatement-with-agency"],
    mode: "repair",
    expected: "Jeg kan sende et kort forslag inden fredag...",
    given: "Jeg kan sende et kort forslag inden fredag."
  });
  kernel.recordRepairClosure(state, {
    signal: "understatement-with-agency",
    itemId: "workplace-understatement",
    sceneId: "workplace-understatement",
    lessonId: "lesson-b2-radiator-register",
    label: "Use understatement with agency",
    action: "Add one concrete next action",
    correct: true
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

  assert(env.ids["#home-start-title"].textContent === "First visit?", "home start card recommends tutorial for new users");
  assert(env.ids["#home-start-link"].href === "./lessons/lesson-01/", "home starter link points to Lesson 01");
  assert(env.ids["#home-start-link"].textContent === "Start tutorial", "home start card CTA opens tutorial");
  assert(env.ids["#home-primary-action"].textContent === "Try B2 follow-up lesson", "home hero primary CTA stays on B2 lesson for new users");
  assert(env.ids["#home-primary-action"].href === "./lessons/lesson-b2-job-followup/", "home hero primary CTA links to B2 job follow-up");
  assert(env.ids["#evaluate"].scrollIntoViewCalls && env.ids["#evaluate"].scrollIntoViewCalls.length === 1, "home restores hash scroll after dynamic launcher rendering");
  assert(env.ids["#evaluate"].scrollIntoViewCalls[0].behavior === "auto", "home hash scroll should use deterministic behavior");
  assert(typeof env.eventListeners.hashchange === "function", "home restores hash scroll after same-page hash changes");
  env.ids["#evaluate"].scrollIntoViewCalls = [];
  env.eventListeners.hashchange();
  assert(env.ids["#evaluate"].scrollIntoViewCalls.length === 1, "home hashchange listener scrolls to the evaluator path");
  assert(env.galleryCards.filter(card => card.parentElement === env.ids["#narrative-gallery"]).length === 5, "home renders five narrative lessons from catalog");
  assert(env.galleryCards.filter(card => card.parentElement === env.ids["#drill-gallery"]).length === 5, "home renders five drills from catalog");
  const lessonCard = env.galleryCards.find(card => card.trainerId === "lesson-01-arrival");
  assert(lessonCard, "home renders narrative gallery cards from catalog");
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
  const vocabCard = env.galleryCards.find(card => card.trainerId === "vocab");
  assert(vocabCard, "home renders drill gallery cards from catalog");
  assert(/Continue:<\/strong> 1 attempt/.test(vocabCard.querySelector(".friendly-progress").innerHTML), "home labels started trainer cards");
  assert(vocabCard.querySelector(".card-link").textContent === "Continue →", "home card CTA changes to continue");
}

async function runActivePlanHomeSmoke() {
  const env = makeContext();
  loadKernelAndCatalog(env);
  const planner = env.context.PlataPlanner;
  planner.savePracticePlan({
    kind: "continue",
    title: "Two-step plan",
    copy: "Continue the active plan.",
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
  await runHome(env);

  assert(env.ids["#home-start-title"].textContent === "Continue active plan", "home prioritizes an active practice plan");
  assert(env.ids["#home-start-link"].textContent === "Start next step", "home active plan CTA starts next unfinished step");
  assert(env.ids["#home-primary-action"].textContent === "Start next step", "home primary action follows active plan");
  assert(env.ids["#home-start-link"].href.includes("./vocab-sr/"), "home active plan link points to next unfinished step");
  assert(env.ids["#home-start-link"].href.includes("plan="), "home active plan link carries plan token");
  assert(/step 2 of 2/.test(env.ids["#home-start-meta"].textContent), "home active plan meta identifies the step");
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
  assert(/Root competency: Agency and responsibility/.test(env.ids["#home-start-meta"].textContent), "home repair explains root competency");
}

async function runClosedMasteryHomeSmoke() {
  const env = makeContext();
  loadKernelAndCatalog(env);
  seedClosedWeakMastery(env);
  await runHome(env);

  assert(!env.ids["#home-start-title"].textContent.startsWith("Repair "), "home does not promote closed repair");
  assert(!/mode=repair/.test(env.ids["#home-start-link"].href), "home closed signal link does not open repair mode");
  assert(env.ids["#home-primary-action"].textContent !== "Open repair scene", "home closed signal does not use repair CTA");
}

function runHomeMarkupSmoke() {
  assert(indexHtml.includes("id=\"evaluate\""), "home page should expose the evaluator path section");
  assert(indexHtml.includes("id=\"narrative-gallery\""), "home page should expose catalog-driven narrative gallery container");
  assert(indexHtml.includes("id=\"drill-gallery\""), "home page should expose catalog-driven drill gallery container");
  assert(indexHtml.includes("id=\"pwa-status\""), "home page should expose learner-visible PWA status");
  assert(indexHtml.includes("Narrative lesson gallery"), "home page should keep narrative gallery section copy");
  assert(indexHtml.includes("Evaluate in 60 seconds"), "home hero should link to the evaluator path");
  assert(indexHtml.includes("./dashboard.html?demo=learner"), "home evaluator path should link the demo learner dashboard");
  assert(indexHtml.includes("./proof.html#proof-walkthrough-title"), "home evaluator path should link the proof walkthrough");
  assert(indexHtml.includes("./proof.html#proof-guided-title"), "home evaluator path should link guided proof");
  assert(!indexHtml.includes("href=\"./reports/"), "home page should not link Pages-only reports from the root static page");
}

async function run() {
  runHomeMarkupSmoke();
  await runEmptyHomeSmoke();
  await runProgressHomeSmoke();
  await runActivePlanHomeSmoke();
  await runWeakMasteryHomeSmoke();
  await runClosedMasteryHomeSmoke();

  console.log("ok - home page renders catalog-driven lesson gallery");
  console.log("ok - home page exposes learner-visible PWA status");
  console.log("ok - home page exposes the one-click evaluator path");
  console.log("ok - home launcher recommends a starter path");
  console.log("ok - home launcher continues existing local progress");
  console.log("ok - home launcher resumes active practice plans");
  console.log("ok - home launcher promotes planner repair paths");
  console.log("ok - home launcher retires closed repair paths");
}

run().catch(err => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});

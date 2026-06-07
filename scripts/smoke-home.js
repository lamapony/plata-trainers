#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const kernelSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-kernel.js"), "utf8");
const catalogSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-catalog.js"), "utf8");
const homeSource = fs.readFileSync(path.join(repoRoot, "home.js"), "utf8");

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
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  return { context, ids, cards, storage };
}

function loadKernelAndCatalog(env) {
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  vm.runInContext(catalogSource, env.context, { filename: "shared/plata-catalog.js" });
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

function runHome(env) {
  vm.runInContext(homeSource, env.context, { filename: "home.js" });
}

function runEmptyHomeSmoke() {
  const env = makeContext();
  loadKernelAndCatalog(env);
  runHome(env);

  assert(env.ids["#home-start-title"].textContent === "New here?", "home recommends starter path for new users");
  assert(env.ids["#home-start-link"].href === "./lessons/lesson-01/", "home starter link points to Lesson 01");
  assert(env.ids["#home-primary-action"].textContent === "Start Lesson 01", "home primary CTA starts Lesson 01");
  const lessonCard = env.cards.find(card => card.trainerId === "lesson-01-arrival");
  assert(/Not started/.test(lessonCard.querySelector(".friendly-progress").innerHTML), "home labels unstarted trainer cards");
}

function runProgressHomeSmoke() {
  const env = makeContext();
  loadKernelAndCatalog(env);
  seedProgress(env, "vocab");
  runHome(env);

  assert(env.ids["#home-start-title"].textContent === "Continue where you left off", "home recommends continuing existing progress");
  assert(env.ids["#home-start-link"].href === "./vocab-sr/", "home continue link points to latest trainer");
  assert(env.ids["#home-primary-action"].textContent === "Continue drill", "home primary CTA continues the latest drill");
  const vocabCard = env.cards.find(card => card.trainerId === "vocab");
  assert(/Continue:<\/strong> 1 attempt/.test(vocabCard.querySelector(".friendly-progress").innerHTML), "home labels started trainer cards");
  assert(vocabCard.querySelector(".card-link").textContent === "Continue →", "home card CTA changes to continue");
}

runEmptyHomeSmoke();
runProgressHomeSmoke();

console.log("ok - home launcher recommends a starter path");
console.log("ok - home launcher continues existing local progress");

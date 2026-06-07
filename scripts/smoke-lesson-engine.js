#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..");
const kernelSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-kernel.js"), "utf8");
const engineSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-lesson-engine.js"), "utf8");
const radiatorLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-radiator", "data.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeElement(tagName) {
  const listeners = {};
  const element = {
    tagName,
    className: "",
    disabled: false,
    innerHTML: "",
    textContent: "",
    type: "",
    children: [],
    style: {},
    classList: {
      add(...names) {
        const current = new Set(String(element.className || "").split(/\s+/).filter(Boolean));
        names.forEach(name => current.add(name));
        element.className = [...current].join(" ");
      },
      remove(...names) {
        const removeSet = new Set(names);
        element.className = String(element.className || "").split(/\s+/).filter(name => !removeSet.has(name)).join(" ");
      },
      contains(name) {
        return String(element.className || "").split(/\s+/).includes(name);
      }
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    addEventListener(type, handler) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
    },
    click() {
      (listeners.click || []).forEach(handler => handler({ target: element }));
    }
  };
  return element;
}

function makeContext() {
  const storage = {};
  const elements = {
    "#scene": makeElement("section"),
    "#route": makeElement("nav"),
    "#scene-count": makeElement("span"),
    "#variables-display": makeElement("div"),
    "#reset-lesson": makeElement("button"),
    "#exercise-body": makeElement("div"),
    "#feedback": makeElement("div"),
    "#prev": makeElement("button"),
    "#next": makeElement("button")
  };

  const context = {
    console,
    Date,
    JSON,
    Math,
    Object,
    String,
    Array,
    Set,
    encodeURIComponent,
    decodeURIComponent,
    location: {
      pathname: "/lessons/lesson-b2-radiator/",
      search: "?mode=repair&signal=passive-agency",
      hash: "#official-reply-passive"
    },
    history: {
      replaceState(_state, _title, url) {
        const match = String(url || "").match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
        context.location.pathname = match && match[1] ? match[1] : context.location.pathname;
        context.location.search = match && match[2] ? match[2] : "";
        context.location.hash = match && match[3] ? match[3] : "";
      }
    },
    document: {
      readyState: "loading",
      querySelector(selector) {
        return elements[selector] || null;
      },
      querySelectorAll(selector) {
        if (selector === ".sign-card") return [];
        if (selector === ".meaning-card.matched") return [];
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
  return { context, elements, storage };
}

function runRepairAttemptSmoke() {
  const env = makeContext();
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  vm.runInContext(engineSource, env.context, { filename: "shared/plata-lesson-engine.js" });
  vm.runInContext(radiatorLessonSource, env.context, { filename: "lessons/lesson-b2-radiator/data.js" });

  env.context.PlataLessonEngine.run(env.context.PLATA_LESSON_B2_RADIATOR);

  assert(/repair-focus/.test(env.elements["#scene"].innerHTML), "repair URL renders repair focus");
  assert(env.elements["#scene-count"].textContent === "1 / 5", "repair URL opens the target scene");
  assert(env.elements["#exercise-body"].children.length === 3, "choice scene renders options");

  env.elements["#exercise-body"].children[1].click();

  const raw = env.storage[env.context.PlataKernel.stateKey("lesson-b2-radiator-register")];
  const state = JSON.parse(raw);
  const attempt = state.attempts[state.attempts.length - 1];
  assert(attempt, "choice click records an attempt");
  assert(attempt.itemId === "official-reply-passive", "recorded attempt keeps scene id");
  assert(attempt.mode === "repair", "repair URL records attempts in repair mode");
  assert(attempt.correct === true, "recorded attempt keeps correctness");
  assert(attempt.tags.includes("passive-agency"), "recorded attempt keeps mastery tag");
  assert(attempt.tags.includes("repair"), "recorded attempt includes repair mode tag");
}

function run() {
  runRepairAttemptSmoke();
  console.log("ok - lesson engine records repair attempts");
}

run();

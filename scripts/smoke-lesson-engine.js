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

function hasClass(element, className) {
  return String(element.className || "").split(/\s+/).includes(className);
}

function makeContext(locationOverrides) {
  const storage = {};
  const elements = {};
  const roots = [];

  function matchingElements(selector) {
    const out = [];
    const seen = new Set();
    function visit(element) {
      if (!element || seen.has(element)) return;
      seen.add(element);
      if (selector.charAt(0) === "." && hasClass(element, selector.slice(1))) out.push(element);
      if (selector === ".meaning-card.matched" && hasClass(element, "meaning-card") && hasClass(element, "matched")) out.push(element);
      (element.children || []).forEach(visit);
    }
    roots.forEach(visit);
    return out;
  }

  function ensure(selector, tagName) {
    if (!elements[selector]) elements[selector] = makeElement(tagName || "div", selector);
    return elements[selector];
  }

  function resetSceneControls() {
    elements["#exercise-body"] = makeElement("div", "#exercise-body");
    elements["#feedback"] = makeElement("div", "#feedback");
    elements["#prev"] = makeElement("button", "#prev");
    elements["#next"] = makeElement("button", "#next");
    delete elements["#answer"];
    delete elements["#check"];
    delete elements["#name"];
    delete elements["#complete"];
    delete elements["#again"];
  }

  function prepareControlsFromHtml(html) {
    if (/id=['"]answer['"]/.test(html)) {
      elements["#answer"] = makeElement("input", "#answer");
      elements["#check"] = makeElement("button", "#check");
    }
    if (/id=['"]name['"]/.test(html)) {
      elements["#name"] = makeElement("input", "#name");
      elements["#complete"] = makeElement("button", "#complete");
    }
    if (/id=['"]again['"]/.test(html)) {
      elements["#again"] = makeElement("button", "#again");
    }
  }

  function makeElement(tagName, selector) {
    const listeners = {};
    let html = "";
    const element = {
      tagName,
      selector,
      className: "",
      disabled: false,
      textContent: "",
      value: "",
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
          return hasClass(element, name);
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
    Object.defineProperty(element, "innerHTML", {
      get() {
        return html;
      },
      set(value) {
        html = String(value || "");
        element.children = [];
        if (selector === "#scene") resetSceneControls();
        prepareControlsFromHtml(html);
      }
    });
    return element;
  }

  elements["#scene"] = makeElement("section", "#scene");
  elements["#route"] = makeElement("nav", "#route");
  elements["#scene-count"] = makeElement("span", "#scene-count");
  elements["#variables-display"] = makeElement("div", "#variables-display");
  elements["#reset-lesson"] = makeElement("button", "#reset-lesson");
  resetSceneControls();
  roots.push(elements["#scene"], elements["#route"], elements["#exercise-body"]);

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
    location: Object.assign({
      pathname: "/lessons/lesson-b2-radiator/",
      search: "",
      hash: ""
    }, locationOverrides || {}),
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
        if (selector.charAt(0) === "#") return elements[selector] || null;
        return matchingElements(selector)[0] || null;
      },
      querySelectorAll(selector) {
        return matchingElements(selector);
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

function loadRuntime(locationOverrides) {
  const env = makeContext(locationOverrides);
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  vm.runInContext(engineSource, env.context, { filename: "shared/plata-lesson-engine.js" });
  vm.runInContext(radiatorLessonSource, env.context, { filename: "lessons/lesson-b2-radiator/data.js" });
  env.lesson = env.context.PLATA_LESSON_B2_RADIATOR;
  env.context.PlataLessonEngine.run(env.lesson);
  return env;
}

function storedState(env, suffix) {
  const key = env.context.PlataKernel.stateKey(suffix || env.lesson.id);
  return JSON.parse(env.storage[key] || "null");
}

function clickNext(env) {
  const next = env.elements["#next"];
  assert(next, "next button missing");
  next.click();
}

function findChildByText(children, text, label) {
  const found = children.find(child => String(child.innerHTML || child.textContent || "").includes(text));
  assert(found, `${label}: missing child containing "${text}"`);
  return found;
}

function runChoice(env, scene, action) {
  const option = scene.options.find(candidate => candidate.id === action.optionId);
  assert(option, `${scene.id}: unknown option ${action.optionId}`);
  const button = findChildByText(env.elements["#exercise-body"].children, option.label, scene.id);
  button.click();
  assert(env.elements["#feedback"].textContent === option.feedback, `${scene.id}: feedback mismatch`);
}

function runMatch(env, scene) {
  const board = env.elements["#exercise-body"];
  assert(board.children.length === 2, `${scene.id}: match board did not render both columns`);
  const leftColumn = board.children[0];
  const rightColumn = board.children[1];
  scene.pairs.forEach(pair => {
    const left = findChildByText(leftColumn.children, pair.left, `${scene.id}.left`);
    const right = findChildByText(rightColumn.children, pair.right, `${scene.id}.right`);
    left.click();
    right.click();
  });
}

function runCompletion(env, scene, action) {
  env.elements["#name"].value = action.answer;
  env.elements["#complete"].click();
  const ok = action.expectCorrect;
  assert(hasClass(env.elements["#feedback"], ok ? "ok" : "warn"), `${scene.id}: completion feedback class mismatch`);
}

function runSceneAction(env, action) {
  const scene = env.lesson.scenes.find(candidate => candidate.id === action.sceneId);
  assert(scene, `unknown scene ${action.sceneId}`);

  if (scene.type === "choice") {
    runChoice(env, scene, action);
    return;
  }
  if (scene.type === "match") {
    runMatch(env, scene);
    return;
  }
  if (scene.type === "completion") {
    runCompletion(env, scene, action);
    return;
  }
  throw new Error(`${scene.id}: unsupported runtime scene type ${scene.type}`);
}

function weakMastery(env, state) {
  const keys = Object.keys(env.lesson.masteryMap);
  return env.context.PlataKernel.getWeakTags(state, 50)
    .filter(weak => keys.includes(weak.tag))
    .map(weak => weak.tag)
    .sort();
}

function assertRuntimePath(pathSpec) {
  const env = loadRuntime();
  const expectedAttempts = pathSpec.actions.reduce((sum, action) => {
    const scene = env.lesson.scenes.find(candidate => candidate.id === action.sceneId);
    return sum + (scene && scene.type === "match" ? scene.pairs.length : 1);
  }, 0);
  pathSpec.actions.forEach((action, index) => {
    assert(env.elements["#scene-count"].textContent === `${index + 1} / ${env.lesson.scenes.length}`, `${pathSpec.id}: wrong scene count before ${action.sceneId}`);
    runSceneAction(env, action);
    clickNext(env);
  });

  const state = storedState(env);
  assert(state.meta.totalAttempts === expectedAttempts, `${pathSpec.id}: expected ${expectedAttempts} runtime attempts, got ${state.meta.totalAttempts}`);
  assert(state.meta.totalCorrect === pathSpec.expectedCorrect, `${pathSpec.id}: expected ${pathSpec.expectedCorrect} correct attempts, got ${state.meta.totalCorrect}`);
  assert(state.attempts.every(attempt => attempt.mode === "lesson"), `${pathSpec.id}: non-repair path should record lesson mode`);
  assert(new RegExp(`Lesson complete . ${pathSpec.expectedEndingId}`).test(env.elements["#scene"].innerHTML), `${pathSpec.id}: expected ending ${pathSpec.expectedEndingId}`);

  const expectedWeak = (pathSpec.expectedWeakMastery || []).slice().sort();
  const actualWeak = weakMastery(env, state);
  assert(actualWeak.join(",") === expectedWeak.join(","), `${pathSpec.id}: expected weak mastery [${expectedWeak.join(", ")}], got [${actualWeak.join(", ")}]`);
}

function runRepairAttemptSmoke() {
  const env = loadRuntime({
    search: "?mode=repair&signal=passive-agency",
    hash: "#official-reply-passive"
  });

  assert(/repair-focus/.test(env.elements["#scene"].innerHTML), "repair URL renders repair focus");
  assert(env.elements["#scene-count"].textContent === "1 / 5", "repair URL opens the target scene");
  assert(env.elements["#exercise-body"].children.length === 3, "choice scene renders options");

  env.elements["#exercise-body"].children[1].click();

  const state = storedState(env);
  const attempt = state.attempts[state.attempts.length - 1];
  assert(attempt, "choice click records an attempt");
  assert(attempt.itemId === "official-reply-passive", "recorded attempt keeps scene id");
  assert(attempt.mode === "repair", "repair URL records attempts in repair mode");
  assert(attempt.correct === true, "recorded attempt keeps correctness");
  assert(attempt.tags.includes("passive-agency"), "recorded attempt keeps mastery tag");
  assert(attempt.tags.includes("repair"), "recorded attempt includes repair mode tag");
}

function runGoldRuntimePathSmoke() {
  const env = loadRuntime();
  env.lesson.simulation.paths.forEach(assertRuntimePath);
}

function run() {
  runRepairAttemptSmoke();
  runGoldRuntimePathSmoke();
  console.log("ok - lesson engine records repair attempts");
  console.log("ok - lesson engine replays gold simulation paths");
}

run();

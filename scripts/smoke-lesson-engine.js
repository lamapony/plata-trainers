#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..");
const kernelSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-kernel.js"), "utf8");
const competencySource = fs.readFileSync(path.join(repoRoot, "shared", "plata-competencies.js"), "utf8");
const plannerSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-planner.js"), "utf8");
const guidedSessionSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-guided-session.js"), "utf8");
const nextStepSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-next-step.js"), "utf8");
const catalogSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-catalog.js"), "utf8");
const repairBridgeSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-repair-bridge.js"), "utf8");
const engineSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-lesson-engine.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function resolveInputPath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(repoRoot, inputPath);
}

function relInputPath(inputPath) {
  return path.relative(repoRoot, resolveInputPath(inputPath)).replaceAll(path.sep, "/");
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function loadLessonData(relPath) {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(resolveInputPath(relPath), "utf8"), context, { filename: relPath });
  const key = Object.keys(context.window).find(candidate => candidate.startsWith("PLATA_LESSON_"));
  return key ? context.window[key] : null;
}

function findLessonDataFiles() {
  const lessonsRoot = path.join(repoRoot, "lessons");
  return fs.readdirSync(lessonsRoot)
    .filter(dir => fs.statSync(path.join(lessonsRoot, dir)).isDirectory())
    .map(dir => path.join("lessons", dir, "data.js"))
    .filter(relPath => fs.existsSync(path.join(repoRoot, relPath)));
}

function loadGoldLessons() {
  const file = argValue("--file");
  const dataFiles = file ? [relInputPath(file)] : findLessonDataFiles();
  return dataFiles
    .map(loadLessonData)
    .filter(Boolean)
    .filter(lesson => lesson.qualityTier === "gold");
}

function hasClass(element, className) {
  return String(element.className || "").split(/\s+/).includes(className);
}

function makeContext(locationOverrides) {
  const storage = {};
  const elements = {};
  const roots = [];
  const eventListeners = {};

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
  elements["#scene"].querySelector = function (sel) {
    if (sel === "#feedback") return elements["#feedback"] || null;
    if (sel === "#miss-repair-panel") return elements["#miss-repair-panel"] || null;
    if (sel === "#exercise-body") return elements["#exercise-body"] || null;
    return null;
  };
  elements["#scene"].appendChild = function (child) {
    if (child && (child.id === "miss-repair-panel" || String(child.className || "").indexOf("miss-repair-panel") !== -1)) {
      elements["#miss-repair-panel"] = child;
    }
    this.children.push(child);
    return child;
  };
  elements["#route"] = makeElement("nav", "#route");
  elements["#scene-count"] = makeElement("span", "#scene-count");
  elements["#variables-display"] = makeElement("div", "#variables-display");
  elements["#reset-lesson"] = makeElement("button", "#reset-lesson");
  resetSceneControls();
  roots.push(elements["#scene"], elements["#route"], elements["#exercise-body"]);

  function dispatchEvent(event) {
    const type = event && event.type || event;
    (eventListeners[type] || []).forEach(handler => handler(event));
  }

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
    addEventListener(type, handler) {
      eventListeners[type] = eventListeners[type] || [];
      eventListeners[type].push(handler);
    },
    removeEventListener(type, handler) {
      eventListeners[type] = (eventListeners[type] || []).filter(candidate => candidate !== handler);
    },
    dispatchEvent,
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

function loadRuntime(lesson, locationOverrides, beforeRun) {
  const env = makeContext(Object.assign({
    pathname: `/lessons/${lesson.id}/`,
    search: "",
    hash: ""
  }, locationOverrides || {}));
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  vm.runInContext(competencySource, env.context, { filename: "shared/plata-competencies.js" });
  vm.runInContext(plannerSource, env.context, { filename: "shared/plata-planner.js" });
  vm.runInContext(guidedSessionSource, env.context, { filename: "shared/plata-guided-session.js" });
  vm.runInContext(nextStepSource, env.context, { filename: "shared/plata-next-step.js" });
  vm.runInContext(catalogSource, env.context, { filename: "shared/plata-catalog.js" });
  vm.runInContext(repairBridgeSource, env.context, { filename: "shared/plata-repair-bridge.js" });
  vm.runInContext(engineSource, env.context, { filename: "shared/plata-lesson-engine.js" });
  env.lesson = lesson;
  if (beforeRun) beforeRun(env);
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

function comparableText(value) {
  return String(value || "")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

function findChildByText(children, text, label) {
  const needle = comparableText(text);
  const found = children.find(child => comparableText(child.innerHTML || child.textContent || "").includes(needle));
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

function runFlagshipChain(env, scene, action) {
  const option = scene.options.find(candidate => candidate.id === action.optionId);
  assert(option, `${scene.id}: unknown option ${action.optionId}`);
  const optionGroup = env.elements["#exercise-body"].children.find(child => hasClass(child, "flagship-options"));
  assert(optionGroup, `${scene.id}: flagship options did not render`);
  const button = findChildByText(optionGroup.children, option.label, scene.id);
  button.click();
  assert(env.elements["#feedback"].textContent.trim().length > 0, `${scene.id}: flagship feedback did not render`);

  if (option.correct && option.reasonOptions && option.reasonOptions.length) {
    const panel = env.elements["#exercise-body"].children.find(child => hasClass(child, "flagship-consequence"));
    assert(panel, `${scene.id}: flagship consequence did not render`);
    const reason = option.reasonOptions.find(candidate => candidate.id === action.reasonId);
    assert(reason, `${scene.id}: unknown reason ${action.reasonId}`);
    const reasonGroup = panel.children.find(child => hasClass(child, "flagship-reasons"));
    assert(reasonGroup, `${scene.id}: reason options did not render`);
    const reasonButton = findChildByText(reasonGroup.children, reason.label, `${scene.id}.reason`);
    reasonButton.click();
  }

  assert(hasClass(env.elements["#feedback"], action.expectCorrect ? "ok" : "warn"), `${scene.id}: flagship feedback class mismatch`);
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
  if (scene.type === "flagship-chain") {
    runFlagshipChain(env, scene, action);
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

function assertRuntimePath(lesson, pathSpec) {
  const env = loadRuntime(lesson);
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
  assert(/next-step-card/.test(env.elements["#scene"].innerHTML), `${pathSpec.id}: completion should render a next-step recommendation`);
  if (expectedWeak.length) {
    assert(/\?mode=repair&amp;signal=/.test(env.elements["#scene"].innerHTML), `${pathSpec.id}: weak mastery should recommend repair mode`);
  }
}

function runRepairAttemptSmoke(lesson) {
  const env = loadRuntime(lesson, {
    search: "?mode=repair&signal=passive-agency",
    hash: "#official-reply-passive"
  });

  assert(/repair-focus/.test(env.elements["#scene"].innerHTML), "repair URL renders repair focus");
  assert(/scene-comic/.test(env.elements["#scene"].innerHTML), "repair URL renders reviewed scene comic panel");
  assert(/assets\/comic\/official-reply-passive\.png/.test(env.elements["#scene"].innerHTML), "repair URL renders generated comic asset");
  assert(env.elements["#scene-count"].textContent === "1 / 6", "repair URL opens the target scene");
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
  assert(state.meta.repairClosures["passive-agency"], "correct repair records closure");
  assert(env.context.PlataKernel.isSignalResolved(state, "passive-agency"), "correct repair resolves the signal");

  for (let i = 0; i < lesson.scenes.length; i++) clickNext(env);
  assert(/repair-closure closed/.test(env.elements["#scene"].innerHTML), "completed repair renders closed status");
  assert(/Repair closed: Read what was actually promised/.test(env.elements["#scene"].innerHTML), "completed repair names the closed signal");
}

function runHashNavigationSmoke(lesson) {
  const env = loadRuntime(lesson, {
    hash: "#official-reply-passive"
  });

  assert(env.elements["#scene-count"].textContent === "1 / 6", "hash navigation opens initial deep-linked scene");
  assert(/Separate a registered case/.test(env.elements["#scene"].innerHTML), "hash navigation rendered the initial scene");

  env.context.location.hash = "#workplace-understatement";
  env.context.dispatchEvent({ type: "hashchange" });

  assert(env.elements["#scene-count"].textContent === "5 / 6", "hashchange navigates to the requested scene");
  assert(/Open the call with the case/.test(env.elements["#scene"].innerHTML), "hashchange rendered the new scene");
  assert(!/assets\/comic\/workplace-understatement\.png/.test(env.elements["#scene"].innerHTML), "hashchange must not request an unreviewed comic asset");

  env.context.location.hash = "#missing-scene";
  env.context.dispatchEvent({ type: "hashchange" });

  assert(env.elements["#scene-count"].textContent === "1 / 6", "unknown hash falls back to the first scene");
  assert(env.context.location.hash === "#official-reply-passive", "unknown hash is normalized to the rendered scene");
}

function runPlanContextSmoke(lesson) {
  const env = loadRuntime(lesson, {
    search: "?mode=repair&signal=passive-agency",
    hash: "#official-reply-passive"
  }, setupEnv => {
    const planner = setupEnv.context.PlataPlanner;
    const plan = planner.savePracticePlan({
      kind: "repair",
      title: "Repair plan",
      copy: "Follow the tracked route.",
      steps: [{
        number: 1,
        kind: "repair",
        trainerId: lesson.id,
        title: "Repair Read passive agency",
        copy: "Replay the source scene as the active plan step.",
        primaryLabel: "Open repair scene",
        primaryHref: "./lessons/lesson-b2-radiator/?mode=repair&signal=passive-agency#official-reply-passive",
        minutes: "4-6 min"
      }]
    });
    setupEnv.context.location.search = "?mode=repair&signal=passive-agency&plan=" + encodeURIComponent(plan.planToken) + "&step=" + encodeURIComponent(plan.steps[0].routeId);
  });

  assert(/plan-context-card/.test(env.elements["#scene"].innerHTML), "active plan route renders plan context");
  assert(/Active plan . Step 1 of 1/.test(env.elements["#scene"].innerHTML), "active plan context renders step count");
  assert(/Repair Read passive agency/.test(env.elements["#scene"].innerHTML), "active plan context renders step title");
  assert(/Back to plan/.test(env.elements["#scene"].innerHTML), "active plan context links back to dashboard");
  assert(env.context.PlataPlanner.readPracticePlan().steps[0].startedAt, "active plan context marks step started");

  env.elements["#exercise-body"].children[1].click();
  const step = env.context.PlataPlanner.readPracticePlan().steps[0];
  assert(step.completedAt, "correct repair marks active plan step completed");
  assert(step.completionEvidence.reason === "repair-correct", "correct repair stores completion evidence");
  const outcomeLedger = env.context.PlataGuidedSession.readOutcomeLedger();
  assert(outcomeLedger.totals.outcomes === 1, "correct repair records a guided outcome receipt");
  assert(outcomeLedger.outcomes[0].outcomeReceipt.citedFacts.length === 0, "uncited lesson test receipt stays explicit without fake memory");
  assert(outcomeLedger.outcomes[0].completionEvidence.reason === "repair-correct", "guided outcome receipt stores completion evidence");
  assert(outcomeLedger.outcomes[0].fingerprint.startsWith("gdo-"), "guided outcome receipt carries a stable fingerprint");
  const completedContext = env.context.PlataNextStep.renderPlanContext({
    trainerId: lesson.id,
    dashboardHref: "../../dashboard.html"
  });
  assert(/Plan step completed . Step 1 of 1/.test(completedContext), "completed active plan context renders completion status");
  assert(/See next plan action/.test(completedContext), "completed active plan context links to next dashboard action");
  assert(/ledger-return=/.test(completedContext), "completed active plan context carries a dashboard return marker");
}

function runMissRepairSmoke(lesson) {
  const env = loadRuntime(lesson, { hash: "#official-reply-passive" });
  const scene = lesson.scenes.find(item => item.id === "official-reply-passive");
  const wrong = scene.options.find(item => item.id === "too-trusting");
  const button = findChildByText(env.elements["#exercise-body"].children, wrong.label, scene.id);
  button.click();
  assert(env.elements["#miss-repair-panel"], "wrong choice mounts miss repair panel");
  assert(/register-drill/.test(env.elements["#miss-repair-panel"].innerHTML), "miss repair panel links register drill");
  assert(/signal=passive-agency/.test(env.elements["#miss-repair-panel"].innerHTML), "miss repair panel keeps signal deep link");
  const plan = env.context.PlataPlanner.readPracticePlan();
  assert(plan && plan.steps.length === 2, "miss repair saves scene + drill plan");
  assert(plan.steps[1].kind === "drill-repair", "miss repair plan adds drill follow-up");
}

function runGoldRuntimePathSmoke(lessons) {
  lessons.forEach(lesson => {
    lesson.simulation.paths.forEach(pathSpec => assertRuntimePath(lesson, pathSpec));
  });
}

function run() {
  const file = argValue("--file");
  const lessons = loadGoldLessons();
  assert(lessons.length > 0, file ? `no gold lesson found in ${file}` : "no gold lessons found");
  if (!file) {
    const radiatorLesson = lessons.find(lesson => lesson.id === "lesson-b2-radiator-register");
    assert(radiatorLesson, "radiator gold lesson missing");
    runRepairAttemptSmoke(radiatorLesson);
    runHashNavigationSmoke(radiatorLesson);
    runPlanContextSmoke(radiatorLesson);
    runMissRepairSmoke(radiatorLesson);
  }
  runGoldRuntimePathSmoke(lessons);
  if (!file) console.log("ok - lesson engine records repair attempts");
  if (!file) console.log("ok - lesson engine follows hash navigation");
  if (!file) console.log("ok - lesson engine renders active practice-plan context");
  if (!file) console.log("ok - lesson engine mounts narrative-to-drill repair bridge");
  console.log("ok - lesson engine replays gold simulation paths");
}

run();

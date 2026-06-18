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
const eventsSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-events.js"), "utf8");
const memorySource = fs.readFileSync(path.join(repoRoot, "shared", "plata-memory.js"), "utf8");
const learnerModelSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-learner-model.js"), "utf8");
const memoryVaultSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-memory-vault.js"), "utf8");
const memoryBriefSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-memory-brief.js"), "utf8");
const agentHandoffSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-agent-handoff.js"), "utf8");
const advisorSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-advisor.js"), "utf8");
const companionSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-companion.js"), "utf8");
const guidedSessionSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-guided-session.js"), "utf8");
const headroomSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-headroom.js"), "utf8");
const radiatorLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-radiator", "data.js"), "utf8");
const jobFollowupLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-job-followup", "data.js"), "utf8");
const lesson01Source = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-01", "data.js"), "utf8");
const ordstillingLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-ordstilling", "data.js"), "utf8");
const dashboardSource = fs.readFileSync(path.join(repoRoot, "dashboard.js"), "utf8");
const dynamicLessonSources = {
  "./lessons/lesson-b2-radiator/data.js": radiatorLessonSource,
  "./lessons/lesson-b2-job-followup/data.js": jobFollowupLessonSource,
  "./lessons/lesson-01/data.js": lesson01Source,
  "./lessons/lesson-b2-ordstilling/data.js": ordstillingLessonSource
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
    hidden: false,
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
    "#demo-profile": makeElement("section"),
    "#learner-headroom": makeElement("section"),
    "#today-program": makeElement("div"),
    "#guided-session-panel": makeElement("div"),
    "#due-cards": makeElement("div"),
    "#practice-plan": makeElement("div"),
    "#evidence-ledger": makeElement("div"),
    "#memory-facts": makeElement("div"),
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
  vm.runInContext(lesson01Source, env.context, { filename: "lessons/lesson-01/data.js" });
  vm.runInContext(radiatorLessonSource, env.context, { filename: "lessons/lesson-b2-radiator/data.js" });
  vm.runInContext(jobFollowupLessonSource, env.context, { filename: "lessons/lesson-b2-job-followup/data.js" });
  vm.runInContext(ordstillingLessonSource, env.context, { filename: "lessons/lesson-b2-ordstilling/data.js" });
  vm.runInContext(competencySource, env.context, { filename: "shared/plata-competencies.js" });
  vm.runInContext(plannerSource, env.context, { filename: "shared/plata-planner.js" });
  vm.runInContext(evidenceSource, env.context, { filename: "shared/plata-evidence.js" });
  vm.runInContext(eventsSource, env.context, { filename: "shared/plata-events.js" });
  vm.runInContext(memorySource, env.context, { filename: "shared/plata-memory.js" });
  vm.runInContext(learnerModelSource, env.context, { filename: "shared/plata-learner-model.js" });
  vm.runInContext(memoryVaultSource, env.context, { filename: "shared/plata-memory-vault.js" });
  vm.runInContext(memoryBriefSource, env.context, { filename: "shared/plata-memory-brief.js" });
  vm.runInContext(agentHandoffSource, env.context, { filename: "shared/plata-agent-handoff.js" });
  vm.runInContext(advisorSource, env.context, { filename: "shared/plata-advisor.js" });
  vm.runInContext(companionSource, env.context, { filename: "shared/plata-companion.js" });
  vm.runInContext(guidedSessionSource, env.context, { filename: "shared/plata-guided-session.js" });
  vm.runInContext(headroomSource, env.context, { filename: "shared/plata-headroom.js" });
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

function setAttemptAt(state, index, at) {
  const attempt = state.attempts && state.attempts[index];
  if (!attempt) return;
  attempt.at = at;
  const item = state.byItemId && state.byItemId[attempt.itemId];
  if (item) item.lastSeen = at;
  state.meta.lastSessionDate = at.slice(0, 10);
  state.updatedAt = at;
}

function seedDueReviewState(env) {
  const kernel = env.context.PlataKernel;
  const state = kernel.freshState("lesson-b2-job-followup");
  kernel.recordAttempt(state, {
    itemId: "linkedin-choice",
    correct: true,
    tags: ["B2", "lesson", "formal-register-control"],
    mode: "lesson",
    expected: "raw due-review expected",
    given: "raw due-review given"
  });
  setAttemptAt(state, 0, "2026-05-01T08:00:00.000Z");
  env.storage[kernel.stateKey("lesson-b2-job-followup")] = JSON.stringify(state);
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

  assert(env.elements["#trainer-cards"].children.length === 8, "dashboard renders all trainer cards");
  assert(/Planner route/.test(env.elements["#today-program"].innerHTML), "dashboard renders Today program shell for starter routes");
  assert(/First session/.test(env.elements["#today-program"].innerHTML), "dashboard labels the empty profile as a first session");
  assert(/job-followup|follow-up/i.test(env.elements["#today-program"].innerHTML), "dashboard Today shell promotes the B2 follow-up starter step");
  assert(/0%/.test(env.elements["#today-program"].innerHTML), "dashboard Today shell shows route progress");
  assert(/onboarding/.test(env.elements["#today-program"].innerHTML), "dashboard Today shell exposes the onboarding state");
  assert(/First run/.test(env.elements["#today-program"].innerHTML), "dashboard Today shell shows the program state strip");
  assert(/Local progress/.test(env.elements["#today-program"].innerHTML), "dashboard Today shell labels local-progress recommendations");
  assert(/Walkthrough|Guided session/.test(env.elements["#guided-session-panel"].innerHTML), "dashboard renders guided session shell");
  assert(/job-followup|follow-up|Same step as/i.test(env.elements["#guided-session-panel"].innerHTML), "dashboard guided session promotes the B2 follow-up starter outcome");
  assert(/Outcome receipt/.test(env.elements["#guided-session-panel"].innerHTML), "dashboard guided session renders an outcome receipt");
  assert(/No model call/.test(env.elements["#guided-session-panel"].innerHTML), "dashboard guided session renders model guardrail");
  assert(/No raw answers/.test(env.elements["#guided-session-panel"].innerHTML), "dashboard guided session renders raw-answer guardrail");
  assert(/gds-/.test(env.elements["#guided-session-panel"].innerHTML), "dashboard guided session renders a stable fingerprint");
  assert(env.elements["#due-cards"].children.length === 3, "dashboard renders practice recommendations");
  assert(/Starter plan/.test(env.elements["#practice-plan"].innerHTML), "dashboard renders starter practice plan");
  assert(/Active plan/.test(env.elements["#practice-plan"].innerHTML), "dashboard labels the current tracked plan");
  assert(/plan-step-status open/.test(env.elements["#practice-plan"].innerHTML), "dashboard marks starter plan step as open");
  assert(/job-followup|follow-up/i.test(env.elements["#practice-plan"].innerHTML), "dashboard starter plan includes B2 follow-up lesson");
  assert(/plan=/.test(env.elements["#practice-plan"].innerHTML), "dashboard plan links carry active plan token");
  assert(/step=/.test(env.elements["#practice-plan"].innerHTML), "dashboard plan links carry step route id");
  assert(/Why this step/.test(env.elements["#practice-plan"].innerHTML), "dashboard renders planner explanations in the practice plan");
  assert(/no local progress yet/.test(env.elements["#practice-plan"].innerHTML), "dashboard explains starter plan evidence");
  assert(env.storage[env.context.PlataPlanner.practicePlanStorageKey], "dashboard persists active practice plan");
  assert(/No evidence trail yet/.test(env.elements["#evidence-ledger"].innerHTML), "dashboard renders empty evidence ledger state");
  assert(/No learner memory facts yet/.test(env.elements["#memory-facts"].innerHTML), "dashboard renders empty learner memory state");
  assert(/No root-skill pattern needs attention yet/.test(env.elements["#competency-list"].innerHTML), "dashboard renders empty competency graph state");
  assert(/No repair pattern is active yet/.test(env.elements["#mastery-list"].innerHTML), "dashboard renders empty mastery state");
  assert(/No raw weak tags yet/.test(env.elements["#weak-list"].innerHTML), "dashboard renders empty raw weak-tag state");
}

function runDemoLearnerSmoke() {
  const env = makeContext(null, { locationSearch: "?demo=learner" });
  loadKernelAndDashboard(env);

  assert(/Sample B2 plateau profile/.test(env.elements["#demo-profile"].innerHTML), "dashboard renders the demo learner banner");
  assert(env.elements["#demo-profile"].hidden === false, "dashboard unhides the demo learner banner");
  assert(/Use my own progress/.test(env.elements["#demo-profile"].innerHTML), "dashboard demo banner links back to the real local profile");
  assert(/Study companion/.test(env.elements["#today-program"].innerHTML), "dashboard demo mode renders a companion-backed Today step");
  assert(!/onboarding/.test(env.elements["#today-program"].innerHTML), "dashboard demo mode does not look like an empty first-run profile");
  assert(/Cited memory/.test(env.elements["#today-program"].innerHTML), "dashboard demo Today step cites learner memory");
  assert(/Walkthrough|Guided session/.test(env.elements["#guided-session-panel"].innerHTML), "dashboard demo mode renders a guided session");
  assert(/Cited memory/.test(env.elements["#guided-session-panel"].innerHTML), "dashboard demo guided session cites learner memory");
  assert(/No raw answers/.test(env.elements["#guided-session-panel"].innerHTML), "dashboard demo guided session renders privacy guardrail");
  assert(/Active plan/.test(env.elements["#practice-plan"].innerHTML), "dashboard demo mode renders a practice plan");
  assert(/plan=/.test(env.elements["#practice-plan"].innerHTML), "dashboard demo practice links carry a plan token");
  assert(/Weak signal:/.test(env.elements["#memory-facts"].innerHTML), "dashboard demo mode renders weak-signal memory facts");
  assert(/Review due:/.test(env.elements["#memory-facts"].innerHTML), "dashboard demo mode renders due-review memory facts");
  assert(/Needs attention/.test(env.elements["#evidence-ledger"].innerHTML), "dashboard demo mode renders evidence ledger rows");
  assert(env.elements["#import-trigger"].disabled === true, "dashboard demo mode disables profile import");

  const memoryBundle = invokeDashboardFunction(env, "buildMemoryFacts");
  assert(memoryBundle.visibleFacts.length >= 4, "dashboard demo mode compiles a rich memory bundle");
  assert(memoryBundle.visibleFacts.some(fact => fact.kind === "weak_signal" && fact.signal === "passive-agency"), "dashboard demo memory includes passive-agency weakness");
  assert(memoryBundle.visibleFacts.some(fact => fact.kind === "next_review_due"), "dashboard demo memory includes a due review");
  assert(!JSON.stringify(memoryBundle).includes("De lover"), "dashboard demo memory excludes raw learner answer text");

  const storageKeys = Object.keys(env.storage);
  assert(!storageKeys.includes(env.context.PlataPlanner.practicePlanStorageKey), "dashboard demo mode does not persist a practice plan");
  assert(storageKeys.filter(key => key.startsWith("plata:trainer:")).length === 0, "dashboard demo mode does not write trainer states");
  assert(!storageKeys.includes("plata:learner-memory:vault:v1"), "dashboard demo mode does not write a memory vault");
}

function runSeededMasterySmoke() {
  const env = makeContext();
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  seedWeakMasteryState(env);
  vm.runInContext(catalogSource, env.context, { filename: "shared/plata-catalog.js" });
  vm.runInContext(lesson01Source, env.context, { filename: "lessons/lesson-01/data.js" });
  vm.runInContext(radiatorLessonSource, env.context, { filename: "lessons/lesson-b2-radiator/data.js" });
  vm.runInContext(jobFollowupLessonSource, env.context, { filename: "lessons/lesson-b2-job-followup/data.js" });
  vm.runInContext(ordstillingLessonSource, env.context, { filename: "lessons/lesson-b2-ordstilling/data.js" });
  vm.runInContext(competencySource, env.context, { filename: "shared/plata-competencies.js" });
  vm.runInContext(plannerSource, env.context, { filename: "shared/plata-planner.js" });
  vm.runInContext(evidenceSource, env.context, { filename: "shared/plata-evidence.js" });
  vm.runInContext(eventsSource, env.context, { filename: "shared/plata-events.js" });
  vm.runInContext(memorySource, env.context, { filename: "shared/plata-memory.js" });
  vm.runInContext(advisorSource, env.context, { filename: "shared/plata-advisor.js" });
  vm.runInContext(companionSource, env.context, { filename: "shared/plata-companion.js" });
  vm.runInContext(guidedSessionSource, env.context, { filename: "shared/plata-guided-session.js" });
  vm.runInContext(headroomSource, env.context, { filename: "shared/plata-headroom.js" });
  vm.runInContext(dashboardSource, env.context, { filename: "dashboard.js" });

  assert(env.context.PlataCatalog.trainers.length === 8, "dashboard reads trainer catalog");
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
  assert(/Evidence: 1 miss \/ 1 try/.test(env.elements["#practice-plan"].innerHTML), "dashboard renders repair evidence counts");
  assert(/Memory: weak_signal passive-agency memsrc-/.test(env.elements["#practice-plan"].innerHTML), "dashboard practice plan cites planner memory facts");
  assert(/Study companion/.test(env.elements["#today-program"].innerHTML), "dashboard Today shell renders a companion-backed step");
  assert(/Repair passive-agency/.test(env.elements["#today-program"].innerHTML), "dashboard Today shell promotes companion repair focus");
  assert(/Cited memory/.test(env.elements["#today-program"].innerHTML), "dashboard Today shell exposes cited memory");
  assert(/Hermes optional/.test(env.elements["#today-program"].innerHTML), "dashboard Today shell keeps Hermes optional");
  assert(/cmp-/.test(env.elements["#today-program"].innerHTML), "dashboard Today shell includes companion fingerprint");
  assert(!/De lover, at radiatoren bliver fikset hurtigt/.test(env.elements["#today-program"].innerHTML), "dashboard Today shell does not leak raw learner answers");
  assert(/Walkthrough|Guided session/.test(env.elements["#guided-session-panel"].innerHTML), "dashboard renders guided session for memory-backed plans");
  assert(/Repair passive-agency/.test(env.elements["#guided-session-panel"].innerHTML), "dashboard guided session promotes repair focus");
  assert(/Outcome receipt/.test(env.elements["#guided-session-panel"].innerHTML), "dashboard guided session includes an outcome receipt");
  assert(/Cited memory/.test(env.elements["#guided-session-panel"].innerHTML), "dashboard guided session exposes cited memory");
  assert(/No model call/.test(env.elements["#guided-session-panel"].innerHTML), "dashboard guided session renders model guardrail");
  assert(/gds-/.test(env.elements["#guided-session-panel"].innerHTML), "dashboard guided session includes trace fingerprint");
  assert(!/De lover, at radiatoren bliver fikset hurtigt/.test(env.elements["#guided-session-panel"].innerHTML), "dashboard guided session does not leak raw learner answers");
  assert(/Study companion/.test(env.elements["#practice-plan"].innerHTML), "dashboard renders companion receipt for memory-backed plans");
  assert(/Cited memory/.test(env.elements["#practice-plan"].innerHTML), "dashboard companion receipt exposes cited memory facts");
  assert(/No model call/.test(env.elements["#practice-plan"].innerHTML), "dashboard companion receipt renders model guardrail");
  assert(/cmp-/.test(env.elements["#practice-plan"].innerHTML), "dashboard companion receipt includes trace fingerprint");
  assert(/Hermes optional/.test(env.elements["#practice-plan"].innerHTML), "dashboard companion keeps external agents optional");
  assert(!/De lover, at radiatoren bliver fikset hurtigt/.test(env.elements["#practice-plan"].innerHTML), "dashboard companion receipt does not leak raw learner answers");
  assert(/mode=repair/.test(env.elements["#practice-plan"].innerHTML), "dashboard repair plan links repair mode");
  assert(/plan=/.test(env.elements["#practice-plan"].innerHTML), "dashboard repair plan links carry active plan token");
  assert(/step=/.test(env.elements["#practice-plan"].innerHTML), "dashboard repair plan links carry step route id");
  assert(env.storage[env.context.PlataPlanner.practicePlanStorageKey], "dashboard stores repair plan tracker state");
  assert(/Read passive agency/.test(env.elements["#due-cards"].children[0].innerHTML), "practice recommendation highlights weak mastery");
  assert(/Open repair scene/.test(env.elements["#due-cards"].children[0].innerHTML), "practice recommendation opens the repair scene");
  assert(/Needs attention/.test(env.elements["#evidence-ledger"].innerHTML), "dashboard evidence ledger shows open mastery signals");
  assert(/Read passive agency/.test(env.elements["#evidence-ledger"].innerHTML), "dashboard evidence ledger names the open signal");
  assert(/1 miss \/ 1 try/.test(env.elements["#evidence-ledger"].innerHTML), "dashboard evidence ledger includes signal counts");
  assert(/Weak signal: passive-agency/.test(env.elements["#memory-facts"].innerHTML), "dashboard memory inspector shows weak signal facts");
  assert(/memsrc-/.test(env.elements["#memory-facts"].innerHTML), "dashboard memory inspector renders source fingerprints");

  const memoryBundle = invokeDashboardFunction(env, "buildMemoryFacts");
  const weakFact = memoryBundle.visibleFacts.find(fact => fact.kind === "weak_signal" && fact.signal === "passive-agency");
  assert(weakFact, "dashboard exposes compiled memory facts");
  const candidates = invokeDashboardFunction(env, "dashboardCandidates");
  const repairCandidate = candidates.find(item => item.trainer.id === "lesson-b2-radiator-register");
  assert(repairCandidate.decision.trace.inputs.selectedMemoryFacts.some(fact => fact.id === weakFact.id), "dashboard planner trace cites memory facts");
  assert(repairCandidate.decision.trace.scoreBreakdown.some(part => part.label === "memory weak_signal boost"), "dashboard planner trace scores memory facts");
  vm.runInContext(`deleteMemoryFact(${JSON.stringify(weakFact.id)})`, env.context, { filename: "dashboard.js" });
  assert(env.storage["plata:learner-memory:deleted-facts:v1"].includes(weakFact.id), "dashboard persists hidden memory fact ids");
  assert(!/Weak signal: passive-agency/.test(env.elements["#memory-facts"].innerHTML), "dashboard hides deleted memory facts");
  const hiddenCandidates = invokeDashboardFunction(env, "dashboardCandidates");
  const hiddenRepairCandidate = hiddenCandidates.find(item => item.trainer.id === "lesson-b2-radiator-register");
  assert(!(hiddenRepairCandidate.decision.trace.inputs.selectedMemoryFacts || []).some(fact => fact.id === weakFact.id), "dashboard planner ignores hidden memory facts");
  assert(!hiddenRepairCandidate.decision.trace.scoreBreakdown.some(part => part.label === "memory weak_signal boost"), "dashboard planner removes hidden memory score boosts");
  assert(/Restore 1 hidden/.test(env.elements["#memory-facts"].innerHTML), "dashboard offers memory fact restore");
  invokeDashboardFunction(env, "restoreDeletedMemoryFacts");
  assert(!env.storage["plata:learner-memory:deleted-facts:v1"], "dashboard clears hidden memory fact ids");
  assert(/Weak signal: passive-agency/.test(env.elements["#memory-facts"].innerHTML), "dashboard restores hidden memory facts");

  vm.runInContext(`correctMemoryFact(${JSON.stringify(weakFact.id)})`, env.context, { filename: "dashboard.js" });
  const correctionRecords = JSON.parse(env.storage["plata:learner-memory:corrections:v1"] || "[]");
  assert(correctionRecords.some(record => record.factId === weakFact.id), "dashboard persists learner memory correction records");
  assert(correctionRecords.some(record => record.sourceFingerprint === weakFact.sourceFingerprint), "dashboard correction records preserve source fingerprints");
  assert(/corrected facts/.test(env.elements["#memory-facts"].innerHTML), "dashboard shows corrected memory fact count");
  assert(/Restore 1 corrected/.test(env.elements["#memory-facts"].innerHTML), "dashboard offers corrected fact restore");
  assert(/Corrected assumptions/.test(env.elements["#memory-facts"].innerHTML), "dashboard renders corrected memory audit trail");
  assert(env.elements["#memory-facts"].innerHTML.includes(weakFact.id), "dashboard audit trail includes corrected fact id");
  assert(env.elements["#memory-facts"].innerHTML.includes(weakFact.sourceFingerprint), "dashboard audit trail includes corrected source fingerprint");
  assert(/Restore fact/.test(env.elements["#memory-facts"].innerHTML), "dashboard audit trail restores one corrected fact");
  assert(!/Weak signal: passive-agency/.test(env.elements["#memory-facts"].innerHTML), "dashboard removes corrected facts from visible memory");
  const correctedCandidates = invokeDashboardFunction(env, "dashboardCandidates");
  const correctedRepairCandidate = correctedCandidates.find(item => item.trainer.id === "lesson-b2-radiator-register");
  assert(!(correctedRepairCandidate.decision.trace.inputs.selectedMemoryFacts || []).some(fact => fact.id === weakFact.id), "dashboard planner ignores corrected memory facts");
  assert(!correctedRepairCandidate.decision.trace.scoreBreakdown.some(part => part.label === "memory weak_signal boost"), "dashboard planner removes corrected memory score boosts");
  assert(!/Study companion/.test(env.elements["#practice-plan"].innerHTML), "dashboard companion receipt disappears when no cited memory fact remains");
  vm.runInContext(`restoreMemoryCorrection(${JSON.stringify(weakFact.id)})`, env.context, { filename: "dashboard.js" });
  assert(!env.storage["plata:learner-memory:corrections:v1"], "dashboard restores a single corrected memory fact");
  assert(/Weak signal: passive-agency/.test(env.elements["#memory-facts"].innerHTML), "dashboard returns individually restored memory facts");
  assert(!/Corrected assumptions/.test(env.elements["#memory-facts"].innerHTML), "dashboard removes empty correction audit trail");
  vm.runInContext(`correctMemoryFact(${JSON.stringify(weakFact.id)})`, env.context, { filename: "dashboard.js" });
  invokeDashboardFunction(env, "restoreMemoryCorrections");
  assert(!env.storage["plata:learner-memory:corrections:v1"], "dashboard clears memory correction records");
  assert(/Weak signal: passive-agency/.test(env.elements["#memory-facts"].innerHTML), "dashboard restores corrected memory facts");
}

function runStartedPlanSmoke() {
  const env = makeContext();
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  seedWeakMasteryState(env);
  vm.runInContext(catalogSource, env.context, { filename: "shared/plata-catalog.js" });
  vm.runInContext(lesson01Source, env.context, { filename: "lessons/lesson-01/data.js" });
  vm.runInContext(radiatorLessonSource, env.context, { filename: "lessons/lesson-b2-radiator/data.js" });
  vm.runInContext(jobFollowupLessonSource, env.context, { filename: "lessons/lesson-b2-job-followup/data.js" });
  vm.runInContext(ordstillingLessonSource, env.context, { filename: "lessons/lesson-b2-ordstilling/data.js" });
  vm.runInContext(competencySource, env.context, { filename: "shared/plata-competencies.js" });
  vm.runInContext(plannerSource, env.context, { filename: "shared/plata-planner.js" });
  vm.runInContext(evidenceSource, env.context, { filename: "shared/plata-evidence.js" });
  vm.runInContext(eventsSource, env.context, { filename: "shared/plata-events.js" });
  vm.runInContext(memorySource, env.context, { filename: "shared/plata-memory.js" });
  vm.runInContext(advisorSource, env.context, { filename: "shared/plata-advisor.js" });
  vm.runInContext(companionSource, env.context, { filename: "shared/plata-companion.js" });

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
  assert(/Active route/.test(env.elements["#today-program"].innerHTML), "dashboard Today shell labels an active saved route");
  assert(/Resume Repair Read passive agency/.test(env.elements["#today-program"].innerHTML), "dashboard Today shell promotes the active step");
  assert(/active-plan/.test(env.elements["#today-program"].innerHTML), "dashboard Today shell exposes the active-plan state");
  assert(/Resume step/.test(env.elements["#today-program"].innerHTML), "dashboard Today shell resumes the active step");
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
  vm.runInContext(lesson01Source, env.context, { filename: "lessons/lesson-01/data.js" });
  vm.runInContext(radiatorLessonSource, env.context, { filename: "lessons/lesson-b2-radiator/data.js" });
  vm.runInContext(jobFollowupLessonSource, env.context, { filename: "lessons/lesson-b2-job-followup/data.js" });
  vm.runInContext(ordstillingLessonSource, env.context, { filename: "lessons/lesson-b2-ordstilling/data.js" });
  vm.runInContext(competencySource, env.context, { filename: "shared/plata-competencies.js" });
  vm.runInContext(plannerSource, env.context, { filename: "shared/plata-planner.js" });
  vm.runInContext(evidenceSource, env.context, { filename: "shared/plata-evidence.js" });
  vm.runInContext(eventsSource, env.context, { filename: "shared/plata-events.js" });
  vm.runInContext(memorySource, env.context, { filename: "shared/plata-memory.js" });
  vm.runInContext(advisorSource, env.context, { filename: "shared/plata-advisor.js" });
  vm.runInContext(companionSource, env.context, { filename: "shared/plata-companion.js" });
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
  assert(/Repair workplace answer is now in your practice record/.test(html), "dashboard return receipt names the returned step");
  assert(/Continue next step/.test(html), "dashboard return receipt offers the next step");
  assert(/Step 2 of 2/.test(html), "dashboard return receipt identifies the next step");
  assert(/Chosen from the saved practice plan/.test(html), "dashboard return receipt explains the next saved step");
  assert(html.includes("./vocab-sr/"), "dashboard return receipt links to the next unfinished step");
  const todayHtml = env.elements["#today-program"].innerHTML;
  assert(/Progress recorded/.test(todayHtml), "dashboard Today shell labels a plan-step return");
  assert(/Step recorded\. Continue the route\./.test(todayHtml), "dashboard Today shell confirms the return before continuing");
  assert(/return/.test(todayHtml), "dashboard Today shell exposes the return state");
  assert(/Returned from step 1/.test(todayHtml), "dashboard Today shell identifies the returned step");
  assert(/Continue next step/.test(todayHtml), "dashboard Today shell promotes the next post-return step");
}

function runDueReviewProgramSmoke() {
  const env = makeContext();
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  seedDueReviewState(env);
  vm.runInContext(catalogSource, env.context, { filename: "shared/plata-catalog.js" });
  vm.runInContext(lesson01Source, env.context, { filename: "lessons/lesson-01/data.js" });
  vm.runInContext(radiatorLessonSource, env.context, { filename: "lessons/lesson-b2-radiator/data.js" });
  vm.runInContext(jobFollowupLessonSource, env.context, { filename: "lessons/lesson-b2-job-followup/data.js" });
  vm.runInContext(ordstillingLessonSource, env.context, { filename: "lessons/lesson-b2-ordstilling/data.js" });
  vm.runInContext(competencySource, env.context, { filename: "shared/plata-competencies.js" });
  vm.runInContext(plannerSource, env.context, { filename: "shared/plata-planner.js" });
  vm.runInContext(evidenceSource, env.context, { filename: "shared/plata-evidence.js" });
  vm.runInContext(eventsSource, env.context, { filename: "shared/plata-events.js" });
  vm.runInContext(memorySource, env.context, { filename: "shared/plata-memory.js" });
  vm.runInContext(advisorSource, env.context, { filename: "shared/plata-advisor.js" });
  vm.runInContext(companionSource, env.context, { filename: "shared/plata-companion.js" });
  vm.runInContext(dashboardSource, env.context, { filename: "dashboard.js" });

  const todayHtml = env.elements["#today-program"].innerHTML;
  assert(/Memory review/.test(todayHtml), "dashboard Today shell labels due memory review");
  assert(/Review formal-register-control/.test(todayHtml), "dashboard Today shell names the due signal");
  assert(/memory-review/.test(todayHtml), "dashboard Today shell exposes the memory-review state");
  assert(/Review due/.test(todayHtml), "dashboard Today shell shows the due-review stage");
  assert(/next_review_due/.test(todayHtml), "dashboard Today shell cites the due-review memory kind");
  assert(/Cited memory/.test(todayHtml), "dashboard Today shell keeps due reviews cited");
  assert(!/raw due-review/.test(todayHtml), "dashboard Today shell does not leak raw due-review answers");
  assert(/Memory: next_review_due formal-register-control memsrc-/.test(env.elements["#practice-plan"].innerHTML), "dashboard practice plan cites the due-review fact");
}

function runClosedMasterySmoke() {
  const env = makeContext();
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  seedClosedMasteryState(env);
  vm.runInContext(catalogSource, env.context, { filename: "shared/plata-catalog.js" });
  vm.runInContext(lesson01Source, env.context, { filename: "lessons/lesson-01/data.js" });
  vm.runInContext(radiatorLessonSource, env.context, { filename: "lessons/lesson-b2-radiator/data.js" });
  vm.runInContext(jobFollowupLessonSource, env.context, { filename: "lessons/lesson-b2-job-followup/data.js" });
  vm.runInContext(ordstillingLessonSource, env.context, { filename: "lessons/lesson-b2-ordstilling/data.js" });
  vm.runInContext(competencySource, env.context, { filename: "shared/plata-competencies.js" });
  vm.runInContext(plannerSource, env.context, { filename: "shared/plata-planner.js" });
  vm.runInContext(evidenceSource, env.context, { filename: "shared/plata-evidence.js" });
  vm.runInContext(eventsSource, env.context, { filename: "shared/plata-events.js" });
  vm.runInContext(memorySource, env.context, { filename: "shared/plata-memory.js" });
  vm.runInContext(advisorSource, env.context, { filename: "shared/plata-advisor.js" });
  vm.runInContext(companionSource, env.context, { filename: "shared/plata-companion.js" });
  vm.runInContext(dashboardSource, env.context, { filename: "dashboard.js" });

  const dueHtml = env.elements["#due-cards"].children.map(child => child.innerHTML).join("\n");
  const planHtml = env.elements["#practice-plan"].innerHTML;
  assert(/No repair pattern is active yet/.test(env.elements["#mastery-list"].innerHTML), "dashboard retires closed mastery signal");
  assert(/No root-skill pattern needs attention yet/.test(env.elements["#competency-list"].innerHTML), "dashboard retires closed root competency");
  assert(!/signal=passive-agency/.test(env.elements["#mastery-list"].innerHTML), "dashboard closed mastery list has no repair link");
  assert(!/signal=passive-agency/.test(dueHtml), "dashboard closed due cards have no repair link");
  assert(!/signal=passive-agency/.test(planHtml), "dashboard closed practice plan has no repair link");
  assert(!/Open repair scene/.test(dueHtml), "dashboard closed due cards do not use repair CTA");
  assert(/Resolved/.test(env.elements["#evidence-ledger"].innerHTML), "dashboard evidence ledger shows closed repairs");
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
  vm.runInContext(eventsSource, env.context, { filename: "shared/plata-events.js" });
  vm.runInContext(memorySource, env.context, { filename: "shared/plata-memory.js" });
  vm.runInContext(advisorSource, env.context, { filename: "shared/plata-advisor.js" });
  vm.runInContext(companionSource, env.context, { filename: "shared/plata-companion.js" });
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
  exportEnv.context.PlataGuidedSession.recordOutcome({
    plan,
    step: plan.steps[0],
    evidence: plan.steps[0].completionEvidence,
    completedAt: plan.steps[0].completedAt,
    recordedAt: plan.steps[0].completedAt,
    source: "dashboard-portable-profile-smoke"
  });
  invokeDashboardFunction(exportEnv, "renderDashboard");
  assert(/plan-progress/.test(exportEnv.elements["#practice-plan"].innerHTML), "dashboard renders practice plan progress");
  assert(/plan-step-ledger/.test(exportEnv.elements["#practice-plan"].innerHTML), "dashboard renders practice plan execution ledger");
  assert(/Completed/.test(exportEnv.elements["#practice-plan"].innerHTML), "dashboard explains when a plan step completed");
  assert(/Successful completion recorded/.test(exportEnv.elements["#practice-plan"].innerHTML), "dashboard explains plan completion evidence");
  assert(/Outcome history/.test(exportEnv.elements["#guided-session-panel"].innerHTML), "dashboard renders guided outcome receipt history");
  assert(/gdo-/.test(exportEnv.elements["#guided-session-panel"].innerHTML), "dashboard guided outcome history includes receipt fingerprint");

  invokeDashboardFunction(exportEnv, "exportAll");
  const payload = parseLastExport(exportEnv);
  assert(payload.profileSchemaVersion === 1, "dashboard export marks profile schema version");
  assert(payload.practicePlan && payload.practicePlan.steps.length, "dashboard export includes active practice plan");
  assert(payload.practicePlan.steps[0].completedAt === plan.steps[0].completedAt, "dashboard export includes plan execution ledger");
  assert(payload.practicePlan.steps[0].trace && payload.practicePlan.steps[0].trace.fingerprint, "dashboard export includes practice-plan trace");
  assert(payload.eventLog && payload.eventLog.schemaVersion === 1, "dashboard export includes an event-log payload");
  assert(payload.eventLog.events.some(event => event.type === "plan.step.completed"), "dashboard export event log includes plan completion events");
  assert(payload.eventLog.replay.plans[payload.practicePlan.planToken].completedSteps === 1, "dashboard export event log includes replayed plan facts");
  assert(payload.memory && payload.memory.schemaVersion === 1, "dashboard export includes memory facts");
  assert(payload.memory.fingerprint && payload.memory.fingerprint.startsWith("mem-"), "dashboard export includes memory fingerprint");
  assert(payload.memory.facts.some(fact => fact.kind === "preferred_context"), "dashboard export includes derived memory fact rows");
  assert(Array.isArray(payload.memory.correctionRecords), "dashboard export includes learner memory corrections");
  assert(!JSON.stringify(payload.memory).includes("should not leak"), "dashboard memory export excludes raw plan answer text");
  assert(payload.learnerModel && payload.learnerModel.modelType === "plata.learner-model", "dashboard export includes local learner model");
  assert(payload.learnerModel.sourceMemoryFingerprint === payload.memory.fingerprint, "dashboard learner model cites exported memory fingerprint");
  assert(payload.learnerModel.guardrails && payload.learnerModel.guardrails.usesOnlyCitedFacts === true, "dashboard learner model declares cited-fact guardrail");
  assert(payload.learnerModel.guardrails && payload.learnerModel.guardrails.containsRawAnswerText === false, "dashboard learner model excludes raw answer text");
  assert(payload.learnerModel.recommendedFocus.kind === "inspect" || payload.learnerModel.recommendedFocus.citedFactIds.length > 0, "dashboard learner model focus cites facts");
  assert(!Object.prototype.hasOwnProperty.call(payload.learnerModel, "eventLog"), "dashboard learner model excludes event log payloads");
  assert(!Object.prototype.hasOwnProperty.call(payload.learnerModel, "sourceEventIds"), "dashboard learner model excludes source event ids");
  assert(!JSON.stringify(payload.learnerModel).includes("should not leak"), "dashboard learner model excludes raw plan answer text");
  assert(payload.memoryVault && payload.memoryVault.vaultType === "plata.memory-vault", "dashboard export includes derived memory vault");
  assert(payload.memoryVault.privacy && payload.memoryVault.privacy.derivedFactsOnly === true, "dashboard memory vault declares derived-facts-only privacy");
  assert(payload.memoryVault.privacy && payload.memoryVault.privacy.excludesEventLog === true, "dashboard memory vault excludes event logs");
  assert(payload.memoryVault.facts.every(fact => !Object.prototype.hasOwnProperty.call(fact, "sourceEventIds")), "dashboard memory vault strips source event ids");
  assert(!Object.prototype.hasOwnProperty.call(payload.memoryVault, "trainers"), "dashboard memory vault excludes trainer state");
  assert(!Object.prototype.hasOwnProperty.call(payload.memoryVault, "eventLog"), "dashboard memory vault excludes event log payloads");
  assert(!Object.prototype.hasOwnProperty.call(payload.memoryVault, "practicePlan"), "dashboard memory vault excludes practice plans");
  assert(!JSON.stringify(payload.memoryVault).includes("should not leak"), "dashboard memory vault excludes raw plan answer text");
  assert(payload.memoryBrief && payload.memoryBrief.briefType === "plata.memory-brief", "dashboard export includes agent-readable memory brief");
  assert(payload.memoryBrief.sourceVaultFingerprint === payload.memoryVault.fingerprint, "dashboard memory brief cites exported vault fingerprint");
  assert(payload.memoryBrief.guardrails && payload.memoryBrief.guardrails.usesOnlyCitedFacts === true, "dashboard memory brief declares cited-fact guardrail");
  assert(payload.memoryBrief.guardrails && payload.memoryBrief.guardrails.containsRawAnswerText === false, "dashboard memory brief excludes raw answer text");
  assert(payload.memoryBrief.focus.kind === "inspect" || payload.memoryBrief.focus.citedFactIds.length > 0, "dashboard memory brief focus cites facts");
  assert(!JSON.stringify(payload.memoryBrief).includes("should not leak"), "dashboard memory brief excludes raw plan answer text");
  assert(payload.agentHandoff && payload.agentHandoff.handoffType === "plata.agent-handoff", "dashboard export includes agent handoff packet");
  assert(payload.agentHandoff.sourceBriefFingerprint === payload.memoryBrief.fingerprint, "dashboard agent handoff cites exported memory brief fingerprint");
  assert(payload.agentHandoff.sourceVaultFingerprint === payload.memoryVault.fingerprint, "dashboard agent handoff cites exported vault fingerprint");
  assert(payload.agentHandoff.guardrails && payload.agentHandoff.guardrails.usesOnlyCitedFacts === true, "dashboard agent handoff declares cited-fact guardrail");
  assert(payload.agentHandoff.guardrails && payload.agentHandoff.guardrails.containsRawAnswerText === false, "dashboard agent handoff excludes raw answer text");
  assert(payload.agentHandoff.responseContract && payload.agentHandoff.responseContract.maxRecommendations === 1, "dashboard agent handoff limits recommendations");
  assert(payload.agentHandoff.task.kind === "inspect-memory" || payload.agentHandoff.requiredCitations.length >= payload.agentHandoff.task.requiredCitationCount, "dashboard agent handoff includes required citations");
  assert(!Object.prototype.hasOwnProperty.call(payload.agentHandoff, "memoryVault"), "dashboard agent handoff does not embed memory vault");
  assert(!Object.prototype.hasOwnProperty.call(payload.agentHandoff, "eventLog"), "dashboard agent handoff does not embed event log");
  assert(!Object.prototype.hasOwnProperty.call(payload.agentHandoff, "practicePlan"), "dashboard agent handoff does not embed practice plan");
  assert(!JSON.stringify(payload.agentHandoff).includes("should not leak"), "dashboard agent handoff excludes raw plan answer text");
  assert(payload.companion && payload.companion.companionType === "plata.companion-card", "dashboard export includes lightweight companion card");
  assert(payload.companion.guardrails && payload.companion.guardrails.requiresModel === false, "dashboard companion card does not require a model");
  assert(payload.companion.guardrails && payload.companion.guardrails.externalAgentOptional === true, "dashboard companion keeps Hermes optional");
  assert(payload.companion.nextAction && payload.companion.nextAction.label, "dashboard companion card preserves one next action");
  assert(payload.companion.citedFacts.length > 0, "dashboard companion card cites learner memory facts");
  assert(!Object.prototype.hasOwnProperty.call(payload.companion, "eventLog"), "dashboard companion card does not embed event log");
  assert(!Object.prototype.hasOwnProperty.call(payload.companion, "practicePlan"), "dashboard companion card does not embed practice plan");
  assert(!JSON.stringify(payload.companion).includes("should not leak"), "dashboard companion card excludes raw plan answer text");
  assert(payload.hermesBrief && payload.hermesBrief.briefType === "plata.hermes-bridge-brief", "dashboard export includes Hermes bridge brief");
  assert(payload.hermesBrief.sourceCompanionFingerprint === payload.companion.fingerprint, "Hermes bridge cites source companion card");
  assert(payload.hermesBrief.sourceHandoffFingerprint === payload.agentHandoff.fingerprint, "Hermes bridge cites source handoff packet");
  assert(payload.hermesBrief.guardrails && payload.hermesBrief.guardrails.readOnlyBridge === true, "Hermes bridge is read-only");
  assert(payload.hermesBrief.guardrails && payload.hermesBrief.guardrails.requiresModel === false, "Hermes bridge does not make models mandatory");
  assert(payload.hermesBrief.responseContract && payload.hermesBrief.responseContract.maxRecommendations === 1, "Hermes bridge limits recommendations");
  assert(payload.hermesBrief.blockedActions.includes("write Plata memory or planner state"), "Hermes bridge blocks memory writes");
  assert(!Object.prototype.hasOwnProperty.call(payload.hermesBrief, "eventLog"), "Hermes bridge does not embed event log");
  assert(!Object.prototype.hasOwnProperty.call(payload.hermesBrief, "memoryVault"), "Hermes bridge does not embed memory vault");
  assert(!JSON.stringify(payload.hermesBrief).includes("should not leak"), "Hermes bridge excludes raw plan answer text");
  assert(payload.guidedSessionOutcomes && payload.guidedSessionOutcomes.ledgerType === "plata.guided-session-outcome-ledger.v1", "dashboard export includes guided session outcome ledger");
  assert(payload.guidedSessionOutcomes.totals.outcomes === 1, "dashboard export includes guided outcome receipt count");
  assert(payload.guidedSessionOutcomes.outcomes[0].fingerprint.startsWith("gdo-"), "dashboard export includes guided outcome fingerprint");
  assert(payload.guidedSessionOutcomes.outcomes[0].completionEvidence.reason === "smoke-test", "dashboard export includes guided completion evidence");
  assert(!JSON.stringify(payload.guidedSessionOutcomes).includes("should not leak"), "dashboard guided outcome ledger excludes raw plan answer text");

  const importEnv = makeContext();
  loadKernelAndDashboard(importEnv);
  const portableFact = payload.memory.facts[0];
  assert(portableFact, "dashboard export profile has a fact available for correction");
  vm.runInContext(`correctMemoryFact(${JSON.stringify(portableFact.id)})`, exportEnv.context, { filename: "dashboard.js" });
  invokeDashboardFunction(exportEnv, "exportAll");
  const correctedPayload = parseLastExport(exportEnv);
  assert(correctedPayload.memory.correctionRecords.some(record => record.factId === portableFact.id), "dashboard export preserves memory correction records");

  invokeDashboardFunction(importEnv, "importAll");
  importEnv.elements["#import-file"].files = [{ content: JSON.stringify(correctedPayload) }];
  importEnv.elements["#import-file"].onchange();
  const importedPlan = importEnv.context.PlataPlanner.readPracticePlan();
  assert(importedPlan && importedPlan.steps.length, "dashboard import restores active practice plan");
  assert(importedPlan.steps[0].completedAt === correctedPayload.practicePlan.steps[0].completedAt, "dashboard import restores plan execution ledger");
  assert((importEnv.storage[importEnv.context.PlataGuidedSession.outcomeStorageKey] || "").includes("plata.guided-session-outcome-ledger.v1"), "dashboard import restores guided outcome ledger");
  assert(!importEnv.storage["plata:learner-memory:deleted-facts:v1"], "dashboard import restores empty memory deletion set");
  assert((importEnv.storage["plata:learner-memory:corrections:v1"] || "").includes(portableFact.id), "dashboard import restores memory correction records");
  assert((importEnv.storage["plata:learner-memory:vault:v1"] || "").includes("plata.memory-vault"), "dashboard import stores merged memory vault");
  invokeDashboardFunction(importEnv, "renderDashboard");
  assert(/Corrected assumptions/.test(importEnv.elements["#memory-facts"].innerHTML), "dashboard import renders memory correction audit trail");
  assert(importEnv.elements["#memory-facts"].innerHTML.includes(portableFact.id), "dashboard import audit trail includes corrected fact id");
  assert(/Outcome history/.test(importEnv.elements["#guided-session-panel"].innerHTML), "dashboard import renders guided outcome history");

  const vaultOnlyEnv = makeContext();
  loadKernelAndDashboard(vaultOnlyEnv);
  const preVaultPlan = vaultOnlyEnv.context.PlataPlanner.readPracticePlan();
  assert(preVaultPlan && preVaultPlan.planToken, "dashboard has an active plan before standalone vault import");
  const standaloneFact = payload.memoryVault.facts[0];
  assert(standaloneFact, "dashboard export has a vault fact for standalone import");
  invokeDashboardFunction(vaultOnlyEnv, "importAll");
  vaultOnlyEnv.elements["#import-file"].files = [{ content: JSON.stringify(payload.memoryVault) }];
  vaultOnlyEnv.elements["#import-file"].onchange();
  const postVaultPlan = vaultOnlyEnv.context.PlataPlanner.readPracticePlan();
  assert(postVaultPlan && postVaultPlan.planToken === preVaultPlan.planToken, "standalone vault import preserves active practice plan");
  assert((vaultOnlyEnv.storage["plata:learner-memory:vault:v1"] || "").includes("plata.memory-vault"), "standalone vault import stores account memory vault");
  const vaultBundle = vm.runInContext("buildMemoryFacts()", vaultOnlyEnv.context, { filename: "dashboard.js" });
  assert(vaultBundle.facts.some(fact => fact.id === standaloneFact.id), "standalone vault import feeds account facts into dashboard memory");
  assert(!JSON.stringify(vaultBundle).includes("should not leak"), "standalone vault import keeps raw answer text out of dashboard memory");

  const legacyEnv = makeContext();
  loadKernelAndDashboard(legacyEnv);
  assert(legacyEnv.context.PlataPlanner.readPracticePlan(), "dashboard starts with a plan before legacy import");
  legacyEnv.storage["plata:learner-memory:corrections:v1"] = JSON.stringify([{ factId: "legacy-corrected" }]);
  legacyEnv.storage["plata:learner-memory:vault:v1"] = JSON.stringify(correctedPayload.memoryVault);
  legacyEnv.storage[legacyEnv.context.PlataGuidedSession.outcomeStorageKey] = JSON.stringify(correctedPayload.guidedSessionOutcomes);
  invokeDashboardFunction(legacyEnv, "importAll");
  legacyEnv.elements["#import-file"].files = [{ content: JSON.stringify({ schemaVersion: 2, trainers: {} }) }];
  legacyEnv.elements["#import-file"].onchange();
  assert(!legacyEnv.context.PlataPlanner.readPracticePlan(), "legacy dashboard import clears stale active plan");
  assert(!legacyEnv.storage["plata:learner-memory:deleted-facts:v1"], "legacy dashboard import clears stale hidden memory facts");
  assert(!legacyEnv.storage["plata:learner-memory:corrections:v1"], "legacy dashboard import clears stale corrected memory facts");
  assert(!legacyEnv.storage["plata:learner-memory:vault:v1"], "legacy dashboard import clears stale account memory vault");
  assert(!JSON.parse(legacyEnv.storage[legacyEnv.context.PlataGuidedSession.outcomeStorageKey] || "{}").outcomes.length, "legacy dashboard import clears stale guided outcome receipts");
}

async function run() {
  runEmptyDashboardSmoke();
  runDemoLearnerSmoke();
  runSeededMasterySmoke();
  runStartedPlanSmoke();
  runPrimaryPlanActionSmoke();
  runPlanReturnReceiptSmoke();
  runDueReviewProgramSmoke();
  runClosedMasterySmoke();
  await runDynamicCatalogSmoke();
  runPortableProfileSmoke();

  console.log("ok - dashboard renders without runtime errors");
  console.log("ok - dashboard renders mastery signal diagnostics");
  console.log("ok - dashboard renders competency graph diagnostics");
  console.log("ok - dashboard renders compiled practice plans");
  console.log("ok - dashboard persists active practice-plan tracking");
  console.log("ok - dashboard renders active practice-plan execution state");
  console.log("ok - dashboard renders Today program shell");
  console.log("ok - dashboard renders read-only demo learner mode");
  console.log("ok - dashboard renders Today program shell states");
  console.log("ok - dashboard promotes the next actionable practice-plan step");
  console.log("ok - dashboard confirms plan-step returns from trainer routes");
  console.log("ok - dashboard explains why planner steps were selected");
  console.log("ok - dashboard explains practice-plan execution evidence");
  console.log("ok - dashboard renders the learning evidence ledger");
  console.log("ok - dashboard renders inspectable learner memory facts");
  console.log("ok - dashboard lets learners correct memory facts");
  console.log("ok - dashboard renders explainable study companion receipts");
  console.log("ok - dashboard renders mastery repair paths");
  console.log("ok - dashboard retires closed mastery repairs");
  console.log("ok - dashboard loads lesson data from catalog");
  console.log("ok - dashboard exports and imports portable practice profiles");
}

run().catch(err => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});

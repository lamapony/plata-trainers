#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..");
const kernelSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-kernel.js"), "utf8");
const competencySource = fs.readFileSync(path.join(repoRoot, "shared", "plata-competencies.js"), "utf8");
const plannerSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-planner.js"), "utf8");
const catalogSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-catalog.js"), "utf8");
const radiatorLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-radiator", "data.js"), "utf8");
const ordstillingLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-ordstilling", "data.js"), "utf8");
const jobFollowupLessonSource = fs.readFileSync(path.join(repoRoot, "lessons", "lesson-b2-job-followup", "data.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeContext() {
  const storage = {};
  const context = {
    console,
    Date,
    JSON,
    Math,
    Number,
    Object,
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
  vm.runInContext(competencySource, context, { filename: "shared/plata-competencies.js" });
  vm.runInContext(plannerSource, context, { filename: "shared/plata-planner.js" });
  vm.runInContext(catalogSource, context, { filename: "shared/plata-catalog.js" });
  vm.runInContext(radiatorLessonSource, context, { filename: "lessons/lesson-b2-radiator/data.js" });
  vm.runInContext(ordstillingLessonSource, context, { filename: "lessons/lesson-b2-ordstilling/data.js" });
  vm.runInContext(jobFollowupLessonSource, context, { filename: "lessons/lesson-b2-job-followup/data.js" });
  return context;
}

function seedWeakLesson(context) {
  const kernel = context.PlataKernel;
  const state = kernel.freshState("lesson-b2-radiator-register");
  kernel.recordAttempt(state, {
    itemId: "official-reply-passive",
    correct: false,
    tags: ["B2", "passive", "passive-agency"],
    mode: "lesson",
    expected: "De har registreret sagen, men de lover ikke en dato.",
    given: "De lover, at radiatoren bliver fikset hurtigt."
  });
  return state;
}

function runLessonDecisionSmoke(context) {
  const kernel = context.PlataKernel;
  const state = seedWeakLesson(context);
  const decision = context.PlataPlanner.lessonDecision({
    lesson: context.PLATA_LESSON_B2_RADIATOR,
    state,
    rootPrefix: "../../"
  });

  assert(decision.kind === "repair", "weak lesson should recommend repair");
  assert(decision.score > 100, "repair decision should have high score");
  assert(decision.primaryHref.includes("mode=repair"), "repair decision should open repair mode");
  assert(decision.primaryHref.includes("signal=passive-agency"), "repair decision should carry signal");
  assert(decision.primaryHref.includes("#official-reply-passive"), "repair decision should carry source scene");
  assert(decision.competency.id === "agency", "lesson repair carries root competency");
  assert(decision.trace.rule === "lesson.repair.weak-mastery", "lesson repair carries a planner trace rule");
  assert(decision.trace.inputs.selectedSignal.tag === "passive-agency", "lesson repair trace records the selected signal");
  assert(decision.trace.score === decision.score, "lesson repair trace records the decision score");
  assert(decision.trace.scoreBreakdown.some(part => part.label === "missed attempts"), "lesson repair trace records score parts");

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
  const afterRepair = context.PlataPlanner.lessonDecision({
    lesson: context.PLATA_LESSON_B2_RADIATOR,
    state,
    rootPrefix: "../../"
  });
  assert(afterRepair.kind !== "repair", "closed weak lesson should not recommend repair");
  assert(!kernel.getWeakTags(state, 10).some(item => item.tag === "passive-agency"), "planner sees only open weak signals");
  assert(kernel.getWeakTags(state, 10, { includeResolved: true }).some(item => item.tag === "passive-agency"), "planner diagnostics can inspect repaired weak signals");

  kernel.recordAttempt(state, {
    itemId: "official-reply-passive-later",
    correct: false,
    tags: ["B2", "passive", "passive-agency"],
    mode: "lesson",
    expected: "De har registreret sagen, men de lover ikke en dato.",
    given: "De lover en hurtig reparation."
  });
  const reopened = context.PlataPlanner.lessonDecision({
    lesson: context.PLATA_LESSON_B2_RADIATOR,
    state,
    rootPrefix: "../../"
  });
  assert(reopened.kind === "repair", "later miss should reopen lesson repair");
}

function runDrillRepairRoutingSmoke(context) {
  const catalog = context.PlataCatalog;
  const kernel = context.PlataKernel;
  const drill = catalog.drillForSignal("v2-placement");
  assert(drill && drill.id === "ordstilling", "catalog maps v2-placement to ordstilling drill");
  const link = catalog.drillRepairLink(drill, "v2-placement", "lesson-b2-ordstilling");
  assert(link.includes("ordstilling-drill"), "drill repair link targets ordstilling drill");
  assert(link.includes("signal=v2-placement"), "drill repair link carries mastery signal");
  assert(link.includes("from=lesson-b2-ordstilling"), "drill repair link carries source lesson");

  const inversionRemediation = catalog.drillRemediation("inversion-fronted-adverbial", "lesson-b2-ordstilling");
  assert(inversionRemediation && inversionRemediation.href.includes("cat=inversion"), "ordstilling lesson inversion miss should open inversion category");
  const clauseRemediation = catalog.drillRemediation("fordi-derfor-clause", "lesson-b2-ordstilling");
  assert(clauseRemediation && clauseRemediation.href.includes("cat=ledsaetning"), "ordstilling lesson clause miss should open ledsætning category");

  const registerDrill = catalog.drillForSignal("passive-agency");
  assert(registerDrill && registerDrill.id === "register", "catalog maps passive-agency to register drill");
  const registerLink = catalog.drillRepairLink(registerDrill, "passive-agency", "lesson-b2-radiator-register");
  assert(registerLink.includes("register-drill"), "register drill repair link targets register drill");
  assert(registerLink.includes("signal=passive-agency"), "register drill repair link carries mastery signal");
  assert(registerLink.includes("from=lesson-b2-radiator-register"), "register drill repair link carries source lesson");

  const channelLink = catalog.drillRepairLink(registerDrill, "formal-register-control", "lesson-b2-radiator-register", { cat: "channel" });
  assert(channelLink.includes("cat=channel"), "register drill channel link carries category");
  const channelRemediation = catalog.drillRemediation("understatement-with-agency", "lesson-b2-radiator-register");
  assert(channelRemediation && channelRemediation.href.includes("cat=channel"), "radiator channel signals should open channel drill category");

  const closingRemediation = catalog.drillRemediation("consequence-aware-tone", "lesson-b2-job-followup");
  assert(closingRemediation && closingRemediation.href.includes("register-drill"), "job follow-up closing miss should open register drill");
  assert(closingRemediation.href.includes("cat=deadline"), "job follow-up consequence-aware-tone should open deadline category");
  assert(closingRemediation.href.includes("from=lesson-b2-job-followup"), "job follow-up drill remediation carries source lesson");

  const radState = kernel.freshState("lesson-b2-radiator-register");
  kernel.recordAttempt(radState, {
    itemId: "official-reply-passive-too-trusting",
    correct: false,
    tags: ["B2", "passive", "passive-agency"],
    mode: "lesson",
    expected: "De har registreret sagen, men de lover ikke en dato.",
    given: "De lover en hurtig reparation."
  });
  const radDecision = context.PlataPlanner.lessonDecision({
    lesson: context.PLATA_LESSON_B2_RADIATOR,
    state: radState,
    rootPrefix: "../../"
  });
  assert(radDecision.kind === "repair", "radiator lesson miss should recommend repair");
  assert(radDecision.secondaryHref.includes("register-drill"), "radiator lesson repair should offer register drill secondary");
  assert(radDecision.secondaryHref.includes("signal=passive-agency"), "radiator drill secondary carries signal");

  const state = kernel.freshState("lesson-b2-ordstilling");
  kernel.recordAttempt(state, {
    itemId: "hotel-question",
    correct: false,
    tags: ["B2", "v2-placement"],
    mode: "lesson",
    expected: "Hvor ligger konferencelokalet?",
    given: "værelse"
  });
  const decision = context.PlataPlanner.lessonDecision({
    lesson: context.PLATA_LESSON_B2_ORDSTILLING,
    state,
    rootPrefix: "../../"
  });
  assert(decision.kind === "repair", "ordstilling lesson miss should recommend repair");
  assert(decision.secondaryHref.includes("ordstilling-drill"), "ordstilling lesson repair should offer drill secondary");
  assert(decision.secondaryHref.includes("signal=v2-placement"), "lesson drill secondary carries signal");

  const jobState = kernel.freshState("lesson-b2-job-followup");
  kernel.recordAttempt(jobState, {
    itemId: "email-closing",
    correct: false,
    tags: ["B2", "consequence-aware-tone", "professional-email-agency"],
    mode: "lesson",
    expected: "Jeg ser frem til at høre om næste skridt i processen og står naturligvis til rådighed, hvis I har brug for yderligere oplysninger.",
    given: "Jeg forventer svar senest fredag, da jeg har andre processer kørende."
  });
  const jobDecision = context.PlataPlanner.lessonDecision({
    lesson: context.PLATA_LESSON_B2_JOB_FOLLOWUP,
    state: jobState,
    rootPrefix: "../../"
  });
  assert(jobDecision.kind === "repair", "job follow-up closing miss should recommend repair");
  assert(jobDecision.secondaryHref.includes("register-drill"), "job follow-up repair should offer register drill secondary");
  assert(jobDecision.secondaryHref.includes("cat=deadline"), "job follow-up drill secondary opens deadline category");
  assert(jobDecision.vocabRepair && jobDecision.vocabRepair.kind === "vocab", "job follow-up repair should offer vocab remediation");
  assert(jobDecision.vocabRepair.href.includes("scene=email-closing"), "job follow-up vocab repair carries source scene");

  const vocabLink = catalog.vocabRepairLink("lesson-b2-job-followup", "email-closing");
  assert(vocabLink.includes("vocab-sr"), "vocab repair link targets vocab SR");
  assert(vocabLink.includes("from=lesson-b2-job-followup"), "vocab repair link carries source lesson");
  assert(vocabLink.includes("scene=email-closing"), "vocab repair link carries source scene");
  const vocabRemediation = catalog.buildVocabRemediation("lesson-b2-job-followup", "email-closing");
  assert(vocabRemediation && vocabRemediation.kind === "vocab", "job follow-up closing scene should offer vocab remediation");
  assert(vocabRemediation.href.includes("proces") === false, "vocab remediation href uses query params not inline words");
}

function runDrillDecisionSmoke(context) {
  const kernel = context.PlataKernel;
  const planner = context.PlataPlanner;
  const state = kernel.freshState("bojning");

  const repeat = planner.drillDecision({
    trainerId: "bojning",
    state,
    sessionResults: [{ correct: true }, { correct: false }],
    rootPrefix: "../"
  });
  assert(repeat.kind === "repeat", "drill with mistakes should recommend repeat");
  assert(repeat.primaryHref === "#again-btn", "repeat decision should target another session");
  assert(repeat.trace.rule === "drill.repeat.session-mistakes", "drill repeat carries a planner trace rule");
  assert(repeat.trace.inputs.session.mistakes === 1, "drill repeat trace records session mistakes");
  assert(repeat.trace.scoreBreakdown.some(part => part.label === "mistake pressure" && part.value === 5), "drill repeat trace explains mistake score pressure");

  const clean = planner.drillDecision({
    trainerId: "bojning",
    state,
    sessionResults: [{ correct: true }, { correct: true }],
    rootPrefix: "../"
  });
  assert(clean.kind === "continue", "clean drill should continue the chain");
  assert(clean.primaryHref === "../ordstilling-drill/", "bojning chain should move to ordstilling");
  assert(clean.trace.rule === "drill.continue.clean-session", "clean drill carries a continuation trace");

  state.meta.dailyAttempts[new Date().toISOString().slice(0, 10)] = 20;
  const enough = planner.drillDecision({
    trainerId: "bojning",
    state,
    sessionResults: [{ correct: true }, { correct: true }],
    rootPrefix: "../"
  });
  assert(enough.kind === "enough", "daily threshold should recommend stopping");
  assert(enough.primaryHref === "../dashboard.html", "enough decision should send to dashboard");
  assert(enough.trace.rule === "daily-threshold", "enough decision carries threshold trace");
  assert(enough.trace.inputs.threshold === 20, "enough trace records the threshold");
}

function runDashboardDecisionSmoke(context) {
  const kernel = context.PlataKernel;
  const planner = context.PlataPlanner;
  const trainer = {
    id: "lesson-b2-radiator-register",
    name: "B2: Register & Particles",
    type: "lesson",
    path: "./lessons/lesson-b2-radiator/",
    description: "Complaints, tone, modal particles",
    icon: "⚖️"
  };
  const lesson = context.PLATA_LESSON_B2_RADIATOR;
  const state = seedWeakLesson(context);
  const weak = kernel.getWeakTags(state, 10).find(item => item.tag === "passive-agency");
  const spec = lesson.masteryMap["passive-agency"];
  const remediation = {
    cta: spec.remediation.cta,
    action: spec.remediation.action,
    href: planner.sceneHref(trainer.path, spec.remediation.sceneId, "passive-agency")
  };
  const memoryFacts = [
    {
      id: "mem-weak-passive-agency",
      kind: "weak_signal",
      status: "open",
      trainerId: trainer.id,
      signal: "passive-agency",
      confidence: 0.82,
      sourceFingerprint: "memsrc-passive-weak"
    },
    {
      id: "mem-trap-passive-agency",
      kind: "recurring_trap",
      status: "open",
      trainerId: trainer.id,
      signal: "passive-agency",
      confidence: 0.91,
      sourceFingerprint: "memsrc-passive-trap"
    }
  ];

  const repair = planner.dashboardDecision({
    trainer,
    state,
    stats: { total: 1, correct: 0, accuracy: 0, today: 1, lastSessionDate: state.meta.lastSessionDate },
    weakMastery: [{ ...weak, label: spec.label, evidence: spec.evidence, remediation }],
    weakTags: [weak],
    memoryFacts,
    index: 4
  });

  assert(repair.kind === "repair", "dashboard should prioritize repair decisions");
  assert(repair.title.includes("Read passive agency"), "dashboard repair should use mastery label");
  assert(repair.primaryHref.includes("mode=repair"), "dashboard repair should link repair mode");
  assert(repair.competency.id === "agency", "dashboard repair exposes root competency");
  assert(repair.trace.rule === "dashboard.repair.highest-open-mastery", "dashboard repair carries a trace rule");
  assert(repair.trace.inputs.trainer.id === trainer.id, "dashboard repair trace records trainer input");
  assert(repair.trace.inputs.selectedSignal.tag === "passive-agency", "dashboard repair trace records selected signal");
  assert(repair.trace.inputs.memoryFactCount === 2, "dashboard repair trace records memory fact input count");
  assert(repair.trace.inputs.selectedMemoryFacts.some(fact => fact.id === "mem-trap-passive-agency"), "dashboard repair trace cites selected memory facts");
  assert(repair.trace.scoreBreakdown.some(part => part.label === "root competency boost"), "dashboard repair trace records competency score boost");
  assert(repair.trace.scoreBreakdown.some(part => part.label === "memory recurring_trap boost"), "dashboard repair trace records memory score boost");
  assert(repair.memoryFacts.some(fact => fact.kind === "recurring_trap"), "dashboard repair decision keeps memory facts for explanation");
  const repairExplanation = planner.explainDecision(repair, { total: 1, correct: 0, accuracy: 0, today: 1 });
  assert(repairExplanation.copy.includes("highest open mastery signal"), "planner explains why repair was chosen");
  assert(repairExplanation.facts.some(fact => fact.includes("Root skill: Agency and responsibility")), "planner explanation includes root skill evidence");
  assert(repairExplanation.facts.some(fact => fact.includes("Evidence: 1 miss / 1 try")), "planner explanation includes signal counts");
  assert(repairExplanation.facts.some(fact => fact.includes("Memory: recurring_trap passive-agency memsrc-passive-trap")), "planner explanation includes memory evidence");

  const mismatchedRoot = planner.dashboardDecision({
    trainer,
    state,
    stats: { total: 3, correct: 0, accuracy: 0, today: 3, lastSessionDate: state.meta.lastSessionDate },
    weakMastery: [
      { tag: "understatement-with-agency", label: "Use understatement with agency", evidence: "Agency signal", wrong: 1, correct: 0, total: 1, score: 1, competencyId: "agency", remediation },
      { tag: "modal-particle-stance", label: "Read particle stance", evidence: "Stance signal", wrong: 5, correct: 0, total: 5, score: 1, competencyId: "stance-reading", remediation: { ...remediation, href: "./lessons/lesson-b2-radiator/?mode=repair&signal=modal-particle-stance#group-chat-particles" } }
    ],
    weakTags: [weak],
    index: 4
  });
  assert(mismatchedRoot.signalTag === "understatement-with-agency", "dashboard repair keeps the selected repair signal");
  assert(mismatchedRoot.competency.id === "agency", "dashboard repair uses competency for the selected signal");

  const start = planner.dashboardDecision({
    trainer: { id: "bojning", name: "Bojning drill", type: "drill", path: "./bojning-drill/", description: "Forms" },
    state: kernel.freshState("bojning"),
    stats: { total: 0, correct: 0, accuracy: null, today: 0, lastSessionDate: "" },
    weakMastery: [],
    weakTags: [],
    index: 0
  });
  assert(start.kind === "start", "empty trainer should produce a start decision");
  assert(start.trace.rule === "dashboard.start.empty-profile", "empty trainer start carries a trace rule");

  const lessonStart = planner.dashboardDecision({
    trainer: { id: "lesson-01-arrival", name: "Lesson 01: First Morning", type: "lesson", path: "./lessons/lesson-01/", description: "Story onboarding" },
    state: kernel.freshState("lesson-01-arrival"),
    stats: { total: 0, correct: 0, accuracy: null, today: 0, lastSessionDate: "" },
    weakMastery: [],
    weakTags: [],
    index: 3
  });
  assert(lessonStart.score > start.score, "Lesson 01 should be the preferred empty-profile starter");
  assert(lessonStart.trace.rule === "dashboard.start.preferred-entry", "preferred starter carries a trace rule");

  const memoryReview = planner.dashboardDecision({
    trainer,
    state,
    stats: { total: 4, correct: 4, accuracy: 100, today: 0, lastSessionDate: "2026-06-08" },
    weakMastery: [],
    weakTags: [],
    memoryFacts: [{
      id: "mem-review-passive-agency",
      kind: "next_review_due",
      status: "due",
      trainerId: trainer.id,
      signal: "passive-agency",
      confidence: 0.72,
      sourceFingerprint: "memsrc-review-due"
    }],
    index: 4
  });
  assert(memoryReview.kind === "stale", "dashboard can recommend review from learner memory facts");
  assert(memoryReview.trace.rule === "dashboard.review.memory-due", "memory review carries a planner trace rule");
  assert(memoryReview.signalTag === "passive-agency", "memory review keeps the due signal");
  assert(memoryReview.trace.inputs.selectedMemoryFacts[0].id === "mem-review-passive-agency", "memory review trace cites the due memory fact");
  assert(planner.explainDecision(memoryReview, memoryReview.trace.inputs.stats).copy.includes("learner memory"), "memory review explanation names learner memory");

  const ranked = planner.rankDashboardDecisions([
    { trainer, decision: start, index: 0 },
    { trainer, decision: repair, index: 1 }
  ], 1);
  assert(ranked[0].decision.kind === "repair", "ranker should put higher score first");

  const plan = planner.practicePlan([
    { trainer, decision: repair, index: 1 },
    { trainer, decision: repair, index: 2 },
    { trainer: { id: "lesson-01-arrival", name: "Lesson 01", type: "lesson", path: "./lessons/lesson-01/", description: "Story", icon: "🌅" }, decision: lessonStart, index: 3 }
  ], { limit: 3 });
  assert(plan.kind === "repair", "practice plan starts with repair when repair is open");
  assert(plan.steps.length === 1, "practice plan does not pad repair work with starter tasks");
  assert(plan.steps[0].competency.id === "agency", "practice plan keeps root competency on repair step");
  assert(plan.steps[0].primaryHref.includes("mode=repair"), "practice plan repair step links to repair mode");
  assert(plan.steps[0].explanation.copy.includes("highest open mastery signal"), "practice plan stores planner explanation on repair step");
  assert(plan.steps[0].explanation.facts.some(fact => fact.includes("Root skill: Agency and responsibility")), "practice plan explanation stores root evidence");
  assert(plan.steps[0].trace.rule === "dashboard.repair.highest-open-mastery", "practice plan stores planner trace on repair step");
  assert(plan.steps[0].trace.fingerprint, "practice plan step trace has a stable fingerprint");
  assert(planner.tracePracticePlanStep(plan.steps[0]).fingerprint === plan.steps[0].trace.fingerprint, "planner exposes normalized step trace");
  assert(planner.explainPracticePlanStep(plan.steps[0]).copy.includes("highest open mastery signal"), "planner exposes a normalized step explanation");

  const trackedPlan = planner.practicePlan([
    { trainer, stats: { total: 1, lastSessionDate: "2026-06-08" }, decision: repair, index: 1 }
  ], { limit: 1 });
  assert(trackedPlan.steps[0].attemptsAtStart === 1, "practice plan snapshots trainer attempts");
  const savedPlan = planner.savePracticePlan(trackedPlan);
  assert(savedPlan.fingerprint === planner.planFingerprint(trackedPlan), "saved practice plan stores a stable fingerprint");
  assert(savedPlan.planToken && savedPlan.steps[0].routeId, "saved practice plan stores route identifiers");
  assert(savedPlan.steps[0].explanation.copy.includes("highest open mastery signal"), "saved practice plan preserves step explanation");
  assert(savedPlan.steps[0].trace.fingerprint === trackedPlan.steps[0].trace.fingerprint, "saved practice plan preserves step trace");
  const routeHref = planner.planStepHref(savedPlan, savedPlan.steps[0]);
  assert(routeHref.includes("plan=" + encodeURIComponent(savedPlan.planToken)), "practice plan route href carries plan token");
  assert(routeHref.includes("step=" + encodeURIComponent(savedPlan.steps[0].routeId)), "practice plan route href carries step id");
  assert(routeHref.includes("#official-reply-passive"), "practice plan route href preserves scene hash");
  assert(planner.readPracticePlan().fingerprint === savedPlan.fingerprint, "practice plan can be read from storage");
  context.location = {
    search: "?plan=" + encodeURIComponent(savedPlan.planToken) + "&step=" + encodeURIComponent(savedPlan.steps[0].routeId),
    hash: "#official-reply-passive"
  };
  const currentStep = planner.currentPracticePlanStep({ trainerId: trainer.id, dashboardHref: "./dashboard.html" });
  assert(currentStep && currentStep.step.routeId === savedPlan.steps[0].routeId, "practice plan step resolves from route parameters");
  assert(planner.currentPracticePlanStep({ trainerId: "vocab" }) === null, "practice plan route ignores another trainer");
  const openPlan = planner.planStatus(savedPlan, [
    { trainer, stats: { total: 1, lastSessionDate: "2026-06-08" }, decision: repair, index: 1 }
  ]);
  assert(openPlan.openCount === 1 && openPlan.steps[0].status === "open", "tracked repair stays open while current repair matches");
  const startedStep = planner.markPracticePlanStepStarted({ trainerId: trainer.id });
  assert(startedStep.step.startedAt, "practice plan route can mark a step started");
  const activePlan = planner.planStatus(planner.readPracticePlan(), [
    { trainer, stats: { total: 1, lastSessionDate: "2026-06-08" }, decision: repair, index: 1 }
  ]);
  assert(activePlan.steps[0].status === "active", "started practice step renders as in progress");
  const completedStep = planner.markPracticePlanStepCompleted({
    trainerId: trainer.id,
    evidence: { reason: "unit-test", trainerId: trainer.id, correct: true }
  });
  assert(completedStep.step.completedAt, "practice plan route can mark a step completed");
  assert(completedStep.step.completionEvidence.reason === "unit-test", "practice plan completion stores evidence");
  const completedPlan = planner.planStatus(planner.readPracticePlan(), [
    { trainer, stats: { total: 1, lastSessionDate: "2026-06-08" }, decision: repair, index: 1 }
  ]);
  assert(completedPlan.completed && completedPlan.steps[0].status === "done", "completed ledger step renders done");
  const twoStepPlan = planner.savePracticePlan({
    kind: "continue",
    title: "Two-step plan",
    copy: "The first step is already complete.",
    steps: [
      {
        number: 1,
        kind: "continue",
        trainerId: trainer.id,
        trainerName: trainer.name,
        primaryLabel: "Review",
        primaryHref: trainer.path,
        completedAt: "2026-06-08T00:10:00.000Z"
      },
      {
        number: 2,
        kind: "continue",
        trainerId: "vocab",
        trainerName: "Vocab SR",
        primaryLabel: "Open vocab",
        primaryHref: "./vocab-sr/"
      }
    ]
  });
  const twoStepStatus = planner.planStatus(twoStepPlan, []);
  assert(twoStepStatus.primaryStep.number === 2, "practice plan primary step skips completed steps");
  assert(planner.actionablePracticePlanStep(twoStepStatus).number === 2, "planner exposes the next actionable plan step");
  planner.savePracticePlan(savedPlan);
  const donePlan = planner.planStatus(savedPlan, [
    { trainer, stats: { total: 2, lastSessionDate: "2026-06-08" }, decision: { ...repair, kind: "continue", signalTag: "", primaryHref: trainer.path }, index: 1 }
  ]);
  assert(donePlan.completed && donePlan.steps[0].status === "done", "tracked repair closes when current weak-signal plan changes");
  planner.clearPracticePlan();
  assert(planner.readPracticePlan() === null, "practice plan tracker can clear active plan");
}

function run() {
  const context = makeContext();
  runLessonDecisionSmoke(context);
  runDrillRepairRoutingSmoke(context);
  runDrillDecisionSmoke(context);
  runDashboardDecisionSmoke(context);
  console.log("ok - planner recommends lesson repair from weak mastery");
  console.log("ok - planner routes weak word-order signals to ordstilling drill repair");
  console.log("ok - planner routes job follow-up closing signals to register deadline drill");
  console.log("ok - planner routes weak scene vocabulary to vocab SR repair");
  console.log("ok - planner routes passive-agency signals to register drill repair");
  console.log("ok - planner ranks drill repeat, continue, and enough decisions");
  console.log("ok - planner ranks dashboard decisions from the same contract");
  console.log("ok - planner tracks active practice-plan completion");
}

run();

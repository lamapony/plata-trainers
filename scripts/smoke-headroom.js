#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const headroomSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-headroom.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const context = { console, window: {} };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(headroomSource, context, { filename: "shared/plata-headroom.js" });
  const layer = context.PlataHeadroom;
  assert(layer, "PlataHeadroom exports on window");

  const mastery = layer.compressMasterySignal({
    tag: "passive-agency",
    label: "Read passive agency",
    evidence: "The learner distinguishes registration language from a repair commitment.",
    total: 4,
    wrong: 3,
    trainers: [{ name: "Radiator lesson" }],
    remediations: [{ cta: "Review Scene 1", action: "Name the missing actor.", href: "./lessons/lesson-b2-radiator/?mode=repair&signal=passive-agency#official-reply-passive" }]
  });
  assert(mastery.verdict.includes("Read passive agency"), "mastery verdict is human-readable");
  assert(mastery.saw.includes("miss"), "mastery saw uses miss language");
  assert(mastery.means.length > 20, "mastery means explains implication");
  assert(mastery.nextHref.includes("passive-agency"), "mastery next href preserved");

  const card = layer.renderCard(mastery, { extraClass: "mastery-card", technicalHtml: "<span>passive-agency</span>" });
  assert(/Signal/.test(card), "renderCard includes saw label");
  assert(/Details/.test(card), "renderCard nests technical appendix");
  assert(/passive-agency/.test(card), "technical appendix keeps signal id");

  const today = layer.compressTodayProgram({
    program: {
      kind: "onboarding",
      eyebrow: "First session",
      headline: "Start B2 job follow-up",
      message: "Begin with the B2 job-follow-up lesson.",
      why: "No local progress yet — B2 follow-up is the primary entry.",
      actionLabel: "Start first session",
      routeMeta: "No local history yet"
    },
    step: { number: 1 },
    actionHref: "./lessons/lesson-b2-job-followup/",
    progress: 0,
    guardrailLabels: ["Onboarding", "Planner route"]
  });
  assert(today.verdict === "Start B2 job follow-up", "today verdict uses headline");
  assert(/first-visit tutorial/.test(today.means), "today means mentions optional tutorial");

  const bar = layer.renderBar(layer.compressDashboardSnapshot({
    totalAttempts: 12,
    topSignal: {
      tag: "passive-agency",
      label: "Read passive agency",
      wrong: 2,
      total: 3,
      remediations: [{ cta: "Review Scene 1", action: "Repair", href: "./repair" }]
    }
  }));
  assert(/headroom-bar/.test(bar), "renderBar returns bar markup");
  assert(/Read passive agency/.test(bar), "dashboard bar mentions top signal");

  var proof = layer.compressProofSnapshot({
    passing: true,
    digest: { status: "pass", headline: "The public proof surface is coherent" },
    demo: { status: "pass" },
    journey: {
      status: "pass",
      traceId: "evaljourney-demo",
      totals: { stages: 6 },
      guarantees: [{ key: "distribution-proof-targeted", pass: true }]
    },
    health: {
      totals: { gates: 42, issues: 0 },
      gates: [{ id: "check:distribution", status: "pass" }]
    },
    capabilities: { totals: { capabilities: 10, issues: 0 } },
    guided: { status: "pass", totals: { scenarios: 15 } },
    exerciseValue: {
      status: "pass",
      transferChains: [{ id: "doctor-apotek-skrive-sundhed", status: "pass" }],
      repairChains: [{ id: "job-followup-bojning-gender-trap", status: "pass" }]
    }
  });
  assert(proof.verdict.includes("coherent"), "proof verdict uses digest headline");
  assert(proof.saw.includes("fictional learner"), "proof saw explains the walkthrough in human terms");
  assert(proof.saw.includes("completed practice"), "proof saw names the learner outcome");
  assert(proof.means.includes("without creating an account"), "proof means explains the account boundary");
  assert(proof.means.includes("learner answers"), "proof means explains the privacy boundary");
  assert(proof.nextStep.includes("technical reports"), "proof next step keeps technical evidence optional");
  assert(proof.nextHref === "#proof-walkthrough", "proof next links to walkthrough");
  assert(proof.appendix.some(function (row) { return row[0] === "Guided scenarios" && row[1] === 15; }), "proof appendix records guided scenario count");
  assert(proof.appendix.some(function (row) { return row[0] === "Offline ZIP" && row[1] === "passing gate"; }), "proof appendix records offline distribution gate");
  assert(proof.appendix.some(function (row) { return row[0] === "Doctor→skrive" && row[1] === "exercise value pass"; }), "proof appendix records doctor skrive transfer");

  console.log("ok - PlataHeadroom compress + render");
}

run();

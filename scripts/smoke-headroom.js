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
  assert(/What we saw/.test(card), "renderCard includes saw label");
  assert(/Technical details/.test(card), "renderCard nests technical appendix");
  assert(/passive-agency/.test(card), "technical appendix keeps signal id");

  const today = layer.compressTodayProgram({
    program: {
      kind: "onboarding",
      eyebrow: "First session",
      headline: "Start Lesson 01",
      message: "Begin with the first short story lesson.",
      why: "No local progress yet.",
      actionLabel: "Start first session",
      routeMeta: "No local history yet"
    },
    step: { number: 1 },
    actionHref: "./lessons/lesson-01/",
    progress: 0,
    guardrailLabels: ["Onboarding", "Planner route"]
  });
  assert(today.verdict === "Start Lesson 01", "today verdict uses headline");

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

  console.log("ok - PlataHeadroom compress + render");
}

run();

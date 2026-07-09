#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

function usage() {
  return [
    "Usage:",
    "  node scripts/scaffold-gold-lesson.js --slug lesson-b2-topic --title \"B2 title\" [options]",
    "",
    "Options:",
    "  --name \"B2: Topic\"              Catalog display name",
    "  --description \"...\"             Catalog description",
    "  --subtitle \"...\"                Lesson subtitle/meta description",
    "  --level B2                       Lesson level (default: B2)",
    "  --minutes 14                     Estimated minutes (default: 14)",
    "  --icon \"🧭\"                     Catalog icon (default: 🧭)",
    "  --root /path/to/repo             Target repo root (default: current repo)",
    "  --no-catalog                     Do not add the lesson to shared/plata-catalog.js",
    "  --dry-run                        Print planned files without writing",
    "  --force                          Overwrite an existing lesson folder"
  ].join("\n");
}

function parseArgs(argv) {
  const out = {
    level: "B2",
    minutes: 14,
    icon: "🧭",
    root: repoRoot,
    updateCatalog: true,
    dryRun: false,
    force: false
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--no-catalog") {
      out.updateCatalog = false;
      continue;
    }
    if (arg === "--dry-run") {
      out.dryRun = true;
      continue;
    }
    if (arg === "--force") {
      out.force = true;
      continue;
    }
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument: ${arg}`);
    const key = arg.slice(2).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${arg}`);
    out[key] = value;
    i++;
  }

  return normalizeOptions(out);
}

function normalizeOptions(options) {
  const slug = String(options.slug || "").trim();
  const title = String(options.title || "").trim();
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("--slug is required and must be kebab-case");
  }
  if (!slug.startsWith("lesson-")) {
    throw new Error("--slug must start with lesson- so catalog and LocalStorage IDs stay recognizable");
  }
  if (!title) throw new Error("--title is required");

  const level = String(options.level || "B2").trim().toUpperCase();
  if (!/^(A0|A1|A2|B1|B2)$/.test(level)) throw new Error("--level must be A0, A1, A2, B1, or B2");

  const minutes = Number.parseInt(options.minutes, 10);
  if (!Number.isInteger(minutes) || minutes <= 0) throw new Error("--minutes must be a positive integer");

  const root = path.resolve(options.root || repoRoot);
  const subtitle = String(options.subtitle || `A ${level} Danish gold lesson scaffold about professional register, concrete next steps, and social consequences.`).trim();
  const name = String(options.name || `${level}: ${title}`).trim();
  const description = String(options.description || subtitle).trim();
  const icon = String(options.icon || "🧭").trim();

  return {
    slug,
    title,
    level,
    minutes,
    subtitle,
    name,
    description,
    icon,
    root,
    updateCatalog: options.updateCatalog !== false,
    dryRun: !!options.dryRun,
    force: !!options.force
  };
}

function globalNameFromSlug(slug) {
  return `PLATA_LESSON_${slug.replace(/^lesson-/, "").replace(/[^a-z0-9]+/g, "_").toUpperCase()}`;
}

function js(value) {
  return JSON.stringify(value);
}

function html(value) {
  return String(value || "").replace(/[&<>'"]/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;"
  }[ch]));
}

function buildLesson(options) {
  const globalName = globalNameFromSlug(options.slug);
  const title = options.title;
  const subtitle = options.subtitle;

  return `window.${globalName} = {
  id: ${js(options.slug)},
  level: ${js(options.level)},
  title: ${js(title)},
  subtitle: ${js(subtitle)},
  estimatedMinutes: ${options.minutes},
  qualityTier: "gold",
  editorialFocus: "Replace the scaffold topic with a real pressure situation while preserving the gold chain: source -> goal -> phrase -> diagnostic -> mastery -> repair.",
  comicStoryboard: {
    style: "Quiet editorial comic, warm ink linework, muted modern Danish interiors, natural light, expressive body language, no readable text, no speech bubbles, no UI screenshots.",
    aspectRatio: "16:9",
    imageSize: "1K",
    panels: [
      {
        id: "read-context",
        sceneId: "read-context",
        assetPath: "./assets/comic/read-context.png",
        alt: "A learner pauses before answering a professional message in a calm Danish office setting.",
        prompt: "Create a quiet editorial comic panel set in a modern Danish office. A learner sits at a desk, pausing before answering a professional message, with calm posture and visible reflection. The image should show situation reading before wording, with no readable screen text or speech bubbles.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["context-reading"],
        mustInclude: ["learner pausing before writing", "calm professional setting"],
        avoid: ["readable text on screens", "dramatic conflict or anger"]
      },
      {
        id: "register-signals",
        sceneId: "register-signals",
        assetPath: "./assets/comic/register-signals.png",
        alt: "A desk scene uses visual tokens to separate acknowledgement, action, and next step signals.",
        prompt: "Create a quiet editorial comic panel where three visual tokens on a desk represent acknowledgement, owned action, and next step. A learner compares the tokens while a colleague waits neutrally nearby. The composition should make small phrase signals feel meaningful without using readable text, logos, or interface elements.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Dansk Sproghistorie: dialogiske partikler"],
        masteryTags: ["register-signal-control"],
        mustInclude: ["three distinct visual tokens", "learner comparing social signals"],
        avoid: ["word labels inside the image", "cartoonish exaggeration"]
      },
      {
        id: "professional-response",
        sceneId: "professional-response",
        assetPath: "./assets/comic/professional-response.png",
        alt: "A learner writes with agency while keeping the conversation open and low pressure.",
        prompt: "Create a quiet editorial comic panel showing a learner drafting a professional response with steady posture and open body language. The scene should contrast agency without pressure: one hand points to a next step, while the conversation space remains open and calm. No readable text, no speech bubbles, no brand logos.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["agency-without-pressure"],
        mustInclude: ["visible next-step gesture", "low-pressure professional mood"],
        avoid: ["aggressive pointing or confrontation", "overly formal ceremony"]
      },
      {
        id: "next-step",
        sceneId: "next-step",
        assetPath: "./assets/comic/next-step.png",
        alt: "A calendar and simple process cue make the next professional action visible.",
        prompt: "Create a quiet editorial comic panel where a learner turns a polite answer into a concrete next step. Show a simple calendar shape, a small process marker, and a calm desk arrangement, but keep all text unreadable or abstract. The image should communicate action plus timing without becoming a UI screenshot.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["concrete-next-step"],
        mustInclude: ["abstract calendar cue", "clear action-to-next-step composition"],
        avoid: ["readable dates or words", "busy dashboard interface"]
      },
      {
        id: "principle",
        sceneId: "principle",
        assetPath: "./assets/comic/principle.png",
        alt: "A calm professional exchange shows that wording affects both outcome and relationship.",
        prompt: "Create a quiet editorial comic panel showing the final principle: professional wording moves the task and the relationship at the same time. Two people leave a conversation with neutral trust and a visible next step between them. Use modern Danish workplace cues, natural light, and no readable text or speech bubbles.",
        sourceRefs: ["Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["consequence-aware-register"],
        mustInclude: ["two people with workable trust", "visual next-step cue between them"],
        avoid: ["celebration pose", "literal written lesson slogan"]
      }
    ]
  },
  masteryMap: {
    "context-reading": {
      competencyId: "process-control",
      label: "Read the situation",
      evidence: "The learner identifies what the professional situation requires before choosing words.",
      remediation: {
        sceneId: "read-context",
        cta: "Review Scene 1",
        action: "Rerun the opening decision and name the situation, audience, and pressure before choosing a phrase."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "register-signal-control": {
      competencyId: "register-control",
      label: "Control register signals",
      evidence: "The learner recognizes which Danish phrases signal acknowledgement, action, and next step.",
      remediation: {
        sceneId: "register-signals",
        cta: "Rematch register signals",
        action: "Rerun the matching scene and explain what each phrase does socially before moving on."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Dansk Sproghistorie: dialogiske partikler"]
    },
    "agency-without-pressure": {
      competencyId: "agency",
      label: "Use agency without pressure",
      evidence: "The learner writes an active professional response without over-demanding or hiding behind vague politeness.",
      remediation: {
        sceneId: "professional-response",
        cta: "Repair the response",
        action: "Rerun the response scene and keep both parts: an active proposal and a low-pressure next step."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "concrete-next-step": {
      competencyId: "process-control",
      label: "Give a concrete next step",
      evidence: "The learner completes a sentence with both an action and a time or next-step signal.",
      remediation: {
        sceneId: "next-step",
        cta: "Repair the next step",
        action: "Rerun the completion and include one agency verb plus one concrete time or next-step word."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "consequence-aware-register": {
      competencyId: "consequence-awareness",
      label: "Name the register principle",
      evidence: "The learner names why tone, clarity, and relationship cost belong together.",
      remediation: {
        sceneId: "principle",
        cta: "Review the principle",
        action: "Rerun the final choice and choose the principle that keeps clarity without adding social pressure."
      },
      sourceRefs: ["Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"]
    }
  },
  simulation: {
    expectedEndingId: "strong",
    completionAnswers: {
      "next-step": {
        reject: ["fredag", "jeg kan sende"],
        accept: "inden fredag og aftale næste skridt"
      }
    },
    paths: [
      {
        id: "strong",
        expectedEndingId: "strong",
        expectedVariables: { relationshipTension: -1, clarity: 3, professionalTrust: 2 },
        expectedCorrect: 7,
        expectedWeakMastery: [],
        actions: [
          { sceneId: "read-context", optionId: "read-calmly", expectCorrect: true },
          { sceneId: "register-signals", matchAll: true },
          { sceneId: "professional-response", optionId: "active-low-pressure", expectCorrect: true },
          { sceneId: "next-step", answer: "inden fredag og aftale næste skridt", expectCorrect: true },
          { sceneId: "principle", optionId: "clarity-with-relationship", expectCorrect: true }
        ]
      },
      {
        id: "neutral",
        expectedEndingId: "neutral",
        expectedVariables: { relationshipTension: 0, clarity: 1, professionalTrust: 0 },
        expectedCorrect: 6,
        expectedWeakMastery: ["agency-without-pressure"],
        actions: [
          { sceneId: "read-context", optionId: "read-calmly", expectCorrect: true },
          { sceneId: "register-signals", matchAll: true },
          { sceneId: "professional-response", optionId: "too-soft", expectCorrect: false },
          { sceneId: "next-step", answer: "inden fredag og aftale næste skridt", expectCorrect: true },
          { sceneId: "principle", optionId: "clarity-with-relationship", expectCorrect: true }
        ]
      },
      {
        id: "strained",
        expectedEndingId: "strained",
        expectedVariables: { relationshipTension: 3, clarity: -1, professionalTrust: -1 },
        expectedCorrect: 3,
        expectedWeakMastery: ["agency-without-pressure", "concrete-next-step", "consequence-aware-register", "context-reading"],
        actions: [
          { sceneId: "read-context", optionId: "overreact", expectCorrect: false },
          { sceneId: "register-signals", matchAll: true },
          { sceneId: "professional-response", optionId: "pressure", expectCorrect: false },
          { sceneId: "next-step", answer: "fredag", expectCorrect: false },
          { sceneId: "principle", optionId: "maximum-force", expectCorrect: false }
        ]
      }
    ]
  },
  variables: {
    relationshipTension: 0,
    clarity: 0,
    professionalTrust: 0
  },
  variableLabels: {
    relationshipTension: "Relationship tension",
    clarity: "Clarity",
    professionalTrust: "Professional trust"
  },
  variableDescriptions: {
    relationshipTension: ["low — the relationship stayed workable", "visible — the room felt tighter", "high — the wording created friction"],
    clarity: ["unclear — the next step is still vague", "adequate — the message can move", "clear — the action and next step are visible"],
    professionalTrust: ["weakened — the tone cost confidence", "neutral — correct but low-signal", "strong — you sounded reliable under pressure"]
  },
  languagePhenomena: [
    { item: "kort og konkret", function: "professional Danish values concise, concrete wording" },
    { item: "jeg foreslår", function: "active proposal without demanding" },
    { item: "næste skridt", function: "turns politeness into an actionable process" },
    { item: "partikler: jo/da/nok", function: "small words can soften, pressure, or position the speaker socially" }
  ],
  sourceNotes: [
    {
      title: "borger.dk/lifeindenmark.dk skrivevejledning",
      url: "https://digitaliser.dk/Media/638295979179542926/Skrivevejledning%20for%20borger.dk_september%202023_version%201.0.pdf",
      supports: ["Public-service Danish should be short, concrete, precise, and avoid paper-word style where possible"]
    },
    {
      title: "Dansk Sproghistorie: dialogiske partikler",
      url: "https://www.dansksproghistorie.dk/75/",
      supports: ["Small words such as jo, da, nok, and vel can position the speaker socially"]
    }
  ],
  scenes: [
    {
      id: "read-context",
      type: "choice",
      eyebrow: "Scene 1 · Situationen",
      title: "The room changes before the sentence does.",
      learningGoal: "Read the professional situation before choosing register and pressure.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["context-reading"],
      pressure: "You need to answer a professional message. The facts matter, but the first risk is tone: too little clarity sounds evasive; too much force sounds impatient.",
      narrative: "This scaffold scene is deliberately generic. Replace the situation with a real Danish pressure moment, but keep the diagnostic structure.",
      dialogue: [{ speaker: "You", line: "Hvad er situationen, og hvor meget pres kan sproget bære?" }],
      notice: "Start by reading the room. Kort og konkret does not mean cold; it means the reader can see the situation and the next move.",
      targetPhrases: ["kort og konkret", "hvad er situationen", "skriv med ro"],
      prompt: "What is the professional first move?",
      options: [
        { id: "read-calmly", diagnostic: "reads-context-before-writing", label: "Skriv kort og konkret: hvad er situationen, og hvad beder du om?", detail: "clear and calm", correct: true, effects: { clarity: 1, professionalTrust: 1 }, feedback: "Diagnostic: you read the room first. The message can be direct without sounding pressured." },
        { id: "wait-vaguely", diagnostic: "hides-the-request", label: "Skriv meget forsigtigt og håb, at de forstår resten.", detail: "too vague", correct: false, effects: { clarity: -1 }, feedback: "Diagnostic: vague politeness hides the request. The reader cannot act on what you did not say." },
        { id: "overreact", diagnostic: "adds-pressure-before-facts", label: "Skriv hårdt med det samme, så de forstår alvoren.", detail: "too much force", correct: false, effects: { relationshipTension: 1, clarity: -1 }, feedback: "Diagnostic: you added pressure before the facts were clear. That can make the relationship cost higher than the problem." }
      ],
      carry: "Carry-forward: skriv med ro, kort og konkret. First name hvad er situationen, then choose how much pressure the relationship can carry.",
      tags: ["B2", "register", "professional-writing", "context"]
    },
    {
      id: "register-signals",
      type: "match",
      eyebrow: "Scene 2 · Signaler",
      title: "Small phrases do social work.",
      learningGoal: "Recognize the social function of common professional Danish phrases.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Dansk Sproghistorie: dialogiske partikler"],
      masteryTags: ["register-signal-control"],
      pressure: "The phrases look simple. The mistake is treating them as decoration instead of register control.",
      narrative: "Before you write the full reply, you isolate three phrase types: acknowledgement, action, and next step.",
      dialogue: [{ speaker: "Colleague", line: "Tak for din besked. Jeg vender tilbage, når vi kan aftale næste skridt." }],
      notice: "A professional reply often combines acknowledgement, action, and process. Missing one part changes the social reading.",
      targetPhrases: ["tak for din besked", "jeg vender tilbage", "aftale næste skridt"],
      prompt: "Match each phrase to the job it does.",
      pairs: [
        { id: "acknowledge", left: "Tak for din besked.", right: "acknowledges contact", feedback: "Tak for din besked confirms receipt without adding pressure." },
        { id: "action", left: "Jeg vender tilbage.", right: "owns the next action", feedback: "Jeg vender tilbage keeps agency with the writer." },
        { id: "next-step", left: "Kan vi aftale næste skridt?", right: "turns politeness into process", feedback: "Næste skridt moves the exchange from goodwill to action." }
      ],
      carry: "Carry-forward: tak for din besked opens the door, jeg vender tilbage owns action, and aftale næste skridt makes the process visible.",
      tags: ["B2", "phrases", "register", "process-language"]
    },
    {
      id: "professional-response",
      type: "choice",
      eyebrow: "Scene 3 · Svaret",
      title: "Now write with agency, not pressure.",
      learningGoal: "Choose an active professional sentence that proposes a next step without escalating tone.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["agency-without-pressure"],
      pressure: "You need the message to move, but you also need the relationship to survive the sentence.",
      narrative: "This is where B2 Danish stops being vocabulary and becomes judgement: agency without pressure.",
      dialogue: [{ speaker: "You", line: "Jeg foreslår, at vi aftaler næste skridt uden at gøre det større end nødvendigt." }],
      notice: "Jeg foreslår is active but not demanding. Uden pres keeps the door open while the next step stays concrete.",
      targetPhrases: ["jeg foreslår", "næste skridt", "uden pres"],
      prompt: "Choose the sentence that keeps agency without pressure.",
      options: [
        { id: "active-low-pressure", diagnostic: "active-low-pressure-next-step", label: "Jeg foreslår, at vi aftaler næste skridt, når det passer jer.", detail: "active and workable", correct: true, effects: { relationshipTension: -1, clarity: 1, professionalTrust: 1 }, feedback: "Diagnostic: strong B2 move. Jeg foreslår gives agency, and når det passer jer lowers pressure without losing the next step." },
        { id: "too-soft", diagnostic: "softness-removes-action", label: "Det er helt fint, hvis det måske kan vente lidt.", detail: "too soft", correct: false, effects: { clarity: -1, professionalTrust: -1 }, feedback: "Diagnostic: the tone is friendly, but the action disappeared. The reader cannot see what should happen next." },
        { id: "pressure", diagnostic: "pressure-replaces-agency", label: "Jeg forventer, at I svarer hurtigt, for det her kan ikke vente.", detail: "too forceful", correct: false, effects: { relationshipTension: 2, professionalTrust: -1 }, feedback: "Diagnostic: you replaced agency with pressure. That may be justified in some cases, but it is not the default professional register." }
      ],
      carry: "Carry-forward: jeg foreslår plus næste skridt gives agency without pressure. The sentence should move the case without closing the room.",
      tags: ["B2", "agency", "professional-register", "next-step"]
    },
    {
      id: "next-step",
      type: "completion",
      eyebrow: "Scene 4 · Konkrethed",
      title: "A next step must be visible enough to test.",
      learningGoal: "Complete a professional sentence with both an agency verb and a time or next-step signal.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["concrete-next-step"],
      pressure: "A polite sentence can still fail if nobody knows who does what next.",
      narrative: "You write the last line. It needs to be short, concrete, and socially usable.",
      dialogue: [{ speaker: "You", line: "Jeg kan sende et kort forslag ..." }],
      notice: "Concrete Danish does not need to be long. It needs an action and a next-step signal.",
      targetPhrases: ["jeg kan sende", "et kort forslag", "inden fredag", "næste skridt"],
      prompt: "Complete the sentence with one agency signal and one time or next-step signal.",
      prefix: "Jeg kan sende et kort forslag",
      placeholder: "inden fredag og aftale næste skridt",
      acceptKeywordGroups: [
        { name: "agency verb", keywords: ["sende", "skrive", "foreslå", "aftale"] },
        { name: "time or next step", keywords: ["fredag", "næste", "skridt", "tid", "dato"] }
      ],
      success: "Good. The sentence contains both an action and a visible next step.",
      failure: "Include both parts: an agency verb (sende/skrive/foreslå/aftale) and a time or next-step word (fredag/næste/skridt/tid/dato).",
      effects: { clarity: 1 },
      carry: "Carry-forward: jeg kan sende et kort forslag is only complete when the reader also sees inden fredag or another concrete next step.",
      tags: ["B2", "completion", "concrete-language", "process"]
    },
    {
      id: "principle",
      type: "choice",
      eyebrow: "Final · Princip",
      title: "The wording writes the relationship before the decision.",
      learningGoal: "Name the B2 principle that clarity and relationship control belong together.",
      sourceRefs: ["Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["consequence-aware-register"],
      pressure: "The exchange ends. What remains is not only the answer, but the way you were read.",
      narrative: "A gold lesson should end by naming the transferable principle, not by celebrating a one-off correct answer.",
      dialogue: [{ speaker: "Internal note", line: "Tone er handling, især når relationen stadig skal bruges." }],
      notice: "Professionel dansk is concrete without pressure. The principle transfers across email, chat, workplace, and public-service writing.",
      targetPhrases: ["professionel dansk", "konkret uden pres", "tone er handling"],
      prompt: "Which principle should this lesson teach?",
      options: [
        { id: "clarity-with-relationship", diagnostic: "names-clarity-relationship-principle", label: "Professionel dansk er konkret uden pres: tone er handling.", detail: "transferable principle", correct: true, feedback: "Diagnostic: yes. The wording makes the next step visible while protecting the relationship." },
        { id: "maximum-politeness", diagnostic: "confuses-register-with-politeness", label: "Professionel dansk er altid så høfligt som muligt.", detail: "over-formal", correct: false, feedback: "Diagnostic: maximum politeness can create distance. The goal is useful clarity, not ceremonial language." },
        { id: "maximum-force", diagnostic: "confuses-clarity-with-force", label: "Professionel dansk er tydeligst, når presset er maksimalt.", detail: "too forceful", correct: false, feedback: "Diagnostic: pressure is not the same as clarity. The relationship cost can become the message." }
      ],
      carry: "Unlocked B2 theme: professionel dansk is konkret uden pres. Tone er handling because language moves both the case and the relationship.",
      tags: ["B2", "principle", "consequence", "register"]
    }
  ],
  endingLogic: {
    strong: { maxRelationshipTension: 0, minClarity: 2, minProfessionalTrust: 1 },
    strained: { minRelationshipTension: 2 },
    neutral: {}
  },
  endings: [
    {
      id: "strong",
      title: "Clear and trusted",
      narrative: "The reply is specific and human. The next step is agreed without extra friction, and your Danish reads as calm professional judgement.",
      danish: "Du gjorde sagen tydelig uden at gøre relationen mindre.",
      carry: "B2 unlocked: clarity and relationship control can reinforce each other."
    },
    {
      id: "strained",
      title: "Clear cost",
      narrative: "The message gets attention, but the tone becomes the story. The next step happens with less trust than before.",
      danish: "Du fik svar, men presset blev husket.",
      carry: "B2 unlocked: force can solve the immediate case while damaging the room."
    },
    {
      id: "neutral",
      title: "Correct but low-signal",
      narrative: "The exchange stays polite and functional. Nothing breaks, but your Danish does not add much confidence either.",
      danish: "Det var korrekt, men ikke stærkt.",
      carry: "B2 unlocked: correct language keeps the process alive; concrete agency makes it useful."
    }
  ]
};
`;
}

function renderIndex(options) {
  const globalName = globalNameFromSlug(options.slug);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Lesson ${html(options.level)} · ${html(options.title)} · Platå</title>
  <meta name="description" content="${html(options.subtitle)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="./styles.css" />
</head>
<body>
  <main class="lesson-shell">
    <nav class="topnav" aria-label="Lesson navigation">
      <a class="brand" href="../../">platå</a>
      <div class="nav-meta"><span id="scene-count">1 / 5</span><button id="reset-lesson" type="button">Reset</button></div>
    </nav>

    <header class="scene-card">
      <p class="eyebrow">Narrative lesson · ${html(options.level)}</p>
      <h1>${html(options.title)}</h1>
      <p>${html(options.subtitle)}</p>
    </header>

    <section class="lesson-grid" aria-label="Interactive lesson">
      <aside class="map-card" aria-label="Route progress">
        <p class="eyebrow">Scenario path</p>
        <div class="map-illustration" aria-hidden="true">
          <span class="pin wait">Read</span>
          <span class="pin email">Match</span>
          <span class="pin linkedin">Act</span>
          <span class="pin reply">Step</span>
          <span class="pin outcome">End</span>
          <svg viewBox="0 0 320 120" role="img" aria-label="A stylized path through the lesson">
            <path d="M24 80 C 70 20, 130 100, 170 40 S 250 60, 290 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="8 10" />
          </svg>
        </div>
        <div id="route" class="route-list"></div>
        <div id="variables-display" class="variables-display" aria-label="Lesson variables"></div>
      </aside>

      <article id="scene" class="scene-card" aria-live="polite"></article>
    </section>
  </main>

  <script src="../../shared/plata-kernel.js"></script>
  <script src="../../shared/plata-planner.js"></script>
  <script src="../../shared/plata-next-step.js"></script>
  <script src="../../shared/plata-lesson-engine.js"></script>
  <script src="./data.js"></script>
  <script src="./app.js"></script>
</body>
</html>
`;
}

function renderApp(options) {
  return `/* Platå gold lesson scaffold: ${options.slug} */
PlataLessonEngine.run(window.${globalNameFromSlug(options.slug)});
`;
}

function renderCatalogEntry(options) {
  return `      {
        id: ${js(options.slug)},
        name: ${js(options.name)},
        type: "lesson",
        path: ${js(`./lessons/${options.slug}/`)},
        lessonGlobal: ${js(globalNameFromSlug(options.slug))},
        lessonDataPath: ${js(`./lessons/${options.slug}/data.js`)},
        description: ${js(options.description)},
        icon: ${js(options.icon)}
      }`;
}

function addCatalogEntry(root, options) {
  const catalogPath = path.join(root, "shared", "plata-catalog.js");
  const source = fs.readFileSync(catalogPath, "utf8");
  if (source.includes(`id: ${js(options.slug)}`)) {
    throw new Error(`Catalog already contains ${options.slug}`);
  }
  const markers = [
    "      }\n    ],\n    drillForSignal:",
    "\n    ]\n  };"
  ];
  const marker = markers.find(item => source.includes(item));
  if (!marker) throw new Error("Could not find catalog insertion point");
  const entry = renderCatalogEntry(options);
  const next = marker.startsWith("      }")
    ? source.replace(marker, `      },\n${entry}\n    ],\n    drillForSignal:`)
    : source.replace(marker, `,\n${entry}${marker}`);
  fs.writeFileSync(catalogPath, next);
}

function copyStyles(root, lessonDir) {
  const source = path.join(root, "lessons", "lesson-b2-job-followup", "styles.css");
  const target = path.join(lessonDir, "styles.css");
  fs.copyFileSync(source, target);
}

function writeScaffold(options) {
  const lessonDir = path.join(options.root, "lessons", options.slug);
  const files = [
    path.join(lessonDir, "index.html"),
    path.join(lessonDir, "app.js"),
    path.join(lessonDir, "data.js"),
    path.join(lessonDir, "styles.css")
  ];

  if (options.dryRun) {
    console.log(`Would create ${path.relative(options.root, lessonDir)}`);
    files.forEach(file => console.log(`- ${path.relative(options.root, file)}`));
    if (options.updateCatalog) console.log("- update shared/plata-catalog.js");
    return;
  }

  if (fs.existsSync(lessonDir) && !options.force) {
    throw new Error(`${path.relative(options.root, lessonDir)} already exists. Pass --force to overwrite.`);
  }

  fs.mkdirSync(lessonDir, { recursive: true });
  fs.writeFileSync(path.join(lessonDir, "index.html"), renderIndex(options));
  fs.writeFileSync(path.join(lessonDir, "app.js"), renderApp(options));
  fs.writeFileSync(path.join(lessonDir, "data.js"), buildLesson(options));
  copyStyles(options.root, lessonDir);
  if (options.updateCatalog) addCatalogEntry(options.root, options);

  console.log(`Gold lesson scaffold created: ${path.relative(options.root, lessonDir)}`);
  if (options.updateCatalog) console.log("Catalog updated: shared/plata-catalog.js");
  console.log(`Next: node scripts/validate-lesson.js --file lessons/${options.slug}/data.js`);
}

function main() {
  try {
    const options = parseArgs(process.argv);
    writeScaffold(options);
  } catch (err) {
    console.error(err.message);
    console.error("");
    console.error(usage());
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = {
  buildLesson,
  globalNameFromSlug,
  normalizeOptions,
  renderApp,
  renderCatalogEntry,
  renderIndex,
  writeScaffold
};

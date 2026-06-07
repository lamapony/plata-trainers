# Platå Lesson Schema v2

> Write a `data.js` file following this schema. The shared engine handles everything else.
> No app.js changes needed. No engine code to touch.

## File structure

Each lesson lives in `lessons/<lesson-slug>/` and needs:
```
lessons/<lesson-slug>/
├── data.js          ← YOU write this (follow this schema)
├── app.js           ← auto-generated: PlataLessonEngine.run(window.PLATA_LESSON_*)
├── index.html       ← template (copy from any existing lesson, change title/meta)
└── styles.css       ← optional overrides; shared styles are inherited
```

## data.js — top-level fields

```js
window.PLATA_LESSON_XX = {
  id: "unique-lesson-id",           // used for LocalStorage key
  level: "A2" | "B1" | "B2",       // displayed in hero
  title: "Lesson title",
  subtitle: "One-line description",
  estimatedMinutes: 10,             // shown in UI, approximate
  qualityTier: "gold",              // optional; enables stricter validator rules
  editorialFocus: "What this lesson must teach especially well",

  // --- REQUIRED FOR GOLD: durable learner skill signals ---
  masteryMap: {
    "passive-agency": {
      label: "Read passive agency",
      evidence: "What a correct attempt proves",
      remediation: {
        sceneId: "scene-id",
        cta: "Review Scene 1",
        action: "Concrete learner action shown on the dashboard when this signal is weak"
      },
      sourceRefs: ["Source title from sourceNotes"]
    }
  },

  // --- REQUIRED FOR GOLD LESSONS WITH ENDINGS: deterministic QA path ---
  simulation: {
    expectedEndingId: "diplomatic",
    completionAnswers: {
      "scene-id": {
        reject: ["partial answer that should fail"],
        accept: "full answer that should pass"
      }
    },
    paths: [
      {
        id: "diplomatic",
        expectedEndingId: "diplomatic",
        expectedVariables: { landlordTension: -1, workplaceTrust: 3 },
        expectedCorrect: 8,
        expectedWeakMastery: [],
        actions: [
          { sceneId: "scene-id", optionId: "correct-option-id", expectCorrect: true },
          { sceneId: "match-scene-id", matchAll: true },
          { sceneId: "completion-scene-id", answer: "full answer", expectCorrect: true }
        ]
      }
    ]
  },

  // --- REQUIRED FOR B2: source support ---
  sourceNotes: [
    {
      title: "Source title",
      url: "https://example.com/source",
      supports: ["What this source supports in the lesson"]
    }
  ],

  // --- OPTIONAL: social state (B2+) ---
  variables: {                      // initial values, tracked across scenes
    landlordTension: 0,
    sofiaTrust: 0
  },

  // --- OPTIONAL: consequence system (B2+) ---
  endingLogic: {
    diplomatic: { maxLandlordTension: 0, minWorkplaceTrust: 1 },
    aggressive:  { minLandlordTension: 2 },
    passive:     {}                 // default fallback
  },
  endings: [
    {
      id: "diplomatic",
      title: "Diplomatic resolution",
      narrative: "What happened because of your tone choices...",
      danish: "En sætning på dansk.",
      carry: "Carry-forward insight."
    }
    // ... up to 3 endings
  ],

  // --- OPTIONAL: standard completion (A0-B1, no consequence system) ---
  completeTitle: "You made it.",
  completeText: "What the learner achieved.",

  // --- REQUIRED ---
  scenes: [ /* ... */ ]
};
```

## Scene objects

Every scene follows the `pressure → notice → action → feedback → carry-forward` pattern.

### Common fields (all scene types)

```js
{
  id: "stable-unique-id",
  type: "choice" | "input" | "match" | "completion",
  eyebrow: "Scene N · Short label",
  title: "A narrative beat, not an exercise title",
  learningGoal: "One precise skill this scene teaches", // required for gold lessons
  sourceRefs: [
    "Source title from top-level sourceNotes"             // required for gold lessons
  ],
  masteryTags: [
    "passive-agency"                                      // required for gold lessons
  ],
  pressure: "What is at stake right now?",
  narrative: "What is happening in the world?",
  dialogue: [                        // optional
    { speaker: "Name", line: "Danish text here." }
  ],
  danish: "Danish text",             // optional: highlighted Danish block
  notice: "One compact linguistic observation.",
  targetPhrases: [
    "Danish phrase actively trained in this scene"
  ],
  prompt: "The action the learner must take.",
  carry: "What this scene stores for later reuse.",
  tags: ["skill", "word", "pattern"]
}
```

### Scene type: `choice`

Multiple-choice. One correct option, others with distinct feedback.

```js
{
  id: "scene-id",
  type: "choice",
  // ... common fields ...
  options: [
    {
      id: "unique-option-id",
      label: "Danish text the learner picks",
      detail: "short English hint",
      diagnostic: "learner-error-or-success-key", // required and unique for gold lessons
      correct: true,              // boolean
      effects: {                  // OPTIONAL: modify social variables
        landlordTension: -1,
        workplaceTrust: 1
      },
      feedback: "What the learner sees after picking this option."
    }
  ]
}
```

### Scene type: `input`

Free-text input with prefix-based validation.

```js
{
  id: "scene-id",
  type: "input",
  // ... common fields ...
  placeholder: "Jeg hedder ...",
  acceptPrefix: "jeg hedder ",     // input must start with this (case-insensitive)
  success: "Feedback for correct input.",
  failure: "Feedback for incorrect input."
}
```

### Scene type: `match`

Pair left items to right items. Click left, then click right.

```js
{
  id: "scene-id",
  type: "match",
  // ... common fields ...
  pairs: [
    {
      id: "pair-id",
      left: "Danish text (shown left)",
      right: "English meaning (shown right)",
      feedback: "Why this match is correct" // required for B2 match scenes
    }
  ]
}
```

`left` fields render as `.sign-card` buttons (JetBrains Mono). `right` fields render as `.meaning-card` buttons. Scene is complete when all pairs are matched.

### Scene type: `completion`

Complete a sentence with a keyword check.

```js
{
  id: "scene-id",
  type: "completion",
  // ... common fields ...
  prefix: "Det går fint nok. Der har været lidt bøvl med varmen, men",
  placeholder: "jeg har bedt udlejeren om en konkret dato",
  acceptKeywords: ["udlejer", "dato", "bedt", "varme"],  // at least one must appear
  acceptKeywordGroups: [                 // optional: every group must match once
    { name: "agency", keywords: ["bedt", "skrevet", "ringet"] },
    { name: "concrete next step", keywords: ["dato", "tid", "udlejer"] }
  ],
  success: "Good. Your tone is balanced.",
  failure: "Try including an action word like: udlejer, dato, bedt.",
  effects: { workplaceTrust: 1 }   // OPTIONAL: applied on correct completion
}
```

If `acceptKeywordGroups` is present, every group must match at least one keyword. Otherwise `acceptKeywords` accepts any one listed keyword. If both are omitted, any non-empty input is accepted.

## Social state system (B2+)

When a lesson defines `variables`, the engine:
1. Initializes them to the declared values
2. Applies `effects` from choice options and completions
3. Displays live tags in the sidebar (`.var-tag` with classes `high`/`low`/`neutral`)
4. Records a social snapshot via `PlataKernel.recordSocialSnapshot()` on completion
5. Resolves the ending per `endingLogic`

Variable labels map (hardcoded in engine for now):
- `landlordTension` → "Udlejer"
- `sofiaTrust` → "Sofia"
- `emilEscalation` → "Emil"
- `workplaceTrust` → "Arbejde"

Custom labels: specify `variableLabels` on the lesson object.

## Mastery system (gold)

Gold lessons define a `masteryMap` at the top level and attach `masteryTags` to every scene.

These are not decorative labels. They are durable skill signals recorded with attempts by `PlataLessonEngine`. A dashboard can later say "weak in passive agency" instead of merely "wrong in lesson-b2-radiator-register".

Good mastery tags:
- are kebab-case (`formal-register-control`)
- describe a transferable skill, not a scene (`passive-agency`, not `scene-one`)
- have source-backed evidence in `masteryMap`
- define a `remediation` action that points to the scene that can repair the weak signal
- appear on at least one scene and at least one simulated attempt

Gold `masteryMap` entries must include:
- `label`: learner-facing signal name
- `evidence`: what the lesson can prove about the learner
- `remediation.sceneId`: scene to reopen from dashboard recommendations; the scene must include the same `masteryTags` key
- `remediation.cta`: compact dashboard call to action
- `remediation.action`: specific repair instruction
- `sourceRefs`: source notes behind the signal

Dashboard remediation links use `?mode=repair&signal=<mastery-tag>#<scene-id>`. The lesson engine reads that URL as a repair session and records attempts with `mode: "repair"` while preserving the scene's mastery tags.

Gold lessons with endings should define `simulation.paths`. Each path must include exactly one action per scene, an expected ending, and any expected social variables that make the consequence system meaningful. Completion scenes with grouped checks should define deterministic `simulation.completionAnswers` so QA can test both weak rejects and full accepts.

Path action shapes:
- choice: `{ sceneId, optionId, expectCorrect }`
- match: `{ sceneId, matchAll: true }`
- completion: `{ sceneId, answer, expectCorrect }`

## Design tokens

All lessons inherit the headpage-v2 design system:
- Fraunces (display), Inter (body), JetBrains Mono (code)
- Dark forest, cream, ember accent
- Mobile-first card stack
- See `lessons/lesson-01/styles.css` for the base

## Adding a new lesson — checklist

1. Create `lessons/<slug>/data.js` following this schema
2. Create `lessons/<slug>/app.js`:
   ```js
   PlataLessonEngine.run(window.PLATA_LESSON_YOUR_ID);
   ```
3. Copy `index.html` from `lesson-01/`, update:
   - `<title>` and `<meta name="description">`
   - `<h1>` text
   - Hero subtitle
   - `eyebrow` level tag (A2/B1/B2)
   - Script includes (should already be correct)
4. Copy `styles.css` from `lesson-01/` (or `lesson-b2-radiator/` for variable support)
5. Add the lesson entry to `shared/plata-catalog.js`
6. Add row to `trainers-repo/README.md` table
7. Run `npm run check`

## Scene density rules

- One scene = one active pattern
- B2 scenes must name their `targetPhrases`; these are the Danish phrases the scene actively trains, not decorative vocabulary
- B2 lessons must include `sourceNotes` with URLs and a short `supports` list
- B2 match pairs must include diagnostic `feedback`
- Gold lessons (`qualityTier: "gold"`) must include `masteryMap` with remediation actions, scene `learningGoal`, valid `sourceRefs`, scene `masteryTags`, unique choice `diagnostic` keys, and grouped completion checks
- Gold lessons with endings must cover every ending through `simulation.paths`
- Gold lessons should pass the simulator via `npm run check:gold-lessons`
- A new word appears in ≥2 modes (dialogue/sign/action/feedback)
- If a word appears only once, it's flavour — not a learning target
- Grammar terms only when the scene needs them
- Every correct/wrong choice has distinct, situation-specific feedback
- No "Correct!" / "Wrong!" generic feedback

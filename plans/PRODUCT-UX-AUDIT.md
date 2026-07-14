# Platå product UX audit

Status: implementation brief based on the shipped product, 2026-07-14.

## What Platå actually is

Platå is a static, client-only Danish practice product for learners around A2–B2
who already know basic Danish but lose control in realistic situations. It ships
seven scenario lessons and five focused drills. Its core loop is:

`Situation → miss → repair`

The browser records attempts locally, derives weak signals, compiles one next
step, and can route a lesson miss into a short repair drill. There is no account,
backend, analytics service, or mandatory model call. Progress is stored in
LocalStorage and can be exported or imported as a readable JSON profile.

The repository also contains a separate workflow for coding agents to author new
lessons. That workflow is contributor tooling; the live site cannot generate or
publish lessons by itself.

Source pages are plain HTML, CSS, and JavaScript and can be served directly over
HTTP. The production release does have a build step: it assembles the checked
Pages artifact, generated proof reports, PWA precache, and offline bundle.

## What the product is not

- It is not a linear A2-to-B2 course or a complete Danish curriculum.
- It is not an AI tutor or conversational agent in the browser.
- Today, the companion copy, and guided sessions are deterministic views of local
  evidence, not model-generated teaching.
- It does not provide cloud sync, accounts, social features, or a server-side
  learning history.
- Its learner history is currently an inspectable evidence/memory layer and a
  portable profile, not a friendly chronological activity feed.

## What should be preserved

- The lesson screen is focused, readable, and keeps one decision in view.
- Drills are compact and clearly show the current item and feedback action.
- The local-first privacy model is credible and useful.
- Repair deep links connect diagnosed misses to relevant practice.
- Recommendations remain explainable and testable rather than opaque.
- Reviewer evidence and contributor contracts are unusually strong for a static
  learning project.

## Current UX problems

### Critical hierarchy problems

1. The first-run dashboard repeats the same recommendation in Today, the full
   catalog, the active starter plan, and a second recommendation grid.
2. Practice, reviewer evidence, and contributor infrastructure share the same
   top-level navigation, so the site reads partly like a learner tool and partly
   like its own engineering inspection console.
3. The dashboard exposes every lesson and drill before the learner needs a
   choice, despite already having selected one next action.

### Important secondary problems

1. The home page explains the product well, but immediately expands twelve
   optional catalog cards after the primary entry point.
2. Program and Proof render most generated contracts at once. Their useful
   reviewer path is buried in very long technical pages.
3. Internal terms such as planner, cited memory, fingerprint, gate, and signal
   compete with learner-facing language when advanced sections are expanded.
4. Data portability is valuable but visually presented as another primary
   dashboard section instead of an occasional account-like utility.

## Audience split

### Learner

Primary routes: `Practice` and `Today`.

Needs one action, situation, level, time, trained skill, reason, outcome, and next
repair. Library, evidence, and data tools should be disclosures.

### Reviewer

Primary route: `About & proof` (`program.html`).

Needs a short statement of the method, a read-only demo learner, a four-step
walkthrough, quality status, privacy/portability boundaries, and optional access
to generated artifacts.

### Contributor

Primary routes: GitHub and `factory.html`.

Needs AGENTS.md, the lesson-request schema, authoring workflow, validation gates,
and source documentation. These links belong in reviewer/contributor navigation
and footers, not the learner's main navigation.

## Target information architecture

```text
Learner
├── Practice (/)
│   ├── Primary situation
│   ├── Optional demo
│   └── Browse all lessons & drills (closed disclosure)
└── Today (/dashboard.html)
    ├── One recommended action
    ├── Current repair/plan (only when meaningful)
    ├── Browse practice (closed disclosure)
    └── Inspect & data (closed disclosures)

Reviewer
└── About & proof (/program.html)
    ├── What Platå is / is not
    ├── Demo → Today → guided receipt → proof
    ├── Method and privacy boundaries
    ├── Proof (/proof.html)
    └── Quality (/quality.html)

Contributor
├── Lesson factory (/factory.html)
└── GitHub / AGENTS.md / schema / validation
```

## Wireframes

### Practice

```text
platå                                      Practice  Today

A2–B2 · no account · local progress
You know the words.
You freeze when it matters.

[ Try the post-interview situation ]  See demo progress
10–15 min · B2 · professional follow-up

How it works
Situation  →  exact miss  →  short repair

▸ Browse all 7 lessons and 5 drills

For reviewers: About & proof
For contributors: GitHub · Lesson factory
```

### Today

```text
platå                                      Practice  Today

Today
One useful session from your local progress.

RECOMMENDED
Repair passive agency                         4–6 min
The same skill is weak across two situations.
[ Open repair scene ]
Why this: one short learner-facing sentence

▸ Continue your current plan
▸ Browse lessons & drills
▸ Inspect progress, evidence, and data
```

### About & proof

```text
platå                     Practice  Demo  Proof  Quality  GitHub

About Platå
Targeted Danish practice for the intermediate plateau.
[ Open demo learner ]  Follow 60-second proof

What it does              What it does not do
real situations           no AI tutor in the browser
diagnosed misses          no account or cloud sync
short repair routes       no complete A2–B2 curriculum

Demo → Today → guided receipt → generated proof

▸ Inspect capability map and public reports
```

## Implementation decisions

1. Keep all existing routes and diagnostic DOM hooks.
2. Remove Program and GitHub from learner top navigation.
3. Rename Dashboard to Today in learner-facing navigation.
4. Collapse the optional catalog on Practice and Today.
5. Hide the starter-plan duplicate on a genuinely empty profile; Today remains
   the sole primary first-run action.
6. Keep detailed plan, memory, evidence, and portability markup available under
   disclosures so no functionality or proof contract is lost.
7. Turn Program into the reviewer landing page and place generated capability
   detail behind one explicit technical disclosure.
8. Keep Proof and Quality as specialist pages, with their long matrices collapsed
   below concise summaries and walkthroughs.

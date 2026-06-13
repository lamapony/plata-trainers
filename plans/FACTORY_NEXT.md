# Platå Factory Next: 7-Day Product Polish Plan

Date: 2026-06-13

## Scope

This is a narrow product-polish plan for the current static Platå repo. It assumes no backend, no accounts, no analytics, no framework rewrite, and no external product actions. The aim is to make the existing product feel coherent and reviewable in one week by tightening:

- PWA install/offline confidence.
- Narrative lesson gallery and first-visit route.
- Dashboard Today shell polish.
- Gold lesson quality gates and public proof.
- Exercise backlog shaped around real plateau moments.

## Current Product Surface Audit

Shipped learner surfaces:

- Home: `index.html` has plateau-first positioning, evaluator path, quick-start cards, narrative gallery, drills, and PWA metadata.
- Dashboard: `dashboard.html` and `dashboard.js` expose Today, guided session, trainer overview, practice plan, evidence, learner memory, mastery signals, competency map, raw weak tags, and profile import/export.
- Program: `program.html` and `program.js` render the generated capability map as a public learning-program view.
- Quality: `quality.html` and `quality.js` render generated gold lesson quality data.
- Proof: `proof.html` and `proof.js` render proof digest, health, capability, evaluator, guided-session, profile-portability, exercise-value, and review artifacts.
- Lessons: three narrative lessons exist, including two B2 gold lessons with quality contracts.
- Drills: bøjning, ordstilling, and vocab SR remain useful but are visually and pedagogically separate from the narrative loop.

Shipped proof and automation surface:

- `npm run check` covers syntax, catalog, lesson engine, data validation, dashboard, Today reports, guided sessions, quality reports, exercise value, public runtime, Pages artifact, and PWA smoke.
- `scripts/build-pages-artifact.js` publishes static routes, generated reports, PWA files, and `precache-manifest.json`.
- `scripts/smoke-pwa.js` checks service worker presence, manifest icons, page wiring, gallery copy, OG image, and built precache manifest.
- `docs/GOLD_LESSON_QUALITY_ENGINE.md` defines the gold lesson chain from source notes to mastery signals, remediation, comic panels, simulations, and flagship exercise value.
- `docs/FRONTEND.md` defines the plateau-first UI voice and visual system.

Main gaps to close:

- PWA is technically wired, but the learner does not get an explicit install/offline readiness cue.
- Narrative gallery exists, but the gallery cards do not yet act as a strong product spine from first visit to B2 scenes to drills.
- Today is powerful but dense; it should read first as one learner action, then as evidence.
- Lesson quality gates are broad and strong, but contributors need a smaller preflight path for the exact polish work.
- The backlog still mixes planned skill categories with shippable plateau exercises. It needs a short ranked list of exercises that extend the current quality model.

## Seven-Day Sequence

### Day 1: PWA Confidence Pass

Goal: make offline/install support visible and testable without adding account or backend complexity.

Deliverables:

- Add a small PWA status region on home and dashboard that reports one of: installable, installed, offline-ready, offline fallback unavailable, or unsupported.
- Keep `shared/plata-pwa.js` as the single runtime owner for service-worker registration and status events.
- Keep all route wiring static: `index.html`, `dashboard.html`, `program.html`, `quality.html`, and `proof.html` should continue to load the manifest, icon, and PWA helper.
- Confirm the Pages artifact includes `sw.js`, `site.webmanifest`, icons, `assets/og-plata.png`, and `precache-manifest.json`.

Acceptance checks:

```bash
npm run check:pwa
npm run build:pages
npm run check:pages
```

Done when:

- A learner can tell whether the app is ready offline without opening devtools.
- The status copy avoids overpromising. If service workers are unsupported, it says so quietly.
- PWA smoke remains deterministic with no browser dependency.

### Day 2: Narrative Gallery Product Spine

Goal: turn the gallery into the obvious route through Platå, not just a list of content.

Deliverables:

- Make `index.html#trainers` show a clear sequence: starter story, B2 workplace/social pressure, then drills as repairs.
- Add compact card metadata from `shared/plata-catalog.js`: level, type, estimated minutes when lesson data exposes it, and primary signal family.
- Ensure the home recommendation continues to prefer an active plan, then local progress, then Lesson 01.
- Keep drills below narrative lessons and describe them as reflex repair, not competing destinations.

Acceptance checks:

```bash
npm run check:home
npm run check:catalog
npm run check:pwa
```

Done when:

- First-time visitors can choose between "learn the loop", "B2 social tone", and "repair a reflex" without reading the README.
- The narrative gallery still satisfies the PWA smoke copy contract.
- No static route points at a missing trainer.

### Day 3: Today Shell Learner-First Polish

Goal: keep the dashboard's evidence strength while making Today feel like the product's front door.

Deliverables:

- Reorder the Today card so the primary action, route state, and expected outcome are visible before metrics.
- Keep the evidence trail available inside the same card, but visually subordinate metrics, fingerprints, and citations.
- Preserve the four Today states already encoded in `dashboard.js`: onboarding, active route, return, and memory review.
- Keep guided session as the companion panel directly under Today, but avoid making it feel like a second competing recommendation.

Acceptance checks:

```bash
npm run check:dashboard
npm run check:today-program-report
npm run check:today-program-diff
npm run check:guided-session
npm run check:guided-session-report
```

Done when:

- A demo learner sees one next action and why it matters in under five seconds.
- The report still proves all four Today states and cited-memory contracts.
- The dashboard remains local-only and deterministic.

### Day 4: Lesson Quality Gate Preflight

Goal: make gold lesson edits easier to review before the full suite runs.

Deliverables:

- Add or document a focused preflight command set for B2 gold lesson changes.
- Keep the contract centered on source-backed claims, scene goals, diagnostics, mastery tags, remediation, simulation paths, comic storyboard prompts, and flagship exercise value.
- Add one contributor-facing section that says exactly which files to touch for a new gold lesson and which checks catch which class of regression.
- Do not weaken existing `npm run check`; the preflight is a faster local route, not a replacement.

Acceptance checks:

```bash
npm run check:lessons
npm run check:gold-lessons
npm run check:counterfactuals
npm run check:lesson-engine
npm run check:quality-report
npm run check:exercise-value-report
npm run check:comic-prompts
```

Done when:

- A contributor can change a B2 lesson and run a focused set of checks before the full suite.
- A broken source, missing mastery signal, bad remediation target, missing simulation path, missing comic prompt, or weakened flagship chain fails locally.

### Day 5: Public Proof Tightening

Goal: make the public proof route useful to a human reviewer, not just to CI.

Deliverables:

- Review `proof.html`, `program.html`, and their renderers for duplicated proof language and reduce friction between capability map, proof digest, and quality report.
- Ensure proof page links tell a coherent route: demo learner -> Today recommendation -> guided outcome -> public reports -> source gates.
- Keep report links disabled until runtime fetch succeeds.
- Preserve mobile behavior for proof guided cards and capability rows.

Acceptance checks:

```bash
npm run check:program-page
npm run check:proof-page
npm run check:public-runtime
npm run check:capability-map
npm run check:proof-digest
npm run check:health
```

Done when:

- A reviewer can follow one learner path without needing to inspect `.dist` manually.
- The public proof surface still fails when a report, source path, or gate disappears.

### Day 6: Exercise Backlog and First Thin Slice

Goal: convert the broad exercise wishes into a short backlog of shippable plateau exercises.

Ranked backlog:

1. B2 workplace disagreement: same intent across Slack, email, and face-to-face; trains softening without evasion.
2. B2 public-service reply: passive agency, deadlines, and polite escalation; pairs well with the radiator lesson.
3. B1/A2 word-order repair pack: V2 after fronted time/place phrases pulled from narrative scenes.
4. B1 noun/verb trap pack: common-gender nouns, plural traps, and tense choices that appear inside existing lessons.
5. B2 "too direct vs too vague" email endings: consequence feedback and repair ladders for professional register.
6. Vocabulary recurrence pack: words from B2 lessons that should reappear in vocab SR after weak scene attempts.

First thin slice:

- Add one small exercise pack or lesson-scene extension that reuses an existing mastery signal and an existing route.
- Prefer extending a B2 gold lesson only if the new scene can satisfy the full gold contract.
- Otherwise add a drill pack with source notes and a clear path back from narrative scenes.

Acceptance checks:

```bash
npm run check:data
npm run check:exercise-audit
npm run check:exercise-value-report
npm run check:skill-coverage
npm run check:catalog
```

Done when:

- The backlog names concrete learner situations, not generic "more content".
- The first slice either improves a gold chain or gives drills a clear reason to exist after narrative practice.

### Day 7: Release Candidate and Review Proof

Goal: finish with a small, inspectable release candidate rather than a pile of unreviewed polish.

Deliverables:

- Build the Pages artifact and proof quickstart.
- Generate current quality, Today, guided-session, dashboard, demo learner, and personalization diffs where baseline files exist.
- Produce a short release note that names user-visible changes and proof commands.
- Keep any unfinished backlog items out of scope and documented as follow-up.

Acceptance checks:

```bash
npm run proof:quickstart
npm run check:quickstart-proof
npm run build:pages
npm run check:pages
npm run check
```

Done when:

- The repo has a passing full check.
- Public artifacts can be rebuilt from source.
- The release note points reviewers to the route, report, and command evidence.

## Operating Rules For The Week

- Keep the app static. Do not add a backend, auth, analytics, or a JS framework.
- Every user-facing claim needs a route, a report, or a script gate.
- Prefer small route polish over new abstractions unless an existing script or shared helper is duplicated.
- New exercises must have a source, a learner situation, a diagnostic signal, feedback, and a review command.
- Do not add generated comic assets without a separate visual review. Dry-run prompt manifests are enough for CI.

## Proof Commands By Workstream

PWA:

```bash
npm run check:pwa
npm run build:pages
npm run check:pages
```

Gallery and routes:

```bash
npm run check:home
npm run check:catalog
npm run check:public-runtime
```

Today and guided session:

```bash
npm run check:dashboard
npm run check:today-program-report
npm run check:today-program-diff
npm run check:guided-session
npm run check:guided-session-report
npm run check:guided-session-diff
```

Lessons and exercise value:

```bash
npm run check:lessons
npm run check:gold-lessons
npm run check:counterfactuals
npm run check:lesson-engine
npm run check:quality-report
npm run check:exercise-value-report
npm run check:quality-diff
```

Public proof:

```bash
npm run check:program-page
npm run check:proof-page
npm run check:capability-map
npm run check:proof-digest
npm run check:health
```

Full release:

```bash
npm run proof:quickstart
npm run check:quickstart-proof
npm run check
```

## Final Definition Of Done

- `plans/FACTORY_NEXT.md` stays as the source plan for the seven-day polish sequence.
- Each day has a narrow deliverable, explicit file areas, and commands that prove the change.
- The first week improves existing surfaces instead of starting a parallel product.
- Any remaining work is a concrete backlog item with a learner situation and gate, not an open-ended idea.

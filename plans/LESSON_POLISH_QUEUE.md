# Platå Lesson Polish Queue

Date: 2026-06-13
Issue: PLA-4 / PLATA-LESSON-001
Scope: Current `trainers-repo` lesson and exercise surface after the PWA + gallery pass.

## Current Lesson Surface

Current catalog entries:

- `lesson-01-arrival` — A0/A1 survival narrative: arrival, signage, greetings, `tak/selv tak`, first hostel interaction.
- `lesson-b2-radiator-register` — B2 gold lesson: complaint register, passive agency, modal particles, formal/private/workplace channel transfer.
- `lesson-b2-job-followup` — B2 gold lesson: post-interview follow-up, timing, formal warmth, LinkedIn/register shift, reply tone.
- `bojning` drill — verb tenses + noun inflection.
- `ordstilling` drill — V2, inversion, subordinate clauses.
- `vocab` SR — DA ↔ RU spaced repetition.

Important observation: the current repo does **not** contain a B1/B2 `lesson-b1-ordstilling` narrative lesson. Ordstilling exists as a drill only. That is the largest exercise/product gap because word order is exactly where plateau learners feel progress stall.

## Product Principle

Platå should not grow by adding random exercises. Every new exercise should be one of:

1. **Narrative pressure** — a realistic Danish moment where wording changes the social result.
2. **Repair drill** — a focused trainer that repairs one weak signal discovered in a narrative.
3. **Proof gate** — a deterministic check proving the lesson still trains what it claims.

If an exercise cannot name its pressure, weak signal, and repair path, it should stay out.

## Ranked Queue

### P0 — Gold-lite Lesson 01 polish

Target: `lessons/lesson-01/data.js`, `shared/plata-catalog.js`, lesson checks.

Why: Lesson 01 is the first story and currently works well as a human onboarding episode, but it does not expose the same machine-readable quality surface as the B2 gold lessons.

Work:

- Add `level: "A1"` or `level: "A0/A1"` and a stable `qualityTier: "starter"`.
- Add a small `masteryMap` for:
  - `signage-direction` — ind/ud, indgang/udgang.
  - `identity-chunk` — `jeg hedder + name`, `hvad hedder du?`.
  - `courtesy-loop` — `tak`, `selv tak`.
- Add a tiny `simulation` with at least two paths:
  - `survives-morning` — correct signage, identity, courtesy, completion.
  - `socially-lost` — misses ind/ud and courtesy loop but completes final greeting.
- Add `lessonGlobal` + `lessonDataPath` to the catalog entry, matching the B2 entries.
- Keep the lesson short; do not turn starter content into a grammar table.

Acceptance:

```bash
npm run check:lessons
npm run check:lesson-engine
npm run check:catalog
npm run check:exercise-audit
```

Done when:

- Lesson 01 still feels simple to a beginner.
- The engine can cite its mastery signals.
- The gallery can show its level/minutes/signals without hardcoded copy.

### P0 — Ordstilling narrative bridge

Target: new lesson under `lessons/lesson-b1-ordstilling/`, existing `ordstilling-drill/`, catalog.

Why: Ordstilling is a core plateau blocker, but the current product exposes it as a drill. Platå needs one narrative that makes V2/inversion socially necessary before sending learners into the drill.

Recommended lesson:

- Working title: **“Det kommer an på ordstillingen”**.
- Level: B1/B2.
- Situation: a learner explains a late arrival / changed plan to a colleague, then writes a short follow-up message. The wrong word order is understandable but sounds foreign or changes emphasis.
- Core phenomena:
  - V2 after fronted adverbials: `I morgen kommer jeg...`, not `I morgen jeg kommer...`.
  - Inversion after `derfor`, `så`, `alligevel`.
  - Subordinate clause word order after `fordi`, `selvom`, `når`.
  - Register contrast: spoken explanation vs written follow-up.

Scene sketch:

1. **Corridor pressure** — choose the sentence after `I dag...` with V2.
2. **Because trap** — contrast main clause vs subordinate `fordi jeg...`.
3. **Message repair** — rewrite a short follow-up where `derfor` triggers inversion.
4. **Colleague response** — read whether the colleague understood reason vs excuse.
5. **Channel transfer** — spoken apology -> written Slack/email line.
6. **Epilogue** — name the principle: fronted element takes first slot, finite verb takes second.

Variables:

- `clarity`
- `foreignness`
- `trust`

Acceptance:

```bash
npm run check:lessons
npm run check:lesson-engine
npm run check:planner
npm run check:gold-lessons
npm run check:exercise-audit
```

Done when:

- The lesson produces at least 3 simulation paths: `clear`, `understandable-but-foreign`, `confusing`.
- Each weak mastery signal maps to one concrete `ordstilling-drill` repair path.
- The learner can explain one rule in plain words, not grammar jargon.

### P1 — Drill-to-story repair links

Target: `shared/plata-catalog.js`, dashboard/Today planner copy, drill data.

Why: Drills are currently useful but detached from the narrative loop. The product should say: “You missed X in a story; run this drill to repair X.”

Work:

- Add catalog metadata for drill repair targets:
  - `bojning` repairs tense/inflection accuracy.
  - `ordstilling` repairs V2/inversion/subordinate clause ordering.
  - `vocab` repairs retrieval and recognition gaps.
- Add lesson `masteryMap.remediation` entries that point to a drill when a full scene rerun is too broad.
- Keep drill UI unchanged unless a repair context is passed in.

Acceptance:

```bash
npm run check:planner
npm run check:dashboard
npm run check:catalog
npm run check:exercise-value-report
```

Done when:

- A weak signal can produce either “rerun scene” or “run drill” as a clear next action.
- Dashboard Today does not show drills as unrelated content.

### P1 — B2 radiator polish pass

Target: `lessons/lesson-b2-radiator/data.js`.

Why: This is the strongest flagship lesson. Its value is register and social consequence. Preserve that; only polish where proof/transfer can be clearer.

Work:

- Add one explicit near-miss diagnostic for each channel-transfer option: why it sounds plausible but fails.
- Tighten answer acceptance for `workplace-understatement` so variants with `konkret dato`, `udlejeren`, and active agency pass without accepting vague “varme”.
- Ensure every source-backed claim is used in at least one mastery tag or scene notice.
- Do not add more scenes unless a new scene trains a missing signal.

Acceptance:

```bash
npm run check:gold-lessons
npm run check:counterfactuals
npm run check:quality-report
npm run check:quality-mutations
```

Done when:

- Aggressive, passive, and diplomatic paths still produce distinct social consequences.
- Near misses teach register, not just “wrong answer”.

### P1 — B2 job follow-up polish pass

Target: `lessons/lesson-b2-job-followup/data.js`.

Why: This lesson is product-relevant for Dima’s actual audience: immigrants/job seekers using professional Danish. It should become the second flagship demo.

Work:

- Strengthen completion acceptance around `reply-consequence` so it requires both acknowledgement and process/next-step language.
- Add one explicit “too eager” diagnostic in the waiting scene: distinguish initiative from pressure.
- Add a transfer note from formal email to LinkedIn: specific + low-pressure + independent from the email.
- Consider adding one optional scene later: responding to a rejection while preserving relationship.

Acceptance:

```bash
npm run check:gold-lessons
npm run check:counterfactuals
npm run check:quality-report
npm run check:exercise-value-report
```

Done when:

- `professional`, `acceptable`, and `damaged` paths remain visibly different.
- The lesson trains useful professional Danish, not generic career advice.

### P2 — New narrative lesson: Borgerservice / MitID appointment

Why: This hits the Danish-bureaucracy plateau: the learner understands words but freezes under institutional pressure.

Recommended lesson:

- Working title: **“Når systemet siger nej”**.
- Level: A2/B1.
- Situation: booking or fixing a Borgerservice/MitID/CPR-related appointment without sounding panicked or passive.
- Core phenomena:
  - Polite request chunks: `Jeg vil gerne...`, `Kan jeg få...`, `Er det muligt at...`.
  - Time/date precision.
  - Clarifying misunderstanding: `Mener du...?`, `Skal jeg...?`.
  - Agency without aggression.

Acceptance:

- 5–6 scenes.
- At least 3 mastery tags.
- 2 simulation paths minimum.
- No legal/official advice claims; language practice only.
- Source notes only for public-service writing/register if used.

### P2 — New narrative lesson: Doctor/pharmacy symptom precision

Why: This is a high-stakes everyday plateau moment and naturally trains adjective order, body terms, severity, duration, and polite clarification.

Recommended lesson:

- Working title: **“Hvor længe har du haft det sådan?”**
- Level: A2/B1.
- Situation: describing symptoms to læge/apotek without overclaiming certainty.
- Core phenomena:
  - Duration: `i to dage`, `siden i går`, `om morgenen`.
  - Severity: `lidt`, `ret`, `meget`, `værre/bedre`.
  - Clarification: `Kan du gentage det?`, `Hvad betyder...?`.
  - Agency: asking what to do next.

Acceptance:

- Must avoid medical advice. It trains language only.
- Must include clear “call emergency / contact doctor” safety copy if symptoms are framed as realistic.
- Must have precise answer validation for duration/severity chunks.

## Exercise Backlog

### Thin slices to build before adding more giant lessons

1. **Ordstilling repair cards**
   - 20 sentence-level items from real narrative contexts.
   - Each item names whether it is V2, inversion, or subordinate clause.
   - Acceptance: `npm run check:data`, `npm run check:planner`.

2. **Register contrast mini-drill**
   - Same message in private chat, formal email, workplace small talk.
   - Learner chooses what changes and why.
   - Reuses radiator/job-follow-up source notes.

3. **Answer normalizer tests**
   - Add fixtures for acceptable Danish variants in completion scenes.
   - Prevent false positives where a vague keyword passes.

4. **Narrative-to-drill repair CTA**
   - When a gold lesson exposes `formal-register-control`, `modal-particle-stance`, or `ordstilling-v2`, dashboard recommends either the exact scene or a drill slice.

## Operating Rule for the Factory

For the next two weeks, the factory should run this loop:

1. One product-visible polish task.
2. One lesson/exercise task.
3. One QA/proof task.
4. No new lesson starts until the previous lesson has:
   - catalog entry,
   - mastery map,
   - simulation paths,
   - planner/remediation links,
   - checks passing.

## Next Work Packages

Recommended next Paperclip issues:

1. `PLATA-LESSON-002`: Gold-lite Lesson 01 metadata + starter mastery map.
2. `PLATA-LESSON-003`: B1/B2 Ordstilling narrative scaffold.
3. `PLATA-DRILL-001`: Ordstilling repair cards from narrative contexts.
4. `PLATA-QA-002`: Focused gold lesson preflight command documentation.

This keeps Platå moving forward without exploding scope.

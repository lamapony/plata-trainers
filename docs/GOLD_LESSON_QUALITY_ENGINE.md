# Gold Lesson Quality Engine

## Intent

Platå gold lessons should behave like testable learning artifacts, not static content pages.

The hard problem is not adding more lessons. The hard problem is proving that a lesson trains what it claims to train:

```text
sourceNotes -> learningGoal -> targetPhrases -> interaction -> feedback -> mastery signal -> remediation
```

Most language-learning projects stop at authored content. Platå should go deeper: a gold lesson must carry enough structured metadata for tooling to validate the pedagogical contract and enough runtime instrumentation for the dashboard to show what the learner is actually struggling with.

## Contract

A gold lesson has five layers:

1. **Evidence layer**
   - `sourceNotes` cite the language claims the lesson depends on.
   - Scene `sourceRefs` point back to those notes.

2. **Teaching layer**
   - `learningGoal` names the one skill a scene trains.
   - `targetPhrases` name the Danish phrases actively taught in the scene.

3. **Diagnostic layer**
   - Choice options expose `diagnostic` keys for learner misconceptions.
   - B2 match pairs include feedback that explains the stance or grammar signal.
   - Completion scenes use grouped checks when a B2 answer needs more than one signal.

4. **Mastery layer**
   - `masteryMap` defines durable learner-facing skill signals.
   - Each scene declares `masteryTags`.
   - The lesson engine records those tags with every attempt.
   - Dashboard and QA can use the tags to distinguish weak concepts from generic wrong answers.

5. **Remediation layer**
   - Every `masteryMap` entry declares a `remediation` action.
   - The action points to the source scene that can repair the weak signal.
   - Dashboard recommendations can therefore say what to do next, not only what went wrong.
   - Repair links open `?mode=repair&signal=<tag>#<scene-id>`, so the lesson engine can render the repair focus and record repair attempts.

## Why This Matters

A normal lesson can say:

> The learner practises passive voice and register.

A gold lesson should be able to prove:

- the passive-voice claim is source-backed;
- the scene asks the learner to distinguish process language from commitment;
- the correct and incorrect answers produce diagnostic feedback;
- the recorded attempt includes the `passive-agency` mastery signal;
- the weak signal points back to a concrete repair scene;
- the repair scene opens in repair mode and records attempts with the repair mode;
- future weak-tag analysis can show that this learner struggles with passive agency rather than B2 Danish in general.

That is the difference between content and an inspectable learning system.

## Simulator Role

The gold lesson simulator is intentionally narrow. It does not replace browser tests or full interaction QA. It verifies the educational behavior that is easy to break during editing:

- every gold scene emits mastery tags through the lesson engine tag helper;
- every declared simulation path produces expected attempts and effects;
- grouped completion rejects weak partial answers and accepts a full B2 answer;
- each path resolves to the expected ending;
- every ending is covered by at least one path;
- all declared mastery tags are exercised by at least one simulated attempt.

This gives maintainers a fast, no-dependency check that can run in GitHub Actions.

Dashboard smoke tests cover the remediation surface: a weak mastery signal from a gold lesson must render a learner-facing repair action and a repair-mode link such as `./lessons/lesson-b2-radiator/?mode=repair&signal=passive-agency#official-reply-passive`.

The gold simulator also checks that every `masteryMap` remediation entry can be resolved by the lesson engine's repair-context parser.

The lesson-engine smoke test goes one layer closer to production: it replays the declared gold simulation paths through the real `PlataLessonEngine` renderers and event handlers using a no-dependency fake DOM, then checks the LocalStorage attempts that the learner would actually produce.

## Public Report

Pages publishes a generated report at `quality.html`, backed by `reports/quality.json`.

The report is built from lesson data during `npm run build:pages`, not edited by hand. It exposes:

- all narrative lessons discovered at build time;
- gold lesson count;
- scene, source, mastery, ending, and simulation path counts;
- per-lesson mastery signals and remediation targets;
- a scene audit matrix linking each gold scene to its learning goal, source references, mastery tags, diagnostics, remediation targets, and simulation paths;
- simulation path coverage;
- report issues, which are build-blocking.

The report fails the build if a gold scene is not covered by a simulation path, or if a remediation target does not train the mastery signal it claims to repair.

`npm run check:quality-report` builds the JSON report and fails if the report detects contract issues. `npm run check:quality-mutations` creates temporary broken gold lessons and proves the report catches missing sources, missing simulation coverage, broken remediation, bad completion answer specs, and duplicate diagnostics. `npm run check:quality-diff` proves the review diff catches regressions such as new issues, failed guarantees, and removed evidence rows. `npm run check:quality-page` runs the public page renderer against the generated report object.

For review, compare two generated reports:

```bash
npm run diff:quality -- --base before.json --head after.json --fail-on-regression
```

The diff ignores volatile timestamps and reports only contract changes: status shifts, lesson additions/removals, issue deltas, guarantee pass/fail changes, mastery/simulation deltas, and scene evidence row changes.

The QA workflow runs this diff automatically on pull requests by building one report from the base commit and one from the head commit, then failing on regressions with `--fail-on-regression`.

## Authoring Pipeline

Gold lesson authoring starts from a checked scaffold:

```bash
npm run scaffold:gold -- --slug lesson-b2-your-topic --title "Your Topic"
```

The scaffold creates the lesson folder, `app.js`, `index.html`, `styles.css`, a `qualityTier: "gold"` `data.js`, and a catalog entry. The generated lesson is intentionally generic, but it already satisfies the contract:

- five scenes across choice, match, completion, and final principle;
- `sourceNotes`, scene `sourceRefs`, `learningGoal`, `targetPhrases`, and `masteryTags`;
- `masteryMap` remediation links;
- grouped completion checks;
- `endingLogic` and three endings;
- `simulation.paths` covering strong, neutral, and strained outcomes.

`npm run check:gold-scaffold` keeps this authoring path honest. It generates a temporary scaffold lesson under `.dist/scaffold-smoke`, then runs:

```bash
node scripts/validate-lesson.js --file <generated-data.js>
node scripts/simulate-gold-lessons.js --file <generated-data.js>
node scripts/smoke-lesson-engine.js --file <generated-data.js>
```

That means the scaffold itself must stay compatible with the lesson schema, the simulator, and the real shared lesson engine.

## Current Scope

The first gold implementations are:

- `lesson-b2-radiator-register`
- `lesson-b2-job-followup`

`lesson-b2-radiator-register` introduces these mastery signals:

- `passive-agency`
- `modal-particle-stance`
- `formal-register-control`
- `understatement-with-agency`
- `consequence-aware-tone`

The simulator covers three radiator paths:

- `diplomatic`
- `aggressive`
- `passive`

`lesson-b2-job-followup` adds a second independent gold lesson with different social variables and endings, proving that the consequence system is data-driven rather than hardcoded to the radiator scenario.

That means the QA suite now checks the consequence system, not only the ideal answer path, across multiple gold lessons.

## Non-Goals

- The simulator is not a replacement for human editorial review.
- It does not judge whether sources are correct; it verifies that lesson claims are wired to sources.
- It does not use LLM grading for open text. Gold completion checks remain deterministic until the repo has a clear grading policy.
- It does not require heavyweight browser dependencies in CI.

## Maintainer Rule

If a lesson is marked `qualityTier: "gold"`, changes should preserve the full chain:

```text
source-backed claim -> scene goal -> trained phrase -> diagnostic interaction -> recorded mastery signal -> repair action
```

If any part of that chain is missing, the lesson should be downgraded or the validator should fail.

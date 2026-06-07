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

## Why This Matters

A normal lesson can say:

> The learner practises passive voice and register.

A gold lesson should be able to prove:

- the passive-voice claim is source-backed;
- the scene asks the learner to distinguish process language from commitment;
- the correct and incorrect answers produce diagnostic feedback;
- the recorded attempt includes the `passive-agency` mastery signal;
- the weak signal points back to a concrete repair scene;
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

Dashboard smoke tests cover the remediation surface: a weak mastery signal from a gold lesson must render a learner-facing repair action and a scene-level link such as `./lessons/lesson-b2-radiator/#official-reply-passive`.

## Current Scope

The first implementation focuses on `lesson-b2-radiator-register`.

It introduces these mastery signals:

- `passive-agency`
- `modal-particle-stance`
- `formal-register-control`
- `understatement-with-agency`
- `consequence-aware-tone`

The current simulator covers three radiator paths:

- `diplomatic`
- `aggressive`
- `passive`

That means the QA suite now checks the consequence system, not only the ideal answer path.

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

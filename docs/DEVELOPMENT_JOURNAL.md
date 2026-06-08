# Platå Development Journal

This journal tracks technical bets that make the project more valuable as an open-source learning system. It is deliberately narrower than the public roadmap: each item should produce inspectable code, a contract, or a QA check.

## Deep Technical Track

- [x] Document the next technical direction as a checklist instead of loose ideas.
- [x] Add an event-sourced learning log that can be derived from existing local trainer state.
- [x] Make exported profiles replay-ready so a bug report can include an auditable local learning timeline.
- [x] Add deterministic replay checks that rebuild progress facts from events.
- [x] Add a planner decision trace so every recommendation can explain its inputs and score.
- [x] Add mutation-style pedagogy tests that prove bad mastery/remediation contracts fail CI.
- [x] Build a counterfactual learner simulator for checking whether lesson edits improve or harm repair paths.
- [x] Add a profile replay debugger for maintainers, starting from JSON exports rather than user screenshots.
- [x] Compile mastery signals into a skill graph coverage report so gaps are visible before new content is added.
- [ ] Add deterministic snapshot tests for the dashboard recommendation surface.

## Current Sprint

- [x] Introduce `PlataEvents` as a shared browser-safe event contract.
- [x] Derive attempt, repair, signal-reopen, and practice-plan events without changing storage writes.
- [x] Keep event payloads privacy-conscious by excluding raw expected/given answer text.
- [x] Include an event-log payload in dashboard profile export.
- [x] Cover the event contract with smoke tests and the full project check.

## Planner Trace Sprint

- [x] Attach a machine-readable `trace` to lesson, drill, and dashboard planner decisions.
- [x] Record the rule, selected target, input facts, score breakdown, reasons, and stable fingerprint.
- [x] Preserve planner traces inside saved practice-plan steps and exported profile JSON.
- [x] Keep trace payloads privacy-conscious by stripping raw answer/prompt-style text keys.
- [x] Cover planner traces in planner and dashboard smoke tests.

## Planner Mutation Sprint

- [x] Audit every gold mastery signal through the real kernel -> planner -> practice-plan route.
- [x] Prove unknown competency ids fail the planner contract.
- [x] Prove missing or mistargeted remediation scenes fail the planner contract.
- [x] Prove missing remediation action/evidence fails the planner contract.
- [x] Include the mutation suite in `npm run check`.

## Counterfactual Simulator Sprint

- [x] Simulate every declared gold learner profile as baseline repair pressure.
- [x] Compare baseline lessons with mutated lesson variants using the same learner behavior.
- [x] Report `correctDelta`, `wrongDelta`, `repairLoadDelta`, weak-signal deltas, and ending drift.
- [x] Prove stricter answer edits can create new repair pressure for a successful learner.
- [x] Prove over-lenient edits can mask repair pressure for a weak learner.
- [x] Include the counterfactual simulator in `npm run check`.

## Profile Replay Debugger Sprint

- [x] Add a maintainer CLI that reads dashboard profile JSON exports.
- [x] Replay exported event logs into trainer, signal, item, and practice-plan facts.
- [x] Derive a replay timeline from legacy exports that do not contain `eventLog`.
- [x] Warn on event fingerprint and replay-count mismatches.
- [x] Keep debug reports free of raw expected/given learner answer text.
- [x] Include profile replay smoke tests in `npm run check`.

## Skill Coverage Debug Sprint

- [x] Tighten the plan from a generic coverage page to a CI contract for competency/content drift.
- [x] Compile the competency graph, catalog, and gold lesson mastery maps into a JSON report.
- [x] Fail on live contract errors: unmapped mastery tags, graph mismatches, duplicate graph tags, unsimulated signals, and empty root skills.
- [x] Keep planned graph tags without content as warnings instead of build blockers.
- [x] Publish `reports/skill-coverage.json` in the Pages artifact beside the quality report.
- [x] Include mutation smoke tests in `npm run check`.

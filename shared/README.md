# Platå Shared Kernel

`plata-kernel.js` exposes `window.PlataKernel` for static trainers. It stores versioned state in LocalStorage under:

```text
plata:trainer:<trainerId>:state:v1
```

The schema keeps trainer metadata, per-item records, compact recent attempts, and aggregate counters. Old trainer states with `byItemId` and `meta` are migrated into the v1 shape.

Public helpers include:

- `createTrainerState({ trainerId, oldKeys })`
- `ensureItemRecord(state, itemId, tags)`
- `recordAttempt(state, attempt)`
- `recordRepairClosure(state, closure)`
- `getRepairClosure(state, signal)` and `isSignalResolved(state, signal)`
- `getStats(state)`
- `pickSessionItems(items, options)`
- `exportState(state)` and `importState(json, expectedTrainerId)`
- `computeGate(state, gateSpec)`
- `getWeakTags(state, limit, { includeResolved })`

Repair closure records retire lesson-owned weak signals after a correct repair attempt. By default `getWeakTags` returns only open weak signals; pass `{ includeResolved: true }` to inspect historical misses that have already been repaired.

`plata-dashboard.js` adds small formatting helpers for stats, gate text, and weak tag summaries. It is optional and has no dependencies.

`plata-planner.js` exposes `window.PlataPlanner`, the shared next-action contract used by the dashboard and post-session recommendations. It ranks repair, repeat, continue, start, stale-review, and enough-for-today decisions from the same local progress state. It also compiles ranked dashboard decisions into a short `practicePlan(...)` so UI layers can show an ordered session route without duplicating planner rules.

Planner decisions carry two explanation layers. `explainDecision(...)` and `explainPracticePlanStep(...)` produce learner-facing copy. `traceDecision(...)` and `tracePracticePlanStep(...)` produce a machine-readable trace with the rule, selected target, input facts, score breakdown, reasons, and stable fingerprint; saved practice-plan steps preserve that trace for profile exports and bug reports. Dashboard recommendations can accept visible `PlataMemory` facts as optional inputs, cite the fact ids/source fingerprints they used, and keep hidden learner facts out of the next planning pass.

`scripts/mutation-planner-contract.js` protects the planner-facing pedagogy contract. It runs every gold mastery signal through the real kernel, planner, and practice-plan route, then mutates competency ids, remediation scenes, mastery tags, actions, and evidence to prove those bad contracts fail CI.

`plata-competencies.js` exposes `window.PlataCompetencies`, the competency graph that groups gold lesson mastery signals into root skills such as agency, register control, stance reading, process control, and consequence awareness. Dashboard and planner code use it to explain why several weak signals point to the same underlying capability.

`scripts/build-skill-coverage-report.js` compiles the competency graph, catalog, and gold lesson mastery maps into a coverage report. It blocks live content/graph drift such as unmapped lesson signals, competency mismatches, duplicate graph tags, unsimulated signals, and empty root skills, while keeping planned graph tags without content as warnings.

`scripts/snapshot-dashboard-recommendations.js` locks the dashboard recommendation surface to deterministic fixtures for an empty profile and a weak-mastery profile. It snapshots ranked candidates, due cards, active practice-plan routing, planner traces, evidence ledger rows, and root-skill diagnostics; run it with `--update` only when an intentional planner/UI contract change should become the new baseline.

`scripts/mutation-dashboard-snapshot.js` mutates temporary copies of the planner and evidence ledger to prove the dashboard snapshot is not decorative. It catches preferred-entry drift, repair trace-rule drift, and missing open-mastery ledger rows without touching the working tree.

`scripts/diff-dashboard-snapshot.js` compares two dashboard recommendation snapshots and prints a compact review summary for due-card order, decision kind/score/href/trace changes, practice-plan routes, evidence ledger rows, and root-skill diagnostics. Use `--fail-on-regression` for removed repair evidence and `--fail-on-change` when any snapshot drift should block automation.

`scripts/build-project-health-manifest.js` publishes `reports/project-health.json`, a maintainer-facing map of QA gates, public reports, GitHub workflows, and deterministic fixtures. It fails when a required gate drops out of `npm run check`, a public report is no longer written by the Pages artifact, a workflow stops running the full check, or a deterministic fixture goes stale.

`plata-evidence.js` exposes `window.PlataEvidence`, the shared evidence ledger contract. It turns trainer state, enriched weak mastery stats, recent attempts, and repair closures into ranked ledger entries such as open mastery signals, closed repairs, reopened signals, missed attempts, and correct attempts. UI layers should render these entries instead of interpreting raw attempts directly.

`plata-events.js` exposes `window.PlataEvents`, a replay-ready event-log contract derived from existing trainer state and active practice-plan state. It emits privacy-conscious events such as `attempt.recorded`, `repair.closed`, `signal.reopened`, `plan.compiled`, `plan.step.started`, and `plan.step.completed`, then can replay those events into deterministic progress facts for export debugging and CI.

`plata-memory.js` exposes `window.PlataMemory`, the local learner memory compiler underneath future inspectable personalization. It turns the redacted event log into durable facts such as `weak_signal`, `repaired_signal`, `recurring_trap`, `stable_strength`, `stale_skill`, `preferred_context`, and `next_review_due`. Facts cite source event ids and a source fingerprint, and carry a privacy marker that no raw answer text is included.

When `PlataCompetencies` is available, memory also emits `root_competency_trap` facts for cross-lesson patterns: for example, misses in `passive-agency` and `professional-email-agency` can become one inspectable `agency` root-skill fact. Planner and advisor traces can cite that fact while still routing the learner to the concrete repair scene.

`plata-learner-model.js` turns derived memory facts into a deterministic adaptive profile with explicit kind weights, confidence boosts, age adjustments, transfer boosts, ranked priorities, review queue, root competency risks, recommended focus, guardrails, and a stable fingerprint. It does not expose event logs or source event ids. `scripts/smoke-learner-model.js` snapshots fixed learner profiles and mutates raw-text leaks, missing focus citations, missing source fingerprints, lost root-competency focus, raw history payloads, and fingerprint drift.

`scripts/smoke-learner-model-alignment.js` proves that the learner model focus stays aligned with the real planner and advisor layers: model focus facts must be planner-selected when a planner decision exists, advisor-cited in every profile, and removed from all downstream citations after counterfactual deletion. `scripts/mutation-learner-model-alignment.js` mutates model priorities, planner citation ids, advisor fact selection, and review-due handling to prove drift fails CI.

The dashboard memory inspector renders those facts for the learner, supports hiding/restoring individual derived facts, supports learner-marked correction records for false assumptions, renders corrected records as an audit trail with individual restore, and includes visible facts plus hidden/corrected fact records in portable profile export/import.

`scripts/smoke-memory-corrections.js` protects the correction-record contract. It proves corrected memory facts keep stable fact ids, reasons, timestamps, source fingerprints, and no raw expected/given answer text, while duplicate or malformed correction records fail CI.

`plata-memory-vault.js` defines the optional account-sync payload for future OpenClaw-style memory. It stores compact derived facts, source fingerprints, hidden/corrected fact metadata, and privacy flags, while rejecting trainer state, event logs, practice plans, source event ids, raw expected/given keys, and raw answer text. It also exposes deterministic vault merging: tombstones and learner corrections beat incoming facts, repeated imports are idempotent, and duplicate semantic facts from the same source collapse to the freshest version. `scripts/smoke-memory-vault.js` covers root competency facts, merge conflicts, and unsafe payload mutations.

`plata-memory-brief.js` turns a valid memory vault into the short agent-readable context a future account-resident helper can use. It chooses one cited focus, lists top derived facts, root-skill risks, due reviews, hidden/corrected assumptions, and guardrails. `scripts/smoke-memory-brief.js` snapshot-tests fixed learner profiles and mutates raw-text leaks, missing citations, source-fingerprint drift, and lost root competency focus.

`plata-agent-handoff.js` turns a valid memory brief into a strict task packet for a future account-resident helper. It includes one task, required fact/source citations, compact agent context, allowed and blocked actions, a response contract, guardrails, and a stable fingerprint, while rejecting raw history containers and raw answer text. `scripts/smoke-agent-handoff.js` snapshots fixed learner profiles and mutates raw-text leaks, missing citations, disabled citation requirements, missing action constraints, lost root-skill focus, and fingerprint drift.

`scripts/smoke-memory-fixtures.js` checks deterministic learner memory profiles in `scripts/fixtures/learner-memory-profiles.json`: returning learner context, stale review, repaired signal retention, and recurring trap repair. Use `--update` only when intentional memory/planner drift should become the new baseline.

`plata-advisor.js` exposes `window.PlataAdvisor`, a deterministic advice layer underneath any future OpenClaw-style agent. It turns planner decisions and cited memory facts into a short advice object with fact ids, source fingerprints, next action, guardrails, and a trace fingerprint. `scripts/smoke-advisor-fixtures.js` locks those advice objects to the learner memory fixtures and proves raw answer text does not leak into advice.

`scripts/smoke-personalization-eval.js` is the cross-layer personalization harness. It runs the fixed learner profiles through memory, planner, and advisor together, then removes relevant memory facts to prove recommendations drift predictably. This catches advice that claims learner-memory evidence without cited facts.

`scripts/mutation-personalization-eval.js` proves that harness is not decorative. It mutates temporary copies of the advisor and planner to catch memory-backed repair drift, dropped fallback facts, corrupted planner-selected citations, ignored review-due facts, and raw-text guardrail regressions.

`scripts/smoke-personalization-trajectory.js` checks personalization over time instead of only at fixed profile snapshots. It replays staged learner timelines where a repair closes, spacing makes review due, review retires the due fact, a later miss reopens the signal, and a cross-lesson agency pattern becomes a root-competency focus. `scripts/mutation-personalization-trajectory.js` proves those transitions fail when reopen handling, review-age boundaries, root learner-model priority, or planner root-memory selection drift.

`scripts/debug-profile-replay.js --file plata-backup.json` is the maintainer-facing replay debugger for dashboard exports. It reads the exported `eventLog` when present, derives one from legacy `trainers` + `practicePlan` exports when needed, and prints trainer, signal, item, plan, memory-correction, fingerprint, and warning summaries without raw learner answer text.

`plata-catalog.js` is the static trainer registry used by the dashboard. Gold lesson entries can declare `lessonGlobal` and `lessonDataPath`; the dashboard loads those data files on demand to build mastery/remediation recommendations without hardcoding individual lesson globals.

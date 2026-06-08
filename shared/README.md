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

Planner decisions carry two explanation layers. `explainDecision(...)` and `explainPracticePlanStep(...)` produce learner-facing copy. `traceDecision(...)` and `tracePracticePlanStep(...)` produce a machine-readable trace with the rule, selected target, input facts, score breakdown, reasons, and stable fingerprint; saved practice-plan steps preserve that trace for profile exports and bug reports.

`scripts/mutation-planner-contract.js` protects the planner-facing pedagogy contract. It runs every gold mastery signal through the real kernel, planner, and practice-plan route, then mutates competency ids, remediation scenes, mastery tags, actions, and evidence to prove those bad contracts fail CI.

`plata-competencies.js` exposes `window.PlataCompetencies`, the competency graph that groups gold lesson mastery signals into root skills such as agency, register control, stance reading, process control, and consequence awareness. Dashboard and planner code use it to explain why several weak signals point to the same underlying capability.

`scripts/build-skill-coverage-report.js` compiles the competency graph, catalog, and gold lesson mastery maps into a coverage report. It blocks live content/graph drift such as unmapped lesson signals, competency mismatches, duplicate graph tags, unsimulated signals, and empty root skills, while keeping planned graph tags without content as warnings.

`scripts/snapshot-dashboard-recommendations.js` locks the dashboard recommendation surface to deterministic fixtures for an empty profile and a weak-mastery profile. It snapshots ranked candidates, due cards, active practice-plan routing, planner traces, evidence ledger rows, and root-skill diagnostics; run it with `--update` only when an intentional planner/UI contract change should become the new baseline.

`scripts/mutation-dashboard-snapshot.js` mutates temporary copies of the planner and evidence ledger to prove the dashboard snapshot is not decorative. It catches preferred-entry drift, repair trace-rule drift, and missing open-mastery ledger rows without touching the working tree.

`plata-evidence.js` exposes `window.PlataEvidence`, the shared evidence ledger contract. It turns trainer state, enriched weak mastery stats, recent attempts, and repair closures into ranked ledger entries such as open mastery signals, closed repairs, reopened signals, missed attempts, and correct attempts. UI layers should render these entries instead of interpreting raw attempts directly.

`plata-events.js` exposes `window.PlataEvents`, a replay-ready event-log contract derived from existing trainer state and active practice-plan state. It emits privacy-conscious events such as `attempt.recorded`, `repair.closed`, `signal.reopened`, `plan.compiled`, `plan.step.started`, and `plan.step.completed`, then can replay those events into deterministic progress facts for export debugging and CI.

`scripts/debug-profile-replay.js --file plata-backup.json` is the maintainer-facing replay debugger for dashboard exports. It reads the exported `eventLog` when present, derives one from legacy `trainers` + `practicePlan` exports when needed, and prints trainer, signal, item, plan, fingerprint, and warning summaries without raw learner answer text.

`plata-catalog.js` is the static trainer registry used by the dashboard. Gold lesson entries can declare `lessonGlobal` and `lessonDataPath`; the dashboard loads those data files on demand to build mastery/remediation recommendations without hardcoding individual lesson globals.

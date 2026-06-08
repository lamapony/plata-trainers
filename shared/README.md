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

`plata-competencies.js` exposes `window.PlataCompetencies`, the competency graph that groups gold lesson mastery signals into root skills such as agency, register control, stance reading, process control, and consequence awareness. Dashboard and planner code use it to explain why several weak signals point to the same underlying capability.

`plata-evidence.js` exposes `window.PlataEvidence`, the shared evidence ledger contract. It turns trainer state, enriched weak mastery stats, recent attempts, and repair closures into ranked ledger entries such as open mastery signals, closed repairs, reopened signals, missed attempts, and correct attempts. UI layers should render these entries instead of interpreting raw attempts directly.

`plata-catalog.js` is the static trainer registry used by the dashboard. Gold lesson entries can declare `lessonGlobal` and `lessonDataPath`; the dashboard loads those data files on demand to build mastery/remediation recommendations without hardcoding individual lesson globals.

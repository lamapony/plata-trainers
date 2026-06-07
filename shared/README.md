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
- `getStats(state)`
- `pickSessionItems(items, options)`
- `exportState(state)` and `importState(json, expectedTrainerId)`
- `computeGate(state, gateSpec)`
- `getWeakTags(state, limit)`

`plata-dashboard.js` adds small formatting helpers for stats, gate text, and weak tag summaries. It is optional and has no dependencies.

`plata-catalog.js` is the static trainer registry used by the dashboard. Gold lesson entries can declare `lessonGlobal` and `lessonDataPath`; the dashboard loads those data files on demand to build mastery/remediation recommendations without hardcoding individual lesson globals.

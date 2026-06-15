# Platå Metric Definitions & Collection Spec

Date: 2026-06-13  
Issue: PLA-11 / PLATA-METRICS-001  
Source: `plans/TECHNICAL_TRACK.md`

## Purpose

This document defines what Platå measures per exercise, how metrics are stored and aggregated in the static (no-backend) runtime, and how factory agents read them for coaching decisions. It bridges the exercise spec (`shared/exercise-schema.json`, `shared/plata-exercise-spec.js`) and the existing learner state pipeline (`PlataKernel` → `PlataEvents` → `PlataMemory` → coach surfaces).

## Design principles

1. **Spec declares intent; kernel stores facts.** Each exercise spec's `metrics` block toggles which fields the renderer should attach when recording an attempt.
2. **No raw answer export by default.** Event and memory layers redact `expected` / `given` text in agent-facing exports; agents work from tags, counts, and derived facts.
3. **ES5-compatible collection.** All browser collection code must run in lesson and drill pages without transpilation.
4. **Deterministic replay.** The same trainer state must always produce the same event log and memory facts (`PlataEvents`, `PlataMemory`).

## Metric catalog

| Metric | Field(s) | What it measures | Weak / load signal | Primary storage |
|--------|----------|------------------|--------------------|-----------------|
| `accuracy` | `correct` (boolean) | First-attempt correctness for the item | &lt; 60% rolling accuracy on tag → easier variant | `state.attempts[]`, `byItemId[id].attempts` |
| `responseTimeMs` | `responseTimeMs` (number, optional) | Milliseconds from prompt shown to graded submit | &gt; 8000 ms → pattern not automatic | `state.attempts[]` (when spec enables) |
| `attempts` | per-item `attempts.total`, session counters | Tries before success on an item | &gt; 2 tries before correct → not acquired | `byItemId[id].attempts`, `meta.totalAttempts` |
| `weakTags` | `tags[]` on miss | Diagnostic phenomena to record on failure | Cluster of weak tags → deload / repair | `attempt.tags`, `getWeakTags()` |
| `sessionVolume` | `meta.dailyAttempts`, `meta.totalAttempts` | Exercises completed in a session / day | Accuracy &gt; 80% → planner may increase volume | `state.meta` |
| `spacing` | `lastSeen`, `meta.lastSessionDate`, memory `daysSinceLastSeen` | Days since last attempt on tag/item | Stale signals → `stale_skill` / `next_review_due` facts | `byItemId[id].lastSeen`, `PlataMemory` |

### Interpretation thresholds (coach defaults)

These match `plans/TECHNICAL_TRACK.md` and existing planner/memory behavior:

| Signal | Threshold | Suggested action |
|--------|-----------|------------------|
| Tag accuracy | &lt; 60% | Easier variant or repair scene |
| Response time | &gt; 8000 ms | More isolated drills on phenomenon |
| Attempts before correct | &gt; 2 | Not acquired — repeat with scaffolding |
| Weak tag cluster | ≥ 2 related tags in top weak list | Deload session focus |
| Session accuracy | &gt; 80% | Increase `sessionVolume` / advance plan |
| Days since last seen | ≥ review interval (default 7d) | Schedule spaced review |

## Exercise spec contract

JSON Schema: `shared/exercise-schema.json`  
Runtime validator: `shared/plata-exercise-spec.js`

```json
{
  "metrics": {
    "accuracy": true,
    "responseTimeMs": true,
    "attempts": true,
    "sessionVolume": true,
    "spacing": true
  }
}
```

- `accuracy` is **required** and must be `true`.
- Other flags default to `false` when omitted.
- `language.weakTags` lists tags recorded when the learner misses (or picks a wrong MC option with its own `weakTags`).

### Grading → kernel bridge

`PlataExerciseSpec.checkAnswer(spec, answer)` returns `{ correct, weakTags, matchedLabel }`.  
`PlataExerciseSpec.toKernelAttempt(spec, result, timing)` builds the object passed to `PlataKernel.recordAttempt`:

```javascript
{
  itemId: spec.id,
  correct: boolean,
  tags: weakTagsOrPhenomena,
  mode: spec.type,
  expected: "joined correct answers",
  given: matchedLabel,
  responseTimeMs: number,  // when metrics.responseTimeMs
  attempts: number         // when metrics.attempts (tries in scene)
}
```

## Storage model

### Trainer state (`PlataKernel`)

Key paths in `localStorage` (`plata-state:{trainerId}`):

| Path | Metrics served |
|------|----------------|
| `attempts[]` | Rolling attempt log (max 500): `at`, `itemId`, `correct`, `tags`, `mode`, optional `responseTimeMs` |
| `byItemId[id]` | Per-item SRS box, `lastSeen`, `attempts.{total,correct,wrong}` |
| `meta.totalAttempts`, `meta.totalCorrect` | Lifetime session volume |
| `meta.dailyAttempts[YYYY-MM-DD]` | Per-day volume |
| `meta.lastSessionDate` | Last practice day (spacing) |
| `meta.repairClosures[tag]` | Repair resolution metadata |

Public API: `PlataKernel.recordAttempt`, `getStats`, `getWeakTags`, `computeGate`.

### Event log (`PlataEvents`)

Derived read-only timeline from state. Primary types for metrics:

| Event type | Metrics exposed |
|------------|-----------------|
| `attempt.recorded` | `correct`, `tags`, `diagnosticTags`, `itemId`, `mode`, `at` |
| `repair.closed` / `signal.reopened` | Weak-tag lifecycle |

Privacy: exported events set `privacy.hasExpectedText` / `hasGivenText` flags instead of shipping raw strings to agents.

### Memory facts (`PlataMemory`)

Aggregates events into cited facts agents can trust:

| Fact kind | Metrics used |
|-----------|--------------|
| `weak_signal` | accuracy, weakTags, attempts |
| `stale_skill` | spacing (`daysSinceLastSeen`) |
| `next_review_due` | spacing |
| `stable_strength` | accuracy ≥ 80%, low wrong count |
| `preferred_context` | sessionVolume via plan step completions |

### Evidence ledger (`PlataEvidence`)

UI-facing ranked list of open/closed/reopened signals — same underlying counts as memory, optimized for dashboard rendering.

## Agent-facing query interface

Agents MUST NOT read `localStorage` directly in production flows. Use these deterministic exports:

### 1. Kernel snapshot (per trainer)

```javascript
var handle = PlataKernel.createTrainerState({ trainerId: "bojning-drill" });
var state = handle.state;
var stats = PlataKernel.getStats(state);
var weak = PlataKernel.getWeakTags(state, 10);
var gate = PlataKernel.computeGate(state, { tags: ["v2-inversion"], minAttempts: 5, minAccuracy: 0.6 });
```

`getStats` returns `{ attempts, correct, accuracy, today, lastSessionDate }`.

### 2. Event export

```javascript
var events = PlataEvents.buildEventLog({ state: state, trainer: trainerMeta });
// Filter: events.filter(function (e) { return e.type === "attempt.recorded"; })
```

### 3. Memory compile

```javascript
var facts = PlataMemory.compileFacts({ state: state, trainer: trainerMeta, events: events });
```

### 4. Agent handoff packet (coach-ready)

```javascript
var brief = PlataMemoryBrief.build({ facts: facts, /* ... */ });
var handoff = PlataAgentHandoff.build({ brief: brief, /* ... */ });
```

Handoff includes `focus`, `citations`, `constraints` — no raw learner text.

### 5. Headroom compression (human-readable layer)

```javascript
var copy = PlataHeadroom.compressTrainerStats({ stats: stats, trainer: trainerMeta });
```

Used on home/dashboard; agents can use the structured layers above instead.

### Metric vector (for PLA-12 coach loop)

Normalize agent input as:

```json
{
  "trainerId": "ordstilling-drill",
  "asOf": "2026-06-13T12:00:00.000Z",
  "session": {
    "attempts": 42,
    "correct": 35,
    "accuracyPct": 83,
    "today": 12,
    "lastSessionDate": "2026-06-13"
  },
  "weakTags": [
    { "tag": "v2-inversion", "wrong": 4, "total": 6, "score": 0.67 }
  ],
  "tags": {
    "v2-inversion": {
      "accuracyPct": 33,
      "attempts": 6,
      "daysSinceLastSeen": 2,
      "resolved": false
    }
  }
}
```

Build this from `getStats` + `getWeakTags` + per-tag rollups over `state.attempts`.

## Collection responsibilities by layer

| Layer | Collects | Does not |
|-------|----------|----------|
| Lesson/drill UI | Start timer, count scene tries, call `recordAttempt` | Persist custom metric shapes |
| `PlataExerciseSpec` | Map spec flags → attempt fields | Write storage |
| `PlataKernel` | Persist attempts, aggregates, spacing dates | Interpret pedagogy |
| `PlataEvents` | Derive replay timeline | Mutate state |
| `PlataMemory` | Compile coach facts | Store raw answers in exports |
| Planner / advisor | Read facts, change next step | Redefine metric semantics |

## Verification

```bash
npm run check:kernel      # recordAttempt, weak tags, repair closure
npm run check:events      # attempt.recorded derivation
npm run check:memory      # spacing + weak facts
npm run check:exercise-schema   # spec metrics flags + toKernelAttempt
npm run check:headroom    # plain-language accuracy phrases
```

Full gate: `npm run check`.

## Related files

- `shared/exercise-schema.json` — metric flags in spec
- `shared/plata-exercise-spec.js` — validation + `toKernelAttempt`
- `shared/plata-kernel.js` — authoritative storage
- `shared/plata-events.js` — event derivation
- `shared/plata-memory.js` — spacing and weak-signal facts
- `shared/plata-evidence.js` — dashboard evidence ledger
- `shared/plata-headroom.js` — learner-facing compression
- `plans/TECHNICAL_TRACK.md` — track architecture

## Open follow-ups

- **PLA-12:** Wire metric vector → coach agent → training decision (load, deload, spacing).
- **PLA-13:** Variant generator should inherit `metrics` block from template spec.
- **Response time:** Kernel accepts `responseTimeMs` on attempts but most lesson UIs do not yet populate it; enable per scene when spec sets `metrics.responseTimeMs: true`.

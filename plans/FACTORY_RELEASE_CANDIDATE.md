# Platå Factory Week 4 — Release Candidate

Date: 2026-06-18  
Plan: `plans/PRODUCT_TRACK.md` (Week 4, Days 22–30)  
Status: **green** — `npm run check` passes; Pages artifact and offline ZIP rebuild from source.

---

## What changed for learners and reviewers

### Doctor lesson + skrive bridge (Week 4)

- **New gold lesson** — `lessons/lesson-a2-doctor/` (symptom severity, duration, polite clarifications at apotek/læge).
- **Doctor → skrive bridge** — apotek near-miss routes to `skrive-drill/?cat=sundhed` with scene repair deep links; exercise value chain `doctor-apotek-skrive-sundhed` proves channel transfer and repair ladder.
- **Guided session** — two doctor scenarios (`doctor-gold-repair`, `doctor-skrive-repair`) join the report; **12 scenarios** total in `reports/guided-session.json`.

### Distribution proof + reviewer route (Week 4)

- **Offline ZIP** — `.dist/plata-offline-bundle.zip` packages the Pages artifact (~**110 files**, v0.4.0) for backend-free review; `check:distribution` verifies manifest SHA-256 and required entries (`index.html`, `sw.js`, `precache-manifest.json`, core reports).
- **Proof page** — `#proof-distribution` section documents the bundle; reviewer route strip on `#proof-walkthrough` links **Demo → Today → Guided → Offline ZIP → Quality → Capability map**.
- **Evaluator journey** — new `distribution-proof` stage checks `proof.html#proof-distribution-title` and the publish gate.

### Dashboard export drawer (Week 4)

- **Profile portability drawer** — dashboard import/export diagnostics with trace-backed verification; `check:profile-portability` guards export/import/replay contract.

### Exercise value chain (Week 4)

- **Flagship chains** — doctor transfer, register drill, and existing B2 chains traced in `reports/exercise-value.json`; `check:exercise-value-report` enforces archetype coverage.

### Public proof (prior weeks, still in RC)

- **Proof page** — hero CTA «Follow reviewer path» scrolls to `#proof-walkthrough`; headroom bar shows compressed proof snapshot.
- **Program page** — «Reviewer walkthrough» links to `proof.html#proof-walkthrough`.
- **Register drill** — `register-drill/` (12 MC items: passive agency, deadline, escalation).

---

## Proof commands (run from repo root)

### Fast contributor path

```bash
npm run proof:quickstart
npm run check:quickstart-proof
```

Artifacts land in `.dist/quickstart-proof/` (demo learner, capability map, project health, golden review JSON, capped Markdown summary).

### Contributor preflight (Day 4 — before full `npm run check`)

Run focused gates while iterating on lessons, portability, or distribution:

```bash
npm run check:lessons
npm run check:gold-lessons
npm run check:profile-portability
npm run check:distribution
npm run check:proof-page
npm run check:evaluator-journey
```

Full gate still required before merge:

```bash
npm run check
```

### Pages deploy artifact

```bash
npm run build:pages
npm run check:pages
npm run build:distribution
npm run check:distribution
```

Output: `.dist/pages/` (~110 files, precache manifest, generated reports under `reports/`) plus `.dist/plata-offline-bundle.zip`.

### Surface-specific checks (Factory week)

```bash
npm run check:proof-page
npm run check:program-page
npm run check:headroom
npm run check:planner
npm run check:catalog
npm run check:public-runtime
npm run check:evaluator-path
npm run check:evaluator-journey
npm run check:exercise-value-report
```

### Review diffs (compare saved baseline JSON to current build)

Use when you have a prior report snapshot on disk; `--head current` rebuilds live:

```bash
npm run diff:quality -- --base <path/to/quality.json> --head current --json
npm run diff:demo-learner -- --base <path/to/demo-learner.json> --head current --json
npm run diff:today-program -- --base <path/to/today-program.json> --head current --json
npm run diff:guided-session -- --base <path/to/guided-session.json> --head current --json
npm run diff:personalization-trajectory -- --base <path/to/trajectory.json> --head current --json
npm run diff:dashboard-snapshot -- --base scripts/fixtures/dashboard-recommendations.snapshot.json --head current --json
npm run diff:review -- --quality-diff … --dashboard-diff …   # aggregate PR review
```

Golden synthetic fixtures for the review renderer live under `scripts/fixtures/review-report-golden/` (unchanged; proves Markdown caps and fail modes).

---

## Reviewer route (60 seconds)

1. Home → **Evaluate in 60 seconds** (`#evaluate`)
2. `dashboard.html?demo=learner` — read-only rich profile
3. `proof.html#proof-walkthrough` — reviewer strip: Demo → Today → Guided → Offline ZIP → Quality → Capability map
4. `proof.html#proof-distribution-title` — offline ZIP bundle proof
5. `proof.html#proof-guided-title` — guided session proof (12 scenarios)
6. `quality.html` — gold lesson contracts
7. `program.html` — capability map / learning program

---

## Follow-up (out of scope for this RC)

From `plans/EXERCISE_BACKLOG.md`:

1. B2 workplace disagreement (multi-channel register)
3. Word-order pack — narrative exists; drill wired
4. B1 noun/verb trap pack
5. B2 email endings pack
6. Vocabulary recurrence from scene tags

No backend, auth, analytics, or framework rewrite in this week.

---

## Week 4 definition of done

| Criterion | Status |
| --- | --- |
| `npm run check` passes | ✅ |
| Doctor lesson + skrive bridge in exercise value | ✅ |
| Guided session report: 12 scenarios | ✅ |
| Offline ZIP ~110 files + `check:distribution` | ✅ |
| Reviewer route includes distribution proof | ✅ |
| Profile portability drawer + `check:profile-portability` | ✅ |
| Contributor preflight documented in README | ✅ |
| Release note names changes + proof commands | ✅ (this file) |
| Unfinished backlog documented | ✅ (`EXERCISE_BACKLOG.md`) |

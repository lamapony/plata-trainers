# Platå Factory Week — Release Candidate

Date: 2026-06-13  
Plan: `plans/FACTORY_NEXT.md` (Days 5–7)  
Status: **green** — `npm run check` passes; Pages artifact rebuilds from source.

---

## What changed for learners and reviewers

### Public proof (Day 5)

- **Proof page** (`proof.html`) — hero CTA «Follow reviewer path» scrolls to `#proof-walkthrough`; headroom bar shows compressed proof snapshot; reviewer route strip links Demo → Today → Guided → Quality → Capability map.
- **Program page** — «Reviewer walkthrough» links to `proof.html#proof-walkthrough`.
- **Shared** — `compressProofSnapshot()` exported from `shared/plata-headroom.js`.

### Exercise backlog + register drill (Day 6)

- **New drill** — `register-drill/` (12 MC items: passive agency, deadline, escalation).
- **Catalog** — `register` trainer with repair signals for passive-agency and register-tone families; planner routes weak passive-agency to register drill.
- **Backlog** — `plans/EXERCISE_BACKLOG.md` ranks six concrete learner situations; item #2 shipped.

### Learner-first polish (Days 3–5 regressions fixed)

- Demo learner report gates use full stripped Today HTML (not a 420-char slice); rendered Today preview widened to 900 chars.
- Evaluator journey accepts `Walkthrough|Guided session` companion mode labels.

### Infra touched for release

- Home and dashboard smokes expect **4 drills** and **8 trainers** (register drill added).
- `scaffold-gold-lesson.js` inserts into catalog before `drillForSignal` helpers.
- Dashboard recommendations fixture refreshed: `scripts/fixtures/dashboard-recommendations.snapshot.json`.

---

## Proof commands (run from repo root)

### Fast contributor path

```bash
npm run proof:quickstart
npm run check:quickstart-proof
```

Artifacts land in `.dist/quickstart-proof/` (demo learner, capability map, project health, golden review JSON, capped Markdown summary).

### Full gate

```bash
npm run check
```

### Pages deploy artifact

```bash
npm run build:pages
npm run check:pages
```

Output: `.dist/pages/` (97 files, precache manifest, generated reports under `reports/`).

### Surface-specific checks (Factory week)

```bash
npm run check:proof-page
npm run check:program-page
npm run check:headroom
npm run check:planner
npm run check:catalog
npm run check:public-runtime
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
3. `proof.html#proof-walkthrough` — reviewer path + headroom
4. `proof.html#proof-guided-title` — guided session proof
5. `program.html` — capability map / learning program
6. `quality.html` — gold lesson contracts

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

## Day 7 definition of done

| Criterion | Status |
| --- | --- |
| `npm run check` passes | ✅ |
| `npm run proof:quickstart` + `check:quickstart-proof` | ✅ |
| `npm run build:pages` + `check:pages` | ✅ |
| Public artifacts rebuild from source | ✅ |
| Release note names changes + proof commands | ✅ (this file) |
| Unfinished backlog documented | ✅ (`EXERCISE_BACKLOG.md`) |

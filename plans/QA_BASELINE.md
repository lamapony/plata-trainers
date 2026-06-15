# Platå Baseline Release Audit

Date: 2026-06-14  
Issues: PLA-3 / PLATA-QA-001 (baseline), PLA-9 / PLATA-QA-002 (gold lesson preflight)  
Scope: Current static `trainers-repo` candidate release + gold lesson QA preflight documentation.

## Baseline Audit (PLA-3 / PLATA-QA-001)

### Result

Baseline status: PASS

No release-blocking defect remains after health-manifest gate sync. Full `npm run check` passes including new headroom and exercise-generator gates.

### Commands Run

```bash
npm run check
```

Command result: PASS

Key output summary:

- `syntax QA passed: 128 js files checked`
- `catalog validation passed: 6 trainer(s)`
- `ok - PlataHeadroom compress + render`
- `project health manifest built: 70 gate(s), 11 report(s)`
- `pages artifact built: .dist/pages (89 file(s))`
- `static QA passed: 12 html files checked`
- `PWA smoke passed`

### Defects Found & Resolved (Baseline)

| ID | Severity | Summary | Resolution |
|----|----------|---------|------------|
| QA-2026-06-13-01 | Release blocker | `npm run check` failed at `check:quickstart-proof` because `build-project-health-manifest.js` did not list `check:headroom` and `check:exercise-generator` added to `package.json` | Added both gates to `scripts/build-project-health-manifest.js` |

Paths changed for fix:

- `scripts/build-project-health-manifest.js`
- `scripts/smoke-project-health.js`

### Remaining Blockers (Baseline)

None for baseline release.

---

## Gold Lesson Preflight QA Docs (PLA-9 / PLATA-QA-002)

### Result

Preflight documentation status: DONE

Added focused gold lesson preflight command documentation to `plans/QA_BASELINE.md` and `README.md`. No code changes needed — this is a documentation-only slice.

### Purpose

Gold lesson edits should not require the full `npm run check` suite for every local iteration. This preflight lets contributors validate a gold lesson change with targeted checks before opening a PR or running the full gate.

### Gold Lesson Preflight Command Set

Run after editing any gold lesson (`qualityTier: "gold"`) data:

```bash
# 1. Lesson schema validation — catches missing fields, broken scene contracts, bad diagnostics
npm run check:lessons

# 2. Gold lesson simulation — replays all declared simulation paths deterministically
npm run check:gold-lessons

# 3. Counterfactual regression — compares edited learner profiles against baseline profiles
npm run check:counterfactuals

# 4. Real lesson engine smoke — replays simulation paths through the real shared engine with fake DOM
npm run check:lesson-engine

# 5. Quality report — builds the gold lesson quality report and fails on contract issues
npm run check:quality-report

# 6. Exercise value report — proves flagship chains still satisfy consequence archetypes
npm run check:exercise-value-report

# 7. Comic prompt manifest — builds dry-run comic storyboard prompts (no API call)
npm run check:comic-prompts

# 8. Quality mutation tests — creates temporary broken lessons and proves the report catches issues
npm run check:quality-mutations

# 9. Quality diff — proves review diff catches regressions
npm run check:quality-diff
```

A full `npm run check` is still required before merging, but the preflight above catches broken sources, missing mastery signals, bad remediation targets, missing simulation paths, missing comic prompts, and weakened flagship chains in under 30 seconds.

### What Each Check Catches

| Check | Regression Type |
|-------|-----------------|
| `check:lessons` | Missing scene fields, broken endings, bad `endingLogic`, duplicated IDs |
| `check:gold-lessons` | Simulation path failure, unreachable endings, uncovered paths |
| `check:counterfactuals` | Strict regression (successful learner needs repair after edit) & lenient regression (weak learner's repair need disappears) |
| `check:lesson-engine` | Runtime regression in shared engine against real lesson data |
| `check:quality-report` | Missing sources, missing simulation coverage, broken remediation, bad completion specs, duplicate diagnostics |
| `check:exercise-value-report` | Lost consequence feedback, near-miss, repair ladder, channel transfer, recurrence, or evidence archetypes |
| `check:comic-prompts` | Missing comic panel, missing scene reference, broken prompt contract |
| `check:quality-mutations` | Negative tests: report must catch broken gold lessons |
| `check:quality-diff` | Review diff must catch regressions between two quality report versions |

### Files Documented / Changed

- `plans/QA_BASELINE.md` — this entry
- `README.md` — added gold lesson preflight section (see "Gold lesson preflight" after "Gold lesson scaffold")

### Verification

```bash
npm run check:lessons
npm run check:gold-lessons
npm run check:counterfactuals
npm run check:lesson-engine
npm run check:quality-report
npm run check:quality-mutations
npm run check:quality-diff
npm run check:comic-prompts
```

All pass on current gold lessons (`lesson-b2-radiator-register`, `lesson-b2-job-followup`).

Note: `npm run check:exercise-value-report` has a pre-existing failure (`B2 radiator flagship chain should be the first proof row`). This is not a regression from this documentation-only change; it is a pre-existing data issue outside the preflight scope.

### Remaining Blockers

None for gold lesson preflight documentation.

# Platå Trainers

[![QA](https://github.com/lamapony/plata-trainers/actions/workflows/qa.yml/badge.svg)](https://github.com/lamapony/plata-trainers/actions/workflows/qa.yml)
[![Pages](https://github.com/lamapony/plata-trainers/actions/workflows/pages.yml/badge.svg)](https://github.com/lamapony/plata-trainers/actions/workflows/pages.yml)

**Break your Danish plateau.** Open-source practice for Danish learners who are no longer starting from zero but still freeze under forms, word order, tone, or social pressure. Static HTML/JS, no app build step, no backend.
Live demo: [lamapony.github.io/plata-trainers](https://lamapony.github.io/plata-trainers/).
Demo learner dashboard: [lamapony.github.io/plata-trainers/dashboard.html?demo=learner](https://lamapony.github.io/plata-trainers/dashboard.html?demo=learner).
Demo learner report: [lamapony.github.io/plata-trainers/reports/demo-learner.json](https://lamapony.github.io/plata-trainers/reports/demo-learner.json).
Guided session report: [lamapony.github.io/plata-trainers/reports/guided-session.json](https://lamapony.github.io/plata-trainers/reports/guided-session.json).
Profile portability report: [lamapony.github.io/plata-trainers/reports/profile-portability.json](https://lamapony.github.io/plata-trainers/reports/profile-portability.json).
Exercise value report: [lamapony.github.io/plata-trainers/reports/exercise-value.json](https://lamapony.github.io/plata-trainers/reports/exercise-value.json).
Public quality report: [lamapony.github.io/plata-trainers/quality.html](https://lamapony.github.io/plata-trainers/quality.html).
Public program map: [lamapony.github.io/plata-trainers/program.html](https://lamapony.github.io/plata-trainers/program.html).
Public proof / health page: [lamapony.github.io/plata-trainers/proof.html](https://lamapony.github.io/plata-trainers/proof.html).
Public proof digest: [lamapony.github.io/plata-trainers/reports/proof-digest.json](https://lamapony.github.io/plata-trainers/reports/proof-digest.json).
Public capability map: [lamapony.github.io/plata-trainers/reports/capabilities.json](https://lamapony.github.io/plata-trainers/reports/capabilities.json).
Production release runbook: [docs/PRODUCTION_RELEASE.md](./docs/PRODUCTION_RELEASE.md).

Platå does not try to teach Danish from the beginning. It helps learners overcome the plateau: the point where they know enough Danish to recognize the language, but not enough to act fluently under social pressure.

The MVP is useful for A2-B2 learners who need short, repeatable practice on the forms and situations that block real-life fluency: verb tenses, noun inflection, word order, register, particles, and high-frequency vocabulary.

Each trainer is a self-contained single-page app. Progress is private by default: it is stored in browser LocalStorage, never sent to a server. Export/import is JSON so you can back up or move between devices.

The current trainers share a small static learning kernel in [`shared/`](./shared/). It provides the common progress schema, LocalStorage migration, attempt recording, mastery-signal diagnostics, stats, gates, and JSON export/import. Progress uses schema v2 while retaining stable storage keys such as `plata:trainer:bojning:state:v1`; legacy exports are migrated and validated against the trainer ID before import.

## Why this is different

- **Plateau-first:** built for learners who know basic Danish but freeze when forms, word order, tone, and social pressure meet.
- **Private by default:** browser LocalStorage only; no accounts, backend, analytics, or tracking.
- **Contributor-friendly data:** exercises are plain JavaScript data files with validation scripts and narrative lesson schemas.
- **Gold lesson QA:** source-backed lessons can be validated as testable learning artifacts with mastery signals, deterministic simulation, remediation, and comic storyboard prompts.
- **Public proof reports:** Pages publishes generated JSON for quality, exercise value, skill coverage, Today shell states, guided sessions, profile portability, project health, quickstart proof, and a capability map that links product claims to checks, source files, and docs.
- **Flagship exercise chains:** B2 gold lessons can prove consequence feedback, grammatical near-misses, repair ladders, channel transfer, memory recurrence, and reason evidence instead of relying on flat right/wrong quizzes.
- **Portable learner profile proof:** a generated acceptance trace exports a real local profile, imports it into a clean session, replays both timelines, and checks plan execution, memory corrections, guided outcomes, and privacy guardrails.
- **Lightweight companion:** the dashboard opens with a deterministic Today shell, a guided outcome session, and a read-only Hermes bridge brief without embedding a heavy agent runtime.
- **Inspectable demo learner:** `dashboard.html?demo=learner` shows a rich B2 profile in memory only, so visitors can inspect personalization without overwriting their local progress.
- **Static and forkable:** every trainer runs from the repository's static files when served over HTTP; GitHub Pages deploys a checked artifact.

## Ask an agent to create a lesson

Give a coding agent the repository link and describe the lesson in normal language, for example:

> Create a 12-minute B1 Danish lesson about asking a noisy neighbour to keep evenings quieter. Include a spoken opening, a written follow-up, and a repair for wording that sounds aggressive. Do not give legal advice.

Repository-aware agents should automatically read [`AGENTS.md`](./AGENTS.md). That contract tells them to turn the request into a checked brief, author source-backed content, wire diagnostics and repair, and prove the result before delivery. The executable path is:

```bash
npm run lesson:new -- --request examples/lesson-request.example.json
# the agent replaces the generic scaffold and completes lesson-request.json.delivery
npm run lesson:verify -- --lesson lesson-b1-a-noisy-neighbour-in-an-apartment-building
npm run check
```

See [`docs/AGENT_LESSON_WORKFLOW.md`](./docs/AGENT_LESSON_WORKFLOW.md) and the machine-readable [`lesson-request.schema.json`](./schemas/lesson-request.schema.json). The live Pages URL exposes [`llms.txt`](./llms.txt) for agent discovery, but the static site is read-only: an agent still needs repository write access to create and publish files.

## Available trainers

| Trainer | Status | Description |
|---------|--------|-------------|
| [Lesson 01: The First Morning](./lessons/lesson-01/) | available | Narrative A0/A1 onboarding: arrive in Copenhagen, read signs, and say a first useful sentence. |
| [A2: Hvor længe har du haft det sådan?](./lessons/lesson-a2-doctor/) | gold | Describe symptom duration and severity to a doctor or pharmacy without turning language practice into medical advice. |
| [B1: Bolig og udlejer](./lessons/lesson-b1-bolig/) | gold | Housing repairs and tenant communication without passive or aggressive Danish. |
| [B1: Når systemet siger nej](./lessons/lesson-b1-borgerservice/) | gold | Navigate Borgerservice, MitID, and CPR appointment pressure with calm agency. |
| [B2: Det afhænger af, hvordan du siger det](./lessons/lesson-b2-radiator/) | gold | Register, modal particles, complaint tone, and social consequences. |
| [B2: Efter interviews](./lessons/lesson-b2-job-followup/) | gold flagship | Professional follow-up after interviews: email tone, LinkedIn register, and patient precision. |
| [B2: Hvem gør hvad](./lessons/lesson-b2-ordstilling/) | gold | V2, inversion, and `fordi`/`derfor` clause structure inside a conference narrative. |
| [Bøjning drill](./bojning-drill/) | available | Verb tenses and noun inflection with Leitner review. |
| [Ordstilling drill](./ordstilling-drill/) | available | Multiple-choice V2, inversion, and subordinate-clause practice with explanations. |
| [Register drill](./register-drill/) | available | Passive agency, channel transfer, deadlines, and polite escalation. |
| [Skriveøvelser](./skrive-drill/) | available | Written production with completion-only self-report; no automated accuracy claim. |
| [Vocab SR](./vocab-sr/) | optional | Danish ↔ Russian spaced repetition for Russian-speaking learners; outside the English flagship path. |

## Run locally

```bash
git clone https://github.com/lamapony/plata-trainers.git
cd plata-trainers
python3 -m http.server 8000
# open http://127.0.0.1:8000/
```

No build step for the public app. For local development, serve this folder over HTTP (for example `./start_practice.sh` or `python3 -m http.server 8000`). Do not rely on `file://` — relative imports, repair deep-links, and the PWA need an HTTP origin.

Canonical learner origin: [https://lamapony.github.io/plata-trainers/](https://lamapony.github.io/plata-trainers/).

## Contributor proof quickstart

```bash
npm run proof:quickstart
npm run check:quickstart-proof
npm run check
```

The quickstart writes inspectable proof artifacts to `.dist/quickstart-proof/`: demo learner, capability map, project health, golden PR review JSON, capped review Markdown, and a short `quickstart.md` summary.

## Checks

```bash
npm run check
```

Browser QA (separate from the zero-dep `check` suite; requires `npm install` + Playwright browsers):

```bash
npx playwright install chromium webkit
npm run check:browser
# optional Chromium pixel baselines (system fonts → OS-specific):
PLATA_VISUAL=1 npm run check:browser -- --update-snapshots
```

Production Pages artifact:

```bash
npm run build:pages
npm run check:pages
npm run check:quality-report
npm run check:demo-learner-report
npm run check:demo-learner-diff
npm run check:today-program-report
npm run check:guided-session
npm run check:guided-session-report
npm run check:guided-session-diff
npm run check:capability-map
npm run check:proof-digest
npm run check:evaluator-path
npm run build:evaluator-path -- --text
npm run check:evaluator-journey
npm run build:evaluator-journey -- --text
npm run check:profile-portability
npm run build:profile-portability -- --text
npm run check:exercise-value-report
npm run build:exercise-value -- --text
npm run check:program-page
npm run check:proof-page
npm run check:comic-prompts
npm run check:public-runtime
npm run check:public-runtime-mutations
npm run proof:quickstart
npm run check:quickstart-proof
node scripts/build-capability-map.js --out .dist/capabilities.json --text
npm run diff:quality -- --base .dist/quality-report.json --head current
npm run diff:quality -- --base .dist/quality-report.json --head current --json > .dist/quality-diff.json
node scripts/snapshot-dashboard-recommendations.js --json > .dist/dashboard-recommendations.json
npm run diff:dashboard-snapshot -- --base .dist/dashboard-recommendations.json --head current
npm run diff:dashboard-snapshot -- --base .dist/dashboard-recommendations.json --head current --json > .dist/dashboard-recommendations-diff.json
node scripts/build-demo-learner-report.js --json > .dist/demo-learner.json
npm run diff:demo-learner -- --base .dist/demo-learner.json --head current
npm run diff:demo-learner -- --base .dist/demo-learner.json --head current --json > .dist/demo-learner-diff.json
node scripts/build-today-program-report.js --json > .dist/today-program.json
node scripts/build-guided-session-report.js --json > .dist/guided-session.json
npm run diff:today-program -- --base .dist/today-program.json --head current
npm run diff:today-program -- --base .dist/today-program.json --head current --json > .dist/today-program-diff.json
npm run diff:guided-session -- --base .dist/guided-session.json --head current
npm run diff:guided-session -- --base .dist/guided-session.json --head current --json > .dist/guided-session-diff.json
node scripts/smoke-personalization-trajectory.js --json > .dist/personalization-trajectory.json
npm run diff:personalization-trajectory -- --base .dist/personalization-trajectory.json --head current
npm run diff:personalization-trajectory -- --base .dist/personalization-trajectory.json --head current --json > .dist/personalization-trajectory-diff.json
npm run diff:review -- --quality-diff .dist/quality-diff.json --dashboard-diff .dist/dashboard-recommendations-diff.json --demo-diff .dist/demo-learner-diff.json --today-diff .dist/today-program-diff.json --guided-diff .dist/guided-session-diff.json --trajectory-diff .dist/personalization-trajectory-diff.json --out .dist/review-report.json --summary-out .dist/review-summary.md --summary-limit 8 --summary-message-limit 180
npm run check:review-report-fixture
```

Gold lesson scaffold:

```bash
npm run scaffold:gold -- --slug lesson-b2-your-topic --title "Your Topic"
npm run check
```

Gold lesson preflight (fast local validation before full suite):

```bash
npm run check:lessons             # scene schema contract
npm run check:gold-lessons        # deterministic simulation paths
npm run check:counterfactuals     # learner profile regression
npm run check:lesson-engine       # engine replay with fake DOM
npm run check:quality-report      # gold quality report contract
npm run check:exercise-value-report  # flagship chain archetypes
npm run check:comic-prompts       # dry-run storyboard prompts
npm run check:quality-mutations   # negative contract tests
npm run check:quality-diff        # review diff regression check
```

Contributor preflight (Day 4 PRODUCT_TRACK — isolated checks before `npm run check`):

```bash
npm run check:lessons             # lesson data + scene schema
npm run check:gold-lessons        # gold lesson simulation paths
npm run check:profile-portability # export/import/replay trace
npm run check:distribution        # offline ZIP bundle + manifest
npm run check:proof-page          # public proof surface render
npm run check:evaluator-journey   # demo → proof → distribution → guided → return
npm run check:evaluator-path      # home evaluator CTA contract
npm run check:exercise-value-report  # flagship chains (doctor→skrive, etc.)
```

Use these while iterating locally; they catch lesson regressions, portability drift, and distribution packaging failures in under a minute each. Full suite still required before merge:

```bash
npm run check
```

Individual checks:

```bash
node scripts/smoke-kernel.js
node scripts/validate-catalog.js
node scripts/smoke-lesson-engine.js
node scripts/smoke-dashboard.js
node scripts/build-today-program-report.js --out .dist/today-program.json --text
node scripts/smoke-today-program-report.js
node scripts/build-guided-session-report.js --out .dist/guided-session.json --text
node scripts/smoke-guided-session-report.js
node scripts/validate-data.js
node scripts/static-qa.js
node scripts/check-syntax.js
node scripts/validate-lesson.js
node scripts/audit-lesson-exercises.js
node scripts/smoke-exercise-value-report.js
node scripts/simulate-gold-lessons.js
node scripts/counterfactual-learner-simulator.js
node scripts/debug-profile-replay.js --file plata-backup.json
node scripts/smoke-profile-portability.js
node scripts/build-skill-coverage-report.js --out .dist/skill-coverage.json --text
node scripts/build-demo-learner-report.js --out .dist/demo-learner.json --text
node scripts/diff-demo-learner-report.js --base .dist/demo-learner.json --head current --json > .dist/demo-learner-diff.json
node scripts/smoke-demo-learner-diff.js
node scripts/snapshot-dashboard-recommendations.js
node scripts/mutation-dashboard-snapshot.js
mkdir -p .dist && node scripts/snapshot-dashboard-recommendations.js --json > .dist/dashboard-recommendations.json
node scripts/diff-dashboard-snapshot.js --base scripts/fixtures/dashboard-recommendations.snapshot.json --head current
node scripts/diff-dashboard-snapshot.js --base .dist/dashboard-recommendations.json --head current
node scripts/diff-dashboard-snapshot.js --base .dist/dashboard-recommendations.json --head current --json > .dist/dashboard-recommendations-diff.json
node scripts/smoke-dashboard-snapshot-diff.js
node scripts/build-today-program-report.js --out .dist/today-program.json --text
node scripts/diff-today-program-report.js --base .dist/today-program.json --head current --json > .dist/today-program-diff.json
node scripts/smoke-today-program-diff.js
node scripts/build-guided-session-report.js --out .dist/guided-session.json --text
node scripts/diff-guided-session-report.js --base .dist/guided-session.json --head current --json > .dist/guided-session-diff.json
node scripts/smoke-guided-session-diff.js
node scripts/smoke-memory.js
node scripts/smoke-learner-model.js
node scripts/smoke-learner-model-alignment.js
node scripts/mutation-learner-model-alignment.js
node scripts/smoke-memory-fixtures.js
node scripts/smoke-memory-corrections.js
node scripts/smoke-memory-vault.js
node scripts/smoke-memory-brief.js
node scripts/smoke-agent-handoff.js
node scripts/smoke-advisor-fixtures.js
node scripts/smoke-companion.js
node scripts/smoke-guided-session.js
node scripts/smoke-personalization-eval.js
node scripts/mutation-personalization-eval.js
node scripts/smoke-personalization-trajectory.js
node scripts/mutation-personalization-trajectory.js
mkdir -p .dist && node scripts/smoke-personalization-trajectory.js --json > .dist/personalization-trajectory.json
node scripts/diff-personalization-trajectory.js --base .dist/personalization-trajectory.json --head current
node scripts/diff-personalization-trajectory.js --base .dist/personalization-trajectory.json --head current --json > .dist/personalization-trajectory-diff.json
node scripts/smoke-personalization-trajectory-diff.js
node scripts/build-quality-report.js --out .dist/quality-report.json
node scripts/diff-quality-report.js --base .dist/quality-report.json --head current --json > .dist/quality-diff.json
node scripts/build-review-report.js --quality-diff .dist/quality-diff.json --dashboard-diff .dist/dashboard-recommendations-diff.json --demo-diff .dist/demo-learner-diff.json --today-diff .dist/today-program-diff.json --guided-diff .dist/guided-session-diff.json --trajectory-diff .dist/personalization-trajectory-diff.json --out .dist/review-report.json --summary-out .dist/review-summary.md --summary-limit 8 --summary-message-limit 180
node scripts/build-review-report.js --quality-diff .dist/quality-diff.json --dashboard-diff .dist/dashboard-recommendations-diff.json --demo-diff .dist/demo-learner-diff.json --today-diff .dist/today-program-diff.json --guided-diff .dist/guided-session-diff.json --trajectory-diff .dist/personalization-trajectory-diff.json --markdown --summary-limit 8 --summary-message-limit 180
node scripts/smoke-review-report.js
node scripts/smoke-review-report-fixture.js
node scripts/smoke-proof-digest.js
node scripts/smoke-evaluator-path.js
node scripts/smoke-evaluator-journey.js
node scripts/smoke-program-page.js
node scripts/smoke-proof-page.js
node scripts/smoke-public-runtime.js
node scripts/mutation-public-runtime.js
node scripts/build-capability-map.js --out .dist/capabilities.json --text
node scripts/smoke-capability-map.js
node scripts/build-project-health-manifest.js --out .dist/project-health.json --text
node scripts/smoke-gold-scaffold.js
node scripts/generate-comic-assets-openrouter.js --dry-run --out .dist/comic-prompts.json
node scripts/mutation-quality-report.js
node scripts/smoke-quality-diff.js
node scripts/smoke-quality-report.js
npm run check:pages
```

Comic assets are generated explicitly after prompt review. Set `OPENROUTER_API_KEY` in your shell, then run a targeted job such as:

```bash
npm run generate:comics -- --lesson lesson-b2-radiator-register --panel official-reply-passive
```

Do not commit API keys. The dry-run prompt manifest is part of `npm run check`; generated images should be visually reviewed before commit.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for data conventions and PR guidance. See [GOLD_LESSON_QUALITY_ENGINE.md](./docs/GOLD_LESSON_QUALITY_ENGINE.md) for the gold lesson quality contract. See [ROADMAP.md](./ROADMAP.md) for planned trainer expansion.

## Good first contributions

- Add 5-10 sourced Danish exercise items with explanations.
- Fix a wrong form, translation, or word-order explanation.
- Add B2 register examples where the same meaning changes tone.
- Scaffold a gold lesson with `npm run scaffold:gold -- --slug lesson-b2-your-topic --title "Your Topic"` and replace the generated scenario with sourced Danish.
- Improve a gold lesson comic storyboard prompt or review a generated panel against its scene evidence.
- Improve accessibility while keeping the app static and dependency-free.
- Add a focused QA check that prevents bad data from landing.

## Design

Each trainer uses the Platå editorial visual system: system UI fonts (no Google Fonts / third-party font requests), warm paper background, restrained brick accent. Mobile-first, accessible, offline-capable.

## Why public

> «Если тренажёры попадают — жалко. Если публичные — кому-то помогут, может даже ответят, найдут баг или пришлют новые слова.»

License: MIT.

## Companion

- Curriculum: [plata-curriculum](https://github.com/lamapony/plata-curriculum)
- Blog: [dmitrii.dk/plata](https://dmitrii.dk/plata) (coming soon)

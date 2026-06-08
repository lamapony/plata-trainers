# Platå Trainers

[![QA](https://github.com/lamapony/plata-trainers/actions/workflows/qa.yml/badge.svg)](https://github.com/lamapony/plata-trainers/actions/workflows/qa.yml)
[![Pages](https://github.com/lamapony/plata-trainers/actions/workflows/pages.yml/badge.svg)](https://github.com/lamapony/plata-trainers/actions/workflows/pages.yml)

Open-source Danish plateau-breaker for Danish learners who are no longer starting from zero but still feel stuck. Static HTML/JS, no app build step, no backend.
Live demo: [lamapony.github.io/plata-trainers](https://lamapony.github.io/plata-trainers/).
Demo learner dashboard: [lamapony.github.io/plata-trainers/dashboard.html?demo=learner](https://lamapony.github.io/plata-trainers/dashboard.html?demo=learner).
Demo learner report: [lamapony.github.io/plata-trainers/reports/demo-learner.json](https://lamapony.github.io/plata-trainers/reports/demo-learner.json).
Public quality report: [lamapony.github.io/plata-trainers/quality.html](https://lamapony.github.io/plata-trainers/quality.html).
Public program map: [lamapony.github.io/plata-trainers/program.html](https://lamapony.github.io/plata-trainers/program.html).
Public capability map: [lamapony.github.io/plata-trainers/reports/capabilities.json](https://lamapony.github.io/plata-trainers/reports/capabilities.json).

Platå does not try to teach Danish from the beginning. It helps learners overcome the plateau: the point where they know enough Danish to recognize the language, but not enough to act fluently under social pressure.

The MVP is useful for A2-B2 learners who need short, repeatable practice on the forms and situations that block real-life fluency: verb tenses, noun inflection, word order, register, particles, and high-frequency vocabulary.

Each trainer is a self-contained single-page app. Progress is private by default: it is stored in browser LocalStorage, never sent to a server. Export/import is JSON so you can back up or move between devices.

The current trainers share a small static learning kernel in [`shared/`](./shared/). It provides the common progress schema, LocalStorage migration, attempt recording, mastery-signal diagnostics, stats, gates, and JSON export/import. Old v0 trainer progress is migrated into stable v1 keys such as `plata:trainer:bojning:state:v1`; exported v1 JSON is validated against the trainer ID before import.

## Why this is different

- **Plateau-first:** built for learners who know basic Danish but freeze when forms, word order, tone, and social pressure meet.
- **Private by default:** browser LocalStorage only; no accounts, backend, analytics, or tracking.
- **Contributor-friendly data:** exercises are plain JavaScript data files with validation scripts and narrative lesson schemas.
- **Gold lesson QA:** source-backed lessons can be validated as testable learning artifacts with mastery signals, deterministic simulation, remediation, and comic storyboard prompts.
- **Public proof reports:** Pages publishes generated JSON for quality, skill coverage, Today shell states, project health, and a capability map that links product claims to checks, source files, and docs.
- **Lightweight companion:** the dashboard opens with a deterministic, stateful Today shell and exports a read-only Hermes bridge brief without embedding a heavy agent runtime.
- **Inspectable demo learner:** `dashboard.html?demo=learner` shows a rich B2 profile in memory only, so visitors can inspect personalization without overwriting their local progress.
- **Static and forkable:** every trainer can run from `index.html`; GitHub Pages deploys a checked static artifact.

## Available trainers

| Trainer | Status | Description |
|---------|--------|-------------|
| [Lesson 01: The First Morning](./lessons/lesson-01/) | v0.1 | Narrative A0/A1 onboarding: arrive in Copenhagen, meet Lene, read signs, use `tak`, and say `Jeg hedder ...`. |
| [B2: Det afhænger af, hvordan du siger det](./lessons/lesson-b2-radiator/) | v1.0 | B2 narrative: register, modal particles, complaint tone, and social consequences. Your wording changes the outcome. |
| [B2: Efter interviews](./lessons/lesson-b2-job-followup/) | v1.0 gold | Professional follow-up after interviews: email tone, LinkedIn register, and patient precision. |
| [bøjning-drill](./bojning-drill/) | v0.2 | Verb tenses (nutid/datid/førnutid) + noun bøjning (bestemt/ubestemt, ental/flertal). Type the answer. |
| [ordstilling-drill](./ordstilling-drill/) | v0.1 | V2 rule, inversion, ledsætninger. Multiple choice with explanations. |
| [vocab-sr](./vocab-sr/) | v0.1 | Spaced-repetition vocabulary, DA ↔ RU. 48 high-frequency A2-B1 words. |
| skriveøvelser | planned | Production exercises with self-grade rubric |
| lytteøvelser | planned | DR P1 klip with comprehension questions |
| læseøvelser | planned | Timed reading + comprehension Q |
| udtale | planned | Audio playback + IPA highlight |
| mock-exam | planned | Full Studieprøven simulation (læse+lytte+skrive+mundtlig) |

## Run locally

```bash
git clone https://github.com/lamapony/plata-trainers.git
cd plata-trainers
python3 -m http.server 8000
# open http://127.0.0.1:8000/
```

No build, no dependencies, no server required. You can also open any trainer's `index.html` directly in a browser.

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

Production Pages artifact:

```bash
npm run build:pages
npm run check:pages
npm run check:quality-report
npm run check:demo-learner-report
npm run check:demo-learner-diff
npm run check:today-program-report
npm run check:capability-map
npm run check:program-page
npm run check:comic-prompts
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
npm run diff:today-program -- --base .dist/today-program.json --head current
npm run diff:today-program -- --base .dist/today-program.json --head current --json > .dist/today-program-diff.json
node scripts/smoke-personalization-trajectory.js --json > .dist/personalization-trajectory.json
npm run diff:personalization-trajectory -- --base .dist/personalization-trajectory.json --head current
npm run diff:personalization-trajectory -- --base .dist/personalization-trajectory.json --head current --json > .dist/personalization-trajectory-diff.json
npm run diff:review -- --quality-diff .dist/quality-diff.json --dashboard-diff .dist/dashboard-recommendations-diff.json --demo-diff .dist/demo-learner-diff.json --today-diff .dist/today-program-diff.json --trajectory-diff .dist/personalization-trajectory-diff.json --out .dist/review-report.json --summary-out .dist/review-summary.md --summary-limit 8 --summary-message-limit 180
npm run check:review-report-fixture
```

Gold lesson scaffold:

```bash
npm run scaffold:gold -- --slug lesson-b2-your-topic --title "Your Topic"
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
node scripts/validate-data.js
node scripts/static-qa.js
node scripts/check-syntax.js
node scripts/validate-lesson.js
node scripts/audit-lesson-exercises.js
node scripts/simulate-gold-lessons.js
node scripts/counterfactual-learner-simulator.js
node scripts/debug-profile-replay.js --file plata-backup.json
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
node scripts/build-review-report.js --quality-diff .dist/quality-diff.json --dashboard-diff .dist/dashboard-recommendations-diff.json --demo-diff .dist/demo-learner-diff.json --today-diff .dist/today-program-diff.json --trajectory-diff .dist/personalization-trajectory-diff.json --out .dist/review-report.json --summary-out .dist/review-summary.md --summary-limit 8 --summary-message-limit 180
node scripts/build-review-report.js --quality-diff .dist/quality-diff.json --dashboard-diff .dist/dashboard-recommendations-diff.json --demo-diff .dist/demo-learner-diff.json --today-diff .dist/today-program-diff.json --trajectory-diff .dist/personalization-trajectory-diff.json --markdown --summary-limit 8 --summary-message-limit 180
node scripts/smoke-review-report.js
node scripts/smoke-review-report-fixture.js
node scripts/smoke-program-page.js
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

Each trainer uses the headpage-v2 design system: Fraunces (display), Inter (body), JetBrains Mono (code), ember accent. Mobile-first, accessible.

## Why public

> «Если тренажёры попадают — жалко. Если публичные — кому-то помогут, может даже ответят, найдут баг или пришлют новые слова.»

License: MIT.

## Companion

- Curriculum: [plata-curriculum](https://github.com/lamapony/plata-curriculum)
- Blog: [dmitrii.dk/plata](https://dmitrii.dk/plata) (coming soon)

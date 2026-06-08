# Platå Trainers

[![QA](https://github.com/lamapony/plata-trainers/actions/workflows/qa.yml/badge.svg)](https://github.com/lamapony/plata-trainers/actions/workflows/qa.yml)
[![Pages](https://github.com/lamapony/plata-trainers/actions/workflows/pages.yml/badge.svg)](https://github.com/lamapony/plata-trainers/actions/workflows/pages.yml)

Open-source Danish plateau-breaker for Danish learners who are no longer starting from zero but still feel stuck. Static HTML/JS, no app build step, no backend.
Live demo: [lamapony.github.io/plata-trainers](https://lamapony.github.io/plata-trainers/).
Public quality report: [lamapony.github.io/plata-trainers/quality.html](https://lamapony.github.io/plata-trainers/quality.html).

Platå does not try to teach Danish from the beginning. It helps learners overcome the plateau: the point where they know enough Danish to recognize the language, but not enough to act fluently under social pressure.

The MVP is useful for A2-B2 learners who need short, repeatable practice on the forms and situations that block real-life fluency: verb tenses, noun inflection, word order, register, particles, and high-frequency vocabulary.

Each trainer is a self-contained single-page app. Progress is private by default: it is stored in browser LocalStorage, never sent to a server. Export/import is JSON so you can back up or move between devices.

The current trainers share a small static learning kernel in [`shared/`](./shared/). It provides the common progress schema, LocalStorage migration, attempt recording, mastery-signal diagnostics, stats, gates, and JSON export/import. Old v0 trainer progress is migrated into stable v1 keys such as `plata:trainer:bojning:state:v1`; exported v1 JSON is validated against the trainer ID before import.

## Why this is different

- **Plateau-first:** built for learners who know basic Danish but freeze when forms, word order, tone, and social pressure meet.
- **Private by default:** browser LocalStorage only; no accounts, backend, analytics, or tracking.
- **Contributor-friendly data:** exercises are plain JavaScript data files with validation scripts and narrative lesson schemas.
- **Gold lesson QA:** source-backed lessons can be validated as testable learning artifacts with mastery signals, deterministic simulation, remediation, and comic storyboard prompts.
- **Public quality report:** Pages publishes a generated report of gold lessons, mastery signals, simulations, endings, source coverage, comic coverage, and scene-level evidence rows.
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

## Checks

```bash
npm run check
```

Production Pages artifact:

```bash
npm run build:pages
npm run check:pages
npm run check:quality-report
npm run check:comic-prompts
npm run diff:quality -- --base .dist/quality-report.json --head current
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
node scripts/validate-data.js
node scripts/static-qa.js
node scripts/check-syntax.js
node scripts/validate-lesson.js
node scripts/audit-lesson-exercises.js
node scripts/simulate-gold-lessons.js
node scripts/counterfactual-learner-simulator.js
node scripts/debug-profile-replay.js --file plata-backup.json
node scripts/build-skill-coverage-report.js --out .dist/skill-coverage.json --text
node scripts/snapshot-dashboard-recommendations.js
node scripts/mutation-dashboard-snapshot.js
node scripts/diff-dashboard-snapshot.js --base scripts/fixtures/dashboard-recommendations.snapshot.json --head current
node scripts/smoke-memory.js
node scripts/smoke-memory-fixtures.js
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

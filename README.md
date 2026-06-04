# Platå Trainers

Open-source Danish language trainers. Static HTML/JS, no build step, no backend.
Live via GitHub Pages at [lamapony.github.io/plata-trainers](https://lamapony.github.io/plata-trainers/) and later at `plata.dk/trainers/`.

The MVP is useful for A2-B1 learners who need short, repeatable practice on the forms that block fluent writing: verb tenses, noun inflection, word order, and high-frequency vocabulary.

Each trainer is a self-contained single-page app. Progress is private by default: it is stored in browser LocalStorage, never sent to a server. Export/import is JSON so you can back up or move between devices.

The current trainers share a small static learning kernel in [`shared/`](./shared/). It provides the common progress schema, LocalStorage migration, attempt recording, stats, gates, and JSON export/import. Old v0 trainer progress is migrated into stable v1 keys such as `plata:trainer:bojning:state:v1`; exported v1 JSON is validated against the trainer ID before import.

## Available trainers

| Trainer | Status | Description |
|---------|--------|-------------|
| [Lesson 01: The First Morning](./lessons/lesson-01/) | v0.1 | Narrative A0/A1 onboarding: arrive in Copenhagen, meet Lene, read signs, use `tak`, and say `Jeg hedder ...`. |
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

Individual checks:

```bash
node scripts/smoke-kernel.js
node scripts/validate-data.js
node scripts/static-qa.js
node scripts/check-syntax.js
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for data conventions and PR guidance. See [ROADMAP.md](./ROADMAP.md) for planned trainer expansion.

## Design

Each trainer uses the headpage-v2 design system: Fraunces (display), Inter (body), JetBrains Mono (code), ember accent. Mobile-first, accessible.

## Why public

> «Если тренажёры попадают — жалко. Если публичные — кому-то помогут, может даже ответят, найдут баг или пришлют новые слова.»

License: MIT.

## Companion

- Curriculum: [plata-curriculum](https://github.com/lamapony/plata-curriculum)
- Blog: [dmitrii.dk/plata](https://dmitrii.dk/plata) (coming soon)

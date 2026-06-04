# Platå Trainers

Open-source Danish language trainers. Static HTML/JS, no build step, no backend.
Live at [plata.dk/trainers/](https://plata.dk/trainers/) (when deployed) and via GitHub Pages on this repo.

Each trainer is a self-contained single-page app. Progress is stored in browser LocalStorage. Export/import available as JSON so you can back up or move between devices.

The current trainers share a small static learning kernel in [`shared/`](./shared/). It provides the common progress schema, LocalStorage migration, attempt recording, stats, gates, and JSON export/import. Old v0 trainer progress is migrated into stable v1 keys such as `plata:trainer:bojning:state:v1`; exported v1 JSON is validated against the trainer ID before import.

## Available trainers

| Trainer | Status | Description |
|---------|--------|-------------|
| [bøjning-drill](./bojning-drill/) | v0.2 | Verb tenses (nutid/datid/førnutid) + noun bøjning (bestemt/ubestemt, ental/flertal). Type the answer. |
| [ordstilling-drill](./ordstilling-drill/) | v0.1 | V2 rule, inversion, ledsætninger. Multiple choice with explanations. |
| [vocab-sr](./vocab-sr/) | v0.1 | Spaced-repetition vocabulary, DA ↔ RU. 36 high-frequency A2 words. |
| skriveøvelser | planned | Production exercises with self-grade rubric |
| lytteøvelser | planned | DR P1 klip with comprehension questions |
| læseøvelser | planned | Timed reading + comprehension Q |
| udtale | planned | Audio playback + IPA highlight |
| mock-exam | planned | Full Studieprøven simulation (læse+lytte+skrive+mundtlig) |

## Run locally

```bash
git clone https://github.com/lamapony/plata-trainers.git
cd plata-trainers/bojning-drill
open index.html   # or python3 -m http.server 8000
```

No build, no dependencies, no server required. Just open in browser.

Kernel smoke test:

```bash
node scripts/smoke-kernel.js
```

## Design

Each trainer uses the headpage-v2 design system: Fraunces (display), Inter (body), JetBrains Mono (code), ember accent. Mobile-first, accessible.

## Why public

> «Если тренажёры попадают — жалко. Если публичные — кому-то помогут, может даже ответят, найдут баг или пришлют новые слова.»

License: MIT.

## Companion

- Curriculum: [plata-curriculum](https://github.com/lamapony/plata-curriculum)
- Blog: [dmitrii.dk/plata](https://dmitrii.dk/plata) (coming soon)

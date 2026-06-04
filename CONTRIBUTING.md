# Contributing to Platå Trainers

Platå Trainers is intentionally small: static HTML, CSS, and JavaScript only. No backend, no account system, no build step required for the app itself.

## What helps most

Good MVP contributions are concrete and verifiable:

- Add Danish exercise items with correct answers and explanations.
- Fix a wrong form, translation, or word-order explanation.
- Improve accessibility without adding dependencies.
- Improve the shared kernel if all existing trainers keep working.
- Add tests/checks that prevent bad data from landing.

## Project constraints

- Keep each trainer openable via `index.html` directly.
- Keep progress local to the browser (`LocalStorage`).
- Preserve JSON export/import compatibility where possible.
- Do not add tracking, analytics, or server calls.
- Do not add a framework unless there is a separate discussion first.
- Prefer plain data changes over clever code.

## Local QA

Run the full no-dependency QA suite:

```bash
npm run check
```

That runs:

- `scripts/check-syntax.js` — JS syntax for all repository scripts/apps.
- `scripts/smoke-kernel.js` — shared kernel behavior and M0 gate logic.
- `scripts/validate-data.js` — trainer data shape, uniqueness, explanations.
- `scripts/static-qa.js` — HTML metadata, local links, public static assets.

For browser interaction smoke tests, serve locally:

```bash
python3 -m http.server 8000
```

Then open:

- <http://127.0.0.1:8000/>
- <http://127.0.0.1:8000/bojning-drill/>
- <http://127.0.0.1:8000/ordstilling-drill/>
- <http://127.0.0.1:8000/vocab-sr/>

## Data conventions

### Bøjning drill

`bojning-drill/data.js` uses:

- `verber[]`: `infinitive`, `nutid`, `datid`, `førnutid`, optional `note`.
- `substantiver[]`: `ubestemtEntal`, `bestemtEntal`, `flertalUbestemt`, `bestemtFlertal`, optional `note`.

### Ordstilling drill

`ordstilling-drill/data.js` uses:

- `cat`: one of `v2`, `inversion`, `ledsaetning`.
- `prompt`: what the learner must choose.
- `options`: exactly four answer options.
- `correct`: index `0..3`.
- `why`: short Danish explanation.

### Vocab SR

`vocab-sr/data.js` uses:

- `da`: Danish lemma/form.
- `ru`: Russian translation; comma-separated variants are accepted as aliases.
- `en`: English bridge translation.
- `example`: Danish example sentence.
- optional `note`.

## Pull request shape

A good PR includes:

- What changed.
- Why it helps learners.
- `npm run check` output.
- If UI changed: a screenshot or short screen recording.

MIT license for code. Add only content you have the right to publish.

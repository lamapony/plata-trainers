# Contributing to Platå Trainers

Platå Trainers is intentionally small: static HTML, CSS, and JavaScript only. No backend, no account system, no build step required for the app itself. GitHub Pages deployment uses a checked static artifact built from a public-file whitelist.

## What helps most

Good MVP contributions are concrete and verifiable:

- Add Danish exercise items with correct answers and explanations.
- Fix a wrong form, translation, or word-order explanation.
- Improve accessibility without adding dependencies.
- Improve the shared kernel if all existing trainers keep working.
- Add tests/checks that prevent bad data from landing.
- Improve gold lesson comic storyboards or generated panels when the scene evidence stays intact.

## Project constraints

- Keep each trainer openable via `index.html` directly.
- Keep progress local to the browser (`LocalStorage`).
- Preserve JSON export/import compatibility where possible.
- Do not add tracking, analytics, or server calls.
- Do not add a framework unless there is a separate discussion first.
- Prefer plain data changes over clever code.

## Local QA

For a fast proof-first orientation, build the core local proof artifacts before the full suite:

```bash
npm run proof:quickstart
npm run check:quickstart-proof
```

That writes `.dist/quickstart-proof/` with demo learner, capability map, project health, and golden PR review artifacts. The published Pages artifact also exposes the same quickstart index through `reports/quickstart-proof/quickstart.json`, publishes the guided session contract at `reports/guided-session.json`, summarizes the proof in `reports/proof-digest.json`, and renders the public proof surface on `proof.html`.

Run the full no-dependency QA suite:

```bash
npm run check
```

That runs:

- `scripts/check-syntax.js` — JS syntax for all repository scripts/apps.
- `scripts/smoke-kernel.js` — shared kernel behavior and M0 gate logic.
- `scripts/validate-data.js` — trainer data shape, uniqueness, explanations.
- `scripts/static-qa.js` — HTML metadata, local links, public static assets.
- `scripts/validate-lesson.js` — narrative lesson pattern enforcement.
- `scripts/simulate-gold-lessons.js` — deterministic gold lesson simulation paths.
- `scripts/smoke-lesson-engine.js` — runtime replay through the real shared lesson engine.
- `scripts/smoke-gold-scaffold.js` — proves the gold lesson scaffold still generates a valid lesson.
- `scripts/generate-comic-assets-openrouter.js --dry-run` — builds a comic prompt manifest without calling an image API.
- `scripts/build-quality-report.js`, `scripts/diff-quality-report.js`, `scripts/mutation-quality-report.js`, and `scripts/smoke-quality-report.js` — public gold quality report generation, review diffs, negative contract checks, and rendering.
- `scripts/build-pages-artifact.js` via `npm run check:pages` — production Pages artifact whitelist and link check.

For browser interaction smoke tests, serve locally:

```bash
python3 -m http.server 8000
```

Then open:

- <http://127.0.0.1:8000/>
- <http://127.0.0.1:8000/dashboard.html>
- <http://127.0.0.1:8000/bojning-drill/>
- <http://127.0.0.1:8000/ordstilling-drill/>
- <http://127.0.0.1:8000/vocab-sr/>
- <http://127.0.0.1:8000/lessons/lesson-01/>
- <http://127.0.0.1:8000/lessons/lesson-b2-radiator/>
- <http://127.0.0.1:8000/lessons/lesson-b2-job-followup/>

To inspect the exact GitHub Pages artifact locally:

```bash
npm run check:pages
cd .dist/pages
python3 -m http.server 8000
```

The Pages artifact includes `quality.html`, `program.html`, `proof.html`, and the generated reports under `reports/`, including `guided-session.json`. The JSON reports are generated during the build; do not edit them by hand. For gold lessons, the quality report also publishes a scene audit matrix showing the goal, source references, mastery tags, remediation targets, diagnostics, simulation paths, and comic panel coverage behind each pass.

On pull requests, QA also compares the generated quality report against the base commit and fails on quality regressions such as new report issues, failed guarantees, removed gold lessons, removed mastery signals, removed simulation paths, removed comic panels, or removed scene evidence rows.

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

### Narrative lessons (shared engine)

All narrative lessons use the **shared lesson engine** (`shared/plata-lesson-engine.js`). Create a folder under `lessons/` with:

```
lessons/your-lesson-id/
├── index.html      # loads kernel, engine, data, app
├── styles.css      # usually shared with lesson-01; customise if needed
├── data.js         # exports window.PLATA_LESSON_YOUR_ID
└── app.js          # one line: PlataLessonEngine.run(window.PLATA_LESSON_YOUR_ID)
```

For a new B2 gold lesson, start with the checked scaffold instead of copying by hand:

```bash
npm run scaffold:gold -- --slug lesson-b2-your-topic --title "Your Topic" --name "B2: Your Topic" --description "What this trains"
npm run check
```

The scaffold creates:

- `index.html`, `app.js`, `data.js`, and `styles.css`
- a `qualityTier: "gold"` lesson with `masteryMap`, `sourceNotes`, `comicStoryboard`, `simulation.paths`, grouped completion checks, `endingLogic`, and three endings
- a matching `shared/plata-catalog.js` entry unless you pass `--no-catalog`

You can validate a draft `data.js` before adding it to the real catalog:

```bash
node scripts/validate-lesson.js --file lessons/lesson-b2-your-topic/data.js
node scripts/simulate-gold-lessons.js --file lessons/lesson-b2-your-topic/data.js
node scripts/smoke-lesson-engine.js --file lessons/lesson-b2-your-topic/data.js
node scripts/generate-comic-assets-openrouter.js --dry-run --file lessons/lesson-b2-your-topic/data.js --out .dist/comic-prompts.json
```

**Lesson data schema** (`data.js`):

```js
window.PLATA_LESSON_YOUR_ID = {
  id: "lesson-your-id",           // unique, matches folder
  title: "Human-readable title",
  subtitle: "One sentence hook",
  estimatedMinutes: 10,
  completeTitle: "Completion headline",
  completeText: "What the learner now owns",
  pattern: {
    name: "scene-pressure-language-payoff",
    beats: ["pressure", "notice", "act", "feedback", "carry-forward"]
  },
  scenes: [ /* 4–6 scenes */ ],
  // Optional B2-style consequence system:
  variables: { varName: 0, ... },     //ocial state tracked across scenes
  endingLogic: { ... },               // rules to pick ending
  endings: [ { id, title, narrative, danish, carry }, ... ]
};
```

**Scene contract** (every scene must pass `npm run check:lessons`):

| Field | Required | Type | Purpose |
|-------|----------|------|---------|
| `id` | yes | string | stable key for progress |
| `type` | yes | `choice` \| `input` \| `match` \| `completion` | exercise type |
| `eyebrow` | yes | string | "Scene N · Label" |
| `title` | yes | string | narrative beat, not exercise title |
| `pressure` | yes | string | what's at stake right now |
| `narrative` | yes | string | what's happening in the world |
| `dialogue` | yes | array | `[{speaker, line}]` — lived language |
| `notice` | yes | string | one compact linguistic observation |
| `prompt` | yes | string | the action the learner must take |
| `carry` | yes | string | what this scene stores for later reuse |
| `tags` | yes | string[] | skill tags for kernel weak-tag extraction |

**Per-type extra fields:**

- `choice`: `options[]` with `{id, label, detail, correct, feedback, effects?}`
- `input`: `acceptPrefix`, `placeholder`, `success`, `failure`
- `match`: `pairs[]` with `{id, left, right}`
- `completion`: `prefix`, `placeholder`, `success`, `failure`, `acceptKeywords?`, `effects?`

**Quality bar (enforced by `check:lessons`):**

- Every scene has `pressure`, `notice`, `carry`, `dialogue`
- Exactly one `correct: true` in `choice` options
- Danish density: words appearing once without `carry-forward` mention are warned
- Variables require `endingLogic` + `endings`

**To add a lesson:**

1. Copy `lessons/lesson-01/` → `lessons/your-topic/`
2. Edit `data.js` with your scenes (follow the schema above)
3. Update `index.html` title/description
4. Run `npm run check` — must pass
5. Open locally: `python3 -m http.server 8000` → `http://127.0.0.1:8000/lessons/your-topic/`

**Linguistic sources:** Use real Danish corpora (DR, KorpusDK, Dansk Sprognævn) — not invented sentences. Cite source in scene `note` or PR description.

**Gold comic storyboards:** `comicStoryboard.panels[]` is part of the gold contract. Each panel must point to one scene, cite source refs already attached to that scene, use mastery tags already attached to that scene, include descriptive alt text, and reserve an asset path under `./assets/comic/`. Generate catalog prompt manifests with `npm run check:comic-prompts`, or check an uncataloged draft with `node scripts/generate-comic-assets-openrouter.js --dry-run --file lessons/<slug>/data.js --out .dist/comic-prompts.json`. To create actual assets, set `OPENROUTER_API_KEY` in your shell and run `npm run generate:comics -- --lesson <lesson-id-or-slug> --panel <panel-id>`. Do not commit API keys; generated images need visual review before commit.

## Pull request shape

A good PR includes:

- What changed.
- Why it helps learners.
- `npm run check` output.
- If UI or generated comic assets changed: a screenshot or short screen recording.

MIT license for code. Add only content you have the right to publish.

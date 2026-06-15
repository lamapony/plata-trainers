# Gold Lesson Preflight

Use this before opening a pull request that touches a B2 gold lesson. It runs the focused quality gate from [GOLD_LESSON_QUALITY_ENGINE.md](./GOLD_LESSON_QUALITY_ENGINE.md) without the full `npm run check` suite.

## Command

```bash
# One lesson you are editing
npm run preflight:gold-lesson -- --lesson lesson-b2-radiator

# Or point at data.js directly
npm run preflight:gold-lesson -- --file lessons/lesson-b2-radiator/data.js

# All gold lessons + shared reports
npm run preflight:gold-lesson
```

## Files to touch for a new or edited gold lesson

| File | Purpose |
|------|---------|
| `lessons/<slug>/data.js` | Source notes, scenes, masteryMap, remediation, simulation.paths, comicStoryboard, endings |
| `lessons/<slug>/app.js` | Thin runtime shell (usually unchanged after scaffold) |
| `lessons/<slug>/index.html` | Lesson page wiring |
| `lessons/<slug>/styles.css` | Lesson-local styles |
| `shared/plata-catalog.js` | Trainer entry, gallery metadata, route href |
| `assets/comics/<slug>/` | Generated panel images (optional until reviewed) |

Scaffold a new lesson:

```bash
npm run scaffold:gold -- --slug lesson-b2-your-topic --title "Your Topic"
npm run preflight:gold-lesson -- --lesson lesson-b2-your-topic
```

## What each preflight step catches

| Step | Script | Regressions caught |
|------|--------|-------------------|
| Schema + contract | `validate-lesson.js` | Missing fields, bad competency ids, broken scene graph, gold-tier requirements |
| Gold simulation | `simulate-gold-lessons.js` | Paths that do not resolve, mastery tags never exercised, endings without coverage |
| Lesson engine | `smoke-lesson-engine.js` | Renderer/handler drift, attempts not recorded, repair-mode wiring |
| Catalog | `check:catalog` | Broken trainer href, missing gallery fields, drill repair signal typos |
| Counterfactuals | `check:counterfactuals` | Stricter/lenient edits that hide repair load or shift social endings (radiator only today) |
| Quality report | `check:quality-report` | Missing sources, simulation gaps, comic panel gaps, bad remediation targets |
| Exercise value | `check:exercise-value-report` | Weakened flagship chains (consequence, near-miss, repair ladder, channel transfer) |
| Comic prompts | `check:comic-prompts` | Storyboard prompts missing alt text, source refs, or mastery tags |

## When to run the full suite

Preflight is the fast local loop. Before merge or release, still run:

```bash
npm run check
```

For review diffs on generated reports:

```bash
npm run diff:quality -- --base before.json --head after.json --fail-on-regression
```

## Maintainer rule

If `qualityTier` is `"gold"`, preserve the full chain:

```text
source-backed claim → scene goal → diagnostic → mastery signal → remediation → comic panel → simulation path
```

If a step cannot be satisfied, downgrade the lesson or fix the contract — do not silence the validator.

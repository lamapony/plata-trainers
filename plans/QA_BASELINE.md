# Platå Baseline Release Audit

Date: 2026-06-13
Issue: PLA-3 / PLATA-QA-001
Scope: Current static `trainers-repo` candidate release.

## Result

Baseline status: PASS

No release-blocking defect was found in this audit. The current candidate passes the full local QA suite, static link checks, public Pages runtime smoke, mobile/readiness CSS contracts, and PWA readiness smoke.

## Commands Run

```bash
npm run check
```

Command result: PASS

Key output summary:

- `syntax QA passed: 126 js files checked`
- `catalog validation passed: 6 trainer(s)`
- `data QA passed: 53 verbs, 24 nouns, 34 word-order items, 48 vocab items`
- `static QA passed: 12 html files checked`
- `Lesson validation passed: 3 lesson(s) validated`
- `Lesson exercise audit passed: 3 lesson(s), 17 scene(s) checked`
- `Gold lesson simulation passed: 2 lesson(s), 6 path(s), 42 attempt(s), 6 ending(s) covered`
- `pages artifact built: .dist/pages (85 file(s), precache plata-43d338cbd6c8)`
- `static QA passed: 12 html files checked` against `.dist/pages`
- `PWA smoke passed`

## Static Link Smoke

Status: PASS

Covered by `scripts/static-qa.js` during `npm run check`.

What passed:

- 12 HTML files have `lang`, title, meta description, and exactly one `h1`.
- Local `script`, `link`, `img`, and `a` references resolve.
- Images declare `alt`.
- Required static release files exist: `index.html`, `404.html`, `robots.txt`, `sitemap.xml`, `site.webmanifest`, `sw.js`, PWA icons, and `assets/og-plata.png`.
- Built Pages artifact also includes `precache-manifest.json`.

## Page Runtime Smoke

Status: PASS

Covered by `scripts/smoke-public-runtime.js` during `npm run check`.

What passed:

- Built Pages artifact served over local HTTP.
- Home route exposes the evaluator section and links to demo learner and proof walkthrough targets.
- Home evaluator section does not link directly to Pages-only report JSON.
- Home, dashboard demo, proof, and program local links return HTTP 200.
- Public report links in the capability map return HTTP 200.
- Demo learner report remains read-only with `0` storage writes.
- Home, program, and proof browser JS render against generated reports without console errors.

## Mobile / Readiness Notes

Status: PASS

Covered by public runtime responsive contract checks.

What passed:

- `.site-shell` has constrained desktop width.
- Mobile shell width is constrained under `820px`.
- Proof guided cards collapse to one column on mobile.
- Proof capability rows collapse to one column on mobile.
- Program chips use `overflow-wrap: anywhere` to prevent long-label overflow.

Manual visual-device testing was not performed in this heartbeat; the audit used the deterministic CSS/runtime smoke contracts already present in the repo.

## PWA Readiness Notes

Status: PASS

Covered by `scripts/smoke-pwa.js` during `npm run check`.

What passed:

- `sw.js` exists and includes install, activate, fetch, and `precache-manifest.json` handling.
- `shared/plata-pwa.js` exists as the shared registration helper.
- `site.webmanifest` has standalone display, `start_url`, and icon entries backed by files.
- `assets/og-plata.png` exists.
- `index.html`, `dashboard.html`, `program.html`, `quality.html`, and `proof.html` link the manifest, install icon, and shared PWA helper.
- Built Pages artifact contains `sw.js` and a valid `precache-manifest.json` including `./sw.js`.

## Defects Filed

None. No release-blocking defect was identified.

## Remaining Blockers

None for this baseline audit.

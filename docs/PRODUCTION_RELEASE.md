# Production Release Runbook

This runbook keeps a local changeset easy to turn into a production Pages release later.

## Release Scope

The current release bundle is a product-proof upgrade:

- public evaluator path and evaluator journey reports;
- profile export/import/replay portability proof;
- exercise value report for flagship exercise chains;
- B2 Radiator `flagship-chain` scene with consequence, near miss, repair ladder, channel transfer, memory recurrence, and reason evidence;
- proof page wiring for exercise value, guided outcome proof, profile portability, health, capability map, and public runtime checks.

## Pre-Release Invariants

Before opening a PR or deploying, these must all be true:

```bash
git status --short
git diff --check
git diff --cached --check
npm run check
```

Expected state before commit:

- no unstaged diff unless it is intentional;
- no untracked files that are referenced by tracked source;
- `.dist/` remains ignored and is not committed;
- `.DS_Store` is not committed;
- all new report builders have smoke tests and npm gates.

## Production Build

Build the static artifact exactly as Pages expects it:

```bash
npm run build:pages
npm run check:pages
```

The artifact is written to `.dist/pages/`. It is a local verification artifact, not a commit artifact.

## Proof Reports To Inspect

These commands are the fastest local proof that the public product claim still holds:

```bash
npm run build:evaluator-path -- --text
npm run build:evaluator-journey -- --text
npm run build:profile-portability -- --text
npm run build:exercise-value -- --text
node scripts/build-guided-session-report.js --out .dist/guided-session.json --text
node scripts/build-project-health-manifest.js --out .dist/project-health.json --text
node scripts/build-proof-digest.js --out .dist/proof-digest.json --text
```

Required high-level results:

- evaluator path: `status: pass`;
- evaluator journey: `status: pass`;
- profile portability: `status: pass`;
- exercise value: `status: pass`, `archetypes covered: 6/6`, issues none;
- guided session: `status: pass` and one flagship outcome proof;
- project health: `status: pass`;
- proof digest: `status: pass`.

## Browser QA

Serve the production artifact locally:

```bash
python3 -m http.server 8766 --bind 127.0.0.1 --directory .dist/pages
```

Inspect these URLs before release:

- `http://127.0.0.1:8766/`
- `http://127.0.0.1:8766/dashboard.html?demo=learner`
- `http://127.0.0.1:8766/proof.html`
- `http://127.0.0.1:8766/program.html`
- `http://127.0.0.1:8766/lessons/lesson-b2-radiator/#channel-transfer-lab`
- `http://127.0.0.1:8766/reports/exercise-value.json`
- `http://127.0.0.1:8766/reports/profile-portability.json`
- `http://127.0.0.1:8766/reports/evaluator-journey.json`

Manual acceptance:

- home page has a clear evaluator/demo/proof path;
- demo learner mode is read-only;
- proof page says `Proof passing`;
- proof page exposes `Exercise value`, `guided outcome proof`, and `profile outcome portable`;
- B2 Radiator flagship scene shows 4 channel variants, 3 options, consequence feedback, 3 repair steps, and reason choices;
- mobile width around 390px has no horizontal overflow on proof and flagship lesson pages;
- browser console has no errors.

## Commit And PR

Suggested commit message:

```text
Add public proof reports and flagship exercise chain
```

PR checklist:

- include the output summary from `npm run check`;
- link the local proof URLs or screenshots if visual QA changed;
- mention that `.dist/` is generated and intentionally not committed;
- mention whether Pages deployment is expected after merge.

## Production Deployment

For the GitHub Pages flow:

1. Push the branch.
2. Open a PR.
3. Wait for QA workflow to pass.
4. Merge into the Pages deployment branch configured by the repo.
5. Wait for the Pages workflow to finish.
6. Verify the public URLs:
   - `https://lamapony.github.io/plata-trainers/`
   - `https://lamapony.github.io/plata-trainers/proof.html`
   - `https://lamapony.github.io/plata-trainers/program.html`
   - `https://lamapony.github.io/plata-trainers/dashboard.html?demo=learner`
   - `https://lamapony.github.io/plata-trainers/reports/exercise-value.json`
   - `https://lamapony.github.io/plata-trainers/reports/profile-portability.json`
   - `https://lamapony.github.io/plata-trainers/reports/evaluator-journey.json`

## Rollback

This project is static and local-first, so rollback is simple:

- revert the release commit and redeploy Pages;
- no server-side database rollback is needed;
- no user account migration is needed;
- LocalStorage data remains private in the browser. If a lesson route changes, keep old trainer IDs and state keys stable unless a migration is explicitly added.

## Do Not Ship

Do not release if any of these are true:

- `npm run check` fails;
- proof page does not reach `Proof passing`;
- any generated report has `status: fail`;
- flagship exercise report loses `6/6` archetype coverage;
- public runtime mutation tests fail;
- `.dist/`, generated image drafts, API keys, or machine-local files appear in `git status --short`.

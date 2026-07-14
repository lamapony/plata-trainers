# Agent lesson workflow

This is the executable contract for turning a user's natural-language request into a Platå lesson. It is designed for an external coding agent that can read and edit the repository and run local commands.

## What “create any lesson” means

The topic may vary widely, but the product shape does not: Danish A2–B2 practice for a real situation where wording, grammar, register, or social pressure matters. Platå is not a general course generator, a factual quiz factory, or an autonomous model hosted by the static website.

A repository or project link gives an agent the specification. The agent still needs repository write access and command execution. A live Pages URL by itself is read-only and cannot create or publish files.

## 1. Capture the request

Convert the user's request into JSON using `examples/lesson-request.example.json`. The machine-readable contract is `schemas/lesson-request.schema.json`.

Required intent:

- `topic`: what the lesson is about;
- `learnerGoal`: what the learner should be able to do afterwards;
- `situation`: who is speaking or writing, to whom, and what is at stake;
- `level`: A2, B1, or B2.

Useful optional constraints are duration, interface language, must-include moments, avoid-list, and preferred sources. Do not collect personal identifiers or private learner history.

## 2. Create the working lesson

```bash
npm run lesson:new -- --request /path/to/request.json
```

This validates the request, derives a stable slug when needed, creates the gold lesson files, adds a catalog entry, and writes:

- `lesson-request.json` — stable input and delivery evidence;
- `AUTHORING.md` — the request-specific checklist.

The initial status is always `scaffold`. It is intentionally not deliverable.

## 3. Author from evidence

- Replace all generic scenario, dialogue, feedback, ending, and storyboard content.
- Prefer a 4–6 scene arc. Each scene trains one active pattern and changes the situation.
- Use Danish examples a learner could actually encounter. Check grammar, collocation, register, and domain claims.
- Put reviewed sources in `sourceNotes`; every scene cites them through `sourceRefs`.
- Build `masteryMap` around diagnostic signals, not broad themes.
- Route each miss to an exact scene repair or an existing drill. Do not claim a drill repairs a signal it does not contain.
- Cover strong, plausible-near-miss, and damaging paths in `simulation.paths`.
- Storyboard prompts may remain without generated images, but must cite the same scene sources and mastery tags.

## 4. Complete delivery evidence

Edit `lesson-request.json.delivery`:

```json
{
  "status": "ready",
  "objectiveTags": ["one-real-mastery-tag", "another-real-mastery-tag"],
  "mustIncludeCoverage": {
    "exact mustInclude text": ["scene-id"]
  },
  "reviewedSourceUrls": ["https://...", "https://..."],
  "avoidReviewed": true,
  "reviewNotes": "Concise explanation of request, source, and boundary review."
}
```

Each objective tag must exist in `masteryMap`; each covered scene must exist; each reviewed URL must exist in `sourceNotes`. Do not use `ready` as a progress indicator.

## 5. Verify and hand off

```bash
npm run lesson:verify -- --lesson lesson-b1-example
npm run check
```

`lesson:verify` first checks request fulfilment and rejects generic scaffold markers. It then runs lesson schema validation, deterministic simulations, runtime replay, catalog wiring, quality reports, repair-chain evidence, and storyboard prompt checks.

The final handoff names the path, outcome, mastery/repair design, sources, and exact command results. If Danish review is still uncertain, keep the lesson as a draft and say so explicitly.

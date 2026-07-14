# Danish review checklist — flagship chain (P0.5)

Status: **official-source review complete; native-speaker editorial review still recommended**
Flagship path: `lesson-b2-job-followup` → repair drills (bøjning / register / ordstilling) → Today

## Ordstilling ledsætning (updated for v0.5)

Describe subordinate-clause order as:

`conjunction → subject → sentence adverb (sætningsadverbial) → finite verb`

Do **not** teach “verb at the end” (German-style). Multiple answers are allowed via `accepted[]` for the documented omission of *at* after reporting verbs. Marked time/place placements were removed from the answer set until a native editor reviews them.

Verified against official Dansk Sprognævn guidance:

- [Ledsætninger](https://sproget.dk/typiske-problemer/ledsaetninger/) — the *ikke*-test and documented omission of the conjunction *at*.
- [Kommagrammatik](https://sproget.dk/typiske-problemer/komma/kommagrammatik/) — sentence adverbs such as *ikke* occur between the subject and finite verb in subordinate clauses.
- [Retskrivningsordbogen § 49–50](https://ro.dsn.dk/?sektion=49-50&type=rulesearch) — official subordinate-clause boundary and comma guidance.

| Area | File | Notes for reviewer |
|---|---|---|
| Ledsætning core pack | `ordstilling-drill/data.js` (`cat: "ledsaetning"`) | Multi-accepted items for *at*-omission and midfield time/place |
| Narrative repair cards | same file, `fordi` / `selvom` / `at` items | Check *ikke* / *gerne* placement before finite verb |
| V2 + inversion | same file | Fronted adverbial inversion claims |
| Flagship lesson | `lessons/lesson-b2-job-followup/data.js` | Register + any embedded word-order claims |
| Register deadline/channel | `register-drill/data.js` | Professional email tone / channel shift |

## Sign-off

- [x] Official-source review completed for subordinate-clause order, *ikke*-placement, and optional *at* after reporting verbs
- [x] Ambiguous marked time/place variants removed from accepted answers
- [ ] Native/near-native Danish reviewer confirmed flagship tone and idiomatic phrasing
- [ ] Native review required before making a stronger claim than “public beta”

Reviewer: _____________  Date: _____________

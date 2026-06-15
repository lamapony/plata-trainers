# Platå Exercise Backlog

Date: 2026-06-13  
Track: Factory Day 6 (`plans/FACTORY_NEXT.md`)  
Status: Active — first thin slice shipped as `register-drill/`

---

## Pedagogical rule

Every backlog item must name a **concrete learner situation**, an **existing mastery signal or route**, and a **repair path back** from narrative practice. Generic “more content” does not ship.

---

## Ranked backlog

### 1. B2 workplace disagreement (not started)

- **Situation:** Same intent must land differently in Slack, email, and face-to-face without sounding evasive or aggressive.
- **Signals:** `understatement-with-agency`, `consequence-aware-tone`, `formal-register-control`
- **Route:** New gold lesson or multi-channel scene pack; drill fallback only if gold contract is too heavy.
- **Source notes:** Professional register corpus; radiator/job-followup channel-transfer patterns.

### 2. B2 public-service reply — **thin slice shipped**

- **Situation:** Reply to a passive official message (radiator landlord, Borgerservice, housing association) with a named actor, date, and polite escalation.
- **Signals:** `passive-agency`, `formal-register-control`, `understatement-with-agency`, `consequence-aware-tone`
- **Route:** `lesson-b2-radiator-register` scene repair → `register-drill/?signal=…&from=lesson-b2-radiator-register` → return to `official-reply-passive` repair mode.
- **Artifact:** `register-drill/` (12 MC items · passive / deadline / escalation)

### 3. B1/A2 word-order repair pack (partial — narrative exists)

- **Situation:** Fronted time/place adverbials break V2 in email and chat after the conference narrative.
- **Signals:** `v2-placement`, `inversion-fronted-adverbial`, `fordi-derfor-clause`
- **Route:** `lesson-b2-ordstilling` → `ordstilling-drill/` (already wired).

### 4. B1 noun/verb trap pack (not started)

- **Situation:** Common-gender nouns, plural traps, and tense choices that already appear inside lesson scenes.
- **Signals:** TBD per trap family; reuse `bojning-drill` where form recall is the gap.
- **Route:** Scene miss → `bojning-drill/` with tagged weak forms.

### 5. B2 email endings — too direct vs too vague (not started)

- **Situation:** Professional follow-up endings that neither bulldoze nor disappear.
- **Signals:** `consequence-aware-tone`, `professional-email-agency`
- **Route:** Extend job-followup gold chain or small ending pack tied to `lesson-b2-job-followup`.

### 6. Vocabulary recurrence pack (not started)

- **Situation:** Words that appeared in a weak B2 scene should resurface in vocab SR before the learner forgets them.
- **Signals:** scene-derived vocab tags from lesson attempts
- **Route:** Dashboard planner → `vocab-sr/` with `from=` lesson id.

---

## Day 6 acceptance

```bash
npm run check:data
npm run check:exercise-audit
npm run check:exercise-value-report
npm run check:skill-coverage
npm run check:catalog
```

Done when the backlog names inspectable situations and the first slice gives drills a clear reason to exist after narrative practice.

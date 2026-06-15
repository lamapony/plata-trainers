# Platå Exercise Completion Plan

Date: 2026-06-14  
Issue: PLA-14 / PLATA-PRODUCT-002  
Status: Active  
Scope: Local static repo exercise design and progression. No external dependencies.

---

## 1. Pedagogical Principle

At Platå, **language is treated as athletic training**. We do not believe in superficial vocabulary exposure or repetitive swipe mechanics. The Platå exercise model is structured to bridge the gap between comprehension and spontaneous production. 

Every exercise must be strictly categorized into one of three pedagogical structures:
1.  **Narrative Pressure (The Match)**: Situations where choice, register, and grammatical precision change the course of a social or professional encounter.
2.  **Repair Drills (The Gym)**: High-speed, focused tasks targeted at resolving specific weaknesses discovered in narrative encounters (e.g., word-order inversion, verb tense selection, noun inflection).
3.  **Proof Gates (The Video Review)**: Rigorous, deterministic code-level tests (simulations, mutations, counterfactual comparisons) ensuring pedagogical assertions hold true across all learner variations.

---

## 2. Exercise & Lesson Backlog

The current curriculum backlog contains a mix of existing, polished, and planned narrative lessons and repair drills.

### A. Existing Curriculum
*   **`lesson-01-arrival` (A0/A1 starter)**: Teaches basic survival signage (`indgang`/`udgang`), introductions (`Jeg hedder...`), and courtesy exchanges (`tak`/`selv tak`).
*   **`lesson-b2-radiator-register` (B2 Gold flagship)**: Trains formal complaint register, polite persistence, passive agency, and formal/informal channel switching.
*   **`lesson-b2-job-followup` (B2 Gold flagship)**: Trains professional written tone, following up after job interviews, and LinkedIn platform-register adaptation.
*   **`bojning` drill (A2-B2 repair)**: Verb conjugation and noun declension reflex training.
*   **`ordstilling` drill (B1-B2 repair)**: Word-order practice (V2, inversion, subordinate clauses) in isolation.
*   **`vocab` SR (A2-B2 repair)**: Spaced-repetition card training on critical vocabulary.

### B. New Backlog Items
*   **`lesson-b2-ordstilling` (B1/B2 Narrative Bridge)**: A coworker schedule change scenario necessitating precise V2 inversion Spoken/Written transition.
*   **`lesson-b1-borgerservice` (B1 Narrative)**: "Når systemet siger nej" - Navigating Borgerservice / MitID CPR appointments without panic or aggression.
*   **`lesson-a2-doctor` (A2 Narrative)**: "Hvor længe har du haft det sådan?" - Precision describing health symptoms, severity, and timeline safely.
*   **Ordstilling Repair Cards**: 20 sentence completion items generated directly from real-world narrative contexts.
*   **Register Contrast Mini-Drill**: Choice task comparing same-intent phrases across Slack, professional email, and coffee machine banter.
*   **Noun/Verb Trap Pack**: Common-gender nouns, plural irregularities, and past tense traps that trip up B1/B2 speakers.

---

## 3. Current Pedagogical Gaps

Through recent audits, the following key pedagogical gaps have been identified:
1.  **Drill Isolation**: Existing drills (`bojning`, `ordstilling`, `vocab`) function as separate modules. There are no stateful remediation links directing a learner from a narrative failure directly into a targeted drill set.
2.  **Lesson 01 Quality Surface**: `lesson-01-arrival` lacks machine-readable quality maps and simulated paths, preventing it from being audited with the same rigor as the B2 Gold lessons.
3.  **Complex Complete-Sentence Validation False Negatives**: Completion text inputs in the B2 radiator/job lessons are overly strict, leading to false negatives for valid natural phrasing variations (e.g., small word order shifts or minor typos).

---

## 4. Sequencing & Delivery Schedule

The exercise track is divided into six progressive phases over 30 days:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Phase 1 (D1-5)  │ ───> │ Phase 2 (D6-10) │ ───> │ Phase 3 (D11-15)│
│ Lesson 01       │      │ Ordstilling     │      │ Ordstilling     │
│ Quality-Lite    │      │ Narrative       │      │ Repair Pack     │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                                   │
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Phase 6 (D26-30)│ <─── │ Phase 5 (D21-25)│ <─── │ Phase 4 (D16-20)│
│ Doctor Precision│      │ Borgerservice   │      │ Near-Miss       │
│ & Traps Pack    │      │ Narrative       │      │ Diagnostics Pass│
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### Phase 1: Lesson 01 Quality-Lite Polish (Days 1-5)
*   **Objective**: Standardize Lesson 01's schema to declare levels and mastery signals compatible with `PlataPlanner`.
*   **Tasks**:
    *   Add stable `qualityTier: "starter"` and `level: "A1"`.
    *   Expose `masteryMap` with tags: `signage-direction`, `identity-chunk`, `courtesy-loop`.
    *   Write simulation paths: `survives-morning` (optimal) and `socially-lost` (near-miss).
*   **Artifact Path**: `lessons/lesson-01/data.js`, `shared/plata-catalog.js`
*   **Owner**: Lesson Architect (`af6fc315-0149-47eb-9b07-8425fe507021`)
*   **Verification**: `npm run check:lessons` && `npm run check:catalog`

### Phase 2: Ordstilling Narrative Bridge Scaffold (Days 6-10)
*   **Objective**: Draft the core narrative scenes requiring V2/inversion before sending a learner to the ordstilling drill.
*   **Tasks**:
    *   Create `lessons/lesson-b2-ordstilling/data.js`.
    *   Implement 4 corridor pressure scenes showing Spoken vs. Written context changes.
    *   Link weak ordstilling signals directly to the `ordstilling` drill in `shared/plata-catalog.js`.
*   **Artifact Path**: `lessons/lesson-b2-ordstilling/data.js`, `shared/plata-catalog.js`
*   **Owner**: Lesson Architect (`af6fc315-0149-47eb-9b07-8425fe507021`)
*   **Verification**: `npm run check:lessons` && `npm run check:gold-lessons`

### Phase 3: Ordstilling Repair Cards (Days 11-15)
*   **Objective**: Build 20 realistic, contextual sentence completion cards targeted at word-order errors.
*   **Tasks**:
    *   Author 20 spec records covering fronted adverbs, subordinate inversion (`fordi`, `selvom`), and main-clause inversion (`så`, `derfor`).
    *   Confirm each item exposes appropriate `weakTags` on failure.
*   **Artifact Path**: `ordstilling-drill/data.js`, `shared/exercise-schema.json`
*   **Owner**: Lesson Architect (`af6fc315-0149-47eb-9b07-8425fe507021`)
*   **Verification**: `npm run check:data` && `npm run check:exercise-audit`

### Phase 4: B2 Flagship Register & Near-Miss Diagnostics Pass (Days 16-20)
*   **Objective**: Refine validation lists and add rich near-miss explanation diagnostics to B2 radiator and job-followup lessons.
*   **Tasks**:
    *   Add custom feedback explanations explaining register slips for each distractor.
    *   Add normalization tests for natural variations in completion fields.
*   **Artifact Path**: `lessons/lesson-b2-radiator/data.js`, `lessons/lesson-b2-job-followup/data.js`
*   **Owner**: Lesson Architect (`af6fc315-0149-47eb-9b07-8425fe507021`)
*   **Verification**: `npm run check:gold-lessons` && `npm run check:counterfactuals`

### Phase 5: Borgerservice Booking Narrative "Når systemet siger nej" (Days 21-25)
*   **Objective**: Deliver a full B1 narrative lesson mapping interactions with institutional bureaucracy.
*   **Tasks**:
    *   Scaffold 5 interactive scenes on appointment reservation, CPR issues, and polite pushback.
    *   Train polite request chunks (`Jeg vil gerne...`, `Er det muligt at...`) and clarifying questions.
*   **Artifact Path**: `lessons/lesson-b1-borgerservice/data.js`
*   **Owner**: Lesson Architect (`af6fc315-0149-47eb-9b07-8425fe507021`)
*   **Verification**: `npm run check:lessons` && `npm run check:gold-lessons`

### Phase 6: Everyday Medical Precision & Traps Pack (Days 26-30)
*   **Objective**: Author symptom precision content (Doctor) and common verb/noun inflections.
*   **Tasks**:
    *   Author `lessons/lesson-a2-doctor/data.js` training duration and severity adjectives.
    *   Incorporate body parts vocabulary with gender-noun drills.
*   **Artifact Path**: `lessons/lesson-a2-doctor/data.js`, `bojning-drill/data.js`
*   **Owner**: Lesson Architect (`af6fc315-0149-47eb-9b07-8425fe507021`)
*   **Verification**: `npm run check`

---

## 5. Verification Gateways & Acceptance Standards

To guarantee exercise accuracy and prevent platform regression, every exercise added to the backlog must satisfy the following strict verification checklist:

| Verification Gate | Command | Passing Standard |
|---|---|---|
| **Syntactic Soundness** | `npm run check:syntax` | No ES5 violations or strict-mode parsing errors. |
| **Catalog Alignment** | `npm run check:catalog` | Trainer metadata matches exercise spec and exports correctly. |
| **Pedagogical Integrity** | `npm run check:exercise-audit` | No dangling tags; all mastery points mapped to a root competency. |
| **Simulation Coverage** | `npm run check:gold-lessons` | 100% path coverage; distinct outcomes reach their target endings. |
| **Regression Safety** | `npm run check:counterfactuals`| Content alterations must not break baseline learner simulations. |
| **Quality Report Building** | `npm run check:quality-report`| The generated quality metrics manifest can be built successfully. |

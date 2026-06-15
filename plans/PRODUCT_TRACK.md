# Platå Product Track Plan (7-Day & 30-Day)

Date: 2026-06-14  
Issue: PLA-14 / PLATA-PRODUCT-002  
Status: Active  
Scope: Local static repo only. No external sends, endpoints, or deployments.

---

## 1. Product Positioning Statement

Platå is a **static, no-backend Danish plateau-breaker for A2–B2 learners**. It is deliberately designed NOT to be a beginner-oriented, gamified "Duolingo clone". Instead, it serves intermediate learners who are struggling to bridge the gap into professional, social, and bureaucratic fluency in Denmark. 

Platå trains learners to survive real Danish situational pressure through highly realistic narrative-based lessons and contextualized reflex repair drills. 

**Core Product Pillars:**
1. **Narrative-First Learning**: Real-world intermediate scenarios (complaints, job follow-ups, coworker banter) where choice and register determine social outcomes.
2. **Reflex Repair Drills**: Focused, high-repetition linguistic drills (word order, verb/noun inflections, vocabulary retrieval) linked as repairs to narrative failures.
3. **No-Backend Autonomy**: Built as a purely static, offline-ready progressive web app (PWA) that respects privacy and runs entirely on the client's device.
4. **Transparent Proof**: Human-readable and machine-verifiable proof pages proving curriculum quality and pedagogical claims directly from code and simulator checks.

---

## 2. Product Track Roadmap (7-Day and 30-Day)

### A. The 7-Day Product Polish Track (Packaging & Shell)
*Focus: Tighten user packaging, entry points, PWA reassurance, Today navigation, and public proof links.*

* **Day 1: PWA Status & Confidence UI**
  * *Deliverable*: Introduce an explicit offline-ready / installability status indicator on both the landing page and the dashboard.
  * *Artifact Path*: `index.html`, `dashboard.html`, `shared/plata-pwa.js`
  * *Owner*: Frontend Polish Engineer (`df6b168b-6357-4d12-8367-afe710acaee3`)
  * *Verification*: `npm run check:pwa` && `npm run check:pages`
* **Day 2: Narrative Gallery as a Product Spine**
  * *Deliverable*: Re-order the lesson gallery into a clear, progression-based sequence (A1 Starter Story → B2 Workplace Pressure → Repair Drills) with level, estimated minutes, and signal family chips driven directly from metadata.
  * *Artifact Path*: `index.html`, `shared/plata-catalog.js`
  * *Owner*: Product Owner (`810ffb1d-e202-496e-b286-6de88ce639d4`)
  * *Verification*: `npm run check:home` && `npm run check:catalog`
* **Day 3: Today Shell Learner-First Re-Ordering**
  * *Deliverable*: Restructure the main dashboard `Today` card to place the next action, lesson route state, and outcome front-and-center. Demote secondary metadata (hashes, citations, raw facts) into a collapsible "Evidence Trail" drawer.
  * *Artifact Path*: `dashboard.html`, `dashboard.js`
  * *Owner*: Frontend Polish Engineer (`df6b168b-6357-4d12-8367-afe710acaee3`)
  * *Verification*: `npm run check:dashboard` && `npm run check:today-program-report`
* **Day 4: Contributor preflight command docs**
  * *Deliverable*: Add a clear, localized preflight check checklist and script helper so developers can run isolated unit checks before the full QA runner.
  * *Artifact Path*: `plans/QA_BASELINE.md`, `README.md`
  * *Owner*: QA Engineer (`590879fe-8061-4068-a046-cafa03b5e72e`)
  * *Verification*: `npm run check:lessons` && `npm run check:quality-report`
* **Day 5: Proof Page Route Cohesion**
  * *Deliverable*: Align `proof.html` and `program.html` layouts to tell a singular story: from the demo learner profile to Today's planner recommendations, guided outcomes, and source-code evidence. Remove duplicated proof definitions.
  * *Artifact Path*: `proof.html`, `program.html`, `proof.js`, `program.js`
  * *Owner*: Frontend Polish Engineer (`df6b168b-6357-4d12-8367-afe710acaee3`)
  * *Verification*: `npm run check:proof-page` && `npm run check:program-page`
* **Day 6: First Thin Slice of the Exercise Backlog**
  * *Deliverable*: Create and integrate a small diagnostic-to-drill repair mechanism connecting a narrative mistake to a specific repair drill.
  * *Artifact Path*: `shared/plata-catalog.js`, `dashboard.js`
  * *Owner*: Lesson Architect (`af6fc315-0149-47eb-9b07-8425fe507021`)
  * *Verification*: `npm run check:planner` && `npm run check:exercise-value-report`
* **Day 7: Release Candidate & Review Proof Generation**
  * *Deliverable*: Rebuild static pages, precache manifests, compile reports, and finalize the Release Candidate proof.
  * *Artifact Path*: `precache-manifest.json`, `.dist/pages/`, `plans/PRODUCT_TRACK.md`
  * *Owner*: QA Engineer (`590879fe-8061-4068-a046-cafa03b5e72e`)
  * *Verification*: `npm run proof:quickstart` && `npm run check`

---

### B. The 30-Day Product Track (Expansion & Maturity)
*Focus: Deepen pedagogical narrative-to-drill loops, expand B1/B2 content breadth, integrate local customization features, and establish robust client-side portability.*

#### Week 2 (Days 8-14): Ordstilling Narrative-to-Drill Bridging
*   **Goal**: Bridge the visual and functional gap between narrative lessons and the V2/inversion practice drills.
*   **Tasks**:
    1.  **Draft Ordstilling Bridge Lesson (`lesson-b2-ordstilling`)**: Provide a narrative scenario where a late arrival or changed plan is communicated to a colleague, showing how wrong word order changes tone/meaning.
        *   *Artifact Path*: `lessons/lesson-b2-ordstilling/data.js`
        *   *Owner*: Lesson Architect (`af6fc315-0149-47eb-9b07-8425fe507021`)
        *   *Verification*: `npm run check:lessons` && `npm run check:gold-lessons`
    2.  **Stateful Remediation Hook**: Enhance `PlataPlanner` to detect a low mastery score in the ordstilling narrative and trigger a specific Practice Plan Recommendation directing the user to the `ordstilling` drill.
        *   *Artifact Path*: `shared/plata-planner.js`
        *   *Owner*: Product Owner (`810ffb1d-e202-496e-b286-6de88ce639d4`)
        *   *Verification*: `npm run check:planner` && `npm run check:planner-mutations`

#### Week 3 (Days 15-21): High-Stakes Institutional Contexts
*   **Goal**: Deliver a B1-level narrative addressing Danish bureaucracy and register-sensitive email responses.
*   **Tasks**:
    1.  **Borgerservice Narrative Lesson (`lesson-b1-borgerservice`)**: A scenario focusing on booking or adjusting appointments with Borgerservice / MitID without sounding overly demanding or helpless.
        *   *Artifact Path*: `lessons/lesson-b1-borgerservice/data.js`
        *   *Owner*: Lesson Architect (`af6fc315-0149-47eb-9b07-8425fe507021`)
        *   *Verification*: `npm run check:lessons` && `npm run check:exercise-audit`
    2.  **Register Contrast Mini-Drill**: A drill comparing professional email endings, conversational small talk, and informal messages.
        *   *Artifact Path*: `shared/exercise-generator.js`, `plans/EXERCISE_COMPLETION_TRACK.md`
        *   *Owner*: Frontend Polish Engineer (`df6b168b-6357-4d12-8367-afe710acaee3`)
        *   *Verification*: `npm run check:exercise-generator` && `npm run check:data`

#### Week 4 (Days 22-30): Everyday Precision & Client-Side Portability
*   **Goal**: Deliver everyday precision training (Doctor symptom precision) and provide complete standalone PWA distribution packaging.
*   **Tasks**:
    1.  **Doctor/Pharmacy Precision Lesson (`lesson-a2-doctor`)**: Narrates describing symptom severity, duration, and asking polite clarifications safely.
        *   *Artifact Path*: `lessons/lesson-a2-doctor/data.js`
        *   *Owner*: Lesson Architect (`af6fc315-0149-47eb-9b07-8425fe507021`)
        *   *Verification*: `npm run check:lessons` && `npm run check:gold-lessons`
    2.  **Offline Export-Import Verification Drawer**: Expand the profile portability features to include visual import-export diagnostics within the dashboard, allowing learners to confidently copy progress between browsers offline.
        *   *Artifact Path*: `dashboard.html`, `dashboard.js`
        *   *Owner*: Frontend Polish Engineer (`df6b168b-6357-4d12-8367-afe710acaee3`)
        *   *Verification*: `npm run check:profile-portability` && `npm run check:pwa`
    3.  **Standalone Distribution Packaging**: Bundle the entire built Pages directory into an offline ZIP bundle to prove Platå operates fully without backend dependencies.
        *   *Artifact Path*: `scripts/build-pages-artifact.js`, `package.json`
        *   *Owner*: QA Engineer (`590879fe-8061-4068-a046-cafa03b5e72e`)
        *   *Verification*: `npm run check`

---

## 3. Product Features & Verification Summary

| Feature Area | Product Goal | Verification Script | Key Artifacts |
|---|---|---|---|
| **Landing & Gallery** | Visual navigation of level-appropriate situational lessons. | `npm run check:home` | `index.html`, `shared/plata-catalog.js` |
| **PWA Confidence** | Offline-ready assurance and offline fallback detection. | `npm run check:pwa` | `sw.js`, `shared/plata-pwa.js` |
| **Today Program** | One single primary situational recommendation + evidence drawer. | `npm run check:today-program-report` | `dashboard.js`, `reports/today-program.json` |
| **Guided Session** | Consolidated 4-step execution wrapper from memory to outcome. | `npm run check:guided-session-report` | `shared/plata-guided-session.js` |
| **Outcome Ledger** | Compact, non-leaking local completion receipts. | `npm run check:guided-session-diff` | `dashboard.js`, `reports/guided-session.json` |
| **Public Proof** | Zero-leak capability-to-verification transparency for reviewers. | `npm run check:proof-page` | `proof.html`, `reports/capabilities.json` |

---

## 4. Operational Separation: Packaging vs. Content/Exercises

To prevent regression and maintain high build-health metrics, the Platå Factory enforces a strict boundary between product packaging and content/exercise work:

1.  **No Structural Code in Content Commits**: Modifying lesson files (`data.js`) must never alter engine behaviors (`plata-lesson-engine.js`). All content additions are treated as purely declarative data payloads.
2.  **Isolated Verification Running**: Content updates must be verified first via focused test segments (`npm run check:lessons`, `npm run check:data`) before pulling in full regression-testing loops (mutations, counterfactuals, system smoke checks).
3.  **Visual vs. Pedagogical Review**: UI/UX polish (Today shell, gallery layout) is evaluated for accessibility and responsiveness. Pedagogical updates (mastery maps, remediation links) are evaluated through simulation coverage reports and deterministic snapshots.

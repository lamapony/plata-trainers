# Platå Trainers Roadmap

This is a public MVP roadmap, not a promise. Platå is not a from-zero Danish course; it is a plateau-breaker for learners who already know the basics but still freeze in real situations. The goal is to make the trainers useful to other Danish learners while keeping the codebase boring and static.

## Now: MVP foundation

- [x] Public landing page.
- [x] Three trainers: bøjning, ordstilling, vocab-SR.
- [x] First narrative A0/A1 lesson prototype.
- [x] Shared progress kernel.
- [x] Local progress + JSON export/import.
- [x] Static QA and data validation.
- [x] GitHub Pages deployment.

## Next: make the existing trainers stronger

- [ ] Reframe landing/docs around “overcome the plateau”, not “learn Danish from scratch”.
- [ ] Make B2 narrative lessons about register, particles, conflict, and social consequences.
- [ ] Add more A2-B1 verbs with source notes.
- [ ] Expand nouns with gender/plural traps.
- [ ] Add more `ledsaetning` word-order items.
- [ ] Show weak tags in each trainer UI, not only in kernel helpers.
- [ ] Add a combined progress dashboard across all trainers.
- [ ] Add a “practice due now” entry point on the landing page.
- [ ] Extract narrative lesson engine docs for contributors.
- [ ] Expand Lesson 01 with optional native audio / pronunciation blocks.
- [x] Add the backward-compatible Danish audio contract, generator/QC pipeline, accessible single-player runtime, and PWA cache boundary.
- [ ] Publish the first manifest-backed flagship voice set after authorized synthesis and human Danish listening review.

## Later: more skill types

- [ ] Skriveøvelser: short production prompts with self-grade rubric.
- [ ] Læseøvelser: short Danish texts with comprehension questions.
- [ ] Lytteøvelser: links to public Danish audio plus comprehension prompts.
- [ ] Mock exam mode for Studieprøven-style timed practice.

## Later: inspectable personalization

- [x] Build a local adaptive learner model from attempts, repairs, evidence rows, practice-plan completions, and skill roots.
- [x] Add a learner memory inspector: show what the system believes, why it believes it, and how to delete a fact.
- [x] Make recommendations cite memory facts, not only recent attempts.
- [x] Keep export/import strong enough to move the full personalization state between devices.
- [x] Prototype optional account memory as a vault for derived learning facts.
- [x] Add a lightweight `PlataCompanion` card instead of embedding a heavy autonomous agent runtime.
- [x] Export a read-only Hermes bridge brief for learners who already use external agent tools; see [Companion Architecture](./docs/COMPANION_ARCHITECTURE.md).
- [ ] Explore optional account sync for the derived memory vault without making accounts required.

## Non-goals for now

- Mandatory user accounts.
- Backend syncing before the local learner memory model is useful.
- Analytics/tracking.
- A framework rewrite.
- Embedded heavy agent runtimes as a requirement for basic practice.
- AI-generated exercise dumps without human review.

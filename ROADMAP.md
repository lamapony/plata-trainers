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

## Later: more skill types

- [ ] Skriveøvelser: short production prompts with self-grade rubric.
- [ ] Læseøvelser: short Danish texts with comprehension questions.
- [ ] Lytteøvelser: links to public Danish audio plus comprehension prompts.
- [ ] Mock exam mode for Studieprøven-style timed practice.

## Later: inspectable personalization

- [ ] Build a local adaptive learner model from attempts, repairs, evidence rows, practice-plan completions, and skill roots.
- [ ] Add a learner memory inspector: show what the system believes, why it believes it, and how to delete a fact.
- [ ] Make recommendations cite memory facts, not only recent attempts.
- [ ] Keep export/import strong enough to move the full personalization state between devices.
- [ ] Explore optional account memory as a vault for derived learning facts.
- [ ] Explore a small account-resident `OpenClaw` agent that remembers the student and prepares evidence-backed practice; see [Learner Memory Agent RFC](./docs/LEARNER_MEMORY_AGENT_RFC.md).

## Non-goals for now

- Mandatory user accounts.
- Backend syncing before the local learner memory model is useful.
- Analytics/tracking.
- A framework rewrite.
- AI-generated exercise dumps without human review.

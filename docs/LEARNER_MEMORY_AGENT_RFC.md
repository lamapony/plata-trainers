# Learner Memory Agent RFC

This is a forward-looking technical note, not a current product commitment. The working name `OpenClaw` means a small account-resident learner agent that remembers a student through explicit learning evidence, not through opaque chat history.

## Why This Matters

Duolingo-scale personalization is built around large learner models, content difficulty models, and massive usage data. Platå cannot and should not compete by copying that surface. The useful open-source move is different: make personalization inspectable, portable, and learner-owned.

The long-term bet:

- the learner can see what the system believes about them;
- every recommendation can cite evidence;
- memory can be exported, deleted, replayed, and debugged;
- AI can help interpret the evidence, but cannot silently rewrite it.

## Product Shape

`OpenClaw` should behave less like a mascot and more like a quiet study operator:

- remembers durable weak signals, repaired signals, preferred contexts, stale skills, and recurring traps;
- notices when a learner repeatedly fails the same underlying competency across different lessons; the deterministic memory layer now proves this with `root_competency_trap` facts before any model call is introduced;
- proposes the next short practice block with a reason;
- can explain a recommendation in learner language;
- can generate or select a repair prompt only from approved lesson contracts;
- never hides the evidence ledger that produced the advice.

The agent must not become a dependency for basic practice. The app should still work without an account, network, or model call.

## Privacy Contract

The first version should keep the existing local-first promise.

Required constraints before any account memory:

- local memory model works without signup;
- export/import remains complete enough to move the learner profile;
- raw expected/given answer text stays out of default event payloads;
- user can inspect the memory facts and delete individual facts;
- account sync is optional, not required for practice;
- account memory stores derived learning facts by default, not full transcripts;
- any AI-written advice must cite the memory facts it used;
- tests prove that private raw answer text does not leak into event, memory, sync, or agent payloads by default.

If account sync is added later, the target should be a memory vault, not a generic analytics backend.

## Technical Layers

1. Local adaptive learner model

   Derive a student model from existing trainer state, event logs, evidence ledger rows, repair closures, practice-plan completions, and skill graph roots. This should run entirely in the browser and in CI fixtures.

2. Memory fact schema

   Convert noisy attempts into durable facts:

   - `weak_signal`
   - `repaired_signal`
   - `stale_skill`
   - `stable_strength`
   - `recurring_trap`
   - `preferred_context`
   - `next_review_due`

   Each fact needs a source event fingerprint, confidence, timestamps, and expiry/decay policy.

3. Memory inspector

   Add a dashboard view where the learner can inspect, export, and delete the facts used for personalization. If the model is wrong, the learner should see why.

4. Personalization planner

   Upgrade the planner so it can rank next steps from memory facts, not only raw local attempts. The trace must stay machine-readable and diffable.

5. Optional account vault

   Only after the local model is useful: add optional account sync for memory facts. The account should synchronize a compact, auditable learner profile across devices. The first local contract is `PlataMemoryVault`: a derived-facts-only payload with source fingerprints, corrections, and privacy flags, explicitly excluding trainer state, event logs, practice plans, source event ids, and raw answer text. Vault import is a merge operation: local tombstones and learner corrections win, source-fingerprinted duplicates collapse deterministically, and standalone vault payloads do not replace trainer state or active plans.

6. Account-resident agent

   `OpenClaw` reads the learner memory vault, the lesson catalog, and the skill graph. It can propose practice, explain drift, and prepare repair sessions. It should not mutate the canonical memory ledger without recording an event.

7. Agent evaluation harness

   Fixed learner profiles should test whether the agent gives stable, useful, evidence-backed advice. Bad advice should fail CI in the same spirit as dashboard snapshot diffs. The first version is deterministic: `PlataAdvisor` emits local advice from cited memory facts and planner decisions, `check:advisor` snapshots the result, and `check:personalization-eval` removes memory facts to prove planner/advisor drift stays explainable before any model call is allowed into the loop.

## Open Questions

- Should account memory be encrypted client-side before sync?
- What minimum memory schema is useful before introducing any LLM?
- Can the agent run with a small local model for explanations, while deterministic code keeps the ranking?
- How should a learner correct a false memory fact without destroying useful historical evidence?
- What is the smallest hosted service that preserves the static, forkable spirit of the project?

## Success Criteria

The project can claim stronger personalization only when:

- a learner can return after weeks and get a better next step than simple streak/recent-error logic;
- the recommendation is explainable from facts the learner can inspect;
- deleting a memory fact changes recommendations predictably;
- exported profiles replay into the same memory state;
- CI catches personalization regressions through deterministic fixtures;
- account sync, if present, is optional and auditable.

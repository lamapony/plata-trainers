# Platå Development Journal

This journal tracks technical bets that make the project more valuable as an open-source learning system. It is deliberately narrower than the public roadmap: each item should produce inspectable code, a contract, or a QA check.

## Deep Technical Track

- [x] Document the next technical direction as a checklist instead of loose ideas.
- [x] Add an event-sourced learning log that can be derived from existing local trainer state.
- [x] Make exported profiles replay-ready so a bug report can include an auditable local learning timeline.
- [x] Add deterministic replay checks that rebuild progress facts from events.
- [x] Add a planner decision trace so every recommendation can explain its inputs and score.
- [x] Add mutation-style pedagogy tests that prove bad mastery/remediation contracts fail CI.
- [x] Build a counterfactual learner simulator for checking whether lesson edits improve or harm repair paths.
- [x] Add a profile replay debugger for maintainers, starting from JSON exports rather than user screenshots.
- [x] Compile mastery signals into a skill graph coverage report so gaps are visible before new content is added.
- [x] Add deterministic snapshot tests for the dashboard recommendation surface.
- [x] Prove dashboard recommendation snapshots catch planner and evidence drift with mutation tests.
- [x] Publish a project health manifest that links QA gates, public reports, and deterministic fixtures.
- [x] Add a compact diff for dashboard recommendation snapshot changes.
- [x] Add a lesson exercise audit gate for pedagogical contradictions and known Danish slips.
- [x] Add a PR-facing dashboard snapshot diff workflow step.
- [x] Add a unified PR review report across quality, dashboard recommendations, demo learner, Today program, and personalization trajectory.
- [x] Define the local adaptive learner model before adding any account memory.
- [x] Add an inspectable learner memory fact schema derived from the event log.
- [x] Build a memory inspector so learners can see, export, and delete personalization facts.
- [x] Prototype optional account memory as a vault for derived learning facts, not raw answer history.
- [x] Add a strict agent handoff packet so a future account-resident helper receives cited tasks instead of raw learner history.
- [x] Reject embedded heavy agent runtime scope in favor of a lightweight companion and read-only Hermes bridge.
- [x] Add deterministic companion cards and Hermes bridge briefs over advisor/handoff packets.
- [x] Promote the companion/planner route into a user-facing Today program shell.
- [x] Make the Today shell stateful across onboarding, active-route, return, and memory-review scenarios.
- [x] Publish Today shell states as a deterministic public program report.
- [x] Add PR diffs for Today shell state drift.
- [x] Publish a product capability map that ties user-facing claims to gates, reports, docs, and source files.
- [x] Render the capability map as a user-facing public program page.
- [x] Add a contributor proof quickstart that builds the core local proof artifacts before the full QA suite.
- [ ] Evaluate external Hermes/OpenClaw-style integrations as optional explainers, not sources of truth; see [Companion Architecture](./COMPANION_ARCHITECTURE.md).

## Current Sprint

- [x] Introduce `PlataEvents` as a shared browser-safe event contract.
- [x] Derive attempt, repair, signal-reopen, and practice-plan events without changing storage writes.
- [x] Keep event payloads privacy-conscious by excluding raw expected/given answer text.
- [x] Include an event-log payload in dashboard profile export.
- [x] Cover the event contract with smoke tests and the full project check.

## Planner Trace Sprint

- [x] Attach a machine-readable `trace` to lesson, drill, and dashboard planner decisions.
- [x] Record the rule, selected target, input facts, score breakdown, reasons, and stable fingerprint.
- [x] Preserve planner traces inside saved practice-plan steps and exported profile JSON.
- [x] Keep trace payloads privacy-conscious by stripping raw answer/prompt-style text keys.
- [x] Cover planner traces in planner and dashboard smoke tests.

## Planner Mutation Sprint

- [x] Audit every gold mastery signal through the real kernel -> planner -> practice-plan route.
- [x] Prove unknown competency ids fail the planner contract.
- [x] Prove missing or mistargeted remediation scenes fail the planner contract.
- [x] Prove missing remediation action/evidence fails the planner contract.
- [x] Include the mutation suite in `npm run check`.

## Counterfactual Simulator Sprint

- [x] Simulate every declared gold learner profile as baseline repair pressure.
- [x] Compare baseline lessons with mutated lesson variants using the same learner behavior.
- [x] Report `correctDelta`, `wrongDelta`, `repairLoadDelta`, weak-signal deltas, and ending drift.
- [x] Prove stricter answer edits can create new repair pressure for a successful learner.
- [x] Prove over-lenient edits can mask repair pressure for a weak learner.
- [x] Include the counterfactual simulator in `npm run check`.

## Profile Replay Debugger Sprint

- [x] Add a maintainer CLI that reads dashboard profile JSON exports.
- [x] Replay exported event logs into trainer, signal, item, and practice-plan facts.
- [x] Derive a replay timeline from legacy exports that do not contain `eventLog`.
- [x] Warn on event fingerprint and replay-count mismatches.
- [x] Keep debug reports free of raw expected/given learner answer text.
- [x] Include profile replay smoke tests in `npm run check`.
- [x] Include learner memory correction records in replay debug reports without exposing raw answer text.

## Skill Coverage Debug Sprint

- [x] Tighten the plan from a generic coverage page to a CI contract for competency/content drift.
- [x] Compile the competency graph, catalog, and gold lesson mastery maps into a JSON report.
- [x] Fail on live contract errors: unmapped mastery tags, graph mismatches, duplicate graph tags, unsimulated signals, and empty root skills.
- [x] Keep planned graph tags without content as warnings instead of build blockers.
- [x] Publish `reports/skill-coverage.json` in the Pages artifact beside the quality report.
- [x] Include mutation smoke tests in `npm run check`.

## Dashboard Recommendation Snapshot Sprint

- [x] Add a deterministic dashboard VM harness with a fixed clock.
- [x] Snapshot the empty-profile recommendation surface so the preferred first path is reviewable.
- [x] Snapshot a weak-mastery profile so repair priority, root skill, planner trace, plan route, and evidence ledger drift are visible.
- [x] Normalize volatile fields out of the fixture while preserving route ids, trace fingerprints, scores, and decision rules.
- [x] Add an explicit `--update` path for intentional baseline changes.
- [x] Include the snapshot check in `npm run check`.

## Dashboard Snapshot Mutation Sprint

- [x] Allow the dashboard snapshot harness to run against a temporary source root.
- [x] Mutate the preferred-entry planner scoring and prove the due-card snapshot changes.
- [x] Mutate the repair trace rule and prove the trace snapshot changes.
- [x] Mutate the evidence ledger open-mastery row and prove the ledger snapshot changes.
- [x] Include the dashboard snapshot mutation suite in `npm run check`.

## Project Health Manifest Sprint

- [x] Compile required `npm run check` gates into a machine-readable contract.
- [x] Link public reports: quality, skill coverage, Today shell, capability map, and project health.
- [x] Verify QA and Pages workflows still run the full check on Node 24.
- [x] Verify deterministic dashboard fixtures are fresh and mutation-backed.
- [x] Fail on missing gates and stale fixtures in smoke tests.
- [x] Publish `reports/project-health.json` in the Pages artifact.

## Product Capability Map Sprint

- [x] Define the product surface as capabilities instead of scattered README claims.
- [x] Link each capability to proof gates, public reports, source files, docs, and user-facing surfaces.
- [x] Add `scripts/build-capability-map.js` with text, JSON, and file output modes.
- [x] Add `check:capability-map` with smoke tests for missing gate and missing Pages publishing regressions.
- [x] Publish `reports/capabilities.json` in the Pages artifact.
- [x] Include the capability map in project health so public claims stay checked by `npm run check`.
- [x] Add `program.html` and `program.js` as a user-facing shell over the generated capability map.
- [x] Add `check:program-page` so the public program page cannot drift away from `reports/capabilities.json`.

## Dashboard Snapshot Diff Sprint

- [x] Add a compact dashboard snapshot diff CLI with text and JSON output.
- [x] Compare scenario membership, candidate order, due cards, decision traces, practice-plan routes, evidence ledger rows, and root-skill diagnostics.
- [x] Mark removed open evidence and root-skill diagnostics as regressions.
- [x] Support `--fail-on-regression` and `--fail-on-change` automation modes.
- [x] Include dashboard snapshot diff smoke tests in `npm run check`.
- [x] Run the dashboard snapshot diff in pull-request QA against base/head snapshots.

## Unified Review Report Sprint

- [x] Add `scripts/build-review-report.js` to combine quality, dashboard recommendation, demo learner, Today program, and personalization trajectory diffs.
- [x] Preserve each surface status while grouping regressions, review changes, improvements, and informational drift.
- [x] Add `check:review-report` to prove unchanged, review-only, regression, JSON, and fail-mode behavior.
- [x] Make pull-request QA build JSON diff artifacts and fail through the unified report.
- [x] Include the unified report in project health workflow checks.
- [x] Add Today program diff artifacts to pull-request review summaries.
- [x] Write `.dist/review-report.json` and append a Markdown summary to `$GITHUB_STEP_SUMMARY` for pull-request reviewers.
- [x] Cap PR review Markdown by severity section with stable ordering, truncated messages, and `+N more` pointers to the full JSON artifact.
- [x] Add a golden PR review fixture that exercises all surfaces, capped Markdown summaries, full JSON output, stable ordering, and fail-on-regression behavior end to end.

## Contributor Proof Quickstart Sprint

- [x] Add `scripts/build-quickstart-proof.js` to build demo learner, capability map, project health, and golden PR review artifacts into `.dist/quickstart-proof/`.
- [x] Add `check:quickstart-proof` so the quickstart command, artifacts, Markdown summary, and golden review links stay healthy.
- [x] Document the proof-first contributor path in README and CONTRIBUTING.
- [x] Link the quickstart gate and source files from the public GitHub proof capability.

## Public Proof Page Sprint

- [x] Add `proof.html` and `proof.js` as the readable public surface over demo learner, capability map, project health, quickstart proof, and golden PR review artifacts.
- [x] Publish quickstart proof artifacts into the GitHub Pages artifact under `reports/quickstart-proof/`.
- [x] Add `check:proof-page` so report loading, hero links, quickstart commands, health guarantees, and review fixture rendering stay deterministic.
- [x] Link the proof page from public navigation, README, sitemap, project health, and the product capability map.

## Companion Architecture Sprint

- [x] Document the no-heavy-embedded-agent decision in [Companion Architecture](./COMPANION_ARCHITECTURE.md).
- [x] Add `shared/plata-companion.js` as the deterministic user-facing projection over advisor and handoff packets.
- [x] Export `plata.companion-card` with one next action, cited facts, guardrails, and a stable `cmp-` fingerprint.
- [x] Export `plata.hermes-bridge-brief` as a read-only packet for external Hermes/OpenClaw-style tools.
- [x] Render the dashboard recommendation as a Study companion card while preserving planner/advisor traces.
- [x] Add `check:companion` and project-health coverage for deterministic, cited, read-only bridge behavior.

## Program Shell Sprint

- [x] Add a top-level `Today` dashboard section so the next practice step is visible before diagnostics.
- [x] Reuse the same resolved planner route for Today and the detailed practice plan.
- [x] Show companion headline, rationale, progress, memory facts, guardrails, and citations in one user-facing shell.
- [x] Fall back to a planner-route shell when no cited memory facts exist yet.
- [x] Cover starter and memory-backed Today states in dashboard smoke tests.
- [x] Add explicit Today program states for first session, active saved route, lesson return, and due memory review.
- [x] Keep the state classifier deterministic over existing planner, URL handoff, and memory facts.
- [x] Smoke-test each state so product wording stays aligned with planner evidence.
- [x] Publish a deterministic Today program report for user-facing shell states.
- [x] Add `check:today-program-report` and project-health coverage for the report.
- [x] Add `check:today-program-diff` so user-facing Today state drift is PR-reviewable.

## Lesson Exercise Audit Sprint

- [x] Remove the `lesson-01` name whitelist that contradicted “Any name works.”
- [x] Fix incidental Danish slips in the B2 job-followup distractors and endings.
- [x] Add an exercise audit for contradictory completion gates, duplicate exercise answers, simulation accept/reject drift, and a small editorial phrase watchlist.
- [x] Include the exercise audit in `npm run check` and project health.

## Learner Memory Agent Track

- [x] Document `OpenClaw` as a future account-resident learner memory agent, not a mascot or opaque chatbot: [Learner Memory Agent RFC](./LEARNER_MEMORY_AGENT_RFC.md).
- [x] Specify a local memory fact schema with source event fingerprints, confidence, decay, and stable fact ids.
- [x] Compile memory facts from attempts, repair closures, and practice-plan completions.
- [x] Add deterministic fixtures for returning learners, stale skills, repaired signals, and recurring traps.
- [x] Upgrade planner traces so every memory-based recommendation cites the facts it used.
- [x] Add a dashboard memory inspector before any account sync.
- [ ] Keep basic practice local-first and account-free.
- [ ] Prototype optional account sync only after local memory improves recommendations.
- [x] Gate any AI agent advice through replayable profiles and privacy-leak tests.

## Local Learner Memory Sprint

- [x] Add `PlataMemory` as a browser-safe compiler from redacted event logs to durable learner memory facts.
- [x] Emit `weak_signal`, `repaired_signal`, `recurring_trap`, `stable_strength`, `stale_skill`, `preferred_context`, and `next_review_due` facts.
- [x] Add source event ids, source fingerprints, confidence, status, expiry, evidence rows, and privacy markers to each fact.
- [x] Prove memory facts are deterministic and do not include raw expected/given answer text.
- [x] Include the memory smoke test in `npm run check` and project health.

## Local Adaptive Learner Model Sprint

- [x] Add `PlataLearnerModel` as the deterministic scoring policy built from derived memory facts.
- [x] Rank facts with explicit kind weights, confidence boosts, age adjustments, and transfer boosts.
- [x] Emit a cited recommended focus, ranked priorities, open risks, review queue, strengths, root competencies, guardrails, and a stable fingerprint.
- [x] Export `learnerModel` beside memory facts in dashboard profile JSON.
- [x] Snapshot-test fixed learner profiles across continue, review, maintain, recurring repair, and cross-lesson root repair cases.
- [x] Mutation-test raw-text leaks, citationless focus, missing source fingerprints, lost root-competency focus, raw history payloads, and fingerprint drift.
- [x] Include `check:learner-model` in `npm run check` and project health deterministic fixture reporting.

## Learner Model Alignment Sprint

- [x] Add an alignment gate proving `PlataLearnerModel` focus facts are planner-selected when planner decisions exist.
- [x] Require advisor citations to include the learner-model focus fact for fixed learner profiles.
- [x] Counterfactually remove the learner-model focus fact and prove planner/advisor citations move away from it.
- [x] Mutation-test root-priority drift, corrupted planner citation ids, dropped advisor focus citations, and review-due handling drift.
- [x] Include `check:learner-model-alignment` and `check:learner-model-alignment-mutations` in `npm run check` and project health.

## Dashboard Memory Inspector Sprint

- [x] Add a dashboard section that renders local learner memory facts in plain language.
- [x] Show fact kind, confidence, source fingerprint, evidence rows, trainer context, and signal context.
- [x] Let the learner hide individual memory facts without mutating the underlying event log.
- [x] Let the learner restore hidden facts when they want the full local profile back.
- [x] Include visible facts, memory summary, fingerprint, and hidden fact ids in portable profile export.
- [x] Restore hidden fact ids on profile import and clear stale memory deletions on legacy imports.
- [x] Cover the inspector, hide/restore controls, and memory export with dashboard smoke tests.

## Memory-Aware Planner Sprint

- [x] Pass visible learner memory facts into dashboard recommendation decisions.
- [x] Boost repair priority when `weak_signal` or `recurring_trap` facts support the selected signal.
- [x] Recommend review from `next_review_due` and `stale_skill` facts even when raw trainer stats look healthy.
- [x] Store cited memory fact ids, kinds, signals, confidence, and source fingerprints in planner traces.
- [x] Render memory citations in practice-plan explanations without exposing raw answer text.
- [x] Keep hidden memory facts out of the next dashboard recommendation pass.
- [x] Add planner, dashboard, and snapshot coverage for memory-aware recommendation drift.

## Learner Memory Fixture Sprint

- [x] Add JSON learner profile fixtures for returning context, stale review, repaired signal, and recurring trap cases.
- [x] Store expected event fingerprints, memory fingerprints, required fact ids, source fingerprints, and summaries.
- [x] Store expected planner kind, trace rule, score, fingerprint, selected memory facts, and memory explanation rows where relevant.
- [x] Prove private raw answer text in fixture events does not leak into memory facts or planner traces.
- [x] Add an update path for intentional fixture drift: `node scripts/smoke-memory-fixtures.js --update`.
- [x] Include learner memory fixtures in `npm run check` and project health deterministic fixture reporting.

## Agent Advice Gate Sprint

- [x] Add `PlataAdvisor` as a deterministic local advice layer underneath any future OpenClaw model call.
- [x] Generate advice only from planner decisions and cited learner memory facts.
- [x] Require every advice object to include cited fact ids, source fingerprints, next action, guardrails, and a trace fingerprint.
- [x] Add advisor snapshots for returning context, stale review, repaired signal, and recurring trap learner profiles.
- [x] Prove advisor output does not include raw answer text from fixture events.
- [x] Include advisor fixtures in `npm run check` and project health deterministic fixture reporting.

## Dashboard Advisor Receipt Sprint

- [x] Render the deterministic advisor inside the dashboard practice-plan surface.
- [x] Tie the receipt to the current actionable plan step instead of a free-floating chatbot surface.
- [x] Show the planner rule, advice rule, trace fingerprint, cited memory fact ids, source fingerprints, next action, and privacy guardrails.
- [x] Keep hidden learner memory facts out of advisor receipts by using the same visible memory bundle as dashboard recommendations.
- [x] Add dashboard smoke and snapshot coverage so advisor receipt drift is reviewable.

## Learner Memory Correction Sprint

- [x] Add a separate correction journal for learner-marked false memory facts.
- [x] Keep corrections distinct from temporary hidden facts.
- [x] Remove corrected facts from planner and advisor inputs while preserving source fingerprints for audit.
- [x] Export and import correction records in portable profile JSON.
- [x] Clear stale correction records on legacy imports.
- [x] Cover correction, restore, planner rebuild, advisor rebuild, and profile portability in dashboard smoke tests.

## Memory Correction Audit Sprint

- [x] Render corrected memory records as an inspectable audit trail.
- [x] Show corrected fact id, kind, signal, source fingerprint, and correction timestamp.
- [x] Let learners restore one corrected fact without clearing every correction.
- [x] Keep restore-all for quick profile recovery.
- [x] Cover visible audit rows, individual restore, imported corrections, and empty audit cleanup in dashboard smoke tests.

## Profile Replay Memory Corrections Sprint

- [x] Add memory fingerprint, visible fact count, hidden fact count, and corrected fact count to maintainer replay reports.
- [x] List corrected memory fact ids, kind, signal, trainer id, source fingerprint, reason, and timestamp in `debug-profile-replay`.
- [x] Keep correction debug output privacy-conscious by ignoring raw expected/given fields.
- [x] Cover JSON report output and CLI text output in profile replay smoke tests.

## Memory Correction Contract Sprint

- [x] Add a dedicated `check:memory-corrections` QA gate.
- [x] Validate correction record fact ids, reasons, timestamps, kind/signal/trainer context, and source fingerprints.
- [x] Prove duplicate corrected facts fail.
- [x] Prove raw expected/given answer keys and private answer text fail.
- [x] Include the correction contract in `npm run check` and project health.

## Personalization Evaluation Harness Sprint

- [x] Add a dedicated `check:personalization-eval` QA gate.
- [x] Run fixed learner profiles through memory, planner, and advisor as one contract.
- [x] Prove planner-selected memory facts are cited by advisor output with source fingerprints.
- [x] Remove relevant memory facts and prove recommendations drift predictably.
- [x] Split memory-backed repair advice from current-evidence repair advice when no memory facts are cited.
- [x] Include the evaluation harness in `npm run check` and project health.
- [x] Add `check:personalization-mutations` to prove broken advisor/planner personalization contracts fail CI.

## Personalization Trajectory Replay Sprint

- [x] Add a staged replay harness that evaluates personalization over time, not only fixed profile snapshots.
- [x] Prove a repair lifecycle transitions from weak signal to repaired signal, exact review-due boundary, post-review maintenance, and reopened recurring trap.
- [x] Prove cross-lesson agency misses become a `root_competency_trap` only after evidence spans multiple lessons.
- [x] Require learner-model focus facts to stay advisor-cited and planner-selected at each trajectory stage.
- [x] Mutation-test dropped `signal.reopened` handling, review boundary drift, root learner-model priority drift, and broken planner root-memory selection.
- [x] Include `check:personalization-trajectory` and `check:personalization-trajectory-mutations` in `npm run check` and project health.
- [x] Add a PR-facing trajectory diff that compares base/head stage rules, fact kinds, citations, root competencies, and fingerprints.
- [x] Mark lost stages, protected memory fact kinds, root competencies, and protected model/planner/advisor rule downgrades as regressions.
- [x] Run the trajectory diff in pull-request QA with `--fail-on-regression`.

## Cross-Lesson Memory Sprint

- [x] Emit `root_competency_trap` memory facts when weak signals from different lessons share one root competency.
- [x] Add a cross-lesson agency fixture spanning `passive-agency` and `professional-email-agency`.
- [x] Let planner traces cite root competency facts while routing to a concrete repair scene.
- [x] Give advisor a distinct `advisor.repair.root-competency` rule for transferable root-skill repair.
- [x] Extend personalization mutation tests so dropping root competency facts fails CI.

## Account Memory Vault Sprint

- [x] Add `PlataMemoryVault` as a browser-safe account-sync contract for derived learner memory.
- [x] Export a compact `memoryVault` beside full dashboard backup JSON without replacing local-first profile export.
- [x] Strip trainer state, event logs, practice plans, source event ids, and raw answer fields from vault payloads.
- [x] Preserve root competency facts, source fingerprints, hidden fact ids, and correction records.
- [x] Merge imported vaults deterministically so deletions/corrections beat incoming facts and repeated imports are idempotent.
- [x] Let dashboard import standalone vault payloads without clearing trainer state or active practice plans.
- [x] Include `check:memory-vault` in `npm run check` and project health.

## Agent Memory Brief Sprint

- [x] Add `PlataMemoryBrief` as the agent-readable context built only from memory vault facts.
- [x] Export `memoryBrief` beside `memoryVault` in dashboard profile JSON.
- [x] Snapshot-test briefs for fixed learner profiles, including root competency and due-review focus.
- [x] Mutation-test raw-text leaks, missing focus citations, source-fingerprint drift, and lost root competency focus.
- [x] Include `check:memory-brief` in `npm run check` and project health.

## Agent Handoff Sprint

- [x] Add `PlataAgentHandoff` as the model-facing packet built only from `PlataMemoryBrief`.
- [x] Include one task, required citations, allowed actions, blocked actions, response contract, guardrails, trace, and stable fingerprint.
- [x] Export `agentHandoff` beside `memoryBrief` in dashboard profile JSON.
- [x] Snapshot-test handoff packets for fixed learner profiles, including due-review and root-competency repair paths.
- [x] Mutation-test raw-text leaks, missing citations, disabled citation requirements, missing action constraints, lost root-skill focus, and fingerprint drift.
- [x] Include `check:agent-handoff` in `npm run check` and project health deterministic fixture reporting.

## Demo Learner Mode Sprint

- [x] Add a read-only `dashboard.html?demo=learner` mode that renders a deterministic in-memory B2 plateau profile.
- [x] Seed the demo with real mastery signals across the radiator and job-followup lessons: weak signals, a closed repair, a reopened passive-agency trap, and a due review.
- [x] Keep demo state out of `localStorage`: no trainer states, practice plan, memory vault, hidden facts, or correction records are persisted.
- [x] Disable profile import in demo mode while still allowing export of the inspectable demo JSON payload.
- [x] Add user-facing entry points from the homepage and public program map.
- [x] Cover the mode in dashboard smoke tests, including companion-backed Today, memory citations, evidence ledger rows, and no storage writes.
- [x] Add `reports/demo-learner.json` as a generated public demo snapshot report with read-only, privacy, companion, and rich-profile guarantees.
- [x] Include `check:demo-learner-report` in `npm run check`, Pages publishing, project health, and the product capability map.
- [x] Add a PR diff for `reports/demo-learner.json` so read-only, memory, companion, and profile drift gets separate review labels.
- [x] Include demo learner drift in the unified PR review report, GitHub Actions QA, project health, and the product capability map.

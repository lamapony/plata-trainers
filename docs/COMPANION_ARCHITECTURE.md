# Plata Companion Architecture

This note records the lightweight companion decision. Plata should not embed a full autonomous agent runtime. Hermes, OpenClaw-style gateways, and similar tools are useful external environments, but Plata's core value is a small, inspectable learning program.

## Decision

- Plata ships a deterministic `PlataCompanion` card, not a heavy embedded agent.
- The companion can explain one next step, cite memory facts, preserve the planner action, and expose guardrails.
- External agents are optional. When a learner wants to use Hermes or another agent surface, Plata exports a read-only `plata.hermes-bridge-brief`.
- The external agent may explain or schedule around Plata's recommendation, but it must not become the source of truth for memory, planner state, or practice routing.

## Capability Map

| Technical layer | User-facing shape | Contract |
| --- | --- | --- |
| `PlataEvidence` | What changed | Evidence rows explain open, closed, reopened, missed, and correct signals. |
| `PlataMemory` | What the system believes | Derived learner facts cite source fingerprints and exclude raw answer text. |
| `PlataLearnerModel` | What matters most | A local adaptive profile ranks focus areas from cited memory facts. |
| `PlataPlanner` | What to do now | One practice route with traceable scoring and explanations. |
| `PlataAdvisor` | Why this step | Deterministic advice based on planner decisions and cited facts. |
| `PlataAgentHandoff` | Strict machine packet | A constrained task packet for future or external helpers. |
| `PlataCompanion` | Friendly program shell | A learner-facing card with one next action, citations, guardrails, and fingerprint. |
| `Today program report` | Inspectable program shell states | Public JSON proving onboarding, active-route, return, and memory-review states stay evidence-backed. |
| `plata.hermes-bridge-brief` | Optional external bridge | Read-only brief for Hermes-style tools; no raw history, no memory writes, no planner override. |

## Companion Contract

The companion can:

- show one next practice action;
- explain the cited evidence;
- open the cited route;
- ask the learner to inspect memory when evidence is thin.

The companion cannot:

- act as an autonomous agent;
- invent uncited learner traits;
- change Plata memory directly;
- override the deterministic planner.

Every card must include:

- `companionType: "plata.companion-card"`;
- one `nextAction`;
- `citedFacts`;
- `guardrails.requiresModel === false`;
- `guardrails.usesOnlyCitedFacts === true`;
- `guardrails.externalAgentOptional === true`;
- a stable `cmp-` fingerprint.

## Hermes Bridge

The bridge brief is intentionally smaller than an agent handoff. It is for an external assistant that already exists in the learner's workflow.

Hermes can:

- restate the companion card in learner-friendly language;
- help the learner start the cited next action;
- suggest a small reminder around that action;
- ask for confirmation when evidence is insufficient.

Hermes cannot:

- override Plata's deterministic recommendation;
- invent uncited learner traits;
- request raw answer history;
- write Plata memory or planner state.

`scripts/smoke-companion.js` proves the card and bridge remain deterministic, cited, read-only, and free of raw learner answer text across fixed learner profiles. `scripts/smoke-today-program-report.js` proves the user-facing Today shell keeps its four core states deterministic and free of raw learner answer leaks. `scripts/smoke-today-program-diff.js` makes user-facing state drift reviewable in pull requests.

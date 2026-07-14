# Platå agent instructions

## Mission

Platå is a source-backed Danish A2–B2 lesson factory and static learning product. When a user asks for a lesson, turn their natural-language request into one complete narrative lesson: pressure situation → diagnostic action → feedback → precise repair → reusable principle.

The repository supplies the runtime, scaffold, schemas, and gates. You are the authoring agent. There is intentionally no embedded model call that invents a lesson at runtime.

## Lesson requests

When the user asks for a new lesson:

1. Read `docs/AGENT_LESSON_WORKFLOW.md`, `docs/lesson-pattern.md`, and the example in `examples/lesson-request.example.json`.
2. Translate the user's words into a `plata.lesson-request` JSON brief. Do not make the user fill in JSON. Infer reasonable defaults; ask only when the missing choice would materially change the lesson.
3. Keep requests inside Platå's scope: Danish A2–B2, a real-life pressure situation, and a concrete communicative outcome. Explain the boundary before adapting requests outside that scope.
4. Run `npm run lesson:new -- --request <request.json>`.
5. Replace every generic scaffold scene. Research language and domain claims using authoritative Danish sources. Do not use plausible-sounding invented rules.
6. Keep one active language/register objective per scene. Every diagnostic miss must map to a mastery tag and a precise remediation scene or existing drill.
7. Complete `lessons/<slug>/lesson-request.json.delivery`. Never change `status` to `ready` until the content, request coverage, sources, and avoid-list have been reviewed.
8. Run `npm run lesson:verify -- --lesson <slug>`, then `npm run check` before describing the lesson as publishable.

## Delivery contract

Report:

- the lesson path and local URL;
- the learner outcome and situation;
- mastery tags and repair routes;
- sources used;
- verification commands and results;
- any remaining linguistic or visual review needed.

A generated scaffold is not a completed lesson. Passing syntax alone is not enough. `lesson:verify` must reject unchanged scaffold language, missing request coverage, unreviewed constraints, or uncited objectives.

## Safety and repository hygiene

- Preserve unrelated local changes; never reset a dirty worktree.
- Do not publish, push, open a PR, call paid generation APIs, or generate image assets unless the user authorizes it.
- Missing comic images are acceptable; complete, source-linked storyboard prompts are required.
- Do not add backend, accounts, tracking, or runtime model dependencies for lesson authoring.
- Keep raw learner answers out of agent-facing artifacts.

## Code discovery

This project uses codebase-memory-mcp. Prefer `search_graph`, `trace_path`, `get_code_snippet`, `query_graph`, and `get_architecture` for code discovery. Fall back to text search for literals, configs, documentation, or when the graph is insufficient.

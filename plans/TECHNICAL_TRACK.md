# Platå Factory: Technical Track

## Paradigm: Language as Athletic Training

Learning Danish is not about consuming content. It's about:
- **Exercises** = sets/reps in the gym
- **Metrics** = weight, reps, rest time, form breakdown
- **Contexts** = why you're doing this lift (supplied by product track)
- **Agent feedback** = coach reads your log and adjusts the program

## Two-Track Structure

```
                     ┌─────────────────────────────────┐
  Dima + Agent A     │  Product Track (lessons, UX,     │
  (runs separately)  │  contexts, product polish)       │
                     │  PLA-6..PLA-9                    │
                     └─────────────────────────────────┘

                     ┌─────────────────────────────────┐
  Factory            │  Technical Track (engine,        │
  (Paperclip)        │  metrics, agent loops)           │
                     │  PLA-10..PLA-13                  │
                     └─────────────────────────────────┘
```

## Technical Track Architecture

### 1. Exercise Spec Format (PLA-10)

A JSON schema that defines an exercise independently of its rendering:

```json
{
  "id": "v2-inversion-corridor",
  "type": "complete-sentence",
  "level": "B1",
  "language": {
    "phenomena": ["v2-inversion", "fronted-adverbial"],
    "stimulus": "I morgen ___ (jeg/tage) til lægen",
    "correct": ["tager jeg", "jeg tager"],
    "distractors": ["jeg tager ikke"],
    "weakTags": ["v2-inversion", "fronted-adverbial-practice"]
  },
  "metrics": {
    "accuracy": true,
    "responseTimeMs": true,
    "attempts": true
  }
}
```

The spec is what agents generate. The engine renders it into whatever UI is available (web, CLI, voice).

### 2. Metric Definitions (PLA-11)

What the factory measures, how, and what "weak" means:

| Metric | What | Interpretation |
|--------|------|----------------|
| `accuracy` | % correct first attempt | < 60% = needs easier variant |
| `responseTime` | ms to answer | > 8s = pattern not automatic |
| `attempts` | tries before correct | > 2 = not acquired yet |
| `weakTags` | which phenomena failed | cluster → deload |
| `sessionVolume` | exercises per session | increase if accuracy > 80% |
| `spacing` | days since last attempt | automatic scheduling |

### 3. Agent Feedback Loop (PLA-12)

Agent reads metric vector → produces training decision:

```
[Metric Vector] → [Coach Agent] → [Training Decision]
                                    ↓
            ┌───────────────────────────────────┐
            │ - increase/decrease load           │
            │ - change exercise type             │
            │ - deload on weak phenomenon        │
            │ - schedule next session spacing    │
            └───────────────────────────────────┘
```

### 4. Exercise Generation Engine (PLA-13)

Spec → rendered exercise. Seed → variant over variants.

Agent workflow:
1. Define spec: `{phenomenon: "v2", level: "B1", variants: 10}`
2. Engine generates 10 variants from spec template
3. Each variant produces metric data when solved
4. Metric data informs next generation

## Adapter Strategy

Technical track only starts reliably when adapter balance exists:
- Codex: use for rendering/code work (gpt-5.5, `service_tier=fast`)
- Hermes/DeepSeek: use for generation/planning (when balance available)
- OpenRouter subagent: test for delegating variant generation to cheap models

Until then, specs and docs are written directly.

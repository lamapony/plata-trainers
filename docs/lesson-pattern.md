# Platå Lesson Pattern v0.1

## Name
Scene → pressure → language → action → payoff

## Why
A Platå lesson should not be a decorated quiz. Each exercise must be an action inside a situation. The learner should feel why the phrase matters before they are asked to use it.

Platå is not a beginner course. Its job is to help learners overcome the plateau: they already have fragments of Danish, but they hesitate when context, tone, speed, or social pressure enters the scene.

## Scene contract
Each scene should include:

```js
{
  id: "stable-id",
  type: "choice | input | match | completion",
  eyebrow: "Scene N · Short label",
  title: "A narrative beat, not an exercise title",
  pressure: "What is at stake right now?",
  narrative: "What is happening in the world?",
  dialogue: [{ speaker: "Lene", line: "..." }],
  notice: "One compact linguistic observation.",
  prompt: "The action the learner must take.",
  carry: "What this scene stores for later reuse.",
  tags: ["skill", "word", "pattern"]
}
```

## Beat rules
1. **Pressure first** — why does the learner need Danish right now?
2. **Notice, don't lecture** — one small pattern, no grammar dump.
3. **Action is diegetic** — choose a door, answer a person, match a sign.
4. **Feedback changes the scene** — wrong answer is a plausible social/world consequence.
5. **Carry-forward** — every scene should tell what will return later.

## Density rules
- One scene may teach only one new active pattern.
- A new word should appear in at least two modes: sign/dialogue/action/feedback.
- If a word is only shown once, it is flavour, not a learning target.
- Avoid “correct/wrong” copy; feedback should explain the situation.
- Never introduce a grammar term unless the scene needs it.

## Lesson 01 application
Lesson 01 now uses:
- `pressure` for stakes
- `dialogue` for lived language
- `notice` for micro-patterns
- `carry` for spaced narrative memory

The goal is not more content by volume. The goal is fewer empty clicks.

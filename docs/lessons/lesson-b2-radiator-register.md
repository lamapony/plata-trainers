# B2 Lesson Candidate — Radiator, Register, Consequence

## Working title
Det afhænger af, hvordan du siger det

## Why this is B2
B2 is not “more words”. It is control under social pressure:
- expressing a nuanced opinion;
- shifting register between official email, group chat, and workplace small talk;
- reading subtext in particles like `jo`, `da`, `vel`, `nok`, `sgu`;
- using passives and indirect wording to see who takes responsibility;
- arguing without sounding either passive or aggressive.

This is directly relevant to adult life in Denmark: housing, work, e-Boks, kommune, complaints, meetings, and disagreements where tone matters.

## Core pedagogical target
The learner should experience that Danish B2 competence is not only correctness. It is choosing the sentence that preserves the relationship while still moving the case forward.

## Language phenomena

### Register
- Formal: `Jeg vil gerne gøre opmærksom på ...`
- Neutral: `Kan vi finde en konkret dato?`
- Informal: `Det er sgu ret irriterende.`
- Too aggressive: `Jeg kræver, at ...`

### Modal particles / tone markers
- `jo` — expects shared understanding; can sound accusatory.
- `da` — softens or distances; context-sensitive.
- `vel` — uncertainty / appeal for agreement.
- `nok` — probability, understatement, resigned optimism.
- `sgu` — emphasis; intimate/informal, risky in formal contexts.
- `bare` — simplification, dismissal, or emotional fatigue.

### Grammar as consequence
- Passive hides responsibility:
  - `Der er blevet noteret en reklamation.`
  - `En håndværker vil blive sendt.`
- Active creates accountability:
  - `Vi sender en håndværker på fredag.`

## Narrative premise
It is January. Asger’s radiator has been broken for five days. The landlord answers politely but vaguely. Asger must decide how to respond, how to describe the situation to friends, and how to talk about it at work without damaging relationships.

The learner plays Asger.

## Lesson pattern
This lesson uses the Platå pattern:

```text
pressure → notice → action → feedback → carry-forward
```

But at B2, the carry-forward is not just vocabulary. It is social state:

```js
variables: {
  landlordTension: 0,
  sofiaTrust: 0,
  emilEscalation: 0,
  workplaceTrust: 0
}
```

## Scene outline

### Scene 1 — The official reply
**Type:** choice  
**Pressure:** The reply is polite and useless. You need to understand what is not being promised.

Landlord writes:

```da
Der er blevet noteret en reklamation vedrørende radiatoren.
En håndværker vil blive sendt, når det passer ind i planlægningen.
```

**Notice:** Passive voice removes the actor. Nobody says “I will send someone Friday.”

**Action:** Choose what the letter really means.

Options:
1. `De lover, at radiatoren bliver fikset hurtigt.` — wrong / too trusting.
2. `De har registreret sagen, men de lover ikke en dato.` — correct.
3. `De nægter at reparere radiatoren.` — wrong / too aggressive.

**Carry:** Passive wording can be polite and evasive at the same time.

---

### Scene 2 — Group chat tone
**Type:** match  
**Pressure:** Sofia wants to de-escalate. Emil wants a fight. Their particles reveal their stance before their argument does.

Match line to stance:

```da
Ej, det er da helt fint. Han svarer jo.
```
→ de-escalating, expects you to agree.

```da
Det er sgu ikke godt nok. Skriv igen.
```
→ supportive but escalatory.

```da
Det løser sig nok, men jeg ville bede om en dato.
```
→ cautious, practical.

```da
Han prøver bare at trække tiden.
```
→ suspicious, dismissive.

**Notice:** `jo`, `da`, `sgu`, `nok`, `bare` are not filler. They are social positioning.

**Carry:** Tone particles become variables, not vocabulary.

---

### Scene 3 — Two replies, two registers
**Type:** completion / choice  
**Pressure:** You must write both to the landlord and to Emil. The same frustration needs two different Danish versions.

Formal email:

```da
Kære udlejer. Tak for Deres svar. Jeg vil gerne bede om en mere præcis dato, da temperaturen i lejligheden er faldet til under 12 grader.
```

Bad formal alternatives:

```da
Jeg kræver, at I fikser det nu.
Det er sgu alt for koldt.
```

Informal chat:

```da
Jeg orker det simpelthen ikke, men jeg skriver og beder om en konkret dato.
```

**Notice:** Register shift is not decoration. It changes what doors stay open.

**Carry:** The app stores whether the learner chose diplomatic, aggressive, or passive wording.

---

### Scene 4 — Workplace small talk
**Type:** input with classified feedback  
**Pressure:** Mette, your supervisor, asks about the apartment. She is friendly, but not your close friend.

Prompt:

```da
Hvordan går det med lejligheden? Har du fået varme?
```

Good B2 answer:

```da
Det går fint nok. Der har været lidt bøvl med varmen, men jeg har bedt udlejeren om en konkret dato.
```

Why it works:
- `fint nok` = controlled understatement;
- `lidt bøvl` = honest but not dramatic;
- active agency: `jeg har bedt ...`.

Too informal:

```da
Det er pissekoldt, og udlejeren er en nar.
```

Too passive:

```da
Det ved jeg ikke. Det løser sig nok.
```

**Notice:** Danish understatement can be socially intelligent, but passivity can hide inside it.

**Carry:** Workplace trust changes depending on tone.

---

### Scene 5 — Epilogue with consequences
**Type:** choice / reflection  
**Pressure:** The radiator is fixed. But your wording had consequences.

Possible endings:

- Diplomatic: radiator fixed, Sofia still trusts you, landlord sends a normal apology.
- Aggressive: radiator fixed, landlord replies coldly, Sofia distances herself.
- Passive: radiator fixed late, everyone is polite, but you lost a week.

Final reflection prompt:

```da
Skriv én sætning om, hvad du har lært om tone på dansk.
```

Example strong answer:

```da
Man kan godt være tydelig uden at lyde aggressiv.
```

## Schema additions needed
This can remain static, but B2 benefits from simple state variables.

```js
variables: {
  landlordTension: 0,
  sofiaTrust: 0,
  emilEscalation: 0,
  workplaceTrust: 0
}
```

Choice options can optionally include effects:

```js
{
  id: "formal-clear",
  label: "Jeg vil gerne bede om en mere præcis dato...",
  correct: true,
  effects: { landlordTension: -1, workplaceTrust: 1 },
  register: "formal-neutral",
  nuance: ["clear-request", "non-aggressive"]
}
```

## Why this is a good B2 prototype
It tests the exact thing B2 learners struggle with after grammar basics:

- “I know the words, but do I sound too direct?”
- “Is this formal enough?”
- “What does `jo` actually do here?”
- “Why does the passive sentence feel slippery?”
- “How do I complain without burning the relationship?”

This is much more interesting than a generic B2 vocabulary lesson. It makes Danish feel like a social operating system.

# B2 Gold Lesson — Radiator, Register, Consequence

## Status

`lesson-b2-radiator-register` is the gold-standard B2 narrative lesson for Platå. It is the reference implementation for:

- source-backed B2 lesson metadata;
- scene-level `learningGoal` and `sourceRefs`;
- explicit `targetPhrases`;
- recorded `masteryTags`;
- diagnostic feedback for every choice and B2 match pair;
- grouped completion validation for answers that need more than one signal;
- deterministic gold-lesson simulation.

## Why This Is B2

B2 is not more vocabulary. It is control under social pressure:

- reading formal Danish without over-trusting it;
- shifting register between official email, group chat, and workplace small talk;
- noticing how particles such as `jo`, `da`, `nok`, `sgu`, and `bare` position the speaker;
- seeing how passive wording can hide responsibility;
- complaining clearly without becoming either passive or aggressive.

## Editorial Focus

Read official Danish precisely, choose register under pressure, and preserve agency without escalating tone.

The learner should finish with this usable principle:

```da
Man kan godt være tydelig uden at lyde aggressiv.
```

## Source Support

The lesson uses source notes in `data.js` rather than inline citations in the UI.

| Source | Supports |
|---|---|
| Lex: passiv | Passive forms can downplay or exclude the agent; Danish has both s-passive and blive-passive. |
| Dansk Sproghistorie: dialogiske partikler | Dialogic particles such as `jo`, `da`, `sgu`, `nok`, and `vel` can mark stance toward the listener. |
| sproget.dk: grammatiske betegnelser | Terminology for `blive-passiv` / `omskreven passiv`. |
| borger.dk/lifeindenmark.dk skrivevejledning | Official Danish should be concrete and precise; paper-word style should be avoided where possible. |

## Scene Contract

Every scene follows:

```text
pressure -> notice -> action -> diagnostic feedback -> carry-forward
```

In this lesson, every scene also has:

- `learningGoal`: one precise B2 skill;
- `sourceRefs`: links back to the top-level source notes;
- `targetPhrases`: the Danish phrases actively trained in the scene;
- `masteryTags`: durable skill signals recorded with learner attempts.

## Mastery Map

The top-level `masteryMap` defines what the lesson can diagnose later:

| Tag | What It Proves |
|---|---|
| `passive-agency` | The learner can distinguish passive process language from an actual commitment. |
| `modal-particle-stance` | The learner can read social stance from particles such as `jo`, `da`, `sgu`, `nok`, and `bare`. |
| `formal-register-control` | The learner can make a concrete formal request without private-chat aggression. |
| `understatement-with-agency` | The learner can soften a workplace answer while preserving agency and a next step. |
| `consequence-aware-tone` | The learner can name the B2 principle that clarity and relationship control can coexist. |

The shared lesson engine records these tags through the same attempt path as ordinary skill tags, so weak-tag analysis can surface conceptual gaps rather than only scene failures.

## Scene Notes

### Scene 1 — Brevet

**Learning goal:** Distinguish a registered case from an actual repair commitment in formal passive Danish.

The key contrast is between registration and commitment:

```da
Der er blevet noteret en reklamation vedrørende radiatoren.
Der vil blive sendt en håndværker, når det passer ind i planlægningen.
```

The correct answer is not “they will fix it quickly” and not “they refuse to fix it”. It is:

```da
De har registreret sagen, men de lover ikke en dato.
```

The diagnostic feedback separates three reading behaviors:

- over-trusting passive process language;
- accurate commitment reading;
- adding refusal that is not present in the text.

### Scene 2 — Gruppechatten

**Learning goal:** Identify social stance from Danish particles before reacting to advice.

The match pairs are deliberately not generic vocabulary pairs. Each feedback names what the small word does:

- `da` lowers the temperature;
- `jo` treats the reply as something the learner should already accept;
- `sgu` adds emotional force;
- `nok` softens prediction;
- `bare` reduces the landlord's explanation to a tactic.

### Scene 3 — To Svar

**Learning goal:** Make a formal request concrete without importing private-chat aggression.

The strong formal sentence keeps three things visible:

```da
Jeg vil gerne bede om en mere præcis dato,
da temperaturen er faldet til under 12 grader.
```

It has:

- civil request form: `jeg vil gerne bede om`;
- concrete next step: `en mere præcis dato`;
- factual pressure: `under 12 grader`.

The two wrong options are not random. One imports private-chat force into formal writing; the other removes pressure through over-softening.

### Scene 4 — Arbejdspladsen

**Learning goal:** Use understatement without losing agency when discussing a private problem at work.

This scene uses grouped completion validation. A passing answer needs both:

- an agency word: `bedt`, `skrevet`, `ringet`, `kontaktet`, or `aftalt`;
- a concrete next step: `dato`, `tid`, `håndværker`, `udlejer`, or `varme`.

This prevents weak answers such as only `varme` from passing as B2.

### Scene 5 — Konsekvens

**Learning goal:** Name the B2 principle: clarity and relationship control can coexist.

The final choice confirms the transfer principle rather than introducing new language. The correct answer is:

```da
Man kan godt være tydelig uden at lyde aggressiv.
```

## Validator Protection

The validator applies extra rules because this lesson is marked:

```js
qualityTier: "gold"
```

Gold lessons must have:

- source-backed top-level notes;
- scene-level `learningGoal`;
- valid `sourceRefs`;
- valid scene `masteryTags`;
- `masteryMap` remediation actions that point weak signals back to repair scenes with the same `masteryTags`;
- B2 `targetPhrases`;
- unique `diagnostic` keys on choice options;
- diagnostic feedback on B2 match pairs;
- grouped keyword validation for completion scenes.

The gold simulator also checks that:

- scene attempts include mastery tags;
- weak completion answers such as `varme` are rejected;
- the full answer `jeg har bedt udlejeren om en konkret dato` is accepted;
- the `diplomatic`, `aggressive`, and `passive` paths reach their expected endings;
- expected social variables match each path.

Dashboard smoke tests also verify that a missed `passive-agency` signal renders a learner-facing repair action and links back to `?mode=repair&signal=passive-agency#official-reply-passive`.

The lesson engine reads that URL as a repair session: it renders the repair focus in the scene and records attempts with `mode: "repair"`.

Run:

```bash
npm run check
```

The lesson should pass with no lesson-validation warnings.

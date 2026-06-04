# Platå Lesson 01 Spec — The First Morning

## Title
The First Morning in Copenhagen

## Story promise
You arrive in Copenhagen. Your phone is at 7%. A local named Lene helps you get through the first tiny social situations without hiding inside English.

## Format
Static HTML/JS lesson composed of reusable scene blocks:
- `story`
- `choice`
- `input`
- `match`
- `completion`

Each block records attempts through the shared Platå kernel with trainer id `lesson-01-arrival`.

Each scene follows the Platå pattern documented in [`lesson-pattern.md`](./lesson-pattern.md): pressure → notice → action → feedback → carry-forward.

## Scene outline

### 1. Arrival sign
- Text: `Velkommen til København.`
- User must pick `Udgang` instead of `Indgang`.
- Feedback: wrong choice sends them briefly to the wrong door, then gives a mnemonic: `ud` ≈ out.

### 2. Meet Lene
- Lene: `Jeg hedder Lene. Hvad hedder du?`
- User enters `Jeg hedder <name>`.
- Accept any non-empty name if the phrase starts with `jeg hedder`.

### 3. Two doors
- Match signs:
  - `Indgang` → entrance
  - `Udgang` → exit
- Feedback is visual and friendly.

### 4. Courtesy chain
- Lene gives help.
- User chooses `Tak`.
- Lene says `Selv tak`.
- Then the user practices choosing `Selv tak` as a response.

### 5. Roommate payoff
- Anders: `Hej! Jeg hedder Anders. Hvad hedder du?`
- User completes: `Hej, jeg hedder ____.`
- Completion message: “You survived the first morning.”

## Design direction
Warm Copenhagen morning, not corporate SaaS.
- Editorial typography from current site: Fraunces + Inter + JetBrains Mono.
- Dark forest / cream / ember tokens aligned with headpage-v2.
- Mobile-first card stack.
- Route-map progress instead of sterile progress bar.
- Exercises look like signs, notes, dialogue bubbles, receipts.

## MVP constraints
- No build step.
- No backend.
- No external JS dependencies.
- Works from GitHub Pages and from `python3 -m http.server`.
- Progress stored in LocalStorage using the shared kernel.

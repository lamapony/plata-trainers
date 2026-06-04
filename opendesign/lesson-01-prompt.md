# Design Request: Platå Lesson 01 — The First Morning in Copenhagen

## Context
- Project: Platå Trainers
- Tech stack: static HTML/CSS/JS, no build step, no backend
- Existing design system: Fraunces display, Inter body, JetBrains Mono labels; warm cream, dark forest, ember accent
- Target device: mobile-first, responsive desktop shell

## Screen Purpose
Create the first narrative lesson screen for a Danish-learning app. The user has just arrived in Copenhagen and must complete tiny real-world interactions in Danish.

## Content and Data
Use these scene blocks:
1. Arrival sign: `Velkommen til København`; choice between `Indgang` and `Udgang`.
2. Dialogue with Lene: `Jeg hedder Lene. Hvad hedder du?`; input `Jeg hedder ...`.
3. Door signs matching: `Indgang = entrance`, `Udgang = exit`.
4. Courtesy chain: choose `Tak`, then `Selv tak`.
5. Roommate payoff: `Hej, jeg hedder Anders. Hvad hedder du?`; final completion.

## Navigation and Layout
- Header: small brand link back to Platå Trainers.
- Main layout: left/top narrative card, right/below Copenhagen route card.
- Scene card: image-like illustration area, dialogue bubble, exercise panel, feedback panel.
- Progress: route-map steps, not a plain bar.
- Sticky bottom action on mobile.

## Interactions and States
- Choice selected / wrong / correct states.
- Text input success state.
- Matching item selected state.
- Lesson complete state with summary.
- Export/import not needed on this screen; progress is automatic.

## Visual References
- Warm Copenhagen morning, railway/airport signage, paper ticket, street-map fragments.
- Colors: cream `#f4ead9`, dark forest `#202a24`, ember `#c77232`, sage `#8fa88b`, ink `#1d211f`.
- Typography: Fraunces for big lesson title, Inter for text, JetBrains Mono for Danish labels/signage.
- Components: rounded cards, tactile buttons, subtle shadows, no glassmorphism.

## Constraints
- Must be implementable as plain HTML/CSS/JS.
- No React-only patterns.
- No external JS dependencies.
- Accessible: buttons are real buttons, focus visible, form labels present.
- Exercise UI must feel diegetic: signs, dialogue bubbles, cards, map route.

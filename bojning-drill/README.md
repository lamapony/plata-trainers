# bøjning-drill

Open-source Danish bøjning drill. Verbs (nutid / datid / førnutid) + nouns (bestemt/ubestemt, ental/flertal). Lite SM-2 spaced repetition. Self-contained HTML/JS, no build, no backend.

[Live demo](https://lamapony.github.io/plata-trainers/bojning-drill/) — when GitHub Pages is enabled.

## Run locally

```bash
# from this folder
python3 -m http.server 8000
# open http://localhost:8000
```

No build, no dependencies. Just open `index.html` in a browser.

## How it works

- **Mode** = Verber | Substantiver
- **Type** = specific tense/case, or "Blandet" (random)
- 10 items per session, weighted toward weak items
- Correct → box advances (max 5 = mastered); wrong → box resets to 1 and the item is re-queued later in the same session
- Progress stored in browser `LocalStorage` under `plata-bojning-v0`
- Export/import: ↓/↑ buttons in the header (JSON file)
- Reset: ↺ button (with confirm)

## Data

All drill items live in [`data.js`](./data.js). Two arrays:

```js
verber: [{ infinitive, nutid, datid, førnutid, note }]
substantiver: [{ ubestemtEntal, bestemtEntal, flertalUbestemt, bestemtFlertal, note }]
```

## Contributing items

Pull requests welcome. To add 5 verbs:

1. Edit `data.js`
2. Add entries to the `verber` array
3. Note common verb classes: `regular`, `strong` (vowel change), `irregular`, `modal`
4. For motion verbs in førnutid, use `er + participle` (e.g. `er gået`, `er blevet`)
5. Test locally, then PR

## Acceptance rules

The trainer accepts the canonical form and any aliases listed in `data.js#aliases`. If a Danish word has multiple valid spellings (region / context), add them there.

## Roadmap

- v0.2 — keyboard shortcuts (Enter to submit, → for next), audio prompt pronunciation
- v0.3 — streak freeze, daily goal
- v0.4 — review queue for items not seen in N days
- v1.0 — sync via GitHub Gist (cross-device progress)

## License

MIT — see [LICENSE](../LICENSE).

# Platå Audio release audit

This is the requirement-by-requirement release ledger for Danish lesson audio. It distinguishes a verified foundation from published, listened-to production audio. A green normal CI run does not override a blocked release row.

| Requirement | Status | Authoritative evidence |
| --- | --- | --- |
| Preserve the static GitHub Pages architecture; no backend or browser TTS dependency | Verified | `shared/plata-audio.js`, `scripts/generate-lesson-audio.js`; browser runtime contains no provider request code |
| Audit lesson render paths, factory, schema, validators, reports, Pages, PWA, tests, and production baseline | Verified | PR #19 scope; production baseline recorded before implementation; seven lesson shells and common engine inspected |
| Preserve pre-existing user changes and work on a separate branch | Verified | Branch `feat/plata-audio` began from clean `main`; current worktree and PR diff contain only audio-scope changes |
| Backward-compatible optional schema | Verified | `scripts/lib/audio-contract.js`; all legacy lessons pass `check:audio` as advisory and full lesson/browser regression tests |
| Stable utterance IDs and traceability | Verified | Kebab-case uniqueness gate; manifest records lesson, scene, kind, source, text, spoken text, speaker, voice, locale, path, hashes, provider/model, duration, and generation evidence |
| Plain-text metadata and pronunciation override | Verified | `spokenText` support plus HTML/unsupported-field rejection in contract smoke tests |
| Cover dialogue, standalone Danish, choice, repair, match, channel/register, model answer, and ending content | Verified | Extraction-kind fixture in `scripts/smoke-audio-pipeline.js`; common engine render paths |
| Never voice English instructions or expose a hidden answer before an attempt | Verified | Unsupported/non-Danish attachment test; model answer and its control are rendered only after an attempt in browser tests |
| Reproducible one-lesson/all-gold CLI, dry-run, force, provider/model/profile/coverage overrides | Verified | `scripts/generate-lesson-audio.js`, `docs/AUDIO_PIPELINE.md` |
| Dry-run makes no provider call or write | Verified | Provider trap fixture asserts zero calls and no audio directory |
| Cost-aware planning | Verified | Dry-run reports selected characters and the exact subset requiring provider synthesis; operator must apply current official pricing |
| Incremental reuse and stale detection | Verified | Content-hash reuse fixture, source mutation fixture, manifest validator |
| Temporary files, validation before replacement, and no partial batch | Verified | Rollback-capable transaction covers clips, manifests, review template, and HTML registration; transaction and interrupted-provider fixtures |
| Never delete old/orphan assets blindly | Verified | Generator reports orphans; strict release rejects them; no automatic deletion path |
| Separate replaceable provider adapter | Verified | `scripts/lib/audio-providers/openai.js` and test-only `mock.js` |
| No API key in frontend, manifest, log, or repository | Verified | Credential is process-only; error redaction fixture; secret scan; no browser provider code |
| No billable TTS in normal CI | Verified | CI uses deterministic local fixtures and committed-asset validation only |
| Real file signature/container, duration, size, sample rate, bitrate, checksum, and MIME validation | Verified | MP3/WAV parsers, static server MIME contract, missing/corrupt/path fixtures |
| Loudness, clipping, silence, start/end cutoff, and between-clip consistency | Verified | Live `ffmpeg` decode, per-clip thresholds, 6 dB lesson range, hard-start and quiet-second-clip negative fixtures |
| Do not claim automated naturalness | Verified | Separate `human-review.json` gate and public quality copy |
| Stable lesson-level casting and fallback | Verified | Flagship maps Mette→`marin`, learner/model→`cedar`, with a default voice; deliberate mapping is required for publication |
| One lazy player, no autoplay, no initial audio request | Verified | Hidden `preload=none` player is created after a click; browser request counter remains zero before action |
| Loading, play, pause/resume, replay, one-active-clip, scene/page cleanup, calm error | Verified | `shared/plata-audio.js`; Chromium/WebKit desktop/mobile audio tests |
| 0.75×/1× speed and local persistence without personal data | Verified | Browser test plus single localStorage preference key |
| Native keyboard control, visible focus, accessible name/state, 44 px target | Verified | Native button, `aria-label`, `aria-busy`, `aria-pressed`, focus CSS, bounding-box and Axe checks |
| Whole-utterance highlight; no inaccurate word karaoke | Verified | Runtime/CSS; no timing or word-level API exists |
| Repair/model-answer listen-and-repeat prompt only with a real clip | Verified | Common engine guard and browser attempt-flow test |
| Audio controls never nest inside choice/match buttons | Verified | Sibling wrapper implementation and dedicated browser regression |
| Audio-ready scaffold without fake paths or provider calls | Verified | `scripts/scaffold-gold-lesson.js`; scaffold smoke asserts 13 unique IDs, draft config, no manifest/audio directory, and exact next command |
| Human-readable agent/factory workflow | Verified | `AGENTS.md`, `factory.html`, `docs/AGENT_LESSON_WORKFLOW.md`, `docs/LESSON_SCHEMA.md` |
| Coverage/missing/stale/invalid/orphan/review release gate | Verified | `scripts/validate-lesson-audio.js`; `check:audio-release` intentionally rejects the current incomplete rollout |
| Public quality evidence includes clips, coverage, bytes, voices, formats/MIME, provider/model, loudness, generation date/hash, and review honesty | Verified | `scripts/build-quality-report.js`, `quality.js`, quality page smoke |
| Audio excluded from install precache and cached lazily without delaying first playback | Verified | `sw.js`, byte-sensitive cache version, PWA smoke and request-count browser test |
| Legacy lessons render, navigate, save/replay progress, and show no empty controls | Verified | Final full browser matrix: 56 passed across Chromium/WebKit desktop/mobile; 16 opt-in visual-baseline cases skipped by design |
| Local contract/static/Pages/PWA QA | Verified for current implementation | Final `npm run check` passed all 76 project gates, including Pages build and offline distribution bundle |
| Chromium/WebKit desktop/mobile audio UX | Verified for current implementation | 12 targeted tests pass inside the final 56-test browser run; manual desktop/mobile screenshot review also passed after correcting compact dialogue layout |
| Full GitHub Actions | Needs rerun | Previous PR head was green; current audit improvements are not yet pushed |
| Real flagship Danish clips | **Blocked** | `lesson-b2-job-followup` remains honest `draft`, 0/16, with no `audio/` assets |
| Human listening approval for exact words, natural Danish prosody, register, names, artifacts, and both speeds | **Blocked** | Requires real provider output and a real listener; automation must not approve it |
| Roll out to every gold lesson | **Blocked after flagship review** | Must not mass-generate before the flagship voice is accepted and cost/size are measured |
| Published asset 200/MIME/playback/service-worker production checks | **Blocked** | No real asset may be published before synthesis and review |
| PR ready, merge, Pages deployment, production verification, synchronized clean `main` | **Blocked** | PR #19 must remain draft until all release rows above are satisfied |

## Single external gate

Real synthesis requires one authorized provider session: a securely supplied `OPENAI_API_KEY` plus explicit permission to incur TTS charges. Do not paste the key into a PR, issue, manifest, repository file, or chat log.

After the environment is authorized, continue from the repository root:

```bash
npm run generate:lesson-audio -- --lesson lesson-b2-job-followup
```

Then validate, listen to all 16 clips at 1× and 0.75×, correct/regenerate any weak Danish, approve `human-review.json`, mark the contract published, measure actual bytes, and run `npm run check:audio-release` before changing the PR out of draft.

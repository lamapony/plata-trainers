# Platå Danish audio pipeline

Platå Audio turns authored Danish utterances into reviewed static assets for GitHub Pages. It adds no backend, runtime model call, tracking, or account dependency. Legacy lessons remain valid and render no empty audio controls.

## Architecture and ownership

1. `data.js` owns the Danish display text and nearby audio metadata (`utteranceId`, optional `spokenText`, speaker/voice, and required coverage).
2. `scripts/lib/audio-contract.js` extracts only supported Danish fields, rejects duplicate/unsafe metadata, resolves casting, and computes a content hash.
3. `scripts/generate-lesson-audio.js` plans one lesson or all gold lessons and delegates synthesis to a provider adapter under `scripts/lib/audio-providers/`.
4. New bytes are written to temporary files and decoded for QC. Audio, both manifests, the review template, and the lesson script registration are then committed as one rollback-capable replacement batch. Existing valid clips are reused by content hash. Orphans are reported but never deleted automatically.
5. `audio/manifest.json` is the auditable canonical artifact. `audio/manifest.js` registers the same data before the static lesson runtime starts.
6. `shared/plata-audio.js` owns one lazy player for the page. The lesson engine only asks it whether a manifest-backed control exists.

Provider code is intentionally separate from orchestration. A new provider implements `synthesize({ text, voice, model, format, instructions })` and returns bytes plus an optional request ID. It must not decide lesson coverage, paths, manifests, deletion, or publication state.

## Manifest contract

The manifest records:

- lesson, schema, locale, generator version, and generation date;
- provider, pinned model, format, voice profile, and disclosure;
- stable utterance ID, owning `sceneId` (or `null` for endings), display `text`, exact `spokenText`, speaker, voice, source field, and utterance kind;
- static path, byte size, SHA-256 checksum, and input content hash;
- parsed codec evidence: duration, sample rate, bitrate, and frame/container validity;
- decoded QC evidence: RMS/peak level, leading/trailing silence, start/end hard-cutoff risk, and the lesson-wide inter-clip loudness range;
- provider request ID when supplied (never an API key).

The manifest contains provenance and reproducibility data, not a claim that the voice sounds natural. Human listening evidence is stored separately in `human-review.json`.

## Safe commands

```bash
# Plan one lesson. No provider call, cost, directory, or manifest write.
npm run generate:lesson-audio -- --lesson lesson-b2-job-followup --dry-run

# Plan every configured gold lesson.
npm run generate:lesson-audio -- --all-gold --dry-run --coverage required

# Generate after provider authorization and credential setup.
npm run generate:lesson-audio -- --lesson lesson-b2-job-followup

# Rebuild every selected clip even if its content hash matches.
npm run generate:lesson-audio -- --lesson lesson-b2-job-followup --force

# Contract/artifact validation used by normal CI.
npm run check:audio

# Strict release audit: every gold lesson needs a published contract,
# 100% valid required coverage, and approved human listening evidence.
npm run check:audio-release
```

`--provider`, `--model`, `--format`, and `--voice-profile` are explicit reproducibility overrides. `--coverage required|all` controls whether optional declared utterances are included. Text, voice, instructions, provider, model, format, or locale changes alter the content hash and make the existing clip stale.

Planning output includes the exact number of selected spoken characters and the subset that still requires provider synthesis. Use that volume with the provider's current official pricing before authorizing spend; the repository deliberately does not hard-code a price that can drift.

CI must only run dry planning and validation against committed assets. It must never hold a billable TTS credential or make provider calls.

## OpenAI adapter policy

The included adapter uses `POST /v1/audio/speech`, the pinned `gpt-4o-mini-tts-2025-12-15` model, and lesson-selected built-in voices. OpenAI currently documents Danish as a supported input language while noting that built-in voices are optimized for English, so Danish naturalness remains a human release decision. See the official [text-to-speech guide](https://developers.openai.com/api/docs/guides/text-to-speech) and [model page](https://developers.openai.com/api/docs/models/gpt-4o-mini-tts).

Generation requires `OPENAI_API_KEY`. The key is read only at execution time, sent in the Authorization header, never placed in lesson data/manifests, and redacted from provider error text. The generator fails before creating the audio directory when a required key is unavailable.

OpenAI's TTS guide requires clear disclosure that the heard voice is AI-generated. The runtime renders the manifest disclosure beside the speed selector whenever OpenAI-backed controls are present. OpenAI's [Terms of Use](https://openai.com/policies/terms-of-use/) describe output ownership subject to applicable law; a project owner should still review current terms, organizational policy, cost, and the lesson's intended distribution before generation.

Do not publish local macOS `say` output or an open model merely because it is technically available. Voice/model/dataset licenses must all permit redistribution of generated artifacts; a permissive inference engine alone is not sufficient evidence.

## Automated QC

The generator and validator reject:

- extension-only fakes, empty/truncated streams, malformed WAV chunks, or MP3s without complete frames;
- checksum, content-hash, source-text, voice, provider/model/format, or manifest mismatches;
- files below 1,000 bytes, duration outside 0.35–90 seconds, sample rates below 16 kHz, or bitrates below 24 kbps;
- RMS outside −36 to −8 dBFS, clipping, more than 0.8 seconds of leading silence, more than 1 second of trailing silence, a suspiciously loud first/final 20 ms, or more than 6 dB RMS variation between lesson clips;
- missing decoded QC evidence on production clips;
- duplicate IDs, unsafe paths, HTML-bearing metadata, unsupported/non-Danish attachment points, missing required clips, stale clips, or unapproved publication state.

MP3 frames and WAV containers are parsed in Node. Production clips are also decoded again from their current checked-in bytes for loudness, silence, and cutoff analysis. The static QA workflows install `ffmpeg` explicitly, so committed production assets cannot pass CI using manifest claims alone.

The public quality report publishes factual generated-clip count, total and average asset bytes, voices, provider/model IDs, declared and validated formats/MIME types, inter-clip loudness range, last generation timestamp, and a canonical manifest hash. Coverage and byte counts never stand in for the listening review.

## Human listening review

Listen to every flagship clip and a coverage-based sample for larger lessons at both 1× and 0.75×. Complete all fields in `audio/human-review.json`:

- exact Danish words, with no substitutions or invented words;
- natural contemporary Danish pronunciation and prosody;
- correct stress, pauses, names, abbreviations, numbers, and punctuation;
- consistent casting across speakers;
- no clicks, metallic artifacts, doubled syllables, long silence, or clipped endings;
- useful comprehension at both supported speeds.

Set `status` to `approved`, record a real reviewer and ISO timestamp, and add notes for any known limitations. Only then change `audio.publicationStatus` to `published` and run the strict release gate. Automated tests must not fill or approve this file.

## Runtime and accessibility invariants

- No autoplay and no audio fetch during initial lesson/PWA load.
- Controls render only for clips present in the browser manifest.
- One hidden `<audio preload="none">` is created on the first learner action and reused.
- Starting a new utterance stops the previous one; navigation/reset/pagehide stops and unloads the player.
- Listen/Loading/Pause/Replay uses a native 44 px target with a text label, keyboard focus, `aria-label`, `aria-busy`, and `aria-pressed` state. Loading can be cancelled with the same button.
- The entire current utterance is highlighted; there is no word-level karaoke.
- The model answer and its audio remain hidden until a learner attempt.
- “Listen once, then say it aloud” appears only when that model answer has a real clip.
- Speed is limited to 0.75× and 1× and persisted locally.
- Network/decode failures are announced calmly only after a click; Danish text remains visible.
- The service worker omits audio from install precache, returns the first network response without waiting for the cache write, stores complete audio lazily in the background, and rotates its cache version when any asset bytes change.

## Recovery and continuation

If synthesis or the multi-file commit stops, rerun the same command. Valid hash-matching files are reused, invalid temporary files are cleaned, and a failed commit restores every pre-existing destination. Inspect reported orphans manually; do not use a broad deletion command. A text or casting correction should be made in `data.js`, followed by dry-run, generation, validation, listening review, and release validation in that order.

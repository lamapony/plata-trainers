#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { contentHash, extractUtterances, generationSettings, loadLessonData } = require("./lib/audio-contract");
const { inspectAudioBuffer, qualityIssues } = require("./lib/audio-file");
const { makeWav } = require("./lib/audio-providers/mock");
const { createOpenAiProvider, ENDPOINT } = require("./lib/audio-providers/openai");
const { generateLesson, replaceFilesTransaction } = require("./generate-lesson-audio");
const { contentType } = require("./serve-pages");
const { validateLessonAudio } = require("./validate-lesson-audio");

function lessonSource(text, publicationStatus) {
  return `window.PLATA_LESSON_AUDIO_FIXTURE = ${JSON.stringify({
    id: "lesson-audio-fixture",
    qualityTier: "gold",
    audio: {
      schemaVersion: 1,
      publicationStatus,
      locale: "da-DK",
      defaultVoice: "fixture",
      speakerVoices: { Mette: "fixture" },
      generation: { provider: "mock", model: "fixture-v1", format: "wav", voiceProfile: "default" }
    },
    scenes: [{
      id: "scene-one",
      type: "choice",
      dialogue: [{ speaker: "Mette", line: text, audio: { utteranceId: "scene-one-mette" } }],
      options: [{ id: "ok", label: "Ja", correct: true }]
    }],
    endings: []
  })};\n`;
}

function interruptedLessonSource() {
  const lesson = JSON.parse(lessonSource("Hej fra Mette.", "draft").replace(/^window\.PLATA_LESSON_AUDIO_FIXTURE = /, "").replace(/;\n$/, ""));
  lesson.id = "lesson-audio-interrupted";
  lesson.scenes[0].dialogue.push({ speaker: "Mette", line: "En anden repllik.", audio: { utteranceId: "scene-one-second" } });
  return `window.PLATA_LESSON_AUDIO_INTERRUPTED = ${JSON.stringify(lesson)};\n`;
}

function writeManifestPair(lessonDir, manifest) {
  const audioDir = path.join(lessonDir, "audio");
  fs.writeFileSync(path.join(audioDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  const browserJson = JSON.stringify(manifest).replace(/</g, "\\u003c");
  fs.writeFileSync(
    path.join(audioDir, "manifest.js"),
    `window.PLATA_AUDIO_MANIFESTS = window.PLATA_AUDIO_MANIFESTS || {};\nwindow.PLATA_AUDIO_MANIFESTS[${JSON.stringify(manifest.lessonId)}] = ${browserJson};\n`
  );
}

async function run() {
  const wav = makeWav(1.2);
  const metrics = inspectAudioBuffer(wav, "wav");
  assert.strictEqual(metrics.codec, "pcm");
  assert(metrics.durationSeconds >= 1.19 && metrics.durationSeconds <= 1.21);
  assert.strictEqual(qualityIssues(metrics).length, 0);
  assert.strictEqual(metrics.startCutoffRisk, false);
  assert.strictEqual(contentType("lesson.mp3"), "audio/mpeg");
  assert.strictEqual(contentType("lesson.wav"), "audio/wav");
  const hardStart = Buffer.from(wav);
  for (let offset = 44; offset < 44 + 480 * 2; offset += 2) hardStart.writeInt16LE(6000, offset);
  assert(qualityIssues(inspectAudioBuffer(hardStart, "wav")).some((issue) => issue.includes("decoded start")));

  const baseLesson = {
    id: "contract",
    audio: { schemaVersion: 1, locale: "da-DK", defaultVoice: "voice" },
    scenes: [{ id: "s", dialogue: [
      { speaker: "A", line: "Hej", audio: { utteranceId: "same-id" } },
      { speaker: "B", line: "Farvel", audio: { utteranceId: "same-id", spokenText: "<em>Farvel</em>" } },
      { speaker: "C", line: "Tak", audio: { utteranceId: "blank-spoken", spokenText: " " } }
    ] }],
    endings: []
  };
  const contract = extractUtterances(baseLesson);
  assert(contract.issues.some((issue) => issue.includes("Duplicate utteranceId")));
  assert(contract.issues.some((issue) => issue.includes("plain text, not HTML")));
  assert(contract.issues.some((issue) => issue.includes("spokenText must not be empty")));
  const supportedKinds = extractUtterances({
    id: "supported-kinds",
    audio: { schemaVersion: 1, locale: "da-DK", defaultVoice: "fixture" },
    scenes: [{
      id: "all-kinds",
      danish: "En nøglefrase.",
      danishAudio: { utteranceId: "standalone" },
      dialogue: [{ speaker: "Mette", line: "En replik.", audio: { utteranceId: "dialogue" } }],
      options: [{
        label: "Et valg.",
        audio: { utteranceId: "choice" },
        repairLadder: [{ text: "En rettelse.", audio: { utteranceId: "repair" } }]
      }],
      pairs: [{ left: "Et ord.", right: "A word.", audio: { utteranceId: "match" } }],
      channelVersions: [{ sample: "En kanalversion.", audio: { utteranceId: "channel" } }],
      modelAnswer: { text: "Et modelsvar.", audio: { utteranceId: "model" } }
    }],
    endings: [{ danish: "En afslutning.", audio: { utteranceId: "ending" } }]
  });
  assert.deepStrictEqual(supportedKinds.issues, []);
  assert.deepStrictEqual(
    [...new Set(supportedKinds.utterances.map((utterance) => utterance.kind))].sort(),
    ["channel-version", "choice", "danish-line", "dialogue", "ending", "match", "model-answer", "repair"]
  );
  const unsupportedEnglishAudio = extractUtterances({
    id: "unsupported-english",
    audio: { schemaVersion: 1, locale: "da-DK", defaultVoice: "fixture" },
    scenes: [{ id: "english", english: "Do not voice this.", englishAudio: { utteranceId: "wrong-field" } }],
    endings: []
  });
  assert(unsupportedEnglishAudio.issues.some((issue) => issue.includes("unsupported or non-Danish field")));
  const hashSettings = { provider: "mock", model: "one", format: "wav", voiceProfile: "default", instructions: null };
  assert.notStrictEqual(
    contentHash({ text: "Hej", spokenText: "Hej", speaker: null, voice: "a", locale: "da-DK" }, hashSettings),
    contentHash({ text: "Hej", spokenText: "Hej igen", speaker: null, voice: "a", locale: "da-DK" }, hashSettings)
  );

  let capturedRequest = null;
  const openai = createOpenAiProvider({
    apiKey: "test-key-never-logged",
    fetchImpl: async (url, request) => {
      capturedRequest = { url, request, body: JSON.parse(request.body) };
      return new Response(wav, { status: 200, headers: { "x-request-id": "req_fixture" } });
    }
  });
  const openaiResult = await openai.synthesize({
    text: "Hej fra Danmark.", voice: "cedar", model: "gpt-4o-mini-tts-2025-12-15", format: "wav", instructions: "Speak Danish."
  });
  assert.strictEqual(capturedRequest.url, ENDPOINT);
  assert.strictEqual(capturedRequest.request.method, "POST");
  assert.deepStrictEqual(capturedRequest.body, {
    model: "gpt-4o-mini-tts-2025-12-15",
    input: "Hej fra Danmark.",
    voice: "cedar",
    response_format: "wav",
    instructions: "Speak Danish."
  });
  assert.strictEqual(openaiResult.providerRequestId, "req_fixture");
  assert(openaiResult.bytes.equals(wav));
  const failingOpenai = createOpenAiProvider({
    apiKey: "test-key-never-logged",
    fetchImpl: async () => new Response('{"error":"sk-secret-must-not-leak"}', { status: 401 })
  });
  await assert.rejects(
    () => failingOpenai.synthesize({ text: "Hej", voice: "cedar", model: "model", format: "wav" }),
    error => error.message.includes("[redacted]") && !error.message.includes("sk-secret")
  );

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plata-audio-smoke-"));
  const lessonDir = path.join(tempRoot, "lesson-audio-fixture");
  fs.mkdirSync(lessonDir);
  fs.writeFileSync(path.join(lessonDir, "data.js"), lessonSource("Hej fra Mette.", "draft"));
  fs.writeFileSync(path.join(lessonDir, "index.html"), '  <script src="../../shared/plata-audio.js"></script>\n');
  process.env.NODE_ENV = "test";
  try {
    const transactionDir = path.join(tempRoot, "transaction");
    fs.mkdirSync(transactionDir);
    const finalOne = path.join(transactionDir, "one.txt");
    const finalTwo = path.join(transactionDir, "two.txt");
    const tempOne = path.join(transactionDir, "one.tmp");
    fs.writeFileSync(finalOne, "old-one");
    fs.writeFileSync(finalTwo, "old-two");
    fs.writeFileSync(tempOne, "new-one");
    assert.throws(() => replaceFilesTransaction([
      { tempPath: tempOne, finalPath: finalOne },
      { tempPath: path.join(transactionDir, "missing.tmp"), finalPath: finalTwo }
    ]), /atomic audio commit failed/);
    assert.strictEqual(fs.readFileSync(finalOne, "utf8"), "old-one");
    assert.strictEqual(fs.readFileSync(finalTwo, "utf8"), "old-two");
    assert(!fs.readdirSync(transactionDir).some((name) => name.includes(".bak-")));

    let dryRunProviderCalls = 0;
    const dryRun = await generateLesson(lessonDir, {
      coverage: "required", dryRun: true, force: false, provider: "mock", model: "fixture-v1", format: "wav", voiceProfile: "default",
      providerInstance: { async synthesize() { dryRunProviderCalls += 1; throw new Error("dry-run called provider"); } }
    });
    assert.strictEqual(dryRun.planned, 1);
    assert.strictEqual(dryRun.selectedCharacters, "Hej fra Mette.".length);
    assert.strictEqual(dryRun.synthesisCharacters, "Hej fra Mette.".length);
    assert.strictEqual(dryRunProviderCalls, 0);
    assert(!fs.existsSync(path.join(lessonDir, "audio")));

    const first = await generateLesson(lessonDir, {
      coverage: "required", dryRun: false, force: false, provider: "mock", model: "fixture-v1", format: "wav", voiceProfile: "default"
    });
    assert.strictEqual(first.generated, 1);
    assert(fs.existsSync(path.join(lessonDir, "audio", "scene-one-mette.wav")));
    assert(fs.readFileSync(path.join(lessonDir, "index.html"), "utf8").includes("./audio/manifest.js"));
    const draft = validateLessonAudio(lessonDir, {});
    assert.strictEqual(draft.coveragePercent, 100);
    assert.strictEqual(draft.invalid.length, 0);
    assert.strictEqual(draft.issues.length, 0);
    assert.strictEqual(draft.generatedClips, 1);
    assert.strictEqual(draft.assetFiles, 1);
    assert(draft.assetBytes > 1000);
    assert.deepStrictEqual(draft.voices, ["fixture"]);
    assert.deepStrictEqual(draft.formats, ["wav"]);
    assert.deepStrictEqual(draft.validFormats, ["wav"]);
    assert.deepStrictEqual(draft.mimeTypes, ["audio/wav"]);
    assert(draft.lastGeneratedAt && draft.manifestHash && draft.manifestHash.length === 64);
    assert.strictEqual(draft.loudnessRangeDb, 0);
    const strictDraft = validateLessonAudio(lessonDir, { requirePublishedGold: true });
    assert(strictDraft.issues.some((issue) => issue.includes("human audio review")));

    const second = await generateLesson(lessonDir, {
      coverage: "required", dryRun: false, force: false, provider: "mock", model: "fixture-v1", format: "wav", voiceProfile: "default"
    });
    assert.strictEqual(second.reused, 1);
    assert.strictEqual(second.generated, 0);

    const reviewPath = path.join(lessonDir, "audio", "human-review.json");
    const review = JSON.parse(fs.readFileSync(reviewPath, "utf8"));
    review.status = "approved";
    review.reviewer = "fixture reviewer";
    review.reviewedAt = "2026-07-17T12:00:00.000Z";
    Object.keys(review.checklist).forEach((key) => { review.checklist[key] = true; });
    fs.writeFileSync(reviewPath, `${JSON.stringify(review, null, 2)}\n`);
    fs.writeFileSync(path.join(lessonDir, "data.js"), lessonSource("Hej fra Mette.", "published"));
    const published = validateLessonAudio(lessonDir, { requirePublishedGold: true });
    assert.deepStrictEqual(published.issues, []);
    assert.strictEqual(published.humanReviewApproved, true);

    const canonicalManifest = JSON.parse(fs.readFileSync(path.join(lessonDir, "audio", "manifest.json"), "utf8"));
    assert.strictEqual(canonicalManifest.clips[0].sceneId, "scene-one");
    const productionLikeManifest = JSON.parse(JSON.stringify(canonicalManifest));
    productionLikeManifest.generation.provider = "openai";
    productionLikeManifest.generation.model = "fixture-openai-v1";
    productionLikeManifest.disclosure = "AI-generated Danish voice";
    productionLikeManifest.clips[0].provider = "openai";
    productionLikeManifest.clips[0].model = "fixture-openai-v1";
    const sourceLesson = loadLessonData(lessonDir);
    const sourceUtterance = extractUtterances(sourceLesson).utterances[0];
    productionLikeManifest.clips[0].contentHash = contentHash(
      sourceUtterance,
      generationSettings(sourceLesson, productionLikeManifest.generation)
    );
    writeManifestPair(lessonDir, productionLikeManifest);
    const productionLike = validateLessonAudio(lessonDir, { requirePublishedGold: true });
    assert.deepStrictEqual(productionLike.issues, []);
    assert.deepStrictEqual(productionLike.invalid, []);
    writeManifestPair(lessonDir, canonicalManifest);

    const traversalManifest = JSON.parse(JSON.stringify(canonicalManifest));
    traversalManifest.clips[0].src = "../escape.wav";
    writeManifestPair(lessonDir, traversalManifest);
    assert(validateLessonAudio(lessonDir, { requirePublishedGold: true }).invalid.some((entry) => entry.problems.some((problem) => problem.includes("src must be") || problem.includes("escapes"))));
    writeManifestPair(lessonDir, canonicalManifest);

    const malformedManifest = Object.assign({}, canonicalManifest, { clips: {} });
    writeManifestPair(lessonDir, malformedManifest);
    assert(validateLessonAudio(lessonDir, { requirePublishedGold: true }).issues.some((issue) => issue.includes("manifest.clips must be an array")));
    writeManifestPair(lessonDir, canonicalManifest);

    const requiredDriftManifest = JSON.parse(JSON.stringify(canonicalManifest));
    requiredDriftManifest.clips[0].required = false;
    writeManifestPair(lessonDir, requiredDriftManifest);
    assert(validateLessonAudio(lessonDir, { requirePublishedGold: true }).invalid.some((entry) => entry.problems.some((problem) => problem.includes("required flag"))));
    writeManifestPair(lessonDir, canonicalManifest);

    const approvedReview = JSON.parse(fs.readFileSync(reviewPath, "utf8"));
    delete approvedReview.schemaVersion;
    fs.writeFileSync(reviewPath, `${JSON.stringify(approvedReview, null, 2)}\n`);
    assert(validateLessonAudio(lessonDir, { requirePublishedGold: true }).issues.some((issue) => issue.includes("schemaVersion must be 1")));
    approvedReview.schemaVersion = 1;
    fs.writeFileSync(reviewPath, `${JSON.stringify(approvedReview, null, 2)}\n`);

    const manifestJsPath = path.join(lessonDir, "audio", "manifest.js");
    const manifestJs = fs.readFileSync(manifestJsPath, "utf8");
    fs.writeFileSync(manifestJsPath, `${manifestJs}/* stale */\n`);
    assert(validateLessonAudio(lessonDir, { requirePublishedGold: true }).issues.some((issue) => issue.includes("manifest.js does not match")));
    fs.writeFileSync(manifestJsPath, manifestJs);

    const audioPath = path.join(lessonDir, "audio", "scene-one-mette.wav");
    const audioBytes = fs.readFileSync(audioPath);
    fs.unlinkSync(audioPath);
    assert(validateLessonAudio(lessonDir, { requirePublishedGold: true }).invalid.some((entry) => entry.problems.some((problem) => problem.includes("audio file is missing"))));
    fs.writeFileSync(audioPath, audioBytes);
    fs.writeFileSync(audioPath, Buffer.from("not audio"));
    assert(validateLessonAudio(lessonDir, { requirePublishedGold: true }).invalid.some((entry) => entry.utteranceId === "scene-one-mette"));
    fs.writeFileSync(audioPath, audioBytes);

    fs.writeFileSync(path.join(lessonDir, "audio", "orphan.wav"), makeWav(1));
    assert(validateLessonAudio(lessonDir, { requirePublishedGold: true }).issues.some((issue) => issue.includes("orphan files")));
    fs.unlinkSync(path.join(lessonDir, "audio", "orphan.wav"));

    fs.writeFileSync(path.join(lessonDir, "data.js"), lessonSource("Hej fra Mette igen.", "published"));
    const stale = validateLessonAudio(lessonDir, { requirePublishedGold: true });
    assert(stale.stale.includes("scene-one-mette"));
    assert(stale.issues.some((issue) => issue.includes("100%")));

    const interruptedDir = path.join(tempRoot, "lesson-audio-interrupted");
    fs.mkdirSync(interruptedDir);
    fs.writeFileSync(path.join(interruptedDir, "data.js"), interruptedLessonSource());
    fs.writeFileSync(path.join(interruptedDir, "index.html"), '  <script src="../../shared/plata-audio.js"></script>\n');
    let providerCalls = 0;
    await assert.rejects(() => generateLesson(interruptedDir, {
      coverage: "required",
      dryRun: false,
      force: false,
      provider: "mock",
      model: "fixture-v1",
      format: "wav",
      voiceProfile: "default",
      providerInstance: {
        async synthesize() {
          providerCalls += 1;
          if (providerCalls === 2) throw new Error("fixture interruption");
          return { bytes: makeWav(1), providerRequestId: "fixture" };
        }
      }
    }), /fixture interruption/);
    assert.strictEqual(providerCalls, 2);
    assert.deepStrictEqual(fs.readdirSync(path.join(interruptedDir, "audio")), []);

    const loudnessDir = path.join(tempRoot, "lesson-audio-loudness");
    fs.mkdirSync(loudnessDir);
    fs.writeFileSync(path.join(loudnessDir, "data.js"), interruptedLessonSource().replace(/lesson-audio-interrupted/g, "lesson-audio-loudness"));
    fs.writeFileSync(path.join(loudnessDir, "index.html"), '  <script src="../../shared/plata-audio.js"></script>\n');
    let loudnessCalls = 0;
    await assert.rejects(() => generateLesson(loudnessDir, {
      coverage: "required",
      dryRun: false,
      force: false,
      provider: "mock",
      model: "fixture-v1",
      format: "wav",
      voiceProfile: "default",
      providerInstance: {
        async synthesize() {
          loudnessCalls += 1;
          const bytes = makeWav(1);
          if (loudnessCalls === 2) {
            for (let offset = 44; offset + 1 < bytes.length; offset += 2) bytes.writeInt16LE(Math.round(bytes.readInt16LE(offset) * 0.2), offset);
          }
          return { bytes, providerRequestId: "fixture" };
        }
      }
    }), /dB RMS/);
    assert.strictEqual(loudnessCalls, 2);
    assert.deepStrictEqual(fs.readdirSync(path.join(loudnessDir, "audio")), []);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
  process.stdout.write("audio pipeline smoke QA passed\n");
}

run().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});

#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  MANIFEST_SCHEMA_VERSION,
  contentHash,
  expectedAudioSrc,
  extractUtterances,
  findLessonDirs,
  generationSettings,
  loadLessonData,
  readManifest,
  sha256File
} = require("./lib/audio-contract");
const { inspectAudioFile, qualityIssues } = require("./lib/audio-file");

const REPO_ROOT = path.resolve(__dirname, "..");
const REVIEW_CHECKLIST_KEYS = [
  "exactDanishWords",
  "naturalProsody",
  "correctStressAndPauses",
  "speakerConsistency",
  "noArtifactsOrCutoffs",
  "safeAt075And1x"
];

function round(value, places) {
  const factor = 10 ** (places || 1);
  return Math.round(value * factor) / factor;
}

function applyManifestVoiceProfile(utterance, config, settings) {
  const profileName = settings.voiceProfile;
  if (!profileName || profileName === "default") return utterance;
  if (utterance.explicitVoice) return utterance;
  const profile = config.voiceProfiles && config.voiceProfiles[profileName];
  if (!profile) return utterance;
  const voice = (utterance.speaker && profile.speakerVoices && profile.speakerVoices[utterance.speaker]) || profile.defaultVoice || utterance.voice;
  return Object.assign({}, utterance, { voice });
}

function validateReview(lessonDir, lessonId, requiredIds) {
  const issues = [];
  const reviewPath = path.join(lessonDir, "audio", "human-review.json");
  if (!fs.existsSync(reviewPath)) return { approved: false, issues: ["human-review.json is missing"] };
  let review;
  try {
    review = JSON.parse(fs.readFileSync(reviewPath, "utf8"));
  } catch (error) {
    return { approved: false, issues: [`human-review.json is invalid JSON: ${error.message}`] };
  }
  if (review.schemaVersion !== 1) issues.push("human-review.json schemaVersion must be 1");
  if (review.lessonId !== lessonId) issues.push("human-review.json lessonId does not match");
  if (review.status !== "approved") issues.push("human audio review status must be approved");
  if (typeof review.reviewer !== "string" || !review.reviewer.trim() || typeof review.reviewedAt !== "string" || Number.isNaN(Date.parse(review.reviewedAt))) {
    issues.push("human audio review needs reviewer and ISO reviewedAt");
  }
  REVIEW_CHECKLIST_KEYS.forEach((key) => {
    if (!review.checklist || review.checklist[key] !== true) issues.push(`human audio review checklist ${key} is not approved`);
  });
  const sampledIds = new Set(Array.isArray(review.sampledUtteranceIds) ? review.sampledUtteranceIds : []);
  (requiredIds || []).forEach((utteranceId) => {
    if (!sampledIds.has(utteranceId)) issues.push(`human audio review did not sample required utterance ${utteranceId}`);
  });
  return { approved: issues.length === 0, issues, review };
}

function validateLessonAudio(lessonDir, options) {
  const lesson = loadLessonData(lessonDir);
  const extracted = extractUtterances(lesson);
  const issues = extracted.issues.slice();
  const warnings = extracted.warnings.slice();
  const manifest = readManifest(lessonDir);
  const indexPath = path.join(lessonDir, "index.html");
  const indexSource = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf8") : "";
  const manifestScriptTag = '<script src="./audio/manifest.js"></script>';
  const publicationStatus = lesson.audio && lesson.audio.publicationStatus || "legacy";
  const requirePublished = Boolean(options && options.requirePublishedGold && lesson.qualityTier === "gold");
  const enforceAssets = publicationStatus === "published" || requirePublished;
  if (!lesson.audio) {
    const message = "legacy lesson has no audio contract; audio coverage is advisory";
    if (requirePublished) issues.push("gold release gate requires an audio contract and 100% required coverage");
    else warnings.push(message);
    return {
      lessonId: lesson.id,
      qualityTier: lesson.qualityTier || "standard",
      publicationStatus,
      required: 0,
      valid: 0,
      missing: [],
      stale: [],
      invalid: [],
      orphans: [],
      coveragePercent: null,
      humanReviewApproved: false,
      issues,
      warnings
    };
  }
  if (!["draft", "published"].includes(publicationStatus)) issues.push("audio.publicationStatus must be draft or published");
  const required = extracted.utterances.filter((utterance) => utterance.required);
  const expectedById = new Map(extracted.utterances.map((utterance) => [utterance.utteranceId, utterance]));
  const missing = [];
  const stale = [];
  const invalid = [];
  const validIds = new Set();
  const referencedNames = new Set();

  if (!manifest) {
    required.forEach((utterance) => missing.push(utterance.utteranceId));
    const message = "audio manifest is missing";
    if (enforceAssets) issues.push(message);
    else warnings.push(`${message}; draft audio remains non-publishable`);
    if (indexSource.includes(manifestScriptTag)) issues.push("index.html references a missing audio/manifest.js");
  } else {
    if (manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION) issues.push(`manifest.schemaVersion must be ${MANIFEST_SCHEMA_VERSION}`);
    if (manifest.lessonId !== lesson.id) issues.push("manifest.lessonId does not match lesson.id");
    if (manifest.locale !== "da-DK") issues.push("manifest.locale must be da-DK");
    if (!manifest.generator || manifest.generator.name !== "generate-lesson-audio" || manifest.generator.version !== 1) {
      issues.push("manifest.generator must identify generate-lesson-audio version 1");
    }
    if (!manifest.generation || typeof manifest.generation !== "object" || Array.isArray(manifest.generation)) {
      issues.push("manifest.generation is required");
    } else {
      ["provider", "model", "format", "voiceProfile"].forEach((field) => {
        if (typeof manifest.generation[field] !== "string" || !manifest.generation[field].trim()) {
          issues.push(`manifest.generation.${field} must be a non-empty string`);
        }
      });
      if (!("instructions" in manifest.generation) || (manifest.generation.instructions != null && typeof manifest.generation.instructions !== "string")) {
        issues.push("manifest.generation.instructions must be a string or null");
      }
    }
    if (!manifest.generatedAt || Number.isNaN(Date.parse(manifest.generatedAt))) issues.push("manifest.generatedAt must be an ISO timestamp");
    if (typeof manifest.disclosure !== "string" || !manifest.disclosure.trim()) issues.push("manifest.disclosure is required");
    if (manifest.generation && manifest.generation.provider === "openai" && manifest.disclosure !== "AI-generated Danish voice") {
      issues.push("OpenAI audio manifest must disclose an AI-generated Danish voice");
    }
    const manifestJsPath = path.join(lessonDir, "audio", "manifest.js");
    const expectedBrowserJson = JSON.stringify(manifest).replace(/</g, "\\u003c");
    const expectedManifestJs = `window.PLATA_AUDIO_MANIFESTS = window.PLATA_AUDIO_MANIFESTS || {};\nwindow.PLATA_AUDIO_MANIFESTS[${JSON.stringify(lesson.id)}] = ${expectedBrowserJson};\n`;
    if (!fs.existsSync(manifestJsPath)) issues.push("audio/manifest.js is missing");
    else if (fs.readFileSync(manifestJsPath, "utf8") !== expectedManifestJs) issues.push("audio/manifest.js does not match manifest.json");
    const runtimeScriptTag = '<script src="../../shared/plata-audio.js"></script>';
    if (!indexSource.includes(manifestScriptTag)) issues.push("index.html does not register audio/manifest.js");
    if (!indexSource.includes(runtimeScriptTag)) issues.push("index.html does not load shared/plata-audio.js");
    if (indexSource.includes(manifestScriptTag) && indexSource.includes(runtimeScriptTag) && indexSource.indexOf(manifestScriptTag) > indexSource.indexOf(runtimeScriptTag)) {
      issues.push("index.html must register audio/manifest.js before plata-audio.js");
    }
    if (manifest.generation && manifest.generation.provider === "mock" && process.env.NODE_ENV !== "test") issues.push("mock provider artifacts are test-only and cannot be published");
    const manifestClips = Array.isArray(manifest.clips) ? manifest.clips : [];
    if (!Array.isArray(manifest.clips)) issues.push("manifest.clips must be an array");
    const settings = generationSettings(lesson, manifest.generation || {});
    const seen = new Set();
    manifestClips.forEach((clip, clipIndex) => {
      const clipLabel = `manifest.clips[${clipIndex}]`;
      if (!clip || typeof clip !== "object") {
        issues.push(`${clipLabel} must be an object`);
        return;
      }
      if (seen.has(clip.utteranceId)) issues.push(`${clipLabel} duplicates ${clip.utteranceId}`);
      seen.add(clip.utteranceId);
      const baseUtterance = expectedById.get(clip.utteranceId);
      if (!baseUtterance) {
        issues.push(`${clipLabel}.utteranceId is not declared by Danish lesson content`);
        return;
      }
      const utterance = applyManifestVoiceProfile(baseUtterance, extracted.config, settings);
      const expectedHash = contentHash(utterance, settings);
      const clipProblems = [];
      if (clip.text !== utterance.text) clipProblems.push("text differs from lesson source");
      if (clip.spokenText !== utterance.spokenText) clipProblems.push("spokenText differs from lesson metadata");
      if (clip.speaker !== utterance.speaker) clipProblems.push("speaker differs from lesson metadata");
      if (clip.voice !== utterance.voice) clipProblems.push("voice differs from selected voice profile");
      if (clip.locale !== utterance.locale) clipProblems.push("locale differs from lesson metadata");
      if (clip.source !== utterance.source || clip.kind !== utterance.kind) clipProblems.push("source or kind differs from lesson contract");
      if (clip.required !== utterance.required) clipProblems.push("required flag differs from lesson contract");
      if (clip.contentHash !== expectedHash) stale.push(clip.utteranceId);
      let expectedSrc;
      try {
        expectedSrc = expectedAudioSrc(clip.utteranceId, settings.format);
      } catch (error) {
        clipProblems.push(error.message);
      }
      if (expectedSrc && clip.src !== expectedSrc) clipProblems.push(`src must be ${expectedSrc}`);
      if (clip.format !== settings.format || clip.provider !== settings.provider || clip.model !== settings.model) {
        clipProblems.push("format/provider/model differ from manifest generation settings");
      }
      if (!clip.generatedAt || Number.isNaN(Date.parse(clip.generatedAt))) clipProblems.push("generatedAt must be an ISO timestamp");
      if (clip.provider === "mock" && process.env.NODE_ENV !== "test") clipProblems.push("mock provider artifacts are test-only");
      if (expectedSrc) {
        const audioRoot = path.resolve(lessonDir, "audio");
        const filePath = path.resolve(lessonDir, typeof clip.src === "string" ? clip.src : "");
        if (!filePath.startsWith(`${audioRoot}${path.sep}`)) {
          clipProblems.push("src escapes the lesson audio directory");
        } else if (!fs.existsSync(filePath)) {
          clipProblems.push("audio file is missing");
        } else {
          referencedNames.add(path.basename(filePath));
          if (sha256File(filePath) !== clip.checksumSha256) clipProblems.push("SHA-256 checksum mismatch");
          try {
            const productionClip = clip.provider !== "mock";
            const metrics = inspectAudioFile(filePath, clip.format, { decode: productionClip });
            clipProblems.push(...qualityIssues(metrics));
            if (Math.abs(metrics.durationSeconds - Number(clip.durationSeconds)) > 0.08) clipProblems.push("duration differs from parsed audio stream");
            if (metrics.bytes !== clip.bytes) clipProblems.push("byte size differs from manifest");
            if (metrics.sampleRate && metrics.sampleRate !== clip.sampleRate) clipProblems.push("sample rate differs from manifest");
            if (metrics.bitrate && Math.abs(metrics.bitrate - Number(clip.bitrate)) > 1) clipProblems.push("bitrate differs from manifest");
            if (productionClip) {
              if (metrics.decodedForQc !== true) clipProblems.push("production clip could not be decoded for current QC validation");
              if (!clip.qc || clip.qc.decodedForQc !== true) clipProblems.push("production clip lacks decoded QC evidence");
              const tolerances = { rmsDbfs: 0.2, peakDbfs: 0.2, leadingSilenceSeconds: 0.03, trailingSilenceSeconds: 0.03 };
              Object.keys(tolerances).forEach((field) => {
                if (!Number.isFinite(clip.qc && clip.qc[field])) {
                  clipProblems.push(`production clip lacks qc.${field}`);
                } else if (Number.isFinite(metrics[field]) && Math.abs(metrics[field] - clip.qc[field]) > tolerances[field]) {
                  clipProblems.push(`qc.${field} differs from current decode`);
                }
              });
              if (clip.qc && clip.qc.cutoffRisk !== metrics.cutoffRisk) clipProblems.push("qc.cutoffRisk differs from current decode");
            }
          } catch (error) {
            clipProblems.push(`audio stream validation failed: ${error.message}`);
          }
        }
      }
      if (clipProblems.length) invalid.push({ utteranceId: clip.utteranceId, problems: clipProblems });
      else if (!stale.includes(clip.utteranceId)) validIds.add(clip.utteranceId);
    });
    required.forEach((utterance) => {
      if (!seen.has(utterance.utteranceId)) missing.push(utterance.utteranceId);
    });
  }

  const audioDir = path.join(lessonDir, "audio");
  const orphans = fs.existsSync(audioDir) ? fs.readdirSync(audioDir).filter((name) => {
    return !name.startsWith(".") && !["manifest.json", "manifest.js", "human-review.json"].includes(name) && !referencedNames.has(name);
  }).sort() : [];
  if (orphans.length) warnings.push(`orphan audio files: ${orphans.join(", ")}`);
  const requiredValid = required.filter((utterance) => validIds.has(utterance.utteranceId)).length;
  const coveragePercent = required.length ? round((requiredValid / required.length) * 100) : 100;
  const review = validateReview(lessonDir, lesson.id, required.map((utterance) => utterance.utteranceId));
  if (enforceAssets) {
    extracted.warnings.filter((warning) => warning.includes("speakerVoices mapping")).forEach((warning) => {
      issues.push(`published audio requires deliberate speaker casting: ${warning}`);
    });
    if (coveragePercent !== 100 || missing.length || stale.length || invalid.length) {
      issues.push(`gold audio release gate requires 100% valid required coverage; found ${coveragePercent}%`);
    }
    if (orphans.length) issues.push("published audio contains orphan files; review and remove them explicitly before release");
    if (!review.approved) issues.push(...review.issues);
  } else if (!review.approved) {
    warnings.push("human listening review is not approved; draft audio cannot be published");
  }
  return {
    lessonId: lesson.id,
    qualityTier: lesson.qualityTier || "standard",
    publicationStatus,
    required: required.length,
    valid: requiredValid,
    missing,
    stale,
    invalid,
    orphans,
    coveragePercent,
    humanReviewApproved: review.approved,
    issues,
    warnings
  };
}

function parseArgs(argv) {
  const args = { lessonIds: [], requirePublishedGold: false, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--lesson") args.lessonIds.push(...String(argv[++index] || "").split(",").filter(Boolean));
    else if (argv[index] === "--require-published-gold") args.requirePublishedGold = true;
    else if (argv[index] === "--json") args.json = true;
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  let dirs = findLessonDirs(REPO_ROOT);
  if (args.lessonIds.length) dirs = dirs.filter((lessonDir) => args.lessonIds.includes(path.basename(lessonDir)));
  if (args.lessonIds.length && dirs.length !== new Set(args.lessonIds).size) throw new Error("One or more --lesson ids were not found");
  const reports = dirs.map((lessonDir) => validateLessonAudio(lessonDir, args));
  if (args.json) process.stdout.write(`${JSON.stringify({ schemaVersion: 1, lessons: reports }, null, 2)}\n`);
  else reports.forEach((report) => {
    const coverage = report.coveragePercent == null ? "legacy" : `${report.coveragePercent}% (${report.valid}/${report.required})`;
    process.stdout.write(`${report.issues.length ? "FAIL" : "PASS"} ${report.lessonId}: ${coverage}, ${report.publicationStatus}\n`);
    report.issues.forEach((issue) => process.stdout.write(`  error: ${issue}\n`));
    report.invalid.forEach((entry) => process.stdout.write(`  error: ${entry.utteranceId}: ${entry.problems.join("; ")}\n`));
    report.warnings.forEach((warning) => process.stdout.write(`  note: ${warning}\n`));
  });
  if (reports.some((report) => report.issues.length || report.invalid.length)) process.exitCode = 1;
}

if (require.main === module) {
  try { main(); } catch (error) {
    process.stderr.write(`Audio validation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { validateLessonAudio, validateReview };

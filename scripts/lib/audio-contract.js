"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const AUDIO_SCHEMA_VERSION = 1;
const MANIFEST_SCHEMA_VERSION = 1;
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SUPPORTED_FORMATS = new Set(["mp3", "wav"]);

function normalizeText(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sha256File(filePath) {
  return sha256(fs.readFileSync(filePath));
}

function hasHtml(value) {
  return /<\/?[a-z][^>]*>/i.test(String(value || ""));
}

function loadLessonData(lessonDir) {
  const dataPath = path.join(lessonDir, "data.js");
  if (!fs.existsSync(dataPath)) throw new Error(`Missing lesson data: ${dataPath}`);
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(dataPath, "utf8"), sandbox, { filename: dataPath });
  const lessonKey = Object.keys(sandbox.window).find((key) => key === "LESSON" || key.indexOf("PLATA_LESSON_") === 0);
  const lesson = lessonKey && sandbox.window[lessonKey];
  if (!lesson || typeof lesson !== "object") throw new Error(`${dataPath} must assign window.LESSON or window.PLATA_LESSON_*`);
  return lesson;
}

function asAudioRef(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value;
}

function collectDeclaredAudioPaths(value, currentPath, result, seen) {
  if (!value || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  Object.keys(value).forEach((key) => {
    const childPath = currentPath ? `${currentPath}.${key}` : key;
    if (key === "audio" || /Audio$/.test(key)) result.add(childPath);
    collectDeclaredAudioPaths(value[key], childPath, result, seen);
  });
}

function extractUtterances(lesson) {
  const issues = [];
  const warnings = [];
  const utterances = [];
  const recognizedPaths = new Set();
  const config = lesson && lesson.audio && typeof lesson.audio === "object" ? lesson.audio : {};
  const locale = normalizeText(config.locale || "da-DK");
  const speakerVoices = config.speakerVoices && typeof config.speakerVoices === "object" ? config.speakerVoices : {};
  const defaultVoice = normalizeText(config.defaultVoice || "");
  const generation = config.generation && typeof config.generation === "object" ? config.generation : {};

  function push(refValue, sourceText, meta) {
    const ref = asAudioRef(refValue);
    if (!ref) {
      if (refValue != null) issues.push(`${meta.path} must be an audio metadata object`);
      return;
    }
    recognizedPaths.add(meta.path);
    const utteranceId = normalizeText(ref.utteranceId);
    const text = normalizeText(sourceText);
    const spokenSource = Object.prototype.hasOwnProperty.call(ref, "spokenText") ? ref.spokenText : text;
    const spokenText = normalizeText(spokenSource);
    const speaker = normalizeText(ref.speaker || meta.speaker || "");
    const voice = normalizeText(ref.voice || (speaker && speakerVoices[speaker]) || defaultVoice);
    if (!ID_PATTERN.test(utteranceId)) issues.push(`${meta.path}.utteranceId must use stable kebab-case`);
    if (!text) issues.push(`${meta.path} has no Danish source text`);
    if (!spokenText) issues.push(`${meta.path}.spokenText must not be empty`);
    if (hasHtml(spokenText)) issues.push(`${meta.path}.spokenText must contain plain text, not HTML`);
    if (hasHtml(speaker) || hasHtml(voice)) issues.push(`${meta.path} speaker and voice metadata must contain plain text`);
    if (!voice) issues.push(`${meta.path} cannot resolve a voice from ref.voice, speakerVoices, or defaultVoice`);
    if (speaker && !ref.voice && !speakerVoices[speaker]) {
      warnings.push(`${meta.path} speaker ${JSON.stringify(speaker)} uses defaultVoice; add speakerVoices mapping for a deliberate casting choice`);
    }
    utterances.push({
      utteranceId,
      text,
      spokenText,
      speaker: speaker || null,
      voice,
      explicitVoice: Boolean(normalizeText(ref.voice || "")),
      locale,
      required: ref.required !== false,
      source: meta.path,
      sceneId: meta.sceneId || null,
      kind: meta.kind,
      instructions: normalizeText(ref.instructions || generation.instructions || "") || null
    });
  }

  (lesson.scenes || []).forEach((scene, sceneIndex) => {
    const base = `scenes[${sceneIndex}]`;
    (scene.dialogue || []).forEach((line, lineIndex) => {
      push(line.audio, line.line, {
        path: `${base}.dialogue[${lineIndex}].audio`, sceneId: scene.id, kind: "dialogue", speaker: line.speaker
      });
    });
    push(scene.danishAudio, scene.danish, { path: `${base}.danishAudio`, sceneId: scene.id, kind: "danish-line" });
    (scene.options || []).forEach((option, optionIndex) => {
      push(option.audio, option.label, {
        path: `${base}.options[${optionIndex}].audio`, sceneId: scene.id, kind: "choice"
      });
      (option.repairLadder || []).forEach((step, stepIndex) => {
        push(step.audio, step.text, {
          path: `${base}.options[${optionIndex}].repairLadder[${stepIndex}].audio`, sceneId: scene.id, kind: "repair"
        });
      });
    });
    (scene.pairs || []).forEach((pair, pairIndex) => {
      push(pair.audio, pair.left, {
        path: `${base}.pairs[${pairIndex}].audio`, sceneId: scene.id, kind: "match"
      });
    });
    (scene.channelVersions || []).forEach((channel, channelIndex) => {
      push(channel.audio, channel.sample, {
        path: `${base}.channelVersions[${channelIndex}].audio`, sceneId: scene.id, kind: "channel-version"
      });
    });
    if (scene.modelAnswer && typeof scene.modelAnswer === "object") {
      push(scene.modelAnswer.audio, scene.modelAnswer.text, {
        path: `${base}.modelAnswer.audio`, sceneId: scene.id, kind: "model-answer"
      });
    }
  });

  (lesson.endings || []).forEach((ending, endingIndex) => {
    push(ending.audio, ending.danish, {
      path: `endings[${endingIndex}].audio`, sceneId: null, kind: "ending"
    });
  });

  const declaredPaths = new Set();
  collectDeclaredAudioPaths(lesson.scenes || [], "scenes", declaredPaths, new Set());
  collectDeclaredAudioPaths(lesson.endings || [], "endings", declaredPaths, new Set());
  declaredPaths.forEach((declaredPath) => {
    const canonical = declaredPath.replace(/^scenes\./, "scenes[").replace(/^endings\./, "endings[");
    if (![...recognizedPaths].some((recognized) => recognized.replace(/\[(\d+)\]/g, ".$1") === declaredPath.replace(/\[(\d+)\]/g, ".$1"))) {
      issues.push(`${canonical} is audio metadata on an unsupported or non-Danish field`);
    }
  });

  const seenIds = new Map();
  utterances.forEach((utterance) => {
    if (!utterance.utteranceId) return;
    if (seenIds.has(utterance.utteranceId)) {
      issues.push(`Duplicate utteranceId ${utterance.utteranceId} at ${seenIds.get(utterance.utteranceId)} and ${utterance.source}`);
    } else {
      seenIds.set(utterance.utteranceId, utterance.source);
    }
  });

  if (lesson.audio) {
    if (Number(config.schemaVersion) !== AUDIO_SCHEMA_VERSION) issues.push(`audio.schemaVersion must be ${AUDIO_SCHEMA_VERSION}`);
    if (locale !== "da-DK") issues.push("audio.locale must be da-DK for Danish lesson audio");
  }

  return { config, utterances, issues, warnings };
}

function generationSettings(lesson, overrides) {
  const config = lesson.audio || {};
  const generation = config.generation || {};
  const format = normalizeText(overrides.format || generation.format || "mp3").toLowerCase();
  const settings = {
    provider: normalizeText(overrides.provider || generation.provider || "openai"),
    model: normalizeText(overrides.model || generation.model || "gpt-4o-mini-tts-2025-12-15"),
    format,
    voiceProfile: normalizeText(overrides.voiceProfile || generation.voiceProfile || "default"),
    instructions: normalizeText(overrides.instructions || generation.instructions || "") || null
  };
  if (!SUPPORTED_FORMATS.has(format)) throw new Error(`Unsupported audio format: ${format}`);
  return settings;
}

function contentHash(utterance, settings) {
  return sha256(JSON.stringify({
    text: normalizeText(utterance.text),
    spokenText: normalizeText(utterance.spokenText),
    speaker: utterance.speaker || null,
    voice: utterance.voice,
    locale: utterance.locale,
    provider: settings.provider,
    model: settings.model,
    format: settings.format,
    voiceProfile: settings.voiceProfile,
    instructions: utterance.instructions || settings.instructions || null
  }));
}

function expectedAudioSrc(utteranceId, format) {
  if (!ID_PATTERN.test(utteranceId)) throw new Error(`Unsafe utteranceId: ${utteranceId}`);
  if (!SUPPORTED_FORMATS.has(format)) throw new Error(`Unsafe audio format: ${format}`);
  return `./audio/${utteranceId}.${format}`;
}

function readManifest(lessonDir) {
  const manifestPath = path.join(lessonDir, "audio", "manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function findLessonDirs(repoRoot) {
  const lessonsRoot = path.join(repoRoot, "lessons");
  return fs.readdirSync(lessonsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(lessonsRoot, entry.name, "data.js")))
    .map((entry) => path.join(lessonsRoot, entry.name))
    .sort();
}

module.exports = {
  AUDIO_SCHEMA_VERSION,
  ID_PATTERN,
  MANIFEST_SCHEMA_VERSION,
  SUPPORTED_FORMATS,
  contentHash,
  expectedAudioSrc,
  extractUtterances,
  findLessonDirs,
  generationSettings,
  loadLessonData,
  normalizeText,
  readManifest,
  sha256,
  sha256File
};

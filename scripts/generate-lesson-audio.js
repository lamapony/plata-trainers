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
const GENERATOR_VERSION = 1;

function usage() {
  return [
    "Usage:",
    "  npm run generate:lesson-audio -- --lesson lesson-b2-job-followup [options]",
    "  npm run generate:lesson-audio -- --all-gold [options]",
    "",
    "Options:",
    "  --dry-run                 Plan only; never calls a provider or writes files",
    "  --force                   Regenerate clips even when content hashes match",
    "  --provider <openai|mock>  Override lesson audio.generation.provider",
    "  --model <id>              Override the provider model",
    "  --format <mp3|wav>        Override output format",
    "  --voice-profile <name>    Use lesson audio.voiceProfiles[name]",
    "  --coverage <required|all> Generate required clips (default) or all declared clips",
    "  --help                    Show this help"
  ].join("\n");
}

function parseArgs(argv) {
  const parsed = { lessonIds: [], coverage: "required", dryRun: false, force: false, allGold: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--lesson") parsed.lessonIds.push(...String(argv[++index] || "").split(",").filter(Boolean));
    else if (arg === "--all-gold") parsed.allGold = true;
    else if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--force") parsed.force = true;
    else if (["--provider", "--model", "--format", "--voice-profile", "--coverage"].includes(arg)) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      parsed[key] = argv[++index];
      if (!parsed[key]) throw new Error(`${arg} requires a value`);
    } else if (arg === "--help" || arg === "-h") parsed.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!parsed.help && !parsed.lessonIds.length && !parsed.allGold) throw new Error("Choose --lesson <id> or --all-gold");
  if (!new Set(["required", "all"]).has(parsed.coverage)) throw new Error("--coverage must be required or all");
  return parsed;
}

function lessonDirsFor(args) {
  const all = findLessonDirs(REPO_ROOT);
  const byId = new Map(all.map((lessonDir) => [path.basename(lessonDir), lessonDir]));
  const selected = new Set(args.lessonIds);
  if (args.allGold) {
    all.forEach((lessonDir) => {
      if (loadLessonData(lessonDir).qualityTier === "gold") selected.add(path.basename(lessonDir));
    });
  }
  return [...selected].sort().map((id) => {
    if (!byId.has(id)) throw new Error(`Unknown lesson: ${id}`);
    return byId.get(id);
  });
}

function applyVoiceProfile(utterance, config, profileName) {
  if (!profileName || profileName === "default") return utterance;
  if (utterance.explicitVoice) return utterance;
  const profiles = config.voiceProfiles || {};
  const profile = profiles[profileName];
  if (!profile || typeof profile !== "object") throw new Error(`Unknown voice profile: ${profileName}`);
  const voice = (utterance.speaker && profile.speakerVoices && profile.speakerVoices[utterance.speaker]) || profile.defaultVoice || utterance.voice;
  return Object.assign({}, utterance, { voice: String(voice || "").trim() });
}

function createProvider(id) {
  if (id === "openai") return require("./lib/audio-providers/openai").createOpenAiProvider();
  if (id === "mock") return require("./lib/audio-providers/mock").createMockProvider();
  throw new Error(`Unsupported provider: ${id}`);
}

function manifestClipReusable(clip, utterance, hash, lessonDir, format) {
  if (!clip || clip.contentHash !== hash || clip.format !== format || clip.src !== expectedAudioSrc(utterance.utteranceId, format)) return false;
  const filePath = path.join(lessonDir, clip.src.replace(/^\.\//, ""));
  if (!fs.existsSync(filePath) || sha256File(filePath) !== clip.checksumSha256) return false;
  try {
    const metrics = inspectAudioFile(filePath, format, { decode: false });
    if (qualityIssues(Object.assign({}, metrics, clip.qc || {})).length) return false;
    if (clip.provider !== "mock" && (!clip.qc || clip.qc.decodedForQc !== true || !Number.isFinite(clip.qc.rmsDbfs))) return false;
    return true;
  } catch (_error) {
    return false;
  }
}

function listOrphans(audioDir, referencedNames) {
  if (!fs.existsSync(audioDir)) return [];
  return fs.readdirSync(audioDir).filter((name) => {
    return !name.startsWith(".") && !["manifest.json", "manifest.js", "human-review.json"].includes(name) && !referencedNames.has(name);
  }).sort();
}

function writeAtomic(filePath, value) {
  const tempPath = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tempPath, value);
  fs.renameSync(tempPath, filePath);
}

function assertManifestAnchor(indexPath) {
  const source = fs.readFileSync(indexPath, "utf8");
  const anchor = '  <script src="../../shared/plata-audio.js"></script>';
  if (!source.includes(anchor)) throw new Error(`${indexPath} must load ../../shared/plata-audio.js before a manifest can be registered`);
  return { source, anchor };
}

function ensureManifestScript(indexPath) {
  const { source, anchor } = assertManifestAnchor(indexPath);
  if (source.includes('<script src="./audio/manifest.js"></script>')) return;
  writeAtomic(indexPath, source.replace(anchor, `  <script src="./audio/manifest.js"></script>\n${anchor}`));
}

function buildReviewTemplate(lessonId, clips) {
  return {
    schemaVersion: 1,
    lessonId,
    status: "pending",
    reviewedAt: null,
    reviewer: null,
    checklist: {
      exactDanishWords: false,
      naturalProsody: false,
      correctStressAndPauses: false,
      speakerConsistency: false,
      noArtifactsOrCutoffs: false,
      safeAt075And1x: false
    },
    sampledUtteranceIds: clips.map((clip) => clip.utteranceId),
    notes: "Listen to every flagship clip, then set all checklist items true and status to approved. Do not claim human approval from automated checks."
  };
}

async function generateLesson(lessonDir, args) {
  const lesson = loadLessonData(lessonDir);
  const extracted = extractUtterances(lesson);
  if (extracted.issues.length) throw new Error(`${lesson.id} audio contract:\n- ${extracted.issues.join("\n- ")}`);
  if (!lesson.audio) {
    process.stdout.write(`${lesson.id}: no audio contract; skipped\n`);
    return { skipped: true };
  }
  assertManifestAnchor(path.join(lessonDir, "index.html"));
  const settings = generationSettings(lesson, args);
  const selected = extracted.utterances
    .filter((utterance) => args.coverage === "all" || utterance.required)
    .map((utterance) => applyVoiceProfile(utterance, extracted.config, settings.voiceProfile));
  const existing = readManifest(lessonDir);
  const existingById = new Map(((existing && existing.clips) || []).map((clip) => [clip.utteranceId, clip]));
  const planned = selected.map((utterance) => {
    const hash = contentHash(utterance, settings);
    const existingClip = existingById.get(utterance.utteranceId);
    const reusable = !args.force && manifestClipReusable(existingClip, utterance, hash, lessonDir, settings.format);
    let reason = "valid";
    if (args.force) reason = "forced";
    else if (!existingClip) reason = "missing";
    else if (existingClip.contentHash !== hash) reason = "stale";
    else if (!reusable) reason = "invalid";
    return { utterance, hash, action: reusable ? "reuse" : "generate", reason };
  });
  const retainedOptional = args.coverage === "required" ? extracted.utterances
    .filter((utterance) => !utterance.required)
    .map((utterance) => applyVoiceProfile(utterance, extracted.config, settings.voiceProfile))
    .filter((utterance) => {
      const hash = contentHash(utterance, settings);
      return manifestClipReusable(existingById.get(utterance.utteranceId), utterance, hash, lessonDir, settings.format);
    }) : [];
  const reusedCount = planned.filter((item) => item.action === "reuse").length;
  const generatedCount = planned.length - reusedCount;
  const requiredCount = extracted.utterances.filter((utterance) => utterance.required).length;
  const currentRequiredValid = planned.filter((item) => item.utterance.required && item.action === "reuse").length;
  const currentCoverage = requiredCount ? Math.round((currentRequiredValid / requiredCount) * 1000) / 10 : 100;
  process.stdout.write(`${lesson.id}: ${selected.length} selected (${requiredCount} required), current required coverage ${currentCoverage}% (${currentRequiredValid}/${requiredCount}), ${reusedCount} reusable, ${generatedCount} to generate\n`);
  planned.forEach((item) => process.stdout.write(`  ${item.action.padEnd(8)} ${item.utterance.utteranceId} [${item.reason}] · ${item.utterance.voice} · ${item.utterance.spokenText}\n`));
  if (retainedOptional.length) process.stdout.write(`  retain   ${retainedOptional.length} valid optional clip(s) outside required coverage\n`);
  const referencedNames = new Set(planned.concat(retainedOptional.map((utterance) => ({ utterance }))).map((item) => `${item.utterance.utteranceId}.${settings.format}`));
  const audioDir = path.join(lessonDir, "audio");
  const orphans = listOrphans(audioDir, referencedNames);
  if (orphans.length) process.stdout.write(`  orphans  ${orphans.join(", ")} (reported, never deleted automatically)\n`);
  if (args.dryRun) return { selected: selected.length, reused: reusedCount, generated: 0, planned: generatedCount, orphans };

  let provider = null;
  if (generatedCount) provider = args.providerInstance || createProvider(settings.provider);
  fs.mkdirSync(audioDir, { recursive: true });
  const staged = [];
  const clips = [];
  try {
    for (const item of planned) {
      if (item.action === "reuse") {
        clips.push(Object.assign({}, existingById.get(item.utterance.utteranceId), {
          text: item.utterance.text,
          spokenText: item.utterance.spokenText,
          speaker: item.utterance.speaker,
          voice: item.utterance.voice,
          locale: item.utterance.locale,
          source: item.utterance.source,
          kind: item.utterance.kind,
          required: item.utterance.required,
          contentHash: item.hash
        }));
        continue;
      }
      const result = await provider.synthesize({
        text: item.utterance.spokenText,
        voice: item.utterance.voice,
        model: settings.model,
        format: settings.format,
        instructions: item.utterance.instructions || settings.instructions
      });
      const tempPath = path.join(audioDir, `.tmp-${process.pid}-${item.utterance.utteranceId}.${settings.format}`);
      fs.writeFileSync(tempPath, result.bytes, { flag: "wx" });
      staged.push(tempPath);
      const metrics = inspectAudioFile(tempPath, settings.format);
      const qcIssues = qualityIssues(metrics);
      if (settings.provider !== "mock" && (!Number.isFinite(metrics.rmsDbfs) || !Number.isFinite(metrics.leadingSilenceSeconds))) {
        qcIssues.push("ffmpeg is required during production generation for decoded loudness/silence/cutoff QC");
      }
      if (qcIssues.length) throw new Error(`${item.utterance.utteranceId} failed audio QC: ${qcIssues.join("; ")}`);
      const generatedAt = new Date().toISOString();
      clips.push({
        utteranceId: item.utterance.utteranceId,
        text: item.utterance.text,
        spokenText: item.utterance.spokenText,
        speaker: item.utterance.speaker,
        voice: item.utterance.voice,
        locale: item.utterance.locale,
        source: item.utterance.source,
        kind: item.utterance.kind,
        required: item.utterance.required,
        src: expectedAudioSrc(item.utterance.utteranceId, settings.format),
        format: settings.format,
        provider: settings.provider,
        model: settings.model,
        contentHash: item.hash,
        checksumSha256: sha256File(tempPath),
        bytes: metrics.bytes,
        durationSeconds: metrics.durationSeconds,
        sampleRate: metrics.sampleRate || null,
        bitrate: metrics.bitrate || null,
        generatedAt,
        providerRequestId: result.providerRequestId || null,
        qc: {
          validatorVersion: 1,
          decodedForQc: metrics.decodedForQc === true || settings.format === "wav",
          rmsDbfs: Number.isFinite(metrics.rmsDbfs) ? metrics.rmsDbfs : null,
          peakDbfs: Number.isFinite(metrics.peakDbfs) ? metrics.peakDbfs : null,
          leadingSilenceSeconds: Number.isFinite(metrics.leadingSilenceSeconds) ? metrics.leadingSilenceSeconds : null,
          trailingSilenceSeconds: Number.isFinite(metrics.trailingSilenceSeconds) ? metrics.trailingSilenceSeconds : null,
          cutoffRisk: metrics.cutoffRisk === true
        }
      });
    }
    retainedOptional.forEach((utterance) => {
      const clip = existingById.get(utterance.utteranceId);
      clips.push(Object.assign({}, clip, {
        text: utterance.text,
        spokenText: utterance.spokenText,
        speaker: utterance.speaker,
        voice: utterance.voice,
        locale: utterance.locale,
        source: utterance.source,
        kind: utterance.kind,
        required: false,
        contentHash: contentHash(utterance, settings)
      }));
    });
    for (const item of planned.filter((entry) => entry.action === "generate")) {
      const tempPath = path.join(audioDir, `.tmp-${process.pid}-${item.utterance.utteranceId}.${settings.format}`);
      fs.renameSync(tempPath, path.join(audioDir, `${item.utterance.utteranceId}.${settings.format}`));
    }
    staged.length = 0;
    clips.sort((left, right) => left.utteranceId.localeCompare(right.utteranceId));
    const manifest = {
      schemaVersion: MANIFEST_SCHEMA_VERSION,
      lessonId: lesson.id,
      locale: extracted.config.locale,
      generatedAt: new Date().toISOString(),
      generator: { name: "generate-lesson-audio", version: GENERATOR_VERSION },
      generation: settings,
      disclosure: settings.provider === "openai" ? "AI-generated Danish voice" : "Synthetic Danish voice",
      clips
    };
    writeAtomic(path.join(audioDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    const browserJson = JSON.stringify(manifest).replace(/</g, "\\u003c");
    writeAtomic(path.join(audioDir, "manifest.js"), `window.PLATA_AUDIO_MANIFESTS = window.PLATA_AUDIO_MANIFESTS || {};\nwindow.PLATA_AUDIO_MANIFESTS[${JSON.stringify(lesson.id)}] = ${browserJson};\n`);
    const reviewPath = path.join(audioDir, "human-review.json");
    if (!fs.existsSync(reviewPath) || generatedCount) writeAtomic(reviewPath, `${JSON.stringify(buildReviewTemplate(lesson.id, clips), null, 2)}\n`);
    ensureManifestScript(path.join(lessonDir, "index.html"));
    process.stdout.write(`${lesson.id}: wrote ${clips.length} validated clips and manifest; run check:audio to verify review/publication state\n`);
    return { selected: selected.length, reused: reusedCount, generated: generatedCount, orphans };
  } catch (error) {
    staged.forEach((tempPath) => {
      try { fs.unlinkSync(tempPath); } catch (_cleanupError) { /* best effort */ }
    });
    throw error;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  for (const lessonDir of lessonDirsFor(args)) await generateLesson(lessonDir, args);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Audio generation failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { applyVoiceProfile, generateLesson, parseArgs };

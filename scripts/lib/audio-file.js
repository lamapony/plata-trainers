"use strict";

const fs = require("fs");
const { spawnSync } = require("child_process");

const MP3_BITRATES = {
  "1-1": [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
  "1-2": [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
  "1-3": [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  "2-1": [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
  "2-2": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  "2-3": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
};

function round(value, places) {
  const factor = 10 ** (places || 3);
  return Math.round(value * factor) / factor;
}

function parseMp3Frame(buffer, offset) {
  if (offset + 4 > buffer.length || buffer[offset] !== 0xff || (buffer[offset + 1] & 0xe0) !== 0xe0) return null;
  const versionBits = (buffer[offset + 1] >> 3) & 3;
  const layerBits = (buffer[offset + 1] >> 1) & 3;
  const bitrateIndex = (buffer[offset + 2] >> 4) & 15;
  const sampleIndex = (buffer[offset + 2] >> 2) & 3;
  const padding = (buffer[offset + 2] >> 1) & 1;
  if (versionBits === 1 || layerBits === 0 || bitrateIndex === 0 || bitrateIndex === 15 || sampleIndex === 3) return null;
  const version = versionBits === 3 ? 1 : (versionBits === 2 ? 2 : 2.5);
  const layer = 4 - layerBits;
  const tableVersion = version === 1 ? 1 : 2;
  const bitrate = MP3_BITRATES[`${tableVersion}-${layer}`][bitrateIndex] * 1000;
  const baseRates = [44100, 48000, 32000];
  const sampleRate = baseRates[sampleIndex] / (version === 1 ? 1 : (version === 2 ? 2 : 4));
  const samples = layer === 1 ? 384 : (layer === 3 && version !== 1 ? 576 : 1152);
  const frameLength = layer === 1
    ? Math.floor((12 * bitrate) / sampleRate + padding) * 4
    : Math.floor(((layer === 3 && version !== 1 ? 72 : 144) * bitrate) / sampleRate + padding);
  if (!bitrate || !sampleRate || frameLength < 4 || offset + frameLength > buffer.length) return null;
  return { bitrate, frameLength, sampleRate, samples, version, layer };
}

function skipId3v2(buffer) {
  if (buffer.length < 10 || buffer.toString("ascii", 0, 3) !== "ID3") return 0;
  const size = ((buffer[6] & 0x7f) << 21) | ((buffer[7] & 0x7f) << 14) | ((buffer[8] & 0x7f) << 7) | (buffer[9] & 0x7f);
  const footerSize = (buffer[5] & 0x10) !== 0 ? 10 : 0;
  return Math.min(buffer.length, 10 + size + footerSize);
}

function inspectMp3(buffer) {
  let offset = skipId3v2(buffer);
  let first = -1;
  while (offset + 4 <= buffer.length) {
    if (parseMp3Frame(buffer, offset)) {
      first = offset;
      break;
    }
    offset += 1;
  }
  if (first < 0) throw new Error("MP3 frame signature not found");
  let frames = 0;
  let duration = 0;
  let audioBytes = 0;
  let sampleRate = 0;
  let previous = null;
  offset = first;
  while (offset + 4 <= buffer.length) {
    const frame = parseMp3Frame(buffer, offset);
    if (!frame) break;
    if (previous && (frame.sampleRate !== previous.sampleRate || frame.layer !== previous.layer)) {
      throw new Error("MP3 stream changes sample rate or layer mid-file");
    }
    frames += 1;
    duration += frame.samples / frame.sampleRate;
    audioBytes += frame.frameLength;
    sampleRate = frame.sampleRate;
    previous = frame;
    offset += frame.frameLength;
  }
  if (frames < 2) throw new Error("MP3 has fewer than two complete frames");
  return {
    codec: "mp3",
    durationSeconds: round(duration),
    sampleRate,
    bitrate: Math.round((audioBytes * 8) / duration),
    frameCount: frames,
    bytes: buffer.length
  };
}

function findWaveChunks(buffer) {
  if (buffer.length < 44 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("WAV RIFF/WAVE signature not found");
  }
  let offset = 12;
  let format = null;
  let data = null;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (start + size > buffer.length) throw new Error(`WAV ${id} chunk is truncated`);
    if (id === "fmt ") {
      format = {
        audioFormat: buffer.readUInt16LE(start),
        channels: buffer.readUInt16LE(start + 2),
        sampleRate: buffer.readUInt32LE(start + 4),
        byteRate: buffer.readUInt32LE(start + 8),
        bitsPerSample: buffer.readUInt16LE(start + 14)
      };
    } else if (id === "data") {
      data = { start, size };
    }
    offset = start + size + (size % 2);
  }
  if (!format || !data) throw new Error("WAV requires fmt and data chunks");
  return { format, data };
}

function analyzePcm16(buffer, sampleRate, channels) {
  const sampleCount = Math.floor(buffer.length / 2 / channels);
  if (!sampleCount) return null;
  const amplitudes = new Float64Array(sampleCount);
  let sumSquares = 0;
  let peak = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    let mixed = 0;
    for (let channel = 0; channel < channels; channel += 1) {
      mixed += buffer.readInt16LE((index * channels + channel) * 2) / 32768;
    }
    const amplitude = Math.abs(mixed / channels);
    amplitudes[index] = amplitude;
    sumSquares += amplitude * amplitude;
    peak = Math.max(peak, amplitude);
  }
  const threshold = 10 ** (-42 / 20);
  let firstSound = 0;
  while (firstSound < amplitudes.length && amplitudes[firstSound] < threshold) firstSound += 1;
  let lastSound = amplitudes.length - 1;
  while (lastSound >= 0 && amplitudes[lastSound] < threshold) lastSound -= 1;
  const edgeSamples = Math.max(1, Math.round(sampleRate * 0.02));
  let edgeSum = 0;
  for (let index = Math.max(0, amplitudes.length - edgeSamples); index < amplitudes.length; index += 1) {
    edgeSum += amplitudes[index] * amplitudes[index];
  }
  const edgeRms = Math.sqrt(edgeSum / Math.min(edgeSamples, amplitudes.length));
  const toDb = (value) => value > 0 ? 20 * Math.log10(value) : -120;
  return {
    rmsDbfs: round(toDb(Math.sqrt(sumSquares / sampleCount)), 2),
    peakDbfs: round(toDb(peak), 2),
    leadingSilenceSeconds: round(firstSound / sampleRate),
    trailingSilenceSeconds: round((amplitudes.length - 1 - lastSound) / sampleRate),
    cutoffRisk: edgeRms > 10 ** (-24 / 20)
  };
}

function inspectWav(buffer) {
  const { format, data } = findWaveChunks(buffer);
  if (![1, 3].includes(format.audioFormat)) throw new Error(`Unsupported WAV encoding ${format.audioFormat}`);
  const duration = data.size / format.byteRate;
  const result = {
    codec: format.audioFormat === 1 ? "pcm" : "float",
    durationSeconds: round(duration),
    sampleRate: format.sampleRate,
    bitrate: format.byteRate * 8,
    channels: format.channels,
    bitsPerSample: format.bitsPerSample,
    bytes: buffer.length
  };
  if (format.audioFormat === 1 && format.bitsPerSample === 16) {
    Object.assign(result, analyzePcm16(buffer.subarray(data.start, data.start + data.size), format.sampleRate, format.channels));
  }
  return result;
}

function inspectAudioBuffer(buffer, format) {
  const normalized = String(format || "").toLowerCase();
  if (normalized === "mp3") return inspectMp3(buffer);
  if (normalized === "wav") return inspectWav(buffer);
  if (!buffer || buffer.length < 16) throw new Error(`${normalized || "audio"} file is too small to contain a valid stream`);
  return { codec: normalized, bytes: buffer.length };
}

function decodePcmWithFfmpeg(filePath) {
  const result = spawnSync("ffmpeg", ["-v", "error", "-i", filePath, "-f", "s16le", "-ac", "1", "-ar", "16000", "pipe:1"], {
    encoding: null,
    maxBuffer: 64 * 1024 * 1024
  });
  if (result.error && result.error.code === "ENOENT") return null;
  if (result.status !== 0 || !result.stdout || !result.stdout.length) {
    const stderr = result.stderr ? result.stderr.toString("utf8").trim() : "unknown ffmpeg error";
    throw new Error(`ffmpeg could not decode audio: ${stderr.slice(0, 300)}`);
  }
  return analyzePcm16(result.stdout, 16000, 1);
}

function inspectAudioFile(filePath, format, options) {
  const result = inspectAudioBuffer(fs.readFileSync(filePath), format);
  if (!options || options.decode !== false) {
    const decoded = decodePcmWithFfmpeg(filePath);
    if (decoded) Object.assign(result, decoded, { decodedForQc: true });
  }
  return result;
}

function qualityIssues(metrics) {
  const issues = [];
  if (!Number.isFinite(metrics.bytes) || metrics.bytes < 1000) issues.push("file is smaller than 1000 bytes");
  if (!Number.isFinite(metrics.durationSeconds) || metrics.durationSeconds < 0.35 || metrics.durationSeconds > 90) {
    issues.push("duration must be between 0.35 and 90 seconds");
  }
  if (Number.isFinite(metrics.sampleRate) && metrics.sampleRate < 16000) issues.push("sample rate must be at least 16 kHz");
  if (Number.isFinite(metrics.bitrate) && metrics.bitrate < 24000) issues.push("bitrate must be at least 24 kbps");
  if (Number.isFinite(metrics.rmsDbfs) && (metrics.rmsDbfs < -36 || metrics.rmsDbfs > -8)) issues.push("RMS loudness must be between -36 and -8 dBFS");
  if (Number.isFinite(metrics.peakDbfs) && metrics.peakDbfs > -0.05) issues.push("audio peak indicates clipping");
  if (Number.isFinite(metrics.leadingSilenceSeconds) && metrics.leadingSilenceSeconds > 0.8) issues.push("leading silence exceeds 0.8 seconds");
  if (Number.isFinite(metrics.trailingSilenceSeconds) && metrics.trailingSilenceSeconds > 1) issues.push("trailing silence exceeds 1 second");
  if (metrics.cutoffRisk === true) issues.push("decoded tail has a possible hard cutoff");
  return issues;
}

module.exports = {
  inspectAudioBuffer,
  inspectAudioFile,
  qualityIssues
};

"use strict";

function makeWav(durationSeconds) {
  const sampleRate = 24000;
  const lead = Math.round(sampleRate * 0.08);
  const tail = Math.round(sampleRate * 0.12);
  const samples = Math.max(Math.round(sampleRate * durationSeconds), lead + tail + 1);
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let index = lead; index < samples - tail; index += 1) {
    const envelope = Math.min(1, (index - lead) / 240, (samples - tail - index) / 240);
    const sample = Math.round(Math.sin((2 * Math.PI * 220 * index) / sampleRate) * 0.18 * Math.max(0, envelope) * 32767);
    buffer.writeInt16LE(sample, 44 + index * 2);
  }
  return buffer;
}

function createMockProvider() {
  if (process.env.NODE_ENV !== "test") throw new Error("provider=mock is restricted to NODE_ENV=test and must never publish lesson audio");
  return {
    id: "mock",
    async synthesize(request) {
      if (request.format !== "wav") throw new Error("The deterministic mock provider only supports WAV");
      return { bytes: makeWav(Math.min(6, Math.max(0.8, request.text.length / 24))), providerRequestId: "fixture" };
    }
  };
}

module.exports = { createMockProvider, makeWav };

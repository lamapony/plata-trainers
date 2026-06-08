#!/usr/bin/env node
"use strict";

const rawAnswerKey = /^(answer|expected|given|input|learnerText|prompt|response|text)$/i;
const forbiddenRawText = [
  "secret expected text",
  "secret given text",
  "should not leak"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoRawAnswerPayload(value, path) {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoRawAnswerPayload(item, `${path}[${index}]`));
    return;
  }
  if (typeof value === "object") {
    Object.entries(value).forEach(([key, child]) => {
      assert(!rawAnswerKey.test(key), `${path}.${key}: raw answer-like key is not allowed in correction records`);
      assertNoRawAnswerPayload(child, `${path}.${key}`);
    });
    return;
  }
  const text = String(value);
  forbiddenRawText.forEach(secret => {
    assert(!text.includes(secret), `${path}: raw learner answer text leaked into correction record`);
  });
}

function stringField(record, key, index, options = {}) {
  const value = record[key];
  if (value === undefined || value === null || value === "") {
    assert(!options.required, `correction ${index}: ${key} is required`);
    return "";
  }
  assert(typeof value === "string", `correction ${index}: ${key} must be a string`);
  assert(value.length <= (options.limit || 160), `correction ${index}: ${key} is too long`);
  return value;
}

function validateMemoryCorrections(profile) {
  const memory = profile && profile.memory && typeof profile.memory === "object" ? profile.memory : {};
  const records = memory.correctionRecords;
  if (records === undefined) {
    return { recordCount: 0, factIds: [], sourceFingerprints: [] };
  }
  assert(Array.isArray(records), "memory.correctionRecords must be an array");

  const seen = new Set();
  const factIds = [];
  const sourceFingerprints = [];
  records.forEach((record, index) => {
    assert(record && typeof record === "object" && !Array.isArray(record), `correction ${index}: record must be an object`);
    assertNoRawAnswerPayload(record, `correction ${index}`);
    if (record.schemaVersion !== undefined) {
      assert(Number(record.schemaVersion) === 1, `correction ${index}: unsupported schemaVersion`);
    }

    const factId = stringField(record, "factId", index, { required: true, limit: 120 });
    const reason = stringField(record, "reason", index, { required: true, limit: 120 });
    const correctedAt = stringField(record, "correctedAt", index, { required: true, limit: 80 });
    stringField(record, "kind", index, { limit: 80 });
    stringField(record, "signal", index, { limit: 120 });
    stringField(record, "trainerId", index, { limit: 120 });
    const sourceFingerprint = stringField(record, "sourceFingerprint", index, { limit: 120 });

    assert(reason === "learner-marked-incorrect", `correction ${index}: unsupported reason`);
    assert(!Number.isNaN(Date.parse(correctedAt)), `correction ${index}: correctedAt must be parseable`);
    assert(!seen.has(factId), `correction ${index}: duplicate corrected fact ${factId}`);

    seen.add(factId);
    factIds.push(factId);
    if (sourceFingerprint) sourceFingerprints.push(sourceFingerprint);
  });

  return {
    recordCount: records.length,
    factIds,
    sourceFingerprints
  };
}

function sampleProfile() {
  return {
    profileSchemaVersion: 1,
    memory: {
      schemaVersion: 1,
      fingerprint: "mem-corrections",
      facts: [],
      deletedFactIds: ["mem-hidden"],
      correctionRecords: [
        {
          schemaVersion: 1,
          factId: "mem-corrected-passive",
          reason: "learner-marked-incorrect",
          correctedAt: "2026-06-08T08:04:00.000Z",
          kind: "weak_signal",
          signal: "passive-agency",
          trainerId: "lesson-b2-radiator-register",
          sourceFingerprint: "memsrc-corrected"
        },
        {
          schemaVersion: 1,
          factId: "mem-corrected-context",
          reason: "learner-marked-incorrect",
          correctedAt: "2026-06-08T08:05:00.000Z",
          kind: "preferred_context",
          signal: "",
          trainerId: "profile",
          sourceFingerprint: "memsrc-context"
        }
      ]
    }
  };
}

function runMutation(name, mutate, expectedMessage) {
  const profile = sampleProfile();
  mutate(profile);
  try {
    validateMemoryCorrections(profile);
  } catch (err) {
    assert(String(err.message || "").includes(expectedMessage), `${name}: expected "${expectedMessage}", got "${err.message}"`);
    console.log(`ok - memory correction mutation caught: ${name}`);
    return;
  }
  throw new Error(`${name}: mutation should have failed`);
}

function run() {
  const summary = validateMemoryCorrections(sampleProfile());
  assert(summary.recordCount === 2, "correction contract should count records");
  assert(summary.factIds.includes("mem-corrected-passive"), "correction contract should preserve fact ids");
  assert(summary.sourceFingerprints.includes("memsrc-corrected"), "correction contract should preserve source fingerprints");

  runMutation("duplicate corrected fact", profile => {
    profile.memory.correctionRecords.push(clone(profile.memory.correctionRecords[0]));
  }, "duplicate corrected fact");
  runMutation("raw expected key", profile => {
    profile.memory.correctionRecords[0].expected = "secret expected text";
  }, "raw answer-like key");
  runMutation("raw answer text value", profile => {
    profile.memory.correctionRecords[0].sourceFingerprint = "secret given text";
  }, "raw learner answer text");
  runMutation("missing fact id", profile => {
    profile.memory.correctionRecords[0].factId = "";
  }, "factId is required");
  runMutation("bad correctedAt", profile => {
    profile.memory.correctionRecords[0].correctedAt = "not-a-date";
  }, "correctedAt must be parseable");
  runMutation("non-array corrections", profile => {
    profile.memory.correctionRecords = {};
  }, "must be an array");

  console.log("ok - learner memory correction records are schema-checked");
  console.log("ok - learner memory correction mutations prove bad records fail");
}

if (require.main === module) run();

module.exports = {
  validateMemoryCorrections
};

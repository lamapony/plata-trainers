#!/usr/bin/env node
"use strict";

const assert = require("assert");
const path = require("path");
const api = require("../shared/plata-profile.js");

function run() {
  const unknown = api.classifyArtifact({ hello: "world" });
  assert.strictEqual(unknown.ok, false);
  assert.strictEqual(unknown.kind, api.KIND_UNKNOWN);

  const malformed = api.classifyArtifact("{not-json");
  assert.strictEqual(malformed.ok, false);

  const future = api.classifyArtifact({
    artifactType: api.ARTIFACT_TYPE,
    profileSchemaVersion: 99,
    trainers: {}
  });
  assert.strictEqual(future.ok, false, "future profile versions must fail closed");

  const backup = api.buildProfileBackup({
    schemaVersion: 2,
    trainers: {
      ordstilling: {
        trainerId: "ordstilling",
        schemaVersion: 2,
        byItemId: {},
        attempts: [],
        meta: { totalAttempts: 2 }
      }
    },
    practicePlan: null,
    memory: { correctionRecords: [{ factId: "f1" }] },
    guidedSessionOutcomes: { outcomes: [] }
  });
  assert.strictEqual(backup.artifactType, api.ARTIFACT_TYPE);
  assert.strictEqual(backup.profileSchemaVersion, 2);

  const classified = api.classifyArtifact(backup);
  assert.strictEqual(classified.kind, api.KIND_PROFILE_V2);

  const prepared = api.prepareImport(backup, { confirmClearNulls: false });
  assert.strictEqual(prepared.requiresConfirm, true, "null practicePlan requires confirm");
  assert.ok(prepared.preview.summaryLines.length >= 3);

  const confirmed = api.prepareImport(backup, { confirmClearNulls: true });
  assert.strictEqual(confirmed.ok, true);
  assert.strictEqual(confirmed.plan.practicePlan.action, "clear");

  const store = {
    trainers: {
      register: { trainerId: "register", schemaVersion: 2, byItemId: { keep: true }, attempts: [], meta: {} }
    },
    practicePlan: { steps: [{ id: "keep-me" }] },
    memoryDeletedIds: ["old"],
    memoryCorrections: [],
    memoryVault: null,
    guided: { outcomes: [{ id: 1 }] }
  };

  const adapters = {
    readTrainers: () => JSON.parse(JSON.stringify(store.trainers)),
    readPracticePlan: () => store.practicePlan,
    readMemoryDeletedIds: () => store.memoryDeletedIds.slice(),
    readMemoryCorrections: () => store.memoryCorrections.slice(),
    readMemoryVault: () => store.memoryVault,
    readGuidedOutcomes: () => store.guided,
    replaceTrainer: (id, value) => { store.trainers[id] = value; },
    clearTrainer: (id) => { delete store.trainers[id]; },
    replaceTrainers: (map) => { store.trainers = map; },
    writePracticePlan: (plan) => { store.practicePlan = plan; return plan; },
    clearPracticePlan: () => { store.practicePlan = null; },
    writeMemoryDeletedIds: (ids) => { store.memoryDeletedIds = ids; },
    writeMemoryCorrections: (rows) => { store.memoryCorrections = rows; },
    writeMemoryVault: (vault) => { store.memoryVault = vault; },
    writeGuidedOutcomes: (ledger) => { store.guided = ledger; },
    mergeMemoryVault: () => ({ factCount: 0 })
  };

  // Missing sections preserved: import trainers-only should keep local plan
  const trainersOnly = {
    artifactType: api.ARTIFACT_TYPE,
    profileSchemaVersion: 2,
    trainers: {
      ordstilling: { trainerId: "ordstilling", schemaVersion: 2, byItemId: {}, attempts: [], meta: { totalAttempts: 1 } }
    }
  };
  const partial = api.prepareImport(trainersOnly);
  assert.strictEqual(partial.ok, true);
  assert.strictEqual(partial.plan.practicePlan.action, "preserve");
  const partialResult = api.commitImport(partial, adapters);
  assert.strictEqual(partialResult.ok, true);
  assert.ok(store.trainers.ordstilling);
  assert.ok(store.trainers.register, "neighbour trainer preserved");
  assert.ok(store.practicePlan && store.practicePlan.steps.length === 1, "missing plan section preserved");

  const malformedTrainer = api.prepareImport({
    artifactType: api.ARTIFACT_TYPE,
    profileSchemaVersion: 2,
    trainers: { ordstilling: "not-a-state" }
  });
  assert.strictEqual(malformedTrainer.ok, false, "malformed trainer state must be rejected before writes");

  const malformedPlan = api.prepareImport({
    artifactType: api.ARTIFACT_TYPE,
    profileSchemaVersion: 2,
    practicePlan: "not-a-plan"
  });
  assert.strictEqual(malformedPlan.ok, false, "malformed practice plan must be rejected before writes");

  // Unknown JSON must not write
  const before = JSON.stringify(store);
  const bad = api.prepareImport({ nope: true });
  assert.strictEqual(bad.ok, false);
  assert.strictEqual(JSON.stringify(store), before);

  // Rollback after a partial write failure must restore the exact snapshot.
  const rollbackBefore = JSON.stringify(store);
  const twoTrainers = api.prepareImport({
    artifactType: api.ARTIFACT_TYPE,
    profileSchemaVersion: 2,
    trainers: {
      bojning: { trainerId: "bojning", schemaVersion: 2, byItemId: {}, attempts: [], meta: {} },
      ordstilling: { trainerId: "ordstilling", schemaVersion: 2, byItemId: {}, attempts: [], meta: {} }
    }
  });
  let writes = 0;
  const failing = {
    ...adapters,
    replaceTrainer: (id, value) => {
      writes += 1;
      if (writes === 2) throw new Error("disk full");
      store.trainers[id] = value;
    }
  };
  const failResult = api.commitImport(twoTrainers, failing);
  assert.strictEqual(failResult.ok, false);
  assert.strictEqual(failResult.rolledBack, true);
  assert.strictEqual(JSON.stringify(store), rollbackBefore, "rollback restores exact state after partial writes");

  // Trainer-state artifact
  const trainerState = {
    trainerId: "bojning",
    schemaVersion: 2,
    byItemId: {},
    attempts: [],
    meta: { totalAttempts: 0 }
  };
  const ts = api.classifyArtifact(trainerState);
  assert.strictEqual(ts.kind, api.KIND_TRAINER_STATE);

  // Nested memory vault must not steal classification from a full profile backup
  const withNestedVault = api.buildProfileBackup({
    schemaVersion: 2,
    trainers: { ordstilling: { trainerId: "ordstilling", byItemId: {}, attempts: [], meta: {} } },
    memoryVault: { vaultType: "plata.memory-vault", factCount: 1 }
  });
  assert.strictEqual(api.classifyArtifact(withNestedVault).kind, api.KIND_PROFILE_V2);

  // Standalone vault remains vault
  assert.strictEqual(api.classifyArtifact({ vaultType: "plata.memory-vault", facts: [] }).kind, api.KIND_MEMORY_VAULT);

  console.log("ok - classify rejects unknown/malformed");
  console.log("ok - profile v2 backup + null-clear confirm");
  console.log("ok - missing sections preserved; neighbors untouched");
  console.log("ok - commit rollback on write failure");
  console.log("ok - trainer-state and legacy v1 classification");
}

run();

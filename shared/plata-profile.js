/* Platå profile portability v2
 *
 * Safe classify → prepare → preview → commit import for local learner backups.
 * Missing sections are preserved. Explicit null clears a section only after confirm.
 * Commit failures roll back to the pre-import snapshot.
 */
(function (root) {
  "use strict";

  var ARTIFACT_TYPE = "plata.profile-backup";
  var PROFILE_SCHEMA_VERSION = 2;
  var KIND_PROFILE_V2 = "profile-backup-v2";
  var KIND_PROFILE_V1 = "profile-backup-v1";
  var KIND_TRAINER_STATE = "trainer-state";
  var KIND_MEMORY_VAULT = "memory-vault";
  var KIND_UNKNOWN = "unknown";

  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function invalidClassification(error, payload) {
    return { kind: KIND_UNKNOWN, ok: false, error: error, payload: payload || null };
  }

  function looksLikeTrainerState(value) {
    if (!isObject(value)) return false;
    return !!(
      value.trainerId ||
      value.schemaVersion !== undefined ||
      isObject(value.byItemId) ||
      isObject(value.items) ||
      Array.isArray(value.attempts) ||
      isObject(value.meta)
    );
  }

  function classifyArtifact(input) {
    var payload = input;
    if (typeof input === "string") {
      try {
        payload = JSON.parse(input);
      } catch (err) {
        return {
          kind: KIND_UNKNOWN,
          ok: false,
          error: "Invalid JSON: " + err.message,
          payload: null
        };
      }
    }
    if (!isObject(payload)) {
      return { kind: KIND_UNKNOWN, ok: false, error: "Expected a JSON object", payload: null };
    }

    // Standalone vault export only — nested memoryVault inside a profile backup must not win.
    if (payload.vaultType === "plata.memory-vault") {
      return {
        kind: KIND_MEMORY_VAULT,
        ok: true,
        error: null,
        payload: payload,
        standalone: true
      };
    }

    if (hasOwn(payload, "artifactType") && payload.artifactType !== ARTIFACT_TYPE) {
      return invalidClassification("Unknown profile artifactType", payload);
    }
    if (payload.artifactType === ARTIFACT_TYPE) {
      var declaredVersion = Number(payload.profileSchemaVersion || PROFILE_SCHEMA_VERSION);
      if (declaredVersion !== PROFILE_SCHEMA_VERSION) {
        return invalidClassification("Unsupported profileSchemaVersion: " + declaredVersion, payload);
      }
      return { kind: KIND_PROFILE_V2, ok: true, error: null, payload: payload, standalone: false };
    }
    if (Number(payload.profileSchemaVersion) === PROFILE_SCHEMA_VERSION) {
      if (!hasOwn(payload, "trainers") && !hasOwn(payload, "practicePlan") && !hasOwn(payload, "memory") && !hasOwn(payload, "memoryVault") && !hasOwn(payload, "guidedSessionOutcomes")) {
        return invalidClassification("Profile backup has no importable sections", payload);
      }
      return { kind: KIND_PROFILE_V2, ok: true, error: null, payload: payload, standalone: false };
    }
    if (hasOwn(payload, "profileSchemaVersion") && Number(payload.profileSchemaVersion) > PROFILE_SCHEMA_VERSION) {
      return invalidClassification("Unsupported profileSchemaVersion: " + payload.profileSchemaVersion, payload);
    }

    if (hasOwn(payload, "trainers") || Number(payload.profileSchemaVersion) === 1 || (payload.exportedAt && payload.schemaVersion)) {
      // Legacy dashboard backup (v1) or ambiguous export with trainers map.
      if (isObject(payload.trainers) || hasOwn(payload, "practicePlan") || hasOwn(payload, "memory")) {
        return { kind: KIND_PROFILE_V1, ok: true, error: null, payload: payload, standalone: false };
      }
    }

    if (payload.memoryVault && payload.memoryVault.vaultType === "plata.memory-vault" && !hasOwn(payload, "trainers")) {
      return {
        kind: KIND_MEMORY_VAULT,
        ok: true,
        error: null,
        payload: payload,
        standalone: false
      };
    }

    if (payload.trainerId && (payload.byItemId || payload.items || Array.isArray(payload.attempts))) {
      return { kind: KIND_TRAINER_STATE, ok: true, error: null, payload: payload, standalone: false };
    }

    return {
      kind: KIND_UNKNOWN,
      ok: false,
      error: "Unknown JSON — not a Platå profile backup, trainer state, or memory vault",
      payload: payload
    };
  }

  function sectionAction(present, value, confirmClearNulls) {
    if (!present) return { action: "preserve", clear: false, apply: false };
    if (value === null) {
      return {
        action: confirmClearNulls ? "clear" : "clear-requires-confirm",
        clear: true,
        apply: !!confirmClearNulls
      };
    }
    return { action: "replace", clear: false, apply: true };
  }

  function trainerPreview(trainers) {
    if (!isObject(trainers)) return [];
    return Object.keys(trainers).sort().map(function (id) {
      var state = trainers[id];
      var attempts = state && Array.isArray(state.attempts) ? state.attempts.length : 0;
      var total = state && state.meta ? Number(state.meta.totalAttempts || attempts || 0) : attempts;
      return { trainerId: id, attempts: total };
    });
  }

  function prepareImport(rawInput, options) {
    options = options || {};
    var classified = classifyArtifact(rawInput);
    if (!classified.ok) {
      return {
        ok: false,
        error: classified.error || "Cannot import this file",
        kind: classified.kind,
        requiresConfirm: false,
        preview: null,
        plan: null
      };
    }

    var payload = classified.payload;
    var confirmClearNulls = !!options.confirmClearNulls;
    var plan = {
      kind: classified.kind,
      standaloneVault: !!classified.standalone,
      payload: payload,
      trainers: { action: "preserve", apply: false, entries: {} },
      practicePlan: { action: "preserve", apply: false, value: undefined },
      memory: { action: "preserve", apply: false, value: undefined },
      guidedSessionOutcomes: { action: "preserve", apply: false, value: undefined },
      memoryVault: { action: "preserve", apply: false, value: undefined }
    };

    if (classified.kind === KIND_TRAINER_STATE) {
      var trainerId = String(payload.trainerId || options.expectedTrainerId || "").trim();
      if (!trainerId) {
        return {
          ok: false,
          error: "Trainer state is missing trainerId",
          kind: classified.kind,
          requiresConfirm: false,
          preview: null,
          plan: null
        };
      }
      plan.trainers = {
        action: "replace",
        apply: true,
        entries: {}
      };
      plan.trainers.entries[trainerId] = { action: "replace", apply: true, value: payload };
    } else if (classified.kind === KIND_MEMORY_VAULT) {
      var vaultPayload = classified.standalone ? payload : payload.memoryVault;
      plan.memoryVault = {
        action: "merge",
        apply: true,
        value: vaultPayload
      };
    } else {
      if (hasOwn(payload, "trainers")) {
        if (payload.trainers === null) {
          plan.trainers = sectionAction(true, null, confirmClearNulls);
          plan.trainers.entries = {};
        } else if (isObject(payload.trainers)) {
          var malformedTrainerId = Object.keys(payload.trainers).find(function (id) {
            var candidate = payload.trainers[id];
            return candidate !== null && !looksLikeTrainerState(candidate);
          });
          if (malformedTrainerId !== undefined) {
            return {
              ok: false,
              error: "Invalid trainer state for " + malformedTrainerId,
              kind: classified.kind,
              requiresConfirm: false,
              preview: null,
              plan: null
            };
          }
          plan.trainers = { action: "replace", apply: true, entries: {} };
          Object.keys(payload.trainers).forEach(function (id) {
            var value = payload.trainers[id];
            if (value === null) {
              var clearTrainer = sectionAction(true, null, confirmClearNulls);
              plan.trainers.entries[id] = clearTrainer;
            } else {
              plan.trainers.entries[id] = { action: "replace", apply: true, value: value };
            }
          });
        } else {
          return {
            ok: false,
            error: "trainers must be an object or null",
            kind: classified.kind,
            requiresConfirm: false,
            preview: null,
            plan: null
          };
        }
      }

      if (hasOwn(payload, "practicePlan")) {
        if (payload.practicePlan !== null && !isObject(payload.practicePlan)) {
          return { ok: false, error: "practicePlan must be an object or null", kind: classified.kind, requiresConfirm: false, preview: null, plan: null };
        }
        plan.practicePlan = Object.assign(
          { value: payload.practicePlan },
          sectionAction(true, payload.practicePlan, confirmClearNulls)
        );
      }
      if (hasOwn(payload, "memory")) {
        if (payload.memory !== null && !isObject(payload.memory)) {
          return { ok: false, error: "memory must be an object or null", kind: classified.kind, requiresConfirm: false, preview: null, plan: null };
        }
        plan.memory = Object.assign(
          { value: payload.memory },
          sectionAction(true, payload.memory, confirmClearNulls)
        );
      }
      if (hasOwn(payload, "guidedSessionOutcomes")) {
        if (payload.guidedSessionOutcomes !== null && !isObject(payload.guidedSessionOutcomes)) {
          return { ok: false, error: "guidedSessionOutcomes must be an object or null", kind: classified.kind, requiresConfirm: false, preview: null, plan: null };
        }
        plan.guidedSessionOutcomes = Object.assign(
          { value: payload.guidedSessionOutcomes },
          sectionAction(true, payload.guidedSessionOutcomes, confirmClearNulls)
        );
      }
      if (hasOwn(payload, "memoryVault") && payload.memoryVault !== null && !isObject(payload.memoryVault)) {
        return { ok: false, error: "memoryVault must be an object or null", kind: classified.kind, requiresConfirm: false, preview: null, plan: null };
      }
      if (hasOwn(payload, "memoryVault") && payload.memoryVault) {
        plan.memoryVault = { action: "merge", apply: true, value: payload.memoryVault };
      }
    }

    var requiresConfirm = false;
    function needsConfirm(section) {
      if (!section) return;
      if (section.action === "clear-requires-confirm") requiresConfirm = true;
      if (section.entries) {
        Object.keys(section.entries).forEach(function (key) {
          if (section.entries[key].action === "clear-requires-confirm") requiresConfirm = true;
        });
      }
    }
    needsConfirm(plan.trainers);
    needsConfirm(plan.practicePlan);
    needsConfirm(plan.memory);
    needsConfirm(plan.guidedSessionOutcomes);

    var trainerList = classified.kind === KIND_TRAINER_STATE
      ? trainerPreview(plan.trainers.entries && Object.keys(plan.trainers.entries).reduce(function (acc, id) {
        acc[id] = plan.trainers.entries[id].value;
        return acc;
      }, {}))
      : trainerPreview(payload.trainers);

    var preview = {
      kind: classified.kind,
      artifactType: payload.artifactType || (classified.kind === KIND_PROFILE_V2 ? ARTIFACT_TYPE : null),
      profileSchemaVersion: Number(payload.profileSchemaVersion) || (classified.kind === KIND_PROFILE_V2 ? 2 : 1),
      trainers: trainerList,
      trainerAction: plan.trainers.action,
      practicePlanAction: plan.practicePlan.action,
      memoryAction: plan.memory.action,
      guidedOutcomesAction: plan.guidedSessionOutcomes.action,
      memoryVaultAction: plan.memoryVault.action,
      standaloneVault: !!plan.standaloneVault,
      requiresConfirm: requiresConfirm,
      summaryLines: buildPreviewLines(plan, trainerList, requiresConfirm)
    };

    return {
      ok: !requiresConfirm || confirmClearNulls,
      error: requiresConfirm && !confirmClearNulls
        ? "Import includes null clears — confirm to clear those sections"
        : null,
      kind: classified.kind,
      requiresConfirm: requiresConfirm,
      preview: preview,
      plan: plan
    };
  }

  function buildPreviewLines(plan, trainerList, requiresConfirm) {
    var lines = [];
    if (plan.standaloneVault) {
      lines.push("Memory vault only — other local data stays unchanged.");
    }
    if (plan.trainers.apply || (plan.trainers.entries && Object.keys(plan.trainers.entries).length)) {
      var count = trainerList.length || Object.keys(plan.trainers.entries || {}).length;
      lines.push("Trainers: " + plan.trainers.action + " (" + count + ")");
    } else {
      lines.push("Trainers: preserve existing");
    }
    lines.push("Practice plan: " + plan.practicePlan.action);
    lines.push("Memory: " + plan.memory.action);
    lines.push("Guided outcomes: " + plan.guidedSessionOutcomes.action);
    lines.push("Memory vault: " + plan.memoryVault.action);
    if (requiresConfirm) {
      lines.push("Null clear(s) need explicit confirmation.");
    }
    return lines;
  }

  function snapshotLocalState(adapters) {
    adapters = adapters || {};
    return {
      trainers: typeof adapters.readTrainers === "function" ? adapters.readTrainers() : {},
      practicePlan: typeof adapters.readPracticePlan === "function" ? adapters.readPracticePlan() : null,
      memoryDeletedIds: typeof adapters.readMemoryDeletedIds === "function" ? adapters.readMemoryDeletedIds() : [],
      memoryCorrections: typeof adapters.readMemoryCorrections === "function" ? adapters.readMemoryCorrections() : [],
      memoryVault: typeof adapters.readMemoryVault === "function" ? adapters.readMemoryVault() : null,
      guidedSessionOutcomes: typeof adapters.readGuidedOutcomes === "function" ? adapters.readGuidedOutcomes() : null
    };
  }

  function restoreSnapshot(snapshot, adapters) {
    adapters = adapters || {};
    if (typeof adapters.replaceTrainers === "function") adapters.replaceTrainers(snapshot.trainers || {});
    if (typeof adapters.writePracticePlan === "function") {
      if (snapshot.practicePlan) adapters.writePracticePlan(snapshot.practicePlan);
      else if (typeof adapters.clearPracticePlan === "function") adapters.clearPracticePlan();
    }
    if (typeof adapters.writeMemoryDeletedIds === "function") {
      adapters.writeMemoryDeletedIds(snapshot.memoryDeletedIds || []);
    }
    if (typeof adapters.writeMemoryCorrections === "function") {
      adapters.writeMemoryCorrections(snapshot.memoryCorrections || []);
    }
    if (typeof adapters.writeMemoryVault === "function") {
      adapters.writeMemoryVault(snapshot.memoryVault || null);
    }
    if (typeof adapters.writeGuidedOutcomes === "function") {
      adapters.writeGuidedOutcomes(snapshot.guidedSessionOutcomes || null);
    }
  }

  function commitImport(prepared, adapters, options) {
    options = options || {};
    adapters = adapters || {};
    if (!prepared || !prepared.plan) {
      return { ok: false, error: "Nothing to import", imported: 0, skipped: 0 };
    }
    if (prepared.requiresConfirm && !options.confirmClearNulls) {
      return {
        ok: false,
        error: prepared.error || "Null clears require confirmation",
        imported: 0,
        skipped: 0,
        requiresConfirm: true,
        preview: prepared.preview
      };
    }

    var plan = prepared.plan;
    if (prepared.requiresConfirm && options.confirmClearNulls) {
      var refreshed = prepareImport(plan.payload, { confirmClearNulls: true, expectedTrainerId: options.expectedTrainerId });
      if (!refreshed.ok || !refreshed.plan) {
        return { ok: false, error: refreshed.error || "Failed to confirm import", imported: 0, skipped: 0 };
      }
      plan = refreshed.plan;
    }

    var before = snapshotLocalState(adapters);
    var imported = 0;
    var skipped = 0;
    var restoredPlan = false;
    var planSteps = 0;
    var vaultFacts = 0;
    var memoryCorrections = 0;
    var guidedOutcomes = 0;

    try {
      if (plan.trainers && plan.trainers.entries) {
        Object.keys(plan.trainers.entries).forEach(function (trainerId) {
          var entry = plan.trainers.entries[trainerId];
          if (!entry || !entry.apply) return;
          try {
            if (entry.clear) {
              if (typeof adapters.clearTrainer === "function") adapters.clearTrainer(trainerId);
              imported += 1;
            } else if (entry.value && typeof adapters.replaceTrainer === "function") {
              adapters.replaceTrainer(trainerId, entry.value);
              imported += 1;
            }
          } catch (err) {
            skipped += 1;
            throw err;
          }
        });
      }

      if (plan.practicePlan && plan.practicePlan.apply) {
        if (plan.practicePlan.clear) {
          if (typeof adapters.clearPracticePlan === "function") adapters.clearPracticePlan();
          restoredPlan = false;
        } else if (plan.practicePlan.value && typeof adapters.writePracticePlan === "function") {
          var saved = adapters.writePracticePlan(plan.practicePlan.value);
          restoredPlan = !!(saved && Array.isArray(saved.steps) && saved.steps.length);
          planSteps = restoredPlan ? saved.steps.length : 0;
          if (!restoredPlan && typeof adapters.clearPracticePlan === "function") adapters.clearPracticePlan();
        }
      }

      if (plan.memory && plan.memory.apply) {
        if (plan.memory.clear) {
          if (typeof adapters.writeMemoryDeletedIds === "function") adapters.writeMemoryDeletedIds([]);
          if (typeof adapters.writeMemoryCorrections === "function") adapters.writeMemoryCorrections([]);
          if (typeof adapters.writeMemoryVault === "function") adapters.writeMemoryVault(null);
        } else if (plan.memory.value) {
          var mem = plan.memory.value;
          if (typeof adapters.writeMemoryDeletedIds === "function") {
            adapters.writeMemoryDeletedIds(Array.isArray(mem.deletedFactIds) ? mem.deletedFactIds : []);
          }
          if (typeof adapters.writeMemoryCorrections === "function") {
            adapters.writeMemoryCorrections(Array.isArray(mem.correctionRecords) ? mem.correctionRecords : []);
          }
          memoryCorrections = Array.isArray(mem.correctionRecords) ? mem.correctionRecords.length : 0;
        }
      }

      if (plan.guidedSessionOutcomes && plan.guidedSessionOutcomes.apply && typeof adapters.writeGuidedOutcomes === "function") {
        if (plan.guidedSessionOutcomes.clear) {
          adapters.writeGuidedOutcomes({ updatedAt: new Date().toISOString(), outcomes: [] });
        } else if (plan.guidedSessionOutcomes.value) {
          adapters.writeGuidedOutcomes(plan.guidedSessionOutcomes.value);
          var outcomes = plan.guidedSessionOutcomes.value;
          guidedOutcomes = outcomes.totals
            ? outcomes.totals.outcomes
            : (Array.isArray(outcomes.outcomes) ? outcomes.outcomes.length : 0);
        }
      }

      if (plan.memoryVault && plan.memoryVault.apply && plan.memoryVault.value && typeof adapters.mergeMemoryVault === "function") {
        var merged = adapters.mergeMemoryVault(plan.memoryVault.value);
        vaultFacts = merged && typeof merged.factCount === "number" ? merged.factCount : 0;
      }

      return {
        ok: true,
        error: null,
        imported: imported,
        skipped: skipped,
        restoredPlan: restoredPlan,
        planSteps: planSteps,
        vaultFacts: vaultFacts,
        memoryCorrections: memoryCorrections,
        guidedOutcomes: guidedOutcomes,
        standaloneVault: !!plan.standaloneVault,
        preview: prepared.preview
      };
    } catch (err) {
      try {
        restoreSnapshot(before, adapters);
      } catch (rollbackErr) {
        return {
          ok: false,
          error: "Import failed and rollback failed: " + err.message + " / " + rollbackErr.message,
          imported: 0,
          skipped: skipped,
          rolledBack: false
        };
      }
      return {
        ok: false,
        error: "Import failed — local data restored: " + err.message,
        imported: 0,
        skipped: skipped,
        rolledBack: true
      };
    }
  }

  function buildProfileBackup(parts, options) {
    parts = parts || {};
    options = options || {};
    var exportedAt = options.exportedAt || new Date().toISOString();
    var payload = {
      artifactType: ARTIFACT_TYPE,
      profileSchemaVersion: PROFILE_SCHEMA_VERSION,
      exportedAt: exportedAt,
      demoProfile: parts.demoProfile || null,
      schemaVersion: parts.schemaVersion,
      trainers: parts.trainers || {},
      practicePlan: hasOwn(parts, "practicePlan") ? parts.practicePlan : null,
      eventLog: parts.eventLog || null,
      memory: parts.memory || null,
      learnerModel: parts.learnerModel || null,
      memoryVault: parts.memoryVault || null,
      memoryBrief: parts.memoryBrief || null,
      agentHandoff: parts.agentHandoff || null,
      companion: parts.companion || null,
      hermesBrief: parts.hermesBrief || null,
      guidedSessionOutcomes: hasOwn(parts, "guidedSessionOutcomes") ? parts.guidedSessionOutcomes : null
    };
    return payload;
  }

  var api = {
    ARTIFACT_TYPE: ARTIFACT_TYPE,
    PROFILE_SCHEMA_VERSION: PROFILE_SCHEMA_VERSION,
    KIND_PROFILE_V2: KIND_PROFILE_V2,
    KIND_PROFILE_V1: KIND_PROFILE_V1,
    KIND_TRAINER_STATE: KIND_TRAINER_STATE,
    KIND_MEMORY_VAULT: KIND_MEMORY_VAULT,
    KIND_UNKNOWN: KIND_UNKNOWN,
    classifyArtifact: classifyArtifact,
    prepareImport: prepareImport,
    commitImport: commitImport,
    buildProfileBackup: buildProfileBackup,
    snapshotLocalState: snapshotLocalState,
    restoreSnapshot: restoreSnapshot
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.PlataProfile = api;
})(typeof window !== "undefined" ? window : globalThis);

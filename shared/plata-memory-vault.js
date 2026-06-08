/* Plata learner memory vault v1
 *
 * Portable account-sync payload for derived learner memory facts only.
 * It intentionally excludes trainer state, event logs, practice plans,
 * source event ids, and raw expected/given answer text.
 */
(function (root) {
  "use strict";

  var VAULT_SCHEMA_VERSION = 1;
  var VAULT_TYPE = "plata.memory-vault";
  var rawAnswerKey = /^(answer|expected|given|input|learnerText|prompt|response|text)$/i;
  var forbiddenVaultKey = /^(eventLog|trainers|practicePlan|sourceEventIds)$/i;
  var forbiddenRawText = [
    "secret expected text",
    "secret given text",
    "should not leak"
  ];

  function stringOr(value, fallback) {
    if (value === undefined || value === null) return fallback || "";
    return String(value);
  }

  function numberOr(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function stableJson(value) {
    if (value === null || value === undefined) return "null";
    if (Array.isArray(value)) return "[" + value.map(stableJson).join(",") + "]";
    if (typeof value === "object") {
      return "{" + Object.keys(value).sort().map(function (key) {
        return JSON.stringify(key) + ":" + stableJson(value[key]);
      }).join(",") + "}";
    }
    return JSON.stringify(value);
  }

  function stableHash(text) {
    text = stringOr(text, "");
    var hash = 2166136261;
    for (var i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function assertNoRawAnswerPayload(value, path) {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach(function (item, index) { assertNoRawAnswerPayload(item, path + "[" + index + "]"); });
      return;
    }
    if (typeof value === "object") {
      Object.keys(value).forEach(function (key) {
        assert(!rawAnswerKey.test(key), path + "." + key + ": raw answer-like key is not allowed in memory vault payloads");
        assertNoRawAnswerPayload(value[key], path + "." + key);
      });
      return;
    }
    var text = String(value);
    forbiddenRawText.forEach(function (secret) {
      assert(text.indexOf(secret) === -1, path + ": raw learner answer text leaked into memory vault payload");
    });
  }

  function assertNoRawHistoryContainers(input) {
    ["eventLog", "trainers", "practicePlan"].forEach(function (key) {
      assert(!Object.prototype.hasOwnProperty.call(input || {}, key), "memoryVaultInput." + key + ": forbidden account-vault key");
    });
  }

  function compactEvidence(rows) {
    return (Array.isArray(rows) ? rows : []).slice(0, 12).map(function (row) {
      return {
        label: stringOr(row && row.label, "").slice(0, 80),
        value: stringOr(row && row.value, "").slice(0, 160)
      };
    }).filter(function (row) { return row.label || row.value; });
  }

  function compactFact(fact) {
    return {
      schemaVersion: Number(fact && fact.schemaVersion || 1),
      id: stringOr(fact && fact.id, "").slice(0, 120),
      kind: stringOr(fact && fact.kind, "").slice(0, 80),
      status: stringOr(fact && fact.status, "").slice(0, 80),
      trainerId: stringOr(fact && fact.trainerId, "").slice(0, 120),
      trainerName: stringOr(fact && fact.trainerName, "").slice(0, 160),
      signal: stringOr(fact && fact.signal, "").slice(0, 120),
      itemId: stringOr(fact && fact.itemId, "").slice(0, 120),
      title: stringOr(fact && fact.title, "").slice(0, 200),
      copy: stringOr(fact && fact.copy, "").slice(0, 320),
      confidence: Number(numberOr(fact && fact.confidence, 0).toFixed(3)),
      at: stringOr(fact && fact.at, "").slice(0, 80),
      expiresAt: stringOr(fact && fact.expiresAt, "").slice(0, 80),
      sourceFingerprint: stringOr(fact && fact.sourceFingerprint, "").slice(0, 120),
      competencyId: stringOr(fact && fact.competencyId, "").slice(0, 120),
      competencyLabel: stringOr(fact && fact.competencyLabel, "").slice(0, 160),
      signals: (Array.isArray(fact && fact.signals) ? fact.signals : []).map(function (signal) { return stringOr(signal, "").slice(0, 120); }).filter(Boolean).slice(0, 12),
      trainerIds: (Array.isArray(fact && fact.trainerIds) ? fact.trainerIds : []).map(function (trainerId) { return stringOr(trainerId, "").slice(0, 120); }).filter(Boolean).slice(0, 12),
      evidence: compactEvidence(fact && fact.evidence),
      privacy: {
        containsRawAnswerText: false
      }
    };
  }

  function compactCorrection(record) {
    return {
      schemaVersion: Number(record && record.schemaVersion || 1),
      factId: stringOr(record && record.factId, "").slice(0, 120),
      reason: stringOr(record && record.reason, "").slice(0, 120),
      correctedAt: stringOr(record && record.correctedAt, "").slice(0, 80),
      kind: stringOr(record && record.kind, "").slice(0, 80),
      signal: stringOr(record && record.signal, "").slice(0, 120),
      trainerId: stringOr(record && record.trainerId, "").slice(0, 120),
      sourceFingerprint: stringOr(record && record.sourceFingerprint, "").slice(0, 120)
    };
  }

  function vaultFingerprint(vault) {
    return "vault-" + stableHash(stableJson({
      schemaVersion: vault && vault.schemaVersion,
      vaultType: vault && vault.vaultType,
      memoryFingerprint: vault && vault.memoryFingerprint,
      facts: vault && vault.facts || [],
      deletedFactIds: vault && vault.deletedFactIds || [],
      correctionRecords: vault && vault.correctionRecords || []
    })).slice(0, 12);
  }

  function createVault(input, options) {
    input = input || {};
    options = options || {};
    assertNoRawHistoryContainers(input);
    assertNoRawAnswerPayload(input, "memoryVaultInput");
    var facts = (Array.isArray(input.facts) ? input.facts : input.visibleFacts || []).map(compactFact).filter(function (fact) {
      return fact.id && fact.kind && fact.sourceFingerprint;
    });
    var deletedFactIds = (Array.isArray(input.deletedFactIds) ? input.deletedFactIds : input.deletedIds || []).map(function (id) {
      return stringOr(id, "").slice(0, 120);
    }).filter(Boolean).sort();
    var correctionRecords = (Array.isArray(input.correctionRecords) ? input.correctionRecords : input.corrections || []).map(compactCorrection).filter(function (record) {
      return record.factId && record.reason && record.correctedAt;
    }).sort(function (a, b) { return a.factId.localeCompare(b.factId); });
    var summary = input.summary && typeof input.summary === "object" ? {
      total: Number(input.summary.total || facts.length),
      byKind: input.summary.byKind || {},
      openSignals: Number(input.summary.openSignals || 0),
      dueReviews: Number(input.summary.dueReviews || 0)
    } : {
      total: facts.length,
      byKind: {},
      openSignals: 0,
      dueReviews: 0
    };
    var vault = {
      schemaVersion: VAULT_SCHEMA_VERSION,
      vaultType: VAULT_TYPE,
      exportedAt: stringOr(options.exportedAt, new Date().toISOString()),
      memoryFingerprint: stringOr(input.fingerprint || input.memoryFingerprint, ""),
      factCount: facts.length,
      deletedFactCount: deletedFactIds.length,
      correctionCount: correctionRecords.length,
      summary: summary,
      facts: facts,
      deletedFactIds: deletedFactIds,
      correctionRecords: correctionRecords,
      privacy: {
        derivedFactsOnly: true,
        excludesTrainerState: true,
        excludesEventLog: true,
        excludesPracticePlan: true,
        excludesRawAnswers: true,
        containsRawAnswerText: false
      }
    };
    vault.fingerprint = vaultFingerprint(vault);
    var result = validateVault(vault);
    assert(result.status === "pass", "memory vault validation failed: " + result.issues.join("; "));
    return vault;
  }

  function validateNoForbiddenKeys(value, path, issues) {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach(function (item, index) { validateNoForbiddenKeys(item, path + "[" + index + "]", issues); });
      return;
    }
    if (typeof value === "object") {
      Object.keys(value).forEach(function (key) {
        if (forbiddenVaultKey.test(key)) issues.push(path + "." + key + ": forbidden account-vault key");
        validateNoForbiddenKeys(value[key], path + "." + key, issues);
      });
    }
  }

  function validateVault(vault) {
    var issues = [];
    try {
      assertNoRawAnswerPayload(vault, "memoryVault");
    } catch (err) {
      issues.push(err.message);
    }
    validateNoForbiddenKeys(vault, "memoryVault", issues);
    if (!vault || typeof vault !== "object" || Array.isArray(vault)) issues.push("vault must be an object");
    else {
      if (vault.schemaVersion !== VAULT_SCHEMA_VERSION) issues.push("unsupported schemaVersion");
      if (vault.vaultType !== VAULT_TYPE) issues.push("unsupported vaultType");
      [
        "derivedFactsOnly",
        "excludesTrainerState",
        "excludesEventLog",
        "excludesPracticePlan",
        "excludesRawAnswers"
      ].forEach(function (flag) {
        if (!vault.privacy || vault.privacy[flag] !== true) issues.push("privacy." + flag + " must be true");
      });
      if (!vault.privacy || vault.privacy.containsRawAnswerText !== false) issues.push("privacy.containsRawAnswerText must be false");
      if (!Array.isArray(vault.facts)) issues.push("facts must be an array");
      if (!Array.isArray(vault.deletedFactIds)) issues.push("deletedFactIds must be an array");
      if (!Array.isArray(vault.correctionRecords)) issues.push("correctionRecords must be an array");
      if (Number(vault.factCount) !== (vault.facts || []).length) issues.push("factCount must match facts length");
      if (Number(vault.deletedFactCount) !== (vault.deletedFactIds || []).length) issues.push("deletedFactCount must match deletedFactIds length");
      if (Number(vault.correctionCount) !== (vault.correctionRecords || []).length) issues.push("correctionCount must match correctionRecords length");
      var seen = {};
      (vault.facts || []).forEach(function (fact, index) {
        if (!fact.id) issues.push("fact " + index + ": id is required");
        if (!fact.kind) issues.push("fact " + index + ": kind is required");
        if (!fact.sourceFingerprint) issues.push("fact " + index + ": sourceFingerprint is required");
        if (seen[fact.id]) issues.push("fact " + index + ": duplicate fact id " + fact.id);
        seen[fact.id] = true;
        if (!fact.privacy || fact.privacy.containsRawAnswerText !== false) issues.push("fact " + index + ": raw-text privacy marker is required");
      });
      (vault.correctionRecords || []).forEach(function (record, index) {
        if (!record.factId) issues.push("correction " + index + ": factId is required");
        if (!record.reason) issues.push("correction " + index + ": reason is required");
        if (!record.correctedAt) issues.push("correction " + index + ": correctedAt is required");
        if (record.reason && record.reason !== "learner-marked-incorrect") issues.push("correction " + index + ": unsupported reason");
        if (record.correctedAt && Number.isNaN(Date.parse(record.correctedAt))) issues.push("correction " + index + ": correctedAt must be parseable");
      });
      if (vault.fingerprint && vault.fingerprint !== vaultFingerprint(vault)) issues.push("fingerprint drifted");
    }
    return {
      status: issues.length ? "fail" : "pass",
      issues: issues,
      factCount: vault && Array.isArray(vault.facts) ? vault.facts.length : 0
    };
  }

  root.PlataMemoryVault = {
    vaultSchemaVersion: VAULT_SCHEMA_VERSION,
    vaultType: VAULT_TYPE,
    createVault: createVault,
    validateVault: validateVault,
    vaultFingerprint: vaultFingerprint
  };
})(typeof window !== "undefined" ? window : globalThis);

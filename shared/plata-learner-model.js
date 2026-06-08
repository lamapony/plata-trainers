/* Plata learner model v1
 *
 * Deterministic adaptive profile built from derived learner memory facts. This
 * is the local scoring policy between raw memory facts and planner/agent use.
 */
(function (root) {
  "use strict";

  var MODEL_SCHEMA_VERSION = 1;
  var MODEL_TYPE = "plata.learner-model";
  var POLICY_VERSION = "learner-model-policy-v1";
  var rawAnswerKey = /^(answer|expected|given|input|learnerText|prompt|response|text)$/i;
  var forbiddenOutputKey = /^(eventLog|trainers|practicePlan|sourceEventIds|memoryVault)$/i;
  var forbiddenRawText = [
    "secret expected text",
    "secret given text",
    "should not leak",
    "raw-returning-secret",
    "raw-stale-secret",
    "raw-repaired-secret",
    "raw-trap-secret",
    "raw-cross-secret"
  ];
  var KIND_WEIGHTS = {
    root_competency_trap: 124,
    recurring_trap: 116,
    weak_signal: 100,
    next_review_due: 78,
    stale_skill: 66,
    repaired_signal: 42,
    stable_strength: 30,
    preferred_context: 22
  };

  function stringOr(value, fallback) {
    if (value === undefined || value === null) return fallback || "";
    return String(value);
  }

  function numberOr(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(value, min, max) {
    value = numberOr(value, min);
    return Math.max(min, Math.min(max, value));
  }

  function parseTime(value) {
    var t = new Date(value || "").getTime();
    return Number.isFinite(t) ? t : 0;
  }

  function daysBetween(earlier, later) {
    var a = parseTime(earlier);
    var b = Number.isFinite(later) ? later : parseTime(later);
    if (!a || !b) return null;
    return Math.max(0, Math.floor((b - a) / 86400000));
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

  function assertNoRawText(value, path) {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach(function (item, index) { assertNoRawText(item, path + "[" + index + "]"); });
      return;
    }
    if (typeof value === "object") {
      Object.keys(value).forEach(function (key) {
        assert(!rawAnswerKey.test(key), path + "." + key + ": raw answer-like key is not allowed in learner model inputs");
        assertNoRawText(value[key], path + "." + key);
      });
      return;
    }
    var text = String(value);
    forbiddenRawText.forEach(function (secret) {
      assert(text.indexOf(secret) === -1, path + ": raw learner answer text leaked into learner model");
    });
  }

  function assertNoRawOutput(value, path) {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach(function (item, index) { assertNoRawOutput(item, path + "[" + index + "]"); });
      return;
    }
    if (typeof value === "object") {
      Object.keys(value).forEach(function (key) {
        assert(!rawAnswerKey.test(key), path + "." + key + ": raw answer-like key is not allowed in learner models");
        assert(!forbiddenOutputKey.test(key), path + "." + key + ": raw history container key is not allowed in learner models");
        assertNoRawOutput(value[key], path + "." + key);
      });
      return;
    }
    var text = String(value);
    forbiddenRawText.forEach(function (secret) {
      assert(text.indexOf(secret) === -1, path + ": raw learner answer text leaked into learner model");
    });
  }

  function validateSourceFacts(facts) {
    (facts || []).forEach(function (fact, index) {
      assert(fact && typeof fact === "object" && !Array.isArray(fact), "memoryFacts " + index + ": fact object is required");
      assert(fact.id, "memoryFacts " + index + ": id is required");
      assert(fact.kind, "memoryFacts " + index + ": kind is required");
      assert(fact.sourceFingerprint, "memoryFacts " + index + ": sourceFingerprint is required");
      if (fact.privacy && Object.prototype.hasOwnProperty.call(fact.privacy, "containsRawAnswerText")) {
        assert(fact.privacy.containsRawAnswerText === false, "memoryFacts " + index + ": containsRawAnswerText must be false");
      }
    });
  }

  function evidenceValue(fact, label) {
    var rows = fact && Array.isArray(fact.evidence) ? fact.evidence : [];
    for (var i = 0; i < rows.length; i++) {
      if (rows[i] && rows[i].label === label) return rows[i].value;
    }
    return "";
  }

  function factAgeDays(fact, now) {
    var evidenceAge = Number(evidenceValue(fact, "daysSinceLastSeen"));
    if (Number.isFinite(evidenceAge) && evidenceAge >= 0) return Math.floor(evidenceAge);
    return daysBetween(fact && fact.at, now);
  }

  function confidenceBoost(fact) {
    return Math.round(clamp(fact && fact.confidence, 0, 1) * 28);
  }

  function ageBoost(fact, ageDays) {
    ageDays = numberOr(ageDays, 0);
    if (fact && (fact.kind === "next_review_due" || fact.kind === "stale_skill")) {
      return Math.min(22, Math.floor(ageDays / 3));
    }
    if (fact && (fact.kind === "repaired_signal" || fact.kind === "stable_strength")) {
      return -Math.min(10, Math.floor(ageDays / 14));
    }
    return Math.min(8, Math.floor(ageDays / 14));
  }

  function transferBoost(fact) {
    if (!fact || fact.kind !== "root_competency_trap") return 0;
    var signals = Array.isArray(fact.signals) ? fact.signals.length : 0;
    var trainers = Array.isArray(fact.trainerIds) ? fact.trainerIds.length : 0;
    return Math.min(24, signals * 5 + trainers * 4);
  }

  function priorityKind(fact) {
    var kind = stringOr(fact && fact.kind, "");
    if (kind === "root_competency_trap" || kind === "recurring_trap" || kind === "weak_signal") return "risk";
    if (kind === "next_review_due" || kind === "stale_skill") return "review";
    if (kind === "repaired_signal") return "maintenance";
    return "context";
  }

  function compactFact(fact, now) {
    var ageDays = factAgeDays(fact, now);
    var base = numberOr(KIND_WEIGHTS[fact && fact.kind], 0);
    var boosts = {
      base: base,
      confidence: confidenceBoost(fact),
      age: ageBoost(fact, ageDays),
      transfer: transferBoost(fact)
    };
    var pressure = Math.max(0, boosts.base + boosts.confidence + boosts.age + boosts.transfer);
    var out = {
      factId: stringOr(fact && fact.id, ""),
      kind: stringOr(fact && fact.kind, ""),
      status: stringOr(fact && fact.status, ""),
      trainerId: stringOr(fact && fact.trainerId, ""),
      trainerName: stringOr(fact && fact.trainerName, "").slice(0, 120),
      signal: stringOr(fact && fact.signal, ""),
      priorityKind: priorityKind(fact),
      pressure: pressure,
      confidence: Number(clamp(fact && fact.confidence, 0, 1).toFixed(3)),
      ageDays: ageDays === null ? null : ageDays,
      sourceFingerprint: stringOr(fact && fact.sourceFingerprint, ""),
      scoreBreakdown: [
        { label: "kind weight", value: boosts.base },
        { label: "confidence boost", value: boosts.confidence },
        { label: "age adjustment", value: boosts.age },
        { label: "transfer boost", value: boosts.transfer }
      ].filter(function (row) { return row.value !== 0; })
    };
    if (fact && fact.competencyId) out.competencyId = stringOr(fact.competencyId, "");
    if (fact && fact.competencyLabel) out.competencyLabel = stringOr(fact.competencyLabel, "");
    if (Array.isArray(fact && fact.signals)) out.signals = fact.signals.slice(0, 8).map(function (signal) { return stringOr(signal, ""); }).filter(Boolean);
    if (Array.isArray(fact && fact.trainerIds)) out.trainerIds = fact.trainerIds.slice(0, 8).map(function (trainerId) { return stringOr(trainerId, ""); }).filter(Boolean);
    return out;
  }

  function comparePriority(a, b) {
    return numberOr(b && b.pressure, 0) - numberOr(a && a.pressure, 0)
      || numberOr(b && b.confidence, 0) - numberOr(a && a.confidence, 0)
      || stringOr(a && a.factId, "").localeCompare(stringOr(b && b.factId, ""));
  }

  function focusFromPriority(row) {
    if (!row) {
      return {
        kind: "inspect",
        rule: "learner-model.focus.no-memory",
        title: "Inspect learner memory",
        citedFactIds: [],
        sourceFingerprints: []
      };
    }
    var signal = row.competencyLabel || row.signal || "current skill";
    var focusKind = row.priorityKind === "risk" ? "repair"
      : row.priorityKind === "review" ? "review"
      : row.priorityKind === "maintenance" ? "maintain"
      : "continue";
    var rule = row.kind === "root_competency_trap" ? "learner-model.focus.root-competency"
      : row.kind === "recurring_trap" ? "learner-model.focus.recurring-trap"
      : row.kind === "weak_signal" ? "learner-model.focus.weak-signal"
      : row.priorityKind === "review" ? "learner-model.focus.review"
      : row.priorityKind === "maintenance" ? "learner-model.focus.maintenance"
      : "learner-model.focus.context";
    return {
      kind: focusKind,
      rule: rule,
      title: (focusKind === "repair" ? "Repair " : focusKind === "review" ? "Review " : focusKind === "maintain" ? "Maintain " : "Continue from ") + signal,
      factId: row.factId,
      sourceFingerprint: row.sourceFingerprint,
      signal: row.signal,
      competencyId: row.competencyId || "",
      pressure: row.pressure,
      citedFactIds: [row.factId].filter(Boolean),
      sourceFingerprints: [row.sourceFingerprint].filter(Boolean)
    };
  }

  function rootCompetencies(priorities) {
    var groups = {};
    (priorities || []).forEach(function (row) {
      var competencyId = row.competencyId || (row.kind === "root_competency_trap" ? row.signal : "");
      if (!competencyId) return;
      if (!groups[competencyId]) {
        groups[competencyId] = {
          competencyId: competencyId,
          competencyLabel: row.competencyLabel || competencyId,
          riskScore: 0,
          factIds: [],
          sourceFingerprints: [],
          signals: [],
          trainerIds: []
        };
      }
      var group = groups[competencyId];
      group.riskScore = Math.max(group.riskScore, row.pressure);
      if (row.factId && group.factIds.indexOf(row.factId) === -1) group.factIds.push(row.factId);
      if (row.sourceFingerprint && group.sourceFingerprints.indexOf(row.sourceFingerprint) === -1) group.sourceFingerprints.push(row.sourceFingerprint);
      ([row.signal].concat(row.signals || [])).forEach(function (signal) {
        signal = stringOr(signal, "");
        if (signal && group.signals.indexOf(signal) === -1) group.signals.push(signal);
      });
      ([row.trainerId].concat(row.trainerIds || [])).forEach(function (trainerId) {
        trainerId = stringOr(trainerId, "");
        if (trainerId && group.trainerIds.indexOf(trainerId) === -1) group.trainerIds.push(trainerId);
      });
    });
    return Object.keys(groups).map(function (id) { return groups[id]; }).sort(function (a, b) {
      return numberOr(b.riskScore, 0) - numberOr(a.riskScore, 0)
        || stringOr(a.competencyId, "").localeCompare(stringOr(b.competencyId, ""));
    }).slice(0, 8);
  }

  function factSummary(facts) {
    var out = { total: 0, byKind: {}, riskFacts: 0, reviewFacts: 0, contextFacts: 0 };
    (facts || []).forEach(function (fact) {
      var kind = stringOr(fact && fact.kind, "");
      out.total += 1;
      out.byKind[kind] = numberOr(out.byKind[kind], 0) + 1;
      var group = priorityKind(fact);
      if (group === "risk") out.riskFacts += 1;
      else if (group === "review") out.reviewFacts += 1;
      else out.contextFacts += 1;
    });
    return out;
  }

  function learnerModelFingerprint(model) {
    return "lmodel-" + stableHash(stableJson({
      schemaVersion: model && model.schemaVersion,
      modelType: model && model.modelType,
      policyVersion: model && model.policy && model.policy.version,
      sourceMemoryFingerprint: model && model.sourceMemoryFingerprint,
      summary: model && model.summary || {},
      recommendedFocus: model && model.recommendedFocus || {},
      priorities: model && model.priorities || [],
      rootCompetencies: model && model.rootCompetencies || []
    })).slice(0, 12);
  }

  function buildModel(facts, options) {
    options = options || {};
    facts = Array.isArray(facts) ? facts.slice() : [];
    assertNoRawText(facts, "memoryFacts");
    validateSourceFacts(facts);
    var now = parseTime(options.now || options.generatedAt) || Date.now();
    var priorities = facts.map(function (fact) { return compactFact(fact, now); }).filter(function (row) {
      return row.factId && row.kind && row.sourceFingerprint;
    }).sort(comparePriority).slice(0, numberOr(options.limit, 20));
    var openRisks = priorities.filter(function (row) { return row.priorityKind === "risk"; }).slice(0, 8);
    var reviewQueue = priorities.filter(function (row) { return row.priorityKind === "review"; }).slice(0, 8);
    var strengths = priorities.filter(function (row) {
      return row.kind === "stable_strength" || row.kind === "repaired_signal" || row.kind === "preferred_context";
    }).slice(0, 8);
    var roots = rootCompetencies(priorities);
    var focus = focusFromPriority(priorities[0] || null);
    var memoryFingerprint = stringOr(options.memoryFingerprint, "");
    if (!memoryFingerprint && root.PlataMemory && root.PlataMemory.memoryFingerprint) {
      memoryFingerprint = root.PlataMemory.memoryFingerprint(facts);
    }
    var model = {
      schemaVersion: MODEL_SCHEMA_VERSION,
      modelType: MODEL_TYPE,
      generatedAt: stringOr(options.generatedAt, new Date(now).toISOString()),
      sourceMemoryFingerprint: memoryFingerprint,
      sourceFactCount: facts.length,
      summary: factSummary(facts),
      policy: {
        version: POLICY_VERSION,
        weights: Object.assign({}, KIND_WEIGHTS),
        maxPriorities: numberOr(options.limit, 20),
        scoring: "kind weight + confidence boost + age adjustment + transfer boost"
      },
      recommendedFocus: focus,
      priorities: priorities,
      openRisks: openRisks,
      reviewQueue: reviewQueue,
      strengths: strengths,
      rootCompetencies: roots,
      guardrails: {
        deterministic: true,
        requiresModel: false,
        derivedFactsOnly: true,
        usesOnlyCitedFacts: true,
        excludesRawHistory: true,
        containsRawAnswerText: false
      },
      trace: {
        policyVersion: POLICY_VERSION,
        priorityCount: priorities.length,
        openRiskCount: openRisks.length,
        reviewQueueCount: reviewQueue.length,
        rootCompetencyCount: roots.length
      }
    };
    model.fingerprint = learnerModelFingerprint(model);
    model.trace.modelFingerprint = model.fingerprint;
    var validation = validateModel(model);
    assert(validation.status === "pass", "learner model validation failed: " + validation.issues.join("; "));
    return model;
  }

  function validateModel(model) {
    var issues = [];
    try {
      assertNoRawOutput(model, "learnerModel");
    } catch (err) {
      issues.push(err.message);
    }
    if (!model || typeof model !== "object" || Array.isArray(model)) issues.push("model must be an object");
    else {
      if (model.schemaVersion !== MODEL_SCHEMA_VERSION) issues.push("unsupported schemaVersion");
      if (model.modelType !== MODEL_TYPE) issues.push("unsupported modelType");
      if (!model.sourceMemoryFingerprint) issues.push("sourceMemoryFingerprint is required");
      if (!model.policy || model.policy.version !== POLICY_VERSION) issues.push("policy.version is required");
      if (!model.recommendedFocus || typeof model.recommendedFocus !== "object") issues.push("recommendedFocus is required");
      if (model.recommendedFocus && model.recommendedFocus.kind !== "inspect") {
        if (!Array.isArray(model.recommendedFocus.citedFactIds) || !model.recommendedFocus.citedFactIds.length) issues.push("recommendedFocus must cite fact ids");
        if (!Array.isArray(model.recommendedFocus.sourceFingerprints) || !model.recommendedFocus.sourceFingerprints.length) issues.push("recommendedFocus must cite source fingerprints");
      }
      if (!Array.isArray(model.priorities)) issues.push("priorities must be an array");
      var known = {};
      (model.priorities || []).forEach(function (row, index) {
        if (!row.factId) issues.push("priorities " + index + ": factId is required");
        if (!row.kind) issues.push("priorities " + index + ": kind is required");
        if (!row.sourceFingerprint) issues.push("priorities " + index + ": sourceFingerprint is required");
        if (!Number.isFinite(Number(row.pressure))) issues.push("priorities " + index + ": pressure must be finite");
        if (row.factId) known[row.factId] = true;
      });
      (model.recommendedFocus && model.recommendedFocus.citedFactIds || []).forEach(function (factId) {
        if (!known[factId]) issues.push("recommendedFocus cites unknown priority fact " + factId);
      });
      (model.rootCompetencies || []).forEach(function (row, index) {
        if (!row.competencyId) issues.push("rootCompetencies " + index + ": competencyId is required");
        if (!Array.isArray(row.factIds) || !row.factIds.length) issues.push("rootCompetencies " + index + ": factIds are required");
        if (!Array.isArray(row.sourceFingerprints) || !row.sourceFingerprints.length) issues.push("rootCompetencies " + index + ": sourceFingerprints are required");
      });
      [
        "deterministic",
        "derivedFactsOnly",
        "usesOnlyCitedFacts",
        "excludesRawHistory"
      ].forEach(function (flag) {
        if (!model.guardrails || model.guardrails[flag] !== true) issues.push("guardrails." + flag + " must be true");
      });
      if (!model.guardrails || model.guardrails.requiresModel !== false) issues.push("guardrails.requiresModel must be false");
      if (!model.guardrails || model.guardrails.containsRawAnswerText !== false) issues.push("guardrails.containsRawAnswerText must be false");
      if (model.fingerprint && model.fingerprint !== learnerModelFingerprint(model)) issues.push("fingerprint drifted");
    }
    return {
      status: issues.length ? "fail" : "pass",
      issues: issues
    };
  }

  root.PlataLearnerModel = {
    modelSchemaVersion: MODEL_SCHEMA_VERSION,
    modelType: MODEL_TYPE,
    policyVersion: POLICY_VERSION,
    buildModel: buildModel,
    validateModel: validateModel,
    learnerModelFingerprint: learnerModelFingerprint
  };
})(typeof window !== "undefined" ? window : globalThis);

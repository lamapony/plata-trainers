/* Plata learner memory brief v1
 *
 * Agent-readable context built from the derived memory vault only.
 * It cites fact ids and source fingerprints, and keeps raw trainer history out.
 */
(function (root) {
  "use strict";

  var BRIEF_SCHEMA_VERSION = 1;
  var BRIEF_TYPE = "plata.memory-brief";
  var rawAnswerKey = /^(answer|expected|given|input|learnerText|prompt|response|text)$/i;
  var forbiddenVaultKey = /^(eventLog|trainers|practicePlan|sourceEventIds)$/i;
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

  function assertNoRawPayload(value, path) {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach(function (item, index) { assertNoRawPayload(item, path + "[" + index + "]"); });
      return;
    }
    if (typeof value === "object") {
      Object.keys(value).forEach(function (key) {
        assert(!rawAnswerKey.test(key), path + "." + key + ": raw answer-like key is not allowed in memory briefs");
        assert(!forbiddenVaultKey.test(key), path + "." + key + ": raw history container key is not allowed in memory briefs");
        assertNoRawPayload(value[key], path + "." + key);
      });
      return;
    }
    var text = String(value);
    forbiddenRawText.forEach(function (secret) {
      assert(text.indexOf(secret) === -1, path + ": raw learner answer text leaked into memory brief");
    });
  }

  function factPriority(fact) {
    var ranks = {
      root_competency_trap: 110,
      recurring_trap: 100,
      weak_signal: 90,
      next_review_due: 80,
      stale_skill: 70,
      repaired_signal: 55,
      stable_strength: 45,
      preferred_context: 35
    };
    return ranks[fact && fact.kind] || 0;
  }

  function factTime(fact) {
    return Date.parse(fact && fact.at || "") || Date.parse(fact && fact.expiresAt || "") || 0;
  }

  function compareFacts(a, b) {
    return factPriority(b) - factPriority(a)
      || numberOr(b && b.confidence, 0) - numberOr(a && a.confidence, 0)
      || factTime(b) - factTime(a)
      || stringOr(a && a.id, "").localeCompare(stringOr(b && b.id, ""));
  }

  function catalogTrainer(catalog, trainerId) {
    var rows = catalog && Array.isArray(catalog.trainers) ? catalog.trainers : [];
    return rows.filter(function (trainer) { return trainer && trainer.id === trainerId; })[0] || null;
  }

  function competencyForFact(graph, fact) {
    var competencyId = stringOr(fact && fact.competencyId, "");
    if (!competencyId && graph && graph.competencyIdForTag && fact && fact.signal) {
      competencyId = graph.competencyIdForTag(fact.signal);
    }
    var def = competencyId && graph && graph.get ? graph.get(competencyId) : null;
    return {
      id: competencyId,
      label: stringOr(fact && fact.competencyLabel, def && def.label || competencyId),
      copy: stringOr(def && def.copy, "")
    };
  }

  function compactEvidence(rows) {
    return (Array.isArray(rows) ? rows : []).slice(0, 4).map(function (row) {
      return {
        label: stringOr(row && row.label, "").slice(0, 80),
        value: stringOr(row && row.value, "").slice(0, 140)
      };
    }).filter(function (row) { return row.label || row.value; });
  }

  function compactFact(fact, context) {
    context = context || {};
    var trainer = catalogTrainer(context.catalog, fact && fact.trainerId);
    var competency = competencyForFact(context.competencyGraph, fact);
    var out = {
      factId: stringOr(fact && fact.id, ""),
      kind: stringOr(fact && fact.kind, ""),
      status: stringOr(fact && fact.status, ""),
      title: stringOr(fact && fact.title, "").slice(0, 200),
      note: stringOr(fact && fact.copy, "").slice(0, 260),
      trainerId: stringOr(fact && fact.trainerId, ""),
      trainerName: stringOr(fact && fact.trainerName, trainer && trainer.name || ""),
      signal: stringOr(fact && fact.signal, ""),
      confidence: Number(numberOr(fact && fact.confidence, 0).toFixed(3)),
      sourceFingerprint: stringOr(fact && fact.sourceFingerprint, ""),
      evidence: compactEvidence(fact && fact.evidence)
    };
    if (trainer && trainer.path) out.trainerPath = trainer.path;
    if (competency.id) out.competencyId = competency.id;
    if (competency.label) out.competencyLabel = competency.label;
    return out;
  }

  function activeFacts(vault) {
    var deleted = {};
    var corrected = {};
    var correctedSources = {};
    (vault && vault.deletedFactIds || []).forEach(function (id) { deleted[id] = true; });
    (vault && vault.correctionRecords || []).forEach(function (record) {
      if (record && record.factId) corrected[record.factId] = true;
      if (record && record.sourceFingerprint) correctedSources[record.sourceFingerprint] = true;
    });
    return (vault && vault.facts || []).filter(function (fact) {
      return fact && fact.id && fact.sourceFingerprint
        && !deleted[fact.id]
        && !corrected[fact.id]
        && !correctedSources[fact.sourceFingerprint];
    }).sort(compareFacts);
  }

  function focusShape(fact, context) {
    if (!fact) {
      return {
        kind: "inspect",
        rule: "brief.focus.no-memory",
        title: "Inspect learner memory",
        summary: "No portable learner memory fact is strong enough to choose a repair focus yet.",
        citedFactIds: [],
        sourceFingerprints: []
      };
    }

    var compact = compactFact(fact, context);
    var citedFactIds = [compact.factId].filter(Boolean);
    var sourceFingerprints = [compact.sourceFingerprint].filter(Boolean);
    var titleSignal = compact.competencyLabel || compact.signal || compact.trainerName || "current skill";
    var shape = {
      citedFactIds: citedFactIds,
      sourceFingerprints: sourceFingerprints,
      signal: compact.signal,
      trainerIds: []
    };
    if (compact.trainerId) shape.trainerIds.push(compact.trainerId);
    if (Array.isArray(fact.trainerIds)) {
      fact.trainerIds.forEach(function (trainerId) {
        trainerId = stringOr(trainerId, "");
        if (trainerId && shape.trainerIds.indexOf(trainerId) === -1) shape.trainerIds.push(trainerId);
      });
    }
    if (compact.competencyId) shape.competencyId = compact.competencyId;
    if (compact.competencyLabel) shape.competencyLabel = compact.competencyLabel;

    if (fact.kind === "root_competency_trap") {
      shape.kind = "repair";
      shape.rule = "brief.focus.root-competency";
      shape.title = "Repair root skill: " + titleSignal;
      shape.summary = "Different lessons point to the same root skill, so the agent should prepare one transfer-focused repair.";
    } else if (fact.kind === "recurring_trap") {
      shape.kind = "repair";
      shape.rule = "brief.focus.recurring-trap";
      shape.title = "Repair recurring trap: " + titleSignal;
      shape.summary = "Learner memory marks this signal as a repeated trap.";
    } else if (fact.kind === "weak_signal") {
      shape.kind = "repair";
      shape.rule = "brief.focus.weak-signal";
      shape.title = "Repair weak signal: " + titleSignal;
      shape.summary = "A cited memory fact still marks this signal as weak.";
    } else if (fact.kind === "next_review_due" || fact.kind === "stale_skill") {
      shape.kind = "review";
      shape.rule = "brief.focus.due-review";
      shape.title = "Review due signal: " + titleSignal;
      shape.summary = "Spacing says this signal should be checked before it goes cold.";
    } else if (fact.kind === "repaired_signal") {
      shape.kind = "maintain";
      shape.rule = "brief.focus.resolved-signal";
      shape.title = "Maintain repaired signal: " + titleSignal;
      shape.summary = "The agent should avoid reopening this repair unless new evidence appears.";
    } else {
      shape.kind = "continue";
      shape.rule = "brief.focus.continue-context";
      shape.title = "Continue from stable context";
      shape.summary = "The strongest portable memory fact supports continuing practice without a repair detour.";
    }

    var primaryTrainerId = shape.trainerIds.filter(function (trainerId) { return trainerId && trainerId !== "profile"; })[0] || "";
    var trainer = catalogTrainer(context.catalog, primaryTrainerId);
    shape.nextAction = {
      label: shape.kind === "repair" ? "Prepare repair session" : shape.kind === "review" ? "Prepare review" : "Continue practice",
      trainerId: primaryTrainerId,
      path: trainer && trainer.path || ""
    };
    return shape;
  }

  function rootSkillRisks(facts, context) {
    return facts.filter(function (fact) { return fact.kind === "root_competency_trap"; }).slice(0, 4).map(function (fact) {
      var compact = compactFact(fact, context);
      return {
        competencyId: compact.competencyId || compact.signal,
        competencyLabel: compact.competencyLabel || compact.signal,
        signals: (Array.isArray(fact.signals) ? fact.signals : []).slice(0, 8),
        trainerIds: (Array.isArray(fact.trainerIds) ? fact.trainerIds : []).slice(0, 8),
        citedFactIds: [compact.factId],
        sourceFingerprints: [compact.sourceFingerprint],
        summary: compact.note || compact.title
      };
    });
  }

  function compactCorrections(records) {
    return (records || []).slice().sort(function (a, b) {
      return stringOr(a && a.factId, "").localeCompare(stringOr(b && b.factId, ""));
    }).slice(0, 8).map(function (record) {
      return {
        factId: stringOr(record && record.factId, ""),
        reason: stringOr(record && record.reason, ""),
        correctedAt: stringOr(record && record.correctedAt, ""),
        kind: stringOr(record && record.kind, ""),
        signal: stringOr(record && record.signal, ""),
        trainerId: stringOr(record && record.trainerId, ""),
        sourceFingerprint: stringOr(record && record.sourceFingerprint, "")
      };
    });
  }

  function briefFingerprint(brief) {
    return "brief-" + stableHash(stableJson({
      schemaVersion: brief && brief.schemaVersion,
      briefType: brief && brief.briefType,
      sourceVaultFingerprint: brief && brief.sourceVaultFingerprint,
      focus: brief && brief.focus,
      topFacts: brief && brief.topFacts || [],
      rootSkillRisks: brief && brief.rootSkillRisks || [],
      dueReviews: brief && brief.dueReviews || [],
      correctedAssumptions: brief && brief.correctedAssumptions || {},
      hiddenAssumptions: brief && brief.hiddenAssumptions || {}
    })).slice(0, 12);
  }

  function validateSourceVault(vault) {
    var vaultApi = root.PlataMemoryVault;
    if (vaultApi && vaultApi.validateVault) {
      var result = vaultApi.validateVault(vault);
      assert(result.status === "pass", "source memory vault validation failed: " + result.issues.join("; "));
      return;
    }
    assert(vault && vault.vaultType === "plata.memory-vault", "source memory vault is required");
  }

  function buildBrief(vault, options) {
    options = options || {};
    validateSourceVault(vault);
    assertNoRawPayload(vault, "memoryVault");
    var context = {
      catalog: options.catalog || root.PlataCatalog || null,
      competencyGraph: options.competencyGraph || root.PlataCompetencies || null
    };
    var facts = activeFacts(vault);
    var topFacts = facts.slice(0, numberOr(options.factLimit, 8)).map(function (fact) { return compactFact(fact, context); });
    var focus = focusShape(facts[0] || null, context);
    var risks = rootSkillRisks(facts, context);
    var dueReviews = facts.filter(function (fact) {
      return fact.kind === "next_review_due" || fact.kind === "stale_skill";
    }).slice(0, 5).map(function (fact) { return compactFact(fact, context); });

    var brief = {
      schemaVersion: BRIEF_SCHEMA_VERSION,
      briefType: BRIEF_TYPE,
      generatedAt: stringOr(options.generatedAt, new Date().toISOString()),
      sourceVaultFingerprint: stringOr(vault && vault.fingerprint, ""),
      sourceMemoryFingerprint: stringOr(vault && vault.memoryFingerprint, ""),
      headline: focus.title,
      focus: focus,
      topFacts: topFacts,
      rootSkillRisks: risks,
      dueReviews: dueReviews,
      correctedAssumptions: {
        count: (vault && vault.correctionRecords || []).length,
        records: compactCorrections(vault && vault.correctionRecords || [])
      },
      hiddenAssumptions: {
        count: (vault && vault.deletedFactIds || []).length,
        factIds: (vault && vault.deletedFactIds || []).slice().sort().slice(0, 12)
      },
      agentUse: {
        allowed: [
          "choose a next practice focus from cited facts",
          "explain personalization with fact ids",
          "prepare repair or review sessions"
        ],
        notIncluded: [
          "trainer state",
          "event logs",
          "practice plans",
          "raw answers"
        ]
      },
      guardrails: {
        deterministic: true,
        requiresModel: false,
        usesOnlyCitedFacts: true,
        derivedFactsOnly: true,
        excludesRawHistory: true,
        containsRawAnswerText: false
      },
      trace: {
        factCount: facts.length,
        topFactCount: topFacts.length,
        rootSkillRiskCount: risks.length,
        dueReviewCount: dueReviews.length,
        correctionCount: (vault && vault.correctionRecords || []).length,
        hiddenFactCount: (vault && vault.deletedFactIds || []).length,
        selectionRule: focus.rule
      }
    };
    brief.fingerprint = briefFingerprint(brief);
    brief.trace.selectionFingerprint = brief.fingerprint;
    var validation = validateBrief(brief);
    assert(validation.status === "pass", "memory brief validation failed: " + validation.issues.join("; "));
    return brief;
  }

  function validateBrief(brief) {
    var issues = [];
    try {
      assertNoRawPayload(brief, "memoryBrief");
    } catch (err) {
      issues.push(err.message);
    }
    if (!brief || typeof brief !== "object" || Array.isArray(brief)) issues.push("brief must be an object");
    else {
      if (brief.schemaVersion !== BRIEF_SCHEMA_VERSION) issues.push("unsupported schemaVersion");
      if (brief.briefType !== BRIEF_TYPE) issues.push("unsupported briefType");
      if (!brief.sourceVaultFingerprint) issues.push("sourceVaultFingerprint is required");
      if (!brief.focus || typeof brief.focus !== "object") issues.push("focus is required");
      if (brief.focus && brief.focus.kind !== "inspect" && (!Array.isArray(brief.focus.citedFactIds) || brief.focus.citedFactIds.length === 0)) {
        issues.push("focus must cite fact ids");
      }
      if (brief.focus && brief.focus.kind !== "inspect" && (!Array.isArray(brief.focus.sourceFingerprints) || brief.focus.sourceFingerprints.length === 0)) {
        issues.push("focus must cite source fingerprints");
      }
      if (!Array.isArray(brief.topFacts)) issues.push("topFacts must be an array");
      (brief.topFacts || []).forEach(function (fact, index) {
        if (!fact.factId) issues.push("topFacts " + index + ": factId is required");
        if (!fact.kind) issues.push("topFacts " + index + ": kind is required");
        if (!fact.sourceFingerprint) issues.push("topFacts " + index + ": sourceFingerprint is required");
      });
      (brief.rootSkillRisks || []).forEach(function (risk, index) {
        if (!risk.competencyId) issues.push("rootSkillRisks " + index + ": competencyId is required");
        if (!Array.isArray(risk.citedFactIds) || !risk.citedFactIds.length) issues.push("rootSkillRisks " + index + ": citedFactIds are required");
        if (!Array.isArray(risk.sourceFingerprints) || !risk.sourceFingerprints.length) issues.push("rootSkillRisks " + index + ": sourceFingerprints are required");
      });
      if (!brief.guardrails || brief.guardrails.deterministic !== true) issues.push("guardrails.deterministic must be true");
      if (!brief.guardrails || brief.guardrails.requiresModel !== false) issues.push("guardrails.requiresModel must be false");
      if (!brief.guardrails || brief.guardrails.usesOnlyCitedFacts !== true) issues.push("guardrails.usesOnlyCitedFacts must be true");
      if (!brief.guardrails || brief.guardrails.derivedFactsOnly !== true) issues.push("guardrails.derivedFactsOnly must be true");
      if (!brief.guardrails || brief.guardrails.excludesRawHistory !== true) issues.push("guardrails.excludesRawHistory must be true");
      if (!brief.guardrails || brief.guardrails.containsRawAnswerText !== false) issues.push("guardrails.containsRawAnswerText must be false");
      if (brief.fingerprint && brief.fingerprint !== briefFingerprint(brief)) issues.push("fingerprint drifted");
    }
    return {
      status: issues.length ? "fail" : "pass",
      issues: issues
    };
  }

  root.PlataMemoryBrief = {
    briefSchemaVersion: BRIEF_SCHEMA_VERSION,
    briefType: BRIEF_TYPE,
    buildBrief: buildBrief,
    validateBrief: validateBrief,
    briefFingerprint: briefFingerprint
  };
})(typeof window !== "undefined" ? window : globalThis);

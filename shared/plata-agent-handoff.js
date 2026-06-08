/* Plata agent handoff v1
 *
 * Deterministic packet for a future account-resident helper. It is built from
 * a memory brief, requires citations, and excludes raw learner history.
 */
(function (root) {
  "use strict";

  var HANDOFF_SCHEMA_VERSION = 1;
  var HANDOFF_TYPE = "plata.agent-handoff";
  var AGENT_ID = "openclaw-account-handoff-v1";
  var rawAnswerKey = /^(answer|expected|given|input|learnerText|prompt|response|text)$/i;
  var forbiddenHistoryKey = /^(eventLog|trainers|practicePlan|sourceEventIds|memoryVault)$/i;
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
        assert(!rawAnswerKey.test(key), path + "." + key + ": raw answer-like key is not allowed in agent handoffs");
        assert(!forbiddenHistoryKey.test(key), path + "." + key + ": raw history container key is not allowed in agent handoffs");
        assertNoRawPayload(value[key], path + "." + key);
      });
      return;
    }
    var text = String(value);
    forbiddenRawText.forEach(function (secret) {
      assert(text.indexOf(secret) === -1, path + ": raw learner answer text leaked into agent handoff");
    });
  }

  function unique(values) {
    var seen = {};
    return (values || []).map(function (value) { return stringOr(value, ""); }).filter(function (value) {
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function factCitations(brief) {
    var rows = [];
    var factIds = {};
    function add(factId, sourceFingerprint, role, kind, signal) {
      factId = stringOr(factId, "");
      sourceFingerprint = stringOr(sourceFingerprint, "");
      if (!factId || !sourceFingerprint || factIds[factId]) return;
      factIds[factId] = true;
      rows.push({
        factId: factId,
        sourceFingerprint: sourceFingerprint,
        role: stringOr(role, "supporting"),
        kind: stringOr(kind, ""),
        signal: stringOr(signal, "")
      });
    }

    var focus = brief && brief.focus || {};
    (focus.citedFactIds || []).forEach(function (factId, index) {
      add(factId, (focus.sourceFingerprints || [])[index] || (focus.sourceFingerprints || [])[0], "focus", focus.kind, focus.signal);
    });
    (brief && brief.topFacts || []).forEach(function (fact) {
      add(fact.factId, fact.sourceFingerprint, "supporting", fact.kind, fact.signal);
    });
    (brief && brief.rootSkillRisks || []).forEach(function (risk) {
      (risk.citedFactIds || []).forEach(function (factId, index) {
        add(factId, (risk.sourceFingerprints || [])[index] || (risk.sourceFingerprints || [])[0], "root-skill-risk", "root_competency_trap", risk.competencyId);
      });
    });
    return rows.slice(0, 10);
  }

  function taskKind(focusKind) {
    if (focusKind === "repair") return "prepare-repair";
    if (focusKind === "review") return "prepare-review";
    if (focusKind === "maintain") return "maintain-repaired-signal";
    if (focusKind === "continue") return "continue-practice";
    return "inspect-memory";
  }

  function taskPriority(focusKind) {
    if (focusKind === "repair") return "high";
    if (focusKind === "review") return "medium";
    if (focusKind === "maintain") return "low";
    if (focusKind === "continue") return "low";
    return "low";
  }

  function compactFocus(brief) {
    var focus = brief && brief.focus || {};
    return {
      kind: stringOr(focus.kind, "inspect"),
      rule: stringOr(focus.rule, ""),
      title: stringOr(focus.title || brief && brief.headline, "").slice(0, 180),
      summary: stringOr(focus.summary, "").slice(0, 260),
      signal: stringOr(focus.signal, ""),
      competencyId: stringOr(focus.competencyId, ""),
      competencyLabel: stringOr(focus.competencyLabel, ""),
      trainerIds: unique(focus.trainerIds || []),
      nextAction: {
        label: stringOr(focus.nextAction && focus.nextAction.label, ""),
        trainerId: stringOr(focus.nextAction && focus.nextAction.trainerId, ""),
        path: stringOr(focus.nextAction && focus.nextAction.path, "")
      }
    };
  }

  function compactFact(fact) {
    return {
      factId: stringOr(fact && fact.factId, ""),
      kind: stringOr(fact && fact.kind, ""),
      status: stringOr(fact && fact.status, ""),
      title: stringOr(fact && fact.title, "").slice(0, 160),
      trainerId: stringOr(fact && fact.trainerId, ""),
      trainerName: stringOr(fact && fact.trainerName, "").slice(0, 120),
      signal: stringOr(fact && fact.signal, ""),
      competencyId: stringOr(fact && fact.competencyId, ""),
      competencyLabel: stringOr(fact && fact.competencyLabel, "").slice(0, 120),
      confidence: Number(numberOr(fact && fact.confidence, 0).toFixed(3)),
      sourceFingerprint: stringOr(fact && fact.sourceFingerprint, "")
    };
  }

  function compactRisk(risk) {
    return {
      competencyId: stringOr(risk && risk.competencyId, ""),
      competencyLabel: stringOr(risk && risk.competencyLabel, "").slice(0, 120),
      signals: unique(risk && risk.signals || []).slice(0, 8),
      trainerIds: unique(risk && risk.trainerIds || []).slice(0, 8),
      citedFactIds: unique(risk && risk.citedFactIds || []).slice(0, 6),
      sourceFingerprints: unique(risk && risk.sourceFingerprints || []).slice(0, 6)
    };
  }

  function handoffFingerprint(handoff) {
    return "handoff-" + stableHash(stableJson({
      schemaVersion: handoff && handoff.schemaVersion,
      handoffType: handoff && handoff.handoffType,
      agentId: handoff && handoff.agentId,
      sourceBriefFingerprint: handoff && handoff.sourceBriefFingerprint,
      sourceVaultFingerprint: handoff && handoff.sourceVaultFingerprint,
      sourceMemoryFingerprint: handoff && handoff.sourceMemoryFingerprint,
      task: handoff && handoff.task,
      requiredCitations: handoff && handoff.requiredCitations || [],
      agentContext: handoff && handoff.agentContext || {},
      allowedActions: handoff && handoff.allowedActions || [],
      blockedActions: handoff && handoff.blockedActions || [],
      guardrails: handoff && handoff.guardrails || {},
      responseContract: handoff && handoff.responseContract || {}
    })).slice(0, 12);
  }

  function validateSourceBrief(brief) {
    var briefApi = root.PlataMemoryBrief;
    if (briefApi && briefApi.validateBrief) {
      var result = briefApi.validateBrief(brief);
      assert(result.status === "pass", "source memory brief validation failed: " + result.issues.join("; "));
      return;
    }
    assert(brief && brief.briefType === "plata.memory-brief", "source memory brief is required");
  }

  function buildHandoff(brief, options) {
    options = options || {};
    validateSourceBrief(brief);
    assertNoRawPayload(brief, "memoryBrief");
    var focus = compactFocus(brief);
    var citations = factCitations(brief);
    var task = {
      kind: taskKind(focus.kind),
      priority: taskPriority(focus.kind),
      title: focus.title || "Inspect learner memory",
      objective: focus.summary || "Use cited learner memory facts to choose the next safe learning action.",
      focus: focus,
      requiredCitationCount: focus.kind === "inspect" ? 0 : Math.max(1, Math.min(3, citations.length))
    };

    var handoff = {
      schemaVersion: HANDOFF_SCHEMA_VERSION,
      handoffType: HANDOFF_TYPE,
      agentId: AGENT_ID,
      generatedAt: stringOr(options.generatedAt, new Date().toISOString()),
      sourceBriefFingerprint: stringOr(brief && brief.fingerprint, ""),
      sourceVaultFingerprint: stringOr(brief && brief.sourceVaultFingerprint, ""),
      sourceMemoryFingerprint: stringOr(brief && brief.sourceMemoryFingerprint, ""),
      task: task,
      requiredCitations: citations,
      agentContext: {
        focus: focus,
        topFacts: (brief && brief.topFacts || []).slice(0, 6).map(compactFact),
        rootSkillRisks: (brief && brief.rootSkillRisks || []).slice(0, 4).map(compactRisk),
        dueReviews: (brief && brief.dueReviews || []).slice(0, 4).map(compactFact),
        hiddenAssumptionCount: numberOr(brief && brief.hiddenAssumptions && brief.hiddenAssumptions.count, 0),
        correctedAssumptionCount: numberOr(brief && brief.correctedAssumptions && brief.correctedAssumptions.count, 0)
      },
      allowedActions: [
        "summarize cited learner memory",
        "recommend one next practice action",
        "prepare a repair or review session outline",
        "ask learner to confirm if evidence is insufficient"
      ],
      blockedActions: [
        "read or request raw trainer history",
        "invent uncited learner traits",
        "change canonical memory without a learner-visible event",
        "ignore hidden or corrected assumptions"
      ],
      responseContract: {
        mustCiteFactIds: focus.kind !== "inspect",
        mustCiteSourceFingerprints: focus.kind !== "inspect",
        maxRecommendations: 1,
        allowedOutputs: ["nextAction", "shortRationale", "citedFactIds", "sourceFingerprints", "uncertainty"]
      },
      guardrails: {
        deterministic: true,
        requiresModel: false,
        derivedFactsOnly: true,
        usesOnlyCitedFacts: true,
        excludesRawHistory: true,
        containsRawAnswerText: false
      },
      trace: {
        briefRule: stringOr(brief && brief.focus && brief.focus.rule, ""),
        citationCount: citations.length,
        topFactCount: brief && Array.isArray(brief.topFacts) ? brief.topFacts.length : 0,
        rootSkillRiskCount: brief && Array.isArray(brief.rootSkillRisks) ? brief.rootSkillRisks.length : 0,
        dueReviewCount: brief && Array.isArray(brief.dueReviews) ? brief.dueReviews.length : 0
      }
    };
    handoff.fingerprint = handoffFingerprint(handoff);
    handoff.trace.handoffFingerprint = handoff.fingerprint;
    var validation = validateHandoff(handoff);
    assert(validation.status === "pass", "agent handoff validation failed: " + validation.issues.join("; "));
    return handoff;
  }

  function validateHandoff(handoff) {
    var issues = [];
    try {
      assertNoRawPayload(handoff, "agentHandoff");
    } catch (err) {
      issues.push(err.message);
    }
    if (!handoff || typeof handoff !== "object" || Array.isArray(handoff)) issues.push("handoff must be an object");
    else {
      if (handoff.schemaVersion !== HANDOFF_SCHEMA_VERSION) issues.push("unsupported schemaVersion");
      if (handoff.handoffType !== HANDOFF_TYPE) issues.push("unsupported handoffType");
      if (handoff.agentId !== AGENT_ID) issues.push("unsupported agentId");
      if (!handoff.sourceBriefFingerprint) issues.push("sourceBriefFingerprint is required");
      if (!handoff.sourceVaultFingerprint) issues.push("sourceVaultFingerprint is required");
      if (!handoff.task || typeof handoff.task !== "object") issues.push("task is required");
      if (handoff.task && !handoff.task.kind) issues.push("task.kind is required");
      if (handoff.task && handoff.task.kind !== "inspect-memory" && (!Array.isArray(handoff.requiredCitations) || handoff.requiredCitations.length < numberOr(handoff.task.requiredCitationCount, 1))) {
        issues.push("requiredCitations must satisfy task.requiredCitationCount");
      }
      (handoff.requiredCitations || []).forEach(function (citation, index) {
        if (!citation.factId) issues.push("requiredCitations " + index + ": factId is required");
        if (!citation.sourceFingerprint) issues.push("requiredCitations " + index + ": sourceFingerprint is required");
      });
      if (!Array.isArray(handoff.allowedActions) || handoff.allowedActions.length < 3) issues.push("allowedActions must constrain agent behavior");
      if (!Array.isArray(handoff.blockedActions) || handoff.blockedActions.length < 3) issues.push("blockedActions must constrain agent behavior");
      if (!handoff.responseContract || handoff.responseContract.maxRecommendations !== 1) issues.push("responseContract.maxRecommendations must be 1");
      if (handoff.responseContract && handoff.task && handoff.task.kind !== "inspect-memory") {
        if (handoff.responseContract.mustCiteFactIds !== true) issues.push("responseContract.mustCiteFactIds must be true");
        if (handoff.responseContract.mustCiteSourceFingerprints !== true) issues.push("responseContract.mustCiteSourceFingerprints must be true");
      }
      [
        "deterministic",
        "derivedFactsOnly",
        "usesOnlyCitedFacts",
        "excludesRawHistory"
      ].forEach(function (flag) {
        if (!handoff.guardrails || handoff.guardrails[flag] !== true) issues.push("guardrails." + flag + " must be true");
      });
      if (!handoff.guardrails || handoff.guardrails.requiresModel !== false) issues.push("guardrails.requiresModel must be false");
      if (!handoff.guardrails || handoff.guardrails.containsRawAnswerText !== false) issues.push("guardrails.containsRawAnswerText must be false");
      if (handoff.fingerprint && handoff.fingerprint !== handoffFingerprint(handoff)) issues.push("fingerprint drifted");
    }
    return {
      status: issues.length ? "fail" : "pass",
      issues: issues
    };
  }

  root.PlataAgentHandoff = {
    handoffSchemaVersion: HANDOFF_SCHEMA_VERSION,
    handoffType: HANDOFF_TYPE,
    agentId: AGENT_ID,
    buildHandoff: buildHandoff,
    validateHandoff: validateHandoff,
    handoffFingerprint: handoffFingerprint
  };
})(typeof window !== "undefined" ? window : globalThis);

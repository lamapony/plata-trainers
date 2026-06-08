/* Plata lightweight companion v1
 *
 * This is not an autonomous agent. It turns deterministic advisor and handoff
 * packets into a learner-facing card plus an optional read-only Hermes bridge.
 */
(function (root) {
  "use strict";

  var COMPANION_SCHEMA_VERSION = 1;
  var COMPANION_TYPE = "plata.companion-card";
  var HERMES_BRIEF_TYPE = "plata.hermes-bridge-brief";
  var COMPANION_ID = "plata-light-companion-v1";
  var rawAnswerKey = /^(answer|expected|given|input|learnerText|prompt|text)$/i;
  var forbiddenHistoryKey = /^(eventLog|trainers|practicePlan|memoryVault|sourceEventIds)$/i;
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
        assert(!rawAnswerKey.test(key), path + "." + key + ": raw answer-like key is not allowed in companion payloads");
        assert(!forbiddenHistoryKey.test(key), path + "." + key + ": raw history container key is not allowed in companion payloads");
        assertNoRawPayload(value[key], path + "." + key);
      });
      return;
    }
    var text = String(value);
    forbiddenRawText.forEach(function (secret) {
      assert(text.indexOf(secret) === -1, path + ": raw learner answer text leaked into companion payload");
    });
  }

  function compactAction(action) {
    action = action || {};
    return {
      label: stringOr(action.label, "Open next step").slice(0, 120),
      href: stringOr(action.href || action.path, "").slice(0, 260),
      trainerId: stringOr(action.trainerId, ""),
      signalTag: stringOr(action.signalTag || action.signal, "")
    };
  }

  function compactAdviceFact(fact) {
    return {
      factId: stringOr(fact && (fact.factId || fact.id), ""),
      kind: stringOr(fact && fact.kind, ""),
      status: stringOr(fact && fact.status, ""),
      trainerId: stringOr(fact && fact.trainerId, ""),
      signal: stringOr(fact && fact.signal, ""),
      competencyId: stringOr(fact && fact.competencyId, ""),
      sourceFingerprint: stringOr(fact && fact.sourceFingerprint, ""),
      role: stringOr(fact && fact.role, "supporting")
    };
  }

  function compactHandoffCitation(citation) {
    return {
      factId: stringOr(citation && citation.factId, ""),
      kind: stringOr(citation && citation.kind, ""),
      status: "",
      trainerId: "",
      signal: stringOr(citation && citation.signal, ""),
      competencyId: "",
      sourceFingerprint: stringOr(citation && citation.sourceFingerprint, ""),
      role: stringOr(citation && citation.role, "supporting")
    };
  }

  function uniqueCitations(advice, handoff) {
    var rows = [];
    var seen = {};
    function add(row) {
      if (!row.factId || !row.sourceFingerprint || seen[row.factId]) return;
      seen[row.factId] = true;
      rows.push(row);
    }
    ((advice && advice.citedFacts) || []).map(compactAdviceFact).forEach(add);
    ((handoff && handoff.requiredCitations) || []).map(compactHandoffCitation).forEach(add);
    return rows.slice(0, 8);
  }

  function actionFromHandoff(handoff) {
    var focus = handoff && handoff.task && handoff.task.focus || {};
    var next = focus.nextAction || {};
    return compactAction({
      label: next.label || handoff && handoff.task && handoff.task.title || "Open next step",
      href: next.path || "",
      trainerId: next.trainerId || "",
      signalTag: focus.signal || ""
    });
  }

  function cardFingerprint(card) {
    return "cmp-" + stableHash(stableJson({
      schemaVersion: card && card.schemaVersion,
      companionType: card && card.companionType,
      companionId: card && card.companionId,
      kind: card && card.kind,
      headline: card && card.headline,
      message: card && card.message,
      why: card && card.why,
      nextAction: card && card.nextAction,
      citedFacts: card && card.citedFacts || [],
      allowedActions: card && card.allowedActions || [],
      blockedActions: card && card.blockedActions || [],
      guardrails: card && card.guardrails || {},
      trace: card && card.trace || {}
    })).slice(0, 12);
  }

  function hermesBriefFingerprint(brief) {
    return "hms-" + stableHash(stableJson({
      schemaVersion: brief && brief.schemaVersion,
      briefType: brief && brief.briefType,
      sourceCompanionFingerprint: brief && brief.sourceCompanionFingerprint,
      sourceHandoffFingerprint: brief && brief.sourceHandoffFingerprint,
      companion: brief && brief.companion,
      citations: brief && brief.citations || [],
      allowedActions: brief && brief.allowedActions || [],
      blockedActions: brief && brief.blockedActions || [],
      responseContract: brief && brief.responseContract || {},
      guardrails: brief && brief.guardrails || {}
    })).slice(0, 12);
  }

  function confidence(citations) {
    if (!citations.length) return "low";
    if (citations.some(function (fact) { return fact.kind === "root_competency_trap" || fact.kind === "recurring_trap"; })) return "high";
    return citations.length > 1 ? "medium" : "moderate";
  }

  function buildCard(input) {
    input = input || {};
    var advice = input.advice || null;
    var handoff = input.handoff || null;
    var task = handoff && handoff.task || {};
    var focus = task.focus || {};
    var citations = uniqueCitations(advice, handoff);
    var headline = stringOr(advice && advice.title || task.title || focus.title, "Study companion");
    var message = stringOr(advice && advice.advice || task.objective || focus.summary, "Open the dashboard and inspect the cited learner memory before changing the plan.");
    var kind = stringOr(advice && advice.kind || focus.kind, "inspect");
    var nextAction = advice && advice.nextAction ? compactAction(advice.nextAction) : actionFromHandoff(handoff);

    var card = {
      schemaVersion: COMPANION_SCHEMA_VERSION,
      companionType: COMPANION_TYPE,
      companionId: COMPANION_ID,
      generatedAt: stringOr(input.generatedAt, new Date().toISOString()),
      kind: kind,
      tone: "quiet-study-operator",
      headline: headline.slice(0, 180),
      message: message.slice(0, 320),
      why: citations.length
        ? "This recommendation is based only on cited learner memory facts."
        : "The companion does not have enough cited memory yet, so it asks the learner to inspect the dashboard first.",
      confidence: confidence(citations),
      nextAction: nextAction,
      citedFacts: citations,
      allowedActions: [
        "show one next practice action",
        "explain the cited evidence",
        "open the cited practice route",
        "ask the learner to inspect memory when evidence is thin"
      ],
      blockedActions: [
        "act as an autonomous agent",
        "invent uncited learner traits",
        "change Plata memory directly",
        "override the deterministic planner"
      ],
      guardrails: {
        deterministic: true,
        requiresModel: false,
        usesOnlyCitedFacts: true,
        containsRawAnswerText: false,
        externalAgentOptional: true
      },
      trace: {
        advisorId: stringOr(advice && advice.advisorId, ""),
        advisorRule: stringOr(advice && advice.trace && advice.trace.rule, ""),
        advisorFingerprint: stringOr(advice && advice.trace && advice.trace.fingerprint, ""),
        handoffType: stringOr(handoff && handoff.handoffType, ""),
        handoffFingerprint: stringOr(handoff && handoff.fingerprint, ""),
        handoffTaskKind: stringOr(task.kind, "")
      }
    };
    card.fingerprint = cardFingerprint(card);
    var validation = validateCard(card);
    assert(validation.status === "pass", "companion card validation failed: " + validation.issues.join("; "));
    return card;
  }

  function compactCard(card) {
    return {
      companionType: stringOr(card && card.companionType, ""),
      fingerprint: stringOr(card && card.fingerprint, ""),
      kind: stringOr(card && card.kind, ""),
      headline: stringOr(card && card.headline, ""),
      message: stringOr(card && card.message, ""),
      why: stringOr(card && card.why, ""),
      confidence: stringOr(card && card.confidence, ""),
      nextAction: compactAction(card && card.nextAction),
      citedFactIds: (card && card.citedFacts || []).map(function (fact) { return fact.factId; }).filter(Boolean)
    };
  }

  function buildHermesBrief(card, handoff, options) {
    options = options || {};
    var cardValidation = validateCard(card);
    assert(cardValidation.status === "pass", "source companion card validation failed: " + cardValidation.issues.join("; "));
    assertNoRawPayload(handoff || {}, "agentHandoff");
    var citations = (card.citedFacts || []).slice(0, 8);
    var brief = {
      schemaVersion: COMPANION_SCHEMA_VERSION,
      briefType: HERMES_BRIEF_TYPE,
      generatedAt: stringOr(options.generatedAt, new Date().toISOString()),
      sourceCompanionFingerprint: stringOr(card.fingerprint, ""),
      sourceHandoffFingerprint: stringOr(handoff && handoff.fingerprint, ""),
      sourceMemoryBriefFingerprint: stringOr(handoff && handoff.sourceBriefFingerprint, ""),
      sourceVaultFingerprint: stringOr(handoff && handoff.sourceVaultFingerprint, ""),
      objective: "Help the learner understand Plata's deterministic next step without overriding it.",
      companion: compactCard(card),
      citations: citations,
      allowedActions: [
        "explain the companion card in learner-friendly language",
        "help the learner start the cited next action",
        "suggest a small reminder around the cited next action",
        "ask for confirmation when evidence is insufficient"
      ],
      blockedActions: [
        "override Plata's deterministic recommendation",
        "invent uncited learner traits",
        "request raw answer history",
        "write Plata memory or planner state"
      ],
      responseContract: {
        maxRecommendations: 1,
        mustPreserveNextAction: true,
        mustCiteFactIds: citations.length > 0,
        mustDeclareUncertainty: true
      },
      guardrails: {
        deterministic: true,
        readOnlyBridge: true,
        requiresModel: false,
        usesOnlyCitedFacts: true,
        containsRawAnswerText: false,
        externalAgentOptional: true
      }
    };
    brief.fingerprint = hermesBriefFingerprint(brief);
    var validation = validateHermesBrief(brief);
    assert(validation.status === "pass", "Hermes bridge brief validation failed: " + validation.issues.join("; "));
    return brief;
  }

  function validateCard(card) {
    var issues = [];
    try {
      assertNoRawPayload(card, "companionCard");
    } catch (err) {
      issues.push(err.message);
    }
    if (!card || typeof card !== "object" || Array.isArray(card)) issues.push("card must be an object");
    else {
      if (card.schemaVersion !== COMPANION_SCHEMA_VERSION) issues.push("unsupported schemaVersion");
      if (card.companionType !== COMPANION_TYPE) issues.push("unsupported companionType");
      if (card.companionId !== COMPANION_ID) issues.push("unsupported companionId");
      if (!card.headline) issues.push("headline is required");
      if (!card.message) issues.push("message is required");
      if (!card.nextAction || typeof card.nextAction !== "object") issues.push("nextAction is required");
      if (!Array.isArray(card.citedFacts)) issues.push("citedFacts must be an array");
      if (!Array.isArray(card.allowedActions) || card.allowedActions.length < 3) issues.push("allowedActions must constrain behavior");
      if (!Array.isArray(card.blockedActions) || card.blockedActions.length < 3) issues.push("blockedActions must constrain behavior");
      (card.citedFacts || []).forEach(function (fact, index) {
        if (!fact.factId) issues.push("citedFacts " + index + ": factId is required");
        if (!fact.sourceFingerprint) issues.push("citedFacts " + index + ": sourceFingerprint is required");
      });
      [
        "deterministic",
        "usesOnlyCitedFacts",
        "externalAgentOptional"
      ].forEach(function (flag) {
        if (!card.guardrails || card.guardrails[flag] !== true) issues.push("guardrails." + flag + " must be true");
      });
      if (!card.guardrails || card.guardrails.requiresModel !== false) issues.push("guardrails.requiresModel must be false");
      if (!card.guardrails || card.guardrails.containsRawAnswerText !== false) issues.push("guardrails.containsRawAnswerText must be false");
      if (card.fingerprint && card.fingerprint !== cardFingerprint(card)) issues.push("fingerprint drifted");
    }
    return {
      status: issues.length ? "fail" : "pass",
      issues: issues
    };
  }

  function validateHermesBrief(brief) {
    var issues = [];
    try {
      assertNoRawPayload(brief, "hermesBrief");
    } catch (err) {
      issues.push(err.message);
    }
    if (!brief || typeof brief !== "object" || Array.isArray(brief)) issues.push("brief must be an object");
    else {
      if (brief.schemaVersion !== COMPANION_SCHEMA_VERSION) issues.push("unsupported schemaVersion");
      if (brief.briefType !== HERMES_BRIEF_TYPE) issues.push("unsupported briefType");
      if (!brief.sourceCompanionFingerprint) issues.push("sourceCompanionFingerprint is required");
      if (!brief.companion || brief.companion.fingerprint !== brief.sourceCompanionFingerprint) issues.push("companion fingerprint must match source");
      if (!Array.isArray(brief.citations)) issues.push("citations must be an array");
      if (!Array.isArray(brief.allowedActions) || brief.allowedActions.length < 3) issues.push("allowedActions must constrain Hermes behavior");
      if (!Array.isArray(brief.blockedActions) || brief.blockedActions.length < 3) issues.push("blockedActions must constrain Hermes behavior");
      if (!brief.responseContract || brief.responseContract.maxRecommendations !== 1) issues.push("responseContract.maxRecommendations must be 1");
      if (!brief.responseContract || brief.responseContract.mustPreserveNextAction !== true) issues.push("responseContract.mustPreserveNextAction must be true");
      if (!brief.guardrails || brief.guardrails.readOnlyBridge !== true) issues.push("guardrails.readOnlyBridge must be true");
      if (!brief.guardrails || brief.guardrails.requiresModel !== false) issues.push("guardrails.requiresModel must be false");
      if (!brief.guardrails || brief.guardrails.containsRawAnswerText !== false) issues.push("guardrails.containsRawAnswerText must be false");
      if (!brief.guardrails || brief.guardrails.usesOnlyCitedFacts !== true) issues.push("guardrails.usesOnlyCitedFacts must be true");
      if (brief.fingerprint && brief.fingerprint !== hermesBriefFingerprint(brief)) issues.push("fingerprint drifted");
    }
    return {
      status: issues.length ? "fail" : "pass",
      issues: issues
    };
  }

  root.PlataCompanion = {
    companionSchemaVersion: COMPANION_SCHEMA_VERSION,
    companionType: COMPANION_TYPE,
    hermesBriefType: HERMES_BRIEF_TYPE,
    companionId: COMPANION_ID,
    buildCard: buildCard,
    buildHermesBrief: buildHermesBrief,
    validateCard: validateCard,
    validateHermesBrief: validateHermesBrief,
    cardFingerprint: cardFingerprint,
    hermesBriefFingerprint: hermesBriefFingerprint
  };
})(typeof window !== "undefined" ? window : globalThis);

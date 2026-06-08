/* Plata deterministic learner advisor v1
 *
 * This is the local, testable guardrail underneath any future OpenClaw-style
 * agent. It writes advice only from planner decisions and cited memory facts.
 */
(function (root) {
  "use strict";

  var ADVISOR_SCHEMA_VERSION = 1;
  var ADVISOR_ID = "openclaw-local-advisor-v1";

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

  function factPriority(fact) {
    var ranks = {
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

  function compactFact(fact) {
    return {
      id: stringOr(fact && fact.id, ""),
      kind: stringOr(fact && fact.kind, ""),
      status: stringOr(fact && fact.status, ""),
      trainerId: stringOr(fact && fact.trainerId, ""),
      signal: stringOr(fact && fact.signal, ""),
      confidence: numberOr(fact && fact.confidence, 0),
      sourceFingerprint: stringOr(fact && fact.sourceFingerprint, "")
    };
  }

  function compareFacts(a, b) {
    return factPriority(b) - factPriority(a)
      || numberOr(b && b.confidence, 0) - numberOr(a && a.confidence, 0)
      || stringOr(a && a.id, "").localeCompare(stringOr(b && b.id, ""));
  }

  function factsById(facts) {
    var map = {};
    (facts || []).forEach(function (fact) {
      if (fact && fact.id) map[fact.id] = fact;
    });
    return map;
  }

  function selectedPlannerFacts(memoryFacts, plannerDecision) {
    var byId = factsById(memoryFacts);
    var selected = plannerDecision && plannerDecision.trace
      && plannerDecision.trace.inputs
      && plannerDecision.trace.inputs.selectedMemoryFacts || [];
    return selected.map(function (fact) { return byId[fact.id]; }).filter(Boolean);
  }

  function fallbackFacts(memoryFacts, plannerDecision) {
    var trainerId = stringOr(plannerDecision && plannerDecision.trainerId, "");
    var signalTag = stringOr(plannerDecision && plannerDecision.signalTag, "");
    var source = (memoryFacts || []).filter(function (fact) {
      if (!fact) return false;
      if (signalTag && fact.signal !== signalTag) return false;
      if (trainerId && fact.trainerId !== trainerId && fact.trainerId !== "profile") return false;
      return true;
    });
    if (!source.length) source = (memoryFacts || []).slice();
    return source.sort(compareFacts);
  }

  function citeFacts(memoryFacts, plannerDecision, limit) {
    var selected = selectedPlannerFacts(memoryFacts, plannerDecision);
    if (!selected.length) selected = fallbackFacts(memoryFacts, plannerDecision);
    return selected.slice(0, limit || 3).map(compactFact);
  }

  function primarySignal(citedFacts, plannerDecision) {
    return stringOr(plannerDecision && plannerDecision.signalTag, "")
      || stringOr(citedFacts[0] && citedFacts[0].signal, "")
      || "current skill";
  }

  function strongestKind(citedFacts) {
    return stringOr(citedFacts[0] && citedFacts[0].kind, "");
  }

  function nextAction(plannerDecision, fallbackLabel) {
    plannerDecision = plannerDecision || {};
    return {
      label: plannerDecision.primaryLabel || fallbackLabel || "Open dashboard",
      href: plannerDecision.primaryHref || "",
      trainerId: plannerDecision.trainerId || "",
      signalTag: plannerDecision.signalTag || ""
    };
  }

  function adviceShape(plannerDecision, citedFacts) {
    plannerDecision = plannerDecision || {};
    var signal = primarySignal(citedFacts, plannerDecision);
    var kind = plannerDecision.kind || "";
    var factKind = strongestKind(citedFacts);

    if (kind === "repair") {
      return {
        kind: "repair",
        title: "Repair " + signal,
        advice: factKind === "recurring_trap"
          ? "Start with one repair scene because this signal is a recurring trap in learner memory."
          : "Start with one repair scene because this signal is still weak in learner memory.",
        nextAction: nextAction(plannerDecision, "Open repair scene"),
        rule: "advisor.repair.memory-backed"
      };
    }

    if (plannerDecision.trace && plannerDecision.trace.rule === "dashboard.review.memory-due" || kind === "stale") {
      return {
        kind: "review",
        title: "Review " + signal,
        advice: "Do a short review because learner memory says this signal is due before it goes cold.",
        nextAction: nextAction(plannerDecision, "Open review"),
        rule: "advisor.review.memory-due"
      };
    }

    if (factKind === "repaired_signal") {
      return {
        kind: "maintain",
        title: "Keep moving after repairing " + signal,
        advice: "Do not reopen this repair unless a new miss appears; learner memory marks it as resolved.",
        nextAction: nextAction(plannerDecision, "Continue"),
        rule: "advisor.maintain.repaired-signal"
      };
    }

    if (factKind === "stable_strength" || factKind === "preferred_context") {
      return {
        kind: "continue",
        title: "Continue from the strongest local pattern",
        advice: "Use the next small practice block and preserve the context that has already worked.",
        nextAction: nextAction(plannerDecision, "Continue"),
        rule: "advisor.continue.returning-learner"
      };
    }

    return {
      kind: "inspect",
      title: "Inspect learner memory",
      advice: "Open the dashboard and inspect learner memory before changing the plan.",
      nextAction: nextAction(plannerDecision, "Open dashboard"),
      rule: "advisor.inspect.no-strong-signal"
    };
  }

  function evidenceSummary(citedFacts) {
    return (citedFacts || []).map(function (fact) {
      return fact.kind + ":" + (fact.signal || "profile") + ":" + fact.sourceFingerprint;
    });
  }

  function adviceTrace(shape, plannerDecision, citedFacts, memoryFacts) {
    var inputs = {
      plannerKind: plannerDecision && plannerDecision.kind || "",
      plannerRule: plannerDecision && plannerDecision.trace && plannerDecision.trace.rule || "",
      memoryFactCount: (memoryFacts || []).length,
      citedFacts: citedFacts
    };
    return {
      schemaVersion: ADVISOR_SCHEMA_VERSION,
      rule: shape.rule,
      inputs: inputs,
      fingerprint: "adv-" + stableHash(stableJson({
        rule: shape.rule,
        kind: shape.kind,
        title: shape.title,
        advice: shape.advice,
        nextAction: shape.nextAction,
        inputs: inputs
      })).slice(0, 12)
    };
  }

  function advise(input) {
    input = input || {};
    var memoryFacts = Array.isArray(input.memoryFacts) ? input.memoryFacts : [];
    var plannerDecision = input.plannerDecision || null;
    var citedFacts = citeFacts(memoryFacts, plannerDecision, input.limit || 3);
    var shape = adviceShape(plannerDecision, citedFacts);
    var trace = adviceTrace(shape, plannerDecision, citedFacts, memoryFacts);
    return {
      schemaVersion: ADVISOR_SCHEMA_VERSION,
      advisorId: ADVISOR_ID,
      kind: shape.kind,
      title: shape.title,
      advice: shape.advice,
      nextAction: shape.nextAction,
      citedFacts: citedFacts,
      evidenceSummary: evidenceSummary(citedFacts),
      guardrails: {
        deterministic: true,
        requiresModel: false,
        usesOnlyCitedFacts: true,
        containsRawAnswerText: false
      },
      trace: trace
    };
  }

  root.PlataAdvisor = {
    advisorSchemaVersion: ADVISOR_SCHEMA_VERSION,
    advisorId: ADVISOR_ID,
    advise: advise
  };
})(typeof window !== "undefined" ? window : globalThis);

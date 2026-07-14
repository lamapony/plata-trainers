/* Plata guided session v1
 *
 * A deterministic learner-facing session envelope over the planner, advisor,
 * companion, and memory facts. It is intentionally local and model-free.
 */
(function (root) {
  "use strict";

  var GUIDED_SESSION_SCHEMA_VERSION = 1;
  var GUIDED_SESSION_TYPE = "plata.guided-session.v1";
  var GUIDED_OUTCOME_TYPE = "plata.guided-session-outcome.v1";
  var GUIDED_OUTCOME_LEDGER_TYPE = "plata.guided-session-outcome-ledger.v1";
  var GUIDED_OUTCOME_STORAGE_KEY = "plata:guided-session-outcomes:v1";
  var rawAnswerKey = /^(answer|expected|given|input|learnerText|prompt|text)$/i;
  var forbiddenHistoryKey = /^(eventLog|trainers|practicePlan|memoryVault|sourceEventIds)$/i;
  var forbiddenRawText = [
    "secret expected text",
    "secret given text",
    "should not leak",
    "raw weak expected",
    "raw weak given",
    "raw correct expected",
    "raw correct given",
    "raw due-review expected",
    "raw due-review given",
    "De lover, at radiatoren bliver fikset hurtigt"
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

  function compactFact(fact, role) {
    fact = fact || {};
    return {
      factId: stringOr(fact.factId || fact.id, ""),
      kind: stringOr(fact.kind, ""),
      status: stringOr(fact.status, ""),
      trainerId: stringOr(fact.trainerId, ""),
      signal: stringOr(fact.signal, ""),
      competencyId: stringOr(fact.competencyId, ""),
      sourceFingerprint: stringOr(fact.sourceFingerprint, ""),
      role: stringOr(role || fact.role, "supporting")
    };
  }

  function compactEvidence(evidence) {
    evidence = evidence || {};
    var out = {};
    ["reason", "assessmentKind", "mode", "itemId", "sceneId", "trainerId", "correct", "completed", "needsRevision", "total", "accuracy", "completionRate"].forEach(function (key) {
      if (evidence[key] === undefined || evidence[key] === null || evidence[key] === "") return;
      if (typeof evidence[key] === "number") out[key] = Number(evidence[key]);
      else if (typeof evidence[key] === "boolean") out[key] = !!evidence[key];
      else out[key] = stringOr(evidence[key], "").slice(0, 160);
    });
    return out;
  }

  function addFact(rows, seen, fact, role) {
    var compact = compactFact(fact, role);
    var key = compact.factId || compact.sourceFingerprint + ":" + compact.kind + ":" + compact.signal;
    if (!key || seen[key]) return;
    seen[key] = true;
    rows.push(compact);
  }

  function citedFacts(options) {
    options = options || {};
    var rows = [];
    var seen = {};
    var advice = options.advice || {};
    var companion = options.companion || {};
    (advice.citedFacts || []).forEach(function (fact) { addFact(rows, seen, fact, "advisor"); });
    (companion.citedFacts || []).forEach(function (fact) { addFact(rows, seen, fact, "companion"); });
    (options.memoryFacts || []).forEach(function (fact) { addFact(rows, seen, fact, "memory"); });
    return rows.slice(0, 8);
  }

  function signalFrom(step, facts, plan) {
    if (step && step.signalTag) return step.signalTag;
    if (step && step.signal) return step.signal;
    var fact = (facts || []).find(function (item) { return item.signal; });
    if (fact) return fact.signal;
    return plan && plan.kind || "starter-route";
  }

  function competencyFrom(step, facts) {
    var competency = step && step.competency || {};
    var fact = (facts || []).find(function (item) { return item.competencyId; }) || {};
    return {
      id: stringOr(competency.id || fact.competencyId, ""),
      label: stringOr(competency.label || fact.competencyId, "")
    };
  }

  function statusFrom(plan, step) {
    if (!plan || !Array.isArray(plan.steps) || plan.steps.length === 0) return "empty";
    if (plan.completed || !step) return "complete";
    if (step.status === "active") return "active";
    return "ready";
  }

  function goalFor(plan, step, facts, advice, companion) {
    var status = statusFrom(plan, step);
    var signal = signalFrom(step, facts, plan);
    var competency = competencyFrom(step, facts);
    if (status === "empty") {
      return {
        kind: "onboarding",
        title: "Start B2 job follow-up",
        signal: "starter-route",
        trainerId: "lesson-b2-job-followup",
        rootCompetency: "",
        reason: "There is no saved practice yet, so start with a realistic B2 job follow-up where the wording has a clear consequence."
      };
    }
    if (status === "complete") {
      return {
        kind: "complete",
        title: "Review the completed route",
        signal: signal,
        trainerId: "",
        rootCompetency: competency.label || competency.id || "",
        reason: "The tracked route is complete, so the next useful action is to inspect the outcome receipt."
      };
    }
    if (plan && plan.kind === "starter") {
      return {
        kind: "onboarding",
        title: step && step.title || "Start B2 job follow-up",
        signal: "starter-route",
        trainerId: stringOr(step && step.trainerId, "lesson-b2-job-followup"),
        rootCompetency: "",
        reason: "No history yet — the B2 follow-up is the best first action for most people hitting the plateau; Lesson 01 remains an optional first-visit tutorial."
      };
    }
    var kind = step && step.kind || plan && plan.kind || "continue";
    var titlePrefix = kind === "repair" ? "Repair" : kind === "review" ? "Review" : "Practice";
    return {
      kind: kind,
      title: companion && companion.headline || advice && advice.title || titlePrefix + " " + signal,
      signal: signal,
      trainerId: stringOr(step && step.trainerId, ""),
      rootCompetency: competency.label || competency.id || "",
      reason: companion && companion.why || advice && advice.advice || step && step.copy || plan && plan.copy || "The planner selected this route from local progress evidence."
    };
  }

  function routeFor(plan, step, actionHref) {
    if (!step) {
      return {
        label: plan && plan.completed ? "Review completed route" : "Open dashboard",
        href: "",
        trainerId: "",
        planToken: stringOr(plan && plan.planToken, ""),
        stepRouteId: ""
      };
    }
    return {
      label: stringOr(step.status === "active" ? "Resume step" : step.primaryLabel || "Start step", "Start step"),
      href: stringOr(actionHref || step.primaryHref, ""),
      trainerId: stringOr(step.trainerId, ""),
      planToken: stringOr(plan && plan.planToken, ""),
      stepRouteId: stringOr(step.routeId, "")
    };
  }

  function stepState(sessionStatus, step, slot) {
    if (sessionStatus === "complete") return "done";
    if (sessionStatus === "empty") return slot === "orient" ? "ready" : "pending";
    if (step && step.completedAt) return "done";
    if (step && step.status === "active") {
      if (slot === "orient") return "done";
      if (slot === "practice") return "active";
      if (slot === "notice") return "ready";
      return "pending";
    }
    if (slot === "orient") return "ready";
    if (slot === "practice") return "open";
    return "pending";
  }

  function sessionSteps(plan, step, goal, route, facts, status) {
    var cited = facts.length ? facts.slice(0, 3) : [];
    return [
      {
        id: "orient",
        kind: "orientation",
        title: status === "empty" ? "Start with one short route" : "Name the target",
        copy: status === "empty"
          ? "Begin with the smallest lesson route so the system can build a useful local signal."
          : "Focus on " + goal.signal + ". Keep the work narrow: one route, one decision, one correction.",
        status: stepState(status, step, "orient"),
        evidence: cited
      },
      {
        id: "practice",
        kind: "practice",
        title: step && step.title || "Open the first lesson",
        copy: step && step.copy || "Complete one short trainer step before adding more diagnostics.",
        status: stepState(status, step, "practice"),
        action: route.href ? { label: route.label, href: route.href } : null,
        evidence: cited
      },
      {
        id: "notice",
        kind: "reflection",
        title: "Compare against cited evidence",
        copy: facts.length
          ? "Use cited memory facts and trainer feedback to notice what changed, without reading raw answer history."
          : "Use the trainer result to create the first visible evidence point.",
        status: stepState(status, step, "notice"),
        evidence: cited
      },
      {
        id: "receipt",
        kind: "outcome",
        title: "Record the route outcome",
        copy: step
          ? "Return with plan and step ids so the dashboard can continue from recorded evidence."
          : "After the first attempt, the dashboard can compile a real personalized route.",
        status: stepState(status, step, "receipt"),
        evidence: cited
      }
    ];
  }

  function completionCriteria(plan, step, facts) {
    if (!plan || !Array.isArray(plan.steps) || !plan.steps.length) {
      return [
        "One trainer attempt is recorded.",
        "A local evidence trail exists before personalization claims appear."
      ];
    }
    if (plan.completed || !step) {
      return [
        "All tracked steps are marked done.",
        "The dashboard can compile the next route from fresh local state."
      ];
    }
    return [
      "The active step returns with the same plan token and step route id.",
      "The target signal is either repaired, reviewed, or kept open with visible evidence.",
      facts.length ? "At least one cited memory fact remains linked to the outcome." : "No raw answer text is stored in the session envelope."
    ];
  }

  function outcomeReceipt(plan, step, goal, facts, route, status) {
    return {
      title: status === "complete" ? "Route complete" : "Expected outcome",
      summary: status === "empty"
        ? "The first session should create enough local evidence for the planner to stop guessing."
        : "The session should make one learner signal easier to see, repair, and revisit.",
      trainedSignals: [goal.signal].filter(Boolean),
      rootCompetency: goal.rootCompetency,
      citedFacts: facts.slice(0, 6),
      nextReview: facts.find(function (fact) { return fact.kind === "next_review_due" || fact.kind === "stale_skill"; }) || null,
      route: route,
      completionCriteria: completionCriteria(plan, step, facts),
      trustBoundaries: [
        "Deterministic planner route.",
        "No model call required.",
        "Derived memory facts only.",
        "No raw answer history."
      ]
    };
  }

  function fingerprintSource(session) {
    return {
      schemaVersion: session && session.schemaVersion,
      sessionType: session && session.sessionType,
      status: session && session.status,
      goal: session && session.goal,
      route: session && session.route,
      steps: (session && session.steps || []).map(function (step) {
        return {
          id: step.id,
          kind: step.kind,
          title: step.title,
          status: step.status,
          action: step.action || null,
          evidence: step.evidence || []
        };
      }),
      outcomeReceipt: session && session.outcomeReceipt,
      guardrails: session && session.guardrails,
      trace: session && session.trace
    };
  }

  function sessionFingerprint(session) {
    return "gds-" + stableHash(stableJson(fingerprintSource(session))).slice(0, 12);
  }

  function outcomeFingerprint(outcome) {
    return "gdo-" + stableHash(stableJson({
      schemaVersion: outcome && outcome.schemaVersion,
      outcomeType: outcome && outcome.outcomeType,
      planToken: outcome && outcome.planToken,
      stepRouteId: outcome && outcome.stepRouteId,
      completedAt: outcome && outcome.completedAt,
      goal: outcome && outcome.goal,
      outcomeReceipt: outcome && outcome.outcomeReceipt,
      completionEvidence: outcome && outcome.completionEvidence,
      guardrails: outcome && outcome.guardrails,
      trace: outcome && outcome.trace
    })).slice(0, 12);
  }

  function scanNoRawPayload(value, path, issues) {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach(function (item, index) { scanNoRawPayload(item, path + "[" + index + "]", issues); });
      return;
    }
    if (typeof value === "object") {
      Object.keys(value).forEach(function (key) {
        if (rawAnswerKey.test(key)) issues.push(path + "." + key + ": raw answer-like key is not allowed");
        if (forbiddenHistoryKey.test(key)) issues.push(path + "." + key + ": raw history container is not allowed");
        scanNoRawPayload(value[key], path + "." + key, issues);
      });
      return;
    }
    var text = String(value);
    forbiddenRawText.forEach(function (secret) {
      if (secret && text.indexOf(secret) !== -1) issues.push(path + ": raw learner answer text leaked");
    });
    if (/raw [a-z-]+ (expected|given)/i.test(text)) {
      issues.push(path + ": fixture-like raw answer text leaked");
    }
  }

  function validateSession(session) {
    var issues = [];
    var guarantees = [
      { key: "deterministic", pass: !!(session && session.guardrails && session.guardrails.deterministic) },
      { key: "model-free", pass: !!(session && session.guardrails && session.guardrails.requiresModel === false) },
      { key: "cited-facts-only", pass: !!(session && session.guardrails && session.guardrails.usesOnlyCitedFacts) },
      { key: "no-raw-answers", pass: !!(session && session.guardrails && session.guardrails.containsRawAnswerText === false) }
    ];

    if (!session) issues.push("session missing");
    if (session && session.schemaVersion !== GUIDED_SESSION_SCHEMA_VERSION) issues.push("schemaVersion mismatch");
    if (session && session.sessionType !== GUIDED_SESSION_TYPE) issues.push("sessionType mismatch");
    if (session && !session.fingerprint) issues.push("fingerprint missing");
    if (session && session.fingerprint && sessionFingerprint(session) !== session.fingerprint) issues.push("fingerprint mismatch");
    if (session && !session.goal) issues.push("goal missing");
    if (session && !Array.isArray(session.steps)) issues.push("steps missing");
    if (session && Array.isArray(session.steps) && session.steps.length !== 4) issues.push("guided session must have four steps");
    if (session && session.status !== "empty" && session.status !== "complete" && !(session.route && session.route.href)) {
      issues.push("ready or active session missing route href");
    }
    if (session && session.status !== "empty" && session.status !== "complete") {
      var practice = session.steps && session.steps.find(function (step) { return step.id === "practice"; });
      if (!practice || !practice.action || !practice.action.href) issues.push("practice step missing action");
    }

    scanNoRawPayload(session, "session", issues);
    guarantees.forEach(function (item) {
      if (!item.pass) issues.push("guardrail failed: " + item.key);
    });

    return {
      status: issues.length ? "fail" : "pass",
      issues: issues,
      guarantees: guarantees
    };
  }

  function validateOutcome(outcome) {
    var issues = [];
    if (!outcome) issues.push("outcome missing");
    if (outcome && outcome.schemaVersion !== GUIDED_SESSION_SCHEMA_VERSION) issues.push("schemaVersion mismatch");
    if (outcome && outcome.outcomeType !== GUIDED_OUTCOME_TYPE) issues.push("outcomeType mismatch");
    if (outcome && !outcome.planToken) issues.push("planToken missing");
    if (outcome && !outcome.stepRouteId) issues.push("stepRouteId missing");
    if (outcome && !outcome.completedAt) issues.push("completedAt missing");
    if (outcome && !outcome.fingerprint) issues.push("fingerprint missing");
    if (outcome && outcome.fingerprint && outcomeFingerprint(outcome) !== outcome.fingerprint) issues.push("fingerprint mismatch");
    if (outcome && !(outcome.guardrails && outcome.guardrails.deterministic)) issues.push("guardrail failed: deterministic");
    if (outcome && !(outcome.guardrails && outcome.guardrails.requiresModel === false)) issues.push("guardrail failed: model-free");
    if (outcome && !(outcome.guardrails && outcome.guardrails.containsRawAnswerText === false)) issues.push("guardrail failed: no raw answers");
    scanNoRawPayload(outcome, "outcome", issues);
    return {
      status: issues.length ? "fail" : "pass",
      issues: issues
    };
  }

  function safeReadStorage(key) {
    try {
      if (!root.localStorage || !root.localStorage.getItem) return "";
      return root.localStorage.getItem(key) || "";
    } catch (err) {
      return "";
    }
  }

  function safeWriteStorage(key, value) {
    try {
      if (!root.localStorage || !root.localStorage.setItem) return false;
      root.localStorage.setItem(key, value);
      return true;
    } catch (err) {
      return false;
    }
  }

  function emptyOutcomeLedger() {
    return {
      schemaVersion: GUIDED_SESSION_SCHEMA_VERSION,
      ledgerType: GUIDED_OUTCOME_LEDGER_TYPE,
      storageKey: GUIDED_OUTCOME_STORAGE_KEY,
      updatedAt: "",
      outcomes: [],
      totals: {
        outcomes: 0,
        citedFacts: 0,
        issues: 0
      }
    };
  }

  function normalizeOutcome(outcome) {
    if (!outcome || typeof outcome !== "object") return null;
    var normalized = {
      schemaVersion: GUIDED_SESSION_SCHEMA_VERSION,
      outcomeType: GUIDED_OUTCOME_TYPE,
      recordedAt: stringOr(outcome.recordedAt, ""),
      completedAt: stringOr(outcome.completedAt, ""),
      planToken: stringOr(outcome.planToken, ""),
      planFingerprint: stringOr(outcome.planFingerprint, ""),
      stepRouteId: stringOr(outcome.stepRouteId, ""),
      stepNumber: Number(outcome.stepNumber || 0),
      trainerId: stringOr(outcome.trainerId, ""),
      trainerName: stringOr(outcome.trainerName, ""),
      goal: outcome.goal || {},
      route: outcome.route || {},
      completionEvidence: compactEvidence(outcome.completionEvidence),
      outcomeReceipt: outcome.outcomeReceipt || {},
      guardrails: {
        deterministic: true,
        requiresModel: false,
        usesOnlyCitedFacts: true,
        containsRawAnswerText: false
      },
      trace: outcome.trace || {}
    };
    normalized.fingerprint = outcome.fingerprint || outcomeFingerprint(normalized);
    normalized.validation = validateOutcome(normalized);
    return normalized;
  }

  function readOutcomeLedger() {
    var raw = safeReadStorage(GUIDED_OUTCOME_STORAGE_KEY);
    if (!raw) return emptyOutcomeLedger();
    try {
      var parsed = JSON.parse(raw);
      var rows = Array.isArray(parsed && parsed.outcomes) ? parsed.outcomes : [];
      var normalizedRows = rows.map(normalizeOutcome).filter(Boolean);
      var issues = normalizedRows.reduce(function (out, item) {
        return out.concat(item.validation && item.validation.issues || []);
      }, []);
      var normalized = normalizedRows.filter(function (item) {
        return item.validation && item.validation.status === "pass";
      });
      return {
        schemaVersion: GUIDED_SESSION_SCHEMA_VERSION,
        ledgerType: GUIDED_OUTCOME_LEDGER_TYPE,
        storageKey: GUIDED_OUTCOME_STORAGE_KEY,
        updatedAt: stringOr(parsed.updatedAt, ""),
        outcomes: normalized,
        totals: {
          outcomes: normalized.length,
          citedFacts: normalized.reduce(function (sum, item) {
            return sum + (((item.outcomeReceipt || {}).citedFacts || []).length);
          }, 0),
          issues: issues.length
        }
      };
    } catch (err) {
      return emptyOutcomeLedger();
    }
  }

  function saveOutcomeLedger(ledger) {
    var rows = Array.isArray(ledger && ledger.outcomes) ? ledger.outcomes : [];
    var normalizedRows = rows.map(normalizeOutcome).filter(Boolean);
    var issues = normalizedRows.reduce(function (out, item) {
      return out.concat(item.validation && item.validation.issues || []);
    }, []);
    var normalized = normalizedRows.filter(function (item) {
      return item.validation && item.validation.status === "pass";
    })
      .sort(function (a, b) {
        return String(b.completedAt || b.recordedAt || "").localeCompare(String(a.completedAt || a.recordedAt || ""))
          || String(a.fingerprint || "").localeCompare(String(b.fingerprint || ""));
      })
      .slice(0, 50);
    var updatedAt = stringOr(ledger && ledger.updatedAt || new Date().toISOString(), "");
    var payload = {
      schemaVersion: GUIDED_SESSION_SCHEMA_VERSION,
      ledgerType: GUIDED_OUTCOME_LEDGER_TYPE,
      storageKey: GUIDED_OUTCOME_STORAGE_KEY,
      updatedAt: updatedAt,
      outcomes: normalized,
      totals: {
        outcomes: normalized.length,
        citedFacts: normalized.reduce(function (sum, item) {
          return sum + (((item.outcomeReceipt || {}).citedFacts || []).length);
        }, 0),
        issues: issues.length
      }
    };
    safeWriteStorage(GUIDED_OUTCOME_STORAGE_KEY, JSON.stringify(payload));
    return payload;
  }

  function factsFromStep(step, memoryFacts) {
    var rows = [];
    var seen = {};
    var inputs = step && step.trace && step.trace.inputs || {};
    (inputs.selectedMemoryFacts || []).forEach(function (fact) { addFact(rows, seen, fact, "planner"); });
    (memoryFacts || []).forEach(function (fact) { addFact(rows, seen, fact, "memory"); });
    return rows.slice(0, 8);
  }

  function buildOutcome(options) {
    options = options || {};
    var plan = options.plan || {};
    var step = options.step || {};
    var facts = factsFromStep(step, options.memoryFacts || options.visibleFacts || []);
    var signal = signalFrom(step, facts, plan);
    var competency = competencyFrom(step, facts);
    var evidence = compactEvidence(options.evidence || step.completionEvidence || {});
    var completedAt = stringOr(options.completedAt || step.completedAt || new Date().toISOString(), "");
    var recordedAt = stringOr(options.recordedAt || options.now || completedAt || new Date().toISOString(), "");
    var outcome = {
      schemaVersion: GUIDED_SESSION_SCHEMA_VERSION,
      outcomeType: GUIDED_OUTCOME_TYPE,
      recordedAt: recordedAt,
      completedAt: completedAt,
      planToken: stringOr(plan.planToken, ""),
      planFingerprint: stringOr(plan.fingerprint, ""),
      stepRouteId: stringOr(step.routeId, ""),
      stepNumber: Number(step.number || 0),
      trainerId: stringOr(step.trainerId, ""),
      trainerName: stringOr(step.trainerName, ""),
      goal: {
        kind: stringOr(step.kind || plan.kind, "continue"),
        title: stringOr(step.title, "Practice step"),
        signal: signal,
        trainerId: stringOr(step.trainerId, ""),
        rootCompetency: competency.label || competency.id || "",
        reason: stringOr(step.copy || plan.copy, "The step was selected by the deterministic practice planner.")
      },
      route: {
        label: "Return to dashboard",
        href: "",
        trainerId: stringOr(step.trainerId, ""),
        planToken: stringOr(plan.planToken, ""),
        stepRouteId: stringOr(step.routeId, "")
      },
      completionEvidence: evidence,
      outcomeReceipt: {
        title: "Step outcome recorded",
        summary: evidence.reason
          ? "The step completed with " + evidence.reason + " evidence and can now be reviewed from the dashboard."
          : "The step completed and can now be reviewed from the dashboard.",
        trainedSignals: [signal].filter(Boolean),
        rootCompetency: competency.label || competency.id || "",
        citedFacts: facts.slice(0, 6),
        completionCriteria: [
          "The completed step keeps its plan token and step route id.",
          "Completion evidence is stored without raw answer text.",
          facts.length ? "Cited memory facts remain linked to the outcome." : "The outcome stays explicit even when no memory fact exists yet."
        ],
        trustBoundaries: [
          "Deterministic local receipt.",
          "No model call required.",
          "Derived memory facts only.",
          "No raw answer history."
        ]
      },
      guardrails: {
        deterministic: true,
        requiresModel: false,
        usesOnlyCitedFacts: true,
        containsRawAnswerText: false
      },
      trace: {
        source: stringOr(options.source, "guided-session-outcome-v1"),
        plannerFingerprint: stringOr(plan.fingerprint, ""),
        stepTraceFingerprint: stringOr(step.trace && step.trace.fingerprint, ""),
        citedFactCount: facts.length
      }
    };
    outcome.fingerprint = outcomeFingerprint(outcome);
    outcome.validation = validateOutcome(outcome);
    return outcome;
  }

  function recordOutcome(options) {
    var outcome = buildOutcome(options || {});
    if (outcome.validation.status !== "pass") return outcome;
    var ledger = readOutcomeLedger();
    var rows = Array.isArray(ledger.outcomes) ? ledger.outcomes.slice() : [];
    var key = outcome.planToken + ":" + outcome.stepRouteId;
    var replaced = false;
    rows = rows.map(function (row) {
      var rowKey = row.planToken + ":" + row.stepRouteId;
      if (rowKey === key) {
        replaced = true;
        return outcome;
      }
      return row;
    });
    if (!replaced) rows.unshift(outcome);
    saveOutcomeLedger({ updatedAt: outcome.recordedAt, outcomes: rows });
    return outcome;
  }

  function buildSession(options) {
    options = options || {};
    var plan = options.plan || null;
    var step = options.step || null;
    var advisorReceipt = options.advisorReceipt || {};
    var advice = options.advice || advisorReceipt.advice || null;
    var companion = options.companion || advisorReceipt.companion || null;
    var facts = citedFacts({
      advice: advice,
      companion: companion,
      memoryFacts: options.memoryFacts || options.visibleFacts || []
    });
    var status = statusFrom(plan, step);
    var goal = goalFor(plan, step, facts, advice, companion);
    var route = routeFor(plan, step, options.actionHref || advisorReceipt.actionHref || "");
    var session = {
      schemaVersion: GUIDED_SESSION_SCHEMA_VERSION,
      sessionType: GUIDED_SESSION_TYPE,
      generatedAt: stringOr(options.generatedAt || options.now || new Date().toISOString(), ""),
      status: status,
      goal: goal,
      route: route,
      steps: sessionSteps(plan, step, goal, route, facts, status),
      outcomeReceipt: outcomeReceipt(plan, step, goal, facts, route, status),
      guardrails: {
        deterministic: true,
        requiresModel: false,
        usesOnlyCitedFacts: true,
        containsRawAnswerText: false
      },
      trace: {
        plannerFingerprint: stringOr(plan && plan.fingerprint, ""),
        planKind: stringOr(plan && plan.kind, ""),
        stepStatus: stringOr(step && step.status, ""),
        advisorFingerprint: stringOr(advice && advice.fingerprint || advice && advice.trace && advice.trace.fingerprint, ""),
        companionFingerprint: stringOr(companion && companion.fingerprint, ""),
        citedFactCount: facts.length,
        source: "guided-session-v1"
      }
    };
    session.fingerprint = sessionFingerprint(session);
    session.validation = validateSession(session);
    return session;
  }

  root.PlataGuidedSession = {
    schemaVersion: GUIDED_SESSION_SCHEMA_VERSION,
    sessionType: GUIDED_SESSION_TYPE,
    outcomeType: GUIDED_OUTCOME_TYPE,
    outcomeLedgerType: GUIDED_OUTCOME_LEDGER_TYPE,
    outcomeStorageKey: GUIDED_OUTCOME_STORAGE_KEY,
    buildSession: buildSession,
    validateSession: validateSession,
    sessionFingerprint: sessionFingerprint,
    buildOutcome: buildOutcome,
    recordOutcome: recordOutcome,
    validateOutcome: validateOutcome,
    readOutcomeLedger: readOutcomeLedger,
    saveOutcomeLedger: saveOutcomeLedger
  };
})(typeof window !== "undefined" ? window : globalThis);

/* Plata guided session v1
 *
 * A deterministic learner-facing session envelope over the planner, advisor,
 * companion, and memory facts. It is intentionally local and model-free.
 */
(function (root) {
  "use strict";

  var GUIDED_SESSION_SCHEMA_VERSION = 1;
  var GUIDED_SESSION_TYPE = "plata.guided-session.v1";
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
        title: "Create the first evidence trail",
        signal: "starter-route",
        trainerId: "",
        rootCompetency: "",
        reason: "No local progress exists yet, so the useful goal is a small first session that creates evidence."
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
        title: step && step.title || "Start first session",
        signal: "starter-route",
        trainerId: stringOr(step && step.trainerId, ""),
        rootCompetency: "",
        reason: "There is no local progress yet, so this session starts small and creates the first evidence trail."
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
    buildSession: buildSession,
    validateSession: validateSession,
    sessionFingerprint: sessionFingerprint
  };
})(typeof window !== "undefined" ? window : globalThis);

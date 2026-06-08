/* Plata shared learning events v1
 *
 * Derives a replay-ready event log from existing local trainer state and
 * practice-plan state. The first version is read-only by design: it gives
 * exports and tests a deterministic timeline without migrating LocalStorage.
 */
(function (root) {
  "use strict";

  var EVENT_LOG_SCHEMA_VERSION = 1;
  var NON_DIAGNOSTIC_TAGS = { A0: true, A1: true, A2: true, B1: true, B2: true, lesson: true, repair: true };
  var TEXT_KEYS = {
    answer: true,
    expected: true,
    given: true,
    input: true,
    learnerText: true,
    prompt: true,
    response: true,
    text: true
  };

  function numberOr(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function stringOr(value, fallback) {
    if (value === undefined || value === null) return fallback || "";
    return String(value);
  }

  function normaliseTags(tags) {
    var source = Array.isArray(tags) ? tags : (tags ? [tags] : []);
    var seen = {};
    var out = [];
    source.forEach(function (tag) {
      var normalized = stringOr(tag, "").trim();
      if (!normalized || seen[normalized]) return;
      seen[normalized] = true;
      out.push(normalized);
    });
    return out;
  }

  function diagnosticTags(tags, options) {
    options = options || {};
    var nonDiagnostic = options.nonDiagnosticTags || NON_DIAGNOSTIC_TAGS;
    return normaliseTags(tags).filter(function (tag) { return !nonDiagnostic[tag]; });
  }

  function safePart(value) {
    return stringOr(value, "unknown").replace(/[^a-zA-Z0-9._:-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
  }

  function eventId(parts) {
    return parts.map(safePart).join(":");
  }

  function parseTime(value) {
    var t = new Date(value || "").getTime();
    return Number.isFinite(t) ? t : 0;
  }

  function typeRank(type) {
    var ranks = {
      "attempt.recorded": 10,
      "repair.closed": 20,
      "signal.reopened": 30,
      "plan.compiled": 40,
      "plan.step.started": 50,
      "plan.step.completed": 60
    };
    return ranks[type] || 99;
  }

  function compareEvents(a, b) {
    return parseTime(a && a.at) - parseTime(b && b.at)
      || typeRank(a && a.type) - typeRank(b && b.type)
      || stringOr(a && a.id, "").localeCompare(stringOr(b && b.id, ""));
  }

  function stableHash(text) {
    text = stringOr(text, "");
    var hash = 5381;
    for (var i = 0; i < text.length; i++) {
      hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
    }
    return (hash >>> 0).toString(36);
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

  function baseEvent(type, at, idParts) {
    return {
      schemaVersion: EVENT_LOG_SCHEMA_VERSION,
      id: eventId(idParts),
      type: type,
      at: at || "",
      source: "derived"
    };
  }

  function trainerEventInput(input) {
    input = input || {};
    if (input.state) return input;
    return { state: input, trainer: null };
  }

  function attemptEvent(state, trainer, attempt, index, options) {
    var trainerId = stringOr(state && state.trainerId || trainer && trainer.id, "");
    var tags = normaliseTags(attempt && attempt.tags);
    var event = baseEvent("attempt.recorded", attempt && attempt.at || state && state.updatedAt || "", [
      "trainer", trainerId, "attempt", index, attempt && attempt.itemId || "item"
    ]);
    event.source = "trainer-state";
    event.trainerId = trainerId;
    event.trainerName = stringOr(trainer && trainer.name, "");
    event.itemId = stringOr(attempt && attempt.itemId, "");
    event.mode = stringOr(attempt && attempt.mode, "");
    event.register = stringOr(attempt && attempt.register, "");
    event.correct = !!(attempt && attempt.correct);
    event.tags = tags;
    event.diagnosticTags = diagnosticTags(tags, options);
    event.sequence = index;
    event.privacy = {
      hasExpectedText: !!(attempt && attempt.expected),
      hasGivenText: !!(attempt && attempt.given)
    };
    return event;
  }

  function attemptHasTag(attempt, tag) {
    return normaliseTags(attempt && attempt.tags).indexOf(tag) !== -1;
  }

  function attemptIsAfterClosure(attempt, index, closure) {
    var closureAttemptCount = closure && closure.attemptCount;
    if (closureAttemptCount !== undefined && closureAttemptCount !== null && Number.isFinite(Number(closureAttemptCount))) {
      return index >= Number(closureAttemptCount);
    }
    var resolvedAt = parseTime(closure && closure.resolvedAt);
    var attemptAt = parseTime(attempt && attempt.at);
    if (!resolvedAt || !attemptAt) return true;
    return attemptAt > resolvedAt;
  }

  function findReopeningAttempt(state, closure, signal) {
    var attempts = Array.isArray(state && state.attempts) ? state.attempts : [];
    for (var i = 0; i < attempts.length; i++) {
      var attempt = attempts[i] || {};
      if (attempt.correct || !attemptHasTag(attempt, signal)) continue;
      if (attemptIsAfterClosure(attempt, i, closure)) {
        return { attempt: attempt, index: i };
      }
    }
    return null;
  }

  function repairClosureEvents(state, trainer, options) {
    options = options || {};
    var kernel = options.kernel || root.PlataKernel || {};
    var trainerId = stringOr(state && state.trainerId || trainer && trainer.id, "");
    var store = state && state.meta && state.meta.repairClosures;
    if (!store || typeof store !== "object") return [];

    var events = [];
    Object.keys(store).sort().forEach(function (key) {
      var closure = store[key] || {};
      var signal = stringOr(closure.signal || key, "").trim();
      if (!signal || closure.correct === false) return;

      var closed = baseEvent("repair.closed", closure.resolvedAt || state.updatedAt || "", [
        "trainer", trainerId, "repair", signal, closure.attemptCount === null ? "na" : closure.attemptCount
      ]);
      closed.source = "trainer-state";
      closed.trainerId = trainerId;
      closed.trainerName = stringOr(trainer && trainer.name, "");
      closed.signal = signal;
      closed.label = stringOr(closure.label, "");
      closed.action = stringOr(closure.action, "");
      closed.itemId = stringOr(closure.itemId, "");
      closed.sceneId = stringOr(closure.sceneId, "");
      closed.lessonId = stringOr(closure.lessonId, "");
      closed.sourceMode = stringOr(closure.sourceMode, "repair");
      closed.correct = true;
      closed.attemptCount = closure.attemptCount === undefined || closure.attemptCount === null ? null : numberOr(closure.attemptCount, 0);
      closed.tags = [signal];
      closed.diagnosticTags = [signal];
      events.push(closed);

      var resolved = kernel.isSignalResolved ? kernel.isSignalResolved(state, signal) : !findReopeningAttempt(state, closure, signal);
      if (resolved) return;

      var reopening = findReopeningAttempt(state, closure, signal);
      var reopened = baseEvent("signal.reopened", reopening && reopening.attempt && reopening.attempt.at || state.updatedAt || "", [
        "trainer", trainerId, "signal-reopened", signal, reopening ? reopening.index : "latest"
      ]);
      reopened.source = "trainer-state";
      reopened.trainerId = trainerId;
      reopened.trainerName = stringOr(trainer && trainer.name, "");
      reopened.signal = signal;
      reopened.label = stringOr(closure.label, "");
      reopened.itemId = stringOr(reopening && reopening.attempt && reopening.attempt.itemId || closure.itemId, "");
      reopened.sceneId = stringOr(closure.sceneId, "");
      reopened.lessonId = stringOr(closure.lessonId, "");
      reopened.reopenedByAttemptSequence = reopening ? reopening.index : null;
      reopened.reopenedByAttemptId = reopening ? eventId(["trainer", trainerId, "attempt", reopening.index, reopening.attempt.itemId || "item"]) : "";
      reopened.tags = [signal];
      reopened.diagnosticTags = [signal];
      events.push(reopened);
    });
    return events;
  }

  function eventsFromTrainerState(input, options) {
    var normalized = trainerEventInput(input);
    var state = normalized.state || {};
    var trainer = normalized.trainer || {};
    var attempts = Array.isArray(state.attempts) ? state.attempts : [];
    var events = attempts.map(function (attempt, index) {
      return attemptEvent(state, trainer, attempt, index, options);
    });
    return events.concat(repairClosureEvents(state, trainer, options)).sort(compareEvents);
  }

  function planToken(plan) {
    return stringOr(plan && (plan.planToken || plan.fingerprint), "untracked");
  }

  function stepId(step, index) {
    return stringOr(step && (step.routeId || step.number), "step-" + (index + 1));
  }

  function planEvidence(source) {
    source = source && typeof source === "object" ? source : {};
    var out = {};
    ["reason", "mode", "itemId", "sceneId", "trainerId", "correct", "total", "accuracy"].forEach(function (key) {
      if (source[key] === undefined || source[key] === null || source[key] === "") return;
      out[key] = source[key];
    });
    return out;
  }

  function earliestPlanAt(plan) {
    var dates = [];
    if (plan && plan.trackedAt) dates.push(plan.trackedAt);
    (plan && Array.isArray(plan.steps) ? plan.steps : []).forEach(function (step) {
      if (step.startedAt) dates.push(step.startedAt);
      if (step.completedAt) dates.push(step.completedAt);
      if (step.lastSeenAt) dates.push(step.lastSeenAt);
    });
    return dates.sort(function (a, b) { return parseTime(a) - parseTime(b); })[0] || "";
  }

  function eventsFromPracticePlan(plan) {
    if (!plan || !Array.isArray(plan.steps)) return [];
    var token = planToken(plan);
    var events = [];
    var compiled = baseEvent("plan.compiled", earliestPlanAt(plan), ["plan", token, "compiled"]);
    compiled.source = "practice-plan";
    compiled.planToken = token;
    compiled.fingerprint = stringOr(plan.fingerprint, "");
    compiled.kind = stringOr(plan.kind, "");
    compiled.title = stringOr(plan.title, "Practice plan");
    compiled.stepCount = plan.steps.length;
    events.push(compiled);

    plan.steps.forEach(function (step, index) {
      var id = stepId(step, index);
      if (step.startedAt) {
        var started = baseEvent("plan.step.started", step.startedAt, ["plan", token, "step", id, "started"]);
        started.source = "practice-plan";
        started.planToken = token;
        started.stepId = id;
        started.stepNumber = Number(step.number || index + 1);
        started.trainerId = stringOr(step.trainerId, "");
        started.kind = stringOr(step.kind, "");
        started.signal = stringOr(step.signalTag, "");
        started.title = stringOr(step.title, "");
        started.primaryHref = stringOr(step.primaryHref, "");
        events.push(started);
      }
      if (step.completedAt) {
        var completed = baseEvent("plan.step.completed", step.completedAt, ["plan", token, "step", id, "completed"]);
        completed.source = "practice-plan";
        completed.planToken = token;
        completed.stepId = id;
        completed.stepNumber = Number(step.number || index + 1);
        completed.trainerId = stringOr(step.trainerId, "");
        completed.kind = stringOr(step.kind, "");
        completed.signal = stringOr(step.signalTag, "");
        completed.title = stringOr(step.title, "");
        completed.primaryHref = stringOr(step.primaryHref, "");
        completed.evidence = planEvidence(step.completionEvidence);
        events.push(completed);
      }
    });
    return events.sort(compareEvents);
  }

  function annotateOrdinal(events) {
    return (events || []).slice().sort(compareEvents).map(function (event, index) {
      var out = Object.assign({}, event);
      out.ordinal = index + 1;
      return out;
    });
  }

  function buildProfileEventLog(input, options) {
    input = input || {};
    options = options || {};
    var events = [];
    (input.trainers || input.trainerStates || []).forEach(function (trainerInput) {
      events = events.concat(eventsFromTrainerState(trainerInput, options));
    });
    if (input.practicePlan) {
      events = events.concat(eventsFromPracticePlan(input.practicePlan, options));
    }
    return annotateOrdinal(events);
  }

  function cloneWithoutText(value) {
    if (Array.isArray(value)) return value.map(cloneWithoutText);
    if (!value || typeof value !== "object") return value;
    var out = {};
    Object.keys(value).forEach(function (key) {
      if (TEXT_KEYS[key]) return;
      out[key] = cloneWithoutText(value[key]);
    });
    return out;
  }

  function redactEventLog(events) {
    return (events || []).map(cloneWithoutText);
  }

  function eventFingerprint(events) {
    return "ev-" + stableHash(stableJson(redactEventLog(events || [])));
  }

  function ensureTrainer(summary, trainerId) {
    trainerId = trainerId || "unknown";
    if (!summary.trainers[trainerId]) {
      summary.trainers[trainerId] = {
        attempts: 0,
        correct: 0,
        wrong: 0,
        byItemId: {},
        signals: {}
      };
    }
    return summary.trainers[trainerId];
  }

  function ensureSignal(trainer, signal) {
    signal = signal || "unknown";
    if (!trainer.signals[signal]) {
      trainer.signals[signal] = {
        attempts: 0,
        correct: 0,
        wrong: 0,
        status: "open",
        closedAt: "",
        reopenedAt: "",
        reopenCount: 0
      };
    }
    return trainer.signals[signal];
  }

  function ensurePlan(summary, token) {
    token = token || "untracked";
    if (!summary.plans[token]) {
      summary.plans[token] = {
        compiledAt: "",
        title: "",
        kind: "",
        stepCount: 0,
        startedSteps: 0,
        completedSteps: 0,
        steps: {}
      };
    }
    return summary.plans[token];
  }

  function replayProfile(events) {
    var summary = {
      schemaVersion: EVENT_LOG_SCHEMA_VERSION,
      eventCount: 0,
      trainers: {},
      plans: {}
    };
    annotateOrdinal(events || []).forEach(function (event) {
      summary.eventCount += 1;
      if (event.type === "attempt.recorded") {
        var trainer = ensureTrainer(summary, event.trainerId);
        trainer.attempts += 1;
        if (event.correct) trainer.correct += 1;
        else trainer.wrong += 1;
        var itemId = event.itemId || "unknown";
        if (!trainer.byItemId[itemId]) trainer.byItemId[itemId] = { attempts: 0, correct: 0, wrong: 0 };
        trainer.byItemId[itemId].attempts += 1;
        if (event.correct) trainer.byItemId[itemId].correct += 1;
        else trainer.byItemId[itemId].wrong += 1;
        diagnosticTags(event.diagnosticTags || event.tags).forEach(function (tag) {
          var signal = ensureSignal(trainer, tag);
          signal.attempts += 1;
          if (event.correct) signal.correct += 1;
          else signal.wrong += 1;
        });
      } else if (event.type === "repair.closed") {
        var closedTrainer = ensureTrainer(summary, event.trainerId);
        var closedSignal = ensureSignal(closedTrainer, event.signal);
        closedSignal.status = "closed";
        closedSignal.closedAt = event.at || "";
      } else if (event.type === "signal.reopened") {
        var reopenedTrainer = ensureTrainer(summary, event.trainerId);
        var reopenedSignal = ensureSignal(reopenedTrainer, event.signal);
        reopenedSignal.status = "open";
        reopenedSignal.reopenedAt = event.at || "";
        reopenedSignal.reopenCount += 1;
      } else if (event.type === "plan.compiled") {
        var plan = ensurePlan(summary, event.planToken);
        plan.compiledAt = event.at || plan.compiledAt;
        plan.title = event.title || plan.title;
        plan.kind = event.kind || plan.kind;
        plan.stepCount = Number(event.stepCount || plan.stepCount || 0);
      } else if (event.type === "plan.step.started" || event.type === "plan.step.completed") {
        var stepPlan = ensurePlan(summary, event.planToken);
        var stepIdValue = event.stepId || "step-" + event.stepNumber;
        if (!stepPlan.steps[stepIdValue]) {
          stepPlan.steps[stepIdValue] = {
            trainerId: event.trainerId || "",
            kind: event.kind || "",
            signal: event.signal || "",
            startedAt: "",
            completedAt: ""
          };
        }
        if (event.type === "plan.step.started" && !stepPlan.steps[stepIdValue].startedAt) {
          stepPlan.steps[stepIdValue].startedAt = event.at || "";
          stepPlan.startedSteps += 1;
        }
        if (event.type === "plan.step.completed" && !stepPlan.steps[stepIdValue].completedAt) {
          stepPlan.steps[stepIdValue].completedAt = event.at || "";
          stepPlan.completedSteps += 1;
        }
      }
    });
    return summary;
  }

  function profileEventLog(input, options) {
    var events = buildProfileEventLog(input, options);
    var redacted = redactEventLog(events);
    return {
      schemaVersion: EVENT_LOG_SCHEMA_VERSION,
      fingerprint: eventFingerprint(redacted),
      events: redacted,
      replay: replayProfile(redacted)
    };
  }

  root.PlataEvents = {
    eventLogSchemaVersion: EVENT_LOG_SCHEMA_VERSION,
    eventsFromTrainerState: eventsFromTrainerState,
    eventsFromPracticePlan: eventsFromPracticePlan,
    buildProfileEventLog: buildProfileEventLog,
    redactEventLog: redactEventLog,
    eventFingerprint: eventFingerprint,
    replayProfile: replayProfile,
    profileEventLog: profileEventLog,
    diagnosticTags: diagnosticTags,
    nonDiagnosticTags: NON_DIAGNOSTIC_TAGS
  };
})(typeof window !== "undefined" ? window : globalThis);

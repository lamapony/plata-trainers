/* Plata shared learning evidence v1
 *
 * Builds a stable evidence ledger from local trainer state. UI layers should
 * render these entries instead of reinterpreting attempts and repair closures.
 */
(function (root) {
  "use strict";

  var NON_DIAGNOSTIC_TAGS = { A0: true, A1: true, A2: true, B1: true, B2: true, lesson: true, repair: true };

  function numberOr(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function diagnosticTags(tags, options) {
    options = options || {};
    var nonDiagnostic = options.nonDiagnosticTags || NON_DIAGNOSTIC_TAGS;
    var limit = numberOr(options.limit, 3);
    return (tags || []).filter(function (tag) {
      return tag && !nonDiagnostic[tag];
    }).slice(0, limit);
  }

  function latestAttemptForTag(state, tag) {
    var attempts = state && Array.isArray(state.attempts) ? state.attempts : [];
    for (var i = attempts.length - 1; i >= 0; i--) {
      var attempt = attempts[i] || {};
      if ((attempt.tags || []).indexOf(tag) !== -1) return attempt;
    }
    return null;
  }

  function repairClosures(state) {
    var store = state && state.meta && state.meta.repairClosures;
    if (!store || typeof store !== "object") return [];
    return Object.keys(store).map(function (key) { return store[key]; }).filter(Boolean);
  }

  function masterySpecFor(tag, options) {
    var fn = options && options.masterySpec;
    return typeof fn === "function" ? fn(tag) : null;
  }

  function pushOpenMastery(entries, input, options) {
    var state = input.state || {};
    var trainer = input.trainer || {};
    var stats = input.stats || {};
    (stats.weakMastery || []).forEach(function (signal) {
      var attempt = latestAttemptForTag(state, signal.tag);
      entries.push({
        kind: "open",
        status: "Open mastery signal",
        title: signal.label || signal.tag,
        copy: signal.evidence || "This concept-level signal is still weak.",
        trainer: trainer,
        at: attempt && attempt.at || state.updatedAt || "",
        score: 120 + numberOr(signal.wrong, 0) * 10 + Math.round(numberOr(signal.score, 0) * 20),
        facts: [
          numberOr(signal.wrong, 0) + " wrong / " + numberOr(signal.total, 0) + " total",
          signal.competency && signal.competency.label ? "Root skill: " + signal.competency.label : "",
          signal.remediation && signal.remediation.action ? signal.remediation.action : ""
        ].filter(Boolean)
      });
    });
  }

  function pushRepairClosures(entries, input, options) {
    var kernel = options.kernel || root.PlataKernel || {};
    var state = input.state || {};
    var trainer = input.trainer || {};
    repairClosures(state).forEach(function (closure) {
      var signal = closure.signal || "";
      var spec = masterySpecFor(signal, options);
      var resolved = kernel.isSignalResolved ? kernel.isSignalResolved(state, signal) : true;
      entries.push({
        kind: resolved ? "closed" : "reopened",
        status: resolved ? "Closed repair" : "Reopened signal",
        title: closure.label || spec && spec.label || signal,
        copy: resolved
          ? "A correct repair answer retired this signal from recommendations."
          : "Later evidence appeared after the repair, so this signal is active again.",
        trainer: trainer,
        at: closure.resolvedAt || state.updatedAt || "",
        score: resolved ? 80 : 130,
        facts: [
          signal,
          closure.action || spec && spec.evidence || "",
          closure.attemptCount ? "Closed after " + closure.attemptCount + " attempt" + (closure.attemptCount === 1 ? "" : "s") : ""
        ].filter(Boolean)
      });
    });
  }

  function pushRecentAttempts(entries, input, options) {
    var state = input.state || {};
    var trainer = input.trainer || {};
    var attemptLimit = numberOr(options.attemptLimit, 4);
    var attempts = Array.isArray(state.attempts) ? state.attempts.slice(-attemptLimit).reverse() : [];
    attempts.forEach(function (attempt) {
      var tags = diagnosticTags(attempt.tags || [], options);
      if (!tags.length && attempt.correct) return;
      entries.push({
        kind: attempt.correct ? "correct" : "miss",
        status: attempt.correct ? "Correct attempt" : "Missed attempt",
        title: attempt.itemId || trainer.name || "Practice",
        copy: attempt.correct
          ? "This attempt added positive evidence to the trainer state."
          : "This miss is part of the weak-signal evidence.",
        trainer: trainer,
        at: attempt.at || state.updatedAt || "",
        score: attempt.correct ? 20 : 70,
        facts: [
          attempt.mode || "practice",
          tags.join(" · "),
          attempt.correct ? "correct" : "wrong"
        ].filter(Boolean)
      });
    });
  }

  function entriesForTrainer(input, options) {
    input = input || {};
    options = options || {};
    if (!input.state || !input.stats) return [];
    var entries = [];
    pushOpenMastery(entries, input, options);
    pushRepairClosures(entries, input, options);
    pushRecentAttempts(entries, input, options);
    return entries;
  }

  function buildLedger(inputs, options) {
    options = options || {};
    var limit = numberOr(options.limit, 10);
    var entries = [];
    (inputs || []).forEach(function (input) {
      entries = entries.concat(entriesForTrainer(input, options));
    });
    return entries.sort(function (a, b) {
      return b.score - a.score || new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime();
    }).slice(0, limit);
  }

  root.PlataEvidence = {
    buildLedger: buildLedger,
    entriesForTrainer: entriesForTrainer,
    diagnosticTags: diagnosticTags,
    latestAttemptForTag: latestAttemptForTag,
    nonDiagnosticTags: NON_DIAGNOSTIC_TAGS
  };
})(typeof window !== "undefined" ? window : globalThis);

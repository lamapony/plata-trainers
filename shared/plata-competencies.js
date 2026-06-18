/* Platå competency graph v1
 *
 * Groups lesson-owned mastery signals into broader learner capabilities.
 * UI and planner layers should use this graph when they need root-cause
 * diagnostics instead of flat weak tags.
 */
(function (root) {
  "use strict";

  var DEFINITIONS = [
    {
      id: "agency",
      label: "Agency and responsibility",
      copy: "Can name who acts, own the next move, and avoid hiding behind vague or passive wording.",
      tags: ["passive-agency", "understatement-with-agency", "professional-email-agency", "agency-without-pressure", "identity-chunk", "clarification-without-panic"]
    },
    {
      id: "register-control",
      label: "Register control",
      copy: "Can choose formality, platform, and phrase signals for the relationship in front of them.",
      tags: ["formal-register-control", "platform-register-shift", "register-signal-control", "courtesy-loop", "inversion-fronted-adverbial", "v2-placement", "fordi-derfor-clause"]
    },
    {
      id: "stance-reading",
      label: "Stance and tone reading",
      copy: "Can read how small words, replies, and social framing change the force of a Danish sentence.",
      tags: ["modal-particle-stance", "reply-tone-reading"]
    },
    {
      id: "process-control",
      label: "Process and next-step control",
      copy: "Can separate anxiety from process, then make the next step visible enough to act on.",
      tags: ["process-patience", "concrete-next-step", "context-reading", "signage-direction", "symptom-duration", "symptom-severity"]
    },
    {
      id: "consequence-awareness",
      label: "Consequence awareness",
      copy: "Can connect wording choices to social cost, trust, and the outcome after the sentence.",
      tags: ["consequence-aware-tone", "professional-agency-principle", "consequence-aware-register", "ordstilling-principle"]
    }
  ];

  function numberOr(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function cloneDefinition(def) {
    return {
      id: def.id,
      label: def.label,
      copy: def.copy,
      tags: (def.tags || []).slice()
    };
  }

  function definitions() {
    return DEFINITIONS.map(cloneDefinition);
  }

  function byId() {
    var out = {};
    DEFINITIONS.forEach(function (def) { out[def.id] = def; });
    return out;
  }

  function tagIndex() {
    var out = {};
    DEFINITIONS.forEach(function (def) {
      (def.tags || []).forEach(function (tag) { out[tag] = def.id; });
    });
    return out;
  }

  function get(id) {
    return byId()[String(id || "").trim()] || null;
  }

  function competencyIdForTag(tag) {
    return tagIndex()[String(tag || "").trim()] || "";
  }

  function competencyForSignal(signal) {
    signal = signal || {};
    var id = signal.competencyId || signal.competency || competencyIdForTag(signal.tag);
    var def = get(id);
    if (def) return cloneDefinition(def);
    return {
      id: "unmapped",
      label: "Unmapped competency",
      copy: "This signal is not attached to a broader competency yet.",
      tags: []
    };
  }

  function enrichSignal(signal) {
    var competency = competencyForSignal(signal);
    var out = {};
    Object.keys(signal || {}).forEach(function (key) { out[key] = signal[key]; });
    out.competencyId = competency.id;
    out.competency = competency;
    return out;
  }

  function signalScore(signal) {
    var wrong = numberOr(signal.wrong, 0);
    var total = Math.max(1, numberOr(signal.total, 0));
    var score = numberOr(signal.score, wrong / total);
    return Math.round(wrong * 10 + score * 40 + 6);
  }

  function rank(signals, limit) {
    var groups = {};
    (signals || []).map(enrichSignal).forEach(function (signal) {
      var def = signal.competency;
      if (!groups[def.id]) {
        groups[def.id] = {
          id: def.id,
          label: def.label,
          copy: def.copy,
          tags: [],
          total: 0,
          correct: 0,
          wrong: 0,
          score: 0,
          signalCount: 0,
          signals: []
        };
      }
      var group = groups[def.id];
      if (signal.tag && group.tags.indexOf(signal.tag) === -1) group.tags.push(signal.tag);
      group.total += numberOr(signal.total, 0);
      group.correct += numberOr(signal.correct, 0);
      group.wrong += numberOr(signal.wrong, 0);
      group.score += signalScore(signal);
      group.signalCount += 1;
      group.signals.push(signal);
    });

    var ranked = Object.keys(groups).map(function (id) {
      var group = groups[id];
      group.errorRate = group.total ? group.wrong / Math.max(1, group.total) : 0;
      group.score = Math.round(group.score + group.signalCount * 8 + group.errorRate * 30);
      group.signals.sort(function (a, b) {
        return signalScore(b) - signalScore(a) || numberOr(b.wrong, 0) - numberOr(a.wrong, 0);
      });
      group.primarySignal = group.signals[0] || null;
      return group;
    }).sort(function (a, b) {
      return b.score - a.score || b.wrong - a.wrong || b.signalCount - a.signalCount;
    });
    return ranked.slice(0, limit || ranked.length);
  }

  function top(signals) {
    return rank(signals, 1)[0] || null;
  }

  root.PlataCompetencies = {
    definitions: definitions,
    get: get,
    tagIndex: tagIndex,
    competencyIdForTag: competencyIdForTag,
    competencyForSignal: competencyForSignal,
    enrichSignal: enrichSignal,
    rank: rank,
    top: top
  };
})(typeof window !== "undefined" ? window : globalThis);

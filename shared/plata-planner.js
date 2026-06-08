/* Plata shared learning planner v1
 *
 * Produces one ranked next-action contract from local trainer state.
 * UI layers should render these decisions, not reinvent practice rules.
 */
(function (root) {
  "use strict";

  var NON_DIAGNOSTIC_TAGS = { A0: true, A1: true, A2: true, B1: true, B2: true, lesson: true, repair: true };
  var DEFAULT_ENOUGH_THRESHOLD = 20;
  var PLAN_SCHEMA_VERSION = 1;
  var TRACE_SCHEMA_VERSION = 1;
  var PRACTICE_PLAN_STORAGE_KEY = "plata:practice-plan:v1";

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function todayAttempts(state) {
    var daily = state && state.meta && state.meta.dailyAttempts || {};
    return Number(daily[todayKey()] || 0);
  }

  function link(rootPrefix, target) {
    return String(rootPrefix || "") + target;
  }

  function sceneHref(path, sceneId, signalTag) {
    if (!sceneId) return path;
    if (!signalTag) return path + "#" + encodeURIComponent(sceneId);
    var separator = path.indexOf("?") === -1 ? "?" : "&";
    return path + separator + "mode=repair&signal=" + encodeURIComponent(signalTag) + "#" + encodeURIComponent(sceneId);
  }

  function statsFromState(state) {
    if (!state) return { total: 0, correct: 0, accuracy: null, today: 0, lastSessionDate: "" };
    var kernel = root.PlataKernel;
    if (kernel && kernel.getStats) {
      var stats = kernel.getStats(state);
      return {
        total: stats.totalAttempts,
        correct: stats.totalCorrect,
        accuracy: stats.accuracyPct,
        today: stats.todayCount,
        lastSessionDate: state.meta && state.meta.lastSessionDate || ""
      };
    }
    var meta = state.meta || {};
    var total = Number(meta.totalAttempts || 0);
    var correct = Number(meta.totalCorrect || 0);
    return {
      total: total,
      correct: correct,
      accuracy: total ? Math.round(correct / total * 100) : null,
      today: todayAttempts(state),
      lastSessionDate: meta.lastSessionDate || ""
    };
  }

  function countLabel(count, singular, plural) {
    count = Number(count || 0);
    return count + " " + (count === 1 ? singular : plural);
  }

  function daysSince(iso) {
    if (!iso) return null;
    var parsed = new Date(iso).getTime();
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.floor((Date.now() - parsed) / 86400000));
  }

  function nextLessonTarget(lessonId, rootPrefix) {
    var prefix = rootPrefix || "";
    var map = {
      "lesson-01-arrival": {
        href: link(prefix, "bojning-drill/"),
        label: "Practise forms",
        title: "Build automatic forms next",
        copy: "You have seen the story flow. A short bojning session is the most useful next step."
      },
      "lesson-b2-radiator-register": {
        href: "../lesson-b2-job-followup/",
        label: "Try job follow-up",
        title: "Keep practising register",
        copy: "You trained complaint tone. The next B2 step is professional follow-up after an interview."
      },
      "lesson-b2-job-followup": {
        href: link(prefix, "dashboard.html"),
        label: "Open dashboard",
        title: "Check your next recommendation",
        copy: "You have completed both B2 register lessons. Let the dashboard pick the next weak signal."
      }
    };
    return map[lessonId] || {
      href: link(prefix, "dashboard.html"),
      label: "Open dashboard",
      title: "Choose the next small session",
      copy: "Use the dashboard to pick the next short practice block from your local progress."
    };
  }

  function nextDrillTarget(trainerId) {
    var map = {
      bojning: { href: "ordstilling-drill/", label: "Practise word order", title: "Move to word order", copy: "Forms were clean. Now practise how Danish sentences arrange those forms." },
      ordstilling: { href: "vocab-sr/", label: "Practise vocabulary", title: "Add vocabulary recall", copy: "Word order was clean. A short vocabulary session keeps the momentum useful." },
      vocab: { href: "dashboard.html", label: "Open dashboard", title: "Check the dashboard", copy: "Vocabulary was clean. Let the dashboard choose the next weak area." }
    };
    return map[trainerId] || { href: "dashboard.html", label: "Open dashboard", title: "Choose the next session", copy: "Use the dashboard to pick the next short practice block." };
  }

  function weakMasteryForLesson(lesson, state) {
    var kernel = root.PlataKernel;
    var graph = root.PlataCompetencies;
    if (!lesson || !lesson.masteryMap || !state || !kernel || !kernel.getWeakTags) return null;
    var weak = kernel.getWeakTags(state, 20);
    for (var i = 0; i < weak.length; i++) {
      var tag = weak[i].tag;
      if (lesson.masteryMap[tag] && lesson.masteryMap[tag].remediation) {
        var spec = lesson.masteryMap[tag];
        var signal = {
          tag: tag,
          stats: weak[i],
          spec: spec,
          competencyId: spec.competencyId || "",
          remediation: spec.remediation
        };
        return graph && graph.enrichSignal ? graph.enrichSignal(signal) : signal;
      }
    }
    return null;
  }

  function weakScore(signal) {
    if (!signal) return 0;
    var stats = signal.stats || signal;
    return Math.round(100 + Number(stats.wrong || 0) * 8 + Number(stats.score || 0) * 30);
  }

  function weakScoreBreakdown(signal) {
    var stats = signal && (signal.stats || signal) || {};
    return [
      { label: "base weak-signal priority", value: 100 },
      { label: "missed attempts", value: Number(stats.wrong || 0) * 8 },
      { label: "error-rate pressure", value: Math.round(Number(stats.score || 0) * 30) }
    ];
  }

  function compactStats(stats) {
    stats = stats || {};
    return {
      total: Number(stats.total || 0),
      correct: Number(stats.correct || 0),
      accuracy: stats.accuracy === undefined ? null : stats.accuracy,
      today: Number(stats.today || 0),
      lastSessionDate: stats.lastSessionDate || ""
    };
  }

  function traceSignal(signal) {
    if (!signal) return null;
    var stats = signal.stats || signal;
    return {
      tag: signal.tag || stats.tag || "",
      label: signal.label || signal.spec && signal.spec.label || "",
      wrong: Number(stats.wrong || 0),
      correct: Number(stats.correct || 0),
      total: Number(stats.total || 0),
      score: Number(stats.score || 0),
      competencyId: signal.competencyId || signal.spec && signal.spec.competencyId || signal.competency && signal.competency.id || ""
    };
  }

  function traceCompetency(competency) {
    if (!competency) return null;
    return {
      id: competency.id || "",
      label: competency.label || "",
      score: Number(competency.score || 0),
      signalCount: Number(competency.signalCount || 0)
    };
  }

  function traceTrainer(trainer, index) {
    trainer = trainer || {};
    return {
      id: trainer.id || "",
      name: trainer.name || "",
      type: trainer.type || "",
      index: Number(index || 0)
    };
  }

  function traceMemoryFact(fact) {
    if (!fact) return null;
    var out = {
      id: fact.id || "",
      kind: fact.kind || "",
      status: fact.status || "",
      trainerId: fact.trainerId || "",
      signal: fact.signal || "",
      confidence: Number(fact.confidence || 0),
      sourceFingerprint: fact.sourceFingerprint || ""
    };
    if (fact.competencyId) out.competencyId = fact.competencyId;
    if (fact.competencyLabel) out.competencyLabel = fact.competencyLabel;
    return out;
  }

  function traceMemoryFacts(facts, limit) {
    return (facts || []).map(traceMemoryFact).filter(Boolean).slice(0, limit || 4);
  }

  function memoryFactPriority(fact) {
    var ranks = {
      recurring_trap: 100,
      root_competency_trap: 95,
      weak_signal: 90,
      next_review_due: 70,
      stale_skill: 60,
      repaired_signal: 45,
      stable_strength: 25,
      preferred_context: 20
    };
    return ranks[fact && fact.kind] || 0;
  }

  function competencyIdForSignal(signalTag) {
    var graph = root.PlataCompetencies;
    if (!graph || !graph.competencyIdForTag) return "";
    return graph.competencyIdForTag(signalTag) || "";
  }

  function compareMemoryFacts(a, b) {
    return memoryFactPriority(b) - memoryFactPriority(a)
      || Number(b && b.confidence || 0) - Number(a && a.confidence || 0)
      || String(a && a.id || "").localeCompare(String(b && b.id || ""));
  }

  function memoryFactsFor(facts, trainerId, signalTag, kinds) {
    var kindSet = {};
    (kinds || []).forEach(function (kind) { kindSet[kind] = true; });
    var competencyId = signalTag ? competencyIdForSignal(signalTag) : "";
    return (facts || []).filter(function (fact) {
      if (!fact) return false;
      var rootMatch = fact.kind === "root_competency_trap" && competencyId && fact.trainerId === "profile" && fact.signal === competencyId;
      if (!rootMatch && fact.trainerId !== trainerId) return false;
      if (signalTag && !rootMatch && fact.signal !== signalTag) return false;
      return !kinds || !kinds.length || kindSet[fact.kind];
    }).sort(compareMemoryFacts);
  }

  function memoryFactLabel(fact) {
    if (!fact) return "";
    return fact.kind + (fact.signal ? " " + fact.signal : "") + (fact.sourceFingerprint ? " " + fact.sourceFingerprint : "");
  }

  function memorySupportForSignal(facts, trainerId, signalTag) {
    var selected = memoryFactsFor(facts, trainerId, signalTag, ["recurring_trap", "root_competency_trap", "weak_signal"]).slice(0, 3);
    var remaining = 30;
    var boost = 0;
    var scoreBreakdown = [];
    selected.forEach(function (fact) {
      if (remaining <= 0) return;
      var confidence = Number(fact.confidence || 0);
      var raw = fact.kind === "recurring_trap"
        ? Math.max(8, Math.round(confidence * 18))
        : fact.kind === "root_competency_trap"
          ? Math.max(7, Math.round(confidence * 15))
        : Math.max(4, Math.round(confidence * 10));
      var value = Math.min(remaining, raw);
      if (value <= 0) return;
      boost += value;
      remaining -= value;
      scoreBreakdown.push({
        label: "memory " + fact.kind + " boost",
        value: value,
        note: fact.sourceFingerprint || fact.id || ""
      });
    });
    return {
      facts: selected,
      boost: boost,
      scoreBreakdown: scoreBreakdown,
      reasons: selected.map(function (fact) { return "Memory fact: " + memoryFactLabel(fact); })
    };
  }

  function memoryReviewForTrainer(facts, trainerId) {
    var selected = memoryFactsFor(facts, trainerId, "", ["next_review_due", "stale_skill"]).slice(0, 1)[0];
    if (!selected) return null;
    var confidence = Number(selected.confidence || 0);
    var base = selected.kind === "next_review_due" ? 55 : 47;
    var boost = Math.round(confidence * 14);
    return {
      fact: selected,
      score: base + boost,
      scoreBreakdown: [
        { label: selected.kind === "next_review_due" ? "memory review-due base" : "memory stale-skill base", value: base },
        { label: "memory confidence boost", value: boost, note: selected.sourceFingerprint || selected.id || "" }
      ],
      reasons: ["Memory fact: " + memoryFactLabel(selected)]
    };
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

  function cleanTraceValue(value, depth) {
    depth = Number(depth || 0);
    if (depth > 4) return null;
    if (value === undefined || value === null) return null;
    if (Array.isArray(value)) {
      return value.map(function (item) { return cleanTraceValue(item, depth + 1); }).filter(function (item) { return item !== null; }).slice(0, 20);
    }
    if (typeof value === "object") {
      var out = {};
      Object.keys(value).sort().forEach(function (key) {
        if (/^(answer|expected|given|input|learnerText|prompt|response|text)$/i.test(key)) return;
        var cleaned = cleanTraceValue(value[key], depth + 1);
        if (cleaned !== null) out[key] = cleaned;
      });
      return out;
    }
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "boolean") return value;
    return String(value).slice(0, 240);
  }

  function normalizeScoreBreakdown(parts) {
    var out = [];
    (parts || []).forEach(function (part) {
      if (!part || typeof part !== "object") return;
      var value = Number(part.value || 0);
      if (!Number.isFinite(value)) return;
      var normalized = {
        label: part.label || "score",
        value: value
      };
      if (part.note) normalized.note = String(part.note).slice(0, 160);
      out.push(normalized);
    });
    return out.slice(0, 8);
  }

  function normalizeTrace(trace) {
    if (!trace || typeof trace !== "object") return null;
    var selected = trace.selected || {};
    var reasons = Array.isArray(trace.reasons) ? trace.reasons : [];
    var normalized = {
      schemaVersion: TRACE_SCHEMA_VERSION,
      source: trace.source || "planner",
      rule: trace.rule || selected.kind || "continue",
      selected: {
        kind: selected.kind || trace.kind || "",
        targetKind: selected.targetKind || trace.targetKind || selected.kind || trace.kind || "",
        trainerId: selected.trainerId || trace.trainerId || "",
        signalTag: selected.signalTag || trace.signalTag || "",
        primaryHref: selected.primaryHref || trace.primaryHref || ""
      },
      score: Number(trace.score || 0),
      scoreBreakdown: normalizeScoreBreakdown(trace.scoreBreakdown),
      inputs: cleanTraceValue(trace.inputs || {}),
      reasons: reasons.filter(Boolean).map(String).slice(0, 8)
    };
    normalized.fingerprint = trace.fingerprint || "ptr-" + stableHash(stableJson({
      rule: normalized.rule,
      selected: normalized.selected,
      score: normalized.score,
      scoreBreakdown: normalized.scoreBreakdown,
      inputs: normalized.inputs,
      reasons: normalized.reasons
    })).slice(0, 12);
    return normalized;
  }

  function traceDecision(decision, trace) {
    decision = decision || {};
    trace = trace || {};
    return normalizeTrace({
      source: trace.source || "planner",
      rule: trace.rule || decision.kind || "continue",
      selected: Object.assign({
        kind: decision.kind || "",
        targetKind: decision.targetKind || decision.kind || "",
        trainerId: decision.trainerId || "",
        signalTag: decision.signalTag || "",
        primaryHref: decision.primaryHref || ""
      }, trace.selected || {}),
      score: decision.score,
      scoreBreakdown: trace.scoreBreakdown || [{ label: "decision score", value: Number(decision.score || 0) }],
      inputs: trace.inputs || {},
      reasons: trace.reasons || decision.reasons || []
    });
  }

  function withTrace(decision, trace) {
    decision.trace = traceDecision(decision, trace);
    return decision;
  }

  function enoughDecision(state, rootPrefix, options) {
    options = options || {};
    var today = todayAttempts(state);
    var threshold = Number(options.enoughThreshold || DEFAULT_ENOUGH_THRESHOLD);
    if (today < threshold) return null;
    return withTrace({
      kind: "enough",
      targetKind: "rest",
      trainerId: options.trainerId || "",
      score: 5,
      eyebrow: "Next step",
      title: "Enough for today",
      copy: "You have done " + today + " attempts today. Let the correct answers settle.",
      primaryLabel: "Open dashboard",
      primaryHref: link(rootPrefix, "dashboard.html"),
      secondaryLabel: options.secondaryLabel || "",
      secondaryHref: options.secondaryHref || "",
      meta: "Spacing beats cramming.",
      reasons: ["Daily practice threshold reached"]
    }, {
      source: options.source || "planner",
      rule: "daily-threshold",
      inputs: {
        trainerId: options.trainerId || "",
        today: today,
        threshold: threshold
      },
      scoreBreakdown: [{ label: "rest recommendation", value: 5 }]
    });
  }

  function lessonDecision(options) {
    options = options || {};
    var lessonData = options.lesson || {};
    var state = options.state || null;
    var rootPrefix = options.rootPrefix || "../../";
    var dashboardHref = link(rootPrefix, "dashboard.html");
    var weak = weakMasteryForLesson(lessonData, state);
    var lessonStats = statsFromState(state);

    if (weak) {
      var repair = weak.remediation || {};
      var href = sceneHref("", repair.sceneId || "", weak.tag).replace(/^\?/, "?");
      var competency = weak.competency || null;
      var repairScore = weakScore(weak);
      return withTrace({
        kind: "repair",
        targetKind: "repair",
        trainerId: lessonData.id || "",
        signalTag: weak.tag,
        score: repairScore,
        eyebrow: "Next step",
        title: "Repair one weak signal",
        copy: "You missed " + (weak.spec.label || weak.tag) + ". Replay the source scene while that signal is still fresh.",
        primaryLabel: repair.cta || "Open repair scene",
        primaryHref: href,
        secondaryLabel: "Open dashboard",
        secondaryHref: dashboardHref,
        meta: repair.action || "",
        competency: competency,
        reasons: (competency ? ["Root competency: " + competency.label] : []).concat(["Weak mastery signal: " + (weak.spec.label || weak.tag)])
      }, {
        source: "lessonDecision",
        rule: "lesson.repair.weak-mastery",
        inputs: {
          lessonId: lessonData.id || "",
          stats: compactStats(lessonStats),
          selectedSignal: traceSignal(weak),
          selectedCompetency: traceCompetency(competency)
        },
        scoreBreakdown: weakScoreBreakdown(weak)
      });
    }

    var enough = enoughDecision(state, rootPrefix, {
      enoughThreshold: options.enoughThreshold,
      secondaryLabel: "Run again",
      secondaryHref: "#again",
      trainerId: lessonData.id || "",
      source: "lessonDecision"
    });
    if (enough) return enough;

    var next = nextLessonTarget(lessonData.id, rootPrefix);
    return withTrace({
      kind: "continue",
      targetKind: "continue",
      trainerId: lessonData.id || "",
      score: 30,
      eyebrow: "Next step",
      title: next.title,
      copy: next.copy,
      primaryLabel: next.label,
      primaryHref: next.href,
      secondaryLabel: "Open dashboard",
      secondaryHref: dashboardHref,
      meta: "Keep it small: one more short session is enough.",
      reasons: ["Current lesson chain has a useful next block"]
    }, {
      source: "lessonDecision",
      rule: "lesson.continue.chain",
      inputs: {
        lessonId: lessonData.id || "",
        stats: compactStats(lessonStats),
        nextTarget: { href: next.href, label: next.label }
      },
      scoreBreakdown: [{ label: "lesson chain continuation", value: 30 }]
    });
  }

  function drillDecision(options) {
    options = options || {};
    var trainerId = options.trainerId || "";
    var state = options.state || null;
    var results = Array.isArray(options.sessionResults) ? options.sessionResults : [];
    var rootPrefix = options.rootPrefix || "../";
    var total = results.length;
    var correct = results.filter(function (item) { return item.correct; }).length;
    var mistakes = Math.max(0, total - correct);
    var accuracy = total ? Math.round(correct / total * 100) : 0;
    var drillStats = statsFromState(state);

    if (mistakes > 0) {
      return withTrace({
        kind: "repeat",
        targetKind: "repeat",
        trainerId: trainerId,
        score: 80 + mistakes * 5,
        eyebrow: "Next step",
        title: "Repeat the weak items",
        copy: "You missed " + mistakes + " of " + total + ". Run one more short session before changing topic.",
        primaryLabel: "Run another session",
        primaryHref: "#again-btn",
        secondaryLabel: "Open dashboard",
        secondaryHref: link(rootPrefix, "dashboard.html"),
        meta: "Accuracy this session: " + accuracy + "%.",
        reasons: ["Session still has mistakes"]
      }, {
        source: "drillDecision",
        rule: "drill.repeat.session-mistakes",
        inputs: {
          trainerId: trainerId,
          session: { total: total, correct: correct, mistakes: mistakes, accuracy: accuracy },
          stats: compactStats(drillStats)
        },
        scoreBreakdown: [
          { label: "repeat base", value: 80 },
          { label: "mistake pressure", value: mistakes * 5 }
        ]
      });
    }

    var enough = enoughDecision(state, rootPrefix, {
      enoughThreshold: options.enoughThreshold,
      secondaryLabel: "Run another session",
      secondaryHref: "#again-btn",
      trainerId: trainerId,
      source: "drillDecision"
    });
    if (enough) return enough;

    var next = nextDrillTarget(trainerId);
    return withTrace({
      kind: "continue",
      targetKind: "continue",
      trainerId: trainerId,
      score: 30,
      eyebrow: "Next step",
      title: next.title,
      copy: next.copy,
      primaryLabel: next.label,
      primaryHref: link(rootPrefix, next.href),
      secondaryLabel: "Run another session",
      secondaryHref: "#again-btn",
      meta: "Accuracy this session: " + accuracy + "%.",
      reasons: ["Clean session unlocks the next block"]
    }, {
      source: "drillDecision",
      rule: "drill.continue.clean-session",
      inputs: {
        trainerId: trainerId,
        session: { total: total, correct: correct, mistakes: mistakes, accuracy: accuracy },
        stats: compactStats(drillStats),
        nextTarget: next
      },
      scoreBreakdown: [{ label: "clean-session continuation", value: 30 }]
    });
  }

  function rawWeakTag(weakTags) {
    for (var i = 0; i < (weakTags || []).length; i++) {
      var tag = weakTags[i].tag;
      if (!NON_DIAGNOSTIC_TAGS[tag]) return weakTags[i];
    }
    return null;
  }

  function competencyForSignal(competencies, signal) {
    if (!signal) return null;
    for (var i = 0; i < (competencies || []).length; i++) {
      var competency = competencies[i];
      var signals = competency.signals || [];
      for (var j = 0; j < signals.length; j++) {
        if (signals[j].tag === signal.tag) return competency;
      }
    }
    return signal.competency || null;
  }

  function dashboardDecision(options) {
    options = options || {};
    var trainer = options.trainer || {};
    var state = options.state || null;
    var stats = Object.assign(statsFromState(state), options.stats || {});
    var trainerPath = trainer.path || "#";
    var weakMastery = options.weakMastery || [];
    var weakTags = options.weakTags || [];
    var memoryFacts = Array.isArray(options.memoryFacts) ? options.memoryFacts : [];
    var graph = root.PlataCompetencies;
    var weakCompetencies = options.weakCompetencies || (graph && graph.rank ? graph.rank(weakMastery) : []);
    var topMastery = weakMastery.find(function (item) { return item.remediation && item.remediation.href; });
    var index = Number(options.index || 0);
    var traceInputs = {
      trainer: traceTrainer(trainer, index),
      stats: compactStats(stats),
      weakMasteryCount: weakMastery.length,
      weakTagCount: weakTags.length,
      weakCompetencyCount: weakCompetencies.length
    };

    if (topMastery) {
      var repairCompetency = competencyForSignal(weakCompetencies, topMastery);
      var competencyBoost = repairCompetency ? Math.min(30, Math.round(Number(repairCompetency.score || 0) / 4)) : 0;
      var repairMemory = memorySupportForSignal(memoryFacts, trainer.id || "", topMastery.tag);
      var repairMemoryFacts = traceMemoryFacts(repairMemory.facts);
      var repairScore = weakScore(topMastery) + competencyBoost + repairMemory.boost;
      var repairTraceInputs = Object.assign({}, traceInputs, {
        selectedSignal: traceSignal(topMastery),
        selectedCompetency: traceCompetency(repairCompetency)
      });
      if (memoryFacts.length) repairTraceInputs.memoryFactCount = memoryFacts.length;
      if (repairMemoryFacts.length) repairTraceInputs.selectedMemoryFacts = repairMemoryFacts;
      return withTrace({
        kind: "repair",
        targetKind: "repair",
        trainerId: trainer.id || "",
        signalTag: topMastery.tag,
        score: repairScore,
        badge: "Repair now",
        title: "Repair " + (topMastery.label || topMastery.tag),
        copy: topMastery.evidence || "A gold lesson mastery signal is currently weak.",
        primaryLabel: "Open repair scene",
        primaryHref: topMastery.remediation.href,
        meta: topMastery.remediation.action || "",
        signals: [topMastery],
        competency: repairCompetency,
        repair: topMastery.remediation,
        memoryFacts: repairMemoryFacts,
        reasons: (repairCompetency ? ["Root competency: " + repairCompetency.label] : []).concat(["Highest weak mastery signal"], repairMemory.reasons)
      }, {
        source: "dashboardDecision",
        rule: "dashboard.repair.highest-open-mastery",
        inputs: repairTraceInputs,
        scoreBreakdown: weakScoreBreakdown(topMastery).concat([
          { label: "root competency boost", value: competencyBoost }
        ], repairMemory.scoreBreakdown)
      });
    }

    var rawWeak = rawWeakTag(weakTags);
    if (rawWeak) {
      var rawMemory = memorySupportForSignal(memoryFacts, trainer.id || "", rawWeak.tag);
      var rawMemoryFacts = traceMemoryFacts(rawMemory.facts);
      var rawScore = 70 + Number(rawWeak.wrong || 0) * 5 + Math.round(Number(rawWeak.score || 0) * 20) + rawMemory.boost;
      var rawTraceInputs = Object.assign({}, traceInputs, {
        selectedSignal: traceSignal(rawWeak)
      });
      if (memoryFacts.length) rawTraceInputs.memoryFactCount = memoryFacts.length;
      if (rawMemoryFacts.length) rawTraceInputs.selectedMemoryFacts = rawMemoryFacts;
      return withTrace({
        kind: "weak",
        targetKind: "practice",
        trainerId: trainer.id || "",
        signalTag: rawWeak.tag,
        score: rawScore,
        badge: "Practice now",
        title: "Repair " + rawWeak.tag,
        copy: "This trainer has a repeated weak tag. A short focused session is the fastest fix.",
        primaryLabel: "Open trainer",
        primaryHref: trainerPath,
        signals: [rawWeak],
        memoryFacts: rawMemoryFacts,
        reasons: ["Weak tag: " + rawWeak.tag].concat(rawMemory.reasons)
      }, {
        source: "dashboardDecision",
        rule: "dashboard.practice.raw-weak-tag",
        inputs: rawTraceInputs,
        scoreBreakdown: [
          { label: "raw weak-tag base", value: 70 },
          { label: "missed attempts", value: Number(rawWeak.wrong || 0) * 5 },
          { label: "error-rate pressure", value: Math.round(Number(rawWeak.score || 0) * 20) }
        ].concat(rawMemory.scoreBreakdown)
      });
    }

    if (stats.today >= DEFAULT_ENOUGH_THRESHOLD) {
      return withTrace({
        kind: "enough",
        targetKind: "rest",
        trainerId: trainer.id || "",
        score: 6,
        badge: "Done today",
        title: "Enough for today",
        copy: "You have already done " + stats.today + " attempts here today. Spacing is the better next move.",
        primaryLabel: "Inspect progress",
        primaryHref: trainerPath,
        reasons: ["Daily practice threshold reached"]
      }, {
        source: "dashboardDecision",
        rule: "dashboard.rest.daily-threshold",
        inputs: Object.assign({}, traceInputs, {
          threshold: DEFAULT_ENOUGH_THRESHOLD
        }),
        scoreBreakdown: [{ label: "dashboard rest recommendation", value: 6 }]
      });
    }

    if (stats.total === 0) {
      var startScore = trainer.id === "lesson-01-arrival" ? 48 : 35 - index;
      return withTrace({
        kind: "start",
        targetKind: "start",
        trainerId: trainer.id || "",
        score: startScore,
        badge: "Start path",
        title: "Start " + (trainer.name || "trainer"),
        copy: trainer.description || "Start with one short session so the planner has real signal.",
        primaryLabel: "Start " + (trainer.type || "trainer"),
        primaryHref: trainerPath,
        reasons: ["No local progress yet"]
      }, {
        source: "dashboardDecision",
        rule: trainer.id === "lesson-01-arrival" ? "dashboard.start.preferred-entry" : "dashboard.start.empty-profile",
        inputs: traceInputs,
        scoreBreakdown: [
          { label: "empty-profile start priority", value: trainer.id === "lesson-01-arrival" ? 48 : 35 },
          { label: "catalog order adjustment", value: trainer.id === "lesson-01-arrival" ? 0 : -index }
        ]
      });
    }

    if (stats.accuracy !== null && stats.accuracy < 70) {
      var accuracyScore = 62 + (70 - stats.accuracy);
      return withTrace({
        kind: "accuracy",
        targetKind: "practice",
        trainerId: trainer.id || "",
        score: accuracyScore,
        badge: "Practice now",
        title: "Stabilize " + (trainer.name || "trainer"),
        copy: "Accuracy is " + stats.accuracy + "%. Keep the next block short and focused.",
        primaryLabel: "Open trainer",
        primaryHref: trainerPath,
        reasons: ["Accuracy below comfort zone"]
      }, {
        source: "dashboardDecision",
        rule: "dashboard.practice.low-accuracy",
        inputs: Object.assign({}, traceInputs, {
          threshold: 70
        }),
        scoreBreakdown: [
          { label: "accuracy repair base", value: 62 },
          { label: "accuracy gap", value: 70 - stats.accuracy }
        ]
      });
    }

    var memoryReview = memoryReviewForTrainer(memoryFacts, trainer.id || "");
    if (memoryReview) {
      var reviewFact = traceMemoryFact(memoryReview.fact);
      var reviewTraceInputs = Object.assign({}, traceInputs);
      if (memoryFacts.length) reviewTraceInputs.memoryFactCount = memoryFacts.length;
      if (reviewFact) reviewTraceInputs.selectedMemoryFacts = [reviewFact];
      return withTrace({
        kind: "stale",
        targetKind: "review",
        trainerId: trainer.id || "",
        signalTag: memoryReview.fact.signal || "",
        score: memoryReview.score,
        badge: "Review",
        title: "Review " + (trainer.name || "trainer"),
        copy: "A learner memory fact says " + (memoryReview.fact.signal || "this skill") + " is ready for a short check.",
        primaryLabel: "Open trainer",
        primaryHref: trainerPath,
        memoryFacts: traceMemoryFacts([memoryReview.fact]),
        reasons: ["Memory review due"].concat(memoryReview.reasons)
      }, {
        source: "dashboardDecision",
        rule: "dashboard.review.memory-due",
        inputs: reviewTraceInputs,
        scoreBreakdown: memoryReview.scoreBreakdown
      });
    }

    var gap = daysSince(stats.lastSessionDate);
    if (gap !== null && gap >= 7) {
      var staleScore = 45 + Math.min(20, gap);
      return withTrace({
        kind: "stale",
        targetKind: "review",
        trainerId: trainer.id || "",
        score: staleScore,
        badge: "Review",
        title: "Refresh " + (trainer.name || "trainer"),
        copy: gap + " days since the last session. A short review keeps it available.",
        primaryLabel: "Open trainer",
        primaryHref: trainerPath,
        reasons: ["Long gap since last session"]
      }, {
        source: "dashboardDecision",
        rule: "dashboard.review.stale-session",
        inputs: Object.assign({}, traceInputs, {
          daysSinceLastSession: gap
        }),
        scoreBreakdown: [
          { label: "stale review base", value: 45 },
          { label: "staleness pressure", value: Math.min(20, gap) }
        ]
      });
    }

    return withTrace({
      kind: "continue",
      targetKind: "continue",
      trainerId: trainer.id || "",
      score: 22 - index / 10,
      badge: "Continue",
      title: "Continue " + (trainer.name || "trainer"),
      copy: trainer.description || "Keep the next session small and focused.",
      primaryLabel: "Continue",
      primaryHref: trainerPath,
      reasons: ["Healthy progress"]
    }, {
      source: "dashboardDecision",
      rule: "dashboard.continue.healthy-progress",
      inputs: traceInputs,
      scoreBreakdown: [
        { label: "healthy progress base", value: 22 },
        { label: "catalog order adjustment", value: -index / 10 }
      ]
    });
  }

  function rankDashboardDecisions(items, limit) {
    return (items || []).filter(function (item) {
      return item && item.decision;
    }).sort(function (a, b) {
      return b.decision.score - a.decision.score || Number(a.index || 0) - Number(b.index || 0);
    }).slice(0, limit || 3);
  }

  function minutesForDecision(kind) {
    if (kind === "repair") return "4-6 min";
    if (kind === "repeat" || kind === "weak" || kind === "accuracy") return "6-8 min";
    if (kind === "start") return "10-15 min";
    if (kind === "enough") return "0 min";
    return "8-10 min";
  }

  function planTitle(kind) {
    if (kind === "repair") return "Repair plan";
    if (kind === "start") return "Starter plan";
    if (kind === "enough") return "Stop here";
    if (kind === "accuracy" || kind === "weak") return "Stabilization plan";
    return "Practice plan";
  }

  function planCopy(kind, count) {
    if (kind === "repair") return "Start with the smallest open root problem, then use the next step only if you still have attention.";
    if (kind === "start") return "Do one short session first. The planner needs real attempts before it can diagnose you.";
    if (kind === "enough") return "You have enough signal for today. Spacing will do more than another forced round.";
    return "Keep the session short and ordered. Finish the first step before switching topics.";
  }

  function itemKey(item) {
    var decision = item && item.decision || {};
    return String(decision.primaryHref || "") + "::" + String(decision.kind || "");
  }

  function stableHash(value) {
    var str = String(value || "");
    var hash = 2166136261;
    for (var i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function normalizeCompetency(competency) {
    if (!competency) return null;
    return {
      id: competency.id || "",
      label: competency.label || "",
      copy: competency.copy || "",
      signalCount: Number(competency.signalCount || 0)
    };
  }

  function normalizeExplanation(explanation) {
    if (!explanation || typeof explanation !== "object") return null;
    var facts = Array.isArray(explanation.facts) ? explanation.facts : [];
    return {
      label: explanation.label || "Why this step",
      copy: explanation.copy || "",
      facts: facts.filter(function (fact) { return fact !== undefined && fact !== null && String(fact).trim(); }).slice(0, 5),
      source: explanation.source || ""
    };
  }

  function explainDecision(decision, stats) {
    decision = decision || {};
    stats = stats || {};
    var kind = decision.kind || "continue";
    var reasons = Array.isArray(decision.reasons) ? decision.reasons.filter(Boolean) : [];
    var signal = decision.signals && decision.signals[0] || null;
    var facts = [];
    var copy = "";

    if (decision.competency && decision.competency.label) facts.push("Root skill: " + decision.competency.label);
    if (signal && signal.label) facts.push("Signal: " + signal.label);
    if (signal && (signal.wrong !== undefined || signal.total !== undefined)) {
      facts.push("Evidence: " + countLabel(signal.wrong, "miss", "misses") + " / " + countLabel(signal.total, "try", "tries"));
    }
    (decision.memoryFacts || []).slice(0, 2).forEach(function (fact) {
      facts.push("Memory: " + memoryFactLabel(fact));
    });
    if (decision.meta) facts.push(decision.meta);
    reasons.forEach(function (reason) { facts.push(reason); });

    if (kind === "repair") {
      copy = "Chosen because this is the highest open mastery signal in the current evidence.";
    } else if (kind === "weak") {
      copy = "Chosen because this trainer still has a repeated weak tag.";
    } else if (kind === "accuracy") {
      copy = "Chosen because accuracy is below the comfort zone.";
      if (stats.accuracy !== undefined && stats.accuracy !== null) facts.unshift("Current accuracy: " + stats.accuracy + "%");
    } else if (kind === "start") {
      copy = "Chosen because this path has no local progress yet.";
    } else if (kind === "enough") {
      copy = "Chosen because today's practice threshold is already reached.";
      if (stats.today !== undefined) facts.unshift("Attempts today: " + Number(stats.today || 0));
    } else if (kind === "stale") {
      copy = decision.trace && decision.trace.rule === "dashboard.review.memory-due"
        ? "Chosen because learner memory says this signal is due for review."
        : "Chosen because this trainer has gone stale since the last session.";
      if (stats.lastSessionDate) facts.unshift("Last session: " + stats.lastSessionDate);
    } else {
      copy = "Chosen as the next useful block from the current local progress.";
    }

    return normalizeExplanation({
      label: "Why this step",
      copy: copy,
      facts: facts,
      source: kind
    });
  }

  function explainPracticePlanStep(step) {
    step = step || {};
    var explanation = normalizeExplanation(step.explanation);
    if (explanation && (explanation.copy || explanation.facts.length)) return explanation;
    return normalizeExplanation({
      label: "Why this step",
      copy: step.kind === "repair"
        ? "Chosen because this repair step still matches an open weak signal."
        : "Chosen from the saved practice plan.",
      facts: (step.competency && step.competency.label ? ["Root skill: " + step.competency.label] : []).concat(step.reasons || []),
      source: step.kind || ""
    });
  }

  function tracePracticePlanStep(step) {
    step = step || {};
    return normalizeTrace(step.trace) || traceDecision(step, {
      source: "practicePlan",
      rule: "practice-plan.step",
      inputs: {
        trainerId: step.trainerId || "",
        attemptsAtStart: Number(step.attemptsAtStart || 0),
        lastSessionDateAtStart: step.lastSessionDateAtStart || ""
      }
    });
  }

  function planStep(item, number) {
    var decision = item.decision || {};
    var trainer = item.trainer || {};
    var stats = item.stats || {};
    var competency = decision.competency || null;
    var trace = normalizeTrace(decision.trace) || traceDecision(decision, {
      source: "practicePlan",
      rule: "practice-plan.step",
      inputs: {
        trainer: traceTrainer(trainer, item.index),
        stats: compactStats(stats)
      }
    });
    return {
      number: number,
      kind: decision.kind || "continue",
      targetKind: decision.targetKind || decision.kind || "continue",
      trainerId: trainer.id || decision.trainerId || "",
      signalTag: decision.signalTag || "",
      trainerName: trainer.name || "",
      trainerIcon: trainer.icon || "",
      badge: decision.badge || decision.eyebrow || "Next",
      title: decision.title || trainer.name || "Practice",
      copy: decision.copy || trainer.description || "",
      primaryLabel: decision.primaryLabel || "Open",
      primaryHref: decision.primaryHref || trainer.path || "#",
      minutes: minutesForDecision(decision.kind),
      score: Number(decision.score || 0),
      attemptsAtStart: Number(stats.total || 0),
      lastSessionDateAtStart: stats.lastSessionDate || "",
      competency: normalizeCompetency(competency),
      reasons: decision.reasons || [],
      memoryFacts: traceMemoryFacts(decision.memoryFacts),
      explanation: explainDecision(decision, stats),
      trace: trace
    };
  }

  function practicePlan(items, options) {
    options = options || {};
    var limit = Math.max(1, Number(options.limit || 3));
    var ranked = rankDashboardDecisions(items || [], Math.max(limit + 4, 8));
    if (!ranked.length) {
      return {
        kind: "empty",
        title: "Practice plan",
        copy: "Start any trainer to give the planner enough local signal.",
        steps: [],
        meta: "No local progress yet."
      };
    }

    var picked = [];
    var seen = {};
    function push(item) {
      if (!item || !item.decision || picked.length >= limit) return;
      var key = itemKey(item);
      if (!key || seen[key]) return;
      seen[key] = true;
      picked.push(item);
    }

    var firstRepair = ranked.find(function (item) { return item.decision && item.decision.kind === "repair"; });
    if (firstRepair) push(firstRepair);
    if (!picked.length) push(ranked[0]);
    var primaryKind = picked[0] && picked[0].decision && picked[0].decision.kind || "";
    ranked.forEach(function (item) {
      var kind = item && item.decision && item.decision.kind || "";
      if (kind === "start") return;
      if (primaryKind === "enough" && kind !== "enough") return;
      push(item);
    });

    var steps = picked.map(function (item, index) { return planStep(item, index + 1); });
    var firstKind = steps[0] && steps[0].kind || "continue";
    return {
      kind: firstKind,
      title: planTitle(firstKind),
      copy: planCopy(firstKind, steps.length),
      steps: steps,
      primaryStep: steps[0] || null,
      meta: steps.length + " step" + (steps.length === 1 ? "" : "s") + " compiled from current local progress."
    };
  }

  function storage() {
    try {
      if (!root.localStorage) return null;
      var probe = "plata:storage-probe";
      root.localStorage.setItem(probe, "1");
      root.localStorage.removeItem(probe);
      return root.localStorage;
    } catch (err) {
      return null;
    }
  }

  function stepTrackingKey(step) {
    step = step || {};
    return [
      String(step.kind || ""),
      String(step.trainerId || ""),
      String(step.signalTag || ""),
      String(step.primaryHref || "")
    ].join("::");
  }

  function stepRouteId(step, index) {
    var number = Number(step && step.number || index + 1);
    return "s" + number + "-" + stableHash(stepTrackingKey(step)).slice(0, 8);
  }

  function planFingerprint(plan) {
    var steps = plan && Array.isArray(plan.steps) ? plan.steps : [];
    return steps.map(stepTrackingKey).join("|");
  }

  function paramFromHref(href, name) {
    var query = String(href || "").split("#")[0].split("?")[1] || "";
    if (!query) return "";
    var pairs = query.split("&");
    for (var i = 0; i < pairs.length; i++) {
      var parts = pairs[i].split("=");
      var key = "";
      try {
        key = decodeURIComponent(parts[0] || "");
      } catch (err) {
        key = parts[0] || "";
      }
      if (key === name) {
        try {
          return decodeURIComponent((parts[1] || "").replace(/\+/g, " "));
        } catch (err2) {
          return (parts[1] || "").replace(/\+/g, " ");
        }
      }
    }
    return "";
  }

  function normalizePlanStep(step, index) {
    step = step || {};
    var primaryHref = step.primaryHref || "#";
    var normalized = {
      number: Number(step.number || index + 1),
      kind: step.kind || "continue",
      targetKind: step.targetKind || step.kind || "continue",
      trainerId: step.trainerId || "",
      signalTag: step.signalTag || paramFromHref(primaryHref, "signal"),
      trainerName: step.trainerName || "",
      trainerIcon: step.trainerIcon || "",
      badge: step.badge || "Next",
      title: step.title || "Practice",
      copy: step.copy || "",
      primaryLabel: step.primaryLabel || "Open",
      primaryHref: primaryHref,
      minutes: step.minutes || minutesForDecision(step.kind),
      score: Number(step.score || 0),
      attemptsAtStart: Number(step.attemptsAtStart || 0),
      lastSessionDateAtStart: step.lastSessionDateAtStart || "",
      competency: normalizeCompetency(step.competency),
      reasons: Array.isArray(step.reasons) ? step.reasons.slice(0, 6) : [],
      memoryFacts: traceMemoryFacts(step.memoryFacts),
      explanation: normalizeExplanation(step.explanation),
      trace: normalizeTrace(step.trace) || traceDecision(step, {
        source: "practicePlan",
        rule: "practice-plan.legacy-step",
        inputs: {
          trainerId: step.trainerId || "",
          attemptsAtStart: Number(step.attemptsAtStart || 0),
          lastSessionDateAtStart: step.lastSessionDateAtStart || ""
        }
      }),
      startedAt: step.startedAt || "",
      completedAt: step.completedAt || "",
      lastSeenAt: step.lastSeenAt || "",
      completionEvidence: step.completionEvidence && typeof step.completionEvidence === "object" ? step.completionEvidence : null
    };
    normalized.routeId = step.routeId || stepRouteId(normalized, index);
    return normalized;
  }

  function normalizePracticePlan(plan) {
    if (!plan || !Array.isArray(plan.steps)) return null;
    var steps = plan.steps.map(normalizePlanStep);
    var kind = plan.kind || steps[0] && steps[0].kind || "empty";
    var normalized = {
      schemaVersion: PLAN_SCHEMA_VERSION,
      trackedAt: plan.trackedAt || new Date().toISOString(),
      kind: kind,
      title: plan.title || planTitle(kind),
      copy: plan.copy || planCopy(kind, steps.length),
      steps: steps,
      primaryStep: steps[0] || null,
      meta: plan.meta || "",
      fingerprint: plan.fingerprint || "",
      planToken: plan.planToken || ""
    };
    normalized.fingerprint = normalized.fingerprint || planFingerprint(normalized);
    normalized.planToken = normalized.planToken || "p" + stableHash(normalized.fingerprint).slice(0, 10);
    return normalized;
  }

  function readPracticePlan() {
    var store = storage();
    if (!store) return null;
    try {
      return normalizePracticePlan(JSON.parse(store.getItem(PRACTICE_PLAN_STORAGE_KEY) || "null"));
    } catch (err) {
      return null;
    }
  }

  function savePracticePlan(plan) {
    var normalized = normalizePracticePlan(plan);
    if (!normalized) return null;
    var store = storage();
    if (store) {
      try {
        store.setItem(PRACTICE_PLAN_STORAGE_KEY, JSON.stringify(normalized));
      } catch (err) {
        // Storage can be unavailable in privacy modes; the in-memory plan still renders.
      }
    }
    return normalized;
  }

  function clearPracticePlan() {
    var store = storage();
    if (!store) return;
    try {
      store.removeItem(PRACTICE_PLAN_STORAGE_KEY);
    } catch (err) {
      // Ignore local storage failures.
    }
  }

  function queryParam(name) {
    if (!root.location || !root.location.search) return "";
    var query = root.location.search.replace(/^\?/, "").split("&");
    for (var i = 0; i < query.length; i++) {
      var parts = query[i].split("=");
      var key = "";
      try {
        key = decodeURIComponent(parts[0] || "");
      } catch (err) {
        key = parts[0] || "";
      }
      if (key === name) {
        try {
          return decodeURIComponent((parts[1] || "").replace(/\+/g, " "));
        } catch (err2) {
          return (parts[1] || "").replace(/\+/g, " ");
        }
      }
    }
    return "";
  }

  function appendQueryParams(href, params) {
    var raw = String(href || "#");
    var hashIndex = raw.indexOf("#");
    var base = hashIndex === -1 ? raw : raw.slice(0, hashIndex);
    var hash = hashIndex === -1 ? "" : raw.slice(hashIndex);
    var pairs = [];
    Object.keys(params || {}).forEach(function (key) {
      if (params[key] === undefined || params[key] === null || params[key] === "") return;
      pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(params[key])));
    });
    if (!pairs.length) return raw;
    return base + (base.indexOf("?") === -1 ? "?" : "&") + pairs.join("&") + hash;
  }

  function planStepHref(plan, step) {
    var normalized = normalizePracticePlan(plan);
    if (!normalized || !step) return step && step.primaryHref || "#";
    var routeStep = normalized.steps.find(function (item) {
      return item.routeId === step.routeId || item.number === step.number;
    }) || step;
    return appendQueryParams(routeStep.primaryHref, {
      plan: normalized.planToken,
      step: routeStep.routeId
    });
  }

  function currentPracticePlanStep(options) {
    options = options || {};
    var plan = readPracticePlan();
    if (!plan || !plan.steps.length) return null;
    var token = queryParam("plan");
    var stepId = queryParam("step");
    if (!token || token !== plan.planToken || !stepId) return null;
    var step = null;
    var index = -1;
    for (var i = 0; i < plan.steps.length; i++) {
      if (plan.steps[i].routeId === stepId) {
        step = plan.steps[i];
        index = i;
        break;
      }
    }
    if (!step) return null;
    if (options.trainerId && step.trainerId && step.trainerId !== options.trainerId) return null;
    return {
      plan: plan,
      step: step,
      stepIndex: index,
      stepNumber: index + 1,
      totalSteps: plan.steps.length,
      dashboardHref: options.dashboardHref || "dashboard.html"
    };
  }

  function updateCurrentPracticePlanStep(options, updater) {
    options = options || {};
    var context = currentPracticePlanStep(options);
    if (!context || !context.plan || !context.step) return null;
    var plan = context.plan;
    var step = plan.steps[context.stepIndex];
    updater(step, plan, context);
    savePracticePlan(plan);
    return currentPracticePlanStep(options);
  }

  function evidencePayload(value) {
    var source = value && typeof value === "object" ? value : {};
    var out = {};
    ["reason", "mode", "itemId", "sceneId", "trainerId", "correct", "total", "accuracy"].forEach(function (key) {
      if (source[key] === undefined || source[key] === null || source[key] === "") return;
      out[key] = source[key];
    });
    return out;
  }

  function markPracticePlanStepStarted(options) {
    return updateCurrentPracticePlanStep(options, function (step) {
      var now = new Date().toISOString();
      if (!step.startedAt) step.startedAt = now;
      step.lastSeenAt = now;
    });
  }

  function markPracticePlanStepCompleted(options) {
    options = options || {};
    return updateCurrentPracticePlanStep(options, function (step) {
      var now = new Date().toISOString();
      if (!step.startedAt) step.startedAt = now;
      step.lastSeenAt = now;
      if (!step.completedAt) {
        step.completedAt = now;
        step.completionEvidence = evidencePayload(options.evidence || {});
      } else if (!step.completionEvidence) {
        step.completionEvidence = evidencePayload(options.evidence || {});
      }
    });
  }

  function candidateFacts(items) {
    var facts = { keys: {}, byTrainer: {} };
    (items || []).forEach(function (item) {
      var decision = item && item.decision || {};
      var trainer = item && item.trainer || {};
      var trainerId = trainer.id || decision.trainerId || "";
      if (decision.primaryHref) {
        facts.keys[stepTrackingKey({
          kind: decision.kind || "",
          trainerId: trainerId,
          signalTag: decision.signalTag || "",
          primaryHref: decision.primaryHref || ""
        })] = true;
      }
      if (trainerId && !facts.byTrainer[trainerId]) facts.byTrainer[trainerId] = item;
    });
    return facts;
  }

  function statusForStep(step, facts) {
    var trainer = facts.byTrainer[step.trainerId] || null;
    var stats = trainer && trainer.stats || {};
    var attemptsNow = Number(stats.total || 0);
    var attemptsAtStart = Number(step.attemptsAtStart || 0);
    var attemptsMoved = attemptsNow > attemptsAtStart;
    var stillCurrent = !!facts.keys[stepTrackingKey(step)];

    if (step.completedAt) {
      return { status: "done", statusLabel: "Done", completionReason: "Tracked plan step completed." };
    }

    if (step.kind === "repair") {
      if (!stillCurrent) {
        return { status: "done", statusLabel: "Done", completionReason: "Repair no longer appears in the current weak-signal plan." };
      }
      if (step.startedAt) {
        return { status: "active", statusLabel: "In progress", completionReason: "" };
      }
      return { status: "open", statusLabel: "Open", completionReason: "" };
    }

    if (attemptsMoved) {
      return { status: "done", statusLabel: "Done", completionReason: "Trainer attempts increased since this plan was compiled." };
    }
    if (step.startedAt) {
      return { status: "active", statusLabel: "In progress", completionReason: "" };
    }
    return { status: "open", statusLabel: "Open", completionReason: "" };
  }

  function actionablePracticePlanStep(plan) {
    var steps = plan && Array.isArray(plan.steps) ? plan.steps : [];
    if (!steps.length) return null;
    return steps.find(function (step) { return step.status === "active"; })
      || steps.find(function (step) { return step.status === "open"; })
      || steps.find(function (step) { return !step.completedAt && step.status !== "done"; })
      || null;
  }

  function planStatus(plan, items) {
    var normalized = normalizePracticePlan(plan);
    if (!normalized) return null;
    var facts = candidateFacts(items || []);
    var completedCount = 0;
    normalized.steps = normalized.steps.map(function (step) {
      var status = statusForStep(step, facts);
      var enriched = Object.assign({}, step, status);
      if (enriched.status === "done") completedCount++;
      return enriched;
    });
    normalized.completedCount = completedCount;
    normalized.openCount = Math.max(0, normalized.steps.length - completedCount);
    normalized.completed = normalized.steps.length > 0 && normalized.openCount === 0;
    normalized.meta = normalized.completed
      ? "All " + normalized.steps.length + " tracked step" + (normalized.steps.length === 1 ? "" : "s") + " completed."
      : completedCount + "/" + normalized.steps.length + " tracked step" + (normalized.steps.length === 1 ? "" : "s") + " completed.";
    normalized.primaryStep = actionablePracticePlanStep(normalized) || normalized.steps[0] || null;
    return normalized;
  }

  root.PlataPlanner = {
    todayAttempts: todayAttempts,
    sceneHref: sceneHref,
    statsFromState: statsFromState,
    nextLessonTarget: nextLessonTarget,
    nextDrillTarget: nextDrillTarget,
    lessonDecision: lessonDecision,
    drillDecision: drillDecision,
    dashboardDecision: dashboardDecision,
    explainDecision: explainDecision,
    explainPracticePlanStep: explainPracticePlanStep,
    traceDecision: traceDecision,
    tracePracticePlanStep: tracePracticePlanStep,
    rankDashboardDecisions: rankDashboardDecisions,
    practicePlan: practicePlan,
    planFingerprint: planFingerprint,
    planStepHref: planStepHref,
    currentPracticePlanStep: currentPracticePlanStep,
    markPracticePlanStepStarted: markPracticePlanStepStarted,
    markPracticePlanStepCompleted: markPracticePlanStepCompleted,
    readPracticePlan: readPracticePlan,
    savePracticePlan: savePracticePlan,
    clearPracticePlan: clearPracticePlan,
    planStatus: planStatus,
    actionablePracticePlanStep: actionablePracticePlanStep,
    traceSchemaVersion: TRACE_SCHEMA_VERSION,
    practicePlanStorageKey: PRACTICE_PLAN_STORAGE_KEY,
    nonDiagnosticTags: NON_DIAGNOSTIC_TAGS
  };
})(typeof window !== "undefined" ? window : globalThis);

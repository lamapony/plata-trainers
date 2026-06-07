/* Plata shared learning planner v1
 *
 * Produces one ranked next-action contract from local trainer state.
 * UI layers should render these decisions, not reinvent practice rules.
 */
(function (root) {
  "use strict";

  var NON_DIAGNOSTIC_TAGS = { A0: true, A1: true, A2: true, B1: true, B2: true, lesson: true, repair: true };
  var DEFAULT_ENOUGH_THRESHOLD = 20;

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

  function enoughDecision(state, rootPrefix, options) {
    var today = todayAttempts(state);
    var threshold = Number((options && options.enoughThreshold) || DEFAULT_ENOUGH_THRESHOLD);
    if (today < threshold) return null;
    return {
      kind: "enough",
      targetKind: "rest",
      score: 5,
      eyebrow: "Next step",
      title: "Enough for today",
      copy: "You have done " + today + " attempts today. Let the correct answers settle.",
      primaryLabel: "Open dashboard",
      primaryHref: link(rootPrefix, "dashboard.html"),
      secondaryLabel: options && options.secondaryLabel || "",
      secondaryHref: options && options.secondaryHref || "",
      meta: "Spacing beats cramming.",
      reasons: ["Daily practice threshold reached"]
    };
  }

  function lessonDecision(options) {
    options = options || {};
    var lessonData = options.lesson || {};
    var state = options.state || null;
    var rootPrefix = options.rootPrefix || "../../";
    var dashboardHref = link(rootPrefix, "dashboard.html");
    var weak = weakMasteryForLesson(lessonData, state);

    if (weak) {
      var repair = weak.remediation || {};
      var href = sceneHref("", repair.sceneId || "", weak.tag).replace(/^\?/, "?");
      var competency = weak.competency || null;
      return {
        kind: "repair",
        targetKind: "repair",
        trainerId: lessonData.id || "",
        signalTag: weak.tag,
        score: weakScore(weak),
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
      };
    }

    var enough = enoughDecision(state, rootPrefix, {
      enoughThreshold: options.enoughThreshold,
      secondaryLabel: "Run again",
      secondaryHref: "#again"
    });
    if (enough) return enough;

    var next = nextLessonTarget(lessonData.id, rootPrefix);
    return {
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
    };
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

    if (mistakes > 0) {
      return {
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
      };
    }

    var enough = enoughDecision(state, rootPrefix, {
      enoughThreshold: options.enoughThreshold,
      secondaryLabel: "Run another session",
      secondaryHref: "#again-btn"
    });
    if (enough) return enough;

    var next = nextDrillTarget(trainerId);
    return {
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
    };
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
    var graph = root.PlataCompetencies;
    var weakCompetencies = options.weakCompetencies || (graph && graph.rank ? graph.rank(weakMastery) : []);
    var topMastery = weakMastery.find(function (item) { return item.remediation && item.remediation.href; });
    var index = Number(options.index || 0);

    if (topMastery) {
      var repairCompetency = competencyForSignal(weakCompetencies, topMastery);
      var competencyBoost = repairCompetency ? Math.min(30, Math.round(Number(repairCompetency.score || 0) / 4)) : 0;
      return {
        kind: "repair",
        targetKind: "repair",
        trainerId: trainer.id || "",
        signalTag: topMastery.tag,
        score: weakScore(topMastery) + competencyBoost,
        badge: "Repair now",
        title: "Repair " + (topMastery.label || topMastery.tag),
        copy: topMastery.evidence || "A gold lesson mastery signal is currently weak.",
        primaryLabel: "Open repair scene",
        primaryHref: topMastery.remediation.href,
        meta: topMastery.remediation.action || "",
        signals: [topMastery],
        competency: repairCompetency,
        repair: topMastery.remediation,
        reasons: (repairCompetency ? ["Root competency: " + repairCompetency.label] : []).concat(["Highest weak mastery signal"])
      };
    }

    var rawWeak = rawWeakTag(weakTags);
    if (rawWeak) {
      return {
        kind: "weak",
        targetKind: "practice",
        trainerId: trainer.id || "",
        signalTag: rawWeak.tag,
        score: 70 + Number(rawWeak.wrong || 0) * 5 + Math.round(Number(rawWeak.score || 0) * 20),
        badge: "Practice now",
        title: "Repair " + rawWeak.tag,
        copy: "This trainer has a repeated weak tag. A short focused session is the fastest fix.",
        primaryLabel: "Open trainer",
        primaryHref: trainerPath,
        signals: [rawWeak],
        reasons: ["Weak tag: " + rawWeak.tag]
      };
    }

    if (stats.today >= DEFAULT_ENOUGH_THRESHOLD) {
      return {
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
      };
    }

    if (stats.total === 0) {
      var startScore = trainer.id === "lesson-01-arrival" ? 48 : 35 - index;
      return {
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
      };
    }

    if (stats.accuracy !== null && stats.accuracy < 70) {
      return {
        kind: "accuracy",
        targetKind: "practice",
        trainerId: trainer.id || "",
        score: 62 + (70 - stats.accuracy),
        badge: "Practice now",
        title: "Stabilize " + (trainer.name || "trainer"),
        copy: "Accuracy is " + stats.accuracy + "%. Keep the next block short and focused.",
        primaryLabel: "Open trainer",
        primaryHref: trainerPath,
        reasons: ["Accuracy below comfort zone"]
      };
    }

    var gap = daysSince(stats.lastSessionDate);
    if (gap !== null && gap >= 7) {
      return {
        kind: "stale",
        targetKind: "review",
        trainerId: trainer.id || "",
        score: 45 + Math.min(20, gap),
        badge: "Review",
        title: "Refresh " + (trainer.name || "trainer"),
        copy: gap + " days since the last session. A short review keeps it available.",
        primaryLabel: "Open trainer",
        primaryHref: trainerPath,
        reasons: ["Long gap since last session"]
      };
    }

    return {
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
    };
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

  function planStep(item, number) {
    var decision = item.decision || {};
    var trainer = item.trainer || {};
    var competency = decision.competency || null;
    return {
      number: number,
      kind: decision.kind || "continue",
      trainerId: trainer.id || decision.trainerId || "",
      trainerName: trainer.name || "",
      trainerIcon: trainer.icon || "",
      badge: decision.badge || decision.eyebrow || "Next",
      title: decision.title || trainer.name || "Practice",
      copy: decision.copy || trainer.description || "",
      primaryLabel: decision.primaryLabel || "Open",
      primaryHref: decision.primaryHref || trainer.path || "#",
      minutes: minutesForDecision(decision.kind),
      score: Number(decision.score || 0),
      competency: competency,
      reasons: decision.reasons || []
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

  root.PlataPlanner = {
    todayAttempts: todayAttempts,
    sceneHref: sceneHref,
    statsFromState: statsFromState,
    nextLessonTarget: nextLessonTarget,
    nextDrillTarget: nextDrillTarget,
    lessonDecision: lessonDecision,
    drillDecision: drillDecision,
    dashboardDecision: dashboardDecision,
    rankDashboardDecisions: rankDashboardDecisions,
    practicePlan: practicePlan,
    nonDiagnosticTags: NON_DIAGNOSTIC_TAGS
  };
})(typeof window !== "undefined" ? window : globalThis);

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
    if (!lesson || !lesson.masteryMap || !state || !kernel || !kernel.getWeakTags) return null;
    var weak = kernel.getWeakTags(state, 20);
    for (var i = 0; i < weak.length; i++) {
      var tag = weak[i].tag;
      if (lesson.masteryMap[tag] && lesson.masteryMap[tag].remediation) {
        return {
          tag: tag,
          stats: weak[i],
          spec: lesson.masteryMap[tag],
          remediation: lesson.masteryMap[tag].remediation
        };
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
        reasons: ["Weak mastery signal: " + (weak.spec.label || weak.tag)]
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

  function dashboardDecision(options) {
    options = options || {};
    var trainer = options.trainer || {};
    var state = options.state || null;
    var stats = Object.assign(statsFromState(state), options.stats || {});
    var trainerPath = trainer.path || "#";
    var weakMastery = options.weakMastery || [];
    var weakTags = options.weakTags || [];
    var topMastery = weakMastery.find(function (item) { return item.remediation && item.remediation.href; });
    var index = Number(options.index || 0);

    if (topMastery) {
      return {
        kind: "repair",
        targetKind: "repair",
        trainerId: trainer.id || "",
        signalTag: topMastery.tag,
        score: weakScore(topMastery),
        badge: "Repair now",
        title: "Repair " + (topMastery.label || topMastery.tag),
        copy: topMastery.evidence || "A gold lesson mastery signal is currently weak.",
        primaryLabel: "Open repair scene",
        primaryHref: topMastery.remediation.href,
        meta: topMastery.remediation.action || "",
        signals: [topMastery],
        repair: topMastery.remediation,
        reasons: ["Highest weak mastery signal"]
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
    nonDiagnosticTags: NON_DIAGNOSTIC_TAGS
  };
})(typeof window !== "undefined" ? window : globalThis);

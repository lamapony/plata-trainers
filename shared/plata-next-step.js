/* Platå next-step helper v1
 *
 * Turns local progress into one plain-language recommendation after a
 * completed lesson or drill session.
 */
(function (root) {
  "use strict";

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[ch];
    });
  }

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

  function nextLessonTarget(lessonId, rootPrefix) {
    var prefix = rootPrefix || "";
    var map = {
      "lesson-01-arrival": {
        href: link(prefix, "bojning-drill/"),
        label: "Practise forms",
        title: "Build automatic forms next",
        copy: "You have seen the story flow. A short bøjning session is the most useful next step."
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

  function weakestMastery(lesson, state) {
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

  function lesson(options) {
    options = options || {};
    var lessonData = options.lesson || {};
    var state = options.state || null;
    var rootPrefix = options.rootPrefix || "../../";
    var dashboardHref = link(rootPrefix, "dashboard.html");
    var enoughThreshold = Number(options.enoughThreshold || 20);
    var today = todayAttempts(state);
    var weak = weakestMastery(lessonData, state);

    if (weak) {
      var repair = weak.remediation || {};
      var href = "?mode=repair&signal=" + encodeURIComponent(weak.tag) + "#" + encodeURIComponent(repair.sceneId || "");
      return {
        kind: "repair",
        eyebrow: "Next step",
        title: "Repair one weak signal",
        copy: "You missed " + (weak.spec.label || weak.tag) + ". Replay the source scene while that signal is still fresh.",
        primaryLabel: repair.cta || "Open repair scene",
        primaryHref: href,
        secondaryLabel: "Open dashboard",
        secondaryHref: dashboardHref,
        meta: repair.action || ""
      };
    }

    if (today >= enoughThreshold) {
      return {
        kind: "enough",
        eyebrow: "Next step",
        title: "Enough for today",
        copy: "You have done " + today + " attempts today. Stop here, or use the dashboard if you want to inspect progress.",
        primaryLabel: "Open dashboard",
        primaryHref: dashboardHref,
        secondaryLabel: "Run again",
        secondaryHref: "#again",
        meta: "Spacing helps more than forcing another long session."
      };
    }

    var next = nextLessonTarget(lessonData.id, rootPrefix);
    return {
      kind: "continue",
      eyebrow: "Next step",
      title: next.title,
      copy: next.copy,
      primaryLabel: next.label,
      primaryHref: next.href,
      secondaryLabel: "Open dashboard",
      secondaryHref: dashboardHref,
      meta: "Keep it small: one more short session is enough."
    };
  }

  function drill(options) {
    options = options || {};
    var trainerId = options.trainerId || "";
    var state = options.state || null;
    var results = Array.isArray(options.sessionResults) ? options.sessionResults : [];
    var rootPrefix = options.rootPrefix || "../";
    var total = results.length;
    var correct = results.filter(function (item) { return item.correct; }).length;
    var mistakes = Math.max(0, total - correct);
    var accuracy = total ? Math.round(correct / total * 100) : 0;
    var today = todayAttempts(state);
    var enoughThreshold = Number(options.enoughThreshold || 20);

    if (mistakes > 0) {
      return {
        kind: "repeat",
        eyebrow: "Next step",
        title: "Repeat the weak items",
        copy: "You missed " + mistakes + " of " + total + ". Run one more short session before changing topic.",
        primaryLabel: "Run another session",
        primaryHref: "#again-btn",
        secondaryLabel: "Open dashboard",
        secondaryHref: link(rootPrefix, "dashboard.html"),
        meta: "Accuracy this session: " + accuracy + "%."
      };
    }

    if (today >= enoughThreshold) {
      return {
        kind: "enough",
        eyebrow: "Next step",
        title: "Enough for today",
        copy: "You have done " + today + " attempts today. Let the correct answers settle.",
        primaryLabel: "Open dashboard",
        primaryHref: link(rootPrefix, "dashboard.html"),
        secondaryLabel: "Run another session",
        secondaryHref: "#again-btn",
        meta: "Spacing beats cramming."
      };
    }

    var nextByTrainer = {
      bojning: { href: "ordstilling-drill/", label: "Practise word order", title: "Move to word order", copy: "Forms were clean. Now practise how Danish sentences arrange those forms." },
      ordstilling: { href: "vocab-sr/", label: "Practise vocabulary", title: "Add vocabulary recall", copy: "Word order was clean. A short vocabulary session keeps the momentum useful." },
      vocab: { href: "dashboard.html", label: "Open dashboard", title: "Check the dashboard", copy: "Vocabulary was clean. Let the dashboard choose the next weak area." }
    };
    var next = nextByTrainer[trainerId] || { href: "dashboard.html", label: "Open dashboard", title: "Choose the next session", copy: "Use the dashboard to pick the next short practice block." };
    return {
      kind: "continue",
      eyebrow: "Next step",
      title: next.title,
      copy: next.copy,
      primaryLabel: next.label,
      primaryHref: link(rootPrefix, next.href),
      secondaryLabel: "Run another session",
      secondaryHref: "#again-btn",
      meta: "Accuracy this session: " + accuracy + "%."
    };
  }

  function render(spec) {
    if (!spec) return "";
    return [
      "<section class='next-step-card " + escapeHtml(spec.kind || "next") + "' aria-label='Recommended next step'>",
      "<p class='eyebrow'>" + escapeHtml(spec.eyebrow || "Next step") + "</p>",
      "<h3>" + escapeHtml(spec.title) + "</h3>",
      "<p>" + escapeHtml(spec.copy) + "</p>",
      spec.meta ? "<p class='next-step-meta'>" + escapeHtml(spec.meta) + "</p>" : "",
      "<div class='next-step-actions'>",
      "<a class='primary btn btn-primary link-button' href='" + escapeHtml(spec.primaryHref) + "'>" + escapeHtml(spec.primaryLabel) + "</a>",
      spec.secondaryHref ? "<a class='ghost btn btn-ghost link-button' href='" + escapeHtml(spec.secondaryHref) + "'>" + escapeHtml(spec.secondaryLabel) + "</a>" : "",
      "</div>",
      "</section>"
    ].join("");
  }

  root.PlataNextStep = {
    lesson: lesson,
    drill: drill,
    render: render
  };
})(typeof window !== "undefined" ? window : globalThis);

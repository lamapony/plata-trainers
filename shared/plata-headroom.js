/* Platå learner headroom — compress technical practice data into plain language.
   Pattern inspired by context compression (store detail, surface meaning).
   https://github.com/chopratejas/headroom */
(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[ch];
    });
  }

  function missTryText(misses, tries) {
    var wrong = Number(misses || 0);
    var total = Number(tries || 0);
    if (!total) return "no attempts yet";
    return wrong + " miss" + (wrong === 1 ? "" : "es") + " out of " + total;
  }

  function accuracyPhrase(accuracy) {
    if (accuracy === null || accuracy === undefined) return "not enough data yet";
    if (accuracy >= 85) return "usually right (" + accuracy + "%)";
    if (accuracy >= 65) return "getting there (" + accuracy + "%)";
    return "still shaky (" + accuracy + "%)";
  }

  function errorRatePhrase(rate) {
    var pct = Math.round(Number(rate || 0) * 100);
    if (pct >= 60) return "shows up often under pressure";
    if (pct >= 35) return "is starting to stick as a habit";
    return "appears sometimes — worth a short repair";
  }

  function interpretationFromParts(parts) {
    parts = parts || {};
    return {
      verdict: parts.verdict || "",
      saw: parts.saw || "",
      means: parts.means || "",
      nextStep: parts.nextStep || "",
      nextHref: parts.nextHref || "",
      nextLabel: parts.nextLabel || "Next step",
      appendix: Array.isArray(parts.appendix) ? parts.appendix : []
    };
  }

  function compressMasterySignal(signal) {
    signal = signal || {};
    var rate = signal.total ? signal.wrong / signal.total : 0;
    var label = signal.label || signal.tag || "pattern";
    var repair = signal.remediations && signal.remediations[0] ? signal.remediations[0] : null;
    return interpretationFromParts({
      verdict: "Plateau pattern: " + label,
      saw: "In recent tries, " + missTryText(signal.wrong, signal.total) + "." +
        (signal.evidence ? " " + signal.evidence : ""),
      means: errorRatePhrase(rate) + " Fixing this changes how Danes read your intent, not just your vocabulary.",
      nextStep: repair ? repair.action : "Open the lesson scene that targets this pattern.",
      nextHref: repair ? repair.href : "",
      nextLabel: repair ? repair.cta || "Open repair" : "Open repair",
      appendix: [
        ["Signal id", signal.tag || ""],
        ["Error rate", Math.round(rate * 100) + "%"],
        ["Attempts", signal.total || 0],
        ["Trainers", (signal.trainers || []).map(function (t) { return t.name; }).join(", ")]
      ]
    });
  }

  function compressCompetency(item) {
    item = item || {};
    var primary = item.primarySignal || {};
    var repair = primary.remediation || null;
    return interpretationFromParts({
      verdict: "Root skill under stress: " + (item.label || item.id || "competency"),
      saw: (item.copy || "Several lesson signals point to the same underlying skill.") +
        " " + missTryText(item.wrong, item.total) + ".",
      means: "When this root skill wobbles, many surface mistakes look unrelated. One repair here lifts several moments.",
      nextStep: repair ? repair.action : (primary.label ? "Repair " + primary.label + " first." : "Pick the strongest linked signal."),
      nextHref: repair ? repair.href : "",
      nextLabel: repair ? "Open scene" : "Open dashboard",
      appendix: [
        ["Competency id", item.id || ""],
        ["Linked signals", item.signalCount || 0],
        ["Error rate", Math.round((item.errorRate || 0) * 100) + "%"],
        ["Tags", (item.signals || []).map(function (s) { return s.tag; }).join(", ")]
      ]
    });
  }

  function compressDueDecision(payload) {
    payload = payload || {};
    var decision = payload.decision || {};
    var trainer = payload.trainer || {};
    var repair = decision.repair || null;
    var competency = decision.competency || null;
    return interpretationFromParts({
      verdict: decision.title || trainer.name || "Practice now",
      saw: decision.copy || trainer.description || "Local progress points here next.",
      means: repair
        ? "A repair scene is ready — short, cited, and tied to evidence."
        : competency
          ? "Root skill " + competency.label + " needs a few more honest reps."
          : "Staying on this trainer keeps momentum without starting from zero.",
      nextStep: repair ? repair.action : (decision.meta || "Open the trainer and do one focused set."),
      nextHref: decision.primaryHref || trainer.path || "",
      nextLabel: decision.primaryLabel || "Open trainer",
      appendix: [
        ["Decision kind", decision.kind || ""],
        ["Badge", decision.badge || ""],
        ["Accuracy", payload.stats && payload.stats.accuracy !== null ? payload.stats.accuracy + "%" : "—"]
      ]
    });
  }

  function compressTrainerStats(payload) {
    payload = payload || {};
    var trainer = payload.trainer || {};
    var stats = payload.stats || {};
    if (!stats.total) {
      return interpretationFromParts({
        verdict: trainer.name ? trainer.name + " — not started" : "Not started",
        saw: "No attempts recorded in this browser yet.",
        means: "A single 10-item session is enough to unlock personalized routing.",
        nextStep: "Start one short session to build an evidence trail.",
        nextHref: trainer.path || "",
        nextLabel: "Start",
        appendix: [["Trainer id", trainer.id || ""]]
      });
    }
    return interpretationFromParts({
      verdict: trainer.name + " — " + accuracyPhrase(stats.accuracy),
      saw: stats.total + " attempt" + (stats.total === 1 ? "" : "s") +
        (stats.mastered !== undefined ? ", " + stats.mastered + " items climbing toward mastered" : "") + ".",
      means: stats.accuracy !== null && stats.accuracy < 70
        ? "Accuracy is still volatile — short daily reps beat long cram sessions."
        : "You have a usable base here. The dashboard will promote repairs when lesson evidence says so.",
      nextStep: "Continue where you left off.",
      nextHref: trainer.path || "",
      nextLabel: "Continue",
      appendix: [
        ["Attempts", stats.total],
        ["Accuracy", stats.accuracy !== null ? stats.accuracy + "%" : "—"],
        ["Streak", stats.currentStreak || 0]
      ]
    });
  }

  function compressTodayProgram(payload) {
    payload = payload || {};
    var program = payload.program || {};
    var step = payload.step || null;
    var companion = payload.companion || null;
    return interpretationFromParts({
      verdict: program.headline || "Your next step",
      saw: program.message || "The planner picked one step from your saved route.",
      means: program.why || "This choice is deterministic — same evidence, same recommendation.",
      nextStep: step ? (program.actionLabel || "Start step") + " (" + (program.routeMeta || "") + ")" : program.actionLabel || "Review route",
      nextHref: payload.actionHref || "",
      nextLabel: program.actionLabel || "Start",
      appendix: [
        ["Program state", program.kind || ""],
        ["Eyebrow", program.eyebrow || ""],
        ["Route progress", (payload.progress || 0) + "%"],
        ["Companion", companion && companion.fingerprint ? companion.fingerprint : "none"],
        ["Tags", (payload.guardrailLabels || []).join(", ")]
      ]
    });
  }

  function compressDashboardSnapshot(payload) {
    payload = payload || {};
    var today = payload.today || null;
    var topSignal = payload.topSignal || null;
    var totalAttempts = Number(payload.totalAttempts || 0);
    if (!totalAttempts && !today) {
      return interpretationFromParts({
        verdict: "First session — no plateau data yet",
        saw: "This browser has no practice history.",
        means: "Start Lesson 01 once. After that, Today and repair cards explain themselves in plain language.",
        nextStep: "Do one short lesson to seed local evidence.",
        nextHref: "./lessons/lesson-01/",
        nextLabel: "Start Lesson 01",
        appendix: [["Attempts", 0]]
      });
    }
    if (topSignal) {
      return interpretationFromParts({
        verdict: today && today.verdict ? today.verdict : ("Focus: " + (topSignal.label || topSignal.tag || "repair")),
        saw: topSignal.label + ": " + missTryText(topSignal.wrong, topSignal.total) + ".",
        means: "This is the highest-impact repair on your dashboard right now.",
        nextStep: topSignal.remediations && topSignal.remediations[0]
          ? topSignal.remediations[0].action
          : (today && today.nextStep) || "Open Today and take the promoted step.",
        nextHref: topSignal.remediations && topSignal.remediations[0]
          ? topSignal.remediations[0].href
          : (today && today.nextHref) || "./dashboard.html#today",
        nextLabel: topSignal.remediations && topSignal.remediations[0]
          ? topSignal.remediations[0].cta || "Repair"
          : "Open Today",
        appendix: [
          ["Total attempts", totalAttempts],
          ["Top signal", topSignal.tag || ""]
        ]
      });
    }
    return today || interpretationFromParts({
      verdict: "Practice is underway",
      saw: totalAttempts + " attempts recorded locally.",
      means: "Open Today for the next useful step.",
      nextStep: "Continue your route.",
      nextHref: "./dashboard.html#today",
      nextLabel: "Open Today",
      appendix: [["Attempts", totalAttempts]]
    });
  }

  function compressHomeRecommendation(recommendation) {
    recommendation = recommendation || {};
    var kind = recommendation.kind || recommendation.mode || "";
    return interpretationFromParts({
      verdict: recommendation.title || "Start here",
      saw: recommendation.copy || recommendation.meta || "",
      means: kind === "repair"
        ? "Lesson evidence says this pattern still costs you in real Danish moments."
        : kind === "active-plan"
          ? "You already have a saved route — finishing the open step beats starting fresh."
          : "One short session here builds the evidence trail for smarter recommendations.",
      nextStep: recommendation.meta || recommendation.copy || "",
      nextHref: recommendation.href || (recommendation.trainer && recommendation.trainer.path) || "",
      nextLabel: recommendation.cta || "Start",
      appendix: [
        ["Kind", kind],
        ["Trainer", recommendation.trainer && recommendation.trainer.id || ""]
      ]
    });
  }

  function renderCard(interp, options) {
    options = options || {};
    interp = interp || interpretationFromParts({});
    var cls = "headroom-card" + (options.extraClass ? " " + options.extraClass : "");
    var nextHtml = interp.nextHref
      ? '<a class="headroom-next-link" href="' + escapeHtml(interp.nextHref) + '">' + escapeHtml(interp.nextLabel || "Next step") + " →</a>"
      : (interp.nextStep ? '<p class="headroom-next"><span class="headroom-label">What to do</span> ' + escapeHtml(interp.nextStep) + "</p>" : "");
    var appendixRows = "";
    if (interp.appendix && interp.appendix.length) {
      appendixRows = interp.appendix.map(function (row) {
        return "<div><dt>" + escapeHtml(row[0]) + "</dt><dd>" + escapeHtml(String(row[1])) + "</dd></div>";
      }).join("");
    }
    var technicalBlock = options.technicalHtml
      ? '<div class="headroom-technical">' + options.technicalHtml + "</div>"
      : (appendixRows ? "<dl>" + appendixRows + "</dl>" : "");
    var appendixHtml = technicalBlock
      ? '<details class="headroom-appendix"><summary>Technical details</summary>' + technicalBlock + "</details>"
      : "";
    return '<article class="' + cls + '">' +
      '<p class="headroom-verdict">' + escapeHtml(interp.verdict) + "</p>" +
      (interp.saw ? '<p class="headroom-saw"><span class="headroom-label">What we saw</span> ' + escapeHtml(interp.saw) + "</p>" : "") +
      (interp.means ? '<p class="headroom-means"><span class="headroom-label">What it means</span> ' + escapeHtml(interp.means) + "</p>" : "") +
      nextHtml +
      appendixHtml +
      "</article>";
  }

  function renderBar(interp) {
    interp = interp || interpretationFromParts({});
    return '<div class="headroom-bar">' +
      '<p class="headroom-bar-verdict">' + escapeHtml(interp.verdict) + "</p>" +
      (interp.means ? '<p class="headroom-bar-means">' + escapeHtml(interp.means) + "</p>" : "") +
      (interp.nextHref
        ? '<a class="headroom-bar-link" href="' + escapeHtml(interp.nextHref) + '">' + escapeHtml(interp.nextLabel || "Next") + " →</a>"
        : "") +
      "</div>";
  }

  window.PlataHeadroom = {
    escapeHtml: escapeHtml,
    missTryText: missTryText,
    accuracyPhrase: accuracyPhrase,
    interpretationFromParts: interpretationFromParts,
    compressMasterySignal: compressMasterySignal,
    compressCompetency: compressCompetency,
    compressDueDecision: compressDueDecision,
    compressTrainerStats: compressTrainerStats,
    compressTodayProgram: compressTodayProgram,
    compressDashboardSnapshot: compressDashboardSnapshot,
    compressHomeRecommendation: compressHomeRecommendation,
    renderCard: renderCard,
    renderBar: renderBar
  };
})();

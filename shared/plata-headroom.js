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
      ].concat((signal.remediations || []).slice(1).map(function (item) {
        return [item.kind === "drill" ? "Drill repair" : "Alternate repair", item.cta || item.href || ""];
      }))
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
        verdict: trainer.name ? trainer.name + " — ready to begin" : "Not started",
        saw: "Haven't tried this one yet.",
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
    var isOnboarding = program.kind === "onboarding";
    return interpretationFromParts({
      verdict: program.headline || (isOnboarding ? "Start B2 job follow-up" : "Your next step"),
      saw: program.message || (isOnboarding
        ? "No local progress yet — the planner starts with the B2 follow-up lesson."
        : "The planner picked one step from your saved route."),
      means: isOnboarding
        ? (program.why || "Start with the B2 job follow-up if you know the words but freeze when the stakes feel real.") + " Lesson 01 remains an optional first-visit tutorial."
        : (program.why || "This choice is deterministic — same evidence, same recommendation."),
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
        means: "Start the B2 job-follow-up lesson for the primary entry. Lesson 01 is an optional first-visit tutorial if you want to see how Platå works.",
        nextStep: "Do one short B2 follow-up lesson to seed local evidence.",
        nextHref: "./lessons/lesson-b2-job-followup/",
        nextLabel: "Start job follow-up",
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
    var trainerId = recommendation.trainer && recommendation.trainer.id || "";
    var isTutorialStart = kind === "start" && trainerId === "lesson-01-arrival";
    var isPreferredStart = kind === "start" && trainerId === "lesson-b2-job-followup";
    return interpretationFromParts({
      verdict: recommendation.title || "Start here",
      saw: recommendation.copy || recommendation.meta || "",
      means: kind === "repair"
        ? "Lesson evidence says this pattern still costs you in real Danish moments."
        : kind === "active-plan"
          ? "You already have a saved route — finishing the open step beats starting fresh."
          : isPreferredStart
            ? "Start with the B2 job follow-up if you know the words but freeze when the stakes feel real. Lesson 01 is an optional first-visit tutorial."
            : isTutorialStart
              ? "Lesson 01 is the optional first-visit tutorial — use it to see how choices, feedback, and local progress work."
              : "One short session here builds the evidence trail for smarter recommendations.",
      nextStep: recommendation.meta || recommendation.copy || "",
      nextHref: recommendation.href || (recommendation.trainer && recommendation.trainer.path) || "",
      nextLabel: recommendation.cta || "Start",
      appendix: [
        ["Kind", kind],
        ["Trainer", trainerId]
      ]
    });
  }

  function healthGatePass(health, gateId) {
    var gates = (health && health.gates) || [];
    for (var i = 0; i < gates.length; i++) {
      if (gates[i].id === gateId && gates[i].status === "pass") return true;
    }
    return false;
  }

  function proofOfflineDistributionAllowed(health, journey) {
    if (healthGatePass(health, "check:distribution")) return true;
    var guarantees = (journey && journey.guarantees) || [];
    for (var i = 0; i < guarantees.length; i++) {
      if (guarantees[i].key === "distribution-proof-targeted" && guarantees[i].pass) return true;
    }
    return false;
  }

  function proofDoctorSkriveTransferAllowed(exerciseValue) {
    exerciseValue = exerciseValue || {};
    if (exerciseValue.status !== "pass") return false;
    var chains = exerciseValue.transferChains || [];
    for (var i = 0; i < chains.length; i++) {
      if (chains[i].id === "doctor-apotek-skrive-sundhed" && chains[i].status === "pass") return true;
    }
    return false;
  }

  function compressProofSnapshot(payload) {
    payload = payload || {};
    var digest = payload.digest || {};
    var demo = payload.demo || {};
    var journey = payload.journey || {};
    var health = payload.health || {};
    var capabilities = payload.capabilities || {};
    var guided = payload.guided || {};
    var exerciseValue = payload.exerciseValue || {};
    var guidedCount = Number(guided.totals && guided.totals.scenarios || 0);
    var journeyStages = Number(journey.totals && journey.totals.stages || 0);
    var offlineProof = proofOfflineDistributionAllowed(health, journey);
    var doctorSkrive = proofDoctorSkriveTransferAllowed(exerciseValue);
    var issueCount = Number(health.totals && health.totals.issues || 0)
      + Number(capabilities.totals && capabilities.totals.issues || 0);
    if (!payload.passing) {
      return interpretationFromParts({
        verdict: "Some product promises still need evidence",
        saw: issueCount
          ? issueCount + " issue(s) remain open in the published checks."
          : "One or more published checks did not pass.",
        means: "You can still follow the example below, but Platå is not claiming that every promise is ready yet.",
        nextStep: "Follow the example, then open the failed check if you want the technical detail.",
        nextHref: "#proof-walkthrough",
        nextLabel: "Follow the example",
        appendix: [
          ["Digest", digest.status || "unknown"],
          ["Demo learner", demo.status || "unknown"],
          ["Journey", journey.status || "unknown"],
          ["Guided scenarios", guidedCount || "—"],
          ["Offline ZIP", offlineProof ? "gate pass" : "—"]
        ]
      });
    }
    return interpretationFromParts({
      verdict: digest.headline || "Public proof is passing",
      saw: "The public walkthrough follows one fictional learner from a suggestion to completed practice, then checks lesson quality and offline use.",
      means: "You can see how Platå chose the next step and what changed afterwards without creating an account or sending learner answers anywhere.",
      nextStep: "Follow the short walkthrough. Open the technical reports only if you want to inspect the machinery.",
      nextHref: "#proof-walkthrough",
      nextLabel: "Follow the 60-second walkthrough",
      appendix: [
        ["Health gates", health.totals && health.totals.gates || 0],
        ["Capabilities", capabilities.totals && capabilities.totals.capabilities || 0],
        ["Reviewer steps", journeyStages || 0],
        ["Guided scenarios", guidedCount || 0],
        ["Offline ZIP", offlineProof ? "passing gate" : "—"],
        ["Doctor→skrive", doctorSkrive ? "exercise value pass" : "—"]
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
      ? '<details class="headroom-appendix"><summary>Details</summary>' + technicalBlock + "</details>"
      : "";
    return '<article class="' + cls + '">' +
      '<p class="headroom-verdict">' + escapeHtml(interp.verdict) + "</p>" +
      (interp.saw ? '<p class="headroom-saw"> <span class="headroom-label">Signal</span>  ' + escapeHtml(interp.saw) + "</p>" : "") +
      (interp.means ? '<p class="headroom-means"> <span class="headroom-label">Impact</span>  ' + escapeHtml(interp.means) + "</p>" : "") +
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
    compressProofSnapshot: compressProofSnapshot,
    renderCard: renderCard,
    renderBar: renderBar
  };
})();

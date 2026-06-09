/* Platå home launcher */
(function () {
  "use strict";

  var masteryCatalogCache = null;

  function $(selector) { return document.querySelector(selector); }
  function $$(selector) { return Array.from(document.querySelectorAll(selector)); }
  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[ch];
    });
  }

  function trainers() {
    return window.PlataCatalog && Array.isArray(window.PlataCatalog.trainers) ? window.PlataCatalog.trainers : [];
  }

  function competencyGraph() {
    return window.PlataCompetencies || null;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = function () { reject(new Error("Failed to load " + src)); };
      document.head.appendChild(script);
    });
  }

  function loadLessonData() {
    var pending = trainers()
      .filter(function (trainer) { return trainer.lessonGlobal && trainer.lessonDataPath && !window[trainer.lessonGlobal]; })
      .map(function (trainer) { return loadScript(trainer.lessonDataPath); });
    return pending.length ? Promise.all(pending) : null;
  }

  function trainerById(id) {
    return trainers().find(function (trainer) { return trainer.id === id; }) || null;
  }

  function trainerState(trainerId) {
    if (!window.PlataKernel || !window.PlataKernel.createTrainerState) return null;
    try {
      return window.PlataKernel.createTrainerState({ trainerId: trainerId, save: false }).state;
    } catch (_) {
      return null;
    }
  }

  function sceneHref(path, sceneId, signalTag) {
    var planner = window.PlataPlanner;
    if (planner && planner.sceneHref) return planner.sceneHref(path, sceneId, signalTag);
    if (!sceneId) return path;
    var separator = path.indexOf("?") === -1 ? "?" : "&";
    return path + separator + "mode=repair&signal=" + encodeURIComponent(signalTag) + "#" + encodeURIComponent(sceneId);
  }

  function buildMasteryCatalog() {
    if (masteryCatalogCache) return masteryCatalogCache;
    var catalog = {};
    trainers().forEach(function (trainer) {
      var lesson = trainer.lessonGlobal ? window[trainer.lessonGlobal] : null;
      if (!lesson || !lesson.masteryMap) return;
      Object.keys(lesson.masteryMap).forEach(function (tag) {
        var spec = lesson.masteryMap[tag];
        if (!catalog[tag]) {
          catalog[tag] = {
            tag: tag,
            label: spec.label || tag,
            evidence: spec.evidence || "",
            competencyId: spec.competencyId || "",
            refs: []
          };
        }
        catalog[tag].refs.push({
          trainerId: trainer.id,
          trainerName: trainer.name,
          trainerIcon: trainer.icon,
          trainerPath: trainer.path,
          remediation: spec.remediation || null
        });
      });
    });
    masteryCatalogCache = catalog;
    return catalog;
  }

  function masterySpec(tag) {
    return buildMasteryCatalog()[tag] || null;
  }

  function remediationFor(spec, trainer) {
    if (!spec || !spec.refs || spec.refs.length === 0) return null;
    var ref = spec.refs.find(function (item) { return trainer && item.trainerId === trainer.id; }) || spec.refs[0];
    if (!ref.remediation) return null;
    return {
      cta: ref.remediation.cta || "Review scene",
      action: ref.remediation.action || "",
      sceneId: ref.remediation.sceneId || "",
      href: sceneHref(ref.trainerPath, ref.remediation.sceneId, spec.tag),
      trainerName: ref.trainerName,
      trainerIcon: ref.trainerIcon
    };
  }

  function isMasteryTag(tag) {
    return !!masterySpec(tag);
  }

  function enrichMasteryTag(weakTag, trainer) {
    var spec = masterySpec(weakTag.tag) || {};
    var signal = Object.assign({}, weakTag, {
      label: spec.label || weakTag.tag,
      evidence: spec.evidence || "",
      competencyId: spec.competencyId || "",
      remediation: remediationFor(spec, trainer)
    });
    var graph = competencyGraph();
    return graph && graph.enrichSignal ? graph.enrichSignal(signal) : signal;
  }

  function trainerStats(trainer, index) {
    var state = trainerState(trainer.id);
    var meta = state && state.meta || {};
    var attempts = meta.totalAttempts || 0;
    var correct = meta.totalCorrect || 0;
    var kernel = window.PlataKernel;
    var weakTags = state && kernel && kernel.getWeakTags ? kernel.getWeakTags(state, 10) : [];
    var weakMastery = weakTags.filter(function (w) { return isMasteryTag(w.tag); }).map(function (w) { return enrichMasteryTag(w, trainer); });
    var graph = competencyGraph();
    var weakCompetencies = graph && graph.rank ? graph.rank(weakMastery) : [];
    var stats = {
      trainer: trainer,
      state: state,
      attempts: attempts,
      accuracy: attempts ? Math.round((correct / attempts) * 100) : null,
      today: state && kernel && kernel.getStats ? kernel.getStats(state).todayCount : 0,
      lastSessionDate: meta.lastSessionDate || "",
      hasProgress: attempts > 0,
      weakTags: weakTags,
      weakMastery: weakMastery,
      weakCompetencies: weakCompetencies,
      index: index || 0
    };
    var planner = window.PlataPlanner;
    if (planner && planner.dashboardDecision) {
      stats.decision = planner.dashboardDecision({
        trainer: trainer,
        state: state,
        stats: {
          total: stats.attempts,
          correct: correct,
          accuracy: stats.accuracy,
          today: stats.today,
          lastSessionDate: stats.lastSessionDate
        },
        weakMastery: weakMastery,
        weakCompetencies: weakCompetencies,
        weakTags: weakTags,
        index: index || 0
      });
    }
    return stats;
  }

  function formatDate(iso) {
    if (!iso) return "not started";
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function formatAttempts(count) {
    return count + " " + (count === 1 ? "attempt" : "attempts");
  }

  function plannerItems(stats) {
    return stats.map(function (item) {
      return {
        trainer: item.trainer,
        stats: {
          total: item.attempts,
          correct: item.state && item.state.meta ? item.state.meta.totalCorrect || 0 : 0,
          accuracy: item.accuracy,
          today: item.today,
          lastSessionDate: item.lastSessionDate
        },
        decision: item.decision,
        index: item.index
      };
    });
  }

  function activePlanRecommendation(stats) {
    var planner = window.PlataPlanner;
    if (!planner || !planner.readPracticePlan) return null;
    var active = planner.readPracticePlan();
    if (!active || !active.steps || !active.steps.length) return null;
    var plan = planner.planStatus ? planner.planStatus(active, plannerItems(stats)) : active;
    if (!plan || plan.completed) return null;
    var step = planner.actionablePracticePlanStep ? planner.actionablePracticePlanStep(plan) : plan.primaryStep;
    if (!step) return null;
    var trainer = trainerById(step.trainerId) || {
      id: step.trainerId,
      name: step.trainerName || "Practice",
      path: step.primaryHref,
      type: step.kind || "trainer"
    };
    return {
      mode: "active-plan",
      trainer: trainer,
      href: planner.planStepHref ? planner.planStepHref(plan, step) : step.primaryHref,
      title: "Continue active plan",
      copy: step.copy || plan.copy || "Continue the next unfinished step in your tracked practice plan.",
      cta: step.status === "active" ? "Continue current step" : "Start next step",
      meta: "Active plan: step " + step.number + " of " + plan.steps.length + " · " + (step.trainerName || trainer.name) + " · " + step.minutes
    };
  }

  function chooseRecommendation(stats) {
    var activePlan = activePlanRecommendation(stats);
    if (activePlan) return activePlan;

    var planner = window.PlataPlanner;
    if (planner && planner.rankDashboardDecisions) {
      var activeStats = stats.filter(function (item) { return item.hasProgress; });
      var pool = activeStats.length ? activeStats : stats;
      var ranked = planner.rankDashboardDecisions(pool.map(function (item) {
        return {
          trainer: item.trainer,
          stats: item,
          decision: item.decision,
          index: item.index
        };
      }), 1);
      if (ranked.length) return recommendationFromDecision(ranked[0]);
    }

    var active = stats.filter(function (item) { return item.hasProgress; });
    if (!active.length) {
      var starter = trainerById("lesson-01-arrival") || trainers()[0];
      return {
        mode: "start",
        trainer: starter,
        title: "New here?",
        copy: "Take one short story lesson first. It shows how choices, feedback, and local progress work.",
        cta: "Start Lesson 01",
        meta: "No account. Progress stays in this browser."
      };
    }
    active.sort(function (a, b) {
      var aDate = a.lastSessionDate ? new Date(a.lastSessionDate).getTime() : 0;
      var bDate = b.lastSessionDate ? new Date(b.lastSessionDate).getTime() : 0;
      return bDate - aDate || b.attempts - a.attempts;
    });
    var pick = active[0];
    return {
      mode: "continue",
      trainer: pick.trainer,
      title: "Continue where you left off",
      copy: "Your last practice was " + pick.trainer.name + ". Keep the habit small: one session is enough.",
      cta: "Continue " + (pick.trainer.type === "lesson" ? "lesson" : "drill"),
      meta: formatAttempts(pick.attempts) + (pick.accuracy !== null ? " · " + pick.accuracy + "% accuracy" : "") + " · last " + formatDate(pick.lastSessionDate)
    };
  }

  function recommendationFromDecision(item) {
    var decision = item.decision || {};
    var trainer = item.trainer || item.stats && item.stats.trainer;
    if (!decision || !trainer) return null;

    if (decision.kind === "start" && trainer.id === "lesson-01-arrival") {
      return {
        mode: "start",
        trainer: trainer,
        href: decision.primaryHref,
        title: "New here?",
        copy: "Take one short story lesson first. It shows how choices, feedback, and local progress work.",
        cta: "Start Lesson 01",
        meta: "Planner pick: best first session. No account; progress stays in this browser."
      };
    }

    return {
      mode: decision.kind || "continue",
      trainer: trainer,
      href: decision.primaryHref || trainer.path,
      title: decision.title || "Next best step",
      copy: decision.copy || trainer.description,
      cta: decision.primaryLabel || (trainer.type === "lesson" ? "Open lesson" : "Open drill"),
      meta: (decision.reasons && decision.reasons.length ? decision.reasons.join(" · ") : decision.meta) || "Chosen from your local progress."
    };
  }

  function renderStartCard(recommendation) {
    if (!recommendation || !recommendation.trainer) return;
    var primary = $("#home-primary-action");
    var title = $("#home-start-title");
    var copy = $("#home-start-copy");
    var link = $("#home-start-link");
    var meta = $("#home-start-meta");
    if (title) title.textContent = recommendation.title;
    if (copy) copy.textContent = recommendation.copy;
    if (link) {
      link.href = recommendation.href || recommendation.trainer.path;
      link.textContent = recommendation.cta;
    }
    if (primary) {
      primary.href = recommendation.href || recommendation.trainer.path;
      primary.textContent = recommendation.cta;
    }
    if (meta) meta.textContent = recommendation.meta;
  }

  function renderTrainerProgress(stats) {
    stats.forEach(function (item) {
      var card = document.querySelector("[data-trainer-id=\"" + item.trainer.id + "\"]");
      if (!card) return;
      var link = card.querySelector(".card-link");
      var progress = document.createElement("p");
      progress.className = "friendly-progress";
      if (item.hasProgress) {
        progress.innerHTML = "<strong>Continue:</strong> " + formatAttempts(item.attempts) +
          (item.accuracy !== null ? " · " + item.accuracy + "% accuracy" : "") +
          " · last " + escapeHtml(formatDate(item.lastSessionDate));
        if (link) link.textContent = "Continue →";
      } else {
        progress.innerHTML = "<strong>Not started:</strong> good for a short focused session.";
        if (link) link.textContent = "Start →";
      }
      var old = card.querySelector(".friendly-progress");
      if (old) old.remove();
      card.insertBefore(progress, link || null);
    });
  }

  function scrollToHashTarget() {
    var hash = window.location && window.location.hash;
    if (!hash) return;
    try {
      var target = $(hash);
      if (target && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ block: "start", behavior: "auto" });
      }
      if (target && typeof window.scrollTo === "function" && typeof target.getBoundingClientRect === "function") {
        var top = target.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0);
        window.scrollTo({ top: top, left: 0, behavior: "auto" });
      }
    } catch (_) {
      // Invalid external hashes should not break the home launcher.
    }
  }

  function restoreHashScroll() {
    scrollToHashTarget();
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(scrollToHashTarget);
    }
    if (typeof window.setTimeout === "function") {
      window.setTimeout(scrollToHashTarget, 0);
      window.setTimeout(scrollToHashTarget, 120);
    }
  }

  function init() {
    masteryCatalogCache = null;
    var stats = trainers().map(function (trainer, index) { return trainerStats(trainer, index); });
    renderStartCard(chooseRecommendation(stats));
    renderTrainerProgress(stats);
    restoreHashScroll();
  }

  function boot() {
    var ready = loadLessonData();
    if (ready) {
      ready.then(init).catch(function (err) {
        console.warn("Home lesson data load failed", err);
        init();
      });
      return;
    }
    init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  if (typeof window.addEventListener === "function") {
    window.addEventListener("hashchange", restoreHashScroll);
  }

  window.PlataHome = {
    chooseRecommendation: chooseRecommendation,
    trainerStats: trainerStats
  };
})();

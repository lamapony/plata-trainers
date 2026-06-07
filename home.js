/* Platå home launcher */
(function () {
  "use strict";

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

  function trainerStats(trainer) {
    var state = trainerState(trainer.id);
    var meta = state && state.meta || {};
    var attempts = meta.totalAttempts || 0;
    var correct = meta.totalCorrect || 0;
    return {
      trainer: trainer,
      attempts: attempts,
      accuracy: attempts ? Math.round((correct / attempts) * 100) : null,
      lastSessionDate: meta.lastSessionDate || "",
      hasProgress: attempts > 0
    };
  }

  function formatDate(iso) {
    if (!iso) return "not started";
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function formatAttempts(count) {
    return count + " " + (count === 1 ? "attempt" : "attempts");
  }

  function chooseRecommendation(stats) {
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
      link.href = recommendation.trainer.path;
      link.textContent = recommendation.cta;
    }
    if (primary) {
      primary.href = recommendation.trainer.path;
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

  function init() {
    var stats = trainers().map(trainerStats);
    renderStartCard(chooseRecommendation(stats));
    renderTrainerProgress(stats);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.PlataHome = {
    chooseRecommendation: chooseRecommendation,
    trainerStats: trainerStats
  };
})();

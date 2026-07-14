/* Plata next-step renderer v1
 *
 * Renders the shared planner decision after a completed lesson or drill.
 */
(function (root) {
  "use strict";

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[ch];
    });
  }

  function lesson(options) {
    var planner = root.PlataPlanner;
    return planner && planner.lessonDecision ? planner.lessonDecision(options || {}) : null;
  }

  function drill(options) {
    var planner = root.PlataPlanner;
    return planner && planner.drillDecision ? planner.drillDecision(options || {}) : null;
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
      spec.secondaryHref ? "<a class='ghost btn btn-ghost link-button gym-link' href='" + escapeHtml(spec.secondaryHref) + "'>" + escapeHtml(spec.secondaryLabel) + "</a>" : "",
      "</div>",
      "</section>"
    ].join("");
  }

  function appendDashboardParams(href, params) {
    var raw = String(href || "dashboard.html");
    var hashIndex = raw.indexOf("#");
    var base = hashIndex === -1 ? raw : raw.slice(0, hashIndex);
    var hash = hashIndex === -1 ? "#due" : raw.slice(hashIndex);
    var pairs = [];
    Object.keys(params || {}).forEach(function (key) {
      if (params[key] === undefined || params[key] === null || params[key] === "") return;
      pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(params[key])));
    });
    if (!pairs.length) return base + hash;
    return base + (base.indexOf("?") === -1 ? "?" : "&") + pairs.join("&") + hash;
  }

  function planContext(options) {
    var planner = root.PlataPlanner;
    if (!planner) return null;
    if (planner.markPracticePlanStepStarted) return planner.markPracticePlanStepStarted(options || {});
    return planner.currentPracticePlanStep ? planner.currentPracticePlanStep(options || {}) : null;
  }

  function renderPlanContext(options) {
    var context = planContext(options);
    if (!context || !context.step) return "";
    var step = context.step;
    var dashboardHref = context.dashboardHref || "dashboard.html";
    var completed = !!step.completedAt;
    var eyebrow = completed ? "Plan step completed" : "Active plan";
    var copy = completed
      ? "This step is recorded. Return to the dashboard for the next unfinished plan action."
      : step.copy || "Complete this step, then return to your dashboard for the next recommendation.";
    var href = completed
      ? appendDashboardParams(dashboardHref, {
        "ledger-return": new Date().getTime(),
        plan: context.plan && context.plan.planToken || "",
        step: step.routeId || ""
      })
      : appendDashboardParams(dashboardHref, {});
    var linkLabel = completed ? "See next plan action" : "Back to plan";
    return [
      "<aside class='plan-context-card " + (completed ? "completed" : "active") + "' aria-label='" + (completed ? "Completed practice plan step" : "Active practice plan step") + "'>",
      "<p class='eyebrow'>" + eyebrow + " · Step " + context.stepNumber + " of " + context.totalSteps + "</p>",
      "<h3>" + escapeHtml(step.title || "Practice step") + "</h3>",
      "<p>" + escapeHtml(copy) + "</p>",
      "<div class='plan-context-meta'>",
      step.minutes ? "<span>" + escapeHtml(step.minutes) + "</span>" : "",
      step.competency && step.competency.label ? "<span>" + escapeHtml(step.competency.label) + "</span>" : "",
      "</div>",
      "<a class='plan-context-link' href='" + escapeHtml(href) + "'>" + escapeHtml(linkLabel) + "</a>",
      "</aside>"
    ].join("");
  }

  root.PlataNextStep = {
    lesson: lesson,
    drill: drill,
    render: render,
    planContext: planContext,
    renderPlanContext: renderPlanContext
  };
})(typeof window !== "undefined" ? window : globalThis);

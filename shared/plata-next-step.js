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
      spec.secondaryHref ? "<a class='ghost btn btn-ghost link-button' href='" + escapeHtml(spec.secondaryHref) + "'>" + escapeHtml(spec.secondaryLabel) + "</a>" : "",
      "</div>",
      "</section>"
    ].join("");
  }

  function planContext(options) {
    var planner = root.PlataPlanner;
    return planner && planner.currentPracticePlanStep ? planner.currentPracticePlanStep(options || {}) : null;
  }

  function renderPlanContext(options) {
    var context = planContext(options);
    if (!context || !context.step) return "";
    var step = context.step;
    var dashboardHref = context.dashboardHref || "dashboard.html";
    return [
      "<aside class='plan-context-card' aria-label='Active practice plan step'>",
      "<p class='eyebrow'>Active plan · Step " + context.stepNumber + " of " + context.totalSteps + "</p>",
      "<h3>" + escapeHtml(step.title || "Practice step") + "</h3>",
      "<p>" + escapeHtml(step.copy || "Complete this step, then return to your dashboard for the next recommendation.") + "</p>",
      "<div class='plan-context-meta'>",
      step.minutes ? "<span>" + escapeHtml(step.minutes) + "</span>" : "",
      step.competency && step.competency.label ? "<span>" + escapeHtml(step.competency.label) + "</span>" : "",
      "</div>",
      "<a class='plan-context-link' href='" + escapeHtml(dashboardHref) + "#due'>Back to plan</a>",
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

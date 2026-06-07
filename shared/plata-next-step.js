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

  root.PlataNextStep = {
    lesson: lesson,
    drill: drill,
    render: render
  };
})(typeof window !== "undefined" ? window : globalThis);

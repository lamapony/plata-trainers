/* Platå public quality report */
(function () {
  "use strict";

  function $(selector) {
    return document.querySelector(selector);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[char];
    });
  }

  function metric(label, value, detail) {
    return "<article class=\"quality-metric\">" +
      "<span>" + escapeHtml(label) + "</span>" +
      "<strong>" + escapeHtml(value) + "</strong>" +
      "<p>" + escapeHtml(detail) + "</p>" +
    "</article>";
  }

  function renderSummary(report) {
    var jsonLink = $("#quality-json-link");
    if (jsonLink) {
      jsonLink.href = "./reports/quality.json";
      jsonLink.removeAttribute("aria-disabled");
    }
    $("#quality-status").textContent = report.status === "pass" ? "Passing" : "Needs attention";
    $("#quality-status").className = report.status === "pass" ? "quality-pass" : "quality-fail";
    $("#quality-summary").innerHTML = [
      ["Gold lessons", report.totals.goldLessons],
      ["Simulation paths", report.totals.simulationPaths],
      ["Mastery signals", report.totals.masterySignals],
      ["Issues", report.totals.issues]
    ].map(function (item) {
      return "<li><span>" + escapeHtml(item[0]) + "</span><strong>" + escapeHtml(item[1]) + "</strong></li>";
    }).join("");
    $("#quality-generated").textContent = "Generated " + new Date(report.generatedAt).toLocaleString();
  }

  function renderMetrics(report) {
    $("#quality-metrics").innerHTML = [
      metric("Lessons", report.totals.lessons, "All narrative lesson data files discovered at build time."),
      metric("Gold Lessons", report.totals.goldLessons, "Lessons with the strict source -> goal -> diagnostic -> mastery -> repair contract."),
      metric("Scenes", report.totals.scenes, "Interactive scenes across all narrative lessons."),
      metric("Mastery Signals", report.totals.masterySignals, "Durable learner-facing concepts that can appear in dashboard repair recommendations."),
      metric("Simulation Paths", report.totals.simulationPaths, "Deterministic paths that cover outcomes and social variables."),
      metric("Simulated Attempts", report.totals.simulatedAttempts, "Attempt events replayed by gold lesson simulations."),
      metric("Endings", report.totals.endings, "Declared consequence outcomes covered by simulation paths."),
      metric("Report Issues", report.totals.issues, "Quality report issues are build-blocking.")
    ].join("");
  }

  function renderLesson(lesson) {
    var status = lesson.status === "pass" ? "pass" : "fail";
    var paths = lesson.simulation.paths.map(function (path) {
      return "<span class=\"quality-chip\">" + escapeHtml(path.id) + " -> " + escapeHtml(path.expectedEndingId) + "</span>";
    }).join("");
    var mastery = lesson.masterySignals.map(function (signal) {
      return "<span class=\"quality-chip mastery\">" + escapeHtml(signal.key) + "</span>";
    }).join("");
    var issues = lesson.issues.length
      ? "<div class=\"quality-issues\">" + lesson.issues.map(function (issue) { return "<p>" + escapeHtml(issue) + "</p>"; }).join("") + "</div>"
      : "";

    return "<article class=\"quality-lesson " + status + "\">" +
      "<div class=\"quality-card-head\">" +
        "<span class=\"quality-key\">" + escapeHtml(lesson.qualityTier) + "</span>" +
        "<span class=\"quality-state\">" + escapeHtml(lesson.status) + "</span>" +
      "</div>" +
      "<h3>" + escapeHtml(lesson.title || lesson.id) + "</h3>" +
      "<p class=\"quality-path\">" + escapeHtml(lesson.id) + " · " + escapeHtml(lesson.dataPath) + "</p>" +
      "<div class=\"quality-counts\">" +
        "<span>" + escapeHtml(lesson.counts.scenes) + " scenes</span>" +
        "<span>" + escapeHtml(lesson.counts.sourceNotes) + " sources</span>" +
        "<span>" + escapeHtml(lesson.counts.masterySignals) + " mastery</span>" +
        "<span>" + escapeHtml(lesson.counts.simulationPaths) + " paths</span>" +
      "</div>" +
      (mastery ? "<div class=\"quality-chip-row\">" + mastery + "</div>" : "") +
      (paths ? "<div class=\"quality-chip-row\">" + paths + "</div>" : "") +
      issues +
      (lesson.catalog ? "<a class=\"card-link\" href=\"" + escapeHtml(lesson.catalog.path) + "\">Open lesson -></a>" : "") +
    "</article>";
  }

  function renderLessons(report) {
    $("#quality-lessons").innerHTML = report.lessons.map(renderLesson).join("");
  }

  function renderError(error) {
    $("#quality-status").textContent = "Unavailable";
    $("#quality-status").className = "quality-fail";
    $("#quality-summary").innerHTML = "<li><span>Report</span><strong>failed</strong></li>";
    $("#quality-generated").textContent = error.message || "Could not load reports/quality.json";
    $("#quality-metrics").innerHTML = metric("Report", "missing", "Run npm run build:pages to generate reports/quality.json.");
  }

  fetch("./reports/quality.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("Could not load reports/quality.json");
      return response.json();
    })
    .then(function (report) {
      renderSummary(report);
      renderMetrics(report);
      renderLessons(report);
    })
    .catch(renderError);
})();

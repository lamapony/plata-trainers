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

  function chip(value, extraClass) {
    return "<span class=\"quality-chip " + escapeHtml(extraClass || "") + "\">" + escapeHtml(value) + "</span>";
  }

  function chipList(values, fallback, extraClass) {
    if (!values || !values.length) return chip(fallback, extraClass);
    return values.map(function (value) { return chip(value, extraClass); }).join("");
  }

  function checkChip(check) {
    return "<span class=\"quality-check " + (check.pass ? "pass" : "fail") + "\">" +
      escapeHtml(check.pass ? "ok " : "fail ") + escapeHtml(check.label) +
    "</span>";
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
      ["Comic panels", report.totals.comicPanels],
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
      metric("Comic Panels", report.totals.comicPanels, "Scene-bound visual prompts that turn gold lessons into auditable comic storyboards."),
      metric("Comic Assets", report.totals.comicAssets, "Generated storyboard images currently present in lesson asset folders."),
      metric("Simulation Paths", report.totals.simulationPaths, "Deterministic paths that cover outcomes and social variables."),
      metric("Simulated Attempts", report.totals.simulatedAttempts, "Attempt events replayed by gold lesson simulations."),
      metric("Endings", report.totals.endings, "Declared consequence outcomes covered by simulation paths."),
      metric("Evidence Rows", report.totals.evidenceRows, "Scene-level audit rows linking goals, sources, mastery, diagnostics, remediation, and simulations."),
      metric("Report Issues", report.totals.issues, "Quality report issues are build-blocking.")
    ].join("");
  }

  function diagnosticText(row) {
    var diagnostics = row.diagnostics || {};
    if (diagnostics.kind === "choice") {
      return diagnostics.optionCount + " options · " + diagnostics.correctOptions + " correct · " + diagnostics.diagnostics.length + " diagnostics";
    }
    if (diagnostics.kind === "match") {
      return diagnostics.pairCount + " pairs · " + diagnostics.feedbackCount + " feedback notes";
    }
    if (diagnostics.kind === "completion") {
      return diagnostics.keywordGroups.length + " keyword groups · " + diagnostics.simulationRejects + " reject probes";
    }
    return diagnostics.kind || row.type;
  }

  function renderEvidenceRow(row) {
    var remediation = (row.remediationFor || []).map(function (signal) { return signal.key; });
    return "<div class=\"quality-evidence-row\">" +
      "<div class=\"quality-evidence-main\">" +
        "<div class=\"quality-card-head\">" +
          "<span class=\"quality-key\">" + escapeHtml(row.type) + "</span>" +
          "<span class=\"quality-state\">" + escapeHtml(diagnosticText(row)) + "</span>" +
        "</div>" +
        "<h4>" + escapeHtml(row.title || row.id) + "</h4>" +
        "<p class=\"quality-path\">" + escapeHtml(row.id) + "</p>" +
        "<p>" + escapeHtml(row.learningGoal || "Missing learning goal") + "</p>" +
      "</div>" +
      "<div class=\"quality-evidence-meta\">" +
        "<div><strong>Sources</strong><span>" + chipList(row.sourceRefs || [], "missing", "") + "</span></div>" +
        "<div><strong>Mastery</strong><span>" + chipList(row.masteryTags || [], "missing", "mastery") + "</span></div>" +
        "<div><strong>Simulation</strong><span>" + chipList(row.simulatedBy || [], "not covered", "") + "</span></div>" +
        "<div><strong>Remediation</strong><span>" + chipList(remediation, "not a repair target", "mastery") + "</span></div>" +
        "<div class=\"quality-evidence-checks\"><strong>Checks</strong><span>" + (row.checks || []).map(checkChip).join("") + "</span></div>" +
      "</div>" +
    "</div>";
  }

  function renderEvidenceLesson(lesson) {
    var matrix = lesson.evidenceMatrix || { guarantees: [], sceneRows: [] };
    if (!matrix.sceneRows.length) return "";
    return "<article class=\"quality-evidence-lesson\">" +
      "<div class=\"quality-card-head\">" +
        "<div>" +
          "<span class=\"quality-key\">" + escapeHtml(lesson.id) + "</span>" +
          "<h3>" + escapeHtml(lesson.title || lesson.id) + "</h3>" +
        "</div>" +
        "<span class=\"quality-state\">" + escapeHtml(matrix.sceneRows.length) + " rows</span>" +
      "</div>" +
      "<div class=\"quality-guarantees\">" +
        matrix.guarantees.map(function (guarantee) {
          return "<span class=\"quality-check " + (guarantee.pass ? "pass" : "fail") + "\">" + escapeHtml(guarantee.label) + "</span>";
        }).join("") +
      "</div>" +
      "<div class=\"quality-evidence-rows\">" + matrix.sceneRows.map(renderEvidenceRow).join("") + "</div>" +
    "</article>";
  }

  function renderEvidence(report) {
    $("#quality-evidence").innerHTML = report.lessons
      .filter(function (lesson) { return lesson.qualityTier === "gold"; })
      .map(renderEvidenceLesson)
      .join("");
  }

  function findDoctorLesson(report) {
    return (report.lessons || []).find(function (lesson) {
      return lesson.id === "lesson-a2-doctor";
    }) || null;
  }

  function renderChannelCallout(report) {
    var container = $("#quality-channel-callout");
    if (!container) return;
    var doctor = findDoctorLesson(report);
    if (!doctor) {
      container.innerHTML =
        "<h2>Not in report</h2>" +
        "<p>lesson-a2-doctor is missing from the generated quality report.</p>";
      return;
    }
    var statusLabel = doctor.status === "pass" ? "Passing" : "Needs attention";
    var statusClass = doctor.status === "pass" ? "quality-pass" : "quality-fail";
    var mastery = doctor.masterySignals.map(function (signal) {
      return chip(signal.key, "mastery");
    }).join("");
    container.innerHTML =
      "<h2 class=\"" + statusClass + "\">" + escapeHtml(statusLabel) + "</h2>" +
      "<ul>" +
        "<li><span>Gold lesson</span><strong>" + escapeHtml(doctor.id) + "</strong></li>" +
        "<li><span>Scenes</span><strong>" + escapeHtml(doctor.counts.scenes) + "</strong></li>" +
        "<li><span>Simulation paths</span><strong>" + escapeHtml(doctor.counts.simulationPaths) + "</strong></li>" +
        "<li><span>Repair ladder</span><strong>apotek → skrive sundhed</strong></li>" +
      "</ul>" +
      "<p>" + escapeHtml(doctor.title || doctor.id) + "</p>" +
      (mastery ? "<div class=\"quality-chip-row\">" + mastery + "</div>" : "") +
      (doctor.catalog ? "<a class=\"card-link\" href=\"" + escapeHtml(doctor.catalog.path) + "\">Open lesson →</a>" : "");
  }

  function sortLessons(lessons) {
    return lessons.slice().sort(function (a, b) {
      if (a.id === "lesson-a2-doctor") return -1;
      if (b.id === "lesson-a2-doctor") return 1;
      if (a.qualityTier === "gold" && b.qualityTier !== "gold") return -1;
      if (a.qualityTier !== "gold" && b.qualityTier === "gold") return 1;
      return String(a.id).localeCompare(String(b.id));
    });
  }

  function renderLesson(lesson) {
    var status = lesson.status === "pass" ? "pass" : "fail";
    var paths = lesson.simulation.paths.map(function (path) {
      return "<span class=\"quality-chip\">" + escapeHtml(path.id) + " -> " + escapeHtml(path.expectedEndingId) + "</span>";
    }).join("");
    var comicPanels = lesson.comicStoryboard && lesson.comicStoryboard.panels
      ? lesson.comicStoryboard.panels.map(function (panel) {
        return "<span class=\"quality-chip " + (panel.assetExists ? "mastery" : "") + "\">" + escapeHtml(panel.id) + (panel.assetExists ? "" : " (prompt)") + "</span>";
      }).join("")
      : "";
    var mastery = lesson.masterySignals.map(function (signal) {
      return "<span class=\"quality-chip mastery\">" + escapeHtml(signal.key) + "</span>";
    }).join("");
    var issues = lesson.issues.length
      ? "<div class=\"quality-issues\">" + lesson.issues.map(function (issue) { return "<p>" + escapeHtml(issue) + "</p>"; }).join("") + "</div>"
      : "";

    return "<article id=\"" + escapeHtml(lesson.id) + "\" class=\"quality-lesson " + status + "\">" +
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
        "<span>" + escapeHtml(lesson.counts.comicPanels) + " comic panels</span>" +
        "<span>" + escapeHtml(lesson.counts.simulationPaths) + " paths</span>" +
      "</div>" +
      (mastery ? "<div class=\"quality-chip-row\">" + mastery + "</div>" : "") +
      (comicPanels ? "<div class=\"quality-chip-row\">" + comicPanels + "</div>" : "") +
      (paths ? "<div class=\"quality-chip-row\">" + paths + "</div>" : "") +
      issues +
      (lesson.catalog ? "<a class=\"card-link\" href=\"" + escapeHtml(lesson.catalog.path) + "\">Open lesson -></a>" : "") +
    "</article>";
  }

  function renderLessons(report) {
    $("#quality-lessons").innerHTML = sortLessons(report.lessons).map(renderLesson).join("");
  }

  function renderError(error) {
    $("#quality-status").textContent = "Unavailable";
    $("#quality-status").className = "quality-fail";
    $("#quality-summary").innerHTML = "<li><span>Report</span><strong>failed</strong></li>";
    $("#quality-generated").textContent = error.message || "Could not load reports/quality.json";
    $("#quality-metrics").innerHTML = metric("Report", "missing", "Run npm run build:pages to generate reports/quality.json.");
    $("#quality-evidence").innerHTML = "";
  }

  fetch("./reports/quality.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("Could not load reports/quality.json");
      return response.json();
    })
    .then(function (report) {
      renderSummary(report);
      renderMetrics(report);
      renderEvidence(report);
      renderLessons(report);
      renderChannelCallout(report);
    })
    .catch(renderError);
})();

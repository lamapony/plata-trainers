/* Platå public proof and health surface */
(function () {
  "use strict";

  var quickstartBase = "./reports/quickstart-proof/";
  var proofSources = {
    demo: "./reports/demo-learner.json",
    capabilities: "./reports/capabilities.json",
    health: "./reports/project-health.json",
    quickstart: quickstartBase + "quickstart.json",
    review: quickstartBase + "review-report.json",
    summary: quickstartBase + "review-summary.md"
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value).replace(/[&<>'"]/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[char];
    });
  }

  function countLabel(count, singular, plural) {
    return count + " " + (count === 1 ? singular : plural);
  }

  function localHref(file) {
    return quickstartBase + String(file || "").replace(/^\.\//, "");
  }

  function chip(value, extraClass) {
    return "<span class=\"program-chip " + escapeHtml(extraClass || "") + "\">" + escapeHtml(value) + "</span>";
  }

  function linkChip(href, label, extraClass) {
    return "<a class=\"program-chip " + escapeHtml(extraClass || "") + "\" href=\"" + escapeHtml(href) + "\">" + escapeHtml(label) + "</a>";
  }

  function enableLink(selector, href) {
    var link = $(selector);
    if (!link) return;
    link.href = href;
    link.removeAttribute("aria-disabled");
  }

  function loadJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("Could not load " + url);
      return response.json();
    });
  }

  function loadText(url) {
    return fetch(url, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("Could not load " + url);
      return response.text();
    });
  }

  function renderSummary(data) {
    enableLink("#proof-health-link", proofSources.health);
    enableLink("#proof-capabilities-link", proofSources.capabilities);
    enableLink("#proof-quickstart-link", quickstartBase + "quickstart.md");
    var passing = data.demo.status === "pass" &&
      data.capabilities.status === "pass" &&
      data.health.status === "pass" &&
      data.quickstart.status === "pass";
    $("#proof-status").textContent = passing ? "Proof passing" : "Needs attention";
    $("#proof-status").className = passing ? "quality-pass" : "quality-fail";
    $("#proof-summary").innerHTML = [
      ["Health gates", data.health.totals.gates],
      ["Proof gates", data.capabilities.totals.proofGates],
      ["Artifacts", data.quickstart.artifacts.length],
      ["Review regressions", data.review.summary.regressions],
      ["Issues", data.health.totals.issues + data.capabilities.totals.issues]
    ].map(function (item) {
      return "<li><span>" + escapeHtml(item[0]) + "</span><strong>" + escapeHtml(item[1]) + "</strong></li>";
    }).join("");
    $("#proof-generated").textContent = "Health generated " + new Date(data.health.generatedAt).toLocaleString();
  }

  function renderArtifacts(data) {
    var commands = (data.quickstart.commands || []).map(function (command) {
      return "<li><code>" + escapeHtml(command) + "</code></li>";
    }).join("");
    var artifacts = (data.quickstart.artifacts || []).map(function (item) {
      return "<a class=\"program-report " + escapeHtml(item.status === "pass" ? "pass" : item.status) + "\" href=\"" + escapeHtml(localHref(item.file)) + "\">" +
        "<span>" + escapeHtml(item.status) + "</span>" +
        "<div><strong>" + escapeHtml(item.file) + "</strong><p>" + escapeHtml(item.label) + "</p></div>" +
      "</a>";
    }).join("");
    $("#proof-artifacts").innerHTML =
      "<article class=\"proof-command-card\">" +
        "<h3>Run locally</h3>" +
        "<ol>" + commands + "</ol>" +
      "</article>" +
      "<div class=\"proof-artifact-list\">" + artifacts + "</div>";
  }

  function surfaceCard(title, status, copy, chips, href) {
    return "<article class=\"proof-surface " + escapeHtml(status === "pass" || status === "regression" ? "pass" : "fail") + "\">" +
      "<div class=\"quality-card-head\">" +
        "<span class=\"quality-key\">" + escapeHtml(status) + "</span>" +
        (href ? "<a class=\"quality-state\" href=\"" + escapeHtml(href) + "\">open</a>" : "<span class=\"quality-state\">local</span>") +
      "</div>" +
      "<h3>" + escapeHtml(title) + "</h3>" +
      "<p>" + escapeHtml(copy) + "</p>" +
      "<div class=\"program-proof-strip\">" + chips.join("") + "</div>" +
    "</article>";
  }

  function renderSurfaces(data) {
    $("#proof-surfaces").innerHTML = [
      surfaceCard(
        "Demo learner",
        data.demo.status,
        "Read-only rich B2 profile with memory facts, practice plan, and companion proof.",
        [
          chip(countLabel(data.demo.totals.visibleMemoryFacts, "memory fact", "memory facts"), "mastery"),
          chip(countLabel(data.demo.totals.planSteps, "plan step", "plan steps"), ""),
          chip(data.demo.totals.storageWrites + " storage write(s)", data.demo.totals.storageWrites ? "fail" : "pass")
        ],
        proofSources.demo
      ),
      surfaceCard(
        "Capability map",
        data.capabilities.status,
        "Product claims mapped to checks, reports, docs, and source files.",
        [
          chip(countLabel(data.capabilities.totals.capabilities, "capability", "capabilities"), "mastery"),
          chip(countLabel(data.capabilities.totals.proofGates, "gate", "gates"), ""),
          chip(countLabel(data.capabilities.totals.sourcePaths, "source", "sources"), "")
        ],
        proofSources.capabilities
      ),
      surfaceCard(
        "Project health",
        data.health.status,
        "Required gates, workflows, public reports, and deterministic fixtures.",
        [
          chip(countLabel(data.health.totals.gates, "gate", "gates"), "mastery"),
          chip(countLabel(data.health.totals.workflows, "workflow", "workflows"), ""),
          chip(countLabel(data.health.totals.deterministicFixtures, "fixture", "fixtures"), "")
        ],
        proofSources.health
      ),
      surfaceCard(
        "Golden review fixture",
        data.review.status,
        "Large PR review scenario with capped Markdown and full JSON output.",
        [
          chip(countLabel(data.review.summary.changes, "change", "changes"), "mastery"),
          chip(countLabel(data.review.summary.regressions, "regression", "regressions"), "fail"),
          chip(countLabel(data.review.summary.reviewChanges, "review change", "review changes"), "")
        ],
        proofSources.review
      )
    ].join("");
  }

  function renderHealth(data) {
    var categories = Object.keys(data.health.totals.gateCategories || {}).sort().map(function (category) {
      return "<div class=\"proof-health-row\">" +
        "<span>" + escapeHtml(category) + "</span>" +
        "<strong>" + escapeHtml(data.health.totals.gateCategories[category]) + "</strong>" +
      "</div>";
    }).join("");
    var guarantees = (data.health.guarantees || []).map(function (guarantee) {
      return "<div class=\"program-guarantee " + (guarantee.pass ? "pass" : "fail") + "\">" +
        "<span>" + escapeHtml(guarantee.pass ? "pass" : "fail") + "</span>" +
        "<div><strong>" + escapeHtml(guarantee.label) + "</strong><p>" + escapeHtml(guarantee.key) + "</p></div>" +
      "</div>";
    }).join("");
    $("#proof-health").innerHTML =
      "<div class=\"proof-health-card\"><h3>Gate categories</h3>" + categories + "</div>" +
      "<div class=\"proof-health-card\"><h3>Guarantees</h3>" + guarantees + "</div>";
  }

  function renderReview(data) {
    var surfaces = (data.review.surfaces || []).map(function (surface) {
      return "<div class=\"proof-review-row\">" +
        "<strong>" + escapeHtml(surface.label) + "</strong>" +
        "<span>" + escapeHtml(surface.status) + "</span>" +
        "<span>" + escapeHtml(surface.summary.changes + " change(s)") + "</span>" +
        "<span>" + escapeHtml(surface.summary.regressions + " regression(s)") + "</span>" +
      "</div>";
    }).join("");
    var summaryLines = data.summary.split(/\r?\n/).slice(0, 18).map(function (line) {
      return escapeHtml(line);
    }).join("\n");
    $("#proof-review").innerHTML =
      "<div class=\"proof-review-table\">" + surfaces + "</div>" +
      "<pre class=\"proof-summary-preview\">" + summaryLines + "</pre>" +
      "<div class=\"hero-actions\">" +
        linkChip(proofSources.review, "Open full review JSON", "mastery") +
        linkChip(proofSources.summary, "Open capped Markdown", "") +
      "</div>";
  }

  function renderError(error) {
    $("#proof-status").textContent = "Unavailable";
    $("#proof-status").className = "quality-fail";
    $("#proof-summary").innerHTML = "<li><span>Proof</span><strong>missing</strong></li>";
    $("#proof-generated").textContent = error.message || "Could not load proof reports";
    $("#proof-artifacts").innerHTML = "<article class=\"proof-command-card fail\"><h3>Proof artifacts missing</h3><p>Run npm run build:pages to generate reports.</p></article>";
    $("#proof-surfaces").innerHTML = "";
    $("#proof-health").innerHTML = "";
    $("#proof-review").innerHTML = "";
  }

  Promise.all([
    loadJson(proofSources.demo),
    loadJson(proofSources.capabilities),
    loadJson(proofSources.health),
    loadJson(proofSources.quickstart),
    loadJson(proofSources.review),
    loadText(proofSources.summary)
  ]).then(function (values) {
    var data = {
      demo: values[0],
      capabilities: values[1],
      health: values[2],
      quickstart: values[3],
      review: values[4],
      summary: values[5]
    };
    renderSummary(data);
    renderArtifacts(data);
    renderSurfaces(data);
    renderHealth(data);
    renderReview(data);
  }).catch(renderError);
})();

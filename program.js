/* Platå public program map */
(function () {
  "use strict";

  var repoBase = "https://github.com/lamapony/plata-trainers/blob/main/";
  var pillarSpecs = [
    {
      id: "practice",
      title: "Break the plateau one step at a time",
      copy: "Choose a real situation or follow one useful suggestion. There is no long course to keep up with and no account to create.",
      capabilityIds: ["static-forkable-runtime", "today-program-shell", "guided-session-outcome-loop", "gold-lesson-quality-engine"]
    },
    {
      id: "memory",
      title: "You can understand every suggestion",
      copy: "Platå uses only the practice saved in your browser, and it can show why a particular step was chosen.",
      capabilityIds: ["private-learner-memory", "adaptive-planner-and-advisor", "lightweight-companion-bridge"]
    },
    {
      id: "proof",
      title: "The checks are open to everyone",
      copy: "Anyone can inspect the sources, lesson checks, and project health instead of trusting a marketing claim.",
      capabilityIds: ["root-skill-coverage", "contributor-authoring-toolkit", "public-github-proof-surface"]
    }
  ];

  function $(selector) {
    return document.querySelector(selector);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[char];
    });
  }

  function localReportHref(path) {
    return "./" + String(path || "").replace(/^\.\//, "");
  }

  function repoHref(path) {
    return repoBase + encodeURIComponent(String(path || "")).replace(/%2F/g, "/");
  }

  function byId(items) {
    return (items || []).reduce(function (acc, item) {
      acc[item.id] = item;
      return acc;
    }, {});
  }

  function chip(value, extraClass) {
    return "<span class=\"program-chip " + escapeHtml(extraClass || "") + "\">" + escapeHtml(value) + "</span>";
  }

  function linkChip(href, label, extraClass) {
    return "<a class=\"program-chip " + escapeHtml(extraClass || "") + "\" href=\"" + escapeHtml(href) + "\">" + escapeHtml(label) + "</a>";
  }

  function countLabel(count, singular, plural) {
    return count + " " + (count === 1 ? singular : plural);
  }

  function gateLabel(id) {
    return String(id || "")
      .replace(/^check:/, "")
      .replace(/-/g, " ");
  }

  function renderSummary(report) {
    var jsonLink = $("#program-json-link");
    if (jsonLink) {
      jsonLink.href = "./reports/capabilities.json";
      jsonLink.removeAttribute("aria-disabled");
    }
    $("#program-status").textContent = report.status === "pass" ? "All checks passing" : "Needs attention";
    $("#program-status").className = report.status === "pass" ? "quality-pass" : "quality-fail";
    $("#program-summary").innerHTML = [
      ["What works", report.totals.capabilities],
      ["Automated checks", report.totals.proofGates],
      ["Public evidence", report.totals.publicReports],
      ["Helpful documents", report.totals.docs],
      ["Open issues", report.totals.issues]
    ].map(function (item) {
      return "<li><span>" + escapeHtml(item[0]) + "</span><strong>" + escapeHtml(item[1]) + "</strong></li>";
    }).join("");
    $("#program-generated").textContent = "Last checked " + new Date(report.generatedAt).toLocaleString();
  }

  function renderPillars(report) {
    var capabilities = byId(report.capabilities);
    $("#program-pillars").innerHTML = pillarSpecs.map(function (pillar) {
      var rows = pillar.capabilityIds.map(function (id) { return capabilities[id]; }).filter(Boolean);
      var checks = rows.reduce(function (sum, item) { return sum + item.proofGates.length; }, 0);
      var passed = rows.every(function (item) { return item.status === "pass"; });
      return "<article class=\"program-pillar " + (passed ? "pass" : "fail") + "\">" +
        "<div class=\"quality-card-head\">" +
          "<span class=\"quality-key\">" + escapeHtml(pillar.id) + "</span>" +
          "<span class=\"quality-state\">" + escapeHtml(passed ? "checked" : "review") + "</span>" +
        "</div>" +
        "<h3>" + escapeHtml(pillar.title) + "</h3>" +
        "<p>" + escapeHtml(pillar.copy) + "</p>" +
        "<div class=\"program-proof-strip\">" +
          chip(countLabel(rows.length, "feature", "features"), "mastery") +
          chip(countLabel(checks, "check", "checks"), "") +
          chip(passed ? "checked" : "needs review", passed ? "pass" : "fail") +
        "</div>" +
      "</article>";
    }).join("");
  }

  function renderCapability(capability) {
    var reportLinks = (capability.publicReports || []).map(function (report) {
      return linkChip(localReportHref(report.pagesPath || ""), report.id, report.status === "pass" ? "pass" : "fail");
    }).join("");
    var docLinks = (capability.docs || []).slice(0, 3).map(function (doc) {
      return linkChip(repoHref(doc.path), doc.path.split("/").pop(), doc.exists ? "" : "fail");
    }).join("");
    var sourceLinks = (capability.sourcePaths || []).slice(0, 3).map(function (source) {
      return linkChip(repoHref(source.path), source.path.split("/").pop(), source.exists ? "" : "fail");
    }).join("");
    var gates = (capability.proofGates || []).slice(0, 5).map(function (gate) {
      return chip(gateLabel(gate.id), gate.status === "pass" ? "pass" : "fail");
    }).join("");
    var contracts = (capability.contracts || []).slice(0, 3).map(function (contract) {
      return "<li>" + escapeHtml(contract) + "</li>";
    }).join("");

    return "<article class=\"program-capability " + escapeHtml(capability.status) + "\">" +
      "<div class=\"quality-card-head\">" +
        "<span class=\"quality-key\">" + escapeHtml(capability.stage || "shipped") + "</span>" +
        "<span class=\"quality-state\">" + escapeHtml(capability.status) + "</span>" +
      "</div>" +
      "<h3>" + escapeHtml(capability.title || capability.id) + "</h3>" +
      "<p>" + escapeHtml(capability.userValue) + "</p>" +
      "<div class=\"program-proof-strip\">" +
        chip(countLabel((capability.proofGates || []).length, "gate", "gates"), "mastery") +
        chip(countLabel((capability.publicReports || []).length, "report", "reports"), "") +
        chip(countLabel((capability.sourcePaths || []).length, "source", "sources"), "") +
      "</div>" +
      (contracts ? "<ul class=\"program-contracts\">" + contracts + "</ul>" : "") +
      "<div class=\"program-proof-block\"><strong>Checks</strong><div>" + gates + "</div></div>" +
      "<div class=\"program-proof-block\"><strong>Reports</strong><div>" + reportLinks + "</div></div>" +
      "<div class=\"program-proof-block\"><strong>Docs</strong><div>" + docLinks + "</div></div>" +
      "<div class=\"program-proof-block\"><strong>Source</strong><div>" + sourceLinks + "</div></div>" +
    "</article>";
  }

  function renderCapabilities(report) {
    $("#program-capabilities").innerHTML = report.capabilities.map(renderCapability).join("");
  }

  function renderGuarantees(report) {
    $("#program-guarantees").innerHTML = "<h3>Guarantees</h3>" + (report.guarantees || []).map(function (guarantee) {
      return "<div class=\"program-guarantee " + (guarantee.pass ? "pass" : "fail") + "\">" +
        "<span>" + escapeHtml(guarantee.pass ? "pass" : "fail") + "</span>" +
        "<div><strong>" + escapeHtml(guarantee.label) + "</strong><p>" + escapeHtml(guarantee.key) + "</p></div>" +
      "</div>";
    }).join("");
  }

  function renderReports(report) {
    $("#program-reports").innerHTML = "<h3>Public reports</h3>" + (report.publicReports || []).map(function (item) {
      return "<a class=\"program-report " + escapeHtml(item.status) + "\" href=\"" + escapeHtml(localReportHref(item.pagesPath)) + "\">" +
        "<span>" + escapeHtml(item.status) + "</span>" +
        "<div><strong>" + escapeHtml(item.title) + "</strong><p>" + escapeHtml(item.pagesPath) + "</p></div>" +
      "</a>";
    }).join("");
  }

  function renderError(error) {
    $("#program-status").textContent = "Unavailable";
    $("#program-status").className = "quality-fail";
    $("#program-summary").innerHTML = "<li><span>Map</span><strong>missing</strong></li>";
    $("#program-generated").textContent = error.message || "Could not load reports/capabilities.json";
    $("#program-pillars").innerHTML = "<article class=\"program-pillar fail\"><h3>Capability map missing</h3><p>Run npm run build:pages to generate reports/capabilities.json.</p></article>";
    $("#program-capabilities").innerHTML = "";
    $("#program-guarantees").innerHTML = "";
    $("#program-reports").innerHTML = "";
  }

  fetch("./reports/capabilities.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("Could not load reports/capabilities.json");
      return response.json();
    })
    .then(function (report) {
      renderSummary(report);
      renderPillars(report);
      renderCapabilities(report);
      renderGuarantees(report);
      renderReports(report);
    })
    .catch(renderError);
})();

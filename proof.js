/* Platå public proof and health surface */
(function () {
  "use strict";

  var quickstartBase = "./reports/quickstart-proof/";
  var proofSources = {
    digest: "./reports/proof-digest.json",
    demo: "./reports/demo-learner.json",
    guided: "./reports/guided-session.json",
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
    enableLink("#proof-digest-link", proofSources.digest);
    enableLink("#proof-health-link", proofSources.health);
    enableLink("#proof-capabilities-link", proofSources.capabilities);
    enableLink("#proof-guided-link", proofSources.guided);
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

  function renderEvidenceChips(items) {
    return (items || []).map(function (item) {
      var href = String(item || "").indexOf("reports/") === 0 ? "./" + item : "";
      return href ? linkChip(href, item, "") : chip(item, "");
    }).join("");
  }

  function digestCard(item) {
    return "<article class=\"proof-digest-card " + escapeHtml(item.status) + "\">" +
      "<div class=\"quality-card-head\">" +
        "<span class=\"quality-key\">" + escapeHtml(item.status) + "</span>" +
        "<span class=\"quality-state\">" + escapeHtml(item.id) + "</span>" +
      "</div>" +
      "<h3>" + escapeHtml(item.title) + "</h3>" +
      "<p>" + escapeHtml(item.takeaway) + "</p>" +
      "<p class=\"proof-digest-detail\">" + escapeHtml(item.detail) + "</p>" +
      "<div class=\"program-proof-strip\">" + renderEvidenceChips(item.evidence) + "</div>" +
    "</article>";
  }

  function renderDigest(data) {
    var digest = data.digest || {};
    var claims = (digest.whatThisProves || []).map(digestCard).join("");
    var changes = (digest.whatChanged || []).map(function (item) {
      return "<div class=\"proof-change-row " + escapeHtml(item.status) + "\">" +
        "<span>" + escapeHtml(item.status) + "</span>" +
        "<div><strong>" + escapeHtml(item.title) + "</strong><p>" + escapeHtml(item.takeaway) + "</p>" +
          "<div class=\"program-proof-strip\">" + renderEvidenceChips(item.evidence) + "</div></div>" +
      "</div>";
    }).join("");
    var boundaries = (digest.trustBoundaries || []).map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");
    $("#proof-digest").innerHTML =
      "<article class=\"proof-digest-lead " + escapeHtml(digest.status || "fail") + "\">" +
        "<div>" +
          "<span class=\"quality-key\">" + escapeHtml(digest.status || "unknown") + "</span>" +
          "<h3>" + escapeHtml(digest.headline || "Proof digest unavailable") + "</h3>" +
          "<p>" + escapeHtml(digest.summary || "") + "</p>" +
        "</div>" +
        "<div class=\"program-proof-strip\">" +
          chip(countLabel(digest.totals && digest.totals.claims || 0, "claim", "claims"), "mastery") +
          chip(countLabel(digest.totals && digest.totals.changes || 0, "change", "changes"), "") +
          chip(countLabel(digest.totals && digest.totals.trustBoundaries || 0, "boundary", "boundaries"), "") +
        "</div>" +
      "</article>" +
      "<div class=\"proof-digest-grid\">" + claims + "</div>" +
      "<div class=\"proof-digest-lower\">" +
        "<article class=\"proof-digest-panel\"><h3>What changed</h3>" + changes + "</article>" +
        "<article class=\"proof-digest-panel\"><h3>Trust boundaries</h3><ul>" + boundaries + "</ul></article>" +
      "</div>";
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

  function findById(items, id) {
    return (items || []).filter(function (item) { return item.id === id; })[0] || null;
  }

  function sourceChip(path, label) {
    return linkChip("https://github.com/lamapony/plata-trainers/blob/main/" + encodeURIComponent(path).replace(/%2F/g, "/"), label || path.split("/").pop(), "");
  }

  function renderGuidedContract(data) {
    var capability = findById(data.capabilities.capabilities, "guided-session-outcome-loop") || {};
    var reviewSurface = findById(data.review.surfaces, "guided") || {};
    var guided = data.guided || {};
    var totals = guided.totals || {};
    var ledgerTotals = guided.outcomeLedger && guided.outcomeLedger.totals || {};
    var gates = (capability.proofGates || []).filter(function (gate) {
      return ["check:guided-session", "check:guided-session-report", "check:guided-session-diff"].indexOf(gate.id) !== -1;
    }).map(function (gate) {
      return chip(gate.id, gate.status === "pass" ? "pass" : "fail");
    }).join("");
    var sourceLinks = [
      sourceChip("shared/plata-guided-session.js", "runtime contract"),
      sourceChip("scripts/build-guided-session-report.js", "public report"),
      sourceChip("scripts/diff-guided-session-report.js", "PR diff"),
      sourceChip("scripts/smoke-guided-session-diff.js", "diff smoke")
    ].join("");
    var contractList = (capability.contracts || []).slice(0, 4).map(function (contract) {
      return "<li>" + escapeHtml(contract) + "</li>";
    }).join("");

    $("#proof-guided").innerHTML =
      "<article class=\"proof-guided-card " + escapeHtml(guided.status === "pass" ? "pass" : "fail") + "\">" +
        "<div class=\"quality-card-head\"><span class=\"quality-key\">" + escapeHtml(guided.status || "unknown") + "</span><a class=\"quality-state\" href=\"" + escapeHtml(proofSources.guided) + "\">report</a></div>" +
        "<h3>Generated guided-session report</h3>" +
        "<p>The public JSON proves the guided session states and the portable outcome receipt ledger.</p>" +
        "<div class=\"program-proof-strip\">" +
          chip(countLabel(totals.scenarios || 0, "scenario", "scenarios"), "mastery") +
          chip(countLabel(totals.outcomeReceipts || 0, "outcome receipt", "outcome receipts"), ledgerTotals.outcomes ? "pass" : "fail") +
          chip(countLabel(totals.issues || 0, "issue", "issues"), totals.issues ? "fail" : "pass") +
        "</div>" +
      "</article>" +
      "<article class=\"proof-guided-card " + escapeHtml(reviewSurface.status === "regression" || reviewSurface.status === "changed" || reviewSurface.status === "unchanged" ? "pass" : "fail") + "\">" +
        "<div class=\"quality-card-head\"><span class=\"quality-key\">" + escapeHtml(reviewSurface.status || "unknown") + "</span><span class=\"quality-state\">PR review</span></div>" +
        "<h3>Guided drift is reviewable</h3>" +
        "<p>Pull-request QA compares base and head guided reports, then adds guided regressions and review changes to the unified reviewer summary.</p>" +
        "<div class=\"program-proof-strip\">" +
          chip(countLabel(reviewSurface.summary && reviewSurface.summary.changes || 0, "change", "changes"), "mastery") +
          chip(countLabel(reviewSurface.summary && reviewSurface.summary.regressions || 0, "regression", "regressions"), reviewSurface.summary && reviewSurface.summary.regressions ? "fail" : "pass") +
          chip("guided-session-diff.json", "") +
        "</div>" +
      "</article>" +
      "<article class=\"proof-guided-card pass\">" +
        "<div class=\"quality-card-head\"><span class=\"quality-key\">contract</span><span class=\"quality-state\">guarded</span></div>" +
        "<h3>What cannot silently drift</h3>" +
        "<ul class=\"program-contracts\">" + contractList + "</ul>" +
        "<div class=\"program-proof-block\"><strong>Gates</strong><div>" + gates + "</div></div>" +
        "<div class=\"program-proof-block\"><strong>Source</strong><div>" + sourceLinks + "</div></div>" +
      "</article>";
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
    $("#proof-digest").innerHTML = "<article class=\"proof-digest-card fail\"><h3>Proof digest missing</h3><p>Run npm run build:pages to generate reports/proof-digest.json.</p></article>";
    $("#proof-artifacts").innerHTML = "<article class=\"proof-command-card fail\"><h3>Proof artifacts missing</h3><p>Run npm run build:pages to generate reports.</p></article>";
    $("#proof-surfaces").innerHTML = "";
    $("#proof-guided").innerHTML = "";
    $("#proof-health").innerHTML = "";
    $("#proof-review").innerHTML = "";
  }

  Promise.all([
    loadJson(proofSources.digest),
    loadJson(proofSources.demo),
    loadJson(proofSources.guided),
    loadJson(proofSources.capabilities),
    loadJson(proofSources.health),
    loadJson(proofSources.quickstart),
    loadJson(proofSources.review),
    loadText(proofSources.summary)
  ]).then(function (values) {
    var data = {
      digest: values[0],
      demo: values[1],
      guided: values[2],
      capabilities: values[3],
      health: values[4],
      quickstart: values[5],
      review: values[6],
      summary: values[7]
    };
    renderSummary(data);
    renderDigest(data);
    renderArtifacts(data);
    renderSurfaces(data);
    renderGuidedContract(data);
    renderHealth(data);
    renderReview(data);
  }).catch(renderError);
})();

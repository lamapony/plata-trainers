/* Platå public proof and health surface */
(function () {
  "use strict";

  var repoBase = "https://github.com/lamapony/plata-trainers/blob/main/";
  var quickstartBase = "./reports/quickstart-proof/";
  var distributionProof = {
    zipPath: ".dist/plata-offline-bundle.zip",
    manifestPath: ".dist/plata-offline-bundle.manifest.json",
    fileCount: 110,
    version: "0.4.0",
    requiredEntries: [
      "index.html",
      "sw.js",
      "precache-manifest.json",
      "reports/project-health.json",
      "reports/quality.json"
    ]
  };

  var proofSources = {
    digest: "./reports/proof-digest.json",
    demo: "./reports/demo-learner.json",
    evaluator: "./reports/evaluator-path.json",
    journey: "./reports/evaluator-journey.json",
    portability: "./reports/profile-portability.json",
    exerciseValue: "./reports/exercise-value.json",
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

  function localReportHref(file) {
    return "./" + String(file || "").replace(/^\.\//, "");
  }

  function localPageHref(file) {
    return "./" + String(file || "").replace(/^\.\//, "");
  }

  function shortPath(path) {
    var parts = String(path || "").split("/");
    return parts[parts.length - 1] || path;
  }

  function gateLabel(id) {
    return String(id || "").replace(/^check:/, "");
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

  function proofPassing(data) {
    return data.demo.status === "pass" &&
      data.evaluator.status === "pass" &&
      data.journey.status === "pass" &&
      data.portability.status === "pass" &&
      data.exerciseValue.status === "pass" &&
      data.capabilities.status === "pass" &&
      data.health.status === "pass" &&
      data.quickstart.status === "pass";
  }

  function renderSummary(data) {
    enableLink("#proof-digest-link", proofSources.digest);
    enableLink("#proof-health-link", proofSources.health);
    enableLink("#proof-capabilities-link", proofSources.capabilities);
    enableLink("#proof-evaluator-link", proofSources.evaluator);
    enableLink("#proof-journey-link", proofSources.journey);
    enableLink("#proof-portability-link", proofSources.portability);
    enableLink("#proof-exercise-link", proofSources.exerciseValue);
    enableLink("#proof-guided-link", proofSources.guided);
    enableLink("#proof-quickstart-link", quickstartBase + "quickstart.md");
    var passing = proofPassing(data);
    $("#proof-status").textContent = passing ? "All checks passing" : "Needs attention";
    $("#proof-status").className = passing ? "quality-pass" : "quality-fail";
    $("#proof-summary").innerHTML = [
      ["Required checks", data.health.totals.gates],
      ["Product promises checked", data.capabilities.totals.proofGates],
      ["Public pages checked", data.evaluator.routeTargets.length],
      ["Walkthrough steps", data.journey.totals.stages],
      ["Move-progress steps", data.portability.totals.stages],
      ["Learning chains", data.exerciseValue.totals.flagshipChains],
      ["Review files", data.quickstart.artifacts.length],
      ["Test failures exercised", data.review.summary.regressions],
      ["Open issues", data.health.totals.issues + data.capabilities.totals.issues]
    ].map(function (item) {
      return "<li><span>" + escapeHtml(item[0]) + "</span><strong>" + escapeHtml(item[1]) + "</strong></li>";
    }).join("");
    $("#proof-generated").textContent = "Last checked " + new Date(data.health.generatedAt).toLocaleString();
  }

  function renderProofHeadroom(data) {
    var container = $("#proof-headroom");
    var layer = window.PlataHeadroom;
    if (!container || !layer || !layer.compressProofSnapshot || !layer.renderBar) return;
    var snapshot = layer.compressProofSnapshot({
      passing: proofPassing(data),
      digest: data.digest,
      demo: data.demo,
      journey: data.journey,
      health: data.health,
      capabilities: data.capabilities,
      guided: data.guided,
      exerciseValue: data.exerciseValue
    });
    container.hidden = false;
    container.innerHTML = layer.renderBar(snapshot);
  }

  function renderEvidenceChips(items) {
    return (items || []).map(function (item) {
      var href = String(item || "").indexOf("reports/") === 0 ? "./" + item : "";
      return href ? linkChip(href, item, "") : chip(item, "");
    }).join("");
  }

  function digestCard(item) {
    var checked = item.status === "pass" || item.status === "regression";
    return "<article class=\"proof-digest-card " + escapeHtml(item.status) + "\">" +
      "<div class=\"quality-card-head\">" +
        "<span class=\"quality-key\">" + (checked ? "Checked" : "Needs attention") + "</span>" +
      "</div>" +
      "<h3>" + escapeHtml(item.title) + "</h3>" +
      "<p>" + escapeHtml(item.takeaway) + "</p>" +
      "<p class=\"proof-digest-detail\">" + escapeHtml(item.detail) + "</p>" +
      "<details class=\"headroom-appendix\"><summary>See exact evidence</summary>" +
        "<div class=\"program-proof-strip\">" + chip(item.id, "") + renderEvidenceChips(item.evidence) + "</div>" +
      "</details>" +
    "</article>";
  }

  function renderDigest(data) {
    var digest = data.digest || {};
    var claims = (digest.whatThisProves || []).map(digestCard).join("");
    var changes = (digest.whatChanged || []).map(function (item) {
      return "<div class=\"proof-change-row " + escapeHtml(item.status) + "\">" +
        "<span>" + (item.status === "pass" ? "✓" : "!") + "</span>" +
        "<div><strong>" + escapeHtml(item.title) + "</strong><p>" + escapeHtml(item.takeaway) + "</p>" +
          "<details class=\"headroom-appendix\"><summary>See exact evidence</summary>" +
            "<div class=\"program-proof-strip\">" + renderEvidenceChips(item.evidence) + "</div>" +
          "</details></div>" +
      "</div>";
    }).join("");
    var boundaries = (digest.trustBoundaries || []).map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");
    $("#proof-digest").innerHTML =
      "<article class=\"proof-digest-lead " + escapeHtml(digest.status || "fail") + "\">" +
        "<div>" +
          "<span class=\"quality-key\">" + (digest.status === "pass" ? "Checked" : "Needs attention") + "</span>" +
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
    var checked = status === "pass" || status === "regression";
    return "<article class=\"proof-surface " + escapeHtml(checked ? "pass" : "fail") + "\">" +
      "<div class=\"quality-card-head\">" +
        "<span class=\"quality-key\">" + (checked ? "Checked" : "Needs attention") + "</span>" +
        (href ? "<a class=\"quality-state\" href=\"" + escapeHtml(href) + "\">See evidence</a>" : "<span class=\"quality-state\">Included</span>") +
      "</div>" +
      "<h3>" + escapeHtml(title) + "</h3>" +
      "<p>" + escapeHtml(copy) + "</p>" +
      "<details class=\"headroom-appendix\"><summary>Exact checks and counts</summary>" +
        "<div class=\"program-proof-strip\">" + chips.join("") + "</div>" +
      "</details>" +
    "</article>";
  }

  function renderSurfaces(data) {
    $("#proof-surfaces").innerHTML = [
      surfaceCard(
        "Demo learner",
        data.demo.status,
        "Meet a fictional B2 learner and see how Platå chooses one useful next step. The example cannot change your own progress.",
        [
          chip(countLabel(data.demo.totals.visibleMemoryFacts, "memory fact", "memory facts"), "mastery"),
          chip(countLabel(data.demo.totals.planSteps, "plan step", "plan steps"), ""),
          chip(data.demo.totals.storageWrites + " storage write(s)", data.demo.totals.storageWrites ? "fail" : "pass")
        ],
        proofSources.demo
      ),
      surfaceCard(
        "Take your progress with you",
        data.portability.status,
        "Your saved practice can be exported and restored, including corrections and finished steps.",
        [
          chip(data.portability.traceId || "profile trace", "pass"),
          chip(countLabel(data.portability.totals.eventCount, "event", "events"), "mastery"),
          chip(countLabel(data.portability.totals.memoryCorrections, "correction", "corrections"), "pass"),
          chip(countLabel(data.portability.totals.flagshipExerciseOutcomes || 0, "flagship outcome", "flagship outcomes"), data.portability.totals.flagshipExerciseOutcomes ? "pass" : "fail")
        ],
        proofSources.portability
      ),
      surfaceCard(
        "Practice that changes what you can do",
        data.exerciseValue.status,
        "The main lessons test realistic choices, explain close mistakes, and help you use the same skill in a new situation.",
        [
          chip(countLabel(data.exerciseValue.totals.flagshipChains, "flagship chain", "flagship chains"), "mastery"),
          chip(data.exerciseValue.totals.archetypesCovered + "/" + data.exerciseValue.requiredArchetypes.length + " archetypes", "pass"),
          chip(countLabel(data.exerciseValue.totals.nearMisses, "near miss", "near misses"), ""),
          chip(data.guided.flagshipExerciseOutcomeProof && data.guided.flagshipExerciseOutcomeProof.status === "pass" ? "guided outcome proof" : "guided proof missing", data.guided.flagshipExerciseOutcomeProof && data.guided.flagshipExerciseOutcomeProof.status === "pass" ? "pass" : "fail"),
          chip(data.portability.totals.flagshipExerciseOutcomes ? "profile outcome portable" : "profile outcome missing", data.portability.totals.flagshipExerciseOutcomes ? "pass" : "fail")
        ],
        proofSources.exerciseValue
      ),
      surfaceCard(
        "Claims you can verify",
        data.capabilities.status,
        "Every important promise is connected to a check, a report, and the part of the project that makes it true.",
        [
          chip(countLabel(data.capabilities.totals.capabilities, "capability", "capabilities"), "mastery"),
          chip(countLabel(data.capabilities.totals.proofGates, "gate", "gates"), ""),
          chip(countLabel(data.capabilities.totals.sourcePaths, "source", "sources"), "")
        ],
        proofSources.capabilities
      ),
      surfaceCard(
        "Checks before publication",
        data.health.status,
        "Lessons, links, reports, and publishing rules are checked together before a change reaches the live site.",
        [
          chip(countLabel(data.health.totals.gates, "gate", "gates"), "mastery"),
          chip(countLabel(data.health.totals.workflows, "workflow", "workflows"), ""),
          chip(countLabel(data.health.totals.deterministicFixtures, "fixture", "fixtures"), "")
        ],
        proofSources.health
      ),
      surfaceCard(
        "A realistic code review",
        data.review.status,
        "A deliberately difficult example proves that a large change can still be reviewed without hiding errors or losing detail.",
        [
          chip(countLabel(data.review.summary.changes, "change", "changes"), "mastery"),
          chip(countLabel(data.review.summary.regressions, "regression", "regressions"), "fail"),
          chip(countLabel(data.review.summary.reviewChanges, "review change", "review changes"), "")
        ],
        proofSources.review
      )
    ].join("");
  }

  function renderProofWalkthrough(data) {
    var demo = data.demo || {};
    var demoPlan = demo.plan || {};
    var demoStep = (demoPlan.steps || [])[0] || demo.actionableStep || {};
    var companion = demo.companion || {};
    var guidedScenario = findById(data.guided.scenarios, "memory-backed-repair") || (data.guided.scenarios || [])[0] || {};
    var session = guidedScenario.session || {};
    var route = session.route || {};
    var journey = data.journey || {};
    var returnStage = findById(journey.stages || [], "dashboard-return") || {};
    var returnRendered = returnStage.evidence && returnStage.evidence.rendered || {};
    var ledger = data.guided.outcomeLedger || {};
    var outcome = (ledger.outcomes || [])[0] || {};
    var receipt = outcome.outcomeReceipt || session.outcomeReceipt || {};
    var guidedCapability = findById(data.capabilities.capabilities, "guided-session-outcome-loop") || {};
    var proofCapability = findById(data.capabilities.capabilities, "public-github-proof-surface") || {};
    var proofGateIds = ["check:demo-learner-report", "check:guided-session-report", "check:guided-session-diff", "check:proof-page"];
    var seenGates = {};
    var proofGates = (guidedCapability.proofGates || []).concat(proofCapability.proofGates || []).filter(function (gate) {
      if (proofGateIds.indexOf(gate.id) === -1 || seenGates[gate.id]) return false;
      seenGates[gate.id] = true;
      return true;
    }).map(function (gate) {
      return chip(gate.id, gate.status === "pass" ? "pass" : "fail");
    }).join("");
    var dashboardHref = localPageHref(demo.url || "dashboard.html?demo=learner");
    var routeHref = localPageHref(demoStep.primaryHref || route.href || "dashboard.html?demo=learner");
    var receiptFingerprint = outcome.fingerprint || session.fingerprint || "";

    var steps = [
      {
        title: "Meet a fictional learner",
        copy: "Explore a made-up B2 profile with realistic strengths and trouble spots. Nothing you do here changes your own progress.",
        href: dashboardHref,
        hrefLabel: "Meet the example learner",
        chips: [
          chip(countLabel(demo.totals && demo.totals.visibleMemoryFacts || 0, "memory fact", "memory facts"), "mastery"),
          chip((demo.totals && demo.totals.storageWrites || 0) + " storage writes", demo.totals && demo.totals.storageWrites ? "fail" : "pass"),
          linkChip(proofSources.demo, "demo-learner.json", "pass")
        ]
      },
      {
        title: "See why this practice comes next",
        copy: "Platå turns the learner’s saved practice into one clear suggestion and keeps the explanation close by.",
        href: routeHref,
        hrefLabel: "See the suggestion",
        chips: [
          chip(demoStep.signalTag || demoStep.signal || "memory-backed", "mastery"),
          chip(countLabel((companion.citedFacts || []).length, "cited fact", "cited facts"), "pass"),
          chip(companion.fingerprint || "companion receipt", "")
        ]
      },
      {
        title: "Try the suggested practice",
        copy: "The suggestion opens a short session with a goal, one focused task, useful feedback, and a clear finish.",
        href: localPageHref(route.href || "dashboard.html?demo=learner"),
        hrefLabel: "Try the practice",
        chips: [
          chip(session.status || "ready", "pass"),
          chip(countLabel((session.steps || []).length, "guided step", "guided steps"), "mastery"),
          chip(session.fingerprint || "guided trace", "")
        ]
      },
      {
        title: "Come back without losing your place",
        copy: "After the session, Platå remembers which step was finished and shows what to do next. The example still cannot change your own progress.",
        href: localPageHref(journey.exit || "dashboard.html?demo=learner#due"),
        hrefLabel: "See the return",
        chips: [
          chip(journey.traceId || "journey trace", "pass"),
          chip((journey.totals && journey.totals.storageWrites || 0) + " storage writes", journey.totals && journey.totals.storageWrites ? "fail" : "pass"),
          linkChip(proofSources.journey, "evaluator-journey.json", "pass")
        ]
      },
      {
        title: "See what changed",
        copy: "The completed session leaves a small, portable result: what you practised, what you finished, and what should come next.",
        href: localReportHref("reports/guided-session.json"),
        hrefLabel: "Open the exact result",
        chips: [
          chip(receiptFingerprint || "receipt fingerprint", "pass"),
          chip(countLabel((receipt.citedFacts || []).length, "cited fact", "cited facts"), "mastery"),
          chip(countLabel(ledger.totals && ledger.totals.outcomes || 0, "stored outcome", "stored outcomes"), "pass")
        ]
      },
      {
        title: "Open the checks if you are curious",
        copy: "The same journey is tested before publication. The detailed reports and source files stay public for anyone who wants to verify the claim.",
        href: proofSources.capabilities,
        hrefLabel: "Open the technical map",
        chips: [
          proofGates,
          chip("check:evaluator-journey", "pass"),
          linkChip(localPageHref("quality.html"), "Quality report", "pass"),
          linkChip(proofSources.health, "project-health.json", "pass"),
          sourceChip("shared/plata-guided-session.js", "guided source")
        ]
      }
    ];

    var stepHtml = steps.map(function (item, index) {
      return "<article class=\"proof-walkthrough-step\">" +
        "<div class=\"proof-walkthrough-number\">" + escapeHtml(index + 1) + "</div>" +
        "<div>" +
          "<h3>" + escapeHtml(item.title) + "</h3>" +
          "<p>" + escapeHtml(item.copy) + "</p>" +
          "<a class=\"program-chip mastery\" href=\"" + escapeHtml(item.href) + "\">" + escapeHtml(item.hrefLabel) + "</a>" +
          "<details class=\"headroom-appendix\"><summary>Technical evidence</summary><div class=\"program-proof-strip\">" + item.chips.join("") + "</div></details>" +
        "</div>" +
      "</article>";
    }).join("");

    var distributionHref = localPageHref("proof.html#proof-distribution-title");
    $("#proof-walkthrough").innerHTML =
      "<nav class=\"proof-reviewer-route\" aria-label=\"Reviewer path at a glance\">" +
        linkChip(dashboardHref, "1 · Example learner", "mastery") +
        linkChip(routeHref, "2 · One suggestion", "pass") +
        linkChip(localPageHref(route.href || "dashboard.html?demo=learner"), "3 · Short practice", "pass") +
        linkChip(distributionHref, "4 · Works offline", "pass") +
        linkChip(localPageHref("quality.html"), "5 · Lesson checks", "pass") +
        linkChip(proofSources.capabilities, "6 · Technical map", "pass") +
      "</nav>" +
      "<article class=\"proof-walkthrough-summary " + escapeHtml(data.guided.status === "pass" && demo.status === "pass" && journey.status === "pass" ? "pass" : "fail") + "\">" +
        "<div>" +
          "<span class=\"quality-key\">One complete example</span>" +
          "<h3>From one suggestion to a useful result</h3>" +
          "<p>Follow the human story first. The exact reports behind every step remain available when you want to inspect them.</p>" +
        "</div>" +
        "<details class=\"headroom-appendix\"><summary>See exact journey data</summary>" +
          "<div class=\"program-proof-strip\">" +
            chip(countLabel(demoPlan.steps && demoPlan.steps.length || 0, "plan step", "plan steps"), "mastery") +
            chip(journey.traceId || "journey trace", "pass") +
            chip(countLabel(journey.totals && journey.totals.stages || 0, "journey stage", "journey stages"), "pass") +
            chip(countLabel(data.guided.totals && data.guided.totals.outcomeReceipts || 0, "outcome receipt", "outcome receipts"), "pass") +
            chip(countLabel((data.guided.scenarios || []).length, "guided scenario", "guided scenarios"), "") +
          "</div>" +
        "</details>" +
      "</article>" +
      "<div class=\"proof-walkthrough-steps\">" + stepHtml + "</div>";
  }

  function renderEvaluatorPath(data) {
    var evaluator = data.evaluator || {};
    var entry = evaluator.entry || {};
    var links = entry.links || [];
    var routes = evaluator.routeTargets || [];
    var reports = evaluator.backingReports || {};
    var demo = reports.demoLearner || {};
    var guided = reports.guidedSession || {};
    var capability = reports.capabilityMap || {};
    var issues = evaluator.issues || [];
    var gates = capability.proofSurfaceGates || [];
    var reportIds = capability.proofSurfaceReports || [];
    var routeLinks = routes.map(function (route) {
      var label = route.targetHash ? route.targetFile + route.targetHash : route.href;
      return linkChip(localPageHref(route.href), label, route.targetExists && route.hashTargetExists ? "pass" : "fail");
    }).join("");
    var gateChips = [
      chip(gates.indexOf("check:evaluator-path") !== -1 ? "check:evaluator-path" : "missing evaluator gate", gates.indexOf("check:evaluator-path") !== -1 ? "pass" : "fail"),
      chip(gates.indexOf("check:proof-page") !== -1 ? "check:proof-page" : "missing proof-page gate", gates.indexOf("check:proof-page") !== -1 ? "pass" : "fail"),
      chip(reportIds.indexOf("evaluator-path") !== -1 ? "public report cited" : "report citation missing", reportIds.indexOf("evaluator-path") !== -1 ? "pass" : "fail")
    ].join("");

    $("#proof-evaluator").innerHTML =
      "<article class=\"proof-guided-card " + escapeHtml(evaluator.status === "pass" ? "pass" : "fail") + "\">" +
        "<div class=\"quality-card-head\"><span class=\"quality-key\">" + escapeHtml(evaluator.status || "unknown") + "</span><a class=\"quality-state\" href=\"" + escapeHtml(proofSources.evaluator) + "\">report</a></div>" +
        "<h3>First-visit evaluator path</h3>" +
        "<p>The home CTA is checked as a real route: evaluator section, read-only demo learner, proof walkthrough, and guided proof target.</p>" +
        "<div class=\"program-proof-strip\">" +
          chip(countLabel(links.length, "link", "links"), "mastery") +
          chip(countLabel(routes.length, "route target", "route targets"), "pass") +
          chip(countLabel(issues.length, "issue", "issues"), issues.length ? "fail" : "pass") +
          linkChip(proofSources.evaluator, "evaluator-path.json", "pass") +
        "</div>" +
      "</article>" +
      "<article class=\"proof-guided-card " + escapeHtml(demo.status === "pass" && demo.storageWrites === 0 ? "pass" : "fail") + "\">" +
        "<div class=\"quality-card-head\"><span class=\"quality-key\">" + escapeHtml(demo.status || "unknown") + "</span><a class=\"quality-state\" href=\"" + escapeHtml(localPageHref(demo.url || "dashboard.html?demo=learner")) + "\">demo</a></div>" +
        "<h3>Read-only demo entry</h3>" +
        "<p>The evaluator can inspect personalization without writing visitor progress or requiring an account.</p>" +
        "<div class=\"program-proof-strip\">" +
          chip((demo.storageWrites || 0) + " storage writes", demo.storageWrites ? "fail" : "pass") +
          chip(countLabel(demo.visibleMemoryFacts || 0, "memory fact", "memory facts"), "mastery") +
          chip(demo.planKind || "plan", "") +
        "</div>" +
      "</article>" +
      "<article class=\"proof-guided-card " + escapeHtml(guided.status === "pass" ? "pass" : "fail") + "\">" +
        "<div class=\"quality-card-head\"><span class=\"quality-key\">" + escapeHtml(guided.status || "unknown") + "</span><a class=\"quality-state\" href=\"" + escapeHtml(proofSources.guided) + "\">guided proof</a></div>" +
        "<h3>Guided proof backing</h3>" +
        "<p>The route is backed by the memory-based guided scenario and at least one portable outcome receipt.</p>" +
        "<div class=\"program-proof-strip\">" +
          chip(guided.memoryBackedStatus || "memory-backed", guided.memoryBackedStatus === "pass" ? "pass" : "") +
          chip(countLabel(guided.outcomeReceipts || 0, "outcome receipt", "outcome receipts"), guided.outcomeReceipts ? "pass" : "fail") +
          chip(guided.memoryBackedFingerprint || "guided fingerprint", "") +
        "</div>" +
      "</article>" +
      "<article class=\"proof-guided-card " + escapeHtml(capability.status === "pass" ? "pass" : "fail") + "\">" +
        "<div class=\"quality-card-head\"><span class=\"quality-key\">" + escapeHtml(capability.status || "unknown") + "</span><a class=\"quality-state\" href=\"" + escapeHtml(proofSources.capabilities) + "\">capability</a></div>" +
        "<h3>Route targets and backing gates</h3>" +
        "<p>The public proof capability must cite the evaluator gate and the published report before this page passes.</p>" +
        "<div class=\"program-proof-block\"><strong>Targets</strong><div>" + routeLinks + "</div></div>" +
        "<div class=\"program-proof-block\"><strong>Proof</strong><div>" + gateChips + "</div></div>" +
      "</article>";
  }

  function findById(items, id) {
    return (items || []).filter(function (item) { return item.id === id; })[0] || null;
  }

  function findGate(health, gateId) {
    return findById(health && health.gates, gateId) || null;
  }

  function renderDistribution(data) {
    var container = $("#proof-distribution");
    if (!container) return;
    var gate = findGate(data.health, "check:distribution");
    var gatePass = gate && gate.status === "pass";
    var entryChips = distributionProof.requiredEntries.map(function (entry) {
      return chip(entry, "pass");
    }).join("");
    container.innerHTML =
      "<article class=\"proof-guided-card " + escapeHtml(gatePass ? "pass" : "fail") + "\">" +
        "<div class=\"quality-card-head\"><span class=\"quality-key\">" + escapeHtml(gatePass ? "pass" : "fail") + "</span><span class=\"quality-state\">publish gate</span></div>" +
        "<h3>Offline ZIP bundle</h3>" +
        "<p>`" + escapeHtml(distributionProof.zipPath) + "` packages the built Pages artifact (~" + escapeHtml(distributionProof.fileCount) + " files) as a backend-free, PWA-ready static site. Unzip anywhere and open `index.html` — no account, API, or build step required on the reviewer machine.</p>" +
        "<div class=\"program-proof-strip\">" +
          chip("v" + distributionProof.version, "mastery") +
          chip(countLabel(distributionProof.fileCount, "file", "files"), "pass") +
          chip("no backend", "pass") +
          chip("PWA-ready", "pass") +
          chip(gate ? gate.id : "check:distribution", gatePass ? "pass" : "fail") +
        "</div>" +
      "</article>" +
      "<article class=\"proof-guided-card pass\">" +
        "<div class=\"quality-card-head\"><span class=\"quality-key\">manifest</span><span class=\"quality-state\">checked</span></div>" +
        "<h3>What the smoke verifies</h3>" +
        "<p>The distribution gate rebuilds or reuses `" + escapeHtml(distributionProof.manifestPath) + "` with version, file count, and SHA-256 of the ZIP. Extracting the archive must include the service worker shell and core public reports.</p>" +
        "<div class=\"program-proof-block\"><strong>Required entries</strong><div class=\"program-proof-strip\">" + entryChips + "</div></div>" +
        "<div class=\"program-proof-block\"><strong>Build locally</strong><div class=\"program-proof-strip\">" +
          chip("npm run build:distribution", "mastery") +
          chip("npm run check:distribution", "pass") +
        "</div></div>" +
      "</article>" +
      "<article class=\"proof-guided-card pass\">" +
        "<div class=\"quality-card-head\"><span class=\"quality-key\">contract</span><span class=\"quality-state\">" + escapeHtml(gate && gate.category || "publish") + "</span></div>" +
        "<h3>Why reviewers care</h3>" +
        "<p>" + escapeHtml(gate && gate.contract || "Offline ZIP distribution bundle packages the Pages artifact for backend-free operation.") + "</p>" +
        "<div class=\"program-proof-strip\">" +
          sourceChip("scripts/build-distribution-bundle.js", "bundle builder") +
          sourceChip("scripts/smoke-distribution-bundle.js", "distribution smoke") +
          linkChip(proofSources.health, "project-health.json", "pass") +
        "</div>" +
      "</article>";
  }

  function sourceChip(path, label) {
    return linkChip(repoBase + encodeURIComponent(path).replace(/%2F/g, "/"), label || shortPath(path), "");
  }

  function renderCapabilityMatrix(data) {
    var capabilities = data.capabilities.capabilities || [];
    var totals = data.capabilities.totals || {};
    var summary = "<article class=\"proof-capability-summary " + escapeHtml(data.capabilities.status || "fail") + "\">" +
      "<div>" +
        "<span class=\"quality-key\">" + escapeHtml(data.capabilities.status || "unknown") + "</span>" +
        "<h3>" + escapeHtml(countLabel(totals.capabilities || capabilities.length, "capability", "capabilities")) + " traced from product claim to source</h3>" +
        "<p>The matrix is generated from the same capability map JSON that CI validates and GitHub Pages publishes.</p>" +
      "</div>" +
      "<div class=\"program-proof-strip\">" +
        chip(countLabel(totals.proofGates || 0, "gate", "gates"), "mastery") +
        chip(countLabel(totals.publicReports || 0, "public report", "public reports"), "") +
        chip(countLabel(totals.sourcePaths || 0, "source path", "source paths"), "") +
        linkChip(proofSources.capabilities, "open capabilities.json", "pass") +
      "</div>" +
    "</article>";
    var rows = capabilities.map(function (capability) {
      var gates = capability.proofGates || [];
      var reports = capability.publicReports || [];
      var sources = capability.sourcePaths || [];
      var statusClass = capability.status === "pass" ? "pass" : "fail";
      var gateChips = gates.slice(0, 3).map(function (gate) {
        return chip(gateLabel(gate.id), gate.status === "pass" ? "pass" : "fail");
      }).join("") + (gates.length > 3 ? chip("+" + (gates.length - 3) + " gates", "") : "");
      var reportLinks = reports.slice(0, 3).map(function (report) {
        return linkChip(localReportHref(report.pagesPath), report.id, report.status === "pass" ? "pass" : "fail");
      }).join("") || chip("no public report", "fail");
      var sourceLinks = sources.slice(0, 2).map(function (source) {
        return sourceChip(source.path, shortPath(source.path));
      }).join("") + (sources.length > 2 ? chip("+" + (sources.length - 2) + " sources", "") : "");
      var contract = (capability.contracts || [])[0] || capability.userValue || capability.id;

      return "<article class=\"proof-capability-row " + escapeHtml(statusClass) + "\">" +
        "<div class=\"proof-capability-main\">" +
          "<div class=\"quality-card-head\"><span class=\"quality-key\">" + escapeHtml(capability.stage || "shipped") + "</span><span class=\"quality-state\">" + escapeHtml(capability.id) + "</span></div>" +
          "<h3>" + escapeHtml(capability.title || capability.id) + "</h3>" +
          "<p>" + escapeHtml(capability.userValue || "") + "</p>" +
          "<p class=\"proof-capability-contract\">" + escapeHtml(contract) + "</p>" +
        "</div>" +
        "<div class=\"proof-capability-cell\"><strong>Gates</strong><div class=\"program-proof-strip\">" + gateChips + "</div></div>" +
        "<div class=\"proof-capability-cell\"><strong>Reports</strong><div class=\"program-proof-strip\">" + reportLinks + "</div></div>" +
        "<div class=\"proof-capability-cell\"><strong>Source</strong><div class=\"program-proof-strip\">" + sourceLinks + "</div></div>" +
      "</article>";
    }).join("");

    $("#proof-capability-matrix").innerHTML = summary + rows;
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
      "<pre class=\"proof-summary-preview\" tabindex=\"0\" aria-label=\"Review summary preview\">" + summaryLines + "</pre>" +
      "<div class=\"hero-actions\">" +
        linkChip(proofSources.review, "Open full review JSON", "mastery") +
        linkChip(proofSources.summary, "Open capped Markdown", "") +
      "</div>";
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
    } catch (error) {
      // Invalid external hashes should not break the proof page render.
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

  if (typeof window.addEventListener === "function") {
    window.addEventListener("hashchange", restoreHashScroll);
  }

  function renderError(error) {
    $("#proof-status").textContent = "Unavailable";
    $("#proof-status").className = "quality-fail";
    var headroom = $("#proof-headroom");
    if (headroom) {
      headroom.hidden = true;
      headroom.innerHTML = "";
    }
    $("#proof-summary").innerHTML = "<li><span>Proof</span><strong>missing</strong></li>";
    $("#proof-generated").textContent = error.message || "Could not load proof reports";
    $("#proof-digest").innerHTML = "<article class=\"proof-digest-card fail\"><h3>Proof digest missing</h3><p>Run npm run build:pages to generate reports/proof-digest.json.</p></article>";
    $("#proof-walkthrough").innerHTML = "";
    $("#proof-evaluator").innerHTML = "";
    $("#proof-artifacts").innerHTML = "<article class=\"proof-command-card fail\"><h3>Proof artifacts missing</h3><p>Run npm run build:pages to generate reports.</p></article>";
    $("#proof-surfaces").innerHTML = "";
    var distribution = $("#proof-distribution");
    if (distribution) distribution.innerHTML = "";
    $("#proof-capability-matrix").innerHTML = "";
    $("#proof-guided").innerHTML = "";
    $("#proof-health").innerHTML = "";
    $("#proof-review").innerHTML = "";
  }

  Promise.all([
    loadJson(proofSources.digest),
    loadJson(proofSources.demo),
    loadJson(proofSources.evaluator),
    loadJson(proofSources.journey),
    loadJson(proofSources.portability),
    loadJson(proofSources.exerciseValue),
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
      evaluator: values[2],
      journey: values[3],
      portability: values[4],
      exerciseValue: values[5],
      guided: values[6],
      capabilities: values[7],
      health: values[8],
      quickstart: values[9],
      review: values[10],
      summary: values[11]
    };
    renderSummary(data);
    renderProofHeadroom(data);
    renderDigest(data);
    renderProofWalkthrough(data);
    renderEvaluatorPath(data);
    renderArtifacts(data);
    renderSurfaces(data);
    renderDistribution(data);
    renderCapabilityMatrix(data);
    renderGuidedContract(data);
    renderHealth(data);
    renderReview(data);
    restoreHashScroll();
  }).catch(renderError);
})();

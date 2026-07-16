/* Platå repair bridge v1 — narrative miss → scene repair + drill (Match → Gym) */
(function (root) {
  "use strict";

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[ch];
    });
  }

  function normaliseTags(tags) {
    if (!tags) return [];
    if (!Array.isArray(tags)) tags = [tags];
    var seen = {};
    var out = [];
    tags.forEach(function (tag) {
      if (tag === undefined || tag === null) return;
      var s = String(tag).trim();
      if (!s || seen[s]) return;
      seen[s] = true;
      out.push(s);
    });
    return out;
  }

  function masteryKeys(lesson) {
    return lesson && lesson.masteryMap ? Object.keys(lesson.masteryMap) : [];
  }

  function resolveMissSignal(lesson, scene, option) {
    if (!lesson || !scene) return "";
    if (option && option.correct) return "";
    var allowed = masteryKeys(lesson);
    var candidates = normaliseTags((scene.masteryTags || []).concat(option && option.weakTags || []));
    for (var i = 0; i < candidates.length; i++) {
      if (allowed.indexOf(candidates[i]) !== -1) return candidates[i];
    }
    if (scene.masteryTags && scene.masteryTags.length && allowed.indexOf(scene.masteryTags[0]) !== -1) {
      return scene.masteryTags[0];
    }
    return "";
  }

  function prefixHref(href, rootPrefix) {
    var raw = String(href || "");
    if (!raw || raw.indexOf("http") === 0 || raw.indexOf("#") === 0) return raw;
    if (raw.indexOf("./") === 0) return String(rootPrefix || "") + raw.slice(2);
    return raw;
  }

  function sceneRepairHref(signalTag, sceneId, lessonPath) {
    if (!signalTag || !sceneId) return "";
    var query = "?mode=repair&signal=" + encodeURIComponent(signalTag) + "#" + encodeURIComponent(sceneId);
    if (!lessonPath) return query;
    var base = String(lessonPath);
    if (base.slice(-1) !== "/") base += "/";
    return base + query;
  }

  function remediationBundle(lesson, scene, signalTag, rootPrefix) {
    if (!lesson || !signalTag || !lesson.masteryMap || !lesson.masteryMap[signalTag]) return null;
    var spec = lesson.masteryMap[signalTag];
    var remediation = spec.remediation || {};
    var sceneId = remediation.sceneId || (scene && scene.id) || "";
    var catalog = root.PlataCatalog;
    var lessonPath = catalog && catalog.lessonPathById ? catalog.lessonPathById(lesson.id || "") : (lesson.path || "");
    var bundle = {
      signalTag: signalTag,
      label: spec.label || signalTag,
      sceneRepair: {
        kind: "scene",
        cta: remediation.cta || "Replay the scene",
        action: remediation.action || "Replay this scene while the signal is still fresh.",
        href: prefixHref(sceneRepairHref(signalTag, sceneId, lessonPath), rootPrefix || "")
      },
      drillRepair: null,
      vocabRepair: null
    };
    if (catalog && catalog.drillRemediation) {
      var drill = catalog.drillRemediation(signalTag, lesson.id || "");
      if (drill) {
        bundle.drillRepair = Object.assign({}, drill, {
          href: prefixHref(drill.href, rootPrefix || "")
        });
      }
    }
    // No auto-prescribed vocab on the English flagship path.
    return bundle;
  }

  function renderMissRepairContent(bundle) {
    if (!bundle) return "";
    var hasDrill = !!(bundle.drillRepair && bundle.drillRepair.href);
    var parts = [
      "<p class='eyebrow'>Your correction</p>",
      "<h3>Practise: " + escapeHtml(bundle.label) + "</h3>",
      "<p class='miss-repair-copy'>" + (hasDrill
        ? "Retry this moment now, or use the short focused drill while the correction is fresh."
        : "Retry this moment while the correction is fresh.") + "</p>"
    ];
    if (hasDrill) {
      parts.push(
        "<div class='miss-repair-actions'>",
        "<a class='btn primary link-button' href='" + escapeHtml(bundle.drillRepair.href) + "'>" +
          escapeHtml(bundle.drillRepair.trainerIcon || "") + " " + escapeHtml(bundle.drillRepair.cta || "Open drill") +
        "</a>"
      );
      if (bundle.sceneRepair && bundle.sceneRepair.href) {
        parts.push(
          "<a class='ghost btn link-button' href='" + escapeHtml(bundle.sceneRepair.href) + "'>" +
            escapeHtml(bundle.sceneRepair.cta || "Replay the scene") +
          "</a>"
        );
      }
      parts.push("</div>");
      if (bundle.drillRepair.action) {
        parts.push("<p class='miss-repair-meta'><strong>Focused practice:</strong> " + escapeHtml(bundle.drillRepair.action) + "</p>");
      }
    } else if (bundle.sceneRepair && bundle.sceneRepair.href) {
      parts.push(
        "<div class='miss-repair-actions'>",
        "<a class='btn primary link-button' href='" + escapeHtml(bundle.sceneRepair.href) + "'>" +
          escapeHtml(bundle.sceneRepair.cta || "Replay the scene") +
        "</a>",
        "</div>"
      );
      if (bundle.sceneRepair.action) {
        parts.push("<p class='miss-repair-meta'><strong>Try this:</strong> " + escapeHtml(bundle.sceneRepair.action) + "</p>");
      }
    }
    return parts.join("");
  }

  function renderMissRepairPanel(options) {
    options = options || {};
    var bundle = remediationBundle(options.lesson, options.scene, options.signalTag, options.rootPrefix);
    if (!bundle) return "";
    return "<aside class='miss-repair-panel' id='miss-repair-panel' aria-label='Practice this correction' aria-live='polite'>" +
      renderMissRepairContent(bundle) +
      "</aside>";
  }

  function planStepFromBundle(bundle, lesson, number) {
    if (!bundle || !lesson) return null;
    if (number === 1 && bundle.sceneRepair) {
      return {
        number: 1,
        kind: "repair",
        targetKind: "repair",
        trainerId: lesson.id || "",
        signalTag: bundle.signalTag,
        trainerName: lesson.title || lesson.id || "Lesson",
        title: "Repair " + (bundle.label || bundle.signalTag),
        copy: bundle.sceneRepair.action || "Replay the source scene while the signal is still fresh.",
        primaryLabel: bundle.sceneRepair.cta || "Open repair scene",
        primaryHref: bundle.sceneRepair.href,
        minutes: "4-6 min",
        trace: {
          source: "repairBridge",
          rule: "miss.repair.scene",
          inputs: { signalTag: bundle.signalTag, lessonId: lesson.id || "" }
        }
      };
    }
    if (bundle.drillRepair && (number === 2 || number === 1)) {
      return {
        number: number,
        kind: "drill-repair",
        targetKind: "drill",
        trainerId: bundle.drillRepair.drillId || "",
        signalTag: bundle.signalTag,
        trainerName: bundle.drillRepair.trainerName || "Drill repair",
        trainerIcon: bundle.drillRepair.trainerIcon || "",
        badge: "Gym",
        title: bundle.drillRepair.cta || "Run drill repair",
        copy: bundle.drillRepair.action || "",
        primaryLabel: bundle.drillRepair.cta || "Open drill",
        primaryHref: bundle.drillRepair.href,
        minutes: "5-8 min",
        trace: {
          source: "repairBridge",
          rule: "miss.repair.drill",
          inputs: { signalTag: bundle.signalTag, drillId: bundle.drillRepair.drillId || "" }
        }
      };
    }
    return null;
  }

  function persistMissPlan(options) {
    options = options || {};
    var planner = root.PlataPlanner;
    if (!planner || !planner.savePracticePlan) return null;
    var lesson = options.lesson;
    var scene = options.scene;
    var signalTag = options.signalTag;
    if (!lesson || !signalTag) return null;
    var bundle = remediationBundle(lesson, scene, signalTag, options.rootPrefix || "../../");
    if (!bundle) return null;
    var steps = [];
    var sceneStep = planStepFromBundle(bundle, lesson, 1);
    if (sceneStep) steps.push(sceneStep);
    if (bundle.drillRepair) {
      var drillStep = planStepFromBundle(bundle, lesson, steps.length + 1);
      if (drillStep) steps.push(drillStep);
    }
    if (!steps.length) return null;
    return planner.savePracticePlan({
      kind: "repair",
      title: "Practice this correction",
      copy: "Retry the lesson moment, then use the focused drill if one is available.",
      steps: steps,
      primaryStep: steps[0],
      meta: steps.length + " focused practice step" + (steps.length === 1 ? "" : "s") + " from this lesson."
    });
  }

  function mountMissRepairPanel(ctx, scene, option) {
    if (!ctx || !scene) return null;
    var signalTag = resolveMissSignal(ctx.lesson, scene, option);
    if (!signalTag) return null;
    var bundle = remediationBundle(ctx.lesson, scene, signalTag, ctx.rootPrefix || "../../");
    if (!bundle) return null;
    var html = renderMissRepairContent(bundle);
    var feedback = ctx.sceneEl && ctx.sceneEl.querySelector
      ? ctx.sceneEl.querySelector("#feedback")
      : (typeof document !== "undefined" && document.querySelector ? document.querySelector("#feedback") : null);
    var doc = typeof document !== "undefined" ? document : null;
    if (doc && doc.createElement) {
      var panel = doc.createElement("aside");
      panel.id = "miss-repair-panel";
      panel.className = "miss-repair-panel";
      panel.setAttribute && panel.setAttribute("aria-label", "Practice this correction");
      panel.setAttribute && panel.setAttribute("aria-live", "polite");
      panel.innerHTML = html;
      if (feedback && feedback.parentNode && typeof feedback.parentNode.insertBefore === "function") {
        var existing = feedback.parentNode.querySelector && feedback.parentNode.querySelector("#miss-repair-panel");
        if (existing && existing.remove) existing.remove();
        feedback.parentNode.insertBefore(panel, feedback.nextSibling);
      } else if (ctx.sceneEl && typeof ctx.sceneEl.appendChild === "function") {
        var stale = ctx.sceneEl.querySelector && ctx.sceneEl.querySelector("#miss-repair-panel");
        if (stale && stale.remove) stale.remove();
        ctx.sceneEl.appendChild(panel);
      }
    }
    persistMissPlan({
      lesson: ctx.lesson,
      scene: scene,
      signalTag: signalTag,
      rootPrefix: ctx.rootPrefix || "../../"
    });
    return signalTag;
  }

  root.PlataRepairBridge = {
    resolveMissSignal: resolveMissSignal,
    remediationBundle: remediationBundle,
    renderMissRepairPanel: renderMissRepairPanel,
    persistMissPlan: persistMissPlan,
    mountMissRepairPanel: mountMissRepairPanel,
    prefixHref: prefixHref,
    sceneRepairHref: sceneRepairHref
  };
})(typeof window !== "undefined" ? window : globalThis);

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

  function sceneRepairHref(signalTag, sceneId) {
    if (!signalTag || !sceneId) return "";
    return "?mode=repair&signal=" + encodeURIComponent(signalTag) + "#" + encodeURIComponent(sceneId);
  }

  function remediationBundle(lesson, scene, signalTag, rootPrefix) {
    if (!lesson || !signalTag || !lesson.masteryMap || !lesson.masteryMap[signalTag]) return null;
    var spec = lesson.masteryMap[signalTag];
    var remediation = spec.remediation || {};
    var sceneId = remediation.sceneId || (scene && scene.id) || "";
    var catalog = root.PlataCatalog;
    var bundle = {
      signalTag: signalTag,
      label: spec.label || signalTag,
      sceneRepair: {
        kind: "scene",
        cta: remediation.cta || "Review scene",
        action: remediation.action || "",
        href: sceneRepairHref(signalTag, sceneId)
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
    if (catalog && catalog.buildVocabRemediation && scene && scene.id) {
      var vocab = catalog.buildVocabRemediation(lesson.id || "", scene.id);
      if (vocab) {
        bundle.vocabRepair = Object.assign({}, vocab, {
          href: prefixHref(vocab.href, rootPrefix || "")
        });
      }
    }
    return bundle;
  }

  function renderMissRepairPanel(options) {
    options = options || {};
    var bundle = remediationBundle(options.lesson, options.scene, options.signalTag, options.rootPrefix);
    if (!bundle) return "";
    var parts = [
      "<aside class='miss-repair-panel' id='miss-repair-panel' aria-label='Prescribed repair after narrative miss'>",
      "<p class='eyebrow'>Match → Gym</p>",
      "<h3>Repair " + escapeHtml(bundle.label) + "</h3>",
      "<p class='miss-repair-copy'>You missed this signal in the scene. The reflex gap is saved to your local plan — run the drill, then return to the repair scene if needed.</p>"
    ];
    if (bundle.drillRepair && bundle.drillRepair.href) {
      parts.push(
        "<div class='miss-repair-actions'>",
        "<a class='btn primary link-button' href='" + escapeHtml(bundle.drillRepair.href) + "'>" +
          escapeHtml(bundle.drillRepair.trainerIcon || "") + " " + escapeHtml(bundle.drillRepair.cta || "Open drill") +
        "</a>"
      );
      if (bundle.sceneRepair && bundle.sceneRepair.href) {
        parts.push(
          "<a class='ghost btn link-button' href='" + escapeHtml(bundle.sceneRepair.href) + "'>" +
            escapeHtml(bundle.sceneRepair.cta || "Review scene") +
          "</a>"
        );
      }
      if (bundle.vocabRepair && bundle.vocabRepair.href) {
        parts.push(
          "<a class='ghost btn link-button' href='" + escapeHtml(bundle.vocabRepair.href) + "'>" +
            escapeHtml(bundle.vocabRepair.cta || "Review vocabulary") +
          "</a>"
        );
      }
      parts.push("</div>");
      if (bundle.drillRepair.action) {
        parts.push("<p class='miss-repair-meta'>" + escapeHtml(bundle.drillRepair.action) + "</p>");
      }
    } else if (bundle.sceneRepair && bundle.sceneRepair.href) {
      parts.push(
        "<div class='miss-repair-actions'>",
        "<a class='btn primary link-button' href='" + escapeHtml(bundle.sceneRepair.href) + "'>" +
          escapeHtml(bundle.sceneRepair.cta || "Open repair scene") +
        "</a>",
        "</div>"
      );
      if (bundle.sceneRepair.action) {
        parts.push("<p class='miss-repair-meta'>" + escapeHtml(bundle.sceneRepair.action) + "</p>");
      }
    }
    parts.push("</aside>");
    return parts.join("");
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
      title: "Repair plan",
      copy: "A narrative miss opened this route: repair the scene, then run the mapped reflex drill.",
      steps: steps,
      primaryStep: steps[0],
      meta: steps.length + " step repair route from narrative miss."
    });
  }

  function mountMissRepairPanel(ctx, scene, option) {
    if (!ctx || !scene) return null;
    var signalTag = resolveMissSignal(ctx.lesson, scene, option);
    if (!signalTag) return null;
    var html = renderMissRepairPanel({
      lesson: ctx.lesson,
      scene: scene,
      signalTag: signalTag,
      rootPrefix: ctx.rootPrefix || "../../"
    });
    if (!html) return null;
    var feedback = ctx.sceneEl && ctx.sceneEl.querySelector
      ? ctx.sceneEl.querySelector("#feedback")
      : (typeof document !== "undefined" && document.querySelector ? document.querySelector("#feedback") : null);
    var doc = typeof document !== "undefined" ? document : null;
    if (doc && doc.createElement) {
      var panel = doc.createElement("aside");
      panel.id = "miss-repair-panel";
      panel.className = "miss-repair-panel";
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

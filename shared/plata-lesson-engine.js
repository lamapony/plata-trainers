/* Platå shared lesson engine v1
 *
 * Reusable engine for narrative lessons (A0–B2).
 * Handles: scene rendering, variable tracking, consequence system,
 * kernel integration, navigation, reset.
 *
 * Each lesson provides a data object via window.PLATA_LESSON_*.
 * The engine auto-discovers the first PLATA_LESSON_* on the page
 * or accepts an explicit lesson object.
 *
 * Scene types: choice, input, match, completion
 * Optional: variables (social state), endings (consequence system)
 *
 * Usage in lesson app.js:
 *   PlataLessonEngine.run();  // auto-discover
 *   PlataLessonEngine.run(window.PLATA_LESSON_B2_RADIATOR);  // explicit
 */
(function (root) {
  "use strict";

  /* ---- DOM helpers ---- */
  function $(sel) { return document.querySelector(sel); }
  function escapeHtml(str) {
    return String(str || "").replace(/[&<>'"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[c];
    });
  }
  function correctLabel(options) {
    for (var i = 0; i < options.length; i++) if (options[i].correct) return options[i].label;
    return "";
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
  function sceneAttemptTags(scene) {
    return normaliseTags((scene.tags || []).concat(scene.masteryTags || []));
  }

  /* ---- renderers registry ---- */
  var renderers = {};

  function registerRenderer(type, fn) {
    renderers[type] = fn;
  }

  /* ---- engine state ---- */
  function freshState(lesson) {
    var s = { index: 0, completed: {}, selectedLeft: null, attempts: {}, variables: {}, endingId: null, learnerText: "" };
    if (lesson.variables) {
      Object.keys(lesson.variables).forEach(function (k) { s.variables[k] = lesson.variables[k]; });
    }
    return s;
  }

  /* ---- variable helpers ---- */
  function applyEffects(state, effects) {
    if (!effects) return;
    Object.keys(effects).forEach(function (k) {
      if (state.variables.hasOwnProperty(k)) {
        state.variables[k] += effects[k];
      }
    });
  }

  function variableNameFromCondition(key) {
    var match = /^(min|max)([A-Z].*)$/.exec(key);
    if (!match) return null;
    return match[2].charAt(0).toLowerCase() + match[2].slice(1);
  }

  function endingRuleMatches(rule, variables) {
    if (!rule || typeof rule !== "object") return false;
    var keys = Object.keys(rule);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var variableName = variableNameFromCondition(key);
      if (!variableName || !variables.hasOwnProperty(variableName) || typeof rule[key] !== "number") return false;
      if (key.indexOf("min") === 0 && variables[variableName] < rule[key]) return false;
      if (key.indexOf("max") === 0 && variables[variableName] > rule[key]) return false;
    }
    return true;
  }

  function resolveEnding(lesson, state) {
    if (!lesson.endingLogic) return null;
    var logic = lesson.endingLogic;
    var variables = state.variables;
    var endings = lesson.endings || [];
    var endingIds = endings.length ? endings.map(function (ending) { return ending.id; }) : Object.keys(logic);
    for (var i = 0; i < endingIds.length; i++) {
      var id = endingIds[i];
      if (logic.hasOwnProperty(id) && endingRuleMatches(logic[id], variables)) return id;
    }
    return null;
  }

  function findEnding(lesson, id) {
    var endings = lesson.endings || [];
    for (var i = 0; i < endings.length; i++) {
      if (endings[i].id === id) return endings[i];
    }
    return endings[0] || null;
  }

  function sceneIndexFromHash(lesson) {
    if (!root.location || !root.location.hash) return 0;
    var id = "";
    try {
      id = decodeURIComponent(root.location.hash.slice(1));
    } catch (_) {
      id = root.location.hash.slice(1);
    }
    if (!id) return 0;
    return sceneIndexById(lesson, id);
  }

  function sceneIndexById(lesson, id) {
    for (var i = 0; i < lesson.scenes.length; i++) {
      if (lesson.scenes[i].id === id) return i;
    }
    return 0;
  }

  function syncSceneHash(lesson, state) {
    if (!root.location || !root.history || !lesson.scenes[state.index]) return;
    var next = "#" + encodeURIComponent(lesson.scenes[state.index].id);
    var url = (root.location.pathname || "") + (root.location.search || "") + next;
    if (root.location.hash !== next) root.history.replaceState(null, "", url);
  }

  function queryParam(name) {
    if (!root.location || !root.location.search) return "";
    var query = root.location.search.replace(/^\?/, "").split("&");
    for (var i = 0; i < query.length; i++) {
      var parts = query[i].split("=");
      var key = "";
      try {
        key = decodeURIComponent(parts[0] || "");
      } catch (_) {
        key = parts[0] || "";
      }
      if (key === name) {
        try {
          return decodeURIComponent((parts[1] || "").replace(/\+/g, " "));
        } catch (_) {
          return (parts[1] || "").replace(/\+/g, " ");
        }
      }
    }
    return "";
  }

  function repairContextFromLocation(lesson) {
    var mode = queryParam("mode");
    var signal = queryParam("signal");
    if (mode !== "repair" || !signal || !lesson.masteryMap || !lesson.masteryMap[signal]) return null;
    var spec = lesson.masteryMap[signal];
    var remediation = spec.remediation || {};
    var sceneId = remediation.sceneId || "";
    var scene = null;
    for (var i = 0; i < lesson.scenes.length; i++) {
      if (lesson.scenes[i].id === sceneId) {
        scene = lesson.scenes[i];
        break;
      }
    }
    if (!scene) return null;
    return {
      active: true,
      tag: signal,
      label: spec.label || signal,
      action: remediation.action || "",
      cta: remediation.cta || "Review scene",
      sceneId: sceneId
    };
  }

  /* ---- kernel integration ---- */
  function record(ctx, scene, correct, given, expected, option) {
    var tracker = ctx.tracker;
    if (!tracker || !ctx.kernel || !ctx.kernel.recordAttempt) return;
    var mode = ctx.state.repair && ctx.state.repair.active ? "repair" : "lesson";
    var tags = sceneAttemptTags(scene);
    if (!correct && option && option.weakTags) tags = normaliseTags(tags.concat(option.weakTags));
    if (!correct && Array.isArray(scene.vocabFocus)) {
      scene.vocabFocus.forEach(function (word) {
        var slug = String(word || "").trim().toLowerCase().replace(/\s+/g, "-");
        if (slug) tags.push("scene-vocab:" + slug);
      });
    }
    if (mode === "repair" && ctx.state.repair.tag) tags = normaliseTags(tags.concat(ctx.state.repair.tag));
    ctx.kernel.recordAttempt(tracker.state, {
      itemId: scene.id,
      correct: !!correct,
      tags: tags,
      mode: mode,
      expected: expected || "",
      given: given || ""
    });
    if (mode === "repair") {
      ctx.state.repair.attempted = true;
      ctx.state.repair.resolved = !!correct;
      if (correct && ctx.kernel.recordRepairClosure) {
        ctx.state.repair.closure = ctx.kernel.recordRepairClosure(tracker.state, {
          signal: ctx.state.repair.tag,
          itemId: scene.id,
          sceneId: scene.id,
          lessonId: ctx.lesson.id,
          label: ctx.state.repair.label,
          action: ctx.state.repair.action,
          sourceMode: "repair",
          correct: true
        });
      }
    }
    tracker.save();
  }

  function markRepairPlanStepComplete(ctx, scene) {
    if (!ctx || !scene || !ctx.state || !ctx.state.repair || !ctx.state.repair.active) return;
    if (!root.PlataPlanner || !root.PlataPlanner.markPracticePlanStepCompleted) return;
    root.PlataPlanner.markPracticePlanStepCompleted({
      trainerId: ctx.lesson.id,
      evidence: {
        reason: "repair-correct",
        mode: "repair",
        itemId: scene.id,
        sceneId: scene.id,
        trainerId: ctx.lesson.id,
        correct: true
      }
    });
    refreshPlanContext(ctx);
  }

  function refreshPlanContext(ctx) {
    if (!ctx || !ctx.sceneEl || !ctx.sceneEl.querySelector) return;
    if (!root.PlataNextStep || !root.PlataNextStep.renderPlanContext) return;
    var card = ctx.sceneEl.querySelector(".plan-context-card");
    if (!card) return;
    var html = root.PlataNextStep.renderPlanContext({
      trainerId: ctx.lesson.id,
      dashboardHref: "../../dashboard.html"
    });
    if (!html) return;
    if (card.outerHTML !== undefined) {
      card.outerHTML = html;
    } else {
      card.innerHTML = html;
    }
  }

  function repairResolved(ctx) {
    var repair = ctx.state.repair;
    if (!repair || !repair.active) return false;
    if (repair.resolved) return true;
    if (ctx.kernel && ctx.kernel.isSignalResolved && ctx.tracker) {
      return ctx.kernel.isSignalResolved(ctx.tracker.state, repair.tag);
    }
    return false;
  }

  function renderRepairClosure(ctx) {
    var repair = ctx.state.repair;
    if (!repair || !repair.active) return "";
    var resolved = repairResolved(ctx);
    var label = repair.label || repair.tag;
    var title = resolved ? "Repair closed: " + label : "Repair still open: " + label;
    var copy = resolved
      ? "This signal is retired from recommendations until a later miss reopens it."
      : "Answer the source scene correctly to retire this signal from your next-step queue.";
    var html = "<aside class='repair-closure " + (resolved ? "closed" : "open") + "'>";
    html += "<p class='eyebrow'>Repair status</p>";
    html += "<h3>" + escapeHtml(title) + "</h3>";
    html += "<p>" + escapeHtml(copy) + "</p>";
    if (repair.action) html += "<p class='repair-closure-action'>" + escapeHtml(repair.action) + "</p>";
    html += "</aside>";
    return html;
  }

  function markLessonPlanStepComplete(ctx, reason) {
    if (!root.PlataPlanner || !root.PlataPlanner.markPracticePlanStepCompleted) return;
    root.PlataPlanner.markPracticePlanStepCompleted({
      trainerId: ctx.lesson.id,
      evidence: {
        reason: reason || "lesson-complete",
        mode: ctx.state.repair && ctx.state.repair.active ? "repair" : "lesson",
        trainerId: ctx.lesson.id,
        correct: true
      }
    });
  }

  /* ---- renderers ---- */

  function renderDialogue(lines) {
    var html = "<div class='dialogue' aria-label='Scene dialogue'>";
    lines.forEach(function (line) {
      html += "<div class='dialogue-line'><span>" + escapeHtml(line.speaker) + "</span><p lang='da'>" + escapeHtml(line.line) + "</p></div>";
    });
    html += "</div>";
    return html;
  }

  function findComicPanel(lesson, scene) {
    var panels = lesson.comicStoryboard && lesson.comicStoryboard.panels || [];
    for (var i = 0; i < panels.length; i++) {
      if (panels[i].sceneId === scene.id) return panels[i];
    }
    return null;
  }

  function renderComicPanel(lesson, scene) {
    var panel = findComicPanel(lesson, scene);
    if (!panel || !panel.assetPath || panel.assetReady !== true) return "";
    return [
      "<figure class='scene-comic' data-comic-panel='" + escapeHtml(panel.id || scene.id) + "'>",
      "<img src='" + escapeHtml(panel.assetPath) + "' alt='" + escapeHtml(panel.alt || "") + "' loading='eager' decoding='async' />",
      "</figure>"
    ].join("");
  }

  function installComicImageFallback(container) {
    if (!container || typeof container.querySelectorAll !== "function") return;
    var images = container.querySelectorAll(".scene-comic img");
    images.forEach(function (image) {
      var figure = image.closest ? image.closest(".scene-comic") : null;
      function hideMissingComic() {
        if (figure) figure.hidden = true;
      }
      image.addEventListener("error", hideMissingComic);
      if (image.complete && !image.naturalWidth) hideMissingComic();
    });
  }

  function mergeVariableMap(custom, fallback) {
    var merged = {};
    Object.keys(fallback || {}).forEach(function (key) { merged[key] = fallback[key]; });
    Object.keys(custom || {}).forEach(function (key) { merged[key] = custom[key]; });
    return merged;
  }

  function variableLabels(lesson) {
    return mergeVariableMap(lesson.variableLabels, {
      landlordTension: "Udlejer",
      sofiaTrust: "Sofia",
      emilEscalation: "Emil",
      workplaceTrust: "Arbejde"
    });
  }

  function variableDescriptions(lesson) {
    return mergeVariableMap(lesson.variableDescriptions, {
      landlordTension: ["kept low — professional distance maintained", "noticeable — relationship strained", "high — conflict visible"],
      sofiaTrust: ["steady — she still trusts your judgement", "unchanged", "shaken — she distanced herself"],
      emilEscalation: ["neutral", "neutral", "neutral"],
      workplaceTrust: ["strong — you handled it with composure", "neutral", "weakened — you sounded too passive"]
    });
  }

  function renderVariables(lesson, state, varsEl) {
    if (!varsEl) return;
    var labels = variableLabels(lesson);
    var html = "";
    Object.keys(state.variables).forEach(function (k) {
      var v = state.variables[k];
      var cls = v > 0 ? "high" : v < 0 ? "low" : "neutral";
      html += "<span class=\"var-tag " + cls + "\">" + escapeHtml(labels[k] || k) + " " + (v > 0 ? "+" : "") + v + "</span>";
    });
    varsEl.innerHTML = html;
  }

  function renderRoute(lesson, state, routeEl, countEl, onNavigate) {
    routeEl.innerHTML = "";
    routeEl.hidden = false;
    lesson.scenes.forEach(function (scene, i) {
      var label = scene.eyebrow.split("·").pop().trim();
      var item = document.createElement("button");
      item.type = "button";
      item.className = "route-step" + (i === state.index ? " active" : "") + (state.completed[scene.id] ? " done" : "");
      if (item.setAttribute) {
        item.setAttribute("aria-label", "Scene " + (i + 1) + ": " + label);
        if (i === state.index) item.setAttribute("aria-current", "step");
      } else {
        item.ariaLabel = "Scene " + (i + 1) + ": " + label;
        if (i === state.index) item.ariaCurrent = "step";
      }
      item.innerHTML = "<span>" + String(i + 1).padStart(2, "0") + "</span><strong>" + escapeHtml(label) + "</strong>";
      item.addEventListener("click", function () { state.index = i; onNavigate(); });
      routeEl.appendChild(item);
    });
    countEl.textContent = "Scene " + (state.index + 1) + " of " + lesson.scenes.length;
  }

  function afterMiss(ctx, scene, option) {
    if (!ctx || !scene || (option && option.correct)) return;
    if (!root.PlataRepairBridge || !root.PlataRepairBridge.mountMissRepairPanel) return;
    root.PlataRepairBridge.mountMissRepairPanel(ctx, scene, option);
    refreshPlanContext(ctx);
  }

  /* ---- choice renderer ---- */
  function renderChoice(ctx, scene) {
    var body = $("#exercise-body");
    body.className = "choice-grid";
    scene.options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-card";
      btn.innerHTML = "<strong lang='da'>" + escapeHtml(opt.label) + "</strong><span>" + escapeHtml(opt.detail) + "</span>";
      btn.addEventListener("click", function () {
        var already = ctx.state.attempts[scene.id + opt.id];
        btn.classList.add(opt.correct ? "correct" : "wrong");
        $("#feedback").className = "feedback show " + (opt.correct ? "ok" : "warn");
        $("#feedback").textContent = opt.feedback;
        if (!already) {
          record(ctx, scene, opt.correct, opt.label, correctLabel(scene.options), opt);
          applyEffects(ctx.state, opt.effects);
          ctx.state.attempts[scene.id + opt.id] = true;
          if (!opt.correct) afterMiss(ctx, scene, opt);
        }
        if (opt.correct) {
          ctx.state.completed[scene.id] = true;
          markRepairPlanStepComplete(ctx, scene);
        }
        ctx.renderSidebar();
      });
      body.appendChild(btn);
    });
  }

  /* ---- input renderer ---- */
  function renderInput(ctx, scene) {
    var body = $("#exercise-body");
    body.innerHTML = "<label class='field-label' for='answer'>Your answer</label><input id='answer' class='text-input' lang='da' autocomplete='off' placeholder='" + escapeHtml(scene.placeholder) + "' /><button class='primary small' id='check' type='button'>Check</button>";
    $("#check").addEventListener("click", function () {
      var value = $("#answer").value.trim();
      var ok = value.toLowerCase().indexOf(scene.acceptPrefix) === 0 && value.length > scene.acceptPrefix.length;
      if (ok) ctx.state.learnerText = value.slice(scene.acceptPrefix.length).trim();
      $("#feedback").className = "feedback show " + (ok ? "ok" : "warn");
      $("#feedback").textContent = ok ? scene.success : scene.failure;
      record(ctx, scene, ok, value, scene.placeholder);
      if (!ok) afterMiss(ctx, scene, { correct: false });
      if (ok) {
        ctx.state.completed[scene.id] = true;
        markRepairPlanStepComplete(ctx, scene);
      }
      ctx.renderSidebar();
    });
  }

  /* ---- match renderer ---- */
  function renderMatch(ctx, scene) {
    var body = $("#exercise-body");
    body.className = "match-board";
    var left = document.createElement("div");
    var right = document.createElement("div");
    ctx.state.selectedLeft = null;

    scene.pairs.forEach(function (pair) {
      var l = document.createElement("button");
      l.type = "button";
      l.className = "sign-card";
      l.textContent = pair.left;
      l.addEventListener("click", function () {
        ctx.state.selectedLeft = pair;
        document.querySelectorAll(".sign-card").forEach(function (el) { el.classList.remove("selected"); });
        l.classList.add("selected");
      });
      left.appendChild(l);

      var r = document.createElement("button");
      r.type = "button";
      r.className = "meaning-card";
      r.textContent = pair.right;
      r.addEventListener("click", function () {
        var ok = ctx.state.selectedLeft && ctx.state.selectedLeft.id === pair.id;
        $("#feedback").className = "feedback show " + (ok ? "ok" : "warn");
        $("#feedback").textContent = ok ? (pair.feedback || ("Correct. " + pair.left.split(".")[0] + " — the match is right.")) : "Not this match. Try the other pairing.";
        if (!ctx.state.attempts[scene.id + pair.id]) {
          record(ctx, scene, ok, (ctx.state.selectedLeft ? ctx.state.selectedLeft.left : "") + " → " + pair.right, pair.left + " → " + pair.right);
          ctx.state.attempts[scene.id + pair.id] = true;
          if (!ok) afterMiss(ctx, scene, { correct: false });
        }
        if (ok) {
          r.classList.add("matched");
          l.classList.add("matched-pair");
        }
        if (document.querySelectorAll(".meaning-card.matched").length === scene.pairs.length) {
          ctx.state.completed[scene.id] = true;
          markRepairPlanStepComplete(ctx, scene);
        }
        ctx.renderSidebar();
        ctx.state.selectedLeft = null;
      });
      right.appendChild(r);
    });
    body.appendChild(left);
    body.appendChild(right);
  }

  /* ---- completion renderer ---- */
  function checkCompletion(scene, value) {
    var lower = value.toLowerCase();
    if (scene.acceptKeywordGroups && scene.acceptKeywordGroups.length) {
      var missing = [];
      scene.acceptKeywordGroups.forEach(function (group) {
        var keywords = group.keywords || [];
        var matched = keywords.some(function (kw) { return lower.indexOf(kw) !== -1; });
        if (!matched) missing.push(group.name || "required signal");
      });
      return { ok: missing.length === 0, missing: missing };
    }
    if (scene.acceptKeywords && scene.acceptKeywords.length) {
      return { ok: scene.acceptKeywords.some(function (kw) { return lower.indexOf(kw) !== -1; }), missing: [] };
    }
    return { ok: value.length > 0, missing: [] };
  }

  function renderCompletion(ctx, scene) {
    var body = $("#exercise-body");
    body.innerHTML = "<div class='sentence'><span lang='da'>" + escapeHtml(scene.prefix) + "</span><input id='name' class='inline-input b2-input' autocomplete='off' placeholder='" + escapeHtml(scene.placeholder) + "'></div><button class='primary small' id='complete' type='button'>Complete</button>";
    $("#complete").addEventListener("click", function () {
      var value = $("#name").value.trim();
      var checked = checkCompletion(scene, value);
      var ok = checked.ok;
      if (ok && scene.effects) applyEffects(ctx.state, scene.effects);
      $("#feedback").className = "feedback show " + (ok ? "ok" : "warn");
      $("#feedback").textContent = ok ? scene.success : scene.failure + (checked.missing.length ? " Missing: " + checked.missing.join(", ") + "." : "");
      if (!ctx.state.attempts[scene.id] || (ok && ctx.state.attempts[scene.id] !== "correct")) {
        record(ctx, scene, ok, scene.prefix + " " + value, scene.prefix + " + action");
        ctx.state.attempts[scene.id] = ok ? "correct" : "tried";
        if (!ok) afterMiss(ctx, scene, { correct: false });
      }
      if (ok) {
        ctx.state.completed[scene.id] = true;
        markRepairPlanStepComplete(ctx, scene);
      }
      ctx.renderSidebar();
    });
  }

  /* ---- flagship chain renderer ---- */
  function renderRepairLadder(steps) {
    if (!steps || !steps.length) return "";
    var html = "<ol class='flagship-ladder'>";
    steps.forEach(function (step) {
      html += "<li><span>" + escapeHtml(step.stage || "step") + "</span><strong lang='da'>" + escapeHtml(step.text || "") + "</strong></li>";
    });
    html += "</ol>";
    return html;
  }

  function renderChannelVersions(scene) {
    if (!scene.channelVersions || !scene.channelVersions.length) return "";
    var html = "<div class='flagship-channel-grid' aria-label='Same intent across channels'>";
    scene.channelVersions.forEach(function (channel) {
      html += "<article class='flagship-channel'>" +
        "<span>" + escapeHtml(channel.label || channel.id || "channel") + "</span>" +
        "<strong lang='da'>" + escapeHtml(channel.sample || "") + "</strong>" +
        "<p>" + escapeHtml(channel.risk || "") + "</p>" +
      "</article>";
    });
    html += "</div>";
    return html;
  }

  function renderReasonOptions(ctx, scene, option, panel) {
    if (!option.reasonOptions || !option.reasonOptions.length) return;
    var reasonWrap = document.createElement("div");
    reasonWrap.className = "flagship-reasons";
    reasonWrap.innerHTML = "<p class='eyebrow'>" + escapeHtml(option.reasonPrompt || "Explain your choice") + "</p>";
    option.reasonOptions.forEach(function (reason) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "flagship-reason";
      btn.textContent = reason.label;
      btn.addEventListener("click", function () {
        var ok = option.correct === true && reason.correct === true;
        $("#feedback").className = "feedback show " + (ok ? "ok" : "warn");
        $("#feedback").textContent = ok ? option.feedback : "The phrase is promising, but your explanation also needs to name the missing facts and why the tone fits this channel.";
        if (!ctx.state.attempts[scene.id + option.id + reason.id] || ok) {
          record(ctx, scene, ok, option.label + " / " + reason.label, option.label + " / " + (option.reasonPrompt || "reason"), option);
          ctx.state.attempts[scene.id + option.id + reason.id] = ok ? "correct" : "tried";
        }
        if (ok) {
          applyEffects(ctx.state, option.effects);
          ctx.state.completed[scene.id] = true;
          btn.classList.add("correct");
          markRepairPlanStepComplete(ctx, scene);
        } else {
          btn.classList.add("wrong");
        }
        ctx.renderSidebar();
      });
      reasonWrap.appendChild(btn);
    });
    panel.appendChild(reasonWrap);
  }

  function renderFlagshipChain(ctx, scene) {
    var body = $("#exercise-body");
    body.className = "flagship-chain";
    if (scene.intent || scene.memoryCue) {
      var proof = document.createElement("div");
      proof.className = "flagship-proof";
      proof.innerHTML =
        (scene.intent ? "<p><strong>Intent</strong><span>" + escapeHtml(scene.intent) + "</span></p>" : "") +
        (scene.memoryCue ? "<p><strong>Memory cue</strong><span>" + escapeHtml(scene.memoryCue.copy || scene.memoryCue.signal || "") + "</span></p>" : "");
      body.appendChild(proof);
    }
    var channels = document.createElement("div");
    channels.innerHTML = renderChannelVersions(scene);
    body.appendChild(channels);

    var choices = document.createElement("div");
    choices.className = "flagship-options";
    (scene.options || []).forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-card flagship-option";
      btn.innerHTML =
        "<span class='flagship-channel-label'>" + escapeHtml(opt.channel || "channel") + "</span>" +
        "<strong lang='da'>" + escapeHtml(opt.label) + "</strong>" +
        "<small>" + escapeHtml(opt.detail || "") + "</small>";
      btn.addEventListener("click", function () {
        var panel = document.createElement("aside");
        panel.className = "flagship-consequence " + (opt.correct ? "ok" : "warn");
        panel.innerHTML =
          "<p class='eyebrow'>" + escapeHtml(opt.nearMiss ? "Near miss · consequence" : "Consequence") + "</p>" +
          "<h4>" + escapeHtml(opt.pragmaticStatus || opt.channel || "channel fit") + "</h4>" +
          "<p>" + escapeHtml(opt.consequence || opt.feedback || "") + "</p>" +
          renderRepairLadder(opt.repairLadder || []);
        var oldPanel = body.querySelector && body.querySelector(".flagship-consequence");
        if (oldPanel && oldPanel.remove) oldPanel.remove();
        body.appendChild(panel);

        if (opt.correct && opt.reasonOptions && opt.reasonOptions.length) {
          $("#feedback").className = "feedback show ok";
          $("#feedback").textContent = "Good choice. Now explain why it fits this channel before the scene counts as complete.";
          renderReasonOptions(ctx, scene, opt, panel);
          return;
        }

        $("#feedback").className = "feedback show " + (opt.correct ? "ok" : "warn");
        $("#feedback").textContent = opt.feedback;
        if (!ctx.state.attempts[scene.id + opt.id]) {
          record(ctx, scene, !!opt.correct, opt.label, correctLabel(scene.options || []), opt);
          applyEffects(ctx.state, opt.effects);
          ctx.state.attempts[scene.id + opt.id] = true;
          if (!opt.correct) afterMiss(ctx, scene, opt);
        }
        if (opt.correct) {
          ctx.state.completed[scene.id] = true;
          markRepairPlanStepComplete(ctx, scene);
        }
        ctx.renderSidebar();
      });
      choices.appendChild(btn);
    });
    body.appendChild(choices);
  }

  /* ---- epilogue renderer ---- */
  function renderComplete(ctx) {
    var lesson = ctx.lesson;
    var ending = findEnding(lesson, ctx.state.endingId);
    var html = "";
    if (!ctx.state.repair || !ctx.state.repair.active) {
      markLessonPlanStepComplete(ctx, "lesson-complete");
    } else if (repairResolved(ctx)) {
      markLessonPlanStepComplete(ctx, "repair-complete");
    }
    if (root.PlataNextStep && root.PlataNextStep.renderPlanContext) {
      html += root.PlataNextStep.renderPlanContext({
        trainerId: lesson.id,
        dashboardHref: "../../dashboard.html"
      });
    }

    // Record social snapshot if lesson tracks variables
    if (lesson.variables && ctx.tracker && ctx.kernel && ctx.kernel.recordSocialSnapshot) {
      ctx.kernel.recordSocialSnapshot(ctx.tracker.state, ctx.state.variables);
      ctx.tracker.save();
    }

    if (ending) {
      html += "<p class='eyebrow'>Lesson complete · " + ending.id + "</p>";
      html += "<h2>" + escapeHtml(ending.title) + "</h2>";
      html += "<p class='narrative'>" + escapeHtml(ending.narrative) + "</p>";
      if (ending.danish) html += "<div class='danish-line' lang='da'>" + escapeHtml(ending.danish) + "</div>";
      html += "<p class='carry-forward'>" + escapeHtml(ending.carry) + "</p>";

      if (lesson.variables) {
        html += "<div class='variable-summary'><p class='eyebrow'>Your social tone</p>";
        var labels = variableLabels(lesson);
        var desc = variableDescriptions(lesson);
        Object.keys(ctx.state.variables).forEach(function (k) {
          var v = ctx.state.variables[k];
          var level = v > 0 ? 2 : v < 0 ? 0 : 1;
          var rawMeaning = desc[k] || ["", "", ""];
          var meaning = Array.isArray(rawMeaning) ? (rawMeaning[level] || "") : rawMeaning;
          html += "<div class='var-bar'><span class='var-label'>" + escapeHtml(labels[k] || k) + "</span><span class='var-value'>" + (v > 0 ? "+" : "") + v + "</span><span class='var-desc'>" + escapeHtml(meaning) + "</span></div>";
        });
        html += "</div>";
      }
    } else {
      // Standard completion (no ending system)
      html += "<p class='eyebrow'>Lesson complete</p>";
      html += "<h2>" + escapeHtml(lesson.completeTitle || "You made it through.") + "</h2>";
      html += "<p class='narrative'>" + escapeHtml(lesson.completeText || "The lesson is finished. Each scene taught one real-world pattern.") + "</p>";
    }

    html += renderRepairClosure(ctx);

    if (root.PlataNextStep && root.PlataNextStep.lesson && root.PlataNextStep.render) {
      html += root.PlataNextStep.render(root.PlataNextStep.lesson({
        lesson: lesson,
        state: ctx.tracker && ctx.tracker.state,
        rootPrefix: "../../"
      }));
    }

    html += "<div class='lesson-actions'><a class='primary link-button' href='../../'>Back to practice</a><button class='ghost' id='again' type='button'>Run again</button></div>";
    ctx.sceneEl.innerHTML = html;

    $("#again").addEventListener("click", function () {
      ctx.reset();
    });
    var nextAgain = ctx.sceneEl.querySelector && ctx.sceneEl.querySelector(".next-step-card a[href='#again']");
    if (nextAgain) {
      nextAgain.addEventListener("click", function (event) {
        event.preventDefault();
        ctx.reset();
      });
    }
  }

  /* ---- main render ---- */
  function renderScene(ctx) {
    var scene = ctx.lesson.scenes[ctx.state.index];
    syncSceneHash(ctx.lesson, ctx.state);
    renderRoute(ctx.lesson, ctx.state, ctx.routeEl, ctx.countEl, function () { renderScene(ctx); });
    renderVariables(ctx.lesson, ctx.state, ctx.varsEl);

    var html = "";
    if (root.PlataNextStep && root.PlataNextStep.renderPlanContext) {
      html += root.PlataNextStep.renderPlanContext({
        trainerId: ctx.lesson.id,
        dashboardHref: "../../dashboard.html"
      });
    }
    html += "<header class='scene-heading'><p class='eyebrow'>" + escapeHtml(scene.eyebrow) + "</p>";
    html += "<h2>" + escapeHtml(scene.title) + "</h2></header>";
    html += "<div class='scene-body'><div class='story-beat'>";
    html += renderComicPanel(ctx.lesson, scene);
    if (scene.pressure) html += "<p class='pressure'>" + escapeHtml(scene.pressure) + "</p>";
    html += "<p class='narrative'>" + escapeHtml(scene.narrative) + "</p>";
    if (ctx.state.repair && ctx.state.repair.active) {
      html += "<aside class='repair-focus'><strong>" + escapeHtml(ctx.state.repair.cta) + "</strong><span><b>" + escapeHtml(ctx.state.repair.label) + "</b>" + (ctx.state.repair.action ? " — " + escapeHtml(ctx.state.repair.action) : "") + "</span></aside>";
    }
    if (scene.dialogue) html += renderDialogue(scene.dialogue);
    if (scene.danish) html += "<div class='danish-line' lang='da'>" + escapeHtml(scene.danish) + "</div>";
    if (scene.notice) html += "<aside class='notice'><strong>Notice</strong><span>" + escapeHtml(scene.notice) + "</span></aside>";
    html += "</div><div class='exercise'><h3>" + escapeHtml(scene.prompt) + "</h3><div id='exercise-body'></div><div id='feedback' class='feedback' aria-live='polite'></div></div></div>";
    if (scene.carry) html += "<p class='carry-forward'>" + escapeHtml(scene.carry) + "</p>";

    var isLast = ctx.state.index === ctx.lesson.scenes.length - 1;
    html += "<div class='lesson-actions'><button class='ghost' id='prev' type='button'>Back</button><button class='primary' id='next' type='button'>" + (isLast ? "See outcome" : "Continue") + "</button></div>";
    ctx.sceneEl.innerHTML = html;
    installComicImageFallback(ctx.sceneEl);

    // Dispatch to renderer
    var renderFn = renderers[scene.type];
    if (renderFn) {
      renderFn(ctx, scene);
    } else {
      $("#exercise-body").innerHTML = "<p class='narrative'>Unsupported exercise type: " + escapeHtml(scene.type) + "</p>";
    }

    // Navigation
    $("#prev").disabled = ctx.state.index === 0;
    $("#prev").addEventListener("click", function () { if (ctx.state.index > 0) { ctx.state.index -= 1; renderScene(ctx); } });
    $("#next").addEventListener("click", function () {
      if (ctx.state.index < ctx.lesson.scenes.length - 1) {
        ctx.state.index += 1;
        renderScene(ctx);
      } else {
        ctx.state.endingId = resolveEnding(ctx.lesson, ctx.state);
        renderComplete(ctx);
      }
    });
  }

  function indexFromLocation(lesson, state) {
    if (state.repair && state.repair.active) return sceneIndexById(lesson, state.repair.sceneId);
    return sceneIndexFromHash(lesson);
  }

  function bindLocationNavigation(ctx) {
    if (!root.addEventListener) return;
    root.addEventListener("hashchange", function () {
      var nextIndex = indexFromLocation(ctx.lesson, ctx.state);
      if (nextIndex === ctx.state.index) return;
      ctx.state.index = nextIndex;
      renderScene(ctx);
    });
  }

  /* ---- public API ---- */
  function run(lesson) {
    if (!lesson) {
      // Auto-discover: find first window.PLATA_LESSON_*
      for (var k in root) {
        if (k.indexOf("PLATA_LESSON_") === 0 && typeof root[k] === "object" && root[k].scenes) {
          lesson = root[k];
          break;
        }
      }
    }
    if (!lesson || !lesson.scenes) {
      console.error("PlataLessonEngine: no lesson data found");
      return;
    }

    var kernel = root.PlataKernel;
    var tracker = kernel && kernel.createTrainerState ? kernel.createTrainerState({ trainerId: lesson.id }) : null;

    var ctx = {
      lesson: lesson,
      kernel: kernel,
      tracker: tracker,
      state: freshState(lesson),
      sceneEl: $("#scene"),
      routeEl: $("#route"),
      countEl: $("#scene-count"),
      varsEl: $("#variables-display"),
      rootPrefix: "../../",
      renderSidebar: function () {
        renderRoute(lesson, ctx.state, ctx.routeEl, ctx.countEl, function () { renderScene(ctx); });
        renderVariables(ctx.lesson, ctx.state, ctx.varsEl);
      },
      reset: function () {
        ctx.state = freshState(lesson);
        ctx.state.index = sceneIndexFromHash(lesson);
        ctx.state.repair = repairContextFromLocation(lesson);
        if (ctx.state.repair) ctx.state.index = sceneIndexById(lesson, ctx.state.repair.sceneId);
        renderScene(ctx);
      }
    };
    ctx.state.index = sceneIndexFromHash(lesson);
    ctx.state.repair = repairContextFromLocation(lesson);
    if (ctx.state.repair) ctx.state.index = sceneIndexById(lesson, ctx.state.repair.sceneId);
    bindLocationNavigation(ctx);

    // Reset button
    var resetBtn = $("#reset-lesson");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () { ctx.reset(); });
    }

    renderScene(ctx);
  }

  // Register built-in renderers
  registerRenderer("choice", renderChoice);
  registerRenderer("input", renderInput);
  registerRenderer("match", renderMatch);
  registerRenderer("completion", renderCompletion);
  registerRenderer("flagship-chain", renderFlagshipChain);

  root.PlataLessonEngine = {
    run: run,
    registerRenderer: registerRenderer,
    getSceneAttemptTags: sceneAttemptTags,
    getRepairContext: repairContextFromLocation
  };

})(typeof window !== "undefined" ? window : globalThis);

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

  function resolveEnding(lesson, state) {
    if (!lesson.endingLogic) return null;
    var logic = lesson.endingLogic;
    var v = state.variables;
    if (logic.diplomatic && v.landlordTension <= (logic.diplomatic.maxLandlordTension || 0) && v.workplaceTrust >= (logic.diplomatic.minWorkplaceTrust || 1)) return "diplomatic";
    if (logic.aggressive && v.landlordTension >= (logic.aggressive.minLandlordTension || 2)) return "aggressive";
    if (logic.passive) return "passive";
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
  function record(ctx, scene, correct, given, expected) {
    var tracker = ctx.tracker;
    if (!tracker || !ctx.kernel || !ctx.kernel.recordAttempt) return;
    var mode = ctx.state.repair && ctx.state.repair.active ? "repair" : "lesson";
    ctx.kernel.recordAttempt(tracker.state, {
      itemId: scene.id,
      correct: !!correct,
      tags: sceneAttemptTags(scene),
      mode: mode,
      expected: expected || "",
      given: given || ""
    });
    tracker.save();
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

  function renderVariables(state, varsEl) {
    if (!varsEl) return;
    var labels = { landlordTension: "Udlejer", sofiaTrust: "Sofia", emilEscalation: "Emil", workplaceTrust: "Arbejde" };
    var html = "";
    Object.keys(state.variables).forEach(function (k) {
      var v = state.variables[k];
      var cls = v > 0 ? "high" : v < 0 ? "low" : "neutral";
      html += "<span class=\"var-tag " + cls + "\">" + (labels[k] || k) + " " + (v > 0 ? "+" : "") + v + "</span>";
    });
    varsEl.innerHTML = html;
  }

  function renderRoute(lesson, state, routeEl, countEl, onNavigate) {
    routeEl.innerHTML = "";
    lesson.scenes.forEach(function (scene, i) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "route-step" + (i === state.index ? " active" : "") + (state.completed[scene.id] ? " done" : "");
      item.innerHTML = "<span>" + String(i + 1).padStart(2, "0") + "</span><strong>" + escapeHtml(scene.eyebrow.split("·").pop().trim()) + "</strong>";
      item.addEventListener("click", function () { state.index = i; onNavigate(); });
      routeEl.appendChild(item);
    });
    countEl.textContent = (state.index + 1) + " / " + lesson.scenes.length;
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
          record(ctx, scene, opt.correct, opt.label, correctLabel(scene.options));
          applyEffects(ctx.state, opt.effects);
          ctx.state.attempts[scene.id + opt.id] = true;
        }
        if (opt.correct) ctx.state.completed[scene.id] = true;
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
      if (ok) ctx.state.completed[scene.id] = true;
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
        }
        if (ok) {
          r.classList.add("matched");
          l.classList.add("matched-pair");
        }
        if (document.querySelectorAll(".meaning-card.matched").length === scene.pairs.length) {
          ctx.state.completed[scene.id] = true;
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
      if (!ctx.state.attempts[scene.id]) {
        record(ctx, scene, ok, scene.prefix + " " + value, scene.prefix + " + action");
        ctx.state.attempts[scene.id] = true;
      }
      if (ok) ctx.state.completed[scene.id] = true;
      ctx.renderSidebar();
    });
  }

  /* ---- epilogue renderer ---- */
  function renderComplete(ctx) {
    var lesson = ctx.lesson;
    var ending = findEnding(lesson, ctx.state.endingId);
    var html = "";

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
        var labels = { landlordTension: "Landlord tension", sofiaTrust: "Sofia's trust", emilEscalation: "Emil's stance", workplaceTrust: "Workplace read" };
        var desc = {
          landlordTension: ["kept low — professional distance maintained", "noticeable — relationship strained", "high — conflict visible"],
          sofiaTrust: ["steady — she still trusts your judgement", "unchanged", "shaken — she distanced herself"],
          emilEscalation: ["neutral", "neutral", "neutral"],
          workplaceTrust: ["strong — you handled it with composure", "neutral", "weakened — you sounded too passive"]
        };
        Object.keys(ctx.state.variables).forEach(function (k) {
          var v = ctx.state.variables[k];
          var level = v > 0 ? 2 : v < 0 ? 0 : 1;
          var meaning = (desc[k] || ["", "", ""])[level] || "";
          html += "<div class='var-bar'><span class='var-label'>" + (labels[k] || k) + "</span><span class='var-value'>" + (v > 0 ? "+" : "") + v + "</span><span class='var-desc'>" + escapeHtml(meaning) + "</span></div>";
        });
        html += "</div>";
      }
    } else {
      // Standard completion (no ending system)
      html += "<p class='eyebrow'>Lesson complete</p>";
      html += "<h2>" + escapeHtml(lesson.completeTitle || "You made it through.") + "</h2>";
      html += "<p class='narrative'>" + escapeHtml(lesson.completeText || "The lesson is finished. Each scene taught one real-world pattern.") + "</p>";
    }

    html += "<div class='lesson-actions'><a class='primary link-button' href='../../'>Back to trainers</a><button class='ghost' id='again' type='button'>Run again</button></div>";
    ctx.sceneEl.innerHTML = html;

    $("#again").addEventListener("click", function () {
      ctx.reset();
    });
  }

  /* ---- main render ---- */
  function renderScene(ctx) {
    var scene = ctx.lesson.scenes[ctx.state.index];
    syncSceneHash(ctx.lesson, ctx.state);
    renderRoute(ctx.lesson, ctx.state, ctx.routeEl, ctx.countEl, function () { renderScene(ctx); });
    renderVariables(ctx.state, ctx.varsEl);

    var html = "";
    html += "<p class='eyebrow'>" + escapeHtml(scene.eyebrow) + "</p>";
    html += "<h2>" + escapeHtml(scene.title) + "</h2>";
    if (scene.pressure) html += "<p class='pressure'>" + escapeHtml(scene.pressure) + "</p>";
    html += "<p class='narrative'>" + escapeHtml(scene.narrative) + "</p>";
    if (ctx.state.repair && ctx.state.repair.active) {
      html += "<aside class='repair-focus'><strong>" + escapeHtml(ctx.state.repair.cta) + "</strong><span><b>" + escapeHtml(ctx.state.repair.label) + "</b>" + (ctx.state.repair.action ? " — " + escapeHtml(ctx.state.repair.action) : "") + "</span></aside>";
    }
    if (scene.dialogue) html += renderDialogue(scene.dialogue);
    if (scene.danish) html += "<div class='danish-line' lang='da'>" + escapeHtml(scene.danish) + "</div>";
    if (scene.notice) html += "<aside class='notice'><strong>Notice</strong><span>" + escapeHtml(scene.notice) + "</span></aside>";
    html += "<div class='exercise'><h3>" + escapeHtml(scene.prompt) + "</h3><div id='exercise-body'></div><div id='feedback' class='feedback' aria-live='polite'></div></div>";
    if (scene.carry) html += "<p class='carry-forward'>" + escapeHtml(scene.carry) + "</p>";

    var isLast = ctx.state.index === ctx.lesson.scenes.length - 1;
    html += "<div class='lesson-actions'><button class='ghost' id='prev' type='button'>Back</button><button class='primary' id='next' type='button'>" + (isLast ? "See outcome" : "Continue") + "</button></div>";
    ctx.sceneEl.innerHTML = html;

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
      renderSidebar: function () {
        renderRoute(lesson, ctx.state, ctx.routeEl, ctx.countEl, function () { renderScene(ctx); });
        renderVariables(ctx.state, ctx.varsEl);
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

  root.PlataLessonEngine = {
    run: run,
    registerRenderer: registerRenderer,
    getSceneAttemptTags: sceneAttemptTags,
    getRepairContext: repairContextFromLocation
  };

})(typeof window !== "undefined" ? window : globalThis);

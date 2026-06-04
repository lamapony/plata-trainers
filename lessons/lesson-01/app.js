(function () {
  "use strict";

  var lesson = window.PLATA_LESSON_01;
  var kernel = window.PlataKernel;
  var tracker = kernel && kernel.createTrainerState ? kernel.createTrainerState({ trainerId: lesson.id }) : null;
  var state = { index: 0, completed: {}, selectedLeft: null, attempts: {}, learnerName: "" };

  var $ = function (sel) { return document.querySelector(sel); };
  var sceneEl = $("#scene");
  var routeEl = $("#route");
  var countEl = $("#scene-count");
  var resetBtn = $("#reset-lesson");

  function record(scene, correct, given, expected) {
    if (!tracker || !kernel.recordAttempt) return;
    kernel.recordAttempt(tracker.state, {
      itemId: scene.id,
      correct: !!correct,
      tags: scene.tags || [],
      mode: "lesson",
      expected: expected || "",
      given: given || ""
    });
    tracker.save();
  }

  function renderRoute() {
    routeEl.innerHTML = "";
    lesson.scenes.forEach(function (scene, i) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "route-step" + (i === state.index ? " active" : "") + (state.completed[scene.id] ? " done" : "");
      item.innerHTML = "<span>" + String(i + 1).padStart(2, "0") + "</span><strong>" + scene.eyebrow.split("·").pop().trim() + "</strong>";
      item.addEventListener("click", function () { state.index = i; render(); });
      routeEl.appendChild(item);
    });
    countEl.textContent = (state.index + 1) + " / " + lesson.scenes.length;
  }

  function render() {
    var scene = lesson.scenes[state.index];
    renderRoute();
    var html = "";
    html += "<p class='eyebrow'>" + escapeHtml(scene.eyebrow) + "</p>";
    html += "<h2>" + escapeHtml(scene.title) + "</h2>";
    if (scene.pressure) html += "<p class='pressure'>" + escapeHtml(scene.pressure) + "</p>";
    html += "<p class='narrative'>" + escapeHtml(scene.narrative) + "</p>";
    if (scene.dialogue) html += renderDialogue(scene.dialogue);
    if (scene.danish) html += "<div class='danish-line' lang='da'>" + escapeHtml(scene.danish) + "</div>";
    if (scene.notice) html += "<aside class='notice'><strong>Notice</strong><span>" + escapeHtml(scene.notice) + "</span></aside>";
    html += "<div class='exercise'><h3>" + escapeHtml(scene.prompt) + "</h3><div id='exercise-body'></div><div id='feedback' class='feedback' aria-live='polite'></div></div>";
    if (scene.carry) html += "<p class='carry-forward'>" + escapeHtml(scene.carry) + "</p>";
    html += "<div class='lesson-actions'><button class='ghost' id='prev' type='button'>Back</button><button class='primary' id='next' type='button'>" + (state.index === lesson.scenes.length - 1 ? "Finish" : "Continue") + "</button></div>";
    sceneEl.innerHTML = html;
    renderExercise(scene);
    bindNav(scene);
  }

  function renderExercise(scene) {
    if (scene.type === "choice") return renderChoice(scene);
    if (scene.type === "input") return renderInput(scene);
    if (scene.type === "match") return renderMatch(scene);
    if (scene.type === "completion") return renderCompletion(scene);
  }

  function renderDialogue(lines) {
    var html = "<div class='dialogue' aria-label='Scene dialogue'>";
    lines.forEach(function (line) {
      html += "<div class='dialogue-line'><span>" + escapeHtml(line.speaker) + "</span><p lang='da'>" + escapeHtml(line.line) + "</p></div>";
    });
    html += "</div>";
    return html;
  }

  function renderChoice(scene) {
    var body = $("#exercise-body");
    body.className = "choice-grid";
    scene.options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-card";
      btn.innerHTML = "<strong lang='da'>" + escapeHtml(opt.label) + "</strong><span>" + escapeHtml(opt.detail) + "</span>";
      btn.addEventListener("click", function () {
        markChoice(btn, opt.correct);
        $("#feedback").className = "feedback show " + (opt.correct ? "ok" : "warn");
        $("#feedback").textContent = opt.feedback;
        if (!state.attempts[scene.id + opt.id]) {
          record(scene, opt.correct, opt.label, correctLabel(scene.options));
          state.attempts[scene.id + opt.id] = true;
        }
        if (opt.correct) state.completed[scene.id] = true;
        renderRoute();
      });
      body.appendChild(btn);
    });
  }

  function renderInput(scene) {
    var body = $("#exercise-body");
    body.innerHTML = "<label class='field-label' for='answer'>Your answer</label><input id='answer' class='text-input' lang='da' autocomplete='name' placeholder='" + escapeHtml(scene.placeholder) + "' /><button class='primary small' id='check' type='button'>Check</button>";
    $("#check").addEventListener("click", function () {
      var value = $("#answer").value.trim();
      var ok = value.toLowerCase().indexOf(scene.acceptPrefix) === 0 && value.length > scene.acceptPrefix.length;
      if (ok) state.learnerName = value.slice(scene.acceptPrefix.length).trim();
      $("#feedback").className = "feedback show " + (ok ? "ok" : "warn");
      $("#feedback").textContent = ok ? scene.success : scene.failure;
      record(scene, ok, value, scene.placeholder);
      if (ok) state.completed[scene.id] = true;
      renderRoute();
    });
  }

  function renderMatch(scene) {
    var body = $("#exercise-body");
    body.className = "match-board";
    var left = document.createElement("div");
    var right = document.createElement("div");
    scene.pairs.forEach(function (pair) {
      var l = document.createElement("button");
      l.type = "button";
      l.className = "sign-card";
      l.textContent = pair.left;
      l.addEventListener("click", function () { state.selectedLeft = pair; document.querySelectorAll('.sign-card').forEach(function(x){x.classList.remove('selected');}); l.classList.add('selected'); });
      left.appendChild(l);
      var r = document.createElement("button");
      r.type = "button";
      r.className = "meaning-card";
      r.textContent = pair.right;
      r.addEventListener("click", function () {
        var ok = state.selectedLeft && state.selectedLeft.id === pair.id;
        $("#feedback").className = "feedback show " + (ok ? "ok" : "warn");
        $("#feedback").textContent = ok ? "Correct. The sign now belongs to the world." : "Not this one. Try the other sign.";
        record(scene, ok, state.selectedLeft ? state.selectedLeft.left + " → " + pair.right : pair.right, pair.left + " → " + pair.right);
        if (ok) r.classList.add("matched");
        if (document.querySelectorAll('.meaning-card.matched').length === scene.pairs.length) state.completed[scene.id] = true;
        renderRoute();
      });
      right.appendChild(r);
    });
    body.appendChild(left);
    body.appendChild(right);
  }

  function renderCompletion(scene) {
    var body = $("#exercise-body");
    body.innerHTML = "<div class='sentence'><span lang='da'>" + escapeHtml(scene.prefix) + "</span><input id='name' class='inline-input' autocomplete='name' placeholder='" + escapeHtml(state.learnerName || scene.placeholder) + "'></div><button class='primary small' id='complete' type='button'>Say it</button>";
    $("#complete").addEventListener("click", function () {
      var name = $("#name").value.trim() || state.learnerName;
      var ok = !!name;
      $("#feedback").className = "feedback show " + (ok ? "ok" : "warn");
      $("#feedback").textContent = ok ? scene.success + " Hej, " + name + "." : "Give Anders a name to answer with.";
      record(scene, ok, scene.prefix + " " + name, scene.prefix + " + name");
      if (ok) state.completed[scene.id] = true;
      renderRoute();
    });
  }

  function bindNav(scene) {
    $("#prev").disabled = state.index === 0;
    $("#prev").addEventListener("click", function () { if (state.index > 0) { state.index -= 1; render(); } });
    $("#next").addEventListener("click", function () {
      if (state.index < lesson.scenes.length - 1) { state.index += 1; render(); }
      else { state.completed[scene.id] = true; renderComplete(); }
    });
  }

  function renderComplete() {
    sceneEl.innerHTML = "<p class='eyebrow'>Lesson complete</p><h2>You survived the first morning.</h2><p class='narrative'>You can greet someone, introduce yourself, thank them, and escape through the right Copenhagen door. The next lesson can now make word order matter.</p><div class='danish-line' lang='da'>Hej, jeg hedder " + escapeHtml(state.learnerName || "...") + ". Tak — og vi ses.</div><div class='lesson-actions'><a class='primary link-button' href='../../'>Back to trainers</a><button class='ghost' id='again' type='button'>Run again</button></div>";
    $("#again").addEventListener("click", function () { state.index = 0; state.completed = {}; render(); });
  }

  function markChoice(btn, ok) {
    btn.classList.add(ok ? "correct" : "wrong");
  }

  function correctLabel(options) {
    for (var i = 0; i < options.length; i++) if (options[i].correct) return options[i].label;
    return "";
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>'"]/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]; });
  }

  resetBtn.addEventListener("click", function () { state = { index: 0, completed: {}, selectedLeft: null, attempts: {}, learnerName: "" }; render(); });
  render();
})();

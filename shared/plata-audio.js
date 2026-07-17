(function (root) {
  "use strict";

  var STORAGE_KEY = "plata.audio.speed.v1";
  var ALLOWED_SPEEDS = [0.75, 1];
  var player = null;
  var activeButton = null;
  var activeUtterance = null;
  var activeClip = null;
  var userRequestedPlayback = false;

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character];
    });
  }

  function speedFromStorage() {
    try {
      var stored = Number(root.localStorage && root.localStorage.getItem(STORAGE_KEY));
      return ALLOWED_SPEEDS.indexOf(stored) >= 0 ? stored : 1;
    } catch (_error) {
      return 1;
    }
  }

  function saveSpeed(speed) {
    try {
      if (root.localStorage) root.localStorage.setItem(STORAGE_KEY, String(speed));
    } catch (_error) {
      // Playback remains available when storage is unavailable.
    }
  }

  function manifestFor(lessonId) {
    return root.PLATA_AUDIO_MANIFESTS && root.PLATA_AUDIO_MANIFESTS[lessonId] || null;
  }

  function clipFor(lessonId, utteranceId) {
    var manifest = manifestFor(lessonId);
    if (!manifest || !Array.isArray(manifest.clips)) return null;
    for (var index = 0; index < manifest.clips.length; index += 1) {
      if (manifest.clips[index].utteranceId === utteranceId) return manifest.clips[index];
    }
    return null;
  }

  function audioId(ref) {
    if (!ref || typeof ref !== "object") return "";
    return String(ref.utteranceId || "");
  }

  function renderControl(lessonId, ref, visibleText) {
    var utteranceId = audioId(ref);
    var clip = clipFor(lessonId, utteranceId);
    if (!clip || !clip.src) return "";
    var excerpt = String(visibleText || clip.text || clip.spokenText || "Danish phrase").replace(/\s+/g, " ").trim();
    if (excerpt.length > 96) excerpt = excerpt.slice(0, 93) + "…";
    return "<span class='plata-audio-control'>" +
      "<button class='plata-audio-button' type='button' data-plata-audio-lesson='" + escapeHtml(lessonId) + "' data-plata-audio-id='" + escapeHtml(utteranceId) + "' data-plata-audio-label='" + escapeHtml(excerpt) + "' aria-label='Play Danish: &quot;" + escapeHtml(excerpt) + "&quot;' aria-pressed='false'>" +
        "<span aria-hidden='true' class='plata-audio-icon'>▶</span><span class='plata-audio-button-label'>Listen</span>" +
      "</button>" +
      "<span class='plata-audio-status' role='status' aria-live='polite'></span>" +
    "</span>";
  }

  function utteranceContainer(button) {
    return button && button.closest ? button.closest(".plata-audio-utterance") : null;
  }

  function setButtonState(button, state) {
    if (!button) return;
    var label = button.querySelector(".plata-audio-button-label");
    var icon = button.querySelector(".plata-audio-icon");
    var text = state === "playing" ? "Pause" : (state === "ended" ? "Replay" : (state === "paused" ? "Resume" : "Listen"));
    var action = state === "playing" ? "Pause" : (state === "ended" ? "Replay" : (state === "paused" ? "Resume" : "Play"));
    if (label) label.textContent = text;
    if (icon) icon.textContent = state === "playing" ? "Ⅱ" : (state === "ended" ? "↻" : "▶");
    button.setAttribute("aria-pressed", state === "playing" ? "true" : "false");
    button.setAttribute("aria-label", action + " Danish: “" + (button.getAttribute("data-plata-audio-label") || "Danish phrase") + "”");
    button.classList.toggle("is-playing", state === "playing");
    var container = utteranceContainer(button);
    if (container) container.classList.toggle("is-playing", state === "playing");
  }

  function clearStatus(button) {
    var container = button && button.closest ? button.closest(".plata-audio-control") : null;
    var status = container && container.querySelector ? container.querySelector(".plata-audio-status") : null;
    if (status) status.textContent = "";
  }

  function showError(button) {
    if (!button) return;
    setButtonState(button, "idle");
    var container = button.closest ? button.closest(".plata-audio-control") : null;
    var status = container && container.querySelector ? container.querySelector(".plata-audio-status") : null;
    if (status) status.textContent = "Audio is unavailable. The Danish text is still here.";
  }

  function ensurePlayer() {
    if (player) return player;
    if (!root.document || !root.document.createElement) return null;
    player = root.document.createElement("audio");
    player.id = "plata-audio-player";
    player.preload = "none";
    player.hidden = true;
    player.playbackRate = speedFromStorage();
    player.addEventListener("ended", function () {
      userRequestedPlayback = false;
      setButtonState(activeButton, "ended");
    });
    player.addEventListener("error", function () {
      if (userRequestedPlayback) showError(activeButton);
      userRequestedPlayback = false;
    });
    (root.document.body || root.document.documentElement).appendChild(player);
    return player;
  }

  function stop() {
    userRequestedPlayback = false;
    if (player) {
      try { player.pause(); } catch (_error) { /* already stopped */ }
      player.removeAttribute("src");
      try { player.load(); } catch (_error) { /* not all test doubles implement load */ }
    }
    setButtonState(activeButton, "idle");
    activeButton = null;
    activeUtterance = null;
    activeClip = null;
  }

  function play(button, clip) {
    var element = ensurePlayer();
    if (!element) {
      showError(button);
      return;
    }
    clearStatus(button);
    if (activeButton !== button) {
      stop();
      activeButton = button;
      activeUtterance = button.getAttribute("data-plata-audio-id");
      activeClip = clip;
      element.src = clip.src;
      element.playbackRate = speedFromStorage();
      try { element.load(); } catch (_error) { /* browser loads on play */ }
    } else if (element.ended) {
      element.currentTime = 0;
    }
    userRequestedPlayback = true;
    setButtonState(button, "playing");
    var promise;
    try {
      promise = element.play();
    } catch (_error) {
      showError(button);
      userRequestedPlayback = false;
      return;
    }
    if (promise && typeof promise.catch === "function") {
      promise.catch(function () {
        if (userRequestedPlayback) showError(button);
        userRequestedPlayback = false;
      });
    }
  }

  function toggle(button) {
    var lessonId = button.getAttribute("data-plata-audio-lesson");
    var utteranceId = button.getAttribute("data-plata-audio-id");
    var clip = clipFor(lessonId, utteranceId);
    if (!clip) {
      showError(button);
      return;
    }
    var element = ensurePlayer();
    if (button === activeButton && element && !element.paused && !element.ended) {
      userRequestedPlayback = false;
      element.pause();
      setButtonState(button, "paused");
      return;
    }
    play(button, clip);
  }

  function renderSettings(container, buttons) {
    if (!container || !buttons.length || container.querySelector(".plata-audio-settings")) return;
    var settings = root.document.createElement("div");
    settings.className = "plata-audio-settings";
    var lessonId = buttons[0].getAttribute("data-plata-audio-lesson");
    var manifest = manifestFor(lessonId);
    var disclosure = manifest && manifest.disclosure ? `<span class="plata-audio-disclosure">${escapeHtml(manifest.disclosure)}</span>` : "";
    settings.innerHTML = "<label>Audio speed <select class='plata-audio-speed' aria-label='Danish audio playback speed'><option value='0.75'>0.75×</option><option value='1'>1×</option></select></label>" + disclosure;
    var select = settings.querySelector(".plata-audio-speed");
    select.value = String(speedFromStorage());
    select.addEventListener("change", function () {
      var speed = Number(select.value);
      if (ALLOWED_SPEEDS.indexOf(speed) < 0) speed = 1;
      saveSpeed(speed);
      if (player) player.playbackRate = speed;
    });
    var target = container.querySelector(".story-beat") || container;
    target.insertBefore(settings, target.firstChild);
  }

  function bind(container) {
    if (!container || !container.querySelectorAll) return;
    var buttons = Array.prototype.slice.call(container.querySelectorAll(".plata-audio-button"));
    buttons.forEach(function (button) {
      if (button.getAttribute("data-plata-audio-bound") === "true") return;
      button.setAttribute("data-plata-audio-bound", "true");
      button.addEventListener("click", function () { toggle(button); });
    });
    renderSettings(container, buttons);
  }

  function beginScene(container) {
    stop();
    bind(container);
  }

  if (root.addEventListener) root.addEventListener("pagehide", stop);

  root.PlataAudio = {
    bind: bind,
    beginScene: beginScene,
    getClip: clipFor,
    hasClip: function (lessonId, ref) { return Boolean(clipFor(lessonId, audioId(ref))); },
    renderControl: renderControl,
    stop: stop,
    version: 1,
    _debug: function () {
      return { activeUtterance: activeUtterance, activeClip: activeClip, hasPlayer: Boolean(player), speed: speedFromStorage() };
    }
  };
})(typeof window !== "undefined" ? window : this);

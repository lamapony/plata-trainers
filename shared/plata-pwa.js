/* Platå PWA — service worker registration + learner-visible install/offline status */
(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[ch];
    });
  }

  var state = {
    supported: typeof navigator !== "undefined" && "serviceWorker" in navigator,
    registered: false,
    installable: false,
    installed: false,
    offlineReady: false
  };

  var deferredPrompt = null;

  function isStandalone() {
    if (typeof window === "undefined") return false;
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
    return !!(window.navigator && window.navigator.standalone);
  }

  function statusSnapshot() {
    if (!state.supported) {
      return {
        key: "unsupported",
        label: "Offline install unavailable",
        detail: "This browser does not support installable web apps. You can still practise while you are online."
      };
    }
    if (state.installed || isStandalone()) {
      return {
        key: "installed",
        label: "Installed on this device",
        detail: "Platå opens like an app. Your progress still stays in this browser."
      };
    }
    if (state.offlineReady) {
      return {
        key: "offline-ready",
        label: "Offline-ready",
        detail: "Core pages are cached. After one visit you can practise without a connection."
      };
    }
    if (state.installable) {
      return {
        key: "installable",
        label: "Ready to install",
        detail: "Add Platå to your home screen for faster return visits."
      };
    }
    if (state.registered) {
      return {
        key: "warming",
        label: "Preparing offline shell",
        detail: "The cache is warming up. Reload once if you want offline practice."
      };
    }
    return {
      key: "unavailable",
      label: "Offline fallback not ready yet",
      detail: "The service worker has not finished registering. Online practice still works."
    };
  }

  function renderStatus(target) {
    if (!target) return;
    var snap = statusSnapshot();
    target.className = "pwa-status pwa-status-" + snap.key;
    target.innerHTML =
      '<span class="pwa-status-label">' + escapeHtml(snap.label) + "</span>" +
      '<span class="pwa-status-detail">' + escapeHtml(snap.detail) + "</span>";
    if (snap.key === "installable" && deferredPrompt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn pwa-install-btn";
      btn.textContent = "Install Platå";
      btn.addEventListener("click", function () {
        if (!deferredPrompt || !deferredPrompt.prompt) return;
        deferredPrompt.prompt();
        var choice = deferredPrompt.userChoice;
        if (choice && typeof choice.finally === "function") {
          choice.finally(function () {
            deferredPrompt = null;
            state.installable = false;
            renderAll();
          });
        } else {
          deferredPrompt = null;
          state.installable = false;
          renderAll();
        }
      });
      target.appendChild(btn);
    }
  }

  function renderAll() {
    if (typeof document === "undefined") return;
    var nodes = document.querySelectorAll("[data-pwa-status]");
    for (var i = 0; i < nodes.length; i++) renderStatus(nodes[i]);
    var single = document.getElementById("pwa-status");
    if (single && !single.getAttribute("data-pwa-status")) renderStatus(single);
  }

  function bindInstallPrompt() {
    if (typeof window === "undefined") return;
    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      deferredPrompt = event;
      state.installable = true;
      renderAll();
    });
    window.addEventListener("appinstalled", function () {
      state.installed = true;
      state.installable = false;
      deferredPrompt = null;
      renderAll();
    });
  }

  function registerServiceWorker() {
    if (!state.supported) {
      renderAll();
      return;
    }
    navigator.serviceWorker.register("./sw.js", { scope: "./" })
      .then(function (registration) {
        state.registered = true;
        if (registration.active) state.offlineReady = true;
        registration.addEventListener("updatefound", function () {
          var worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", function () {
            if (worker.state === "activated") {
              state.offlineReady = true;
              renderAll();
            }
          });
        });
        renderAll();
      })
      .catch(function (err) {
        console.warn("Platå service worker registration failed", err);
        renderAll();
      });
  }

  function boot() {
    if (isStandalone()) state.installed = true;
    bindInstallPrompt();
    registerServiceWorker();
    renderAll();
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  }

  window.PlataPWA = {
    getStatus: statusSnapshot,
    render: renderAll,
    _state: state
  };
})();

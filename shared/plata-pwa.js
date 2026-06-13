/* Platå PWA registration — graceful no-op when service workers are unavailable */
(function () {
  "use strict";

  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  function register() {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(function (err) {
      console.warn("Platå service worker registration failed", err);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", register);
  } else {
    register();
  }
})();

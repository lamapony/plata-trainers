/* Platå service worker — precache list is generated at build time into precache-manifest.json */
(function () {
  "use strict";

  var FALLBACK_VERSION = "plata-dev";
  var CORE_URLS = ["./", "./index.html", "./styles.css", "./site.webmanifest"];

  function readManifest() {
    return fetch("./precache-manifest.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("precache manifest missing");
        return response.json();
      })
      .catch(function () {
        return { version: FALLBACK_VERSION, urls: CORE_URLS };
      });
  }

  self.addEventListener("install", function (event) {
    event.waitUntil(readManifest().then(function (manifest) {
      return caches.open(manifest.version).then(function (cache) {
        return cache.addAll(manifest.urls);
      }).then(function () {
        return self.skipWaiting();
      });
    }));
  });

  self.addEventListener("activate", function (event) {
    event.waitUntil(readManifest().then(function (manifest) {
      return caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (key) {
          if (key !== manifest.version) return caches.delete(key);
          return undefined;
        }));
      }).then(function () {
        return self.clients.claim();
      });
    }));
  });

  self.addEventListener("fetch", function (event) {
    if (event.request.method !== "GET") return;
    var url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        if (!response || response.status !== 200 || response.type === "opaque") return response;
        var copy = response.clone();
        readManifest().then(function (manifest) {
          caches.open(manifest.version).then(function (cache) {
            cache.put(event.request, copy);
          });
        });
        return response;
      }).catch(function () {
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
        return Response.error();
      });
    }));
  });
})();

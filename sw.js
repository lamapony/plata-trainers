/* Platå service worker — precache list is generated at build time into precache-manifest.json */
(function () {
  "use strict";

  var FALLBACK_VERSION = "plata-dev";
  var CORE_URLS = ["./", "./index.html", "./styles.css", "./site.webmanifest"];

  function isAudioUrl(url) {
    return /\.(?:aac|flac|m4a|mp3|ogg|opus|wav)$/i.test(url.pathname);
  }

  function cacheSuccessful(request, response) {
    if (!response || response.status !== 200 || response.type === "opaque") return Promise.resolve();
    var copy = response.clone();
    return readManifest().then(function (manifest) {
      return caches.open(manifest.version).then(function (cache) {
        return cache.put(request, copy);
      });
    }).catch(function () {
      return undefined;
    });
  }

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

    // Audio is deliberately absent from the install precache. The first user-initiated
    // play fetches a complete response and stores it under a range-free cache key.
    if (isAudioUrl(url)) {
      var audioRequest = new Request(url.href, { credentials: "same-origin" });
      var audioCacheWork = Promise.resolve();
      var audioResponse = caches.match(audioRequest).then(function (cachedAudio) {
        if (cachedAudio) return cachedAudio;
        return fetch(audioRequest).then(function (response) {
          audioCacheWork = cacheSuccessful(audioRequest, response);
          return response;
        });
      }).catch(function () { return Response.error(); });
      event.respondWith(audioResponse);
      event.waitUntil(audioResponse.then(function () { return audioCacheWork; }).catch(function () { return undefined; }));
      return;
    }

    var runtimeCacheWork = Promise.resolve();
    var runtimeResponse = caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        runtimeCacheWork = cacheSuccessful(event.request, response);
        return response;
      }).catch(function () {
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
        return Response.error();
      });
    });
    event.respondWith(runtimeResponse);
    event.waitUntil(runtimeResponse.then(function () { return runtimeCacheWork; }).catch(function () { return undefined; }));
  });
})();

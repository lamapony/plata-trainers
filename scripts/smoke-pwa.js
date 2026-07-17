#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const vm = require("node:vm");
const os = require("node:os");
const { buildPrecacheManifest } = require("./build-precache-manifest");

const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function ensureIcons() {
  const icon192 = path.join(root, "assets", "icons", "icon-192.png");
  const icon512 = path.join(root, "assets", "icons", "icon-512.png");
  if (fs.existsSync(icon192) && fs.existsSync(icon512)) return;
  const result = spawnSync(process.execPath, [path.join(__dirname, "build-pwa-icons.js")], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`build-pwa-icons failed\n${result.stdout}\n${result.stderr}`);
  }
}

function main() {
  ensureIcons();

  assert(fs.existsSync(path.join(root, "sw.js")), "sw.js: missing service worker");
  assert(fs.existsSync(path.join(root, "shared", "plata-pwa.js")), "shared/plata-pwa.js: missing registration helper");

  const sw = read("sw.js");
  assert(sw.includes("install"), "sw.js: missing install handler");
  assert(sw.includes("activate"), "sw.js: missing activate handler");
  assert(sw.includes("fetch"), "sw.js: missing fetch handler");
  assert(sw.includes("precache-manifest.json"), "sw.js: must load precache-manifest.json");

  const manifest = JSON.parse(read("site.webmanifest"));
  assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2, "site.webmanifest: need at least two icons");
  manifest.icons.forEach((icon, index) => {
    assert(icon.src && icon.sizes && icon.type, `site.webmanifest.icons[${index}]: incomplete icon entry`);
    const iconPath = icon.src.replace(/^\.\//, "");
    assert(fs.existsSync(path.join(root, iconPath)), `site.webmanifest.icons[${index}]: missing file ${icon.src}`);
  });
  assert(manifest.display === "standalone", "site.webmanifest: display must be standalone");
  assert(manifest.start_url, "site.webmanifest: start_url required");

  const ogPath = path.join(root, "assets", "og-plata.png");
  if (!fs.existsSync(ogPath)) {
    const ogBuild = spawnSync(process.execPath, [path.join(__dirname, "build-pwa-icons.js")], {
      cwd: root,
      encoding: "utf8"
    });
    if (ogBuild.status !== 0) {
      throw new Error(`build-pwa-icons failed for OG image\n${ogBuild.stdout}\n${ogBuild.stderr}`);
    }
  }
  assert(fs.existsSync(ogPath), "assets/og-plata.png: missing OG image");

  ["index.html", "dashboard.html", "program.html", "quality.html", "proof.html"].forEach((page) => {
    const html = read(page);
    assert(html.includes('rel="manifest"'), `${page}: missing manifest link`);
    assert(html.includes("assets/icons/icon-192.png"), `${page}: missing install icon link`);
    assert(html.includes("shared/plata-pwa.js"), `${page}: must load shared/plata-pwa.js`);
  });

  assert(read("index.html").includes('id="pwa-status"'), "index.html: missing learner-visible PWA status region");
  assert(read("dashboard.html").includes('id="pwa-status"'), "dashboard.html: missing learner-visible PWA status region");

  const pwaContext = {
    document: {
      readyState: "complete",
      querySelectorAll() { return []; },
      getElementById() { return null; },
      addEventListener() {}
    },
    addEventListener() {},
    matchMedia() { return { matches: false }; },
    navigator: {}
  };
  pwaContext.window = pwaContext;
  pwaContext.globalThis = pwaContext;
  vm.createContext(pwaContext);
  vm.runInContext(read("shared/plata-pwa.js"), pwaContext, { filename: "shared/plata-pwa.js" });
  assert(pwaContext.PlataPWA && typeof pwaContext.PlataPWA.getStatus === "function", "shared/plata-pwa.js: must expose PlataPWA.getStatus");
  const status = pwaContext.PlataPWA.getStatus();
  assert(status && status.key && status.label && status.detail, "PlataPWA.getStatus: must return learner-readable status");

  const indexHtml = read("index.html");
  assert(indexHtml.includes("id=\"narrative-gallery\""), "index.html: missing narrative lesson gallery");
  assert(indexHtml.includes("One situation. One precise correction. Then try again."), "index.html: home must name the scene-to-repair loop");
  assert(indexHtml.includes('property="og:image"'), "index.html: missing og:image");
  assert(indexHtml.includes("og-plata.png"), "index.html: og:image must reference og-plata.png");
  assert(indexHtml.includes("summary_large_image"), "index.html: twitter card should be summary_large_image");

  assert(fs.existsSync(path.join(root, "scripts", "build-precache-manifest.js")), "scripts/build-precache-manifest.js: missing");
  assert(sw.includes("isAudioUrl"), "sw.js: audio needs an explicit lazy runtime-cache path");
  const pwaTemp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-precache-"));
  try {
    fs.writeFileSync(path.join(pwaTemp, "index.html"), "one");
    fs.writeFileSync(path.join(pwaTemp, "voice.mp3"), "audio-one");
    const first = buildPrecacheManifest(pwaTemp);
    assert(!first.urls.includes("./voice.mp3"), "precache manifest must not include audio files");
    fs.writeFileSync(path.join(pwaTemp, "voice.mp3"), "audio-two");
    const second = buildPrecacheManifest(pwaTemp);
    assert(first.version !== second.version, "audio content changes must rotate the service-worker cache version");
  } finally {
    fs.rmSync(pwaTemp, { recursive: true, force: true });
  }

  const publicRoot = path.join(root, ".dist", "pages");
  if (fs.existsSync(publicRoot)) {
    const precachePath = path.join(publicRoot, "precache-manifest.json");
    assert(fs.existsSync(precachePath), "built artifact: missing precache-manifest.json");
    const precache = JSON.parse(fs.readFileSync(precachePath, "utf8"));
    assert(precache.version && Array.isArray(precache.urls) && precache.urls.length > 10, "precache-manifest.json: invalid manifest");
    assert(precache.urls.includes("./sw.js"), "precache-manifest.json: must include ./sw.js");
    assert(fs.existsSync(path.join(publicRoot, "sw.js")), "built artifact: missing sw.js");
  }

  console.log("PWA smoke passed");
}

try {
  main();
} catch (err) {
  console.error(`PWA smoke failed: ${err.message}`);
  process.exit(1);
}

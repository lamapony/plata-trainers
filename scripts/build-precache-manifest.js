#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

function shouldPrecache(relPath) {
  if (!relPath || relPath.startsWith(".")) return false;
  if (relPath === "precache-manifest.json") return false;
  const ext = path.extname(relPath).toLowerCase();
  return [
    ".css",
    ".html",
    ".ico",
    ".js",
    ".json",
    ".png",
    ".svg",
    ".txt",
    ".webmanifest",
    ".xml"
  ].includes(ext);
}

function walkFiles(dir) {
  const files = [];
  function walk(current, prefix) {
    fs.readdirSync(current, { withFileTypes: true }).forEach(entry => {
      if (entry.name.startsWith(".")) return;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full, rel);
        return;
      }
      if (entry.isFile()) files.push(rel.replaceAll(path.sep, "/"));
    });
  }
  walk(dir, "");
  return files.sort();
}

function buildPrecacheManifest(publicRoot) {
  const files = walkFiles(publicRoot).filter(shouldPrecache);
  const urls = ["./"];
  files.forEach(file => {
    const url = `./${file}`;
    if (!urls.includes(url)) urls.push(url);
  });
  const version = `plata-${crypto.createHash("sha256").update(files.join("\n")).digest("hex").slice(0, 12)}`;
  return { version, urls };
}

function writePrecacheManifest(publicRoot) {
  const manifest = buildPrecacheManifest(publicRoot);
  const target = path.join(publicRoot, "precache-manifest.json");
  fs.writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

module.exports = {
  buildPrecacheManifest,
  writePrecacheManifest,
  shouldPrecache
};

if (require.main === module) {
  const publicRoot = path.resolve(process.argv[2] || path.join(__dirname, "..", ".dist", "pages"));
  const manifest = writePrecacheManifest(publicRoot);
  console.log(`precache manifest built: ${manifest.version} (${manifest.urls.length} url(s))`);
}

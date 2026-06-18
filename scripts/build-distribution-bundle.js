#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const pagesRoot = path.join(repoRoot, ".dist", "pages");
const distDir = path.join(repoRoot, ".dist");
const zipPath = path.join(distDir, "plata-offline-bundle.zip");
const manifestPath = path.join(distDir, "plata-offline-bundle.manifest.json");

function rel(file) {
  return path.relative(repoRoot, file).replaceAll(path.sep, "/");
}

function walkFiles(dir) {
  const files = [];
  function walk(current) {
    fs.readdirSync(current, { withFileTypes: true }).forEach(entry => {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        return;
      }
      if (entry.isFile()) files.push(full);
    });
  }
  walk(dir);
  return files;
}

function newestMtimeMs(files) {
  return files.reduce((max, file) => Math.max(max, fs.statSync(file).mtimeMs), 0);
}

function pagesArtifactMissing() {
  if (!fs.existsSync(pagesRoot)) return true;
  const markerFiles = [
    path.join(pagesRoot, "index.html"),
    path.join(pagesRoot, "sw.js"),
    path.join(pagesRoot, "precache-manifest.json"),
    path.join(pagesRoot, "reports", "project-health.json")
  ];
  return markerFiles.some(file => !fs.existsSync(file));
}

function zipArtifactStale() {
  if (pagesArtifactMissing()) return true;
  if (!fs.existsSync(zipPath)) return true;
  const zipMtime = fs.statSync(zipPath).mtimeMs;
  const pagesMtime = newestMtimeMs(walkFiles(pagesRoot));
  return pagesMtime > zipMtime;
}

function pagesArtifactStale() {
  return pagesArtifactMissing() || zipArtifactStale();
}

function runPagesBuild() {
  const result = spawnSync(process.execPath, [path.join(__dirname, "build-pages-artifact.js")], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    console.error(`distribution bundle build failed: pages artifact\n${result.stdout}\n${result.stderr}`);
    process.exit(1);
  }
}

function createZip() {
  fs.mkdirSync(distDir, { recursive: true });
  if (fs.existsSync(zipPath)) fs.rmSync(zipPath, { force: true });

  const result = spawnSync("zip", ["-r", "-q", zipPath, "."], {
    cwd: pagesRoot,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    console.error(`distribution bundle build failed: zip command\n${result.stdout}\n${result.stderr}`);
    process.exit(1);
  }
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function buildDistributionBundle(options = {}) {
  const root = path.resolve(options.root || repoRoot);
  const pages = options.pagesRoot || path.join(root, ".dist", "pages");
  const zip = options.zipPath || path.join(root, ".dist", "plata-offline-bundle.zip");
  const manifestOut = options.manifestPath || path.join(root, ".dist", "plata-offline-bundle.manifest.json");

  if (options.ensurePages !== false && pagesArtifactMissing()) {
    runPagesBuild();
  }

  if (!fs.existsSync(pages)) {
    console.error(`distribution bundle build failed: missing ${rel(pages)}`);
    process.exit(1);
  }

  const files = walkFiles(pages);
  if (options.ensureZip !== false && zipArtifactStale()) {
    createZip();
  } else if (!fs.existsSync(zip)) {
    createZip();
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const manifest = {
    schemaVersion: 1,
    version: pkg.version,
    builtAt: new Date().toISOString(),
    fileCount: files.length,
    sha256: sha256(zip),
    zipPath: rel(zip),
    pagesRoot: rel(pages)
  };

  fs.mkdirSync(path.dirname(manifestOut), { recursive: true });
  fs.writeFileSync(manifestOut, JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

function main() {
  const manifest = buildDistributionBundle();
  console.log(
    `distribution bundle built: ${manifest.zipPath} (${manifest.fileCount} file(s), v${manifest.version}, sha256 ${manifest.sha256.slice(0, 12)}…)`
  );
}

if (require.main === module) main();

module.exports = {
  buildDistributionBundle,
  pagesArtifactMissing,
  pagesArtifactStale,
  zipArtifactStale,
  zipPath,
  manifestPath,
  pagesRoot
};

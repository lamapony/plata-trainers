#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  buildDistributionBundle,
  zipPath,
  manifestPath
} = require("./build-distribution-bundle.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function extractZip(zipFile, targetDir) {
  const result = spawnSync("unzip", ["-q", zipFile, "-d", targetDir], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`unzip failed\n${result.stdout}\n${result.stderr}`);
  }
}

function main() {
  const manifest = buildDistributionBundle({ root: repoRoot });

  assert(fs.existsSync(zipPath), `missing distribution zip ${zipPath}`);
  assert(fs.existsSync(manifestPath), `missing distribution manifest ${manifestPath}`);

  const onDisk = readJson(manifestPath);
  assert(onDisk.version, "manifest.version required");
  assert(onDisk.builtAt, "manifest.builtAt required");
  assert(typeof onDisk.fileCount === "number" && onDisk.fileCount > 0, "manifest.fileCount must be positive");
  assert(onDisk.sha256 === sha256(zipPath), "manifest.sha256 must match zip file");
  assert(onDisk.fileCount === manifest.fileCount, "manifest.fileCount must match pages artifact");

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-offline-bundle-"));
  try {
    extractZip(zipPath, tmp);

    const required = [
      "index.html",
      "sw.js",
      "precache-manifest.json",
      "reports/project-health.json",
      "reports/quality.json"
    ];
    required.forEach(file => {
      assert(fs.existsSync(path.join(tmp, file)), `extracted bundle missing ${file}`);
    });
    assert(fs.statSync(path.join(tmp, "reports")).isDirectory(), "extracted bundle missing reports/ directory");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log(
    `distribution bundle smoke passed: ${manifest.zipPath} (${manifest.fileCount} file(s), v${manifest.version})`
  );
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`distribution bundle smoke failed: ${err.message}`);
    process.exit(1);
  }
}

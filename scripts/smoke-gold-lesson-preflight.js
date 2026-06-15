#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const result = spawnSync(process.execPath, [
  "scripts/preflight-gold-lesson.js",
  "--lesson",
  "lesson-b2-radiator"
], {
  cwd: root,
  encoding: "utf8",
  stdio: "pipe"
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
assert(result.status === 0, "preflight:gold-lesson should pass for lesson-b2-radiator");

console.log("ok - gold lesson preflight orchestrator passes radiator gate");

#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const ignore = new Set([".git", "node_modules", "dist", ".dist"]);
const files = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (ignore.has(name)) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (name.endsWith(".js")) files.push(p);
  }
}

walk(root);
for (const file of files.sort()) {
  const rel = path.relative(root, file);
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.stderr.write(`syntax check failed: ${rel}\n`);
    process.exit(result.status || 1);
  }
}
console.log(`syntax QA passed: ${files.length} js files checked`);

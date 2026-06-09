#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const publicRuntimeScript = path.join(repoRoot, "scripts", "smoke-public-runtime.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function copyRepoRoot(targetRoot) {
  fs.cpSync(repoRoot, targetRoot, {
    recursive: true,
    filter(source) {
      const rel = path.relative(repoRoot, source);
      if (!rel) return true;
      const parts = rel.split(path.sep);
      return !parts.some(part => part === ".git" || part === ".dist" || part === "node_modules" || part === ".DS_Store");
    }
  });
}

function replaceInFile(root, relPath, before, after) {
  const file = path.join(root, relPath);
  const source = fs.readFileSync(file, "utf8");
  assert(source.includes(before), `${relPath}: mutation target not found`);
  fs.writeFileSync(file, source.replace(before, after));
}

function runPublicRuntime(root) {
  return spawnSync(process.execPath, [publicRuntimeScript, "--root", root], {
    cwd: root,
    encoding: "utf8"
  });
}

function assertExpectedOutput(spec, result) {
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  const expected = spec.expectedMessages || [];
  assert(expected.some(message => output.includes(message)), `${spec.name}: expected one of ${expected.map(item => `"${item}"`).join(", ")}\n${output}`);
}

function runMutation(spec) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plata-public-runtime-"));
  try {
    copyRepoRoot(root);
    spec.mutate(root);
    const result = runPublicRuntime(root);
    assert(result.status !== 0, `${spec.name}: public runtime mutation should have failed`);
    assertExpectedOutput(spec, result);
    console.log(`ok - public runtime mutation caught: ${spec.name}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function run() {
  [
    {
      name: "home evaluator links directly to a report",
      mutate(root) {
        replaceInFile(
          root,
          "index.html",
          'href="./proof.html#proof-guided-title"',
          'href="./reports/guided-session.json"'
        );
      },
      expectedMessages: [
        "home page missing guided proof link ./proof.html#proof-guided-title",
        "home evaluator path links directly to report URLs from the root page",
        "home evaluator section links directly to Pages-only reports"
      ]
    },
    {
      name: "proof page drops evaluator hash target",
      mutate(root) {
        replaceInFile(
          root,
          "proof.html",
          'id="proof-evaluator-title"',
          'id="proof-evaluator-title-mutated"'
        );
      },
      expectedMessages: [
        "proof page is missing evaluator hash target",
        "proof.html links to missing target #proof-evaluator-title"
      ]
    },
    {
      name: "demo learner writes localStorage",
      mutate(root) {
        replaceInFile(
          root,
          "scripts/build-demo-learner-report.js",
          "  const storageWrites = Object.keys(env.storage).sort();",
          '  const storageWrites = ["plata:demo-write-regression"];'
        );
      },
      expectedMessages: [
        "demo learner report failed",
        "demo wrote localStorage keys: plata:demo-write-regression",
        "demo learner public route is not read-only"
      ]
    },
    {
      name: "program chip overflow guard removed",
      mutate(root) {
        replaceInFile(
          root,
          "styles.css",
          "  overflow-wrap: anywhere;\n  text-decoration: none;",
          "  text-decoration: none;"
        );
      },
      expectedMessages: [
        "program chips can overflow long labels"
      ]
    }
  ].forEach(runMutation);

  console.log("ok - public runtime mutations prove Pages runtime regressions fail");
}

run();

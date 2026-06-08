#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  buildDemoLearnerReport,
  formatDemoLearnerReport
} = require("./build-demo-learner-report.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runCli(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "build-demo-learner-report.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function runBaseSmoke() {
  const report = buildDemoLearnerReport();
  assert(report.status === "pass", `demo learner report should pass:\n${report.issues.join("\n")}`);
  assert(report.url === "dashboard.html?demo=learner", "demo learner report should name the public demo URL");
  assert(report.totals.attempts === 8, "demo learner should contain the deterministic attempt set");
  assert(report.totals.accuracy === 50, "demo learner should preserve expected accuracy");
  assert(report.totals.storageWrites === 0, "demo learner should remain read-only");
  assert(report.rendered.importDisabled === true, "demo learner import should be disabled");
  assert(report.rendered.today.includes("Study companion"), "demo learner Today surface should render companion copy");
  assert(report.rendered.today.includes("Cited memory"), "demo learner Today surface should cite memory");
  assert(report.plan.kind === "repair", "demo learner should compile a repair plan");
  assert(report.plan.steps.length >= 2, "demo learner should compile a multi-step plan");
  assert(report.memory.factKinds.includes("root_competency_trap"), "demo learner should prove root competency memory");
  assert(report.memory.factKinds.includes("recurring_trap"), "demo learner should prove recurring trap memory");
  assert(report.memory.factKinds.includes("next_review_due"), "demo learner should prove due-review memory");
  assert(report.memory.factSignals.includes("professional-email-agency"), "demo learner should include cross-lesson agency signal");
  assert(report.memory.factSignals.includes("understatement-with-agency"), "demo learner should include radiator agency signal");
  assert(report.companion && report.companion.citedFacts.length >= 2, "demo learner companion should cite memory facts");
  assert(report.guarantees.every(item => item.pass), "demo learner guarantees should pass");
  assert(!JSON.stringify(report).includes("De lover, at radiatoren bliver fikset hurtigt."), "demo report should not leak raw learner text");

  const formatted = formatDemoLearnerReport(report);
  assert(formatted.includes("Demo Learner Report"), "formatter should include report title");
  assert(formatted.includes("Issues:\nnone"), "formatter should show empty issues");
}

function runCliSmoke() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-demo-learner-"));
  try {
    const out = path.join(tmp, "demo-learner.json");
    const built = runCli(["--out", out]);
    assert(built.status === 0, `CLI build should pass\n${built.stdout}\n${built.stderr}`);
    const report = JSON.parse(fs.readFileSync(out, "utf8"));
    assert(report.status === "pass", "CLI output report should pass");
    assert(report.totals.storageWrites === 0, "CLI output should preserve read-only proof");

    const json = runCli(["--json"]);
    assert(json.status === 0, `CLI JSON should pass\n${json.stdout}\n${json.stderr}`);
    assert(JSON.parse(json.stdout).memory.factKinds.includes("root_competency_trap"), "CLI JSON should include root competency facts");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function run() {
  runBaseSmoke();
  runCliSmoke();
  console.log("ok - demo learner report proves the public demo profile");
  console.log("ok - demo learner report stays read-only and privacy-conscious");
  console.log("ok - demo learner report CLI writes JSON artifacts");
}

run();

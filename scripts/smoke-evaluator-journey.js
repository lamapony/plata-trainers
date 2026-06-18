#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { buildDemoLearnerReport } = require("./build-demo-learner-report.js");
const { buildGuidedSessionReport } = require("./build-guided-session-report.js");
const {
  buildEvaluatorJourneyReport,
  formatEvaluatorJourneyReport
} = require("./build-evaluator-journey-report.js");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runCli(args) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "build-evaluator-journey-report.js"), ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function stage(report, id) {
  const found = report.stages.find(item => item.id === id);
  assert(found, `missing evaluator journey stage ${id}`);
  return found;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function runBaseSmoke() {
  const report = buildEvaluatorJourneyReport();
  assert(report.status === "pass", `evaluator journey should pass:\n${report.issues.join("\n")}`);
  assert(report.traceId.startsWith("evaljourney-"), "evaluator journey should expose a stable trace id");
  assert(report.totals.stages === 6, "evaluator journey should cover the six public acceptance stages");
  assert(report.totals.passedStages === 6, "all evaluator journey stages should pass");
  assert(report.returnTrace.storageWrites.length === 0, "demo journey return should stay read-only");
  assert(report.exit.includes("demo=learner"), "journey exit should preserve the demo learner route");
  assert(report.exit.includes("ledger-return=1"), "journey exit should preserve the dashboard return marker");

  const distribution = stage(report, "distribution-proof");
  assert(distribution.url === "proof.html#proof-distribution-title", "distribution stage should link the offline proof hash target");
  assert(distribution.evidence.gate === "check:distribution", "distribution stage should cite the publish gate");
  assert(distribution.evidence.zipPath === ".dist/plata-offline-bundle.zip", "distribution stage should cite the offline bundle path");

  const guided = stage(report, "guided-session-route");
  assert(guided.evidence.planToken && guided.evidence.stepRouteId, "guided route stage should expose route tokens");
  assert(guided.evidence.hash === "#official-reply-passive", "guided route stage should preserve the lesson hash");
  assert(guided.url.includes("?mode=repair&signal=passive-agency&plan=plan-passive&step=s1-passive#official-reply-passive"), "guided route should keep plan and step before the hash");

  const returned = stage(report, "dashboard-return");
  assert(returned.evidence.rendered.today.includes("Step recorded. Continue the route."), "return stage should render the Today return confirmation");
  assert(returned.evidence.rendered.returnReceipt.includes("Continue next step"), "return stage should render the next-step receipt");
  assert(returned.evidence.outcomeFingerprint.startsWith("gdo-"), "return stage should cite the guided outcome receipt");

  const formatted = formatEvaluatorJourneyReport(report);
  assert(formatted.includes("Evaluator Journey Report"), "formatter should include report title");
  assert(formatted.includes("Issues:\nnone"), "formatter should show empty issues");
}

function runMutationSmoke() {
  const proofTargetMissing = buildEvaluatorJourneyReport({
    proofHtml: fs.readFileSync(path.join(repoRoot, "proof.html"), "utf8").replace('id="proof-walkthrough-title"', 'id="proof-walkthrough-title-mutated"')
  });
  assert(proofTargetMissing.status === "fail", "evaluator journey should fail when proof walkthrough target drifts");
  assert(proofTargetMissing.issues.some(issue => issue.includes("proof walkthrough target missing")), "evaluator journey should explain missing proof target");

  const distributionTargetMissing = buildEvaluatorJourneyReport({
    proofHtml: fs.readFileSync(path.join(repoRoot, "proof.html"), "utf8").replace('id="proof-distribution-title"', 'id="proof-distribution-title-mutated"')
  });
  assert(distributionTargetMissing.status === "fail", "evaluator journey should fail when distribution proof target drifts");
  assert(distributionTargetMissing.issues.some(issue => issue.includes("proof distribution hash target missing")), "evaluator journey should explain missing distribution target");

  const demo = buildDemoLearnerReport();
  const demoWrites = buildEvaluatorJourneyReport({
    demo: Object.assign({}, demo, {
      totals: Object.assign({}, demo.totals, { storageWrites: 1 })
    })
  });
  assert(demoWrites.status === "fail", "evaluator journey should fail when demo learner writes storage");
  assert(demoWrites.issues.some(issue => issue.includes("read-only")), "evaluator journey should explain read-only demo drift");

  const guided = clone(buildGuidedSessionReport());
  const memoryBacked = guided.scenarios.find(item => item.id === "memory-backed-repair");
  memoryBacked.session.route.href = "./lessons/lesson-b2-radiator/?mode=repair&signal=passive-agency#official-reply-passive&plan=plan-passive&step=s1-passive";
  const badRoute = buildEvaluatorJourneyReport({ guided });
  assert(badRoute.status === "fail", "evaluator journey should fail when route tokens move into the hash");
  assert(badRoute.issues.some(issue => issue.includes("plan query parameter")), "evaluator journey should explain missing plan query token");
  assert(badRoute.issues.some(issue => issue.includes("step query parameter")), "evaluator journey should explain missing step query token");

  const badReturn = buildEvaluatorJourneyReport({
    returnTrace: {
      status: "fail",
      url: "dashboard.html?demo=learner&ledger-return=1&plan=bad&step=bad#due",
      planToken: "bad",
      stepRouteId: "bad",
      storageWrites: ["plata:journey-regression"],
      rendered: {},
      issues: ["synthetic return drift"]
    }
  });
  assert(badReturn.status === "fail", "evaluator journey should fail when dashboard return trace fails");
  assert(badReturn.issues.some(issue => issue.includes("dashboard return trace")), "evaluator journey should explain dashboard return drift");
}

function runCliSmoke() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plata-evaluator-journey-"));
  try {
    const out = path.join(tmp, "evaluator-journey.json");
    const built = runCli(["--out", out]);
    assert(built.status === 0, `CLI build should pass\n${built.stdout}\n${built.stderr}`);
    const report = JSON.parse(fs.readFileSync(out, "utf8"));
    assert(report.status === "pass", "CLI output report should pass");
    assert(report.stages.some(item => item.id === "dashboard-return"), "CLI output should include dashboard-return stage");
    assert(report.stages.some(item => item.id === "distribution-proof"), "CLI output should include distribution-proof stage");

    const json = runCli(["--json"]);
    assert(json.status === 0, `CLI JSON should pass\n${json.stdout}\n${json.stderr}`);
    assert(JSON.parse(json.stdout).traceId.startsWith("evaljourney-"), "CLI JSON should include trace id");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function run() {
  runBaseSmoke();
  runMutationSmoke();
  runCliSmoke();
  console.log("ok - evaluator journey proves the public demo-to-return path");
  console.log("ok - evaluator journey catches proof target, read-only, route-token, and return drift");
  console.log("ok - evaluator journey CLI writes public JSON artifacts");
}

run();

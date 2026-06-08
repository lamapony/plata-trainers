#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const sharedSources = [
  "shared/plata-kernel.js",
  "shared/plata-events.js",
  "shared/plata-catalog.js"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createReplayContext() {
  const storage = {};
  const context = {
    console,
    Date,
    JSON,
    Math,
    Number,
    Object,
    String,
    Array,
    localStorage: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
      },
      setItem(key, value) {
        storage[key] = String(value);
      },
      removeItem(key) {
        delete storage[key];
      }
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  sharedSources.forEach(relPath => {
    vm.runInContext(fs.readFileSync(path.join(repoRoot, relPath), "utf8"), context, { filename: relPath });
  });
  return context;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    throw new Error(`Unable to read JSON profile ${file}: ${err.message}`);
  }
}

function trainerCatalog(context) {
  const out = {};
  const catalog = context.PlataCatalog && Array.isArray(context.PlataCatalog.trainers) ? context.PlataCatalog.trainers : [];
  catalog.forEach(trainer => {
    out[trainer.id] = trainer;
  });
  return out;
}

function trainerInputs(payload, context) {
  const catalog = trainerCatalog(context);
  const trainers = payload && payload.trainers && typeof payload.trainers === "object" ? payload.trainers : {};
  return Object.keys(trainers).sort().map(trainerId => ({
    trainer: catalog[trainerId] || { id: trainerId, name: trainerId, path: "" },
    state: trainers[trainerId]
  }));
}

function deriveEventLog(payload, context, warnings) {
  const eventsApi = context.PlataEvents;
  assert(eventsApi && eventsApi.replayProfile, "PlataEvents is unavailable");

  if (payload.eventLog && Array.isArray(payload.eventLog.events)) {
    const events = eventsApi.redactEventLog(payload.eventLog.events);
    const replay = eventsApi.replayProfile(events);
    const fingerprint = eventsApi.eventFingerprint(events);
    if (payload.eventLog.fingerprint && payload.eventLog.fingerprint !== fingerprint) {
      warnings.push(`eventLog fingerprint mismatch: exported ${payload.eventLog.fingerprint}, replayed ${fingerprint}`);
    }
    if (payload.eventLog.replay && Number(payload.eventLog.replay.eventCount || 0) !== replay.eventCount) {
      warnings.push(`eventLog replay event count mismatch: exported ${payload.eventLog.replay.eventCount}, replayed ${replay.eventCount}`);
    }
    return {
      source: "exported-event-log",
      fingerprint,
      events,
      replay
    };
  }

  warnings.push("profile export did not include eventLog; derived replay from trainer state and practicePlan");
  const log = eventsApi.profileEventLog({
    trainers: trainerInputs(payload, context),
    practicePlan: payload.practicePlan || null
  }, { kernel: context.PlataKernel });
  return {
    source: "derived-from-profile",
    fingerprint: log.fingerprint,
    events: log.events,
    replay: log.replay
  };
}

function accuracy(correct, attempts) {
  attempts = Number(attempts || 0);
  if (!attempts) return null;
  return Math.round(Number(correct || 0) / attempts * 100);
}

function signalRows(signals, status) {
  return Object.keys(signals || {}).sort().filter(tag => {
    if (!status) return true;
    return signals[tag].status === status;
  }).map(tag => {
    const signal = signals[tag];
    return {
      tag,
      status: signal.status || "open",
      attempts: Number(signal.attempts || 0),
      correct: Number(signal.correct || 0),
      wrong: Number(signal.wrong || 0),
      closedAt: signal.closedAt || "",
      reopenedAt: signal.reopenedAt || "",
      reopenCount: Number(signal.reopenCount || 0)
    };
  });
}

function topItemRows(items) {
  return Object.keys(items || {}).map(itemId => {
    const item = items[itemId] || {};
    return {
      itemId,
      attempts: Number(item.attempts || 0),
      correct: Number(item.correct || 0),
      wrong: Number(item.wrong || 0)
    };
  }).sort((a, b) => b.wrong - a.wrong || b.attempts - a.attempts || a.itemId.localeCompare(b.itemId)).slice(0, 5);
}

function trainerReports(replay) {
  return Object.keys(replay.trainers || {}).sort().map(trainerId => {
    const trainer = replay.trainers[trainerId];
    return {
      trainerId,
      attempts: Number(trainer.attempts || 0),
      correct: Number(trainer.correct || 0),
      wrong: Number(trainer.wrong || 0),
      accuracyPct: accuracy(trainer.correct, trainer.attempts),
      openSignals: signalRows(trainer.signals, "open"),
      closedSignals: signalRows(trainer.signals, "closed"),
      reopenedSignals: signalRows(trainer.signals).filter(signal => signal.reopenCount > 0),
      topItems: topItemRows(trainer.byItemId)
    };
  });
}

function planReports(replay) {
  return Object.keys(replay.plans || {}).sort().map(planToken => {
    const plan = replay.plans[planToken];
    const steps = Object.keys(plan.steps || {}).sort().map(stepId => {
      const step = plan.steps[stepId] || {};
      return {
        stepId,
        trainerId: step.trainerId || "",
        kind: step.kind || "",
        signal: step.signal || "",
        startedAt: step.startedAt || "",
        completedAt: step.completedAt || ""
      };
    });
    return {
      planToken,
      title: plan.title || "",
      kind: plan.kind || "",
      compiledAt: plan.compiledAt || "",
      stepCount: Number(plan.stepCount || 0),
      startedSteps: Number(plan.startedSteps || 0),
      completedSteps: Number(plan.completedSteps || 0),
      openSteps: Math.max(0, Number(plan.stepCount || steps.length || 0) - Number(plan.completedSteps || 0)),
      steps
    };
  });
}

function cleanDebugString(value, limit) {
  if (value === undefined || value === null) return "";
  return String(value).slice(0, limit || 160);
}

function normalizeMemoryCorrection(record) {
  record = record && typeof record === "object" ? record : {};
  const factId = cleanDebugString(record.factId || record.id || "", 120);
  if (!factId) return null;
  return {
    factId,
    reason: cleanDebugString(record.reason || "learner-marked-incorrect", 120),
    correctedAt: cleanDebugString(record.correctedAt || "", 80),
    kind: cleanDebugString(record.kind || "", 80),
    signal: cleanDebugString(record.signal || "", 120),
    trainerId: cleanDebugString(record.trainerId || "", 120),
    sourceFingerprint: cleanDebugString(record.sourceFingerprint || "", 120)
  };
}

function memoryReport(payload, warnings) {
  const memory = payload && payload.memory && typeof payload.memory === "object" ? payload.memory : null;
  if (!memory) {
    return {
      schemaVersion: null,
      fingerprint: "",
      visibleFactCount: 0,
      hiddenFactCount: 0,
      correctedFactCount: 0,
      hiddenFactIds: [],
      corrections: []
    };
  }

  const facts = Array.isArray(memory.facts) ? memory.facts : [];
  const hiddenFactIds = Array.isArray(memory.deletedFactIds) ? memory.deletedFactIds.map(id => cleanDebugString(id, 120)).filter(Boolean) : [];
  if (Object.prototype.hasOwnProperty.call(memory, "deletedFactIds") && !Array.isArray(memory.deletedFactIds)) {
    warnings.push("memory.deletedFactIds is not an array");
  }
  if (Object.prototype.hasOwnProperty.call(memory, "correctionRecords") && !Array.isArray(memory.correctionRecords)) {
    warnings.push("memory.correctionRecords is not an array");
  }
  const rawCorrections = Array.isArray(memory.correctionRecords) ? memory.correctionRecords : [];
  const corrections = rawCorrections.map(normalizeMemoryCorrection).filter(Boolean);
  if (rawCorrections.length !== corrections.length) {
    warnings.push(`memory correction records: ignored ${rawCorrections.length - corrections.length} invalid record(s)`);
  }

  return {
    schemaVersion: memory.schemaVersion || null,
    fingerprint: cleanDebugString(memory.fingerprint || "", 120),
    visibleFactCount: facts.length,
    hiddenFactCount: hiddenFactIds.length,
    correctedFactCount: corrections.length,
    hiddenFactIds: hiddenFactIds.slice(0, 20),
    corrections
  };
}

function addStateConsistencyWarnings(payload, replay, warnings) {
  const states = payload.trainers && typeof payload.trainers === "object" ? payload.trainers : {};
  Object.keys(states).forEach(trainerId => {
    const state = states[trainerId] || {};
    const attemptCount = Array.isArray(state.attempts) ? state.attempts.length : 0;
    const replayCount = replay.trainers[trainerId] ? Number(replay.trainers[trainerId].attempts || 0) : 0;
    if (attemptCount !== replayCount) {
      warnings.push(`${trainerId}: trainer state has ${attemptCount} stored attempts, replay has ${replayCount}`);
    }
  });
  if (!Object.keys(states).length) {
    warnings.push("profile contains no trainer states");
  }
  if (payload.practicePlan && payload.practicePlan.steps && payload.practicePlan.planToken) {
    const plan = replay.plans[payload.practicePlan.planToken];
    if (!plan) warnings.push(`practicePlan ${payload.practicePlan.planToken} did not appear in replay`);
    else if (Number(plan.stepCount || 0) !== payload.practicePlan.steps.length) {
      warnings.push(`practicePlan ${payload.practicePlan.planToken}: expected ${payload.practicePlan.steps.length} step(s), replay has ${plan.stepCount}`);
    }
  }
}

function buildReplayDebugReport(payload, options) {
  payload = payload || {};
  const context = options && options.context || createReplayContext();
  const warnings = [];
  const eventLog = deriveEventLog(payload, context, warnings);
  addStateConsistencyWarnings(payload, eventLog.replay, warnings);
  const memory = memoryReport(payload, warnings);
  return {
    profileSchemaVersion: payload.profileSchemaVersion || null,
    exportedAt: payload.exportedAt || "",
    source: eventLog.source,
    fingerprint: eventLog.fingerprint,
    eventCount: eventLog.replay.eventCount,
    trainers: trainerReports(eventLog.replay),
    plans: planReports(eventLog.replay),
    memory,
    warnings
  };
}

function signalText(signal) {
  const parts = [`${signal.tag} (${signal.wrong} miss${signal.wrong === 1 ? "" : "es"}/${signal.attempts} tries)`];
  if (signal.reopenCount) parts.push(`reopened ${signal.reopenCount}`);
  if (signal.closedAt) parts.push(`closed ${signal.closedAt}`);
  return parts.join(", ");
}

function formatReplayDebugReport(report) {
  const lines = [];
  lines.push("Profile Replay Debug Report");
  lines.push(`Source: ${report.source}`);
  lines.push(`Fingerprint: ${report.fingerprint}`);
  lines.push(`Events: ${report.eventCount}`);
  if (report.exportedAt) lines.push(`Exported: ${report.exportedAt}`);
  lines.push("");
  lines.push("Trainers:");
  if (!report.trainers.length) {
    lines.push("- none");
  } else {
    report.trainers.forEach(trainer => {
      lines.push(`- ${trainer.trainerId}: ${trainer.correct}/${trainer.attempts} correct${trainer.accuracyPct === null ? "" : ` (${trainer.accuracyPct}%)`}, ${trainer.wrong} miss${trainer.wrong === 1 ? "" : "es"}`);
      lines.push(`  open signals: ${trainer.openSignals.length ? trainer.openSignals.map(signalText).join("; ") : "none"}`);
      lines.push(`  closed signals: ${trainer.closedSignals.length ? trainer.closedSignals.map(signalText).join("; ") : "none"}`);
      if (trainer.topItems.length) {
        lines.push(`  top items: ${trainer.topItems.map(item => `${item.itemId} ${item.wrong}/${item.attempts} misses`).join("; ")}`);
      }
    });
  }
  lines.push("");
  lines.push("Plans:");
  if (!report.plans.length) {
    lines.push("- none");
  } else {
    report.plans.forEach(plan => {
      lines.push(`- ${plan.planToken}: ${plan.title || plan.kind || "Practice plan"} (${plan.completedSteps}/${plan.stepCount || plan.steps.length} completed)`);
      plan.steps.forEach(step => {
        const status = step.completedAt ? "done" : (step.startedAt ? "started" : "open");
        lines.push(`  ${step.stepId}: ${status}${step.signal ? `, signal ${step.signal}` : ""}${step.trainerId ? `, trainer ${step.trainerId}` : ""}`);
      });
    });
  }
  lines.push("");
  lines.push("Memory corrections:");
  if (!report.memory || !report.memory.correctedFactCount) {
    lines.push("- none");
  } else {
    lines.push(`- memory ${report.memory.fingerprint || "no fingerprint"}: ${report.memory.visibleFactCount} visible, ${report.memory.hiddenFactCount} hidden, ${report.memory.correctedFactCount} corrected`);
    report.memory.corrections.forEach(record => {
      const facts = [
        record.kind || "",
        record.signal || "",
        record.sourceFingerprint || ""
      ].filter(Boolean).join(", ");
      lines.push(`  ${record.factId}: ${record.reason}${facts ? ` (${facts})` : ""}${record.correctedAt ? ` at ${record.correctedAt}` : ""}`);
    });
  }
  lines.push("");
  lines.push("Warnings:");
  lines.push(report.warnings.length ? report.warnings.map(item => `- ${item}`).join("\n") : "none");
  return lines.join("\n");
}

function argValue(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return "";
  return argv[index + 1] || "";
}

function usage() {
  return [
    "Usage:",
    "  node scripts/debug-profile-replay.js --file plata-backup.json [--json] [--out report.txt]",
    "",
    "Reads a dashboard profile export and prints a replay/debug report."
  ].join("\n");
}

function main(argv) {
  argv = argv || process.argv.slice(2);
  const file = argValue(argv, "--file") || (!argv[0] || argv[0].startsWith("--") ? "" : argv[0]);
  if (!file) {
    console.error(usage());
    process.exit(1);
  }
  const report = buildReplayDebugReport(readJson(file));
  const output = argv.includes("--json")
    ? JSON.stringify(report, null, 2)
    : formatReplayDebugReport(report);
  const out = argValue(argv, "--out");
  if (out) fs.writeFileSync(out, output + "\n");
  else process.stdout.write(output + "\n");
}

if (require.main === module) main();

module.exports = {
  buildReplayDebugReport,
  createReplayContext,
  formatReplayDebugReport
};

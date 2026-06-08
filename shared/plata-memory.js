/* Plata shared learner memory v1
 *
 * Compiles inspectable personalization facts from the privacy-conscious event
 * log. This is the local-first layer underneath any future account memory.
 */
(function (root) {
  "use strict";

  var MEMORY_SCHEMA_VERSION = 1;
  var DEFAULT_REVIEW_DAYS = 7;
  var DEFAULT_STALE_DAYS = 21;

  function numberOr(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function stringOr(value, fallback) {
    if (value === undefined || value === null) return fallback || "";
    return String(value);
  }

  function parseTime(value) {
    var t = new Date(value || "").getTime();
    return Number.isFinite(t) ? t : 0;
  }

  function nowTime(options) {
    return parseTime(options && options.now) || Date.now();
  }

  function isoFromTime(time) {
    return new Date(time).toISOString();
  }

  function daysBetween(earlier, later) {
    var a = parseTime(earlier);
    var b = Number.isFinite(later) ? later : parseTime(later);
    if (!a || !b) return null;
    return Math.max(0, Math.floor((b - a) / 86400000));
  }

  function clamp(value, min, max) {
    value = numberOr(value, min);
    return Math.max(min, Math.min(max, value));
  }

  function stableJson(value) {
    if (value === null || value === undefined) return "null";
    if (Array.isArray(value)) return "[" + value.map(stableJson).join(",") + "]";
    if (typeof value === "object") {
      return "{" + Object.keys(value).sort().map(function (key) {
        return JSON.stringify(key) + ":" + stableJson(value[key]);
      }).join(",") + "}";
    }
    return JSON.stringify(value);
  }

  function stableHash(text) {
    text = stringOr(text, "");
    var hash = 5381;
    for (var i = 0; i < text.length; i++) {
      hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
    }
    return (hash >>> 0).toString(36);
  }

  function normaliseTags(tags) {
    var source = Array.isArray(tags) ? tags : (tags ? [tags] : []);
    var seen = {};
    var out = [];
    source.forEach(function (tag) {
      var normalized = stringOr(tag, "").trim();
      if (!normalized || seen[normalized]) return;
      seen[normalized] = true;
      out.push(normalized);
    });
    return out;
  }

  function eventLogFromInput(input, options) {
    input = input || {};
    options = options || {};
    if (Array.isArray(input)) return input.slice();
    if (Array.isArray(input.events)) return input.events.slice();
    if (input.eventLog && Array.isArray(input.eventLog.events)) return input.eventLog.events.slice();
    if (root.PlataEvents && root.PlataEvents.profileEventLog) {
      return root.PlataEvents.profileEventLog(input, {
        kernel: options.kernel || root.PlataKernel
      }).events || [];
    }
    return [];
  }

  function compareEvents(a, b) {
    return parseTime(a && a.at) - parseTime(b && b.at)
      || stringOr(a && a.type, "").localeCompare(stringOr(b && b.type, ""))
      || stringOr(a && a.id, "").localeCompare(stringOr(b && b.id, ""));
  }

  function ensureSignalBucket(map, event, tag) {
    var trainerId = stringOr(event && event.trainerId, "unknown");
    var signal = stringOr(tag || event && event.signal, "unknown");
    var key = trainerId + "::" + signal;
    if (!map[key]) {
      map[key] = {
        trainerId: trainerId,
        trainerName: stringOr(event && event.trainerName, ""),
        signal: signal,
        attempts: 0,
        correct: 0,
        wrong: 0,
        modeCounts: {},
        itemCounts: {},
        firstAt: "",
        lastAt: "",
        closedAt: "",
        reopenedAt: "",
        status: "open",
        label: "",
        action: "",
        sourceEventIds: []
      };
    }
    return map[key];
  }

  function pushSource(bucket, event) {
    var id = stringOr(event && event.id, "");
    if (id && bucket.sourceEventIds.indexOf(id) === -1) bucket.sourceEventIds.push(id);
  }

  function touchBucketTime(bucket, at) {
    if (!at) return;
    if (!bucket.firstAt || parseTime(at) < parseTime(bucket.firstAt)) bucket.firstAt = at;
    if (!bucket.lastAt || parseTime(at) > parseTime(bucket.lastAt)) bucket.lastAt = at;
  }

  function buildSignalBuckets(events) {
    var buckets = {};
    (events || []).slice().sort(compareEvents).forEach(function (event) {
      if (event.type === "attempt.recorded") {
        normaliseTags(event.diagnosticTags || event.tags).forEach(function (tag) {
          var bucket = ensureSignalBucket(buckets, event, tag);
          bucket.attempts += 1;
          if (event.correct) bucket.correct += 1;
          else bucket.wrong += 1;
          var mode = stringOr(event.mode, "practice") || "practice";
          bucket.modeCounts[mode] = numberOr(bucket.modeCounts[mode], 0) + 1;
          var itemId = stringOr(event.itemId, "");
          if (itemId) bucket.itemCounts[itemId] = numberOr(bucket.itemCounts[itemId], 0) + 1;
          touchBucketTime(bucket, event.at);
          pushSource(bucket, event);
        });
      } else if (event.type === "repair.closed") {
        var closedBucket = ensureSignalBucket(buckets, event, event.signal);
        closedBucket.status = "closed";
        closedBucket.closedAt = event.at || closedBucket.closedAt;
        closedBucket.label = stringOr(event.label, closedBucket.label);
        closedBucket.action = stringOr(event.action, closedBucket.action);
        touchBucketTime(closedBucket, event.at);
        pushSource(closedBucket, event);
      } else if (event.type === "signal.reopened") {
        var reopenedBucket = ensureSignalBucket(buckets, event, event.signal);
        reopenedBucket.status = "open";
        reopenedBucket.reopenedAt = event.at || reopenedBucket.reopenedAt;
        reopenedBucket.label = stringOr(event.label, reopenedBucket.label);
        touchBucketTime(reopenedBucket, event.at);
        pushSource(reopenedBucket, event);
      }
    });
    return Object.keys(buckets).map(function (key) { return buckets[key]; });
  }

  function sourceFingerprint(sourceEventIds) {
    return "memsrc-" + stableHash(stableJson((sourceEventIds || []).slice().sort())).slice(0, 12);
  }

  function factId(kind, bucket, suffix) {
    return "mem-" + stableHash(stableJson({
      kind: kind,
      trainerId: bucket.trainerId,
      signal: bucket.signal || "",
      suffix: suffix || "",
      source: bucket.sourceEventIds
    })).slice(0, 12);
  }

  function evidence(label, value) {
    return { label: label, value: String(value) };
  }

  function topItem(bucket) {
    var best = "";
    var bestCount = -1;
    Object.keys(bucket.itemCounts || {}).forEach(function (itemId) {
      var count = numberOr(bucket.itemCounts[itemId], 0);
      if (count > bestCount || (count === bestCount && itemId.localeCompare(best) < 0)) {
        best = itemId;
        bestCount = count;
      }
    });
    return best;
  }

  function confidenceFromBucket(bucket, base) {
    var totalBoost = Math.min(0.22, numberOr(bucket.attempts, 0) * 0.035);
    var wrongBoost = Math.min(0.18, numberOr(bucket.wrong, 0) * 0.045);
    return clamp(base + totalBoost + wrongBoost, 0.05, 0.98);
  }

  function baseFact(kind, bucket, options) {
    options = options || {};
    var sourceIds = (bucket.sourceEventIds || []).slice().sort();
    var fact = {
      schemaVersion: MEMORY_SCHEMA_VERSION,
      id: factId(kind, bucket, options.suffix),
      kind: kind,
      status: options.status || "active",
      trainerId: bucket.trainerId,
      trainerName: bucket.trainerName || "",
      signal: bucket.signal || "",
      itemId: topItem(bucket),
      title: options.title || "",
      copy: options.copy || "",
      confidence: clamp(options.confidence, 0.05, 0.98),
      at: options.at || bucket.lastAt || bucket.closedAt || bucket.reopenedAt || "",
      expiresAt: options.expiresAt || "",
      sourceEventIds: sourceIds,
      sourceFingerprint: sourceFingerprint(sourceIds),
      evidence: options.evidence || [],
      privacy: { containsRawAnswerText: false }
    };
    if (options.competencyId) fact.competencyId = options.competencyId;
    if (options.competencyLabel) fact.competencyLabel = options.competencyLabel;
    if (options.signals) fact.signals = options.signals;
    if (options.trainerIds) fact.trainerIds = options.trainerIds;
    return fact;
  }

  function competencyForSignal(signal) {
    var graph = root.PlataCompetencies;
    if (!graph || !graph.competencyIdForTag) return null;
    var id = graph.competencyIdForTag(signal);
    if (!id) return null;
    var def = graph.get ? graph.get(id) : null;
    return {
      id: id,
      label: def && def.label || id
    };
  }

  function signalAccuracy(bucket) {
    return bucket.attempts ? bucket.correct / bucket.attempts : 0;
  }

  function pushSignalFacts(facts, bucket, options) {
    var now = nowTime(options);
    var reviewDays = numberOr(options.reviewDays, DEFAULT_REVIEW_DAYS);
    var staleDays = numberOr(options.staleDays, DEFAULT_STALE_DAYS);
    var total = numberOr(bucket.attempts, 0);
    var wrong = numberOr(bucket.wrong, 0);
    var correct = numberOr(bucket.correct, 0);
    var accuracy = signalAccuracy(bucket);
    var ageDays = daysBetween(bucket.lastAt, now);
    var titleSignal = bucket.label || bucket.signal;
    var commonEvidence = [
      evidence("attempts", total),
      evidence("correct", correct),
      evidence("wrong", wrong),
      evidence("accuracy", Math.round(accuracy * 100) + "%")
    ];

    if (bucket.status !== "closed" && wrong > 0 && wrong >= correct) {
      facts.push(baseFact("weak_signal", bucket, {
        status: "open",
        title: "Weak signal: " + titleSignal,
        copy: "This signal is still shaping the next recommendation.",
        confidence: confidenceFromBucket(bucket, 0.58),
        evidence: commonEvidence.concat([
          evidence("status", bucket.reopenedAt ? "reopened" : "open")
        ])
      }));
    }

    if (bucket.status !== "closed" && wrong >= 2 && wrong >= correct) {
      facts.push(baseFact("recurring_trap", bucket, {
        status: "open",
        title: "Recurring trap: " + titleSignal,
        copy: "The same underlying signal has produced repeated misses.",
        confidence: confidenceFromBucket(bucket, 0.66),
        evidence: commonEvidence.concat([
          evidence("recurrence", wrong + " misses")
        ])
      }));
    }

    if (bucket.status === "closed") {
      facts.push(baseFact("repaired_signal", bucket, {
        status: "resolved",
        title: "Repaired signal: " + titleSignal,
        copy: "A successful repair closed this signal until a later miss reopens it.",
        confidence: confidenceFromBucket(bucket, 0.72),
        at: bucket.closedAt || bucket.lastAt,
        evidence: commonEvidence.concat([
          evidence("closedAt", bucket.closedAt || ""),
          evidence("repairAction", bucket.action || "")
        ]).filter(function (row) { return row.value; })
      }));
    }

    if (total >= 3 && accuracy >= 0.8 && wrong <= 1) {
      facts.push(baseFact("stable_strength", bucket, {
        status: "stable",
        title: "Stable strength: " + titleSignal,
        copy: "Recent evidence suggests this signal is not the best repair target right now.",
        confidence: confidenceFromBucket(bucket, 0.62),
        evidence: commonEvidence
      }));
    }

    if (total >= 2 && ageDays !== null && ageDays >= staleDays) {
      facts.push(baseFact("stale_skill", bucket, {
        status: "stale",
        title: "Stale skill: " + titleSignal,
        copy: "This signal has useful evidence, but it has not been touched recently.",
        confidence: clamp(0.48 + Math.min(0.3, ageDays / 100), 0.05, 0.9),
        evidence: commonEvidence.concat([
          evidence("daysSinceLastSeen", ageDays)
        ])
      }));
    }

    if (total > 0 && ageDays !== null && ageDays >= reviewDays) {
      facts.push(baseFact("next_review_due", bucket, {
        status: "due",
        title: "Review due: " + titleSignal,
        copy: "Spacing says this signal is old enough to be checked again.",
        confidence: clamp(0.42 + Math.min(0.28, ageDays / 100), 0.05, 0.85),
        expiresAt: isoFromTime(now + 86400000),
        evidence: [
          evidence("daysSinceLastSeen", ageDays),
          evidence("reviewIntervalDays", reviewDays)
        ]
      }));
    }
  }

  function buildPlanFacts(events) {
    var completedByKind = {};
    var sourceByKind = {};
    (events || []).forEach(function (event) {
      if (event.type !== "plan.step.completed") return;
      var kind = stringOr(event.kind, "practice") || "practice";
      completedByKind[kind] = numberOr(completedByKind[kind], 0) + 1;
      if (!sourceByKind[kind]) sourceByKind[kind] = [];
      if (event.id) sourceByKind[kind].push(event.id);
    });

    return Object.keys(completedByKind).sort().map(function (kind) {
      var sourceIds = sourceByKind[kind].slice().sort();
      var count = completedByKind[kind];
      var bucket = {
        trainerId: "profile",
        trainerName: "Profile",
        signal: kind,
        attempts: count,
        correct: count,
        wrong: 0,
        itemCounts: {},
        sourceEventIds: sourceIds,
        lastAt: ""
      };
      return baseFact("preferred_context", bucket, {
        status: "observed",
        suffix: kind,
        title: "Completed context: " + kind,
        copy: "The learner has completed tracked practice-plan steps in this context.",
        confidence: clamp(0.5 + Math.min(0.32, count * 0.08), 0.05, 0.9),
        evidence: [evidence("completedSteps", count), evidence("context", kind)]
      });
    });
  }

  function buildRootCompetencyFacts(signalBuckets) {
    var groups = {};
    (signalBuckets || []).forEach(function (bucket) {
      var wrong = numberOr(bucket.wrong, 0);
      var correct = numberOr(bucket.correct, 0);
      if (bucket.status === "closed" || wrong <= 0 || wrong < correct) return;
      var competency = competencyForSignal(bucket.signal);
      if (!competency) return;
      if (!groups[competency.id]) {
        groups[competency.id] = {
          competency: competency,
          trainers: {},
          signals: {},
          sourceEventIds: [],
          wrong: 0,
          attempts: 0,
          lastAt: ""
        };
      }
      var group = groups[competency.id];
      group.trainers[bucket.trainerId] = true;
      group.signals[bucket.signal] = true;
      group.wrong += wrong;
      group.attempts += numberOr(bucket.attempts, 0);
      if (!group.lastAt || parseTime(bucket.lastAt) > parseTime(group.lastAt)) group.lastAt = bucket.lastAt;
      (bucket.sourceEventIds || []).forEach(function (id) {
        if (id && group.sourceEventIds.indexOf(id) === -1) group.sourceEventIds.push(id);
      });
    });

    return Object.keys(groups).sort().map(function (id) {
      var group = groups[id];
      var signals = Object.keys(group.signals).sort();
      var trainerIds = Object.keys(group.trainers).sort();
      if (signals.length < 2 || trainerIds.length < 2) return null;
      var bucket = {
        trainerId: "profile",
        trainerName: "Profile",
        signal: id,
        attempts: group.attempts,
        correct: Math.max(0, group.attempts - group.wrong),
        wrong: group.wrong,
        itemCounts: {},
        sourceEventIds: group.sourceEventIds.slice().sort(),
        lastAt: group.lastAt
      };
      return baseFact("root_competency_trap", bucket, {
        status: "open",
        suffix: signals.join("|"),
        title: "Root skill trap: " + group.competency.label,
        copy: "Different lessons point to the same root skill, so the next repair should treat this as a transferable pattern.",
        confidence: clamp(0.68 + Math.min(0.2, signals.length * 0.04) + Math.min(0.08, group.wrong * 0.01), 0.05, 0.96),
        competencyId: id,
        competencyLabel: group.competency.label,
        signals: signals,
        trainerIds: trainerIds,
        evidence: [
          evidence("rootSkill", group.competency.label),
          evidence("signals", signals.join(", ")),
          evidence("trainers", trainerIds.join(", ")),
          evidence("wrong", group.wrong),
          evidence("attempts", group.attempts)
        ]
      });
    }).filter(Boolean);
  }

  function factPriority(fact) {
    var ranks = {
      recurring_trap: 100,
      root_competency_trap: 95,
      weak_signal: 90,
      next_review_due: 70,
      stale_skill: 60,
      repaired_signal: 45,
      preferred_context: 35,
      stable_strength: 25
    };
    return ranks[fact.kind] || 0;
  }

  function compareFacts(a, b) {
    return factPriority(b) - factPriority(a)
      || numberOr(b.confidence, 0) - numberOr(a.confidence, 0)
      || parseTime(b.at) - parseTime(a.at)
      || stringOr(a.id, "").localeCompare(stringOr(b.id, ""));
  }

  function compileMemoryFacts(input, options) {
    options = options || {};
    var events = eventLogFromInput(input, options).slice().sort(compareEvents);
    var facts = [];
    var signalBuckets = buildSignalBuckets(events);
    signalBuckets.forEach(function (bucket) {
      pushSignalFacts(facts, bucket, options);
    });
    facts = facts.concat(buildRootCompetencyFacts(signalBuckets));
    facts = facts.concat(buildPlanFacts(events));
    return facts.sort(compareFacts).slice(0, numberOr(options.limit, 100));
  }

  function summarizeMemoryFacts(facts) {
    var summary = {
      schemaVersion: MEMORY_SCHEMA_VERSION,
      total: 0,
      byKind: {},
      openSignals: 0,
      dueReviews: 0
    };
    (facts || []).forEach(function (fact) {
      summary.total += 1;
      summary.byKind[fact.kind] = numberOr(summary.byKind[fact.kind], 0) + 1;
      if (fact.kind === "weak_signal" || fact.kind === "recurring_trap" || fact.kind === "root_competency_trap") summary.openSignals += 1;
      if (fact.kind === "next_review_due") summary.dueReviews += 1;
    });
    return summary;
  }

  function memoryFingerprint(facts) {
    return "mem-" + stableHash(stableJson((facts || []).map(function (fact) {
      return {
        id: fact.id,
        kind: fact.kind,
        status: fact.status,
        trainerId: fact.trainerId,
        signal: fact.signal,
        confidence: fact.confidence,
        sourceFingerprint: fact.sourceFingerprint
      };
    }))).slice(0, 12);
  }

  root.PlataMemory = {
    memorySchemaVersion: MEMORY_SCHEMA_VERSION,
    compileMemoryFacts: compileMemoryFacts,
    summarizeMemoryFacts: summarizeMemoryFacts,
    memoryFingerprint: memoryFingerprint
  };
})(typeof window !== "undefined" ? window : globalThis);

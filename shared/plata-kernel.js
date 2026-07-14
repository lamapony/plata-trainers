/* Platå shared learning kernel v2
 *
 * Static browser-only state engine for trainer progress, imports/exports,
 * session picking, gates, and weak-tag diagnostics.
 *
 * Schema v2 separates objective grading from self-report submissions.
 * Self-report never changes box, mastery, or correctness streak.
 * Accuracy uses meta.gradedAttempts (objective only).
 *
 * Spaced review is Leitner (boxes 1–5 → 1, 2, 4, 7, 14 days), not SM-2.
 */
(function (root) {
  "use strict";

  var SCHEMA_VERSION = 2;
  var MAX_ATTEMPTS = 1000;
  var ASSESSMENT_OBJECTIVE = "objective";
  var ASSESSMENT_SELF_REPORT = "self-report";
  var SKRIVE_LEGACY_BACKUP_KEY = "plata:trainer:skrive:state:legacy-v1-backup";
  /** Interval days by Leitner box index (1–5). Index 0 unused. */
  var LEITNER_INTERVAL_DAYS = [0, 1, 2, 4, 7, 14];

  function nowIso() {
    return new Date().toISOString();
  }

  function todayKey() {
    return nowIso().slice(0, 10);
  }

  function storageAvailable() {
    try {
      return !!root.localStorage;
    } catch (_) {
      return false;
    }
  }

  function stateKey(trainerId) {
    return "plata:trainer:" + trainerId + ":state:v1";
  }

  function freshState(trainerId) {
    var now = nowIso();
    return {
      schemaVersion: SCHEMA_VERSION,
      trainerId: trainerId,
      createdAt: now,
      updatedAt: now,
      byItemId: {},
      items: {},
      attempts: [],
      meta: {
        totalAttempts: 0,
        gradedAttempts: 0,
        totalCorrect: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastSessionDate: "",
        dailyAttempts: {},
        socialSnapshots: [],
        repairClosures: {}
      }
    };
  }

  function normaliseTags(tags) {
    if (!tags) return [];
    if (!Array.isArray(tags)) tags = [tags];
    var seen = {};
    var out = [];
    tags.forEach(function (tag) {
      if (tag === undefined || tag === null) return;
      var s = String(tag).trim();
      if (!s || seen[s]) return;
      seen[s] = true;
      out.push(s);
    });
    return out;
  }

  function normaliseRecord(record, tags) {
    var source = record || {};
    return {
      box: clampNumber(source.box, 1, 5, 1),
      correct: Math.max(0, numberOr(source.correct, 0)),
      wrong: Math.max(0, numberOr(source.wrong, 0)),
      lastSeen: source.lastSeen || null,
      mastered: !!source.mastered,
      tags: normaliseTags(source.tags || tags),
      attempts: source.attempts && typeof source.attempts === "object" ? source.attempts : { total: 0, correct: 0, wrong: 0 },
      nextDueAt: source.nextDueAt || null,
      intervalDays: source.intervalDays === undefined || source.intervalDays === null
        ? null
        : Math.max(0, numberOr(source.intervalDays, 0))
    };
  }

  function numberOr(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clampNumber(value, min, max, fallback) {
    return Math.max(min, Math.min(max, numberOr(value, fallback)));
  }

  function intervalForBox(box) {
    return LEITNER_INTERVAL_DAYS[clampNumber(box, 1, 5, 1)];
  }

  function addDaysIso(fromIso, days) {
    var base = fromIso ? new Date(fromIso) : new Date();
    if (!Number.isFinite(base.getTime())) base = new Date();
    var next = new Date(base.getTime());
    next.setUTCDate(next.getUTCDate() + Math.max(0, numberOr(days, 0)));
    return next.toISOString();
  }

  function scheduleAfterAttempt(rec, correct, at) {
    if (correct) {
      rec.intervalDays = intervalForBox(rec.box);
    } else {
      rec.intervalDays = intervalForBox(1);
    }
    rec.nextDueAt = addDaysIso(at || nowIso(), rec.intervalDays);
    return rec;
  }

  function backfillLeitnerSchedule(rec) {
    if (!rec) return rec;
    if (rec.nextDueAt) {
      if (rec.intervalDays === null || rec.intervalDays === undefined) {
        rec.intervalDays = intervalForBox(rec.box);
      }
      return rec;
    }
    if (rec.lastSeen) {
      rec.intervalDays = intervalForBox(rec.box);
      rec.nextDueAt = addDaysIso(rec.lastSeen, rec.intervalDays);
    }
    return rec;
  }

  function isItemNew(rec) {
    if (!rec) return true;
    return !rec.lastSeen && !rec.nextDueAt;
  }

  function isItemDue(rec, now) {
    if (!rec) return true;
    if (isItemNew(rec)) return true;
    if (!rec.nextDueAt) return true;
    var due = new Date(rec.nextDueAt).getTime();
    if (!Number.isFinite(due)) return true;
    var stamp = now ? new Date(now).getTime() : Date.now();
    if (!Number.isFinite(stamp)) stamp = Date.now();
    return due <= stamp;
  }

  function countDueItems(state, now) {
    var byItemId = state && state.byItemId || {};
    return Object.keys(byItemId).filter(function (id) {
      return isItemDue(byItemId[id], now);
    }).length;
  }

  function weaknessScore(rec) {
    rec = rec || {};
    var box = numberOr(rec.box, 1);
    var wrong = numberOr(rec.wrong, 0);
    var correct = numberOr(rec.correct, 0);
    var errorRate = wrong / Math.max(1, correct + wrong);
    return (6 - box) * 10 + errorRate * 20 + wrong;
  }

  function resolveAssessmentKind(attempt, trainerId) {
    if (attempt && (attempt.assessmentKind === ASSESSMENT_SELF_REPORT || attempt.assessmentKind === ASSESSMENT_OBJECTIVE)) {
      return attempt.assessmentKind;
    }
    if (attempt && (attempt.reason === "self-grade" || attempt.reason === "self-report")) {
      return ASSESSMENT_SELF_REPORT;
    }
    if (String(trainerId || "") === "skrive") return ASSESSMENT_SELF_REPORT;
    return ASSESSMENT_OBJECTIVE;
  }

  function isObjectiveAttempt(attempt) {
    return !attempt || attempt.assessmentKind !== ASSESSMENT_SELF_REPORT;
  }

  function maybeBackupLegacySkrive(rawInput, trainerId) {
    if (String(trainerId || "") !== "skrive" || !rawInput || typeof rawInput !== "object") return;
    if (numberOr(rawInput.schemaVersion, 1) >= 2) return;
    if (!storageAvailable()) return;
    try {
      if (root.localStorage.getItem(SKRIVE_LEGACY_BACKUP_KEY)) return;
      root.localStorage.setItem(SKRIVE_LEGACY_BACKUP_KEY, JSON.stringify(rawInput));
    } catch (_) {
      /* ignore quota / private-mode failures */
    }
  }

  function reclassifyLegacySkriveRecords(state) {
    if (String(state.trainerId || "") !== "skrive") return;
    Object.keys(state.byItemId || {}).forEach(function (itemId) {
      var rec = state.byItemId[itemId];
      if (!rec) return;
      // Keep volume and dates; drop false mastery signals from self-graded length/checkboxes.
      rec.box = 1;
      rec.mastered = false;
      rec.correct = 0;
      rec.wrong = 0;
      rec.nextDueAt = null;
      rec.intervalDays = null;
      if (rec.attempts && typeof rec.attempts === "object") {
        rec.attempts.correct = 0;
        rec.attempts.wrong = 0;
      }
      state.items[itemId] = rec;
    });
  }

  function recountMetaFromAttempts(state) {
    var attempts = state.attempts || [];
    var graded = 0;
    var correct = 0;
    var streak = 0;
    var longest = 0;
    attempts.forEach(function (a) {
      if (!isObjectiveAttempt(a)) return;
      graded += 1;
      if (a.correct === true) {
        correct += 1;
        streak += 1;
        longest = Math.max(longest, streak);
      } else {
        streak = 0;
      }
    });
    state.meta.totalAttempts = attempts.length;
    state.meta.gradedAttempts = graded;
    state.meta.totalCorrect = correct;
    state.meta.currentStreak = streak;
    state.meta.longestStreak = Math.max(numberOr(state.meta.longestStreak, 0), longest);
  }

  function migrateState(input, trainerId) {
    var state = freshState(trainerId);
    if (!input || typeof input !== "object") return state;

    maybeBackupLegacySkrive(input, trainerId);

    state.schemaVersion = SCHEMA_VERSION;
    state.trainerId = String(input.trainerId || trainerId);
    state.createdAt = input.createdAt || (input.meta && input.meta.createdAt) || state.createdAt;
    state.updatedAt = input.updatedAt || nowIso();
    state.attempts = Array.isArray(input.attempts)
      ? input.attempts.slice(-MAX_ATTEMPTS).map(function (attempt) {
        return normaliseAttempt(attempt, state.trainerId);
      }).filter(Boolean)
      : [];

    var meta = input.meta || {};
    state.meta.lastSessionDate = meta.lastSessionDate || "";
    state.meta.dailyAttempts = meta.dailyAttempts && typeof meta.dailyAttempts === "object" ? meta.dailyAttempts : {};
    state.meta.socialSnapshots = Array.isArray(meta.socialSnapshots) ? meta.socialSnapshots.slice(-50) : [];
    state.meta.repairClosures = normaliseRepairClosures(meta.repairClosures);
    state.meta.longestStreak = Math.max(0, numberOr(meta.longestStreak, 0));

    var byItemId = input.byItemId || input.items || {};
    Object.keys(byItemId).forEach(function (itemId) {
      var rec = backfillLeitnerSchedule(normaliseRecord(byItemId[itemId]));
      state.byItemId[itemId] = rec;
      state.items[itemId] = rec;
    });

    if (numberOr(input.schemaVersion, 1) < 2 && String(state.trainerId) === "skrive") {
      reclassifyLegacySkriveRecords(state);
    }

    recountMetaFromAttempts(state);

    // The attempt log is intentionally capped, while meta counters are lifetime totals.
    // Never shrink those totals to the last MAX_ATTEMPTS during reload/import.
    var storedTotal = Math.max(0, numberOr(meta.totalAttempts, state.meta.totalAttempts));
    state.meta.totalAttempts = Math.max(state.meta.totalAttempts, storedTotal);
    if (String(state.trainerId) === "skrive") {
      // Writing is self-report only: preserve volume, never legacy correctness claims.
      state.meta.gradedAttempts = 0;
      state.meta.totalCorrect = 0;
      state.meta.currentStreak = 0;
      state.meta.longestStreak = 0;
    } else {
      var sourceSchema = numberOr(input.schemaVersion, 1);
      var storedGraded = sourceSchema >= 2
        ? Math.max(0, numberOr(meta.gradedAttempts, state.meta.gradedAttempts))
        : storedTotal;
      state.meta.gradedAttempts = Math.min(
        state.meta.totalAttempts,
        Math.max(state.meta.gradedAttempts, storedGraded)
      );
      state.meta.totalCorrect = Math.min(
        state.meta.gradedAttempts,
        Math.max(state.meta.totalCorrect, Math.max(0, numberOr(meta.totalCorrect, 0)))
      );
      state.meta.currentStreak = Math.min(
        state.meta.gradedAttempts,
        Math.max(state.meta.currentStreak, Math.max(0, numberOr(meta.currentStreak, 0)))
      );
      state.meta.longestStreak = Math.max(
        state.meta.currentStreak,
        state.meta.longestStreak,
        Math.max(0, numberOr(meta.longestStreak, 0))
      );
    }

    return state;
  }

  function optionalNumber(value) {
    if (value === undefined || value === null || value === "") return undefined;
    var n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function optionalBoolean(value) {
    if (value === undefined || value === null) return undefined;
    return !!value;
  }

  function normaliseAttempt(attempt, trainerId) {
    if (!attempt || typeof attempt !== "object" || !attempt.itemId) return null;
    var kind = resolveAssessmentKind(attempt, trainerId);
    var completed = attempt.completed;
    if (completed === undefined || completed === null) completed = true;
    var correct = attempt.correct;
    if (kind === ASSESSMENT_SELF_REPORT) {
      // Self-report stores completion outcome as completed; correct stays null.
      if (correct !== null && correct !== undefined && typeof correct !== "boolean") correct = null;
      if (correct !== null && correct !== undefined) {
        // Preserve explicit null; coerce legacy boolean correct into completed flag then null out.
        if (typeof correct === "boolean" && attempt.completed === undefined) {
          completed = correct;
        }
        correct = null;
      } else {
        correct = null;
      }
    } else {
      correct = !!correct;
    }

    var out = {
      at: attempt.at || nowIso(),
      itemId: String(attempt.itemId),
      assessmentKind: kind,
      correct: correct,
      completed: !!completed,
      tags: normaliseTags(attempt.tags),
      mode: attempt.mode ? String(attempt.mode) : "",
      register: attempt.register ? String(attempt.register) : "",
      expected: attempt.expected === undefined ? "" : String(attempt.expected).slice(0, 200),
      given: attempt.given === undefined ? "" : String(attempt.given).slice(0, 200)
    };

    var responseTimeMs = optionalNumber(attempt.responseTimeMs);
    if (responseTimeMs !== undefined) out.responseTimeMs = Math.max(0, responseTimeMs);
    var tries = optionalNumber(attempt.tries !== undefined ? attempt.tries : attempt.attempts);
    if (tries !== undefined) out.tries = Math.max(0, Math.floor(tries));
    if (attempt.reason) out.reason = String(attempt.reason).slice(0, 80);
    if (attempt.channel) out.channel = String(attempt.channel).slice(0, 80);
    var rubricPassed = optionalBoolean(attempt.rubricPassed);
    if (rubricPassed !== undefined) out.rubricPassed = rubricPassed;
    var lengthPassed = optionalBoolean(attempt.lengthPassed);
    if (lengthPassed !== undefined) out.lengthPassed = lengthPassed;
    var charCount = optionalNumber(attempt.charCount);
    if (charCount !== undefined) out.charCount = Math.max(0, Math.floor(charCount));

    return out;
  }

  function countCorrect(attempts) {
    return attempts.filter(function (a) {
      return isObjectiveAttempt(a) && a.correct === true;
    }).length;
  }

  function normaliseRepairClosures(input) {
    var out = {};
    if (!input || typeof input !== "object") return out;
    Object.keys(input).forEach(function (key) {
      var source = input[key];
      if (!source || typeof source !== "object") return;
      var signal = String(source.signal || key || "").trim();
      if (!signal) return;
      out[signal] = {
        signal: signal,
        itemId: source.itemId ? String(source.itemId) : "",
        sceneId: source.sceneId ? String(source.sceneId) : "",
        lessonId: source.lessonId ? String(source.lessonId) : "",
        label: source.label ? String(source.label) : "",
        action: source.action ? String(source.action) : "",
        resolvedAt: source.resolvedAt || source.at || nowIso(),
        sourceMode: source.sourceMode ? String(source.sourceMode) : "repair",
        correct: source.correct !== false,
        attempts: Math.max(1, numberOr(source.attempts, 1)),
        attemptCount: source.attemptCount === undefined || source.attemptCount === null ? null : Math.max(0, numberOr(source.attemptCount, 0))
      };
    });
    return out;
  }

  function repairClosureStore(state) {
    if (!state.meta) state.meta = {};
    if (!state.meta.repairClosures || typeof state.meta.repairClosures !== "object") state.meta.repairClosures = {};
    return state.meta.repairClosures;
  }

  function saveState(state) {
    touch(state);
    if (storageAvailable()) {
      root.localStorage.setItem(stateKey(state.trainerId), JSON.stringify(state));
    }
    return state;
  }

  function createTrainerState(options) {
    options = options || {};
    var trainerId = String(options.trainerId || "");
    if (!trainerId) throw new Error("trainerId is required");
    var key = options.storageKey || stateKey(trainerId);
    var oldKeys = options.oldKeys || [];
    var loaded = null;

    if (storageAvailable()) {
      loaded = readJson(root.localStorage.getItem(key));
      if (!loaded) {
        for (var i = 0; i < oldKeys.length; i++) {
          loaded = readJson(root.localStorage.getItem(oldKeys[i]));
          if (loaded) break;
        }
      }
    }

    var state = migrateState(loaded, trainerId);
    if (options.save !== false) saveState(state);
    return {
      state: state,
      key: key,
      save: function () { return saveState(state); },
      replace: function (nextState) {
        state = migrateState(nextState, trainerId);
        if (state.trainerId !== trainerId) throw new Error("trainerId mismatch");
        saveState(state);
        this.state = state;
        return state;
      },
      fresh: function () {
        state = freshState(trainerId);
        saveState(state);
        this.state = state;
        return state;
      }
    };
  }

  function readJson(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function ensureItemRecord(state, itemId, tags) {
    if (!state || !state.byItemId) throw new Error("invalid state");
    itemId = String(itemId);
    if (!state.byItemId[itemId]) {
      state.byItemId[itemId] = normaliseRecord(null, tags);
      state.items[itemId] = state.byItemId[itemId];
    } else {
      state.byItemId[itemId].tags = mergeTags(state.byItemId[itemId].tags, tags);
      state.items[itemId] = state.byItemId[itemId];
    }
    return state.byItemId[itemId];
  }

  function mergeTags(a, b) {
    return normaliseTags((a || []).concat(normaliseTags(b)));
  }

  function recordAttempt(state, attempt) {
    attempt = attempt || {};
    var trainerId = state.trainerId;
    var kind = resolveAssessmentKind(attempt, trainerId);
    var rec = ensureItemRecord(state, attempt.itemId, attempt.tags);
    var at = nowIso();
    var normalised = normaliseAttempt(Object.assign({}, attempt, {
      at: at,
      assessmentKind: kind,
      tags: mergeTags(normaliseTags(attempt.tags), attempt.mode ? [attempt.mode] : [])
    }), trainerId);
    if (!normalised) throw new Error("invalid attempt");

    rec.lastSeen = at;
    rec.tags = mergeTags(rec.tags, attempt.tags);
    rec.attempts = rec.attempts && typeof rec.attempts === "object" ? rec.attempts : { total: 0, correct: 0, wrong: 0 };
    rec.attempts.total = numberOr(rec.attempts.total, 0) + 1;

    state.meta.totalAttempts = numberOr(state.meta.totalAttempts, 0) + 1;
    state.meta.lastSessionDate = todayKey();
    state.meta.dailyAttempts = state.meta.dailyAttempts || {};
    state.meta.dailyAttempts[todayKey()] = numberOr(state.meta.dailyAttempts[todayKey()], 0) + 1;

    if (kind === ASSESSMENT_SELF_REPORT) {
      // Volume only — no box / mastery / correctness streak / graded accuracy.
      state.attempts = Array.isArray(state.attempts) ? state.attempts : [];
      state.attempts.push(normalised);
      if (state.attempts.length > MAX_ATTEMPTS) state.attempts = state.attempts.slice(-MAX_ATTEMPTS);
      touch(state);
      return rec;
    }

    var ok = normalised.correct === true;
    if (ok) {
      rec.correct += 1;
      rec.attempts.correct = numberOr(rec.attempts.correct, 0) + 1;
      rec.box = Math.min(5, rec.box + 1);
      rec.mastered = rec.box >= 5;
      state.meta.totalCorrect = numberOr(state.meta.totalCorrect, 0) + 1;
      state.meta.currentStreak = numberOr(state.meta.currentStreak, 0) + 1;
      state.meta.longestStreak = Math.max(numberOr(state.meta.longestStreak, 0), state.meta.currentStreak);
    } else {
      rec.wrong += 1;
      rec.attempts.wrong = numberOr(rec.attempts.wrong, 0) + 1;
      rec.box = 1;
      rec.mastered = false;
      state.meta.currentStreak = 0;
    }
    scheduleAfterAttempt(rec, ok, at);
    state.meta.gradedAttempts = numberOr(state.meta.gradedAttempts, 0) + 1;

    state.attempts = Array.isArray(state.attempts) ? state.attempts : [];
    state.attempts.push(normalised);
    if (state.attempts.length > MAX_ATTEMPTS) state.attempts = state.attempts.slice(-MAX_ATTEMPTS);
    touch(state);
    return rec;
  }

  function recordRepairClosure(state, closure) {
    if (!state) throw new Error("invalid state");
    closure = closure || {};
    if (closure.correct === false) return null;
    var signal = String(closure.signal || closure.tag || "").trim();
    if (!signal) return null;
    var store = repairClosureStore(state);
    var previous = store[signal] || {};
    store[signal] = {
      signal: signal,
      itemId: closure.itemId ? String(closure.itemId) : previous.itemId || "",
      sceneId: closure.sceneId ? String(closure.sceneId) : previous.sceneId || "",
      lessonId: closure.lessonId ? String(closure.lessonId) : previous.lessonId || "",
      label: closure.label ? String(closure.label) : previous.label || "",
      action: closure.action ? String(closure.action) : previous.action || "",
      resolvedAt: closure.resolvedAt || nowIso(),
      sourceMode: closure.sourceMode ? String(closure.sourceMode) : "repair",
      correct: true,
      attempts: numberOr(previous.attempts, 0) + 1,
      attemptCount: (state.attempts || []).length
    };
    touch(state);
    return store[signal];
  }

  function getRepairClosure(state, signal) {
    if (!state || !state.meta || !signal) return null;
    var store = state.meta.repairClosures;
    if (!store || typeof store !== "object") return null;
    return store[String(signal).trim()] || null;
  }

  function isSignalResolved(state, signal) {
    signal = String(signal || "").trim();
    if (!signal) return false;
    var closure = getRepairClosure(state, signal);
    if (!closure || closure.correct === false) return false;
    var attempts = state.attempts || [];
    var hasAttemptCount = closure.attemptCount !== undefined && closure.attemptCount !== null;
    var closureAttemptCount = Number(closure.attemptCount);
    hasAttemptCount = hasAttemptCount && Number.isFinite(closureAttemptCount);
    var resolvedTime = new Date(closure.resolvedAt || "").getTime();
    var hasResolvedTime = Number.isFinite(resolvedTime);

    for (var i = 0; i < attempts.length; i++) {
      var attempt = attempts[i];
      if (!attempt || !isObjectiveAttempt(attempt) || attempt.correct || normaliseTags(attempt.tags).indexOf(signal) === -1) continue;
      var attemptTime = new Date(attempt.at || "").getTime();
      if (hasResolvedTime && Number.isFinite(attemptTime)) {
        if (attemptTime > resolvedTime) return false;
        if (attemptTime === resolvedTime && hasAttemptCount && i >= closureAttemptCount) return false;
        continue;
      }
      if (hasAttemptCount && i >= closureAttemptCount) return false;
      if (!hasAttemptCount) return false;
    }
    return true;
  }

  function touch(state) {
    state.updatedAt = nowIso();
    state.schemaVersion = SCHEMA_VERSION;
    state.items = state.byItemId || {};
    if (state.meta && state.meta.gradedAttempts === undefined) {
      state.meta.gradedAttempts = numberOr(state.meta.totalAttempts, 0);
    }
  }

  function getStats(state) {
    var graded = numberOr(state.meta.gradedAttempts, numberOr(state.meta.totalAttempts, 0));
    var total = numberOr(state.meta.totalAttempts, 0);
    var correct = numberOr(state.meta.totalCorrect, 0);
    var records = Object.keys(state.byItemId || {}).map(function (id) { return state.byItemId[id]; });
    return {
      totalAttempts: total,
      gradedAttempts: graded,
      totalCorrect: correct,
      accuracy: graded ? correct / graded : 0,
      accuracyPct: graded ? Math.round((correct / graded) * 100) : null,
      masteredCount: records.filter(function (r) { return r.mastered; }).length,
      todayCount: numberOr((state.meta.dailyAttempts || {})[todayKey()], 0),
      dueCount: countDueItems(state),
      currentStreak: numberOr(state.meta.currentStreak, 0),
      longestStreak: numberOr(state.meta.longestStreak, 0)
    };
  }

  /**
   * Leitner session picker: overdue → new → weakest → remaining fill.
   * Missed items are also re-queued by each drill within the active session.
   */
  function pickSessionItems(items, options) {
    options = options || {};
    var size = Math.min(numberOr(options.size, 10), items.length);
    var getRecord = options.getRecord || function (item) { return item.rec; };
    var now = options.now || nowIso();

    function dueStamp(rec) {
      if (!rec || !rec.nextDueAt) return 0;
      var t = new Date(rec.nextDueAt).getTime();
      return Number.isFinite(t) ? t : 0;
    }

    var overdue = [];
    var fresh = [];
    var weak = [];
    items.forEach(function (item) {
      var rec = getRecord(item) || {};
      if (isItemNew(rec)) {
        fresh.push(item);
      } else if (isItemDue(rec, now)) {
        overdue.push(item);
      } else {
        weak.push(item);
      }
    });

    overdue.sort(function (a, b) {
      return dueStamp(getRecord(a)) - dueStamp(getRecord(b));
    });
    weak.sort(function (a, b) {
      return weaknessScore(getRecord(b)) - weaknessScore(getRecord(a));
    });

    var picked = [];
    function takeFrom(pool, count) {
      var n = Math.min(count, pool.length, size - picked.length);
      var chosen = sample(pool, n);
      chosen.forEach(function (item) { picked.push(item); });
      return chosen;
    }

    // Prefer fully overdue first (stable order), then scramble within new/weak buckets.
    overdue.forEach(function (item) {
      if (picked.length < size) picked.push(item);
    });
    takeFrom(fresh, size - picked.length);
    takeFrom(weak, size - picked.length);

    if (picked.length < size) {
      var remaining = items.filter(function (item) { return picked.indexOf(item) === -1; });
      takeFrom(remaining, size - picked.length);
    }
    return picked;
  }

  function sample(items, count) {
    var out = [];
    var pool = items.slice();
    while (out.length < count && pool.length) {
      out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return out;
  }

  function exportState(state) {
    touch(state);
    return JSON.stringify(state, null, 2);
  }

  function importState(json, expectedTrainerId) {
    var parsed;
    try {
      parsed = typeof json === "string" ? JSON.parse(json) : json;
    } catch (e) {
      throw new Error("Invalid JSON");
    }
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid state file");
    if (expectedTrainerId && parsed.trainerId && parsed.trainerId !== expectedTrainerId) {
      throw new Error("State belongs to " + parsed.trainerId + ", expected " + expectedTrainerId);
    }
    var state = migrateState(parsed, expectedTrainerId || parsed.trainerId);
    if (!state.trainerId) throw new Error("Missing trainerId");
    return state;
  }

  function computeGate(state, gateSpec) {
    gateSpec = gateSpec || {};
    var minAttempts = numberOr(gateSpec.minAttempts, 100);
    var minAccuracy = numberOr(gateSpec.minAccuracy, 0.8);
    var tags = normaliseTags(gateSpec.tags);
    var mode = gateSpec.mode ? String(gateSpec.mode) : "";
    var attempts = (state.attempts || []).filter(function (a) {
      if (!isObjectiveAttempt(a)) return false;
      if (mode && a.mode !== mode && a.tags.indexOf(mode) === -1) return false;
      return tags.every(function (tag) { return a.tags.indexOf(tag) !== -1; });
    });
    var total = attempts.length;
    var correct = countCorrect(attempts);
    var accuracy = total ? correct / total : 0;
    return {
      name: gateSpec.name || "gate",
      total: total,
      correct: correct,
      minAttempts: minAttempts,
      minAccuracy: minAccuracy,
      accuracy: accuracy,
      accuracyPct: total ? Math.round(accuracy * 100) : 0,
      ready: total >= minAttempts && accuracy >= minAccuracy
    };
  }

  function getWeakTags(state, limit, options) {
    limit = numberOr(limit, 5);
    options = options || {};
    var buckets = {};
    ((state && state.attempts) || []).forEach(function (attempt) {
      if (!isObjectiveAttempt(attempt)) return;
      normaliseTags(attempt.tags).forEach(function (tag) {
        if (!buckets[tag]) buckets[tag] = { tag: tag, total: 0, correct: 0, wrong: 0, score: 0 };
        buckets[tag].total += 1;
        if (attempt.correct === true) buckets[tag].correct += 1;
        else buckets[tag].wrong += 1;
      });
    });
    return Object.keys(buckets).map(function (tag) {
      var b = buckets[tag];
      b.score = b.wrong / Math.max(1, b.correct + b.wrong);
      return b;
    }).filter(function (b) {
      return b.total > 0 && b.wrong > 0 && (options.includeResolved || !isSignalResolved(state, b.tag));
    }).sort(function (a, b) {
      return b.score - a.score || b.wrong - a.wrong || b.total - a.total;
    }).slice(0, limit);
  }

  function recordSocialSnapshot(state, variables) {
    if (!state || !state.meta) return;
    var snapshots = state.meta.socialSnapshots || [];
    snapshots.push({
      at: nowIso(),
      variables: variables || {}
    });
    if (snapshots.length > 50) snapshots = snapshots.slice(-50);
    state.meta.socialSnapshots = snapshots;
    touch(state);
    return snapshots;
  }

  function getRegisterProfile(state) {
    var attempts = state.attempts || [];
    var profile = { formal: 0, informal: 0, neutral: 0, total: 0 };
    attempts.forEach(function (a) {
      var r = a.register;
      if (!r) { profile.neutral += 1; profile.total += 1; return; }
      if (r.indexOf("formal") !== -1) profile.formal += 1;
      else if (r.indexOf("informal") !== -1) profile.informal += 1;
      else profile.neutral += 1;
      profile.total += 1;
    });
    return profile;
  }

  root.PlataKernel = {
    schemaVersion: SCHEMA_VERSION,
    ASSESSMENT_OBJECTIVE: ASSESSMENT_OBJECTIVE,
    ASSESSMENT_SELF_REPORT: ASSESSMENT_SELF_REPORT,
    SKRIVE_LEGACY_BACKUP_KEY: SKRIVE_LEGACY_BACKUP_KEY,
    LEITNER_INTERVAL_DAYS: LEITNER_INTERVAL_DAYS.slice(),
    stateKey: stateKey,
    freshState: freshState,
    migrateState: migrateState,
    createTrainerState: createTrainerState,
    ensureItemRecord: ensureItemRecord,
    recordAttempt: recordAttempt,
    recordRepairClosure: recordRepairClosure,
    getRepairClosure: getRepairClosure,
    isSignalResolved: isSignalResolved,
    getStats: getStats,
    pickSessionItems: pickSessionItems,
    intervalForBox: intervalForBox,
    isItemDue: isItemDue,
    isItemNew: isItemNew,
    countDueItems: countDueItems,
    exportState: exportState,
    importState: importState,
    computeGate: computeGate,
    getWeakTags: getWeakTags,
    recordSocialSnapshot: recordSocialSnapshot,
    getRegisterProfile: getRegisterProfile,
    saveState: saveState
  };
})(typeof window !== "undefined" ? window : globalThis);

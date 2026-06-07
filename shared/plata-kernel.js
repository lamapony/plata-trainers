/* Platå shared learning kernel v1
 *
 * Static browser-only state engine for trainer progress, imports/exports,
 * session picking, gates, and weak-tag diagnostics.
 */
(function (root) {
  "use strict";

  var SCHEMA_VERSION = 1;
  var MAX_ATTEMPTS = 1000;

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
      attempts: source.attempts && typeof source.attempts === "object" ? source.attempts : { total: 0, correct: 0, wrong: 0 }
    };
  }

  function numberOr(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clampNumber(value, min, max, fallback) {
    return Math.max(min, Math.min(max, numberOr(value, fallback)));
  }

  function migrateState(input, trainerId) {
    var state = freshState(trainerId);
    if (!input || typeof input !== "object") return state;

    state.schemaVersion = SCHEMA_VERSION;
    state.trainerId = String(input.trainerId || trainerId);
    state.createdAt = input.createdAt || (input.meta && input.meta.createdAt) || state.createdAt;
    state.updatedAt = input.updatedAt || nowIso();
    state.attempts = Array.isArray(input.attempts) ? input.attempts.slice(-MAX_ATTEMPTS).map(normaliseAttempt).filter(Boolean) : [];

    var meta = input.meta || {};
    state.meta.totalAttempts = Math.max(0, numberOr(meta.totalAttempts, state.attempts.length));
    state.meta.totalCorrect = Math.max(0, numberOr(meta.totalCorrect, countCorrect(state.attempts)));
    state.meta.currentStreak = Math.max(0, numberOr(meta.currentStreak, 0));
    state.meta.longestStreak = Math.max(state.meta.currentStreak, numberOr(meta.longestStreak, state.meta.currentStreak));
    state.meta.lastSessionDate = meta.lastSessionDate || "";
    state.meta.dailyAttempts = meta.dailyAttempts && typeof meta.dailyAttempts === "object" ? meta.dailyAttempts : {};
    state.meta.socialSnapshots = Array.isArray(meta.socialSnapshots) ? meta.socialSnapshots.slice(-50) : [];
    state.meta.repairClosures = normaliseRepairClosures(meta.repairClosures);

    var byItemId = input.byItemId || input.items || {};
    Object.keys(byItemId).forEach(function (itemId) {
      var rec = normaliseRecord(byItemId[itemId]);
      state.byItemId[itemId] = rec;
      state.items[itemId] = rec;
    });

    return state;
  }

  function normaliseAttempt(attempt) {
    if (!attempt || typeof attempt !== "object" || !attempt.itemId) return null;
    return {
      at: attempt.at || nowIso(),
      itemId: String(attempt.itemId),
      correct: !!attempt.correct,
      tags: normaliseTags(attempt.tags),
      mode: attempt.mode ? String(attempt.mode) : "",
      register: attempt.register ? String(attempt.register) : "",
      expected: attempt.expected === undefined ? "" : String(attempt.expected).slice(0, 200),
      given: attempt.given === undefined ? "" : String(attempt.given).slice(0, 200)
    };
  }

  function countCorrect(attempts) {
    return attempts.filter(function (a) { return a.correct; }).length;
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
    var rec = ensureItemRecord(state, attempt.itemId, attempt.tags);
    var at = nowIso();
    var ok = !!attempt.correct;
    rec.lastSeen = at;
    rec.tags = mergeTags(rec.tags, attempt.tags);
    rec.attempts = rec.attempts && typeof rec.attempts === "object" ? rec.attempts : { total: 0, correct: 0, wrong: 0 };
    rec.attempts.total = numberOr(rec.attempts.total, 0) + 1;
    if (ok) {
      rec.correct += 1;
      rec.attempts.correct = numberOr(rec.attempts.correct, 0) + 1;
      rec.box = Math.min(5, rec.box + 1);
      rec.mastered = rec.box >= 5;
      state.meta.totalCorrect += 1;
      state.meta.currentStreak += 1;
      state.meta.longestStreak = Math.max(state.meta.longestStreak, state.meta.currentStreak);
    } else {
      rec.wrong += 1;
      rec.attempts.wrong = numberOr(rec.attempts.wrong, 0) + 1;
      rec.box = 1;
      rec.mastered = false;
      state.meta.currentStreak = 0;
    }
    state.meta.totalAttempts += 1;
    state.meta.lastSessionDate = todayKey();
    state.meta.dailyAttempts = state.meta.dailyAttempts || {};
    state.meta.dailyAttempts[todayKey()] = numberOr(state.meta.dailyAttempts[todayKey()], 0) + 1;
    state.attempts = Array.isArray(state.attempts) ? state.attempts : [];
    state.attempts.push(normaliseAttempt({
      at: at,
      itemId: attempt.itemId,
      correct: ok,
      tags: mergeTags(normaliseTags(attempt.tags), attempt.mode ? [attempt.mode] : []),
      mode: attempt.mode,
      register: attempt.register,
      expected: attempt.expected,
      given: attempt.given
    }));
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
      if (!attempt || attempt.correct || normaliseTags(attempt.tags).indexOf(signal) === -1) continue;
      if (hasAttemptCount) {
        if (i >= closureAttemptCount) return false;
        continue;
      }
      var attemptTime = new Date(attempt.at || "").getTime();
      if (!hasResolvedTime || !Number.isFinite(attemptTime) || attemptTime > resolvedTime) return false;
    }
    return true;
  }

  function touch(state) {
    state.updatedAt = nowIso();
    state.items = state.byItemId || {};
  }

  function getStats(state) {
    var total = numberOr(state.meta.totalAttempts, 0);
    var correct = numberOr(state.meta.totalCorrect, 0);
    var records = Object.keys(state.byItemId || {}).map(function (id) { return state.byItemId[id]; });
    return {
      totalAttempts: total,
      totalCorrect: correct,
      accuracy: total ? correct / total : 0,
      accuracyPct: total ? Math.round((correct / total) * 100) : null,
      masteredCount: records.filter(function (r) { return r.mastered; }).length,
      todayCount: numberOr((state.meta.dailyAttempts || {})[todayKey()], 0),
      currentStreak: numberOr(state.meta.currentStreak, 0),
      longestStreak: numberOr(state.meta.longestStreak, 0)
    };
  }

  function pickSessionItems(items, options) {
    options = options || {};
    var size = Math.min(numberOr(options.size, 10), items.length);
    var getRecord = options.getRecord || function (item) { return item.rec; };
    var weakRatio = numberOr(options.weakRatio, 0.6);
    var midRatio = numberOr(options.midRatio, 0.3);
    var weak = items.filter(function (item) {
      var rec = getRecord(item) || {};
      return !rec.mastered && (numberOr(rec.box, 1) <= 2 || numberOr(rec.wrong, 0) > numberOr(rec.correct, 0));
    });
    var mid = items.filter(function (item) {
      var rec = getRecord(item) || {};
      return !rec.mastered && numberOr(rec.box, 1) > 2;
    });
    var mastered = items.filter(function (item) {
      var rec = getRecord(item) || {};
      return !!rec.mastered;
    });
    var w = Math.min(weak.length, Math.ceil(size * weakRatio));
    var m = Math.min(mid.length, Math.ceil(size * midRatio));
    var r = Math.min(mastered.length, size - w - m);
    var picked = sample(weak, w).concat(sample(mid, m)).concat(sample(mastered, r));
    var remaining = items.filter(function (item) { return picked.indexOf(item) === -1; });
    return picked.concat(sample(remaining, size - picked.length));
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
      normaliseTags(attempt.tags).forEach(function (tag) {
        if (!buckets[tag]) buckets[tag] = { tag: tag, total: 0, correct: 0, wrong: 0, score: 0 };
        buckets[tag].total += 1;
        if (attempt.correct) buckets[tag].correct += 1;
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
    exportState: exportState,
    importState: importState,
    computeGate: computeGate,
    getWeakTags: getWeakTags,
    recordSocialSnapshot: recordSocialSnapshot,
    getRegisterProfile: getRegisterProfile,
    saveState: saveState
  };
})(typeof window !== "undefined" ? window : globalThis);

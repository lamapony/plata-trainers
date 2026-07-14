/* Platå exercise spec runtime v1
 *
 * Validates rendering-independent exercise specs and exposes grading helpers
 * for static trainers, variant generators, and metric pipelines.
 */
(function (root) {
  "use strict";

  var SCHEMA_VERSION = 1;
  var TYPES = ["complete-sentence", "multiple-choice", "match-pairs", "free-input"];
  var LEVELS = ["A1", "A2", "B1", "B2"];
  var METRIC_KEYS = ["accuracy", "responseTimeMs", "attempts", "sessionVolume", "spacing"];
  var TAG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
  var ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function nonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeText(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function pushError(errors, path, message) {
    errors.push(path + ": " + message);
  }

  function validateTagList(errors, path, tags, required) {
    if (!Array.isArray(tags)) {
      if (required) pushError(errors, path, "must be an array");
      return;
    }
    if (required && tags.length === 0) {
      pushError(errors, path, "must include at least one tag");
    }
    tags.forEach(function (tag, index) {
      if (!nonEmptyString(tag)) {
        pushError(errors, path + "[" + index + "]", "must be a non-empty string");
        return;
      }
      if (!TAG_PATTERN.test(tag)) {
        pushError(errors, path + "[" + index + "]", "must be kebab-case");
      }
    });
  }

  function validateId(errors, path, value, required) {
    if (!nonEmptyString(value)) {
      if (required) pushError(errors, path, "is required");
      return;
    }
    if (!ID_PATTERN.test(value)) {
      pushError(errors, path, "must be kebab-case");
    }
  }

  function validateMetrics(errors, metrics) {
    if (!isObject(metrics)) {
      pushError(errors, "metrics", "must be an object");
      return;
    }
    if (metrics.accuracy !== true) {
      pushError(errors, "metrics.accuracy", "must be true");
    }
    METRIC_KEYS.forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(metrics, key)) return;
      if (typeof metrics[key] !== "boolean") {
        pushError(errors, "metrics." + key, "must be a boolean");
      }
    });
    Object.keys(metrics).forEach(function (key) {
      if (METRIC_KEYS.indexOf(key) === -1) {
        pushError(errors, "metrics." + key, "is not a supported metric flag");
      }
    });
  }

  function validateChoiceOptions(errors, options) {
    var hasCorrect = false;
    options.forEach(function (option, index) {
      var base = "language.options[" + index + "]";
      if (!isObject(option)) {
        pushError(errors, base, "must be an object");
        return;
      }
      validateId(errors, base + ".id", option.id, true);
      if (!nonEmptyString(option.label)) {
        pushError(errors, base + ".label", "is required");
      }
      if (option.correct === true) hasCorrect = true;
      if (option.weakTags) validateTagList(errors, base + ".weakTags", option.weakTags, false);
    });
    if (!hasCorrect) {
      pushError(errors, "language.options", "must include at least one correct option");
    }
  }

  function validateMatchPairs(errors, pairs) {
    pairs.forEach(function (pair, index) {
      var base = "language.pairs[" + index + "]";
      if (!isObject(pair)) {
        pushError(errors, base, "must be an object");
        return;
      }
      validateId(errors, base + ".id", pair.id, true);
      if (!nonEmptyString(pair.left)) pushError(errors, base + ".left", "is required");
      if (!nonEmptyString(pair.right)) pushError(errors, base + ".right", "is required");
    });
  }

  function validateLanguageForType(errors, spec) {
    var language = spec.language;
    var type = spec.type;

    validateTagList(errors, "language.phenomena", language.phenomena, true);
    if (!nonEmptyString(language.stimulus)) {
      pushError(errors, "language.stimulus", "is required");
    }
    validateTagList(errors, "language.weakTags", language.weakTags, true);

    if (type === "complete-sentence") {
      if (!asArray(language.correct).some(nonEmptyString)) {
        pushError(errors, "language.correct", "must include at least one acceptable answer");
      }
      return;
    }

    if (type === "multiple-choice") {
      var options = asArray(language.options);
      if (options.length >= 2) {
        validateChoiceOptions(errors, options);
        return;
      }
      var correct = asArray(language.correct).filter(nonEmptyString);
      var distractors = asArray(language.distractors).filter(nonEmptyString);
      if (correct.length === 0) {
        pushError(errors, "language.correct", "must include at least one correct answer when options are omitted");
      }
      if (correct.length + distractors.length < 2) {
        pushError(errors, "language", "multiple-choice needs explicit options or at least two generated choices");
      }
      return;
    }

    if (type === "match-pairs") {
      var pairs = asArray(language.pairs);
      if (pairs.length < 2) {
        pushError(errors, "language.pairs", "must include at least two pairs");
      } else {
        validateMatchPairs(errors, pairs);
      }
      return;
    }

    if (type === "free-input") {
      var hasPrefix = nonEmptyString(language.acceptPrefix);
      var hasKeywords = asArray(language.acceptKeywords).some(nonEmptyString);
      if (!hasPrefix && !hasKeywords) {
        pushError(errors, "language", "free-input requires acceptPrefix or acceptKeywords");
      }
    }
  }

  function validate(spec) {
    var errors = [];

    if (!isObject(spec)) {
      return { valid: false, errors: ["spec must be an object"] };
    }

    if (spec.schemaVersion !== undefined && spec.schemaVersion !== SCHEMA_VERSION) {
      pushError(errors, "schemaVersion", "must be " + SCHEMA_VERSION);
    }

    validateId(errors, "id", spec.id, true);

    if (TYPES.indexOf(spec.type) === -1) {
      pushError(errors, "type", "must be one of: " + TYPES.join(", "));
    }

    if (LEVELS.indexOf(spec.level) === -1) {
      pushError(errors, "level", "must be one of: " + LEVELS.join(", "));
    }

    if (!isObject(spec.language)) {
      pushError(errors, "language", "must be an object");
    } else if (TYPES.indexOf(spec.type) !== -1) {
      validateLanguageForType(errors, spec);
    }

    validateMetrics(errors, spec.metrics);

    if (spec.variantOf) {
      validateId(errors, "variantOf", spec.variantOf, false);
    }

    return { valid: errors.length === 0, errors: errors };
  }

  function cloneStringList(list) {
    return asArray(list).filter(nonEmptyString).map(function (item) {
      return String(item).trim();
    });
  }

  function buildGeneratedOptions(language) {
    var options = [];
    cloneStringList(language.correct).forEach(function (label, index) {
      options.push({
        id: "correct-" + (index + 1),
        label: label,
        correct: true,
        weakTags: cloneStringList(language.weakTags),
        feedback: language.explanation || ""
      });
    });
    cloneStringList(language.distractors).forEach(function (label, index) {
      options.push({
        id: "distractor-" + (index + 1),
        label: label,
        correct: false,
        weakTags: cloneStringList(language.weakTags),
        feedback: language.explanation || ""
      });
    });
    return options;
  }

  function normalizeOption(option, fallbackWeakTags) {
    return {
      id: String(option.id || "").trim(),
      label: String(option.label || "").trim(),
      detail: nonEmptyString(option.detail) ? String(option.detail).trim() : "",
      correct: option.correct === true,
      weakTags: cloneStringList(option.weakTags).length ? cloneStringList(option.weakTags) : fallbackWeakTags.slice(),
      feedback: nonEmptyString(option.feedback) ? String(option.feedback).trim() : ""
    };
  }

  function normalize(spec) {
    var result = validate(spec);
    if (!result.valid) return null;

    var language = spec.language;
    var normalized = {
      schemaVersion: SCHEMA_VERSION,
      id: String(spec.id).trim(),
      type: spec.type,
      level: spec.level,
      language: {
        phenomena: cloneStringList(language.phenomena),
        stimulus: String(language.stimulus).trim(),
        weakTags: cloneStringList(language.weakTags),
        context: nonEmptyString(language.context) ? String(language.context).trim() : "",
        explanation: nonEmptyString(language.explanation) ? String(language.explanation).trim() : ""
      },
      metrics: {
        accuracy: spec.metrics.accuracy === true,
        responseTimeMs: spec.metrics.responseTimeMs === true,
        attempts: spec.metrics.attempts === true,
        sessionVolume: spec.metrics.sessionVolume === true,
        spacing: spec.metrics.spacing === true
      }
    };

    if (nonEmptyString(spec.context)) normalized.context = String(spec.context).trim();
    if (asArray(spec.sourceRefs).length) normalized.sourceRefs = cloneStringList(spec.sourceRefs);
    if (nonEmptyString(spec.variantOf)) normalized.variantOf = String(spec.variantOf).trim();

    if (spec.type === "complete-sentence" || spec.type === "multiple-choice") {
      normalized.language.correct = cloneStringList(language.correct);
      normalized.language.distractors = cloneStringList(language.distractors);
    }

    if (spec.type === "multiple-choice") {
      var explicit = asArray(language.options);
      normalized.language.options = explicit.length
        ? explicit.map(function (option) {
          return normalizeOption(option, normalized.language.weakTags);
        })
        : buildGeneratedOptions(language).map(function (option) {
          return normalizeOption(option, normalized.language.weakTags);
        });
    }

    if (spec.type === "match-pairs") {
      normalized.language.pairs = asArray(language.pairs).map(function (pair) {
        return {
          id: String(pair.id).trim(),
          left: String(pair.left).trim(),
          right: String(pair.right).trim(),
          feedback: nonEmptyString(pair.feedback) ? String(pair.feedback).trim() : ""
        };
      });
    }

    if (spec.type === "free-input") {
      if (nonEmptyString(language.acceptPrefix)) {
        normalized.language.acceptPrefix = String(language.acceptPrefix).trim();
      }
      if (asArray(language.acceptKeywords).length) {
        normalized.language.acceptKeywords = cloneStringList(language.acceptKeywords);
      }
    }

    return normalized;
  }

  function getStimulus(spec) {
    var normalized = normalize(spec);
    if (!normalized) return "";
    var parts = [];
    if (nonEmptyString(normalized.context)) parts.push(normalized.context);
    if (nonEmptyString(normalized.language.context)) parts.push(normalized.language.context);
    parts.push(normalized.language.stimulus);
    return parts.join("\n\n");
  }

  function getOptions(spec) {
    var normalized = normalize(spec);
    if (!normalized) return [];

    if (normalized.type === "multiple-choice") {
      return normalized.language.options.slice();
    }

    if (normalized.type === "complete-sentence") {
      return normalized.language.correct.map(function (label, index) {
        return {
          id: "answer-" + (index + 1),
          label: label,
          correct: true,
          weakTags: normalized.language.weakTags.slice(),
          feedback: normalized.language.explanation || ""
        };
      });
    }

    return [];
  }

  function findChoiceOption(spec, answer) {
    var options = getOptions(spec);
    var target = normalizeText(answer);
    for (var i = 0; i < options.length; i++) {
      if (normalizeText(options[i].label) === target || options[i].id === answer) {
        return options[i];
      }
    }
    return null;
  }

  function matchesCompleteSentence(spec, answer) {
    var normalized = normalize(spec);
    if (!normalized) return false;
    var target = normalizeText(answer);
    return normalized.language.correct.some(function (candidate) {
      return normalizeText(candidate) === target;
    });
  }

  function matchesFreeInput(spec, answer) {
    var normalized = normalize(spec);
    if (!normalized) return false;
    var lower = String(answer || "").toLowerCase();
    if (normalized.language.acceptPrefix) {
      return lower.indexOf(String(normalized.language.acceptPrefix).toLowerCase()) === 0;
    }
    if (normalized.language.acceptKeywords) {
      return normalized.language.acceptKeywords.some(function (keyword) {
        return lower.indexOf(String(keyword).toLowerCase()) !== -1;
      });
    }
    return nonEmptyString(answer);
  }

  function checkAnswer(spec, answer) {
    var normalized = normalize(spec);
    if (!normalized) {
      return { correct: false, weakTags: [], error: "invalid spec" };
    }

    if (normalized.type === "multiple-choice") {
      var option = findChoiceOption(spec, answer);
      if (!option) {
        return {
          correct: false,
          weakTags: normalized.language.weakTags.slice(),
          matchedLabel: ""
        };
      }
      return {
        correct: option.correct === true,
        weakTags: option.correct ? [] : option.weakTags.slice(),
        matchedLabel: option.label
      };
    }

    if (normalized.type === "complete-sentence") {
      var correct = matchesCompleteSentence(spec, answer);
      return {
        correct: correct,
        weakTags: correct ? [] : normalized.language.weakTags.slice(),
        matchedLabel: correct ? String(answer || "").trim() : ""
      };
    }

    if (normalized.type === "free-input") {
      var freeCorrect = matchesFreeInput(spec, answer);
      return {
        correct: freeCorrect,
        weakTags: freeCorrect ? [] : normalized.language.weakTags.slice(),
        matchedLabel: freeCorrect ? String(answer || "").trim() : ""
      };
    }

    return {
      correct: false,
      weakTags: normalized.language.weakTags.slice(),
      error: "match-pairs grading requires pair submissions"
    };
  }

  function toKernelAttempt(spec, result, timing) {
    var normalized = normalize(spec);
    if (!normalized) return null;

    var attempt = {
      itemId: normalized.id,
      correct: !!(result && result.correct),
      assessmentKind: "objective",
      completed: true,
      tags: normalized.language.weakTags.slice(),
      mode: normalized.type,
      expected: normalized.language.correct.join(" | "),
      given: result && result.matchedLabel ? result.matchedLabel : ""
    };

    if (normalized.metrics.responseTimeMs && timing && typeof timing.responseTimeMs === "number") {
      attempt.responseTimeMs = timing.responseTimeMs;
    }
    if (normalized.metrics.attempts && timing && typeof timing.attempts === "number") {
      attempt.tries = timing.attempts;
    }

    return attempt;
  }

  var api = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    TYPES: TYPES.slice(),
    LEVELS: LEVELS.slice(),
    METRIC_KEYS: METRIC_KEYS.slice(),
    validate: validate,
    normalize: normalize,
    getStimulus: getStimulus,
    getOptions: getOptions,
    checkAnswer: checkAnswer,
    toKernelAttempt: toKernelAttempt
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.PlataExerciseSpec = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this));

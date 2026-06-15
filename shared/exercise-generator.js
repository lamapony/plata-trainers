/* Platå exercise variant generator v1
 *
 * Expands a spec template into N concrete exercise variants.
 * v1 supports V2/inversion complete-sentence frames from slot pools.
 */
(function (root) {
  "use strict";

  var SUPPORTED_KINDS = ["v2-inversion-complete"];

  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function nonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function padIndex(index) {
    return String(index + 1).padStart(2, "0");
  }

  function slugPart(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24);
  }

  function mulberry32(seed) {
    var state = seed >>> 0;
    return function () {
      state += 0x6d2b79f5;
      var t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(list, seed) {
    var copy = list.slice();
    if (typeof seed !== "number") return copy;
    var random = mulberry32(seed);
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function fillTemplate(text, values) {
    return String(text || "").replace(/\{([a-zA-Z]+)\}/g, function (_match, key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : "";
    });
  }

  function cloneMetrics(metrics) {
    metrics = metrics || {};
    return {
      accuracy: metrics.accuracy === true,
      responseTimeMs: metrics.responseTimeMs === true,
      attempts: metrics.attempts === true,
      sessionVolume: metrics.sessionVolume === true,
      spacing: metrics.spacing === true
    };
  }

  function cloneLanguageBase(template) {
    var language = template.language || {};
    return {
      phenomena: asArray(language.phenomena).slice(),
      weakTags: asArray(language.weakTags).slice(),
      context: nonEmptyString(language.context) ? String(language.context).trim() : "",
      explanation: nonEmptyString(language.explanation) ? String(language.explanation).trim() : ""
    };
  }

  function validateTemplate(template) {
    var errors = [];

    if (!isObject(template)) {
      return { valid: false, errors: ["template must be an object"] };
    }

    if (!nonEmptyString(template.id)) {
      errors.push("template.id is required");
    }

    if (!nonEmptyString(template.type)) {
      errors.push("template.type is required");
    } else if (template.type !== "complete-sentence") {
      errors.push("v1 generator only supports complete-sentence templates");
    }

    if (!isObject(template.variantTemplate)) {
      errors.push("variantTemplate is required");
    } else {
      var kind = template.variantTemplate.kind;
      if (SUPPORTED_KINDS.indexOf(kind) === -1) {
        errors.push("variantTemplate.kind must be one of: " + SUPPORTED_KINDS.join(", "));
      }

      var slotPools = template.variantTemplate.slotPools;
      if (!isObject(slotPools)) {
        errors.push("variantTemplate.slotPools is required");
      } else {
        var adverbials = asArray(slotPools.adverbial).filter(nonEmptyString);
        var frames = asArray(slotPools.frames);
        if (!adverbials.length) {
          errors.push("variantTemplate.slotPools.adverbial must include at least one adverbial");
        }
        if (!frames.length) {
          errors.push("variantTemplate.slotPools.frames must include at least one frame");
        }
        frames.forEach(function (frame, index) {
          if (!isObject(frame)) {
            errors.push("variantTemplate.slotPools.frames[" + index + "] must be an object");
            return;
          }
          ["subject", "verb", "verbInfinitive", "rest"].forEach(function (key) {
            if (!nonEmptyString(frame[key])) {
              errors.push("variantTemplate.slotPools.frames[" + index + "]." + key + " is required");
            }
          });
        });
      }
    }

    if (!isObject(template.language)) {
      errors.push("template.language is required");
    } else {
      if (!asArray(template.language.phenomena).length) {
        errors.push("template.language.phenomena must include at least one tag");
      }
      if (!asArray(template.language.weakTags).length) {
        errors.push("template.language.weakTags must include at least one tag");
      }
    }

    if (!isObject(template.metrics) || template.metrics.accuracy !== true) {
      errors.push("template.metrics.accuracy must be true");
    }

    return { valid: errors.length === 0, errors: errors };
  }

  function enumerateV2InversionCombos(slotPools) {
    var combos = [];
    asArray(slotPools.adverbial).filter(nonEmptyString).forEach(function (adverbial) {
      asArray(slotPools.frames).forEach(function (frame) {
        if (!isObject(frame)) return;
        combos.push({
          adverbial: String(adverbial).trim(),
          subject: String(frame.subject).trim(),
          verb: String(frame.verb).trim(),
          verbInfinitive: String(frame.verbInfinitive).trim(),
          rest: String(frame.rest).trim()
        });
      });
    });
    return combos;
  }

  function buildV2InversionVariant(template, combo, index) {
    var baseId = String(template.id).trim();
    var suffix = slugPart(combo.adverbial) + "-" + slugPart(combo.subject);
    var variantId = baseId + "-" + suffix + "-" + padIndex(index);
    var languageBase = cloneLanguageBase(template);
    var values = {
      adverbial: combo.adverbial,
      subject: combo.subject,
      verb: combo.verb,
      verbInfinitive: combo.verbInfinitive,
      rest: combo.rest
    };

    var stimulus = combo.adverbial + " ___ (" + combo.subject + "/" + combo.verbInfinitive + ") " + combo.rest;
    var correct = [combo.verb + " " + combo.subject];
    var distractors = [combo.subject + " " + combo.verb];

    if (template.variantTemplate.allowSubjectFirst === true) {
      correct.push(combo.subject + " " + combo.verb);
    }

    var spec = {
      schemaVersion: 1,
      id: variantId,
      type: template.type,
      level: template.level,
      variantOf: baseId,
      language: {
        phenomena: languageBase.phenomena,
        stimulus: stimulus,
        correct: correct,
        distractors: distractors,
        weakTags: languageBase.weakTags
      },
      metrics: cloneMetrics(template.metrics)
    };

    if (nonEmptyString(template.context)) {
      spec.context = String(template.context).trim();
    }
    if (languageBase.context) {
      spec.language.context = languageBase.context;
    }
    if (languageBase.explanation) {
      spec.language.explanation = fillTemplate(languageBase.explanation, values);
    }
    if (asArray(template.sourceRefs).length) {
      spec.sourceRefs = asArray(template.sourceRefs).slice();
    }

    return spec;
  }

  function generateExerciseVariants(template, count, options) {
    options = options || {};
    var requested = Math.max(0, Number(count) || 0);
    var validation = validateTemplate(template);
    if (!validation.valid) {
      return {
        variants: [],
        errors: validation.errors.slice(),
        meta: { requested: requested, produced: 0, available: 0 }
      };
    }

    var slotPools = template.variantTemplate.slotPools;
    var combos = enumerateV2InversionCombos(slotPools);
    combos = shuffle(combos, options.seed);
    var available = combos.length;
    var take = Math.min(requested, available);
    var variants = [];
    var errors = [];

    for (var i = 0; i < take; i++) {
      var variant = buildV2InversionVariant(template, combos[i], i);
      if (options.validate !== false && options.specApi && typeof options.specApi.validate === "function") {
        var result = options.specApi.validate(variant);
        if (!result.valid) {
          errors.push(variant.id + ": " + result.errors.join("; "));
          continue;
        }
      }
      variants.push(variant);
    }

    if (requested > available) {
      errors.push("requested " + requested + " variants but only " + available + " slot combinations exist");
    }

    return {
      variants: variants,
      errors: errors,
      meta: {
        requested: requested,
        produced: variants.length,
        available: available,
        kind: template.variantTemplate.kind
      }
    };
  }

  var api = {
    SUPPORTED_KINDS: SUPPORTED_KINDS.slice(),
    validateTemplate: validateTemplate,
    generateExerciseVariants: generateExerciseVariants
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.PlataExerciseGenerator = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this));

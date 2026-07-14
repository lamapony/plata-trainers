"use strict";

const REQUEST_TYPE = "plata.lesson-request";
const SCHEMA_VERSION = 1;
const LEVELS = new Set(["A2", "B1", "B2"]);
const INTERFACE_LANGUAGES = new Set(["en", "da"]);
const SCAFFOLD_MARKERS = [
  "replace the scaffold",
  "replace the situation",
  "scaffold topic",
  "scaffold scene",
  "deliberately generic"
];
const REQUEST_FIELDS = new Set([
  "schemaVersion", "requestType", "slug", "title", "topic", "learnerGoal", "situation", "level",
  "estimatedMinutes", "interfaceLanguage", "mustInclude", "avoid", "sourcePreferences", "delivery"
]);
const DELIVERY_FIELDS = new Set([
  "status", "objectiveTags", "mustIncludeCoverage", "reviewedSourceUrls", "avoidReviewed", "reviewNotes"
]);

function text(value) {
  return String(value === undefined || value === null ? "" : value).trim();
}

function stringList(value, field, maxItems) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`${field} must be an array of strings`);
  const result = [];
  value.forEach(item => {
    const normalized = text(item);
    if (!normalized) throw new Error(`${field} must not contain empty values`);
    if (!result.includes(normalized)) result.push(normalized);
  });
  if (result.length > maxItems) throw new Error(`${field} must contain at most ${maxItems} items`);
  return result;
}

function httpUrlList(value, field, maxItems) {
  const result = stringList(value, field, maxItems);
  result.forEach(item => {
    let parsed;
    try {
      parsed = new URL(item);
    } catch (_err) {
      throw new Error(`${field} must contain absolute HTTP(S) URLs`);
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error(`${field} must contain absolute HTTP(S) URLs`);
    }
  });
  return result;
}

function slugPart(value) {
  return text(value)
    .replaceAll("æ", "ae")
    .replaceAll("Æ", "Ae")
    .replaceAll("ø", "o")
    .replaceAll("Ø", "O")
    .replaceAll("å", "a")
    .replaceAll("Å", "A")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 52)
    .replace(/-+$/g, "");
}

function normalizeCoverage(value) {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("delivery.mustIncludeCoverage must be an object");
  }
  const result = {};
  Object.keys(value).forEach(key => {
    result[text(key)] = stringList(value[key], `delivery.mustIncludeCoverage.${key}`, 8);
  });
  return result;
}

function normalizeRequest(input, options) {
  options = options || {};
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Lesson request must be a JSON object");
  }
  Object.keys(input).forEach(key => {
    if (!REQUEST_FIELDS.has(key)) throw new Error(`Unknown lesson request field: ${key}`);
  });
  if (input.schemaVersion !== undefined && Number(input.schemaVersion) !== SCHEMA_VERSION) {
    throw new Error(`schemaVersion must be ${SCHEMA_VERSION}`);
  }
  if (input.requestType !== undefined && input.requestType !== REQUEST_TYPE) {
    throw new Error(`requestType must be ${REQUEST_TYPE}`);
  }

  const topic = text(input.topic);
  const learnerGoal = text(input.learnerGoal);
  const situation = text(input.situation);
  if (topic.length < 3) throw new Error("topic is required");
  if (learnerGoal.length < 8) throw new Error("learnerGoal must describe a concrete learner outcome");
  if (situation.length < 8) throw new Error("situation must describe a real pressure context");

  const level = text(input.level || "B1").toUpperCase();
  if (!LEVELS.has(level)) throw new Error("level must be A2, B1, or B2");

  const estimatedMinutes = Number(input.estimatedMinutes === undefined ? 14 : input.estimatedMinutes);
  if (!Number.isInteger(estimatedMinutes) || estimatedMinutes < 8 || estimatedMinutes > 25) {
    throw new Error("estimatedMinutes must be an integer from 8 to 25");
  }

  const interfaceLanguage = text(input.interfaceLanguage || "en").toLowerCase();
  if (!INTERFACE_LANGUAGES.has(interfaceLanguage)) {
    throw new Error("interfaceLanguage must be en or da");
  }

  const title = text(input.title || topic);
  const requestedSlug = text(input.slug);
  const generatedSlug = `lesson-${level.toLowerCase()}-${slugPart(topic)}`;
  const slug = requestedSlug || generatedSlug;
  if (!/^lesson-(a2|b1|b2)-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("slug must use lesson-a2-, lesson-b1-, or lesson-b2- followed by kebab-case");
  }

  const mustInclude = stringList(input.mustInclude, "mustInclude", 8);
  const avoid = stringList(input.avoid, "avoid", 8);
  const sourcePreferences = stringList(input.sourcePreferences, "sourcePreferences", 6);
  const deliveryInput = options.resetDelivery ? {} : (input.delivery || {});
  if (!deliveryInput || typeof deliveryInput !== "object" || Array.isArray(deliveryInput)) {
    throw new Error("delivery must be an object");
  }
  Object.keys(deliveryInput).forEach(key => {
    if (!DELIVERY_FIELDS.has(key)) throw new Error(`Unknown delivery field: ${key}`);
  });
  const status = text(deliveryInput.status || "scaffold");
  if (!new Set(["scaffold", "ready"]).has(status)) {
    throw new Error("delivery.status must be scaffold or ready");
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    requestType: REQUEST_TYPE,
    slug,
    title,
    topic,
    learnerGoal,
    situation,
    level,
    estimatedMinutes,
    interfaceLanguage,
    mustInclude,
    avoid,
    sourcePreferences: sourcePreferences.length ? sourcePreferences : [
      "Sproget.dk / Dansk Sprognævn",
      "Den Danske Ordbog",
      "An authoritative source for the requested real-life domain"
    ],
    delivery: {
      status,
      objectiveTags: stringList(deliveryInput.objectiveTags, "delivery.objectiveTags", 8),
      mustIncludeCoverage: normalizeCoverage(deliveryInput.mustIncludeCoverage),
      reviewedSourceUrls: httpUrlList(deliveryInput.reviewedSourceUrls, "delivery.reviewedSourceUrls", 12),
      avoidReviewed: deliveryInput.avoidReviewed === true,
      reviewNotes: text(deliveryInput.reviewNotes)
    }
  };
}

function validateDelivery(request, lesson, dataSource) {
  const issues = [];
  const delivery = request.delivery || {};
  const scenes = Array.isArray(lesson && lesson.scenes) ? lesson.scenes : [];
  const sceneIds = new Set(scenes.map(scene => scene && scene.id).filter(Boolean));
  const masteryMap = lesson && lesson.masteryMap && typeof lesson.masteryMap === "object"
    ? lesson.masteryMap
    : {};
  const sourceNotes = Array.isArray(lesson && lesson.sourceNotes) ? lesson.sourceNotes : [];
  const sourceUrls = new Set(sourceNotes.map(note => text(note && note.url)).filter(Boolean));

  if (!lesson || typeof lesson !== "object") issues.push("lesson data did not export an object");
  if (lesson && lesson.id !== request.slug) issues.push(`lesson.id must equal ${request.slug}`);
  if (lesson && lesson.level !== request.level) issues.push(`lesson.level must equal ${request.level}`);
  if (lesson && lesson.title !== request.title) issues.push("lesson.title must match lesson-request.json");
  if (lesson && Number(lesson.estimatedMinutes) !== request.estimatedMinutes) {
    issues.push("lesson.estimatedMinutes must match lesson-request.json");
  }
  if (delivery.status !== "ready") issues.push("delivery.status is scaffold; set it to ready only after authoring and review");
  if (!Array.isArray(delivery.objectiveTags) || delivery.objectiveTags.length < 2) {
    issues.push("delivery.objectiveTags must cite at least two masteryMap tags");
  } else {
    delivery.objectiveTags.forEach(tag => {
      if (!masteryMap[tag]) issues.push(`delivery objective tag is missing from masteryMap: ${tag}`);
    });
  }

  request.mustInclude.forEach(requirement => {
    const coveredBy = delivery.mustIncludeCoverage && delivery.mustIncludeCoverage[requirement];
    if (!Array.isArray(coveredBy) || !coveredBy.length) {
      issues.push(`mustInclude is not mapped to a scene: ${requirement}`);
      return;
    }
    coveredBy.forEach(sceneId => {
      if (!sceneIds.has(sceneId)) issues.push(`mustInclude maps to unknown scene ${sceneId}: ${requirement}`);
    });
  });

  if (!Array.isArray(delivery.reviewedSourceUrls) || delivery.reviewedSourceUrls.length < 2) {
    issues.push("delivery.reviewedSourceUrls must cite at least two lesson sourceNotes URLs");
  } else {
    delivery.reviewedSourceUrls.forEach(url => {
      if (!sourceUrls.has(url)) issues.push(`reviewed source URL is missing from lesson sourceNotes: ${url}`);
    });
  }
  if (!delivery.avoidReviewed) issues.push("delivery.avoidReviewed must be true");
  if (text(delivery.reviewNotes).length < 12) issues.push("delivery.reviewNotes must summarize the final request review");

  const lowerSource = text(dataSource).toLowerCase();
  SCAFFOLD_MARKERS.forEach(marker => {
    if (lowerSource.includes(marker)) issues.push(`generic scaffold marker remains: ${marker}`);
  });

  return issues;
}

module.exports = {
  REQUEST_TYPE,
  SCHEMA_VERSION,
  normalizeRequest,
  slugPart,
  validateDelivery
};

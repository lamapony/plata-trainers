#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const generatorSource = fs.readFileSync(path.join(repoRoot, "shared", "exercise-generator.js"), "utf8");
const specSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-exercise-spec.js"), "utf8");
const templatePath = path.join(__dirname, "fixtures", "exercise-specs", "v2-inversion-template.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadModule(source, filename) {
  const context = { module: { exports: {} }, exports: {} };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: filename });
  return context.module.exports;
}

function run() {
  const generator = loadModule(generatorSource, "shared/exercise-generator.js");
  const specApi = loadModule(specSource, "shared/plata-exercise-spec.js");
  const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));

  assert(generator.SUPPORTED_KINDS.indexOf("v2-inversion-complete") !== -1, "generator advertises v2-inversion-complete");

  const invalid = generator.validateTemplate({ id: "broken" });
  assert(!invalid.valid, "broken template fails validation");

  const validTemplate = generator.validateTemplate(template);
  assert(validTemplate.valid, "fixture template validates: " + validTemplate.errors.join("; "));

  const batch = generator.generateExerciseVariants(template, 5, { specApi: specApi });
  assert(batch.errors.length === 0, "generator reports no errors for small batch: " + batch.errors.join("; "));
  assert(batch.meta.available === 9, "template exposes nine adverbial x frame combos");
  assert(batch.variants.length === 5, "generator returns five variants");

  batch.variants.forEach(function (variant) {
    const result = specApi.validate(variant);
    assert(result.valid, variant.id + " validates: " + result.errors.join("; "));
    assert(variant.variantOf === "v2-inversion-drill", variant.id + " links back to template id");
    assert(/___/.test(variant.language.stimulus), variant.id + " keeps completion blank");
    assert(variant.language.correct.length >= 1, variant.id + " includes inversion answer");
    assert(variant.language.distractors.length >= 1, variant.id + " includes V2 distractor");
  });

  const seededA = generator.generateExerciseVariants(template, 3, { seed: 42 });
  const seededB = generator.generateExerciseVariants(template, 3, { seed: 42 });
  assert(
    seededA.variants.map(function (variant) { return variant.id; }).join("|") ===
      seededB.variants.map(function (variant) { return variant.id; }).join("|"),
    "seeded generation is deterministic"
  );

  const overRequest = generator.generateExerciseVariants(template, 20, { specApi: specApi });
  assert(overRequest.variants.length === 9, "generator caps at available combos");
  assert(overRequest.errors.some(function (error) {
    return error.indexOf("only 9") !== -1;
  }), "over-request reports availability limit");

  const graded = specApi.checkAnswer(batch.variants[0], batch.variants[0].language.correct[0]);
  assert(graded.correct === true, "generated variant grades correctly");

  const wrong = specApi.checkAnswer(batch.variants[0], batch.variants[0].language.distractors[0]);
  assert(wrong.correct === false, "generated distractor is rejected");
  assert(wrong.weakTags.indexOf("v2-inversion") !== -1, "miss records weak tags");

  console.log("exercise generator QA passed: template validation, variant expansion, spec grading, and seed stability");
}

run();

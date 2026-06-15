#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const specSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-exercise-spec.js"), "utf8");
const schemaPath = path.join(repoRoot, "shared", "exercise-schema.json");
const fixturesDir = path.join(__dirname, "fixtures", "exercise-specs");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadSpecApi() {
  const context = { module: { exports: {} }, exports: {} };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(specSource, context, { filename: "shared/plata-exercise-spec.js" });
  return context.module.exports;
}

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, fileName), "utf8"));
}

function run() {
  const specApi = loadSpecApi();
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

  assert(fs.existsSync(schemaPath), "shared/exercise-schema.json must exist");
  assert(schema.title === "Platå Exercise Spec v1", "schema title matches v1 contract");
  assert(Array.isArray(schema.definitions.languageBlock.required), "schema documents language requirements");
  assert(specApi.SCHEMA_VERSION === 1, "runtime schema version is 1");

  const validComplete = readJson("valid-complete-sentence.json");
  const validMultiple = readJson("valid-multiple-choice.json");
  const validFreeInput = readJson("valid-free-input.json");
  const invalidMissingMetrics = readJson("invalid-missing-metrics.json");

  [validComplete, validMultiple, validFreeInput].forEach(function (fixture) {
    const result = specApi.validate(fixture);
    assert(result.valid, fixture.id + " should validate: " + result.errors.join("; "));
  });

  const invalidResult = specApi.validate(invalidMissingMetrics);
  assert(!invalidResult.valid, "invalid fixture must fail validation");
  assert(invalidResult.errors.some(function (error) {
    return error.indexOf("metrics") !== -1;
  }), "invalid fixture reports metrics error");

  const normalized = specApi.normalize(validComplete);
  assert(normalized && normalized.id === "v2-inversion-corridor", "normalize preserves id");
  assert(normalized.language.phenomena.length === 2, "normalize keeps phenomena");

  const stimulus = specApi.getStimulus(validComplete);
  assert(stimulus.indexOf("I morgen ___") !== -1, "getStimulus renders frame and prompt");
  assert(stimulus.indexOf("lægebesøg") !== -1, "getStimulus includes narrative context");

  const options = specApi.getOptions(validMultiple);
  assert(options.length === 4, "multiple-choice exposes four options");
  assert(options.filter(function (option) { return option.correct; }).length === 1, "one correct option");

  const correctAnswer = specApi.checkAnswer(validComplete, "tager jeg");
  assert(correctAnswer.correct === true, "complete-sentence accepts canonical answer");
  assert(correctAnswer.weakTags.length === 0, "correct answer clears weak tags");

  const wrongAnswer = specApi.checkAnswer(validComplete, "jeg tager ikke");
  assert(wrongAnswer.correct === false, "complete-sentence rejects distractor text");
  assert(wrongAnswer.weakTags.indexOf("v2-inversion") !== -1, "miss records weak tags");

  const mcCorrect = specApi.checkAnswer(validMultiple, "Hun læser en bog hver aften.");
  assert(mcCorrect.correct === true, "multiple-choice accepts correct label");

  const mcWrong = specApi.checkAnswer(validMultiple, "Hver aften hun læser en bog.");
  assert(mcWrong.correct === false, "multiple-choice rejects broken word order");

  const freeCorrect = specApi.checkAnswer(validFreeInput, "Jeg hedder Anna");
  assert(freeCorrect.correct === true, "free-input accepts prefix match");

  const attempt = specApi.toKernelAttempt(validComplete, correctAnswer, { responseTimeMs: 4200, attempts: 1 });
  assert(attempt.itemId === "v2-inversion-corridor", "kernel attempt uses spec id");
  assert(attempt.correct === true, "kernel attempt records correctness");
  assert(attempt.responseTimeMs === 4200, "kernel attempt preserves response time when enabled");

  console.log("exercise schema QA passed: schema file, validator, fixtures, grading, and kernel bridge");
}

run();

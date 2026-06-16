#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const issues = [];

function fail(message) { issues.push(message); }
function loadData(relPath) {
  const source = fs.readFileSync(path.join(root, relPath), "utf8");
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: relPath });
  return context.window.PLATA_DATA;
}
function nonEmptyString(value) { return typeof value === "string" && value.trim().length > 0; }
function unique(items, keyFn, label) {
  const seen = new Map();
  items.forEach((item, index) => {
    const key = keyFn(item);
    if (seen.has(key)) fail(`${label}: duplicate key ${JSON.stringify(key)} at ${seen.get(key)} and ${index}`);
    seen.set(key, index);
  });
}

const bojning = loadData("bojning-drill/data.js");
if (!bojning || !Array.isArray(bojning.verber) || !Array.isArray(bojning.substantiver)) {
  fail("bojning: missing verber/substantiver arrays");
} else {
  unique(bojning.verber, (v) => v.infinitive, "bojning.verber");
  bojning.verber.forEach((v, i) => {
    for (const key of ["infinitive", "nutid", "datid", "førnutid"]) {
      if (!nonEmptyString(v[key])) fail(`bojning.verber[${i}]: missing ${key}`);
    }
    if (!String(v.infinitive || "").startsWith("at ")) fail(`bojning.verber[${i}]: infinitive should start with 'at '`);
  });
  unique(bojning.substantiver, (s) => s.ubestemtEntal, "bojning.substantiver");
  bojning.substantiver.forEach((s, i) => {
    for (const key of ["ubestemtEntal", "bestemtEntal", "flertalUbestemt", "bestemtFlertal"]) {
      if (!nonEmptyString(s[key])) fail(`bojning.substantiver[${i}]: missing ${key}`);
    }
    if (!/^(en|et)\s/.test(s.ubestemtEntal || "")) fail(`bojning.substantiver[${i}]: ubestemtEntal should start with en/et`);
  });
}

const ord = loadData("ordstilling-drill/data.js");
if (!ord || !Array.isArray(ord.ordstilling)) {
  fail("ordstilling: missing ordstilling array");
} else {
  unique(ord.ordstilling, (item) => `${item.cat}::${item.prompt}::${(item.options || []).join("|")}`, "ordstilling.items");
  const cats = new Set();
  ord.ordstilling.forEach((item, i) => {
    if (!nonEmptyString(item.cat)) fail(`ordstilling[${i}]: missing cat`);
    else cats.add(item.cat);
    if (!nonEmptyString(item.prompt)) fail(`ordstilling[${i}]: missing prompt`);
    if (!Array.isArray(item.options) || item.options.length !== 4) fail(`ordstilling[${i}]: expected 4 options`);
    else {
      item.options.forEach((option, j) => { if (!nonEmptyString(option)) fail(`ordstilling[${i}].options[${j}]: empty option`); });
      unique(item.options.map((option) => ({ option })), (x) => x.option, `ordstilling[${i}].options`);
    }
    if (!Number.isInteger(item.correct) || item.correct < 0 || item.correct > 3) fail(`ordstilling[${i}]: correct must be 0..3`);
    if (Array.isArray(item.options) && nonEmptyString(item.options[item.correct]) === false) fail(`ordstilling[${i}]: correct option is empty`);
    if (!nonEmptyString(item.why)) fail(`ordstilling[${i}]: missing why explanation`);
  });
  for (const expected of ["v2", "inversion", "ledsaetning"]) {
    if (!cats.has(expected)) fail(`ordstilling: missing category ${expected}`);
  }
}

const reg = loadData("register-drill/data.js");
if (!reg || !Array.isArray(reg.register)) {
  fail("register: missing register array");
} else {
  unique(reg.register, (item) => `${item.cat}::${item.prompt}::${(item.options || []).join("|")}`, "register.items");
  const regCats = new Set();
  reg.register.forEach((item, i) => {
    if (!nonEmptyString(item.cat)) fail(`register[${i}]: missing cat`);
    else regCats.add(item.cat);
    if (!nonEmptyString(item.prompt)) fail(`register[${i}]: missing prompt`);
    if (!Array.isArray(item.options) || item.options.length !== 4) fail(`register[${i}]: expected 4 options`);
    else {
      item.options.forEach((option, j) => { if (!nonEmptyString(option)) fail(`register[${i}].options[${j}]: empty option`); });
      unique(item.options.map((option) => ({ option })), (x) => x.option, `register[${i}].options`);
    }
    if (!Number.isInteger(item.correct) || item.correct < 0 || item.correct > 3) fail(`register[${i}]: correct must be 0..3`);
    if (Array.isArray(item.options) && nonEmptyString(item.options[item.correct]) === false) fail(`register[${i}]: correct option is empty`);
    if (!nonEmptyString(item.why)) fail(`register[${i}]: missing why explanation`);
  });
  for (const expected of ["passive", "deadline", "escalation", "channel"]) {
    if (!regCats.has(expected)) fail(`register: missing category ${expected}`);
  }
}

const vocab = loadData("vocab-sr/data.js");
if (!vocab || !Array.isArray(vocab.vocab)) {
  fail("vocab: missing vocab array");
} else {
  unique(vocab.vocab, (item) => item.da, "vocab.items");
  vocab.vocab.forEach((item, i) => {
    for (const key of ["da", "ru", "en", "example"]) {
      if (!nonEmptyString(item[key])) fail(`vocab[${i}]: missing ${key}`);
    }
    if (/[.!?]$/.test(item.da || "")) fail(`vocab[${i}]: da lemma should not end with punctuation`);
  });
}

if (issues.length) {
  console.error(`data QA failed: ${issues.length} issue(s)`);
  for (const issue of issues) console.error("- " + issue);
  process.exit(1);
}

console.log(`data QA passed: ${bojning.verber.length} verbs, ${bojning.substantiver.length} nouns, ${ord.ordstilling.length} word-order items, ${reg.register.length} register items, ${vocab.vocab.length} vocab items`);

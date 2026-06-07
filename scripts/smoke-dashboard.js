#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..");
const kernelSource = fs.readFileSync(path.join(repoRoot, "shared", "plata-kernel.js"), "utf8");
const dashboardSource = fs.readFileSync(path.join(repoRoot, "dashboard.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeElement(tagName) {
  return {
    tagName,
    className: "",
    innerHTML: "",
    textContent: "",
    style: {},
    children: [],
    files: [],
    appendChild(child) {
      this.children.push(child);
    },
    addEventListener() {},
    click() {}
  };
}

function makeContext(initialStorage) {
  const storage = Object.assign({}, initialStorage || {});
  const elements = {
    "#trainer-cards": makeElement("div"),
    "#due-cards": makeElement("div"),
    "#weak-list": makeElement("div"),
    "#export-all": makeElement("button"),
    "#import-trigger": makeElement("button"),
    "#import-file": makeElement("input"),
    "#import-status": makeElement("p")
  };

  const context = {
    console,
    Date,
    JSON,
    Object,
    Math,
    String,
    Array,
    Map,
    URL: {
      createObjectURL() { return "blob:mock"; },
      revokeObjectURL() {}
    },
    Blob: function Blob() {},
    FileReader: function FileReader() {},
    document: {
      readyState: "complete",
      querySelector(selector) {
        return elements[selector] || null;
      },
      querySelectorAll() {
        return [];
      },
      createElement(tagName) {
        return makeElement(tagName);
      },
      addEventListener() {}
    },
    localStorage: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
      },
      setItem(key, value) {
        storage[key] = String(value);
      },
      removeItem(key) {
        delete storage[key];
      },
      key(index) {
        return Object.keys(storage)[index] || null;
      },
      get length() {
        return Object.keys(storage).length;
      }
    },
    setTimeout(fn) {
      if (typeof fn === "function") fn();
      return 1;
    }
  };

  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  return { context, elements, storage };
}

function run() {
  const env = makeContext();
  vm.runInContext(kernelSource, env.context, { filename: "shared/plata-kernel.js" });
  vm.runInContext(dashboardSource, env.context, { filename: "dashboard.js" });

  assert(env.elements["#trainer-cards"].children.length === 6, "dashboard renders all trainer cards");
  assert(env.elements["#due-cards"].children.length === 3, "dashboard renders practice recommendations");
  assert(/No weak tags detected/.test(env.elements["#weak-list"].innerHTML), "dashboard renders empty weak-tag state");

  console.log("ok - dashboard renders without runtime errors");
}

run();

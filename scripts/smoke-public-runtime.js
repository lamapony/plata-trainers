#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const vm = require("node:vm");

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

const repoRoot = path.resolve(argValue("--root") || path.resolve(__dirname, ".."));
const publicRoot = path.join(repoRoot, ".dist", "pages");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runPagesBuild() {
  const result = spawnSync(process.execPath, [path.join(repoRoot, "scripts", "build-pages-artifact.js")], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`Pages build failed\n${result.stdout}\n${result.stderr}`);
  }
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".svg": "image/svg+xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".xml": "application/xml; charset=utf-8"
  }[ext] || "application/octet-stream";
}

function publicFileFromRequest(root, rawUrl) {
  const url = new URL(rawUrl, "http://127.0.0.1/");
  let decoded = decodeURIComponent(url.pathname);
  if (decoded.endsWith("/")) decoded += "index.html";
  if (!path.extname(decoded)) decoded = path.posix.join(decoded, "index.html");
  const absolute = path.resolve(root, "." + decoded);
  const rel = path.relative(root, absolute);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return absolute;
}

function startStaticServer(root) {
  const server = http.createServer((req, res) => {
    const filePath = publicFileFromRequest(root, req.url || "/");
    if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("not found");
      return;
    }
    res.writeHead(200, {
      "cache-control": "no-store",
      "content-type": contentType(filePath)
    });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}/`,
        close: () => new Promise(done => server.close(done))
      });
    });
  });
}

function readPublic(relPath) {
  return fs.readFileSync(path.join(publicRoot, relPath), "utf8");
}

function attrs(tag) {
  const out = {};
  tag.replace(/([\w:-]+)\s*=\s*"([^"]*)"/g, (_, key, value) => {
    out[key.toLowerCase()] = value;
    return "";
  });
  return out;
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function linksFromHtml(html) {
  return Array.from(String(html || "").matchAll(/<a\b[^>]*>/gi)).map(match => {
    const tag = match[0];
    const a = attrs(tag);
    return {
      href: a.href || "",
      text: stripHtml(tag)
    };
  }).filter(link => link.href);
}

function idsFromHtml(html) {
  return new Set(Array.from(String(html || "").matchAll(/\bid="([^"]+)"/g)).map(match => match[1]));
}

function publicRelFromUrl(baseUrl, currentPath, href) {
  const url = new URL(href, new URL(currentPath, baseUrl));
  let rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  if (!rel) rel = "index.html";
  if (rel.endsWith("/")) rel += "index.html";
  if (!path.extname(rel)) rel = path.posix.join(rel, "index.html");
  return {
    rel,
    hash: url.hash,
    url
  };
}

async function fetchText(baseUrl, pathname) {
  const response = await fetch(new URL(pathname, baseUrl));
  assert(response.ok, `${pathname} returned HTTP ${response.status}`);
  return response.text();
}

async function fetchJson(baseUrl, pathname) {
  const response = await fetch(new URL(pathname, baseUrl));
  assert(response.ok, `${pathname} returned HTTP ${response.status}`);
  return response.json();
}

async function assertLocalLinks(baseUrl, pagePath, html) {
  const pageIds = idsFromHtml(html);
  for (const link of linksFromHtml(html)) {
    if (link.href === "#" || /^(https?:|mailto:|tel:|data:)/i.test(link.href)) continue;
    if (link.href.startsWith("#")) {
      assert(pageIds.has(link.href.slice(1)), `${pagePath} has missing hash target ${link.href}`);
      continue;
    }
    const target = publicRelFromUrl(baseUrl, pagePath, link.href);
    const response = await fetch(target.url);
    assert(response.ok, `${pagePath} links to ${link.href}, got HTTP ${response.status}`);
    if (target.hash && target.rel.endsWith(".html")) {
      const targetHtml = await response.text();
      assert(idsFromHtml(targetHtml).has(target.hash.slice(1)), `${pagePath} links to missing target ${link.href}`);
    }
  }
}

function makeElement(tagName, selector) {
  return {
    tagName: String(tagName || "div").toUpperCase(),
    selector: selector || "",
    className: "",
    textContent: "",
    innerHTML: "",
    href: "",
    src: "",
    attributes: {},
    children: [],
    parentElement: null,
    addEventListener() {},
    appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
      return child;
    },
    insertBefore(child, reference) {
      child.parentElement = this;
      const index = reference ? this.children.indexOf(reference) : -1;
      if (index === -1) this.children.push(child);
      else this.children.splice(index, 0, child);
      return child;
    },
    remove() {
      if (!this.parentElement) return;
      this.parentElement.children = this.parentElement.children.filter(child => child !== this);
      this.parentElement = null;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
    querySelector(query) {
      if (query === ".card-link") return this.children.find(child => child.className === "card-link") || null;
      if (query === ".friendly-progress") return this.children.find(child => child.className === "friendly-progress") || null;
      return null;
    },
    scrollIntoView(options) {
      this.scrollIntoViewCalls = this.scrollIntoViewCalls || [];
      this.scrollIntoViewCalls.push(options || {});
    },
    getBoundingClientRect() {
      return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
    }
  };
}

function makeTrainerCard(id) {
  const card = makeElement("article", `[data-trainer-id="${id}"]`);
  card.trainerId = id;
  const link = makeElement("a", ".card-link");
  link.className = "card-link";
  link.textContent = "Open ->";
  card.appendChild(link);
  return card;
}

function runtimeConsole(pageName, issues) {
  return {
    log() {},
    info() {},
    warn() {},
    error(...args) {
      issues.push(`${pageName}: console.error ${args.map(String).join(" ")}`);
    }
  };
}

async function waitFor(predicate, message) {
  for (let i = 0; i < 40; i += 1) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error(message);
}

function resolvePublicScript(pagePath, src) {
  return publicRelFromUrl("http://127.0.0.1/", pagePath, src).rel;
}

function runPublicScript(context, relPath) {
  vm.runInContext(readPublic(relPath), context, { filename: relPath });
}

function createFetch(baseUrl, pagePath, fetched) {
  return function runtimeFetch(input, init) {
    const url = new URL(String(input), new URL(pagePath, baseUrl));
    fetched.push(url.pathname.replace(/^\/+/, "") + (url.search || ""));
    return fetch(url, init);
  };
}

async function renderHomeRuntime(baseUrl) {
  const issues = [];
  const storage = {};
  const writes = [];
  const ids = {
    "#home-primary-action": (function () {
      const el = makeElement("a", "#home-primary-action");
      el.textContent = "Try B2 follow-up lesson";
      el.href = "./lessons/lesson-b2-job-followup/";
      return el;
    })(),
    "#home-start-title": makeElement("h2", "#home-start-title"),
    "#home-start-copy": makeElement("p", "#home-start-copy"),
    "#home-start-link": makeElement("a", "#home-start-link"),
    "#home-start-meta": makeElement("p", "#home-start-meta"),
    "#evaluate": makeElement("section", "#evaluate")
  };
  const cards = [
    "bojning",
    "ordstilling",
    "vocab",
    "lesson-01-arrival",
    "lesson-b2-radiator-register",
    "lesson-b2-job-followup"
  ].map(makeTrainerCard);
  const eventListeners = {};
  const context = {
    console: runtimeConsole("home", issues),
    Date,
    JSON,
    Object,
    Math,
    String,
    Array,
    URL,
    encodeURIComponent,
    pageYOffset: 0,
    document: {
      readyState: "complete",
      documentElement: { scrollTop: 0 },
      head: null,
      querySelector(selector) {
        if (ids[selector]) return ids[selector];
        const match = /^\[data-trainer-id="([^"]+)"\]$/.exec(selector);
        if (match) return cards.find(card => card.trainerId === match[1]) || null;
        return null;
      },
      querySelectorAll() {
        return [];
      },
      createElement(tagName) {
        return makeElement(tagName);
      },
      addEventListener(name, handler) {
        eventListeners[name] = handler;
      }
    },
    location: { hash: "#evaluate" },
    addEventListener(name, handler) {
      eventListeners[name] = handler;
    },
    requestAnimationFrame(handler) {
      handler();
    },
    setTimeout,
    scrollTo(options) {
      this.lastScrollTo = options;
    },
    localStorage: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
      },
      setItem(key, value) {
        writes.push({ key, value: String(value) });
        storage[key] = String(value);
      },
      removeItem(key) {
        writes.push({ key, value: null });
        delete storage[key];
      }
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  context.document.head = makeElement("head", "head");
  context.document.head.appendChild = function appendChild(child) {
    this.children.push(child);
    if (child.src) {
      runPublicScript(context, resolvePublicScript("index.html", child.src));
      if (typeof child.onload === "function") child.onload();
      return child;
    }
    return child;
  };
  ["shared/plata-kernel.js", "shared/plata-catalog.js", "shared/plata-competencies.js", "shared/plata-planner.js", "home.js"].forEach(file => {
    runPublicScript(context, file);
  });
  await waitFor(() => ids["#home-start-title"].textContent, "home runtime did not render a recommendation");

  assert(ids["#home-start-title"].textContent === "Start at the plateau", "home runtime did not render the plateau entry recommendation");
  assert(ids["#home-start-link"].href === "./lessons/lesson-b2-job-followup/", "home runtime starter link drifted");
  assert(ids["#home-start-link"].textContent === "Start B2 lesson", "home runtime plateau CTA drifted");
  assert(ids["#home-primary-action"].textContent === "Try B2 follow-up lesson", "home runtime hero CTA should stay on B2 lesson");
  assert(ids["#home-primary-action"].href === "./lessons/lesson-b2-job-followup/", "home runtime hero link should stay on B2 job follow-up");
  assert(ids["#evaluate"].scrollIntoViewCalls && ids["#evaluate"].scrollIntoViewCalls.length >= 1, "home runtime did not restore #evaluate hash");
  const meaningfulWrites = writes.filter(item => item.key !== "plata:storage-probe");
  assert(meaningfulWrites.length === 0, `home first-visit runtime wrote localStorage: ${meaningfulWrites.map(item => item.key).join(", ")}`);
  assert(issues.length === 0, issues.join("\n"));
}

function createReportPageContext(baseUrl, pagePath, selectors, pageName, hash) {
  const issues = [];
  const fetched = [];
  const eventListeners = {};
  const elements = {};
  selectors.forEach(selector => {
    elements[selector] = makeElement("div", selector);
  });
  const context = {
    console: runtimeConsole(pageName, issues),
    Date,
    JSON,
    String,
    Array,
    URL,
    encodeURIComponent,
    pageYOffset: 0,
    document: {
      documentElement: { scrollTop: 0 },
      querySelector(selector) {
        return elements[selector] || null;
      }
    },
    location: { hash: hash || "" },
    addEventListener(name, handler) {
      eventListeners[name] = handler;
    },
    requestAnimationFrame(handler) {
      handler();
    },
    setTimeout,
    scrollTo(options) {
      this.lastScrollTo = options;
    },
    fetch: createFetch(baseUrl, pagePath, fetched)
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  return { context, elements, fetched, issues, eventListeners };
}

async function renderProgramRuntime(baseUrl) {
  const env = createReportPageContext(baseUrl, "program.html", [
    "#program-status",
    "#program-summary",
    "#program-generated",
    "#program-pillars",
    "#program-capabilities",
    "#program-guarantees",
    "#program-reports",
    "#program-json-link"
  ], "program");
  env.elements["#program-json-link"].attributes["aria-disabled"] = "true";
  runPublicScript(env.context, "program.js");
  await waitFor(() => env.elements["#program-status"].textContent, "program runtime did not render status");

  assert(env.elements["#program-status"].textContent === "Proof map passing", "program runtime did not render a passing capability map");
  assert(env.elements["#program-reports"].innerHTML.includes("reports/evaluator-path.json"), "program runtime did not render evaluator path report link");
  assert(env.elements["#program-capabilities"].innerHTML.includes("Public GitHub proof surface"), "program runtime did not render public proof capability");
  assert(env.elements["#program-json-link"].href === "./reports/capabilities.json", "program runtime did not enable capability JSON link");
  assert(!Object.prototype.hasOwnProperty.call(env.elements["#program-json-link"].attributes, "aria-disabled"), "program runtime left JSON link disabled");
  assert(env.fetched.includes("reports/capabilities.json"), "program runtime did not fetch capabilities from the public server");
  assert(env.issues.length === 0, env.issues.join("\n"));
}

async function renderProofRuntime(baseUrl) {
  const env = createReportPageContext(baseUrl, "proof.html", [
    "#proof-status",
    "#proof-summary",
    "#proof-generated",
    "#proof-digest",
    "#proof-walkthrough",
    "#proof-evaluator",
    "#proof-artifacts",
    "#proof-surfaces",
    "#proof-capability-matrix",
    "#proof-guided",
    "#proof-health",
    "#proof-review",
    "#proof-digest-link",
    "#proof-health-link",
    "#proof-capabilities-link",
    "#proof-evaluator-link",
    "#proof-journey-link",
    "#proof-portability-link",
    "#proof-exercise-link",
    "#proof-guided-link",
    "#proof-quickstart-link",
    "#proof-evaluator-title",
    "#proof-guided-title",
    "#proof-walkthrough-title"
  ], "proof", "#proof-evaluator-title");
  [
    "#proof-digest-link",
    "#proof-health-link",
    "#proof-capabilities-link",
    "#proof-evaluator-link",
    "#proof-journey-link",
    "#proof-portability-link",
    "#proof-exercise-link",
    "#proof-guided-link",
    "#proof-quickstart-link"
  ].forEach(selector => {
    env.elements[selector].attributes["aria-disabled"] = "true";
  });
  runPublicScript(env.context, "proof.js");
  await waitFor(() => env.elements["#proof-status"].textContent, "proof runtime did not render status");

  assert(env.elements["#proof-status"].textContent === "Proof passing", "proof runtime did not render passing status");
  assert(env.elements["#proof-evaluator"].innerHTML.includes("First-visit evaluator path"), "proof runtime did not render evaluator path");
  assert(env.elements["#proof-walkthrough"].innerHTML.includes("evaluator-journey.json"), "proof runtime did not render evaluator journey proof");
  assert(env.elements["#proof-evaluator"].innerHTML.includes("0 storage writes"), "proof runtime did not render read-only demo proof");
  assert(env.elements["#proof-surfaces"].innerHTML.includes("Profile portability"), "proof runtime did not render profile portability surface");
  assert(env.elements["#proof-surfaces"].innerHTML.includes("profileport-"), "proof runtime did not render profile portability trace");
  assert(env.elements["#proof-surfaces"].innerHTML.includes("Exercise value"), "proof runtime did not render exercise value surface");
  assert(env.elements["#proof-surfaces"].innerHTML.includes("6/6 archetypes"), "proof runtime did not render exercise value archetype coverage");
  assert(env.elements["#proof-surfaces"].innerHTML.includes("flagship outcome"), "proof runtime did not render profile flagship outcome proof");
  assert(env.elements["#proof-surfaces"].innerHTML.includes("guided outcome proof"), "proof runtime did not render guided flagship outcome proof");
  assert(env.elements["#proof-surfaces"].innerHTML.includes("profile outcome portable"), "proof runtime did not render profile outcome portability proof");
  assert(env.elements["#proof-evaluator-link"].href === "./reports/evaluator-path.json", "proof runtime did not enable evaluator report link");
  assert(env.elements["#proof-journey-link"].href === "./reports/evaluator-journey.json", "proof runtime did not enable evaluator journey report link");
  assert(env.elements["#proof-portability-link"].href === "./reports/profile-portability.json", "proof runtime did not enable profile portability report link");
  assert(env.elements["#proof-exercise-link"].href === "./reports/exercise-value.json", "proof runtime did not enable exercise value report link");
  assert(env.elements["#proof-evaluator-title"].scrollIntoViewCalls && env.elements["#proof-evaluator-title"].scrollIntoViewCalls.length >= 1, "proof runtime did not restore evaluator hash");
  [
    "reports/proof-digest.json",
    "reports/demo-learner.json",
    "reports/evaluator-path.json",
    "reports/evaluator-journey.json",
    "reports/profile-portability.json",
    "reports/exercise-value.json",
    "reports/guided-session.json",
    "reports/capabilities.json",
    "reports/project-health.json",
    "reports/quickstart-proof/quickstart.json",
    "reports/quickstart-proof/review-report.json",
    "reports/quickstart-proof/review-summary.md"
  ].forEach(expected => {
    assert(env.fetched.includes(expected), `proof runtime did not fetch ${expected}`);
  });
  assert(env.issues.length === 0, env.issues.join("\n"));
}

function assertResponsiveContracts() {
  const css = readPublic("styles.css");
  assert(/\.site-shell\s*{[^}]*width:\s*min\(1120px,\s*calc\(100%\s*-\s*32px\)\)/s.test(css), "site shell does not constrain desktop width");
  assert(/@media\s*\(max-width:\s*820px\)[\s\S]*\.site-shell\s*{[^}]*width:\s*min\(100%\s*-\s*22px,\s*1120px\)/s.test(css), "site shell does not constrain mobile width");
  assert(/@media\s*\(max-width:\s*820px\)[\s\S]*\.proof-guided[\s\S]*grid-template-columns:\s*1fr/s.test(css), "proof guided cards are not single-column on mobile");
  assert(/@media\s*\(max-width:\s*820px\)[\s\S]*\.proof-capability-row[\s\S]*grid-template-columns:\s*1fr/s.test(css), "proof capability rows are not single-column on mobile");
  assert(/\.program-chip\s*{[^}]*overflow-wrap:\s*anywhere/s.test(css), "program chips can overflow long labels");
}

async function run() {
  runPagesBuild();
  assert(fs.existsSync(path.join(publicRoot, "index.html")), "Pages artifact did not build index.html");
  const server = await startStaticServer(publicRoot);
  try {
    const baseUrl = server.baseUrl;
    const pages = {
      "index.html": await fetchText(baseUrl, "index.html"),
      "dashboard.html?demo=learner": await fetchText(baseUrl, "dashboard.html?demo=learner"),
      "proof.html": await fetchText(baseUrl, "proof.html"),
      "program.html": await fetchText(baseUrl, "program.html")
    };
    assert(pages["index.html"].includes("id=\"evaluate\""), "public home page is missing #evaluate");
    assert(pages["index.html"].includes("./dashboard.html?demo=learner"), "public home page is missing demo learner link");
    assert(pages["index.html"].includes("./proof.html#proof-walkthrough-title"), "public home page is missing proof walkthrough link");
    assert(pages["index.html"].includes("./proof.html#proof-guided-title"), "public home page is missing guided proof link");
    assert(pages["index.html"].includes("./proof.html#proof-distribution-title"), "public home page is missing offline distribution proof link");
    assert(pages["index.html"].includes("Situation → miss → repair"), "public home should keep Situation → miss → repair product loop");
    assert(pages["index.html"].includes("id=\"create-your-lesson\""), "public home is missing custom lesson entry point");
    assert(pages["index.html"].includes("No forms. No JSON. No lesson-design expertise."), "public home custom lesson path is not written for non-technical visitors");
    assert(pages["index.html"].includes("./factory.html"), "public home custom lesson path is missing the plain-language guide");
    assert(pages["index.html"].includes("It cannot invent a new lesson by itself."), "public home custom lesson path overpromises live generation");
    assert(pages["index.html"].includes("id=\"repair-paths\""), "public home page is missing Match→Gym repair paths list");
    assert(pages["index.html"].includes("register · deadline"), "public home repair paths should list job follow-up register deadline bridge");
    assert(pages["index.html"].includes("bøjning · gender"), "public home repair paths should list job follow-up bojning trap bridge");
    assert(pages["index.html"].includes("register · channel"), "public home repair paths should list radiator register channel bridge");
    assert(!pages["index.html"].includes("vocab SR · scene words"), "public home flagship repair paths should not list DA↔RU vocab");
    assert(!/<section\b(?=[^>]*\bid="evaluate")[\s\S]*?href="\.\.?\/?reports\//i.test(pages["index.html"]), "home evaluator section links directly to Pages-only reports");
    assert(idsFromHtml(pages["proof.html"]).has("proof-evaluator-title"), "proof page is missing evaluator hash target");

    await Promise.all(Object.entries(pages).map(([pagePath, html]) => assertLocalLinks(baseUrl, pagePath, html)));

    const capabilities = await fetchJson(baseUrl, "reports/capabilities.json");
    assert(capabilities.status === "pass", "public capabilities report is not passing");
    for (const report of capabilities.publicReports || []) {
      const response = await fetch(new URL(report.pagesPath, baseUrl));
      assert(response.ok, `public report ${report.pagesPath} returned HTTP ${response.status}`);
    }

    const demo = await fetchJson(baseUrl, "reports/demo-learner.json");
    assert(demo.status === "pass", "public demo learner report is not passing");
    assert(demo.url === "dashboard.html?demo=learner", "demo learner report URL drifted");
    assert(demo.totals && demo.totals.storageWrites === 0, "demo learner public route is not read-only");

    const evaluator = await fetchJson(baseUrl, "reports/evaluator-path.json");
    assert(evaluator.status === "pass", "public evaluator path report is not passing");
    assert(evaluator.routeTargets.every(route => route.targetExists && route.hashTargetExists), "evaluator route target drifted");

    await renderHomeRuntime(baseUrl);
    await renderProgramRuntime(baseUrl);
    await renderProofRuntime(baseUrl);
    assertResponsiveContracts();
  } finally {
    await server.close();
  }

  console.log("ok - public runtime serves the built Pages artifact over local HTTP");
  console.log("ok - public runtime renders home, program, and proof JS against generated reports");
  console.log("ok - public runtime protects evaluator, demo read-only, report links, and responsive contracts");
}

run().catch(err => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});

#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const htmlFiles = [];
const ignore = new Set([".git", "node_modules", "dist"]);

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (ignore.has(name)) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (name.endsWith(".html")) htmlFiles.push(p);
  }
}

function rel(p) { return path.relative(root, p).replaceAll(path.sep, "/"); }
function fail(issues, file, message) { issues.push(`${rel(file)}: ${message}`); }
function attrs(tag) {
  const out = {};
  tag.replace(/([\w:-]+)\s*=\s*"([^"]*)"/g, (_, k, v) => { out[k.toLowerCase()] = v; return ""; });
  return out;
}
function stripHash(href) { return href.split("#")[0].split("?")[0]; }
function targetPath(file, href) {
  const clean = stripHash(href);
  if (!clean || clean.startsWith("http") || clean.startsWith("mailto:") || clean.startsWith("tel:")) return null;
  const base = path.dirname(file);
  let t = clean.startsWith("/") ? path.join(root, clean.slice(1)) : path.join(base, clean);
  if (clean.endsWith("/")) t = path.join(t, "index.html");
  if (!path.extname(t)) t = path.join(t, "index.html");
  return t;
}

walk(root);
const issues = [];
for (const file of htmlFiles) {
  const text = fs.readFileSync(file, "utf8");
  if (!/<html\b[^>]*\blang="[^"]+"/i.test(text)) fail(issues, file, "missing html lang");
  if (!/<title[^>]*>[^<]{5,}<\/title>/i.test(text)) fail(issues, file, "missing meaningful title");
  if (!/<meta[^>]+name="description"/i.test(text)) fail(issues, file, "missing meta description");
  const h1s = (text.match(/<h1\b/gi) || []).length;
  if (h1s !== 1) fail(issues, file, `expected exactly one h1, got ${h1s}`);

  for (const m of text.matchAll(/<(script|link|img|a)\b[^>]*>/gi)) {
    const tag = m[0];
    const a = attrs(tag);
    const href = a.href || a.src;
    if (!href) continue;
    if (href.startsWith("data:") || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    const target = targetPath(file, href);
    if (target && !fs.existsSync(target)) fail(issues, file, `broken local reference ${href}`);
  }

  for (const m of text.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt="[^"]*"/i.test(m[0])) fail(issues, file, "image missing alt");
  }
}

for (const required of ["index.html", "404.html", "robots.txt", "sitemap.xml", "site.webmanifest"]) {
  if (!fs.existsSync(path.join(root, required))) issues.push(`missing ${required}`);
}

if (issues.length) {
  console.error(`static QA failed: ${issues.length} issue(s)`);
  for (const issue of issues) console.error("- " + issue);
  process.exit(1);
}
console.log(`static QA passed: ${htmlFiles.length} html files checked`);

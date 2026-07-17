#!/usr/bin/env node
"use strict";

/**
 * Tiny static file server for the Pages artifact (.dist/pages).
 * Used by Playwright webServer — zero extra npm dependencies.
 */

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const publicRoot = path.resolve(process.env.PUBLIC_ROOT || path.join(repoRoot, ".dist", "pages"));
const port = Number(process.env.PORT || process.env.PLATA_BROWSER_PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".css": "text/css; charset=utf-8",
    ".aac": "audio/aac",
    ".flac": "audio/flac",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".m4a": "audio/mp4",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".opus": "audio/ogg; codecs=opus",
    ".png": "image/png",
    ".svg": "image/svg+xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".woff2": "font/woff2",
    ".wav": "audio/wav",
    ".xml": "application/xml; charset=utf-8"
  }[ext] || "application/octet-stream";
}

function publicFileFromRequest(root, rawUrl) {
  const url = new URL(rawUrl || "/", "http://127.0.0.1/");
  let decoded = decodeURIComponent(url.pathname);
  if (decoded.endsWith("/")) decoded += "index.html";
  if (!path.extname(decoded)) decoded = path.posix.join(decoded, "index.html");
  const absolute = path.resolve(root, "." + decoded);
  const rel = path.relative(root, absolute);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return absolute;
}

function startServer(options) {
  const root = path.resolve(options && options.publicRoot || publicRoot);
  const listenPort = Number(options && options.port || port);
  const listenHost = options && options.host || host;
  if (!fs.existsSync(root)) throw new Error(`Pages artifact missing at ${root}. Run: npm run build:pages`);
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
  server.listen(listenPort, listenHost, () => {
    console.log(`serving ${root} at http://${listenHost}:${listenPort}/`);
  });
  return server;
}

if (require.main === module) {
  try { startServer(); } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { contentType, publicFileFromRequest, startServer };

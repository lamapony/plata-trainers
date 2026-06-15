#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "assets", "icons");
const ogPath = path.join(root, "assets", "og-plata.png");

const BG = [32, 42, 36, 255];
const PEAK = [143, 168, 148, 255];
const SNOW = [230, 236, 232, 255];

function insideRoundedRect(x, y, size, radius) {
  const edge = size - 1 - radius;
  if (x >= radius && x <= edge && y >= radius && y <= edge) return true;
  const corners = [
    [radius, radius],
    [edge, radius],
    [radius, edge],
    [edge, edge]
  ];
  return corners.some(([cx, cy]) => {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= radius * radius;
  });
}

function paintIcon(size) {
  const data = Buffer.alloc(size * size * 4);
  const radius = Math.round(size * 0.18);
  const baseY = Math.round(size * 0.72);
  const leftX = Math.round(size * 0.18);
  const midX = Math.round(size * 0.46);
  const rightX = Math.round(size * 0.82);
  const peakY = Math.round(size * 0.28);
  const midPeakY = Math.round(size * 0.4);

  function setPixel(x, y, color) {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  }

  function triangleY(x, x1, y1, x2, y2, x3, y3) {
    const denom = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
    if (denom === 0) return baseY;
    const a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y1 - y3)) / denom;
    const b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y2 - y3)) / denom;
    const c = 1 - a - b;
    if (a < 0 || b < 0 || c < 0) return baseY;
    return a * y1 + b * y2 + c * y3;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!insideRoundedRect(x, y, size, radius)) continue;
      const leftPeak = triangleY(x, leftX, baseY, midX, midPeakY, midX, baseY);
      const rightPeak = triangleY(x, midX, baseY, midX, midPeakY, rightX, baseY);
      const mainPeak = triangleY(x, leftX, baseY, midX, peakY, rightX, baseY);
      const mountainTop = Math.min(leftPeak, rightPeak, mainPeak);
      if (y >= mountainTop - 0.5) {
        const snowLine = Math.min(leftPeak, rightPeak, mainPeak) + size * 0.06;
        setPixel(x, y, y < snowLine ? SNOW : PEAK);
      } else {
        setPixel(x, y, BG);
      }
    }
  }
  return data;
}

function paintOgImage(width, height) {
  const data = Buffer.alloc(width * height * 4);
  const baseY = Math.round(height * 0.82);
  const leftX = Math.round(width * 0.06);
  const midX = Math.round(width * 0.44);
  const rightX = Math.round(width * 0.94);
  const peakY = Math.round(height * 0.18);
  const midPeakY = Math.round(height * 0.34);
  const SKY = [26, 34, 30, 255];

  function setPixel(x, y, color) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = (y * width + x) * 4;
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  }

  function triangleY(x, x1, y1, x2, y2, x3, y3) {
    const denom = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
    if (denom === 0) return baseY;
    const a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y1 - y3)) / denom;
    const b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y2 - y3)) / denom;
    const c = 1 - a - b;
    if (a < 0 || b < 0 || c < 0) return baseY;
    return a * y1 + b * y2 + c * y3;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const leftPeak = triangleY(x, leftX, baseY, midX, midPeakY, midX, baseY);
      const rightPeak = triangleY(x, midX, baseY, midX, midPeakY, rightX, baseY);
      const mainPeak = triangleY(x, leftX, baseY, midX, peakY, rightX, baseY);
      const mountainTop = Math.min(leftPeak, rightPeak, mainPeak);
      if (y >= mountainTop - 0.5) {
        const snowLine = Math.min(leftPeak, rightPeak, mainPeak) + height * 0.05;
        setPixel(x, y, y < snowLine ? SNOW : PEAK);
      } else {
        const skyMix = y / Math.max(mountainTop, 1);
        setPixel(x, y, [
          Math.round(BG[0] * (1 - skyMix) + SKY[0] * skyMix),
          Math.round(BG[1] * (1 - skyMix) + SKY[1] * skyMix),
          Math.round(BG[2] * (1 - skyMix) + SKY[2] * skyMix),
          255
        ]);
      }
    }
  }
  return data;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePngFromRgba(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function encodePng(size) {
  return encodePngFromRgba(size, size, paintIcon(size));
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(path.dirname(ogPath), { recursive: true });
  fs.writeFileSync(path.join(outDir, "icon-192.png"), encodePng(192));
  fs.writeFileSync(path.join(outDir, "icon-512.png"), encodePng(512));
  fs.writeFileSync(ogPath, encodePngFromRgba(1200, 630, paintOgImage(1200, 630)));
  console.log("Brand assets built: assets/icons/icon-192.png, icon-512.png, assets/og-plata.png");
}

main();

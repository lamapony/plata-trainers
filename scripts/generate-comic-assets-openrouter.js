#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { buildQualityReport } = require("./build-quality-report.js");

const repoRoot = path.resolve(__dirname, "..");
const defaultOut = path.join(repoRoot, ".dist", "comic-prompts.json");

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function lessonSlugFromDataPath(dataPath) {
  return path.basename(path.dirname(dataPath));
}

function workspaceAssetPath(lesson, panel) {
  return path.join(repoRoot, path.dirname(lesson.dataPath), panel.assetPath || "");
}

function normalizeAssetPath(file) {
  return path.relative(repoRoot, file).replaceAll(path.sep, "/");
}

function loadLessonFile(file) {
  const resolved = path.resolve(repoRoot, file);
  const source = fs.readFileSync(resolved, "utf8");
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: resolved });
  const lessons = Object.values(context.window).filter(value => value && value.id && Array.isArray(value.scenes));
  if (lessons.length !== 1) throw new Error(`expected exactly one lesson object in ${file}`);
  return {
    ...lessons[0],
    dataPath: normalizeAssetPath(resolved)
  };
}

function panelPrompt(lesson, panel) {
  const storyboard = lesson.comicStoryboard || {};
  return [
    `Use case: illustration-story`,
    `Asset type: gold lesson comic panel`,
    `Primary request: ${panel.prompt}`,
    `Lesson: ${lesson.title}`,
    `Scene id: ${panel.sceneId}`,
    `Style/medium: ${storyboard.style}`,
    `Composition/framing: one complete 16:9 comic panel, clear foreground subject, no text-dependent comprehension`,
    `Learning role: visually reinforce mastery signals ${asArray(panel.masteryTags).join(", ")}`,
    `Must include: ${asArray(panel.mustInclude).join("; ")}`,
    `Avoid: ${asArray(panel.avoid).join("; ")}`,
    `Constraints: no readable text, no logos, no watermarks, no UI screenshots, no speech bubbles with text, culturally plausible modern Denmark`
  ].join("\n");
}

function collectJobs(report, options = {}) {
  const lessonFilter = options.lesson || "";
  const panelFilter = options.panel || "";
  return report.lessons
    .filter(lesson => lesson.qualityTier === "gold")
    .filter(lesson => !lessonFilter || lesson.id === lessonFilter || lessonSlugFromDataPath(lesson.dataPath) === lessonFilter)
    .flatMap(lesson => asArray(lesson.comicStoryboard && lesson.comicStoryboard.panels).map(panel => ({ lesson, panel })))
    .filter(job => !panelFilter || job.panel.id === panelFilter || job.panel.sceneId === panelFilter)
    .map(({ lesson, panel }) => ({
      lessonId: lesson.id,
      lessonSlug: lessonSlugFromDataPath(lesson.dataPath),
      panelId: panel.id,
      sceneId: panel.sceneId,
      model: options.model,
      aspectRatio: lesson.comicStoryboard.aspectRatio || "16:9",
      imageSize: lesson.comicStoryboard.imageSize || "1K",
      assetPath: normalizeAssetPath(workspaceAssetPath(lesson, panel)),
      prompt: panelPrompt(lesson, panel)
    }));
}

function parseImageData(message) {
  const images = asArray(message && message.images);
  const first = images[0];
  if (!first) return "";
  return first.image_url && first.image_url.url || first.imageUrl && first.imageUrl.url || first.url || "";
}

function decodeDataUrl(dataUrl) {
  const match = String(dataUrl).match(/^data:image\/[^;]+;base64,(.+)$/);
  return match ? Buffer.from(match[1], "base64") : null;
}

async function downloadImage(url) {
  const data = decodeDataUrl(url);
  if (data) return data;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`image download failed: ${response.status} ${response.statusText}`);
  return Buffer.from(await response.arrayBuffer());
}

async function generateJob(job, apiKey) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "plata-trainers comic storyboard generator"
    },
    body: JSON.stringify({
      model: job.model,
      messages: [{ role: "user", content: job.prompt }],
      modalities: ["image", "text"],
      image_config: {
        aspect_ratio: job.aspectRatio,
        image_size: job.imageSize
      },
      stream: false
    })
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`OpenRouter image generation failed: ${response.status} ${payload.error && payload.error.message || response.statusText}`);
  }
  const message = payload.choices && payload.choices[0] && payload.choices[0].message;
  const imageUrl = parseImageData(message);
  if (!imageUrl) throw new Error(`OpenRouter response did not include an image for ${job.lessonId}/${job.panelId}`);
  const bytes = await downloadImage(imageUrl);
  const target = path.join(repoRoot, job.assetPath);
  ensureDir(target);
  fs.writeFileSync(target, bytes);
  return { ...job, bytes: bytes.length };
}

async function main() {
  const dryRun = hasFlag("--dry-run");
  const model = argValue("--model") || "google/gemini-2.5-flash-image";
  const out = path.resolve(repoRoot, argValue("--out") || defaultOut);
  const file = argValue("--file");
  const report = file ? { lessons: [loadLessonFile(file)] } : buildQualityReport();
  const jobs = collectJobs(report, {
    lesson: argValue("--lesson"),
    panel: argValue("--panel"),
    model
  });
  if (!jobs.length) {
    console.error("no comic storyboard jobs matched the request");
    process.exit(1);
  }

  if (dryRun) {
    ensureDir(out);
    fs.writeFileSync(out, JSON.stringify({ schemaVersion: 1, model, jobs }, null, 2) + "\n");
    console.log(`comic prompt manifest built: ${path.relative(repoRoot, out).replaceAll(path.sep, "/")} (${jobs.length} panel(s))`);
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is required for generation. Use --dry-run to build prompts without calling OpenRouter.");
    process.exit(1);
  }
  for (const job of jobs) {
    const result = await generateJob(job, apiKey);
    console.log(`generated comic panel: ${result.assetPath} (${result.bytes} bytes)`);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  });
}

module.exports = {
  collectJobs,
  panelPrompt
};

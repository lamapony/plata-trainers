#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { normalizeRequest } = require("./lib/lesson-request.js");

const repoRoot = path.resolve(__dirname, "..");

function usage() {
  return [
    "Usage:",
    "  npm run lesson:new -- --request examples/lesson-request.example.json [options]",
    "",
    "Options:",
    "  --root /path/to/repo   Target repo root (default: current repo)",
    "  --no-catalog           Do not update shared/plata-catalog.js",
    "  --dry-run              Validate and print the planned scaffold",
    "  --force                Overwrite an existing lesson folder"
  ].join("\n");
}

function parseArgs(argv) {
  const options = { root: repoRoot, updateCatalog: true, dryRun: false, force: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--no-catalog") options.updateCatalog = false;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--request" || arg === "--root") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${arg}`);
      options[arg.slice(2)] = value;
      i++;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }
  if (!options.request) throw new Error("--request is required");
  options.root = path.resolve(options.root);
  options.request = path.resolve(options.request);
  return options;
}

function authoringGuide(request) {
  const includeLines = request.mustInclude.length
    ? request.mustInclude.map(item => `- [ ] ${item}`).join("\n")
    : "- [ ] No explicit mustInclude items; cover the stated learner goal and situation.";
  const avoidLines = request.avoid.length
    ? request.avoid.map(item => `- [ ] Avoided: ${item}`).join("\n")
    : "- [ ] No explicit avoid items; keep claims source-backed and within language-learning scope.";

  return `# Authoring ${request.slug}

This folder was created from \`lesson-request.json\`. It is a scaffold, not a finished lesson.

## User outcome

- Topic: ${request.topic}
- Goal: ${request.learnerGoal}
- Situation: ${request.situation}
- Level: ${request.level}
- Target duration: ${request.estimatedMinutes} minutes

## Required coverage

${includeLines}

## Guardrails

${avoidLines}

## Before marking ready

1. Replace every generic scaffold situation, phrase, diagnostic, ending, and comic prompt.
2. Research Danish language and domain claims; add the reviewed URLs to \`sourceNotes\`.
3. Make each miss map to a mastery tag and a precise remediation scene or drill.
4. Update \`lesson-request.json.delivery\`: status, objectiveTags, coverage, reviewedSourceUrls, avoidReviewed, and reviewNotes.
5. Run \`npm run lesson:verify -- --lesson ${request.slug}\`.
6. Run the full \`npm run check\` before calling the lesson publishable.
`;
}

function runScaffold(options, request) {
  const args = [
    path.join(repoRoot, "scripts", "scaffold-gold-lesson.js"),
    "--root", options.root,
    "--slug", request.slug,
    "--title", request.title,
    "--name", `${request.level}: ${request.title}`,
    "--description", request.learnerGoal,
    "--subtitle", `A ${request.level} Danish lesson about ${request.topic}: ${request.learnerGoal}`,
    "--level", request.level,
    "--minutes", String(request.estimatedMinutes)
  ];
  if (!options.updateCatalog) args.push("--no-catalog");
  if (options.dryRun) args.push("--dry-run");
  if (options.force) args.push("--force");

  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe"
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status || 1);
}

function main() {
  try {
    const options = parseArgs(process.argv);
    if (!fs.existsSync(options.request)) throw new Error(`Request file not found: ${options.request}`);
    const raw = JSON.parse(fs.readFileSync(options.request, "utf8"));
    const request = normalizeRequest(raw, { resetDelivery: true });

    console.log(`Lesson request valid: ${request.slug}`);
    console.log(`Outcome: ${request.learnerGoal}`);
    runScaffold(options, request);

    if (options.dryRun) {
      console.log("Dry run only; lesson-request.json was not written.");
      return;
    }

    const lessonDir = path.join(options.root, "lessons", request.slug);
    fs.writeFileSync(path.join(lessonDir, "lesson-request.json"), `${JSON.stringify(request, null, 2)}\n`);
    fs.writeFileSync(path.join(lessonDir, "AUTHORING.md"), authoringGuide(request));

    console.log(`Request contract written: lessons/${request.slug}/lesson-request.json`);
    console.log(`Authoring checklist written: lessons/${request.slug}/AUTHORING.md`);
    console.log("Status: scaffold — an agent must author and review the real lesson before delivery.");
    console.log(`Verify when ready: npm run lesson:verify -- --lesson ${request.slug}`);
  } catch (err) {
    console.error(err.message);
    console.error("");
    console.error(usage());
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { authoringGuide, parseArgs };

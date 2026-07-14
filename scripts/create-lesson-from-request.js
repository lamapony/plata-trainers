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
    "  npm run lesson:new -- --topic \"...\" --goal \"...\" --situation \"...\" [options]",
    "",
    "Direct brief options:",
    "  --topic TEXT           Lesson topic (required without --request)",
    "  --goal TEXT            Concrete learner outcome (required without --request)",
    "  --situation TEXT       Real pressure context (required without --request)",
    "  --level A2|B1|B2      Learner level (default: B1)",
    "  --title TEXT           Display title (default: topic)",
    "  --slug SLUG            Stable lesson slug (default: derived)",
    "  --minutes 8..25        Target duration (default: 14)",
    "  --language en|da      Interface language (default: en)",
    "  --include TEXT         Required moment; repeatable",
    "  --avoid TEXT           Guardrail; repeatable",
    "  --source TEXT          Preferred source; repeatable",
    "",
    "Options:",
    "  --root /path/to/repo   Target repo root (default: current repo)",
    "  --no-catalog           Do not update shared/plata-catalog.js",
    "  --preview              Normalize the brief and print the plan without writing files",
    "  --dry-run              Backwards-compatible alias for --preview",
    "  --force                Overwrite an existing lesson folder"
  ].join("\n");
}

function parseArgs(argv) {
  const options = {
    root: repoRoot,
    updateCatalog: true,
    preview: false,
    dryRun: false,
    force: false,
    mustInclude: [],
    avoid: [],
    sourcePreferences: []
  };
  const valueOptions = {
    "--request": "request",
    "--root": "root",
    "--topic": "topic",
    "--goal": "learnerGoal",
    "--situation": "situation",
    "--level": "level",
    "--title": "title",
    "--slug": "slug",
    "--minutes": "estimatedMinutes",
    "--language": "interfaceLanguage"
  };
  const repeatableOptions = {
    "--include": "mustInclude",
    "--avoid": "avoid",
    "--source": "sourcePreferences"
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--no-catalog") options.updateCatalog = false;
    else if (arg === "--preview" || arg === "--dry-run") {
      options.preview = true;
      options.dryRun = true;
    }
    else if (arg === "--force") options.force = true;
    else if (valueOptions[arg] || repeatableOptions[arg]) {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${arg}`);
      if (repeatableOptions[arg]) options[repeatableOptions[arg]].push(value);
      else options[valueOptions[arg]] = value;
      i++;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  const directFields = ["topic", "learnerGoal", "situation", "level", "title", "slug", "estimatedMinutes", "interfaceLanguage"];
  const hasDirectBrief = directFields.some(field => options[field] !== undefined)
    || options.mustInclude.length > 0
    || options.avoid.length > 0
    || options.sourcePreferences.length > 0;
  if (options.request && hasDirectBrief) {
    throw new Error("Use either --request or direct brief options, not both");
  }
  if (!options.request) {
    if (!options.topic) throw new Error("--topic is required without --request");
    if (!options.learnerGoal) throw new Error("--goal is required without --request");
    if (!options.situation) throw new Error("--situation is required without --request");
  }
  options.root = path.resolve(options.root);
  if (options.request) options.request = path.resolve(options.request);
  return options;
}

function requestInput(options) {
  if (options.request) {
    if (!fs.existsSync(options.request)) throw new Error(`Request file not found: ${options.request}`);
    return JSON.parse(fs.readFileSync(options.request, "utf8"));
  }
  const input = {
    topic: options.topic,
    learnerGoal: options.learnerGoal,
    situation: options.situation,
    mustInclude: options.mustInclude,
    avoid: options.avoid,
    sourcePreferences: options.sourcePreferences
  };
  ["level", "title", "slug", "estimatedMinutes", "interfaceLanguage"].forEach(field => {
    if (options[field] !== undefined) input[field] = field === "estimatedMinutes"
      ? Number(options[field])
      : options[field];
  });
  return input;
}

function previewText(request, options) {
  const plannedFiles = [
    `lessons/${request.slug}/index.html`,
    `lessons/${request.slug}/app.js`,
    `lessons/${request.slug}/data.js`,
    `lessons/${request.slug}/styles.css`,
    `lessons/${request.slug}/lesson-request.json`,
    `lessons/${request.slug}/AUTHORING.md`
  ];
  return [
    "Normalized lesson request:",
    JSON.stringify(request, null, 2),
    "",
    "Planned scaffold:",
    ...plannedFiles.map(file => `- ${file}`),
    `- shared/plata-catalog.js: ${options.updateCatalog ? "update" : "unchanged"}`,
    "- delivery status: scaffold (not publishable)"
  ].join("\n");
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
    const raw = requestInput(options);
    const request = normalizeRequest(raw, { resetDelivery: true });

    console.log(`Lesson request valid: ${request.slug}`);
    console.log(`Outcome: ${request.learnerGoal}`);
    if (options.preview) console.log(`\n${previewText(request, options)}\n`);
    runScaffold(options, request);

    if (options.dryRun) {
      console.log("Preview complete. No files were written.");
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

module.exports = { authoringGuide, parseArgs, previewText, requestInput };

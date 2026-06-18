#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const requiredArchetypes = [
  "consequence-exercise",
  "near-miss",
  "repair-ladder",
  "same-intent-different-channel",
  "memory-backed-recurrence",
  "explain-your-choice"
];

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function sourceRoot(options = {}) {
  if (typeof options === "string") return path.resolve(options);
  return path.resolve(options.root || repoRoot);
}

function displayRel(file, root = repoRoot) {
  const absolute = path.resolve(file);
  const workspaceRel = path.relative(repoRoot, absolute);
  if (!workspaceRel.startsWith("..") && !path.isAbsolute(workspaceRel)) return workspaceRel.replaceAll(path.sep, "/");
  return path.relative(root, absolute).replaceAll(path.sep, "/");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function fileExists(root, relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function findLessonDataFiles(root) {
  const lessonsRoot = path.join(root, "lessons");
  return fs.readdirSync(lessonsRoot)
    .filter(dir => fs.statSync(path.join(lessonsRoot, dir)).isDirectory())
    .map(dir => path.join("lessons", dir, "data.js").replaceAll(path.sep, "/"))
    .filter(relPath => fs.existsSync(path.join(root, relPath)));
}

function loadWindowScript(root, relPath) {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, relPath), "utf8"), context, { filename: relPath });
  return context.window;
}

function loadLesson(root, relPath) {
  const win = loadWindowScript(root, relPath);
  const key = Object.keys(win).find(name => name.startsWith("PLATA_LESSON_"));
  return key ? win[key] : null;
}

function loadRepairRuntime(root) {
  const context = { window: {}, console, Date, JSON, Object, Math, String, Array, encodeURIComponent };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, "shared/plata-catalog.js"), "utf8"), context, { filename: "shared/plata-catalog.js" });
  vm.runInContext(fs.readFileSync(path.join(root, "shared/plata-repair-bridge.js"), "utf8"), context, { filename: "shared/plata-repair-bridge.js" });
  return {
    bridge: context.window.PlataRepairBridge,
    catalog: context.window.PlataCatalog
  };
}

const jobFollowupBojningGenderTrapSpec = {
  id: "job-followup-bojning-gender-trap",
  lessonId: "lesson-b2-job-followup",
  dataPath: "lessons/lesson-b2-job-followup/data.js",
  missSceneId: "email-register",
  missOptionId: "gender-trap",
  signal: "common-gender-noun",
  alternateSignals: ["irregular-plural-noun", "strong-verb-past"],
  intent: "Route common-gender noun misses from professional follow-up email to targeted bojning drill without losing register context.",
  archetypes: ["near-miss", "repair-ladder", "memory-backed-recurrence"],
  memoryCue: {
    signal: "common-gender-noun",
    copy: "Memory-backed recurrence: mit interesse on en-ord in follow-up email must become min interesse after bojning common-gender drill."
  },
  trapCategories: [
    {
      id: "common-gender",
      label: "Common gender trap (en-ord)",
      sample: "Min store interesse i stillingen — not mit interesse.",
      risk: "Wrong mit on en-words like interesse reads unprofessional in formal email."
    },
    {
      id: "irregular-plural",
      label: "Irregular plural trap",
      sample: "To dage med møder — not mødes.",
      risk: "Irregular plurals break credibility when the hiring manager forwards your mail."
    },
    {
      id: "strong-verb",
      label: "Strong verb past trap",
      sample: "Jeg skrev til jer — not jeg skrive.",
      risk: "Strong verb past forms signal written fluency in professional Danish."
    }
  ],
  repairLadder: [
    { stage: "email miss", text: "Mit store interesse i stillingen gør, at jeg følger op på vores dialog." },
    { stage: "scene repair", text: "Min store interesse i stillingen gør, at jeg følger op på vores dialog." },
    { stage: "bojning drill ready", text: "Min interesse / mit projekt — common-gender en-ord forms drilled in bojning category." }
  ]
};

const doctorSkriveTransferSpec = {
  id: "doctor-apotek-skrive-sundhed",
  lessonId: "lesson-a2-doctor",
  dataPath: "lessons/lesson-a2-doctor/data.js",
  missSceneId: "symptom-severity",
  missOptionId: "too-vague",
  signal: "symptom-severity",
  alternateSignals: ["symptom-duration"],
  intent: "Transfer symptom precision from apotek speech to patientportal writing without losing duration, severity, or next-step clarity.",
  archetypes: ["same-intent-different-channel", "repair-ladder", "memory-backed-recurrence"],
  memoryCue: {
    signal: "symptom-severity",
    copy: "Memory-backed recurrence: vague severity at apotek (ikke så godt) must become testable lidt/ret detail in patientportalen."
  },
  channelVersions: [
    {
      id: "apotek-spoken",
      label: "Apotek counter (spoken)",
      sample: "Ret ondt i halsen, især om morgenen.",
      risk: "Vague spoken severity hides testable detail the pharmacist needs."
    },
    {
      id: "patientportal-written",
      label: "Patientportal (written)",
      sample: "Jeg har hoste i to dage med ret ondt i halsen. Hvad skal jeg gøre nu?",
      risk: "Written Danish needs explicit timeline and severity — paper words blur together."
    }
  ],
  repairLadder: [
    { stage: "apotek miss", text: "Ikke så godt, tror jeg." },
    { stage: "scene repair", text: "Ret ondt i halsen, især om morgenen." },
    { stage: "patientportal ready", text: "Jeg har hoste i to dage med ret ondt i halsen. Hvad skal jeg gøre nu?" }
  ]
};

function check(key, label, pass, issue) {
  return { key, label, pass: !!pass, issue: pass ? "" : issue };
}

function summarizeOption(option) {
  return {
    id: option.id || "",
    channel: option.channel || "",
    correct: option.correct === true,
    nearMiss: option.nearMiss === true,
    grammarStatus: option.grammarStatus || "",
    pragmaticStatus: option.pragmaticStatus || "",
    diagnostic: option.diagnostic || "",
    hasConsequence: nonEmpty(option.consequence),
    repairSteps: asArray(option.repairLadder).length,
    reasonOptions: asArray(option.reasonOptions).length
  };
}

function flagshipSceneRow(lesson, dataPath, scene) {
  const archetypes = asArray(scene.archetypes);
  const options = asArray(scene.options);
  const correctOptions = options.filter(option => option.correct === true);
  const nearMisses = options.filter(option => option.nearMiss === true && option.correct === false && option.grammarStatus === "grammatical");
  const checks = [
    check(
      "not-flat-quiz",
      "Uses a dedicated flagship-chain archetype with context",
      scene.type === "flagship-chain" && nonEmpty(scene.intent) && asArray(scene.channelVersions).length >= 3,
      "scene can collapse back into a flat quiz without intent and channel context"
    ),
    check(
      "all-archetypes-present",
      "Declares every flagship exercise archetype",
      requiredArchetypes.every(archetype => archetypes.includes(archetype)),
      "missing one or more flagship archetype declarations"
    ),
    check(
      "consequence-feedback",
      "Every option explains social consequence",
      options.length >= 3 && options.every(option => nonEmpty(option.consequence)),
      "one or more options do not explain consequence"
    ),
    check(
      "grammatical-near-miss",
      "Contains a grammatical but pragmatically bad near miss",
      nearMisses.length >= 1,
      "no incorrect grammatical near-miss option"
    ),
    check(
      "repair-ladder",
      "Every option carries a raw -> safer -> ready repair ladder",
      options.length >= 3 && options.every(option => asArray(option.repairLadder).length >= 3),
      "one or more options do not carry a three-step repair ladder"
    ),
    check(
      "same-intent-channel-transfer",
      "Shows the same intent across channels",
      asArray(scene.channelVersions).length >= 3,
      "fewer than three channel versions"
    ),
    check(
      "memory-backed-recurrence",
      "Names the recurring learner signal",
      scene.memoryCue && nonEmpty(scene.memoryCue.signal) && nonEmpty(scene.memoryCue.copy),
      "missing memory-backed recurrence cue"
    ),
    check(
      "explain-your-choice",
      "A correct answer requires reason evidence",
      correctOptions.some(option => asArray(option.reasonOptions).filter(reason => reason.correct === true).length === 1),
      "correct option does not require a reason choice"
    ),
    check(
      "diagnostic-signals",
      "Every option writes a diagnostic key",
      options.length >= 3 && options.every(option => nonEmpty(option.diagnostic)),
      "one or more options lack diagnostic keys"
    ),
    check(
      "mastery-linked",
      "Scene writes durable mastery tags",
      asArray(scene.masteryTags).length >= 1,
      "scene lacks mastery tags"
    )
  ];

  return {
    lessonId: lesson.id,
    lessonTitle: lesson.title || lesson.id,
    dataPath,
    sceneId: scene.id,
    title: scene.title || scene.id,
    learningGoal: scene.learningGoal || "",
    userValue: "Shows why plateau practice must handle context, social consequence, repair, and evidence instead of only correctness.",
    intent: scene.intent || "",
    memoryCue: scene.memoryCue || null,
    archetypes,
    channels: asArray(scene.channelVersions).map(channel => ({
      id: channel.id || "",
      label: channel.label || "",
      sample: channel.sample || "",
      risk: channel.risk || ""
    })),
    options: options.map(summarizeOption),
    checks,
    status: checks.every(item => item.pass) ? "pass" : "fail",
    issues: checks.filter(item => !item.pass).map(item => item.issue)
  };
}

function lessonHref(lessonId, suffix) {
  return `./lessons/${lessonId}/${suffix || ""}`;
}

function repoRelativeHref(href) {
  const raw = String(href || "");
  if (!raw) return "";
  if (raw.startsWith("./") || raw.startsWith("http")) return raw;
  return `./${raw}`;
}

function buildDoctorSkriveTransferChain(root, options = {}) {
  const spec = JSON.parse(JSON.stringify(doctorSkriveTransferSpec));
  if (typeof options.transferChainMutator === "function") options.transferChainMutator(spec);
  if (!fileExists(root, spec.dataPath)) return null;
  const lesson = loadLesson(root, spec.dataPath);
  const { bridge, catalog } = loadRepairRuntime(root);
  const scene = lesson && asArray(lesson.scenes).find(item => item.id === spec.missSceneId);
  const missOption = scene && asArray(scene.options).find(item => item.id === spec.missOptionId);
  const resolvedSignal = lesson && scene && missOption ? bridge.resolveMissSignal(lesson, scene, missOption) : "";
  const bundle = lesson && resolvedSignal ? bridge.remediationBundle(lesson, scene, resolvedSignal, "") : null;
  const sceneRepairHref = bundle && bundle.sceneRepair && bundle.sceneRepair.href
    ? lessonHref(spec.lessonId, bundle.sceneRepair.href)
    : "";
  const drillRepairHref = bundle && bundle.drillRepair && bundle.drillRepair.href
    ? repoRelativeHref(bundle.drillRepair.href)
    : "";
  const drillAction = bundle && bundle.drillRepair ? bundle.drillRepair.action || "" : "";
  const alternateMisses = asArray(spec.alternateSignals).map(signal => {
    const altScene = signal === "symptom-duration"
      ? asArray(lesson && lesson.scenes).find(item => item.id === "symptom-duration")
      : scene;
    const altBundle = lesson && signal ? bridge.remediationBundle(lesson, altScene, signal, "") : null;
    return {
      signal,
      sceneId: altScene && altScene.id || "",
      sceneRepairHref: altBundle && altBundle.sceneRepair && altBundle.sceneRepair.href
        ? lessonHref(spec.lessonId, altBundle.sceneRepair.href)
        : "",
      drillRepairHref: altBundle && altBundle.drillRepair && altBundle.drillRepair.href
        ? repoRelativeHref(altBundle.drillRepair.href)
        : ""
    };
  });
  const checks = [
    check(
      "lesson-present",
      "Doctor gold lesson data resolves",
      Boolean(lesson && lesson.id === spec.lessonId),
      "lesson-a2-doctor data is missing"
    ),
    check(
      "miss-scene-present",
      "Miss scene exists in lesson data",
      Boolean(scene && scene.id === spec.missSceneId),
      "symptom-severity scene is missing"
    ),
    check(
      "miss-option-present",
      "Miss option exists in lesson data",
      Boolean(missOption && missOption.id === spec.missOptionId),
      "too-vague miss option is missing"
    ),
    check(
      "signal-resolves",
      "Repair bridge resolves symptom-severity from the miss",
      resolvedSignal === spec.signal,
      "miss does not resolve to symptom-severity"
    ),
    check(
      "scene-repair-linked",
      "Scene repair deep link is wired",
      nonEmpty(sceneRepairHref) && sceneRepairHref.includes("mode=repair") && sceneRepairHref.includes(`signal=${spec.signal}`),
      "scene repair href is missing or incomplete"
    ),
    check(
      "skrive-drill-linked",
      "Skrive sundhed drill deep link is wired",
      nonEmpty(drillRepairHref)
        && drillRepairHref.includes("./skrive-drill/")
        && drillRepairHref.includes("cat=sundhed")
        && drillRepairHref.includes("from=lesson-a2-doctor"),
      "skrive sundhed drill href is missing or incomplete"
    ),
    check(
      "spoken-to-written-copy",
      "Drill action explains apotek to patientportal transfer",
      /apotek|patientportal/i.test(drillAction),
      "drill action does not explain spoken-to-written transfer"
    ),
    check(
      "same-intent-channel-transfer",
      "Documents spoken apotek and written patientportal channels",
      asArray(spec.channelVersions).length >= 2,
      "fewer than two channel versions for doctor transfer"
    ),
    check(
      "repair-ladder",
      "Carries apotek miss -> scene repair -> patientportal ladder",
      asArray(spec.repairLadder).length >= 3,
      "doctor transfer repair ladder is incomplete"
    ),
    check(
      "memory-backed-recurrence",
      "Names the recurring symptom-severity signal",
      spec.memoryCue && nonEmpty(spec.memoryCue.signal) && nonEmpty(spec.memoryCue.copy),
      "doctor transfer memory cue is missing"
    ),
    check(
      "alternate-signal-mapped",
      "symptom-duration also maps to skrive sundhed",
      alternateMisses.some(item => item.signal === "symptom-duration" && item.drillRepairHref.includes("cat=sundhed")),
      "symptom-duration does not map to skrive sundhed"
    )
  ];

  return {
    id: spec.id,
    kind: "transfer-chain",
    lessonId: spec.lessonId,
    lessonTitle: lesson && (lesson.title || lesson.id) || spec.lessonId,
    dataPath: spec.dataPath,
    missSceneId: spec.missSceneId,
    missOptionId: spec.missOptionId,
    signal: spec.signal,
    title: "Apotek miss → scene repair → skrive sundhed",
    learningGoal: "Transfer the same symptom intent from spoken apotek to written patientportal without losing duration or severity precision.",
    userValue: "Shows why plateau health practice must cross channels: a vague apotek answer becomes a written patientportal message with testable timeline and severity.",
    intent: spec.intent,
    memoryCue: spec.memoryCue,
    archetypes: asArray(spec.archetypes),
    channels: asArray(spec.channelVersions).map(channel => ({
      id: channel.id || "",
      label: channel.label || "",
      sample: channel.sample || "",
      risk: channel.risk || ""
    })),
    repairLadder: asArray(spec.repairLadder),
    sceneRepairHref,
    drillRepairHref,
    drillAction,
    alternateMisses,
    checks,
    status: checks.every(item => item.pass) ? "pass" : "fail",
    issues: checks.filter(item => !item.pass).map(item => item.issue)
  };
}

function buildJobFollowupBojningGenderTrapChain(root, options = {}) {
  const spec = JSON.parse(JSON.stringify(jobFollowupBojningGenderTrapSpec));
  if (typeof options.transferChainMutator === "function") options.transferChainMutator(spec);
  if (!fileExists(root, spec.dataPath)) return null;
  const lesson = loadLesson(root, spec.dataPath);
  const scene = lesson && asArray(lesson.scenes).find(item => item.id === spec.missSceneId);
  const missOption = scene && asArray(scene.options).find(item => item.id === spec.missOptionId);
  if (!missOption) return null;
  const closingScene = lesson && asArray(lesson.scenes).find(item => item.id === "email-closing");
  const pluralTrapOption = closingScene && asArray(closingScene.options).find(item => item.id === "plural-trap");
  const registerScene = lesson && asArray(lesson.scenes).find(item => item.id === spec.missSceneId);
  const verbTrapOption = registerScene && asArray(registerScene.options).find(item => item.id === "verb-trap");
  const { bridge, catalog } = loadRepairRuntime(root);
  const resolvedSignal = bridge.resolveMissSignal(lesson, scene, missOption);
  const bundle = lesson && spec.signal ? bridge.remediationBundle(lesson, scene, spec.signal, "") : null;
  const genderRemediation = catalog.drillRemediation(spec.signal, spec.lessonId);
  const sceneRepairHref = bundle && bundle.sceneRepair && bundle.sceneRepair.href
    ? lessonHref(spec.lessonId, bundle.sceneRepair.href)
    : "";
  const drillRepairHref = genderRemediation && genderRemediation.href
    ? repoRelativeHref(genderRemediation.href)
    : "";
  const drillAction = genderRemediation ? genderRemediation.action || "" : "";
  const alternateMisses = asArray(spec.alternateSignals).map(signal => {
    const altRemediation = catalog.drillRemediation(signal, spec.lessonId);
    return {
      signal,
      drillRepairHref: altRemediation && altRemediation.href
        ? repoRelativeHref(altRemediation.href)
        : ""
    };
  });
  const weakTags = asArray(missOption.weakTags);
  const checks = [
    check(
      "lesson-present",
      "Job follow-up gold lesson data resolves",
      Boolean(lesson && lesson.id === spec.lessonId),
      "lesson-b2-job-followup data is missing"
    ),
    check(
      "miss-scene-present",
      "Miss scene exists in lesson data",
      Boolean(scene && scene.id === spec.missSceneId),
      "email-register scene is missing"
    ),
    check(
      "miss-option-present",
      "Gender-trap miss option exists in lesson data",
      Boolean(missOption && missOption.id === spec.missOptionId),
      "gender-trap miss option is missing"
    ),
    check(
      "near-miss-tagged",
      "Gender-trap option tags common-gender-noun weak mastery",
      weakTags.includes(spec.signal),
      "gender-trap option does not tag common-gender-noun"
    ),
    check(
      "scene-repair-linked",
      "Scene repair deep link is wired for common-gender-noun",
      nonEmpty(sceneRepairHref) && sceneRepairHref.includes("mode=repair") && sceneRepairHref.includes(`signal=${spec.signal}`),
      "scene repair href is missing or incomplete"
    ),
    check(
      "bojning-drill-linked",
      "Bojning common-gender drill deep link is wired via catalog",
      nonEmpty(drillRepairHref)
        && drillRepairHref.includes("./bojning-drill/")
        && drillRepairHref.includes("cat=common-gender")
        && drillRepairHref.includes(`signal=${spec.signal}`)
        && drillRepairHref.includes(`from=${spec.lessonId}`),
      "bojning common-gender drill href is missing or incomplete"
    ),
    check(
      "catalog-authoritative",
      "Catalog drill href differs from resolveMissSignal when scene tag would win",
      resolvedSignal !== spec.signal ? nonEmpty(drillRepairHref) : true,
      "catalog drill href should be used when resolveMissSignal returns a scene tag"
    ),
    check(
      "bojning-drill-action",
      "Drill action explains email miss to bojning transfer",
      /interesse|bojning|common-gender|en-ord/i.test(drillAction),
      "drill action does not explain email miss to bojning transfer"
    ),
    check(
      "repair-ladder",
      "Carries email miss -> scene repair -> bojning drill ladder",
      asArray(spec.repairLadder).length >= 3,
      "bojning trap repair ladder is incomplete"
    ),
    check(
      "memory-backed-recurrence",
      "Names the recurring common-gender-noun signal",
      spec.memoryCue && nonEmpty(spec.memoryCue.signal) && nonEmpty(spec.memoryCue.copy),
      "bojning trap memory cue is missing"
    ),
    check(
      "alternate-signal-mapped",
      "irregular-plural-noun and strong-verb-past map to bojning trap categories",
      alternateMisses.some(item => item.signal === "irregular-plural-noun" && item.drillRepairHref.includes("cat=irregular-plural"))
        && alternateMisses.some(item => item.signal === "strong-verb-past" && item.drillRepairHref.includes("cat=strong-verb")),
      "alternate bojning trap signals do not map to trap categories"
    ),
    check(
      "plural-trap-option",
      "Irregular-plural trap option exists in email-closing",
      Boolean(pluralTrapOption && asArray(pluralTrapOption.weakTags).includes("irregular-plural-noun")),
      "plural-trap option missing or does not tag irregular-plural-noun"
    ),
    check(
      "verb-trap-option",
      "Strong-verb-past trap option exists in email-register",
      Boolean(verbTrapOption && asArray(verbTrapOption.weakTags).includes("strong-verb-past")),
      "verb-trap option missing or does not tag strong-verb-past"
    )
  ];

  return {
    id: spec.id,
    kind: "repair-chain",
    lessonId: spec.lessonId,
    lessonTitle: lesson && (lesson.title || lesson.id) || spec.lessonId,
    dataPath: spec.dataPath,
    missSceneId: spec.missSceneId,
    missOptionId: spec.missOptionId,
    signal: spec.signal,
    resolvedMissSignal: resolvedSignal,
    title: "Email gender miss → scene repair → bojning common-gender",
    learningGoal: "Repair common-gender noun agreement in professional follow-up email with scene rerun and targeted bojning drill.",
    userValue: "Shows why plateau B2 practice must catch en-ord traps in formal email: mit interesse becomes min interesse with scene repair and bojning category drill.",
    intent: spec.intent,
    memoryCue: spec.memoryCue,
    archetypes: asArray(spec.archetypes),
    channels: asArray(spec.trapCategories).map(category => ({
      id: category.id || "",
      label: category.label || "",
      sample: category.sample || "",
      risk: category.risk || ""
    })),
    repairLadder: asArray(spec.repairLadder),
    sceneRepairHref,
    drillRepairHref,
    drillAction,
    alternateMisses,
    checks,
    status: checks.every(item => item.pass) ? "pass" : "fail",
    issues: checks.filter(item => !item.pass).map(item => item.issue)
  };
}

function buildTransferChains(root, options = {}) {
  return [
    buildDoctorSkriveTransferChain(root, options),
    buildJobFollowupBojningGenderTrapChain(root, options)
  ].filter(Boolean);
}

function optionalTransferChainRequired(root, spec) {
  return fileExists(root, spec.dataPath);
}

function optionalBojningTrapChainRequired(root, spec) {
  if (!fileExists(root, spec.dataPath)) return false;
  const lesson = loadLesson(root, spec.dataPath);
  const scene = lesson && asArray(lesson.scenes).find(item => item.id === spec.missSceneId);
  const missOption = scene && asArray(scene.options).find(item => item.id === spec.missOptionId);
  return Boolean(missOption);
}

function buildExerciseValueReport(options = {}) {
  const root = sourceRoot(options);
  const issues = [];
  const lessons = [];
  const files = findLessonDataFiles(root);
  files.forEach(dataPath => {
    const lesson = loadLesson(root, dataPath);
    if (!lesson || !Array.isArray(lesson.scenes)) return;
    const cloned = JSON.parse(JSON.stringify(lesson));
    if (typeof options.lessonMutator === "function") options.lessonMutator(cloned, dataPath);
    const flagshipChains = asArray(cloned.scenes)
      .filter(scene => scene.type === "flagship-chain")
      .map(scene => flagshipSceneRow(cloned, dataPath, scene));
    if (flagshipChains.length) {
      lessons.push({
        id: cloned.id,
        title: cloned.title || cloned.id,
        dataPath,
        flagshipChains
      });
    }
  });

  const chains = lessons.flatMap(lesson => lesson.flagshipChains);
  const transferChains = buildTransferChains(root, options);
  const doctorTransferRequired = optionalTransferChainRequired(root, doctorSkriveTransferSpec);
  const bojningTrapRequired = optionalBojningTrapChainRequired(root, jobFollowupBojningGenderTrapSpec);
  chains.forEach(row => {
    row.issues.forEach(issue => issues.push(`${row.lessonId}::${row.sceneId}: ${issue}`));
  });
  transferChains.forEach(row => {
    row.issues.forEach(issue => issues.push(`${row.id}: ${issue}`));
  });
  if (chains.length === 0) issues.push("no flagship-chain exercises found");
  if (doctorTransferRequired && !transferChains.some(row => row.id === "doctor-apotek-skrive-sundhed")) {
    issues.push("doctor transfer chain missing");
  }
  if (bojningTrapRequired && !transferChains.some(row => row.id === "job-followup-bojning-gender-trap")) {
    issues.push("bojning trap repair chain missing");
  }

  const archetypeSources = [
    ...chains.map(row => ({ id: `${row.lessonId}::${row.sceneId}`, archetypes: row.archetypes })),
    ...transferChains.map(row => ({ id: row.id, archetypes: row.archetypes }))
  ];
  const archetypeCoverage = requiredArchetypes.map(archetype => ({
    id: archetype,
    scenes: archetypeSources.filter(row => row.archetypes.includes(archetype)).map(row => row.id),
    pass: archetypeSources.some(row => row.archetypes.includes(archetype))
  }));
  archetypeCoverage.filter(row => !row.pass).forEach(row => issues.push(`archetype ${row.id}: no scene coverage`));

  const guarantees = [
    {
      key: "flagship-chain-present",
      label: "At least one lesson demonstrates a radical exercise chain",
      pass: chains.length >= 1
    },
    {
      key: "all-archetypes-covered",
      label: "The flagship chain covers consequence, near miss, repair ladder, channel transfer, memory recurrence, and explain-your-choice",
      pass: archetypeCoverage.every(row => row.pass)
    },
    {
      key: "not-flat-quiz",
      label: "Flagship chains cannot pass as ordinary context-free quizzes",
      pass: chains.length > 0 && chains.every(row => row.checks.find(item => item.key === "not-flat-quiz").pass)
    },
    {
      key: "near-miss-and-repair-proven",
      label: "Grammatical near misses are paired with repair ladders and consequences",
      pass: chains.length > 0 && chains.every(row => (
        row.checks.find(item => item.key === "grammatical-near-miss").pass
        && row.checks.find(item => item.key === "repair-ladder").pass
        && row.checks.find(item => item.key === "consequence-feedback").pass
      ))
    },
    {
      key: "memory-and-evidence-proven",
      label: "At least one chain names a recurring memory signal and requires reason evidence",
      pass: chains.length > 0 && chains.every(row => (
        row.checks.find(item => item.key === "memory-backed-recurrence").pass
        && row.checks.find(item => item.key === "explain-your-choice").pass
      ))
    },
    {
      key: "doctor-skrive-transfer-proven",
      label: "Doctor apotek misses transfer to skrive sundhed patientportal with scene repair and drill deep links",
      pass: !doctorTransferRequired
        || transferChains.some(row => row.id === "doctor-apotek-skrive-sundhed" && row.status === "pass")
    },
    {
      key: "job-followup-bojning-trap-proven",
      label: "Job follow-up gender trap misses route to bojning common-gender drill with scene repair deep links",
      pass: !bojningTrapRequired
        || transferChains.some(row => row.id === "job-followup-bojning-gender-trap" && row.status === "pass")
    }
  ];
  guarantees.filter(item => !item.pass).forEach(item => issues.push(`guarantee failed: ${item.key}`));

  const totals = {
    lessons: lessons.length,
    flagshipChains: chains.length,
    transferChains: transferChains.length,
    exerciseChains: chains.length + transferChains.length,
    archetypesCovered: archetypeCoverage.filter(row => row.pass).length,
    channelVersions: chains.reduce((sum, row) => sum + row.channels.length, 0)
      + transferChains.reduce((sum, row) => sum + row.channels.length, 0),
    nearMisses: chains.reduce((sum, row) => sum + row.options.filter(option => option.nearMiss).length, 0),
    repairLadders: chains.reduce((sum, row) => sum + row.options.filter(option => option.repairSteps >= 3).length, 0)
      + transferChains.filter(row => row.repairLadder.length >= 3).length,
    explainChoiceScenes: chains.filter(row => row.checks.some(item => item.key === "explain-your-choice" && item.pass)).length,
    issues: issues.length
  };

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: issues.length ? "fail" : "pass",
    headline: issues.length ? "Exercise value proof needs attention" : "Flagship exercises prove value beyond ordinary quiz correctness.",
    requiredArchetypes,
    totals,
    guarantees,
    archetypeCoverage,
    lessons,
    transferChains,
    issues
  };
}

function formatExerciseValueReport(report) {
  const lines = [
    "Exercise Value Report",
    `status: ${report.status}`,
    `flagship chains: ${report.totals.flagshipChains}`,
    `transfer chains: ${report.totals.transferChains}`,
    `exercise chains: ${report.totals.exerciseChains}`,
    `archetypes covered: ${report.totals.archetypesCovered}/${report.requiredArchetypes.length}`,
    `near misses: ${report.totals.nearMisses}`,
    `repair ladders: ${report.totals.repairLadders}`,
    "",
    "Guarantees:"
  ];
  report.guarantees.forEach(item => {
    lines.push(`- ${item.pass ? "pass" : "fail"} ${item.key}: ${item.label}`);
  });
  lines.push("", "Flagship chains:");
  report.lessons.forEach(lesson => {
    lesson.flagshipChains.forEach(chain => lines.push(`- ${chain.status} ${lesson.id}::${chain.sceneId} (${chain.archetypes.length} archetype(s))`));
  });
  lines.push("", "Transfer chains:");
  asArray(report.transferChains).forEach(chain => {
    lines.push(`- ${chain.status} ${chain.id} (${chain.archetypes.join(", ")})`);
  });
  lines.push("", "Issues:");
  if (report.issues.length) report.issues.forEach(issue => lines.push(`- ${issue}`));
  else lines.push("none");
  return lines.join("\n");
}

function writeExerciseValueReport(outPath, options = {}) {
  const root = sourceRoot(options);
  const report = buildExerciseValueReport({ root });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  if (options.text) console.log(formatExerciseValueReport(report));
  if (report.status !== "pass") {
    console.error(`exercise value report failed with ${report.totals.issues} issue(s)`);
    report.issues.forEach(issue => console.error(`- ${issue}`));
    process.exit(1);
  }
  if (!options.text) {
    console.log(`exercise value report built: ${displayRel(outPath, root)} (${report.totals.flagshipChains} flagship, ${report.totals.transferChains} transfer chain(s))`);
  }
  return report;
}

function main() {
  const root = argValue("--root") || repoRoot;
  const out = argValue("--out") || path.join(repoRoot, ".dist", "exercise-value.json");
  const report = buildExerciseValueReport({ root });
  if (hasFlag("--json")) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    if (report.status !== "pass") process.exit(1);
    return;
  }
  writeExerciseValueReport(path.resolve(repoRoot, out), { root, text: hasFlag("--text") });
}

if (require.main === module) main();

module.exports = {
  buildExerciseValueReport,
  formatExerciseValueReport,
  writeExerciseValueReport,
  requiredArchetypes,
  doctorSkriveTransferSpec,
  jobFollowupBojningGenderTrapSpec,
  optionalBojningTrapChainRequired
};

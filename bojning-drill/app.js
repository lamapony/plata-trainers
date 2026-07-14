/* platå · bøjning-drill · app v0.1
 *
 * Leitner spaced repetition
 * - 5 boxes: 1 (new) → 5 (mastered)
 * - Correct: box += 1, nextDueAt += 1/2/4/7/14 days
 * - Wrong: box = 1, re-queue this session, due tomorrow
 * - Daily cap: 10 items per session
 * - Pick: overdue → new → weakest
 * - State persisted to LocalStorage as JSON
 */

(function () {
  "use strict";

  const TRAINER_ID = "bojning";
  const LEGACY_STORAGE_KEY = "plata-bojning-v0";
  const SESSION_SIZE = 10;
  const kernel = window.PlataKernel;
  const dashboard = window.PlataDashboard;

  // ---------- state ----------
  /** @type {{
   *   byItemId: Record<string, {box:number, correct:number, wrong:number, lastSeen:string|null, mastered:boolean}>,
   *   meta: { createdAt: string, lastSessionDate: string, totalCorrect: number, totalAttempts: number, currentStreak: number, longestStreak: number }
   * }} */
  let stateHandle = kernel.createTrainerState({ trainerId: TRAINER_ID, oldKeys: [LEGACY_STORAGE_KEY] });
  let state = stateHandle.state;

  let mode = "verber";        // "verber" | "substantiver"
  let type = "nutid";         // for verber: nutid|datid|førnutid|blandet ; for substantiver: bestemtEntal|flertalUbestemt|bestemtFlertal|blandet
  let sessionTrap = "";       // "", "common-gender", "irregular-plural", "strong-verb"
  let session = [];           // queue of {item, prompt, expected, aliases}
  let sessionPos = 0;         // 0..SESSION_SIZE-1
  let sessionResults = [];    // {item, expected, given, correct}
  let awaitingInput = true;

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const els = {
    stats: $("stats"),
    statToday: $("stat-today"),
    statCorrect: $("stat-correct"),
    statAccuracy: $("stat-accuracy"),
    statStreak: $("stat-streak"),
    statMastered: $("stat-mastered"),
    modeGroup: $("mode-group"),
    typeRowVerber: $("type-row-verber"),
    typeRowSubstantiver: $("type-row-substantiver"),
    typeGroupVerber: $("type-group-verber"),
    typeGroupSubstantiver: $("type-group-substantiver"),
    drillCard: $("drill-card"),
    promptCounter: $("prompt-counter"),
    promptBox: $("prompt-box"),
    promptText: $("prompt-text"),
    promptHint: $("prompt-hint"),
    answerForm: $("answer-form"),
    answerInput: $("answer-input"),
    submitBtn: $("submit-btn"),
    feedback: $("feedback"),
    summaryCard: $("summary-card"),
    sumCorrect: $("sum-correct"),
    sumTotal: $("sum-total"),
    sumAccuracy: $("sum-accuracy"),
    sumMistakes: $("sum-mistakes"),
    nextStep: $("next-step"),
    againBtn: $("again-btn"),
    changeModeBtn: $("change-mode-btn"),
    exportBtn: $("export-btn"),
    importBtn: $("import-btn"),
    importFile: $("import-file"),
    resetBtn: $("reset-btn")
  };
  els.m0Gate = $("m0-gate");

  // ---------- persistence ----------
  function freshState() {
    return kernel.freshState(TRAINER_ID);
  }
  function saveState() {
    kernel.saveState(state);
  }
  function ensureItemRecord(itemId, tags) {
    return kernel.ensureItemRecord(state, itemId, tags);
  }
  function itemIdFor(item, mode) {
    if (mode === "verber") return "v::" + item.infinitive;
    return "s::" + item.ubestemtEntal;
  }

  // ---------- session building ----------
  function buildSession() {
    let pool = window.PLATA_DATA[mode];
    if (sessionTrap) {
      pool = pool.filter((item) => Array.isArray(item.traps) && item.traps.includes(sessionTrap));
    }
    if (!pool.length) pool = window.PLATA_DATA[mode];
    const candidates = pool.map((item) => ({
      item,
      rec: ensureItemRecord(itemIdFor(item, mode), [mode])
    }));
    const picked = kernel.pickSessionItems(candidates, { size: SESSION_SIZE });

    return picked.map((p) => buildPrompt(p.item, mode, type));
  }

  function buildPrompt(item, mode, type) {
    if (mode === "verber") {
      const actualType = type === "blandet"
        ? ["nutid", "datid", "førnutid"][Math.floor(Math.random() * 3)]
        : type;
    const expected = item[actualType];
    const aliases = window.PLATA_DATA.aliases[expected] || [expected];
      const prompt = `Bøj verbum:\n${item.infinitive}`;
      const hint = `${actualType} form`;
      return { item, mode, type: actualType, prompt, hint, expected, aliases, itemId: "v::" + item.infinitive };
    }
    // substantiver
    const actualType = type === "blandet"
      ? ["bestemtEntal", "flertalUbestemt", "bestemtFlertal"][Math.floor(Math.random() * 3)]
      : type;
    const labels = {
      bestemtEntal: "bestemt ental (—en / —et)",
      flertalUbestemt: "flertal ubestemt",
      bestemtFlertal: "bestemt flertal (—ene)"
    };
      const expected = item[actualType];
    return {
      item, mode, type: actualType,
      prompt: `Bøj substantiv:\n${item.ubestemtEntal}`,
      hint: labels[actualType],
      expected, aliases: [expected],
      itemId: "s::" + item.ubestemtEntal
    };
  }

  // ---------- normalize & compare ----------
  function normalize(s) {
    return s.trim().toLowerCase()
      .replace(/[.!?]/g, "")
      .replace(/\s+/g, " ");
  }
  function isCorrect(given, expected, aliases) {
    const g = normalize(given);
    if (!g) return false;
    const all = [expected, ...(aliases || [])].map(normalize);
    return all.includes(g);
  }

  // ---------- render ----------
  function renderStats() {
    const view = dashboard.statsView(state);
    els.statToday.textContent = view.today;
    els.statCorrect.textContent = view.totalCorrect;
    els.statAccuracy.textContent = view.accuracy;
    els.statStreak.textContent = view.streak;
    els.statMastered.textContent = view.mastered;
    const gateText = dashboard.m0ProgressText
      ? dashboard.m0ProgressText(state)
      : dashboard.gateText(kernel.computeGate(state, { name: "M0 verbs", tags: ["verber"], mode: "verber", minAttempts: 100, minAccuracy: 0.8 }));
    els.m0Gate.textContent = gateText;
  }

  function renderPrompt() {
    if (sessionPos >= session.length) {
      renderSummary();
      return;
    }
    const p = session[sessionPos];
    const rec = state.byItemId[p.itemId] || { box: 1 };
    els.promptCounter.textContent = `${sessionPos + 1} / ${session.length}`;
    els.promptBox.textContent = `trin ${rec.box}${rec.mastered ? " · lært" : ""}`;
    els.promptText.textContent = p.prompt;
    els.promptHint.textContent = p.hint;
    els.answerInput.value = "";
    els.answerInput.classList.remove("correct", "wrong");
    els.answerInput.disabled = false;
    els.answerInput.readOnly = false;
    els.answerInput.focus();
    els.feedback.classList.add("hidden");
    els.feedback.textContent = "";
    els.feedback.className = "feedback hidden";
    els.submitBtn.disabled = false;
    els.submitBtn.textContent = "Tjek svar";
    awaitingInput = true;
  }

  function renderSummary() {
    els.drillCard.classList.add("hidden");
    els.summaryCard.classList.remove("hidden");
    const total = sessionResults.length;
    const correct = sessionResults.filter((r) => r.correct).length;
    const acc = total > 0 ? Math.round((correct / total) * 100) + "%" : "—";
    els.sumCorrect.textContent = correct;
    els.sumTotal.textContent = total;
    els.sumAccuracy.textContent = acc;
    const mistakes = sessionResults.filter((r) => !r.correct);
    els.sumMistakes.innerHTML = "";
    if (mistakes.length === 0) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "ingen fejl — flot";
      els.sumMistakes.appendChild(li);
    } else {
      for (const m of mistakes) {
        const li = document.createElement("li");
        const promptKey = m.itemId.startsWith("v::")
          ? m.itemId.slice(3)
          : m.itemId.slice(3);
        li.innerHTML = `<strong>${escapeHtml(promptKey)}</strong> → <span class="given">${escapeHtml(m.given || "(tom)")}</span><span class="right">${escapeHtml(m.expected)}</span>`;
        els.sumMistakes.appendChild(li);
      }
    }
    markPlanStepComplete(total, correct);
    renderPlanContext();
    renderNextStep();
    renderStats();
  }

  function renderNextStep() {
    if (!els.nextStep || !window.PlataNextStep) return;
    const params = new URLSearchParams(window.location.search);
    els.nextStep.innerHTML = window.PlataNextStep.render(window.PlataNextStep.drill({
      trainerId: TRAINER_ID,
      state,
      sessionResults,
      rootPrefix: "../",
      fromLesson: params.get("from") || "",
      signal: params.get("signal") || ""
    }));
    const againLink = els.nextStep.querySelector("a[href='#again-btn']");
    if (againLink) {
      againLink.addEventListener("click", (event) => {
        event.preventDefault();
        startNewSession();
      });
    }
  }

  function renderPlanContext() {
    if (!window.PlataNextStep || !window.PlataNextStep.renderPlanContext) return;
    const html = window.PlataNextStep.renderPlanContext({
      trainerId: TRAINER_ID,
      dashboardHref: "../dashboard.html"
    });
    const existing = document.querySelector(".plan-context-slot");
    if (existing) {
      if (html) existing.innerHTML = html;
      return;
    }
    if (!html) return;
    const slot = document.createElement("div");
    slot.className = "plan-context-slot";
    slot.innerHTML = html;
    els.stats.insertAdjacentElement("afterend", slot);
  }

  function markPlanStepComplete(total, correct) {
    if (!window.PlataPlanner || !window.PlataPlanner.markPracticePlanStepCompleted || total <= 0) return;
    window.PlataPlanner.markPracticePlanStepCompleted({
      trainerId: TRAINER_ID,
      evidence: {
        reason: "drill-session-complete",
        mode,
        trainerId: TRAINER_ID,
        total,
        correct,
        accuracy: Math.round((correct / Math.max(1, total)) * 100)
      }
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // ---------- answer handling ----------
  function handleSubmit(e) {
    e.preventDefault();
    if (!awaitingInput) {
      // user clicked "next" — advance
      sessionPos += 1;
      renderPrompt();
      return;
    }
    const p = session[sessionPos];
    const given = els.answerInput.value;
    const correct = isCorrect(given, p.expected, p.aliases);
    const tags = [p.mode, p.type];
    kernel.recordAttempt(state, { itemId: p.itemId, correct, tags, mode: p.mode, expected: p.expected, given });
    if (correct) {
      els.answerInput.classList.add("correct");
      showFeedback(true, p.expected, null);
    } else {
      els.answerInput.classList.add("wrong");
      showFeedback(false, p.expected, given);
      // re-queue later in this session
      const requeued = { ...p };
      const insertAt = Math.min(session.length, sessionPos + 3 + Math.floor(Math.random() * 3));
      session.splice(insertAt, 0, requeued);
    }
    sessionResults.push({ itemId: p.itemId, expected: p.expected, given, correct });
    awaitingInput = false;
    // keep input enabled (so Enter from input advances) but mark readOnly to prevent edits
    els.answerInput.readOnly = true;
    els.submitBtn.disabled = false;
    els.submitBtn.textContent = "Næste →";
    els.answerInput.focus();  // keep focus on input so Enter keeps working
    saveState();
    renderStats();
  }

  function showFeedback(ok, expected, given) {
    els.feedback.classList.remove("hidden", "good", "bad");
    els.feedback.classList.add(ok ? "good" : "bad");
    if (ok) {
      els.feedback.innerHTML = `✓ korrekt — <span class="correct-answer">${escapeHtml(expected)}</span><div class="next-hint">tryk Enter eller klik "Næste →"</div>`;
    } else {
      els.feedback.innerHTML = `✗ ikke helt — <span class="correct-answer">${escapeHtml(expected)}</span>${given ? ` (du skrev <span class="correct-answer">${escapeHtml(given)}</span>)` : ""}<div class="next-hint">korrekt svar gemt, gentages senere — tryk Enter eller klik "Næste →"</div>`;
    }
  }

  // ---------- mode / type switching ----------
  const TRAP_PRESETS = {
    "common-gender": { mode: "substantiver", type: "bestemtEntal", trap: "common-gender" },
    "irregular-plural": { mode: "substantiver", type: "blandet", trap: "irregular-plural" },
    "strong-verb": { mode: "verber", type: "datid", trap: "strong-verb" }
  };
  const SIGNAL_TRAP = {
    "common-gender-noun": "common-gender",
    "irregular-plural-noun": "irregular-plural",
    "strong-verb-past": "strong-verb"
  };

  function applyCategoryFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get("cat");
    if (catParam && TRAP_PRESETS[catParam]) {
      const preset = TRAP_PRESETS[catParam];
      mode = preset.mode;
      type = preset.type;
      sessionTrap = preset.trap;
      return;
    }
    const signal = params.get("signal");
    if (signal && SIGNAL_TRAP[signal]) {
      const preset = TRAP_PRESETS[SIGNAL_TRAP[signal]];
      mode = preset.mode;
      type = preset.type;
      sessionTrap = preset.trap;
    }
  }

  const JOB_REPAIR_COPY = {
    "common-gender-noun": "Du missede køn på et substantiv i opfølgningsmailen. Øv min/mit på en-ord som interesse — ikke mit interesse.",
    "irregular-plural-noun": "Du missede et uregelmæssigt flertal i job-konteksten. Øv substantiv-bøjning på de ord, der ikke følger -er-reglen.",
    "strong-verb-past": "Du missede en stærk datidsform i job-konteksten. Øv uregelmæssige verber i datid, før du sender professionel dansk."
  };

  function renderRepairContextBanner() {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from") || "";
    const signal = params.get("signal") || "";
    if (from !== "lesson-b2-job-followup") return;
    const copy = JOB_REPAIR_COPY[signal] || "Du missede en form-fælde i job-opfølgningsmailen. Øv substantiv- og verbum-bøjning, før du sender professionel dansk.";
    const existing = document.querySelector(".repair-context-slot");
    const html = [
      "<aside class='repair-context-card' aria-label='Repair context from job follow-up lesson'>",
      "<p class='eyebrow'>Match → Gym · email → bøjning</p>",
      "<h3>Samme kompetence, form-drill</h3>",
      "<p>" + escapeHtml(copy) + "</p>",
      "<div class='repair-context-meta'>",
      "<span>narrative miss</span>",
      "<span>form repair</span>",
      signal ? "<span>" + escapeHtml(signal) + "</span>" : "",
      "</div>",
      "</aside>"
    ].join("");
    if (existing) {
      existing.innerHTML = html;
      return;
    }
    const slot = document.createElement("div");
    slot.className = "repair-context-slot";
    slot.innerHTML = html;
    els.stats.insertAdjacentElement("afterend", slot);
  }

  function syncModeChips() {
    [...els.modeGroup.querySelectorAll(".chip")].forEach((c) => {
      c.setAttribute("aria-selected", c.dataset.mode === mode ? "true" : "false");
    });
    els.typeRowVerber.classList.toggle("hidden", mode !== "verber");
    els.typeRowSubstantiver.classList.toggle("hidden", mode !== "substantiver");
    const group = mode === "verber" ? els.typeGroupVerber : els.typeGroupSubstantiver;
    [...group.querySelectorAll(".chip")].forEach((c) => {
      c.setAttribute("aria-selected", c.dataset.type === type ? "true" : "false");
    });
  }

  function setMode(newMode) {
    mode = newMode;
    sessionTrap = "";
    [...els.modeGroup.querySelectorAll(".chip")].forEach((c) => {
      c.setAttribute("aria-selected", c.dataset.mode === mode ? "true" : "false");
    });
    if (mode === "verber") {
      els.typeRowVerber.classList.remove("hidden");
      els.typeRowSubstantiver.classList.add("hidden");
      type = "nutid";
    } else {
      els.typeRowVerber.classList.add("hidden");
      els.typeRowSubstantiver.classList.remove("hidden");
      type = "bestemtEntal";
    }
    syncModeChips();
    startNewSession();
  }
  function setType(newType) {
    type = newType;
    sessionTrap = "";
    syncModeChips();
    startNewSession();
  }

  function startNewSession() {
    session = buildSession();
    sessionPos = 0;
    sessionResults = [];
    if (els.nextStep) els.nextStep.innerHTML = "";
    els.summaryCard.classList.add("hidden");
    els.drillCard.classList.remove("hidden");
    state.meta.lastSessionDate = new Date().toISOString().slice(0, 10);
    saveState();
    renderPrompt();
    renderStats();
  }

  // ---------- export / import / reset ----------
  function doExport() {
    const blob = new Blob([kernel.exportState(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plata-bojning-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
  }
  function doImport(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = kernel.importState(String(reader.result || ""), TRAINER_ID);
        if (!confirm("Importér — overskriv aktuel progress?")) return;
        state = parsed;
        saveState();
        renderStats();
        startNewSession();
      } catch (e) {
        alert("Kunne ikke læse filen: " + e.message);
      }
    };
    reader.readAsText(file);
  }
  function doReset() {
    if (!confirm("Nulstil al progress? Kan ikke fortrydes.")) return;
    state = freshState();
    saveState();
    renderStats();
    startNewSession();
  }

  // ---------- init ----------
  function init() {
    // mode/type chips
    els.modeGroup.addEventListener("click", (e) => {
      const c = e.target.closest(".chip");
      if (c) setMode(c.dataset.mode);
    });
    els.typeGroupVerber.addEventListener("click", (e) => {
      const c = e.target.closest(".chip");
      if (c) setType(c.dataset.type);
    });
    els.typeGroupSubstantiver.addEventListener("click", (e) => {
      const c = e.target.closest(".chip");
      if (c) setType(c.dataset.type);
    });

    els.answerForm.addEventListener("submit", handleSubmit);
    els.againBtn.addEventListener("click", startNewSession);
    els.changeModeBtn.addEventListener("click", () => {
      els.summaryCard.classList.add("hidden");
      // leave pickers visible; user clicks a mode chip
    });
    els.exportBtn.addEventListener("click", doExport);
    els.importBtn.addEventListener("click", () => els.importFile.click());
    els.importFile.addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) doImport(f);
      e.target.value = "";
    });
    els.resetBtn.addEventListener("click", doReset);

    applyCategoryFromUrl();
    syncModeChips();
    renderRepairContextBanner();

    // ensure every item has a record (so box stats are correct)
    for (const item of window.PLATA_DATA.verber) ensureItemRecord(itemIdFor(item, "verber"), ["verber"]);
    for (const item of window.PLATA_DATA.substantiver) ensureItemRecord(itemIdFor(item, "substantiver"), ["substantiver"]);
    saveState();

    renderStats();
    renderPlanContext();
    startNewSession();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

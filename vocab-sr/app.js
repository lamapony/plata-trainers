/* platå · vocab-SR · app v0.1
 *
 * Spaced-repetition vocabulary drill. DA ↔ RU.
 * Leitner spaced repetition (same shape as bojning + ordstilling).
 */

(function () {
  "use strict";

  const TRAINER_ID = "vocab";
  const LEGACY_STORAGE_KEY = "plata-vocab-v0";
  const SESSION_SIZE = 10;
  const kernel = window.PlataKernel;
  const dashboard = window.PlataDashboard;

  let stateHandle = kernel.createTrainerState({ trainerId: TRAINER_ID, oldKeys: [LEGACY_STORAGE_KEY] });
  let state = stateHandle.state;
  let direction = "da2ru";
  let session = [];
  let sessionPos = 0;
  let sessionResults = [];
  let awaitingInput = true;

  const $ = (id) => document.getElementById(id);
  const els = {
    statToday: $("stat-today"),
    statCorrect: $("stat-correct"),
    statAccuracy: $("stat-accuracy"),
    statStreak: $("stat-streak"),
    statMastered: $("stat-mastered"),
    dirGroup: $("dir-group"),
    drillCard: $("drill-card"),
    promptCounter: $("prompt-counter"),
    promptBox: $("prompt-box"),
    promptDir: $("prompt-dir"),
    promptText: $("prompt-text"),
    promptContext: $("prompt-context"),
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
    changeDirBtn: $("change-dir-btn"),
    exportBtn: $("export-btn"),
    importBtn: $("import-btn"),
    importFile: $("import-file"),
    resetBtn: $("reset-btn")
  };

  function freshState() {
    return kernel.freshState(TRAINER_ID);
  }
  function saveState() { kernel.saveState(state); }
  function ensureItemRecord(id, tags) {
    return kernel.ensureItemRecord(state, id, tags);
  }
  function itemIdFor(item, dir) { return `v::${item.da}::${dir}`; }
  function normalizeDa(value) { return String(value || "").trim().toLowerCase(); }

  function lessonFocusFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return {
      from: params.get("from") || "",
      scene: params.get("scene") || ""
    };
  }

  function focusedVocabPool(fromLesson, sceneId) {
    const catalog = window.PlataCatalog;
    const focus = catalog && catalog.vocabFocusForScene
      ? catalog.vocabFocusForScene(fromLesson, sceneId)
      : null;
    if (!focus || !focus.length) return null;
    const wanted = new Set(focus.map(normalizeDa));
    const matched = window.PLATA_DATA.vocab.filter((item) => wanted.has(normalizeDa(item.da)));
    return matched.length ? matched : null;
  }

  function buildSession() {
    const focusCtx = lessonFocusFromUrl();
    const focused = focusedVocabPool(focusCtx.from, focusCtx.scene);
    const pool = window.PLATA_DATA.vocab;
    const pickDirection = direction === "blandet" ? "da2ru" : direction;
    let candidates = focused && focused.length ? focused.slice() : pool.slice();
    if (focused && focused.length && candidates.length < SESSION_SIZE) {
      const seen = new Set(candidates.map((item) => normalizeDa(item.da)));
      pool.forEach((item) => {
        if (candidates.length >= SESSION_SIZE) return;
        if (seen.has(normalizeDa(item.da))) return;
        candidates.push(item);
        seen.add(normalizeDa(item.da));
      });
    }
    const enriched = candidates.map((it) => ({ item: it, rec: ensureItemRecord(itemIdFor(it, pickDirection), ["vocab", pickDirection]) }));
    const picked = kernel.pickSessionItems(enriched, { size: SESSION_SIZE });
    return picked.map((p) => p.item);
  }

  function buildPrompt(item) {
    let actualDir = direction;
    if (direction === "blandet") actualDir = Math.random() < 0.5 ? "da2ru" : "ru2da";
    if (actualDir === "da2ru") {
      // Build aliases from comma-separated Russian translations: each part
      // is a valid answer. "жить, проживать" → ["жить, проживать", "жить", "проживать"].
      const ruParts = item.ru.split(/,\s*/).map((s) => s.trim()).filter(Boolean);
      const aliases = [item.ru, ...ruParts, item.en].filter(Boolean);
      return {
        item, dir: actualDir,
        prompt: item.da,
        hint: item.note || `→ ${item.en}`,
        expected: item.ru,
        aliases,
        itemId: itemIdFor(item, actualDir)
      };
    } else {
      return {
        item, dir: actualDir,
        prompt: item.ru,
        hint: `→ ${item.en}`,
        expected: item.da,
        aliases: [item.da, item.da.replace(/^at /, "")],
        itemId: itemIdFor(item, actualDir)
      };
    }
  }

  function normalize(s) { return s.trim().toLowerCase().replace(/[.!?]/g, "").replace(/\s+/g, " "); }
  function isCorrect(given, expected, aliases) {
    const g = normalize(given);
    if (!g) return false;
    const all = [expected, ...(aliases || [])].map(normalize);
    return all.includes(g);
  }

  function renderStats() {
    const view = dashboard.statsView(state);
    els.statToday.textContent = view.today;
    els.statCorrect.textContent = view.totalCorrect;
    els.statAccuracy.textContent = view.accuracy;
    els.statStreak.textContent = view.streak;
    els.statMastered.textContent = view.mastered;
  }

  function renderPrompt() {
    if (sessionPos >= session.length) { renderSummary(); return; }
    const p = session[sessionPos];
    const rec = state.byItemId[p.itemId] || { box: 1 };
    els.promptCounter.textContent = `${sessionPos + 1} / ${session.length}`;
    els.promptBox.textContent = `box ${rec.box}${rec.mastered ? " · mastered" : ""}`;
    els.promptDir.textContent = p.dir === "da2ru" ? "DA → RU" : "RU → DA";
    els.promptText.textContent = p.prompt;
    els.promptContext.textContent = p.hint;
    els.answerInput.value = "";
    els.answerInput.classList.remove("correct", "wrong");
    els.answerInput.disabled = false;
    els.answerInput.readOnly = false;
    els.answerInput.focus();
    els.feedback.classList.add("hidden");
    els.feedback.textContent = "";
    els.feedback.className = "feedback hidden";
    els.submitBtn.disabled = false;
    els.submitBtn.textContent = "Check";
    awaitingInput = true;
  }

  function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!awaitingInput) { sessionPos += 1; renderPrompt(); return; }
    const p = session[sessionPos];
    const given = els.answerInput.value;
    const correct = isCorrect(given, p.expected, p.aliases);
    kernel.recordAttempt(state, { itemId: p.itemId, correct, tags: ["vocab", p.dir], mode: p.dir, expected: p.expected, given });
    if (correct) {
      els.answerInput.classList.add("correct");
      showFeedback(true, p.expected, p.item.example, null);
    } else {
      els.answerInput.classList.add("wrong");
      showFeedback(false, p.expected, p.item.example, given);
      const insertAt = Math.min(session.length, sessionPos + 3 + Math.floor(Math.random() * 3));
      session.splice(insertAt, 0, p);
    }
    sessionResults.push({ itemId: p.itemId, prompt: p.prompt, expected: p.expected, given, correct });
    awaitingInput = false;
    els.answerInput.readOnly = true;
    els.submitBtn.disabled = false;
    els.submitBtn.textContent = "Næste →";
    els.answerInput.focus();
    saveState(); renderStats();
  }

  function showFeedback(ok, expected, example, given) {
    els.feedback.classList.remove("hidden", "good", "bad");
    els.feedback.classList.add(ok ? "good" : "bad");
    let html = ok
      ? `✓ korrekt — <span class="correct-answer">${escapeHtml(expected)}</span>`
      : `✗ ikke helt — <span class="correct-answer">${escapeHtml(expected)}</span>${given ? ` (du skrev <span class="correct-answer">${escapeHtml(given)}</span>)` : ""}`;
    if (example) html += `<div class="alt">eksempel: <em>${escapeHtml(example)}</em></div>`;
    html += `<div class="next-hint">tryk Enter eller klik "Næste →"</div>`;
    els.feedback.innerHTML = html;
  }

  function renderSummary() {
    els.drillCard.classList.add("hidden");
    els.summaryCard.classList.remove("hidden");
    const total = sessionResults.length;
    const correct = sessionResults.filter((r) => r.correct).length;
    const acc = total > 0 ? Math.round((correct / total) * 100) + "%" : "—";
    els.sumCorrect.textContent = correct; els.sumTotal.textContent = total; els.sumAccuracy.textContent = acc;
    const mistakes = sessionResults.filter((r) => !r.correct);
    els.sumMistakes.innerHTML = "";
    if (mistakes.length === 0) {
      const li = document.createElement("li"); li.className = "empty"; li.textContent = "ingen fejl — flot";
      els.sumMistakes.appendChild(li);
    } else {
      for (const m of mistakes) {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${escapeHtml(m.prompt)}</strong> → <span class="given">${escapeHtml(m.given || "(tom)")}</span><span class="right">${escapeHtml(m.expected)}</span>`;
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
    els.nextStep.innerHTML = window.PlataNextStep.render(window.PlataNextStep.drill({
      trainerId: TRAINER_ID,
      state,
      sessionResults,
      rootPrefix: "../"
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
    document.getElementById("stats").insertAdjacentElement("afterend", slot);
  }

  function markPlanStepComplete(total, correct) {
    if (!window.PlataPlanner || !window.PlataPlanner.markPracticePlanStepCompleted || total <= 0) return;
    window.PlataPlanner.markPracticePlanStepCompleted({
      trainerId: TRAINER_ID,
      evidence: {
        reason: "drill-session-complete",
        mode: direction,
        trainerId: TRAINER_ID,
        total,
        correct,
        accuracy: Math.round((correct / Math.max(1, total)) * 100)
      }
    });
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  function setDirection(newDir) {
    direction = newDir;
    [...els.dirGroup.querySelectorAll(".chip")].forEach((c) => c.setAttribute("aria-selected", c.dataset.dir === direction ? "true" : "false"));
    startNewSession();
  }

  function startNewSession() {
    session = buildSession().map(buildPrompt);
    sessionPos = 0; sessionResults = [];
    if (els.nextStep) els.nextStep.innerHTML = "";
    els.summaryCard.classList.add("hidden");
    els.drillCard.classList.remove("hidden");
    state.meta.lastSessionDate = new Date().toISOString().slice(0, 10);
    saveState();
    renderPrompt();
    renderStats();
  }

  function doExport() {
    const blob = new Blob([kernel.exportState(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `plata-vocab-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
  }
  function doImport(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = kernel.importState(String(reader.result || ""), TRAINER_ID);
        if (!confirm("Importér — overskriv aktuel progress?")) return;
        state = parsed; saveState(); renderStats(); startNewSession();
      } catch (e) { alert("Kunne ikke læse filen: " + e.message); }
    };
    reader.readAsText(file);
  }
  function doReset() {
    if (!confirm("Nulstil al progress?")) return;
    state = freshState(); saveState(); renderStats(); startNewSession();
  }

  function init() {
    els.dirGroup.addEventListener("click", (e) => {
      const c = e.target.closest(".chip");
      if (c) setDirection(c.dataset.dir);
    });
    els.answerForm.addEventListener("submit", handleSubmit);
    els.againBtn.addEventListener("click", startNewSession);
    els.changeDirBtn.addEventListener("click", () => { els.summaryCard.classList.add("hidden"); });
    els.exportBtn.addEventListener("click", doExport);
    els.importBtn.addEventListener("click", () => els.importFile.click());
    els.importFile.addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) doImport(f);
      e.target.value = "";
    });
    els.resetBtn.addEventListener("click", doReset);

    for (const it of window.PLATA_DATA.vocab) {
      ensureItemRecord(itemIdFor(it, "da2ru"), ["vocab", "da2ru"]);
      ensureItemRecord(itemIdFor(it, "ru2da"), ["vocab", "ru2da"]);
    }
    saveState();
    renderStats();
    renderPlanContext();
    startNewSession();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

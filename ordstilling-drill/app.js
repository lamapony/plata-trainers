/* platå · ordstilling-drill · app v0.1
 *
 * Multiple choice word-order drill.
 * Lite SM-2 spaced repetition (same shape as bøjning-drill).
 * Categories: v2, inversion, ledsaetning, blandet
 */

(function () {
  "use strict";

  const TRAINER_ID = "ordstilling";
  const LEGACY_STORAGE_KEY = "plata-ordstilling-v0";
  const SESSION_SIZE = 10;
  const kernel = window.PlataKernel;
  const dashboard = window.PlataDashboard;

  /** @type {{ byItemId: Record<string, {box:number, correct:number, wrong:number, lastSeen:string|null, mastered:boolean}>, meta: any }} */
  let stateHandle = kernel.createTrainerState({ trainerId: TRAINER_ID, oldKeys: [LEGACY_STORAGE_KEY] });
  let state = stateHandle.state;

  let category = "v2";
  let session = [];
  let sessionPos = 0;
  let sessionResults = [];
  let selectedIndex = -1;
  let awaitingCheck = true;

  const $ = (id) => document.getElementById(id);
  const els = {
    stats: $("stats"),
    statToday: $("stat-today"),
    statCorrect: $("stat-correct"),
    statAccuracy: $("stat-accuracy"),
    statStreak: $("stat-streak"),
    statMastered: $("stat-mastered"),
    catGroup: $("cat-group"),
    drillCard: $("drill-card"),
    promptCounter: $("prompt-counter"),
    promptBox: $("prompt-box"),
    promptCat: $("prompt-cat"),
    promptText: $("prompt-text"),
    options: $("options"),
    submitBtn: $("submit-btn"),
    feedback: $("feedback"),
    summaryCard: $("summary-card"),
    sumCorrect: $("sum-correct"),
    sumTotal: $("sum-total"),
    sumAccuracy: $("sum-accuracy"),
    sumMistakes: $("sum-mistakes"),
    nextStep: $("next-step"),
    againBtn: $("again-btn"),
    changeCatBtn: $("change-cat-btn"),
    exportBtn: $("export-btn"),
    importBtn: $("import-btn"),
    importFile: $("import-file"),
    resetBtn: $("reset-btn")
  };

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
  function itemIdFor(item) { return "o::" + (item.cat + "::" + item.prompt); }

  // ---------- session ----------
  function buildSession() {
    const pool = window.PLATA_DATA.ordstilling;
    let items = category === "blandet" ? pool.slice() : pool.filter((it) => it.cat === category);
    if (items.length === 0) items = pool.slice();

    const enriched = items.map((it) => ({ item: it, rec: ensureItemRecord(itemIdFor(it), ["ordstilling", it.cat]) }));
    const picked = kernel.pickSessionItems(enriched, { size: SESSION_SIZE });

    // Deterministic per-item shuffle so correct answer isn't always at index 0.
    // Same item → same order across re-encounters within this session; but
    // across items the correct answer is distributed across A/B/C/D.
    return picked.map((p) => shuffleItem(p.item));
  }

  function shuffleItem(item) {
    // FNV-1a hash of the item's stable content, then mulberry32 PRNG for
    // a well-distributed shuffle. Same item → same order; different items
    // get well-spread positions for the correct answer. Options are part
    // of the seed because multiple items in the data share prompt text
    // (e.g. "Vælg den sætning hvor subjektet står først (V2):") but have
    // different option sets.
    const seed = item.cat + "::" + item.prompt + "::" + item.options.join("|");
    let h = 0x811c9dc5;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h = h >>> 0;
    // mulberry32 PRNG seeded with the hash
    let s = h;
    function rand() {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    const indices = [0, 1, 2, 3];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const newOptions = indices.map((i) => item.options[i]);
    const newCorrect = indices.indexOf(item.correct);
    return Object.assign({}, item, { options: newOptions, correct: newCorrect });
  }

  // ---------- render ----------
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
    const rec = state.byItemId[itemIdFor(p)] || { box: 1 };
    els.promptCounter.textContent = `${sessionPos + 1} / ${session.length}`;
    els.promptBox.textContent = `box ${rec.box}${rec.mastered ? " · mastered" : ""}`;
    els.promptCat.textContent = p.cat;
    els.promptText.textContent = p.prompt;
    els.options.innerHTML = "";
    p.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", "false");
      btn.dataset.index = String(i);
      btn.innerHTML = `<span class="option-marker">${String.fromCharCode(65 + i)}</span><span>${escapeHtml(opt)}</span>`;
      btn.addEventListener("click", () => selectOption(i));
      els.options.appendChild(btn);
    });
    els.feedback.classList.add("hidden");
    els.feedback.textContent = "";
    els.feedback.className = "feedback hidden";
    selectedIndex = -1;
    awaitingCheck = true;
    els.submitBtn.disabled = true;
    els.submitBtn.textContent = "Check";
  }

  function selectOption(i) {
    if (!awaitingCheck) return;
    selectedIndex = i;
    [...els.options.querySelectorAll(".option")].forEach((b, idx) => {
      if (idx === i) { b.classList.add("selected"); b.setAttribute("aria-checked", "true"); }
      else { b.classList.remove("selected"); b.setAttribute("aria-checked", "false"); }
    });
    els.submitBtn.disabled = false;
  }

  function handleSubmit() {
    if (awaitingCheck) {
      if (selectedIndex < 0) return;
      checkAnswer();
    } else {
      sessionPos += 1;
      renderPrompt();
    }
  }

  function checkAnswer() {
    const p = session[sessionPos];
    const correct = selectedIndex === p.correct;
    const attemptTags = ["ordstilling", p.cat].concat(!correct && p.weakTags ? p.weakTags : []);
    kernel.recordAttempt(state, {
      itemId: itemIdFor(p),
      correct,
      tags: attemptTags,
      mode: p.cat,
      expected: p.options[p.correct],
      given: p.options[selectedIndex]
    });
    if (!correct) {
      // re-queue later in same session
      const insertAt = Math.min(session.length, sessionPos + 3 + Math.floor(Math.random() * 3));
      session.splice(insertAt, 0, p);
    }
    sessionResults.push({ itemId: itemIdFor(p), prompt: p.prompt, given: p.options[selectedIndex], expected: p.options[p.correct], why: p.why, correct });

    // mark options visually
    [...els.options.querySelectorAll(".option")].forEach((b, idx) => {
      b.disabled = true;
      if (idx === p.correct) b.classList.add("correct");
      else if (idx === selectedIndex) b.classList.add("wrong");
      b.classList.remove("selected");
    });
    showFeedback(correct, p.options[p.correct], p.why);
    awaitingCheck = false;
    els.submitBtn.disabled = false;
    els.submitBtn.textContent = "Næste →";
    saveState();
    renderStats();
  }

  function showFeedback(ok, expected, why) {
    els.feedback.classList.remove("hidden", "good", "bad");
    els.feedback.classList.add(ok ? "good" : "bad");
    els.feedback.innerHTML = (ok ? `✓ korrekt — <span class="correct-answer">${escapeHtml(expected)}</span>` : `✗ ikke helt — <span class="correct-answer">${escapeHtml(expected)}</span>`) + (why ? `<div class="why">${escapeHtml(why)}</div>` : "") + `<div class="next-hint">tryk Enter eller klik "Næste →"</div>`;
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
        li.innerHTML = `<div>${escapeHtml(m.prompt)}</div><div><span class="given">${escapeHtml(m.given)}</span><span class="right">${escapeHtml(m.expected)}</span></div>`;
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
    els.stats.insertAdjacentElement("afterend", slot);
  }

  function markPlanStepComplete(total, correct) {
    if (!window.PlataPlanner || !window.PlataPlanner.markPracticePlanStepCompleted || total <= 0) return;
    window.PlataPlanner.markPracticePlanStepCompleted({
      trainerId: TRAINER_ID,
      evidence: {
        reason: "drill-session-complete",
        mode: category,
        trainerId: TRAINER_ID,
        total,
        correct,
        accuracy: Math.round((correct / Math.max(1, total)) * 100)
      }
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- mode switching ----------
  function setCategory(newCat) {
    category = newCat;
    [...els.catGroup.querySelectorAll(".chip")].forEach((c) => c.setAttribute("aria-selected", c.dataset.cat === category ? "true" : "false"));
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
    a.download = `plata-ordstilling-${new Date().toISOString().slice(0, 10)}.json`;
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

  // ---------- init ----------
  function init() {
    els.catGroup.addEventListener("click", (e) => {
      const c = e.target.closest(".chip");
      if (c) setCategory(c.dataset.cat);
    });
    els.submitBtn.addEventListener("click", handleSubmit);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !els.summaryCard.classList.contains("hidden") === false && !els.drillCard.classList.contains("hidden")) {
        if (awaitingCheck && selectedIndex >= 0) handleSubmit();
        else if (!awaitingCheck) handleSubmit();
      } else if (/^[1-4]$/.test(e.key) && awaitingCheck) {
        const i = parseInt(e.key, 10) - 1;
        if (i < 4) selectOption(i);
      }
    });
    els.againBtn.addEventListener("click", startNewSession);
    els.changeCatBtn.addEventListener("click", () => { els.summaryCard.classList.add("hidden"); });
    els.exportBtn.addEventListener("click", doExport);
    els.importBtn.addEventListener("click", () => els.importFile.click());
    els.importFile.addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) doImport(f);
      e.target.value = "";
    });
    els.resetBtn.addEventListener("click", doReset);

    for (const it of window.PLATA_DATA.ordstilling) ensureItemRecord(itemIdFor(it), ["ordstilling", it.cat]);
    saveState();
    renderStats();
    renderPlanContext();
    startNewSession();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

/* platå · ordstilling-drill · app v0.1
 *
 * Multiple choice word-order drill.
 * Lite SM-2 spaced repetition (same shape as bøjning-drill).
 * Categories: v2, inversion, ledsaetning, blandet
 */

(function () {
  "use strict";

  const STORAGE_KEY = "plata-ordstilling-v0";
  const SESSION_SIZE = 10;

  /** @type {{ byItemId: Record<string, {box:number, correct:number, wrong:number, lastSeen:string|null, mastered:boolean}>, meta: any }} */
  let state = loadState();

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
    againBtn: $("again-btn"),
    changeCatBtn: $("change-cat-btn"),
    exportBtn: $("export-btn"),
    importBtn: $("import-btn"),
    importFile: $("import-file"),
    resetBtn: $("reset-btn")
  };

  // ---------- persistence ----------
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return freshState();
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.meta || !parsed.byItemId) return freshState();
      return parsed;
    } catch (_) { return freshState(); }
  }
  function freshState() {
    return {
      byItemId: {},
      meta: { createdAt: new Date().toISOString(), lastSessionDate: "", totalCorrect: 0, totalAttempts: 0, currentStreak: 0, longestStreak: 0 }
    };
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { console.error(e); }
  }
  function ensureItemRecord(itemId) {
    if (!state.byItemId[itemId]) state.byItemId[itemId] = { box: 1, correct: 0, wrong: 0, lastSeen: null, mastered: false };
    return state.byItemId[itemId];
  }
  function itemIdFor(item) { return "o::" + (item.cat + "::" + item.prompt); }

  // ---------- session ----------
  function buildSession() {
    const pool = window.PLATA_DATA.ordstilling;
    let items = category === "blandet" ? pool.slice() : pool.filter((it) => it.cat === category);
    if (items.length === 0) items = pool.slice();

    const enriched = items.map((it) => ({ item: it, rec: ensureItemRecord(itemIdFor(it)) }));
    const weak = enriched.filter((e) => !e.rec.mastered && (e.rec.box <= 2 || e.rec.wrong > e.rec.correct));
    const mid = enriched.filter((e) => !e.rec.mastered && e.rec.box > 2);
    const mastered = enriched.filter((e) => e.rec.mastered);

    const take = Math.min(SESSION_SIZE, enriched.length);
    const w = Math.min(weak.length, Math.ceil(take * 0.6));
    const m = Math.min(mid.length, Math.ceil(take * 0.3));
    const r = Math.min(mastered.length, take - w - m);

    const sample = (arr, n) => {
      const out = []; const a = arr.slice();
      while (out.length < n && a.length) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
      return out;
    };

    let picked = sample(weak, w).concat(sample(mid, m)).concat(sample(mastered, r));
    const remaining = enriched.filter((e) => !picked.includes(e));
    picked = picked.concat(sample(remaining, take - picked.length));

    return picked.map((p) => p.item);
  }

  // ---------- render ----------
  function renderStats() {
    const total = state.meta.totalAttempts;
    const correct = state.meta.totalCorrect;
    const acc = total > 0 ? Math.round((correct / total) * 100) + "%" : "—";
    const mastered = Object.values(state.byItemId).filter((r) => r.mastered).length;
    els.statToday.textContent = sessionResults.length;
    els.statCorrect.textContent = sessionResults.filter((r) => r.correct).length;
    els.statAccuracy.textContent = acc;
    els.statStreak.textContent = state.meta.currentStreak;
    els.statMastered.textContent = mastered;
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
    const rec = ensureItemRecord(itemIdFor(p));
    rec.lastSeen = new Date().toISOString();
    if (correct) {
      rec.correct += 1;
      rec.box = Math.min(5, rec.box + 1);
      if (rec.box >= 5) rec.mastered = true;
      state.meta.totalCorrect += 1;
      state.meta.currentStreak += 1;
      if (state.meta.currentStreak > state.meta.longestStreak) state.meta.longestStreak = state.meta.currentStreak;
    } else {
      rec.wrong += 1;
      rec.box = 1;
      rec.mastered = false;
      state.meta.currentStreak = 0;
      // re-queue later in same session
      const insertAt = Math.min(session.length, sessionPos + 3 + Math.floor(Math.random() * 3));
      session.splice(insertAt, 0, p);
    }
    state.meta.totalAttempts += 1;
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
    renderStats();
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
    els.summaryCard.classList.add("hidden");
    els.drillCard.classList.remove("hidden");
    state.meta.lastSessionDate = new Date().toISOString().slice(0, 10);
    saveState();
    renderPrompt();
    renderStats();
  }

  // ---------- export / import / reset ----------
  function doExport() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
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
        const parsed = JSON.parse(String(reader.result || ""));
        if (!parsed || !parsed.meta || !parsed.byItemId) throw new Error("invalid file");
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

    for (const it of window.PLATA_DATA.ordstilling) ensureItemRecord(itemIdFor(it));
    saveState();
    renderStats();
    startNewSession();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

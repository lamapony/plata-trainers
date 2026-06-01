/* platå · bøjning-drill · app v0.1
 *
 * Lite SM-2 spaced repetition
 * - 5 boxes: 1 (new) → 5 (mastered)
 * - Correct: box += 1
 * - Wrong: box = 1, re-queue this session
 * - Daily cap: 10 items per session
 * - Pick: prioritize weak items (box 1-2), fill with random
 * - State persisted to LocalStorage as JSON
 */

(function () {
  "use strict";

  const STORAGE_KEY = "plata-bojning-v0";
  const SESSION_SIZE = 10;

  // ---------- state ----------
  /** @type {{
   *   byItemId: Record<string, {box:number, correct:number, wrong:number, lastSeen:string|null, mastered:boolean}>,
   *   meta: { createdAt: string, lastSessionDate: string, totalCorrect: number, totalAttempts: number, currentStreak: number, longestStreak: number }
   * }} */
  let state = loadState();

  let mode = "verber";        // "verber" | "substantiver"
  let type = "nutid";         // for verber: nutid|datid|førnutid|blandet ; for substantiver: bestemtEntal|flertalUbestemt|bestemtFlertal|blandet
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
    againBtn: $("again-btn"),
    changeModeBtn: $("change-mode-btn"),
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
    } catch (_) {
      return freshState();
    }
  }
  function freshState() {
    return {
      byItemId: {},
      meta: {
        createdAt: new Date().toISOString(),
        lastSessionDate: "",
        totalCorrect: 0,
        totalAttempts: 0,
        currentStreak: 0,
        longestStreak: 0
      }
    };
  }
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("LocalStorage save failed", e);
    }
  }
  function ensureItemRecord(itemId) {
    if (!state.byItemId[itemId]) {
      state.byItemId[itemId] = { box: 1, correct: 0, wrong: 0, lastSeen: null, mastered: false };
    }
    return state.byItemId[itemId];
  }
  function itemIdFor(item, mode) {
    if (mode === "verber") return "v::" + item.infinitive;
    return "s::" + item.ubestemtEntal;
  }

  // ---------- session building ----------
  function buildSession() {
    const pool = window.PLATA_DATA[mode];
    const candidates = pool.map((item) => ({
      item,
      rec: ensureItemRecord(itemIdFor(item, mode))
    }));

    // Weight: lower box = higher priority; new items (rec.box === 1 && rec.attempts === 0) included first
    const weak = candidates.filter((c) => !c.rec.mastered && (c.rec.box <= 2 || c.rec.wrong > c.rec.correct));
    const mid = candidates.filter((c) => !c.rec.mastered && c.rec.box > 2);
    const mastered = candidates.filter((c) => c.rec.mastered);

    const sample = (arr, n) => {
      const out = [];
      const a = arr.slice();
      while (out.length < n && a.length) {
        const i = Math.floor(Math.random() * a.length);
        out.push(a.splice(i, 1)[0]);
      }
      return out;
    };

    // Build mixed session: ~60% weak, ~30% mid, ~10% mastered (touch-up)
    const take = Math.min(SESSION_SIZE, candidates.length);
    const w = Math.min(weak.length, Math.ceil(take * 0.6));
    const m = Math.min(mid.length, Math.ceil(take * 0.3));
    const r = Math.min(mastered.length, take - w - m);

    let picked = [];
    picked = picked.concat(sample(weak, w));
    picked = picked.concat(sample(mid, m));
    picked = picked.concat(sample(mastered, r));
    // fill remaining with any random
    const remaining = candidates.filter((c) => !picked.includes(c));
    picked = picked.concat(sample(remaining, take - picked.length));

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
    const today = new Date().toISOString().slice(0, 10);
    const todayAttempts = sessionResults.length;
    const todayCorrect = sessionResults.filter((r) => r.correct).length;
    const total = state.meta.totalAttempts;
    const correct = state.meta.totalCorrect;
    const acc = total > 0 ? Math.round((correct / total) * 100) + "%" : "—";
    const mastered = Object.values(state.byItemId).filter((r) => r.mastered).length;

    els.statToday.textContent = todayAttempts;
    els.statCorrect.textContent = todayCorrect;
    els.statAccuracy.textContent = acc;
    els.statStreak.textContent = state.meta.currentStreak;
    els.statMastered.textContent = mastered;
  }

  function renderPrompt() {
    if (sessionPos >= session.length) {
      renderSummary();
      return;
    }
    const p = session[sessionPos];
    const rec = state.byItemId[p.itemId] || { box: 1 };
    els.promptCounter.textContent = `${sessionPos + 1} / ${session.length}`;
    els.promptBox.textContent = `box ${rec.box}${rec.mastered ? " · mastered" : ""}`;
    els.promptText.textContent = p.prompt;
    els.promptHint.textContent = p.hint;
    els.answerInput.value = "";
    els.answerInput.classList.remove("correct", "wrong");
    els.answerInput.disabled = false;
    els.answerInput.focus();
    els.feedback.classList.add("hidden");
    els.feedback.textContent = "";
    els.feedback.className = "feedback hidden";
    els.submitBtn.disabled = false;
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
    renderStats();
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
    const rec = ensureItemRecord(p.itemId);
    rec.lastSeen = new Date().toISOString();
    if (correct) {
      rec.correct += 1;
      rec.box = Math.min(5, rec.box + 1);
      if (rec.box >= 5) rec.mastered = true;
      state.meta.totalCorrect += 1;
      state.meta.currentStreak += 1;
      if (state.meta.currentStreak > state.meta.longestStreak) {
        state.meta.longestStreak = state.meta.currentStreak;
      }
      els.answerInput.classList.add("correct");
      showFeedback(true, p.expected, null);
    } else {
      rec.wrong += 1;
      rec.box = 1;
      rec.mastered = false;
      state.meta.currentStreak = 0;
      els.answerInput.classList.add("wrong");
      showFeedback(false, p.expected, given);
      // re-queue later in this session
      const requeued = { ...p };
      const insertAt = Math.min(session.length, sessionPos + 3 + Math.floor(Math.random() * 3));
      session.splice(insertAt, 0, requeued);
    }
    state.meta.totalAttempts += 1;
    sessionResults.push({ itemId: p.itemId, expected: p.expected, given, correct });
    awaitingInput = false;
    els.submitBtn.disabled = true;
    els.answerInput.disabled = true;
    saveState();
    renderStats();
  }

  function showFeedback(ok, expected, given) {
    els.feedback.classList.remove("hidden", "good", "bad");
    els.feedback.classList.add(ok ? "good" : "bad");
    if (ok) {
      els.feedback.innerHTML = `✓ korrekt — <span class="correct-answer">${escapeHtml(expected)}</span><div class="next-hint">tryk Enter eller "Check" for næste</div>`;
    } else {
      els.feedback.innerHTML = `✗ ikke helt — <span class="correct-answer">${escapeHtml(expected)}</span>${given ? ` (du skrev <span class="correct-answer">${escapeHtml(given)}</span>)` : ""}<div class="next-hint">korrekt svar gemt, gentages senere i denne session</div>`;
    }
  }

  // ---------- mode / type switching ----------
  function setMode(newMode) {
    mode = newMode;
    [...els.modeGroup.querySelectorAll(".chip")].forEach((c) => {
      c.setAttribute("aria-selected", c.dataset.mode === mode ? "true" : "false");
    });
    if (mode === "verber") {
      els.typeRowVerber.classList.remove("hidden");
      els.typeRowSubstantiver.classList.add("hidden");
      type = "nutid";
      [...els.typeGroupVerber.querySelectorAll(".chip")].forEach((c) => {
        c.setAttribute("aria-selected", c.dataset.type === type ? "true" : "false");
      });
    } else {
      els.typeRowVerber.classList.add("hidden");
      els.typeRowSubstantiver.classList.remove("hidden");
      type = "bestemtEntal";
      [...els.typeGroupSubstantiver.querySelectorAll(".chip")].forEach((c) => {
        c.setAttribute("aria-selected", c.dataset.type === type ? "true" : "false");
      });
    }
    startNewSession();
  }
  function setType(newType) {
    type = newType;
    const group = mode === "verber" ? els.typeGroupVerber : els.typeGroupSubstantiver;
    [...group.querySelectorAll(".chip")].forEach((c) => {
      c.setAttribute("aria-selected", c.dataset.type === type ? "true" : "false");
    });
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
    a.download = `plata-bojning-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
  }
  function doImport(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        if (!parsed || !parsed.meta || !parsed.byItemId) throw new Error("invalid file");
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

    // ensure every item has a record (so box stats are correct)
    for (const item of window.PLATA_DATA.verber) ensureItemRecord(itemIdFor(item, "verber"));
    for (const item of window.PLATA_DATA.substantiver) ensureItemRecord(itemIdFor(item, "substantiver"));
    saveState();

    renderStats();
    startNewSession();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

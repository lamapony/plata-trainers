/* platå · skrive-drill · app v0.1
 *
 * Short written production with self-grade rubric (no auto-grading).
 */

(function () {
  "use strict";

  const TRAINER_ID = "skrive";
  const LEGACY_STORAGE_KEY = "plata-skrive-v0";
  const kernel = window.PlataKernel;
  const dashboard = window.PlataDashboard;

  let stateHandle = kernel.createTrainerState({ trainerId: TRAINER_ID, oldKeys: [LEGACY_STORAGE_KEY] });
  let state = stateHandle.state;

  let category = "blandet";
  let session = [];
  let sessionPos = 0;
  let sessionResults = [];
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
    promptChannel: $("prompt-channel"),
    promptText: $("prompt-text"),
    promptStarter: $("prompt-starter"),
    answerInput: $("answer-input"),
    rubric: $("rubric"),
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

  function freshState() {
    return kernel.freshState(TRAINER_ID);
  }
  function saveState() {
    kernel.saveState(state);
  }
  function ensureItemRecord(itemId, tags) {
    return kernel.ensureItemRecord(state, itemId, tags);
  }
  function itemIdFor(item) {
    return "w::" + item.cat + "::" + item.id;
  }

  function buildSession() {
    const pool = window.PLATA_DATA.skrive;
    let items = category === "blandet" ? pool.slice() : pool.filter((it) => it.cat === category);
    if (items.length === 0) items = pool.slice();
    const enriched = items.map((it) => ({ item: it, rec: ensureItemRecord(itemIdFor(it), ["skrive", it.cat]) }));
    return kernel.pickSessionItems(enriched, { size: Math.min(5, items.length) }).map((p) => p.item);
  }

  function renderStats() {
    const view = dashboard.statsView(state);
    els.statToday.textContent = view.today;
    els.statCorrect.textContent = view.totalCorrect;
    els.statAccuracy.textContent = view.accuracy;
    els.statStreak.textContent = view.streak;
    els.statMastered.textContent = view.mastered;
  }

  function renderRubric(prompt) {
    els.rubric.innerHTML = "";
    (prompt.rubric || []).forEach((row) => {
      const label = document.createElement("label");
      label.className = "rubric-row";
      label.innerHTML = `<input type="checkbox" data-rubric="${escapeHtml(row.id)}" /> <span><strong>${escapeHtml(row.label)}</strong> — ${escapeHtml(row.detail)}</span>`;
      els.rubric.appendChild(label);
    });
  }

  function renderPrompt() {
    if (sessionPos >= session.length) {
      renderSummary();
      return;
    }
    const p = session[sessionPos];
    const rec = state.byItemId[itemIdFor(p)] || { box: 1 };
    els.promptCounter.textContent = `${sessionPos + 1} / ${session.length}`;
    els.promptBox.textContent = `box ${rec.box}${rec.mastered ? " · mastered" : ""}`;
    els.promptCat.textContent = p.cat;
    els.promptChannel.textContent = p.channel;
    els.promptText.textContent = p.prompt;
    els.promptStarter.textContent = p.starter || "";
    els.answerInput.value = "";
    renderRubric(p);
    els.feedback.classList.add("hidden");
    els.feedback.textContent = "";
    awaitingCheck = true;
    els.submitBtn.disabled = false;
    els.submitBtn.textContent = "Self-grade & continue";
    els.answerInput.focus();
  }

  function rubricComplete() {
    const boxes = [...els.rubric.querySelectorAll("input[type='checkbox']")];
    return boxes.length > 0 && boxes.every((box) => box.checked);
  }

  function handleSubmit() {
    if (awaitingCheck) {
      checkAnswer();
    } else {
      sessionPos += 1;
      renderPrompt();
    }
  }

  function checkAnswer() {
    const p = session[sessionPos];
    const text = String(els.answerInput.value || "").trim();
    const minChars = Number(p.minChars || 24);
    const rubricOk = rubricComplete();
    const lengthOk = text.length >= minChars;
    const correct = rubricOk && lengthOk;
    const attemptTags = ["skrive", p.cat].concat(!correct ? ["self-grade-gap"] : []);
    kernel.recordAttempt(state, {
      itemId: itemIdFor(p),
      correct,
      tags: attemptTags,
      mode: p.cat,
      reason: "self-grade",
      channel: p.channel,
      rubricPassed: rubricOk,
      lengthPassed: lengthOk,
      charCount: text.length
    });
    if (!correct) {
      const insertAt = Math.min(session.length, sessionPos + 2);
      session.splice(insertAt, 0, p);
    }
    sessionResults.push({
      itemId: itemIdFor(p),
      prompt: p.prompt,
      note: p.note,
      correct,
      rubricOk,
      lengthOk,
      charCount: text.length
    });
    showFeedback(correct, p, { rubricOk, lengthOk, minChars });
    awaitingCheck = false;
    els.submitBtn.textContent = "Næste →";
    saveState();
    renderStats();
  }

  function showFeedback(ok, prompt, meta) {
    els.feedback.classList.remove("hidden", "good", "bad");
    els.feedback.classList.add(ok ? "good" : "bad");
    const parts = [];
    if (ok) parts.push("✓ Rubric complete — production logged locally.");
    else {
      if (!meta.lengthOk) parts.push(`✗ Write at least ${meta.minChars} characters (${meta.charCount} now).`);
      if (!meta.rubricOk) parts.push("✗ Check every rubric row before self-grading.");
    }
    if (prompt.note) parts.push(`<div class="why">${escapeHtml(prompt.note)}</div>`);
    parts.push('<div class="next-hint">tryk Enter eller klik "Næste →"</div>');
    els.feedback.innerHTML = parts.join(" ");
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
    els.sumMistakes.innerHTML = "";
    const gaps = sessionResults.filter((r) => !r.correct);
    if (gaps.length === 0) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "alle prompts self-graded — flot";
      els.sumMistakes.appendChild(li);
    } else {
      gaps.forEach((m) => {
        const li = document.createElement("li");
        li.innerHTML = `<div>${escapeHtml(m.prompt)}</div><div class="given">${m.rubricOk ? "rubric ok" : "rubric incomplete"} · ${m.charCount} tegn</div>`;
        els.sumMistakes.appendChild(li);
      });
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
        reason: "skrive-session-complete",
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

  function applyCategoryFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get("cat");
    if (catParam && ["bolig", "arbejde", "sundhed", "blandet"].includes(catParam)) category = catParam;
  }

  function syncCategoryChips() {
    [...els.catGroup.querySelectorAll(".chip")].forEach((c) => c.setAttribute("aria-selected", c.dataset.cat === category ? "true" : "false"));
  }

  function setCategory(newCat) {
    category = newCat;
    syncCategoryChips();
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

  function doExport() {
    const blob = new Blob([kernel.exportState(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plata-skrive-${new Date().toISOString().slice(0, 10)}.json`;
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
    if (!confirm("Nulstil al progress?")) return;
    state = freshState();
    saveState();
    renderStats();
    startNewSession();
  }

  function init() {
    els.catGroup.addEventListener("click", (e) => {
      const c = e.target.closest(".chip");
      if (c) setCategory(c.dataset.cat);
    });
    els.submitBtn.addEventListener("click", handleSubmit);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.metaKey && !els.drillCard.classList.contains("hidden")) handleSubmit();
    });
    els.againBtn.addEventListener("click", startNewSession);
    els.changeCatBtn.addEventListener("click", () => els.summaryCard.classList.add("hidden"));
    els.exportBtn.addEventListener("click", doExport);
    els.importBtn.addEventListener("click", () => els.importFile.click());
    els.importFile.addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) doImport(f);
      e.target.value = "";
    });
    els.resetBtn.addEventListener("click", doReset);

    window.PLATA_DATA.skrive.forEach((it) => ensureItemRecord(itemIdFor(it), ["skrive", it.cat]));
    applyCategoryFromUrl();
    syncCategoryChips();
    saveState();
    renderPlanContext();
    startNewSession();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

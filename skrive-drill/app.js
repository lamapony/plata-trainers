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
    const stats = kernel.getStats(state);
    els.statToday.textContent = String(stats.todayCount);
    els.statCorrect.textContent = String(stats.totalAttempts);
    els.statAccuracy.textContent = "—";
    els.statStreak.textContent = "—";
    els.statMastered.textContent = "—";
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
    els.promptCounter.textContent = `${sessionPos + 1} / ${session.length}`;
    els.promptBox.textContent = "selvtjek";
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
    els.submitBtn.textContent = "Vurder selv og fortsæt";
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
    const completed = rubricOk && lengthOk;
    const needsRevision = !completed;
    const attemptTags = ["skrive", p.cat].concat(needsRevision ? ["self-grade-gap"] : []);
    kernel.recordAttempt(state, {
      itemId: itemIdFor(p),
      assessmentKind: "self-report",
      correct: null,
      completed,
      tags: attemptTags,
      mode: p.cat,
      reason: "self-grade",
      channel: p.channel,
      rubricPassed: rubricOk,
      lengthPassed: lengthOk,
      charCount: text.length
    });
    if (needsRevision) {
      const insertAt = Math.min(session.length, sessionPos + 2);
      session.splice(insertAt, 0, p);
    }
    sessionResults.push({
      itemId: itemIdFor(p),
      prompt: p.prompt,
      note: p.note,
      assessmentKind: "self-report",
      completed,
      needsRevision,
      rubricOk,
      lengthOk,
      charCount: text.length
    });
    showFeedback(completed, p, { rubricOk, lengthOk, minChars, charCount: text.length });
    awaitingCheck = false;
    els.submitBtn.textContent = "Næste →";
    saveState();
    renderStats();
  }

  function showFeedback(completed, prompt, meta) {
    els.feedback.classList.remove("hidden", "good", "bad");
    els.feedback.classList.add(completed ? "good" : "bad");
    const parts = [];
    if (completed) {
      parts.push("✓ Færdig — din egen vurdering er gemt. Platå giver ikke teksten en kunstig score.");
    } else {
      parts.push("Prøv teksten igen");
      if (!meta.lengthOk) parts.push(`— skriv mindst ${meta.minChars} tegn (du har ${meta.charCount}).`);
      if (!meta.rubricOk) parts.push("— markér hvert punkt i tjeklisten, før du fortsætter.");
    }
    if (prompt.note) parts.push(`<div class="why">${escapeHtml(prompt.note)}</div>`);
    parts.push('<div class="next-hint">tryk Enter eller klik "Næste →"</div>');
    els.feedback.innerHTML = parts.join(" ");
  }

  function renderSummary() {
    els.drillCard.classList.add("hidden");
    els.summaryCard.classList.remove("hidden");
    const total = sessionResults.length;
    const completed = sessionResults.filter((r) => r.completed).length;
    const needsRevision = sessionResults.filter((r) => r.needsRevision).length;
    els.sumCorrect.textContent = completed;
    els.sumTotal.textContent = total;
    els.sumAccuracy.textContent = needsRevision ? `${needsRevision} skal prøves igen` : "alle færdige";
    els.sumMistakes.innerHTML = "";
    const gaps = sessionResults.filter((r) => r.needsRevision);
    if (gaps.length === 0) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "alle tekster er færdige — Platå påstår ikke at kunne bedømme deres sproglige kvalitet";
      els.sumMistakes.appendChild(li);
    } else {
      gaps.forEach((m) => {
        const li = document.createElement("li");
        li.innerHTML = `<div>${escapeHtml(m.prompt)}</div><div class="given">${m.rubricOk ? "tjekliste færdig" : "tjekliste mangler"} · ${m.charCount} tegn · prøv igen</div>`;
        els.sumMistakes.appendChild(li);
      });
    }
    markPlanStepComplete(total, completed);
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
      assessmentKind: "self-report",
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

  function markPlanStepComplete(total, completed) {
    if (!window.PlataPlanner || !window.PlataPlanner.markPracticePlanStepCompleted || total <= 0) return;
    window.PlataPlanner.markPracticePlanStepCompleted({
      trainerId: TRAINER_ID,
      evidence: {
        reason: "self-report-session-complete",
        assessmentKind: "self-report",
        mode: category,
        trainerId: TRAINER_ID,
        total,
        completed,
        needsRevision: Math.max(0, total - completed),
        completionRate: Math.round((completed / Math.max(1, total)) * 100)
      }
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function applyCategoryFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get("cat");
    if (catParam && ["bolig", "arbejde", "sundhed", "blandet"].includes(catParam)) {
      category = catParam;
      return;
    }
    const fromLesson = params.get("from") || "";
    const signal = params.get("signal") || "";
    if (fromLesson === "lesson-a2-doctor" && signal) {
      category = "sundhed";
    }
  }

  const DOCTOR_REPAIR_COPY = {
    "symptom-duration": "Du missede varighed i apotek-scenen. Skriv nu til lægen med tydelig timeline — i to dage, siden i går.",
    "symptom-severity": "Du missede styrke (lidt / ret) i apotek-scenen. Skriv symptomer konkret i patientportalen — uden drama eller 'ikke så godt'.",
    "concrete-next-step": "Du missede næste skridt i apotek-scenen. Afslut patientportal-beskeden med hvad du skal gøre nu."
  };

  function renderRepairContextBanner() {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from") || "";
    const signal = params.get("signal") || "";
    if (from !== "lesson-a2-doctor") return;
    const copy = DOCTOR_REPAIR_COPY[signal] || "Overfør apotek-samtalen til skriftlig dansk: timeline, styrke og næste skridt i patientportalen.";
    const existing = document.querySelector(".repair-context-slot");
    const html = [
      "<aside class='repair-context-card' aria-label='Repair context from doctor lesson'>",
      "<p class='eyebrow'>Match → Gym · apotek → patientportal</p>",
      "<h3>Samme kompetence, nyt kanal</h3>",
      "<p>" + escapeHtml(copy) + "</p>",
      "<div class='repair-context-meta'>",
      "<span>spoken miss</span>",
      "<span>written repair</span>",
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
    renderRepairContextBanner();
    saveState();
    renderPlanContext();
    startNewSession();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

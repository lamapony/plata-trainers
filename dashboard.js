/* Platå Dashboard — unified progress view */

const TRAINERS = [
  {
    id: "bojning",
    name: "Bøjning drill",
    type: "drill",
    path: "./bojning-drill/",
    description: "Verb tenses + noun inflection",
    icon: "📝"
  },
  {
    id: "ordstilling",
    name: "Ordstilling drill",
    type: "drill",
    path: "./ordstilling-drill/",
    description: "V2, inversion, ledsætninger",
    icon: "🔀"
  },
  {
    id: "vocab",
    name: "Vocab SR",
    type: "drill",
    path: "./vocab-sr/",
    description: "DA ↔ RU spaced repetition",
    icon: "🗂️"
  },
  {
    id: "lesson-01-arrival",
    name: "Lesson 01: First Morning",
    type: "lesson",
    path: "./lessons/lesson-01/",
    description: "Narrative A0/A1 onboarding",
    icon: "🌅"
  },
  {
    id: "lesson-b2-radiator-register",
    name: "B2: Register & Particles",
    type: "lesson",
    path: "./lessons/lesson-b2-radiator/",
    description: "Complaints, tone, modal particles",
    icon: "⚖️"
  },
  {
    id: "lesson-b2-job-followup",
    name: "B2: Job Follow-up",
    type: "lesson",
    path: "./lessons/lesson-b2-job-followup/",
    description: "Post-interview email, LinkedIn, professional tone",
    icon: "💼"
  }
];

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }
function escapeHtml(str) {
  return String(str || "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': '&quot;' }[c]));
}

function loadTrainerState(trainerId) {
  const kernel = window.PlataKernel;
  if (!kernel) return null;
  const handle = kernel.createTrainerState({ trainerId, save: false });
  return handle.state;
}

function computeStats(state) {
  if (!state) return null;
  const meta = state.meta || {};
  const total = meta.totalAttempts || 0;
  const correct = meta.totalCorrect || 0;
  const byItemId = state.byItemId || {};
  const records = Object.values(byItemId);
  const mastered = records.filter(r => r.mastered).length;
  const totalItems = records.length;
  const weakTags = kernel.getWeakTags ? kernel.getWeakTags(state, 10) : [];
  const registerProfile = kernel.getRegisterProfile ? kernel.getRegisterProfile(state) : { formal: 0, informal: 0, neutral: 0, total: 0 };
  return {
    total,
    correct,
    accuracy: total ? Math.round((correct / total) * 100) : null,
    mastered,
    totalItems,
    currentStreak: meta.currentStreak || 0,
    longestStreak: meta.longestStreak || 0,
    lastSessionDate: meta.lastSessionDate || "",
    weakTags,
    registerProfile
  };
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getStreakLabel(streak) {
  if (streak === 0) return "No active streak";
  if (streak === 1) return "1 day";
  return `${streak} days`;
}

function renderTrainerCards() {
  const container = $("#trainer-cards");
  if (!container) return;
  container.innerHTML = "";

  TRAINERS.forEach(trainer => {
    const state = loadTrainerState(trainer.id);
    const stats = computeStats(state);
    const hasData = stats && stats.total > 0;

    const card = document.createElement("article");
    card.className = "trainer-card";
    card.innerHTML = `
      <span class="tag">${trainer.icon} ${trainer.type === "lesson" ? "Narrative" : "Drill"}</span>
      <h3>${escapeHtml(trainer.name)}</h3>
      <p>${escapeHtml(trainer.description)}</p>
      ${hasData ? `
        <div class="stats-mini">
          <div><strong>${stats.total}</strong> attempts</div>
          <div><strong>${stats.accuracy !== null ? stats.accuracy + "%" : "—"}</strong> accuracy</div>
          <div><strong>${stats.mastered}/${stats.totalItems}</strong> mastered</div>
          <div><strong>${getStreakLabel(stats.currentStreak)}</strong> streak</div>
          <div class="last-session">Last: ${formatDate(stats.lastSessionDate)}</div>
        </div>
      ` : `
        <div class="stats-mini empty">No progress yet</div>
      `}
      <a class="card-link" href="${escapeHtml(trainer.path)}">${hasData ? "Continue" : "Start"} ${trainer.type === "lesson" ? "lesson" : "drill"} →</a>
    `;
    container.appendChild(card);
  });
}

function renderDueCards() {
  const container = $("#due-cards");
  if (!container) return;
  container.innerHTML = "";

  // Find trainers with most weak tags or longest gap since last session
  const due = TRAINERS.map(trainer => {
    const state = loadTrainerState(trainer.id);
    const stats = computeStats(state);
    if (!stats) return null;
    return { trainer, stats };
  }).filter(x => x !== null)
    .sort((a, b) => {
      // Prefer: has weak tags, then low accuracy, then old last session
      const aWeak = a.stats.weakTags.length;
      const bWeak = b.stats.weakTags.length;
      if (aWeak !== bWeak) return bWeak - aWeak;
      if (a.stats.accuracy !== null && b.stats.accuracy !== null) return a.stats.accuracy - b.stats.accuracy;
      const aDate = a.stats.lastSessionDate ? new Date(a.stats.lastSessionDate).getTime() : 0;
      const bDate = b.stats.lastSessionDate ? new Date(b.stats.lastSessionDate).getTime() : 0;
      return aDate - bDate;
    })
    .slice(0, 3);

  if (due.length === 0) {
    container.innerHTML = '<p class="narrative">No progress data yet. Start a trainer to see recommendations.</p>';
    return;
  }

  due.forEach(({ trainer, stats }) => {
    const topWeak = stats.weakTags.slice(0, 3);
    const card = document.createElement("article");
    card.className = "trainer-card due-card";
    card.innerHTML = `
      <span class="tag due">${trainer.icon} Practice now</span>
      <h3>${escapeHtml(trainer.name)}</h3>
      <p>${escapeHtml(trainer.description)}</p>
      <div class="due-reasons">
        ${topWeak.length ? `
          <div class="weak-tags">
            <span class="eyebrow">Weak tags</span>
            ${topWeak.map(w => `<span class="weak-tag">${escapeHtml(w.tag)} (${w.wrong}/${w.total})</span>`).join("")}
          </div>
        ` : ""}
        ${stats.accuracy !== null && stats.accuracy < 70 ? `
          <div class="due-reason">Accuracy ${stats.accuracy}% — below comfort zone</div>
        ` : ""}
        ${!stats.lastSessionDate ? `
          <div class="due-reason">Never started</div>
        ` : (() => {
          const daysSince = Math.floor((Date.now() - new Date(stats.lastSessionDate).getTime()) / 86400000);
          if (daysSince >= 7) return `<div class="due-reason">${daysSince} days since last session</div>`;
          return "";
        })()}
      </div>
      <a class="card-link" href="${escapeHtml(trainer.path)}">Open ${trainer.type} →</a>
    `;
    container.appendChild(card);
  });
}

function renderWeakList() {
  const container = $("#weak-list");
  if (!container) return;

  // Aggregate weak tags across all trainers
  const tagMap = new Map();
  TRAINERS.forEach(trainer => {
    const state = loadTrainerState(trainer.id);
    const stats = computeStats(state);
    if (!stats) return;
    stats.weakTags.forEach(w => {
      const key = `${trainer.id}::${w.tag}`;
      if (!tagMap.has(key)) tagMap.set(key, { ...w, trainers: [] });
      const entry = tagMap.get(key);
      entry.trainers.push({ id: trainer.id, name: trainer.name, icon: trainer.icon });
    });
  });

  const allWeak = Array.from(tagMap.values())
    .sort((a, b) => b.score - a.score || b.wrong - a.wrong)
    .slice(0, 15);

  if (allWeak.length === 0) {
    container.innerHTML = '<p class="narrative">No weak tags detected yet. Do more sessions to see diagnostics.</p>';
    return;
  }

  container.innerHTML = allWeak.map(w => `
    <div class="weak-row">
      <div class="weak-main">
        <span class="weak-tag-large">${escapeHtml(w.tag)}</span>
        <span class="weak-trainers">${w.trainers.map(t => `${t.icon} ${escapeHtml(t.name)}`).join(" · ")}</span>
      </div>
      <div class="weak-stats">
        <span class="wrong">${w.wrong} wrong / ${w.total} total</span>
        <span class="score">${Math.round(w.score * 100)}% error rate</span>
      </div>
    </div>
  `).join("");
}

// Data tools
function exportAll() {
  const all = {};
  TRAINERS.forEach(trainer => {
    const state = loadTrainerState(trainer.id);
    if (state) all[trainer.id] = state;
  });
  const kernel = window.PlataKernel;
  const payload = {
    exportedAt: new Date().toISOString(),
    schemaVersion: kernel.schemaVersion,
    trainers: all
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `plata-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importAll() {
  const input = $("#import-file");
  input.click();
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const payload = JSON.parse(e.target.result);
        const kernel = window.PlataKernel;
        const statusEl = $("#import-status");
        let imported = 0;
        let skipped = 0;

        if (payload.trainers && typeof payload.trainers === "object") {
          Object.entries(payload.trainers).forEach(([trainerId, state]) => {
            try {
              const handle = kernel.createTrainerState({ trainerId });
              const importedState = kernel.importState(state, trainerId);
              handle.replace(importedState);
              imported++;
            } catch (err) {
              console.warn("Import failed for", trainerId, err);
              skipped++;
            }
          });
        }

        statusEl.textContent = `Imported ${imported} trainer state(s)${skipped ? `, skipped ${skipped}` : ""}. Refresh to see changes.`;
        statusEl.style.color = "var(--forest)";
        setTimeout(() => { statusEl.textContent = ""; }, 5000);
      } catch (err) {
        $("#import-status").textContent = "Invalid JSON: " + err.message;
        $("#import-status").style.color = "var(--ember)";
      }
    };
    reader.readAsText(file);
  };
}

// Init
function init() {
  renderTrainerCards();
  renderDueCards();
  renderWeakList();

  $("#export-all")?.addEventListener("click", exportAll);
  $("#import-trigger")?.addEventListener("click", importAll);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
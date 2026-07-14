/* Platå shared dashboard helpers v1 */
(function (root) {
  "use strict";

  function pct(value) {
    return value === null || value === undefined ? "—" : String(value) + "%";
  }

  function statsView(state) {
    var k = root.PlataKernel;
    var stats = k.getStats(state);
    return {
      totalAttempts: String(stats.totalAttempts),
      totalCorrect: String(stats.totalCorrect),
      accuracy: pct(stats.accuracyPct),
      mastered: String(stats.masteredCount),
      today: String(stats.todayCount),
      due: String(stats.dueCount),
      streak: String(stats.currentStreak),
      longestStreak: String(stats.longestStreak)
    };
  }

  function gateText(gate) {
    return gate.name + ": " + gate.total + "/" + gate.minAttempts + " svar · " + gate.accuracyPct + "% rigtige · " + (gate.ready ? "klar" : "fortsæt lidt endnu");
  }

  function m0ProgressText(state) {
    var k = root.PlataKernel;
    if (!k || !k.computeGate) return "Fremskridt er ikke tilgængelige lige nu";
    var verbs = k.computeGate(state, { name: "Verber", tags: ["verber"], mode: "verber", minAttempts: 100, minAccuracy: 0.8 });
    var nouns = k.computeGate(state, { name: "Substantiver", tags: ["substantiver"], mode: "substantiver", minAttempts: 100, minAccuracy: 0.9 });
    return gateText(verbs) + " · " + gateText(nouns) + " · Du vurderer selv dine skriftlige svar";
  }

  function weakTagsText(weakTags) {
    if (!weakTags || weakTags.length === 0) return "Weak tags: none yet";
    return "Weak tags: " + weakTags.map(function (tag) {
      return tag.tag + " (" + tag.wrong + "/" + tag.total + ")";
    }).join(", ");
  }

  root.PlataDashboard = {
    statsView: statsView,
    gateText: gateText,
    m0ProgressText: m0ProgressText,
    weakTagsText: weakTagsText
  };
})(typeof window !== "undefined" ? window : globalThis);

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
      streak: String(stats.currentStreak),
      longestStreak: String(stats.longestStreak)
    };
  }

  function gateText(gate) {
    return gate.name + ": " + gate.total + "/" + gate.minAttempts + " attempts · " + gate.accuracyPct + "% · " + (gate.ready ? "ready" : "not ready");
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
    weakTagsText: weakTagsText
  };
})(typeof window !== "undefined" ? window : globalThis);

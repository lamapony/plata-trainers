window.PLATA_LESSON_01 = {
  id: "lesson-01-arrival",
  title: "The First Morning in Copenhagen",
  subtitle: "A compact interactive Danish episode for your first 40 minutes in the city.",
  estimatedMinutes: 10,
  completeTitle: "You survived the first morning.",
  completeText: "You can greet someone, introduce yourself, thank them, and escape through the right Copenhagen door. The next lesson can now make word order matter.",
  pattern: {
    name: "scene-pressure-language-payoff",
    description: "Each scene has a real-world pressure, one useful Danish pattern, a tiny action, and a payoff that changes the situation.",
    beats: ["pressure", "notice", "act", "feedback", "carry-forward"]
  },
  scenes: [
    {
      id: "arrival-udgang",
      type: "choice",
      eyebrow: "Scene 1 · Arrival",
      title: "The city starts with two almost identical doors.",
      pressure: "You are tired, the phone battery is red, and the crowd is moving faster than you can read.",
      narrative: "The automatic doors open. Above you: Velkommen til København. Lene does not translate everything. She points at two signs and says: Find udgangen — we need the way out.",
      dialogue: [
        { speaker: "Lene", line: "Velkommen til København. Vi skal ud." },
        { speaker: "You", line: "Ud...?" }
      ],
      notice: "Ind is like in. Ud is out. Danish signage often hides the clue in the first syllable.",
      prompt: "Choose the sign that gets you out into the city.",
      danish: "Velkommen til København · Find udgangen",
      options: [
        { id: "indgang", label: "Indgang", detail: "entrance · in", correct: false, feedback: "You step toward the entrance stream and immediately feel the flow pushing against you. Ind = in. Useful, but not now." },
        { id: "udgang", label: "Udgang", detail: "exit · out", correct: true, feedback: "Correct. Ud = out. You are outside the terminal before the phone drops another percent." }
      ],
      carry: "Carry-forward words: velkommen, København, skal, find, udgangen, indgang, udgang. The ind/ud compass and the verb skal (must/need) appear again at the hostel and on every Copenhagen sign.",
      tags: ["signage", "udgang", "survival", "morphology-clue", "velkommen", "København", "skal", "find", "indgang"]
    },
    {
      id: "meet-lene",
      type: "input",
      eyebrow: "Scene 2 · Lene",
      title: "A sentence short enough to use before courage evaporates.",
      pressure: "Lene has helped you. Now she waits. Silence would be socially stranger than a rough Danish sentence.",
      narrative: "She slows down, but not into textbook voice. Jeg hedder Lene. Hvad hedder du? You recognise the shape: she gives her name, then asks for yours.",
      dialogue: [
        { speaker: "Lene", line: "Jeg hedder Lene. Hvad hedder du?" },
        { speaker: "You", line: "..." }
      ],
      notice: "Do not build a grammar table. For now, one chunk is enough: jeg hedder + name.",
      prompt: "Answer with one full Danish sentence.",
      danish: "Jeg hedder Lene. Hvad hedder du?",
      placeholder: "Jeg hedder ...",
      acceptPrefix: "jeg hedder ",
      success: "That works. A real person now has your name in Danish. The chunk is yours: jeg hedder + name.",
      failure: "Start with the whole chunk: Jeg hedder — then your name. No extra mig needed.",
      carry: "Carry-forward pattern: jeg hedder + name. The question hvad hedder du? returns in Scene 6. The words jeg, hedder, hvad, du are your new social toolkit.",
      tags: ["greeting", "identity", "jeg-hedder", "formulaic-language", "hvad", "du"]
    },
    {
      id: "doors-match",
      type: "match",
      eyebrow: "Scene 3 · Door logic",
      title: "The first win was luck. The second one should be memory.",
      pressure: "A café door near the station has both signs. If you choose wrong, you walk into people again.",
      narrative: "Lene stops you before the door. Same root, opposite direction. You are not memorising two words; you are learning the small Danish compass: ind / ud.",
      dialogue: [
        { speaker: "Lene", line: "Indgang. Udgang. Hvad er hvad?" }
      ],
      notice: "Look at the front: ind → into; ud → out of. The ending -gang is the going/passage part.",
      prompt: "Pair the sign with its job.",
      pairs: [
        { id: "indgang", left: "Indgang", right: "Entrance" },
        { id: "udgang", left: "Udgang", right: "Exit" }
      ],
      carry: "Carry-forward contrast: indgang / udgang and ind / ud. The root gang (passage) + direction prefix is a pattern you will see everywhere: indgang, udgang, opgang, nedgang.",
      tags: ["signage", "indgang", "udgang", "contrast-pair", "ind", "ud", "gang"]
    },
    {
      id: "tak-chain",
      type: "choice",
      eyebrow: "Scene 4 · The paper ticket",
      title: "The useful word is not impressive. It is social glue.",
      pressure: "Lene writes your hostel stop on the back of a receipt. She has done more than a stranger had to do.",
      narrative: "She hands it over: Her er adressen. The Danish you need now is not clever. It is the word that keeps the exchange warm.",
      dialogue: [
        { speaker: "Lene", line: "Her er adressen." },
        { speaker: "You", line: "..." }
      ],
      notice: "Tak is high-frequency because Denmark runs on small polite acknowledgements, not dramatic gratitude speeches.",
      prompt: "What do you say?",
      danish: "Her er adressen.",
      options: [
        { id: "tak", label: "Tak", detail: "thanks", correct: true, feedback: "Exactly. One syllable, correct temperature. The interaction stays human." },
        { id: "hej", label: "Hej", detail: "hi / bye", correct: false, feedback: "Hej can close a meeting, but here it sounds like you are escaping with the receipt." },
        { id: "nej", label: "Nej", detail: "no", correct: false, feedback: "That would reject the help. The scene needs acknowledgement, not refusal." }
      ],
      carry: "Carry-forward word: tak. Also her, er, adressen — the framework for 'here is [thing]' returns when you check in. Tak loops back immediately as Selv tak in the next scene.",
      tags: ["courtesy", "tak", "social-language", "her", "er", "adressen"]
    },
    {
      id: "selv-tak",
      type: "choice",
      eyebrow: "Scene 5 · The return serve",
      title: "Danish politeness has a ping-pong rhythm.",
      pressure: "You thank Lene. She smiles and says Tak — for trying Danish instead of switching to English. Now the ball is back on your side.",
      narrative: "The trap: repeating tak works sometimes, but the natural response here is a compact return phrase. Selv tak. Literally strange, socially normal.",
      dialogue: [
        { speaker: "Lene", line: "Tak fordi du prøver på dansk." },
        { speaker: "You", line: "..." }
      ],
      notice: "Selv tak is not built word-by-word in your head. Store it as one social reflex.",
      prompt: "Choose the answer that keeps the exchange natural.",
      danish: "Tak fordi du prøver på dansk.",
      options: [
        { id: "selv-tak", label: "Selv tak", detail: "you're welcome / thanks back", correct: true, feedback: "Yes. You returned the serve. The phrase is odd if translated, but perfect in the scene." },
        { id: "udgang", label: "Udgang", detail: "exit", correct: false, feedback: "A heroic exit word, but this is not a door anymore. This is a social loop." },
        { id: "reservation", label: "Reservation", detail: "reservation", correct: false, feedback: "Useful at the hostel. Too early in the script." }
      ],
      carry: "Carry-forward phrase: selv tak. The words fordi, prøver, på, dansk appear in Lene's line — they are the anatomy of praise you will hear again. Udgang and reservation are distractors (not learning targets).",
      tags: ["courtesy", "selv-tak", "chunk", "fordi", "prøver", "dansk", "på"]
    },
    {
      id: "roommate-payoff",
      type: "completion",
      eyebrow: "Final · Room 204",
      title: "The same sentence returns without the safety net.",
      pressure: "At the hostel, Lene is gone. A roommate looks up from the lower bunk. This is the first moment where Danish has to come from you.",
      narrative: "Anders says exactly what you heard earlier, but now there is no explanation attached: Hej! Jeg hedder Anders. Hvad hedder du?",
      dialogue: [
        { speaker: "Anders", line: "Hej! Jeg hedder Anders. Hvad hedder du?" },
        { speaker: "You", line: "Hej, jeg hedder ..." }
      ],
      notice: "This is the lesson pattern closing: the phrase appeared as input, then as memory, now as social action.",
      prompt: "Complete the sentence you can now actually use.",
      prefix: "Hej, jeg hedder",
      placeholder: "your name",
      success: "You did not learn a list. You carried a sentence through the city and used it when it mattered.",
      failure: "Give Anders a name to answer with. Any name works.",
      carry: "Unlocked: greetings (hej), identity (jeg hedder + name), signage compass (indgang/udgang), politeness loop (tak/selv tak), question frame (hvad hedder du?). The words jeg, hedder, hvad, du, Anders, hej are now yours in the wild.",
      tags: ["greeting", "identity", "payoff", "retrieval", "hej", "jeg", "hedder", "hvad", "du", "Anders"]
    }
  ]
};

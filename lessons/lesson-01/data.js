window.PLATA_LESSON_01 = {
  id: "lesson-01-arrival",
  title: "The First Morning in Copenhagen",
  subtitle: "A tiny interactive Danish episode for your first 40 minutes in the city.",
  estimatedMinutes: 8,
  scenes: [
    {
      id: "arrival-udgang",
      type: "choice",
      eyebrow: "Scene 1 · Arrival",
      title: "Your phone is at 7%. Copenhagen is already speaking Danish.",
      narrative: "The doors open. A warm sign says: Velkommen til København. Lene points at two signs and waits. You need the way out into the city.",
      prompt: "Which sign gets you out?",
      danish: "Velkommen til København",
      options: [
        { id: "indgang", label: "Indgang", detail: "entrance", correct: false, feedback: "Close, but ind means in. You just walked toward the entrance." },
        { id: "udgang", label: "Udgang", detail: "exit", correct: true, feedback: "Yes. Ud means out. Udgang is the exit." }
      ],
      tags: ["signage", "udgang", "survival"]
    },
    {
      id: "meet-lene",
      type: "input",
      eyebrow: "Scene 2 · Lene",
      title: "A local rescues you from terminal confusion.",
      narrative: "She smiles, slow enough for you to catch it: Jeg hedder Lene. Hvad hedder du?",
      prompt: "Answer with one full Danish sentence.",
      danish: "Jeg hedder Lene. Hvad hedder du?",
      placeholder: "Jeg hedder ...",
      acceptPrefix: "jeg hedder ",
      success: "Good. No grammar lecture needed: jeg hedder + name is enough.",
      failure: "Start with: Jeg hedder — then your name.",
      tags: ["greeting", "identity", "jeg-hedder"]
    },
    {
      id: "doors-match",
      type: "match",
      eyebrow: "Scene 3 · Two doors",
      title: "The city keeps testing you with very polite signs.",
      narrative: "Before you leave, Lene makes you prove you can read the two words that matter most in a building.",
      prompt: "Match each Danish sign to the meaning.",
      pairs: [
        { id: "indgang", left: "Indgang", right: "Entrance" },
        { id: "udgang", left: "Udgang", right: "Exit" }
      ],
      tags: ["signage", "indgang", "udgang"]
    },
    {
      id: "tak-chain",
      type: "choice",
      eyebrow: "Scene 4 · Courtesy chain",
      title: "Lene writes your hostel stop on a paper ticket.",
      narrative: "She hands it over. There is one tiny Danish word that makes the whole interaction human.",
      prompt: "What do you say?",
      danish: "Her er adressen.",
      options: [
        { id: "tak", label: "Tak", detail: "thanks", correct: true, feedback: "Exactly. Tak is small, but it opens doors." },
        { id: "hej", label: "Hej", detail: "hi / bye", correct: false, feedback: "Hej works for greeting or goodbye. Here you need thanks." },
        { id: "nej", label: "Nej", detail: "no", correct: false, feedback: "That would sound like you refuse the help. Try gratitude." }
      ],
      tags: ["courtesy", "tak"]
    },
    {
      id: "selv-tak",
      type: "choice",
      eyebrow: "Scene 5 · Social reflex",
      title: "Now Lene thanks you for trying Danish instead of hiding in English.",
      narrative: "Lene says: Tak. You need the small Danish response that means: you are welcome / thanks back.",
      prompt: "Choose the natural answer.",
      danish: "Tak.",
      options: [
        { id: "selv-tak", label: "Selv tak", detail: "you’re welcome", correct: true, feedback: "Yes. Selv tak is the social ping-pong return." },
        { id: "udgang", label: "Udgang", detail: "exit", correct: false, feedback: "Useful word, wrong moment. This is a courtesy exchange." },
        { id: "reservation", label: "Reservation", detail: "reservation", correct: false, feedback: "You will need that later. Right now Lene said tak." }
      ],
      tags: ["courtesy", "selv-tak"]
    },
    {
      id: "roommate-payoff",
      type: "completion",
      eyebrow: "Final · Room 204",
      title: "The first Danish sentence is now yours.",
      narrative: "At the hostel, Anders looks up from the bunk bed: Hej! Jeg hedder Anders. Hvad hedder du?",
      prompt: "Complete the sentence you can now actually use.",
      prefix: "Hej, jeg hedder",
      placeholder: "your name",
      success: "You survived the first morning. Next time: coffee, tickets, and word order with consequences.",
      tags: ["greeting", "identity", "payoff"]
    }
  ]
};

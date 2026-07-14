window.PLATA_LESSON_01 = {
  id: "lesson-01-arrival",
  contentVersion: 2,
  level: "A0/A1",
  qualityTier: "starter",
  title: "Your first five minutes in Danish",
  subtitle: "Find the exit, introduce yourself, and handle a small polite exchange without switching languages.",
  estimatedMinutes: 10,
  completeTitle: "You have four phrases you can use today.",
  completeText: "You can read ind/ud signs, say your name, thank someone, and answer Selv tak when the thanks comes back.",
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
      title: "Find the exit from one familiar-looking clue.",
      pressure: "You have just arrived. The station shows two signs: Indgang and Udgang.",
      narrative: "Lene points toward the doors and says: Find udgangen. You only need to recognise the direction word.",
      dialogue: [
        { speaker: "Lene", line: "Velkommen til København. Vi skal ud." },
        { speaker: "You", line: "Ud...?" }
      ],
      notice: "Ind means in. Ud means out. The rest of the word is the same.",
      prompt: "Choose the sign that gets you out into the city.",
      danish: "Velkommen til København · Find udgangen",
      options: [
        { id: "indgang", label: "Indgang", detail: "entrance · in", correct: false, feedback: "Indgang is where people enter. Look for ud when you need to go out." },
        { id: "udgang", label: "Udgang", detail: "exit · out", correct: true, feedback: "Correct. Ud means out, so Udgang is the exit." }
      ],
      carry: "Remember the pair, not two separate words: ind = in, ud = out.",
      tags: ["signage", "udgang", "survival", "morphology-clue", "velkommen", "København", "skal", "find", "indgang"],
      masteryTags: ["signage-direction"]
    },
    {
      id: "meet-lene",
      type: "input",
      eyebrow: "Scene 2 · Lene",
      title: "Answer the first question people ask.",
      pressure: "Lene introduces herself and asks your name.",
      narrative: "She says the answer pattern before the question: Jeg hedder Lene. Hvad hedder du?",
      dialogue: [
        { speaker: "Lene", line: "Jeg hedder Lene. Hvad hedder du?" },
        { speaker: "You", line: "..." }
      ],
      notice: "Use the whole phrase as one unit: Jeg hedder + your name.",
      prompt: "Answer with one full Danish sentence.",
      danish: "Jeg hedder Lene. Hvad hedder du?",
      placeholder: "Jeg hedder ...",
      acceptPrefix: "jeg hedder ",
      success: "That works. You answered with a complete Danish sentence: Jeg hedder + your name.",
      failure: "Start with the whole chunk: Jeg hedder — then your name. No extra mig needed.",
      carry: "You will use Jeg hedder … again at the end, with a different person.",
      tags: ["greeting", "identity", "jeg-hedder", "formulaic-language", "hvad", "du"],
      masteryTags: ["identity-chunk"]
    },
    {
      id: "doors-match",
      type: "match",
      eyebrow: "Scene 3 · One more door",
      title: "Check that the contrast has stuck.",
      pressure: "A café near the station marks both sides of the door.",
      narrative: "The ending stays the same. The beginning tells you whether people are going in or out.",
      dialogue: [
        { speaker: "Lene", line: "Indgang. Udgang. Hvad er hvad?" }
      ],
      notice: "Look at the front: ind → into; ud → out of. The ending -gang is the going/passage part.",
      prompt: "Pair the sign with its job.",
      pairs: [
        { id: "indgang", left: "Indgang", right: "Entrance" },
        { id: "udgang", left: "Udgang", right: "Exit" }
      ],
      carry: "The same direction words appear in other compounds, so ind/ud will keep paying off.",
      tags: ["signage", "indgang", "udgang", "contrast-pair", "ind", "ud", "gang"],
      masteryTags: ["signage-direction"]
    },
    {
      id: "tak-chain",
      type: "choice",
      eyebrow: "Scene 4 · A small favour",
      title: "Thank someone at the right moment.",
      pressure: "Lene writes your hostel address on a receipt and hands it to you.",
      narrative: "She says: Her er adressen. Choose the response that acknowledges the help.",
      dialogue: [
        { speaker: "Lene", line: "Her er adressen." },
        { speaker: "You", line: "..." }
      ],
      notice: "Tak works on its own. You do not need a longer speech for a small favour.",
      prompt: "What do you say?",
      danish: "Her er adressen.",
      options: [
        { id: "tak", label: "Tak", detail: "thanks", correct: true, feedback: "Exactly. Tak is the natural response to a small piece of help." },
        { id: "hej", label: "Hej", detail: "hi / bye", correct: false, feedback: "Hej greets or says goodbye; it does not acknowledge the favour." },
        { id: "nej", label: "Nej", detail: "no", correct: false, feedback: "Nej sounds as if you are refusing the address." }
      ],
      carry: "Keep Tak ready: in the next exchange, the thanks will come toward you.",
      tags: ["courtesy", "tak", "social-language", "her", "er", "adressen"],
      masteryTags: ["courtesy-loop"]
    },
    {
      id: "selv-tak",
      type: "choice",
      eyebrow: "Scene 5 · When someone thanks you",
      title: "Learn the reply as one phrase.",
      pressure: "Lene thanks you for trying Danish.",
      narrative: "Selv tak is a common reply to thanks. Learn it as a fixed phrase rather than translating each word.",
      dialogue: [
        { speaker: "Lene", line: "Tak fordi du prøver på dansk." },
        { speaker: "You", line: "..." }
      ],
      notice: "Selv tak means roughly you're welcome or thanks to you too, depending on the moment.",
      prompt: "Choose the answer that keeps the exchange natural.",
      danish: "Tak fordi du prøver på dansk.",
      options: [
        { id: "selv-tak", label: "Selv tak", detail: "you're welcome / thanks to you too", correct: true, feedback: "Yes. Selv tak completes this exchange naturally." },
        { id: "udgang", label: "Tak", detail: "thanks", correct: false, feedback: "Repeating Tak is understandable, but Selv tak is the more useful reply to learn here." },
        { id: "reservation", label: "I lige måde", detail: "likewise", correct: false, feedback: "I lige måde works for wishes such as God weekend, not as the usual reply to Tak." }
      ],
      carry: "You now have both sides of the exchange: Tak → Selv tak.",
      tags: ["courtesy", "selv-tak", "chunk", "fordi", "prøver", "dansk", "på"],
      masteryTags: ["courtesy-loop"]
    },
    {
      id: "roommate-payoff",
      type: "completion",
      eyebrow: "Final · Room 204",
      title: "Introduce yourself to a new person.",
      pressure: "At the hostel, your roommate asks the same question Lene asked earlier.",
      narrative: "Anders says: Hej! Jeg hedder Anders. Hvad hedder du? This time the phrase has to come from you.",
      dialogue: [
        { speaker: "Anders", line: "Hej! Jeg hedder Anders. Hvad hedder du?" },
        { speaker: "You", line: "Hej, jeg hedder ..." }
      ],
      notice: "Add your name after Jeg hedder. Nothing else is required.",
      prompt: "Complete the sentence you can now actually use.",
      prefix: "Hej, jeg hedder",
      placeholder: "your name",
      success: "You introduced yourself in Danish. This exact sentence works with the next person too.",
      failure: "Give Anders a name to answer with. Any name works.",
      carry: "Today’s pocket set: Hej · Jeg hedder … · Tak · Selv tak · Indgang/Udgang.",
      tags: ["greeting", "identity", "payoff", "retrieval", "hej", "jeg", "hedder", "hvad", "du", "Anders"],
      masteryTags: ["identity-chunk"]
    }
  ],
  masteryMap: {
    "signage-direction": {
      competencyId: "process-control",
      label: "Read signage direction",
      evidence: "The learner can read Indgang/Udgang signs to navigate a Copenhagen station.",
      remediation: {
        sceneId: "doors-match",
        cta: "Review door signs",
        action: "Rerun the door matching exercise and pay attention to the prefix ind (in) vs ud (out)."
      },
      sourceRefs: ["Københavns Hovedbanegård skiltning"]
    },
    "identity-chunk": {
      competencyId: "agency",
      label: "Introduce yourself",
      evidence: "The learner can introduce themselves using standard Danish formulaic chunks.",
      remediation: {
        sceneId: "meet-lene",
        cta: "Introduce yourself",
        action: "Rerun the introduction exercise and use 'Jeg hedder' followed by your name."
      },
      sourceRefs: ["Dansk udtale og basisfraser"]
    },
    "courtesy-loop": {
      competencyId: "register-control",
      label: "Reply to thanks",
      evidence: "The learner can close politeness loops with Tak and Selv tak.",
      remediation: {
        sceneId: "selv-tak",
        cta: "Practise selv tak",
        action: "Rerun the return-serve dialogue and choose the Selv tak response."
      },
      sourceRefs: ["Københavnsk høflighedskontekst"]
    }
  },
  simulation: {
    expectedEndingId: null,
    paths: [
      {
        id: "survives-morning",
        expectedEndingId: null,
        expectedCorrect: 6,
        expectedWeakMastery: [],
        actions: [
          { sceneId: "arrival-udgang", optionId: "udgang", expectCorrect: true },
          { sceneId: "meet-lene", answer: "Jeg hedder Maria", expectCorrect: true },
          { sceneId: "doors-match", matchAll: true },
          { sceneId: "tak-chain", optionId: "tak", expectCorrect: true },
          { sceneId: "selv-tak", optionId: "selv-tak", expectCorrect: true },
          { sceneId: "roommate-payoff", answer: "Maria", expectCorrect: true }
        ]
      },
      {
        id: "socially-lost",
        expectedEndingId: null,
        expectedCorrect: 3,
        expectedWeakMastery: ["signage-direction", "courtesy-loop"],
        actions: [
          { sceneId: "arrival-udgang", optionId: "indgang", expectCorrect: false },
          { sceneId: "meet-lene", answer: "Jeg hedder Maria", expectCorrect: true },
          { sceneId: "doors-match", matchAll: true },
          { sceneId: "tak-chain", optionId: "hej", expectCorrect: false },
          { sceneId: "selv-tak", optionId: "udgang", expectCorrect: false },
          { sceneId: "roommate-payoff", answer: "Maria", expectCorrect: true }
        ]
      }
    ]
  }
};

/* Platå static trainer catalog */
(function (root) {
  "use strict";

  root.PlataCatalog = {
    trainers: [
      {
        id: "bojning",
        name: "Bøjning drill",
        type: "drill",
        path: "./bojning-drill/",
        description: "Type verb forms and noun inflections. Includes nutid, datid, førnutid, bestemt/ubestemt, ental/flertal.",
        icon: "📝",
        gallery: {
          tag: "A2 fundamentals",
          role: "repair",
          level: "A2",
          theme: "Form recall",
          estimatedMinutes: 8,
          repairs: "verb tenses · noun inflection",
          sequence: 1
        }
      },
      {
        id: "ordstilling",
        name: "Ordstilling drill",
        type: "drill",
        path: "./ordstilling-drill/",
        description: "Multiple-choice practice for V2, inversion, and ledsætninger with short explanations after each answer.",
        icon: "🔀",
        gallery: {
          tag: "Word order",
          role: "repair",
          level: "B1",
          theme: "Word order",
          estimatedMinutes: 8,
          repairs: "V2 · inversion · subordinate clauses",
          sequence: 2
        }
      },
      {
        id: "vocab",
        name: "Vocab SR",
        type: "drill",
        path: "./vocab-sr/",
        description: "Spaced-repetition vocabulary in Danish ↔ Russian, with aliases for common translation variants.",
        icon: "🗂️",
        gallery: {
          tag: "Vocabulary",
          role: "repair",
          level: "A2–B2",
          theme: "Retrieval",
          estimatedMinutes: 5,
          repairs: "recognition · recall gaps from scenes",
          sequence: 3
        }
      },
      {
        id: "lesson-01-arrival",
        name: "Lesson 01: The First Morning",
        type: "lesson",
        path: "./lessons/lesson-01/",
        lessonGlobal: "PLATA_LESSON_01",
        lessonDataPath: "./lessons/lesson-01/data.js",
        description: "Arrive in Copenhagen, meet Lene, read signs, and say your first useful Danish sentence. Exercises are embedded as story actions.",
        icon: "🌅",
        gallery: {
          tag: "Narrative A0/A1",
          level: "A0/A1",
          theme: "First arrival",
          status: "starter",
          estimatedMinutes: 10,
          signalFamily: "signage · identity · courtesy",
          outcomes: [
            "Read ind/ud signage under arrival pressure",
            "Introduce yourself with a usable chunk",
            "Close a courtesy loop with tak / selv tak"
          ],
          sequence: 1,
          featured: false
        }
      },
      {
        id: "lesson-b2-radiator-register",
        name: "Det afhænger af, hvordan du siger det",
        type: "lesson",
        path: "./lessons/lesson-b2-radiator/",
        lessonGlobal: "PLATA_LESSON_B2_RADIATOR",
        lessonDataPath: "./lessons/lesson-b2-radiator/data.js",
        description: "You know the words — but do you sound right? Register, modal particles, and social consequences when a repair goes wrong.",
        icon: "⚖️",
        gallery: {
          tag: "Narrative B2 · Register",
          level: "B2",
          theme: "Register & tone",
          status: "gold",
          estimatedMinutes: 14,
          signalFamily: "passive agency · particles · register",
          outcomes: [
            "Spot passive promises that hide who acts",
            "Read modal particles as social stance",
            "Transfer tone across email, chat, and workplace"
          ],
          sequence: 2,
          featured: false
        }
      },
      {
        id: "lesson-b2-job-followup",
        name: "Efter interviews — tone, tak, og tålmodighed",
        type: "lesson",
        path: "./lessons/lesson-b2-job-followup/",
        lessonGlobal: "PLATA_LESSON_B2_JOB_FOLLOWUP",
        lessonDataPath: "./lessons/lesson-b2-job-followup/data.js",
        description: "Nailed the interview. Now the silence starts. Post-interview follow-up, LinkedIn tone, and sounding like a future colleague.",
        icon: "💼",
        gallery: {
          tag: "Narrative B2 · Professional",
          level: "B2",
          theme: "Professional follow-up",
          status: "gold",
          estimatedMinutes: 15,
          signalFamily: "timing · formal warmth · platform register",
          outcomes: [
            "Follow up after silence without sounding desperate",
            "Shift register between email and LinkedIn",
            "Keep agency while sounding patient"
          ],
          sequence: 3,
          featured: true
        }
      },
      {
        id: "lesson-b2-ordstilling",
        name: "Hvem gør hvad — ordstilling i praksis",
        type: "lesson",
        path: "./lessons/lesson-b2-ordstilling/",
        lessonGlobal: "PLATA_LESSON_B2_ORDSTILLING",
        lessonDataPath: "./lessons/lesson-b2-ordstilling/data.js",
        description: "Learn Danish word order through a conference narrative: V2, inversion after fronted adverbials, and the difference between fordi and derfor clause structure.",
        icon: "🔀",
        gallery: {
          tag: "Narrative B1/B2 · Word order",
          level: "B1/B2",
          theme: "Ordstilling in context",
          status: "gold",
          estimatedMinutes: 14,
          signalFamily: "V2 · inversion · clause structure",
          outcomes: [
            "Apply inversion after fronted time and place adverbials",
            "Distinguish fordi + subordinate clause from derfor + inversion",
            "Transfer correct word order across email, chat, and spoken Danish"
          ],
          sequence: 4,
          featured: false
        }
      }
    ]
  };
})(typeof window !== "undefined" ? window : globalThis);

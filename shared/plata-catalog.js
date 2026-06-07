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
        lessonGlobal: "PLATA_LESSON_B2_RADIATOR",
        lessonDataPath: "./lessons/lesson-b2-radiator/data.js",
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
    ]
  };
})(typeof window !== "undefined" ? window : globalThis);

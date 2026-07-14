/* Platå static trainer catalog */
(function (root) {
  "use strict";

  function buildDrillAction(signalTag, sourceTrainerId, drill, repairs) {
    if (sourceTrainerId === "lesson-a2-doctor" && drill && drill.id === "skrive") {
      var spokenToWritten = {
        "symptom-duration": "You missed duration in the apotek scene (i to dage / siden i går). Transfer that reflex to patientportalen: write a clear timeline before symptoms blur together.",
        "symptom-severity": "You missed severity calibration (lidt / ret) in the apotek scene. In writing, name how strong symptoms feel — without drama or vague 'ikke så godt'.",
        "concrete-next-step": "You missed the next step in the apotek scene. End the patientportal message with what you need from lægen or what you will do."
      };
      if (spokenToWritten[signalTag]) return spokenToWritten[signalTag];
      return "Match → Gym: transfer what you missed at apotek into written Danish in patientportalen — same competency, new channel.";
    }
    if (repairs) {
      return "You missed this in a story. Repair the reflex with a short drill: " + repairs + ".";
    }
    return "You missed this in a story. A short drill session repairs the reflex faster than rereading the scene.";
  }

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
          repairs: "verb tenses · noun inflection · common-gender · irregular plural · strong past",
          repairSignals: [
            "common-gender-noun",
            "irregular-plural-noun",
            "strong-verb-past"
          ],
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
          repairSignals: [
            "inversion-fronted-adverbial",
            "v2-placement",
            "fordi-derfor-clause",
            "ordstilling-principle"
          ],
          sequence: 2
        }
      },
      {
        id: "register",
        name: "Register drill",
        type: "drill",
        path: "./register-drill/",
        description: "Practise clear professional Danish: read vague official replies, choose the right tone for each channel, and follow up without sounding harsh.",
        icon: "✉️",
        gallery: {
          tag: "B2 register",
          role: "repair",
          level: "B2",
          theme: "Public-service & workplace Danish",
          estimatedMinutes: 8,
          repairs: "vague promises · channel tone · deadlines · polite follow-up",
          repairSignals: [
            "passive-agency",
            "formal-register-control",
            "understatement-with-agency",
            "consequence-aware-tone",
            "agency-without-pressure",
            "concrete-next-step",
            "context-reading",
            "professional-email-agency",
            "platform-register-shift"
          ],
          sequence: 3
        }
      },
      {
        id: "vocab",
        name: "Vocab SR (DA↔RU)",
        type: "drill",
        path: "./vocab-sr/",
        description: "Optional Russian-speaker trainer: spaced-repetition vocabulary Danish ↔ Russian. Not part of the English flagship path.",
        icon: "🗂️",
        gallery: {
          tag: "Russian trainer",
          role: "optional",
          level: "A2–B2",
          theme: "DA ↔ RU retrieval",
          estimatedMinutes: 5,
          repairs: "optional vocabulary for Russian speakers",
          repairSignals: [],
          sequence: 90
        }
      },
      {
        id: "skrive",
        name: "Skriveøvelser",
        type: "drill",
        path: "./skrive-drill/",
        description: "Short written production prompts with a self-grade rubric — practice register and agency under real channels.",
        icon: "✍️",
        gallery: {
          tag: "Written production",
          role: "repair",
          level: "B1–B2",
          theme: "Skrive under rubric",
          estimatedMinutes: 10,
          repairs: "email · bolig · arbejde · sundhed · self-grade rubric",
          repairSignals: ["symptom-duration", "symptom-severity", "concrete-next-step"],
          sequence: 5
        }
      },
      {
        id: "lesson-01-arrival",
        name: "Your first five minutes in Danish",
        type: "lesson",
        path: "./lessons/lesson-01/",
        lessonGlobal: "PLATA_LESSON_01",
        lessonDataPath: "./lessons/lesson-01/data.js",
        description: "Read ind/ud signs, introduce yourself, and handle a small Tak / Selv tak exchange.",
        icon: "🌅",
        gallery: {
          tag: "Optional tutorial",
          level: "A0/A1",
          theme: "First useful phrases",
          status: "starter",
          estimatedMinutes: 10,
          signalFamily: "signage · identity · courtesy",
          outcomes: [
            "Read ind/ud signage under arrival pressure",
            "Introduce yourself with a usable chunk",
            "Close a courtesy loop with tak / selv tak"
          ],
          sequence: 99,
          featured: false
        }
      },
      {
        id: "lesson-a2-doctor",
        name: "Explain your symptoms clearly",
        type: "lesson",
        path: "./lessons/lesson-a2-doctor/",
        lessonGlobal: "PLATA_LESSON_A2_DOCTOR",
        lessonDataPath: "./lessons/lesson-a2-doctor/data.js",
        description: "Tell a pharmacist what hurts, how long it has lasted, and what you need to know next.",
        icon: "🩺",
        gallery: {
          tag: "A2 everyday health",
          level: "A2",
          status: "gold",
          signalFamily: "symptom-duration · severity · clarification",
          estimatedMinutes: 12,
          outcomes: [
            "State duration with i to dage and siden i går",
            "Calibrate lidt, ret, and meget without drama",
            "Ask what to do next or whether to contact your doctor"
          ],
          sequence: 2,
          featured: false
        }
      },
      {
        id: "lesson-b2-radiator-register",
        name: "Get a concrete repair date",
        type: "lesson",
        path: "./lessons/lesson-b2-radiator/",
        lessonGlobal: "PLATA_LESSON_B2_RADIATOR",
        lessonDataPath: "./lessons/lesson-b2-radiator/data.js",
        description: "Read a vague landlord reply, follow up with facts, call for an appointment, and confirm the visit.",
        icon: "⚖️",
        gallery: {
          tag: "Narrative B2 · Register",
          level: "B2",
          theme: "Repair follow-up",
          status: "gold",
          estimatedMinutes: 14,
          signalFamily: "passive wording · repair date · confirmation",
          outcomes: [
            "Separate a registered case from a booked repair",
            "Read modal particles as social stance",
            "Confirm a repair visit across email and phone"
          ],
          sequence: 3,
          featured: false
        }
      },
      {
        id: "lesson-b2-job-followup",
        name: "Follow up after a job interview",
        type: "lesson",
        path: "./lessons/lesson-b2-job-followup/",
        lessonGlobal: "PLATA_LESSON_B2_JOB_FOLLOWUP",
        lessonDataPath: "./lessons/lesson-b2-job-followup/data.js",
        description: "Use the employer's timeline, write a natural follow-up, answer a call request, and close the process well.",
        icon: "💼",
        gallery: {
          tag: "Narrative B2 · Professional",
          level: "B2",
          theme: "Professional follow-up",
          status: "gold",
          estimatedMinutes: 15,
          signalFamily: "timing · formal warmth · platform register",
          outcomes: [
            "Follow up after the date the employer actually gave",
            "Shift register between email and LinkedIn",
            "Respond professionally to either an invitation or a rejection"
          ],
          sequence: 1,
          featured: true
        }
      },
      {
        id: "lesson-b2-ordstilling",
        name: "Danish word order in a real workday",
        type: "lesson",
        path: "./lessons/lesson-b2-ordstilling/",
        lessonGlobal: "PLATA_LESSON_B2_ORDSTILLING",
        lessonDataPath: "./lessons/lesson-b2-ordstilling/data.js",
        description: "Practise V2, indirect questions, and fordi/derfor while arranging meetings and explaining changes.",
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
      },
      {
        id: "lesson-b1-bolig",
        name: "Report a problem after moving in",
        type: "lesson",
        path: "./lessons/lesson-b1-bolig/",
        lessonGlobal: "PLATA_LESSON_B1_BOLIG",
        lessonDataPath: "./lessons/lesson-b1-bolig/data.js",
        description: "Put a move-in defect on record, attach evidence, and ask the landlord to confirm it.",
        icon: "🏠",
        gallery: {
          tag: "B1 housing",
          level: "B1",
          status: "gold",
          signalFamily: "tenant-register",
          estimatedMinutes: 12,
          outcomes: [
            "Report a defect within the move-in period",
            "Separate the fact, evidence, and request",
            "Follow up until the landlord confirms receipt"
          ],
          sequence: 5,
          featured: false
        }
      },
      {
        id: "lesson-b1-borgerservice",
        name: "Book help with MitID",
        type: "lesson",
        path: "./lessons/lesson-b1-borgerservice/",
        lessonGlobal: "PLATA_LESSON_B1_BORGERSERVICE",
        lessonDataPath: "./lessons/lesson-b1-borgerservice/data.js",
        description: "Explain the MitID help you need, ask what identification to bring, and find an available appointment.",
        icon: "🏛",
        gallery: {
          tag: "B1 public service",
          level: "B1",
          status: "gold",
          signalFamily: "polite-persistence · system-navigation · register-control",
          estimatedMinutes: 14,
          outcomes: [
            "Name the exact MitID service you need",
            "Ask which identification to bring",
            "Search another location or date when the first is full"
          ],
          sequence: 6,
          featured: false
        }
      }
    ],
    drillForSignal: function (signalTag) {
      if (!signalTag) return null;
      for (var i = 0; i < this.trainers.length; i++) {
        var trainer = this.trainers[i];
        if (trainer.type !== "drill") continue;
        var signals = trainer.gallery && trainer.gallery.repairSignals;
        if (Array.isArray(signals) && signals.indexOf(signalTag) !== -1) return trainer;
      }
      return null;
    },
    drillRepairLink: function (drill, signalTag, sourceTrainerId, linkOptions) {
      if (!drill || !drill.path) return "";
      var href = drill.path;
      var params = [];
      if (signalTag) params.push("signal=" + encodeURIComponent(signalTag));
      if (sourceTrainerId) params.push("from=" + encodeURIComponent(sourceTrainerId));
      if (linkOptions && linkOptions.cat) params.push("cat=" + encodeURIComponent(linkOptions.cat));
      if (!params.length) return href;
      var joiner = href.indexOf("?") === -1 ? "?" : "&";
      return href + joiner + params.join("&");
    },
    vocabScenesByLesson: {},
    vocabFocusForScene: function (lessonId, sceneId) {
      if (!lessonId || !sceneId) return null;
      var lesson = this.vocabScenesByLesson && this.vocabScenesByLesson[lessonId];
      if (!lesson) return null;
      return lesson[sceneId] || null;
    },
    vocabRepairLink: function (sourceLessonId, sceneId) {
      if (!sourceLessonId) return "";
      var href = "./vocab-sr/";
      var params = ["from=" + encodeURIComponent(sourceLessonId)];
      if (sceneId) params.push("scene=" + encodeURIComponent(sceneId));
      return href + "?" + params.join("&");
    },
    vocabRemediation: function () {
      // Flagship path is English-first; DA↔RU vocab is optional and never auto-prescribed.
      return null;
    },
    buildVocabRemediation: function () {
      return null;
    },
    lessonPathById: function (lessonId) {
      if (!lessonId) return "";
      for (var i = 0; i < this.trainers.length; i++) {
        var trainer = this.trainers[i];
        if (trainer.id === lessonId && trainer.path) return trainer.path;
      }
      return "";
    },
    drillRemediation: function (signalTag, sourceTrainerId) {
      var drill = this.drillForSignal(signalTag);
      if (!drill) return null;
      var repairs = drill.gallery && drill.gallery.repairs ? drill.gallery.repairs : "";
      var deadlineSignals = {
        "consequence-aware-tone": true,
        "professional-email-agency": true,
        "concrete-next-step": true
      };
      var channelSignals = {
        "formal-register-control": true,
        "platform-register-shift": true,
        "understatement-with-agency": true
      };
      var ordstillingCatMap = {
        "v2-placement": "v2",
        "inversion-fronted-adverbial": "inversion",
        "fordi-derfor-clause": "ledsaetning",
        "ordstilling-principle": "blandet"
      };
      var bojningTrapMap = {
        "common-gender-noun": "common-gender",
        "irregular-plural-noun": "irregular-plural",
        "strong-verb-past": "strong-verb"
      };
      var linkOptions = null;
      if (drill.id === "register") {
        if (deadlineSignals[signalTag]) {
          linkOptions = { cat: "deadline" };
        } else if (channelSignals[signalTag] || sourceTrainerId === "lesson-b2-radiator-register") {
          linkOptions = { cat: "channel" };
        }
      } else if (sourceTrainerId === "lesson-a2-doctor" && drill.id === "skrive") {
        linkOptions = { cat: "sundhed" };
      } else if (drill.id === "ordstilling" && ordstillingCatMap[signalTag]) {
        linkOptions = { cat: ordstillingCatMap[signalTag] };
      } else if (drill.id === "bojning" && bojningTrapMap[signalTag]) {
        linkOptions = { cat: bojningTrapMap[signalTag] };
      }
      return {
        kind: "drill",
        cta: "Run " + drill.name,
        action: buildDrillAction(signalTag, sourceTrainerId, drill, repairs),
        href: this.drillRepairLink(drill, signalTag, sourceTrainerId, linkOptions),
        trainerIcon: drill.icon,
        trainerName: drill.name,
        drillId: drill.id,
        cat: linkOptions && linkOptions.cat ? linkOptions.cat : ""
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);

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
        description: "Multiple-choice practice for B2 register: passive agency in official Danish, channel transfer across Slack/email/meeting, deadlines, and polite escalation.",
        icon: "✉️",
        gallery: {
          tag: "B2 register",
          role: "repair",
          level: "B2",
          theme: "Public-service & workplace Danish",
          estimatedMinutes: 8,
          repairs: "passive agency · channel transfer · deadlines · polite escalation",
          repairSignals: [
            "passive-agency",
            "formal-register-control",
            "understatement-with-agency",
            "consequence-aware-tone",
            "agency-without-pressure",
            "concrete-next-step",
            "context-reading"
          ],
          sequence: 3
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
          repairSignals: [],
          sequence: 4
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
        name: "Lesson 01: The First Morning",
        type: "lesson",
        path: "./lessons/lesson-01/",
        lessonGlobal: "PLATA_LESSON_01",
        lessonDataPath: "./lessons/lesson-01/data.js",
        description: "Arrive in Copenhagen, meet Lene, read signs, and say your first useful Danish sentence. Exercises are embedded as story actions.",
        icon: "🌅",
        gallery: {
          tag: "Optional tutorial",
          level: "A0/A1",
          theme: "Mechanics demo",
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
        name: "Hvor længe har du haft det sådan?",
        type: "lesson",
        path: "./lessons/lesson-a2-doctor/",
        lessonGlobal: "PLATA_LESSON_A2_DOCTOR",
        lessonDataPath: "./lessons/lesson-a2-doctor/data.js",
        description: "Describe symptoms to læge or apotek with duration, severity, and calm clarification — language practice only.",
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
            "Ask hvad skal jeg gøre nu after describing symptoms"
          ],
          sequence: 2,
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
          sequence: 3,
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
          sequence: 1,
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
      },
      {
        id: "lesson-b1-bolig",
        name: "Bolig og udlejer",
        type: "lesson",
        path: "./lessons/lesson-b1-bolig/",
        lessonGlobal: "PLATA_LESSON_B1_BOLIG",
        lessonDataPath: "./lessons/lesson-b1-bolig/data.js",
        description: "Navigate housing repairs and tenant communication without sounding passive or aggressive.",
        icon: "🏠",
        gallery: {
          tag: "B1 housing",
          level: "B1",
          status: "gold",
          signalFamily: "tenant-register",
          estimatedMinutes: 12,
          outcomes: [
            "Write repair requests without passive Danish",
            "Keep tenant rights visible without aggression",
            "Agree concrete next steps with udlejer"
          ],
          sequence: 5,
          featured: false
        }
      },
      {
        id: "lesson-b1-borgerservice",
        name: "Når systemet siger nej",
        type: "lesson",
        path: "./lessons/lesson-b1-borgerservice/",
        lessonGlobal: "PLATA_LESSON_B1_BORGERSERVICE",
        lessonDataPath: "./lessons/lesson-b1-borgerservice/data.js",
        description: "Book or fix a Borgerservice/MitID/CPR appointment without panic or passive Danish.",
        icon: "🏛",
        gallery: {
          tag: "B1 public service",
          level: "B1",
          status: "gold",
          signalFamily: "polite-persistence · system-navigation · register-control",
          estimatedMinutes: 14,
          outcomes: [
            "Use polite request chunks at Borgerservice counters",
            "Clarify system rejections without panic or aggression",
            "Book appointments with date and time precision"
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
    vocabScenesByLesson: {
      "lesson-b2-job-followup": {
        "email-closing": ["proces", "opfølgning"],
        "email-register": ["henvendelse", "opfølgning"]
      }
    },
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
    vocabRemediation: function (sourceLessonId, sceneId, focusWords) {
      if (!sourceLessonId || !sceneId || !focusWords || !focusWords.length) return null;
      var vocabTrainer = null;
      for (var i = 0; i < this.trainers.length; i++) {
        if (this.trainers[i].id === "vocab") {
          vocabTrainer = this.trainers[i];
          break;
        }
      }
      if (!vocabTrainer) return null;
      var preview = focusWords.slice(0, 3).join(", ");
      return {
        kind: "vocab",
        cta: "Review scene vocabulary",
        action: "These words appeared in a weak scene (" + preview + "). A short SR pass keeps them retrievable before you forget them.",
        href: this.vocabRepairLink(sourceLessonId, sceneId),
        trainerIcon: vocabTrainer.icon,
        trainerName: vocabTrainer.name,
        sceneId: sceneId,
        focus: focusWords.slice()
      };
    },
    buildVocabRemediation: function (sourceLessonId, sceneId) {
      var focus = this.vocabFocusForScene(sourceLessonId, sceneId);
      if (!focus || !focus.length) return null;
      return this.vocabRemediation(sourceLessonId, sceneId, focus);
    },
    drillRemediation: function (signalTag, sourceTrainerId) {
      var drill = this.drillForSignal(signalTag);
      if (!drill) return null;
      var repairs = drill.gallery && drill.gallery.repairs ? drill.gallery.repairs : "";
      var channelSignals = {
        "formal-register-control": true,
        "consequence-aware-tone": true,
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
      if (sourceTrainerId === "lesson-b2-radiator-register" && channelSignals[signalTag]) {
        linkOptions = { cat: "channel" };
      } else if (sourceTrainerId === "lesson-b2-job-followup" && signalTag === "consequence-aware-tone") {
        linkOptions = { cat: "deadline" };
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
        drillId: drill.id
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);

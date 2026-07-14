window.PLATA_LESSON_B2_ORDSTILLING = {
  id: "lesson-b2-ordstilling",
  contentVersion: 2,
  level: "B1/B2",
  title: "Danish word order in a real workday",
  subtitle: "Practise V2, indirect questions, and fordi/derfor while arranging meetings and explaining changes.",
  estimatedMinutes: 14,
  qualityTier: "gold",
  editorialFocus: "Choose correct Danish word order under real social pressure: inversion after fronted time/place, fordi + subordinate vs derfor + inversion, and ikke placement across clause types.",
  comicStoryboard: {
    style: "Nordic editorial comic, restrained linework, muted slate-blue and ochre palette, modern Copenhagen workplaces, adult learner perspective, no readable text inside the image, no logos, no watermarks.",
    aspectRatio: "16:9",
    imageSize: "1K",
    panels: [
      {
        id: "signup-email",
        sceneId: "signup-email",
        assetPath: "./assets/comic/signup-email.png",
        alt: "A learner writes Monday's work plan and checks the word order after a time phrase.",
        prompt: "A single comic panel in a Copenhagen apartment. An adult learner sits at a laptop writing where they will work on Monday. Use subtle abstract sentence blocks to suggest the verb moving before the subject after a time phrase. No readable text, logos, or speech bubbles.",
        sourceRefs: ["sproget.dk: ordstilling", "Den Danske Ordbog / ordnet.dk"],
        masteryTags: ["inversion-fronted-adverbial"],
        mustInclude: ["laptop message", "thoughtful expression", "Monday work-plan cue"],
        avoid: ["visible Danish sentences", "frustration", "brand logos"]
      },
      {
        id: "hotel-question",
        sceneId: "hotel-question",
        assetPath: "./assets/comic/hotel-question.png",
        alt: "A visitor asks an office receptionist where the customer meeting room is.",
        prompt: "A single comic panel at a modern Copenhagen office reception. A visiting employee asks a receptionist where the customer meeting room is. Show polite uncertainty and an indirect question taking shape through abstract visual blocks. No readable text, logos, or speech bubbles.",
        sourceRefs: ["sproget.dk: ordstilling", "Den Danske Ordbog / ordnet.dk"],
        masteryTags: ["v2-placement"],
        mustInclude: ["office reception", "learner speaking", "meeting-room cue"],
        avoid: ["angry customer", "readable Danish text", "brand logos"]
      },
      {
        id: "schedule-swap",
        sceneId: "schedule-swap",
        assetPath: "./assets/comic/schedule-swap.png",
        alt: "Two colleagues swap customer meetings and explain why the change works.",
        prompt: "A single comic panel in a Copenhagen office. A colleague gestures toward a simple calendar board while asking to swap a morning customer meeting. The learner listens and prepares to give a reason. Suggest two clause patterns with abstract shapes only. No readable text, logos, or speech bubbles.",
        sourceRefs: ["sproget.dk: ledsætninger", "Den Danske Ordbog / ordnet.dk"],
        masteryTags: ["fordi-derfor-clause"],
        mustInclude: ["meeting calendar", "colleague gesturing", "learner processing"],
        avoid: ["readable schedule text", "stress caricature", "brand logos"]
      },
      {
        id: "lunch-ordsilling",
        sceneId: "lunch-ordsilling",
        assetPath: "./assets/comic/lunch-ordsilling.png",
        alt: "The learner confirms the meeting swap in chat, speech, email, and a calendar note.",
        prompt: "A single comic panel at a Copenhagen workplace. The learner confirms the same meeting change across four clear visual channels: a short phone chat, a spoken exchange with a colleague, a laptop email, and a calendar card. Show calm consistency rather than notification overload. No readable text, logos, or speech bubbles.",
        sourceRefs: ["sproget.dk: ordstilling", "sproget.dk: ledsætninger", "Den Danske Ordbog / ordnet.dk"],
        masteryTags: ["inversion-fronted-adverbial", "v2-placement", "fordi-derfor-clause"],
        mustInclude: ["colleague conversation", "four communication channels", "composed focus"],
        avoid: ["chaos", "readable Danish", "brand logos"]
      },
      {
        id: "epilogue",
        sceneId: "epilogue",
        assetPath: "./assets/comic/epilogue.png",
        alt: "The learner sends a clear plan for tomorrow after a day of workplace conversations.",
        prompt: "A single comic panel at the end of a Copenhagen workday. The learner sends tomorrow's work-from-home plan while gentle visual echoes show a time phrase, a reason, and an online meeting as abstract connected shapes. The message feels easy for the team to understand. No readable text, logos, or speech bubbles.",
        sourceRefs: ["sproget.dk: ordstilling", "Den Danske Ordbog / ordnet.dk"],
        masteryTags: ["ordstilling-principle"],
        mustInclude: ["end-of-day message", "work-from-home cue", "clarity visualization"],
        avoid: ["trophy pose", "readable Danish", "brand logos"]
      }
    ]
  },
  masteryMap: {
    "inversion-fronted-adverbial": {
      competencyId: "register-control",
      label: "Inversion after fronted adverbials",
      evidence: "The learner inverts subject and verb when a time or place adverbial starts the sentence.",
      remediation: {
        sceneId: "signup-email",
        cta: "Review Scene 1",
        action: "Rerun the email scene and place the verb second — right after the fronted time adverbial — before the subject."
      },
      sourceRefs: ["sproget.dk: ordstilling", "Den Danske Ordbog / ordnet.dk"]
    },
    "v2-placement": {
      competencyId: "register-control",
      label: "Direct and indirect question order",
      evidence: "The learner distinguishes verb–subject order in a direct question from subject–verb order inside an indirect question.",
      remediation: {
        sceneId: "hotel-question",
        cta: "Review Scene 2",
        action: "Rerun the meeting-room scene and compare a direct question with the word order inside an indirect question."
      },
      sourceRefs: ["sproget.dk: ordstilling", "Den Danske Ordbog / ordnet.dk"]
    },
    "fordi-derfor-clause": {
      competencyId: "register-control",
      label: "Fordi vs derfor clause structure",
      evidence: "The learner uses subordinate word order after fordi and main-clause inversion after derfor.",
      remediation: {
        sceneId: "schedule-swap",
        cta: "Review Scene 3",
        action: "Rerun the schedule scene and check: fordi pushes ikke before the verb; derfor triggers inversion."
      },
      sourceRefs: ["sproget.dk: ledsætninger", "Den Danske Ordbog / ordnet.dk"]
    },
    "ordstilling-principle": {
      competencyId: "consequence-awareness",
      label: "Name the word order principle",
      evidence: "The learner can explain how word order helps a colleague identify the action, reason, and timing without rereading.",
      remediation: {
        sceneId: "epilogue",
        cta: "Review the principle",
        action: "Rerun the final choice and pick the principle that connects word order, clarity, and social perception."
      },
      sourceRefs: ["sproget.dk: ordstilling", "Den Danske Ordbog / ordnet.dk"]
    }
  },
  simulation: {
    expectedEndingId: "klar",
    completionAnswers: {
      "hotel-question": {
        reject: ["værelse", "reception"],
        accept: "hvor mødelokalet ligger; jeg skal deltage i kundemødet"
      }
    },
    paths: [
      {
        id: "klar",
        expectedEndingId: "klar",
        expectedVariables: { ordstillingClarity: 4, socialConnection: 3, learnerConfidence: 3 },
        expectedCorrect: 5,
        expectedWeakMastery: [],
        actions: [
          { sceneId: "signup-email", optionId: "correct-inversion", expectCorrect: true },
          { sceneId: "hotel-question", answer: "hvor mødelokalet ligger; jeg skal deltage i kundemødet", expectCorrect: true },
          { sceneId: "schedule-swap", optionId: "fordi-subordinate", expectCorrect: true },
          { sceneId: "lunch-ordsilling", optionId: "lunch-formal-correct", reasonId: "v2-rule-reason", expectCorrect: true },
          { sceneId: "epilogue", optionId: "principle-v2-social", expectCorrect: true }
        ]
      },
      {
        id: "ok",
        expectedEndingId: "ok",
        expectedVariables: { ordstillingClarity: 0, socialConnection: -1, learnerConfidence: 2 },
        expectedCorrect: 2,
        expectedWeakMastery: ["fordi-derfor-clause", "inversion-fronted-adverbial", "ordstilling-principle", "v2-placement"],
        actions: [
          { sceneId: "signup-email", optionId: "correct-inversion", expectCorrect: true },
          { sceneId: "hotel-question", answer: "hvor mødelokalet ligger; jeg skal deltage i kundemødet", expectCorrect: true },
          { sceneId: "schedule-swap", optionId: "derfor-no-inversion", expectCorrect: false },
          { sceneId: "lunch-ordsilling", optionId: "lunch-email-near-miss", expectCorrect: false },
          { sceneId: "epilogue", optionId: "principle-grammar-only", expectCorrect: false }
        ]
      },
      {
        id: "forvirret",
        expectedEndingId: "forvirret",
        expectedVariables: { ordstillingClarity: -2, socialConnection: -1, learnerConfidence: 0 },
        expectedCorrect: 0,
        expectedWeakMastery: ["inversion-fronted-adverbial", "v2-placement", "fordi-derfor-clause", "ordstilling-principle"],
        actions: [
          { sceneId: "signup-email", optionId: "no-inversion", expectCorrect: false },
          { sceneId: "hotel-question", answer: "værelse", expectCorrect: false },
          { sceneId: "schedule-swap", optionId: "derfor-no-inversion", expectCorrect: false },
          { sceneId: "lunch-ordsilling", optionId: "lunch-chat-wrong", expectCorrect: false },
          { sceneId: "epilogue", optionId: "principle-vocab-only", expectCorrect: false }
        ]
      }
    ]
  },
  variables: {
    ordstillingClarity: 0,
    socialConnection: 0,
    learnerConfidence: 0
  },
  variableLabels: {
    ordstillingClarity: "Ordstilling",
    socialConnection: "Relation",
    learnerConfidence: "Sikkerhed"
  },
  variableDescriptions: {
    ordstillingClarity: ["confused — word order caused misunderstandings", "mixed — some correct, some unclear", "clear — V2 and inversion felt natural", "confident — word order supported your message"],
    socialConnection: ["distant — unclear sentences created distance", "neutral — you were understood", "strong — correct word order built connection"],
    learnerConfidence: ["unsure — you doubted every sentence", "growing — some sentences felt solid", "confident — word order was no longer a block"]
  },
  languagePhenomena: [
    { item: "V2 (verb-second)", function: "in main clauses, the finite verb is always the second constituent regardless of what comes first" },
    { item: "inversion", function: "when a non-subject (time, place, object) is fronted, subject and verb swap: 'I morgen kommer jeg'" },
    { item: "fordi + subordinate clause", function: "fordi triggers subordinate word order: ikke goes before the verb" },
    { item: "derfor + inversion", function: "derfor starts a new main clause and requires inversion: 'Derfor kan jeg bytte'" },
    { item: "ikke-placement", function: "ikke goes after the verb in main clauses, before the verb in subordinate clauses" }
  ],
  sourceNotes: [
    {
      title: "sproget.dk: ordstilling",
      url: "https://sproget.dk/raad-og-regler/grammatik/ordklasser-og-ordstilling/ordstilling",
      supports: ["Danish main clauses follow V2: the finite verb is always the second sentence element", "Fronted adverbials (time, place, manner) trigger inversion"]
    },
    {
      title: "sproget.dk: ledsætninger",
      url: "https://sproget.dk/raad-og-regler/grammatik/saetningsanalyse/ledsaetninger",
      supports: ["Subordinate clauses have different word order: ikke before the verb, no inversion", "Fordi introduces a subordinate clause; derfor starts a main clause"]
    },
    {
      title: "Den Danske Ordbog / ordnet.dk",
      url: "https://ordnet.dk/ddo",
      supports: ["Lexical checks for sentence structure and word order examples"]
    }
  ],
  scenes: [
    {
      id: "signup-email",
      type: "choice",
      eyebrow: "Scene 1 · Monday's plan",
      title: "Put the verb directly after the fronted time phrase.",
      learningGoal: "Apply V2 after På mandag in a short work message.",
      sourceRefs: ["sproget.dk: ordstilling", "Den Danske Ordbog / ordnet.dk"],
      masteryTags: ["inversion-fronted-adverbial"],
      pressure: "Your manager asks everyone to state where they will work on Monday. The message must begin with På mandag.",
      narrative: "When a time phrase comes first in a Danish main clause, the finite verb comes next: På mandag + arbejder + jeg.",
      dialogue: [{ speaker: "Manager", line: "Skriv gerne, hvor du arbejder på mandag." }],
      notice: "Treat På mandag as the first sentence element. Arbejder is the second; jeg follows the verb.",
      targetPhrases: ["på mandag arbejder jeg", "arbejder hjemme"],
      prompt: "Choose the grammatical sentence that starts with På mandag.",
      options: [
        { id: "correct-inversion", diagnostic: "applies-inversion-after-fronted-time", label: "På mandag arbejder jeg hjemme.", detail: "På mandag + verb + subject", correct: true, effects: { ordstillingClarity: 1, socialConnection: 1, learnerConfidence: 1 }, feedback: "Correct. Arbejder comes immediately after the fronted time phrase, before jeg." },
        { id: "no-inversion", diagnostic: "follows-english-word-order", label: "På mandag jeg arbejder hjemme.", detail: "subject incorrectly comes before the verb", correct: false, effects: { ordstillingClarity: -1 }, feedback: "The words are useful, but Danish V2 requires På mandag arbejder jeg …" },
        { id: "reverse-order", diagnostic: "misplaces-verb-and-object", label: "Jeg arbejder hjemme på mandag.", detail: "grammatical, but does not follow the required opening", correct: false, effects: { ordstillingClarity: 0, learnerConfidence: -1 }, feedback: "This sentence is fully grammatical. It is not the answer to this particular task because the message must begin with På mandag. When you start with the subject, no inversion is needed." }
      ],
      carry: "Reusable pattern: I morgen/På mandag/Efter frokost + verb + subject.",
      tags: ["B1", "B2", "ordstilling", "V2", "inversion", "formal-email"]
    },
    {
      id: "hotel-question",
      type: "completion",
      eyebrow: "Scene 2 · The meeting room",
      title: "Keep statement order inside an indirect question.",
      learningGoal: "Ask where a room is using Kan du sige mig, hvor … ligger?",
      sourceRefs: ["sproget.dk: ordstilling", "Den Danske Ordbog / ordnet.dk"],
      masteryTags: ["v2-placement"],
      pressure: "You are visiting another office. The customer meeting starts in ten minutes, but you cannot find the room.",
      narrative: "After kan du sige mig, the indirect question uses hvor + subject + verb: hvor mødelokalet ligger.",
      dialogue: [
        { speaker: "Receptionist", line: "Hej, kan jeg hjælpe?" },
        { speaker: "You", line: "Ja, jeg leder efter mødelokalet." }
      ],
      notice: "Direct question: Hvor ligger mødelokalet? Indirect question: Kan du sige mig, hvor mødelokalet ligger?",
      targetPhrases: ["hvor mødelokalet ligger", "jeg skal deltage", "kundemødet"],
      prompt: "Complete the request with the room and why you need it.",
      prefix: "Undskyld, kan du sige mig,",
      placeholder: "hvor mødelokalet ligger; jeg skal deltage i kundemødet",
      acceptKeywordGroups: [
        { name: "location reference", keywords: ["hvor", "lokale", "mødelokale", "mødelokalet", "sal", "etage"] },
        { name: "purpose or need", keywords: ["skal", "deltage", "møde", "kundemøde", "bruge"] }
      ],
      success: "Good. The direct question begins kan du, while the embedded question uses hvor + subject + verb: hvor mødelokalet ligger.",
      failure: "Include both a location reference (hvor/lokale/mødelokale/etage) and a purpose or need (skal/deltage/møde/bruge/finde).",
      effects: { ordstillingClarity: 1, learnerConfidence: 1 },
      carry: "Compare the pair: Hvor ligger lokalet? → Kan du sige mig, hvor lokalet ligger?",
      tags: ["B1", "B2", "ordstilling", "V2", "question-structure", "workplace"]
    },
    {
      id: "schedule-swap",
      type: "choice",
      eyebrow: "Scene 3 · Swap a meeting",
      title: "Fordi and derfor express the same logic with different word order.",
      learningGoal: "Distinguish fordi + subordinate clause from derfor + inversion when giving a reason.",
      sourceRefs: ["sproget.dk: ledsætninger", "Den Danske Ordbog / ordnet.dk"],
      masteryTags: ["fordi-derfor-clause"],
      pressure: "Mikkel asks whether you can take the 9:00 customer meeting. You can, because you do not have to deliver another presentation that morning.",
      narrative: "The reason can follow fordi inside one sentence, or therefore can start a new main clause with derfor.",
      dialogue: [
        { speaker: "Mikkel", line: "Kan du tage kundemødet klokken 9? Så tager jeg dit møde efter frokost." },
        { speaker: "You", line: "Selvfølgelig. Jeg kan godt bytte, ..." }
      ],
      notice: "The rule: 'fordi' starts a subordinate clause where 'ikke' goes before the verb. 'Derfor' starts a main clause where 'ikke' goes after the verb — and inversion follows 'derfor'.",
      targetPhrases: ["fordi jeg ikke skal præsentere om morgenen", "derfor kan vi bytte", "selvfølgelig"],
      prompt: "Complete the sentence with correct Danish clause structure.",
      options: [
        { id: "fordi-subordinate", diagnostic: "fordi-triggers-subordinate-order", label: "Jeg kan godt bytte, fordi jeg ikke skal præsentere om morgenen.", detail: "fordi + subject + ikke + verb", correct: true, effects: { ordstillingClarity: 1, socialConnection: 1, learnerConfidence: 1 }, feedback: "Correct. In the subordinate clause, ikke comes before skal." },
        { id: "derfor-inversion", diagnostic: "derfor-triggers-inversion", label: "Jeg skal ikke præsentere om morgenen. Derfor kan vi bytte.", detail: "also grammatical, but not a completion of the given sentence", correct: false, nearMiss: false, grammarStatus: "grammatical", pragmaticStatus: "different-structure", feedback: "This is fully grammatical: derfor begins a new main clause and can comes before vi. The task asks you to complete the existing fordi sentence." },
        { id: "derfor-no-inversion", diagnostic: "derfor-without-inversion", label: "Jeg skal ikke præsentere om morgenen. Derfor vi kan bytte.", detail: "missing inversion after derfor", correct: false, effects: { ordstillingClarity: -1, socialConnection: -1 }, feedback: "After derfor, the verb comes before the subject: Derfor kan vi bytte." }
      ],
      carry: "Keep both frames: fordi jeg ikke skal … / Derfor kan vi …",
      tags: ["B1", "B2", "ordstilling", "fordi", "derfor", "subordinate-clause", "inversion"]
    },
    {
      id: "lunch-ordsilling",
      type: "flagship-chain",
      eyebrow: "Scene 4 · Confirm the change",
      title: "Keep V2 when the same update moves from chat to email.",
      learningGoal: "Confirm a meeting change in chat, spoken Danish, and a formal email while keeping the sentence grammatical.",
      sourceRefs: ["sproget.dk: ordstilling", "sproget.dk: ledsætninger", "Den Danske Ordbog / ordnet.dk"],
      masteryTags: ["inversion-fronted-adverbial", "v2-placement", "fordi-derfor-clause"],
      pressure: "Mikkel agrees to swap. Your manager now needs a written confirmation of who attends the 9:00 customer meeting.",
      narrative: "The facts stay the same across channels, but the email needs a complete sentence that makes the agreement and action unambiguous.",
      dialogue: [
        { speaker: "Mikkel", line: "Super, så bytter vi. Jeg tager dit møde efter frokost." },
        { speaker: "Manager", line: "Kan du bekræfte ændringen på mail?" }
      ],
      notice: "Formal and informal Danish use the same V2 rule. The channel changes how much context you include, not whether the verb stays second.",
      targetPhrases: ["efter aftale med Mikkel", "bekræfter jeg", "kundemødet klokken 9"],
      prompt: "Choose the sentence that fits the channel and follows correct Danish word order.",
      intent: "Confirm who takes the 9:00 meeting in the right register without breaking V2.",
      archetypes: [
        "consequence-exercise",
        "near-miss",
        "repair-ladder",
        "same-intent-different-channel",
        "memory-backed-recurrence",
        "explain-your-choice"
      ],
      memoryCue: {
        signal: "inversion-fronted-adverbial",
        copy: "You used På mandag + verb + subject earlier. Apply the same order after Efter aftale med Mikkel."
      },
      channelVersions: [
        { id: "email", label: "Email to manager", sample: "Efter aftale med Mikkel bekræfter jeg, at jeg tager kundemødet klokken 9.", risk: "The manager needs a complete, unambiguous record." },
        { id: "chat", label: "Chat to Mikkel", sample: "Super, jeg tager mødet klokken 9.", risk: "The shared context allows a shorter message, but V2 still applies." },
        { id: "lunch", label: "Spoken update", sample: "Ja, vi har byttet, fordi Mikkel tager mit møde senere.", risk: "The reason uses subordinate word order after fordi." },
        { id: "bio", label: "Calendar note", sample: "Efter aftale deltager jeg i kundemødet klokken 9.", risk: "A short record still needs inversion after Efter aftale." }
      ],
      options: [
        {
          id: "lunch-formal-correct",
          channel: "Email to manager",
          diagnostic: "applies-inversion-after-fronted-adverbial-in-formal-channel",
          label: "Efter aftale med Mikkel bekræfter jeg, at jeg tager kundemødet klokken 9.",
          detail: "correct inversion, formal register",
          correct: true,
          grammarStatus: "grammatical",
          pragmaticStatus: "channel-appropriate",
          consequence: "Your manager can see the agreement, the person responsible, and the time in one grammatical sentence.",
          effects: { ordstillingClarity: 1, socialConnection: 1 },
          feedback: "Correct. Efter aftale med Mikkel is followed by the verb bekræfter and then the subject jeg.",
          repairLadder: [
            { stage: "raw intent", text: "I take Mikkel's 9:00 meeting." },
            { stage: "safer Danish", text: "Jeg bekræfter, at jeg tager mødet klokken 9." },
            { stage: "channel-ready Danish", text: "Efter aftale med Mikkel bekræfter jeg, at jeg tager kundemødet klokken 9." }
          ],
          reasonPrompt: "Why does this sentence work in the formal email channel?",
          reasonOptions: [
            { id: "v2-rule-reason", label: "It follows V2: fronted time phrase + verb + subject, matching formal register.", correct: true },
            { id: "length-reason", label: "It works because it is longer and sounds more official than the alternatives.", correct: false },
            { id: "word-choice-reason", label: "It works because 'bekræfter' is a formal word, regardless of word order.", correct: false }
          ]
        },
        {
          id: "lunch-email-near-miss",
          channel: "Email to manager",
          diagnostic: "correct-meaning-no-inversion-after-fronted-phrase",
          label: "Efter aftale med Mikkel jeg bekræfter, at jeg tager kundemødet klokken 9.",
          detail: "B1 near miss — missing inversion",
          correct: false,
          nearMiss: true,
          grammarStatus: "ungrammatical",
          pragmaticStatus: "channel-damaging",
          consequence: "The manager can infer the meaning, but the sentence stumbles immediately after the opening phrase.",
          effects: { ordstillingClarity: -1, socialConnection: -1 },
          feedback: "Near miss. Efter aftale + jeg + bekræfter breaks V2. Move bekræfter before jeg.",
          repairLadder: [
            { stage: "raw phrase", text: "Efter aftale med Mikkel jeg tager mødet." },
            { stage: "safer Danish", text: "Jeg tager mødet efter aftale med Mikkel." },
            { stage: "channel-ready Danish", text: "Efter aftale med Mikkel bekræfter jeg, at jeg tager kundemødet klokken 9." }
          ]
        },
        {
          id: "lunch-chat-wrong",
          channel: "Chat to Mikkel",
          diagnostic: "subordinate-word-order-in-main-clause",
          label: "Vi kan sagtens bytte, fordi jeg ikke skal præsentere om morgenen.",
          detail: "grammatical, but does not confirm the agreed action",
          correct: false,
          nearMiss: true,
          grammarStatus: "grammatical",
          pragmaticStatus: "wrong-channel-for-message",
          consequence: "Mikkel understands the reason, but the message still does not say who takes the 9:00 meeting.",
          effects: { socialConnection: 0 },
          feedback: "The word order is correct, but the practical confirmation is missing. Say which meeting you will take.",
          repairLadder: [
            { stage: "raw intent", text: "Yes, we can swap." },
            { stage: "safer Danish", text: "Selvfølgelig, jeg tager mødet." },
            { stage: "channel-ready Danish", text: "Super, jeg tager kundemødet klokken 9." }
          ]
        }
      ],
      carry: "The short version and the formal version share the same grammar. Add context for the channel; do not remove V2.",
      tags: ["B1", "B2", "ordstilling", "V2", "inversion", "register", "channel-transfer"]
    },
    {
      id: "epilogue",
      type: "choice",
      eyebrow: "Final · A new message",
      title: "Combine V2 and subordinate word order without prompts.",
      learningGoal: "Write a two-sentence work update using a fronted time phrase, fordi, and derfor.",
      sourceRefs: ["sproget.dk: ordstilling", "Den Danske Ordbog / ordnet.dk"],
      masteryTags: ["ordstilling-principle"],
      pressure: "At the end of the day, you send your team tomorrow's plan: you will work from home because you do not need to be in the office, so you will join the meeting online.",
      narrative: "This transfer task combines all three patterns in a fresh context.",
      dialogue: [{ speaker: "Team chat", line: "Hvor arbejder du i morgen, og hvordan deltager du i mødet?" }],
      notice: "I morgen triggers V2. Fordi places ikke before the verb. Derfor begins a new main clause with the verb before the subject.",
      targetPhrases: ["i morgen arbejder jeg", "fordi jeg ikke skal", "derfor deltager jeg"],
      prompt: "Which two-sentence update gets all three patterns right?",
      options: [
        { id: "principle-v2-social", diagnostic: "word-order-as-social-signal", label: "I morgen arbejder jeg hjemme, fordi jeg ikke skal være på kontoret. Derfor deltager jeg online i mødet.", detail: "V2 + subordinate order + inversion", correct: true, feedback: "Correct. Arbejder follows I morgen, ikke comes before skal after fordi, and deltager comes before jeg after Derfor." },
        { id: "principle-grammar-only", diagnostic: "word-order-as-rule-memorisation", label: "I morgen jeg arbejder hjemme, fordi jeg ikke skal være på kontoret. Derfor deltager jeg online.", detail: "missing V2 in the first main clause", correct: false, feedback: "The fordi and derfor clauses work, but the opening needs inversion: I morgen arbejder jeg …" },
        { id: "principle-vocab-only", diagnostic: "words-over-structure", label: "I morgen arbejder jeg hjemme, fordi jeg skal ikke være på kontoret. Derfor jeg deltager online.", detail: "main-clause order used in the wrong places", correct: false, feedback: "After fordi, write jeg ikke skal. After Derfor, write deltager jeg." }
      ],
      carry: "Pocket check: time first → verb before subject; fordi → ikke before verb; derfor → verb before subject.",
      tags: ["B1", "B2", "ordstilling", "reflection", "social-signal", "fluency"]
    }
  ],
  endingLogic: {
    klar: { minOrdstillingClarity: 2, minSocialConnection: 1 },
    ok: { minOrdstillingClarity: 0 },
    forvirret: { maxOrdstillingClarity: -1 }
  },
  endings: [
    {
      id: "klar",
      title: "The plan is clear on the first read",
      narrative: "Your manager can see when you work, why you are at home, and how you will attend the meeting without mentally rearranging the sentence.",
      danish: "I morgen arbejder jeg hjemme. Derfor deltager jeg online.",
      carry: "Reuse the same three checks in emails, chat messages, and spoken updates."
    },
    {
      id: "ok",
      title: "Understood after a second look",
      narrative: "Most of the message works, but one clause uses the wrong order and makes the reader pause.",
      danish: "Meningen er tydelig, men én sætning skal repareres.",
      carry: "Find the trigger word first: time phrase, fordi, or derfor. Then place the verb from that pattern."
    },
    {
      id: "forvirret",
      title: "The reader has to reconstruct the plan",
      narrative: "The words are familiar, but several clauses use English order and the team asks you to confirm tomorrow's plan again.",
      danish: "Kan du lige bekræfte, om du deltager online?",
      carry: "Repair one frame at a time: I morgen arbejder jeg … / fordi jeg ikke skal … / Derfor deltager jeg …"
    }
  ]
};

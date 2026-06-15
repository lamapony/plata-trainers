window.PLATA_LESSON_B2_ORDSTILLING = {
  id: "lesson-b2-ordstilling",
  level: "B1/B2",
  title: "Hvem gør hvad — ordstilling i praksis",
  subtitle: "A B1/B2 Danish lesson about word order: V2, inversion after fronted adverbials, and the difference between fordi and derfor.",
  estimatedMinutes: 14,
  qualityTier: "gold",
  editorialFocus: "Choose correct Danish word order under real social pressure: inversion after fronted time/place, fordi + subordinate vs derfor + inversion, and ikke placement across clause types.",
  comicStoryboard: {
    style: "Nordic editorial comic, restrained linework, muted slate-blue and ochre palette, Copenhagen conference interiors, adult learner perspective, no readable text inside the image, no logos, no watermarks.",
    aspectRatio: "16:9",
    imageSize: "1K",
    panels: [
      {
        id: "signup-email",
        sceneId: "signup-email",
        assetPath: "./assets/comic/signup-email.png",
        alt: "A learner composes an email to confirm conference attendance while balancing word order in their head.",
        prompt: "A single comic panel in a Copenhagen apartment. An adult B1 learner sits at a laptop composing an email to confirm conference attendance. Speech-thought bubbles show Danish sentence fragments being mentally reordered — focus on the cognitive effort of V2 placement. No readable text in the main image, no logos, no speech bubbles.",
        sourceRefs: ["sproget.dk: ordstilling", "Den Danske Ordbog / ordnet.dk"],
        masteryTags: ["inversion-fronted-adverbial"],
        mustInclude: ["laptop email", "thoughtful expression", "word order thinking"],
        avoid: ["visible Danish sentences", "frustration", "brand logos"]
      },
      {
        id: "hotel-question",
        sceneId: "hotel-question",
        assetPath: "./assets/comic/hotel-question.png",
        alt: "The learner asks at a hotel reception about the conference room location.",
        prompt: "A single comic panel at a Copenhagen hotel reception. The learner speaks to a receptionist while asking about the conference room. Show polite uncertainty and the moment of constructing correct V2 word order mid-sentence. No readable text, no logos, no speech bubbles.",
        sourceRefs: ["sproget.dk: ordstilling", "Den Danske Ordbog / ordnet.dk"],
        masteryTags: ["v2-placement"],
        mustInclude: ["hotel reception", "learner speaking", "polite question"],
        avoid: ["angry customer", "readable Danish text", "brand logos"]
      },
      {
        id: "schedule-swap",
        sceneId: "schedule-swap",
        assetPath: "./assets/comic/schedule-swap.png",
        alt: "A colleague asks to swap presentation slots at a conference, and the learner must respond using correct clause structure.",
        prompt: "A single comic panel inside a Copenhagen conference venue. A colleague gestures toward a schedule board while asking about swapping presentation times. The learner listens and prepares to respond, mentally choosing between fordi + subordinate or derfor + inversion. No readable text, no logos, no speech bubbles.",
        sourceRefs: ["sproget.dk: ledsætninger", "Den Danske Ordbog / ordnet.dk"],
        masteryTags: ["fordi-derfor-clause"],
        mustInclude: ["schedule board", "colleague gesturing", "learner processing"],
        avoid: ["readable schedule text", "stress caricature", "brand logos"]
      },
      {
        id: "lunch-ordsilling",
        sceneId: "lunch-ordsilling",
        assetPath: "./assets/comic/lunch-ordsilling.png",
        alt: "During a conference lunch, the learner navigates word order across multiple social channels.",
        prompt: "A single comic panel during a conference lunch in Copenhagen. The learner sits at a table with colleagues while messages and conversations layer: a phone chat, a lunch dialogue, and a formal follow-up thought card. Show the learner choosing correct word order across different social channels. No readable text, no logos, no speech bubbles.",
        sourceRefs: ["sproget.dk: ordstilling", "sproget.dk: ledsætninger", "Den Danske Ordbog / ordnet.dk"],
        masteryTags: ["inversion-fronted-adverbial", "v2-placement", "fordi-derfor-clause"],
        mustInclude: ["lunch table", "multiple communication channels", "composed focus"],
        avoid: ["chaos", "readable Danish", "brand logos"]
      },
      {
        id: "epilogue",
        sceneId: "epilogue",
        assetPath: "./assets/comic/epilogue.png",
        alt: "The learner reflects on how correct word order shaped the conference experience.",
        prompt: "A single comic panel showing the learner walking out of the Copenhagen conference venue, looking satisfied. Around them float gentle visual echoes of the scenes: an email, a reception desk, a schedule board, and a lunch conversation — subtly connected by sentence-structure lines. The visual idea is that correct word order creates clarity and connection. No readable text, no logos, no speech bubbles.",
        sourceRefs: ["sproget.dk: ordstilling", "Den Danske Ordbog / ordnet.dk"],
        masteryTags: ["ordstilling-principle"],
        mustInclude: ["reflective exit", "scene echoes", "clarity visualization"],
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
      label: "V2 in questions and statements",
      evidence: "The learner keeps the finite verb in second position when forming questions and replies.",
      remediation: {
        sceneId: "hotel-question",
        cta: "Review Scene 2",
        action: "Rerun the hotel scene and make verb the second element in every main clause, even when the first element is not the subject."
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
      evidence: "The learner names the B1/B2 principle that word order is not grammar trivia — it determines clarity and social signal.",
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
        accept: "hvor konferencelokalet ligger; jeg skal bruge salen i stueetagen"
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
          { sceneId: "hotel-question", answer: "hvor konferencelokalet ligger; jeg skal bruge salen i stueetagen", expectCorrect: true },
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
          { sceneId: "hotel-question", answer: "hvor konferencelokalet ligger; jeg skal bruge salen i stueetagen", expectCorrect: true },
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
      eyebrow: "Scene 1 · Tilmelding",
      title: "The conference wants a confirmation. One sentence, one word order choice.",
      learningGoal: "Apply inversion after a fronted time adverbial in a formal confirmation email.",
      sourceRefs: ["sproget.dk: ordstilling", "Den Danske Ordbog / ordnet.dk"],
      masteryTags: ["inversion-fronted-adverbial"],
      pressure: "You registered for a Copenhagen design conference weeks ago. Now they ask you to confirm. The email template starts with a time — and your brain says 'På mandag jeg ankommer', but your B1 knows that is wrong.",
      narrative: "The confirmation form has a short text field: 'Skriv en kort bekræftelse, så vi ved, du kommer.' You must write one correct Danish sentence. The time phrase comes first.",
      dialogue: [{ speaker: "Conference team", line: "Bekræft venligst din deltagelse med en kort sætning." }],
      notice: "Danish main clauses: the verb is always the second element. Not the first, not the third — second. When you start with 'På mandag', the verb must follow immediately.",
      targetPhrases: ["på mandag ankommer jeg", "på mandag jeg ankommer", "jeg glæder mig til", "bekræft venligst din deltagelse"],
      prompt: "Choose the sentence that follows Danish V2 word order.",
      options: [
        { id: "correct-inversion", diagnostic: "applies-inversion-after-fronted-time", label: "På mandag ankommer jeg til konferencen og glæder mig.", detail: "correct V2 inversion", correct: true, effects: { ordstillingClarity: 1, socialConnection: 1, learnerConfidence: 1 }, feedback: "Diagnostic: correct inversion. The fronted time 'På mandag' is followed by the verb 'ankommer', then the subject 'jeg'. Danish V2 respects this order even when English would not." },
        { id: "no-inversion", diagnostic: "follows-english-word-order", label: "På mandag jeg ankommer til konferencen og glæder mig.", detail: "no inversion — English word order", correct: false, effects: { ordstillingClarity: -1 }, feedback: "Diagnostic: this is the classic B1 near-miss. Every word is correct, but the word order is English, not Danish. The verb 'ankommer' must come before 'jeg'." },
        { id: "reverse-order", diagnostic: "misplaces-verb-and-object", label: "Jeg ankommer på mandag til konferencen og glæder mig.", detail: "correct but avoids inversion", correct: false, effects: { ordstillingClarity: 0, learnerConfidence: -1 }, feedback: "Diagnostic: grammatical but avoids the challenge. Starting with the subject avoids inversion, but you miss the chance to practice the fronted-adverbial pattern the prompt required." }
      ],
      carry: "Carry-forward: V2 means the verb is always the second building block. 'På mandag' + 'ankommer' + 'jeg'. Time first, then the verb, then the subject — even when your English intuition disagrees.",
      tags: ["B1", "B2", "ordstilling", "V2", "inversion", "formal-email"]
    },
    {
      id: "hotel-question",
      type: "completion",
      eyebrow: "Scene 2 · Receptionen",
      title: "You arrive. The conference is in a room you cannot find.",
      learningGoal: "Form a correct V2 question and statement when asking for directions.",
      sourceRefs: ["sproget.dk: ordstilling", "Den Danske Ordbog / ordnet.dk"],
      masteryTags: ["v2-placement"],
      pressure: "You are standing in the hotel lobby. The conference starts in 10 minutes. The receptionist is friendly but busy. One wrong word order and the sentence collapses.",
      narrative: "You know the Danish words: 'konferencelokale', 'stueetagen', 'ligge'. But arranging them in the right order under time pressure is the real test.",
      dialogue: [
        { speaker: "Receptionist", line: "Velkommen. Kan jeg hjælpe?" },
        { speaker: "You", line: "Ja, jeg leder efter konferencelokalet." }
      ],
      notice: "Questions with 'hvor' already have V2: 'Hvor ligger konferencelokalet?' In statements, even after a fronted 'det' or location, the verb stays second.",
      targetPhrases: ["hvor konferencelokalet ligger", "jeg skal bruge", "salen i stueetagen", "sige mig"],
      prompt: "Complete the sentence with correct V2 order. Include a location reference and a purpose.",
      prefix: "Undskyld, kan du sige mig,",
      placeholder: "hvor konferencelokalet ligger; jeg skal bruge salen i stueetagen",
      acceptKeywordGroups: [
        { name: "location reference", keywords: ["hvor", "lokale", "sal", "etage", "stueetagen", "konferencelokalet"] },
        { name: "purpose or need", keywords: ["skal", "bruge", "skal bruge", "skal finde", "skal være"] }
      ],
      success: "Godt. Your sentence has correct V2 word order: the verb ('kan') stays second after 'Undskyld', and the completion follows natural Danish question structure.",
      failure: "Include both a location reference (hvor/lokale/sal/etage/stueetagen/konferencelokalet) and a purpose or need (skal/bruge/skal bruge/skal finde/skal være).",
      effects: { ordstillingClarity: 1, learnerConfidence: 1 },
      carry: "Carry-forward: V2 is automatic in Danish questions — 'Kan du sige mig, hvor konferencelokalet ligger?' keeps the verb second. When you add 'jeg skal bruge salen i stueetagen', the verb 'skal' stays second after the subject.",
      tags: ["B1", "B2", "ordstilling", "V2", "question-structure", "hotel"]
    },
    {
      id: "schedule-swap",
      type: "choice",
      eyebrow: "Scene 3 · Programbytte",
      title: "A colleague asks to swap slots. The reason forks into two different sentence types.",
      learningGoal: "Distinguish fordi + subordinate clause from derfor + inversion when giving a reason.",
      sourceRefs: ["sproget.dk: ledsætninger", "Den Danske Ordbog / ordnet.dk"],
      masteryTags: ["fordi-derfor-clause"],
      pressure: "Your colleague Mikkel has a flight at 16:00 and wants your morning slot. You can swap — but your reason must use correct Danish clause structure. One word order choice determines whether you sound like a fluent speaker or a B1 learner.",
      narrative: "Mikkel explains his situation: his return flight is early. You are happy to swap because your talk is ready. But when you open your mouth, the sentence splits into two possible Danish structures.",
      dialogue: [
        { speaker: "Mikkel", line: "Min flyver går kl. 16. Kan vi bytte? Jeg tager gerne din senere tid." },
        { speaker: "You", line: "Selvfølgelig. Jeg kan godt bytte, ..." }
      ],
      notice: "The rule: 'fordi' starts a subordinate clause where 'ikke' goes before the verb. 'Derfor' starts a main clause where 'ikke' goes after the verb — and inversion follows 'derfor'.",
      targetPhrases: ["fordi jeg ikke skal præsentere først", "jeg skal ikke præsentere først", "derfor kan vi bytte", "selvfølgelig kan vi bytte"],
      prompt: "Complete the sentence with correct Danish clause structure.",
      options: [
        { id: "fordi-subordinate", diagnostic: "fordi-triggers-subordinate-order", label: "Jeg kan godt bytte, fordi jeg ikke skal præsentere først.", detail: "correct subordinate clause after fordi", correct: true, effects: { ordstillingClarity: 1, socialConnection: 1, learnerConfidence: 1 }, feedback: "Diagnostic: correct. After 'fordi', the subordinate clause places 'ikke' before 'skal'. This is the rule: fordi + subject + ikke + verb." },
        { id: "derfor-inversion", diagnostic: "derfor-triggers-inversion", label: "Jeg skal ikke præsentere først. Derfor kan vi bytte.", detail: "correct inversion after derfor", correct: false, nearMiss: false, grammarStatus: "grammatical", pragmaticStatus: "different-structure", feedback: "Diagnostic: grammatically correct but a different structure. 'Derfor' triggers a new main clause with inversion: 'Derfor kan vi bytte'. The prompt asks for a completion of 'Jeg kan godt bytte, ...', which expects a fordi subordinate clause." },
        { id: "derfor-no-inversion", diagnostic: "derfor-without-inversion", label: "Jeg skal ikke præsentere først. Derfor vi kan bytte.", detail: "no inversion after derfor", correct: false, effects: { ordstillingClarity: -1, socialConnection: -1 }, feedback: "Diagnostic: near miss. 'Derfor' must trigger inversion just like any fronted element. 'Derfor kan vi bytte' is correct; 'Derfor vi kan bytte' breaks V2." }
      ],
      carry: "Carry-forward: fordi and derfor are not interchangeable. 'Fordi jeg ikke skal præsentere først' uses subordinate word order (ikke before verb). 'Derfor kan vi bytte' uses main clause with inversion (verb before subject). One logic, two Danish structures.",
      tags: ["B1", "B2", "ordstilling", "fordi", "derfor", "subordinate-clause", "inversion"]
    },
    {
      id: "lunch-ordsilling",
      type: "flagship-chain",
      eyebrow: "Scene 4 · Frokostsprog",
      title: "Same word-order choice, four different channels.",
      learningGoal: "Transfer correct Danish word order across formal email, lunch chat, phone message, and presentation context without losing grammatical accuracy.",
      sourceRefs: ["sproget.dk: ordstilling", "sproget.dk: ledsætninger", "Den Danske Ordbog / ordnet.dk"],
      masteryTags: ["inversion-fronted-adverbial", "v2-placement", "fordi-derfor-clause"],
      pressure: "The schedule swap created a ripple. Now you need to confirm it in four different channels — email to the organizer, chat to Mikkel, a quick word at lunch with your manager, and a bio note for the program. Same content, different word order traps.",
      narrative: "You agreed to swap. But agreeing is not the same as confirming. Each channel has a different social weight, and word order errors in the wrong channel can undo the clarity you just built.",
      dialogue: [
        { speaker: "Mikkel", line: "Super, så bytter vi! Jeg skriver til arrangøren." },
        { speaker: "Manager", line: "Hører jeg, at I har omrokkeret programmet?" }
      ],
      notice: "Word order errors look different in every channel. In email, a missing inversion looks sloppy. In chat, the same error looks natural. B2 means knowing when V2 matters and when it can bend.",
      targetPhrases: ["efter aftale bekræfter jeg", "jeg skriver til arrangøren", "det kan vi sagtens", "vi har byttet programtid"],
      prompt: "Choose the sentence that fits the channel and follows correct Danish word order.",
      intent: "Confirm the schedule swap in the right register without breaking V2.",
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
        copy: "Memory-backed recurrence: you already handled inversion after fronted adverbials in the email scene. Now apply the same rule in a channel where it may feel less natural."
      },
      channelVersions: [
        { id: "email", label: "Email to organizer", sample: "Efter aftale med Mikkel bekræfter jeg programændringen.", risk: "Formal channel; missing inversion after 'Efter aftale' reads as unprofessional." },
        { id: "chat", label: "Chat to Mikkel", sample: "Det kan vi sagtens. Jeg snakker med arrangøren.", risk: "Low-stakes channel; word order matters less, but V2 still applies." },
        { id: "lunch", label: "Lunch with manager", sample: "Ja, vi har byttet, fordi Mikkel har en tidlig flyver.", risk: "Semi-formal; fordi triggers subordinate order, but many B1 learners forget." },
        { id: "bio", label: "Program bio note", sample: "Sproginteresse er grunden til, at jeg deltager.", risk: "Public channel; 'at' subordinate clause must follow correct word order." }
      ],
      options: [
        {
          id: "lunch-formal-correct",
          channel: "Email to organizer",
          diagnostic: "applies-inversion-after-fronted-adverbial-in-formal-channel",
          label: "Efter aftale med Mikkel bekræfter jeg, at vi bytter programtid.",
          detail: "correct inversion, formal register",
          correct: true,
          grammarStatus: "grammatical",
          pragmaticStatus: "channel-appropriate",
          consequence: "The organizer sees a professional confirmation with correct V2. The fronted 'Efter aftale' is followed by 'bekræfter', then 'jeg' — textbook inversion in a formal channel.",
          effects: { ordstillingClarity: 1, socialConnection: 1 },
          feedback: "Diagnostic: strong. 'Efter aftale med Mikkel' fronts a time phrase, and 'bekræfter' follows immediately before 'jeg'. Formal V2 executed correctly.",
          repairLadder: [
            { stage: "raw intent", text: "I swap times with Mikkel." },
            { stage: "safer Danish", text: "Jeg bekræfter, at vi bytter programtid." },
            { stage: "channel-ready Danish", text: "Efter aftale med Mikkel bekræfter jeg, at vi bytter programtid." }
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
          channel: "Email to organizer",
          diagnostic: "correct-meaning-no-inversion-after-fronted-phrase",
          label: "Efter aftale med Mikkel jeg bekræfter, at vi bytter programtid.",
          detail: "B1 near miss — missing inversion",
          correct: false,
          nearMiss: true,
          grammarStatus: "ungrammatical",
          pragmaticStatus: "channel-damaging",
          consequence: "The organizer understands the message but notes the word order error. In a formal email, missing inversion after a fronted adverbial weakens the professional impression.",
          effects: { ordstillingClarity: -1, socialConnection: -1 },
          feedback: "Diagnostic: near miss. Every word is correct Danish, but the word order is English. 'Efter aftale' + 'jeg' + 'bekræfter' breaks V2. The verb 'bekræfter' must come second.",
          repairLadder: [
            { stage: "raw phrase", text: "Efter aftale med Mikkel jeg bekræfter byttet." },
            { stage: "safer Danish", text: "Jeg bekræfter byttet efter aftale med Mikkel." },
            { stage: "channel-ready Danish", text: "Efter aftale med Mikkel bekræfter jeg, at vi bytter programtid." }
          ]
        },
        {
          id: "lunch-chat-wrong",
          channel: "Chat to Mikkel",
          diagnostic: "subordinate-word-order-in-main-clause",
          label: "Vi kan sagtens bytte, fordi jeg ikke skal præsentere først alligevel.",
          detail: "grammatical but wrong channel for the message",
          correct: false,
          nearMiss: true,
          grammarStatus: "grammatical",
          pragmaticStatus: "wrong-channel-for-message",
          consequence: "The sentence is grammatically correct but belongs in a different channel. Chat to Mikkel should be shorter and more direct — this level of formal reasoning fits email better.",
          effects: { socialConnection: 0 },
          feedback: "Diagnostic: the word order is correct, but the channel fit is off. In chat, Mikkel already knows why. A short 'Selvfølgelig, det ordner vi' fits better than a full subordinate clause.",
          repairLadder: [
            { stage: "raw intent", text: "Yes I can swap, Mikkel." },
            { stage: "safer Danish", text: "Selvfølgelig, det ordner vi." },
            { stage: "channel-ready Danish", text: "Selvfølgelig, vi bytter bare. Jeg ordner det med arrangøren." }
          ]
        }
      ],
      carry: "Carry-forward: V2 is not optional in formal channels. 'Efter aftale med Mikkel bekræfter jeg' — fronted time phrase, then verb, then subject. In chat, informality can mask errors, but email, bio, and spoken Danish at work expect textbook word order.",
      tags: ["B1", "B2", "ordstilling", "V2", "inversion", "register", "channel-transfer"]
    },
    {
      id: "epilogue",
      type: "choice",
      eyebrow: "Final · Ordstilling",
      title: "The conference went well. The sentences you chose wrote your Danish identity.",
      learningGoal: "Name the B1/B2 principle: word order is not grammar trivia — it determines clarity and social signal.",
      sourceRefs: ["sproget.dk: ordstilling", "Den Danske Ordbog / ordnet.dk"],
      masteryTags: ["ordstilling-principle"],
      pressure: "The conference is over. You sent emails, asked questions, swapped slots, and chatted at lunch. Nobody corrected your Danish. But the people you spoke to noticed every sentence that flowed — and every sentence that hesitated.",
      narrative: "Danish word order is not a test you pass once. It is a social signal you send every time you open your mouth. V2 tells the listener: this person controls the language.",
      dialogue: [{ speaker: "Mikkel (at the end)", line: "Din dansk er blevet virkelig god. Sætningerne sidder lige i skabet." }],
      notice: "Correct word order is not just grammatik — it er et socialt signal. V2 skaber klarhed. It is the difference between 'almost Danish' and 'Danish'.",
      targetPhrases: ["ordstilling er ikke grammatik", "det er et socialt signal", "V2 skaber klarhed", "sætningerne sidder lige i skabet"],
      prompt: "Which principle best summarises the lesson?",
      options: [
        { id: "principle-v2-social", diagnostic: "word-order-as-social-signal", label: "Ordstilling er ikke bare grammatik — det er et socialt signal, der viser, at du kan sproget.", detail: "word order as social signal", correct: true, feedback: "Diagnostic: exactly. Word order is not a rule to memorise — it is a signal you send every sentence. V2 tells the listener you control the language." },
        { id: "principle-grammar-only", diagnostic: "word-order-as-rule-memorisation", label: "Husk at sætte verbet på andenpladsen. Det er den vigtigste regel.", detail: "grammar-only takeaway", correct: false, feedback: "Diagnostic: true but incomplete. V2 is a rule, but the lesson shows that word order lives inside social situations — email, hotel, schedule swap, lunch." },
        { id: "principle-vocab-only", diagnostic: "words-over-structure", label: "Ordforråd er vigtigere end ordstilling. Hvis ordene er rigtige, forstår folk dig.", detail: "vocabulary-only takeaway", correct: false, feedback: "Diagnostic: people will understand you with wrong word order — but they will also register you as a learner. Correct word order is what makes Danish feel like your language." }
      ],
      carry: "Unlocked B1/B2 theme: Danish word order as social operating system — not grammar trivia, but a signal of fluency, clarity, and connection. Sætningerne sidder lige i skabet.",
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
      title: "Clear word order",
      narrative: "The conference ended with a warm handshake from Mikkel and a nod from the organizer: 'God kommunikation.' Your emails used textbook V2, your questions at reception were understood immediately, and your lunch conversation flowed without hesitation. Word order was not a barrier — it was a bridge.",
      danish: "Ordstilling var ikke en mur — det var en bro.",
      carry: "B1/B2 unlocked: correct word order moves you from 'almost Danish' to 'Danish'. V2 is the signal that you control the language."
    },
    {
      id: "ok",
      title: "Acceptable word order",
      narrative: "The conference was fine. People understood you, though a few sentences needed mental re-parsing. Mikkel was grateful for the swap, but the organizer's reply was shorter than expected. You communicated — but word order uncertainty added friction to otherwise good Danish.",
      danish: "Du blev forstået, men ordstillingen skabte stadig friktion.",
      carry: "B1/B2 unlocked: being understood is not the same as sounding fluent. Correct V2 removes the friction that makes listeners work to understand you."
    },
    {
      id: "forvirret",
      title: "Confused word order",
      narrative: "The conference was harder than it needed to be. The organizer replied with 'Kan du bekræfte det igen?' after your email. The receptionist switched to English. Mikkel was friendly, but the lunch chat was mostly in English. Word order errors created distance.",
      danish: "Ordstilling skabte afstand — ikke klarhed.",
      carry: "B1/B2 unlocked: wrong word order costs more than a grammar point. It costs the natural flow that tells Danes: 'I speak your language.'"
    }
  ]
};
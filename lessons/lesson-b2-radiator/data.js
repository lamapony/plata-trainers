window.PLATA_LESSON_B2_RADIATOR = {
  id: "lesson-b2-radiator-register",
  level: "B2",
  title: "Det afhænger af, hvordan du siger det",
  subtitle: "A B2 Danish lesson about complaints, register, modal particles, and social consequences.",
  estimatedMinutes: 14,
  qualityTier: "gold",
  editorialFocus: "Read official Danish precisely, choose register under pressure, and preserve agency without escalating tone.",
  masteryMap: {
    "passive-agency": {
      label: "Read passive agency",
      evidence: "The learner distinguishes registration/process language from an actual repair commitment.",
      remediation: {
        sceneId: "official-reply-passive",
        cta: "Review Scene 1",
        action: "Rerun the landlord email and name the missing actor, date, and deadline before judging whether the text promises a repair."
      },
      sourceRefs: ["Lex: passiv", "sproget.dk: grammatiske betegnelser"]
    },
    "modal-particle-stance": {
      label: "Read particle stance",
      evidence: "The learner identifies how jo, da, sgu, nok, and bare position the speaker socially.",
      remediation: {
        sceneId: "group-chat-particles",
        cta: "Rematch the group chat",
        action: "Rerun the particle matches and say what each small word does socially before you decide whether the advice calms or escalates."
      },
      sourceRefs: ["Dansk Sproghistorie: dialogiske partikler"]
    },
    "formal-register-control": {
      label: "Control formal register",
      evidence: "The learner makes a concrete formal request without importing private-chat force.",
      remediation: {
        sceneId: "two-registers",
        cta: "Repair the formal reply",
        action: "Rerun the two-register scene and keep the useful pressure: ask for a precise date without adding chat-force words."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Dansk Sproghistorie: dialogiske partikler"]
    },
    "understatement-with-agency": {
      label: "Use understatement with agency",
      evidence: "The learner softens a workplace answer while preserving an action and concrete next step.",
      remediation: {
        sceneId: "workplace-understatement",
        cta: "Repair the workplace answer",
        action: "Rerun the workplace completion and include both halves: one agency word and one concrete next step."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "consequence-aware-tone": {
      label: "Choose consequence-aware tone",
      evidence: "The learner names the B2 principle that clarity and relationship control can coexist.",
      remediation: {
        sceneId: "epilogue-consequence",
        cta: "Review the consequence",
        action: "Rerun the final choice and choose the principle that solves the case while preserving the room."
      },
      sourceRefs: ["Lex: passiv", "Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"]
    }
  },
  simulation: {
    expectedEndingId: "diplomatic",
    completionAnswers: {
      "workplace-understatement": {
        reject: ["varme", "jeg har bedt"],
        accept: "jeg har bedt udlejeren om en konkret dato"
      }
    },
    paths: [
      {
        id: "diplomatic",
        expectedEndingId: "diplomatic",
        expectedVariables: { landlordTension: -1, sofiaTrust: 0, emilEscalation: 0, workplaceTrust: 3 },
        expectedCorrect: 8,
        expectedWeakMastery: [],
        actions: [
          { sceneId: "official-reply-passive", optionId: "accurate", expectCorrect: true },
          { sceneId: "group-chat-particles", matchAll: true },
          { sceneId: "two-registers", optionId: "formal-clear", expectCorrect: true },
          { sceneId: "workplace-understatement", answer: "jeg har bedt udlejeren om en konkret dato", expectCorrect: true },
          { sceneId: "epilogue-consequence", optionId: "balanced", expectCorrect: true }
        ]
      },
      {
        id: "aggressive",
        expectedEndingId: "aggressive",
        expectedVariables: { landlordTension: 3, sofiaTrust: -1, emilEscalation: 0, workplaceTrust: 1 },
        expectedCorrect: 5,
        expectedWeakMastery: ["passive-agency", "formal-register-control", "modal-particle-stance", "consequence-aware-tone"],
        actions: [
          { sceneId: "official-reply-passive", optionId: "too-aggressive", expectCorrect: false },
          { sceneId: "group-chat-particles", matchAll: true },
          { sceneId: "two-registers", optionId: "formal-aggressive", expectCorrect: false },
          { sceneId: "workplace-understatement", answer: "jeg har bedt udlejeren om en konkret dato", expectCorrect: true },
          { sceneId: "epilogue-consequence", optionId: "always-hard", expectCorrect: false }
        ]
      },
      {
        id: "passive",
        expectedEndingId: "passive",
        expectedVariables: { landlordTension: 0, sofiaTrust: 0, emilEscalation: 0, workplaceTrust: -1 },
        expectedCorrect: 4,
        expectedWeakMastery: ["passive-agency", "formal-register-control", "modal-particle-stance", "understatement-with-agency", "consequence-aware-tone"],
        actions: [
          { sceneId: "official-reply-passive", optionId: "too-trusting", expectCorrect: false },
          { sceneId: "group-chat-particles", matchAll: true },
          { sceneId: "two-registers", optionId: "formal-passive", expectCorrect: false },
          { sceneId: "workplace-understatement", answer: "varme", expectCorrect: false },
          { sceneId: "epilogue-consequence", optionId: "always-soft", expectCorrect: false }
        ]
      }
    ]
  },
  variables: {
    landlordTension: 0,
    sofiaTrust: 0,
    emilEscalation: 0,
    workplaceTrust: 0
  },
  languagePhenomena: [
    { item: "jo", function: "expects shared understanding; can sound accusatory" },
    { item: "da", function: "softens, distances, or frames something as obvious" },
    { item: "vel", function: "uncertainty / appeal for agreement" },
    { item: "nok", function: "probability, understatement, resigned optimism" },
    { item: "sgu", function: "strong informal emphasis; risky outside close relationships" },
    { item: "passiv", function: "can hide responsibility in official writing" }
  ],
  sourceNotes: [
    {
      title: "Lex: passiv",
      url: "https://lex.dk/passiv",
      supports: ["Danish passive can downplay or exclude the agent", "s-passive and blive-passive differ formally, semantically, and stylistically"]
    },
    {
      title: "Dansk Sproghistorie: dialogiske partikler",
      url: "https://www.dansksproghistorie.dk/75/",
      supports: ["jo, da, sgu, nok, vel, and related words can mark the speaker's stance toward the listener"]
    },
    {
      title: "sproget.dk: grammatiske betegnelser",
      url: "https://sproget.dk/sprogviden/ordlister/grammatiske-betegnelser/",
      supports: ["blive-passiv / omskreven passiv terminology"]
    },
    {
      title: "borger.dk/lifeindenmark.dk skrivevejledning",
      url: "https://digitaliser.dk/Media/638295979179542926/Skrivevejledning%20for%20borger.dk_september%202023_version%201.0.pdf",
      supports: ["Official Danish should be concrete and precise; avoid paper-word style where possible"]
    }
  ],
  scenes: [
    {
      id: "official-reply-passive",
      type: "choice",
      eyebrow: "Scene 1 · Brevet",
      title: "The landlord answers politely without promising anything.",
      learningGoal: "Distinguish a registered case from an actual repair commitment in formal passive Danish.",
      sourceRefs: ["Lex: passiv", "sproget.dk: grammatiske betegnelser"],
      masteryTags: ["passive-agency"],
      pressure: "It is January, the radiator has been broken for five days, and the official reply looks calm enough to make you doubt your own irritation.",
      narrative: "The email is perfect Danish: formal, smooth, and evasive. The question is not what the words mean, but what the sender avoids taking responsibility for.",
      dialogue: [
        { speaker: "Udlejer", line: "Der er blevet noteret en reklamation vedrørende radiatoren." },
        { speaker: "Udlejer", line: "Der vil blive sendt en håndværker, når det passer ind i planlægningen." }
      ],
      notice: "Passive voice removes the actor. Nobody says: Vi sender en håndværker på fredag.",
      targetPhrases: ["Der er blevet noteret", "reklamation vedrørende radiatoren", "der vil blive sendt en håndværker", "de lover ikke en dato"],
      prompt: "What does the reply actually promise?",
      options: [
        { id: "too-trusting", diagnostic: "overreads-passive-as-promise", label: "De lover, at radiatoren bliver fikset hurtigt.", detail: "too trusting", correct: false, effects: { landlordTension: 0 }, feedback: "Diagnostic: you treated passive planning language as a concrete appointment. There is no actor, date, or deadline." },
        { id: "accurate", diagnostic: "separates-registration-from-commitment", label: "De har registreret sagen, men de lover ikke en dato.", detail: "accurate reading", correct: true, effects: { landlordTension: 0, workplaceTrust: 1 }, feedback: "Diagnostic: correct. You identified the only commitment: the case is registered. Everything after that is process language, not a repair promise." },
        { id: "too-aggressive", diagnostic: "adds-refusal-not-in-text", label: "De nægter at reparere radiatoren.", detail: "too aggressive", correct: false, effects: { landlordTension: 1 }, feedback: "Diagnostic: you converted missing commitment into refusal. B2 reading means naming evasion without adding an accusation the text does not support." }
      ],
      carry: "Carry-forward: official passive wording like 'Der er blevet noteret en reklamation vedrørende radiatoren' and 'der vil blive sendt en håndværker' can sound polite while avoiding hvem, hvornår, sagen, passer ind i planlægningen, registreret, and lover.",
      tags: ["B2", "passive", "official-register", "housing"]
    },
    {
      id: "group-chat-particles",
      type: "match",
      eyebrow: "Scene 2 · Gruppechatten",
      title: "Your friends reveal their stance before they make an argument.",
      learningGoal: "Identify social stance from Danish particles before reacting to advice.",
      sourceRefs: ["Dansk Sproghistorie: dialogiske partikler"],
      masteryTags: ["modal-particle-stance"],
      pressure: "Sofia wants to calm you down. Emil wants you to escalate. Their particles do half the work.",
      narrative: "You paste the landlord email into the group chat. Four replies arrive. None of them are neutral, even when they pretend to be.",
      dialogue: [
        { speaker: "Sofia", line: "Ej, det er da helt fint. Han svarer jo." },
        { speaker: "Emil", line: "Det er sgu ikke godt nok. Skriv igen." }
      ],
      notice: "Jo, da, sgu, nok, bare are not filler. They position the speaker socially.",
      targetPhrases: ["det er da helt fint", "han svarer jo", "det er sgu ikke godt nok", "det løser sig nok"],
      prompt: "Match each line to the stance it carries.",
      pairs: [
        { id: "soften", left: "Ej, det er da helt fint. Han svarer jo.", right: "de-escalating; expects agreement", feedback: "Da lowers the temperature; jo treats the reply as something you should already accept." },
        { id: "escalate", left: "Det er sgu ikke godt nok. Skriv igen.", right: "supportive but escalatory", feedback: "Sgu adds emotional force. It supports your frustration, but it also pushes you toward escalation." },
        { id: "practical", left: "Det løser sig nok, men jeg ville bede om en dato.", right: "cautious and practical", feedback: "Nok softens the prediction; bede om en dato turns the emotion into a concrete next step." },
        { id: "suspicious", left: "Han prøver bare at trække tiden.", right: "suspicious and dismissive", feedback: "Bare reduces the landlord's explanation to a tactic. Useful in chat, risky in formal writing." }
      ],
      carry: "Carry-forward: particles become social variables, not vocabulary trivia; 'det løser sig nok' calms, while 'han prøver at trække tiden' escalates suspicion.",
      tags: ["B2", "modal-particles", "subtext", "informal-register"]
    },
    {
      id: "two-registers",
      type: "choice",
      eyebrow: "Scene 3 · To svar",
      title: "The same frustration needs two different Danish versions.",
      learningGoal: "Make a formal request concrete without importing private-chat aggression.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Dansk Sproghistorie: dialogiske partikler"],
      masteryTags: ["formal-register-control", "modal-particle-stance"],
      pressure: "You must answer the landlord and also text Emil. If you use one register for both, somebody will misunderstand you.",
      narrative: "Formal Danish should move the case forward without sounding like a threat. Chat Danish can carry emotion, but not destroy your judgement.",
      notice: "Register shift is not decoration. It changes which doors stay open.",
      targetPhrases: ["jeg vil gerne bede om", "en mere præcis dato", "temperaturen er faldet", "sgu alt for koldt"],
      prompt: "Choose the best formal sentence for the landlord.",
      options: [
        { id: "formal-clear", diagnostic: "concrete-civil-request", label: "Jeg vil gerne bede om en mere præcis dato, da temperaturen er faldet til under 12 grader.", detail: "clear formal request", correct: true, effects: { landlordTension: -1, workplaceTrust: 1 }, feedback: "Diagnostic: strong formal Danish. Bede om keeps the request civil; præcis dato and 12 grader make it actionable." },
        { id: "formal-aggressive", diagnostic: "imports-private-emphasis-into-formal-email", label: "Jeg kræver, at I fikser det nu, for det er sgu alt for koldt.", detail: "register clash", correct: false, effects: { landlordTension: 2, sofiaTrust: -1 }, feedback: "Diagnostic: the facts are usable, but kræver + nu + sgu moves the message from firm to hostile. Save sgu for private chat." },
        { id: "formal-passive", diagnostic: "over-softens-and-removes-pressure", label: "Det løser sig nok, men det ville være fint med varme på et tidspunkt.", detail: "too weak", correct: false, effects: { landlordTension: 0, workplaceTrust: -1 }, feedback: "Diagnostic: too much softening. Nok, ville være fint, and på et tidspunkt remove the date, actor, and pressure." }
      ],
      carry: "Carry-forward: being polite is not the same as being vague; a useful request asks for en mere præcis dato because temperaturen er faldet til under 12 grader.",
      tags: ["B2", "register", "complaint", "formal-writing"]
    },
    {
      id: "workplace-understatement",
      type: "completion",
      eyebrow: "Scene 4 · Arbejdspladsen",
      title: "Honesty is not the same sentence in every room.",
      learningGoal: "Use understatement without losing agency when discussing a private problem at work.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["understatement-with-agency"],
      pressure: "Your supervisor Mette is friendly, but not your close friend. She asks about the apartment while making coffee.",
      narrative: "You can be honest, but you also need to sound like someone who can handle a problem without turning every room into a courtroom.",
      dialogue: [
        { speaker: "Mette", line: "Hvordan går det med lejligheden? Har du fået varme?" }
      ],
      notice: "Danish understatement can be socially intelligent, but passivity can hide inside it.",
      targetPhrases: ["det går fint nok", "lidt bøvl med varmen", "jeg har bedt udlejeren", "en konkret dato"],
      prompt: "Complete a balanced B2 answer. Include one agency word and one concrete next step.",
      prefix: "Det går fint nok. Der har været lidt bøvl med varmen, men",
      placeholder: "jeg har bedt udlejeren om en konkret dato",
      acceptKeywordGroups: [
        { name: "agency word", keywords: ["bedt", "skrevet", "ringet", "kontaktet", "aftalt"] },
        { name: "concrete next step", keywords: ["dato", "tid", "håndværker", "udlejer", "varme"] }
      ],
      success: "Good. Fint nok and lidt bøvl soften the social surface, while an agency word plus a concrete next step keeps control of the situation.",
      failure: "Your answer needs both sides of the B2 move: an agency word (bedt/skrevet/ringet/kontaktet) and a concrete next step (dato/tid/håndværker/udlejer/varme).",
      effects: { workplaceTrust: 1 },
      carry: "Carry-forward: tone is not honesty versus lying. When Mette asks 'Hvordan går det med lejligheden? Har du fået varme?', 'lidt bøvl med varmen' gives the useful amount of truth for the room.",
      tags: ["B2", "understatement", "workplace-register", "agency"]
    },
    {
      id: "epilogue-consequence",
      type: "choice",
      eyebrow: "Final · Konsekvens",
      title: "The radiator is fixed. The relationships remember the wording.",
      learningGoal: "Name the B2 principle: clarity and relationship control can coexist.",
      sourceRefs: ["Lex: passiv", "Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["consequence-aware-tone"],
      pressure: "A week later, the case is closed. But language did not only repair a radiator. It changed how people read you.",
      narrative: "The best outcome is not always the one where you were maximally right. B2 means seeing the price of tone.",
      notice: "A complaint has two goals: solve the problem and preserve enough relationship to live with the solution.",
      targetPhrases: ["være tydelig", "uden at lyde aggressiv", "undgå konflikt", "vente"],
      prompt: "Which sentence best summarises the lesson?",
      options: [
        { id: "balanced", diagnostic: "states-core-b2-register-principle", label: "Man kan godt være tydelig uden at lyde aggressiv.", detail: "balanced B2 takeaway", correct: true, feedback: "Diagnostic: yes. The lesson's pattern is clarity plus relationship control: actor, date, and tone all stay visible." },
        { id: "always-hard", diagnostic: "confuses-force-with-effectiveness", label: "Man skal altid skrive så hårdt som muligt.", detail: "overcorrection", correct: false, feedback: "Diagnostic: overcorrection. Hard language can solve one case while making every future exchange colder." },
        { id: "always-soft", diagnostic: "confuses-politeness-with-passivity", label: "Man skal helst undgå konflikt og vente.", detail: "passive", correct: false, feedback: "Diagnostic: passivity is also a cost. If you remove all pressure, you may preserve politeness while losing time, heat, and respect." }
      ],
      carry: "Unlocked B2 theme: Danish as social operating system — not only grammar, but consequence: be tydelig uden at lyde aggressiv.",
      tags: ["B2", "reflection", "argumentation", "social-consequence"]
    }
  ],
  endingLogic: {
    diplomatic: { maxLandlordTension: 0, minWorkplaceTrust: 1 },
    aggressive: { minLandlordTension: 2 },
    passive: {}
  },
  endings: [
    {
      id: "diplomatic",
      title: "Diplomatic resolution",
      narrative: "The radiator was fixed by Thursday. The landlord sent a short apology — not warm, but correct. Sofia still trusts your judgement, and at work Mette sees someone who handles problems without creating drama. You kept the heat on without burning any bridges.",
      danish: "Du fik varme uden at brænde broer.",
      carry: "B2 unlocked: being clear and being liked are not opposites — tone is the bridge."
    },
    {
      id: "aggressive",
      title: "Escalated resolution",
      narrative: "The radiator was fixed by Wednesday. But the landlord's reply was cold and formal, and Sofia has been quieter in the group chat since your sharp reply. You won the argument — the question is whether you won the relationships.",
      danish: "Du fik varme, men mistede varmen hos andre.",
      carry: "B2 unlocked: the sharpest sentence sometimes wins the case and loses the room."
    },
    {
      id: "passive",
      title: "Delayed resolution",
      narrative: "The radiator was fixed — eventually. You waited an extra week because your replies were too soft. At work, Mette assumed you were handling it, but privately you felt you had apologised for needing heat. Being polite is not a mistake — but being too polite can cost real time.",
      danish: "Du fik varme til sidst, men du betalte med tålmodighed.",
      carry: "B2 unlocked: politeness without clarity is a form of invisible waiting."
    }
  ]
};

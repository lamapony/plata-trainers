window.PLATA_LESSON_B2_RADIATOR = {
  id: "lesson-b2-radiator-register",
  level: "B2",
  title: "Det afhænger af, hvordan du siger det",
  subtitle: "A B2 Danish lesson about complaints, register, modal particles, and social consequences.",
  estimatedMinutes: 14,
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
    }
  ],
  scenes: [
    {
      id: "official-reply-passive",
      type: "choice",
      eyebrow: "Scene 1 · Brevet",
      title: "The landlord answers politely without promising anything.",
      pressure: "It is January, the radiator has been broken for five days, and the official reply looks calm enough to make you doubt your own irritation.",
      narrative: "The email is perfect Danish: formal, smooth, and evasive. The question is not what the words mean, but what the sender avoids taking responsibility for.",
      dialogue: [
        { speaker: "Udlejer", line: "Der er blevet noteret en reklamation vedrørende radiatoren." },
        { speaker: "Udlejer", line: "En håndværker vil blive sendt, når det passer ind i planlægningen." }
      ],
      notice: "Passive voice removes the actor. Nobody says: Vi sender en håndværker på fredag.",
      targetPhrases: ["Der er blevet noteret", "reklamation vedrørende radiatoren", "vil blive sendt", "de lover ikke en dato"],
      prompt: "What does the reply actually promise?",
      options: [
        { id: "too-trusting", label: "De lover, at radiatoren bliver fikset hurtigt.", detail: "too trusting", correct: false, effects: { landlordTension: 0 }, feedback: "Diagnostic: you treated passive planning language as a concrete appointment. There is no actor, date, or deadline." },
        { id: "accurate", label: "De har registreret sagen, men de lover ikke en dato.", detail: "accurate reading", correct: true, effects: { landlordTension: 0, workplaceTrust: 1 }, feedback: "Diagnostic: correct. You identified the only commitment: the case is registered. Everything after that is process language, not a repair promise." },
        { id: "too-aggressive", label: "De nægter at reparere radiatoren.", detail: "too aggressive", correct: false, effects: { landlordTension: 1 }, feedback: "Diagnostic: you converted missing commitment into refusal. B2 reading means naming evasion without adding an accusation the text does not support." }
      ],
      carry: "Carry-forward: official passive wording like 'Der er blevet noteret en reklamation vedrørende radiatoren' and 'vil blive sendt' can sound polite while avoiding hvem, hvornår, sagen, håndværker, passer ind i planlægningen, registreret, and lover.",
      tags: ["B2", "passive", "official-register", "housing"]
    },
    {
      id: "group-chat-particles",
      type: "match",
      eyebrow: "Scene 2 · Gruppechatten",
      title: "Your friends reveal their stance before they make an argument.",
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
      pressure: "You must answer the landlord and also text Emil. If you use one register for both, somebody will misunderstand you.",
      narrative: "Formal Danish should move the case forward without sounding like a threat. Chat Danish can carry emotion, but not destroy your judgement.",
      notice: "Register shift is not decoration. It changes which doors stay open.",
      targetPhrases: ["jeg vil gerne bede om", "en mere præcis dato", "temperaturen er faldet", "sgu alt for koldt"],
      prompt: "Choose the best formal sentence for the landlord.",
      options: [
        { id: "formal-clear", label: "Jeg vil gerne bede om en mere præcis dato, da temperaturen er faldet til under 12 grader.", detail: "clear formal request", correct: true, effects: { landlordTension: -1, workplaceTrust: 1 }, feedback: "Diagnostic: strong formal Danish. Bede om keeps the request civil; præcis dato and 12 grader make it actionable." },
        { id: "formal-aggressive", label: "Jeg kræver, at I fikser det nu, for det er sgu alt for koldt.", detail: "register clash", correct: false, effects: { landlordTension: 2, sofiaTrust: -1 }, feedback: "Diagnostic: the facts are usable, but kræver + nu + sgu moves the message from firm to hostile. Save sgu for private chat." },
        { id: "formal-passive", label: "Det løser sig nok, men det ville være fint med varme på et tidspunkt.", detail: "too weak", correct: false, effects: { landlordTension: 0, workplaceTrust: -1 }, feedback: "Diagnostic: too much softening. Nok, ville være fint, and på et tidspunkt remove the date, actor, and pressure." }
      ],
      carry: "Carry-forward: being polite is not the same as being vague; a useful request asks for en mere præcis dato because temperaturen er faldet til under 12 grader.",
      tags: ["B2", "register", "complaint", "formal-writing"]
    },
    {
      id: "workplace-understatement",
      type: "completion",
      eyebrow: "Scene 4 · Arbejdspladsen",
      title: "Honesty is not the same sentence in every room.",
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
      pressure: "A week later, the case is closed. But language did not only repair a radiator. It changed how people read you.",
      narrative: "The best outcome is not always the one where you were maximally right. B2 means seeing the price of tone.",
      notice: "A complaint has two goals: solve the problem and preserve enough relationship to live with the solution.",
      targetPhrases: ["være tydelig", "uden at lyde aggressiv", "undgå konflikt", "vente"],
      prompt: "Which sentence best summarises the lesson?",
      options: [
        { id: "balanced", label: "Man kan godt være tydelig uden at lyde aggressiv.", detail: "balanced B2 takeaway", correct: true, feedback: "Diagnostic: yes. The lesson's pattern is clarity plus relationship control: actor, date, and tone all stay visible." },
        { id: "always-hard", label: "Man skal altid skrive så hårdt som muligt.", detail: "overcorrection", correct: false, feedback: "Diagnostic: overcorrection. Hard language can solve one case while making every future exchange colder." },
        { id: "always-soft", label: "Man skal helst undgå konflikt og vente.", detail: "passive", correct: false, feedback: "Diagnostic: passivity is also a cost. If you remove all pressure, you may preserve politeness while losing time, heat, and respect." }
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

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
      prompt: "What does the reply actually promise?",
      options: [
        { id: "too-trusting", label: "De lover, at radiatoren bliver fikset hurtigt.", detail: "too trusting", correct: false, effects: { landlordTension: 0 }, feedback: "No. The email sounds responsible, but it gives no date and no named actor." },
        { id: "accurate", label: "De har registreret sagen, men de lover ikke en dato.", detail: "accurate reading", correct: true, effects: { landlordTension: 0, workplaceTrust: 1 }, feedback: "Yes. You separate politeness from commitment. That is B2 reading." },
        { id: "too-aggressive", label: "De nægter at reparere radiatoren.", detail: "too aggressive", correct: false, effects: { landlordTension: 1 }, feedback: "Too far. They have not refused. B2 means noticing evasion without inventing conflict." }
      ],
      carry: "Carry-forward: passive wording can be polite and evasive at the same time.",
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
      prompt: "Match each line to the stance it carries.",
      pairs: [
        { id: "soften", left: "Ej, det er da helt fint. Han svarer jo.", right: "de-escalating; expects agreement" },
        { id: "escalate", left: "Det er sgu ikke godt nok. Skriv igen.", right: "supportive but escalatory" },
        { id: "practical", left: "Det løser sig nok, men jeg ville bede om en dato.", right: "cautious and practical" },
        { id: "suspicious", left: "Han prøver bare at trække tiden.", right: "suspicious and dismissive" }
      ],
      carry: "Carry-forward: particles become social variables, not vocabulary trivia.",
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
      prompt: "Choose the best formal sentence for the landlord.",
      options: [
        { id: "formal-clear", label: "Jeg vil gerne bede om en mere præcis dato, da temperaturen er faldet til under 12 grader.", detail: "clear formal request", correct: true, effects: { landlordTension: -1, workplaceTrust: 1 }, feedback: "Clear, specific, and firm without sounding like a threat." },
        { id: "formal-aggressive", label: "Jeg kræver, at I fikser det nu, for det er sgu alt for koldt.", detail: "register clash", correct: false, effects: { landlordTension: 2, sofiaTrust: -1 }, feedback: "The content is understandable, but the register clash escalates the conflict." },
        { id: "formal-passive", label: "Det løser sig nok, men det ville være fint med varme på et tidspunkt.", detail: "too weak", correct: false, effects: { landlordTension: 0, workplaceTrust: -1 }, feedback: "Too soft. You sound like you are apologising for having a radiator." }
      ],
      carry: "Carry-forward: being polite is not the same as being vague.",
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
      prompt: "Complete a balanced B2 answer.",
      prefix: "Det går fint nok. Der har været lidt bøvl med varmen, men",
      placeholder: "jeg har bedt udlejeren om en konkret dato",
      success: "Good. Fint nok and lidt bøvl soften the social surface, while jeg har bedt keeps agency.",
      carry: "Carry-forward: tone is not honesty versus lying. It is choosing the useful amount of truth for the room.",
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
      prompt: "Which sentence best summarises the lesson?",
      options: [
        { id: "balanced", label: "Man kan godt være tydelig uden at lyde aggressiv.", detail: "balanced B2 takeaway", correct: true, feedback: "Exactly. This is the core adult-language move." },
        { id: "always-hard", label: "Man skal altid skrive så hårdt som muligt.", detail: "overcorrection", correct: false, feedback: "Sometimes directness works, but always escalating makes you predictable and expensive socially." },
        { id: "always-soft", label: "Man skal helst undgå konflikt og vente.", detail: "passive", correct: false, feedback: "Avoiding conflict is also a choice, and it can cost you heat, time, and respect." }
      ],
      carry: "Unlocked B2 theme: Danish as social operating system — not only grammar, but consequence.",
      tags: ["B2", "reflection", "argumentation", "social-consequence"]
    }
  ]
};

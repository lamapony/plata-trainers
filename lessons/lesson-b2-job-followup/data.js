window.PLATA_LESSON_B2_JOB_FOLLOWUP = {
  id: "lesson-b2-job-followup",
  level: "B2",
  title: "Efter interviews — tone, tak, og tålmodighed",
  subtitle: "A B2 Danish lesson about post-interview follow-up: formal email, LinkedIn, and the price of tone.",
  estimatedMinutes: 15,
  variables: {
    employerTone: 0,      // -2 cold .. +2 warm
    desperation: 0,       // 0 calm .. 3 pushy
    professionalism: 0,   // 0 casual .. 3 polished
    networkTrust: 0       // -1 damaged .. +2 strengthened
  },
  languagePhenomena: [
    { item: "vedrørende", function: "formal preposition, signals official register" },
    { item: "henvendelse", function: "noun for inquiry/contact, replaces besked/mail in formal writing" },
    { item: "modtage", function: "formal 'receive', not få — register marker" },
    { item: "jeg tager stilling til", function: "formal phrase: 'I address / respond to'" },
    { item: "partikler: jo/da/nok", function: "soften or position stance in professional mail" },
    { item: "passiv: 'der gives svar'", function: "can sound evasive; active 'vi svarer' owns it" }
  ],
  scenes: [
    {
      id: "silence-pressure",
      type: "choice",
      eyebrow: "Scene 1 · Stille dage",
      title: "The interview felt good. Now the inbox is quiet.",
      pressure: "Three days since the interview at a Copenhagen tech company. You want the role. Checking mail every hour makes you look desperate — to yourself.",
      narrative: "You replay the conversation: the CTO asked about your Danish, you answered in Danish, she nodded. No red flags. But Danish hiring moves at its own pace. The silence is not rejection — it is process.",
      dialogue: [
        { speaker: "Internal voice", line: "Skal jeg skrive? Venter de på mig? Er det for tidligt?" }
      ],
      notice: "Danish hiring culture: silence ≠ no. Process takes 1–2 weeks. Acting on anxiety reads as juniormess.",
      prompt: "What is the professional move right now?",
      options: [
        { id: "wait-calm", label: "Vent 5 arbejdsdage. Skriv så en kort, præcis opfølgning.", detail: "calm, process-aware", correct: true, effects: { employerTone: 1, desperation: 0, professionalism: 1 }, feedback: "Yes. You respect their process and signal seniority." },
        { id: "wait-anxious", label: "Vent, men tjek mail hver time. Skriv efter 2 dage alligevel.", detail: "anxious waiting", correct: false, effects: { desperation: 1 }, feedback: "The behaviour leaks. Even a polite mail after 2 days carries tension." },
        { id: "push-now", label: "Skriv i dag. Vis engagement. 'Jeg er meget interesseret.'", detail: "pushy", correct: false, effects: { employerTone: -1, desperation: 2, professionalism: -1 }, feedback: "Too early. Reads as insecurity, not interest. Danish employers value autonomi." }
      ],
      carry: "Carry-forward: silence is data. When anxiety says 'venter de på mig?' and 'er det for tidligt?', the professional move is: vent 5 arbejdsdage, then skriv a kort, præcis opfølgning.",
      tags: ["B2", "professional-culture", "silence", "patience", "register-awareness"]
    },
    {
      id: "email-register",
      type: "choice",
      eyebrow: "Scene 2 · Opfølgningsmail",
      title: "Day 5. You write the follow-up. Register decides the impression.",
      pressure: "One email. It will be read by the hiring manager and forwarded to the CTO. Too casual = not serious. Too stiff = robotic. The sweet spot is warm professional Danish.",
      narrative: "You open a blank compose window. Subject line: 'Opfølgning på interview — [Stilling]'. Now the body. Every word choice is a register signal.",
      dialogue: [
        { speaker: "You (drafting)", line: "Kære [Navn] / Hej [Navn] — hvad signalerer hvad?" },
        { speaker: "CTO (memory)", line: "Vi lægger vægt på, at folk kan skrive professionelt på dansk." }
      ],
      notice: "Kære = formal, safe, expected. Hej = acceptable if they used du first, but risky in follow-up. B2 writers choose Kære unless du was explicitly agreed.",
      prompt: "Choose the opening + first sentence that hits warm professional Danish.",
      options: [
        { id: "formal-warm", label: "Kære [Navn],\n\nJeg tager stilling til jeres henvendelse og vil takke for en god dialog i torsdags.", detail: "formal, warm, owns the follow-up", correct: true, effects: { employerTone: 1, professionalism: 1, networkTrust: 1 }, feedback: "Strong. 'Jeg tager stilling til' signals professional ownership. 'God dialog' is specific, not generic." },
        { id: "casual-generic", label: "Hej [Navn],\n\nTak for snakken i torsdags! Bare en hurtig opfølgning — jeg er super interesseret.", detail: "too casual, 'bare' weakens", correct: false, effects: { employerTone: -1, professionalism: -1, desperation: 1 }, feedback: "'Bare en hurtig opfølgning' minimises your effort. 'Super interesseret' reads junior." },
        { id: "stiff-passive", label: "Kære [Navn],\n\nDer gives besked på, at jeg fortsat er interesseret i stillingen.", detail: "passive, evasive", correct: false, effects: { employerTone: -1, professionalism: 0 }, feedback: "Passive 'der gives besked' hides agency. You sound like a form letter, not a candidate." }
      ],
      carry: "Carry-forward: 'Kære' signalerer formalitet; 'vi lægger vægt på', 'jeg tager stilling til', 'jeres henvendelse', 'takke', and a concrete reference to folk writing professionelt på dansk create professional warmth.",
      tags: ["B2", "formal-email", "register", "tage-stilling-til", "particles"]
    },
    {
      id: "linkedin-choice",
      type: "choice",
      eyebrow: "Scene 3 · LinkedIn request",
      title: "You also want to connect with the CTO on LinkedIn. Different platform, different rules.",
      pressure: "LinkedIn is semi-public. The note field is 300 characters. Too formal = awkward. Too casual = presumptuous. The CTO will see this alongside your email.",
      narrative: "You click 'Connect' → 'Add a note'. The preview shows your profile headline: 'Senior Developer | Danish B2'. The note is your only context.",
      dialogue: [
        { speaker: "You (drafting)", line: "Kære [Navn] / Hej [Navn] — tak for tiden / tak for interviewet?" }
      ],
      notice: "LinkedIn notes are read on mobile. First 120 chars must carry the signal. 'Kære' works but 'Hej' is standard here — if you reference the specific conversation.",
      prompt: "Choose the LinkedIn note that complements (not duplicates) your email.",
      options: [
        { id: "linkedin-good", label: "Hej [Navn],\nTak for en god teknisk dialog i torsdags. Vil gerne holde kontakt uanset udgang.\n— [Dit navn]", detail: "specific, low-pressure, keeps door open", correct: true, effects: { networkTrust: 2, professionalism: 1 }, feedback: "Perfect. 'Uanset udgang' shows maturity. Specific reference ('teknisk dialog') proves attention." },
        { id: "linkedin-pushy", label: "Kære [Navn],\nJeg skriver for at understrege mit store interesse i stillingen. Håber på hurtigt svar.\n— [Dit navn]", detail: "duplicates email, pushy", correct: false, effects: { desperation: 1, networkTrust: -1 }, feedback: "Redundant with email. 'Håber på hurtigt svar' pressures a connection, not a conversation." },
        { id: "linkedin-generic", label: "Hej [Navn],\nTak for at tilføje mig. Ser frem til at følge jeres arbejde.\n— [Dit navn]", detail: "generic, low signal", correct: false, effects: { networkTrust: 0 }, feedback: "Safe but forgettable. No reference to interview = could be any recruiter spam." }
      ],
      carry: "Carry-forward: platform-specific register. Email = formal ownership. LinkedIn = 'tak for tiden/interviewet' plus 'vil gerne holde kontakt' in a specific, low-pressure, human tone.",
      tags: ["B2", "linkedin", "networking", "register-shift", "low-pressure"]
    },
    {
      id: "reply-consequence",
      type: "completion",
      eyebrow: "Scene 4 · Svaret",
      title: "The reply arrives. Your tone shaped what you got back.",
      pressure: "Three scenarios. The hiring manager writes back. The Danish tells you where you stand — and whether your follow-up helped or hurt.",
      narrative: "The email lands. Subject: 'Re: Opfølgning på interview'. You open it. The first sentence sets the tone.",
      dialogue: [
        { speaker: "Hiring Manager", line: "[Variabel svar baseret på dine valg]" }
      ],
      notice: "Professional Danish replies mirror your register. Warm professional → warm specific. Pushy → formal distance. Passive → generic template.",
      prompt: "Complete the hiring manager's reply based on the tone you built. Use at least one keyword from: [takke, dialog, proces, tid, høre, fremtidig].",
      prefix: "Kære [Dit navn],\n\n",
      placeholder: "takke for din mail og den gode dialog...",
      acceptKeywords: ["takke", "dialog", "proces", "tid", "høre", "fremtidig", "vurdere", "næste", "skridt"],
      success: "Good. You constructed a reply that matches professional Danish register.",
      failure: "Include at least one keyword: takke, dialog, proces, tid, høre, fremtidig, vurdere, næste, skridt.",
      effects: {},
      carry: "Carry-forward: their reply reflects your tone. You write the first draft of the relationship.",
      tags: ["B2", "reply-analysis", "mirroring", "professional-warmth"]
    },
    {
      id: "epilogue",
      type: "choice",
      eyebrow: "Final · Udfald",
      title: "The process concludes. Your Danish wrote the ending before the decision.",
      pressure: "Two weeks later. The decision email arrives. But the real outcome — your reputation in this network — was decided by how you handled the wait, the follow-up, and the connection.",
      narrative: "Three candidates. Same skills. Different Danish. The hiring manager remembers: who wrote like a colleague, who wrote like a supplicant, who wrote like a template.",
      dialogue: [
        { speaker: "CTO (internal)", line: "Den der kunne skrive 'Jeg tager stilling til' — den kan vi bruge." }
      ],
      notice: "B2 Danish is not grammar. It is social operating system: register, particles, agency, patience. The language you choose writes the relationship before the contract.",
      prompt: "Which principle summarises the lesson?",
      options: [
        { id: "principle-owned", label: "Professionel dansk tager ejerskab: 'Jeg tager stilling til' i stedet for 'Der gives besked'.", detail: "agency + register", correct: true, feedback: "Exactly. Agency in language = agency in role." },
        { id: "principle-polite", label: "Vær altid maksimalt høflig — 'Kære', 'venligst', 'hvis De vil være så god'.", detail: "over-politeness", correct: false, feedback: "Over-politeness reads as distance, not warmth. Danish professional warmth is direct + human." },
        { id: "principle-wait", label: "Skriv aldrig opfølgning. Venter viser tålmodighed.", detail: "passive", correct: false, feedback: "Silence is not strategy. A well-timed, well-toned follow-up signals competence." }
      ],
      carry: "Unlocked B2 theme: Danish as professional operating system — professionel dansk tager ejerskab: 'Jeg tager stilling til' i stedet for 'Der gives besked', so a team thinks den kandidat kan vi bruge.",
      tags: ["B2", "reputation", "agency", "professional-identity", "reflection"]
    }
  ],
  endingLogic: {
    professional: { minEmployerTone: 1, minProfessionalism: 1, maxDesperation: 0 },
    acceptable: { minEmployerTone: 0, minProfessionalism: 0 },
    damaged: { maxEmployerTone: -1, maxNetworkTrust: 0 }
  },
  endings: [
    {
      id: "professional",
      title: "Professional resonance",
      narrative: "The reply comes on day 12: 'Vi vil gerne invitere dig til en sidste samtale med teamet.' The tone is warm, specific, and references your follow-up: 'Vi sagde din mail om processen vist at du forstår vores tempo.' You advance. The CTO accepts your LinkedIn with a personal note.",
      danish: "Din tone åbnede døren, før CV'et gjorde det.",
      carry: "B2 unlocked: warm professional Danish signals 'future colleague' before 'candidate'."
    },
    {
      id: "acceptable",
      title: "Standard process",
      narrative: "The reply comes on day 14: 'Tak for din opfølgning. Vi vurderer nu alle kandidater og vender retur inden næste uge.' Polite, correct, template. You are still in the process, but you did not stand out. LinkedIn request accepted without note.",
      danish: "Du foregik korrekt — men uvæsentlig.",
      carry: "B2 unlocked: correct Danish keeps you in the room. Warm Danish gets you a seat at the table."
    },
    {
      id: "damaged",
      title: "Tone cost",
      narrative: "The reply comes on day 10 — a brief rejection: 'Vi har valgt en anden kandidat.' No specifics. Your LinkedIn request is ignored. Later you learn: the CTO mentioned 'den der trykkede for meget' in the debrief. Your Danish wrote 'junior', not 'ready'.",
      danish: "Forkert register koster mere end en afvisning.",
      carry: "B2 unlocked: desperation in Danish is visible. Calm agency is the only signal that scales."
    }
  ]
};

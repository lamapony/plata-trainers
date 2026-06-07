window.PLATA_LESSON_B2_JOB_FOLLOWUP = {
  id: "lesson-b2-job-followup",
  level: "B2",
  title: "Efter interviews — tone, tak, og tålmodighed",
  subtitle: "A B2 Danish lesson about post-interview follow-up: formal email, LinkedIn, and the price of tone.",
  estimatedMinutes: 15,
  qualityTier: "gold",
  editorialFocus: "Choose professional Danish under hiring uncertainty: timed follow-up, formal warmth, platform-specific register, and agency without pressure.",
  comicStoryboard: {
    style: "Nordic editorial comic, restrained linework, muted green-gray office palette with ember accents, realistic Copenhagen professional context, adult applicant perspective, no readable text inside the image, no logos, no watermarks.",
    aspectRatio: "16:9",
    imageSize: "1K",
    panels: [
      {
        id: "silence-pressure",
        sceneId: "silence-pressure",
        assetPath: "./assets/comic/silence-pressure.png",
        alt: "A candidate waits after an interview while resisting the pressure to write too early.",
        prompt: "A single comic panel in a small Copenhagen apartment after a job interview. An adult candidate sits near a laptop and phone, checking the inbox but choosing patience. Show quiet uncertainty and professional self-control, not panic. No readable text, no app logos, no speech bubbles.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["process-patience"],
        mustInclude: ["quiet inbox", "waiting candidate", "professional restraint"],
        avoid: ["panic comedy", "visible email text", "brand logos"]
      },
      {
        id: "email-register",
        sceneId: "email-register",
        assetPath: "./assets/comic/email-register.png",
        alt: "The candidate drafts a warm formal follow-up email after the interview.",
        prompt: "A single comic panel focused on a candidate drafting a formal follow-up email at a clean desk. The body language should feel warm, precise, and professionally calm. Use visual cues for formal register: tidy desk, composed posture, soft daylight. No readable email text, no logos, no speech bubbles.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Den Danske Ordbog / ordnet.dk"],
        masteryTags: ["professional-email-agency"],
        mustInclude: ["formal email draft", "composed posture", "warm professionalism"],
        avoid: ["readable Danish", "robotic corporate stock pose", "messy anxiety"]
      },
      {
        id: "linkedin-choice",
        sceneId: "linkedin-choice",
        assetPath: "./assets/comic/linkedin-choice.png",
        alt: "The candidate writes a short professional networking note without pressuring the hiring manager.",
        prompt: "A single comic panel showing the candidate composing a short networking note on a phone after a technical interview. The tone should feel specific, low-pressure, and human. Represent the professional network as soft abstract profile cards without logos or readable text. Nordic editorial comic style.",
        sourceRefs: ["Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["platform-register-shift"],
        mustInclude: ["phone note", "professional network", "low-pressure tone"],
        avoid: ["LinkedIn logo", "readable profile names", "desperate expression"]
      },
      {
        id: "reply-consequence",
        sceneId: "reply-consequence",
        assetPath: "./assets/comic/reply-consequence.png",
        alt: "A hiring reply reflects the professional tone the candidate used earlier.",
        prompt: "A single comic panel where the candidate receives a hiring reply on a laptop. The room should show calm anticipation; the reply is represented by a bright message panel with no readable text. The visual idea is that the earlier tone shaped the response. No logos, no readable words.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["reply-tone-reading"],
        mustInclude: ["incoming reply", "calm anticipation", "tone reflected back"],
        avoid: ["readable message", "celebration confetti", "rejection drama"]
      },
      {
        id: "epilogue",
        sceneId: "epilogue",
        assetPath: "./assets/comic/epilogue.png",
        alt: "The candidate is remembered as a future colleague because the Danish follow-up had calm agency.",
        prompt: "A single comic panel showing the candidate as a future colleague in a calm team setting, with the earlier email and networking choices represented as subtle visual echoes around the scene. The concept is professional Danish taking agency while protecting relationships. No readable text, no company logos, no trophy imagery.",
        sourceRefs: ["Den Danske Ordbog / ordnet.dk", "borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["professional-agency-principle"],
        mustInclude: ["future colleague signal", "calm agency", "professional relationship"],
        avoid: ["job offer letter text", "brand logos", "overly heroic pose"]
      }
    ]
  },
  masteryMap: {
    "process-patience": {
      competencyId: "process-control",
      label: "Respect process timing",
      evidence: "The learner waits before following up and treats silence as process rather than rejection.",
      remediation: {
        sceneId: "silence-pressure",
        cta: "Review Scene 1",
        action: "Rerun the waiting decision and separate anxiety language from a process-aware professional move."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "professional-email-agency": {
      competencyId: "agency",
      label: "Write warm formal agency",
      evidence: "The learner chooses formal follow-up wording that owns the message without sounding robotic or needy.",
      remediation: {
        sceneId: "email-register",
        cta: "Repair the email opening",
        action: "Rerun the email scene and keep both halves: formal address plus an active phrase that owns the follow-up."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Den Danske Ordbog / ordnet.dk"]
    },
    "platform-register-shift": {
      competencyId: "register-control",
      label: "Shift register by platform",
      evidence: "The learner makes LinkedIn lower-pressure and more specific than the formal email.",
      remediation: {
        sceneId: "linkedin-choice",
        cta: "Repair the LinkedIn note",
        action: "Rerun the LinkedIn scene and make the note specific, short, and independent from the email."
      },
      sourceRefs: ["Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "reply-tone-reading": {
      competencyId: "stance-reading",
      label: "Mirror professional reply tone",
      evidence: "The learner completes a reply that includes both social acknowledgement and process language.",
      remediation: {
        sceneId: "reply-consequence",
        cta: "Repair the reply",
        action: "Rerun the reply scene and include one acknowledgement signal and one process or next-step signal."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "professional-agency-principle": {
      competencyId: "consequence-awareness",
      label: "Name the agency principle",
      evidence: "The learner names the B2 principle that professional Danish takes responsibility instead of hiding behind passive wording.",
      remediation: {
        sceneId: "epilogue",
        cta: "Review the principle",
        action: "Rerun the final choice and choose the principle that connects register, agency, and relationship cost."
      },
      sourceRefs: ["Den Danske Ordbog / ordnet.dk", "borger.dk/lifeindenmark.dk skrivevejledning"]
    }
  },
  simulation: {
    expectedEndingId: "professional",
    completionAnswers: {
      "reply-consequence": {
        reject: ["takke", "proces", "jeg vil gerne høre"],
        accept: "takke for din mail og den gode dialog; vi vurderer processen og vender tilbage om næste skridt"
      }
    },
    paths: [
      {
        id: "professional",
        expectedEndingId: "professional",
        expectedVariables: { employerTone: 2, desperation: 0, professionalism: 3, networkTrust: 3 },
        expectedCorrect: 5,
        expectedWeakMastery: [],
        actions: [
          { sceneId: "silence-pressure", optionId: "wait-calm", expectCorrect: true },
          { sceneId: "email-register", optionId: "formal-warm", expectCorrect: true },
          { sceneId: "linkedin-choice", optionId: "linkedin-good", expectCorrect: true },
          { sceneId: "reply-consequence", answer: "takke for din mail og den gode dialog; vi vurderer processen og vender tilbage om næste skridt", expectCorrect: true },
          { sceneId: "epilogue", optionId: "principle-owned", expectCorrect: true }
        ]
      },
      {
        id: "acceptable",
        expectedEndingId: "acceptable",
        expectedVariables: { employerTone: 0, desperation: 0, professionalism: 1, networkTrust: 0 },
        expectedCorrect: 3,
        expectedWeakMastery: ["platform-register-shift", "professional-email-agency"],
        actions: [
          { sceneId: "silence-pressure", optionId: "wait-calm", expectCorrect: true },
          { sceneId: "email-register", optionId: "stiff-passive", expectCorrect: false },
          { sceneId: "linkedin-choice", optionId: "linkedin-generic", expectCorrect: false },
          { sceneId: "reply-consequence", answer: "takke for din mail og den gode dialog; vi vurderer processen og vender tilbage om næste skridt", expectCorrect: true },
          { sceneId: "epilogue", optionId: "principle-owned", expectCorrect: true }
        ]
      },
      {
        id: "damaged",
        expectedEndingId: "damaged",
        expectedVariables: { employerTone: -2, desperation: 4, professionalism: -2, networkTrust: -1 },
        expectedCorrect: 0,
        expectedWeakMastery: ["platform-register-shift", "process-patience", "professional-agency-principle", "professional-email-agency", "reply-tone-reading"],
        actions: [
          { sceneId: "silence-pressure", optionId: "push-now", expectCorrect: false },
          { sceneId: "email-register", optionId: "casual-generic", expectCorrect: false },
          { sceneId: "linkedin-choice", optionId: "linkedin-pushy", expectCorrect: false },
          { sceneId: "reply-consequence", answer: "takke", expectCorrect: false },
          { sceneId: "epilogue", optionId: "principle-wait", expectCorrect: false }
        ]
      }
    ]
  },
  variables: {
    employerTone: 0,      // -2 cold .. +2 warm
    desperation: 0,       // 0 calm .. 3 pushy
    professionalism: 0,   // 0 casual .. 3 polished
    networkTrust: 0       // -1 damaged .. +2 strengthened
  },
  variableLabels: {
    employerTone: "Employer tone",
    desperation: "Pressure",
    professionalism: "Professionalism",
    networkTrust: "Network trust"
  },
  variableDescriptions: {
    employerTone: ["cold — your wording created distance", "neutral — the process stayed formal", "warm — your tone invited a human reply"],
    desperation: ["calm — no pressure leaked into the message", "visible — urgency showed through", "pushy — the follow-up started to cost trust"],
    professionalism: ["weak — the register did not fit the room", "acceptable — correct but not memorable", "strong — you sounded like a future colleague"],
    networkTrust: ["damaged — the connection felt transactional", "unchanged — accepted but low-signal", "strengthened — the contact stayed useful beyond the role"]
  },
  languagePhenomena: [
    { item: "vedrørende", function: "formal preposition, signals official register" },
    { item: "henvendelse", function: "noun for inquiry/contact, replaces besked/mail in formal writing" },
    { item: "modtage", function: "formal 'receive', not få — register marker" },
    { item: "jeg tager stilling til", function: "formal phrase: 'I address / respond to'" },
    { item: "partikler: jo/da/nok", function: "soften or position stance in professional mail" },
    { item: "passiv: 'der gives svar'", function: "can sound evasive; active 'vi svarer' owns it" }
  ],
  sourceNotes: [
    {
      title: "borger.dk/lifeindenmark.dk skrivevejledning",
      url: "https://digitaliser.dk/Media/638295979179542926/Skrivevejledning%20for%20borger.dk_september%202023_version%201.0.pdf",
      supports: ["Public-service Danish should be short, concrete, precise, and avoid kancellisprog where possible"]
    },
    {
      title: "Dansk Sproghistorie: dialogiske partikler",
      url: "https://www.dansksproghistorie.dk/75/",
      supports: ["Small words such as jo, da, nok, and vel can position the speaker socially"]
    },
    {
      title: "Den Danske Ordbog / ordnet.dk",
      url: "https://ordnet.dk/ddo",
      supports: ["Lexical checks for formal words such as henvendelse, vedrørende, opfølgning, and stilling"]
    }
  ],
  scenes: [
    {
      id: "silence-pressure",
      type: "choice",
      eyebrow: "Scene 1 · Stille dage",
      title: "The interview felt good. Now the inbox is quiet.",
      learningGoal: "Choose a professional follow-up timing under uncertainty without letting anxiety write the message.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["process-patience"],
      pressure: "Three days since the interview at a Copenhagen tech company. You want the role. Checking mail every hour makes you look desperate — to yourself.",
      narrative: "You replay the conversation: the CTO asked about your Danish, you answered in Danish, she nodded. No red flags. But Danish hiring moves at its own pace. The silence is not rejection — it is process.",
      dialogue: [{ speaker: "Internal voice", line: "Skal jeg skrive? Venter de på mig? Er det for tidligt?" }],
      notice: "Danish hiring culture: silence is not no. Acting on anxiety can read as junior, even before the Danish is wrong.",
      targetPhrases: ["vent 5 arbejdsdage", "kort, præcis opfølgning", "er det for tidligt", "skriv efter 2 dage"],
      prompt: "What is the professional move right now?",
      options: [
        { id: "wait-calm", diagnostic: "process-calibrated-wait", label: "Vent 5 arbejdsdage. Skriv så en kort, præcis opfølgning.", detail: "calm, process-aware", correct: true, effects: { employerTone: 1, desperation: 0, professionalism: 1 }, feedback: "Diagnostic: you respected the process and kept the follow-up short, precise, and adult." },
        { id: "wait-anxious", diagnostic: "anxious-early-followup", label: "Vent, men tjek mail hver time. Skriv efter 2 dage alligevel.", detail: "anxious waiting", correct: false, effects: { desperation: 1 }, feedback: "Diagnostic: the timing is still driven by anxiety. Even polite Danish can carry pressure when the process has barely started." },
        { id: "push-now", diagnostic: "premature-interest-pressure", label: "Skriv i dag. Vis engagement. 'Jeg er meget interesseret.'", detail: "pushy", correct: false, effects: { employerTone: -1, desperation: 2, professionalism: -1 }, feedback: "Diagnostic: too early. You turned interest into pressure, which reads less like engagement and more like insecurity." }
      ],
      carry: "Carry-forward: silence is data. When anxiety says 'venter de på mig?' and 'er det for tidligt?', the professional move is: vent 5 arbejdsdage, then skriv a kort, præcis opfølgning.",
      tags: ["B2", "professional-culture", "silence", "patience", "register-awareness"]
    },
    {
      id: "email-register",
      type: "choice",
      eyebrow: "Scene 2 · Opfølgningsmail",
      title: "Day 5. You write the follow-up. Register decides the impression.",
      learningGoal: "Open a post-interview email with formal warmth and active professional agency.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Den Danske Ordbog / ordnet.dk"],
      masteryTags: ["professional-email-agency"],
      pressure: "One email. It will be read by the hiring manager and forwarded to the CTO. Too casual = not serious. Too stiff = robotic. The sweet spot is warm professional Danish.",
      narrative: "You open a blank compose window. Subject line: 'Opfølgning på interview — [Stilling]'. Now the body. Every word choice is a register signal.",
      dialogue: [
        { speaker: "You (drafting)", line: "Kære [Navn] / Hej [Navn] — hvad signalerer hvad?" },
        { speaker: "CTO (memory)", line: "Vi lægger vægt på, at folk kan skrive professionelt på dansk." }
      ],
      notice: "Kære = formal, safe, expected. Hej = acceptable if they used du first, but risky in follow-up. B2 writers choose Kære unless du was explicitly agreed.",
      targetPhrases: ["Kære [Navn]", "jeg tager stilling til", "jeres henvendelse", "god dialog i torsdags"],
      prompt: "Choose the opening + first sentence that hits warm professional Danish.",
      options: [
        { id: "formal-warm", diagnostic: "formal-warm-agency", label: "Kære [Navn],\n\nJeg tager stilling til jeres henvendelse og vil takke for en god dialog i torsdags.", detail: "formal, warm, owns the follow-up", correct: true, effects: { employerTone: 1, professionalism: 1, networkTrust: 1 }, feedback: "Diagnostic: strong. Kære sets the register, jeg tager stilling til gives agency, and god dialog makes the thanks specific." },
        { id: "casual-generic", diagnostic: "casual-self-minimising", label: "Hej [Navn],\n\nTak for snakken i torsdags! Bare en hurtig opfølgning — jeg er super interesseret.", detail: "too casual, 'bare' weakens", correct: false, effects: { employerTone: -1, professionalism: -1, desperation: 1 }, feedback: "Diagnostic: bare en hurtig opfølgning minimises your own message, and super interesseret sounds junior in this channel." },
        { id: "stiff-passive", diagnostic: "passive-agency-removal", label: "Kære [Navn],\n\nDer gives besked på, at jeg fortsat er interesseret i stillingen.", detail: "passive, evasive", correct: false, effects: { employerTone: -1, professionalism: 0 }, feedback: "Diagnostic: der gives besked hides the actor. You sound like a form letter, not like a candidate owning the follow-up." }
      ],
      carry: "Carry-forward: 'Kære' signalerer formalitet; 'vi lægger vægt på', 'jeg tager stilling til', 'jeres henvendelse', 'takke', and a concrete reference to folk writing professionelt på dansk create professional warmth.",
      tags: ["B2", "formal-email", "register", "tage-stilling-til", "particles"]
    },
    {
      id: "linkedin-choice",
      type: "choice",
      eyebrow: "Scene 3 · LinkedIn request",
      title: "You also want to connect with the CTO on LinkedIn. Different platform, different rules.",
      learningGoal: "Adapt from formal email register to a short, specific, low-pressure LinkedIn note.",
      sourceRefs: ["Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["platform-register-shift"],
      pressure: "LinkedIn is semi-public. The note field is 300 characters. Too formal = awkward. Too casual = presumptuous. The CTO will see this alongside your email.",
      narrative: "You click 'Connect' → 'Add a note'. The preview shows your profile headline: 'Senior Developer | Danish B2'. The note is your only context.",
      dialogue: [{ speaker: "You (drafting)", line: "Kære [Navn] / Hej [Navn] — tak for tiden / tak for interviewet?" }],
      notice: "LinkedIn notes are read on mobile. First 120 chars must carry the signal. 'Kære' works but 'Hej' is standard here — if you reference the specific conversation.",
      targetPhrases: ["Hej [Navn]", "tak for en god teknisk dialog", "vil gerne holde kontakt", "uanset udgang"],
      prompt: "Choose the LinkedIn note that complements, not duplicates, your email.",
      options: [
        { id: "linkedin-good", diagnostic: "platform-specific-low-pressure", label: "Hej [Navn],\nTak for en god teknisk dialog i torsdags. Vil gerne holde kontakt uanset udgang.\n— [Dit navn]", detail: "specific, low-pressure, keeps door open", correct: true, effects: { networkTrust: 2, professionalism: 1 }, feedback: "Diagnostic: perfect. Uanset udgang lowers pressure, and teknisk dialog proves this is not a generic networking ping." },
        { id: "linkedin-pushy", diagnostic: "platform-pressure-duplicate", label: "Kære [Navn],\nJeg skriver for at understrege mit store interesse i stillingen. Håber på hurtigt svar.\n— [Dit navn]", detail: "duplicates email, pushy", correct: false, effects: { desperation: 1, networkTrust: -1 }, feedback: "Diagnostic: you duplicated the email and added hurry. Håber på hurtigt svar pressures a connection instead of opening one." },
        { id: "linkedin-generic", diagnostic: "generic-low-signal", label: "Hej [Navn],\nTak for at tilføje mig. Ser frem til at følge jeres arbejde.\n— [Dit navn]", detail: "generic, low signal", correct: false, effects: { networkTrust: 0 }, feedback: "Diagnostic: safe but forgettable. No reference to the interview means the note could be sent to anyone." }
      ],
      carry: "Carry-forward: platform-specific register. Email = formal ownership. LinkedIn = 'tak for tiden/interviewet' plus 'vil gerne holde kontakt' in a specific, low-pressure, human tone.",
      tags: ["B2", "linkedin", "networking", "register-shift", "low-pressure"]
    },
    {
      id: "reply-consequence",
      type: "completion",
      eyebrow: "Scene 4 · Svaret",
      title: "The reply arrives. Your tone shaped what you got back.",
      learningGoal: "Complete a hiring reply with both acknowledgement and process/next-step language.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["reply-tone-reading"],
      pressure: "Three scenarios. The hiring manager writes back. The Danish tells you where you stand — and whether your follow-up helped or hurt.",
      narrative: "The email lands. Subject: 'Re: Opfølgning på interview'. You open it. The first sentence sets the tone.",
      dialogue: [{ speaker: "Hiring Manager", line: "[Variabel svar baseret på dine valg]" }],
      notice: "Professional Danish replies mirror your register. Warm professional → warm specific. Pushy → formal distance. Passive → generic template.",
      targetPhrases: ["takke for din mail", "den gode dialog", "proces", "næste skridt"],
      prompt: "Complete the hiring manager's reply. Include one acknowledgement signal and one process or next-step signal.",
      prefix: "Kære [Dit navn],\n\n",
      placeholder: "takke for din mail og den gode dialog...",
      acceptKeywordGroups: [
        { name: "acknowledgement signal", keywords: ["takke", "tak", "dialog"] },
        { name: "process or next step", keywords: ["proces", "tid", "høre", "fremtidig", "vurdere", "næste", "skridt"] }
      ],
      success: "Good. You constructed a reply that combines professional acknowledgement with process language.",
      failure: "Include both parts: an acknowledgement signal (takke/tak/dialog) and a process or next-step signal (proces/tid/høre/fremtidig/vurdere/næste/skridt).",
      effects: {},
      carry: "Carry-forward: their reply reflects your tone. You write the first draft of the relationship.",
      tags: ["B2", "reply-analysis", "mirroring", "professional-warmth"]
    },
    {
      id: "epilogue",
      type: "choice",
      eyebrow: "Final · Udfald",
      title: "The process concludes. Your Danish wrote the ending before the decision.",
      learningGoal: "Name the principle that professional Danish takes agency while protecting the relationship.",
      sourceRefs: ["Den Danske Ordbog / ordnet.dk", "borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["professional-agency-principle"],
      pressure: "Two weeks later. The decision email arrives. But the real outcome — your reputation in this network — was decided by how you handled the wait, the follow-up, and the connection.",
      narrative: "Three candidates. Same skills. Different Danish. The hiring manager remembers: who wrote like a colleague, who wrote like a supplicant, who wrote like a template.",
      dialogue: [{ speaker: "CTO (internal)", line: "Den der kunne skrive 'Jeg tager stilling til' — den kan vi bruge." }],
      notice: "B2 Danish is not grammar. It is social operating system: register, particles, agency, patience. The language you choose writes the relationship before the contract.",
      targetPhrases: ["professionel dansk tager ejerskab", "jeg tager stilling til", "der gives besked", "den kan vi bruge"],
      prompt: "Which principle summarises the lesson?",
      options: [
        { id: "principle-owned", diagnostic: "agency-register-principle", label: "Professionel dansk tager ejerskab: 'Jeg tager stilling til' i stedet for 'Der gives besked'.", detail: "agency + register", correct: true, feedback: "Diagnostic: exactly. Agency in language signals agency in the role." },
        { id: "principle-polite", diagnostic: "overformal-politeness", label: "Vær altid maksimalt høflig — 'Kære', 'venligst', 'hvis De vil være så god'.", detail: "over-politeness", correct: false, feedback: "Diagnostic: over-politeness reads as distance, not warmth. Danish professional warmth is direct, human, and concrete." },
        { id: "principle-wait", diagnostic: "passive-waiting-strategy", label: "Skriv aldrig opfølgning. Venter viser tålmodighed.", detail: "passive", correct: false, feedback: "Diagnostic: waiting is not the same as strategy. A well-timed, well-toned follow-up signals competence." }
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
      narrative: "The reply comes on day 12: 'Vi vil gerne invitere dig til en sidste samtale med teamet.' The tone is warm, specific, and references your follow-up: 'Din mail om processen viste, at du forstår vores tempo.' You advance. The CTO accepts your LinkedIn with a personal note.",
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

window.PLATA_LESSON_B2_JOB_FOLLOWUP = {
  id: "lesson-b2-job-followup",
  contentVersion: 2,
  level: "B2",
  title: "Follow up after a job interview",
  subtitle: "Use the employer's timeline, write a natural email, and respond professionally whatever comes back.",
  estimatedMinutes: 15,
  qualityTier: "gold",
  audio: {
    schemaVersion: 1,
    publicationStatus: "draft",
    locale: "da-DK",
    defaultVoice: "marin",
    speakerVoices: {
      "Recruiter (at the interview)": "marin",
      "Recruiter (memory)": "marin",
      "You (drafting)": "cedar",
      "Mette": "marin"
    },
    voiceProfiles: {
      "hiring-dialogue": {
        defaultVoice: "cedar",
        speakerVoices: {
          "Recruiter (at the interview)": "marin",
          "Recruiter (memory)": "marin",
          "You (drafting)": "cedar",
          "Mette": "marin"
        }
      }
    },
    generation: {
      provider: "openai",
      model: "gpt-4o-mini-tts-2025-12-15",
      format: "mp3",
      voiceProfile: "hiring-dialogue",
      instructions: "Speak natural contemporary Danish from Denmark at a calm professional pace. Preserve Danish pronunciation, sentence stress, and punctuation. Do not add words."
    }
  },
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
        id: "email-closing",
        sceneId: "email-closing",
        assetPath: "./assets/comic/email-closing.png",
        alt: "The candidate chooses a professional closing line for the follow-up email.",
        prompt: "A single comic panel showing the candidate pausing before sending, cursor near the closing paragraph of a formal email draft. The mood is calm decision-making: neither aggressive urgency nor vague disappearance. No readable text, no logos, no speech bubbles.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["consequence-aware-tone"],
        mustInclude: ["closing paragraph focus", "calm send decision", "formal desk"],
        avoid: ["readable Danish", "panic send button", "brand logos"]
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
        alt: "The candidate answers a rejection professionally and leaves future contact possible.",
        prompt: "A single comic panel showing the candidate reading a rejection and writing a concise, composed reply. An open doorway or a small future contact card can suggest that this process ended without closing every future opportunity. Keep the disappointment honest and the posture calm. No readable text, company logos, or trophy imagery.",
        sourceRefs: ["Den Danske Ordbog / ordnet.dk", "borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["professional-agency-principle"],
        mustInclude: ["rejection reply", "honest disappointment", "future-contact cue"],
        avoid: ["job offer celebration", "brand logos", "overly heroic pose"]
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
      label: "Write a natural follow-up",
      evidence: "The learner chooses formal follow-up wording that owns the message without sounding robotic or needy.",
      remediation: {
        sceneId: "email-register",
        cta: "Repair the email opening",
        action: "Rerun the email scene and keep both halves: formal address plus an active phrase that owns the follow-up."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Den Danske Ordbog / ordnet.dk"]
    },
    "common-gender-noun": {
      competencyId: "register-control",
      label: "Common-gender noun agreement",
      evidence: "The learner keeps en-words like interesse with min/mit forms that match common gender, not neutral mit on an en-word.",
      remediation: {
        sceneId: "email-register",
        cta: "Repair the email opening",
        action: "Rerun the email scene and watch min/minde forms on en-words like interesse before you send professional Danish."
      },
      sourceRefs: ["Den Danske Ordbog / ordnet.dk"]
    },
    "irregular-plural-noun": {
      competencyId: "register-control",
      label: "Irregular plural noun forms",
      evidence: "The learner keeps irregular plurals like møder (meetings) distinct from verb forms like mødes in formal follow-up email.",
      remediation: {
        sceneId: "email-closing",
        cta: "Repair the email closing",
        action: "Rerun the closing scene and check irregular plurals — møde becomes møder, not mødes — before the hiring manager forwards your mail."
      },
      sourceRefs: ["Den Danske Ordbog / ordnet.dk"]
    },
    "strong-verb-past": {
      competencyId: "register-control",
      label: "Strong verb past forms",
      evidence: "The learner uses strong verb past forms like skrev when referring to a completed dialog, not infinitive skrive in professional email.",
      remediation: {
        sceneId: "email-register",
        cta: "Repair the email opening",
        action: "Rerun the email scene and use past tense for completed events — jeg skrev, not jeg skrive — before you send professional Danish."
      },
      sourceRefs: ["Den Danske Ordbog / ordnet.dk"]
    },
    "consequence-aware-tone": {
      competencyId: "consequence-awareness",
      label: "Close without bulldozing or disappearing",
      evidence: "The learner finishes a follow-up email with calm process language instead of a deadline threat or a vague vanishing act.",
      remediation: {
        sceneId: "email-closing",
        cta: "Repair the email closing",
        action: "Rerun the closing scene and balance acknowledgement with a concrete process signal — no ultimatum, no 'må I endelig vende tilbage'."
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
      label: "Respond professionally",
      evidence: "The learner names the B2 principle that professional Danish takes responsibility instead of hiding behind passive wording.",
      remediation: {
        sceneId: "epilogue",
        cta: "Review the principle",
        action: "Rerun the final choice and choose the reply that acknowledges the decision while keeping future contact possible."
      },
      sourceRefs: ["Den Danske Ordbog / ordnet.dk", "borger.dk/lifeindenmark.dk skrivevejledning"]
    }
  },
  simulation: {
    expectedEndingId: "professional",
    completionAnswers: {
      "reply-consequence": {
        reject: ["tak", "i morgen", "jeg kan"],
        accept: "tak for beskeden; jeg kan tale i morgen klokken 10"
      }
    },
    paths: [
      {
        id: "professional",
        expectedEndingId: "professional",
        expectedVariables: { employerTone: 3, desperation: 0, professionalism: 4, networkTrust: 3 },
        expectedCorrect: 6,
        expectedWeakMastery: [],
        actions: [
          { sceneId: "silence-pressure", optionId: "wait-calm", expectCorrect: true },
          { sceneId: "email-register", optionId: "formal-warm", expectCorrect: true },
          { sceneId: "email-closing", optionId: "closing-balanced", expectCorrect: true },
          { sceneId: "linkedin-choice", optionId: "linkedin-good", expectCorrect: true },
          { sceneId: "reply-consequence", answer: "tak for beskeden; jeg kan tale i morgen klokken 10", expectCorrect: true },
          { sceneId: "epilogue", optionId: "principle-owned", expectCorrect: true }
        ]
      },
      {
        id: "form-trap",
        expectedEndingId: "acceptable",
        expectedVariables: { employerTone: 1, desperation: 0, professionalism: 1, networkTrust: 0 },
        expectedCorrect: 4,
        expectedWeakMastery: ["common-gender-noun", "platform-register-shift", "professional-email-agency"],
        actions: [
          { sceneId: "silence-pressure", optionId: "wait-calm", expectCorrect: true },
          { sceneId: "email-register", optionId: "gender-trap", expectCorrect: false },
          { sceneId: "email-closing", optionId: "closing-balanced", expectCorrect: true },
          { sceneId: "linkedin-choice", optionId: "linkedin-generic", expectCorrect: false },
          { sceneId: "reply-consequence", answer: "tak for beskeden; jeg kan tale i morgen klokken 10", expectCorrect: true },
          { sceneId: "epilogue", optionId: "principle-owned", expectCorrect: true }
        ]
      },
      {
        id: "plural-trap",
        expectedEndingId: "acceptable",
        expectedVariables: { employerTone: 1, desperation: 0, professionalism: 1, networkTrust: 1 },
        expectedCorrect: 4,
        expectedWeakMastery: ["consequence-aware-tone", "irregular-plural-noun", "platform-register-shift"],
        actions: [
          { sceneId: "silence-pressure", optionId: "wait-calm", expectCorrect: true },
          { sceneId: "email-register", optionId: "formal-warm", expectCorrect: true },
          { sceneId: "email-closing", optionId: "plural-trap", expectCorrect: false },
          { sceneId: "linkedin-choice", optionId: "linkedin-generic", expectCorrect: false },
          { sceneId: "reply-consequence", answer: "tak for beskeden; jeg kan tale i morgen klokken 10", expectCorrect: true },
          { sceneId: "epilogue", optionId: "principle-owned", expectCorrect: true }
        ]
      },
      {
        id: "verb-trap",
        expectedEndingId: "acceptable",
        expectedVariables: { employerTone: 1, desperation: 0, professionalism: 1, networkTrust: 0 },
        expectedCorrect: 4,
        expectedWeakMastery: ["platform-register-shift", "professional-email-agency", "strong-verb-past"],
        actions: [
          { sceneId: "silence-pressure", optionId: "wait-calm", expectCorrect: true },
          { sceneId: "email-register", optionId: "verb-trap", expectCorrect: false },
          { sceneId: "email-closing", optionId: "closing-balanced", expectCorrect: true },
          { sceneId: "linkedin-choice", optionId: "linkedin-generic", expectCorrect: false },
          { sceneId: "reply-consequence", answer: "tak for beskeden; jeg kan tale i morgen klokken 10", expectCorrect: true },
          { sceneId: "epilogue", optionId: "principle-owned", expectCorrect: true }
        ]
      },
      {
        id: "acceptable",
        expectedEndingId: "acceptable",
        expectedVariables: { employerTone: 1, desperation: 0, professionalism: 1, networkTrust: 1 },
        expectedCorrect: 4,
        expectedWeakMastery: ["consequence-aware-tone", "platform-register-shift", "professional-email-agency"],
        actions: [
          { sceneId: "silence-pressure", optionId: "wait-calm", expectCorrect: true },
          { sceneId: "email-register", optionId: "formal-warm", expectCorrect: true },
          { sceneId: "email-closing", optionId: "closing-vague", expectCorrect: false },
          { sceneId: "linkedin-choice", optionId: "linkedin-generic", expectCorrect: false },
          { sceneId: "reply-consequence", answer: "tak for beskeden; jeg kan tale i morgen klokken 10", expectCorrect: true },
          { sceneId: "epilogue", optionId: "principle-owned", expectCorrect: true }
        ]
      },
      {
        id: "damaged",
        expectedEndingId: "damaged",
        expectedVariables: { employerTone: -3, desperation: 6, professionalism: -3, networkTrust: -1 },
        expectedCorrect: 0,
        expectedWeakMastery: ["consequence-aware-tone", "platform-register-shift", "process-patience", "professional-agency-principle", "professional-email-agency", "reply-tone-reading"],
        actions: [
          { sceneId: "silence-pressure", optionId: "push-now", expectCorrect: false },
          { sceneId: "email-register", optionId: "casual-generic", expectCorrect: false },
          { sceneId: "email-closing", optionId: "closing-pushy", expectCorrect: false },
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
  variableDirections: {
    desperation: "lower-is-better"
  },
  variableLabels: {
    employerTone: "Employer tone",
    desperation: "Pressure",
    professionalism: "Professionalism",
    networkTrust: "Network trust"
  },
  variableDescriptions: {
    employerTone: ["cold — your wording created distance", "neutral — the process stayed formal", "warm — your tone invited a human reply"],
    desperation: {
      "0": "calm — no pressure leaked into the message",
      "1": "visible — urgency showed through",
      positive: "pushy — the follow-up started to cost trust"
    },
    professionalism: ["weak — the tone made the exchange harder", "acceptable — clear but generic", "strong — your message was easy to answer and remember"],
    networkTrust: ["damaged — the connection felt transactional", "unchanged — the exchange stayed correct", "strengthened — the contact could remain useful beyond this role"]
  },
  languagePhenomena: [
    { item: "vedrørende", function: "formal preposition, signals official register" },
    { item: "henvendelse", function: "noun for inquiry/contact, replaces besked/mail in formal writing" },
    { item: "modtage", function: "formal 'receive', not få — register marker" },
    { item: "jeg tager stilling til", function: "formal phrase: 'I address / respond to'" },
    { item: "partikler: jo/da/nok", function: "soften or position stance in professional mail" },
    { item: "passiv: 'der gives svar'", function: "can sound evasive; active 'vi svarer' owns it" },
    { item: "næste skridt i processen", function: "closing signal that names process without ultimatum" },
    { item: "må I endelig vende tilbage", function: "over-deferential closing that hides the actual request" }
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
      eyebrow: "Scene 1 · The promised date",
      title: "Use their timeline.",
      learningGoal: "Decide when to follow up from what the recruiter actually said.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["process-patience"],
      pressure: "At Thursday's interview, the recruiter said: Vi regner med at give besked senest tirsdag. It is now Wednesday afternoon and you have heard nothing.",
      narrative: "The stated deadline has passed. A short follow-up now is tied to the process, not to an arbitrary number of days.",
      dialogue: [{ speaker: "Recruiter (at the interview)", line: "Vi regner med at give besked senest tirsdag.", audio: { utteranceId: "silence-pressure-recruiter" } }],
      notice: "Follow up after the date they named. If no date was given, ask about the expected timeline instead of inventing one.",
      targetPhrases: ["senest tirsdag", "opfølgning", "tidsplan"],
      prompt: "What is the most proportionate move on Wednesday?",
      modelAnswer: {
        text: "Skriv en kort opfølgning i dag og henvis roligt til den tidsplan, de nævnte.",
        audio: { utteranceId: "silence-pressure-model", voice: "cedar" }
      },
      options: [
        { id: "wait-calm", diagnostic: "process-calibrated-wait", label: "Skriv en kort opfølgning i dag og henvis roligt til den tidsplan, de nævnte.", detail: "the stated date has passed", correct: true, effects: { employerTone: 1, desperation: 0, professionalism: 1 }, feedback: "The timing is easy to justify: you are following up after the date the recruiter gave you." },
        { id: "wait-anxious", diagnostic: "anxious-early-followup", label: "Vent en uge mere, så du er helt sikker på ikke at virke utålmodig.", detail: "unnecessary delay", correct: false, effects: { desperation: 1 }, feedback: "Waiting is possible, but it ignores the timeline they gave you. A short message now is a normal way to ask for an update." },
        { id: "push-now", diagnostic: "premature-interest-pressure", label: "Ring med det samme og bed om en endelig beslutning i dag.", detail: "the deadline passed, but the demand is disproportionate", correct: false, effects: { employerTone: -1, desperation: 2, professionalism: -1 }, feedback: "A follow-up is justified; demanding a decision today is not. Ask for an update on the process." }
      ],
      carry: "Timing rule: use the employer's stated date. If there is no date, ask when they expect to decide.",
      tags: ["B2", "professional-culture", "silence", "patience", "register-awareness"]
    },
    {
      id: "email-register",
      type: "choice",
      eyebrow: "Scene 2 · Follow-up email",
      title: "Open with thanks and purpose.",
      learningGoal: "Write a natural post-interview opening that sounds like a candidate, not a form letter.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Den Danske Ordbog / ordnet.dk"],
      masteryTags: ["professional-email-agency"],
      pressure: "You open the email thread from the recruiter. The company has used first names and Hej throughout the process.",
      narrative: "A natural opening acknowledges the conversation and names the role you are following up on.",
      dialogue: [
        { speaker: "You (drafting)", line: "Hej Mette, tak for en god samtale i torsdags …", audio: { utteranceId: "email-register-draft" } },
        { speaker: "Recruiter (memory)", line: "Vi regner med at give besked senest tirsdag.", audio: { utteranceId: "email-register-recruiter-memory" } }
      ],
      notice: "Mirror the address form already used in the thread. In this thread, Hej Mette is professional and natural.",
      targetPhrases: ["Hej Mette", "tak for en god samtale", "følge op på stillingen"],
      vocabFocus: ["henvendelse", "opfølgning"],
      prompt: "Choose the opening that fits this email thread.",
      modelAnswer: {
        text: "Hej Mette. Tak for en god samtale i torsdags. Jeg vil gerne følge op på stillingen som projektleder.",
        audio: { utteranceId: "email-register-model", voice: "cedar" }
      },
      options: [
        { id: "formal-warm", diagnostic: "formal-warm-agency", label: "Hej Mette,\n\nTak for en god samtale i torsdags. Jeg vil gerne følge op på stillingen som projektleder.", detail: "natural address + specific purpose", correct: true, effects: { employerTone: 1, professionalism: 1, networkTrust: 1 }, feedback: "This matches the existing tone, names the interview, and makes the purpose of the email clear." },
        { id: "casual-generic", diagnostic: "casual-self-minimising", label: "Hej Mette,\n\nTak for sidst! Ville bare lige høre, om der er nyt?", detail: "natural speech, but too little context", correct: false, effects: { employerTone: -1, professionalism: -1, desperation: 1 }, feedback: "The tone is friendly, but bare lige and er der nyt? make the message vague. Name the role and the interview." },
        { id: "stiff-passive", diagnostic: "passive-agency-removal", label: "Kære Mette,\n\nDer rettes henvendelse vedrørende status på rekrutteringsprocessen.", detail: "grammatical but bureaucratic", correct: false, effects: { employerTone: -1, professionalism: 0 }, feedback: "This sounds like an official notice. A candidate can write directly: Jeg vil gerne følge op på stillingen …" },
        { id: "gender-trap", diagnostic: "common-gender-noun-trap", label: "Hej Mette,\n\nMit store interesse i stillingen gør, at jeg følger op på vores dialog.", detail: "wrong gender on interesse", correct: false, weakTags: ["common-gender-noun"], effects: { employerTone: -1, professionalism: -1 }, feedback: "Interesse is an en-word: write min store interesse, not mit store interesse." },
        { id: "verb-trap", diagnostic: "strong-verb-past-trap", label: "Hej Mette,\n\nJeg skrive for at følge op på vores dialog i torsdags.", detail: "infinitive instead of present tense", correct: false, weakTags: ["strong-verb-past"], effects: { employerTone: -1, professionalism: -1 }, feedback: "Use the present tense here: Jeg skriver for at følge op …" }
      ],
      carry: "Reliable opening: Hej [navn] + Tak for en god samtale [day] + Jeg vil gerne følge op på stillingen som …",
      tags: ["B2", "formal-email", "register", "tage-stilling-til", "particles"]
    },
    {
      id: "email-closing",
      type: "choice",
      eyebrow: "Scene 2b · Email closing",
      title: "Ask without inventing a deadline.",
      learningGoal: "Refer to the employer's timeline and ask a direct, proportionate question.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["consequence-aware-tone"],
      pressure: "Your opening is ready. Now you need one sentence about the missed Tuesday update.",
      narrative: "The strongest closing uses their own timeline and asks whether there is an update on the process.",
      dialogue: [
        { speaker: "You (drafting)", line: "I nævnte, at I forventede en afklaring i denne uge …", audio: { utteranceId: "email-closing-draft" } }
      ],
      notice: "Har I en opdatering på processen? is direct but not demanding. It asks for information, not a decision on your timetable.",
      targetPhrases: ["I nævnte", "en afklaring", "en opdatering på processen"],
      vocabFocus: ["proces", "opfølgning"],
      prompt: "Choose the closing sentence that keeps warm professional Danish intact.",
      modelAnswer: {
        text: "I nævnte, at I forventede en afklaring senest tirsdag. Har I en opdatering på processen?",
        audio: { utteranceId: "email-closing-model", voice: "cedar" }
      },
      options: [
        { id: "closing-balanced", diagnostic: "process-aware-closing", label: "I nævnte, at I forventede en afklaring senest tirsdag. Har I en opdatering på processen?", detail: "their timeline + direct question", correct: true, effects: { professionalism: 1, employerTone: 1 }, feedback: "This explains why you are following up and asks for an update without demanding an immediate decision." },
        { id: "closing-pushy", diagnostic: "deadline-pressure-closing", label: "Jeg forventer derfor at få jeres endelige svar senest i morgen.", detail: "replaces their timeline with your ultimatum", correct: false, weakTags: ["consequence-aware-tone"], effects: { desperation: 2, employerTone: -1, professionalism: -1 }, feedback: "The employer missed its date, but this sentence imposes a new one without context. Ask for an update instead." },
        { id: "closing-vague", diagnostic: "deferential-vanishing-closing", label: "Jeg ser frem til at høre fra jer, når I har mulighed for det.", detail: "polite, but does not ask what you need to know", correct: false, weakTags: ["professional-email-agency"], effects: { professionalism: -1, employerTone: -1 }, feedback: "This is courteous, but it hides the reason for following up. Refer to Tuesday and ask whether there is an update." },
        { id: "plural-trap", diagnostic: "irregular-plural-noun-trap", label: "Tak for vores to mødes. Har I en opdatering på processen?", detail: "mødes instead of møder", correct: false, weakTags: ["irregular-plural-noun"], effects: { professionalism: -1, employerTone: -1 }, feedback: "The noun møde becomes møder in the plural. Mødes is a verb form." }
      ],
      carry: "A useful follow-up question is anchored in the timeline already agreed, not in your anxiety.",
      tags: ["B2", "formal-email", "closing", "process-language", "consequence-tone"]
    },
    {
      id: "linkedin-choice",
      type: "choice",
      eyebrow: "Scene 3 · LinkedIn request",
      title: "Make the connection useful.",
      learningGoal: "Adapt from formal email register to a short, specific, low-pressure LinkedIn note.",
      sourceRefs: ["Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["platform-register-shift"],
      pressure: "You also want to connect with the hiring manager. The email already asks about the process.",
      narrative: "The networking note should mention the real conversation and leave the hiring decision out of it.",
      dialogue: [{ speaker: "You (drafting)", line: "Kære [Navn] / Hej [Navn] — tak for tiden / tak for interviewet?", audio: { utteranceId: "linkedin-choice-draft", spokenText: "Kære navn eller hej navn — tak for tiden eller tak for interviewet?" } }],
      notice: "Keep it short and specific. The invitation is about staying in contact, not getting a faster answer.",
      targetPhrases: ["Hej Mette", "tak for en god samtale", "holde kontakten"],
      prompt: "Choose the LinkedIn note that complements, not duplicates, your email.",
      modelAnswer: {
        text: "Hej Mette, tak for en god samtale om jeres nye projekt. Jeg vil gerne holde kontakten.",
        audio: { utteranceId: "linkedin-choice-model", voice: "cedar" }
      },
      options: [
        { id: "linkedin-good", diagnostic: "platform-specific-low-pressure", label: "Hej Mette, tak for en god samtale om jeres nye projekt. Jeg vil gerne holde kontakten. — [Dit navn]", detail: "specific conversation + simple invitation", correct: true, effects: { networkTrust: 2, professionalism: 1 }, feedback: "This note has a real reason for connecting and does not use the platform to chase the decision." },
        { id: "linkedin-pushy", diagnostic: "platform-pressure-duplicate", label: "Hej Mette, jeg har netop sendt en opfølgning og håber på et hurtigt svar. — [Dit navn]", detail: "uses the connection request as a second follow-up", correct: false, effects: { desperation: 1, networkTrust: -1 }, feedback: "The note repeats the email and adds pressure in a second channel." },
        { id: "linkedin-generic", diagnostic: "generic-low-signal", label: "Hej Mette, jeg vil gerne tilføje dig til mit netværk. — [Dit navn]", detail: "correct but could be sent to anyone", correct: false, effects: { networkTrust: 0 }, feedback: "This is harmless, but the interview gives you a better, more human reason to connect." }
      ],
      carry: "Let email handle the process. Let the networking note acknowledge the conversation and keep contact open.",
      tags: ["B2", "linkedin", "networking", "register-shift", "low-pressure"]
    },
    {
      id: "reply-consequence",
      type: "completion",
      eyebrow: "Scene 4 · A call request",
      title: "Offer a concrete time.",
      learningGoal: "Accept a short call request and state when you are available.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["reply-tone-reading"],
      pressure: "Mette replies: Tak for din mail. Har du mulighed for en kort telefonsamtale i morgen?",
      narrative: "Your reply should acknowledge the message and offer a time that can be put straight into the calendar.",
      dialogue: [{ speaker: "Mette", line: "Har du mulighed for en kort telefonsamtale i morgen?", audio: { utteranceId: "reply-consequence-mette" } }],
      notice: "Tak for beskeden opens naturally. Jeg kan tale … gives a complete answer.",
      targetPhrases: ["tak for beskeden", "jeg kan tale", "klokken 10"],
      prompt: "Complete your reply with thanks and one concrete time.",
      prefix: "Hej Mette,\n\n",
      placeholder: "Tak for beskeden. Jeg kan tale i morgen klokken 10.",
      modelAnswer: {
        text: "Tak for beskeden. Jeg kan tale i morgen klokken 10.",
        audio: { utteranceId: "reply-consequence-model", voice: "cedar" }
      },
      acceptKeywordGroups: [
        { name: "acknowledgement", keywords: ["tak", "gerne", "ja"] },
        { name: "time", keywords: ["klokken", "morgen", "formiddag", "eftermiddag", "10", "11", "12", "13", "14"] }
      ],
      success: "Good. Mette can acknowledge the reply and put a specific time in the calendar.",
      failure: "Include both parts: an acknowledgement such as tak/ja/gerne and a concrete time such as i morgen klokken 10.",
      effects: {},
      carry: "A useful scheduling reply answers the actual question: yes, and when.",
      tags: ["B2", "reply-analysis", "mirroring", "professional-warmth"]
    },
    {
      id: "epilogue",
      type: "choice",
      eyebrow: "Final · A rejection",
      title: "Close the process, not the door.",
      learningGoal: "Acknowledge a rejection and keep future contact possible in one concise reply.",
      sourceRefs: ["Den Danske Ordbog / ordnet.dk", "borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["professional-agency-principle"],
      pressure: "A week later, Mette writes that they have chosen another candidate.",
      narrative: "You can be disappointed and still answer in a way that leaves the relationship intact.",
      dialogue: [{ speaker: "Mette", line: "Tak for din tid. Vi har valgt at gå videre med en anden kandidat.", audio: { utteranceId: "epilogue-mette" } }],
      notice: "A concise reply can thank them for the process, acknowledge the decision, and invite future contact without arguing the outcome.",
      targetPhrases: ["tak for tilbagemeldingen", "skuffet", "have mig i tankerne"],
      prompt: "Which reply sounds honest, professional, and open to future contact?",
      modelAnswer: {
        text: "Tak for tilbagemeldingen og for et godt forløb. Jeg er selvfølgelig skuffet, men I må gerne have mig i tankerne, hvis en lignende stilling bliver ledig.",
        audio: { utteranceId: "epilogue-model", voice: "cedar" }
      },
      options: [
        { id: "principle-owned", diagnostic: "agency-register-principle", label: "Tak for tilbagemeldingen og for et godt forløb. Jeg er selvfølgelig skuffet, men I må gerne have mig i tankerne, hvis en lignende stilling bliver ledig.", detail: "acknowledgement + honest reaction + future contact", correct: true, feedback: "This accepts the decision without pretending not to care and gives the recruiter a clear reason to remember you." },
        { id: "principle-polite", diagnostic: "overformal-politeness", label: "Jeg tager afslaget til efterretning og takker for den fremsendte orientering.", detail: "grammatical but distant and bureaucratic", correct: false, feedback: "The message is correct, but it sounds like an administrative notice. A brief human thank-you fits this relationship better." },
        { id: "principle-wait", diagnostic: "passive-waiting-strategy", label: "Tak. Jeg forstår dog ikke jeres beslutning og vil gerne have en ny vurdering.", detail: "challenges the decision instead of closing the process", correct: false, feedback: "It is reasonable to ask for feedback, but asking them to reverse the decision is a different and much more confrontational move." }
      ],
      carry: "You now have a complete follow-up sequence: use their date, write a specific email, answer scheduling clearly, and close the process well.",
      tags: ["B2", "reputation", "agency", "professional-identity", "reflection"]
    }
  ],
  endingLogic: {
    professional: { minEmployerTone: 1, minProfessionalism: 2, maxDesperation: 0 },
    acceptable: { minEmployerTone: 0, minProfessionalism: 0 },
    damaged: { maxEmployerTone: -1, maxNetworkTrust: 0 }
  },
  endings: [
    {
      id: "professional",
      title: "Clear from start to finish",
      narrative: "Your messages make the timeline and your availability easy to understand. Whatever the hiring decision, the exchange ends professionally.",
      danish: "Tak for tilbagemeldingen og for et godt forløb.",
      audio: { utteranceId: "ending-professional", voice: "cedar" },
      carry: "Reuse this structure for another role, but always replace the company, position, conversation, and promised date."
    },
    {
      id: "acceptable",
      title: "Correct, with a few missing details",
      narrative: "The recruiter can follow the exchange, but one message lacks the role, timeline, or exact availability and requires an extra question.",
      danish: "Tak for din mail. Hvornår har du mulighed for at tale?",
      audio: { utteranceId: "ending-acceptable", voice: "marin" },
      carry: "Make the next reply complete enough to schedule: Ja tak, jeg kan tale i morgen klokken 10."
    },
    {
      id: "damaged",
      title: "The process becomes harder than it needs to be",
      narrative: "Repeated pressure across email and networking messages makes it difficult for the recruiter to answer the practical question you actually have.",
      danish: "Vi vender tilbage, når der er nyt i processen.",
      audio: { utteranceId: "ending-damaged", voice: "marin" },
      carry: "Return to the employer's stated date and ask one question in one channel: Har I en opdatering på processen?"
    }
  ]
};

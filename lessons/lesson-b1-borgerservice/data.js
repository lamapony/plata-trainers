window.PLATA_LESSON_B1_BORGERSERVICE = {
  id: "lesson-b1-borgerservice",
  contentVersion: 2,
  level: "B1",
  title: "Book help with MitID",
  subtitle: "Explain what you need, ask what to bring, and find another appointment when the first location is full.",
  estimatedMinutes: 14,
  qualityTier: "gold",
  editorialFocus: "Borgerservice pressure: booking or fixing MitID/CPR appointments when the system rejects you — calm register, precise dates, clarification without panic.",
  comicStoryboard: {
    style: "Quiet editorial comic, warm ink linework, muted modern Danish civic interiors, natural light, expressive body language, no readable text, no speech bubbles, no UI screenshots.",
    aspectRatio: "16:9",
    imageSize: "1K",
    panels: [
      {
        id: "read-context",
        sceneId: "read-context",
        assetPath: "./assets/comic/read-context.png",
        alt: "A learner pauses at a Borgerservice self-service kiosk after the screen shows an error.",
        prompt: "Create a quiet editorial comic panel in a modern Danish Borgerservice waiting area. An adult learner stands at a self-service kiosk with a red error indicator on the screen, but no readable text. They pause with calm posture before reacting — not panicking, not walking away silently. Muted civic interior, natural light, no speech bubbles.",
        sourceRefs: ["Borger.dk: MitID help"],
        masteryTags: ["context-reading"],
        mustInclude: ["self-service kiosk", "error indicator", "learner pausing calmly"],
        avoid: ["readable screen text", "angry shouting", "MitID logo"]
      },
      {
        id: "register-signals",
        sceneId: "register-signals",
        assetPath: "./assets/comic/register-signals.png",
        alt: "Three polite request phrases are shown as visual tokens on a service desk counter.",
        prompt: "Create a quiet editorial comic panel at a Borgerservice counter. Three visual tokens on the desk represent polite Danish request chunks — acknowledgement, request, and possibility. A learner compares them while a clerk waits neutrally. No readable text, no word labels inside the image.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["register-signal-control"],
        mustInclude: ["service counter", "three distinct visual tokens", "calm clerk"],
        avoid: ["word labels inside the image", "cartoonish exaggeration"]
      },
      {
        id: "clarify-misunderstanding",
        sceneId: "clarify-misunderstanding",
        assetPath: "./assets/comic/clarify-misunderstanding.png",
        alt: "A learner asks a clarifying question at the counter without sounding aggressive or passive.",
        prompt: "Create a quiet editorial comic panel showing a learner at a Borgerservice counter asking a clarifying question with open hand gesture — curious, not aggressive, not silent. The clerk listens neutrally. Civic Danish interior, natural light, no readable text or speech bubbles.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["clarification-without-panic"],
        mustInclude: ["open clarifying gesture", "neutral clerk", "calm civic setting"],
        avoid: ["confrontational pointing", "readable text"]
      },
      {
        id: "professional-response",
        sceneId: "professional-response",
        assetPath: "./assets/comic/professional-response.png",
        alt: "A learner makes a polite but active request at Borgerservice without sounding panicked.",
        prompt: "Create a quiet editorial comic panel showing a learner at a Borgerservice desk making a calm, active request with steady posture. A simple calendar shape on the desk suggests date precision. No readable text, no speech bubbles.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["agency-without-pressure"],
        mustInclude: ["active calm posture", "abstract calendar cue", "service desk"],
        avoid: ["aggressive pointing", "panicked expression"]
      },
      {
        id: "next-step",
        sceneId: "next-step",
        assetPath: "./assets/comic/next-step.png",
        alt: "A calendar and time slot cue make the appointment request concrete.",
        prompt: "Create a quiet editorial comic panel where a learner turns a polite request into a concrete appointment with date and time cues shown as abstract calendar shapes. Borgerservice setting, calm desk arrangement, no readable dates or words.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["concrete-next-step"],
        mustInclude: ["abstract calendar cue", "time slot marker", "concrete action composition"],
        avoid: ["readable dates or words", "busy dashboard interface"]
      },
      {
        id: "principle",
        sceneId: "principle",
        assetPath: "./assets/comic/principle.png",
        alt: "The learner phones Borgerservice and asks for help booking the same MitID appointment.",
        prompt: "Create a quiet editorial comic panel showing the learner calling Borgerservice with the MitID task, identification documents, and preferred time window ready as simple visual cues. A clerk answers in a calm civic-service setting. The call has one practical purpose and no panic. No readable text, logos, or speech bubbles.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["consequence-aware-register"],
        mustInclude: ["phone call", "identification document cue", "appointment time cue"],
        avoid: ["celebration pose", "literal written lesson slogan"]
      }
    ]
  },
  masteryMap: {
    "context-reading": {
      competencyId: "process-control",
      label: "Read the system message",
      evidence: "The learner reads what the system actually says before reacting with panic or passive acceptance.",
      remediation: {
        sceneId: "read-context",
        cta: "Review Scene 1",
        action: "Rerun the opening and name what the system rejected, what you still need, and how much pressure the situation can carry."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "register-signal-control": {
      competencyId: "register-control",
      label: "Use polite request chunks",
      evidence: "The learner recognizes how Jeg vil gerne, Kan jeg få, and Er det muligt at position a request in public-service Danish.",
      remediation: {
        sceneId: "register-signals",
        cta: "Rematch request phrases",
        action: "Rerun the matching scene and explain what each polite chunk does before you speak at the counter."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "clarification-without-panic": {
      competencyId: "agency",
      label: "Clarify without panic",
      evidence: "The learner uses Mener du or Skal jeg to check misunderstanding instead of escalating or going silent.",
      remediation: {
        sceneId: "clarify-misunderstanding",
        cta: "Repair the clarification",
        action: "Rerun the clarification scene and ask one precise check question before assuming the system blocked you permanently."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "agency-without-pressure": {
      competencyId: "agency",
      label: "Make a clear request",
      evidence: "The learner makes an active appointment request without sounding panicked, demanding, or passively accepting rejection.",
      remediation: {
        sceneId: "professional-response",
        cta: "Repair the request",
        action: "Rerun the request scene and keep both parts: a clear need and a calm, owned next step."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "concrete-next-step": {
      competencyId: "process-control",
      label: "Give date and time precision",
      evidence: "The learner completes a request with both what they need and when they can come.",
      remediation: {
        sceneId: "next-step",
        cta: "Repair the appointment line",
        action: "Rerun the completion and include one service need plus one concrete day or time window."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "consequence-aware-register": {
      competencyId: "consequence-awareness",
      label: "Name the register principle",
      evidence: "The learner names why calm clarity works better than panic or passive acceptance at Borgerservice.",
      remediation: {
        sceneId: "principle",
        cta: "Review the principle",
        action: "Rerun the final choice and choose the principle that keeps the case moving without damaging the room."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    }
  },
  simulation: {
    expectedEndingId: "strong",
    completionAnswers: {
      "next-step": {
        reject: ["tirsdag", "jeg vil gerne"],
        accept: "tirsdag formiddag til mitid-hjælp"
      }
    },
    paths: [
      {
        id: "strong",
        expectedEndingId: "strong",
        expectedVariables: { relationshipTension: -2, clarity: 4, professionalTrust: 2 },
        expectedCorrect: 8,
        expectedWeakMastery: [],
        actions: [
          { sceneId: "read-context", optionId: "read-calmly", expectCorrect: true },
          { sceneId: "register-signals", matchAll: true },
          { sceneId: "clarify-misunderstanding", optionId: "check-calmly", expectCorrect: true },
          { sceneId: "professional-response", optionId: "active-low-pressure", expectCorrect: true },
          { sceneId: "next-step", answer: "tirsdag formiddag til mitid-hjælp", expectCorrect: true },
          { sceneId: "principle", optionId: "clarity-with-relationship", expectCorrect: true }
        ]
      },
      {
        id: "neutral",
        expectedEndingId: "neutral",
        expectedVariables: { relationshipTension: -1, clarity: 2, professionalTrust: 0 },
        expectedCorrect: 7,
        expectedWeakMastery: ["agency-without-pressure"],
        actions: [
          { sceneId: "read-context", optionId: "read-calmly", expectCorrect: true },
          { sceneId: "register-signals", matchAll: true },
          { sceneId: "clarify-misunderstanding", optionId: "check-calmly", expectCorrect: true },
          { sceneId: "professional-response", optionId: "too-soft", expectCorrect: false },
          { sceneId: "next-step", answer: "tirsdag formiddag til mitid-hjælp", expectCorrect: true },
          { sceneId: "principle", optionId: "clarity-with-relationship", expectCorrect: true }
        ]
      },
      {
        id: "strained",
        expectedEndingId: "strained",
        expectedVariables: { relationshipTension: 5, clarity: -1, professionalTrust: -2 },
        expectedCorrect: 3,
        expectedWeakMastery: ["agency-without-pressure", "concrete-next-step", "clarification-without-panic", "consequence-aware-register", "context-reading"],
        actions: [
          { sceneId: "read-context", optionId: "overreact", expectCorrect: false },
          { sceneId: "register-signals", matchAll: true },
          { sceneId: "clarify-misunderstanding", optionId: "attack-clerk", expectCorrect: false },
          { sceneId: "professional-response", optionId: "pressure", expectCorrect: false },
          { sceneId: "next-step", answer: "tirsdag", expectCorrect: false },
          { sceneId: "principle", optionId: "maximum-force", expectCorrect: false }
        ]
      }
    ]
  },
  variables: {
    relationshipTension: 0,
    clarity: 0,
    professionalTrust: 0
  },
  variableLabels: {
    relationshipTension: "Counter tension",
    clarity: "Clarity",
    professionalTrust: "Service trust"
  },
  variableDescriptions: {
    relationshipTension: ["low — the counter stayed workable", "visible — the room felt tighter", "high — panic or aggression made the case harder"],
    clarity: ["unclear — the clerk still cannot help", "adequate — the request can move", "clear — need, date, and next step are visible"],
    professionalTrust: ["weakened — the request became harder to understand", "neutral — the clerk understood the basics", "strong — you sounded prepared and reliable"]
  },
  languagePhenomena: [
    { item: "jeg vil gerne", function: "polite request opener in public-service Danish" },
    { item: "kan jeg få", function: "direct but courteous ask for a service outcome" },
    { item: "er det muligt at", function: "softens the request while keeping the requested action visible" },
    { item: "mener du / skal jeg", function: "checks misunderstanding without escalating" },
    { item: "tirsdag formiddag", function: "date and time precision makes booking concrete" }
  ],
  sourceNotes: [
    {
      title: "Borger.dk: MitID help",
      url: "https://www.borger.dk/hjaelp-og-vejledning/hvad-har-du-brug-for-hjaelp-til/mitid",
      supports: ["If the app cannot be copied or activated by scanning accepted ID, an activation code can be collected from the user's municipal Borgerservice after booking an appointment"]
    },
    {
      title: "Borger.dk: contact and local services",
      url: "https://www.borger.dk/hjaelp-og-vejledning/kontakt/kontakt-borger-dk",
      supports: ["Questions about a specific municipal service belong with the local Borgerservice"]
    },
    {
      title: "borger.dk/lifeindenmark.dk skrivevejledning",
      url: "https://digitaliser.dk/Media/638295979179542926/Skrivevejledning%20for%20borger.dk_september%202023_version%201.0.pdf",
      supports: ["Public-service Danish should be short, concrete, precise, and avoid paper-word style where possible"]
    },
    {
      title: "Dansk Sproghistorie: dialogiske partikler",
      url: "https://www.dansksproghistorie.dk/75/",
      supports: ["Small words such as jo, da, nok, and vel can position the speaker socially"]
    }
  ],
  scenes: [
    {
      id: "read-context",
      type: "choice",
      eyebrow: "Scene 1 · A new phone",
      title: "Name the service before you try to book it.",
      learningGoal: "Identify the exact MitID help you need and the channel that provides it.",
      sourceRefs: ["Borger.dk: MitID help"],
      masteryTags: ["context-reading"],
      pressure: "You have a new phone. You cannot copy the old app or activate the new one by scanning your passport, so you need an activation code from your municipality's Borgerservice.",
      narrative: "The booking page lists several services. Choosing the right one starts with a precise description of your problem.",
      dialogue: [{ speaker: "You", line: "Jeg har fået en ny telefon og skal have en aktiveringskode til MitID." }],
      notice: "The useful details are new phone + activate MitID + activation code. That is enough context for the booking.",
      targetPhrases: ["ny telefon", "aktiveringskode", "MitID"],
      prompt: "Which description best matches the service you need?",
      options: [
        { id: "read-calmly", diagnostic: "reads-system-before-reacting", label: "Jeg skal have en aktiveringskode til MitID, fordi jeg har fået en ny telefon.", detail: "service + reason", correct: true, effects: { clarity: 1, professionalTrust: 1 }, feedback: "This gives the booking system or clerk the exact service and the relevant reason." },
        { id: "wait-vaguely", diagnostic: "passive-acceptance", label: "Jeg kan ikke få min telefon til at virke.", detail: "too broad for the service list", correct: false, effects: { clarity: -1, professionalTrust: -1 }, feedback: "This could mean many things. Add MitID and aktiveringskode so the request reaches the right service." },
        { id: "overreact", diagnostic: "panic-before-facts", label: "MitID har låst mig ude, og nogen skal ordne det nu.", detail: "urgent tone, unclear service", correct: false, effects: { relationshipTension: 1, clarity: -1 }, feedback: "The frustration is clear, but the clerk still does not know whether you need support, reactivation, or an activation code." }
      ],
      carry: "Reusable frame: Jeg skal have hjælp til …, fordi … .",
      tags: ["B1", "system-navigation", "context", "borgerservice"]
    },
    {
      id: "register-signals",
      type: "match",
      eyebrow: "Scene 2 · Before you go",
      title: "Ask the three questions that prevent a wasted trip.",
      learningGoal: "Match questions about service, identification, and booking.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["register-signal-control"],
      pressure: "You know an appointment may be required, but you do not yet know what identification to bring.",
      narrative: "Separate the practical questions: what help, which documents, and whether a booking is required.",
      dialogue: [{ speaker: "Clerk", line: "Hvad vil du gerne vide?" }],
      notice: "Skal jeg …? asks about a requirement. Hvilken legitimation …? asks for a specific document.",
      targetPhrases: ["aktiveringskode", "hvilken legitimation", "booke en tid"],
      prompt: "Match each phrase to the job it does.",
      pairs: [
        { id: "wish", left: "Kan jeg få en aktiveringskode til MitID hos jer?", right: "checks the service", feedback: "The question confirms that this Borgerservice can provide the help you need." },
        { id: "direct-ask", left: "Hvilken legitimation skal jeg tage med?", right: "checks what to bring", feedback: "This asks directly for the document requirement." },
        { id: "possibility", left: "Skal jeg booke en tid først?", right: "checks the booking process", feedback: "This prevents you from arriving without an appointment." }
      ],
      carry: "Before the visit, confirm three things: service, identification, appointment.",
      tags: ["B1", "phrases", "register", "polite-persistence"]
    },
    {
      id: "clarify-misunderstanding",
      type: "choice",
      eyebrow: "Scene 3 · Identification",
      title: "Clarify what the clerk means by valid ID.",
      learningGoal: "Use a short check question when a requirement is too broad.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["clarification-without-panic"],
      pressure: "The clerk says: Du skal medbringe gyldig legitimation. You need to know whether your passport is acceptable.",
      narrative: "A precise clarification question turns a broad rule into something you can act on.",
      dialogue: [{ speaker: "Clerk", line: "Du skal medbringe gyldig legitimation." }],
      notice: "Mener du …? checks your interpretation. Er mit pas nok? asks for a concrete yes or no.",
      targetPhrases: ["mener du", "mit pas", "gyldig legitimation"],
      prompt: "Which question gives you a usable answer?",
      options: [
        { id: "check-calmly", diagnostic: "clarifies-with-agency", label: "Mener du billedlegitimation? Er mit pas nok?", detail: "specific clarification", correct: true, effects: { clarity: 1, relationshipTension: -1 }, feedback: "This checks both the category and the document you actually plan to bring." },
        { id: "go-silent", diagnostic: "silent-acceptance", label: "Okay, jeg tager nogle papirer med.", detail: "accepts the rule without knowing what qualifies", correct: false, effects: { clarity: -1, professionalTrust: -1 }, feedback: "The reply is polite, but you could still arrive with the wrong document. Ask whether your passport is enough." },
        { id: "attack-clerk", diagnostic: "blames-clerk", label: "Hvorfor står der ikke præcist på hjemmesiden, hvad I vil have?", detail: "understandable frustration, no document check", correct: false, effects: { relationshipTension: 2, professionalTrust: -1 }, feedback: "This raises a fair complaint but does not answer the practical question. Ask which identification is accepted." }
      ],
      carry: "When a requirement is broad, ask about the exact item you have: Er mit pas nok?",
      tags: ["B1", "clarification", "agency", "cpr"]
    },
    {
      id: "professional-response",
      type: "choice",
      eyebrow: "Scene 4 · No appointments",
      title: "Keep the request open when the first location is full.",
      learningGoal: "Ask for another time or location instead of treating one full calendar as a final no.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["agency-without-pressure"],
      pressure: "There are no available appointments at your nearest Borgerservice this week.",
      narrative: "You can widen one variable: the day, the time, or the location.",
      dialogue: [{ speaker: "Clerk", line: "Der er desværre ingen ledige tider her i denne uge." }],
      notice: "Er der en ledig tid …? keeps the question specific. Add et andet sted or i næste uge to open a real alternative.",
      targetPhrases: ["en ledig tid", "et andet sted", "i næste uge"],
      prompt: "Which reply gives the clerk a practical alternative to search?",
      options: [
        { id: "active-low-pressure", diagnostic: "active-low-pressure-request", label: "Er der en ledig tid på et andet borgerservicecenter eller i begyndelsen af næste uge?", detail: "two concrete alternatives", correct: true, effects: { relationshipTension: -1, clarity: 1, professionalTrust: 1 }, feedback: "This gives the clerk two useful ways to continue the search: another location in the municipality or next week." },
        { id: "too-soft", diagnostic: "softness-removes-action", label: "Okay, så prøver jeg måske igen senere.", detail: "friendly, but no next search", correct: false, effects: { clarity: -1, professionalTrust: -1 }, feedback: "The exchange ends without an appointment. Ask about another location or the first time next week." },
        { id: "pressure", diagnostic: "pressure-replaces-agency", label: "Jeg har brug for MitID, så I må finde en tid til mig i dag.", detail: "clear need, impossible condition", correct: false, effects: { relationshipTension: 2, professionalTrust: -1 }, feedback: "The need is clear, but i dag leaves the clerk no workable alternative. Widen the location or date." }
      ],
      carry: "When the first option is full, ask about another location or the next available week.",
      tags: ["B1", "agency", "polite-persistence", "mitid"]
    },
    {
      id: "next-step",
      type: "completion",
      eyebrow: "Scene 5 · Date and time",
      title: "Give the clerk a service and a time window.",
      learningGoal: "Complete a Borgerservice request with both service need and date/time precision.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["concrete-next-step"],
      pressure: "A second location has openings. The clerk asks when you can come.",
      narrative: "Answer with the service and a usable day or time window.",
      dialogue: [{ speaker: "Clerk", line: "Hvornår kan du komme?" }],
      notice: "Tirsdag formiddag is more useful than snart. Keep hjælp med MitID in the sentence so the booking stays attached to the right service.",
      targetPhrases: ["hjælp med MitID", "kan komme", "tirsdag formiddag"],
      prompt: "Complete the sentence with one service need and one day or time window.",
      prefix: "Jeg har brug for en tid til at få hjælp med MitID og kan komme",
      placeholder: "tirsdag formiddag",
      acceptKeywordGroups: [
        { name: "service need", keywords: ["mitid", "cpr", "borgerservice", "hjælp", "pas"] },
        { name: "day or time", keywords: ["tirsdag", "onsdag", "formiddag", "eftermiddag", "mandag", "tid", "dato"] }
      ],
      success: "Good. The sentence names both what you need and when you can come.",
      failure: "Include both parts: a service word (mitid/cpr/borgerservice/hjælp/pas) and a day or time word (tirsdag/formiddag/tid/dato).",
      effects: { clarity: 1 },
      carry: "A complete booking line answers both questions: what for, and when.",
      tags: ["B1", "completion", "date-precision", "booking"]
    },
    {
      id: "principle",
      type: "choice",
      eyebrow: "Final · The phone call",
      title: "Use the same information without the booking form.",
      learningGoal: "Open a phone call with the service, reason, and one scheduling question.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["consequence-aware-register"],
      pressure: "The second Borgerservice location in your municipality asks you to call before booking. A clerk answers: Borgerservice, det er Sara.",
      narrative: "Your opening should explain why you are calling and make one concrete scheduling request.",
      dialogue: [{ speaker: "Clerk", line: "Borgerservice, det er Sara." }],
      notice: "Jeg ringer, fordi … gives the reason first. Er der en ledig tid …? turns it into an appointment question.",
      targetPhrases: ["jeg ringer, fordi", "aktiveringskode", "en ledig tid"],
      prompt: "Which opening lets Sara help without asking you to start over?",
      options: [
        { id: "clarity-with-relationship", diagnostic: "names-clarity-relationship-principle", label: "Hej, jeg ringer, fordi jeg skal have en aktiveringskode til MitID. Er der en ledig tid tirsdag formiddag?", detail: "reason + service + time", correct: true, feedback: "This opening gives Sara all three pieces she needs to check the calendar." },
        { id: "maximum-politeness", diagnostic: "confuses-register-with-politeness", label: "Hej, jeg håber, at du måske kan hjælpe mig med noget omkring MitID.", detail: "friendly, but still broad", correct: false, feedback: "The tone is natural, but Sara still has to ask what kind of MitID help and whether you need an appointment." },
        { id: "maximum-force", diagnostic: "confuses-clarity-with-force", label: "Hej, jeres hjemmeside virker ikke, så jeg skal have en tid med det samme.", detail: "complaint + demand, service still unclear", correct: false, feedback: "This explains the frustration, not the service. Name the activation code and the time window you can attend." }
      ],
      carry: "You can now handle the same task online, at the counter, or by phone: service + reason + document question + time.",
      tags: ["B1", "principle", "consequence", "register"]
    }
  ],
  endingLogic: {
    strong: { maxRelationshipTension: 0, minClarity: 2, minProfessionalTrust: 1 },
    strained: { minRelationshipTension: 2 },
    neutral: {}
  },
  endings: [
    {
      id: "strong",
      title: "The appointment is booked",
      narrative: "The clerk finds an appointment at another location and confirms what identification you should bring.",
      danish: "Du har en tid tirsdag klokken 10. Husk at medbringe dit pas.",
      carry: "Save the booking confirmation and reuse the same questions for another public-service appointment."
    },
    {
      id: "strained",
      title: "The need is urgent, but the request is hard to process",
      narrative: "The clerk hears your frustration but still needs to establish which service, which document, and which appointment you need.",
      danish: "Kan du først fortælle mig, hvad du konkret skal have hjælp til?",
      carry: "Restart with one sentence: Jeg skal have en aktiveringskode til MitID, fordi jeg har fået en ny telefon."
    },
    {
      id: "neutral",
      title: "The clerk understands, but no appointment is fixed",
      narrative: "You explain the MitID problem politely, yet the conversation ends without a location or time.",
      danish: "Prøv at se efter en ledig tid igen senere.",
      carry: "Ask one more question before ending: Er der en tid et andet sted eller i næste uge?"
    }
  ]
};

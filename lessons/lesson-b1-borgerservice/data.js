window.PLATA_LESSON_B1_BORGERSERVICE = {
  id: "lesson-b1-borgerservice",
  level: "B1",
  title: "Når systemet siger nej",
  subtitle: "Navigate Danish public-service systems with polite persistence, date precision, and agency without aggression",
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
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
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
        prompt: "Create a quiet editorial comic panel showing a learner at a Borgerservice desk making a calm, active request — steady posture, visible agency, low pressure. A simple calendar shape on the desk suggests date precision. No readable text, no speech bubbles.",
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
        alt: "A calm exchange at Borgerservice shows that wording affects both outcome and relationship.",
        prompt: "Create a quiet editorial comic panel showing the final principle: polite persistence moves the case and keeps the service relationship workable. Learner and clerk leave the counter with neutral trust and a visible next-step cue between them. Danish civic interior, no readable text.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["consequence-aware-register"],
        mustInclude: ["workable trust", "visual next-step cue", "civic service setting"],
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
      label: "Use agency without aggression",
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
    professionalTrust: ["weakened — the tone cost confidence", "neutral — correct but low-signal", "strong — you sounded reliable under system pressure"]
  },
  languagePhenomena: [
    { item: "jeg vil gerne", function: "polite request opener in public-service Danish" },
    { item: "kan jeg få", function: "direct but courteous ask for a service outcome" },
    { item: "er det muligt at", function: "softens the request while keeping agency visible" },
    { item: "mener du / skal jeg", function: "checks misunderstanding without escalating" },
    { item: "tirsdag formiddag", function: "date and time precision makes booking concrete" }
  ],
  sourceNotes: [
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
      eyebrow: "Scene 1 · Systemet",
      title: "The screen says no before anyone speaks.",
      learningGoal: "Read what the system rejected before choosing panic, passivity, or calm action.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["context-reading"],
      pressure: "Du skal booke Borgerservice-tid til MitID-hjælp. Skærmen siger, at tiden ikke kan bookes online. Du kan gå væk, råbe ad systemet, eller læse, hvad der faktisk mangler.",
      narrative: "Køen bevæger sig langsomt. Fejlbeskeden føles personlig, men den handler om systemet — ikke om, om du 'hører til'. Første risiko er reaktion: panik gør dig utydelig; passiv accept gør, at du mister din tid.",
      dialogue: [{ speaker: "System", line: "Online booking er ikke tilgængelig for denne ydelse." }],
      notice: "Læs beskeden først: hvilken ydelse, hvilken kanal, hvad mangler? Kort og konkret betyder ikke kold — det betyder, at du kan handle.",
      targetPhrases: ["hvad siger systemet", "hvad mangler jeg", "læs beskeden roligt"],
      prompt: "What is the first move at the kiosk?",
      options: [
        { id: "read-calmly", diagnostic: "reads-system-before-reacting", label: "Læs beskeden roligt: hvilken ydelse, og hvad kan jeg gøre nu?", detail: "reads before reacting", correct: true, effects: { clarity: 1, professionalTrust: 1 }, feedback: "Diagnostic: you read the system message first. That keeps panic from becoming the story." },
        { id: "wait-vaguely", diagnostic: "passive-acceptance", label: "Giv op og gå hjem — det er sikkert umuligt alligevel.", detail: "too passive", correct: false, effects: { clarity: -1, professionalTrust: -1 }, feedback: "Diagnostic: passive acceptance treats a system limit as a personal no. You lose the appointment without testing the next channel." },
        { id: "overreact", diagnostic: "panic-before-facts", label: "Sig højt, at systemet aldrig virker, og gå direkte til skranken med vrede.", detail: "panic first", correct: false, effects: { relationshipTension: 1, clarity: -1 }, feedback: "Diagnostic: you brought panic before facts. The clerk hears the tone before the need." }
      ],
      carry: "Carry-forward: læs systemet først. Name hvad der blev afvist, hvad du stadig skal have, og hvilken kanal der er næste.",
      tags: ["B1", "system-navigation", "context", "borgerservice"]
    },
    {
      id: "register-signals",
      type: "match",
      eyebrow: "Scene 2 · Høflige chunks",
      title: "Small phrases open the counter.",
      learningGoal: "Match polite Danish request chunks to their social function at Borgerservice.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["register-signal-control"],
      pressure: "Du står ved skranken. Sætningerne ser simple ud — fejlen er at bruge dem som pynt i stedet for som register.",
      narrative: "Før du siger hele sætningen, isolerer du tre chunk-typer: ønske, direkte anmodning, og mulighed.",
      dialogue: [{ speaker: "Clerk", line: "Ja, hvad kan jeg hjælpe med?" }],
      notice: "Jeg vil gerne åbner høfligt. Kan jeg få er direkte men stadig høfligt. Er det muligt at bløder op uden at skjule, hvad du vil.",
      targetPhrases: ["jeg vil gerne", "booke en tid", "er det muligt at"],
      prompt: "Match each phrase to the job it does.",
      pairs: [
        { id: "wish", left: "Jeg vil gerne booke en tid.", right: "opens a polite wish", feedback: "Jeg vil gerne signals courtesy before the request." },
        { id: "direct-ask", left: "Kan jeg få en tid til MitID-hjælp?", right: "asks directly for an outcome", feedback: "Kan jeg få keeps the ask concrete without sounding demanding." },
        { id: "possibility", left: "Er det muligt at komme tirsdag formiddag?", right: "softens while keeping agency", feedback: "Er det muligt at lowers pressure while the date stays visible." }
      ],
      carry: "Carry-forward: jeg vil gerne åbner, kan jeg få beder om udfald, er det muligt at holder dato synlig med lavt pres.",
      tags: ["B1", "phrases", "register", "polite-persistence"]
    },
    {
      id: "clarify-misunderstanding",
      type: "choice",
      eyebrow: "Scene 3 · Afklaring",
      title: "Maybe the no is not the whole story.",
      learningGoal: "Use clarification questions instead of panic or silent acceptance.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["clarification-without-panic"],
      pressure: "Clerken siger, at CPR-nummeret ikke matcher bookingen. Du er ikke sikker på, om det er en tastefejl, et gammelt CPR-kort, eller en systemfejl.",
      narrative: "Her skiller B1-dansk sig: du kan stoppe antagelser med én afklaringssætning — uden at angribe clerk eller system.",
      dialogue: [{ speaker: "Clerk", line: "Systemet siger, at CPR-nummeret ikke passer." }],
      notice: "Mener du...? og Skal jeg...? tjekker forståelsen. De lyder rolige, men de ejer processen.",
      targetPhrases: ["mener du", "gamle cpr-kort", "nye nummer"],
      prompt: "How do you clarify without panic?",
      options: [
        { id: "check-calmly", diagnostic: "clarifies-with-agency", label: "Mener du mit gamle CPR-kort, eller skal jeg bruge det nye nummer?", detail: "calm clarification", correct: true, effects: { clarity: 1, relationshipTension: -1 }, feedback: "Diagnostic: strong move. You checked the misunderstanding before assuming permanent rejection." },
        { id: "go-silent", diagnostic: "silent-acceptance", label: "Nik bare og gå — det er sikkert min fejl.", detail: "too passive", correct: false, effects: { clarity: -1, professionalTrust: -1 }, feedback: "Diagnostic: silence treats uncertainty as guilt. The clerk cannot fix what you do not ask about." },
        { id: "attack-clerk", diagnostic: "blames-clerk", label: "Det er jeres system, der aldrig virker — I må fikse det nu.", detail: "aggressive blame", correct: false, effects: { relationshipTension: 2, professionalTrust: -1 }, feedback: "Diagnostic: you blamed the clerk for the system. That raises tension without clarifying the CPR mismatch." }
      ],
      carry: "Carry-forward: mener du og skal jeg afklarer uden panik. Spørg præcist, før du accepterer et nej.",
      tags: ["B1", "clarification", "agency", "cpr"]
    },
    {
      id: "professional-response",
      type: "choice",
      eyebrow: "Scene 4 · Anmodningen",
      title: "Ask with agency, not panic.",
      learningGoal: "Choose an active Borgerservice request that stays calm and concrete.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["agency-without-pressure"],
      pressure: "Du skal have en tid til MitID-hjælp. Du har brug for klarhed, men skranken skal stadig kunne hjælpe dig bagefter.",
      narrative: "Dette er B1-dom: aktiv uden panik. Du beder om noget konkret uden at true eller gemme dig bag vag høflighed.",
      dialogue: [{ speaker: "You", line: "Jeg vil gerne have hjælp til at booke en tid — hvad er næste skridt?" }],
      notice: "Jeg vil gerne plus næste skridt giver agency uden pres. Vag høflighed skjuler, hvad du faktisk skal bruge.",
      targetPhrases: ["jeg vil gerne", "næste skridt", "uden pres"],
      prompt: "Choose the sentence that keeps agency without aggression.",
      options: [
        { id: "active-low-pressure", diagnostic: "active-low-pressure-request", label: "Jeg vil gerne booke en tid til MitID-hjælp. Kan vi finde næste ledige tid?", detail: "active and workable", correct: true, effects: { relationshipTension: -1, clarity: 1, professionalTrust: 1 }, feedback: "Diagnostic: strong B1 move. Jeg vil gerne is polite, and næste ledige tid keeps the request concrete without pressure." },
        { id: "too-soft", diagnostic: "softness-removes-action", label: "Det er nok fint, hvis det måske kan vente — jeg ved ikke rigtig.", detail: "too soft", correct: false, effects: { clarity: -1, professionalTrust: -1 }, feedback: "Diagnostic: the tone is friendly, but the need disappeared. The clerk cannot book what you will not name." },
        { id: "pressure", diagnostic: "pressure-replaces-agency", label: "I må give mig en tid i dag — jeg kan ikke vente mere på jeres system.", detail: "too forceful", correct: false, effects: { relationshipTension: 2, professionalTrust: -1 }, feedback: "Diagnostic: pressure replaced agency. That may get attention, but it is not the default Borgerservice register." }
      ],
      carry: "Carry-forward: jeg vil gerne plus konkret behov giver agency uden panik. Sætningen skal flytte sagen uden at lukke rummet.",
      tags: ["B1", "agency", "polite-persistence", "mitid"]
    },
    {
      id: "next-step",
      type: "completion",
      eyebrow: "Scene 5 · Dato og tid",
      title: "A booking request needs a when, not just a what.",
      learningGoal: "Complete a Borgerservice request with both service need and date/time precision.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["concrete-next-step"],
      pressure: "En høflig sætning fejler stadig, hvis ingen ved, hvornår du kan komme.",
      narrative: "Du siger den sidste linje. Den skal være kort, konkret og brugbar for clerk.",
      dialogue: [{ speaker: "You", line: "Jeg vil gerne booke en tid ..." }],
      notice: "Konkret dansk behøver ikke være langt. Den skal have både ydelse og tidsvindue.",
      targetPhrases: ["jeg vil gerne", "tirsdag formiddag", "mitid-hjælp", "booke en tid"],
      prompt: "Complete the sentence with one service need and one day or time window.",
      prefix: "Jeg vil gerne booke en tid",
      placeholder: "tirsdag formiddag til MitID-hjælp",
      acceptKeywordGroups: [
        { name: "service need", keywords: ["mitid", "cpr", "borgerservice", "hjælp", "pas"] },
        { name: "day or time", keywords: ["tirsdag", "onsdag", "formiddag", "eftermiddag", "mandag", "tid", "dato"] }
      ],
      success: "Good. The sentence names both what you need and when you can come.",
      failure: "Include both parts: a service word (mitid/cpr/borgerservice/hjælp/pas) and a day or time word (tirsdag/formiddag/tid/dato).",
      effects: { clarity: 1 },
      carry: "Carry-forward: jeg vil gerne booke en tid er først færdig, når læseren også ser tirsdag formiddag eller et andet konkret tidsvindue.",
      tags: ["B1", "completion", "date-precision", "booking"]
    },
    {
      id: "principle",
      type: "choice",
      eyebrow: "Final · Princip",
      title: "The wording writes the counter before the appointment.",
      learningGoal: "Name the B1 principle that calm clarity beats panic or passive acceptance at Borgerservice.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["consequence-aware-register"],
      pressure: "Mødet slutter. Det, der bliver, er ikke kun tiden — men hvordan du blev læst ved skranken.",
      narrative: "En gold-lektion slutter med det princip, du kan bruge næste gang systemet siger nej.",
      dialogue: [{ speaker: "Internal note", line: "Ro er ikke passivitet — det er kontrol over register." }],
      notice: "Dette er sprogtræning, ikke juridisk rådgivning. Principet handler om, hvordan du bliver forstået.",
      targetPhrases: ["høflig vedholdenhed", "konkret uden panik", "tone er handling"],
      prompt: "Which principle should this lesson teach?",
      options: [
        { id: "clarity-with-relationship", diagnostic: "names-clarity-relationship-principle", label: "Høflig vedholdenhed er konkret uden panik: tone er handling.", detail: "transferable principle", correct: true, feedback: "Diagnostic: yes. Calm clarity moves the case while keeping the counter workable." },
        { id: "maximum-politeness", diagnostic: "confuses-register-with-politeness", label: "Offentlig dansk er altid så høfligt som muligt — også når du giver op.", detail: "over-formal", correct: false, feedback: "Diagnostic: maximum politeness can mean passive acceptance. The goal is useful clarity, not disappearing." },
        { id: "maximum-force", diagnostic: "confuses-clarity-with-force", label: "Offentlig dansk er tydeligst, når du presser hårdest muligt.", detail: "too forceful", correct: false, feedback: "Diagnostic: pressure is not the same as clarity. Panic can make the clerk less able to help." }
      ],
      carry: "Unlocked B1 theme: høflig vedholdenhed er konkret uden panik. Tone er handling fordi sproget flytter både sagen og rummet ved skranken.",
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
      title: "Clear and trusted",
      narrative: "You named what you needed, checked the misunderstanding, and gave a concrete time. The appointment moves forward without extra friction.",
      danish: "Du gjorde sagen tydelig uden at gøre skranken mindre.",
      carry: "B1 unlocked: polite persistence and date precision can reinforce each other."
    },
    {
      id: "strained",
      title: "Clear cost",
      narrative: "You got attention, but panic or blame became the story. The next step happens with less trust than before.",
      danish: "Du fik svar, men presset blev husket.",
      carry: "B1 unlocked: force can move the moment while damaging the counter."
    },
    {
      id: "neutral",
      title: "Correct but low-signal",
      narrative: "The exchange stays polite and functional. Nothing breaks, but your Danish does not add much confidence either.",
      danish: "Det var korrekt, men ikke stærkt.",
      carry: "B1 unlocked: correct language keeps the process alive; concrete agency makes it useful."
    }
  ]
};

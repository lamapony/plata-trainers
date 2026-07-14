window.PLATA_LESSON_B1_BOLIG = {
  id: "lesson-b1-bolig",
  contentVersion: 2,
  level: "B1",
  title: "Report a problem after moving in",
  subtitle: "Write a clear message, attach evidence, and ask the landlord to confirm what happens next.",
  estimatedMinutes: 12,
  qualityTier: "gold",
  editorialFocus: "Housing pressure: dokumentér skader efter indflytningssyn, bed om næste skridt hos udlejeren, og hold tonen rolig uden passiv dansk.",
  comicStoryboard: {
    style: "Quiet editorial comic, warm ink linework, muted modern Danish apartment interiors, moving boxes and inspection notes, natural light, expressive body language, no readable text, no speech bubbles, no UI screenshots.",
    aspectRatio: "16:9",
    imageSize: "1K",
    panels: [
      {
        id: "read-context",
        sceneId: "read-context",
        assetPath: "./assets/comic/read-context.png",
        alt: "A new tenant pauses with an indflytningssyn protocol before answering the landlord.",
        prompt: "Create a quiet editorial comic panel in a Danish rental apartment with moving boxes still visible. A new tenant sits at a kitchen table with an indflytningssyn protocol and phone, pausing before replying to the landlord. Wall cracks and floor marks are visible but not dramatic. The mood is calm assessment, not anger. No readable text or speech bubbles.",
        sourceRefs: ["Life in Denmark: renting a home"],
        masteryTags: ["context-reading"],
        mustInclude: ["indflytningssyn notes", "tenant pausing before writing", "visible apartment defects"],
        avoid: ["readable text on screens", "dramatic conflict or anger"]
      },
      {
        id: "register-signals",
        sceneId: "register-signals",
        assetPath: "./assets/comic/register-signals.png",
        alt: "A tenant compares acknowledgement, action, and next-step phrases before emailing the landlord.",
        prompt: "Create a quiet editorial comic panel where a tenant at a small desk compares three abstract note cards representing acknowledgement, owned action, and next step while drafting a landlord email. A calm apartment entryway and inspection folder are visible. No readable text, logos, or interface elements.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Dansk Sproghistorie: dialogiske partikler"],
        masteryTags: ["register-signal-control"],
        mustInclude: ["three distinct visual tokens", "tenant comparing social signals", "inspection folder"],
        avoid: ["word labels inside the image", "cartoonish exaggeration"]
      },
      {
        id: "professional-response",
        sceneId: "professional-response",
        assetPath: "./assets/comic/professional-response.png",
        alt: "A tenant drafts a polite but active reply about deposit and repair documentation.",
        prompt: "Create a quiet editorial comic panel showing a tenant drafting a landlord email with steady posture and open body language. One hand points to a next-step gesture while photos from indflytningssyn sit nearby. The scene should show a clear request without confrontation. No readable text, no speech bubbles, no brand logos.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["agency-without-pressure"],
        mustInclude: ["visible next-step gesture", "inspection photos", "low-pressure tenant mood"],
        avoid: ["aggressive pointing or confrontation", "overly formal ceremony"]
      },
      {
        id: "next-step",
        sceneId: "next-step",
        assetPath: "./assets/comic/next-step.png",
        alt: "A calendar and inspection photos make the tenant's next action visible.",
        prompt: "Create a quiet editorial comic panel where a tenant turns a polite landlord reply into a concrete next step. Show an abstract calendar cue, inspection photos, and a calm desk arrangement in a Danish apartment, but keep all text unreadable or abstract. The image should communicate documentation plus timing.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["concrete-next-step"],
        mustInclude: ["abstract calendar cue", "inspection photos", "clear action-to-next-step composition"],
        avoid: ["readable dates or words", "busy dashboard interface"]
      },
      {
        id: "principle",
        sceneId: "principle",
        assetPath: "./assets/comic/principle.png",
        alt: "The tenant follows up in the same email thread and asks the landlord to confirm receipt of the photos.",
        prompt: "Create a quiet editorial comic panel showing a tenant sending a concise follow-up from the same apartment. The earlier defect photos and email thread are visible as abstract, unreadable cards, with one clear confirmation cue still pending. The mood is patient and purposeful, not confrontational. No readable text, logos, or speech bubbles.",
        sourceRefs: ["Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["consequence-aware-register"],
        mustInclude: ["same email thread", "defect photos", "pending confirmation cue"],
        avoid: ["celebration pose", "literal written lesson slogan"]
      }
    ]
  },
  masteryMap: {
    "context-reading": {
      competencyId: "process-control",
      label: "Read the situation",
      evidence: "The learner names the housing situation — indflytningssyn, skader, depositum — before choosing tone.",
      remediation: {
        sceneId: "read-context",
        cta: "Review Scene 1",
        action: "Rerun the opening decision and name the apartment, the inspection findings, and what you still need from udlejeren before choosing a phrase."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "register-signal-control": {
      competencyId: "register-control",
      label: "Control register signals",
      evidence: "The learner recognizes which Danish phrases signal acknowledgement, action, and next step in tenant-landlord writing.",
      remediation: {
        sceneId: "register-signals",
        cta: "Rematch register signals",
        action: "Rerun the matching scene and explain what each phrase does socially before you write the full reply."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Dansk Sproghistorie: dialogiske partikler"]
    },
    "agency-without-pressure": {
      competencyId: "agency",
      label: "Make a clear request",
      evidence: "The learner writes an active tenant reply about deposit or repair follow-up without over-demanding or hiding behind vague politeness.",
      remediation: {
        sceneId: "professional-response",
        cta: "Repair the response",
        action: "Rerun the response scene and keep both parts: an active proposal and a low-pressure next step overfor udlejeren."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "concrete-next-step": {
      competencyId: "process-control",
      label: "Give a concrete next step",
      evidence: "The learner completes a sentence with both an action and a time or next-step signal about documentation or follow-up.",
      remediation: {
        sceneId: "next-step",
        cta: "Repair the next step",
        action: "Rerun the completion and include one action plus one concrete time or next-step word."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "consequence-aware-register": {
      competencyId: "consequence-awareness",
      label: "Name the register principle",
      evidence: "The learner explains how a clear request can protect both the record of the defect and the working relationship.",
      remediation: {
        sceneId: "principle",
        cta: "Review the principle",
        action: "Rerun the final choice and choose the principle that keeps deposit clarity without adding social pressure."
      },
      sourceRefs: ["Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"]
    }
  },
  simulation: {
    expectedEndingId: "strong",
    completionAnswers: {
      "next-step": {
        reject: ["fredag", "jeg kan sende"],
        accept: "sende billederne i dag og få en bekræftelse"
      }
    },
    paths: [
      {
        id: "strong",
        expectedEndingId: "strong",
        expectedVariables: { relationshipTension: -1, clarity: 3, professionalTrust: 2 },
        expectedCorrect: 7,
        expectedWeakMastery: [],
        actions: [
          { sceneId: "read-context", optionId: "read-calmly", expectCorrect: true },
          { sceneId: "register-signals", matchAll: true },
          { sceneId: "professional-response", optionId: "active-low-pressure", expectCorrect: true },
          { sceneId: "next-step", answer: "sende billederne i dag og få en bekræftelse", expectCorrect: true },
          { sceneId: "principle", optionId: "clarity-with-relationship", expectCorrect: true }
        ]
      },
      {
        id: "neutral",
        expectedEndingId: "neutral",
        expectedVariables: { relationshipTension: 0, clarity: 1, professionalTrust: 0 },
        expectedCorrect: 6,
        expectedWeakMastery: ["agency-without-pressure"],
        actions: [
          { sceneId: "read-context", optionId: "read-calmly", expectCorrect: true },
          { sceneId: "register-signals", matchAll: true },
          { sceneId: "professional-response", optionId: "too-soft", expectCorrect: false },
          { sceneId: "next-step", answer: "sende billederne i dag og få en bekræftelse", expectCorrect: true },
          { sceneId: "principle", optionId: "clarity-with-relationship", expectCorrect: true }
        ]
      },
      {
        id: "strained",
        expectedEndingId: "strained",
        expectedVariables: { relationshipTension: 3, clarity: -1, professionalTrust: -1 },
        expectedCorrect: 3,
        expectedWeakMastery: ["agency-without-pressure", "concrete-next-step", "consequence-aware-register", "context-reading"],
        actions: [
          { sceneId: "read-context", optionId: "overreact", expectCorrect: false },
          { sceneId: "register-signals", matchAll: true },
          { sceneId: "professional-response", optionId: "pressure", expectCorrect: false },
          { sceneId: "next-step", answer: "fredag", expectCorrect: false },
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
    relationshipTension: "Relationship tension",
    clarity: "Clarity",
    professionalTrust: "Landlord trust"
  },
  variableDescriptions: {
    relationshipTension: ["low — lejeforholdet stayed workable", "visible — rummet mellem jer føltes smallere", "high — ordene skabte friktion med udlejeren"],
    clarity: ["unclear — næste skridt om depositum or repairs is still vague", "adequate — beskeden kan flytte sagen", "clear — handling og næste skridt are visible"],
    professionalTrust: ["weakened — the tone made cooperation harder", "neutral — the message was understood", "strong — you sounded calm and reliable"]
  },
  languagePhenomena: [
    { item: "indflytningssyn", function: "documents apartment condition at move-in; protects deposit disputes" },
    { item: "kort og konkret", function: "tenant Danish stays actionable without sounding cold" },
    { item: "jeg foreslår", function: "active proposal to udlejeren without demanding" },
    { item: "næste skridt", function: "turns politeness into a follow-up process" },
    { item: "jeg sender billeder", function: "tenant-owned action that makes the case move" }
  ],
  sourceNotes: [
    {
      title: "Life in Denmark: renting a home",
      url: "https://lifeindenmark.borger.dk/housing-and-moving/rental-property/renting-a-home",
      supports: ["Defects in a rental should be reported no later than 14 days after takeover"]
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
      eyebrow: "Scene 1 · The first week",
      title: "Put the defect on record while the details are fresh.",
      learningGoal: "Open a landlord message with the address, the defect, and when you noticed it.",
      sourceRefs: ["Life in Denmark: renting a home"],
      masteryTags: ["context-reading"],
      pressure: "You moved into apartment 4B six days ago. Today you find a long crack behind the bedroom door that is not in the move-in report.",
      narrative: "A useful message makes the basic facts easy to find: which apartment, what you found, and when you found it.",
      dialogue: [{ speaker: "You", line: "Hej, jeg skriver om indflytningsrapporten for lejlighed 4B." }],
      notice: "Official guidance says defects should be reported no later than 14 days after takeover. The language task is to make the report clear and documentable.",
      targetPhrases: ["indflytningsrapporten", "lejlighed 4B", "jeg har opdaget"],
      prompt: "Which opening gives the landlord the clearest record?",
      options: [
        { id: "read-calmly", diagnostic: "reads-context-before-writing", label: "Hej, jeg skriver om indflytningsrapporten for lejlighed 4B. Jeg har i dag opdaget en revne bag døren i soveværelset.", detail: "address + defect + date", correct: true, effects: { clarity: 1, professionalTrust: 1 }, feedback: "This opening creates a useful record. The landlord can identify the apartment, the defect, and the date immediately." },
        { id: "wait-vaguely", diagnostic: "hides-the-request", label: "Hej, der er vist noget ved døren, som ikke ser helt rigtigt ud.", detail: "polite but hard to identify", correct: false, effects: { clarity: -1 }, feedback: "The tone is fine, but the landlord cannot tell which apartment, which room, or when you noticed the problem." },
        { id: "overreact", diagnostic: "adds-pressure-before-facts", label: "Hej, lejligheden har alvorlige fejl, som I skal tage ansvar for med det samme.", detail: "strong conclusion before the facts", correct: false, effects: { relationshipTension: 1, clarity: -1 }, feedback: "The urgency is clear, but the actual defect is not. Put the observable facts before the conclusion." }
      ],
      carry: "Useful opening: Jeg skriver om … + Jeg har opdaget … + date or time.",
      tags: ["B1", "register", "housing", "context"]
    },
    {
      id: "register-signals",
      type: "match",
      eyebrow: "Scene 2 · Build the message",
      title: "Give each sentence one clear job.",
      learningGoal: "Match the fact, the evidence, and the request in a move-in defect report.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Dansk Sproghistorie: dialogiske partikler"],
      masteryTags: ["register-signal-control"],
      pressure: "You have taken two photos. Now you need a short message that is easy to process.",
      narrative: "A good report separates what happened, what you are attaching, and what you want the landlord to confirm.",
      dialogue: [{ speaker: "You", line: "Jeg vedhæfter to billeder af revnen." }],
      notice: "Concrete sentences reduce follow-up questions. Each line below does a different job.",
      targetPhrases: ["jeg har opdaget", "jeg vedhæfter", "kan I bekræfte"],
      prompt: "Match each phrase to the job it does.",
      pairs: [
        { id: "acknowledge", left: "Jeg har opdaget en revne bag døren.", right: "states the defect", feedback: "The sentence names one observable problem without guessing at the cause." },
        { id: "action", left: "Jeg vedhæfter to billeder.", right: "points to the evidence", feedback: "The landlord knows exactly what evidence to look for." },
        { id: "next-step", left: "Kan I bekræfte, at det bliver tilføjet til indflytningsrapporten?", right: "asks for confirmation", feedback: "The request makes the desired outcome explicit." }
      ],
      carry: "A complete defect report has three parts: fact, evidence, confirmation.",
      tags: ["B1", "phrases", "register", "housing"]
    },
    {
      id: "professional-response",
      type: "choice",
      eyebrow: "Scene 3 · The request",
      title: "Ask for the confirmation you actually need.",
      learningGoal: "Choose a specific request that the landlord can answer directly.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["agency-without-pressure"],
      pressure: "The photos are attached. The important outcome is that the crack becomes part of the move-in documentation.",
      narrative: "A request such as Kan I bekræfte …? gives the recipient a clear yes-or-no task.",
      dialogue: [{ speaker: "You", line: "Jeg vedhæfter to billeder af revnen." }],
      notice: "Ask for confirmation of the record. Do not replace the request with either an apology or a threat.",
      targetPhrases: ["kan I bekræfte", "tilføjet", "indflytningsrapporten"],
      prompt: "Which sentence completes the message best?",
      options: [
        { id: "active-low-pressure", diagnostic: "active-low-pressure-next-step", label: "Kan I bekræfte, at revnen og billederne bliver tilføjet til indflytningsrapporten?", detail: "specific, answerable request", correct: true, effects: { relationshipTension: -1, clarity: 1, professionalTrust: 1 }, feedback: "This is easy to answer and creates the documentation you need." },
        { id: "too-soft", diagnostic: "softness-removes-action", label: "Jeg håber, at oplysningerne måske kan bruges.", detail: "polite, but no requested outcome", correct: false, effects: { clarity: -1, professionalTrust: -1 }, feedback: "The landlord sees the photos but not what you want done with them. Ask for confirmation that they are added to the report." },
        { id: "pressure", diagnostic: "pressure-replaces-agency", label: "I skal registrere revnen med det samme, ellers får det konsekvenser.", detail: "clear demand with unnecessary threat", correct: false, effects: { relationshipTension: 2, professionalTrust: -1 }, feedback: "The requested action is visible, but the threat adds conflict before the landlord has had a chance to respond." }
      ],
      carry: "Kan I bekræfte, at …? is a reusable way to ask for a documented outcome.",
      tags: ["B1", "agency", "housing", "next-step"]
    },
    {
      id: "next-step",
      type: "completion",
      eyebrow: "Scene 4 · A concrete close",
      title: "Close with your action and the reply you need.",
      learningGoal: "Complete a closing with one action and one confirmation request.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["concrete-next-step"],
      pressure: "You are ready to send the message today, but the final line is incomplete.",
      narrative: "Finish the sentence so both sides know what happens next.",
      dialogue: [{ speaker: "You", line: "Jeg kan …" }],
      notice: "A useful closing can combine your action with the confirmation you want back.",
      targetPhrases: ["sende billederne", "i dag", "få en bekræftelse"],
      prompt: "Complete the sentence with one action and one confirmation word.",
      prefix: "Jeg kan",
      placeholder: "sende billederne i dag og få en bekræftelse",
      acceptKeywordGroups: [
        { name: "your action", keywords: ["sende", "vedhæfte", "skrive"] },
        { name: "confirmation", keywords: ["bekræftelse", "bekræfte", "svar", "modtaget"] }
      ],
      success: "Good. The closing states what you will send and what response you are waiting for.",
      failure: "Include both parts: an action such as sende/vedhæfte and a confirmation word such as bekræfte/svar/modtaget.",
      effects: { clarity: 1 },
      carry: "Your full message now has an opening, a fact, evidence, and a direct confirmation request.",
      tags: ["B1", "completion", "concrete-language", "housing"]
    },
    {
      id: "principle",
      type: "choice",
      eyebrow: "Final · Follow-up",
      title: "Follow up without rewriting the whole case.",
      learningGoal: "Send a concise follow-up when the landlord has not confirmed receipt.",
      sourceRefs: ["Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["consequence-aware-register"],
      pressure: "Two business days pass without a confirmation. You reply in the same email thread.",
      narrative: "The landlord already has the context. Your follow-up only needs the document, the date, and the confirmation you are waiting for.",
      dialogue: [{ speaker: "You", line: "Hej igen, jeg følger op på min mail fra mandag." }],
      notice: "Jeg følger op på … is neutral and specific. Repeat the request, not the frustration.",
      targetPhrases: ["jeg følger op", "min mail fra mandag", "kan I bekræfte"],
      prompt: "Which follow-up is clear and proportionate?",
      options: [
        { id: "clarity-with-relationship", diagnostic: "names-clarity-relationship-principle", label: "Hej igen, jeg følger op på min mail fra mandag om revnen i soveværelset. Kan I bekræfte, at billederne er modtaget?", detail: "context + direct confirmation request", correct: true, feedback: "This reminds the landlord of the exact message and asks one answerable question." },
        { id: "maximum-politeness", diagnostic: "confuses-register-with-politeness", label: "Hej igen, jeg ville bare høre, om I måske har haft mulighed for at se på min tidligere besked.", detail: "courteous, but the requested outcome is hidden", correct: false, feedback: "The tone is pleasant, but it does not repeat what needs to be confirmed. Name the message and ask whether the photos were received." },
        { id: "maximum-force", diagnostic: "confuses-clarity-with-force", label: "Jeg har allerede skrevet én gang. Hvorfor har I stadig ikke svaret?", detail: "frustration without the practical request", correct: false, feedback: "The frustration is clear, but the landlord still has no concise question to answer. Repeat the confirmation request." }
      ],
      carry: "Reusable sequence: report the fact → attach evidence → ask for confirmation → follow up in the same thread.",
      tags: ["B1", "principle", "consequence", "housing"]
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
      title: "The defect is on record",
      narrative: "The landlord confirms that the photos and the crack have been added to the move-in report.",
      danish: "Vi bekræfter, at billederne er modtaget og tilføjet til rapporten.",
      carry: "Save the email thread and reuse the same four-part structure for another move-in defect."
    },
    {
      id: "strained",
      title: "The issue is visible, but the exchange is tense",
      narrative: "The landlord responds to the complaint, but asks you to keep future messages factual. The defect is discussed, yet the thread now needs repair too.",
      danish: "Send venligst billeder og oplysninger uden yderligere kommentarer.",
      carry: "Keep the next message to the address, defect, evidence, and requested confirmation."
    },
    {
      id: "neutral",
      title: "The landlord has the message, but not the request",
      narrative: "The landlord replies politely without confirming that the photos were added to the report.",
      danish: "Tak for din besked. Vi vender tilbage.",
      carry: "Follow up with one direct question: Kan I bekræfte, at billederne er tilføjet til indflytningsrapporten?"
    }
  ]
};

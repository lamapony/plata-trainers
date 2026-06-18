window.PLATA_LESSON_B1_BOLIG = {
  id: "lesson-b1-bolig",
  level: "B1",
  title: "Bolig: når noget går i stykker",
  subtitle: "Indflytning, depositum og rolig dialog med udlejeren",
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
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
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
        prompt: "Create a quiet editorial comic panel showing a tenant drafting a landlord email with steady posture and open body language. One hand points to a next-step gesture while photos from indflytningssyn sit nearby. The scene should show agency without pressure in a Danish rental context. No readable text, no speech bubbles, no brand logos.",
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
        alt: "A calm tenant-landlord exchange shows that wording affects both deposit clarity and the relationship.",
        prompt: "Create a quiet editorial comic panel showing the final principle: tenant wording moves the deposit case and the landlord relationship at the same time. A tenant and landlord figure leave a doorway conversation with neutral trust and a visible next step between them. Use modern Danish rental cues, natural light, and no readable text or speech bubbles.",
        sourceRefs: ["Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["consequence-aware-register"],
        mustInclude: ["tenant and landlord with workable trust", "visual next-step cue between them"],
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
      label: "Use agency without pressure",
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
        action: "Rerun the completion and include one agency verb plus one concrete time or next-step word."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "consequence-aware-register": {
      competencyId: "consequence-awareness",
      label: "Name the register principle",
      evidence: "The learner names why tone, clarity, and relationship cost belong together in tenant communication.",
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
        accept: "inden fredag og aftale næste skridt"
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
          { sceneId: "next-step", answer: "inden fredag og aftale næste skridt", expectCorrect: true },
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
          { sceneId: "next-step", answer: "inden fredag og aftale næste skridt", expectCorrect: true },
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
    professionalTrust: ["weakened — tonen kostede tillid", "neutral — korrekt but low-signal", "strong — du lød pålidelig under boligpres"]
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
      eyebrow: "Scene 1 · Indflytningssynet",
      title: "Depositum står stadig på spil, selv når svaret lyder venligt.",
      learningGoal: "Read the tenant situation before choosing register and pressure.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["context-reading"],
      pressure: "Indflytningssyn var i mandags. I protokollen står revner i væggen og ridser i gulvet. Udlejeren skrev: 'Vi har noteret jeres bemærkninger.' Du skal svare — roligt, men ikke passivt.",
      narrative: "Du er ny lejer i 4B. Depositum er stadig på udlejerens konto, og svaret lyder som om sagen er lukket. For blød accepterer du ventetid; for hård kan du skade lejeforholdet overfor udlejeren.",
      dialogue: [{ speaker: "You", line: "Hvad er situationen, og hvor meget kan jeg bede om uden at lyde aggressiv?" }],
      notice: "Start med fakta: lejlighed, indflytningssyn, skader. Kort og konkret betyder ikke kold — udlejeren skal kunne handle. Du beder om næste skridt, ikke meget mere end nødvendigt.",
      targetPhrases: ["indflytningssyn", "depositum", "kort og konkret", "hvad er situationen"],
      prompt: "What is the tenant's first move?",
      options: [
        { id: "read-calmly", diagnostic: "reads-context-before-writing", label: "Skriv kort og konkret: hvad er situationen, og hvad beder du om?", detail: "names facts before tone", correct: true, effects: { clarity: 1, professionalTrust: 1 }, feedback: "Diagnostic: you read the room first. Name indflytningssyn, skader, and depositum before you choose how much pressure the relationship can bære." },
        { id: "wait-vaguely", diagnostic: "hides-the-request", label: "Skriv meget forsigtigt og håb, at udlejeren forstår resten.", detail: "too vague", correct: false, effects: { clarity: -1 }, feedback: "Diagnostic: vague politeness hides the request. Udlejeren cannot act on what you did not say about dokumentation or næste skridt." },
        { id: "overreact", diagnostic: "adds-pressure-before-facts", label: "Skriv hårdt med det samme, så udlejeren forstår alvoren.", detail: "too much force", correct: false, effects: { relationshipTension: 1, clarity: -1 }, feedback: "Diagnostic: you added pressure before the facts were clear. That can make the relationship cost higher than the deposit problem." }
      ],
      carry: "Carry-forward: skriv med ro, kort og konkret. First name hvad indflytningssyn viste, then choose how much you beder om overfor udlejeren without making it større end nødvendigt.",
      tags: ["B1", "register", "housing", "context"]
    },
    {
      id: "register-signals",
      type: "match",
      eyebrow: "Scene 2 · Signaler",
      title: "Tre små sætninger bærer hele lejer-mailen.",
      learningGoal: "Recognize the social function of common tenant-landlord Danish phrases.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Dansk Sproghistorie: dialogiske partikler"],
      masteryTags: ["register-signal-control"],
      pressure: "Du skal svare om depositum og skader. Sætningerne ser simple ud — men de styrer, om udlejeren læser dig som aktiv eller passiv.",
      narrative: "Før du skriver hele mailen, isolerer du tre fraser: anerkendelse, handling og næste skridt.",
      dialogue: [{ speaker: "Udlejer", line: "Tak for jeres besked om indflytningssynet. Vi vender tilbage, når vi kan aftale næste skridt." }],
      notice: "En lejer-mail kombinerer ofte tak for svar, jeg sender dokumentation, og kan vi aftale næste skridt. Mangler ét led, bliver tonen svagere.",
      targetPhrases: ["tak for jeres svar", "jeg sender billeder", "aftale næste skridt"],
      prompt: "Match each phrase to the job it does.",
      pairs: [
        { id: "acknowledge", left: "Tak for jeres svar.", right: "acknowledges contact", feedback: "Tak for jeres svar bekræfter modtagelse uden at gøre sagen større end nødvendigt." },
        { id: "action", left: "Jeg sender billeder fra indflytningssynet.", right: "owns the next action", feedback: "Jeg sender billeder giver dig agency: du flytter sagen, ikke bare ventetiden." },
        { id: "next-step", left: "Kan vi aftale næste skridt?", right: "turns politeness into process", feedback: "Næste skridt gør depositum og opfølgning testbar i stedet for høflig tålmodighed." }
      ],
      carry: "Carry-forward: tak for jeres svar åbner døren, jeg sender billeder ejer handlingen, og aftale næste skridt gør depositum-processen synlig.",
      tags: ["B1", "phrases", "register", "housing"]
    },
    {
      id: "professional-response",
      type: "choice",
      eyebrow: "Scene 3 · Svaret til udlejeren",
      title: "Nu skal du skrive aktivt — uden at gøre det større end nødvendigt.",
      learningGoal: "Choose an active tenant sentence that proposes a next step without escalating tone.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["agency-without-pressure"],
      pressure: "Du skal have svar om depositum og opfølgning på skaderne, men lejeforholdet skal stadig kunne bære næste samtale.",
      narrative: "Her bliver B1-dansk vurdering: agency uden pres overfor udlejeren.",
      dialogue: [{ speaker: "You", line: "Jeg foreslår, at vi aftaler næste skridt uden at gøre det større end nødvendigt." }],
      notice: "Jeg foreslår er aktivt uden at være krævende. Uden pres holder du døren åben, mens næste skridt om dokumentation forbliver konkret.",
      targetPhrases: ["jeg foreslår", "næste skridt", "uden pres", "depositum"],
      prompt: "Choose the sentence that keeps agency without pressure.",
      options: [
        { id: "active-low-pressure", diagnostic: "active-low-pressure-next-step", label: "Jeg foreslår, at vi aftaler næste skridt, når det passer jer.", detail: "active and workable", correct: true, effects: { relationshipTension: -1, clarity: 1, professionalTrust: 1 }, feedback: "Diagnostic: strong B1 move. Jeg foreslår giver agency, and når det passer jer sænker presset uden at droppe næste skridt om depositum." },
        { id: "too-soft", diagnostic: "softness-removes-action", label: "Det er helt fint, hvis det måske kan vente lidt.", detail: "too soft", correct: false, effects: { clarity: -1, professionalTrust: -1 }, feedback: "Diagnostic: the tone is friendly, but the action disappeared. Udlejeren cannot see what should happen next with dokumentation or reparation." },
        { id: "pressure", diagnostic: "pressure-replaces-agency", label: "Jeg forventer, at I svarer hurtigt, for depositum kan ikke vente.", detail: "too forceful", correct: false, effects: { relationshipTension: 2, professionalTrust: -1 }, feedback: "Diagnostic: you replaced agency with pressure. Depositum is real, but forventer og kan ikke vente raises tension before the facts do the work." }
      ],
      carry: "Carry-forward: jeg foreslår plus næste skridt giver agency uden pres. Sætningen skal flytte depositum-sagen uden at gøre tonen større end nødvendigt.",
      tags: ["B1", "agency", "housing", "next-step"]
    },
    {
      id: "next-step",
      type: "completion",
      eyebrow: "Scene 4 · Konkret opfølgning",
      title: "Et næste skridt skal være synligt nok til at teste.",
      learningGoal: "Complete a tenant sentence with both an agency verb and a time or next-step signal.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["concrete-next-step"],
      pressure: "En høflig sætning kan stadig fejle, hvis udlejeren ikke ved, hvem gør hvad — og hvornår.",
      narrative: "Du afslutter mailen om indflytningssynet. Den skal være kort, konkret og brugbar for udlejeren.",
      dialogue: [{ speaker: "You", line: "Jeg kan sende billeder og protokollen ..." }],
      notice: "Konkret dansk behøver ikke være lang. Den skal have en handling og et næste skridt — fx inden fredag og aftale næste skridt.",
      targetPhrases: ["jeg kan sende", "billeder og protokollen", "inden fredag", "næste skridt"],
      prompt: "Complete the sentence with one agency signal and one time or next-step signal.",
      prefix: "Jeg kan sende billeder og protokollen",
      placeholder: "inden fredag og aftale næste skridt",
      acceptKeywordGroups: [
        { name: "agency verb", keywords: ["sende", "skrive", "foreslå", "aftale"] },
        { name: "time or next step", keywords: ["fredag", "næste", "skridt", "tid", "dato"] }
      ],
      success: "Good. Sætningen har både handling og et synligt næste skridt for udlejeren.",
      failure: "Include both parts: an agency verb (sende/skrive/foreslå/aftale) and a time or next-step word (fredag/næste/skridt/tid/dato).",
      effects: { clarity: 1 },
      carry: "Carry-forward: jeg kan sende billeder og protokollen er først færdig, når udlejeren også ser inden fredag eller et andet konkret næste skridt.",
      tags: ["B1", "completion", "concrete-language", "housing"]
    },
    {
      id: "principle",
      type: "choice",
      eyebrow: "Final · Princip",
      title: "Ordene skriver lejeforholdet, før depositum er afgjort.",
      learningGoal: "Name the B1 principle that clarity and relationship control belong together in tenant communication.",
      sourceRefs: ["Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["consequence-aware-register"],
      pressure: "Udvekslingen slutter. Tilbage er ikke kun svaret om skaderne, men hvordan udlejeren læser dig.",
      narrative: "Et stærkt bolig-forløb ender med et princip, der kan bruges igen: indflytning, depositum, reparationer.",
      dialogue: [{ speaker: "Internal note", line: "Tone er handling, især når lejeforholdet stadig skal bruges." }],
      notice: "Lejer-dansk er konkret uden pres. Principet gælder mail til udlejeren, opfølgning efter indflytningssyn og rolig pushback.",
      targetPhrases: ["lejer-dansk", "konkret uden pres", "tone er handling"],
      prompt: "Which principle should this lesson teach?",
      options: [
        { id: "clarity-with-relationship", diagnostic: "names-clarity-relationship-principle", label: "Lejer-dansk er konkret uden pres: tone er handling.", detail: "transferable principle", correct: true, feedback: "Diagnostic: yes. Wording makes næste skridt visible while protecting the relationship with udlejeren." },
        { id: "maximum-politeness", diagnostic: "confuses-register-with-politeness", label: "Lejer-dansk er altid så høfligt som muligt.", detail: "over-formal", correct: false, feedback: "Diagnostic: maximum politeness can create distance. The goal is useful clarity about depositum and skader, not ceremonial language." },
        { id: "maximum-force", diagnostic: "confuses-clarity-with-force", label: "Lejer-dansk er tydeligst, når presset er maksimalt.", detail: "too forceful", correct: false, feedback: "Diagnostic: pressure is not the same as clarity. The relationship cost can become the message before depositum moves." }
      ],
      carry: "Unlocked B1 theme: lejer-dansk is konkret uden pres. Tone er handling because language moves both depositum-sagen and lejeforholdet.",
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
      title: "Klart og brugbart",
      narrative: "Udlejeren svarer med en dato for opfølgning. Du har sendt billeder og protokollen, og næste skridt om depositum er aftalt uden unødig friktion. Din dansk lyder rolig, aktiv og pålidelig.",
      danish: "Du gjorde sagen tydelig uden at gøre lejeforholdet mindre.",
      carry: "B1 unlocked: klarhed og relation kan forstærke hinanden i bolig-sager."
    },
    {
      id: "strained",
      title: "Sagen bevæger sig — med pris",
      narrative: "Udlejeren reagerer, men tonen i svaret er køligere. Du fik opmærksomhed på skaderne, men presset blev en del af historien. Næste skridt kommer — med mindre tillid.",
      danish: "Du fik svar, men presset blev husket.",
      carry: "B1 unlocked: hård tone kan flytte sagen og samtidig gøre næste samtale sværere."
    },
    {
      id: "neutral",
      title: "Korrekt, men svagt signal",
      narrative: "Udlejeren svarer høfligt, men uden klar dato. Intet går i stykker, men depositum og opfølgning bliver ved med at glide. Din dansk var fin — bare ikke stærk nok til at sætte tempo.",
      danish: "Det var korrekt, men ikke stærkt.",
      carry: "B1 unlocked: korrekt sprog holder processen i live; konkret agency gør den brugbar."
    }
  ]
};

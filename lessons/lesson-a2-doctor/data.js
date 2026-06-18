window.PLATA_LESSON_A2_DOCTOR = {
  id: "lesson-a2-doctor",
  level: "A2",
  title: "Hvor længe har du haft det sådan?",
  subtitle: "Symptom precision for everyday health conversations without overclaiming or vague Danish",
  estimatedMinutes: 12,
  qualityTier: "gold",
  editorialFocus: "Everyday health plateau: describe duration and severity to læge or apotek, clarify calmly, ask for next steps — language practice only, not medical advice.",
  comicStoryboard: {
    style: "Quiet editorial comic, warm ink linework, muted Danish clinic and pharmacy interiors, natural light, calm body language, no readable text, no speech bubbles, no UI screenshots.",
    aspectRatio: "16:9",
    imageSize: "1K",
    panels: [
      {
        id: "read-context",
        sceneId: "read-context",
        assetPath: "./assets/comic/read-context.png",
        alt: "A learner pauses at a pharmacy counter before describing symptoms.",
        prompt: "Create a quiet editorial comic panel in a Danish pharmacy. An adult learner stands at the counter with calm posture, pausing before speaking — not panicking, not minimizing. Soft clinic cues in background. No readable text or speech bubbles.",
        sourceRefs: ["Sundhed.dk patient guidance"],
        masteryTags: ["context-reading"],
        mustInclude: ["pharmacy counter", "learner pausing calmly"],
        avoid: ["readable labels", "dramatic illness imagery"]
      },
      {
        id: "symptom-duration",
        sceneId: "symptom-duration",
        assetPath: "./assets/comic/symptom-duration.png",
        alt: "Visual tokens represent duration phrases like i to dage and siden i går.",
        prompt: "Create a quiet editorial comic panel where a learner at a Danish pharmacy counter compares abstract timeline tokens representing duration phrases. The learner uses calm hand gestures to explain when symptoms started while a neutral pharmacist listens. Warm natural light, muted clinic colors, expressive but not dramatic body language, no readable dates, words, or speech bubbles anywhere in the frame.",
        sourceRefs: ["Sundhed.dk patient guidance"],
        masteryTags: ["symptom-duration"],
        mustInclude: ["timeline tokens", "calm explanatory gesture"],
        avoid: ["readable calendar text", "medical equipment close-ups"]
      },
      {
        id: "symptom-severity",
        sceneId: "symptom-severity",
        assetPath: "./assets/comic/symptom-severity.png",
        alt: "A learner calibrates how strongly to describe pain or discomfort.",
        prompt: "Create a quiet editorial comic panel showing a learner choosing between mild and strong descriptive gestures while talking to a pharmacist. The mood is precise, not dramatic. No readable text.",
        sourceRefs: ["Sundhed.dk patient guidance"],
        masteryTags: ["symptom-severity"],
        mustInclude: ["contrasting intensity gestures", "neutral pharmacist"],
        avoid: ["cartoon pain symbols", "readable words"]
      },
      {
        id: "clarify-misunderstanding",
        sceneId: "clarify-misunderstanding",
        assetPath: "./assets/comic/clarify-misunderstanding.png",
        alt: "A learner asks a clarifying question without sounding rude or silent.",
        prompt: "Create a quiet editorial comic panel where a learner at a pharmacy counter asks a clarifying question with an open palm gesture while a pharmacist listens patiently. The mood is curious and calm rather than confrontational or silent. Danish health-service interior, soft daylight, no readable text, no speech bubbles, no medical brand logos.",
        sourceRefs: ["Sundhed.dk patient guidance"],
        masteryTags: ["clarification-without-panic"],
        mustInclude: ["open clarifying gesture", "workable trust"],
        avoid: ["confrontational pointing", "readable text on labels"]
      },
      {
        id: "next-step",
        sceneId: "next-step",
        assetPath: "./assets/comic/next-step.png",
        alt: "A learner asks what to do next after describing symptoms.",
        prompt: "Create a quiet editorial comic panel where a learner completes a symptom description and asks for a concrete next step at a Danish pharmacy counter. Show an abstract process marker or calendar shape suggesting what happens next, with calm posture and visible agency. No readable prescription text, no speech bubbles, no dramatic illness imagery.",
        sourceRefs: ["Sundhed.dk patient guidance"],
        masteryTags: ["concrete-next-step"],
        mustInclude: ["next-step gesture", "calm pharmacy setting"],
        avoid: ["readable prescription text", "busy dashboard interface"]
      },
      {
        id: "principle",
        sceneId: "principle",
        assetPath: "./assets/comic/principle.png",
        alt: "A calm health conversation shows that precise Danish helps without overclaiming.",
        prompt: "Create a quiet editorial comic panel showing the principle: precise symptom language helps the conversation without pretending to be a doctor. Learner and pharmacist part with workable trust. No readable text.",
        sourceRefs: ["Sundhed.dk patient guidance"],
        masteryTags: ["consequence-aware-register"],
        mustInclude: ["workable trust", "calm closure"],
        avoid: ["celebration pose", "literal slogan text"]
      }
    ]
  },
  masteryMap: {
    "context-reading": {
      competencyId: "process-control",
      label: "Read urgency vs routine",
      evidence: "The learner distinguishes emergency signals from routine symptom description before choosing words.",
      remediation: {
        sceneId: "read-context",
        cta: "Review Scene 1",
        action: "Rerun the opening and name whether this is akut (ring 112) or a routine apotek/læge conversation."
      },
      sourceRefs: ["Sundhed.dk patient guidance"]
    },
    "symptom-duration": {
      competencyId: "process-control",
      label: "State duration precisely",
      evidence: "The learner uses i to dage, siden i går, or om morgenen instead of vague timing.",
      remediation: {
        sceneId: "symptom-duration",
        cta: "Repair duration",
        action: "Rerun the matching scene and pair each duration phrase with what it tells the listener."
      },
      sourceRefs: ["Sundhed.dk patient guidance"]
    },
    "symptom-severity": {
      competencyId: "process-control",
      label: "Calibrate severity",
      evidence: "The learner uses lidt, ret, or meget without overdramatizing or hiding symptoms.",
      remediation: {
        sceneId: "symptom-severity",
        cta: "Repair severity",
        action: "Rerun the severity choice and explain why lidt and ret change how seriously you are heard."
      },
      sourceRefs: ["Sundhed.dk patient guidance"]
    },
    "clarification-without-panic": {
      competencyId: "agency",
      label: "Clarify without panic",
      evidence: "The learner uses Kan du gentage det or Mener du to check understanding instead of guessing or going silent.",
      remediation: {
        sceneId: "clarify-misunderstanding",
        cta: "Repair clarification",
        action: "Rerun the clarification scene and ask one precise check question before accepting confusion."
      },
      sourceRefs: ["Sundhed.dk patient guidance"]
    },
    "concrete-next-step": {
      competencyId: "process-control",
      label: "Ask for a next step",
      evidence: "The learner completes the exchange with a visible next step — book tid, kontakt læge, or hvad skal jeg gøre.",
      remediation: {
        sceneId: "next-step",
        cta: "Repair next step",
        action: "Rerun the completion and include both symptom summary and one concrete next-step question."
      },
      sourceRefs: ["Sundhed.dk patient guidance"]
    },
    "consequence-aware-register": {
      competencyId: "consequence-awareness",
      label: "Name the precision principle",
      evidence: "The learner names why precise symptom Danish helps without pretending to diagnose.",
      remediation: {
        sceneId: "principle",
        cta: "Review principle",
        action: "Rerun the final choice and pick the principle that keeps language training separate from medical advice."
      },
      sourceRefs: ["Sundhed.dk patient guidance"]
    }
  },
  simulation: {
    expectedEndingId: "strong",
    completionAnswers: {
      "next-step": {
        reject: ["tak", "jeg har"],
        accept: "hvad skal jeg gøre nu og kontakte læge"
      }
    },
    paths: [
      {
        id: "strong",
        expectedEndingId: "strong",
        expectedVariables: { relationshipTension: -1, clarity: 4, professionalTrust: 2 },
        expectedCorrect: 8,
        expectedWeakMastery: [],
        actions: [
          { sceneId: "read-context", optionId: "describe-routine", expectCorrect: true },
          { sceneId: "symptom-duration", matchAll: true },
          { sceneId: "symptom-severity", optionId: "calibrated-ret", expectCorrect: true },
          { sceneId: "clarify-misunderstanding", optionId: "check-calmly", expectCorrect: true },
          { sceneId: "next-step", answer: "hvad skal jeg gøre nu og kontakte læge", expectCorrect: true },
          { sceneId: "principle", optionId: "precision-not-diagnosis", expectCorrect: true }
        ]
      },
      {
        id: "neutral",
        expectedEndingId: "neutral",
        expectedVariables: { relationshipTension: -1, clarity: 2, professionalTrust: 0 },
        expectedCorrect: 7,
        expectedWeakMastery: ["symptom-severity"],
        actions: [
          { sceneId: "read-context", optionId: "describe-routine", expectCorrect: true },
          { sceneId: "symptom-duration", matchAll: true },
          { sceneId: "symptom-severity", optionId: "too-vague", expectCorrect: false },
          { sceneId: "clarify-misunderstanding", optionId: "check-calmly", expectCorrect: true },
          { sceneId: "next-step", answer: "hvad skal jeg gøre nu og kontakte læge", expectCorrect: true },
          { sceneId: "principle", optionId: "precision-not-diagnosis", expectCorrect: true }
        ]
      },
      {
        id: "strained",
        expectedEndingId: "strained",
        expectedVariables: { relationshipTension: 4, clarity: -3, professionalTrust: -3 },
        expectedCorrect: 3,
        expectedWeakMastery: ["symptom-severity", "clarification-without-panic", "concrete-next-step", "consequence-aware-register", "context-reading"],
        actions: [
          { sceneId: "read-context", optionId: "minimize", expectCorrect: false },
          { sceneId: "symptom-duration", matchAll: true },
          { sceneId: "symptom-severity", optionId: "overdramatic", expectCorrect: false },
          { sceneId: "clarify-misunderstanding", optionId: "go-silent", expectCorrect: false },
          { sceneId: "next-step", answer: "tak", expectCorrect: false },
          { sceneId: "principle", optionId: "play-doctor", expectCorrect: false }
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
    relationshipTension: "Conversation tension",
    clarity: "Symptom clarity",
    professionalTrust: "Clinical trust"
  },
  variableDescriptions: {
    relationshipTension: ["low — the conversation stayed calm", "visible — wording made the room tighter", "high — panic or minimization got in the way"],
    clarity: ["unclear — duration or severity still vague", "adequate — symptoms can be understood", "clear — duration, severity, and next step are visible"],
    professionalTrust: ["weakened — vague or dramatic wording cost credibility", "neutral — polite but low-signal", "strong — you sounded precise and reliable"]
  },
  languagePhenomena: [
    { item: "i to dage", function: "states duration concretely for symptoms" },
    { item: "siden i går", function: "anchors when symptoms started" },
    { item: "lidt / ret / meget", function: "calibrates severity without overdramatizing" },
    { item: "kan du gentage det", function: "checks understanding without panic" },
    { item: "hvad skal jeg gøre nu", function: "turns description into a process next step" }
  ],
  sourceNotes: [
    {
      title: "Sundhed.dk patient guidance",
      url: "https://www.sundhed.dk/",
      supports: ["Patients should describe symptoms clearly; call 112 for acute life-threatening situations — this lesson trains language only"]
    },
    {
      title: "borger.dk/lifeindenmark.dk skrivevejledning",
      url: "https://digitaliser.dk/Media/638295979179542926/Skrivevejledning%20for%20borger.dk_september%202023_version%201.0.pdf",
      supports: ["Short, concrete Danish helps public-service conversations stay actionable without paper-word vagueness"]
    }
  ],
  scenes: [
    {
      id: "read-context",
      type: "choice",
      eyebrow: "Scene 1 · Akut eller rutine",
      title: "Not every symptom sentence belongs in the same register.",
      learningGoal: "Distinguish emergency escalation from routine symptom description at apotek or læge.",
      sourceRefs: ["Sundhed.dk patient guidance"],
      masteryTags: ["context-reading"],
      pressure: "Du hoster og har ondt i halsen. Apotekeren spørger: 'Hvor længe har du haft det?' Før du svarer, skal du vide: er det akut — eller en almindelig samtale om symptomer?",
      narrative: "Præcis dansk hjælper — men det starter med at læse situationen. Ring 112 ved akut fare. Beskriv varighed og styrke roligt i apotek eller hos læge.",
      dialogue: [{ speaker: "Apoteker", line: "Hvor længe har du haft symptomerne?" }],
      notice: "Akut: ring 112. Rutine: beskriv varighed (i to dage, siden i går) og styrke (lidt, ret) uden at lyde som læge — og uden at sige bare 'ikke så godt'.",
      targetPhrases: ["ring 112", "i to dage", "beskriv symptomer", "apotek"],
      prompt: "What is the first move?",
      options: [
        { id: "describe-routine", diagnostic: "reads-routine-context", label: "Beskriv roligt: hvor længe og hvor meget — det er apotek, ikke akut.", detail: "routine description", correct: true, effects: { clarity: 1, professionalTrust: 1 }, feedback: "Diagnostic: you read routine context. Duration and severity come next — not emergency drama." },
        { id: "call-emergency", diagnostic: "misreads-urgency", label: "Sig med det samme, at det sikkert er meget alvorligt — ring læge nu.", detail: "over-escalates routine case", correct: false, effects: { relationshipTension: 1, clarity: -1 }, feedback: "Diagnostic: for a routine pharmacy talk, overdramatizing can blur the facts. Reserve akut language for akut situations — ring 112 when needed." },
        { id: "minimize", diagnostic: "hides-symptoms", label: "Sig 'det er nok fint' og nævn ikke varighed.", detail: "too vague", correct: false, effects: { clarity: -1, professionalTrust: -1, relationshipTension: 1 }, feedback: "Diagnostic: minimization hides duration and severity. Apotekeren cannot help with what you will not say." }
      ],
      carry: "Carry-forward: læs akut vs rutine først. I apotek: hvor længe (i to dage / siden i går) og hvor meget (lidt / ret).",
      tags: ["A2", "health", "context", "safety"]
    },
    {
      id: "symptom-duration",
      type: "match",
      eyebrow: "Scene 2 · Varighed",
      title: "Hvor længe er et konkret svar — ikke en følelse.",
      learningGoal: "Match duration phrases to what they tell the listener.",
      sourceRefs: ["Sundhed.dk patient guidance"],
      masteryTags: ["symptom-duration"],
      pressure: "Du skal forklare hoste og ondt i halsen. Tidsudtryk ser simple ud — men de gør din dansk testbar.",
      narrative: "Match hver frase til hvad den fortæller om symptomerne.",
      dialogue: [{ speaker: "You", line: "Jeg har haft det ..." }],
      notice: "I to dage = varighed. Siden i går = startpunkt. Om morgenen = mønster — ikke det samme som 'lidt tid'.",
      targetPhrases: ["i to dage", "siden i går", "om morgenen"],
      prompt: "Match each phrase to the job it does.",
      pairs: [
        { id: "two-days", left: "I to dage.", right: "states how long symptoms lasted", feedback: "I to dage gives a countable duration." },
        { id: "since-yesterday", left: "Siden i går.", right: "marks when symptoms started", feedback: "Siden i går anchors the timeline." },
        { id: "mornings", left: "Især om morgenen.", right: "describes a pattern", feedback: "Om morgenen adds pattern — useful for hoste and hals." }
      ],
      carry: "Carry-forward: i to dage og siden i går gør varighed synlig. Om morgenen tilføjer mønster.",
      tags: ["A2", "duration", "health"]
    },
    {
      id: "symptom-severity",
      type: "choice",
      eyebrow: "Scene 3 · Styrke",
      title: "Lidt og ret er præcision — ikke overdrivelse.",
      learningGoal: "Calibrate severity words without drama or vagueness.",
      sourceRefs: ["Sundhed.dk patient guidance"],
      masteryTags: ["symptom-severity"],
      pressure: "Apotekeren spørger hvor slemt det er. For svagt lyder som ingenting; for hårdt lyder som panik.",
      narrative: "A2-sundhedsdansk: kalibrer styrke med lidt, ret, meget — uden at spille læge.",
      dialogue: [{ speaker: "Apoteker", line: "Er det meget slemt?" }],
      notice: "Ret ondt i halsen er præcist. Meget slemt uden fakta lyder dramatisk. 'Ikke så godt' er for vagt.",
      targetPhrases: ["lidt", "ret ondt", "meget slemt", "ikke så godt"],
      prompt: "Which line calibrates severity best?",
      options: [
        { id: "calibrated-ret", diagnostic: "calibrated-severity", label: "Ret ondt i halsen, især om morgenen.", detail: "precise severity", correct: true, effects: { clarity: 1, professionalTrust: 1 }, feedback: "Diagnostic: ret plus om morgenen gives precision without panic." },
        { id: "too-vague", diagnostic: "vague-severity", label: "Ikke så godt, tror jeg.", detail: "too vague", correct: false, effects: { clarity: -1, professionalTrust: -1 }, feedback: "Diagnostic: ikke så godt hides severity. Apotekeren still lacks testable detail." },
        { id: "overdramatic", diagnostic: "overdramatic-severity", label: "Det er meget slemt — jeg tror det er farligt.", detail: "over-claims", correct: false, effects: { relationshipTension: 2, professionalTrust: -1, clarity: -1 }, feedback: "Diagnostic: you overclaimed certainty. Describe symptoms; let professionals assess danger — ring 112 when acute." }
      ],
      carry: "Carry-forward: ret ondt i halsen er stærkere end 'ikke så godt'. Undgå at diagnosticere — beskriv.",
      tags: ["A2", "severity", "health"]
    },
    {
      id: "clarify-misunderstanding",
      type: "choice",
      eyebrow: "Scene 4 · Afklaring",
      title: "When you did not hear the word, ask — do not guess.",
      learningGoal: "Use clarification questions calmly at apotek or læge.",
      sourceRefs: ["Sundhed.dk patient guidance"],
      masteryTags: ["clarification-without-panic"],
      pressure: "Apotekeren siger et ord du ikke helt hørte — måske om hoste eller feber. Du kan nikke, gætte, eller spørge.",
      narrative: "Kan du gentage det og Mener du ...? holder samtalen præcis uden panik.",
      dialogue: [{ speaker: "Apoteker", line: "Har du også haft feber?" }],
      notice: "Spørg roligt: Mener du over 38 grader? eller Kan du gentage det? — det er agency uden aggression.",
      targetPhrases: ["kan du gentage", "mener du", "feber"],
      prompt: "How do you clarify?",
      options: [
        { id: "check-calmly", diagnostic: "clarifies-with-agency", label: "Mener du feber hele tiden, eller kun om aftenen?", detail: "calm clarification", correct: true, effects: { clarity: 1, relationshipTension: -1 }, feedback: "Diagnostic: strong A2 move. You checked meaning before answering wrong." },
        { id: "go-silent", diagnostic: "silent-guess", label: "Nik ja — du er ikke sikker på hvad de spurgte om.", detail: "guessing", correct: false, effects: { clarity: -1, professionalTrust: -1, relationshipTension: 1 }, feedback: "Diagnostic: silence lets wrong assumptions pass. Clarify first." },
        { id: "panic", diagnostic: "panic-response", label: "Sig højt at du ikke forstår dansk og gå.", detail: "panic exit", correct: false, effects: { relationshipTension: 1 }, feedback: "Diagnostic: leaving in panic ends the process. One calm question keeps you in control." }
      ],
      carry: "Carry-forward: mener du og kan du gentage det afklarer uden panik.",
      tags: ["A2", "clarification", "health"]
    },
    {
      id: "next-step",
      type: "completion",
      eyebrow: "Scene 5 · Næste skridt",
      title: "Description is not finished until something can happen next.",
      learningGoal: "Complete the exchange with a concrete next-step question.",
      sourceRefs: ["Sundhed.dk patient guidance"],
      masteryTags: ["concrete-next-step"],
      pressure: "Du har beskrevet hoste, varighed og styrke. Nu skal du spørge hvad du gør — uden at lyde som læge.",
      narrative: "Afslut med et synligt næste skridt: hvad skal jeg gøre nu, skal jeg kontakte læge, eller book tid.",
      dialogue: [{ speaker: "You", line: "Tak — jeg har hoste i to dage med ret ondt i halsen. ..." }],
      notice: "Konkret dansk: hvad skal jeg gøre nu eller skal jeg kontakte min læge. Ikke kun tak.",
      targetPhrases: ["hvad skal jeg gøre", "kontakte læge", "hoste i to dage"],
      prompt: "Complete with a next-step question.",
      prefix: "Tak — jeg har hoste i to dage med ret ondt i halsen.",
      placeholder: "Hvad skal jeg gøre nu og kontakte læge?",
      acceptKeywordGroups: [
        { name: "next-step question", keywords: ["hvad", "gøre", "skal", "nu"] },
        { name: "process move", keywords: ["læge", "kontakte", "tid", "book"] }
      ],
      success: "Good. You described symptoms and asked a process next step.",
      failure: "Include a next-step word: hvad, gøre, skal, læge, kontakte, tid, or nu.",
      effects: { clarity: 1 },
      carry: "Carry-forward: beskrivelse plus hvad skal jeg gøre nu gør samtalen brugbar.",
      tags: ["A2", "completion", "health"]
    },
    {
      id: "principle",
      type: "choice",
      eyebrow: "Final · Princip",
      title: "Precise Danish is not playing doctor.",
      learningGoal: "Name the A2 principle: describe clearly, clarify calmly, ask next steps — language training only.",
      sourceRefs: ["Sundhed.dk patient guidance"],
      masteryTags: ["consequence-aware-register"],
      pressure: "Samtalen slutter. Dette er sprogtræning — ikke medicinsk rådgivning.",
      narrative: "Princip du kan bruge igen: præcis symptombeskrivelse uden at diagnosticere.",
      dialogue: [{ speaker: "Safety note", line: "Ved akut fare: ring 112. Kontakt læge ved vedvarende eller forværrede symptomer." }],
      notice: "Platå træner sprog. Beskriv varighed og styrke; lad fagfolk vurdere behandling.",
      targetPhrases: ["præcis symptombeskrivelse", "ring 112", "sprogtræning"],
      prompt: "Which principle should this lesson teach?",
      options: [
        { id: "precision-not-diagnosis", diagnostic: "names-precision-principle", label: "Præcis symptombeskrivelse er sprog — ikke at være læge.", detail: "transferable principle", correct: true, feedback: "Diagnostic: yes. Duration, severity, clarification, and next steps — without diagnosing." },
        { id: "play-doctor", diagnostic: "confuses-language-with-diagnosis", label: "God dansk betyder at du selv ved hvad der er galt.", detail: "over-claims", correct: false, feedback: "Diagnostic: language precision helps communication; it does not replace medical assessment." },
        { id: "maximum-drama", diagnostic: "confuses-urgency-with-clarity", label: "God dansk betyder at du lyder mest alvorlig.", detail: "too dramatic", correct: false, feedback: "Diagnostic: drama is not clarity. Calibrated lidt/ret/meget beats theatrical language." }
      ],
      carry: "Unlocked A2 theme: præcis symptombeskrivelse. Ring 112 ved akut fare; spørg hvad skal jeg gøre nu i rutinesamtaler.",
      tags: ["A2", "principle", "safety", "health"]
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
      title: "Clear and usable",
      narrative: "Apotekeren forstår varighed, styrke og mønster. Du spurgte hvad du skal gøre næste — uden panik og uden at skjule symptomer.",
      danish: "Du gjorde symptomerne tydelige uden at spille læge.",
      carry: "A2 unlocked: duration plus severity plus next step makes everyday health Danish work."
    },
    {
      id: "strained",
      title: "Hard to help",
      narrative: "Samtalen blev utydelig — for vag, for dramatisk, eller afbrudt af panik. Næste skridt bliver sværere at finde sammen.",
      danish: "Uklar dansk gør det sværere at hjælpe dig.",
      carry: "A2 unlocked: vagueness and drama both block useful health conversations."
    },
    {
      id: "neutral",
      title: "Polite but low-signal",
      narrative: "Du var høflig, men severity eller varighed manglede præcision. Intet går galt — men rådet bliver generisk.",
      danish: "Det var fint, men ikke præcist nok.",
      carry: "A2 unlocked: polite Danish needs testable duration and severity to move the case."
    }
  ]
};

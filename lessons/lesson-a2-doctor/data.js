window.PLATA_LESSON_A2_DOCTOR = {
  id: "lesson-a2-doctor",
  contentVersion: 2,
  level: "A2",
  title: "Explain your symptoms clearly",
  subtitle: "Useful Danish for a pharmacy or doctor: what hurts, how long, and what you need next.",
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
        sourceRefs: ["Apoteket.dk: cough guidance"],
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
        prompt: "Create a quiet editorial comic panel where a learner completes a symptom description and asks what to do next at a Danish pharmacy counter. Show an abstract process marker or calendar shape suggesting what happens next, with calm, attentive posture. No readable prescription text, no speech bubbles, no dramatic illness imagery.",
        sourceRefs: ["Sundhed.dk patient guidance"],
        masteryTags: ["concrete-next-step"],
        mustInclude: ["next-step gesture", "calm pharmacy setting"],
        avoid: ["readable prescription text", "busy dashboard interface"]
      },
      {
        id: "principle",
        sceneId: "principle",
        assetPath: "./assets/comic/principle.png",
        alt: "The learner calls the doctor and gives the symptom, duration, and change in one clear opening.",
        prompt: "Create a quiet editorial comic panel showing the learner calling a doctor's office after the cough has become worse. Use three simple visual cues for cough, four days, and change over time while a receptionist listens on the other end. The learner describes symptoms without trying to diagnose them. No readable text, logos, or speech bubbles.",
        sourceRefs: ["Sundhed.dk patient guidance"],
        masteryTags: ["consequence-aware-register"],
        mustInclude: ["doctor phone call", "duration cue", "symptoms becoming worse"],
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
        accept: "skal jeg kontakte min læge nu"
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
          { sceneId: "next-step", answer: "skal jeg kontakte min læge nu", expectCorrect: true },
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
          { sceneId: "next-step", answer: "skal jeg kontakte min læge nu", expectCorrect: true },
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
  variableDirections: {
    relationshipTension: "lower-is-better"
  },
  variableLabels: {
    relationshipTension: "Conversation tension",
    clarity: "Symptom clarity",
    professionalTrust: "Clinical trust"
  },
  variableDescriptions: {
    relationshipTension: ["low — the conversation stayed calm", "visible — wording made the room tighter", "high — panic or minimization got in the way"],
    clarity: ["unclear — duration or severity still vague", "adequate — symptoms can be understood", "clear — duration, severity, and next step are visible"],
    professionalTrust: ["weakened — vague or dramatic wording made the symptoms harder to understand", "neutral — the main point was understood", "strong — you sounded precise and reliable"]
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
      url: "https://www.sundhed.dk/borger/trivsel/boern-og-unge-i-fokus/akut-hjaelp/",
      supports: ["Medical urgency belongs with qualified services; this lesson only practises the language of describing symptoms"]
    },
    {
      title: "Apoteket.dk: cough guidance",
      url: "https://www.apoteket.dk/sundhed-og-sygdom/feber-og-forkoelelse/medicin-mod-hoste/",
      supports: ["A pharmacist may ask about the type and duration of a cough before advising what to do next"]
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
      eyebrow: "Scene 1 · At the pharmacy",
      title: "Start with a sentence the pharmacist can use.",
      learningGoal: "Describe the main symptom and its duration in one clear sentence.",
      sourceRefs: ["Apoteket.dk: cough guidance"],
      masteryTags: ["context-reading"],
      pressure: "You have a cough and a sore throat. At the counter, the pharmacist asks what is wrong.",
      narrative: "You do not need a diagnosis in Danish. You need to say what you feel and how long it has lasted.",
      dialogue: [{ speaker: "Apoteker", line: "Hvad kan jeg hjælpe dig med?" }],
      notice: "A useful answer has two parts: the symptom and the timeline — for example, hoste + i to dage.",
      targetPhrases: ["jeg har hostet", "i to dage", "ondt i halsen"],
      prompt: "Which answer gives the pharmacist the clearest start?",
      options: [
        { id: "describe-routine", diagnostic: "reads-routine-context", label: "Jeg har hostet i to dage, og jeg har ondt i halsen.", detail: "symptom + duration", correct: true, effects: { clarity: 1, professionalTrust: 1 }, feedback: "Good start. The pharmacist immediately knows what is wrong and how long it has lasted." },
        { id: "call-emergency", diagnostic: "misreads-urgency", label: "Jeg tror, at det er en alvorlig infektion.", detail: "a diagnosis without useful details", correct: false, effects: { relationshipTension: 1, clarity: -1 }, feedback: "This guesses at a diagnosis but leaves out the timeline. Describe what you feel first; a professional can assess the cause." },
        { id: "minimize", diagnostic: "hides-symptoms", label: "Jeg har det ikke så godt.", detail: "understandable but too broad", correct: false, effects: { clarity: -1, professionalTrust: -1, relationshipTension: 1 }, feedback: "The pharmacist still has to discover both the symptom and the timeline. Add what hurts and for how long." }
      ],
      carry: "Keep the frame: Jeg har … + i/siden … . You will make it more precise in the next two scenes.",
      tags: ["A2", "health", "context", "safety"]
    },
    {
      id: "symptom-duration",
      type: "match",
      eyebrow: "Scene 2 · Duration",
      title: "Three short phrases answer three different questions.",
      learningGoal: "Match duration phrases to what they tell the listener.",
      sourceRefs: ["Sundhed.dk patient guidance"],
      masteryTags: ["symptom-duration"],
      pressure: "The pharmacist wants to know when the cough began and whether it changes during the day.",
      narrative: "Match each Danish time phrase to the information it gives.",
      dialogue: [{ speaker: "You", line: "Jeg har haft det ..." }],
      notice: "I to dage = varighed. Siden i går = startpunkt. Om morgenen = mønster — ikke det samme som 'lidt tid'.",
      targetPhrases: ["i to dage", "siden i går", "om morgenen"],
      prompt: "Match each phrase to the job it does.",
      pairs: [
        { id: "two-days", left: "I to dage.", right: "states how long symptoms lasted", feedback: "I to dage gives a countable duration." },
        { id: "since-yesterday", left: "Siden i går.", right: "marks when symptoms started", feedback: "Siden i går anchors the timeline." },
        { id: "mornings", left: "Især om morgenen.", right: "describes a pattern", feedback: "Om morgenen adds pattern — useful for hoste and hals." }
      ],
      carry: "Use i + a period for duration, siden + a point in time for the start, and om morgenen for a recurring pattern.",
      tags: ["A2", "duration", "health"]
    },
    {
      id: "symptom-severity",
      type: "choice",
      eyebrow: "Scene 3 · Intensity",
      title: "Say how strong it feels without guessing the cause.",
      learningGoal: "Calibrate severity words without drama or vagueness.",
      sourceRefs: ["Sundhed.dk patient guidance"],
      masteryTags: ["symptom-severity"],
      pressure: "The pharmacist asks how bad the sore throat is.",
      narrative: "Words such as lidt, ret, and meget help the listener understand the intensity.",
      dialogue: [{ speaker: "Apoteker", line: "Er det meget slemt?" }],
      notice: "Ret ondt i halsen er præcist. Meget slemt uden fakta lyder dramatisk. 'Ikke så godt' er for vagt.",
      targetPhrases: ["lidt", "ret ondt", "meget slemt", "ikke så godt"],
      prompt: "Which line calibrates severity best?",
      options: [
        { id: "calibrated-ret", diagnostic: "calibrated-severity", label: "Jeg har ret ondt i halsen, især når jeg synker.", detail: "intensity + useful detail", correct: true, effects: { clarity: 1, professionalTrust: 1 }, feedback: "Ret describes the intensity, and især når jeg synker tells the pharmacist when it hurts." },
        { id: "too-vague", diagnostic: "vague-severity", label: "Det føles lidt mærkeligt.", detail: "too broad to guide the next question", correct: false, effects: { clarity: -1, professionalTrust: -1 }, feedback: "Mærkeligt does not say where it hurts or how strongly. Name the body part and the intensity." },
        { id: "overdramatic", diagnostic: "overdramatic-severity", label: "Det må være halsbetændelse.", detail: "a conclusion rather than a description", correct: false, effects: { relationshipTension: 2, professionalTrust: -1, clarity: -1 }, feedback: "This names a possible diagnosis but not what you experience. Say how your throat feels and let the professional assess it." }
      ],
      carry: "A strong A2 answer can be simple: Jeg har ret ondt i halsen, især når jeg synker.",
      tags: ["A2", "severity", "health"]
    },
    {
      id: "clarify-misunderstanding",
      type: "choice",
      eyebrow: "Scene 4 · Clarify",
      title: "A clarification question keeps the conversation moving.",
      learningGoal: "Use clarification questions calmly at apotek or læge.",
      sourceRefs: ["Sundhed.dk patient guidance"],
      masteryTags: ["clarification-without-panic"],
      pressure: "You hear the word feber, but you are not sure whether the pharmacist means now or during the last few days.",
      narrative: "Use Mener du …? to check the exact meaning before you answer.",
      dialogue: [{ speaker: "Apoteker", line: "Har du også haft feber?" }],
      notice: "Undskyld makes the interruption gentle; mener du lets you test what you understood.",
      targetPhrases: ["kan du gentage", "mener du", "feber"],
      prompt: "How do you clarify?",
      options: [
        { id: "check-calmly", diagnostic: "clarifies-with-agency", label: "Undskyld, mener du, om jeg har feber nu?", detail: "checks the exact question", correct: true, effects: { clarity: 1, relationshipTension: -1 }, feedback: "Exactly. You check one detail and make it easy for the pharmacist to repeat or rephrase." },
        { id: "go-silent", diagnostic: "silent-guess", label: "Ja, måske.", detail: "answers before the question is clear", correct: false, effects: { clarity: -1, professionalTrust: -1, relationshipTension: 1 }, feedback: "This sounds like an answer, but neither person knows whether you understood the question. Ask what feber refers to." },
        { id: "panic", diagnostic: "panic-response", label: "Undskyld, mit dansk er ikke så godt.", detail: "honest but does not recover the question", correct: false, effects: { relationshipTension: 1 }, feedback: "This explains the problem but does not solve it. Add Kan du gentage det? or Mener du …?" }
      ],
      carry: "Two reliable repair phrases are Kan du gentage det? and Undskyld, mener du …?",
      tags: ["A2", "clarification", "health"]
    },
    {
      id: "next-step",
      type: "completion",
      eyebrow: "Scene 5 · Next step",
      title: "Finish by asking what to do next.",
      learningGoal: "Complete the exchange with a concrete next-step question.",
      sourceRefs: ["Sundhed.dk patient guidance"],
      masteryTags: ["concrete-next-step"],
      pressure: "The pharmacist has heard your symptoms. You still need to know whether to try something from the pharmacy or contact your doctor.",
      narrative: "Ask one short next-step question. You are not expected to know the medical answer yourself.",
      dialogue: [{ speaker: "You", line: "Tak — jeg har hostet i to dage og har ret ondt i halsen. ..." }],
      notice: "Konkret dansk: hvad skal jeg gøre nu eller skal jeg kontakte min læge. Ikke kun tak.",
      targetPhrases: ["hvad skal jeg gøre", "kontakte læge", "hostet i to dage"],
      prompt: "Complete the exchange with a natural next-step question.",
      prefix: "Tak. Jeg har hostet i to dage og har ret ondt i halsen.",
      placeholder: "Skal jeg kontakte min læge, hvis det ikke bliver bedre?",
      acceptKeywordGroups: [
        { name: "next-step question", keywords: ["hvad", "skal", "kan", "bør"] },
        { name: "process move", keywords: ["gøre", "læge", "kontakte", "tid", "prøve"] }
      ],
      success: "Good. The pharmacist now knows both what you feel and what question you need answered.",
      failure: "Ask a complete question with a question word such as skal/kan/hvad and an action such as gøre/kontakte/prøve.",
      effects: { clarity: 1 },
      carry: "Useful frame: Skal jeg …? / Hvad skal jeg gøre, hvis …?",
      tags: ["A2", "completion", "health"]
    },
    {
      id: "principle",
      type: "choice",
      eyebrow: "Final · A phone call",
      title: "Use the same structure when the situation changes.",
      learningGoal: "Open a call to the doctor with symptom, duration, and change over time.",
      sourceRefs: ["Sundhed.dk patient guidance"],
      masteryTags: ["consequence-aware-register"],
      pressure: "Four days later, the cough is worse. You call your doctor and need a useful first sentence.",
      narrative: "Transfer the same three-part structure: why you are calling, how long it has lasted, and what has changed.",
      dialogue: [{ speaker: "Lægehus", line: "Lægehuset, det er Anne." }],
      notice: "Jeg ringer, fordi … is a natural opening. It tells the receptionist why this call needs the next question.",
      targetPhrases: ["jeg ringer, fordi", "i fire dage", "det bliver værre"],
      prompt: "Which opening gives the receptionist the clearest picture?",
      options: [
        { id: "precision-not-diagnosis", diagnostic: "names-precision-principle", label: "Jeg ringer, fordi jeg har hostet i fire dage, og det bliver værre.", detail: "reason + duration + change", correct: true, feedback: "That works. The receptionist can hear why you are calling and what has changed since the pharmacy visit." },
        { id: "play-doctor", diagnostic: "confuses-language-with-diagnosis", label: "Jeg ringer, fordi jeg helt sikkert har en infektion.", detail: "certainty without symptoms", correct: false, feedback: "This states a diagnosis but leaves out the useful history. Describe the cough, duration, and change instead." },
        { id: "maximum-drama", diagnostic: "confuses-urgency-with-clarity", label: "Jeg har det stadig dårligt og vil gerne have en tid.", detail: "clear request, incomplete symptom picture", correct: false, feedback: "The request is understandable, but the receptionist still needs to ask what is wrong and how long it has lasted." }
      ],
      carry: "You can now build a useful health sentence: symptom + duration + intensity or change + one next-step question.",
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
      title: "The listener has what they need",
      narrative: "You described the symptom, duration, and intensity, checked one unclear question, and asked what to do next.",
      danish: "Jeg har hostet i to dage, og jeg har ret ondt i halsen.",
      carry: "Use the same structure at a pharmacy, on the phone, or in a short message to your doctor."
    },
    {
      id: "strained",
      title: "The key details are still missing",
      narrative: "The conversation contains a guess or a broad statement, but not enough detail about what you feel and how long it has lasted.",
      danish: "Jeg har det ikke så godt.",
      carry: "Repair it with one body symptom and one time phrase: Jeg har … i/siden … ."
    },
    {
      id: "neutral",
      title: "Understood, but not yet precise",
      narrative: "The pharmacist understands the main problem, but still needs another question about duration or intensity before giving useful guidance.",
      danish: "Det er forståeligt, men der mangler en detalje.",
      carry: "Add i to dage, siden i går, lidt, ret, or især når … to make the sentence more useful."
    }
  ]
};

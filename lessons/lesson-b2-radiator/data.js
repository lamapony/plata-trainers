window.PLATA_LESSON_B2_RADIATOR = {
  id: "lesson-b2-radiator-register",
  level: "B2",
  title: "Det afhænger af, hvordan du siger det",
  subtitle: "A B2 Danish lesson about complaints, register, modal particles, and social consequences.",
  estimatedMinutes: 14,
  qualityTier: "gold",
  editorialFocus: "Read official Danish precisely, choose register under pressure, and preserve agency without escalating tone.",
  comicStoryboard: {
    style: "Nordic editorial comic, restrained linework, muted sage and ember accents, realistic Copenhagen interiors, adult learner perspective, no readable text inside the image, no logos, no watermarks.",
    aspectRatio: "16:9",
    imageSize: "1K",
    panels: [
      {
        id: "official-reply-passive",
        sceneId: "official-reply-passive",
        assetPath: "./assets/comic/official-reply-passive.png",
        alt: "A tenant studies a formal landlord email while a cold radiator sits in the background.",
        prompt: "A single comic panel in a quiet Copenhagen apartment. An adult tenant sits at a small table reading a formal landlord email on a laptop, while a cold radiator and winter window are visible behind them. The mood is polite but evasive: the email feels official, yet nobody is taking visible responsibility. No readable text, no labels, no speech bubbles.",
        sourceRefs: ["Lex: passiv", "sproget.dk: grammatiske betegnelser"],
        masteryTags: ["passive-agency"],
        mustInclude: ["cold radiator", "formal email", "unclear responsibility"],
        avoid: ["cartoon exaggeration", "angry shouting", "readable text"]
      },
      {
        id: "group-chat-particles",
        sceneId: "group-chat-particles",
        assetPath: "./assets/comic/group-chat-particles.png",
        alt: "Friends in a group chat pull the tenant toward calm and escalation at the same time.",
        prompt: "A single comic panel showing a phone group chat as visual tension, not readable text. The tenant holds a phone; two imagined friends appear as small side portraits, one calm and reassuring, one forceful and escalating. Show social stance through expression and posture, not written words. Nordic editorial comic style, muted colors, no readable text or logos.",
        sourceRefs: ["Dansk Sproghistorie: dialogiske partikler"],
        masteryTags: ["modal-particle-stance"],
        mustInclude: ["phone chat", "calming friend", "escalating friend"],
        avoid: ["readable chat messages", "emoji-only composition", "aggressive caricature"]
      },
      {
        id: "two-registers",
        sceneId: "two-registers",
        assetPath: "./assets/comic/two-registers.png",
        alt: "The tenant drafts a formal landlord reply while keeping private-chat frustration separate.",
        prompt: "A single comic panel split by composition, not by hard border: on one side the tenant drafts a calm formal email at a laptop; on the other side a phone shows private chat energy as abstract shapes. The learner is choosing a precise formal request without importing private frustration. No readable text, no speech bubbles, no logos.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Dansk Sproghistorie: dialogiske partikler"],
        masteryTags: ["formal-register-control", "modal-particle-stance"],
        mustInclude: ["laptop email draft", "phone chat", "controlled tone"],
        avoid: ["visible Danish sentences", "office cliché", "comic violence"]
      },
      {
        id: "workplace-understatement",
        sceneId: "workplace-understatement",
        assetPath: "./assets/comic/workplace-understatement.png",
        alt: "A workplace coffee conversation shows honesty balanced with calm agency.",
        prompt: "A single comic panel in a Danish workplace kitchen. A supervisor casually asks about the apartment while making coffee; the learner answers calmly, neither oversharing nor hiding the problem. Show balanced social intelligence and practical agency through body language. No readable text, no speech bubbles, no brand marks.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["understatement-with-agency"],
        mustInclude: ["workplace coffee", "calm answer", "private problem kept proportional"],
        avoid: ["melodrama", "readable labels", "romantic office scene"]
      },
      {
        id: "channel-transfer-lab",
        sceneId: "channel-transfer-lab",
        assetPath: "./assets/comic/channel-transfer-lab.png",
        alt: "The tenant compares the same radiator complaint across email, chat, meeting, and public profile contexts.",
        prompt: "A single comic panel showing the tenant at a small desk with four communication channels represented visually: a formal laptop email, a private phone chat, a quiet workplace coffee conversation, and a minimal professional profile card. The same radiator problem is being translated into different social channels. Show careful comparison and restraint, not confusion. No readable text, no logos, no speech bubbles.",
        sourceRefs: ["Lex: passiv", "Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["formal-register-control", "passive-agency", "consequence-aware-tone"],
        mustInclude: ["four communication channels", "same problem translated", "calm comparison"],
        avoid: ["readable messages", "generic app logos", "chaotic notification storm"]
      },
      {
        id: "epilogue-consequence",
        sceneId: "epilogue-consequence",
        assetPath: "./assets/comic/epilogue-consequence.png",
        alt: "The radiator is fixed and the relationships around the tenant remain intact.",
        prompt: "A single comic panel after the conflict is resolved. The radiator is warm, the room feels livable again, and the tenant looks relieved while messages from landlord, friend, and workplace are represented as calm abstract notification cards without readable text. The visual idea is clarity without aggression preserving relationships. Nordic editorial comic style, no text.",
        sourceRefs: ["Lex: passiv", "Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["consequence-aware-tone"],
        mustInclude: ["warm radiator", "relieved tenant", "preserved relationships"],
        avoid: ["victory pose", "readable text", "corporate stock art"]
      }
    ]
  },
  masteryMap: {
    "passive-agency": {
      competencyId: "agency",
      label: "Read passive agency",
      evidence: "The learner distinguishes registration/process language from an actual repair commitment.",
      remediation: {
        sceneId: "official-reply-passive",
        cta: "Review Scene 1",
        action: "Rerun the landlord email and name the missing actor, date, and deadline before judging whether the text promises a repair."
      },
      sourceRefs: ["Lex: passiv", "sproget.dk: grammatiske betegnelser"]
    },
    "modal-particle-stance": {
      competencyId: "stance-reading",
      label: "Read particle stance",
      evidence: "The learner identifies how jo, da, sgu, nok, and bare position the speaker socially.",
      remediation: {
        sceneId: "group-chat-particles",
        cta: "Rematch the group chat",
        action: "Rerun the particle matches and say what each small word does socially before you decide whether the advice calms or escalates."
      },
      sourceRefs: ["Dansk Sproghistorie: dialogiske partikler"]
    },
    "formal-register-control": {
      competencyId: "register-control",
      label: "Control formal register",
      evidence: "The learner makes a concrete formal request without importing private-chat force.",
      remediation: {
        sceneId: "two-registers",
        cta: "Repair the formal reply",
        action: "Rerun the two-register scene and keep the useful pressure: ask for a precise date without adding chat-force words."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Dansk Sproghistorie: dialogiske partikler"]
    },
    "understatement-with-agency": {
      competencyId: "agency",
      label: "Use understatement with agency",
      evidence: "The learner softens a workplace answer while preserving an action and concrete next step.",
      remediation: {
        sceneId: "workplace-understatement",
        cta: "Repair the workplace answer",
        action: "Rerun the workplace completion and include both halves: one agency word and one concrete next step."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "consequence-aware-tone": {
      competencyId: "consequence-awareness",
      label: "Choose consequence-aware tone",
      evidence: "The learner names the B2 principle that clarity and relationship control can coexist.",
      remediation: {
        sceneId: "epilogue-consequence",
        cta: "Review the consequence",
        action: "Rerun the final choice and choose the principle that solves the case while preserving the room."
      },
      sourceRefs: ["Lex: passiv", "Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"]
    }
  },
  simulation: {
    expectedEndingId: "diplomatic",
    completionAnswers: {
      "workplace-understatement": {
        reject: ["varme", "jeg har bedt"],
        accept: "jeg har bedt udlejeren om en konkret dato"
      }
    },
    paths: [
      {
        id: "diplomatic",
        expectedEndingId: "diplomatic",
        expectedVariables: { landlordTension: -2, sofiaTrust: 0, emilEscalation: 0, workplaceTrust: 3 },
        expectedCorrect: 9,
        expectedWeakMastery: [],
        actions: [
          { sceneId: "official-reply-passive", optionId: "accurate", expectCorrect: true },
          { sceneId: "group-chat-particles", matchAll: true },
          { sceneId: "two-registers", optionId: "formal-clear", expectCorrect: true },
          { sceneId: "channel-transfer-lab", optionId: "email-clear-agency", reasonId: "actor-date-channel", expectCorrect: true },
          { sceneId: "workplace-understatement", answer: "jeg har bedt udlejeren om en konkret dato", expectCorrect: true },
          { sceneId: "epilogue-consequence", optionId: "balanced", expectCorrect: true }
        ]
      },
      {
        id: "aggressive",
        expectedEndingId: "aggressive",
        expectedVariables: { landlordTension: 5, sofiaTrust: -2, emilEscalation: 0, workplaceTrust: 1 },
        expectedCorrect: 5,
        expectedWeakMastery: ["passive-agency", "formal-register-control", "modal-particle-stance", "consequence-aware-tone"],
        actions: [
          { sceneId: "official-reply-passive", optionId: "too-aggressive", expectCorrect: false },
          { sceneId: "group-chat-particles", matchAll: true },
          { sceneId: "two-registers", optionId: "formal-aggressive", expectCorrect: false },
          { sceneId: "channel-transfer-lab", optionId: "email-private-force", expectCorrect: false },
          { sceneId: "workplace-understatement", answer: "jeg har bedt udlejeren om en konkret dato", expectCorrect: true },
          { sceneId: "epilogue-consequence", optionId: "always-hard", expectCorrect: false }
        ]
      },
      {
        id: "passive",
        expectedEndingId: "passive",
        expectedVariables: { landlordTension: 0, sofiaTrust: 0, emilEscalation: 0, workplaceTrust: -2 },
        expectedCorrect: 4,
        expectedWeakMastery: ["passive-agency", "formal-register-control", "modal-particle-stance", "understatement-with-agency", "consequence-aware-tone"],
        actions: [
          { sceneId: "official-reply-passive", optionId: "too-trusting", expectCorrect: false },
          { sceneId: "group-chat-particles", matchAll: true },
          { sceneId: "two-registers", optionId: "formal-passive", expectCorrect: false },
          { sceneId: "channel-transfer-lab", optionId: "email-soft-near-miss", expectCorrect: false },
          { sceneId: "workplace-understatement", answer: "varme", expectCorrect: false },
          { sceneId: "epilogue-consequence", optionId: "always-soft", expectCorrect: false }
        ]
      }
    ]
  },
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
  sourceNotes: [
    {
      title: "Lex: passiv",
      url: "https://lex.dk/passiv",
      supports: ["Danish passive can downplay or exclude the agent", "s-passive and blive-passive differ formally, semantically, and stylistically"]
    },
    {
      title: "Dansk Sproghistorie: dialogiske partikler",
      url: "https://www.dansksproghistorie.dk/75/",
      supports: ["jo, da, sgu, nok, vel, and related words can mark the speaker's stance toward the listener"]
    },
    {
      title: "sproget.dk: grammatiske betegnelser",
      url: "https://sproget.dk/sprogviden/ordlister/grammatiske-betegnelser/",
      supports: ["blive-passiv / omskreven passiv terminology"]
    },
    {
      title: "borger.dk/lifeindenmark.dk skrivevejledning",
      url: "https://digitaliser.dk/Media/638295979179542926/Skrivevejledning%20for%20borger.dk_september%202023_version%201.0.pdf",
      supports: ["Official Danish should be concrete and precise; avoid paper-word style where possible"]
    }
  ],
  scenes: [
    {
      id: "official-reply-passive",
      type: "choice",
      eyebrow: "Scene 1 · Brevet",
      title: "The landlord answers politely without promising anything.",
      learningGoal: "Distinguish a registered case from an actual repair commitment in formal passive Danish.",
      sourceRefs: ["Lex: passiv", "sproget.dk: grammatiske betegnelser"],
      masteryTags: ["passive-agency"],
      pressure: "It is January, the radiator has been broken for five days, and the official reply looks calm enough to make you doubt your own irritation.",
      narrative: "The email is perfect Danish: formal, smooth, and evasive. The question is not what the words mean, but what the sender avoids taking responsibility for.",
      dialogue: [
        { speaker: "Udlejer", line: "Der er blevet noteret en reklamation vedrørende radiatoren." },
        { speaker: "Udlejer", line: "Der vil blive sendt en håndværker, når det passer ind i planlægningen." }
      ],
      notice: "Passive voice removes the actor. Nobody says: Vi sender en håndværker på fredag.",
      targetPhrases: ["Der er blevet noteret", "reklamation vedrørende radiatoren", "der vil blive sendt en håndværker", "de lover ikke en dato"],
      prompt: "What does the reply actually promise?",
      options: [
        { id: "too-trusting", diagnostic: "overreads-passive-as-promise", label: "De lover, at radiatoren bliver fikset hurtigt.", detail: "too trusting", correct: false, effects: { landlordTension: 0 }, feedback: "Diagnostic: you treated passive planning language as a concrete appointment. There is no actor, date, or deadline." },
        { id: "accurate", diagnostic: "separates-registration-from-commitment", label: "De har registreret sagen, men de lover ikke en dato.", detail: "accurate reading", correct: true, effects: { landlordTension: 0, workplaceTrust: 1 }, feedback: "Diagnostic: correct. You identified the only commitment: the case is registered. Everything after that is process language, not a repair promise." },
        { id: "too-aggressive", diagnostic: "adds-refusal-not-in-text", label: "De nægter at reparere radiatoren.", detail: "too aggressive", correct: false, effects: { landlordTension: 1 }, feedback: "Diagnostic: you converted missing commitment into refusal. B2 reading means naming evasion without adding an accusation the text does not support." }
      ],
      carry: "Carry-forward: official passive wording like 'Der er blevet noteret en reklamation vedrørende radiatoren' and 'der vil blive sendt en håndværker' can sound polite while avoiding hvem, hvornår, sagen, passer ind i planlægningen, registreret, and lover.",
      tags: ["B2", "passive", "official-register", "housing"]
    },
    {
      id: "group-chat-particles",
      type: "match",
      eyebrow: "Scene 2 · Gruppechatten",
      title: "Your friends reveal their stance before they make an argument.",
      learningGoal: "Identify social stance from Danish particles before reacting to advice.",
      sourceRefs: ["Dansk Sproghistorie: dialogiske partikler"],
      masteryTags: ["modal-particle-stance"],
      pressure: "Sofia wants to calm you down. Emil wants you to escalate. Their particles do half the work.",
      narrative: "You paste the landlord email into the group chat. Four replies arrive. None of them are neutral, even when they pretend to be.",
      dialogue: [
        { speaker: "Sofia", line: "Ej, det er da helt fint. Han svarer jo." },
        { speaker: "Emil", line: "Det er sgu ikke godt nok. Skriv igen." }
      ],
      notice: "Jo, da, sgu, nok, bare are not filler. They position the speaker socially.",
      targetPhrases: ["det er da helt fint", "han svarer jo", "det er sgu ikke godt nok", "det løser sig nok"],
      prompt: "Match each line to the stance it carries.",
      pairs: [
        { id: "soften", left: "Ej, det er da helt fint. Han svarer jo.", right: "de-escalating; expects agreement", feedback: "Da lowers the temperature; jo treats the reply as something you should already accept." },
        { id: "escalate", left: "Det er sgu ikke godt nok. Skriv igen.", right: "supportive but escalatory", feedback: "Sgu adds emotional force. It supports your frustration, but it also pushes you toward escalation." },
        { id: "practical", left: "Det løser sig nok, men jeg ville bede om en dato.", right: "cautious and practical", feedback: "Nok softens the prediction; bede om en dato turns the emotion into a concrete next step." },
        { id: "suspicious", left: "Han prøver bare at trække tiden.", right: "suspicious and dismissive", feedback: "Bare reduces the landlord's explanation to a tactic. Useful in chat, risky in formal writing." }
      ],
      carry: "Carry-forward: particles become social variables, not vocabulary trivia; 'det løser sig nok' calms, while 'han prøver at trække tiden' escalates suspicion.",
      tags: ["B2", "modal-particles", "subtext", "informal-register"]
    },
    {
      id: "two-registers",
      type: "choice",
      eyebrow: "Scene 3 · To svar",
      title: "The same frustration needs two different Danish versions.",
      learningGoal: "Make a formal request concrete without importing private-chat aggression.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Dansk Sproghistorie: dialogiske partikler"],
      masteryTags: ["formal-register-control", "modal-particle-stance"],
      pressure: "You must answer the landlord and also text Emil. If you use one register for both, somebody will misunderstand you.",
      narrative: "Formal Danish should move the case forward without sounding like a threat. Chat Danish can carry emotion, but not destroy your judgement.",
      notice: "Register shift is not decoration. It changes which doors stay open.",
      targetPhrases: ["jeg vil gerne bede om", "en mere præcis dato", "temperaturen er faldet", "sgu alt for koldt"],
      prompt: "Choose the best formal sentence for the landlord.",
      options: [
        { id: "formal-clear", diagnostic: "concrete-civil-request", label: "Jeg vil gerne bede om en mere præcis dato, da temperaturen er faldet til under 12 grader.", detail: "clear formal request", correct: true, effects: { landlordTension: -1, workplaceTrust: 1 }, feedback: "Diagnostic: strong formal Danish. Bede om keeps the request civil; præcis dato and 12 grader make it actionable." },
        { id: "formal-aggressive", diagnostic: "imports-private-emphasis-into-formal-email", label: "Jeg kræver, at I fikser det nu, for det er sgu alt for koldt.", detail: "register clash", correct: false, effects: { landlordTension: 2, sofiaTrust: -1 }, feedback: "Diagnostic: the facts are usable, but kræver + nu + sgu moves the message from firm to hostile. Save sgu for private chat." },
        { id: "formal-passive", diagnostic: "over-softens-and-removes-pressure", label: "Det løser sig nok, men det ville være fint med varme på et tidspunkt.", detail: "too weak", correct: false, effects: { landlordTension: 0, workplaceTrust: -1 }, feedback: "Diagnostic: too much softening. Nok, ville være fint, and på et tidspunkt remove the date, actor, and pressure." }
      ],
      carry: "Carry-forward: being polite is not the same as being vague; a useful request asks for en mere præcis dato because temperaturen er faldet til under 12 grader.",
      tags: ["B2", "register", "complaint", "formal-writing"]
    },
    {
      id: "channel-transfer-lab",
      type: "flagship-chain",
      eyebrow: "Scene 4 · Kanalvalg",
      title: "The same complaint is not the same sentence in every channel.",
      learningGoal: "Transfer one complaint across private chat, formal email, workplace talk, and public profile contexts without losing agency or social fit.",
      sourceRefs: ["Lex: passiv", "Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["formal-register-control", "passive-agency", "consequence-aware-tone"],
      pressure: "You have one real intent: get a concrete repair date. But the next sentence could go into Slack, email, a coffee conversation, or LinkedIn. Same intent, different social cost.",
      narrative: "This is where plateau learners often sound technically correct and still wrong for the room. The sentence can be grammatical Danish and still damage the case.",
      dialogue: [
        { speaker: "Emil", line: "Skriv nu bare, at det er sgu ikke godt nok." },
        { speaker: "Sofia", line: "Du kan godt være tydelig uden at lyde vred." }
      ],
      notice: "A near miss is not a grammar failure. It is a channel failure: private force, passive softness, or public oversharing in the wrong place.",
      targetPhrases: ["konkret dato", "hvornår håndværkeren kommer", "det er sgu ikke godt nok", "varme på et tidspunkt"],
      prompt: "Choose the sentence that belongs in the formal landlord email, then prove why.",
      intent: "Ask for a concrete repair date without escalating tone.",
      archetypes: [
        "consequence-exercise",
        "near-miss",
        "repair-ladder",
        "same-intent-different-channel",
        "memory-backed-recurrence",
        "explain-your-choice"
      ],
      memoryCue: {
        signal: "passive-agency",
        copy: "Memory-backed recurrence: you have already seen passive agency in the landlord's wording. Now avoid creating the same vagueness in your own reply."
      },
      channelVersions: [
        { id: "slack", label: "Slack to a friend", sample: "Det er sgu ikke godt nok.", risk: "Useful for emotion; risky if pasted into formal email." },
        { id: "email", label: "Landlord email", sample: "Jeg vil gerne bede om en konkret dato for, hvornår håndværkeren kommer.", risk: "Best channel for actor, date, and actionable pressure." },
        { id: "meeting", label: "Workplace coffee", sample: "Der har været lidt bøvl med varmen, men jeg har bedt om en dato.", risk: "Enough truth for the room without turning work into the case." },
        { id: "linkedin", label: "Public profile", sample: "Jeg håndterer praktiske sager roligt og konkret.", risk: "Public channel needs capability, not private complaint detail." }
      ],
      options: [
        {
          id: "email-clear-agency",
          channel: "Landlord email",
          diagnostic: "chooses-channel-fit-with-agency",
          label: "Tak for svar. Jeg vil gerne bede om en konkret dato for, hvornår håndværkeren kommer.",
          detail: "formal, concrete, still calm",
          correct: true,
          grammarStatus: "grammatical",
          pragmaticStatus: "workplace-ready",
          consequence: "The landlord sees a civil request with actor and date pressure. You have not imported private anger, but you have removed passive fog.",
          effects: { landlordTension: -1 },
          feedback: "Diagnostic: strong channel transfer. You kept the useful pressure — konkret dato and håndværkeren — while staying inside formal Danish.",
          repairLadder: [
            { stage: "raw intent", text: "Fix the heat. I need a date." },
            { stage: "safer Danish", text: "Jeg vil gerne bede om en dato." },
            { stage: "workplace-ready Danish", text: "Jeg vil gerne bede om en konkret dato for, hvornår håndværkeren kommer." }
          ],
          reasonPrompt: "Why does this work as the email version?",
          reasonOptions: [
            { id: "actor-date-channel", label: "It keeps actor/date pressure visible while matching the formal channel.", correct: true },
            { id: "soft-because-long", label: "It works mainly because the sentence is longer and sounds more official.", correct: false },
            { id: "harder-is-clearer", label: "It works because it is the hardest possible version of the complaint.", correct: false }
          ]
        },
        {
          id: "email-private-force",
          channel: "Landlord email",
          diagnostic: "imports-private-force-into-formal-channel",
          label: "Det er sgu ikke godt nok. I må fikse det nu.",
          detail: "grammatical but socially expensive",
          correct: false,
          nearMiss: true,
          grammarStatus: "grammatical",
          pragmaticStatus: "too sharp for formal email",
          consequence: "The fact is legitimate, but the channel cost rises: sgu and nu make the email easier to dismiss as anger instead of evidence.",
          effects: { landlordTension: 2, sofiaTrust: -1 },
          feedback: "Diagnostic: near miss. The Danish is understandable, but private-chat force leaks into the formal channel and raises conflict before it adds evidence.",
          repairLadder: [
            { stage: "raw phrase", text: "Det er sgu ikke godt nok." },
            { stage: "safer Danish", text: "Det er ikke holdbart uden varme." },
            { stage: "workplace-ready Danish", text: "Jeg vil gerne bede om en konkret dato for, hvornår håndværkeren kommer." }
          ]
        },
        {
          id: "email-soft-near-miss",
          channel: "Landlord email",
          diagnostic: "softens-until-agency-disappears",
          label: "Det løser sig nok, men det ville være fint med varme på et tidspunkt.",
          detail: "grammatical but too passive",
          correct: false,
          nearMiss: true,
          grammarStatus: "grammatical",
          pragmaticStatus: "too vague for action",
          consequence: "The relationship stays smooth, but the repair stays foggy. There is no actor, no date, and no pressure for the case to move.",
          effects: { workplaceTrust: -1 },
          feedback: "Diagnostic: near miss. This sounds polite, but it recreates the passive-agency problem: no actor, no date, no deadline.",
          repairLadder: [
            { stage: "raw phrase", text: "Det løser sig nok." },
            { stage: "safer Danish", text: "Jeg vil gerne følge op på varmen." },
            { stage: "workplace-ready Danish", text: "Jeg vil gerne bede om en konkret dato for, hvornår håndværkeren kommer." }
          ]
        }
      ],
      carry: "Carry-forward: a valuable B2 answer survives channel transfer. In email, 'Tak for svar' can open calmly before the concrete request; 'uden at lyde vred' is the social target. Keep intent, name the missing actor/date, and change tone for email, chat, meeting, or public profile instead of treating grammar as the whole problem.",
      tags: ["B2", "register-transfer", "near-miss", "social-consequence", "repair-ladder"]
    },
    {
      id: "workplace-understatement",
      type: "completion",
      eyebrow: "Scene 5 · Arbejdspladsen",
      title: "Honesty is not the same sentence in every room.",
      learningGoal: "Use understatement without losing agency when discussing a private problem at work.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["understatement-with-agency"],
      pressure: "Your supervisor Mette is friendly, but not your close friend. She asks about the apartment while making coffee.",
      narrative: "You can be honest, but you also need to sound like someone who can handle a problem without turning every room into a courtroom.",
      dialogue: [
        { speaker: "Mette", line: "Hvordan går det med lejligheden? Har du fået varme?" }
      ],
      notice: "Danish understatement can be socially intelligent, but passivity can hide inside it.",
      targetPhrases: ["det går fint nok", "lidt bøvl med varmen", "jeg har bedt udlejeren", "en konkret dato"],
      prompt: "Complete a balanced B2 answer. Include one agency word and one concrete next step.",
      prefix: "Det går fint nok. Der har været lidt bøvl med varmen, men",
      placeholder: "jeg har bedt udlejeren om en konkret dato",
      acceptKeywordGroups: [
        { name: "agency word", keywords: ["bedt", "skrevet", "ringet", "kontaktet", "aftalt"] },
        { name: "concrete next step", keywords: ["dato", "tid", "håndværker", "udlejer", "varme"] }
      ],
      success: "Good. Fint nok and lidt bøvl soften the social surface, while an agency word plus a concrete next step keeps control of the situation.",
      failure: "Your answer needs both sides of the B2 move: an agency word (bedt/skrevet/ringet/kontaktet) and a concrete next step (dato/tid/håndværker/udlejer/varme).",
      effects: { workplaceTrust: 1 },
      carry: "Carry-forward: tone is not honesty versus lying. When Mette asks 'Hvordan går det med lejligheden? Har du fået varme?', 'lidt bøvl med varmen' gives the useful amount of truth for the room.",
      tags: ["B2", "understatement", "workplace-register", "agency"]
    },
    {
      id: "epilogue-consequence",
      type: "choice",
      eyebrow: "Final · Konsekvens",
      title: "The radiator is fixed. The relationships remember the wording.",
      learningGoal: "Name the B2 principle: clarity and relationship control can coexist.",
      sourceRefs: ["Lex: passiv", "Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["consequence-aware-tone"],
      pressure: "A week later, the case is closed. But language did not only repair a radiator. It changed how people read you.",
      narrative: "The best outcome is not always the one where you were maximally right. B2 means seeing the price of tone.",
      notice: "A complaint has two goals: solve the problem and preserve enough relationship to live with the solution.",
      targetPhrases: ["være tydelig", "uden at lyde aggressiv", "undgå konflikt", "vente"],
      prompt: "Which sentence best summarises the lesson?",
      options: [
        { id: "balanced", diagnostic: "states-core-b2-register-principle", label: "Man kan godt være tydelig uden at lyde aggressiv.", detail: "balanced B2 takeaway", correct: true, feedback: "Diagnostic: yes. The lesson's pattern is clarity plus relationship control: actor, date, and tone all stay visible." },
        { id: "always-hard", diagnostic: "confuses-force-with-effectiveness", label: "Man skal altid skrive så hårdt som muligt.", detail: "overcorrection", correct: false, feedback: "Diagnostic: overcorrection. Hard language can solve one case while making every future exchange colder." },
        { id: "always-soft", diagnostic: "confuses-politeness-with-passivity", label: "Man skal helst undgå konflikt og vente.", detail: "passive", correct: false, feedback: "Diagnostic: passivity is also a cost. If you remove all pressure, you may preserve politeness while losing time, heat, and respect." }
      ],
      carry: "Unlocked B2 theme: Danish as social operating system — not only grammar, but consequence: be tydelig uden at lyde aggressiv.",
      tags: ["B2", "reflection", "argumentation", "social-consequence"]
    }
  ],
  endingLogic: {
    diplomatic: { maxLandlordTension: 0, minWorkplaceTrust: 1 },
    aggressive: { minLandlordTension: 2 },
    passive: {}
  },
  endings: [
    {
      id: "diplomatic",
      title: "Diplomatic resolution",
      narrative: "The radiator was fixed by Thursday. The landlord sent a short apology — not warm, but correct. Sofia still trusts your judgement, and at work Mette sees someone who handles problems without creating drama. You kept the heat on without burning any bridges.",
      danish: "Du fik varme uden at brænde broer.",
      carry: "B2 unlocked: being clear and being liked are not opposites — tone is the bridge."
    },
    {
      id: "aggressive",
      title: "Escalated resolution",
      narrative: "The radiator was fixed by Wednesday. But the landlord's reply was cold and formal, and Sofia has been quieter in the group chat since your sharp reply. You won the argument — the question is whether you won the relationships.",
      danish: "Du fik varme, men mistede varmen hos andre.",
      carry: "B2 unlocked: the sharpest sentence sometimes wins the case and loses the room."
    },
    {
      id: "passive",
      title: "Delayed resolution",
      narrative: "The radiator was fixed — eventually. You waited an extra week because your replies were too soft. At work, Mette assumed you were handling it, but privately you felt you had apologised for needing heat. Being polite is not a mistake — but being too polite can cost real time.",
      danish: "Du fik varme til sidst, men du betalte med tålmodighed.",
      carry: "B2 unlocked: politeness without clarity is a form of invisible waiting."
    }
  ]
};

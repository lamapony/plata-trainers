window.PLATA_LESSON_B2_RADIATOR = {
  id: "lesson-b2-radiator-register",
  contentVersion: 2,
  level: "B2",
  title: "Get a concrete repair date",
  subtitle: "Read a vague landlord reply, follow up with facts, and confirm the appointment across email and phone.",
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
        assetReady: true,
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
        alt: "The tenant calls the property manager with the case details ready.",
        prompt: "A single comic panel showing a tenant calling a property manager about a repair. The learner speaks calmly with notes and the case number visible as abstract marks. Show practical follow-through through body language. No readable text, no speech bubbles, no brand marks.",
        sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["understatement-with-agency"],
        mustInclude: ["phone call", "case notes", "calm practical request"],
        avoid: ["melodrama", "readable labels", "angry confrontation"]
      },
      {
        id: "channel-transfer-lab",
        sceneId: "channel-transfer-lab",
        assetPath: "./assets/comic/channel-transfer-lab.png",
        alt: "The tenant carries the same repair facts from the landlord email into a phone call and confirmation message.",
        prompt: "A single comic panel showing the tenant at a small desk with three connected communication steps: a formal landlord email, a phone call to the property manager, and a short appointment confirmation. The same case details move cleanly across each step. Show careful continuity, not notification overload. No readable text, logos, or speech bubbles.",
        sourceRefs: ["Lex: passiv", "Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["formal-register-control", "passive-agency", "consequence-aware-tone"],
        mustInclude: ["email", "phone call", "appointment confirmation"],
        avoid: ["readable messages", "generic app logos", "chaotic notification storm"]
      },
      {
        id: "epilogue-consequence",
        sceneId: "epilogue-consequence",
        assetPath: "./assets/comic/epilogue-consequence.png",
        alt: "The tenant has a confirmed repair visit with a clear time window and call-ahead note.",
        prompt: "A single comic panel in a Copenhagen apartment after a repair visit has been scheduled. The tenant checks a calm appointment card beside the still-cold radiator; an abstract time window and phone-call cue show that the craftsperson will call before arriving. The mood is relieved but realistic: the visit is confirmed, the repair is not yet complete. No readable text, logos, or speech bubbles.",
        sourceRefs: ["Lex: passiv", "Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
        masteryTags: ["consequence-aware-tone"],
        mustInclude: ["cold radiator", "confirmed visit", "call-ahead cue"],
        avoid: ["victory pose", "readable text", "corporate stock art"]
      }
    ]
  },
  masteryMap: {
    "passive-agency": {
      competencyId: "agency",
      label: "Read what was actually promised",
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
        action: "Rerun the two-reply scene and ask for a precise date without copying sgu or other forceful words from the private chat."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Dansk Sproghistorie: dialogiske partikler"]
    },
    "understatement-with-agency": {
      competencyId: "agency",
      label: "Ask for the appointment by phone",
      evidence: "The learner opens a phone call with the case status and the repair appointment they want to arrange.",
      remediation: {
        sceneId: "workplace-understatement",
        cta: "Repair the phone opening",
        action: "Rerun the phone completion and include both halves: the missing date and the appointment you want to arrange."
      },
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"]
    },
    "consequence-aware-tone": {
      competencyId: "consequence-awareness",
      label: "Confirm the visit clearly",
      evidence: "The learner confirms the agreed time window and asks for the one practical detail that is still missing.",
      remediation: {
        sceneId: "epilogue-consequence",
        cta: "Review the confirmation",
        action: "Rerun the final choice and repeat the time window before asking the craftsperson to call ahead."
      },
      sourceRefs: ["Lex: passiv", "Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"]
    }
  },
  simulation: {
    expectedEndingId: "diplomatic",
    completionAnswers: {
      "workplace-understatement": {
        reject: ["varme", "jeg har bedt"],
        accept: "jeg har stadig ingen dato; kan vi aftale en tid med en håndværker"
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
          { sceneId: "workplace-understatement", answer: "jeg har stadig ingen dato; kan vi aftale en tid med en håndværker", expectCorrect: true },
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
          { sceneId: "workplace-understatement", answer: "jeg har stadig ingen dato; kan vi aftale en tid med en håndværker", expectCorrect: true },
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
  variableLabels: {
    landlordTension: "Landlord tension",
    sofiaTrust: "Sofia's confidence",
    emilEscalation: "Pressure to escalate",
    workplaceTrust: "Follow-through"
  },
  variableDescriptions: {
    landlordTension: ["low — the exchange stayed factual", "neutral — no extra friction", "high — the tone became part of the problem"],
    sofiaTrust: ["shaken — the calm advice was lost", "unchanged", "strong — the practical advice stayed useful"],
    emilEscalation: ["low — frustration did not take over", "neutral", "high — anger replaced the date request"],
    workplaceTrust: ["weak — the next step stayed vague", "neutral — the request was partly clear", "strong — the appointment became easy to arrange"]
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
      eyebrow: "Scene 1 · The third reply",
      title: "Separate a registered case from a booked repair.",
      learningGoal: "Distinguish a registered case from an actual repair commitment in formal passive Danish.",
      sourceRefs: ["Lex: passiv", "sproget.dk: grammatiske betegnelser"],
      masteryTags: ["passive-agency"],
      pressure: "Your bedroom radiator has been cold for five days. This is the third reply, but you still have no appointment.",
      narrative: "Read only what the message commits to. The case is registered; a repair is mentioned; no date or named contact appears.",
      dialogue: [
        { speaker: "Udlejer", line: "Der er blevet noteret en reklamation vedrørende radiatoren." },
        { speaker: "Udlejer", line: "Der vil blive sendt en håndværker, når det passer ind i planlægningen." }
      ],
      notice: "The passive wording leaves out who will book the visit and when. It is vague, but it is not a refusal.",
      targetPhrases: ["Der er blevet noteret", "reklamation vedrørende radiatoren", "der vil blive sendt en håndværker", "ikke aftalt en dato"],
      prompt: "What does the reply actually promise?",
      options: [
        { id: "too-trusting", diagnostic: "overreads-passive-as-promise", label: "De har booket en håndværker, som snart kommer.", detail: "adds an appointment that is not in the text", correct: false, effects: { landlordTension: 0 }, feedback: "The message mentions a future visit, but it gives neither a booking nor a date." },
        { id: "accurate", diagnostic: "separates-registration-from-commitment", label: "De har registreret sagen, men de har ikke aftalt en dato endnu.", detail: "matches the exact commitment", correct: true, effects: { landlordTension: 0, workplaceTrust: 1 }, feedback: "Correct. The case exists in the system, but the practical appointment is still missing." },
        { id: "too-aggressive", diagnostic: "adds-refusal-not-in-text", label: "De har besluttet, at radiatoren ikke skal repareres.", detail: "turns vagueness into a refusal", correct: false, effects: { landlordTension: 1 }, feedback: "The message is vague, but it does not refuse the repair. Ask for the missing date without adding that accusation." }
      ],
      carry: "Before replying, list the missing facts: who contacts you, which day, and what time window.",
      tags: ["B2", "passive", "official-register", "housing"]
    },
    {
      id: "group-chat-particles",
      type: "match",
      eyebrow: "Scene 2 · Group chat",
      title: "Hear what the small words do to the advice.",
      learningGoal: "Identify social stance from Danish particles before reacting to advice.",
      sourceRefs: ["Dansk Sproghistorie: dialogiske partikler"],
      masteryTags: ["modal-particle-stance"],
      pressure: "You paste the reply into a group chat. Your friends agree on the facts but frame them very differently.",
      narrative: "Particles such as da, jo, sgu, and nok tell you how strongly the speaker expects you to agree.",
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
      carry: "Keep the practical advice — bed om en dato — even if you leave the chat's emotional particles out of the landlord email.",
      tags: ["B2", "modal-particles", "subtext", "informal-register"]
    },
    {
      id: "two-registers",
      type: "choice",
      eyebrow: "Scene 3 · Two replies",
      title: "Turn the frustration into a factual follow-up.",
      learningGoal: "Make a formal request concrete without importing private-chat aggression.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning", "Dansk Sproghistorie: dialogiske partikler"],
      masteryTags: ["formal-register-control", "modal-particle-stance"],
      pressure: "You are replying to the landlord. The useful facts are that the radiator is still cold, you first reported it on Monday, and no appointment has been booked.",
      narrative: "A strong follow-up names the history and asks for a concrete date. It does not need a temperature claim you cannot document.",
      notice: "Keep the observable facts and one answerable request.",
      targetPhrases: ["radiatoren stadig er kold", "anmeldte fejlen i mandags", "konkret dato"],
      prompt: "Choose the best formal sentence for the landlord.",
      options: [
        { id: "formal-clear", diagnostic: "concrete-civil-request", label: "Radiatoren er stadig kold, og jeg anmeldte fejlen i mandags. Kan I oplyse en konkret dato for besøget?", detail: "history + current state + request", correct: true, effects: { landlordTension: -1, workplaceTrust: 1 }, feedback: "This gives the landlord the timeline and one precise question to answer." },
        { id: "formal-aggressive", diagnostic: "imports-private-emphasis-into-formal-email", label: "Det er sgu ikke godt nok. I må sende nogen med det samme.", detail: "understandable frustration, no case history", correct: false, effects: { landlordTension: 2, sofiaTrust: -1 }, feedback: "The urgency is clear, but the date of your report and the requested appointment are missing. Sgu also imports private-chat force into the email." },
        { id: "formal-passive", diagnostic: "over-softens-and-removes-pressure", label: "Jeg håber, at der snart kommer nogen og ser på det.", detail: "polite hope, no direct question", correct: false, effects: { landlordTension: 0, workplaceTrust: -1 }, feedback: "This leaves the next step with nobody in particular. Ask directly for the date of the visit." }
      ],
      carry: "Reliable follow-up: current problem + date first reported + one request for the appointment date.",
      tags: ["B2", "register", "complaint", "formal-writing"]
    },
    {
      id: "channel-transfer-lab",
      type: "flagship-chain",
      eyebrow: "Scene 4 · Choose the channel",
      title: "Keep the same request when the channel changes.",
      learningGoal: "Move the repair follow-up across email, phone, SMS, and private chat without losing the date request.",
      sourceRefs: ["Lex: passiv", "Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["formal-register-control", "passive-agency", "consequence-aware-tone"],
      pressure: "You have one goal: get a concrete repair date. The wording changes between email and phone, but the missing appointment must stay visible.",
      narrative: "A sentence can be grammatical and still fail if it drops the case history, date request, or appropriate tone for the channel.",
      dialogue: [
        { speaker: "Emil", line: "Skriv nu bare, at det er sgu ikke godt nok." },
        { speaker: "Sofia", line: "Du kan godt være tydelig uden at lyde vred." }
      ],
      notice: "Keep the practical core in every version: the radiator is still cold, the case is already reported, and you need a date.",
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
        copy: "The landlord's message had no date. Make sure your own reply asks for one directly."
      },
      channelVersions: [
        { id: "slack", label: "Private chat", sample: "Det er sgu frustrerende — jeg skriver igen og beder om en dato.", risk: "Emotion is fine here, but the formal request still needs different wording." },
        { id: "email", label: "Landlord email", sample: "Kan I oplyse en konkret dato for, hvornår håndværkeren kommer?", risk: "Best place to keep the case history and request in writing." },
        { id: "meeting", label: "Phone call", sample: "Jeg ringer om radiatoren. Kan vi aftale en tid med håndværkeren?", risk: "The opening must identify the case before the appointment question." },
        { id: "linkedin", label: "Appointment SMS", sample: "Tak. Torsdag mellem 9 og 12 passer mig. Bekræft gerne adressen.", risk: "A short confirmation needs the agreed day and time window." }
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
          pragmaticStatus: "email-ready",
          consequence: "The landlord sees one civil, answerable question about the missing appointment.",
          effects: { landlordTension: -1 },
          feedback: "This fits the email: the request is concrete, calm, and easy to answer in writing.",
          repairLadder: [
            { stage: "raw intent", text: "Fix the heat. I need a date." },
            { stage: "safer Danish", text: "Jeg vil gerne bede om en dato." },
            { stage: "email-ready Danish", text: "Jeg vil gerne bede om en konkret dato for, hvornår håndværkeren kommer." }
          ],
          reasonPrompt: "Why does this work as the email version?",
          reasonOptions: [
            { id: "actor-date-channel", label: "It clearly asks for a date and fits a formal landlord email.", correct: true },
            { id: "soft-because-long", label: "It works mainly because the sentence is longer and sounds more official.", correct: false },
            { id: "harder-is-clearer", label: "It works because it is the hardest possible version of the complaint.", correct: false }
          ]
        },
        {
          id: "email-private-force",
          channel: "Landlord email",
          diagnostic: "imports-private-force-into-formal-channel",
          label: "Det er sgu ikke godt nok. I må fikse det nu.",
          detail: "grammatical but too sharp for a formal email",
          correct: false,
          nearMiss: true,
          grammarStatus: "grammatical",
          pragmaticStatus: "too sharp for formal email",
          consequence: "The frustration is legitimate, but sgu and nu make the anger more prominent than the missing appointment.",
          effects: { landlordTension: 2, sofiaTrust: -1 },
          feedback: "Near miss. The Danish is understandable, but private-chat force raises the conflict without adding the missing case history or date request.",
          repairLadder: [
            { stage: "raw phrase", text: "Det er sgu ikke godt nok." },
            { stage: "safer Danish", text: "Det er ikke holdbart uden varme." },
            { stage: "email-ready Danish", text: "Jeg vil gerne bede om en konkret dato for, hvornår håndværkeren kommer." }
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
          consequence: "The email stays polite, but the landlord is not asked to provide any specific information.",
          effects: { workplaceTrust: -1 },
          feedback: "Near miss. This sounds polite, but it repeats the original problem: no person, date, or appointment.",
          repairLadder: [
            { stage: "raw phrase", text: "Det løser sig nok." },
            { stage: "safer Danish", text: "Jeg vil gerne følge op på varmen." },
            { stage: "email-ready Danish", text: "Jeg vil gerne bede om en konkret dato for, hvornår håndværkeren kommer." }
          ]
        }
      ],
      carry: "Change the length and opening for the channel, but keep the request for a concrete repair date.",
      tags: ["B2", "register-transfer", "near-miss", "social-consequence", "repair-ladder"]
    },
    {
      id: "workplace-understatement",
      type: "completion",
      eyebrow: "Scene 5 · Call the property manager",
      title: "Open the call with the case and the missing outcome.",
      learningGoal: "Ask for a repair appointment by phone after repeated vague email replies.",
      sourceRefs: ["borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["understatement-with-agency"],
      pressure: "The email thread still has no date, so you call the property manager. You have the case number in front of you.",
      narrative: "The listener needs to know why you are calling and what concrete result you want from the call.",
      dialogue: [
        { speaker: "Property manager", line: "Ejendomskontoret, det er Mette." }
      ],
      notice: "Jeg ringer om … identifies the case. Jeg har stadig ingen dato explains why email was not enough.",
      targetPhrases: ["jeg ringer om radiatoren", "stadig ingen dato", "aftale en tid"],
      prompt: "Complete the opening with the missing date and the appointment you want.",
      prefix: "Hej, jeg ringer om radiatoren. Sagen blev registreret i mandags, men",
      placeholder: "jeg har stadig ingen dato. Kan vi aftale en tid med en håndværker?",
      acceptKeywordGroups: [
        { name: "missing appointment", keywords: ["dato", "tid", "aftale"] },
        { name: "repair visit", keywords: ["håndværker", "besøg", "kommer", "komme"] }
      ],
      success: "Good. Mette can hear both why you called and what she needs to arrange.",
      failure: "Include both the missing date/time and the repair visit or håndværker you want to arrange.",
      effects: { workplaceTrust: 1 },
      carry: "Phone frame: Jeg ringer om … + current status + Kan vi aftale …?",
      tags: ["B2", "understatement", "workplace-register", "agency"]
    },
    {
      id: "epilogue-consequence",
      type: "choice",
      eyebrow: "Final · Confirm the visit",
      title: "Turn a time window into a confirmed appointment.",
      learningGoal: "Confirm the day and time window and ask for one practical detail.",
      sourceRefs: ["Lex: passiv", "Dansk Sproghistorie: dialogiske partikler", "borger.dk/lifeindenmark.dk skrivevejledning"],
      masteryTags: ["consequence-aware-tone"],
      pressure: "Mette offers Thursday between 9 and 12. You can be home, but you need the craftsperson to call before arriving.",
      narrative: "A complete confirmation repeats the agreed window and adds the one practical request that is still missing.",
      notice: "Tak + the exact window + Kan I bekræfte …? creates a record both sides can use.",
      targetPhrases: ["torsdag mellem 9 og 12", "passer mig", "ringe før besøget"],
      prompt: "Which reply confirms the appointment most clearly?",
      options: [
        { id: "balanced", diagnostic: "states-core-b2-register-principle", label: "Tak. Torsdag mellem 9 og 12 passer mig. Kan I bekræfte, at håndværkeren ringer før besøget?", detail: "window + availability + practical confirmation", correct: true, feedback: "This confirms the appointment and asks one clear logistical question." },
        { id: "always-hard", diagnostic: "confuses-force-with-effectiveness", label: "Torsdag er sent, men jeg accepterer det. Håndværkeren skal ringe først.", detail: "the information is present, but the confirmation starts a new dispute", correct: false, feedback: "The practical request is understandable, but the opening adds conflict after an appointment has finally been offered." },
        { id: "always-soft", diagnostic: "confuses-politeness-with-passivity", label: "Tak, så håber jeg, at nogen kommer på torsdag.", detail: "does not confirm the time window or call request", correct: false, feedback: "This sounds friendly, but it drops both 9–12 and the request to call before arrival." }
      ],
      carry: "You now have the full escalation ladder: read the promise → reply with facts → call for a date → confirm the visit.",
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
      title: "The visit is confirmed",
      narrative: "The property manager confirms Thursday between 9 and 12 and notes that the craftsperson will call first.",
      danish: "Aftalen er bekræftet til torsdag mellem klokken 9 og 12.",
      carry: "Keep the email and appointment confirmation together until the repair is complete."
    },
    {
      id: "aggressive",
      title: "The problem is urgent, but the appointment is still unclear",
      narrative: "The property manager responds to the tone of the complaint, while the exact day and time remain buried in the exchange.",
      danish: "Vi vender tilbage vedrørende planlægningen.",
      carry: "Return to one practical question: Hvilken dato og hvilket tidsrum kan håndværkeren komme?"
    },
    {
      id: "passive",
      title: "The case is open, but nobody has booked the visit",
      narrative: "The landlord continues to acknowledge the problem without giving a date or time window.",
      danish: "Sagen er registreret, og vi vender tilbage.",
      carry: "Call with the case history and ask directly: Kan vi aftale en tid med en håndværker?"
    }
  ]
};

/* platå · register-drill · data v0.1
 *
 * B2 public-service register repair after narrative misses.
 * Pairs with lesson-b2-radiator-register (passive official replies).
 * Source notes: radiator gold lesson, audit-lesson-exercises editorial rules.
 *
 * Categories: passive, deadline, escalation, channel, blandet
 */

window.PLATA_DATA = {
  register: [
    { cat: "passive", weakTags: ["passive-agency", "formal-register-control"],
      prompt: "Du svarer på en passiv besked fra udlejeren om radiatoren. Vælg den professionelle opfølgning med tydelig aktør og dato:",
      options: [
        "Vores tekniker kontakter Dem senest fredag med en konkret tid.",
        "Der gives besked om, at radiatoren repareres hurtigst muligt.",
        "Radiatoren bliver set på, når det kan lade sig gøre.",
        "Man vender tilbage, så snart der er nyt."
      ],
      correct: 0,
      why: "Navngiv aktøren (tekniker) og en konkret tidsramme. De tre andre skjuler ansvar bag passiv eller ubestemt 'man'." },

    { cat: "passive", weakTags: ["passive-agency"],
      prompt: "Vælg den mest professionelle formulering til Borgerservice:",
      options: [
        "Jeg beder om en skriftlig bekræftelse af, hvem der behandler min sag, og hvornår jeg kan forvente svar.",
        "Der bliver set på sagen, og jeg får svar senere.",
        "Kan I ikke bare fikse det hurtigt?",
        "Jeg håber, at der snart sker noget."
      ],
      correct: 0,
      why: "Offentlig dansk kræver stadig agency: du beder om aktør + tidsramme uden at presse for meget." },

    { cat: "passive", weakTags: ["passive-agency", "formal-register-control"],
      prompt: "Udlejeren skriver: «Sagen er noteret.» Vælg et høfligt svar, der holder register uden at acceptere passivitet:",
      options: [
        "Tak for noteringen. Hvem er ansvarlig for opfølgning, og hvilken dato kan jeg forvente et udkald?",
        "Okay, så venter jeg bare.",
        "Det er ikke godt nok — I må komme i dag.",
        "Jeg går ud fra, at det ordner sig af sig selv."
      ],
      correct: 0,
      why: "Tak + præcis opfølgning bevarer formalitet og agency. Trusler eller passiv accept ødelægger register-træningen." },

    { cat: "passive", weakTags: ["formal-register-control", "consequence-aware-tone"],
      prompt: "Vælg den sætning, der lyder mest passende i en formel e-mail til en boligforening:",
      options: [
        "Jeg skriver for at få bekræftet næste skridt i sagen om den kolde radiator i lejlighed 4B.",
        "Radiatoren virker stadig ikke, og det er virkelig koldt.",
        "Fix det nu — det er uacceptabelt.",
        "Hej, kan I hjælpe med noget varme?"
      ],
      correct: 0,
      why: "Formel kanal = præcis sag + neutral tone. Emotion eller slang bryder register-kontrakten." },

    { cat: "deadline", weakTags: ["consequence-aware-tone", "passive-agency"],
      prompt: "Du har fået et vagt løfte om reparation. Vælg en høflig deadline-anmodning:",
      options: [
        "Kan De bekræfte en dato senest mandag, så jeg kan planlægge alternativ opvarmning?",
        "I må komme i morgen, ellers klager jeg.",
        "Bare kom når I har tid.",
        "Jeg venter bare på, at nogen gør noget."
      ],
      correct: 0,
      why: "Deadline med begrundelse (alternativ opvarmning) er professionel. Trusel eller passiv venten mangler agency." },

    { cat: "deadline", weakTags: ["formal-register-control"],
      prompt: "Første svar fra myndigheden kom efter tre uger. Vælg en passende opfølgning:",
      options: [
        "Jeg følger op på min henvendelse af 3. maj og beder om en opdateret tidsplan for behandlingen.",
        "Hvorfor svarer I aldrig?",
        "Det er pinligt langsomt.",
        "Jeg går ud fra, at I stadig arbejder på det."
      ],
      correct: 0,
      why: "Dato + neutral opfølgning holder register. Klage-tone eller passiv accept træner ikke deadline-stance." },

    { cat: "deadline", weakTags: ["passive-agency", "understatement-with-agency"],
      prompt: "Vælg formuleringen med tydelig agency uden at lyde desperat:",
      options: [
        "Hvis jeg ikke hører fra Dem inden fredag, må jeg desværre kontakte Forbrugerombudsmanden.",
        "I er nødt til at hjælpe mig NU!!!",
        "Måske kunne der ske noget en dag.",
        "Det er ligegyldigt — jeg giver op."
      ],
      correct: 0,
      why: "Understatement med konsekvens: navngiv næste skridt og en dato. Panik eller passivitet undgår agency." },

    { cat: "deadline", weakTags: ["consequence-aware-tone"],
      prompt: "Du skal bekræfte et møde med Borgerservice. Vælg det bedste svar:",
      options: [
        "Jeg bekræfter tiden tirsdag kl. 10.30 og beder om navnet på den sagsbehandler, jeg møder.",
        "Super, vi ses.",
        "Kan vi ikke bare tage det på telefonen i stedet?",
        "Jeg kommer måske."
      ],
      correct: 0,
      why: "Bekræft tid + bed om aktør. Korthed uden detaljer efterlader dig passiv i den officielle proces." },

    { cat: "escalation", weakTags: ["understatement-with-agency", "formal-register-control"],
      prompt: "Anden henvendelse uden svar. Vælg en høflig eskalering:",
      options: [
        "Da jeg endnu ikke har modtaget svar på min henvendelse af 12. juni, beder jeg om en opdatering fra den ansvarlige sagsbehandler.",
        "Nu er jeg virkelig sur.",
        "I er de værste udlejere ever.",
        "Jeg siger ikke mere — I må finde ud af det."
      ],
      correct: 0,
      why: "Eskalering = gentag reference + bed om aktør. Emotion eller passiv boykot træner ikke professionel persistence." },

    { cat: "escalation", weakTags: ["understatement-with-agency"],
      prompt: "Vælg den formulering, der bløder tonen op uden at undvige:",
      options: [
        "Jeg forstår, at sagen kan tage tid, men jeg har brug for at vide, hvem der følger op, og hvornår.",
        "Det er fint — jeg gider ikke vente alligevel.",
        "Bare gør hvad I vil.",
        "I skal bare ordne det, punktum."
      ],
      correct: 0,
      why: "Understatement med agency: anerkend tempo, men kræv aktør og tid. Undvigelse eller hårdhed mangler den øvede balance." },

    { cat: "escalation", weakTags: ["consequence-aware-tone", "passive-agency"],
      prompt: "Du vil eskalere til administrator. Vælg den mest professionelle åbning:",
      options: [
        "Jeg kontakter Dem, fordi min henvendelse til drift den 4. juni ikke har givet et konkret svar om radiatorens reparation.",
        "Din kollega gør ingenting.",
        "Alle jeres svar er ligegyldige.",
        "Der sker ikke noget, så nu skriver jeg til chefen."
      ],
      correct: 0,
      why: "Eskalering med fakta og dato — ikke personangreb. Passiv frustration uden struktur svækker din position." },

    { cat: "escalation", weakTags: ["formal-register-control", "consequence-aware-tone"],
      prompt: "Afslut en formel eskalering med den bedste afslutning:",
      options: [
        "Jeg ser frem til Deres svar senest på fredag og takker på forhånd for opfølgningen.",
        "Hilsen, fix det.",
        "Mvh, whatever.",
        "Venlig hilsen — I ved hvad I skal."
      ],
      correct: 0,
      why: "Formel afslutning + deadline + tak bevarer register. Slack-tone i en officiel eskalering bryder kanalen." },

    { cat: "channel", weakTags: ["formal-register-control", "consequence-aware-tone"],
      prompt: "Samme intent: bed kollegaen om at flytte deadline. Vælg sætningen til en formel e-mail:",
      options: [
        "Jeg vil gerne bede om, at vi flytter leveringsdatoen til fredag, så jeg kan nå at gennemgå udkastet ordentligt.",
        "Det er sgu ikke okay — I må bare flytte det.",
        "Måske kunne vi finde en anden dato en dag.",
        "Det løser sig nok, men det ville være fint med en ny dato på et tidspunkt."
      ],
      correct: 0,
      why: "E-mail kanal = konkret anmodning uden chat-force. Sgu og passiv ubestemthed hører til andre kanaler." },

    { cat: "channel", weakTags: ["consequence-aware-tone", "formal-register-control"],
      prompt: "Du er uenig i Slack med en kollega om prioritering. Vælg det, der hører til kanalen:",
      options: [
        "Jeg er uenig i rækkefølgen — kan vi tage det i morgen og finde en dato, der holder for begge?",
        "Det er sgu ikke godt nok. I må fikse det nu.",
        "Kære alle, jeg er meget skuffet over jeres prioritering.",
        "Jeg går ud fra, at det ordner sig af sig selv."
      ],
      correct: 0,
      why: "Slack tillader kort uenighed + næste skridt. Formel eskalering eller passiv accept passer dårligt i tråden." },

    { cat: "channel", weakTags: ["understatement-with-agency", "consequence-aware-tone"],
      prompt: "Mette spørger ved kaffemaskinen, om projektet hænger. Vælg det afbalancerede svar:",
      options: [
        "Der har været lidt bøvl med tidsplanen, men jeg har bedt om en ny deadline fredag.",
        "Alt er kaos, og ledelsen gør ingenting.",
        "Det går fint — der er ingen problemer overhovedet.",
        "Jeg kan ikke snakke om det her."
      ],
      correct: 0,
      why: "Ansigt-til-ansigt: lidt bøvl + agency-word + konkret næste skridt. Drama eller total undvigelse skader tilliden." },

    { cat: "channel", weakTags: ["formal-register-control"],
      prompt: "Du skal IKKE kopiere Slack-teksten ind i e-mail til chefen. Vælg den rigtige e-mail-version:",
      options: [
        "Jeg vil gerne følge op på vores diskussion og bede om en afklaring af deadline senest onsdag.",
        "Det er sgu ikke godt nok — I må fikse det nu.",
        "Som jeg skrev i Slack: det er sgu ikke okay.",
        "Hej hej, kan vi ikke bare finde ud af det?"
      ],
      correct: 0,
      why: "Kanaltransfer: fjern sgu og privat vrede; behold intent (deadline) i formelt register." },

    { cat: "channel", weakTags: ["understatement-with-agency", "formal-register-control"],
      prompt: "Du er uenig i et møde, men vil ikke eskalere tonen. Vælg det professionelle indspark:",
      options: [
        "Jeg er ikke helt enig i rækkefølgen — kan vi finde en dato, der også holder for mit team?",
        "Det her er bare forkert, punktum.",
        "Det går fint nok, I bestemmer.",
        "Jeg siger ingenting og sender en vred e-mail bagefter."
      ],
      correct: 0,
      why: "Mødekanal: tydelig uenighed uden angreb + konkret næste skridt. Hårdhed eller passiv boykot ødelægger rummet." },

    { cat: "channel", weakTags: ["consequence-aware-tone"],
      prompt: "Vælg sætningen, der hører til LinkedIn — ikke til Slack-tråden om samme uenighed:",
      options: [
        "Jeg arbejder struktureret med deadlines og afstemmer forventninger tidligt i projekter.",
        "Min chef forstår ikke prioritering — det er pinligt.",
        "Det er sgu ikke godt nok, som vi planlægger.",
        "Jeg er virkelig sur på mit team i dag."
      ],
      correct: 0,
      why: "Offentlig kanal = kapabilitet og ro, ikke privat konflikt eller chat-slang." },

    { cat: "deadline", weakTags: ["consequence-aware-tone", "professional-email-agency"],
      prompt: "Du afslutter en opfølgningsmail efter et jobinterview. Vælg den bedste afslutning:",
      options: [
        "Jeg ser frem til at høre om næste skridt i processen og står naturligvis til rådighed, hvis I har brug for yderligere oplysninger.",
        "Jeg forventer svar senest fredag, da jeg har andre processer kørende.",
        "Hvis det passer jer, må I endelig vende tilbage, når det er muligt.",
        "Tak for alt — vi ses!"
      ],
      correct: 0,
      why: "Balanceret afslutning: proces + til rådighed uden ultimatum og uden at forsvinde bag 'må I endelig'." },

    { cat: "deadline", weakTags: ["consequence-aware-tone"],
      prompt: "Hvilken afslutning presser for hårdt på svar i en formel opfølgningsmail?",
      options: [
        "Jeg forventer svar senest fredag, da jeg har andre processer kørende.",
        "Jeg ser frem til at høre om næste skridt i processen.",
        "Jeg står naturligvis til rådighed, hvis I har brug for yderligere oplysninger.",
        "Tak for den gode dialog i torsdags."
      ],
      correct: 0,
      why: "Senest fredag + andre processer signalerer pres — ikke rolig procesbevidsthed." }
  ]
};

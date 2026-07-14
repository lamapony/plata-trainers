/* platå · ordstilling-drill · data v0.2
 *
 * Word order drill for Danish. V2 rule, inversion, ledsætninger.
 *
 * Format: category, prompt, 4 options, correct index, optional accepted[] for multiple
 * valid answers, and a Danish explanation.
 * Categories: v2 (subject first), inversion (adverbial first), ledsaetning
 * (conjunction → subject → sentence adverb → finite verb — not "verb at end").
 * When accepted is omitted, grading uses [correct].
 */

window.PLATA_DATA = {
  ordstilling: [
    // ---------- V2: subject first, verb in position 2 ----------
    { cat: "v2", prompt: "Vælg den sætning hvor subjektet står først (V2):",
      options: [
        "Hun læser en bog hver aften.",
        "Hun en bog læser hver aften.",
        "En bog læser hun hver aften.",
        "Hver aften hun læser en bog."
      ],
      correct: 0,
      why: "Subjekt 'hun' i pos. 1, verbum 'læser' i pos. 2 — V2. 'Hun en bog læser' har objekt mellem subjekt og verbum." },

    { cat: "v2", prompt: "Vælg den sætning hvor subjektet står først (V2):",
      options: [
        "Vi spiser aftensmad kl. 18.",
        "Kl. 18 spiser vi aftensmad.",
        "Kl. 18 vi spiser aftensmad.",
        "Aftensmad vi spiser kl. 18."
      ],
      correct: 0,
      why: "Subjekt 'vi' først, verbum 'spiser' i pos. 2." },

    { cat: "v2", prompt: "Vælg den sætning hvor subjektet står først (V2):",
      options: [
        "Drengen spiller fodbold i parken.",
        "I parken spiller drengen fodbold.",
        "I parken drengen spiller fodbold.",
        "Drengen fodbold spiller i parken."
      ],
      correct: 0,
      why: "Subjekt først, verbum i 2. position. 'I parken drengen spiller' er V2-brud." },

    { cat: "v2", prompt: "Vælg den sætning hvor subjektet står først (V2):",
      options: [
        "Læreren forklarer grammatik i timerne.",
        "I timerne læreren forklarer grammatik.",
        "I timerne forklarer læreren grammatik.",
        "Grammatik læreren forklarer i timerne."
      ],
      correct: 0,
      why: "Subjekt 'læreren' i pos. 1, verbum 'forklarer' i pos. 2." },

    { cat: "v2", prompt: "Vælg den sætning hvor subjektet står først (V2):",
      options: [
        "Barnet sover hele natten.",
        "Hele natten sover barnet.",
        "Hele natten barnet sover.",
        "Sover barnet hele natten?"
      ],
      correct: 0,
      why: "Subjekt først, verbum i pos. 2. (D er et spørgsmål med inversion, ikke V2-udsagn.)" },

    { cat: "v2", prompt: "Vælg den sætning hvor subjektet står først (V2):",
      options: [
        "De rejser til Norge i sommerferien.",
        "I sommerferien de rejser til Norge.",
        "I sommerferien rejser de til Norge.",
        "Til Norge de rejser i sommerferien."
      ],
      correct: 0,
      why: "Subjekt 'de' i pos. 1, verbum 'rejser' i pos. 2." },

    { cat: "v2", prompt: "Vælg den sætning hvor subjektet står først (V2):",
      options: [
        "Kvinden læser avisen hver morgen.",
        "Hver morgen kvinden læser avisen.",
        "Avisen læser kvinden hver morgen.",
        "Hver morgen læser kvinden avisen."
      ],
      correct: 0,
      why: "Subjekt først, verbum i pos. 2. C og D er gyldige (inversion), men svaret spørger efter subjekt-først." },

    { cat: "v2", prompt: "Vælg den sætning hvor subjektet står først (V2):",
      options: [
        "Jeg arbejder i København.",
        "I København jeg arbejder.",
        "I København arbejder jeg.",
        "Arbejder jeg i København?"
      ],
      correct: 0,
      why: "Subjekt 'jeg' først, verbum 'arbejder' i pos. 2. B er V2-brud." },

    { cat: "v2", prompt: "Vælg den sætning med korrekt V2-orden:",
      options: [
        "Hunden løber i parken hver dag.",
        "Hver dag hunden løber i parken.",
        "Hver dag løber hunden i parken.",
        "I parken løber hunden hver dag."
      ],
      correct: 0,
      why: "Subjekt 'hunden' først, verbum 'løber' i pos. 2. B er V2-brud (subjekt i pos. 2)." },

    { cat: "v2", prompt: "Vælg den sætning med korrekt V2-orden:",
      options: [
        "Pigen synger i kirken om søndagen.",
        "Om søndagen pigen synger i kirken.",
        "Om søndagen synger pigen i kirken.",
        "I kirken synger pigen om søndagen."
      ],
      correct: 0,
      why: "Subjekt 'pigen' først, verbum 'synger' i pos. 2." },

    { cat: "v2", prompt: "Vælg den sætning med korrekt V2-orden:",
      options: [
        "Han drikker kaffe om morgenen.",
        "Om morgenen han drikker kaffe.",
        "Kaffe drikker han om morgenen.",
        "Om morgenen drikker han kaffe."
      ],
      correct: 0,
      why: "Subjekt 'han' først, verbum 'drikker' i pos. 2." },

    { cat: "v2", prompt: "Vælg den sætning med korrekt V2-orden:",
      options: [
        "Familien spiser middag sammen.",
        "Sammen familien spiser middag.",
        "Sammen spiser familien middag.",
        "Middag spiser familien sammen."
      ],
      correct: 0,
      why: "Subjekt 'familien' først, verbum 'spiser' i pos. 2." },

    // ---------- Inversion: adverbial first, subject after verb ----------
    { cat: "inversion", prompt: "Vælg den sætning med inversion (adverbial først, subjekt efter verbet):",
      options: [
        "I går læste hun en bog.",
        "I går hun læste en bog.",
        "Hun læste i går en bog.",
        "Hun i går læste en bog."
      ],
      correct: 0,
      why: "Adverbial 'i går' i pos. 1 → inversion: verbum 'læste' i pos. 2, subjekt 'hun' i pos. 3. B er V2-brud." },

    { cat: "inversion", prompt: "Vælg den sætning med inversion:",
      options: [
        "I morgen kommer han hjem.",
        "I morgen han kommer hjem.",
        "Han kommer i morgen hjem.",
        "Han i morgen kommer hjem."
      ],
      correct: 0,
      why: "Adverbial 'i morgen' først → inversion. B er V2-brud." },

    { cat: "inversion", prompt: "Vælg den sætning med inversion:",
      options: [
        "Kl. 8 spiser vi morgenmad.",
        "Kl. 8 vi spiser morgenmad.",
        "Vi spiser kl. 8 morgenmad.",
        "Vi kl. 8 spiser morgenmad."
      ],
      correct: 0,
      why: "Tidsadverbial 'kl. 8' først → inversion. B er V2-brud." },

    { cat: "inversion", prompt: "Vælg den sætning med inversion:",
      options: [
        "I weekenden rejser de til Norge.",
        "I weekenden de rejser til Norge.",
        "De rejser i weekenden til Norge.",
        "De i weekenden rejser til Norge."
      ],
      correct: 0,
      why: "Adverbial 'i weekenden' først → inversion. B er V2-brud." },

    { cat: "inversion", prompt: "Vælg den sætning med inversion:",
      options: [
        "Hver morgen drikker hun kaffe.",
        "Hver morgen hun drikker kaffe.",
        "Hun drikker hver morgen kaffe.",
        "Hun hver morgen drikker kaffe."
      ],
      correct: 0,
      why: "Adverbial 'hver morgen' først → inversion. B er V2-brud." },

    { cat: "inversion", prompt: "Vælg den sætning med inversion:",
      options: [
        "På lørdag besøger vi venner.",
        "På lørdag vi besøger venner.",
        "Vi besøger på lørdag venner.",
        "Vi på lørdag besøger venner."
      ],
      correct: 0,
      why: "Adverbial 'på lørdag' først → inversion. B er V2-brud." },

    { cat: "inversion", prompt: "Vælg den sætning med inversion:",
      options: [
        "Om aftenen ser han nyheder.",
        "Om aftenen han ser nyheder.",
        "Han ser om aftenen nyheder.",
        "Han om aftenen ser nyheder."
      ],
      correct: 0,
      why: "Adverbial 'om aftenen' først → inversion. B er V2-brud." },

    { cat: "inversion", prompt: "Vælg den sætning med inversion:",
      options: [
        "I 2024 flyttede de til Aarhus.",
        "I 2024 de flyttede til Aarhus.",
        "De flyttede i 2024 til Aarhus.",
        "De i 2024 flyttede til Aarhus."
      ],
      correct: 0,
      why: "Tidsadverbial 'i 2024' først → inversion. B er V2-brud." },

    { cat: "inversion", prompt: "Vælg den sætning med inversion:",
      options: [
        "I januar begynder han på universitetet.",
        "I januar han begynder på universitetet.",
        "Han begynder i januar på universitetet.",
        "Han i januar begynder på universitetet."
      ],
      correct: 0,
      why: "Adverbial 'i januar' først → inversion. B er V2-brud." },

    { cat: "inversion", prompt: "Vælg den sætning med inversion:",
      options: [
        "Derfor rejser de hjem i morgen.",
        "Derfor de rejser hjem i morgen.",
        "De rejser derfor hjem i morgen.",
        "De derfor rejser hjem i morgen."
      ],
      correct: 0,
      why: "Kausal adverbial 'derfor' først → inversion. B er V2-brud." },

    { cat: "inversion", prompt: "Vælg den sætning med inversion:",
      options: [
        "Normalt spiser de frokost kl. 12.",
        "Normalt de spiser frokost kl. 12.",
        "De spiser normalt frokost kl. 12.",
        "De normalt spiser frokost kl. 12."
      ],
      correct: 0,
      why: "Frekvens-adverbial 'normalt' først → inversion. B er V2-brud." },

    { cat: "inversion", prompt: "Vælg den sætning med inversion:",
      options: [
        "Selvfølgelig forstår han dansk.",
        "Selvfølgelig han forstår dansk.",
        "Han forstår selvfølgelig dansk.",
        "Han selvfølgelig forstår dansk."
      ],
      correct: 0,
      why: "Modal-adverbial 'selvfølgelig' først → inversion. B er V2-brud." },

    // ---------- Ledsætninger: konjunktion → subjekt → sætningsadverbial → finit verbum ----------
    { cat: "ledsaetning", prompt: "Vælg den korrekte ledsætning (konjunktion → subjekt → finit verbum):",
      options: [
        "Jeg tror, at han kommer i morgen.",
        "Jeg tror, at i morgen han kommer.",
        "Jeg tror, han kommer i morgen.",
        "Jeg tror, kommer han i morgen."
      ],
      correct: 0,
      accepted: [0, 2],
      why: "I ledsætninger: konjunktion (evt. 'at') → subjekt → finit verbum. A og C er begge normale, fordi 'at' kan udelades efter 'tror'. B sætter tidsleddet før subjektet; D vender verbum og subjekt." },

    { cat: "ledsaetning", prompt: "Vælg den korrekte ledsætning (konjunktion → subjekt → finit verbum):",
      options: [
        "Hun siger, at hun er træt.",
        "Hun siger, hun er træt.",
        "Hun siger, at hun træt er.",
        "Hun siger, er hun træt."
      ],
      correct: 0,
      accepted: [0, 1],
      why: "Efter 'at'/udsagtsverbum: subjekt 'hun', så finit 'er', så prædikat. 'at' kan udelades (B). C sætter prædikat før finit verbum; D inverterer." },

    { cat: "ledsaetning", prompt: "Vælg den korrekte ledsætning (konjunktion → subjekt → finit verbum):",
      options: [
        "Vi ved, at de bor i Aarhus.",
        "Vi ved, de bor i Aarhus.",
        "Vi ved, at i Aarhus de bor.",
        "Vi ved, bor de i Aarhus."
      ],
      correct: 0,
      accepted: [0, 1],
      why: "A/B er standard, og 'at' kan udelades efter 'ved'. C sætter stedsleddet før subjektet; D inverterer (spørgsmålsorden)." },

    { cat: "ledsaetning", prompt: "Vælg den korrekte ledsætning (konjunktion → subjekt → finit verbum):",
      options: [
        "Han spørger, om jeg har tid i morgen.",
        "Han spørger, om jeg tid har i morgen.",
        "Han spørger, om i morgen jeg har tid.",
        "Han spørger, har jeg tid i morgen."
      ],
      correct: 0,
      why: "'Om' → subjekt 'jeg' → finit 'har'. B sætter objekt før verbet; C sætter tidsleddet før subjektet; D inverterer." },

    { cat: "ledsaetning", prompt: "Vælg den korrekte ledsætning (konjunktion → subjekt → finit verbum):",
      options: [
        "De siger, at de kommer i aften.",
        "De siger, de kommer i aften.",
        "De siger, at i aften de kommer.",
        "De siger, kommer de i aften."
      ],
      correct: 0,
      accepted: [0, 1],
      why: "A/B er standard, og 'at' kan udelades efter 'siger'. C sætter tidsleddet før subjektet; D inverterer." },

    { cat: "ledsaetning", prompt: "Vælg den korrekte ledsætning (konjunktion → subjekt → finit verbum):",
      options: [
        "Jeg håber, at vejret bliver godt i morgen.",
        "Jeg håber, vejret bliver godt i morgen.",
        "Jeg håber, at i morgen vejret bliver godt.",
        "Jeg håber, bliver vejret godt i morgen."
      ],
      correct: 0,
      accepted: [0, 1],
      why: "A/B er standard, og 'at' kan udelades efter 'håber'. C sætter tidsleddet før subjektet; D inverterer." },

    { cat: "ledsaetning", prompt: "Vælg den korrekte ledsætning med hv-ord (hv-ord → subjekt → finit verbum):",
      options: [
        "Mor spørger, hvornår vi kommer hjem.",
        "Mor spørger, vi kommer hjem hvornår.",
        "Mor spørger, hvornår kommer vi hjem.",
        "Mor spørger, kommer vi hjem hvornår."
      ],
      correct: 0,
      why: "Indlejret hv-spørgsmål: 'hvornår' → subjekt 'vi' → finit 'kommer'. C bruger spørgsmålsorden (V2) inde i ledsætningen." },

    { cat: "ledsaetning", prompt: "Vælg den korrekte ledsætning med hv-ord (hv-ord → subjekt → finit verbum):",
      options: [
        "Han ved ikke, hvor hun bor.",
        "Han ved ikke, hun bor hvor.",
        "Han ved ikke, hvor hun der bor.",
        "Han ved ikke, hun bor der hvor."
      ],
      correct: 0,
      why: "'Hvor' → subjekt 'hun' → finit 'bor'. De andre bryder midterfeltets rækkefølge." },

    { cat: "ledsaetning", prompt: "Vælg den korrekte ledsætning med hv-ord (hv-ord → subjekt → finit verbum):",
      options: [
        "Læreren forklarer, hvorfor dansk er svært.",
        "Læreren forklarer, dansk er svært hvorfor.",
        "Læreren forklarer, hvorfor dansk svært er.",
        "Læreren forklarer, er dansk svært hvorfor."
      ],
      correct: 0,
      why: "'Hvorfor' → subjekt 'dansk' → finit 'er' → prædikat. C sætter prædikat før finit verbum." },

    { cat: "ledsaetning", prompt: "Vælg den korrekte ledsætning med hv-ord (hv-ord → subjekt → finit verbum):",
      options: [
        "Jeg forstår, hvad du mener.",
        "Jeg forstår, du mener hvad.",
        "Jeg forstår, hvad du der mener.",
        "Jeg forstår, mener du hvad."
      ],
      correct: 0,
      why: "'Hvad' → subjekt 'du' → finit 'mener'. D inverterer." },

    // ---------- Contextual Narrative Repair Cards ----------
    { cat: "inversion",
      prompt: "Du vil skrive en bekræftelsesmail til en konference og starte med tidsadverbialet 'På mandag'. Vælg den korrekte sætning med inversion:",
      options: [
        "På mandag ankommer jeg til konferencen.",
        "På mandag jeg ankommer til konferencen.",
        "På mandag jeg vil ankomme til konferencen.",
        "På mandag ankommer til konferencen jeg."
      ],
      correct: 0,
      why: "Efter tidsadverbialet 'På mandag' skal der ske inversion (verbum + subjekt), så det bøjede verbum 'ankommer' står i anden position: 'På mandag ankommer jeg...'",
      weakTags: ["inversion-fronted-adverbial", "v2-placement"] },

    { cat: "inversion",
      prompt: "Efter en god teknisk samtale om torsdagen vil du følge op på LinkedIn og starte med tidsadverbialet. Vælg den korrekte ordstilling:",
      options: [
        "I torsdags havde vi en rigtig god teknisk dialog.",
        "I torsdags vi havde en rigtig god teknisk dialog.",
        "I torsdags en rigtig god teknisk dialog havde vi.",
        "I torsdags havde en rigtig god teknisk dialog vi."
      ],
      correct: 0,
      why: "Når sætningen starter med tidsleddet 'I torsdags', skal verbet 'havde' placeres før subjektet 'vi' (inversion): 'I torsdags havde vi...'",
      weakTags: ["inversion-fronted-adverbial", "v2-placement"] },

    { cat: "inversion",
      prompt: "Du vil foreslå din kollega at bytte tidsrum, fordi du starter med konsekvensleddet 'Derfor'. Vælg sætningen med korrekt inversion:",
      options: [
        "Derfor kan vi godt bytte vores præsentationstider.",
        "Derfor vi kan godt bytte vores præsentationstider.",
        "Derfor godt bytte kan vi vores præsentationstider.",
        "Derfor kan godt bytte vi vores præsentationstider."
      ],
      correct: 0,
      why: "'Derfor' fungerer som et adverbielt led, der indleder en hovedsætning. Det kræver inversion (verbum før subjekt), så verbet 'kan' står i anden position: 'Derfor kan vi...'",
      weakTags: ["fordi-derfor-clause", "inversion-fronted-adverbial"] },

    { cat: "ledsaetning",
      prompt: "Du forklarer din chef, hvorfor I byttede programtid, og bruger 'fordi'. Vælg ledsætningen med korrekt ordstilling og ikke-placering:",
      options: [
        "Vi byttede programtid, fordi Mikkel ikke kunne nå sit fly.",
        "Vi byttede programtid, fordi Mikkel kunne ikke nå sit fly.",
        "Vi byttede programtid, fordi ikke Mikkel kunne nå sit fly.",
        "Vi byttede programtid, fordi kunne Mikkel ikke nå sit fly."
      ],
      correct: 0,
      why: "'Fordi' indleder en ledsætning, hvor sætningsadverbialet 'ikke' skal placeres før det bøjede verbum ('kunne'): 'fordi Mikkel ikke kunne...'",
      weakTags: ["fordi-derfor-clause", "ledsaetning-ordstilling"] },

    { cat: "inversion",
      prompt: "Du skriver en officiel klage til din udlejer om den kolde radiator og indleder med tidsleddet 'Efter min mening'. Vælg den korrekte ordstilling:",
      options: [
        "Efter min mening har udlejeren ikke reageret hurtigt nok.",
        "Efter min mening udlejeren har ikke reageret hurtigt nok.",
        "Efter min mening har ikke udlejeren reageret hurtigt nok.",
        "Efter min mening udlejeren ikke har reageret hurtigt nok."
      ],
      correct: 0,
      why: "'Efter min mening' tæller som første led i sætningen, hvilket udløser inversion af subjekt og verbum: 'har udlejeren...'",
      weakTags: ["inversion-fronted-adverbial", "v2-placement"] },

    { cat: "ledsaetning",
      prompt: "Du vil skrive en e-mail til udlejeren og udtrykke, at du håber, de løser problemet hurtigt. Vælg ledsætningen med 'at' og korrekt ordstilling:",
      options: [
        "Jeg håber, at I snart løser problemet med varmen.",
        "Jeg håber, at snart I løser problemet med varmen.",
        "Jeg håber, at I løser snart problemet med varmen.",
        "Jeg håber, at løser I snart problemet med varmen."
      ],
      correct: 0,
      why: "I en ledsætning står det bøjede verbum efter subjektet, og eventuelle centraladverbialer som 'snart' placeres før det bøjede verbum: 'at I snart løser'.",
      weakTags: ["ledsaetning-ordstilling"] },

    { cat: "ledsaetning",
      prompt: "Du forklarer en kollega, hvorfor du ikke kan deltage i mødet, ved hjælp af 'selvom'. Vælg sætningen med korrekt ledsætningsordstilling:",
      options: [
        "Jeg kommer ikke til mødet, selvom jeg gerne ville have deltaget.",
        "Jeg kommer ikke til mødet, selvom jeg ville gerne have deltaget.",
        "Jeg kommer ikke til mødet, selvom gerne jeg ville have deltaget.",
        "Jeg kommer ikke til mødet, selvom ville jeg gerne have deltaget."
      ],
      correct: 0,
      why: "'Selvom' indleder en ledsætning. Her skal subjektet 'jeg' komme før det bøjede verbum 'ville': 'selvom jeg gerne ville...'",
      weakTags: ["ledsaetning-ordstilling"] },

    { cat: "inversion",
      prompt: "Du bekræfter en aftale på skrift og starter sætningen med 'Efter aftale med Mikkel'. Vælg den korrekte ordstilling:",
      options: [
        "Efter aftale med Mikkel bekræfter jeg hermed ændringen.",
        "Efter aftale med Mikkel jeg bekræfter hermed ændringen.",
        "Efter aftale med Mikkel bekræfter ændringen jeg hermed.",
        "Efter aftale med Mikkel jeg hermed bekræfter ændringen."
      ],
      correct: 0,
      why: "Det præpositionelle tids-/omstændighedsled 'Efter aftale med Mikkel' står på førstepladsen, så verbet 'bekræfter' skal stå på andenpladsen før subjektet 'jeg'.",
      weakTags: ["inversion-fronted-adverbial", "v2-placement"] },

    { cat: "inversion",
      prompt: "Du rykker udlejeren om svar og starter med tidsleddet 'For fem dage siden'. Vælg den sætning, der overholder V2-reglen:",
      options: [
        "For fem dage siden sendte jeg den første e-mail om fejlen.",
        "For fem dage siden jeg sendte den første e-mail om fejlen.",
        "For fem dage siden sendte den første e-mail jeg om fejlen.",
        "For fem dage siden jeg vil sende den første e-mail om fejlen."
      ],
      correct: 0,
      why: "Tidsangivelsen 'For fem dage siden' udgør første led i hovedsætningen, hvilket kræver inversion: verbet 'sendte' før subjektet 'jeg'.",
      weakTags: ["inversion-fronted-adverbial", "v2-placement"] },

    { cat: "inversion",
      prompt: "Du fortæller din chef, at du har travlt, og slår fast, at du konkluderer med 'Så'. Vælg den korrekte sætning med inversion:",
      options: [
        "Jeg har meget travlt i dag, så derfor kan jeg ikke deltage.",
        "Jeg har meget travlt i dag, så derfor jeg kan ikke deltage.",
        "Jeg har meget travlt i dag, så derfor ikke kan jeg deltage.",
        "Jeg har meget travlt i dag, så derfor kan ikke deltage jeg."
      ],
      correct: 0,
      why: "Når en hovedsætning indledes med 'så derfor', udløser det inversion. Verbet 'kan' skal stå før subjektet 'jeg'.",
      weakTags: ["fordi-derfor-clause", "inversion-fronted-adverbial"] },

    { cat: "v2",
      prompt: "I receptionen vil du høre om lokalets placering og danner en direkte hovedsætning med 'Undskyld, ...'. Vælg den sætning med korrekt V2-orden:",
      options: [
        "Undskyld, jeg leder faktisk efter konferencelokalet nu.",
        "Undskyld, faktisk jeg leder efter konferencelokalet nu.",
        "Undskyld, jeg faktisk leder efter konferencelokalet nu.",
        "Undskyld, efter konferencelokalet jeg leder faktisk nu."
      ],
      correct: 0,
      why: "'Undskyld' står uden for sætningsstrukturen. Hovedsætningen starter med subjektet 'jeg', efterfulgt af det bøjede verbum 'leder' på andenpladsen.",
      weakTags: ["v2-placement"] },

    { cat: "ledsaetning",
      prompt: "Du spørger receptionisten høfligt om vej, og ledsætningen indledes med 'om'. Vælg den korrekte ordstilling:",
      options: [
        "Kan du sige mig, om konferencen ikke starter klokken ni?",
        "Kan du sige mig, om ikke konferencen starter klokken ni?",
        "Kan du sige mig, om konferencen starter ikke klokken ni?",
        "Kan du sige mig, om starter konferencen ikke klokken ni?"
      ],
      correct: 0,
      why: "Efter konjunktionen 'om' har vi en ledsætning, hvor adverbialet 'ikke' skal placeres før det bøjede verbum 'starter': 'om konferencen ikke starter...'",
      weakTags: ["ledsaetning-ordstilling"] },

    { cat: "inversion",
      prompt: "Du forklarer udlejeren, at radiatoren er helt kold. Du vil starte med tidsleddet 'Normalt'. Vælg sætningen med korrekt inversion:",
      options: [
        "Normalt fungerer varmen her i lejligheden upåklageligt.",
        "Normalt varmen fungerer her i lejligheden upåklageligt.",
        "Normalt fungerer her i lejligheden varmen upåklageligt.",
        "Normalt varmen her i lejligheden fungerer upåklageligt."
      ],
      correct: 0,
      why: "Adverbialet 'Normalt' som første led kræver, at det bøjede verbum 'fungerer' står i anden position før subjektet 'varmen'.",
      weakTags: ["inversion-fronted-adverbial", "v2-placement"] },

    { cat: "ledsaetning",
      prompt: "Du vil sige til din kollega, at du ikke kan nå det, og bruger 'selvom'. Vælg den korrekte ledsætningsordstilling:",
      options: [
        "Jeg prøver at nå det, selvom jeg faktisk ikke har tid.",
        "Jeg prøver at nå det, selvom jeg har faktisk ikke tid.",
        "Jeg prøver at nå det, selvom faktisk jeg ikke har tid.",
        "Jeg prøver at nå det, selvom jeg faktisk har ikke tid."
      ],
      correct: 0,
      why: "'Selvom' indledes af en ledsætning, hvor centraladverbialerne 'faktisk' og 'ikke' skal stå før det bøjede verbum 'har': 'selvom jeg faktisk ikke har tid'.",
      weakTags: ["ledsaetning-ordstilling"] },

    { cat: "inversion",
      prompt: "Du skriver på LinkedIn, at du vil holde kontakten uanset resultatet af samtalen. Du indleder med 'Uanset udgangen'. Vælg den korrekte ordstilling:",
      options: [
        "Uanset udgangen vil jeg meget gerne holde kontakten med jer.",
        "Uanset udgangen jeg vil meget gerne holde kontakten med jer.",
        "Uanset udgangen vil meget gerne jeg holde kontakten med jer.",
        "Uanset udgangen jeg meget gerne vil holde kontakten med jer."
      ],
      correct: 0,
      why: "'Uanset udgangen' fungerer som sætningens første (adverbielle) led. Det bøjede hjælpeverbum 'vil' skal stå på andenpladsen før subjektet 'jeg'.",
      weakTags: ["inversion-fronted-adverbial", "v2-placement"] },

    { cat: "ledsaetning",
      prompt: "Du forklarer i en e-mail, at du deltager i konferencen på grund af sproginteressen. Du danner en 'at'-ledsætning. Vælg den korrekte ordstilling:",
      options: [
        "Sproginteresse er grunden til, at jeg i dag deltager i konferencen.",
        "Sproginteresse er grunden til, at jeg deltager i dag i konferencen.",
        "Sproginteresse er grunden til, at i dag jeg deltager i konferencen.",
        "Sproginteresse er grunden til, at jeg i dag i konferencen deltager."
      ],
      correct: 0,
      why: "I at-ledsætningen står subjektet 'jeg' først, efterfulgt af adverbialet 'i dag' og derefter det bøjede verbum 'deltager': 'at jeg i dag deltager'.",
      weakTags: ["ledsaetning-ordstilling"] },

    { cat: "inversion",
      prompt: "Du foreslår et kompromis til udlejeren og starter med stedets adverbialled 'Her i stuen'. Vælg den korrekte ordstilling med inversion:",
      options: [
        "Her i stuen måler vi nu under tolv graders varme.",
        "Her i stuen vi måler nu under tolv graders varme.",
        "Her i stuen måler nu under tolv graders varme vi.",
        "Her i stuen nu vi måler under tolv graders varme."
      ],
      correct: 0,
      why: "Det præpositionelle stedforholdsled 'Her i stuen' indleder hovedsætningen. Det bøjede verbum 'måler' skal derfor placeres før subjektet 'vi' (inversion).",
      weakTags: ["inversion-fronted-adverbial", "v2-placement"] },

    { cat: "ledsaetning",
      prompt: "Du skriver en opdatering om et projekt, men nævner at I ikke er færdige endnu. Vælg ledsætningen efter 'at' med korrekt ikke-placering:",
      options: [
        "Vi må indrømme, at vi ikke er helt færdige med opgaven.",
        "Vi må indrømme, at vi er ikke helt færdige med opgaven.",
        "Vi må indrømme, at ikke vi er helt færdige med opgaven.",
        "Vi må indrømme, at vi er helt ikke færdige med opgaven."
      ],
      correct: 0,
      why: "I en at-ledsætning skal nægtelsen 'ikke' placeres før det bøjede verbum ('er'): 'at vi ikke er helt færdige'.",
      weakTags: ["ledsaetning-ordstilling"] },

    { cat: "inversion",
      prompt: "Du begrunder en beslutning over for dit team og starter konsekvenssætningen med 'Derfor'. Vælg den korrekte sætning:",
      options: [
        "Derfor tager jeg personligt ejerskab over denne opgave.",
        "Derfor jeg tager personligt ejerskab over denne opgave.",
        "Derfor tager ejerskab jeg personligt over denne opgave.",
        "Derfor jeg personligt tager ejerskab over denne opgave."
      ],
      correct: 0,
      why: "Hovedsætningen indledes med 'Derfor', som tvinger det bøjede verbum 'tager' om på andenpladsen før subjektet 'jeg' (inversion).",
      weakTags: ["fordi-derfor-clause", "inversion-fronted-adverbial"] },

    { cat: "ledsaetning",
      prompt: "Du vil skrive en hurtig besked på Slack om, hvorfor du kommer for sent, og bruger 'fordi'. Vælg ledsætningen med korrekt ikke-placering:",
      options: [
        "Jeg bliver lidt forsinket, fordi bussen ikke kørte til tiden.",
        "Jeg bliver lidt forsinket, fordi bussen kørte ikke til tiden.",
        "Jeg bliver lidt forsinket, fordi ikke bussen kørte til tiden.",
        "Jeg bliver lidt forsinket, fordi bussen kørte til tiden ikke."
      ],
      correct: 0,
      why: "'Because' (fordi) indleder en ledsætning, hvor nægtelsen 'ikke' skal placeres foran det bøjede verbum 'kørte': 'fordi bussen ikke kørte...'",
      weakTags: ["fordi-derfor-clause", "ledsaetning-ordstilling"] }
  ]
};

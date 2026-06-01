/* platå · ordstilling-drill · data v0.1
 *
 * Word order drill for Danish. V2 rule, inversion, ledsætninger.
 * 35 multiple-choice items, 4 options each, 1 correct.
 *
 * Format: each item has a category, a prompt, 4 options, correct index, and a Danish explanation.
 * Categories: v2 (subject first), inversion (adverbial first), ledsaetning (subordinate clause).
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

    // ---------- Ledsætninger: verb at end ----------
    { cat: "ledsaetning", prompt: "Vælg den ledsætning med verb i slutningen:",
      options: [
        "Jeg tror, at han kommer i morgen.",
        "Jeg tror, at han i morgen kommer.",
        "Jeg tror, han kommer i morgen.",
        "Jeg tror, at han kommer i morgen sent."
      ],
      correct: 0,
      why: "Alle undtagen C er korrekte (verbum 'kommer' i slutningen af ledsætning). A er den enkleste, standard-form. C mangler 'at'." },

    { cat: "ledsaetning", prompt: "Vælg den ledsætning med verb i slutningen:",
      options: [
        "Hun siger, at hun er træt.",
        "Hun siger, hun er træt.",
        "Hun siger, at hun træt er.",
        "Hun siger, er hun træt."
      ],
      correct: 0,
      why: "Verbum 'er' i slutningen. C er V2-brud inde i ledsætning. D er forkert inversion." },

    { cat: "ledsaetning", prompt: "Vælg den ledsætning med verb i slutningen:",
      options: [
        "Vi ved, at de bor i Aarhus.",
        "Vi ved, de bor i Aarhus.",
        "Vi ved, at de i Aarhus bor.",
        "Vi ved, bor de i Aarhus."
      ],
      correct: 0,
      why: "Verbum 'bor' i slutningen. D er V2-brud inde i ledsætning." },

    { cat: "ledsaetning", prompt: "Vælg den ledsætning med verb i slutningen:",
      options: [
        "Han spørger, om jeg har tid i morgen.",
        "Han spørger, om jeg tid har i morgen.",
        "Han spørger, om jeg i morgen har tid.",
        "Han spørger, har jeg tid i morgen."
      ],
      correct: 0,
      why: "Verbum 'har' i slutningen. C er også korrekt. A er den enkleste form. D er V2-brud." },

    { cat: "ledsaetning", prompt: "Vælg den ledsætning med verb i slutningen:",
      options: [
        "De siger, at de kommer i aften.",
        "De siger, de kommer i aften.",
        "De siger, at de i aften kommer.",
        "De siger, kommer de i aften."
      ],
      correct: 0,
      why: "Verbum 'kommer' i slutningen. D er V2-brud." },

    { cat: "ledsaetning", prompt: "Vælg den ledsætning med verb i slutningen:",
      options: [
        "Jeg håber, at vejret bliver godt i morgen.",
        "Jeg håber, vejret bliver godt i morgen.",
        "Jeg håber, at vejret i morgen bliver godt.",
        "Jeg håber, bliver vejret godt i morgen."
      ],
      correct: 0,
      why: "Verbum 'bliver' i slutningen. D er V2-brud." },

    { cat: "ledsaetning", prompt: "Vælg den ledsætning med verb i slutningen:",
      options: [
        "Mor spørger, hvornår vi kommer hjem.",
        "Mor spørger, vi kommer hjem hvornår.",
        "Mor spørger, hvornår kommer vi hjem.",
        "Mor spørger, kommer vi hjem hvornår."
      ],
      correct: 0,
      why: "Verbum 'kommer' i slutningen. C er V2-brud inde i ledsætning." },

    { cat: "ledsaetning", prompt: "Vælg den ledsætning med verb i slutningen:",
      options: [
        "Han ved ikke, hvor hun bor.",
        "Han ved ikke, hun bor hvor.",
        "Han ved ikke, hvor hun der bor.",
        "Han ved ikke, hun bor der hvor."
      ],
      correct: 0,
      why: "Verbum 'bor' i slutningen. C er V2-brud." },

    { cat: "ledsaetning", prompt: "Vælg den ledsætning med verb i slutningen:",
      options: [
        "Læreren forklarer, hvorfor dansk er svært.",
        "Læreren forklarer, dansk er svært hvorfor.",
        "Læreren forklarer, hvorfor dansk svært er.",
        "Læreren forklarer, er dansk svært hvorfor."
      ],
      correct: 0,
      why: "Verbum 'er' i slutningen. C er V2-brud (verbum før prædikat)." },

    { cat: "ledsaetning", prompt: "Vælg den ledsætning med verb i slutningen:",
      options: [
        "Jeg forstår, hvad du mener.",
        "Jeg forstår, du mener hvad.",
        "Jeg forstår, hvad du der mener.",
        "Jeg forstår, mener du hvad."
      ],
      correct: 0,
      why: "Verbum 'mener' i slutningen. D er V2-brud." }
  ]
};

/* platå · bøjning-drill · data v0.1
 *
 * 25 verber (regular, strong, irregular) + 12 substantiver (en/et, regular/irregular plural)
 * Sources: standard A2-B1 Danish grammatik
 */

window.PLATA_DATA = {
  verber: [
    // regular -ede
    { infinitive: "at tale",   nutid: "taler",     datid: "talte",      førnutid: "har talt",     note: "regular" },
    { infinitive: "at spise",  nutid: "spiser",    datid: "spiste",     førnutid: "har spist",    note: "regular" },
    { infinitive: "at bo",     nutid: "bor",       datid: "boede",      førnutid: "har boet",     note: "regular" },
    { infinitive: "at arbejde",nutid: "arbejder",  datid: "arbejdede",  førnutid: "har arbejdet", note: "regular" },
    { infinitive: "at høre",   nutid: "hører",     datid: "hørte",      førnutid: "har hørt",     note: "regular" },
    { infinitive: "at lære",   nutid: "lærer",     datid: "lærte",      førnutid: "har lært",     note: "regular (doubling: lær→lære)" },
    { infinitive: "at tro",    nutid: "tror",      datid: "troede",     førnutid: "har troet",    note: "regular" },
    { infinitive: "at mene",   nutid: "mener",     datid: "mente",      førnutid: "har ment",     note: "regular" },
    { infinitive: "at spørge", nutid: "spørger",   datid: "spurgte",    førnutid: "har spurgt",   note: "regular" },
    { infinitive: "at svare",  nutid: "svarer",    datid: "svarede",    førnutid: "har svaret",   note: "regular" },
    { infinitive: "at vaske",  nutid: "vasker",    datid: "vaskede",    førnutid: "har vasket",   note: "regular" },
    { infinitive: "at åbne",   nutid: "åbner",     datid: "åbnede",     førnutid: "har åbnet",    note: "regular" },
    { infinitive: "at lukke",  nutid: "lukker",    datid: "lukkede",    førnutid: "har lukket",   note: "regular" },
    { infinitive: "at betale", nutid: "betaler",   datid: "betalte",    førnutid: "har betalt",   note: "regular" },
    { infinitive: "at besøge", nutid: "besøger",   datid: "besøgte",    førnutid: "har besøgt",   note: "regular" },

    // strong (vowel change)
    { infinitive: "at skrive", nutid: "skriver",   datid: "skrev",      førnutid: "har skrevet",  note: "strong" },
    { infinitive: "at læse",   nutid: "læser",     datid: "læste",      førnutid: "har læst",     note: "strong" },
    { infinitive: "at give",   nutid: "giver",     datid: "gav",        førnutid: "har givet",    note: "strong" },
    { infinitive: "at tage",   nutid: "tager",     datid: "tog",        førnutid: "har taget",    note: "strong" },
    { infinitive: "at drikke", nutid: "drikker",   datid: "drak",       førnutid: "har drukket",  note: "strong" },
    { infinitive: "at finde",  nutid: "finder",    datid: "fandt",      førnutid: "har fundet",   note: "strong" },
    { infinitive: "at hjælpe", nutid: "hjælper",   datid: "hjalp",      førnutid: "har hjulpet",  note: "strong" },
    { infinitive: "at sove",   nutid: "sover",     datid: "sov",        førnutid: "har sovet",    note: "strong" },
    { infinitive: "at forstå", nutid: "forstår",   datid: "forstod",    førnutid: "har forstået", note: "strong" },

    // irregular / modals
    { infinitive: "at være",   nutid: "er",        datid: "var",        førnutid: "har været",    note: "irregular" },
    { infinitive: "at have",   nutid: "har",       datid: "havde",      førnutid: "har haft",     note: "irregular" },
    { infinitive: "at kunne",  nutid: "kan",       datid: "kunne",      førnutid: "har kunnet",   note: "modal" },
    { infinitive: "at skulle", nutid: "skal",      datid: "skulle",     førnutid: "har skullet",  note: "modal" },
    { infinitive: "at ville",  nutid: "vil",       datid: "ville",      førnutid: "har villet",   note: "modal" },
    { infinitive: "at blive",  nutid: "bliver",    datid: "blev",       førnutid: "er blevet",    note: "irregular (er+part)" },
    { infinitive: "at gå",     nutid: "går",       datid: "gik",        førnutid: "er gået",      note: "motion (er+part)" }
  ],

  substantiver: [
    { ubestemtEntal: "en mand",       bestemtEntal: "manden",       flertalUbestemt: "mænd",      bestemtFlertal: "mændene",      note: "en-word, irregular plural" },
    { ubestemtEntal: "en kvinde",     bestemtEntal: "kvinden",      flertalUbestemt: "kvinder",   bestemtFlertal: "kvinderne",    note: "en-word, regular" },
    { ubestemtEntal: "et barn",       bestemtEntal: "barnet",       flertalUbestemt: "børn",      bestemtFlertal: "børnene",      note: "et-word, irregular plural" },
    { ubestemtEntal: "et hus",        bestemtEntal: "huset",        flertalUbestemt: "huse",      bestemtFlertal: "husene",       note: "et-word, regular" },
    { ubestemtEntal: "en bil",        bestemtEntal: "bilen",        flertalUbestemt: "biler",     bestemtFlertal: "bilerne",      note: "en-word, regular" },
    { ubestemtEntal: "en bog",        bestemtEntal: "bogen",        flertalUbestemt: "bøger",     bestemtFlertal: "bøgerne",      note: "en-word, umlaut" },
    { ubestemtEntal: "et bord",       bestemtEntal: "bordet",       flertalUbestemt: "borde",     bestemtFlertal: "bordene",      note: "et-word, regular" },
    { ubestemtEntal: "en stol",       bestemtEntal: "stolen",       flertalUbestemt: "stole",     bestemtFlertal: "stolene",      note: "en-word, regular" },
    { ubestemtEntal: "et værelse",    bestemtEntal: "værelset",     flertalUbestemt: "værelser",  bestemtFlertal: "værelserne",   note: "et-word, regular" },
    { ubestemtEntal: "en lejlighed",  bestemtEntal: "lejligheden",  flertalUbestemt: "lejligheder", bestemtFlertal: "lejlighederne", note: "en-word, regular" },
    { ubestemtEntal: "en by",         bestemtEntal: "byen",         flertalUbestemt: "byer",      bestemtFlertal: "byerne",       note: "en-word, regular" },
    { ubestemtEntal: "et land",       bestemtEntal: "landet",       flertalUbestemt: "lande",     bestemtFlertal: "landene",      note: "et-word, regular" },
    { ubestemtEntal: "en skole",      bestemtEntal: "skolen",       flertalUbestemt: "skoler",    bestemtFlertal: "skolerne",     note: "en-word, regular" },
    { ubestemtEntal: "et universitet",bestemtEntal: "universitetet",flertalUbestemt: "universiteter", bestemtFlertal: "universiteterne", note: "et-word, loan word" },
    { ubestemtEntal: "en uge",        bestemtEntal: "ugen",         flertalUbestemt: "uger",      bestemtFlertal: "ugerne",       note: "en-word, regular" },
    { ubestemtEntal: "et år",         bestemtEntal: "året",         flertalUbestemt: "år",        bestemtFlertal: "årene",        note: "et-word, irregular plural" }
  ],

  // Acceptance rules: many Danish words accept multiple spellings
  // Used by app.js to validate user input
  aliases: {
    // verbs: past participles can sometimes be -et or -t depending on context/region
    "har spist": ["har spist", "har spist"],
    "har spurgt": ["har spurgt", "har spurgt"],
    "har svaret": ["har svaret", "har svaret"],
    "har talt":   ["har talt", "har talt"]
  }
};

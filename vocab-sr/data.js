/* platå · vocab-SR · data v0.1
 *
 * Spaced-repetition vocabulary drill. Danish ↔ Russian.
 * 48 high-frequency A2-B1 words covering family, food, time, common verbs, adjectives.
 *
 * Russian is Dima's native language; EN is provided as a reference bridge.
 */

window.PLATA_DATA = {
  vocab: [
    // ----- family / people -----
    { da: "mand",      ru: "мужчина, человек",  en: "man",         example: "Han er en ung mand.",                       note: "en-word" },
    { da: "kvinde",    ru: "женщина",           en: "woman",       example: "Hun er en ældre kvinde." },
    { da: "dreng",     ru: "мальчик",           en: "boy",         example: "Drengen spiller fodbold." },
    { da: "pige",      ru: "девочка, девушка",  en: "girl",        example: "Pigen læser en bog." },
    { da: "barn",      ru: "ребёнок, дитя",     en: "child",       example: "Barnet sover.",                              note: "et-word, irregular plural: børn" },
    { da: "mor",       ru: "мама, мать",        en: "mother",      example: "Min mor er lærer." },
    { da: "far",       ru: "папа, отец",        en: "father",      example: "Min far arbejder i København." },
    { da: "ven",       ru: "друг",              en: "friend (m)",  example: "Han er min bedste ven.",                     note: "venner plural" },
    { da: "veninde",   ru: "подруга",           en: "friend (f)",  example: "Hun er min gode veninde." },

    // ----- house / objects -----
    { da: "hus",       ru: "дом",               en: "house",       example: "Vi bor i et rødt hus.",                      note: "et-word" },
    { da: "lejlighed", ru: "квартира",          en: "apartment",   example: "Lejligheden er lille men dyr." },
    { da: "værelse",   ru: "комната",           en: "room",        example: "Mit værelse er på 2. sal.",                  note: "et-word" },
    { da: "bord",      ru: "стол",              en: "table",       example: "Børnene sidder ved bordet.",                 note: "et-word" },
    { da: "stol",      ru: "стул",              en: "chair",       example: "Stolen er gammel." },
    { da: "dør",       ru: "дверь",             en: "door",        example: "Luk døren, tak." },
    { da: "vindue",    ru: "окно",              en: "window",      example: "Vinduet er åbent.",                          note: "et-word" },

    // ----- food / drink -----
    { da: "mad",       ru: "еда",               en: "food",        example: "Maden smager godt." },
    { da: "vand",      ru: "вода",              en: "water",       example: "Jeg drikker vand.",                          note: "et-word" },
    { da: "brød",      ru: "хлеб",              en: "bread",       example: "Vi køber frisk brød.",                       note: "et-word" },
    { da: "mælk",      ru: "молоко",            en: "milk",        example: "Hun drikker mælk hver morgen." },
    { da: "kaffe",     ru: "кофе",              en: "coffee",      example: "Kaffe uden sukker, tak." },
    { da: "øl",        ru: "пиво",              en: "beer",        example: "En kold øl, tak." },

    // ----- time -----
    { da: "dag",       ru: "день",              en: "day",         example: "Hvilken dag er det i dag?" },
    { da: "nat",       ru: "ночь",              en: "night",       example: "Om natten sover vi." },
    { da: "uge",       ru: "неделя",            en: "week",        example: "Næste uge rejser vi til Norge." },
    { da: "måned",     ru: "месяц",             en: "month",       example: "Måneden har 30 dage." },
    { da: "år",        ru: "год",               en: "year",        example: "Året har 12 måneder.",                       note: "et-word, irregular plural: år" },
    { da: "time",      ru: "час",               en: "hour",        example: "Vi arbejder 8 timer om dagen." },

    // ----- common verbs (infinitive forms) -----
    { da: "at være",   ru: "быть",              en: "be",          example: "Jeg er træt." },
    { da: "at have",   ru: "иметь",             en: "have",        example: "Hun har en hund." },
    { da: "at gå",     ru: "идти, ходить",      en: "go, walk",    example: "Vi går i skole hver dag." },
    { da: "at komme",  ru: "приходить, приезжать", en: "come",     example: "Han kommer i morgen." },
    { da: "at spise",  ru: "есть, кушать",      en: "eat",         example: "Vi spiser aftensmad kl. 18." },
    { da: "at drikke", ru: "пить",              en: "drink",       example: "Hun drikker kaffe om morgenen." },
    { da: "at sove",   ru: "спать",             en: "sleep",       example: "Barnet sover hele natten." },
    { da: "at læse",   ru: "читать",            en: "read",        example: "Jeg læser avisen hver dag." },
    { da: "at skrive", ru: "писать",            en: "write",       example: "Hun skriver et brev til mor." },
    { da: "at arbejde",ru: "работать",          en: "work",        example: "Han arbejder i en bank." },
    { da: "at bo",     ru: "жить, проживать",   en: "live (reside)", example: "Vi bor i København." },
    { da: "at købe",   ru: "покупать",          en: "buy",         example: "Hun køber brød i supermarkedet." },

    // ----- adjectives -----
    { da: "stor",      ru: "большой, крупный",  en: "big",         example: "København er en stor by." },
    { da: "lille",     ru: "маленький",         en: "small",       example: "Mit værelse er lille.",                      note: "lille → lille/liden/lille depending on gender" },
    { da: "god",       ru: "хороший",           en: "good",        example: "Maden er god i dag." },
    { da: "dårlig",    ru: "плохой",            en: "bad",         example: "Vejret er dårligt i dag." },
    { da: "ny",        ru: "новый",             en: "new",         example: "Jeg har en ny bil." },
    { da: "gammel",    ru: "старый",            en: "old",         example: "Huset er gammelt men smukt." },
    { da: "varm",      ru: "тёплый, горячий",   en: "warm/hot",    example: "Kaffen er varm." },
    { da: "kold",      ru: "холодный",          en: "cold",        example: "Øllen er kold." }
  ]
};

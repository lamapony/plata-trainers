window.PLATA_DATA = {
  skrive: [
    {
      id: "bolig-radiator",
      cat: "bolig",
      channel: "Email til udlejer",
      prompt: "Du har haft en kold radiator i tre dage. Skriv en kort mail til udlejeren (4–6 sætninger).",
      starter: "Kære [udlejer],",
      minChars: 48,
      rubric: [
        { id: "facts", label: "Fakta først", detail: "Problem, lejlighed/adresse og hvor længe det har varet er synlige." },
        { id: "agency", label: "Tydeligt ansvar", detail: "Du bruger jeg-form og beder om et konkret næste skridt." },
        { id: "register", label: "Rolig tone", detail: "Høflig uden passiv accept — ikke kun 'det er helt fint'." }
      ],
      note: "Tjek selv: fik din tekst sagen til at gå videre uden at eskalere?"
    },
    {
      id: "arbejde-status",
      cat: "arbejde",
      channel: "Slack til teamet",
      prompt: "Du er forsinket med en opgave. Skriv en kort Slack-besked til teamet (2–4 sætninger).",
      starter: "Hej alle,",
      minChars: 36,
      rubric: [
        { id: "owned-delay", label: "Tag ansvar for forsinkelsen", detail: "Du navngiver forsinkelsen uden at gemme dig bag en undskyldning." },
        { id: "next-step", label: "Synligt næste skridt", detail: "Der er et tidspunkt eller næste skridt teamet kan stole på." },
        { id: "tone", label: "Tone på arbejdet", detail: "Kort og konkret — ikke for formelt, ikke for privat." }
      ],
      note: "Tjek selv: lyder du som en kollega der tager ansvar?"
    },
    {
      id: "sundhed-symptom",
      cat: "sundhed",
      channel: "Besked til lægen",
      prompt: "Du skal beskrive symptomer til lægen via patientportal (3–5 sætninger).",
      starter: "Kære læge,",
      minChars: 40,
      rubric: [
        { id: "timeline", label: "Hvornår og hvor længe", detail: "Du nævner varighed eller hvornår det startede." },
        { id: "precision", label: "Præcise symptomer", detail: "Du bruger konkrete ord (smerte, hoste, feber) frem for vage 'ikke så godt'." },
        { id: "ask", label: "Tydeligt ønske", detail: "Du beder tydeligt om en tid, et svar eller et næste skridt." }
      ],
      note: "Tjek selv: kan lægen handle på det uden at gætte?"
    },
    {
      id: "followup-interview",
      cat: "arbejde",
      channel: "Email efter jobsamtale",
      prompt: "Skriv en kort opfølgning efter en jobsamtale for en uge siden (3–4 sætninger).",
      starter: "Kære [navn],",
      minChars: 44,
      rubric: [
        { id: "thanks", label: "Tak for samtalen", detail: "Tak for samtalen uden at lyde desperat." },
        { id: "interest", label: "Rolig interesse", detail: "Interesse er tydelig uden pres ('håber på hurtigt svar')." },
        { id: "process", label: "Tal om processen", detail: "Du bruger proces-sprog (næste skridt, opfølgning) frem for følelses-tryk." }
      ],
      note: "Tjek selv: lyder du som en fremtidig kollega?"
    },
    {
      id: "borgerservice-tid",
      cat: "bolig",
      channel: "Email til Borgerservice",
      prompt: "Du skal flytte en aftale om CPR-nummer. Skriv en kort høflig mail (3–4 sætninger).",
      starter: "Kære Borgerservice,",
      minChars: 40,
      rubric: [
        { id: "context", label: "Sammenhæng", detail: "Du nævner hvad aftalen handler om." },
        { id: "request", label: "Konkret ønske", detail: "Du beder tydeligt om en ny tid eller et alternativ." },
        { id: "register", label: "Tone til det offentlige", detail: "Kort, konkret og respektfuldt — ikke krævende." }
      ],
      note: "Tjek selv: er dit dansk brugbart i det offentlige system?"
    }
  ]
};

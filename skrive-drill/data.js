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
        { id: "facts", label: "Facts first", detail: "Problem, lejlighed/adresse og hvor længe det har varet er synlige." },
        { id: "agency", label: "Clear agency", detail: "Du bruger jeg-form og beder om et konkret næste skridt." },
        { id: "register", label: "Calm register", detail: "Høflig uden passiv accept — ikke kun 'det er helt fint'." }
      ],
      note: "Self-grade: flyttede din dansk sagen videre uden at eskalere?"
    },
    {
      id: "arbejde-status",
      cat: "arbejde",
      channel: "Slack til teamet",
      prompt: "Du er forsinket med en opgave. Skriv en kort Slack-besked til teamet (2–4 sætninger).",
      starter: "Hej alle,",
      minChars: 36,
      rubric: [
        { id: "owned-delay", label: "Owned delay", detail: "Du navngiver forsinkelsen uden undskyldninger uden handling." },
        { id: "next-step", label: "Visible next step", detail: "Der er et tidspunkt eller næste skridt teamet kan stole på." },
        { id: "tone", label: "Workplace tone", detail: "Kort og konkret — ikke for formelt, ikke for privat." }
      ],
      note: "Self-grade: lyder du som en kollega der tager ansvar?"
    },
    {
      id: "sundhed-symptom",
      cat: "sundhed",
      channel: "Besked til lægen",
      prompt: "Du skal beskrive symptomer til lægen via patientportal (3–5 sætninger).",
      starter: "Kære læge,",
      minChars: 40,
      rubric: [
        { id: "timeline", label: "Timeline", detail: "Du nævner varighed eller hvornår det startede." },
        { id: "precision", label: "Symptom precision", detail: "Du bruger konkrete ord (smerte, hoste, feber) frem for vage 'ikke så godt'." },
        { id: "ask", label: "Clear ask", detail: "Du beder om tid, svar eller næste skridt tydeligt." }
      ],
      note: "Self-grade: kan lægen handle på det uden at gætte?"
    },
    {
      id: "followup-interview",
      cat: "arbejde",
      channel: "Email efter jobsamtale",
      prompt: "Skriv en kort opfølgning efter en jobsamtale for en uge siden (3–4 sætninger).",
      starter: "Kære [navn],",
      minChars: 44,
      rubric: [
        { id: "thanks", label: "Acknowledgement", detail: "Tak for samtalen uden at lyde desperat." },
        { id: "interest", label: "Calm interest", detail: "Interesse er tydelig uden pres ('håber på hurtigt svar')." },
        { id: "process", label: "Process language", detail: "Du bruger proces-sprog (næste skridt, opfølgning) frem for følelses-tryk." }
      ],
      note: "Self-grade: lyder du som en fremtidig kollega?"
    },
    {
      id: "borgerservice-tid",
      cat: "bolig",
      channel: "Email til Borgerservice",
      prompt: "Du skal flytte en aftale om CPR-nummer. Skriv en kort høflig mail (3–4 sætninger).",
      starter: "Kære Borgerservice,",
      minChars: 40,
      rubric: [
        { id: "context", label: "Context", detail: "Du nævner hvad aftalen handler om." },
        { id: "request", label: "Concrete request", detail: "Du beder om ny tid eller alternativ tydeligt." },
        { id: "register", label: "Public-service register", detail: "Kort, konkret og respektfuldt — ikke kravende." }
      ],
      note: "Self-grade: er din dansk brugbar i det offentlige system?"
    }
  ]
};

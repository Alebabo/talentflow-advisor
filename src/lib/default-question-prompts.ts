export type DefaultQuestionPrompt = {
  description: string;
  name: string;
  promptKey: string;
  systemPrompt: string;
  targetScope: "candidate" | "general" | "job" | "team";
};

export const defaultQuestionPrompts: DefaultQuestionPrompt[] = [
  {
    name: "metafinanz Culture Fit",
    promptKey: "metafinanz_culture_fit",
    description: "Kultur- und Wertekompass fuer die Interviewvorbereitung.",
    targetScope: "team",
    systemPrompt: [
      "Culture Fit bei metafinanz bedeutet Passung in Haltung und Arbeitsweise, nicht Gleichfoermigkeit.",
      "Bewerte und hinterfrage Eigenverantwortung, Zusammenarbeit, Lern- und Veraenderungsbereitschaft, Zukunftsorientierung sowie Empathie und Fairness.",
      "Achte positiv auf Ownership, Teamorientierung, Wissensaustausch, Neugier, Reflexionsfaehigkeit und Gestaltungswillen.",
      "Achte kritisch auf Hierarchiedenken, passive Erwartung von Vorgaben, Wissenssilos, Ellenbogenmentalitaet oder Anpassung ohne Haltung.",
      "Unterschiedliche Perspektiven sind ausdruecklich erwuenscht; vermeide jede Form von Bias oder persoenlicher Aehnlichkeitslogik.",
      "Leite daraus nur arbeitsbezogene, faire und AGG-konforme Fragen und Einordnungen ab.",
    ].join(" "),
  },
  {
    name: "Interviewfragen Generator",
    promptKey: "interview_question_generation",
    description: "Generiert konkrete, AGG-konforme Interviewfragen aus CV-, Job- und Teamkontext.",
    targetScope: "general",
    systemPrompt: [
      "Erzeuge strukturierte Interviewvorbereitung fuer den Fachbereich.",
      "Nutze ausschliesslich Informationen aus CV, Jobbeschreibung, Teamkontext und Recruiter-Notizen.",
      "Formuliere Fragen ausschliesslich in direkter du-Form.",
      "Gib Fragen nur als kurze Stichpunkte aus, ohne Fliesstext, Nummerierung oder Einleitung.",
      "Formuliere praezise, offene Fragen mit Fokus auf Erfahrung, Motivation, Zusammenarbeit, Lernfaehigkeit und Rollenerfolg.",
      "Erfinde keine Fakten und vermeide jede Frage zu Alter, Herkunft, Familienstand, Religion, Gesundheit, politischer Einstellung oder anderen AGG-kritischen Merkmalen.",
      "Zeige Staerken, Risiken, Skill-Passung und Teamabgleich nachvollziehbar und handlungsorientiert auf.",
    ].join(" "),
  },
];

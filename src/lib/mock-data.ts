export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  seniority: string;
  shortDescription: string;
  teamId?: string;
  createdAt: string;
  status: "Aktiv" | "Entwurf" | "Geschlossen";
};

export type Application = {
  id: string;
  name: string;
  email: string;
  location: string;
  shortProfile: string;
  skills: string[];
  yearsExperience: number;
  uploadedAt: string;
};

export type Team = {
  id: string;
  name: string;
  businessUnit: string;
  description: string;
  values: string[];
  interviewStyle: string;
  focusAreas: string[];
  members: number;
};

export const teams: Team[] = [
  {
    id: "t1",
    name: "Data & Analytics Platform",
    businessUnit: "Metafinanz – HTM",
    description:
      "Verantwortlich für die zentrale Datenplattform der HTM. Entwickelt skalierbare Data Pipelines und Analytics-Produkte für interne Fachbereiche.",
    values: ["Verlässlichkeit", "Pragmatismus", "Wissensaustausch", "Eigenverantwortung"],
    interviewStyle: "Strukturiert, evidenzbasiert, kollaborativ. Fokus auf konkrete Beispiele statt hypothetischer Antworten.",
    focusAreas: ["Cloud Data Platforms", "DataOps", "Stakeholder Management", "Architektur"],
    members: 14,
  },
  {
    id: "t2",
    name: "Insurance Core Modernization",
    businessUnit: "Metafinanz – Insurance",
    description:
      "Modernisiert Kernsysteme im Versicherungsumfeld gemeinsam mit Fachbereich und Architektur. Hoher Kundenkontakt.",
    values: ["Kundenorientierung", "Sorgfalt", "Fachliche Tiefe"],
    interviewStyle: "Fachlich tief, viel Szenario-basierte Fragen, Wert auf Kommunikationsstärke.",
    focusAreas: ["Versicherungsfachlichkeit", "Legacy Modernization", "Java Backend"],
    members: 22,
  },
  {
    id: "t3",
    name: "Cloud Foundations",
    businessUnit: "Metafinanz – HTM",
    description:
      "Baut interne Cloud-Plattformen und Self-Service Tooling für Entwicklungsteams.",
    values: ["Automation first", "Transparenz", "Lernkultur"],
    interviewStyle: "Hands-on, Whiteboard, Pair-Diskussion über reale Szenarien.",
    focusAreas: ["Azure", "Terraform", "Plattform-Engineering", "Developer Experience"],
    members: 9,
  },
];

export const jobs: Job[] = [
  {
    id: "j1",
    title: "Senior Data Engineer (m/w/d)",
    company: "Metafinanz",
    location: "München / Remote",
    seniority: "Senior",
    shortDescription:
      "Aufbau und Weiterentwicklung der zentralen Data Platform. Enge Zusammenarbeit mit Analytics-, BI- und Fachteams.",
    teamId: "t1",
    createdAt: "2025-04-12",
    status: "Aktiv",
  },
  {
    id: "j2",
    title: "Cloud Platform Engineer (m/w/d)",
    company: "Metafinanz",
    location: "München",
    seniority: "Mid–Senior",
    shortDescription:
      "Weiterentwicklung der internen Azure-Plattform, Self-Service-Tooling und Developer Experience.",
    teamId: "t3",
    createdAt: "2025-04-20",
    status: "Aktiv",
  },
  {
    id: "j3",
    title: "Lead Software Engineer Insurance Core",
    company: "Metafinanz",
    location: "München / Hybrid",
    seniority: "Lead",
    shortDescription:
      "Technische Führung bei der Modernisierung versicherungsfachlicher Kernsysteme im Java-Umfeld.",
    teamId: "t2",
    createdAt: "2025-03-30",
    status: "Aktiv",
  },
  {
    id: "j4",
    title: "Junior Data Analyst (m/w/d)",
    company: "Metafinanz",
    location: "München",
    seniority: "Junior",
    shortDescription:
      "Unterstützung der Fachbereiche bei der Analyse und Visualisierung geschäftskritischer Daten.",
    teamId: "t1",
    createdAt: "2025-05-02",
    status: "Entwurf",
  },
];

export const applications: Application[] = [
  {
    id: "a1",
    name: "Julia Berger",
    email: "julia.berger@example.com",
    location: "München",
    shortProfile:
      "7 Jahre Erfahrung im Aufbau von Data Platforms im Banken- und Versicherungsumfeld. Letzter Schritt: Tech Lead bei einem Münchner Versicherer.",
    skills: ["Azure", "Databricks", "dbt", "Python", "Stakeholder Management"],
    yearsExperience: 7,
    uploadedAt: "2025-04-25",
  },
  {
    id: "a2",
    name: "Tobias Reinhardt",
    email: "t.reinhardt@example.com",
    location: "Augsburg",
    shortProfile:
      "Cloud Engineer mit starkem Fokus auf Plattform-Automatisierung. Zuletzt Aufbau eines internen Developer Portals.",
    skills: ["Terraform", "Azure", "Kubernetes", "Go", "Backstage"],
    yearsExperience: 5,
    uploadedAt: "2025-04-28",
  },
  {
    id: "a3",
    name: "Sofia Almeida",
    email: "sofia.almeida@example.com",
    location: "Lissabon (Remote)",
    shortProfile:
      "Senior Java-Entwicklerin mit Erfahrung in Legacy-Modernisierung großer Versicherungsplattformen.",
    skills: ["Java", "Spring", "DDD", "Legacy Modernization", "Mentoring"],
    yearsExperience: 9,
    uploadedAt: "2025-04-30",
  },
  {
    id: "a4",
    name: "Marko Petrović",
    email: "marko.p@example.com",
    location: "Wien",
    shortProfile:
      "Data Analyst mit Wirtschaftsinformatik-Hintergrund, erste Berufserfahrung in einer Beratung.",
    skills: ["SQL", "Power BI", "Python", "Storytelling"],
    yearsExperience: 2,
    uploadedAt: "2025-05-01",
  },
];

export type GuidePhase = { phase: string; duration: string; goal: string; notes: string[] };

export const interviewGuide: GuidePhase[] = [
  {
    phase: "Ankommen & Rahmen setzen",
    duration: "5 Min",
    goal: "Vertrauensvolle Atmosphäre schaffen, Ablauf transparent machen.",
    notes: [
      "Vorstellung Interviewpanel und Rollen",
      "Ablauf des Gesprächs in 1 Minute skizzieren",
      "Offenheit für Rückfragen jederzeit signalisieren",
    ],
  },
  {
    phase: "Werdegang & Motivation",
    duration: "10 Min",
    goal: "Roten Faden im Lebenslauf verstehen und Motivation für die Rolle einordnen.",
    notes: [
      "Frage nach bewussten Wechselgründen",
      "Was war an der bisherigen Rolle besonders prägend?",
      "Was reizt konkret an Metafinanz / dieser Position?",
    ],
  },
  {
    phase: "Fachliche Tiefe",
    duration: "20 Min",
    goal: "Hypothesen aus Stage 1 verifizieren – v. a. Architektur-Entscheidungen und Plattform-Denken.",
    notes: [
      "Konkrete Projektbeispiele anhand des CV vertiefen",
      "Trade-offs in Architekturentscheidungen erklären lassen",
      "Umgang mit technischen Schulden besprechen",
    ],
  },
  {
    phase: "Zusammenarbeit & Soft Skills",
    duration: "15 Min",
    goal: "Signal zur Teampassung und Kommunikationsstil sammeln.",
    notes: [
      "Behaviourale Fragen zu Konflikten und Stakeholder-Arbeit",
      "Beispiele für Wissensweitergabe einfordern",
      "Reflexionsfähigkeit beobachten",
    ],
  },
  {
    phase: "Kandidat:innen-Fragen & Abschluss",
    duration: "10 Min",
    goal: "Raum für Fragen, nächste Schritte transparent machen.",
    notes: [
      "Fragen ernst nehmen und ehrlich beantworten",
      "Zeitlicher Ausblick auf Entscheidung",
      "Kontaktperson für Rückfragen benennen",
    ],
  },
];

export type Question = {
  id: string;
  question: string;
  why: string;
  reference: string;
  scenarioTag?: string;
};

export const top10Questions: Question[] = [
  {
    id: "q1",
    question: "Erzähl uns von einer Data Platform, die du maßgeblich mitgestaltet hast – welche Architekturentscheidung würdest du heute anders treffen?",
    why: "Prüft Reflexionsfähigkeit und Architektur-Denken jenseits der reinen Toolerfahrung.",
    reference: "CV: Tech Lead Data Platform (2022–2024)",
    scenarioTag: "Deep Dive",
  },
  {
    id: "q2",
    question: "Wie hast du in deinem letzten Projekt mit nicht-technischen Stakeholdern Anforderungen geschärft?",
    why: "Adressiert Stage-1-Hypothese: Stakeholder-Kommunikation als Stärke.",
    reference: "Stage 1: 'wirkt sehr kommunikativ'",
    scenarioTag: "Stakeholder",
  },
  {
    id: "q3",
    question: "Beschreibe eine Situation, in der ihr im Team über die richtige technische Richtung uneinig wart. Wie wurde die Entscheidung getroffen?",
    why: "Signalfrage zu Konfliktverhalten und Entscheidungsstil.",
    reference: "Team: Wert 'Eigenverantwortung'",
    scenarioTag: "Konflikt",
  },
  {
    id: "q4",
    question: "Was bedeutet für dich 'verlässliche Daten' in einem regulierten Umfeld wie der Versicherungsbranche?",
    why: "Verbindet Domänenkontext mit fachlicher Haltung.",
    reference: "Job: Senior Data Engineer (regulatorischer Kontext)",
  },
  {
    id: "q5",
    question: "Wie gehst du vor, wenn du in einem bestehenden Team mit etablierten Mustern startest, die du als verbesserungswürdig empfindest?",
    why: "Soft-Skill-Signal: Demut, Veränderungskompetenz, Geduld.",
    reference: "Team: Interviewstil 'kollaborativ'",
    scenarioTag: "Vertrauensaufbau",
  },
  {
    id: "q6",
    question: "Wenn du an deinen letzten Architektur-Review denkst – welches Feedback war für dich besonders wertvoll?",
    why: "Zeigt Lernhaltung und Umgang mit Kritik.",
    reference: "CV: 'Mentoring' als Skill ausgewiesen",
  },
  {
    id: "q7",
    question: "Wie misst du den Erfolg einer internen Datenplattform aus Sicht der nutzenden Teams?",
    why: "Produktdenken statt reines Tooling-Mindset.",
    reference: "Job: 'enge Zusammenarbeit mit Fachteams'",
  },
  {
    id: "q8",
    question: "Beschreibe eine Situation mit unvollständigen Anforderungen – wie bist du damit umgegangen?",
    why: "Test auf Umgang mit Ambiguität.",
    reference: "Stage 1: 'Hypothese – Ambiguitätstoleranz prüfen'",
    scenarioTag: "Ambiguität",
  },
  {
    id: "q9",
    question: "Was war dein wichtigster Beitrag zur Wissensweitergabe im letzten Team?",
    why: "Wert 'Wissensaustausch' verifizieren.",
    reference: "Team: Wert 'Wissensaustausch'",
  },
  {
    id: "q10",
    question: "Was müsste in den ersten 6 Monaten passieren, damit du sagst: das war die richtige Entscheidung?",
    why: "Erwartungsmanagement und Selbstbild für die Rolle.",
    reference: "Workspace-Leitfrage: 'Passt die Person zu Team und Unternehmen?'",
  },
  {
    id: "q11",
    question:
      "Wenn du auf deinen Lebenslauf schaust: Welche beruflichen Uebergaenge oder Pausen sollten wir richtig verstehen?",
    why: "Klaert moegliche CV-Luecken respektvoll, ohne private oder AGG-kritische Gruende abzufragen.",
    reference: "CV: Zeitliche Stationen und Wechselgruende pruefen",
    scenarioTag: "CV-Luecken",
  },
];

export const softSkillQuestions = [
  "Wie reagierst du, wenn du in einer Diskussion fachlich überstimmt wirst, aber inhaltlich überzeugt bleibst?",
  "Welche Art von Feedback fällt dir am schwersten anzunehmen – und warum?",
  "Wie sorgst du dafür, dass leisere Stimmen in einem Meeting gehört werden?",
];

export const behaviouralQuestions = [
  "Erzähl von einer Situation, in der du eine Deadline nicht halten konntest. Was hast du daraus gelernt?",
  "Beschreibe ein Projekt, das du übernommen hast, obwohl es organisatorisch unklar war.",
  "Nenn ein Beispiel, in dem du proaktiv ein Problem adressiert hast, bevor es eskalierte.",
];

export const cultureFitQuestions = [
  "Was bedeutet für dich Verlässlichkeit im Arbeitsalltag?",
  "Wie erlebst du dich selbst in der Rolle als Wissensgeber:in im Team?",
  "Welche Art von Team bringt dich am besten zur Höchstleistung?",
];

export type Scenario = { title: string; goal: string; description: string; signals: string[] };

export const scenarios: Scenario[] = [
  {
    title: "Vertrauensaufbau",
    goal: "Gesprächsbasis schaffen, ehrliches Sprechen ermöglichen.",
    description:
      "Eröffne mit einer offenen Frage zum bisherigen Werdegang. Höre länger zu als üblich. Achte auf Anschlussfragen statt Bewertung.",
    signals: ["Offenheit", "Selbstreflexion", "Klarheit in der Erzählung"],
  },
  {
    title: "Deep Dive Fachlichkeit",
    goal: "Tiefe statt Breite – Architekturentscheidungen nachvollziehen.",
    description:
      "Wähle ein Projekt aus dem CV und gehe gemeinsam in die Trade-offs. Bitte um Skizzen oder Beispiele.",
    signals: ["Begründete Trade-offs", "Pragmatismus", "Architektur-Denken"],
  },
  {
    title: "Ambiguität testen",
    goal: "Umgang mit unklaren Anforderungen beobachten.",
    description:
      "Stelle ein bewusst unterspezifiziertes Szenario vor (z. B. 'Datenqualitätsproblem unbekannter Ursache') und beobachte das Vorgehen.",
    signals: ["Strukturierte Vorgehensweise", "Sinnvolle Rückfragen", "Hypothesenbildung"],
  },
  {
    title: "Stakeholder-/Konfliktsituation",
    goal: "Kommunikations- und Konfliktverhalten einordnen.",
    description:
      "Beschreibe einen Stakeholder-Konflikt zwischen Fachbereich und Tech. Frage nach Vorgehen, nicht nach 'der Lösung'.",
    signals: ["Empathie", "Klarheit in Kommunikation", "Lösungsorientierung"],
  },
];

export const positiveSignals = [
  "Mehrjährige Erfahrung im regulierten Umfeld (Versicherung) deckt sich mit Job-Kontext.",
  "Stage-1-Notizen heben strukturiertes Denken und ruhigen Auftritt hervor.",
  "Skill-Profil (Azure, Databricks, dbt) passt zur Plattform-Roadmap des Teams.",
  "Mehrfach Mentoring-Verantwortung – passt zum Teamwert 'Wissensaustausch'.",
];

export const openRisks = [
  "Konkrete Erfahrung mit DataOps-Praktiken im CV nicht eindeutig – im Interview verifizieren.",
  "Wechselmotivation bisher nur knapp adressiert – im Gespräch vertiefen.",
  "Stakeholder-Arbeit mit Fachbereichen außerhalb Tech bisher wenig sichtbar – konkret nachfragen.",
  "Zeitliche Luecken, Uebergaenge oder unklare Stationen im Lebenslauf offen und AGG-konform klaeren.",
];

export const interviewPanel = [
  { role: "Hiring Manager", name: "Dr. Anna Vollmer", focus: "Rollenpassung, Erwartungen, Entwicklungspfad" },
  { role: "Team Lead", name: "Markus Hentschel", focus: "Fachliche Tiefe, Architekturdenken" },
  { role: "Peer Engineer", name: "Yusuf Demir", focus: "Zusammenarbeit, Pairing-Verhalten" },
  { role: "Stakeholder Fachbereich", name: "Claudia Reiß", focus: "Kommunikation Richtung Business" },
];

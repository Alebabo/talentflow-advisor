import type { Application, GuidePhase, Job, Question, Team } from "@/lib/mock-data";

export const INTERVIEW_ONEPAGER_MASTER_PROMPT_VERSION = "interview-onepager-v1";

export const INTERVIEW_ONEPAGER_MASTER_PROMPT = [
  "Du bist ein Interview-Co-Pilot fuer metafinanz Recruiting.",
  "",
  "Aufgabe:",
  "Erstelle aus Kandidat:innenprofil, Jobprofil, Teamkontext, Stage-1-Kommentaren und dem bestehenden Interview-Leitfaden einen kompakten Interview-Steckbrief als Onepager fuer Interviewer:innen.",
  "",
  "Wichtige Logik:",
  "- Der bestehende Interview-Leitfaden ist die Hauptquelle.",
  "- Der Onepager ist keine zweite Vollgenerierung, sondern eine kuratierte Kurzfassung.",
  "- Waehle aus dem Leitfaden die 6 staerksten Fragen aus.",
  "- Ergaenze nur dann maximal 1-2 neue Fragen, wenn im Leitfaden ein wichtiger Pruefpunkt fehlt.",
  "",
  "Priorisiere Fragen, die:",
  "- direkt zur Rolle passen,",
  "- offene Hypothesen aus Stage 1 pruefen,",
  "- konkrete berufliche Evidenz sichtbar machen,",
  "- Teamfit, Zukunftskompetenzen und metafinanz-Bezug abdecken,",
  "- fuer Interviewer:innen schnell verstaendlich sind.",
  "",
  "AGG- und Compliance-Regeln:",
  "- Stelle keine Fragen zu Alter, Herkunft, Religion, Gesundheit, Familienstand, Schwangerschaft, politischer Einstellung oder anderen geschuetzten Merkmalen.",
  "- Stelle nur Fragen mit klarem Bezug zu beruflicher Erfahrung, Rolle, Teamarbeit, Motivation oder beobachtbarem Verhalten.",
  "- Formuliere offen, konkret und interviewtauglich.",
  "- Vermeide Bewertungen ohne Evidenz.",
  "- Vermeide lange Fliesstexte.",
  "",
  "Output-Schema:",
  "1. Gespraechsfokus als 3-4 Stichpunkte.",
  "2. Genau 6 priorisierte Interviewfragen.",
  "3. Pro Frage: Frage, kurze Begruendung, Quelle oder Bezug.",
  "4. Drei offene Risiken oder Hypothesen.",
  "5. Empfohlener Gespraechsablauf in 5 Phasen.",
  "",
  "Stil:",
  "- Kurz, praezise, stichpunktartig.",
  "- Keine Marketing-Sprache.",
  "- Keine langen Erklaertexte.",
  "- Der Onepager muss vor einem Interview in wenigen Minuten lesbar sein.",
].join("\n");

export type InterviewOnepagerPromptContext = {
  application?: Application;
  job?: Job;
  team?: Team;
  teamContext: string;
  stage1Comments: string;
  interviewGuide: GuidePhase[];
  questions: Question[];
  openRisks: string[];
};

export function buildInterviewOnepagerPromptContext({
  application,
  job,
  team,
  teamContext,
  stage1Comments,
  interviewGuide,
  questions,
  openRisks,
}: InterviewOnepagerPromptContext) {
  return [
    INTERVIEW_ONEPAGER_MASTER_PROMPT,
    "",
    "Eingabedaten:",
    JSON.stringify(
      {
        kandidat: application
          ? {
              name: application.name,
              location: application.location,
              shortProfile: application.shortProfile,
              skills: application.skills,
              yearsExperience: application.yearsExperience,
            }
          : null,
        job: job
          ? {
              title: job.title,
              company: job.company,
              location: job.location,
              seniority: job.seniority,
              shortDescription: job.shortDescription,
            }
          : null,
        team: team
          ? {
              name: team.name,
              businessUnit: team.businessUnit,
              description: team.description,
              values: team.values,
              interviewStyle: team.interviewStyle,
              focusAreas: team.focusAreas,
            }
          : null,
        teamContext,
        stage1Comments,
        interviewGuide,
        candidateQuestionsFromGuide: questions,
        openRisks,
      },
      null,
      2,
    ),
  ].join("\n");
}

import type { Application, GuidePhase, Job, Question, Team } from "@/lib/mock-data";
import { maskInterviewPrompt } from "@/lib/prompt-privacy";

export const INTERVIEW_ONEPAGER_MASTER_PROMPT_VERSION = "interview-onepager-v3";

export const INTERVIEW_ONEPAGER_MASTER_PROMPT = [
  "Du bist ein Interview-Co-Pilot fuer metafinanz Recruiting.",
  "",
  "Aufgabe:",
  "Erstelle aus Kandidat:innenprofil, Jobprofil, Teamkontext, Stage-1-Kommentaren und dem bestehenden Interview-Leitfaden einen kompakten Interview-Steckbrief als Onepager fuer Interviewer:innen.",
  "",
  "Wichtige Logik:",
  "- Der bestehende Interview-Leitfaden ist die Hauptquelle.",
  "- Der Onepager ist keine zweite Vollgenerierung, sondern eine kuratierte Kurzfassung.",
  "- Waehle aus dem Leitfaden hoechstens 6 starke Fragen aus.",
  "- Die Fragen sollen ausgewogen sein: bevorzugt 3 technische bzw. job-spezifische Fragen, 2 Soft-Skill-Fragen und 1 Team-/Culture-Fit-Frage.",
  "- Ergaenze nur dann maximal 1-2 neue Fragen, wenn im Leitfaden ein wichtiger Pruefpunkt fehlt.",
  "- Tech- und Fachfragen duerfen Soft Skills, Zusammenarbeit, Motivation und Reflexion nicht verdraengen.",
  "- Pruefe den Lebenslauf auf zeitliche Luecken, abrupte Wechsel oder unklare Stationen und adressiere sie AGG-konform in Risiken oder in einer passenden Frage.",
  "",
  "Priorisiere Fragen, die:",
  "- direkt zur Rolle passen,",
  "- offene Hypothesen aus Stage 1 pruefen,",
  "- konkrete berufliche Evidenz sichtbar machen,",
  "- Teamfit, Zukunftskompetenzen und metafinanz-Bezug abdecken,",
  "- die Obergrenze von 6 Fragen einhalten und Soft Skills nicht durch Tech-Fragen verdraengen,",
  "- moegliche Lebenslauf-Luecken respektvoll und berufsbezogen klaeren,",
  "- fuer Interviewer:innen schnell verstaendlich sind.",
  "",
  "AGG- und Compliance-Regeln:",
  "- Stelle keine Fragen zu Alter, Herkunft, Religion, Gesundheit, Familienstand, Schwangerschaft, politischer Einstellung oder anderen geschuetzten Merkmalen.",
  "- Stelle nur Fragen mit klarem Bezug zu beruflicher Erfahrung, Rolle, Teamarbeit, Motivation oder beobachtbarem Verhalten.",
  "- Sprich Lebenslauf-Luecken nie wertend an; frage nach beruflichem Kontext, Lernmomenten und Uebergangsentscheidungen.",
  "- Formuliere offen, konkret und interviewtauglich.",
  "- Vermeide Bewertungen ohne Evidenz.",
  "- Vermeide lange Fliesstexte.",
  "",
  "Output-Schema:",
  "1. Gespraechsfokus als 3-4 Stichpunkte.",
  "2. Hoechstens 6 priorisierte Interviewfragen: bevorzugt 3 technisch/job-spezifisch, 2 Soft Skills, 1 Team-/Culture-Fit.",
  "3. Pro Frage: Kategorie, Frage, kurze Begruendung, Quelle oder Bezug.",
  "4. Drei offene Risiken oder Hypothesen, inklusive CV-Luecken-Check falls unklar.",
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
  const prompt = [
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
  return maskInterviewPrompt(prompt, application);
}

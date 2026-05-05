import type { CvExtractionPayload, JobExtractionPayload } from "@/server/extraction.server";

export type TeamRecord = {
  business_unit: string | null;
  created_at: string;
  description: string | null;
  focus_areas: string[];
  id: string;
  interview_style: string | null;
  members: number | null;
  name: string;
  team_values: string[];
  updated_at: string;
  user_id: string;
};

export type PromptRecord = {
  created_at: string;
  description: string | null;
  id: string;
  is_active: boolean;
  name: string;
  prompt_key: string;
  system_prompt: string;
  target_scope: "candidate" | "general" | "job" | "team";
  team_id: string | null;
  updated_at: string;
  user_id: string;
};

export type CandidateTeamMatch = {
  matchedAreas: string[];
  score: number;
  summary: string;
  teamId: string;
  teamName: string;
};

export type CandidateInsights = {
  strengths: string[];
  teamMatches: CandidateTeamMatch[];
  weaknesses: string[];
};

export type InterviewGuideData = {
  applicantName: string;
  candidateSummary: string;
  experienceHighlights: string[];
  icebreakerQuestions: string[];
  focusQuestions: string[];
  jobTitle: string;
  matchingSkills: string[];
  missingSkills: string[];
  recruiterSignals: string[];
  roleSummary: string;
  strengths: string[];
  teamMatchSummary: string | null;
  teamSignals: string[];
  weaknesses: string[];
};

function normalizeList(values: Array<string | null | undefined>) {
  return values.map((value) => value?.trim()).filter((value): value is string => Boolean(value));
}

function dedupe(values: string[]) {
  return Array.from(new Set(values));
}

function scoreSkillOverlap(candidateSkills: string[], areas: string[]) {
  const normalizedCandidateSkills = new Set(candidateSkills.map((skill) => skill.toLowerCase()));
  const matchedAreas = dedupe(
    areas.filter((area) => normalizedCandidateSkills.has(area.toLowerCase())),
  );
  const score = areas.length === 0 ? 0 : Math.round((matchedAreas.length / areas.length) * 100);

  return {
    matchedAreas,
    score,
  };
}

export function buildCandidateInsights(
  candidate: CvExtractionPayload,
  teams: TeamRecord[],
): CandidateInsights {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const normalizedSkills = normalizeList(candidate.skills);
  const experienceEntries = candidate.experience ?? [];

  if (normalizedSkills.length > 0) {
    strengths.push(`Bringt relevante Skills mit: ${normalizedSkills.slice(0, 5).join(", ")}.`);
  }

  if (candidate.years_experience != null) {
    strengths.push(`${candidate.years_experience} Jahre dokumentierte Berufserfahrung im Profil.`);
  }

  const achievementHighlights = experienceEntries
    .flatMap((entry) => entry.achievements ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (achievementHighlights.length > 0) {
    strengths.push(`Konkrete Leistungsbelege vorhanden: ${achievementHighlights.join(" | ")}.`);
  }

  if (experienceEntries.length === 0) {
    weaknesses.push("Keine belastbaren Stationen aus dem Lebenslauf extrahiert.");
  }

  if (normalizedSkills.length < 3) {
    weaknesses.push("Skillprofil ist noch duenn und sollte im Interview vertieft werden.");
  }

  if (!candidate.summary) {
    weaknesses.push("Motivation und Profilnarrativ sind im CV nicht klar erkennbar.");
  }

  if (!candidate.location) {
    weaknesses.push("Standort oder Verfuegbarkeitskontext fehlen noch.");
  }

  const teamMatches = teams
    .map((team) => {
      const comparisonAreas = normalizeList([
        ...team.focus_areas,
        ...team.team_values,
        team.business_unit,
      ]);
      const overlap = scoreSkillOverlap(normalizedSkills, comparisonAreas);
      const summary =
        overlap.matchedAreas.length > 0
          ? `Passt vor allem zu ${team.name} ueber ${overlap.matchedAreas.slice(0, 3).join(", ")}.`
          : `Fuer ${team.name} fehlen im Profil noch klare Anker aus Teamfokus oder Werten.`;

      return {
        matchedAreas: overlap.matchedAreas,
        score: overlap.score,
        summary,
        teamId: team.id,
        teamName: team.name,
      } satisfies CandidateTeamMatch;
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  if (teamMatches.length === 0) {
    weaknesses.push("Noch keine Teams vorhanden, daher kein Matching moeglich.");
  }

  return {
    strengths: strengths.slice(0, 4),
    teamMatches,
    weaknesses: weaknesses.slice(0, 4),
  };
}

export function buildFallbackGuide({
  application,
  job,
  recruiterSignals,
  team,
}: {
  application: CvExtractionPayload;
  job: JobExtractionPayload;
  recruiterSignals: string[];
  team: TeamRecord | null;
}): InterviewGuideData {
  const candidateSkills = normalizeList(application.skills);
  const requiredSkills = normalizeList(job.required_skills);
  const normalizedCandidateSkills = new Set(candidateSkills.map((skill) => skill.toLowerCase()));
  const matchingSkills = requiredSkills.filter((skill) =>
    normalizedCandidateSkills.has(skill.toLowerCase()),
  );
  const missingSkills = requiredSkills.filter(
    (skill) => !normalizedCandidateSkills.has(skill.toLowerCase()),
  );
  const teamSignals = normalizeList([
    team?.description,
    team?.interview_style,
    ...(team?.focus_areas ?? []),
  ]).slice(0, 4);
  const experienceHighlights = (application.experience ?? [])
    .slice(0, 3)
    .map((entry) => [entry.role, entry.company].filter(Boolean).join(" bei "))
    .filter(Boolean);
  const insights = buildCandidateInsights(application, team ? [team] : []);
  const applicantName = application.full_name || "Kandidat:in";
  const jobTitle = job.title || "Rolle";
  const firstSkill = matchingSkills[0] || requiredSkills[0] || "deine Kernstaerken";
  const topMissingSkill = missingSkills[0];

  return {
    applicantName,
    candidateSummary: application.summary || "Keine Zusammenfassung im CV erkannt.",
    experienceHighlights,
    icebreakerQuestions: [
      `Wie war dein Weg bis zu dieser Bewerbung bei ${jobTitle}?`,
      `Welche Station aus deinem bisherigen Werdegang moechtest du zum Einstieg besonders hervorheben?`,
      `Was hat dich an der Rolle ${jobTitle} und an metafinanz spontan angesprochen?`,
    ],
    focusQuestions: [
      `Welche konkreten Beispiele kannst du fuer ${firstSkill} aus deiner bisherigen Praxis geben?`,
      topMissingSkill
        ? `Wie wuerdest du fehlende Erfahrung in ${topMissingSkill} in den ersten Monaten gezielt aufbauen?`
        : `Wo kann ${applicantName} in ${jobTitle} in den ersten 90 Tagen den groessten Beitrag leisten?`,
      recruiterSignals[0]
        ? `Welche konkreten Situationen belegen oder relativieren das Stage-1-Signal "${recruiterSignals[0]}"?`
        : "Welche Beispiele zeigen Ownership, Zusammenarbeit und Lernfaehigkeit in deinem Alltag?",
      team?.name
        ? `Wie wuerdest du dich auf die Arbeitsweise von ${team.name} einstellen?`
        : "In welchen Teamkonstellationen und Stakeholder-Situationen arbeitest du besonders wirksam?",
      `Welche Entscheidung aus einem deiner letzten Projekte wuerdest du heute wieder genauso treffen und warum?`,
      `Wie gehst du vor, wenn Anforderungen noch unklar sind, du aber trotzdem handlungsfaehig bleiben musst?`,
      `Woran wuerde ein Team nach wenigen Wochen merken, dass du einen guten Beitrag leistest?`,
    ],
    jobTitle,
    matchingSkills,
    missingSkills,
    recruiterSignals,
    roleSummary: job.summary || "Keine Zusammenfassung in der Jobbeschreibung erkannt.",
    strengths: insights.strengths,
    teamMatchSummary: insights.teamMatches[0]?.summary ?? null,
    teamSignals,
    weaknesses: insights.weaknesses,
  };
}

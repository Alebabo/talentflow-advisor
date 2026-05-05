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
  const matchingSkills = requiredSkills.filter((skill) => normalizedCandidateSkills.has(skill.toLowerCase()));
  const missingSkills = requiredSkills.filter((skill) => !normalizedCandidateSkills.has(skill.toLowerCase()));
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

  return {
    applicantName,
    candidateSummary: application.summary || "Keine Zusammenfassung im CV erkannt.",
    experienceHighlights,
    focusQuestions: [
      `Welche konkreten Beispiele zeigt ${applicantName} fuer ${matchingSkills[0] || requiredSkills[0] || "die Kernanforderungen"}?`,
      missingSkills[0]
        ? `Wie wuerde ${applicantName} fehlende Erfahrung in ${missingSkills[0]} aufholen?`
        : `Wo kann ${applicantName} in ${jobTitle} in den ersten 90 Tagen den groessten Beitrag leisten?`,
      recruiterSignals[0]
        ? `Wie laesst sich das Stage-1-Signal "${recruiterSignals[0]}" durch Verhaltensbeispiele validieren?`
        : "Welche Beispiele zeigen Ownership, Zusammenarbeit und Lernfaehigkeit?",
      team?.name
        ? `Wie wuerde ${applicantName} mit der Arbeitsweise von ${team.name} umgehen?`
        : "Welche Teamdynamik und welche Stakeholder-Situationen liegen der Person besonders?",
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

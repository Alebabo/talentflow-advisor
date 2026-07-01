import type { Application, Job, Question, Team } from "@/lib/mock-data";

export type InterviewRecommendationContext = {
  application?: Application;
  job?: Job;
  team?: Team;
  stage1: string;
  questions: Question[];
};

const FUTURE_AND_METAFINANZ_SIGNALS = [
  "zukunft",
  "metafinanz",
  "stakeholder",
  "team",
  "plattform",
  "architektur",
  "entscheidung",
  "ambigu",
  "werte",
  "wissensaustausch",
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function scoreQuestion(question: Question, context: InterviewRecommendationContext) {
  const haystack = normalize(
    [
      question.question,
      question.why,
      question.reference,
      question.scenarioTag ?? "",
      context.job?.title ?? "",
      context.job?.shortDescription ?? "",
      context.team?.name ?? "",
      context.team?.description ?? "",
      context.team?.values.join(" ") ?? "",
      context.team?.focusAreas.join(" ") ?? "",
      context.application?.skills.join(" ") ?? "",
      context.stage1,
    ].join(" "),
  );

  let score = 0;

  for (const skill of context.application?.skills ?? []) {
    if (haystack.includes(normalize(skill))) score += 2;
  }

  for (const signal of FUTURE_AND_METAFINANZ_SIGNALS) {
    if (haystack.includes(signal)) score += 1;
  }

  if (question.scenarioTag) score += 1;
  if (haystack.includes("stage 1") || haystack.includes("hypothese")) score += 2;
  if (haystack.includes("team: wert")) score += 1;
  if (haystack.includes("job:")) score += 1;

  return score;
}

export function getRecommendedQuestionIds(context: InterviewRecommendationContext) {
  return context.questions
    .map((question, index) => ({
      id: question.id,
      index,
      score: scoreQuestion(question, context),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 6)
    .map((item) => item.id);
}

export function createInterviewSummaryText({
  application,
  job,
  team,
  stage1,
}: Omit<InterviewRecommendationContext, "questions">) {
  const skills = application?.skills.slice(0, 4).join(", ") || "relevante Skills";
  const stageSignal = stage1.trim()
    ? "Stage-1: strukturiertes Denken, offene Hypothesen pruefen"
    : "Stage-1: noch keine belastbaren Kommentare";

  return [
    `- Rolle: ${job?.title ?? "Rolle"} im Team ${team?.name ?? "Fachbereich"}`,
    "- Fokus: fachliche Tiefe, Teamfit, Zukunftskompetenzen",
    `- Skills: ${skills}`,
    `- ${stageSignal}`,
  ].join("\n");
}

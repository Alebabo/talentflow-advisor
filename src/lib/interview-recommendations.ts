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

const SOFT_SKILL_SIGNALS = [
  "soft",
  "konflikt",
  "feedback",
  "reflexion",
  "motivation",
  "kommunikation",
  "kritik",
  "stakeholder",
  "ambigu",
  "lern",
];

const TECHNICAL_OR_JOB_SIGNALS = [
  "job:",
  "cv:",
  "data",
  "daten",
  "plattform",
  "architektur",
  "technisch",
  "fachlich",
  "reguliert",
  "versicher",
  "anforderung",
  "stakeholder",
  "tooling",
  "produktdenken",
];

const TEAM_CULTURE_SIGNALS = [
  "team:",
  "teamfit",
  "culture",
  "fit",
  "werte",
  "metafinanz",
  "wissensaustausch",
  "vertrauensaufbau",
  "kollaborativ",
  "ersten 6 monaten",
  "unternehmen",
];

const CV_GAP_SIGNALS = ["luecke", "lucke", "wechsel", "uebergang", "station", "lebenslauf"];

const QUESTION_TARGETS = {
  technical: 4,
  soft: 2,
  culture: 2,
};

const QUESTION_CATEGORY_BY_ID: Record<string, keyof typeof QUESTION_TARGETS> = {
  q1: "technical",
  q2: "technical",
  q4: "technical",
  q7: "technical",
  q3: "soft",
  q6: "soft",
  q8: "soft",
  q5: "culture",
  q9: "culture",
  q10: "culture",
  q11: "soft",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function questionText(question: Question) {
  return normalize(
    [question.question, question.why, question.reference, question.scenarioTag ?? ""].join(" "),
  );
}

function isSoftSkillQuestion(question: Question) {
  const category = QUESTION_CATEGORY_BY_ID[question.id];
  if (category) return category === "soft";
  const text = questionText(question);
  return SOFT_SKILL_SIGNALS.some((signal) => text.includes(signal));
}

function isTechnicalOrJobQuestion(question: Question) {
  const category = QUESTION_CATEGORY_BY_ID[question.id];
  if (category) return category === "technical";
  const text = questionText(question);
  return TECHNICAL_OR_JOB_SIGNALS.some((signal) => text.includes(signal));
}

function isTeamCultureQuestion(question: Question) {
  const category = QUESTION_CATEGORY_BY_ID[question.id];
  if (category) return category === "culture";
  const text = questionText(question);
  return TEAM_CULTURE_SIGNALS.some((signal) => text.includes(signal));
}

function isCvGapQuestion(question: Question) {
  const text = questionText(question);
  return CV_GAP_SIGNALS.some((signal) => text.includes(signal));
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
  if (isSoftSkillQuestion(question)) score += 2;
  if (isCvGapQuestion(question)) score += 2;

  return score;
}

export function getRecommendedQuestionIds(context: InterviewRecommendationContext) {
  const scoredQuestions = context.questions
    .map((question, index) => ({
      question,
      id: question.id,
      index,
      score: scoreQuestion(question, context),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const selected = new Map<string, (typeof scoredQuestions)[number]>();

  const takeQuestions = (predicate: (question: Question) => boolean, count: number) => {
    let added = 0;
    for (const item of scoredQuestions) {
      if (selected.size >= 8) break;
      if (selected.has(item.id) || !predicate(item.question)) continue;
      selected.set(item.id, item);
      added += 1;
      if (added >= count) return;
    }
  };

  takeQuestions(isTechnicalOrJobQuestion, QUESTION_TARGETS.technical);
  takeQuestions(isSoftSkillQuestion, QUESTION_TARGETS.soft);
  takeQuestions(isTeamCultureQuestion, QUESTION_TARGETS.culture);

  for (const item of scoredQuestions) {
    if (selected.size >= 8) break;
    if (!selected.has(item.id)) selected.set(item.id, item);
  }

  return [...selected.values()]
    .sort((a, b) => a.index - b.index)
    .map((item) => item.id);
}

export function createCvGapReviewText(application?: Application) {
  const profile = application?.shortProfile.trim();
  if (!application) return "Lebenslauf-Luecken: CV auswaehlen und Stationen pruefen.";
  if (!profile) return "Lebenslauf-Luecken: Stationen, Wechsel und Zeitraeume im CV klaeren.";

  return "Lebenslauf-Luecken: Stationen, Wechselgruende und unklare Zeitraeume offen und AGG-konform ansprechen.";
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
    "- Fokus: fachliche Tiefe, Teamfit, Soft Skills und Zukunftskompetenzen",
    `- Skills: ${skills}`,
    `- ${createCvGapReviewText(application)}`,
    `- ${stageSignal}`,
  ].join("\n");
}

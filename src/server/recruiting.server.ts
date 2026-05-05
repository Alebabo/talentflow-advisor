import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ExtractionError,
  allowedMimeTypes,
  decodeBase64File,
  type CvExtractionPayload,
  type JobExtractionPayload,
  type ListedDocument,
} from "@/server/extraction.server";
import { defaultQuestionPrompts } from "@/lib/default-question-prompts";
import { buildFallbackGuide, type InterviewGuideData, type PromptRecord, type TeamRecord } from "@/lib/recruiting";

const teamUploadInputSchema = z.object({
  fileBase64: z.string().min(1),
  filename: z.string().trim().min(1).max(255),
  mimeType: z.enum(allowedMimeTypes),
});

const generateGuideInputSchema = z.object({
  applicationId: z.string().uuid(),
  jobId: z.string().uuid(),
  recruiterNotes: z.string().optional().default(""),
  teamId: z.string().uuid().optional().nullable(),
});

const applicationStatusSchema = z.enum(["new", "screening", "interview", "offer", "hired", "rejected", "withdrawn"]);

const updateApplicationStatusInputSchema = z.object({
  documentId: z.string().uuid(),
  status: applicationStatusSchema,
});

export { applicationStatusSchema, generateGuideInputSchema, teamUploadInputSchema, updateApplicationStatusInputSchema };

const teamToolSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: ["string", "null"] },
    business_unit: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    team_values: { type: "array", items: { type: "string" } },
    interview_style: { type: ["string", "null"] },
    focus_areas: { type: "array", items: { type: "string" } },
    members: { type: ["integer", "null"] },
  },
  required: ["name", "business_unit", "description", "team_values", "interview_style", "focus_areas", "members"],
} as const;

const guideToolSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    applicantName: { type: "string" },
    jobTitle: { type: "string" },
    candidateSummary: { type: "string" },
    roleSummary: { type: "string" },
    matchingSkills: { type: "array", items: { type: "string" } },
    missingSkills: { type: "array", items: { type: "string" } },
    focusQuestions: { type: "array", items: { type: "string" } },
    experienceHighlights: { type: "array", items: { type: "string" } },
    recruiterSignals: { type: "array", items: { type: "string" } },
    teamSignals: { type: "array", items: { type: "string" } },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    teamMatchSummary: { type: ["string", "null"] },
  },
  required: [
    "applicantName",
    "jobTitle",
    "candidateSummary",
    "roleSummary",
    "matchingSkills",
    "missingSkills",
    "focusQuestions",
    "experienceHighlights",
    "recruiterSignals",
    "teamSignals",
    "strengths",
    "weaknesses",
    "teamMatchSummary",
  ],
} as const;

async function extractTextForModel(mimeType: string, buffer: Buffer) {
  if (mimeType === "application/pdf") {
    return null;
  }

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  return new TextDecoder().decode(buffer).trim();
}

async function callGeminiTool<T>({
  apiKey,
  messages,
  parameters,
  toolName,
  toolDescription,
}: {
  apiKey: string;
  messages: Array<
    | { role: "system"; content: string }
    | {
        role: "user";
        content: Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        >;
      }
  >;
  parameters: object;
  toolDescription: string;
  toolName: string;
}) {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gemini-2.5-pro",
      temperature: 0.2,
      messages,
      tools: [
        {
          type: "function",
          function: {
            name: toolName,
            description: toolDescription,
            parameters,
            strict: true,
          },
        },
      ],
      tool_choice: {
        type: "function",
        function: {
          name: toolName,
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ExtractionError("INTERNAL", `Gemini-Aufruf fehlgeschlagen (${response.status}): ${body}`, response.status);
  }

  const payload = await response.json();
  const rawArguments = payload?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;

  if (!rawArguments) {
    throw new ExtractionError("INVALID_RESPONSE", "Die KI hat kein strukturiertes Ergebnis geliefert.", 502);
  }

  try {
    return JSON.parse(rawArguments) as T;
  } catch {
    throw new ExtractionError("INVALID_RESPONSE", "Die KI-Antwort konnte nicht geparst werden.", 502);
  }
}

export async function ensureDefaultPrompts(supabase: SupabaseClient, userId: string) {
  const { data: existingRows, error: readError } = await supabase
    .from("question_generation_system_prompts")
    .select("prompt_key")
    .eq("user_id", userId);

  if (readError) {
    throw new ExtractionError("INTERNAL", "Prompts konnten nicht geladen werden.", 500);
  }

  const existingKeys = new Set((existingRows ?? []).map((row) => row.prompt_key));
  const missing = defaultQuestionPrompts.filter((prompt) => !existingKeys.has(prompt.promptKey));

  if (missing.length === 0) {
    return;
  }

  const { error } = await supabase.from("question_generation_system_prompts").insert(
    missing.map((prompt) => ({
      user_id: userId,
      team_id: null,
      name: prompt.name,
      prompt_key: prompt.promptKey,
      description: prompt.description,
      target_scope: prompt.targetScope,
      system_prompt: prompt.systemPrompt,
      is_active: true,
    })),
  );

  if (error) {
    throw new ExtractionError("INTERNAL", "Default-Prompts konnten nicht angelegt werden.", 500);
  }
}

export async function listTeams(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<TeamRecord[]>();

  if (error) {
    throw new ExtractionError("INTERNAL", "Teams konnten nicht geladen werden.", 500);
  }

  return data ?? [];
}

export async function listQuestionPrompts(supabase: SupabaseClient, userId: string) {
  await ensureDefaultPrompts(supabase, userId);

  const { data, error } = await supabase
    .from("question_generation_system_prompts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .returns<PromptRecord[]>();

  if (error) {
    throw new ExtractionError("INTERNAL", "Prompt-Tabelle konnte nicht geladen werden.", 500);
  }

  return data ?? [];
}

export async function createTeamFromUpload({
  supabase,
  userId,
  filename,
  fileBase64,
  mimeType,
  apiKey,
}: {
  apiKey: string;
  fileBase64: string;
  filename: string;
  mimeType: string;
  supabase: SupabaseClient;
  userId: string;
}) {
  const buffer = decodeBase64File(fileBase64);
  const extractedText = await extractTextForModel(mimeType, buffer);
  const messages: Array<
    | { role: "system"; content: string }
    | {
        role: "user";
        content: Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        >;
      }
  > = [
    {
      role: "system",
      content: [
        "Extrahiere Teamkontext fuer Recruiting-Interviews.",
        "Leite nur arbeitsbezogene Informationen ab.",
        "Wenn Angaben fehlen, nutze null oder leere Arrays.",
        "Formuliere Teamname, Fokus, Werte und Interviewstil klar und kompakt.",
      ].join(" "),
    },
  ];

  if (mimeType === "application/pdf") {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: `Erzeuge aus diesem Teamdokument einen Teamdatensatz. Quelldatei: ${filename}` },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${buffer.toString("base64")}` } },
      ],
    });
  } else {
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: `Erzeuge aus diesem Teamdokument einen Teamdatensatz.\n\nDatei: ${filename}\n\n${extractedText || "(Kein lesbarer Text vorhanden)"}`,
        },
      ],
    });
  }

  const extracted = await callGeminiTool<{
    business_unit: string | null;
    description: string | null;
    focus_areas: string[];
    interview_style: string | null;
    members: number | null;
    name: string | null;
    team_values: string[];
  }>({
    apiKey,
    messages,
    parameters: teamToolSchema,
    toolName: "extract_team_profile",
    toolDescription: "Extrahiert einen Teamdatensatz fuer Recruiting-Zwecke.",
  });

  const teamName = extracted.name?.trim() || filename.replace(/\.[^.]+$/, "");

  const { data, error } = await supabase
    .from("teams")
    .upsert(
      {
        user_id: userId,
        name: teamName,
        business_unit: extracted.business_unit,
        description: extracted.description,
        team_values: extracted.team_values ?? [],
        interview_style: extracted.interview_style,
        focus_areas: extracted.focus_areas ?? [],
        members: extracted.members,
      },
      {
        onConflict: "user_id,name",
      },
    )
    .select("*")
    .single<TeamRecord>();

  if (error || !data) {
    throw new ExtractionError("INTERNAL", "Team konnte nicht gespeichert werden.", 500);
  }

  return data;
}

async function getDocumentById(supabase: SupabaseClient, documentId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle();

  if (error || !data) {
    throw new ExtractionError("NOT_FOUND", "Dokument wurde nicht gefunden.", 404);
  }

  return data;
}

async function getExtractionDocument(supabase: SupabaseClient, documentId: string) {
  const document = await getDocumentById(supabase, documentId);

  if (document.kind === "cv") {
    const { data, error } = await supabase.from("cv_extractions").select("*").eq("document_id", documentId).maybeSingle();
    if (error || !data) {
      throw new ExtractionError("NOT_FOUND", "CV-Extraktion wurde nicht gefunden.", 404);
    }

    return { ...document, extraction: data } as ListedDocument;
  }

  const { data, error } = await supabase.from("job_extractions").select("*").eq("document_id", documentId).maybeSingle();
  if (error || !data) {
    throw new ExtractionError("NOT_FOUND", "Job-Extraktion wurde nicht gefunden.", 404);
  }

  return { ...document, extraction: data } as ListedDocument;
}

function buildPromptBlock(prompts: PromptRecord[], team: TeamRecord | null) {
  const generalPrompts = prompts.filter((prompt) => prompt.is_active && (prompt.team_id == null || prompt.team_id === team?.id));
  return generalPrompts
    .map((prompt) => `[${prompt.prompt_key}] ${prompt.system_prompt}`)
    .join("\n\n");
}

export async function generateInterviewGuide({
  supabase,
  userId,
  applicationId,
  jobId,
  recruiterNotes,
  teamId,
  apiKey,
}: {
  apiKey: string | null;
  applicationId: string;
  jobId: string;
  recruiterNotes: string;
  supabase: SupabaseClient;
  teamId: string | null;
  userId: string;
}) {
  await ensureDefaultPrompts(supabase, userId);

  const [applicationDocument, jobDocument, prompts, teams] = await Promise.all([
    getExtractionDocument(supabase, applicationId),
    getExtractionDocument(supabase, jobId),
    listQuestionPrompts(supabase, userId),
    listTeams(supabase, userId),
  ]);

  if (applicationDocument.kind !== "cv" || jobDocument.kind !== "job_description") {
    throw new ExtractionError("INTERNAL", "Falsche Dokumenttypen fuer die Leitfadengenerierung.", 400);
  }

  const application = applicationDocument.extraction as CvExtractionPayload;
  const job = jobDocument.extraction as JobExtractionPayload;
  const team = teamId ? teams.find((entry) => entry.id === teamId) ?? null : null;
  const recruiterSignals = recruiterNotes
    .split(/\n+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (!apiKey) {
    return buildFallbackGuide({
      application,
      job,
      recruiterSignals,
      team,
    });
  }

  const promptBlock = buildPromptBlock(prompts, team);
  const fallbackGuide = buildFallbackGuide({
    application,
    job,
    recruiterSignals,
    team,
  });

  const generated = await callGeminiTool<InterviewGuideData>({
    apiKey,
    messages: [
      {
        role: "system",
        content: [
          "Du erzeugst AGG-konforme Interviewvorbereitung fuer den Fachbereich.",
          "Nutze die folgenden gespeicherten Systemprompts als verbindliche Leitplanken:",
          promptBlock || "Keine zusaetzlichen Prompts vorhanden.",
        ].join("\n\n"),
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                candidate: application,
                job,
                recruiterSignals,
                team,
                fallbackGuide,
              },
              null,
              2,
            ),
          },
        ],
      },
    ],
    parameters: guideToolSchema,
    toolName: "generate_interview_guide",
    toolDescription: "Erzeugt strukturierte Interviewvorbereitung aus Kandidat, Job, Team und Prompts.",
  });

  return generated;
}

function isTerminalApplicationStatus(status: z.infer<typeof applicationStatusSchema>) {
  return status === "hired" || status === "rejected" || status === "withdrawn";
}

function buildFeedbackEmail({
  candidateName,
  status,
}: {
  candidateName: string;
  status: z.infer<typeof applicationStatusSchema>;
}) {
  if (status === "hired") {
    return {
      subject: "Update zu deinem Bewerbungsprozess",
      html: `<p>Hallo ${candidateName},</p><p>vielen Dank fuer den Bewerbungsprozess und den offenen Austausch.</p><p>Wir freuen uns, dir mitzuteilen, dass wir den Prozess mit dir erfolgreich abschliessen und die naechsten Schritte direkt mit dir teilen.</p><p>Viele Gruesse<br />TalentFlow Recruiting</p>`,
    };
  }

  if (status === "withdrawn") {
    return {
      subject: "Bestaetigung zum Abschluss deines Bewerbungsprozesses",
      html: `<p>Hallo ${candidateName},</p><p>vielen Dank fuer deine Zeit und deine Rueckmeldung.</p><p>Wir bestaetigen hiermit den Abschluss deines Bewerbungsprozesses und wuenschen dir fuer deinen weiteren Weg alles Gute.</p><p>Viele Gruesse<br />TalentFlow Recruiting</p>`,
    };
  }

  return {
    subject: "Feedback zu deinem Bewerbungsprozess",
    html: `<p>Hallo ${candidateName},</p><p>vielen Dank fuer deine Zeit und dein Interesse an unserem Bewerbungsprozess.</p><p>Wir haben den Prozess abgeschlossen und moechten dir fuer den Austausch danken. Fuer deinen weiteren Weg wuenschen wir dir viel Erfolg.</p><p>Viele Gruesse<br />TalentFlow Recruiting</p>`,
  };
}

async function sendFeedbackEmail({
  to,
  candidateName,
  status,
}: {
  candidateName: string;
  status: z.infer<typeof applicationStatusSchema>;
  to: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RECRUITING_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    throw new ExtractionError(
      "INTERNAL",
      "Feedback-Mail kann nicht gesendet werden. Bitte RESEND_API_KEY und RECRUITING_FROM_EMAIL konfigurieren.",
      500,
    );
  }

  const email = buildFeedbackEmail({
    candidateName,
    status,
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: email.subject,
      html: email.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ExtractionError("INTERNAL", `Feedback-Mail konnte nicht gesendet werden: ${body}`, response.status);
  }
}

export async function updateApplicationStatus({
  supabase,
  documentId,
  status,
}: {
  documentId: string;
  status: z.infer<typeof applicationStatusSchema>;
  supabase: SupabaseClient;
}) {
  const document = await getExtractionDocument(supabase, documentId);

  if (document.kind !== "cv") {
    throw new ExtractionError("INTERNAL", "Nur Bewerbungen koennen einen Bewerbungsstatus erhalten.", 400);
  }

  const { data: updatedDocument, error } = await supabase
    .from("documents")
    .update({
      application_status: status,
      application_status_updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .select("*")
    .single();

  if (error || !updatedDocument) {
    throw new ExtractionError("INTERNAL", "Bewerbungsstatus konnte nicht aktualisiert werden.", 500);
  }

  if (!isTerminalApplicationStatus(status)) {
    return {
      deleted: false,
      emailed: false,
      status,
      document: {
        ...document,
        ...updatedDocument,
      },
    };
  }

  const extraction = document.extraction as CvExtractionPayload;
  const email = extraction.email?.trim();

  if (!email) {
    throw new ExtractionError("INTERNAL", "Keine E-Mail-Adresse im Kandidatenprofil erkannt. Finalisierung abgebrochen.", 400);
  }

  await sendFeedbackEmail({
    to: email,
    candidateName: extraction.full_name || "Bewerber:in",
    status,
  });

  const { deleteStoredDocument } = await import("./extraction.server");
  await deleteStoredDocument(supabase, documentId);

  return {
    deleted: true,
    emailed: true,
    status,
    documentId,
    email,
  };
}

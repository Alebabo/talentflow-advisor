import mammoth from "mammoth";
import { createMiddleware } from "@tanstack/react-start";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

export const documentKindSchema = z.enum(["cv", "job_description"]);

function estimateBase64Size(base64: string) {
  const normalized = base64.replace(/\s/g, "");
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
  return Math.floor((normalized.length * 3) / 4) - padding;
}

export const uploadDocumentInputSchema = z.object({
  kind: documentKindSchema,
  filename: z.string().trim().min(1).max(255),
  fileBase64: z
    .string()
    .min(1)
    .refine((value) => estimateBase64Size(value) <= MAX_FILE_SIZE_BYTES, {
      message: "Datei darf maximal 10 MB groß sein.",
    }),
  mimeType: z.enum(allowedMimeTypes),
});

export const extractDocumentInputSchema = z.object({
  documentId: z.string().uuid(),
});

export const listDocumentsInputSchema = z.object({
  kind: documentKindSchema.optional(),
});

export const getDocumentInputSchema = z.object({
  id: z.string().uuid(),
});

export const deleteDocumentInputSchema = z.object({
  id: z.string().uuid(),
});

export type DocumentKind = z.infer<typeof documentKindSchema>;

export type CvExtractionPayload = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  years_experience: number | null;
  skills: string[];
  languages: string[];
  education: Array<{
    degree: string | null;
    institution: string | null;
    year: string | null;
  }>;
  experience: Array<{
    role: string | null;
    company: string | null;
    start: string | null;
    end: string | null;
    description: string | null;
    achievements: string[];
  }>;
  certifications: string[];
};

export type JobExtractionPayload = {
  title: string | null;
  company: string | null;
  location: string | null;
  employment_type: string | null;
  seniority: string | null;
  summary: string | null;
  responsibilities: string[];
  required_skills: string[];
  nice_to_have: string[];
  tech_stack: string[];
  benefits: string[];
  salary_range: string | null;
};

export type StoredDocument = {
  application_status:
    | "new"
    | "screening"
    | "interview"
    | "offer"
    | "hired"
    | "rejected"
    | "withdrawn";
  application_status_updated_at: string;
  id: string;
  user_id: string;
  kind: DocumentKind;
  filename: string;
  storage_path: string;
  mime_type: string;
  status: "uploaded" | "processing" | "extracted" | "failed";
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type ListedDocument = StoredDocument & {
  extraction: (CvExtractionRow | JobExtractionRow) | null;
};

export type CvExtractionRow = CvExtractionPayload & {
  id: string;
  document_id: string;
  raw_json: Record<string, unknown>;
  created_at: string;
};

export type JobExtractionRow = JobExtractionPayload & {
  id: string;
  document_id: string;
  raw_json: Record<string, unknown>;
  created_at: string;
};

export type AuthContext = {
  supabase: SupabaseClient;
  user: User;
};

export class ExtractionError extends Error {
  code: "RATE_LIMIT" | "CREDITS" | "UNAUTHORIZED" | "NOT_FOUND" | "INVALID_RESPONSE" | "INTERNAL";
  status: number;

  constructor(code: ExtractionError["code"], message: string, status = 500) {
    super(message);
    this.name = "ExtractionError";
    this.code = code;
    this.status = status;
  }
}

function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return [];
  }

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf("=");
      const name = separatorIndex >= 0 ? part.slice(0, separatorIndex) : part;
      const value = separatorIndex >= 0 ? part.slice(separatorIndex + 1) : "";
      return { name, value };
    });
}

function getSupabaseServerConfig() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return { supabaseUrl, supabasePublishableKey };
}

export function createRequestSupabaseClient(request: Request) {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseServerConfig();
  const cookies = parseCookieHeader(request.headers.get("cookie"));

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookies;
      },
      setAll() {
        return;
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "X-Client-Info": "talentflow-server-functions",
      },
    },
  });
}

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next, request }) => {
    const supabase = createRequestSupabaseClient(request);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new ExtractionError("UNAUTHORIZED", "Anmeldung erforderlich.", 401);
    }

    return next({
      context: {
        supabase,
        user,
      } satisfies AuthContext,
    });
  },
);

function sanitizeFileName(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

export function decodeBase64File(fileBase64: string) {
  return Buffer.from(fileBase64, "base64");
}

export function buildStoragePath(userId: string, documentId: string, filename: string) {
  return `${userId}/${documentId}/${sanitizeFileName(filename)}`;
}

async function extractDocxText(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

function extractTxtText(buffer: Buffer) {
  return new TextDecoder().decode(buffer).trim();
}

type UploadClassification = {
  detectedKind: DocumentKind | "unknown";
  confidence: "high" | "low";
  reason: string;
};

const cvKeywords = [
  "lebenslauf",
  "curriculum vitae",
  "cv ",
  "cv_",
  "resume",
  "berufserfahrung",
  "ausbildung",
  "kenntnisse",
  "sprachkenntnisse",
  "zertifikate",
  "profil",
  "kontakt",
];

const jobKeywords = [
  "job",
  "stelle",
  "rollenprofil",
  "stellenbeschreibung",
  "stellenanzeige",
  "jobbeschreibung",
  "ausschreibung",
  "deine aufgaben",
  "ihre aufgaben",
  "anforderungen",
  "qualifikationen",
  "wir bieten",
  "benefits",
  "bewerben",
  "m/w/d",
];

function countKeywordHits(source: string, keywords: string[]) {
  return keywords.reduce((total, keyword) => total + (source.includes(keyword) ? 1 : 0), 0);
}

function classifyByHeuristics({
  filename,
  text,
}: {
  filename: string;
  text: string | null;
}): UploadClassification {
  const normalizedFilename = filename.toLowerCase();
  const normalizedText = (text ?? "").toLowerCase();
  const combined = `${normalizedFilename}\n${normalizedText}`;

  if (
    normalizedFilename.includes("lebenslauf") ||
    normalizedFilename.includes("curriculum-vitae")
  ) {
    return {
      detectedKind: "cv",
      confidence: "high",
      reason: "Der Dateiname weist eindeutig auf einen CV hin.",
    };
  }

  if (
    normalizedFilename.includes("job") ||
    normalizedFilename.includes("stelle") ||
    normalizedFilename.includes("stellenbeschreibung") ||
    normalizedFilename.includes("stellenanzeige")
  ) {
    return {
      detectedKind: "job_description",
      confidence: "high",
      reason: "Der Dateiname weist eindeutig auf eine Jobbeschreibung hin.",
    };
  }

  const cvHits = countKeywordHits(combined, cvKeywords);
  const jobHits = countKeywordHits(combined, jobKeywords);

  if (cvHits === 0 && jobHits === 0) {
    return {
      detectedKind: "unknown",
      confidence: "low",
      reason: "Keine eindeutigen Schluesselbegriffe erkannt.",
    };
  }

  if (cvHits >= jobHits + 2) {
    return {
      detectedKind: "cv",
      confidence: cvHits >= 3 ? "high" : "low",
      reason: "Mehrere typische CV-Merkmale wurden erkannt.",
    };
  }

  if (jobHits >= cvHits + 2) {
    return {
      detectedKind: "job_description",
      confidence: jobHits >= 3 ? "high" : "low",
      reason: "Mehrere typische Merkmale einer Jobbeschreibung wurden erkannt.",
    };
  }

  return {
    detectedKind: "unknown",
    confidence: "low",
    reason: "Die Datei ist inhaltlich nicht eindeutig zuordenbar.",
  };
}

async function classifyPdfWithGemini({
  apiKey,
  buffer,
  filename,
  mimeType,
}: {
  apiKey: string;
  buffer: Buffer;
  filename: string;
  mimeType: string;
}) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gemini-2.5-pro",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "Klassifiziere Recruiting-Dokumente strikt als cv, job_description oder unknown. Antworte nur ueber den Tool-Call.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Ordne dieses Dokument ein. Dateiname: ${filename}`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${buffer.toString("base64")}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_document_kind",
              description: "Klassifiziert ein Dokument als Lebenslauf oder Jobbeschreibung.",
              parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                  detected_kind: { type: "string", enum: ["cv", "job_description", "unknown"] },
                  confidence: { type: "string", enum: ["high", "low"] },
                  reason: { type: "string" },
                },
                required: ["detected_kind", "confidence", "reason"],
              },
              strict: true,
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: {
            name: "classify_document_kind",
          },
        },
      }),
    },
  );

  if (!response.ok) {
    throw new ExtractionError(
      "INTERNAL",
      "Dokumenttyp konnte fuer PDF nicht validiert werden.",
      response.status,
    );
  }

  const payload = await response.json();
  const rawArguments = payload?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;

  if (!rawArguments) {
    throw new ExtractionError(
      "INVALID_RESPONSE",
      "Die Dokumenttyp-Pruefung hat kein Ergebnis geliefert.",
      502,
    );
  }

  const parsed = JSON.parse(rawArguments) as {
    confidence: "high" | "low";
    detected_kind: DocumentKind | "unknown";
    reason: string;
  };

  return {
    confidence: parsed.confidence,
    detectedKind: parsed.detected_kind,
    reason: parsed.reason,
  } satisfies UploadClassification;
}

export async function verifyUploadMatchesExpectedKind({
  expectedKind,
  filename,
  mimeType,
  buffer,
  apiKey,
}: {
  apiKey?: string;
  buffer: Buffer;
  expectedKind: DocumentKind;
  filename: string;
  mimeType: string;
}) {
  const heuristicText =
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ? await extractDocxText(buffer)
      : mimeType === "text/plain"
        ? extractTxtText(buffer)
        : null;

  let classification = classifyByHeuristics({
    filename,
    text: heuristicText,
  });

  if (mimeType === "application/pdf" && classification.detectedKind === "unknown" && apiKey) {
    try {
      classification = await classifyPdfWithGemini({
        apiKey,
        buffer,
        filename,
        mimeType,
      });
    } catch {
      classification = classifyByHeuristics({
        filename,
        text: null,
      });
    }
  }

  const isConfidentMismatch =
    classification.detectedKind !== "unknown" &&
    classification.detectedKind !== expectedKind &&
    (expectedKind === "cv" || classification.confidence === "high");

  if (isConfidentMismatch) {
    const expectedLabel = expectedKind === "cv" ? "CV" : "Jobbeschreibung";
    const detectedLabel = classification.detectedKind === "cv" ? "CV" : "Jobbeschreibung";
    throw new ExtractionError(
      "INTERNAL",
      `Falscher Dokumenttyp: Erwartet wurde ${expectedLabel}, erkannt wurde jedoch ${detectedLabel}. ${classification.reason}`,
      400,
    );
  }
}

const cvToolSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    full_name: { type: ["string", "null"] },
    email: { type: ["string", "null"] },
    phone: { type: ["string", "null"] },
    location: { type: ["string", "null"] },
    summary: { type: ["string", "null"] },
    years_experience: { type: ["integer", "null"] },
    skills: { type: "array", items: { type: "string" } },
    languages: { type: "array", items: { type: "string" } },
    education: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          degree: { type: ["string", "null"] },
          institution: { type: ["string", "null"] },
          year: { type: ["string", "null"] },
        },
        required: ["degree", "institution", "year"],
      },
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          role: { type: ["string", "null"] },
          company: { type: ["string", "null"] },
          start: { type: ["string", "null"] },
          end: { type: ["string", "null"] },
          description: { type: ["string", "null"] },
          achievements: { type: "array", items: { type: "string" } },
        },
        required: ["role", "company", "start", "end", "description", "achievements"],
      },
    },
    certifications: { type: "array", items: { type: "string" } },
  },
  required: [
    "full_name",
    "email",
    "phone",
    "location",
    "summary",
    "years_experience",
    "skills",
    "languages",
    "education",
    "experience",
    "certifications",
  ],
} as const;

const jobToolSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: ["string", "null"] },
    company: { type: ["string", "null"] },
    location: { type: ["string", "null"] },
    employment_type: { type: ["string", "null"] },
    seniority: { type: ["string", "null"] },
    summary: { type: ["string", "null"] },
    responsibilities: { type: "array", items: { type: "string" } },
    required_skills: { type: "array", items: { type: "string" } },
    nice_to_have: { type: "array", items: { type: "string" } },
    tech_stack: { type: "array", items: { type: "string" } },
    benefits: { type: "array", items: { type: "string" } },
    salary_range: { type: ["string", "null"] },
  },
  required: [
    "title",
    "company",
    "location",
    "employment_type",
    "seniority",
    "summary",
    "responsibilities",
    "required_skills",
    "nice_to_have",
    "tech_stack",
    "benefits",
    "salary_range",
  ],
} as const;

function getSystemPrompt(kind: DocumentKind) {
  const subject = kind === "cv" ? "Lebensläufe" : "Jobbeschreibungen";

  return [
    `Du extrahierst strukturierte Daten aus ${subject} für die Interviewvorbereitung im Recruiting bei metafinanz / HTM.`,
    "Arbeite präzise, faktenbasiert und AGG-konform.",
    "Erfinde keine Fakten. Wenn Informationen fehlen oder nicht sicher belegbar sind, gib null oder leere Arrays zurück.",
    "Normalisiere Datumsangaben auf YYYY-MM, wenn Monat und Jahr bestimmbar sind. Wenn nur das Jahr sicher ist, gib YYYY zurück.",
    "Dedupliziere Skills und normalisiere offensichtliche Dubletten.",
    "Extrahiere niemals Alter, Geburtsdatum, Familienstand, Religion, Nationalität, Gesundheitsdaten, politische Ansichten oder Foto-Metadaten.",
    "Ignoriere solche Angaben auch dann, wenn sie im Dokument enthalten sind.",
    "Nutze ausschließlich den erzwungenen Tool-Call für das Ergebnis.",
  ].join(" ");
}

type GatewayMessage =
  | { role: "system"; content: string }
  | {
      role: "user";
      content: Array<
        { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
      >;
    };

async function callGeminiOpenAICompat({
  apiKey,
  kind,
  mimeType,
  buffer,
}: {
  apiKey: string;
  kind: DocumentKind;
  mimeType: string;
  buffer: Buffer;
}) {
  const toolName = kind === "cv" ? "extract_cv" : "extract_job";
  const messages: GatewayMessage[] = [
    {
      role: "system",
      content: getSystemPrompt(kind),
    },
  ];

  if (mimeType === "application/pdf") {
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text:
            kind === "cv"
              ? "Extrahiere die strukturierten CV-Daten aus diesem Dokument."
              : "Extrahiere die strukturierten Jobdaten aus diesem Dokument.",
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${buffer.toString("base64")}`,
          },
        },
      ],
    });
  } else {
    const extractedText =
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ? await extractDocxText(buffer)
        : extractTxtText(buffer);

    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: [
            kind === "cv"
              ? "Extrahiere die strukturierten CV-Daten aus folgendem Dokumenttext."
              : "Extrahiere die strukturierten Jobdaten aus folgendem Dokumenttext.",
            "",
            extractedText || "(Kein lesbarer Text vorhanden)",
          ].join("\n"),
        },
      ],
    });
  }

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gemini-2.5-pro",
        temperature: 0,
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: toolName,
              description:
                kind === "cv"
                  ? "Extrahiert strukturierte Informationen aus einem Lebenslauf."
                  : "Extrahiert strukturierte Informationen aus einer Jobbeschreibung.",
              parameters: kind === "cv" ? cvToolSchema : jobToolSchema,
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
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 429) {
      throw new ExtractionError(
        "RATE_LIMIT",
        "Die KI-Extraktion ist gerade rate-limitiert. Bitte gleich noch einmal versuchen.",
        429,
      );
    }

    if (response.status === 402) {
      throw new ExtractionError(
        "CREDITS",
        "Für die KI-Extraktion sind aktuell keine Credits verfügbar.",
        402,
      );
    }

    throw new ExtractionError(
      "INTERNAL",
      `Die KI-Extraktion ist fehlgeschlagen (${response.status}). ${errorBody}`.trim(),
      response.status,
    );
  }

  const payload = await response.json();
  const toolCall = payload?.choices?.[0]?.message?.tool_calls?.[0];
  const rawArguments = toolCall?.function?.arguments;

  if (!rawArguments) {
    throw new ExtractionError(
      "INVALID_RESPONSE",
      "Die KI hat kein strukturiertes Extraktionsergebnis geliefert.",
      502,
    );
  }

  try {
    return JSON.parse(rawArguments) as CvExtractionPayload | JobExtractionPayload;
  } catch {
    throw new ExtractionError(
      "INVALID_RESPONSE",
      "Die KI-Antwort konnte nicht als Tool-Argument gelesen werden.",
      502,
    );
  }
}

export async function insertDocumentRow({
  supabase,
  documentId,
  userId,
  kind,
  filename,
  storagePath,
  mimeType,
}: {
  supabase: SupabaseClient;
  documentId: string;
  userId: string;
  kind: DocumentKind;
  filename: string;
  storagePath: string;
  mimeType: string;
}) {
  const { error } = await supabase.from("documents").insert({
    application_status: "new",
    id: documentId,
    user_id: userId,
    kind,
    filename,
    storage_path: storagePath,
    mime_type: mimeType,
    status: "uploaded",
  });

  if (error) {
    throw new ExtractionError(
      "INTERNAL",
      "Dokument konnte nicht in der Datenbank gespeichert werden.",
      500,
    );
  }
}

export async function uploadDocumentToStorage({
  supabase,
  storagePath,
  buffer,
  mimeType,
}: {
  supabase: SupabaseClient;
  storagePath: string;
  buffer: Buffer;
  mimeType: string;
}) {
  const { error } = await supabase.storage.from("documents").upload(storagePath, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    throw new ExtractionError("INTERNAL", "Datei konnte nicht im Storage gespeichert werden.", 500);
  }
}

async function updateDocumentStatus(
  supabase: SupabaseClient,
  documentId: string,
  status: StoredDocument["status"],
  errorMessage: string | null,
) {
  const { error } = await supabase
    .from("documents")
    .update({
      status,
      error: errorMessage,
    })
    .eq("id", documentId);

  if (error) {
    throw new ExtractionError(
      "INTERNAL",
      "Dokumentenstatus konnte nicht aktualisiert werden.",
      500,
    );
  }
}

export async function getDocumentRecord(supabase: SupabaseClient, documentId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle<StoredDocument>();

  if (error) {
    throw new ExtractionError("INTERNAL", "Dokument konnte nicht geladen werden.", 500);
  }

  if (!data) {
    throw new ExtractionError("NOT_FOUND", "Dokument wurde nicht gefunden.", 404);
  }

  return data;
}

async function persistExtraction({
  supabase,
  document,
  extracted,
}: {
  supabase: SupabaseClient;
  document: StoredDocument;
  extracted: CvExtractionPayload | JobExtractionPayload;
}) {
  if (document.kind === "cv") {
    const payload = extracted as CvExtractionPayload;
    const { error } = await supabase.from("cv_extractions").upsert(
      {
        document_id: document.id,
        ...payload,
        raw_json: payload,
      },
      {
        onConflict: "document_id",
      },
    );

    if (error) {
      throw new ExtractionError("INTERNAL", "CV-Extraktion konnte nicht gespeichert werden.", 500);
    }

    return;
  }

  const payload = extracted as JobExtractionPayload;
  const { error } = await supabase.from("job_extractions").upsert(
    {
      document_id: document.id,
      ...payload,
      raw_json: payload,
    },
    {
      onConflict: "document_id",
    },
  );

  if (error) {
    throw new ExtractionError("INTERNAL", "Job-Extraktion konnte nicht gespeichert werden.", 500);
  }
}

export async function runDocumentExtraction({
  supabase,
  documentId,
  apiKey,
}: {
  supabase: SupabaseClient;
  documentId: string;
  apiKey: string;
}) {
  const document = await getDocumentRecord(supabase, documentId);

  if (document.status === "extracted") {
    return await getDocumentWithExtraction(supabase, documentId);
  }

  const { data: transitionedRows, error: transitionError } = await supabase
    .from("documents")
    .update({
      status: "processing",
      error: null,
    })
    .eq("id", documentId)
    .in("status", ["uploaded", "failed"])
    .select("*");

  if (transitionError) {
    throw new ExtractionError(
      "INTERNAL",
      "Dokumentenstatus konnte nicht aktualisiert werden.",
      500,
    );
  }

  if (!transitionedRows || transitionedRows.length === 0) {
    return await getDocumentWithExtraction(supabase, documentId);
  }

  try {
    const { data, error } = await supabase.storage
      .from("documents")
      .download(document.storage_path);

    if (error || !data) {
      throw new ExtractionError(
        "INTERNAL",
        "Datei konnte nicht aus dem Storage geladen werden.",
        500,
      );
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extracted = await callGeminiOpenAICompat({
      apiKey,
      kind: document.kind,
      mimeType: document.mime_type,
      buffer,
    });

    await persistExtraction({
      supabase,
      document,
      extracted,
    });
    await updateDocumentStatus(supabase, documentId, "extracted", null);
    return await getDocumentWithExtraction(supabase, documentId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unbekannter Fehler bei der Extraktion.";
    await updateDocumentStatus(supabase, documentId, "failed", message);
    throw error;
  }
}

export async function getDocumentWithExtraction(supabase: SupabaseClient, documentId: string) {
  const document = await getDocumentRecord(supabase, documentId);

  if (document.kind === "cv") {
    const { data, error } = await supabase
      .from("cv_extractions")
      .select("*")
      .eq("document_id", documentId)
      .maybeSingle<CvExtractionRow>();

    if (error) {
      throw new ExtractionError("INTERNAL", "CV-Extraktion konnte nicht geladen werden.", 500);
    }

    return {
      ...document,
      extraction: data ?? null,
    } satisfies ListedDocument;
  }

  const { data, error } = await supabase
    .from("job_extractions")
    .select("*")
    .eq("document_id", documentId)
    .maybeSingle<JobExtractionRow>();

  if (error) {
    throw new ExtractionError("INTERNAL", "Job-Extraktion konnte nicht geladen werden.", 500);
  }

  return {
    ...document,
    extraction: data ?? null,
  } satisfies ListedDocument;
}

export async function listDocumentsWithExtraction({
  supabase,
  kind,
}: {
  supabase: SupabaseClient;
  kind?: DocumentKind;
}) {
  let query = supabase.from("documents").select("*").order("created_at", { ascending: false });

  if (kind) {
    query = query.eq("kind", kind);
  }

  const { data, error } = await query.returns<StoredDocument[]>();

  if (error) {
    throw new ExtractionError("INTERNAL", "Dokumente konnten nicht geladen werden.", 500);
  }

  const documents = data ?? [];
  const cvIds = documents
    .filter((document) => document.kind === "cv")
    .map((document) => document.id);
  const jobIds = documents
    .filter((document) => document.kind === "job_description")
    .map((document) => document.id);

  const [cvResult, jobResult] = await Promise.all([
    cvIds.length
      ? supabase
          .from("cv_extractions")
          .select("*")
          .in("document_id", cvIds)
          .returns<CvExtractionRow[]>()
      : Promise.resolve({ data: [], error: null }),
    jobIds.length
      ? supabase
          .from("job_extractions")
          .select("*")
          .in("document_id", jobIds)
          .returns<JobExtractionRow[]>()
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (cvResult.error) {
    throw new ExtractionError("INTERNAL", "CV-Extraktionen konnten nicht geladen werden.", 500);
  }

  if (jobResult.error) {
    throw new ExtractionError("INTERNAL", "Job-Extraktionen konnten nicht geladen werden.", 500);
  }

  const cvByDocumentId = new Map((cvResult.data ?? []).map((row) => [row.document_id, row]));
  const jobByDocumentId = new Map((jobResult.data ?? []).map((row) => [row.document_id, row]));

  return documents.map((document) => ({
    ...document,
    extraction:
      document.kind === "cv"
        ? (cvByDocumentId.get(document.id) ?? null)
        : (jobByDocumentId.get(document.id) ?? null),
  })) satisfies ListedDocument[];
}

export async function deleteStoredDocument(supabase: SupabaseClient, documentId: string) {
  const document = await getDocumentRecord(supabase, documentId);
  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([document.storage_path]);

  if (storageError) {
    throw new ExtractionError(
      "INTERNAL",
      "Datei konnte nicht aus dem Storage gelöscht werden.",
      500,
    );
  }

  const { error } = await supabase.from("documents").delete().eq("id", documentId);

  if (error) {
    throw new ExtractionError("INTERNAL", "Dokument konnte nicht gelöscht werden.", 500);
  }
}

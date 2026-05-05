import { createServerFn } from "@tanstack/react-start";
import { createMiddleware } from "@tanstack/react-start";
import { createRequestSupabaseClient } from "@/server/extraction.server";
import { generateGuideInputSchema, teamUploadInputSchema, updateApplicationStatusInputSchema } from "@/server/recruiting.server";

function toSerializableError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unbekannter Fehler.";
  const wrapped = new Error(message);

  if (error && typeof error === "object") {
    const code = "code" in error && typeof error.code === "string" ? error.code : "INTERNAL";
    const status = "status" in error && typeof error.status === "number" ? error.status : 500;
    return Object.assign(wrapped, { code, status });
  }

  return Object.assign(wrapped, { code: "INTERNAL", status: 500 });
}

const requireSupabaseAuth = createMiddleware({ type: "function" }).server(async ({ next, request }) => {
  const supabase = createRequestSupabaseClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw toSerializableError({
      message: "Anmeldung erforderlich.",
      code: "UNAUTHORIZED",
      status: 401,
    });
  }

  return next({
    context: {
      supabase,
      user,
    },
  });
});

export const listTeams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listTeams } = await import("./server/recruiting.server");
    try {
      return await listTeams(context.supabase, context.user.id);
    } catch (error) {
      throw toSerializableError(error);
    }
  });

export const listQuestionPrompts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listQuestionPrompts } = await import("./server/recruiting.server");
    try {
      return await listQuestionPrompts(context.supabase, context.user.id);
    } catch (error) {
      throw toSerializableError(error);
    }
  });

export const createTeamFromUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(teamUploadInputSchema)
  .handler(async ({ data, context }) => {
    const { createTeamFromUpload } = await import("./server/recruiting.server");
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw toSerializableError({
        message: "GEMINI_API_KEY ist nicht gesetzt.",
        code: "INTERNAL",
        status: 500,
      });
    }

    try {
      return await createTeamFromUpload({
        supabase: context.supabase,
        userId: context.user.id,
        filename: data.filename,
        fileBase64: data.fileBase64,
        mimeType: data.mimeType,
        apiKey,
      });
    } catch (error) {
      throw toSerializableError(error);
    }
  });

export const generateInterviewGuide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(generateGuideInputSchema)
  .handler(async ({ data, context }) => {
    const { generateInterviewGuide } = await import("./server/recruiting.server");

    try {
      return await generateInterviewGuide({
        supabase: context.supabase,
        userId: context.user.id,
        applicationId: data.applicationId,
        jobId: data.jobId,
        recruiterNotes: data.recruiterNotes,
        teamId: data.teamId ?? null,
        apiKey: process.env.GEMINI_API_KEY ?? null,
      });
    } catch (error) {
      throw toSerializableError(error);
    }
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(updateApplicationStatusInputSchema)
  .handler(async ({ data, context }) => {
    const { updateApplicationStatus } = await import("./server/recruiting.server");

    try {
      return await updateApplicationStatus({
        supabase: context.supabase,
        documentId: data.documentId,
        status: data.status,
      });
    } catch (error) {
      throw toSerializableError(error);
    }
  });

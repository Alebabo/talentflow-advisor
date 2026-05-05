import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

const documentKindSchema = z.enum(["cv", "job_description"]);

function estimateBase64Size(base64: string) {
  const normalized = base64.replace(/\s/g, "");
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
  return Math.floor((normalized.length * 3) / 4) - padding;
}

const uploadDocumentInputSchema = z.object({
  kind: documentKindSchema,
  filename: z.string().trim().min(1).max(255),
  fileBase64: z.string().min(1).refine((value) => estimateBase64Size(value) <= 10 * 1024 * 1024, {
    message: "Datei darf maximal 10 MB groß sein.",
  }),
  mimeType: z.enum(allowedMimeTypes),
});

const extractDocumentInputSchema = z.object({
  documentId: z.string().uuid(),
});

const listDocumentsInputSchema = z.object({
  kind: documentKindSchema.optional(),
});

const getDocumentInputSchema = z.object({
  id: z.string().uuid(),
});

const deleteDocumentInputSchema = z.object({
  id: z.string().uuid(),
});

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
  const { createRequestSupabaseClient } = await import("./server/extraction.server");
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

export const uploadDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(uploadDocumentInputSchema)
  .handler(async ({ data, context }) => {
    const {
      buildStoragePath,
      decodeBase64File,
      insertDocumentRow,
      runDocumentExtraction,
      uploadDocumentToStorage,
    } = await import("./server/extraction.server");

    const buffer = decodeBase64File(data.fileBase64);
    const documentId = crypto.randomUUID();
    const storagePath = buildStoragePath(context.user.id, documentId, data.filename);

    await uploadDocumentToStorage({
      supabase: context.supabase,
      storagePath,
      buffer,
      mimeType: data.mimeType,
    });

    try {
      await insertDocumentRow({
        supabase: context.supabase,
        documentId,
        userId: context.user.id,
        kind: data.kind,
        filename: data.filename,
        storagePath,
        mimeType: data.mimeType,
      });
    } catch (error) {
      await context.supabase.storage.from("documents").remove([storagePath]);
      throw toSerializableError(error);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      void runDocumentExtraction({
        supabase: context.supabase,
        documentId,
        apiKey,
      }).catch(() => {
        return;
      });
    }

    return {
      documentId,
    };
  });

export const extractDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(extractDocumentInputSchema)
  .handler(async ({ data, context }) => {
    const { runDocumentExtraction } = await import("./server/extraction.server");
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw toSerializableError({
        message: "GEMINI_API_KEY ist nicht gesetzt.",
        code: "INTERNAL",
        status: 500,
      });
    }

    try {
      return await runDocumentExtraction({
        supabase: context.supabase,
        documentId: data.documentId,
        apiKey,
      });
    } catch (error) {
      throw toSerializableError(error);
    }
  });

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(listDocumentsInputSchema)
  .handler(async ({ data, context }) => {
    const { listDocumentsWithExtraction } = await import("./server/extraction.server");

    try {
      return await listDocumentsWithExtraction({
        supabase: context.supabase,
        kind: data.kind,
      });
    } catch (error) {
      throw toSerializableError(error);
    }
  });

export const getDocument = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(getDocumentInputSchema)
  .handler(async ({ data, context }) => {
    const { getDocumentWithExtraction } = await import("./server/extraction.server");

    try {
      return await getDocumentWithExtraction(context.supabase, data.id);
    } catch (error) {
      throw toSerializableError(error);
    }
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(deleteDocumentInputSchema)
  .handler(async ({ data, context }) => {
    const { deleteStoredDocument } = await import("./server/extraction.server");

    try {
      await deleteStoredDocument(context.supabase, data.id);
      return {
        success: true,
      };
    } catch (error) {
      throw toSerializableError(error);
    }
  });

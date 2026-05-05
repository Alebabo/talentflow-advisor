import { useCallback, useEffect, useRef, useState } from "react";
import { extractDocument, getDocument, uploadDocument } from "@/extraction.functions";

type UploadKind = "cv" | "job_description";
type UploadedDocument = Awaited<ReturnType<typeof getDocument>>;
type AllowedMimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "text/plain";

const acceptedMimeTypes: AllowedMimeType[] = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

function inferMimeType(file: File): AllowedMimeType | null {
  if (acceptedMimeTypes.includes(file.type as AllowedMimeType)) {
    return file.type as AllowedMimeType;
  }

  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (lowerName.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  if (lowerName.endsWith(".txt")) {
    return "text/plain";
  }

  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Datei konnte nicht gelesen werden."));
        return;
      }

      const [, base64 = ""] = result.split(",", 2);
      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error("Datei konnte nicht gelesen werden."));
    };

    reader.readAsDataURL(file);
  });
}

export function useDocumentUpload({
  kind,
  onUploaded,
  onSettled,
}: {
  kind: UploadKind;
  onUploaded?: (documentId: string) => void;
  onSettled?: (document: UploadedDocument) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isMountedRef = useRef(true);
  const hidePopupTimeoutRef = useRef<number | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState("");
  const activeEntityLabel = kind === "job_description" ? "Job" : "Bewerbung";

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (hidePopupTimeoutRef.current != null) {
        window.clearTimeout(hidePopupTimeoutRef.current);
      }
    };
  }, []);

  const showPopup = useCallback(() => {
    if (hidePopupTimeoutRef.current != null) {
      window.clearTimeout(hidePopupTimeoutRef.current);
      hidePopupTimeoutRef.current = null;
    }

    setIsPopupVisible(true);
  }, []);

  const hidePopupLater = useCallback((delay = 4000) => {
    if (hidePopupTimeoutRef.current != null) {
      window.clearTimeout(hidePopupTimeoutRef.current);
    }

    hidePopupTimeoutRef.current = window.setTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }

      setIsPopupVisible(false);
      hidePopupTimeoutRef.current = null;
    }, delay);
  }, []);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const resetInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const pollDocument = useCallback(
    async (documentId: string) => {
      for (let attempt = 0; attempt < 60; attempt += 1) {
        const document = await getDocument({
          data: {
            id: documentId,
          },
        });

        if (document.status === "extracted" || document.status === "failed") {
          if (isMountedRef.current) {
            setActiveDocumentId(null);
            setIsIndeterminate(false);
            setProgress(100);
            setStatusLabel(document.status === "extracted" ? `${activeEntityLabel} eingetragen` : "Upload fehlgeschlagen");
            if (document.status === "failed" && document.error) {
              setError(document.error);
            }
            onSettled?.(document);
            hidePopupLater(document.status === "extracted" ? 2500 : 6000);
          }
          return;
        }

        if (isMountedRef.current) {
          setIsIndeterminate(true);
          setStatusLabel(document.status === "processing" ? `Trage ${activeEntityLabel} ein...` : "Warte auf Verarbeitung...");
        }

        await sleep(2000);
      }

      throw new Error("Die Extraktion dauert ungewohnlich lange. Bitte Status erneut prufen.");
    },
    [hidePopupLater, onSettled],
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      showPopup();
      setError(null);
      setIsIndeterminate(true);
      setProgress(0);
      setStatusLabel("Datei wird vorbereitet...");
      const resolvedMimeType = inferMimeType(file);

      if (!resolvedMimeType) {
        setIsIndeterminate(false);
        setProgress(100);
        setError("Bitte nur PDF-, DOCX- oder TXT-Dateien hochladen.");
        setStatusLabel("Upload fehlgeschlagen");
        hidePopupLater();
        resetInput();
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setIsIndeterminate(false);
        setProgress(100);
        setError("Dateien durfen maximal 10 MB gross sein.");
        setStatusLabel("Upload fehlgeschlagen");
        hidePopupLater();
        resetInput();
        return;
      }

      setIsUploading(true);

      try {
        setProgress(20);
        setStatusLabel("Datei wird gelesen...");
        const fileBase64 = await toBase64(file);
        if (isMountedRef.current) {
          setProgress(45);
          setStatusLabel("Datei wird hochgeladen...");
        }

        const result = await uploadDocument({
          data: {
            kind,
            filename: file.name,
            fileBase64,
            mimeType: resolvedMimeType,
          },
        });

        if (!isMountedRef.current) {
          return;
        }

        setActiveDocumentId(result.documentId);
        setProgress(100);
        setStatusLabel(`Trage ${activeEntityLabel} ein...`);
        onUploaded?.(result.documentId);

        void extractDocument({
          data: {
            documentId: result.documentId,
          },
        }).catch(() => {
          return;
        });

        void pollDocument(result.documentId).catch((pollError: unknown) => {
          if (isMountedRef.current) {
            setActiveDocumentId(null);
            setIsIndeterminate(false);
            setProgress(100);
            setError(pollError instanceof Error ? pollError.message : "Upload konnte nicht abgeschlossen werden.");
            setStatusLabel("Upload fehlgeschlagen");
            hidePopupLater(6000);
          }
        });
      } catch (uploadError) {
        if (isMountedRef.current) {
          setIsIndeterminate(false);
          setProgress(100);
          setError(uploadError instanceof Error ? uploadError.message : "Upload fehlgeschlagen.");
          setStatusLabel("Upload fehlgeschlagen");
          hidePopupLater(6000);
        }
      } finally {
        if (isMountedRef.current) {
          setIsUploading(false);
        }
        resetInput();
      }
    },
    [hidePopupLater, kind, onUploaded, pollDocument, resetInput, showPopup],
  );

  return {
    activeDocumentId,
    error,
    handleFileChange,
    inputRef,
    isIndeterminate,
    isPopupVisible,
    isUploading,
    openPicker,
    progress,
    statusLabel,
  };
}

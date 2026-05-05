import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { AuthRequiredCard } from "@/components/auth-required-card";
import { UploadProgressPopup } from "@/components/upload-progress-popup";
import { StatusPill } from "@/components/status-pill";
import { deleteDocument, listDocuments } from "@/extraction.functions";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Layers, Loader2, MapPin, Search, Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Jobs - TalentFlow" },
      {
        name: "description",
        content: "Verwaltung aller Jobbeschreibungen, getrennt von Bewerbungen.",
      },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  const [documents, setDocuments] = useState<Awaited<ReturnType<typeof listDocuments>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const upsertDocument = (nextDocument: Awaited<ReturnType<typeof listDocuments>>[number]) => {
    setDocuments((current) => {
      const existingIndex = current.findIndex((document) => document.id === nextDocument.id);

      if (existingIndex === -1) {
        return [nextDocument, ...current];
      }

      return current.map((document) => (document.id === nextDocument.id ? nextDocument : document));
    });
  };

  const loadDocuments = async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setLoadError(null);
      const result = await listDocuments({
        data: {
          kind: "job_description",
        },
      });
      setDocuments(result);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Jobs konnten nicht geladen werden.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  const {
    inputRef,
    handleFileChange,
    openPicker,
    isUploading,
    error,
    activeDocumentId,
    isIndeterminate,
    isPopupVisible,
    progress,
    statusLabel,
  } = useDocumentUpload({
    kind: "job_description",
    onUploaded: (document) => {
      upsertDocument(document);
    },
    onSettled: (document) => {
      upsertDocument(document);
    },
  });

  const handleDeleteDocument = async (documentId: string) => {
    try {
      setDeletingId(documentId);
      setLoadError(null);
      await deleteDocument({
        data: {
          id: documentId,
        },
      });
      setDocuments((current) => current.filter((document) => document.id !== documentId));
      void loadDocuments({ silent: true });
    } catch (deleteError) {
      setLoadError(
        deleteError instanceof Error ? deleteError.message : "Job konnte nicht geloescht werden.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return documents;
    }

    return documents.filter((document) => {
      const extraction = document.kind === "job_description" ? document.extraction : null;

      return [
        document.filename,
        extraction && "title" in extraction ? extraction.title : "",
        extraction && "company" in extraction ? extraction.company : "",
        extraction && "location" in extraction ? extraction.location : "",
        extraction && "summary" in extraction ? extraction.summary : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [documents, search]);

  const formatStatusLabel = (status: string) => {
    if (status === "uploaded") return "Hochgeladen";
    if (status === "processing") return "In Verarbeitung";
    if (status === "extracted") return "Extrahiert";
    if (status === "failed") return "Fehlgeschlagen";
    return status;
  };

  const mapStatusTone = (status: string) => {
    if (status === "extracted") return "success" as const;
    if (status === "processing") return "warning" as const;
    if (status === "uploaded") return "info" as const;
    return "neutral" as const;
  };

  return (
    <AppShell>
      <PageHeader
        title="Jobs"
        actions={
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button variant="outline" onClick={openPicker} disabled={isUploading}>
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Job hochladen
            </Button>
          </>
        }
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        <div className="flex max-w-md items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Jobs durchsuchen..."
              className="bg-card pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {isRefreshing && !isLoading && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Jobliste wird aktualisiert...
          </div>
        )}

        {(error || loadError || activeDocumentId) &&
          ((error || loadError) === "Anmeldung erforderlich." ? (
            <AuthRequiredCard message={error || loadError} />
          ) : (
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              {error || loadError || `Dokument ${activeDocumentId} wird gerade verarbeitet.`}
            </div>
          ))}

        {isLoading ? (
          <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">
            Jobs werden geladen...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
            Noch keine Jobdokumente vorhanden.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredDocuments.map((document) => {
              const extraction = document.kind === "job_description" ? document.extraction : null;
              const title =
                extraction && "title" in extraction && extraction.title
                  ? extraction.title
                  : document.filename;
              const company = extraction && "company" in extraction ? extraction.company : null;
              const location = extraction && "location" in extraction ? extraction.location : null;
              const seniority =
                extraction && "seniority" in extraction ? extraction.seniority : null;
              const summary = extraction && "summary" in extraction ? extraction.summary : null;
              const skills =
                extraction && "required_skills" in extraction
                  ? extraction.required_skills.slice(0, 4)
                  : [];

              return (
                <article
                  key={document.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold leading-snug text-foreground">
                        {title}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        {company || "Unternehmen nicht erkannt"}
                      </div>
                    </div>
                    <StatusPill tone={mapStatusTone(document.status)}>
                      {formatStatusLabel(document.status)}
                    </StatusPill>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {summary || "Noch keine inhaltliche Zusammenfassung verfuegbar."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {location || "Kein Standort"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {seniority || "Nicht erkannt"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-muted-foreground">
                        Quelle: {document.filename} ·{" "}
                        {new Date(document.created_at).toLocaleDateString("de-DE")}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-destructive"
                            disabled={deletingId === document.id}
                          >
                            {deletingId === document.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Job entfernen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Die Jobbeschreibung und ihre Extraktion werden dauerhaft geloescht.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => void handleDeleteDocument(document.id)}
                            >
                              Loeschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {skills.length > 0 ? (
                        skills.map((skill) => (
                          <StatusPill key={skill} tone="info">
                            {skill}
                          </StatusPill>
                        ))
                      ) : (
                        <StatusPill tone="neutral">Noch keine Skills</StatusPill>
                      )}
                    </div>
                    {document.error && <p className="text-xs text-destructive">{document.error}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <UploadProgressPopup
        title="Job wird hochgeladen"
        isIndeterminate={isIndeterminate}
        isVisible={isPopupVisible || isUploading || !!activeDocumentId}
        progress={progress}
        statusLabel={statusLabel}
        error={error}
      />
    </AppShell>
  );
}

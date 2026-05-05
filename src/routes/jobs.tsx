import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { AuthRequiredCard } from "@/components/auth-required-card";
import { UploadProgressPopup } from "@/components/upload-progress-popup";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";
import { listDocuments } from "@/extraction.functions";
import { Building2, Layers, Loader2, MapPin, Search, Upload } from "lucide-react";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Jobs - TalentFlow" },
      { name: "description", content: "Verwaltung aller Jobbeschreibungen, getrennt von Bewerbungen." },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  const [documents, setDocuments] = useState<Awaited<ReturnType<typeof listDocuments>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadDocuments = async () => {
    try {
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
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  const { inputRef, handleFileChange, openPicker, isUploading, error, activeDocumentId, isPopupVisible, progress, statusLabel } =
    useDocumentUpload({
      kind: "job_description",
      onUploaded: () => {
        void loadDocuments();
      },
      onSettled: () => {
        void loadDocuments();
      },
    });

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
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Job hochladen
            </Button>
          </>
        }
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        <div className="flex items-center gap-3 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Jobs durchsuchen..."
              className="pl-9 bg-card"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {(error || loadError || activeDocumentId) && (
          (error || loadError) === "Anmeldung erforderlich." ? (
            <AuthRequiredCard message={error || loadError} />
          ) : (
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              {error || loadError || `Dokument ${activeDocumentId} wird gerade verarbeitet.`}
            </div>
          )
        )}

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
              const title = extraction && "title" in extraction && extraction.title ? extraction.title : document.filename;
              const company = extraction && "company" in extraction ? extraction.company : null;
              const location = extraction && "location" in extraction ? extraction.location : null;
              const seniority = extraction && "seniority" in extraction ? extraction.seniority : null;
              const summary = extraction && "summary" in extraction ? extraction.summary : null;
              const skills =
                extraction && "required_skills" in extraction ? extraction.required_skills.slice(0, 4) : [];

              return (
                <article
                  key={document.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold leading-snug text-foreground">{title}</h3>
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
                    {summary || "Noch keine inhaltliche Zusammenfassung verfügbar."}
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
                    <div className="text-xs text-muted-foreground">
                      Quelle: {document.filename} · {new Date(document.created_at).toLocaleDateString("de-DE")}
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
        isVisible={isPopupVisible || isUploading || !!activeDocumentId}
        progress={progress}
        statusLabel={statusLabel}
        error={error}
      />
    </AppShell>
  );
}

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
import { Loader2, Mail, MapPin, Search, Upload } from "lucide-react";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "Applications - TalentFlow" },
      { name: "description", content: "Verwaltung aller Bewerbungen, getrennt von Jobs." },
    ],
  }),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const [documents, setDocuments] = useState<Awaited<ReturnType<typeof listDocuments>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadDocuments = async () => {
    try {
      setLoadError(null);
      const result = await listDocuments({
        data: {
          kind: "cv",
        },
      });
      setDocuments(result);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Bewerbungen konnten nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  const { inputRef, handleFileChange, openPicker, isUploading, error, activeDocumentId, isPopupVisible, progress, statusLabel } =
    useDocumentUpload({
      kind: "cv",
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
      const extraction = document.kind === "cv" ? document.extraction : null;

      return [
        document.filename,
        extraction && "full_name" in extraction ? extraction.full_name : "",
        extraction && "email" in extraction ? extraction.email : "",
        extraction && "location" in extraction ? extraction.location : "",
        extraction && "summary" in extraction ? extraction.summary : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [documents, search]);

  return (
    <AppShell>
      <PageHeader
        title="Applications"
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
              CV hochladen
            </Button>
          </>
        }
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Bewerbungen durchsuchen..."
            className="pl-9 bg-card"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
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
            Bewerbungen werden geladen...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
            Noch keine CV-Dokumente vorhanden.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Kandidat:in</th>
                  <th className="hidden px-5 py-3 text-left font-medium md:table-cell">Standort</th>
                  <th className="hidden px-5 py-3 text-left font-medium lg:table-cell">Kurzprofil</th>
                  <th className="px-5 py-3 text-left font-medium">Skills</th>
                  <th className="px-5 py-3 text-right font-medium">Erfahrung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDocuments.map((document) => {
                  const extraction = document.kind === "cv" ? document.extraction : null;
                  const fullName =
                    extraction && "full_name" in extraction && extraction.full_name
                      ? extraction.full_name
                      : document.filename;
                  const initials = fullName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase();
                  const skills = extraction && "skills" in extraction ? extraction.skills : [];
                  const yearsExperience =
                    extraction && "years_experience" in extraction ? extraction.years_experience : null;

                  return (
                    <tr key={document.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                            {initials || "CV"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground">{fullName}</div>
                            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {(extraction && "email" in extraction && extraction.email) || "Keine E-Mail erkannt"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-5 py-4 text-muted-foreground md:table-cell">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {(extraction && "location" in extraction && extraction.location) || "Kein Standort"}
                        </span>
                      </td>
                      <td className="hidden max-w-md px-5 py-4 text-muted-foreground lg:table-cell">
                        <p className="line-clamp-2">
                          {(extraction && "summary" in extraction && extraction.summary) ||
                            document.error ||
                            "Noch keine Zusammenfassung verfügbar."}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {skills.slice(0, 3).map((skill) => (
                            <StatusPill key={skill} tone="info">
                              {skill}
                            </StatusPill>
                          ))}
                          {skills.length > 3 && <StatusPill>+{skills.length - 3}</StatusPill>}
                          {skills.length === 0 && <StatusPill tone="neutral">{document.status}</StatusPill>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-foreground">
                        {yearsExperience == null ? "-" : `${yearsExperience} J.`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UploadProgressPopup
        title="CV wird hochgeladen"
        isVisible={isPopupVisible || isUploading || !!activeDocumentId}
        progress={progress}
        statusLabel={statusLabel}
        error={error}
      />
    </AppShell>
  );
}

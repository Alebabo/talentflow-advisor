import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { AuthRequiredCard } from "@/components/auth-required-card";
import { UploadProgressPopup } from "@/components/upload-progress-popup";
import { StatusPill } from "@/components/status-pill";
import { deleteDocument, listDocuments } from "@/extraction.functions";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";
import { buildCandidateInsights } from "@/lib/recruiting";
import { listTeams, updateApplicationStatus, updateCandidateEmail } from "@/recruiting.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Mail, MapPin, Search, Upload } from "lucide-react";
import type { CvExtractionPayload } from "@/server/extraction.server";

export const Route = createFileRoute("/applications")({
  loader: async () => {
    try {
      const [documents, teams] = await Promise.all([
        listDocuments({ data: { kind: "cv" } }),
        listTeams(),
      ]);
      return {
        documents,
        teams,
        authError: null,
      };
    } catch (error) {
      return {
        documents: [],
        teams: [],
        authError:
          error instanceof Error ? error.message : "Bewerbungen konnten nicht geladen werden.",
      };
    }
  },
  head: () => ({
    meta: [
      { title: "Bewerbungen - TalentFlow" },
      { name: "description", content: "Verwaltung aller Bewerbungen, getrennt von Jobs." },
    ],
  }),
  component: ApplicationsPage,
});

function buildGermanProfileBullets(extraction: CvExtractionPayload | null) {
  if (!extraction) {
    return ["Noch kein Kurzprofil verfuegbar."];
  }

  const bullets: string[] = [];
  const latestExperience =
    extraction.experience?.find((entry) => entry.role || entry.company) ?? null;

  if (latestExperience?.role || latestExperience?.company) {
    const roleLine = [latestExperience.role, latestExperience.company]
      .filter(Boolean)
      .join(" bei ");
    bullets.push(`Zuletzt taetig als ${roleLine}.`);
  }

  if (extraction.years_experience != null) {
    bullets.push(`${extraction.years_experience} Jahre Berufserfahrung laut Lebenslauf.`);
  }

  if (extraction.skills.length > 0) {
    bullets.push(`Schwerpunkte: ${extraction.skills.slice(0, 3).join(", ")}.`);
  }

  if (extraction.location) {
    bullets.push(`Standort: ${extraction.location}.`);
  }

  return bullets.slice(0, 3).length > 0
    ? bullets.slice(0, 3)
    : ["Noch kein Kurzprofil verfuegbar."];
}

function ApplicationsPage() {
  const loaderData = Route.useLoaderData();
  const [documents, setDocuments] = useState(loaderData.documents);
  const [teams, setTeams] = useState(loaderData.teams);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(loaderData.authError);
  const [search, setSearch] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [candidateEmail, setCandidateEmail] = useState("");
  const [emailUpdatingId, setEmailUpdatingId] = useState<string | null>(null);
  const [isGdprDialogOpen, setIsGdprDialogOpen] = useState(false);
  const [gdprCandidateName, setGdprCandidateName] = useState<string | null>(null);
  const [gdprDocumentId, setGdprDocumentId] = useState<string | null>(null);
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false);

  const upsertDocument = (nextDocument: Awaited<ReturnType<typeof listDocuments>>[number]) => {
    setDocuments((current) => {
      const existingIndex = current.findIndex((document) => document.id === nextDocument.id);

      if (existingIndex === -1) {
        return [nextDocument, ...current];
      }

      return current.map((document) => (document.id === nextDocument.id ? nextDocument : document));
    });
  };

  const statusOptions = [
    { value: "new", label: "Neu" },
    { value: "screening", label: "Screening" },
    { value: "interview", label: "Interview" },
    { value: "offer", label: "Angebot" },
    { value: "hired", label: "Eingestellt" },
    { value: "rejected", label: "Abgelehnt" },
    { value: "withdrawn", label: "Zurueckgezogen" },
  ] as const;

  useEffect(() => {
    setDocuments(loaderData.documents);
    setTeams(loaderData.teams);
    setLoadError(loaderData.authError);
  }, [loaderData]);

  const loadDocumentsAndTeams = async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setLoadError(null);
      const [documentsResult, teamsResult] = await Promise.all([
        listDocuments({ data: { kind: "cv" } }),
        listTeams(),
      ]);
      setDocuments(documentsResult);
      setTeams(teamsResult);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Bewerbungen konnten nicht geladen werden.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

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
    kind: "cv",
    onUploaded: (document) => {
      upsertDocument(document);
    },
    onSettled: (document) => {
      upsertDocument(document);
      void loadDocumentsAndTeams({ silent: true });
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

  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;
  const selectedExtraction = selectedDocument?.kind === "cv" ? selectedDocument.extraction : null;
  const selectedInsights = selectedExtraction
    ? buildCandidateInsights(selectedExtraction, teams)
    : null;

  useEffect(() => {
    setCandidateEmail(
      (selectedExtraction && "email" in selectedExtraction && selectedExtraction.email) || "",
    );
  }, [selectedExtraction, selectedDocumentId]);

  const getStatusLabel = (status: string) =>
    statusOptions.find((entry) => entry.value === status)?.label ?? status;

  const getVerarbeitungsstatusLabel = (status: string) => {
    if (status === "uploaded") return "Hochgeladen";
    if (status === "processing") return "In Verarbeitung";
    if (status === "extracted") return "Extrahiert";
    if (status === "failed") return "Fehlgeschlagen";
    return status;
  };

  const getStatusTone = (status: string) => {
    if (status === "hired") return "success" as const;
    if (status === "rejected" || status === "withdrawn") return "neutral" as const;
    if (status === "offer" || status === "interview") return "warning" as const;
    if (status === "screening") return "info" as const;
    return "primary" as const;
  };

  const handleStatusChange = async (documentId: string, nextStatus: string) => {
    try {
      setStatusUpdatingId(documentId);
      setLoadError(null);
      const result = await updateApplicationStatus({
        data: {
          documentId,
          status: nextStatus as
            | "new"
            | "screening"
            | "interview"
            | "offer"
            | "hired"
            | "rejected"
            | "withdrawn",
        },
      });

      if (result.deleted) {
        setDocuments((current) => current.filter((document) => document.id !== documentId));
        if (selectedDocumentId === documentId) {
          setSelectedDocumentId(null);
        }
        setLoadError(
          `Feedback-Mail an ${result.email} gesendet. Kandidat wurde anschliessend entfernt.`,
        );
        return;
      }

      const updatedDocument = documents.find((document) => document.id === documentId) ?? null;
      const updatedExtraction = updatedDocument?.kind === "cv" ? updatedDocument.extraction : null;
      const candidateName =
        updatedExtraction && "full_name" in updatedExtraction && updatedExtraction.full_name
          ? updatedExtraction.full_name
          : (updatedDocument?.filename ?? "Kandidat:in");

      setDocuments((current) =>
        current.map((document) =>
          document.id === documentId
            ? {
                ...document,
                application_status: nextStatus,
              }
            : document,
        ),
      );

      if (result.demoCleanupPrompt) {
        setGdprCandidateName(candidateName);
        setGdprDocumentId(documentId);
        setIsGdprDialogOpen(true);
      }
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Status konnte nicht aktualisiert werden.",
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleCandidateEmailSave = async () => {
    if (!selectedDocument || selectedDocument.kind !== "cv") {
      return;
    }

    try {
      setEmailUpdatingId(selectedDocument.id);
      setLoadError(null);
      const result = await updateCandidateEmail({
        data: {
          documentId: selectedDocument.id,
          email: candidateEmail,
        },
      });

      setCandidateEmail(result.email);
      setDocuments((current) =>
        current.map((document) =>
          document.id === selectedDocument.id && document.kind === "cv"
            ? {
                ...document,
                extraction: {
                  ...document.extraction,
                  email: result.email,
                },
              }
            : document,
        ),
      );
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Kandidaten-E-Mail konnte nicht gespeichert werden.",
      );
    } finally {
      setEmailUpdatingId(null);
    }
  };

  const handleDeleteCandidate = async () => {
    if (!gdprDocumentId) {
      setIsGdprDialogOpen(false);
      return;
    }

    try {
      setIsDeletingCandidate(true);
      setLoadError(null);

      await deleteDocument({
        data: {
          id: gdprDocumentId,
        },
      });

      setDocuments((current) => current.filter((document) => document.id !== gdprDocumentId));

      if (selectedDocumentId === gdprDocumentId) {
        setSelectedDocumentId(null);
      }

      setLoadError("Kandidat wurde aus der Kandidatenliste entfernt.");
      setIsGdprDialogOpen(false);
      setGdprCandidateName(null);
      setGdprDocumentId(null);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Kandidat konnte nicht entfernt werden.",
      );
    } finally {
      setIsDeletingCandidate(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Bewerbungen"
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
            className="bg-card pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {isRefreshing && !isLoading && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Bewerbungen werden aktualisiert...
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
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="hidden px-5 py-3 text-left font-medium md:table-cell">Standort</th>
                  <th className="hidden px-5 py-3 text-left font-medium lg:table-cell">
                    Kurzprofil
                  </th>
                  <th className="px-5 py-3 text-right font-medium">Erfahrung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDocuments.map((document) => {
                  const extraction = document.kind === "cv" ? document.extraction : null;
                  const profileBullets = buildGermanProfileBullets(extraction);
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
                  const yearsExperience =
                    extraction && "years_experience" in extraction
                      ? extraction.years_experience
                      : null;

                  return (
                    <tr
                      key={document.id}
                      className="cursor-pointer transition-colors hover:bg-muted/30"
                      onClick={() => setSelectedDocumentId(document.id)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                            {initials || "CV"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground">{fullName}</div>
                            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {(extraction && "email" in extraction && extraction.email) ||
                                "Keine E-Mail hinterlegt"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                        <Select
                          value={document.application_status}
                          onValueChange={(value) => void handleStatusChange(document.id, value)}
                          disabled={statusUpdatingId === document.id}
                        >
                          <SelectTrigger className="w-[148px]">
                            {statusUpdatingId === document.id ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Aktualisiere...
                              </div>
                            ) : (
                              <StatusPill tone={getStatusTone(document.application_status)}>
                                {getStatusLabel(document.application_status)}
                              </StatusPill>
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="hidden px-5 py-4 text-muted-foreground md:table-cell">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {(extraction && "location" in extraction && extraction.location) ||
                            "Kein Standort"}
                        </span>
                      </td>
                      <td className="hidden max-w-md px-5 py-4 text-muted-foreground lg:table-cell">
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {profileBullets.slice(0, 2).map((bullet) => (
                            <li key={bullet} className="line-clamp-1">
                              - {bullet}
                            </li>
                          ))}
                          {profileBullets.length === 0 ? (
                            <li>- Noch kein Kurzprofil verfuegbar.</li>
                          ) : null}
                        </ul>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-foreground">
                        {yearsExperience == null
                          ? getVerarbeitungsstatusLabel(document.status)
                          : `${yearsExperience} J.`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet
        open={!!selectedDocument}
        onOpenChange={(open) => !open && setSelectedDocumentId(null)}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              {(selectedExtraction &&
                "full_name" in selectedExtraction &&
                selectedExtraction.full_name) ||
                selectedDocument?.filename ||
                "Kandidat:in"}
            </SheetTitle>
            <SheetDescription>
              Mehr Details zu Staerken, Schwaechen und Teamabgleich.
            </SheetDescription>
          </SheetHeader>

          {selectedExtraction && selectedInsights ? (
            <div className="mt-6 space-y-6">
              <section className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Bewerbungsstatus</h3>
                  </div>
                  <StatusPill tone={getStatusTone(selectedDocument.application_status)}>
                    {getStatusLabel(selectedDocument.application_status)}
                  </StatusPill>
                </div>
                <div className="mt-4">
                  <Select
                    value={selectedDocument.application_status}
                    onValueChange={(value) => void handleStatusChange(selectedDocument.id, value)}
                    disabled={statusUpdatingId === selectedDocument.id}
                  >
                    <SelectTrigger className="max-w-xs">
                      <StatusPill tone={getStatusTone(selectedDocument.application_status)}>
                        {getStatusLabel(selectedDocument.application_status)}
                      </StatusPill>
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">Kurzprofil</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {buildGermanProfileBullets(selectedExtraction).map((bullet) => (
                    <li key={bullet}>- {bullet}</li>
                  ))}
                  <li>- E-Mail: {selectedExtraction.email || "Keine E-Mail hinterlegt"}.</li>
                </ul>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="w-full max-w-md space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      E-Mail manuell pflegen
                    </label>
                    <Input
                      type="email"
                      value={candidateEmail}
                      onChange={(event) => setCandidateEmail(event.target.value)}
                      placeholder="name@beispiel.de"
                      disabled={emailUpdatingId === selectedDocument.id}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => void handleCandidateEmailSave()}
                    disabled={
                      emailUpdatingId === selectedDocument.id || candidateEmail.trim().length === 0
                    }
                  >
                    {emailUpdatingId === selectedDocument.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Speichere...
                      </>
                    ) : (
                      "E-Mail speichern"
                    )}
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedExtraction.skills.slice(0, 8).map((skill) => (
                    <StatusPill key={skill} tone="info">
                      {skill}
                    </StatusPill>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">Staerken</h3>
                <ul className="mt-3 space-y-2">
                  {selectedInsights.strengths.map((item) => (
                    <li
                      key={item}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    >
                      - {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Schwaechen / offene Punkte
                </h3>
                <ul className="mt-3 space-y-2">
                  {selectedInsights.weaknesses.map((item) => (
                    <li
                      key={item}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    >
                      - {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground">Teamabgleich</h3>
                <div className="mt-3 space-y-3">
                  {selectedInsights.teamMatches.length > 0 ? (
                    selectedInsights.teamMatches.map((match) => (
                      <div
                        key={match.teamId}
                        className="rounded-lg border border-border bg-background p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-foreground">{match.teamName}</div>
                          <StatusPill
                            tone={
                              match.score >= 50
                                ? "success"
                                : match.score >= 25
                                  ? "warning"
                                  : "neutral"
                            }
                          >
                            {match.score}% Passung
                          </StatusPill>
                        </div>
                        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                          <li>- {match.summary}</li>
                        </ul>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {match.matchedAreas.length > 0 ? (
                            match.matchedAreas.map((item) => (
                              <StatusPill key={item} tone="info">
                                {item}
                              </StatusPill>
                            ))
                          ) : (
                            <StatusPill tone="neutral">
                              Noch keine klaren Ueberschneidungen
                            </StatusPill>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                      Noch keine Teams fuer einen Teamabgleich vorhanden.
                    </div>
                  )}
                </div>
              </section>
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              Fuer diese Bewerbung liegen noch keine Detaildaten vor.
            </div>
          )}
        </SheetContent>
      </Sheet>

      <UploadProgressPopup
        title="CV wird hochgeladen"
        isIndeterminate={isIndeterminate}
        isVisible={isPopupVisible || isUploading || !!activeDocumentId}
        progress={progress}
        statusLabel={statusLabel}
        error={error}
      />

      <AlertDialog
        open={isGdprDialogOpen}
        onOpenChange={(open) => {
          setIsGdprDialogOpen(open);
          if (!open && !isDeletingCandidate) {
            setGdprCandidateName(null);
            setGdprDocumentId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dsgvo konform loeschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {gdprCandidateName
                ? `${gdprCandidateName} hat einen finalen Demo-Status erhalten.`
                : "Dieser Kandidat hat einen finalen Demo-Status erhalten."}{" "}
              Bei Bestaetigung wird der Kandidat aus der Kandidatenliste entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCandidate}>Nein</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDeleteCandidate()}>
              {isDeletingCandidate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loesche...
                </>
              ) : (
                "Ja"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

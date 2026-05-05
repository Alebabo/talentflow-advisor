import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { AuthRequiredCard } from "@/components/auth-required-card";
import { UploadProgressPopup } from "@/components/upload-progress-popup";
import { StatusPill } from "@/components/status-pill";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createTeamFromUpload, listTeams } from "@/recruiting.functions";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, Upload, Users } from "lucide-react";

export const Route = createFileRoute("/teams")({
  loader: async () => {
    try {
      const teams = await listTeams();
      return {
        teams,
        authError: null,
      };
    } catch (error) {
      return {
        teams: [],
        authError: error instanceof Error ? error.message : "Teams konnten nicht geladen werden.",
      };
    }
  },
  head: () => ({
    meta: [
      { title: "Teamkontext - TalentFlow" },
      {
        name: "description",
        content: "Teamkontext als zentrale Quelle fur die Interviewvorbereitung.",
      },
    ],
  }),
  component: TeamsPage,
});

function TeamsPage() {
  const { teams: initialTeams, authError } = Route.useLoaderData();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [teams, setTeams] = useState(initialTeams);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState("");

  useBlocker({
    shouldBlockFn: () => isUploading,
    enableBeforeUnload: isUploading,
    withResolver: false,
  });

  const openPicker = () => inputRef.current?.click();

  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") {
          reject(new Error("Datei konnte nicht gelesen werden."));
          return;
        }

        resolve(result.split(",", 2)[1] || "");
      };
      reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
      reader.readAsDataURL(file);
    });

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);
    setIsUploading(true);
    setIsPopupVisible(true);
    setProgress(10);
    setStatusLabel("Team-PDF wird vorbereitet...");

    try {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        throw new Error("Bitte ein PDF fuer den Team-Upload auswaehlen.");
      }

      const fileBase64 = await readFileAsBase64(file);
      setProgress(45);
      setStatusLabel("Teamprofil wird extrahiert...");
      const team = await createTeamFromUpload({
        data: {
          filename: file.name,
          fileBase64,
          mimeType: "application/pdf",
        },
      });

      setTeams((current) => [team, ...current.filter((entry) => entry.id !== team.id)]);
      setProgress(100);
      setStatusLabel("Team erfolgreich angelegt.");
      window.setTimeout(() => setIsPopupVisible(false), 2500);
    } catch (uploadError) {
      setProgress(100);
      setError(
        uploadError instanceof Error ? uploadError.message : "Team konnte nicht angelegt werden.",
      );
      setStatusLabel("Upload fehlgeschlagen");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Teamkontext"
        description="Teams per PDF hochladen und als Kontext fuer Bewerbungsabgleich und Interviewfragen nutzen."
        actions={
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleUpload}
            />
            <Button variant="outline" onClick={openPicker} disabled={isUploading}>
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Team hochladen
            </Button>
          </>
        }
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        {authError === "Anmeldung erforderlich." ? <AuthRequiredCard message={authError} /> : null}
        {error && authError !== "Anmeldung erforderlich." ? (
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            {error}
          </div>
        ) : null}
        {isUploading ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-950">
            <AlertTitle>Upload laeuft</AlertTitle>
            <AlertDescription>
              Bitte bleib auf dieser Seite, bis das Team angelegt wurde. Beim Verlassen des Tabs
              oder der Seite kann der Upload abgebrochen werden.
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Teamdaten</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Extrahiert aus hochgeladenen Teamprofilen.
              </p>
            </div>
            <StatusPill tone={teams.length > 0 ? "success" : "neutral"}>
              {teams.length} Teams
            </StatusPill>
          </div>

          {teams.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              Noch keine Teams vorhanden. Lade ein Team-PDF hoch, damit Bewerbungsabgleich und
              Leitfaden-Kontext verfuegbar werden.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {teams.map((team) => (
                <article
                  key={team.id}
                  className="rounded-xl border border-border bg-background p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{team.name}</h3>
                      <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        {team.business_unit || "Keine Business Unit erkannt"}
                      </div>
                    </div>
                    <StatusPill tone="info">
                      <Users className="h-3 w-3" />
                      {team.members == null ? "k. A." : team.members}
                    </StatusPill>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {team.description || "Noch keine Teambeschreibung verfuegbar."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {team.focus_areas.slice(0, 4).map((area) => (
                      <StatusPill key={area} tone="success">
                        {area}
                      </StatusPill>
                    ))}
                    {team.focus_areas.length === 0 && (
                      <StatusPill tone="neutral">Keine Fokusfelder erkannt</StatusPill>
                    )}
                  </div>
                  <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
                    Interviewstil: {team.interview_style || "Noch nicht erkannt"}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <UploadProgressPopup
        title="Team wird angelegt"
        isVisible={isPopupVisible || isUploading}
        isIndeterminate={isUploading}
        progress={progress}
        statusLabel={statusLabel}
        error={error}
      />
    </AppShell>
  );
}

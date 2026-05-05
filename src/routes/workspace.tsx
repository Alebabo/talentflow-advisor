import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { AuthRequiredCard } from "@/components/auth-required-card";
import { StatusPill } from "@/components/status-pill";
import { listDocuments } from "@/extraction.functions";
import type { InterviewGuideData } from "@/lib/recruiting";
import { generateInterviewGuide, listQuestionPrompts, listTeams } from "@/recruiting.functions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/workspace")({
  loader: async () => {
    try {
      const [applications, jobs, teams, prompts] = await Promise.all([
        listDocuments({ data: { kind: "cv" } }),
        listDocuments({ data: { kind: "job_description" } }),
        listTeams(),
        listQuestionPrompts(),
      ]);

      return {
        applications,
        jobs,
        teams,
        prompts,
        authError: null,
      };
    } catch (error) {
      return {
        applications: [],
        jobs: [],
        teams: [],
        prompts: [],
        authError: error instanceof Error ? error.message : "Daten konnten nicht geladen werden.",
      };
    }
  },
  head: () => ({
    meta: [
      { title: "Interview-Arbeitsbereich - TalentFlow" },
      { name: "description", content: "CV und Jobbeschreibung zu einem AGG-konformen Interviewkontext zusammenfuhren." },
    ],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  const { applications, jobs, teams, prompts, authError } = Route.useLoaderData();
  const extractedApplications = applications.filter((document) => document.status === "extracted" && document.extraction);
  const extractedJobs = jobs.filter((document) => document.status === "extracted" && document.extraction);

  const [applicationId, setApplicationId] = useState<string>(extractedApplications[0]?.id ?? "");
  const [jobId, setJobId] = useState<string>(extractedJobs[0]?.id ?? "");
  const [teamId, setTeamId] = useState<string>(teams[0]?.id ?? "");
  const [stage1, setStage1] = useState("");
  const [guide, setGuide] = useState<InterviewGuideData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const application = useMemo(
    () => extractedApplications.find((document) => document.id === applicationId) ?? null,
    [applicationId, extractedApplications],
  );
  const job = useMemo(
    () => extractedJobs.find((document) => document.id === jobId) ?? null,
    [extractedJobs, jobId],
  );
  const selectedTeam = teams.find((team) => team.id === teamId) ?? null;

  const applicationExtraction = application?.kind === "cv" ? application.extraction : null;
  const jobExtraction = job?.kind === "job_description" ? job.extraction : null;
  const canGenerateGuide = Boolean(applicationExtraction && jobExtraction);

  useEffect(() => {
    setGuide(null);
  }, [applicationId, jobId, stage1, teamId]);

  const buildGuide = async () => {
    if (!applicationExtraction || !jobExtraction) {
      return;
    }

    try {
      setGenerationError(null);
      setIsGenerating(true);
      const result = await generateInterviewGuide({
        data: {
          applicationId,
          jobId,
          recruiterNotes: stage1,
          teamId: teamId || null,
        },
      });
      setGuide(result);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Interviewleitfaden konnte nicht erzeugt werden.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Interview-Arbeitsbereich"
        description="Nutze echte CV-, Job- und Team-Extraktionen als Grundlage fuer die Vorbereitung."
        actions={
          <StatusPill tone="success">
            <ShieldCheck className="h-3 w-3" /> AGG-geprueft
          </StatusPill>
        }
      />

      <div className="max-w-[1200px] space-y-8 px-6 py-8 md:px-10">
        {authError && <AuthRequiredCard message={authError} />}

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Kontextquellen</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Live-Daten statt Demo-Daten</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill tone={application ? "success" : "neutral"}>CV</StatusPill>
              <StatusPill tone={job ? "success" : "neutral"}>Job</StatusPill>
              <StatusPill tone={selectedTeam ? "success" : "warning"}>Team</StatusPill>
              <StatusPill tone={stage1.length > 20 ? "success" : "warning"}>Stage 1</StatusPill>
            </div>
          </header>

          <div className="grid gap-6 p-6 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>Bewerbung / CV</Label>
              <Select value={applicationId} onValueChange={setApplicationId}>
                <SelectTrigger><SelectValue placeholder="CV auswaehlen" /></SelectTrigger>
                <SelectContent>
                  {extractedApplications.map((document) => {
                    const extraction = document.kind === "cv" ? document.extraction : null;
                    return (
                      <SelectItem key={document.id} value={document.id}>
                        {(extraction && "full_name" in extraction && extraction.full_name) || document.filename}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {(applicationExtraction && "summary" in applicationExtraction && applicationExtraction.summary) ||
                  "Noch kein CV ausgewaehlt."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Job</Label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger><SelectValue placeholder="Job auswaehlen" /></SelectTrigger>
                <SelectContent>
                  {extractedJobs.map((document) => {
                    const extraction = document.kind === "job_description" ? document.extraction : null;
                    return (
                      <SelectItem key={document.id} value={document.id}>
                        {(extraction && "title" in extraction && extraction.title) || document.filename}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {(jobExtraction && "summary" in jobExtraction && jobExtraction.summary) || "Noch kein Job ausgewaehlt."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger><SelectValue placeholder="Team auswaehlen" /></SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedTeam?.description || "Optional: Erst unter Teams ein Profil hochladen, um mehr Kontext zu nutzen."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Recruiter-Kommentare aus Stage 1</Label>
              <Textarea
                rows={4}
                value={stage1}
                onChange={(event) => setStage1(event.target.value)}
                placeholder="Beobachtungen aus dem ersten Gespraech..."
              />
            </div>
          </div>

          <footer className="flex flex-col gap-3 border-t border-border bg-muted/30 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-xs text-muted-foreground">
              Dieser Workspace kombiniert CV, Job, Team und Recruiter-Notizen mit {prompts.length} aktiven Prompt-Regeln.
            </p>
            <Button
              size="lg"
              disabled={!canGenerateGuide || isGenerating}
              onClick={() => void buildGuide()}
              className="bg-[#1f004c] text-[#fffcd9] hover:bg-[#2a0a66] disabled:bg-[#1f004c]/40 disabled:text-[#fffcd9]"
            >
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Interviewleitfaden erzeugen
            </Button>
          </footer>
        </section>

        {generationError && (
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            {generationError}
          </div>
        )}

        <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Interviewleitfaden</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                AGG-konforme Fokusfragen auf Basis echter Extraktionsdaten und gespeicherter System-Prompts.
              </p>
            </div>
            <StatusPill tone={guide ? "success" : "neutral"}>{guide ? "Bereit" : "Noch nicht erzeugt"}</StatusPill>
          </div>

          {guide ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="space-y-6">
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {guide.applicantName} fuer {guide.jobTitle}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{guide.candidateSummary}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{guide.roleSummary}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground">Fokusfragen</h3>
                  <ul className="mt-3 space-y-2 text-sm text-foreground">
                    {guide.focusQuestions.map((question) => (
                      <li key={question} className="rounded-lg border border-border bg-background px-4 py-3">
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground">Relevante Erfahrungsanker</h3>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {guide.experienceHighlights.length > 0 ? (
                      guide.experienceHighlights.map((highlight) => (
                        <div key={highlight} className="rounded-lg border border-border bg-background px-4 py-3">
                          {highlight}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-border px-4 py-3">
                        Noch keine klaren Erfahrungsanker erkannt.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Skill-Passung</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {guide.matchingSkills.length > 0 ? (
                      guide.matchingSkills.map((skill) => (
                        <StatusPill key={skill} tone="success">
                          {skill}
                        </StatusPill>
                      ))
                    ) : (
                      <StatusPill tone="neutral">Noch keine Passungen erkannt</StatusPill>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground">Vertiefen im Interview</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {guide.missingSkills.length > 0 ? (
                      guide.missingSkills.map((skill) => (
                        <StatusPill key={skill} tone="warning">
                          {skill}
                        </StatusPill>
                      ))
                    ) : (
                      <StatusPill tone="success">Keine offensichtlichen Skill-Luecken</StatusPill>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <h3 className="text-sm font-semibold text-foreground">Staerken</h3>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {guide.strengths.map((item) => <p key={item}>{item}</p>)}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <h3 className="text-sm font-semibold text-foreground">Schwaechen / Risiken</h3>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {guide.weaknesses.map((item) => <p key={item}>{item}</p>)}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <h3 className="text-sm font-semibold text-foreground">Stage-1-Signale</h3>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {guide.recruiterSignals.length > 0 ? (
                      guide.recruiterSignals.map((signal) => <p key={signal}>{signal}</p>)
                    ) : (
                      <p>Noch keine Stage-1-Notizen hinterlegt.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <h3 className="text-sm font-semibold text-foreground">Teamkontext</h3>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {guide.teamSignals.length > 0 ? (
                      guide.teamSignals.map((signal) => <p key={signal}>{signal}</p>)
                    ) : (
                      <p>Noch kein Teamkontext hinterlegt.</p>
                    )}
                  </div>
                  {guide.teamMatchSummary && <p className="mt-3 text-sm text-foreground">{guide.teamMatchSummary}</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              Waehle einen extrahierten CV und eine Jobbeschreibung aus und erzeuge dann den Interviewleitfaden.
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-sm font-semibold text-foreground">CV-Extraktion</h2>
            {applicationExtraction ? (
              <div className="mt-4 space-y-3 text-sm text-foreground">
                <p><span className="font-medium">Name:</span> {"full_name" in applicationExtraction ? applicationExtraction.full_name || "-" : "-"}</p>
                <p><span className="font-medium">Standort:</span> {"location" in applicationExtraction ? applicationExtraction.location || "-" : "-"}</p>
                <p><span className="font-medium">Skills:</span> {"skills" in applicationExtraction ? applicationExtraction.skills.join(", ") || "-" : "-"}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Bitte zuerst einen extrahierten CV auswaehlen.</p>
            )}
          </article>

          <article className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-sm font-semibold text-foreground">Job-Extraktion</h2>
            {jobExtraction ? (
              <div className="mt-4 space-y-3 text-sm text-foreground">
                <p><span className="font-medium">Titel:</span> {"title" in jobExtraction ? jobExtraction.title || "-" : "-"}</p>
                <p><span className="font-medium">Standort:</span> {"location" in jobExtraction ? jobExtraction.location || "-" : "-"}</p>
                <p><span className="font-medium">Required Skills:</span> {"required_skills" in jobExtraction ? jobExtraction.required_skills.join(", ") || "-" : "-"}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Bitte zuerst einen extrahierten Job auswaehlen.</p>
            )}
          </article>
        </section>
      </div>
    </AppShell>
  );
}

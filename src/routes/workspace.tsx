import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { AuthRequiredCard } from "@/components/auth-required-card";
import { StatusPill } from "@/components/status-pill";
import { listDocuments } from "@/extraction.functions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, Sparkles } from "lucide-react";

type GuideData = {
  applicantName: string;
  jobTitle: string;
  candidateSummary: string;
  roleSummary: string;
  matchingSkills: string[];
  missingSkills: string[];
  focusQuestions: string[];
  experienceHighlights: string[];
  recruiterSignals: string[];
  teamSignals: string[];
};

export const Route = createFileRoute("/workspace")({
  loader: async () => {
    try {
      const [applications, jobs] = await Promise.all([
        listDocuments({ data: { kind: "cv" } }),
        listDocuments({ data: { kind: "job_description" } }),
      ]);

      return {
        applications,
        jobs,
        authError: null,
      };
    } catch (error) {
      return {
        applications: [],
        jobs: [],
        authError: error instanceof Error ? error.message : "Daten konnten nicht geladen werden.",
      };
    }
  },
  head: () => ({
    meta: [
      { title: "Interview Workspace - TalentFlow" },
      { name: "description", content: "CV und Jobbeschreibung zu einem AGG-konformen Interviewkontext zusammenfuhren." },
    ],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  const { applications, jobs, authError } = Route.useLoaderData();
  const extractedApplications = applications.filter((document) => document.status === "extracted" && document.extraction);
  const extractedJobs = jobs.filter((document) => document.status === "extracted" && document.extraction);

  const [applicationId, setApplicationId] = useState<string>(extractedApplications[0]?.id ?? "");
  const [jobId, setJobId] = useState<string>(extractedJobs[0]?.id ?? "");
  const [stage1, setStage1] = useState("");
  const [teamContext, setTeamContext] = useState("");
  const [guide, setGuide] = useState<GuideData | null>(null);

  const application = useMemo(
    () => extractedApplications.find((document) => document.id === applicationId) ?? null,
    [applicationId, extractedApplications],
  );
  const job = useMemo(
    () => extractedJobs.find((document) => document.id === jobId) ?? null,
    [extractedJobs, jobId],
  );

  const applicationExtraction = application?.kind === "cv" ? application.extraction : null;
  const jobExtraction = job?.kind === "job_description" ? job.extraction : null;
  const canGenerateGuide = Boolean(applicationExtraction && jobExtraction);

  useEffect(() => {
    setGuide(null);
  }, [applicationId, jobId, stage1, teamContext]);

  const buildGuide = () => {
    if (!applicationExtraction || !jobExtraction) {
      return;
    }

    const applicantName =
      ("full_name" in applicationExtraction && applicationExtraction.full_name) || application?.filename || "Kandidat:in";
    const jobTitle =
      ("title" in jobExtraction && jobExtraction.title) || job?.filename || "Rolle";
    const candidateSkills =
      "skills" in applicationExtraction
        ? applicationExtraction.skills.map((skill) => skill.trim()).filter(Boolean)
        : [];
    const requiredSkills =
      "required_skills" in jobExtraction
        ? jobExtraction.required_skills.map((skill) => skill.trim()).filter(Boolean)
        : [];
    const normalizedCandidateSkills = new Set(candidateSkills.map((skill) => skill.toLowerCase()));
    const matchingSkills = requiredSkills.filter((skill) => normalizedCandidateSkills.has(skill.toLowerCase()));
    const missingSkills = requiredSkills.filter((skill) => !normalizedCandidateSkills.has(skill.toLowerCase()));
    const experienceHighlights =
      "experience" in applicationExtraction
        ? applicationExtraction.experience
            .slice(0, 3)
            .map((entry) => [entry.role, entry.company, entry.achievements].filter(Boolean).join(" bei "))
            .filter(Boolean)
        : [];
    const recruiterSignals = stage1
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4);
    const teamSignals = teamContext
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4);

    setGuide({
      applicantName,
      jobTitle,
      candidateSummary:
        ("summary" in applicationExtraction && applicationExtraction.summary) || "Keine Zusammenfassung im CV erkannt.",
      roleSummary:
        ("summary" in jobExtraction && jobExtraction.summary) || "Keine Zusammenfassung in der Jobbeschreibung erkannt.",
      matchingSkills,
      missingSkills,
      focusQuestions: [
        `Welche konkreten Beispiele kann ${applicantName} fur ${matchingSkills[0] || requiredSkills[0] || "die Kernanforderungen"} nennen?`,
        missingSkills[0]
          ? `Wie schnell kann sich ${applicantName} in ${missingSkills[0]} einarbeiten und welche ahnlichen Erfahrungen gibt es bereits?`
          : `Wo liegt fur ${applicantName} der grosste Hebel, um in ${jobTitle} schnell Wirkung zu entfalten?`,
        recruiterSignals[0]
          ? `Wie lasst sich die Beobachtung aus Stage 1 "${recruiterSignals[0]}" im Fachinterview validieren?`
          : "Welche Verhaltensbeispiele zeigen Zusammenarbeit, Ownership und Kommunikationsstarke?",
        teamSignals[0]
          ? `Wie passt ${applicantName} zur aktuellen Teamsituation: "${teamSignals[0]}"?`
          : "Welche Erwartungen hat die Person an Teamdynamik und Stakeholder-Arbeit?",
      ],
      experienceHighlights,
      recruiterSignals,
      teamSignals,
    });
  };

  return (
    <AppShell>
      <PageHeader
        title="Interview Workspace"
        description="Nutze echte CV- und Job-Extraktionen als Grundlage fur die Vorbereitung."
        actions={
          <StatusPill tone="success">
            <ShieldCheck className="h-3 w-3" /> AGG-gepruft
          </StatusPill>
        }
      />

      <div className="max-w-[1200px] space-y-8 px-6 py-8 md:px-10">
        {authError && (
          <AuthRequiredCard message={authError} />
        )}

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Kontextquellen</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Live-Daten statt Demo-Daten</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill tone={application ? "success" : "neutral"}>CV</StatusPill>
              <StatusPill tone={job ? "success" : "neutral"}>Job</StatusPill>
              <StatusPill tone={stage1.length > 20 ? "success" : "warning"}>Stage 1</StatusPill>
            </div>
          </header>

          <div className="grid gap-6 p-6 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>Application / CV</Label>
              <Select value={applicationId} onValueChange={setApplicationId}>
                <SelectTrigger><SelectValue placeholder="CV auswahlen" /></SelectTrigger>
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
                {(applicationExtraction && "summary" in applicationExtraction && applicationExtraction.summary) || "Noch kein CV ausgewahlt."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Job</Label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger><SelectValue placeholder="Job auswahlen" /></SelectTrigger>
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
                {(jobExtraction && "summary" in jobExtraction && jobExtraction.summary) || "Noch kein Job ausgewahlt."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Teamkontext</Label>
              <Textarea
                rows={4}
                value={teamContext}
                onChange={(event) => setTeamContext(event.target.value)}
                placeholder="Aktuelle Team-Situation, Spannungen, Roadmap-Schwerpunkte..."
              />
            </div>

            <div className="space-y-2">
              <Label>Recruiter-Kommentare aus Stage 1</Label>
              <Textarea
                rows={4}
                value={stage1}
                onChange={(event) => setStage1(event.target.value)}
                placeholder="Beobachtungen aus dem ersten Gesprach..."
              />
            </div>
          </div>

          <footer className="flex flex-col gap-3 border-t border-border bg-muted/30 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-xs text-muted-foreground">
              Dieser Workspace kombiniert CV, Job und Recruiter-Notizen jetzt direkt zu einem interviewtauglichen Leitfaden.
            </p>
            <Button
              size="lg"
              disabled={!canGenerateGuide}
              onClick={buildGuide}
              className="bg-[#1f004c] text-[#fffcd9] hover:bg-[#2a0a66] disabled:bg-[#1f004c]/40 disabled:text-[#fffcd9]"
            >
              <Sparkles className="mr-2 h-4 w-4" /> Interviewleitfaden erzeugen
            </Button>
          </footer>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Interviewleitfaden</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                AGG-konforme Fokusfragen auf Basis echter Extraktionsdaten.
              </p>
            </div>
            <StatusPill tone={guide ? "success" : "neutral"}>
              {guide ? "Bereit" : "Noch nicht erzeugt"}
            </StatusPill>
          </div>

          {guide ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="space-y-6">
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {guide.applicantName} fur {guide.jobTitle}
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
                  <h3 className="text-sm font-semibold text-foreground">Skill-Fit</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {guide.matchingSkills.length > 0 ? (
                      guide.matchingSkills.map((skill) => (
                        <StatusPill key={skill} tone="success">
                          {skill}
                        </StatusPill>
                      ))
                    ) : (
                      <StatusPill tone="neutral">Noch keine Ubereinstimmungen erkannt</StatusPill>
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
                      <StatusPill tone="success">Keine offensichtlichen Skill-Lucken</StatusPill>
                    )}
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
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              Wahle einen extrahierten CV und eine Jobbeschreibung aus und erzeuge dann den Interviewleitfaden.
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
              <p className="mt-4 text-sm text-muted-foreground">Bitte zuerst einen extrahierten CV auswahlen.</p>
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
              <p className="mt-4 text-sm text-muted-foreground">Bitte zuerst einen extrahierten Job auswahlen.</p>
            )}
          </article>
        </section>
      </div>
    </AppShell>
  );
}

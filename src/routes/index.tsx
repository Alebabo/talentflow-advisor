import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { AuthRequiredCard } from "@/components/auth-required-card";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { listDocuments } from "@/extraction.functions";
import { ArrowRight, Briefcase, FileText, Sparkles, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const [jobs, applications] = await Promise.all([
        listDocuments({ data: { kind: "job_description" } }),
        listDocuments({ data: { kind: "cv" } }),
      ]);

      return {
        jobs,
        applications,
        authError: null,
      };
    } catch (error) {
      return {
        jobs: [],
        applications: [],
        authError: error instanceof Error ? error.message : "Daten konnten nicht geladen werden.",
      };
    }
  },
  head: () => ({
    meta: [
      { title: "TalentFlow - Recruiting-Arbeitsbereich" },
      { name: "description", content: "Strukturierte, AGG-konforme Interviewvorbereitung fur Metafinanz / HTM." },
    ],
  }),
  component: Index,
});

function Index() {
  const { jobs, applications, authError } = Route.useLoaderData();

  const formatVerarbeitungsstatus = (status: string) => {
    if (status === "uploaded") return "Hochgeladen";
    if (status === "processing") return "In Verarbeitung";
    if (status === "extracted") return "Extrahiert";
    if (status === "failed") return "Fehlgeschlagen";
    return status;
  };

  const stats = [
    { label: "Jobs", value: jobs.length, icon: Briefcase },
    { label: "Bewerbungen", value: applications.length, icon: FileText },
    { label: "Teams", value: 0, icon: Users },
    {
      label: "Extrahiert",
      value: jobs.filter((job) => job.status === "extracted").length + applications.filter((application) => application.status === "extracted").length,
      icon: Sparkles,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Uebersicht"
        description="Status der laufenden Recruiting-Pipeline - Jobs und Bewerbungen im Blick."
        actions={
          <Button asChild>
            <Link to="/workspace">
              Interview vorbereiten <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="space-y-8 px-6 py-8 md:px-10">
        {authError && <AuthRequiredCard message={authError} />}

        <div className="relative overflow-hidden rounded-2xl border border-border bg-spectral-soft p-6 md:p-8">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-spectral" />
          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f004c]/70">metafinanz · HTM</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Wir bringen <span className="text-spectral">Zukunftsfaehigkeit</span> ans Licht.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-foreground/70">
              Strukturierte, AGG-konforme Interviewvorbereitung mit echten Dokumentdaten aus Supabase.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-spectral opacity-70" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</span>
                  <Icon className="h-4 w-4 text-[#854bff]" />
                </div>
                <div className="mt-3 text-2xl font-semibold text-foreground">{stat.value}</div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Aktuelle Jobs</h2>
              <Link to="/jobs" className="text-xs text-primary hover:underline">Alle anzeigen</Link>
            </div>
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Jobdokumente vorhanden.</p>
            ) : (
              <ul className="divide-y divide-border">
                {jobs.slice(0, 3).map((job) => {
                  const extraction = job.kind === "job_description" ? job.extraction : null;
                  return (
                    <li key={job.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">
                          {(extraction && "title" in extraction && extraction.title) || job.filename}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(extraction && "location" in extraction && extraction.location) || "Kein Standort"} · {(extraction && "seniority" in extraction && extraction.seniority) || "Nicht erkannt"}
                        </div>
                      </div>
                      <StatusPill tone={job.status === "extracted" ? "success" : job.status === "processing" ? "warning" : "neutral"}>
                        {formatVerarbeitungsstatus(job.status)}
                      </StatusPill>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Neue Bewerbungen</h2>
              <Link to="/applications" className="text-xs text-primary hover:underline">Alle anzeigen</Link>
            </div>
            {applications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine CV-Dokumente vorhanden.</p>
            ) : (
              <ul className="space-y-3">
                {applications.slice(0, 3).map((application) => {
                  const extraction = application.kind === "cv" ? application.extraction : null;
                  const fullName = extraction && "full_name" in extraction ? extraction.full_name : null;
                  return (
                    <li key={application.id} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                        {(fullName || application.filename)
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{fullName || application.filename}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {(extraction && "location" in extraction && extraction.location) || "Kein Standort"} · {extraction && "years_experience" in extraction && extraction.years_experience != null ? `${extraction.years_experience} J. Erfahrung` : "Erfahrung offen"}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Teamkontext</h2>
          <p className="text-sm text-muted-foreground">
            Teams werden ueber die Teamkontext-Seite gepflegt und stehen dort fuer Upload und Verwaltung bereit.
          </p>
        </section>
      </div>
    </AppShell>
  );
}

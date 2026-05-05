import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { jobs, applications, teams } from "@/lib/mock-data";
import { ArrowRight, Briefcase, FileText, Users, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TalentFlow – Recruiting Workspace" },
      { name: "description", content: "Strukturierte, AGG-konforme Interviewvorbereitung für Metafinanz / HTM." },
    ],
  }),
  component: Index,
});

const stats = [
  { label: "Aktive Jobs", value: 3, icon: Briefcase },
  { label: "Bewerbungen", value: 4, icon: FileText },
  { label: "Teams", value: 3, icon: Users },
  { label: "Vorbereitete Interviews (Woche)", value: 7, icon: Sparkles },
];

function Index() {
  return (
    <AppShell>
      <PageHeader
        title="Übersicht"
        description="Status der laufenden Recruiting-Pipeline – Jobs, Bewerbungen und Teams im Blick."
        actions={
          <Button asChild>
            <Link to="/workspace">
              Interview vorbereiten <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="px-6 md:px-10 py-8 space-y-8">
        <div className="rounded-2xl bg-spectral-soft border border-border p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-spectral" />
          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f004c]/70">metafinanz · HTM</div>
            <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              Wir bringen <span className="text-spectral">Zukunftsfähigkeit</span> ans Licht.
            </h2>
            <p className="mt-2 text-sm text-foreground/70 max-w-xl">
              Strukturierte, AGG-konforme Interviewvorbereitung – vier Kontextquellen,
              ein Leitfaden, klare Signale.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="relative rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-spectral opacity-70" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</span>
                  <Icon className="h-4 w-4 text-[#854bff]" />
                </div>
                <div className="mt-3 text-2xl font-semibold text-foreground">{s.value}</div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Aktuelle Jobs</h2>
              <Link to="/jobs" className="text-xs text-primary hover:underline">Alle anzeigen</Link>
            </div>
            <ul className="divide-y divide-border">
              {jobs.slice(0, 3).map((j) => (
                <li key={j.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{j.title}</div>
                    <div className="text-xs text-muted-foreground">{j.location} · {j.seniority}</div>
                  </div>
                  <StatusPill tone={j.status === "Aktiv" ? "success" : "neutral"}>{j.status}</StatusPill>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Neue Bewerbungen</h2>
              <Link to="/applications" className="text-xs text-primary hover:underline">Alle anzeigen</Link>
            </div>
            <ul className="space-y-3">
              {applications.slice(0, 3).map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">
                    {a.name.split(" ").map((p) => p[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{a.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.location} · {a.yearsExperience} J. Erfahrung</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Teams</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {teams.map((t) => (
              <div key={t.id} className="rounded-lg border border-border p-4">
                <div className="text-sm font-medium text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.businessUnit}</div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {t.focusAreas.slice(0, 3).map((f) => (
                    <StatusPill key={f} tone="info">{f}</StatusPill>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

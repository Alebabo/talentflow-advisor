import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { jobs, teams } from "@/lib/mock-data";
import { Plus, Upload, Search, MapPin, Building2, Layers } from "lucide-react";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Jobs – TalentFlow" },
      { name: "description", content: "Verwaltung aller Jobbeschreibungen, getrennt von Bewerbungen." },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Jobs"
        description="Bibliothek aller Jobbeschreibungen. Bewerbungen werden separat verwaltet und erst im Interview Workspace zusammengeführt."
        actions={
          <>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" /> Job hochladen
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Neuer Job
            </Button>
          </>
        }
      />

      <div className="px-6 md:px-10 py-8 space-y-6">
        <div className="flex items-center gap-3 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Jobs durchsuchen…" className="pl-9 bg-card" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((j) => {
            const team = teams.find((t) => t.id === j.teamId);
            return (
              <article
                key={j.id}
                className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground leading-snug">{j.title}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" /> {j.company}
                    </div>
                  </div>
                  <StatusPill tone={j.status === "Aktiv" ? "success" : j.status === "Entwurf" ? "warning" : "neutral"}>
                    {j.status}
                  </StatusPill>
                </div>

                <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {j.shortDescription}
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {j.location}</span>
                  <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {j.seniority}</span>
                </div>

                {team && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <div className="text-xs">
                      <div className="text-muted-foreground">Team</div>
                      <div className="font-medium text-foreground">{team.name}</div>
                    </div>
                    <StatusPill tone="info">{team.businessUnit.split("–")[1]?.trim() ?? team.businessUnit}</StatusPill>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

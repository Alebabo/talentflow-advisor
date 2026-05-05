import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { teams } from "@/lib/mock-data";
import { Plus, Users } from "lucide-react";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "Teams – TalentFlow" },
      { name: "description", content: "Teamkontext als zentrale Quelle für die Interviewvorbereitung." },
    ],
  }),
  component: TeamsPage,
});

function TeamsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Teams"
        description="Teams sind die zweite zentrale Kontextquelle des Workspace. Pflege Werte, Interviewstil und Fokusbereiche."
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Neues Team
          </Button>
        }
      />

      <div className="px-6 md:px-10 py-8 grid gap-6 lg:grid-cols-2">
        {teams.map((t) => (
          <article key={t.id} className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">{t.name}</h3>
                <div className="text-xs text-muted-foreground mt-1">{t.businessUnit}</div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> {t.members} Mitglieder
              </span>
            </div>

            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{t.description}</p>

            <div className="mt-5 grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Werte</div>
                <div className="flex flex-wrap gap-1.5">
                  {t.values.map((v) => (
                    <StatusPill key={v} tone="primary">{v}</StatusPill>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Focus Areas</div>
                <div className="flex flex-wrap gap-1.5">
                  {t.focusAreas.map((v) => (
                    <StatusPill key={v} tone="info">{v}</StatusPill>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Interviewstil</div>
              <p className="text-sm text-foreground">{t.interviewStyle}</p>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}

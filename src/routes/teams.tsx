import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "Teams - TalentFlow" },
      { name: "description", content: "Teamkontext als zentrale Quelle fur die Interviewvorbereitung." },
    ],
  }),
  component: TeamsPage,
});

function TeamsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Teams"
        description="Die Teamstruktur ist jetzt im Schema vorgesehen, Daten werden als Nächstes angebunden."
      />

      <div className="px-6 py-8 md:px-10">
        <div className="rounded-xl border border-dashed border-border bg-card p-8">
          <h2 className="text-sm font-semibold text-foreground">Schema für Teamdaten ist angelegt</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Im Supabase-Schema gibt es jetzt eine eigene Tabelle für Teams sowie eine Tabelle für Systemprompts zur Fragenerstellung. Sobald echte Datensätze vorliegen, kann diese Ansicht darauf umgestellt werden.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

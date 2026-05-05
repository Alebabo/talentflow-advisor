import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applications } from "@/lib/mock-data";
import { Plus, Upload, Search, Mail, MapPin } from "lucide-react";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "Applications – TalentFlow" },
      { name: "description", content: "Verwaltung aller Bewerbungen, getrennt von Jobs." },
    ],
  }),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Applications"
        
        actions={
          <>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" /> CV hochladen
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Neue Bewerbung
            </Button>
          </>
        }
      />

      <div className="px-6 md:px-10 py-8 space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Bewerbungen durchsuchen…" className="pl-9 bg-card" />
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-3">Kandidat:in</th>
                <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Standort</th>
                <th className="text-left font-medium px-5 py-3 hidden lg:table-cell">Kurzprofil</th>
                <th className="text-left font-medium px-5 py-3">Skills</th>
                <th className="text-right font-medium px-5 py-3">Erfahrung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {applications.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">
                        {a.name.split(" ").map((p) => p[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">{a.name}</div>
                        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {a.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {a.location}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-muted-foreground max-w-md">
                    <p className="line-clamp-2">{a.shortProfile}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {a.skills.slice(0, 3).map((s) => (
                        <StatusPill key={s} tone="info">{s}</StatusPill>
                      ))}
                      {a.skills.length > 3 && <StatusPill>+{a.skills.length - 3}</StatusPill>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right text-foreground font-medium whitespace-nowrap">
                    {a.yearsExperience} J.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

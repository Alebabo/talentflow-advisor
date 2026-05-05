import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  applications,
  jobs,
  teams,
  interviewGuide,
  top10Questions,
  softSkillQuestions,
  behaviouralQuestions,
  cultureFitQuestions,
  scenarios,
  positiveSignals,
  openRisks,
  interviewPanel,
} from "@/lib/mock-data";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ScrollText,
  Users,
  MessageSquare,
  Lightbulb,
  Clock,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Interview Workspace – TalentFlow" },
      { name: "description", content: "Vier Kontextquellen zu einem AGG-konformen Interviewleitfaden zusammenführen." },
    ],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  const [appId, setAppId] = useState<string>("a1");
  const [jobId, setJobId] = useState<string>("j1");
  const [teamId, setTeamId] = useState<string>("t1");
  const [teamContext, setTeamContext] = useState(
    "Team wächst aktuell um zwei Senior-Rollen. Spannung zwischen Plattform-Roadmap und kurzfristigen Fachbereichs-Anforderungen.",
  );
  const [stage1, setStage1] = useState(
    "Erster Eindruck sehr ruhig, klar strukturiert. Kommunikativ, gute Beispiele zur Stakeholder-Arbeit. Hypothese: hohe Reflexionsfähigkeit, Ambiguitätstoleranz noch zu prüfen. Keine Red Flags.",
  );
  const [generated, setGenerated] = useState(true);
  const [loading, setLoading] = useState(false);

  const application = applications.find((a) => a.id === appId);
  const job = jobs.find((j) => j.id === jobId);
  const team = teams.find((t) => t.id === teamId);

  const handleGenerate = () => {
    setLoading(true);
    setGenerated(false);
    setTimeout(() => {
      setLoading(false);
      setGenerated(true);
    }, 900);
  };

  return (
    <AppShell>
      <PageHeader
        title="Interview Workspace"
        description="Vier Kontextquellen zu einem strukturierten, AGG-konformen Interviewleitfaden zusammenführen."
        actions={
          <StatusPill tone="success">
            <ShieldCheck className="h-3 w-3" /> AGG-geprüft
          </StatusPill>
        }
      />

      <div className="px-6 md:px-10 py-8 space-y-8 max-w-[1400px]">
        {/* Context sources */}
        <section className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
          <header className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Vier Kontextquellen</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Application · Team · Job · Stage-1-Kommentare
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill tone={application ? "success" : "neutral"}>1 Application</StatusPill>
              <StatusPill tone={team ? "success" : "neutral"}>2 Team</StatusPill>
              <StatusPill tone={job ? "success" : "neutral"}>3 Job</StatusPill>
              <StatusPill tone={stage1.length > 20 ? "success" : "warning"}>4 Stage 1</StatusPill>
            </div>
          </header>

          <div className="grid lg:grid-cols-2 gap-6 p-6">
            <div className="space-y-2">
              <Label>Application / CV</Label>
              <Select value={appId} onValueChange={setAppId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {applications.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name} – {a.location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {application && (
                <p className="text-xs text-muted-foreground line-clamp-2">{application.shortProfile}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Job</Label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {job && <p className="text-xs text-muted-foreground line-clamp-2">{job.shortDescription}</p>}
            </div>

            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {team && <p className="text-xs text-muted-foreground line-clamp-2">{team.description}</p>}
            </div>

            <div className="space-y-2">
              <Label>Teamstruktur / -kontext (frei)</Label>
              <Textarea
                value={teamContext}
                onChange={(e) => setTeamContext(e.target.value)}
                rows={3}
                placeholder="Aktuelle Situation, Spannungen, Roadmap-Schwerpunkte…"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label>Recruiter-Kommentare aus Stage 1</Label>
              <Textarea
                value={stage1}
                onChange={(e) => setStage1(e.target.value)}
                rows={5}
                placeholder="Beobachtungen aus dem ersten Gespräch – Stärken, offene Punkte, Hypothesen…"
              />
            </div>
          </div>

          <footer className="px-6 py-4 border-t border-border bg-muted/30 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-xs text-muted-foreground max-w-2xl">
              Die KI liefert Vorbereitung und Hypothesen – keine Entscheidung. Finale Bewertung
              erfolgt durch das Interview-Panel.
            </p>
            <Button size="lg" onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generiere…</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Interviewleitfaden erzeugen</>
              )}
            </Button>
          </footer>
        </section>

        {!generated && !loading && (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Wähle Kontextquellen und erzeuge einen Interviewleitfaden.
            </p>
          </div>
        )}

        {generated && (
          <>
            {/* B Preparation Summary */}
            <SectionCard
              icon={ScrollText}
              title="Preparation Summary"
              subtitle="Management-Zusammenfassung des Interviews"
            >
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <SummaryBlock label="Rolle">{job?.title}</SummaryBlock>
                <SummaryBlock label="Kandidat:in">
                  {application?.name} · {application?.yearsExperience} J. Erfahrung
                </SummaryBlock>
                <SummaryBlock label="Team">{team?.name}</SummaryBlock>
              </div>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Wichtigste Hypothesen</div>
                  <ul className="text-sm space-y-1.5 text-foreground">
                    <li>• Hohe Reflexionsfähigkeit, ruhiger Auftritt – verifizieren</li>
                    <li>• Ambiguitätstoleranz im Plattform-Kontext zu prüfen</li>
                    <li>• Mentoring-Erfahrung passt zum Teamwert „Wissensaustausch“</li>
                  </ul>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Interviewfoki</div>
                  <ul className="text-sm space-y-1.5 text-foreground">
                    <li>• Architektur-Trade-offs und Entscheidungsstil</li>
                    <li>• Stakeholder-Arbeit mit Fachbereich</li>
                    <li>• Umgang mit unklaren Anforderungen</li>
                  </ul>
                </div>
              </div>
              <div className="mt-5 rounded-lg bg-info/10 border border-info/20 p-4">
                <div className="text-xs font-semibold text-info uppercase tracking-wide mb-1">Support Recommendation</div>
                <p className="text-sm text-foreground">
                  Empfehlung: zweistündiges Panel-Interview mit Hiring Manager, Team Lead und Peer.
                  Fokus auf Deep Dive und Ambiguitäts-Szenario. Entscheidung im Anschluss gemeinsam dokumentieren.
                </p>
              </div>
            </SectionCard>

            {/* C Signals / Risks */}
            <div className="grid lg:grid-cols-2 gap-6">
              <SectionCard icon={CheckCircle2} title="Positive Signale" tone="success">
                <ul className="space-y-2.5">
                  {positiveSignals.map((s) => (
                    <li key={s} className="flex gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
              <SectionCard icon={AlertTriangle} title="Zu verifizieren" tone="warning">
                <ul className="space-y-2.5">
                  {openRisks.map((s) => (
                    <li key={s} className="flex gap-2 text-sm text-foreground">
                      <AlertTriangle className="h-4 w-4 text-warning-foreground shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </div>

            {/* A Interviewleitfaden */}
            <SectionCard icon={Clock} title="Interviewleitfaden" subtitle="Strukturierter Gesprächsablauf · ca. 60 Min">
              <ol className="relative border-l border-border ml-2 space-y-5">
                {interviewGuide.map((p, i) => (
                  <li key={p.phase} className="pl-5 relative">
                    <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-medium text-sm text-foreground">{p.phase}</h4>
                      <StatusPill>{p.duration}</StatusPill>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{p.goal}</p>
                    <ul className="mt-2 text-sm text-foreground space-y-1">
                      {p.notes.map((n) => <li key={n}>– {n}</li>)}
                    </ul>
                  </li>
                ))}
              </ol>
            </SectionCard>

            {/* D Top 10 questions */}
            <SectionCard icon={MessageSquare} title="Top 10 personalisierte Fragen" subtitle="Mit Begründung und Quelle">
              <div className="grid md:grid-cols-2 gap-3">
                {top10Questions.map((q, i) => (
                  <div key={q.id} className="rounded-lg border border-border p-4 bg-background/40">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 shrink-0 rounded-md bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">{q.question}</p>
                        <p className="text-xs text-muted-foreground mt-2">{q.why}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <StatusPill tone="info">{q.reference}</StatusPill>
                          {q.scenarioTag && <StatusPill tone="primary">{q.scenarioTag}</StatusPill>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* E Further question blocks */}
            <div className="grid lg:grid-cols-3 gap-6">
              <QuestionList title="Soft Skills" items={softSkillQuestions} />
              <QuestionList title="Behavioural" items={behaviouralQuestions} />
              <QuestionList title="Culture Fit" items={cultureFitQuestions} />
            </div>

            {/* F Scenarios */}
            <SectionCard icon={Lightbulb} title="Gesprächsszenarien" subtitle="Verschiedene Modi für unterschiedliche Signale">
              <div className="grid md:grid-cols-2 gap-4">
                {scenarios.map((s) => (
                  <div key={s.title} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                      <StatusPill tone="primary">Szenario</StatusPill>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{s.goal}</p>
                    <p className="text-sm text-foreground mt-3 leading-relaxed">{s.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {s.signals.map((sig) => <StatusPill key={sig} tone="info">{sig}</StatusPill>)}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* G Compliance */}
            <SectionCard icon={ShieldCheck} title="Company Fit & Compliance" tone="success" subtitle="AGG-konforme Dokumentationshilfe">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                  <div className="text-xs font-semibold text-success uppercase tracking-wide">Status</div>
                  <p className="mt-1 font-medium text-foreground">AGG-konform</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Keine Fragen zu Alter, Herkunft, Religion, Familienstand, Gesundheit oder politischer Einstellung.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Erlaubte Evidenz</div>
                  <ul className="mt-2 space-y-1 text-sm text-foreground">
                    <li>– Beobachtbares Verhalten im Gespräch</li>
                    <li>– Konkrete Projektreferenzen</li>
                    <li>– Reflexion über eigene Entscheidungen</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Offene Risiken</div>
                  <ul className="mt-2 space-y-1 text-sm text-foreground">
                    <li>– Subjektive „Bauchgefühl“-Notizen vermeiden</li>
                    <li>– Eindrücke immer mit Beispiel belegen</li>
                  </ul>
                </div>
              </div>
              <Textarea className="mt-5" rows={3} placeholder="Dokumentationsfähige Notizen für die Akte…" />
            </SectionCard>

            {/* H Panel */}
            <SectionCard icon={Users} title="Empfohlenes Interviewpanel">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {interviewPanel.map((p) => (
                  <div key={p.role} className="rounded-lg border border-border p-4">
                    <StatusPill tone="primary">{p.role}</StatusPill>
                    <div className="mt-3 font-medium text-sm text-foreground">{p.name}</div>
                    <p className="text-xs text-muted-foreground mt-1">{p.focus}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* I Feedback */}
            <SectionCard icon={MessageSquare} title="Feedback nach dem Interview">
              <div className="grid md:grid-cols-2 gap-4">
                <FieldRow label="Interviewer Name"><input className="form-input" placeholder="z. B. Markus Hentschel" /></FieldRow>
                <FieldRow label="Interviewer Rolle"><input className="form-input" placeholder="z. B. Team Lead" /></FieldRow>
                <FieldRow label="Beobachtete Stärken"><Textarea rows={3} placeholder="Konkrete Beobachtungen, mit Beispiel…" /></FieldRow>
                <FieldRow label="Beobachtete Risiken"><Textarea rows={3} placeholder="Was bleibt offen oder unklar?" /></FieldRow>
                <FieldRow label="Culture-Fit-Notizen" full><Textarea rows={3} placeholder="Passung zu Werten und Arbeitsweise des Teams…" /></FieldRow>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline">Entwurf speichern</Button>
                <Button>Feedback abschließen</Button>
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </AppShell>
  );
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  const accent =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning-foreground" : "text-primary";
  return (
    <section className="rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]">
      <header className="px-6 py-4 border-b border-border flex items-start gap-3">
        <div className={`h-9 w-9 shrink-0 rounded-lg bg-muted flex items-center justify-center ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

function SummaryBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

function QuestionList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-3 space-y-2.5">
        {items.map((q) => (
          <li key={q} className="text-sm text-foreground flex gap-2">
            <span className="text-muted-foreground">›</span>
            <span>{q}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FieldRow({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

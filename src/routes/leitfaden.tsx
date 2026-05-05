import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { AuthRequiredCard } from "@/components/auth-required-card";
import { StatusPill } from "@/components/status-pill";
import { listQuestionPrompts, updateQuestionPrompt } from "@/recruiting.functions";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertOctagon,
  CheckCircle2,
  ChevronDown,
  Compass,
  Download,
  ExternalLink,
  Handshake,
  Loader2,
  MessageSquareHeart,
  Save,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/leitfaden")({
  loader: async () => {
    try {
      const prompts = await listQuestionPrompts();
      return {
        prompts,
        authError: null,
      };
    } catch (error) {
      return {
        prompts: [],
        authError: error instanceof Error ? error.message : "Prompts konnten nicht geladen werden.",
      };
    }
  },
  head: () => ({
    meta: [
      { title: "Interview-Leitfaden - TalentFlow" },
      {
        name: "description",
        content: "Offizieller metafinanz Leitfaden fuer Recruiting-Interviews.",
      },
    ],
  }),
  component: LeitfadenPage,
});

const principles = [
  {
    icon: Handshake,
    title: "Dialog statt Verhoer",
    text: "Wir gestalten das Interview als echtes Gespraech auf Augenhoehe - mit Raum fuer die Person hinter dem CV.",
  },
  {
    icon: MessageSquareHeart,
    title: "Wir zeigen Haltung",
    text: "Wir bleiben persoenlich und ehrlich, machen unsere Werte sichtbar und beziehen klar Position.",
  },
  {
    icon: Compass,
    title: "Klarheit und Orientierung",
    text: "Wir geben Struktur, kommunizieren transparent und schaffen Verbindlichkeit fuer die naechsten Schritte.",
  },
];

const flow = [
  {
    step: "01",
    title: "Begruessung",
    time: "ca. 5 Min",
    text: "Einstieg und Orientierung geben: Wie laeuft das Interview ab, was ist geplant?",
  },
  {
    step: "02",
    title: "metafinanz und Kolleg:innen vorstellen",
    time: "ca. 5-10 Min",
    text: "Persoenliches Kennenlernen, Menschlichkeit in der Vorstellung sichtbar machen.",
  },
  {
    step: "03",
    title: "Fragen an die Kandidat:in",
    time: "ca. 20-30 Min",
    text: "Fachliche Fragen zu Erfahrungen, Projekten und Arbeitsweise sowie persoenliche Fragen zu Motivation, Werten und Selbstbild.",
  },
  {
    step: "04",
    title: "Fragen der Kandidat:in beantworten",
    time: "ca. 10-15 Min",
    text: "Raum fuer die Kandidat:in, offene Punkte zu klaeren.",
  },
  {
    step: "05",
    title: "Abschluss und naechste Schritte",
    time: "ca. 5 Min",
    text: "Verbindlichkeit schaffen: Wie geht es im Prozess weiter?",
  },
];

const dos = [
  "Smalltalk-Fragen zur Anreise oder zu ersten Eindruecken helfen fuer einen lockeren Einstieg.",
  "Immer persoenlich und ehrlich bleiben - bei der Unternehmensvorstellung auch Herausforderungen ansprechen.",
  "Eine gute Selbstvorstellung erklaert authentisch, warum man gerne bei metafinanz arbeitet.",
  "Kandidat:innen ausreichend Raum geben, zuhoeren, nicht unterbrechen und echtes Interesse zeigen.",
  "Flexibel bleiben - auch mit vorbereitetem Fragenkatalog.",
  "Lieber eine starke Frage stellen und zuhoeren als zehn Fragen herunterzurattern.",
  "Zum Gespraechsende Klarheit und Verbindlichkeit fuer den weiteren Prozess schaffen.",
];

const factualQuestions = [
  "Was war eine berufliche Herausforderung - und wie hast du sie geloest?",
  "Worauf bist du in deinem letzten Projekt besonders stolz - und warum?",
  "Was hat dich an metafinanz beziehungsweise der Rolle besonders angesprochen?",
  "Kannst du von einer Gelegenheit berichten, bei der du proaktiv eine Initiative oder ein Projekt gestartet hast?",
  "Beschreibe einen Moment, in dem du eine:n Kund:in oder Kolleg:in beraten hast. Wie hast du Beduerfnisse erkannt und eine passende Loesung gefunden?",
  "Wie bleibst du ueber neue Trends im IT-Bereich auf dem Laufenden?",
  "Wie wuerdest du vorgehen, um ein neues Produkt in einem dir unbekannten Markt zu platzieren?",
];

const cultureQuestions = [
  "Was ist dir in der Zusammenarbeit mit Kolleg:innen wichtig?",
  "Wie gehst du mit Rueckschlaegen um?",
  "Was brauchst du, um dich schnell wohlzufuehlen und loslegen zu koennen?",
  "Was macht fuer dich ein gutes Arbeitsklima aus?",
  "Wie gehst du mit offenen Karrierewegen um?",
  "Liest du derzeit ein Buch oder verfolgst einen Podcast, der dich inspiriert?",
];

const forbidden = [
  "Diskriminierende Fragen zu Herkunft, Religion oder politischer Einstellung - als Arbeitgeberin sind wir hier haftbar (AGG).",
  "Zu persoenliche Fragen zu Familie, Schwangerschaft, Alter oder Familienstand.",
  "Beispiele: Woher kommt dein Name? Wie alt bist du eigentlich? Bist du verheiratet, hast du Kinder?",
];

const badStyle = [
  "Ungleichgewicht im Setting, zum Beispiel eine Kandidatin mit drei maennlichen Interviewern.",
  "Castingsituation in der Sitzordnung - stattdessen Atmosphaere auf Augenhoehe schaffen.",
  "Geschlossene Fragen und listenartige Abfragen vermeiden.",
  "Keine Bewertungen wie: Warum glaubst du, dass du gut genug bist?",
  "Vorherige Arbeitgeber nicht abwerten.",
  "Interviews sind Kennenlernen, keine Pruefungen.",
];

function LeitfadenPage() {
  const { prompts: initialPrompts, authError } = Route.useLoaderData();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [prompts, setPrompts] = useState(initialPrompts);
  const [savingPromptId, setSavingPromptId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);

  useEffect(() => {
    setPrompts(initialPrompts);
  }, [initialPrompts]);

  const handlePromptFieldChange = (
    promptId: string,
    updates: Partial<(typeof prompts)[number]>,
  ) => {
    setPrompts((current) =>
      current.map((prompt) => (prompt.id === promptId ? { ...prompt, ...updates } : prompt)),
    );
  };

  const handlePromptSave = async (promptId: string) => {
    const prompt = prompts.find((entry) => entry.id === promptId);

    if (!prompt) {
      return;
    }

    try {
      setSavingPromptId(promptId);
      setSaveError(null);
      setSaveSuccessId(null);

      const updatedPrompt = await updateQuestionPrompt({
        data: {
          id: prompt.id,
          isActive: prompt.is_active,
          systemPrompt: prompt.system_prompt,
        },
      });

      setPrompts((current) =>
        current.map((entry) => (entry.id === updatedPrompt.id ? updatedPrompt : entry)),
      );
      setSaveSuccessId(promptId);
      window.setTimeout(() => {
        setSaveSuccessId((current) => (current === promptId ? null : current));
      }, 2500);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "System-Prompt konnte nicht gespeichert werden.",
      );
    } finally {
      setSavingPromptId(null);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Interview-Leitfaden"
        description="Der offizielle metafinanz Leitfaden fuer Recruiting-Interviews - Haltung, Struktur, Dos und Don'ts."
        actions={
          <>
            <Button variant="outline" asChild>
              <a href="/interview-leitfaden.pdf" target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> PDF oeffnen
              </a>
            </Button>
            <Button asChild>
              <a href="/interview-leitfaden.pdf" download>
                <Download className="mr-2 h-4 w-4" /> Download
              </a>
            </Button>
          </>
        }
      />

      <div className="max-w-[1200px] space-y-8 px-6 py-8 md:px-10">
        {authError === "Anmeldung erforderlich." ? <AuthRequiredCard message={authError} /> : null}

        <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Aktive System-Prompts</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Diese Prompts werden fuer die Generierung der Interviewfragen verwendet.
              </p>
            </div>
            <StatusPill tone="primary">{prompts.length} Prompts</StatusPill>
          </div>

          {saveError ? (
            <div className="mt-4 rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground">
              {saveError}
            </div>
          ) : null}

          {authError && authError !== "Anmeldung erforderlich." ? (
            <div className="mt-4 rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground">
              {authError}
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Schluessel</TableHead>
                    <TableHead>Bereich</TableHead>
                    <TableHead>Bearbeitung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prompts.map((prompt) => (
                    <TableRow key={prompt.id}>
                      <TableCell className="font-medium text-foreground">{prompt.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {prompt.prompt_key}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <StatusPill tone={prompt.is_active ? "success" : "neutral"}>
                            {prompt.target_scope}
                          </StatusPill>
                          <Button
                            variant={prompt.is_active ? "outline" : "default"}
                            size="sm"
                            className="w-fit"
                            onClick={() =>
                              handlePromptFieldChange(prompt.id, { is_active: !prompt.is_active })
                            }
                          >
                            {prompt.is_active ? "Deaktivieren" : "Aktivieren"}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xl text-sm text-muted-foreground">
                        <div className="space-y-3">
                          <Textarea
                            value={prompt.system_prompt}
                            onChange={(event) =>
                              handlePromptFieldChange(prompt.id, {
                                system_prompt: event.target.value,
                              })
                            }
                            className="min-h-[140px] bg-background"
                          />
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs text-muted-foreground">
                              {saveSuccessId === prompt.id
                                ? "Gespeichert."
                                : prompt.description || "Keine Beschreibung vorhanden."}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => void handlePromptSave(prompt.id)}
                              disabled={savingPromptId === prompt.id}
                            >
                              {savingPromptId === prompt.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Speichert...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Speichern
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <Collapsible open={isGuideOpen} onOpenChange={setIsGuideOpen}>
          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/30"
              >
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Leitfaden-Inhalt</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Der restliche Leitfaden ist standardmaessig eingeklappt.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill tone="neutral">
                    {isGuideOpen ? "Eingeklappt ausblenden" : "Ausklappen"}
                  </StatusPill>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${isGuideOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="space-y-8 border-t border-border px-6 py-6 md:px-8">
                <section className="relative overflow-hidden rounded-2xl border border-border bg-spectral-soft p-6 md:p-8">
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-spectral" />
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f004c]/70">
                    metafinanz - Employer Branding
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                    Was ist ein <span className="text-spectral">gutes Interview</span>?
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/75">
                    In jedem Interview bauen wir eine Beziehung mit unseren Kandidat:innen auf und
                    machen unsere Arbeitgebermarke sichtbar. Drei Elemente machen ein
                    Recruiting-Interview gut.
                  </p>
                </section>

                <div className="grid gap-4 md:grid-cols-3">
                  {principles.map((principle) => {
                    const Icon = principle.icon;
                    return (
                      <div
                        key={principle.title}
                        className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
                      >
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-spectral opacity-70" />
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-[#854bff]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h3 className="mt-3 text-sm font-semibold text-foreground">
                          {principle.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {principle.text}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] md:p-8">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold text-foreground">Empfohlener Ablauf</h3>
                    <StatusPill tone="primary">ca. 50 Min gesamt</StatusPill>
                  </div>
                  <ol className="mt-5 grid gap-3 md:grid-cols-5">
                    {flow.map((item) => (
                      <li
                        key={item.step}
                        className="relative rounded-lg border border-border bg-background/40 p-4"
                      >
                        <div className="text-[11px] font-semibold text-[#854bff]">{item.step}</div>
                        <div className="mt-1 text-sm font-semibold leading-snug text-foreground">
                          {item.title}
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">{item.time}</div>
                        <p className="mt-2 text-xs leading-relaxed text-foreground/80">
                          {item.text}
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>

                <section className="rounded-xl border border-border bg-card p-6 md:p-8">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#1f7a1f]" />
                    <h3 className="text-base font-semibold text-foreground">Dos</h3>
                  </div>
                  <ul className="mt-4 grid gap-x-8 gap-y-2.5 md:grid-cols-2">
                    {dos.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-foreground">
                        <span className="mt-0.5 text-[#64e100]">{">"}</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="rounded-xl border border-border bg-card p-6">
                    <h3 className="text-sm font-semibold text-foreground">
                      Beispielfragen: Fachlichkeit, Haltung, Zukunftskompetenz
                    </h3>
                    <ul className="mt-4 space-y-2.5">
                      {factualQuestions.map((question) => (
                        <li key={question} className="flex gap-2 text-sm text-foreground">
                          <span className="text-muted-foreground">-</span>
                          <span>{question}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className="rounded-xl border border-border bg-card p-6">
                    <h3 className="text-sm font-semibold text-foreground">
                      Beispielfragen: Zusammenarbeit, Werte und Persoenlichkeit
                    </h3>
                    <ul className="mt-4 space-y-2.5">
                      {cultureQuestions.map((question) => (
                        <li key={question} className="flex gap-2 text-sm text-foreground">
                          <span className="text-muted-foreground">-</span>
                          <span>{question}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Rechtlich nicht zulaessig - verboten
                      </h3>
                    </div>
                    <ul className="mt-3 space-y-2.5 text-sm text-foreground">
                      {forbidden.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-0.5 text-destructive">x</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className="rounded-xl border border-warning/40 bg-warning/5 p-6">
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="h-4 w-4 text-[#8a6a00]" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Schlechter Stil - unangebracht
                      </h3>
                    </div>
                    <ul className="mt-3 space-y-2.5 text-sm text-foreground">
                      {badStyle.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-0.5 text-[#8a6a00]">!</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <section className="overflow-hidden rounded-xl border border-border bg-card">
                  <header className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Original-PDF</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Vollstaendiger Leitfaden zum Lesen oder Download
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/interview-leitfaden.pdf" download>
                        <Download className="mr-2 h-4 w-4" /> Download
                      </a>
                    </Button>
                  </header>
                  <iframe
                    src="/interview-leitfaden.pdf"
                    title="Interview-Leitfaden PDF"
                    className="h-[720px] w-full bg-muted"
                  />
                </section>
              </div>
            </CollapsibleContent>
          </section>
        </Collapsible>
      </div>
    </AppShell>
  );
}

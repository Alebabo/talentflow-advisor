import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Lightbulb,
  MessageSquareQuote,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";

export const Route = createFileRoute("/antworten-leitfaden")({
  head: () => ({
    meta: [
      { title: "Antworten-Leitfaden - TalentFlow" },
      {
        name: "description",
        content: "Leitfaden mit starken Antwortmustern fuer Recruiting-Interviews bei metafinanz.",
      },
    ],
  }),
  component: AntwortenLeitfadenPage,
});

const principles = [
  {
    icon: Target,
    title: "Konkret statt generisch",
    text: "Starke Antworten arbeiten mit einer echten Situation, einem klaren Beitrag und einem nachvollziehbaren Ergebnis.",
  },
  {
    icon: Sparkles,
    title: "Reflexion statt Selbstlob",
    text: "Die beste Wirkung entsteht, wenn Kandidat:innen nicht nur Erfolge nennen, sondern auch Entscheidungen, Lernpunkte und Grenzen reflektieren.",
  },
  {
    icon: MessageSquareQuote,
    title: "Arbeitsbezogen und anschlussfaehig",
    text: "Gute Antworten verbinden die eigene Erfahrung sichtbar mit Rolle, Team, Kundennutzen und Zusammenarbeit.",
  },
];

const answerPatterns = [
  {
    question: "Erzaehl von einer beruflichen Herausforderung.",
    ideal:
      "In meinem letzten Projekt gab es kurz vor dem Go-live eine kritische Abhaengigkeit zwischen Fachbereich und Entwicklung. Ich habe die offenen Punkte priorisiert, einen taeglichen Sync mit klaren Entscheidungen eingefuehrt und die Risiken transparent gemacht. Dadurch konnten wir die wichtigsten Funktionen termingerecht liefern und die restlichen Themen sauber nachziehen. Wichtig war fuer mich, Druck nicht zu verstecken, sondern Struktur in die Situation zu bringen.",
    why: "Die Antwort zeigt Verantwortung, Priorisierung, Kommunikation und Wirkung.",
    avoid: "Es war alles sehr stressig, aber ich habe viel gearbeitet und am Ende hat es geklappt.",
  },
  {
    question: "Warum interessiert dich diese Rolle bei metafinanz?",
    ideal:
      "Mich reizt die Verbindung aus fachlicher Tiefe, Kundennaehe und Gestaltungsraum. In meinen bisherigen Stationen habe ich gemerkt, dass ich besonders stark bin, wenn ich komplexe Themen mit unterschiedlichen Stakeholdern zusammenbringe. Die Rolle passt dazu, weil sie genau diese Mischung aus Beratung, Struktur und Eigenverantwortung verlangt. metafinanz ist fuer mich spannend, weil Leistung und Haltung zusammen gedacht werden.",
    why: "Die Antwort verbindet Motivation, eigenes Profil und Arbeitgeberfit.",
    avoid: "Die Stelle klingt spannend und ich moechte mich einfach gern weiterentwickeln.",
  },
  {
    question: "Wie gehst du mit Rueckschlaegen um?",
    ideal:
      "Ich versuche zuerst, die Situation zu entemotionalisieren und die eigentliche Ursache sauber zu verstehen. In einem Projekt habe ich zum Beispiel gemerkt, dass ein Ansatz fachlich nicht tragfaehig war. Statt ihn zu verteidigen, habe ich die Annahmen offengelegt, eine Alternative vorbereitet und das Team frueh eingebunden. Rueckschlaege sind fuer mich unangenehm, aber oft der Punkt, an dem gute Zusammenarbeit und Lernfaehigkeit sichtbar werden.",
    why: "Die Antwort zeigt Reife, Ownership und Lernorientierung.",
    avoid: "Rueckschlaege motivieren mich nur noch mehr, deshalb habe ich damit kein Problem.",
  },
  {
    question: "Wie arbeitest du im Team?",
    ideal:
      "Ich arbeite gern mit klaren Erwartungen, offener Kommunikation und sichtbarer Verantwortung. In Teams uebernehme ich oft die Rolle, Komplexitaet zu ordnen und Dinge anschlussfaehig zu machen, ohne andere zu ueberfahren. Mir ist wichtig, Wissen nicht bei mir zu behalten, sondern Entscheidungen nachvollziehbar zu machen. Gute Zusammenarbeit heisst fuer mich, Verbindlichkeit und Respekt gleichzeitig hochzuhalten.",
    why: "Die Antwort macht Zusammenarbeit konkret statt nur sympathisch klingend.",
    avoid: "Ich bin ein absoluter Teamplayer und komme eigentlich mit allen gut klar.",
  },
];

const structureRules = [
  "Situation: Worum ging es konkret?",
  "Aufgabe: Wofuer war ich verantwortlich?",
  "Vorgehen: Welche Entscheidung oder Handlung habe ich gesetzt?",
  "Ergebnis: Was war die Wirkung?",
  "Reflexion: Was habe ich gelernt oder heute anders im Blick?",
];

const goodSignals = [
  "Klarer Ich-Beitrag statt nur Wir-Form.",
  "Messbare oder beobachtbare Wirkung.",
  "Saubere Verbindung zwischen Erfahrung und Zielrolle.",
  "Reflexion ueber Lernkurven, Risiken oder Zielkonflikte.",
  "Ruhige, glaubwuerdige Sprache ohne Uebertreibung.",
];

const weakSignals = [
  "Zu abstrakt oder nur Schlagwoerter ohne Beispiel.",
  "Reines Selbstlob ohne Situation oder Ergebnis.",
  "Nur Aktivitaet beschrieben, aber keine Wirkung.",
  "Ausweichende Antworten bei Fehlern oder Konflikten.",
  "Passung zur Rolle bleibt offen.",
];

function AntwortenLeitfadenPage() {
  return (
    <AppShell>
      <PageHeader
        title="Antworten-Leitfaden"
        description="Beispiele fuer starke, glaubwuerdige Interviewantworten mit Fokus auf Struktur, Wirkung und metafinanz-Passung."
        actions={
          <>
            <Button variant="outline" asChild>
              <a href="/interview-leitfaden.pdf" target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Basis-Leitfaden
              </a>
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Antworten merken
            </Button>
          </>
        }
      />

      <div className="max-w-[1200px] space-y-8 px-6 py-8 md:px-10">
        <section className="relative overflow-hidden rounded-2xl border border-border bg-spectral-soft p-6 md:p-8">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-spectral" />
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f004c]/70">
            Antwortqualitaet im Interview
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Gute Antworten wirken{" "}
            <span className="text-spectral">konkret, reflektiert und relevant</span>
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/75">
            Dieser Leitfaden zeigt keine auswendig gelernten Standardsaetze, sondern das Muster
            hinter starken Antworten. Ziel ist, fachliche Eignung, Zusammenarbeit und Haltung klar
            sichtbar zu machen.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          {principles.map((principle) => {
            const Icon = principle.icon;
            return (
              <section
                key={principle.title}
                className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-spectral opacity-70" />
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-[#854bff]">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{principle.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {principle.text}
                </p>
              </section>
            );
          })}
        </div>

        <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] md:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-base font-semibold text-foreground">Empfohlene Antwortstruktur</h3>
            <StatusPill tone="primary">5 Schritte</StatusPill>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {structureRules.map((rule, index) => (
              <div key={rule} className="rounded-lg border border-border bg-background/40 p-4">
                <div className="text-[11px] font-semibold text-[#854bff]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">{rule}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[#8a6a00]" />
            <h3 className="text-base font-semibold text-foreground">Optimale Antwortmuster</h3>
          </div>

          <div className="grid gap-4">
            {answerPatterns.map((pattern) => (
              <article
                key={pattern.question}
                className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-foreground">{pattern.question}</h4>
                  <StatusPill tone="warning">Beispielantwort</StatusPill>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                  <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Starke Antwort
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                      {pattern.ideal}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-background p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Warum das gut ist
                      </div>
                      <p className="mt-2 text-sm text-foreground/80">{pattern.why}</p>
                    </div>

                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <TriangleAlert className="h-4 w-4 text-destructive" />
                        Schwache Variante
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                        {pattern.avoid}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <h3 className="text-sm font-semibold text-foreground">
                Woran man starke Antworten erkennt
              </h3>
            </div>
            <ul className="mt-4 space-y-2.5">
              {goodSignals.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-foreground">
                  <span className="mt-0.5 text-success">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-warning/40 bg-warning/5 p-6">
            <div className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-[#8a6a00]" />
              <h3 className="text-sm font-semibold text-foreground">
                Typische Schwaechen in Antworten
              </h3>
            </div>
            <ul className="mt-4 space-y-2.5">
              {weakSignals.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-foreground">
                  <span className="mt-0.5 text-[#8a6a00]">!</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

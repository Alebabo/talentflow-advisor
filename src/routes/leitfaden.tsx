import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  Download,
  ExternalLink,
  Handshake,
  Compass,
  MessageSquareHeart,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  ChevronDown,
  Upload,
  FileCode2,
  Trash2,
} from "lucide-react";

type SkillDoc = { name: string; size: number; uploadedAt: string; content: string };

export const Route = createFileRoute("/leitfaden")({
  head: () => ({
    meta: [
      { title: "Interview-Leitfaden – TalentFlow" },
      { name: "description", content: "Offizieller metafinanz Leitfaden für Recruiting-Interviews." },
    ],
  }),
  component: LeitfadenPage,
});

const principles = [
  {
    icon: Handshake,
    title: "Dialog statt Verhör",
    text: "Wir gestalten das Interview als echtes Gespräch auf Augenhöhe – mit Raum für die Person hinter dem CV.",
  },
  {
    icon: MessageSquareHeart,
    title: "Wir zeigen Haltung",
    text: "Wir bleiben persönlich und ehrlich, machen unsere Werte sichtbar und beziehen klar Position.",
  },
  {
    icon: Compass,
    title: "Klarheit und Orientierung",
    text: "Wir geben Struktur, kommunizieren transparent und schaffen Verbindlichkeit für die nächsten Schritte.",
  },
];

const flow = [
  { step: "01", title: "Begrüßung", time: "ca. 5 Min", text: "Einstieg und Orientierung geben (wie läuft das Interview ab, was ist geplant)." },
  { step: "02", title: "metafinanz und Kolleg:innen vorstellen", time: "ca. 5–10 Min", text: "Persönliches Kennenlernen, Menschlichkeit in der Vorstellung zum Ausdruck bringen." },
  { step: "03", title: "Fragen an die Kandidat:in", time: "ca. 20–30 Min", text: "Fachliche Fragen (Erfahrungen, Projekte, Arbeitsweise) und persönliche Fragen (Motivation, Werte, Selbstbild)." },
  { step: "04", title: "Fragen der Kandidat:in beantworten", time: "ca. 10–15 Min", text: "Raum für die Kandidat:in, offene Punkte zu klären." },
  { step: "05", title: "Abschluss und nächste Schritte", time: "ca. 5 Min", text: "Verbindlichkeit: Wie geht es im Prozess weiter?" },
];

const dos = [
  "Smalltalk-Fragen zur Anreise oder zu ersten Eindrücken helfen für einen lockeren Einstieg.",
  "Immer persönlich und ehrlich bleiben – bei der Unternehmensvorstellung auch Herausforderungen ansprechen.",
  "Idee bei der Selbstvorstellung: „Warum ich gerne bei metafinanz arbeite“ – authentisch.",
  "Kandidat:innen ausreichend Raum geben, zuhören, nicht unterbrechen und echtes Interesse zeigen.",
  "Flexibel bleiben – auch mit vorbereitetem Fragenkatalog.",
  "Eine starke Frage öffnet Raum. Lieber eine gute Frage stellen und zuhören als zehn Fragen herunterzurattern.",
  "Zum Gesprächsende Klarheit und Verbindlichkeit für den weiteren Prozess schaffen.",
];

const factualQuestions = [
  "Was war eine berufliche Herausforderung – und wie hast du sie gelöst?",
  "Worauf bist du in deinem letzten Projekt besonders stolz – warum?",
  "Was hat dich an metafinanz bzw. der Rolle besonders angesprochen?",
  "Unternehmergeist: Kannst du von einer Gelegenheit berichten, bei der du proaktiv eine Initiative oder ein Projekt gestartet hast?",
  "Zugewandtheit: Beschreibe einen Moment, in dem du eine:n Kund:in oder Kolleg:in beraten hast. Wie hast du Bedürfnisse festgestellt und eine passende Lösung gefunden?",
  "Zukunftsorientierung: Wie bleibst du auf dem Laufenden über die neuesten Trends im IT-Bereich?",
  "Sales: Wie würdest du vorgehen, um ein neues Produkt in einem dir unbekannten Markt zu platzieren?",
];

const cultureQuestions = [
  "Was ist dir in der Zusammenarbeit mit Kolleg:innen wichtig?",
  "Wie gehst du mit Rückschlägen um?",
  "Was brauchst du, um dich schnell wohlzufühlen und loslegen zu können?",
  "Was macht für dich ein gutes Arbeitsklima aus?",
  "Wie gehst du mit offenen Karrierewegen um?",
  "Liest du derzeit ein Buch oder verfolgst einen Podcast, der dich inspiriert?",
];

const forbidden = [
  "Diskriminierende Fragen zu Herkunft, Religion, politischer Einstellung – als Arbeitgeberin sind wir hier haftbar (AGG).",
  "Zu persönliche Fragen zu Familie, Schwangerschaft, Alter, Familienstand.",
  "Beispiele: „Woher kommt dein Name?“, „Wie alt bist du eigentlich?“, „Bist du verheiratet, hast du Kinder?“",
];

const badStyle = [
  "Ungleichgewicht im Setting: z. B. eine Kandidatin, drei männliche Interviewer – unangenehm.",
  "Castingsituation in der Sitzordnung – stattdessen Atmosphäre auf Augenhöhe schaffen.",
  "Geschlossene Fragen (ja/nein) und listenartige Abfragen vermeiden.",
  "Keine Bewertungen wie „Warum glaubst du, dass du gut genug bist?“",
  "Vorherige Arbeitgeber nicht abwerten („Da lernt man ja nicht viel, oder?“).",
  "Interviews sind Kennenlernen, keine Prüfungen.",
];

function Section({
  title,
  defaultOpen = true,
  meta,
  children,
  className = "",
}: {
  title: React.ReactNode;
  defaultOpen?: boolean;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className={`rounded-xl border border-border bg-card ${className}`}>
      <CollapsibleTrigger className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {meta}
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-6 pb-6 pt-1">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function SkillUpload() {
  const [skills, setSkills] = useState<SkillDoc[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("tf.skillDocs") || "[]");
    } catch {
      return [];
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const persist = (next: SkillDoc[]) => {
    setSkills(next);
    localStorage.setItem("tf.skillDocs", JSON.stringify(next));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const accepted: SkillDoc[] = [];
    for (const f of Array.from(files)) {
      if (!f.name.toLowerCase().endsWith(".md")) {
        toast.error(`${f.name}: nur .md Dateien erlaubt`);
        continue;
      }
      if (f.size > 500_000) {
        toast.error(`${f.name}: max. 500 KB`);
        continue;
      }
      const content = await f.text();
      accepted.push({ name: f.name, size: f.size, uploadedAt: new Date().toISOString(), content });
    }
    if (accepted.length) {
      persist([...skills, ...accepted]);
      toast.success(`${accepted.length} Skill-Dokument(e) hochgeladen`);
    }
  };

  return (
    <Section
      title={
        <span className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-[#854bff]" />
          Skill-Dokumente für die Fragen-Generierung
        </span>
      }
      meta={<StatusPill tone="primary">{skills.length} aktiv</StatusPill>}
      defaultOpen
    >
      <p className="text-sm text-muted-foreground leading-relaxed">
        Lade Markdown-Dateien (.md) mit rollenspezifischen Skills, Tech-Stacks oder Bewertungskriterien hoch.
        Diese werden im Interview Workspace bei der KI-gestützten Fragen-Generierung als Kontext mitverwendet.
      </p>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="mt-4 rounded-lg border border-dashed border-border bg-background/40 p-6 text-center"
      >
        <Upload className="h-5 w-5 text-muted-foreground mx-auto" />
        <p className="mt-2 text-sm text-foreground">Markdown hierher ziehen oder auswählen</p>
        <p className="text-xs text-muted-foreground">Nur .md · max. 500 KB pro Datei</p>
        <input
          ref={inputRef}
          type="file"
          accept=".md,text/markdown"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
        <Button size="sm" className="mt-3" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" /> Datei auswählen
        </Button>
      </div>

      {skills.length > 0 && (
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
          {skills.map((s, i) => (
            <li key={s.name + i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileCode2 className="h-4 w-4 text-[#854bff] shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {(s.size / 1024).toFixed(1)} KB · {new Date(s.uploadedAt).toLocaleDateString("de-DE")}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => persist(skills.filter((_, idx) => idx !== i))}
                aria-label="Entfernen"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function LeitfadenPage() {
  return (
    <AppShell>
      <PageHeader
        title="Interview-Leitfaden"
        description="Der offizielle metafinanz Leitfaden für Recruiting-Interviews – Haltung, Struktur, Dos und Don'ts."
        actions={
          <>
            <Button variant="outline" asChild>
              <a href="/interview-leitfaden.pdf" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" /> PDF öffnen
              </a>
            </Button>
            <Button asChild>
              <a href="/interview-leitfaden.pdf" download>
                <Download className="h-4 w-4 mr-2" /> Download
              </a>
            </Button>
          </>
        }
      />

      <div className="px-6 md:px-10 py-8 space-y-8 max-w-[1200px]">
        {/* Hero */}
        <section className="rounded-2xl bg-spectral-soft border border-border p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-spectral" />
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f004c]/70">metafinanz · Employer Branding</div>
          <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
            Was ist ein <span className="text-spectral">gutes Interview</span>?
          </h2>
          <p className="mt-3 text-sm text-foreground/75 max-w-2xl leading-relaxed">
            In jedem Interview bauen wir eine Beziehung mit unseren Kandidat:innen auf und machen
            unsere Arbeitgebermarke sichtbar. Drei Elemente machen ein Recruiting-Interview gut.
          </p>
        </section>

        {/* Three principles */}
        <div className="grid md:grid-cols-3 gap-4">
          {principles.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="relative rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-spectral opacity-70" />
                <div className="h-9 w-9 rounded-lg bg-accent text-[#854bff] flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{p.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{p.text}</p>
              </div>
            );
          })}
        </div>

        {/* Skill upload for question generation */}
        <SkillUpload />

        {/* Flow */}
        <Section
          title="Empfohlener Ablauf"
          meta={<StatusPill tone="primary">ca. 50 Min gesamt</StatusPill>}
        >
          <ol className="grid gap-3 md:grid-cols-5">
            {flow.map((f) => (
              <li key={f.step} className="rounded-lg border border-border p-4 bg-background/40 relative">
                <div className="text-[11px] font-semibold text-[#854bff]">{f.step}</div>
                <div className="mt-1 text-sm font-semibold text-foreground leading-snug">{f.title}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{f.time}</div>
                <p className="mt-2 text-xs text-foreground/80 leading-relaxed">{f.text}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Dos */}
        <Section
          title={
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#1f7a1f]" />
              Dos
            </span>
          }
        >
          <ul className="grid md:grid-cols-2 gap-x-8 gap-y-2.5">
            {dos.map((d) => (
              <li key={d} className="flex gap-2 text-sm text-foreground">
                <span className="text-[#64e100] mt-0.5">›</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Question banks */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Section title="Beispielfragen: Fachlichkeit, Haltung, Zukunftskompetenz" defaultOpen={false}>
            <ul className="space-y-2.5">
              {factualQuestions.map((q) => (
                <li key={q} className="text-sm text-foreground flex gap-2">
                  <span className="text-muted-foreground">·</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Beispielfragen: Zusammenarbeit, Werte & Persönlichkeit" defaultOpen={false}>
            <ul className="space-y-2.5">
              {cultureQuestions.map((q) => (
                <li key={q} className="text-sm text-foreground flex gap-2">
                  <span className="text-muted-foreground">·</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {/* Don'ts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Section
            className="border-destructive/30 bg-destructive/5"
            defaultOpen={false}
            title={
              <span className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                Rechtlich nicht zulässig – verboten
              </span>
            }
          >
            <ul className="space-y-2.5 text-sm text-foreground">
              {forbidden.map((d) => (
                <li key={d} className="flex gap-2"><span className="text-destructive mt-0.5">×</span><span>{d}</span></li>
              ))}
            </ul>
          </Section>
          <Section
            className="border-warning/40 bg-warning/5"
            defaultOpen={false}
            title={
              <span className="flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-[#8a6a00]" />
                Schlechter Stil – unangebracht
              </span>
            }
          >
            <ul className="space-y-2.5 text-sm text-foreground">
              {badStyle.map((d) => (
                <li key={d} className="flex gap-2"><span className="text-[#8a6a00] mt-0.5">!</span><span>{d}</span></li>
              ))}
            </ul>
          </Section>
        </div>

        {/* PDF embed */}
        <Section
          defaultOpen={false}
          title="Original-PDF"
          meta={
            <Button variant="outline" size="sm" asChild onClick={(e) => e.stopPropagation()}>
              <a href="/interview-leitfaden.pdf" download>
                <Download className="h-4 w-4 mr-2" /> Download
              </a>
            </Button>
          }
        >
          <iframe
            src="/interview-leitfaden.pdf"
            title="Interview-Leitfaden PDF"
            className="w-full h-[720px] bg-muted rounded-lg border border-border"
          />
        </Section>
      </div>
    </AppShell>
  );
}

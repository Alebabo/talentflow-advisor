# TalentFlow Advisor - Agent Handoff

Stand: 2026-07-07

Dieses Dokument ist fuer nachfolgende Coding-Agenten gedacht. Es beschreibt den aktuellen Stand der App, die relevanten Endpunkte/Routen, Datenfluesse, Konventionen und bekannte offene Punkte.

## Kurzfassung

TalentFlow Advisor ist eine TanStack Start / React / Vite App fuer metafinanz Recruiting. Ziel ist ein AGG-konformer Interview-Workspace, der Bewerbungsprofil, Job, Teamkontext, Stage-1-Notizen und den Interview-Leitfaden zu einem kompakten Interview-Steckbrief bzw. Onepager zusammenfuehrt.

Aktuell ist die App weitgehend prototypisch und clientnah:

- Mock-Daten fuer Jobs, Bewerbungen, Teams, Fragen und Interviewleitfaden liegen in `src/lib/mock-data.ts`.
- CV-Uploads werden lokal im Browser verarbeitet und in `localStorage` gespeichert.
- Es gibt eine serverseitige TanStack Start Funktion fuer OpenAI, die ueber `OPENAI_API_KEY` den Responses-Endpunkt nutzt.
- PDF-Export des Interview-Steckbriefs erfolgt clientseitig mit `jspdf`.
- Persistente Backend-Datenbank, Auth, echte CRUD-Endpunkte und produktive Dokumentenverarbeitung sind noch nicht vorhanden.

## Projektstruktur

Wichtige Dateien:

- `package.json`: Scripts und Dependencies.
- `vite.config.ts`: Nutzt `@lovable.dev/vite-tanstack-config`; keine TanStack/React/Tailwind/Cloudflare-Plugins manuell doppelt hinzufuegen.
- `wrangler.jsonc`: Cloudflare-Konfiguration fuer TanStack Start.
- `src/router.tsx`: Router-Erzeugung und Default-Error-Komponente.
- `src/routeTree.gen.ts`: automatisch generiert; nicht manuell editieren.
- `src/routes/*.tsx`: UI-Routen.
- `src/components/app-shell.tsx`: Sidebar, Navigation, PageHeader.
- `src/components/ui/*`: shadcn/Radix-nahe UI-Komponenten.
- `src/styles.css`: globale Styles, Tailwind v4, Theme-Tokens.
- `src/lib/mock-data.ts`: zentrale Mock-Domain-Daten und Typen.
- `src/lib/application-storage.ts`: CV-Dateiverarbeitung, PDF-Text-Extraktion, LocalStorage-Hook.
- `src/lib/interview-master-prompt.ts`: Master-Prompt und Prompt-Kontext fuer den Onepager.
- `src/lib/interview-recommendations.ts`: Frage-Priorisierung, CV-Luecken-Hinweise, Summary-Text.
- `src/lib/openai-onepager.ts`: serverseitige OpenAI-Funktion.
- `src/lib/pdf-export.ts`: clientseitiger Onepager-PDF-Export.
- `public/interview-leitfaden.pdf`: statischer Interview-Leitfaden.
- `output/`: generierte Word/PDF/PowerPoint-Artefakte, aktuell als Arbeits-/Referenzoutput vorhanden.
- `tmp/pdfs/`: gerenderte/zwischengespeicherte PDF-Bilder.

## Start, Build, Checks

Vom Projektordner `talentflow-advisor` aus:

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

Hinweise:

- `package-lock.json` und `bun.lockb` existieren beide. Wenn nicht anders verlangt, bei Node/npm bleiben, weil `package.json` npm-Scripts definiert.
- Die App laeuft lokal ueber `vite dev`.
- Fuer die OpenAI-Funktion muss serverseitig `OPENAI_API_KEY` gesetzt sein.
- Es gibt aktuell keine dedizierte Test-Suite.
- `eslint` ist eingerichtet; `@typescript-eslint/no-unused-vars` ist deaktiviert.

## UI-Routen

Diese Routen sind in `src/routeTree.gen.ts` registriert und werden ueber TanStack Router aus `src/routes` erzeugt:

| Pfad | Datei | Zweck |
| --- | --- | --- |
| `/` | `src/routes/index.tsx` | Dashboard/Uebersicht mit Kennzahlen, Jobs, Bewerbungen und Teams. |
| `/jobs` | `src/routes/jobs.tsx` | Jobuebersicht aus Mock-Daten. Buttons fuer Upload/Neuanlage sind UI-only. |
| `/applications` | `src/routes/applications.tsx` | Bewerbungsuebersicht, CV-Upload, lokale Entfernung hochgeladener CVs. |
| `/teams` | `src/routes/teams.tsx` | Teamuebersicht mit Werten, Fokusfeldern und Interviewstil. |
| `/workspace` | `src/routes/workspace.tsx` | Hauptworkflow: Kontextquellen auswaehlen, Prompt bearbeiten, OpenAI-Generierung, Fragenauswahl, PDF-Export. |
| `/leitfaden` | `src/routes/leitfaden.tsx` | Interview-Leitfaden, statisches PDF, Skill-Markdown-Upload fuer kuenftigen Kontext. |

Zusaetzlicher statischer Asset-Endpunkt:

- `/interview-leitfaden.pdf`: Datei aus `public/interview-leitfaden.pdf`, wird in `/leitfaden` geoeffnet, heruntergeladen und eingebettet.

## Server-/API-Endpunkte

Es gibt keine frei definierten REST-Routen im Stil `/api/...`.

Der relevante Server-Call ist eine TanStack Start Server Function:

- Export: `generateInterviewOnepager` in `src/lib/openai-onepager.ts`
- Methode: `createServerFn({ method: "POST" })`
- Aufruf im Client: `useServerFn(generateInterviewOnepager)` in `src/routes/workspace.tsx`
- Input: `{ prompt: string }`
- Validierung:
  - `prompt` muss String sein.
  - getrimmte Laenge mindestens 20 Zeichen.
  - Prompts mit mehr als 28.000 Zeichen werden abgelehnt, nicht abgeschnitten.
- Output: `{ text: string }`
- Fehler:
  - `OPENAI_API_KEY ist serverseitig nicht gesetzt.`
  - `Prompt fehlt.`
  - `Prompt ist zu kurz.`
  - OpenAI-HTTP-Fehler werden nur mit Status weitergegeben, damit ein eventuell personenbezogener Fehlerbody nicht angezeigt wird.

Externer API-Call der Server Function:

- URL: `https://api.openai.com/v1/responses`
- Model: `gpt-4.1-mini`
- Auth: `Authorization: Bearer ${OPENAI_API_KEY}`
- `max_output_tokens`: 700
- `store`: false
- Erwartung: kurze Stichpunkte fuer den Abschnitt `Gespraechsfokus`.

Wichtig: Die Funktion gibt aktuell nur kompakten Text zurueck und speichert nichts serverseitig.

## Datenfluesse

### Mock-Daten

`src/lib/mock-data.ts` definiert:

- `Job`
- `Application`
- `Team`
- `GuidePhase`
- `Question`
- `Scenario`

Ausserdem enthalten:

- `teams`
- `jobs`
- `applications`
- `interviewGuide`
- `top10Questions`
- `softSkillQuestions`
- `behaviouralQuestions`
- `cultureFitQuestions`
- `scenarios`
- `positiveSignals`
- `openRisks`
- `interviewPanel`

Neue fachliche Daten sollten zuerst dort konsistent in die bestehenden Typen eingepflegt werden, solange keine echte Persistenz existiert.

### CV-Upload

Implementierung: `src/lib/application-storage.ts`

Workflow:

1. `/applications` nimmt Dateien an.
2. Maximalgroesse: `MAX_CV_FILE_SIZE = 5 * 1024 * 1024`.
3. PDF-Dateien werden mit `pdfjs-dist` gelesen.
4. Textdateien (`text/*`, `.txt`, `.md`) werden direkt gelesen.
5. `.doc` und `.docx` sind im File Picker aktuell erlaubt, werden aber in `extractCvText` nicht wirklich geparst und liefern faktisch leeren Text.
6. Aus dem Text werden E-Mail, Standort, Skills und Erfahrung heuristisch extrahiert.
7. Das Ergebnis wird als `UploadedApplication` lokal gespeichert.

LocalStorage-Keys:

- `tf.uploadedApplications`: Liste hochgeladener Bewerbungen.
- `tf.lastUploadedApplicationId`: zuletzt hochgeladene Bewerbung.
- Event `tf.uploadedApplications.changed`: eigener Browser-Event zur Synchronisierung innerhalb der App.

Der Hook `useApplications()` liefert immer `[...uploadedApplications, ...mockApplications]`. Hochgeladene Bewerbungen erscheinen dadurch vor den Mock-Bewerbungen.

### Leitfaden Skill-Uploads

Implementierung: `src/routes/leitfaden.tsx`

- Nur `.md` Dateien.
- Maximal 500 KB pro Datei.
- Speicherung in `localStorage` unter `tf.skillDocs`.
- Aktuell werden diese Skill-Dokumente angezeigt und lokal gehalten. Sie sind noch nicht technisch mit dem OpenAI-Prompt in `/workspace` verdrahtet, obwohl die UI das als Kontext fuer Fragen-Generierung beschreibt.

### Interview Workspace

Implementierung: `src/routes/workspace.tsx`

Der Workspace kombiniert:

- `application` aus `useApplications()`
- `job` aus `jobs`
- `team` aus `teams`
- freien `teamContext`
- freie Stage-1-Notizen
- `interviewGuide`
- `top10Questions`
- `openRisks` plus CV-Luecken-Hinweis

Wichtige Logik:

- Wenn zuletzt ein CV hochgeladen wurde, waehlt der Workspace diesen automatisch aus, solange noch `appId === "a1"` gesetzt ist.
- `buildInterviewOnepagerPromptContext()` erzeugt den editierbaren Master-Prompt.
- `getRecommendedQuestionIds()` priorisiert maximal 6 Fragen mit Zielverteilung:
  - 3 technisch/job-spezifisch
  - 2 Soft Skill
  - 1 Team-/Culture-Fit
- `summaryText` ist editierbar und wird fuer PDF-Export verwendet.
- OpenAI-Generierung ersetzt nur `summaryText`, nicht die gesamte Seite.

### PDF-Export

Implementierung: `src/lib/pdf-export.ts`

- Exportiert einen A4-Onepager clientseitig mit `jspdf`.
- Dateiname: `talentflow-interview-kurzfassung-${slugifiedName}-${YYYY-MM-DD}.pdf`
- Der Export wird im Browser per `doc.save(fileName)` heruntergeladen.
- Voraussetzung im UI:
  - Application, Job und Team vorhanden.
  - 1 bis 6 Fragen ausgewaehlt.

## Design- und UI-Konventionen

- React 19, TanStack Router/Start, Tailwind CSS v4.
- UI-Komponenten unter `src/components/ui` nach bestehendem Stil weiterverwenden.
- Icons kommen aus `lucide-react`.
- Navigation und Seitenrahmen laufen ueber `AppShell`.
- Statuslabels laufen ueber `StatusPill`.
- Theme-Farben und Custom Tokens liegen in `src/styles.css`.
- Die App ist ein produktiv wirkender Recruiting-Workspace, keine Marketing-Landingpage. Neue Screens sollten dicht, ruhig, scanbar und workflow-orientiert bleiben.

## Deployment-Kontext

`wrangler.jsonc`:

```jsonc
{
  "name": "tanstack-start-app",
  "compatibility_date": "2025-09-24",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry"
}
```

`vite.config.ts` nutzt `@lovable.dev/vite-tanstack-config`. Der Kommentar dort ist wichtig: TanStack Start, React, Tailwind, tsconfig paths, Cloudflare Build-Plugin und weitere Plugins sind bereits enthalten. Nicht duplizieren.

## Aktuelle bekannte Luecken

- Keine echte Datenbank/Persistenz ausser `localStorage`.
- Keine Authentifizierung, Rollen oder Berechtigungen.
- Keine echten CRUD-Endpunkte fuer Jobs, Teams, Applications oder Feedback.
- Buttons wie `Neuer Job`, `Job hochladen`, `Neue Bewerbung`, `Neues Team`, `Entwurf speichern`, `Feedback abschliessen` sind ganz oder teilweise UI-only.
- `.doc`/`.docx` Uploads sind im Picker erlaubt, aber nicht sinnvoll geparst.
- Skill-Markdown-Uploads in `/leitfaden` werden noch nicht in `buildInterviewOnepagerPromptContext()` eingespeist.
- Die OpenAI-Funktion nutzt fest `gpt-4.1-mini`; Modellwahl ist nicht konfigurierbar.
- Keine Tests fuer Frage-Priorisierung, Promptbau, CV-Parsing oder PDF-Export.
- Keine serverseitige Auditierung von generierten Interview-Inhalten.
- `routeTree.gen.ts` ist generiert und sollte nicht manuell bearbeitet werden.
- Das Parent-Git-Repository zeigt `talentflow-advisor/` aktuell als untracked an.

## Sichere Aenderungsregeln fuer Agenten

1. Vor groesseren Aenderungen `npm run build` und/oder `npm run lint` als Baseline ausfuehren, falls zeitlich sinnvoll.
2. Neue Routen als Dateien in `src/routes` anlegen und TanStack Router die Route-Tree-Datei generieren lassen.
3. `src/routeTree.gen.ts` nicht manuell editieren.
4. Bei Aenderungen an OpenAI-Aufrufen keine API-Keys in Dateien schreiben. Immer `OPENAI_API_KEY` verwenden.
5. Bei Upload-/Parsing-Features zwischen Client-only LocalStorage und zukuenftiger Backend-Persistenz klar trennen.
6. Bei AGG-/Compliance-Inhalten keine Fragen zu Alter, Herkunft, Religion, Gesundheit, Familienstand, Schwangerschaft oder politischer Einstellung ergaenzen.
7. PDF-Layout nach Aenderungen visuell testen, weil `jspdf` schnell Textueberlaeufe erzeugt.
8. Bestehende Mock-Typen in `src/lib/mock-data.ts` konsistent erweitern statt neue parallele Datenformen einzufuehren.
9. UI-Elemente mit vorhandenen Komponenten bauen; keine zweite Designsystem-Schicht einfuehren.
10. Wenn echte Endpunkte eingefuehrt werden, diese hier dokumentieren: Pfad, Methode, Input, Output, Auth, Fehlerfaelle.

## Naheliegende naechste technische Schritte

- `.docx`-Parsing entweder entfernen oder sauber implementieren.
- Skill-Markdown aus `tf.skillDocs` in den Workspace-Prompt integrieren.
- Server-/DB-Modell fuer Applications, Jobs, Teams und Feedback definieren.
- Tests fuer `interview-recommendations.ts` und `application-storage.ts` ergaenzen.
- OpenAI-Konfiguration zentralisieren: Modell, Tokenlimit, Systemprompt-Version.
- UI-only Buttons entweder deaktivieren/kennzeichnen oder implementieren.
- Einen echten API-/Persistence-Layer einfuehren, falls die App ueber Demo-Daten hinausgehen soll.

## Prompt-Maskierung (2026-09-29)

`src/lib/prompt-privacy.ts` maskiert bekannte Kandidatennamen, Namensteile ab drei Zeichen und den bekannten Standort. Regex-Muster ersetzen E-Mail-Adressen, verbreitete Telefonnummern, Weblinks, IBANs, vollstaendige numerische Datumsangaben sowie erkennbare deutsche Strassenadressen und Postleitzahl-Ort-Kombinationen durch Platzhalter.

Der Standardprompt wird bereits maskiert angezeigt. Beim Generieren werden auch manuelle Aenderungen im Browser erneut maskiert. Die Server Function maskiert jeden angenommenen Prompt nochmals vor dem OpenAI-Aufruf. Bei einem unveraenderten, strukturierten Kandidatenblock kann sie Name und Standort selbst auslesen. Fehlerantworten des Anbieters werden nicht an den Client weitergereicht.

Dies ist eine heuristische Maskierung, keine garantierte Anonymisierung. Unbekannte Personen in Freitext, abweichende Schreibweisen, nicht erkannte Adressformate und indirekt identifizierende berufliche Details koennen erhalten bleiben. Freitext muss vor der Generierung geprueft werden. Originalprofile bleiben unveraendert im lokalen Browser-Speicher; der PDF-Export verwendet weiterhin das Originalprofil. `store: false` ist keine Zusicherung einer vollstaendigen Datenloeschung beim Anbieter.

Regressionstests ohne echte API-Aufrufe: `node --test scripts/test-prompt-privacy.mjs`. Zusaetzliche Checks: `npx tsc --noEmit` und `npm run build`.

# TalentFlow Advisor

Recruiting-Prototyp für metafinanz auf Basis von React, TanStack Start und Vite. Der Interview-Workspace verbindet Bewerbungsprofil, Job, Teamkontext und Stage-1-Notizen mit einem Interview-Leitfaden.

## Lokal starten

```sh
npm ci
npm run dev
```

Für die KI-Generierung muss `OPENAI_API_KEY` in der Serverumgebung gesetzt sein. API-Schlüssel dürfen nicht in das Repository oder in clientseitige `VITE_*`-Variablen geschrieben werden.

Jobs, Teams und Fragen stammen derzeit aus Mock-Daten. Hochgeladene Bewerbungsprofile werden lokal im Browser gespeichert. Eine produktive Datenbank sowie Anmeldung und Rollenverwaltung sind noch nicht implementiert.

## Master-Prompt und Generierung

Der Master-Prompt steht in [`src/lib/interview-master-prompt.ts`](src/lib/interview-master-prompt.ts). Er kombiniert das Bewerbungsprofil mit Job, Team, Notizen und Leitfaden. Er beschreibt einen Onepager mit Gesprächsfokus, höchstens sechs Fragen, Risiken und Gesprächsablauf. Als Zielverteilung gelten drei fachliche Fragen, zwei Soft-Skill-Fragen und eine Teamfit-Frage.

Die tatsächliche OpenAI-Anfrage in [`src/lib/openai-onepager.ts`](src/lib/openai-onepager.ts) fordert aktuell nur den Gesprächsfokus als vier bis sechs Stichpunkte an. Die Fragen werden lokal aus dem vorhandenen Katalog priorisiert; Risiken und Gesprächsablauf werden nicht durch diese KI-Antwort ersetzt. Das Modell ist `gpt-4.1-mini`.

## Maskierung personenbezogener Angaben

[`src/lib/prompt-privacy.ts`](src/lib/prompt-privacy.ts) ersetzt bekannte Identitätsangaben und per Regex erkennbare Muster durch Platzhalter:

| Angabe | Platzhalter |
| --- | --- |
| Bekannter Kandidatenname und einzelne Namensteile ab drei Zeichen | `[PERSON]` |
| Bekannter Kandidatenstandort | `[ORT]` |
| E-Mail-Adressen | `[EMAIL]` |
| Verbreitete Telefonnummernformate | `[TELEFON]` |
| Erkennbare deutsche Straßenadressen | `[ADRESSE]` |
| Fünfstellige Postleitzahl mit Ort | `[PLZ ORT]` |
| Vollständige numerische Datumsangaben, etwa `12.03.1990` | `[DATUM]` |
| Weblinks mit `http://`, `https://` oder `www.` | `[LINK]` |
| IBAN-Muster | `[IBAN]` |

Die Maskierung erfolgt an drei Stellen:

1. Beim Aufbau des Standardprompts: Der Prompt-Editor zeigt bereits die maskierte Fassung.
2. Unmittelbar vor dem Versand im Browser: Auch manuell bearbeitete Prompts werden erneut maskiert, unter Verwendung des ausgewählten Bewerbungsprofils.
3. In der Server Function vor der Anfrage an OpenAI: Jeder angenommene Prompt wird nochmals maskiert. Bei einem lesbaren strukturierten `kandidat`-Block werden auch dessen Name und Standort berücksichtigt.

Beispiel bei bekanntem Profil „Anna Müller, München“:

```text
Vorher: Anna Müller aus München, anna@example.org. 6 Jahre Erfahrung mit Python.
Nachher: [PERSON] aus [ORT], [EMAIL]. 6 Jahre Erfahrung mit Python.
```

Prompts über 28.000 Zeichen werden abgelehnt, nicht abgeschnitten. Anbieterfehler werden nur mit HTTP-Status angezeigt; ihr Antworttext könnte Eingabedaten wiederholen. Die OpenAI-Anfrage setzt `store: false`. Dies ist keine Zusicherung, dass beim Anbieter keinerlei Daten aufbewahrt werden.

### Grenzen und lokale Daten

Diese Funktion ist eine heuristische Maskierung, keine garantierte vollständige Anonymisierung. Unbekannte Namen in Freitext, Schreibvarianten, ungewöhnliche Kontakt- oder Adressformate und indirekt identifizierende berufliche Details können erhalten bleiben. Muster können umgekehrt auch fachlich relevante Angaben entfernen. Freitext und den bearbeiteten Prompt deshalb vor der Generierung prüfen.

Originalprofile bleiben unverändert im `localStorage` des Browsers. Auch der PDF-Export verwendet weiterhin das Originalprofil und ist nicht anonymisiert. Die Maskierung schützt den ausgehenden Prompt; sie entfernt keine bereits lokal gespeicherten Daten. Hinweise wie „AGG-geprüft“ ersetzen keine technische oder fachliche Prüfung der Inhalte.

## Prüfungen

```sh
node --test scripts/test-prompt-privacy.mjs
npx tsc --noEmit
npm run build
npm run lint
```

Die sechs Regressionstests prüfen Maskierung, Erhalt fachlicher Angaben, unveränderte Originalprofile und den Serverpfad einschließlich Längenlimit und Fehlerbehandlung. Sie verwenden synthetische Daten und einen simulierten API-Aufruf; es werden keine Daten an OpenAI gesendet.

Build und Typprüfung wurden für die Maskierung erfolgreich ausgeführt. Der vollständige Lint-Lauf hat bestehende Formatierungs- und Zeilenendefehler. Weitere Architekturdetails und bekannte Prototyp-Lücken stehen in [`AGENT_HANDOFF.md`](AGENT_HANDOFF.md).

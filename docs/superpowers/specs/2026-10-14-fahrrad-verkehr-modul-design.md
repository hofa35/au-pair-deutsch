# Fahrrad-Verkehrsregeln für Au-Pairs – Design

**Status:** Entworfen im Gespräch am 14.10.2026, zur Umsetzung freigegeben.

## Ziel

Ein zweites, eigenständiges Lernangebot neben "Deutsch für Au-Pairs", das Au-Pairs (vor allem aus nicht-europäischen Ländern) die Grundregeln für das Fahrradfahren im deutschen Straßenverkehr vermittelt. Anders als der Sprachkurs steht hier **Verkehrssicherheit im Vordergrund, nicht Sprachprogression** – Deutsch ist Trägermedium, nicht Lernziel. Auslöser: wiederkehrende, teils gefährliche Unsicherheiten von Au-Pairs mit unvertrauten Verkehrsregeln, etwa Vorfahrt oder Fahrradwegnutzung.

Ausdrücklich **nicht** Teil davon: Auto fahren, Autobahn, Führerschein-Themen. Nur Fahrrad.

## Zielgruppe und didaktischer Ansatz

- Dieselbe Nische wie der Sprachkurs (Au-Pairs in Deutschland), hier mit Schwerpunkt auf Personen aus nicht-europäischen Herkunftsländern, die mit abweichenden oder fehlenden Verkehrsregeln aufgewachsen sind.
- Kein Sprachlehrwerk-Modell (keine Grammatikprogression). Stattdessen: **unabhängige Themenmodule**, die in beliebiger Reihenfolge durcharbeitbar sind. Kein Modul setzt ein anderes voraus – anders als beim Sprachkurs gibt es keine Ketten-Zusagen zwischen Modulen.
- Kernmethode: Verkehrssituation als Bild zeigen, Au-Pair muss die Situation einschätzen (Multiple-Choice-Frage), danach Erklärung der Regel.
- Zweisprachig wie der Sprachkurs: Erklärungen zuerst auf einfachem Deutsch, Englisch hinter dem bestehenden Umschalter (`toggle.js` wird wiederverwendet).
- Kein Audio (anders als der Sprachkurs) – hier geht es nicht um Aussprache, sondern um Regel- und Bildverständnis.

## Module (Start-Set)

Vier unabhängige Module, in dieser Reihenfolge auf der Übersichtsseite gelistet (Reihenfolge ist nur Vorschlag, keine Pflicht):

1. **Vorfahrt im Straßenverkehr** – rechts vor links, Kreisverkehr, Kreuzungen ohne Schilder
2. **Verkehrsschilder und Fahrradwege** – wo Radfahren erlaubt/Pflicht ist, Einbahnstraßen mit Rad frei, wichtige Schilder
3. **Ampeln, Fußgängerüberwege, Abbiegen** – Ampelregeln für Räder, Verhalten am Zebrastreifen, direktes/indirektes Linksabbiegen
4. **Sicherheit und Kindertransport** – Beleuchtung, Handy- und Alkoholverbot, Kind im Kindersitz/Anhänger transportieren (explizit au-pair-relevant)

Jedes Modul: kurze Einleitung, Regel-Erklärung, mindestens zwei bildgestützte Szenario-Übungen.

Weitere Module können später ergänzt werden, ohne bestehende zu berühren (Vorteil der unabhängigen Struktur).

## Technische Architektur (Entscheidung: Ansatz B)

Eigene, schlanke Pipeline im selben Repository wie der Sprachkurs (`au-pair-deutsch`), aber **ohne** die bestehende Ketten-Logik (`stationen.js`, `fortschritt.js`, Audio-Skripte) anzufassen oder wiederzuverwenden. Begründung: Das Kettenmodell löst ein Problem (lineare Lektionsfolge mit Querverweisen), das hier nicht existiert – unabhängige Module würden diese Logik nur unnötig verbiegen. Das bestehende, fertige und getestete Sprachkurs-Projekt bleibt unangetastet.

```
verkehr/
  module/                  # Markdown-Inhalte, eine Datei pro Modul
  bilder/                  # KI-generierte, nachbearbeitete Szenenbilder (WebP)
  bildkarten-quelle/        # unbearbeitete Rohgenerierungen (gitignored)
scripts/
  verkehr-parser.js         # Frontmatter + Abschnitte -> Datenstruktur
  verkehr-build.js          # Datenstruktur -> dist/verkehr/*.html
  verkehr-pruefstand.js     # Validierung der Modul-Dateien
  verkehr-bilder-aufbereiten.js  # Verkleinern/Komprimieren, analog bilder-aufbereiten.js
dist/
  verkehr/                  # Build-Ausgabe, eigener Pfad auf derselben GitHub-Pages-Seite
```

Wiederverwendet wird **nur**: `scripts/toggle.js` (Umschalter-Verhalten) und `scripts/html.js` (enthält nur `escapeHtml`, kursunabhängig). Alles andere ist neuer, eigenständiger Code.

Die Startseite des Sprachkurses bekommt eine schlichte Verlinkung zu `/verkehr/`. Keine gemeinsame Navigation, kein gemeinsamer Fortschritt – das ist ausdrücklich späteres, offenes Thema und nicht Teil dieses Projekts.

Veröffentlichung: öffentlich, über denselben GitHub-Pages-Mechanismus wie der Sprachkurs, unter `/verkehr/`.

## Inhaltsformat: Modul-Datei

`verkehr/module/NN-slug.md`:

```markdown
---
id: 1
titel: "Vorfahrt im Straßenverkehr"
typ: verkehrsmodul
---

## Einleitung Deutsch
Kurzer Absatz: worum geht es in diesem Modul, warum ist es wichtig.

## Einleitung Englisch
(dieselbe Einleitung auf Englisch)

## Regel Deutsch
Die eigentliche Regelerklärung, einfaches Deutsch.

## Regel Englisch
(dieselbe Erklärung auf Englisch)

## Aufgabe: Kreuzung ohne Schilder
### Bild
kreuzung-ohne-schilder.webp

### Frage Deutsch
Wer hat hier Vorfahrt?

### Frage Englisch
Who has the right of way here?

### Optionen
- [ ] Der Radfahrer von links
- [x] Der Radfahrer von rechts
- [ ] Niemand, alle müssen anhalten

### Erklärung Deutsch
An Kreuzungen ohne Schilder oder Ampeln gilt rechts vor links – das gilt auch für Fahrräder.

### Erklärung Englisch
(dieselbe Erklärung auf Englisch)
```

- Beliebig viele `## Aufgabe: <Titel>`-Abschnitte pro Modul, mindestens zwei.
- Genau eine Option pro Aufgabe ist mit `[x]` markiert (Prüfstand lehnt alles andere ab: keine, mehrere, oder weniger als zwei Optionen).
- Bild-Referenz ist ein Dateiname in `verkehr/bilder/`, der Prüfstand prüft, dass die Datei existiert.

## Übungsmechanik

Multiple-Choice mit sofortiger Rückmeldung, rein clientseitig (kein Server, keine Datenübertragung):

- Optionen als Radio-Buttons gerendert.
- Bei Auswahl: richtig/falsch wird sofort angezeigt (z. B. per CSS-Klasse auf der gewählten Option), die Erklärung erscheint darunter (zweisprachig wie gewohnt hinter dem Umschalter).
- Keine Wertung, kein Zähler über mehrere Aufgaben hinweg, keine Sperre – wer falsch antwortet, sieht trotzdem sofort die Erklärung, kann es erneut versuchen oder weiterlesen.

## Bildbeschaffung

Erzeugung über die `media-skill` (kie.ai-API) direkt in der Session, nicht durch ein extern mitgebrachtes Artefakt (anders als beim Sprachkurs/Mira).

- **Eigene Bildsprache**, kein Bezug zu Mira/Sprachkurs-Optik.
- **Konsistenter Stil** über einen festen Stil-Prompt-Baustein, der bei jeder Generierung mitgegeben wird (gleiche Illustrationsart, Farbpalette, Perspektive).
- **Fachliche Korrektheit vor Ästhetik:** jedes generierte Bild wird gegen die beabsichtigte Verkehrsregel geprüft (richtige Fahrbahnseite, richtiges Schild, richtige Rechts/Links-Anordnung), bei Fehlern neu generieren statt nachträglich flicken.
- Nachbearbeitung (Verkleinern, WebP-Konvertierung) über ein eigenes Skript analog `bilder-aufbereiten.js`.

## Abschluss / Bescheinigung

Eigene, einfache Bescheinigung (`dist/verkehr/zertifikat.html`), unabhängig vom Sprachkurs-Zertifikat:

- Listet die behandelten Module mit Themenbereich auf.
- Keine Niveau- oder Bestehens-Behauptung (gleiche ehrliche Linie wie beim Sprachkurs: ein Kurs ohne Prüfung kann so etwas nicht bescheinigen).
- Kein Unterschriftsfeld.
- A4-druckfähig, Browser-PDF wie beim Sprachkurs, mit demselben Nachmess-Verfahren (`msedge --headless=new ... --print-to-pdf`, `pdftotext ... | grep -c $'\f'` muss 1 ergeben).
- Erreichbar über einen Link auf der Modulübersichtsseite, unabhängig vom tatsächlichen Durchlauf-Fortschritt (da Module unabhängig sind, gibt es keinen erzwungenen "Durchlauf").

**Explizit nicht in dieser ersten Fassung (YAGNI):** Fortschrittsspeicherung über `localStorage`, erzwungene Reihenfolge, Konten. Lässt sich bei Bedarf später ergänzen, ohne das Inhaltsformat zu ändern.

## Qualitätssicherung

- `verkehr-pruefstand.js`: prüft pro Modul-Datei Pflichtfelder (Frontmatter, beide Sprachen für Einleitung/Regel), prüft pro Aufgabe: mindestens zwei Optionen, genau eine als richtig markiert, Bild-Datei vorhanden, beide Sprachen für Frage/Erklärung vorhanden.
- Unit-Tests nach bestehendem Muster: `scripts/verkehr-parser.test.js`, `scripts/verkehr-build.test.js`, `scripts/verkehr-pruefstand.test.js`, laufen automatisch mit dem bestehenden `node --test scripts/*.test.js` mit.
- Inhaltlich keine reale Testperson wie beim Sprachkurs vorgesehen – stattdessen sorgfältige fachliche Prüfung jeder Verkehrsszene durch Abgleich mit den tatsächlichen StVO-Regeln (Rechts-vor-links, Radwegbenutzungspflicht, Ampelregeln für Radfahrer usw.), da falsche Verkehrsregeln hier echten Schaden anrichten könnten.

## Offene / spätere Themen (bewusst nicht Teil dieses Projekts)

- Gemeinsame Oberfläche/Navigation mit dem Sprachkurs
- Fortschrittsspeicherung, Konten
- Weitere Module (Autofahren, Autobahn – explizit ausgeschlossen für jetzt)
- Endgültiger Kursname (Arbeitstitel: "Sicher Rad fahren")

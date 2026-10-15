# Deutsch für Au-Pairs – Pilot

Offenes DaF-A1-Lernangebot für Au-Pairs in Deutschland. Statische Website,
kein Backend, kein Framework. Siehe Spezifikation im Obsidian-Vault:
`02 Projekte/Deutsch für Au-Pairs.md`.

## Build

    node scripts/build.js

Ergebnis liegt in `dist/`. Der Build liest die Lektionen aus `lektionen/`,
die Reihenfolge und Vorschautexte der Startseite aus
`lektionen/uebersicht.json` und kopiert `bilder/` sowie die Audiodateien
unverändert mit.

## Tests

    node --test scripts/*.test.js

## Audio erzeugen

    set GOOGLE_TTS_API_KEY=dein-key
    node scripts/generate_audio.js

## Bilder

Die Illustrationen stammen aus einem KI-Artefakt mit 15 Szenenkarten und
einer Mira-Figur. Zwei Skripte, beide nur einmalig und nur lokal:

    node scripts/extrahiere-bilder.js     # Artefakt -> bildkarten-quelle/
    node scripts/bilder-aufbereiten.js    # bildkarten-quelle/ -> bilder/

Der zweite Schritt braucht `ffmpeg` im PATH. Er verkleinert die Szenenkarten
auf 720×480 (WebP, zusammen gut 1 MB statt 9 MB) und stellt die Mira-Figur
frei, indem er den Magenta-Hintergrund der Bildgenerierung per Colorkey
entfernt.

`bilder/` ist eingecheckt, weil die CI nur Node hat. `bildkarten-quelle/`
bleibt lokal und ist in `.gitignore`.

Wichtig: die Nummerierung der Rohbilder entspricht nicht der
Lektionsreihenfolge – im Artefakt war bei sechs Karten das falsche Bild
hinterlegt. Die richtige Zuordnung steht als Tabelle `ZUORDNUNG` in
`scripts/bilder-aufbereiten.js` und wurde aus dem Banner-Text abgeleitet,
der in jede Illustration eingebacken ist.

## Aufbau einer Lektionsdatei

Frontmatter mit `id`, `titel`, `lernziel`, `grammatikfokus`, danach diese
Abschnitte als `##`-Überschriften:

| Abschnitt | Pflicht | Wird daraus |
|---|---|---|
| Wortschatz | ja | Tabelle Deutsch/Englisch |
| Dialog | ja | Sprechblasen, `**Name:**` je Zeile |
| Grammatik Deutsch | ja | Erklärung, zuerst sichtbar |
| Grammatik Englisch | ja | dieselbe Erklärung hinter dem Umschalter |
| Übung | ja | Aufgabe zum Wiedererkennen |
| Lösung | ja | zugeklappt, öffnet sich per Klick |
| Schreibübung | nein | zweite Aufgabe, freies Schreiben |
| Beispiellösung | nein | zugeklappt, Pflicht sobald es eine Schreibübung gibt |
| Hörübung | ja | Abspieler plus Text |
| Nachsprechen | nein | ein Satz pro Zeile, jeder mit eigenem Abspieler |

Die Lösungen stehen in eigenen Abschnitten, weil sie auf der Seite in einem
`<details>`-Element zugeklappt werden. So sieht man sie nicht versehentlich
beim Lesen der Aufgabe. Kein JavaScript nötig, das kann der Browser selbst.

Bei `Nachsprechen` erzeugt `generate_audio.js` pro Zeile eine eigene
Audiodatei (`audio/<id>/nachsprechen-1.mp3` und so weiter), damit einzelne
Sätze beliebig oft wiederholt werden können. Sätze ändern heißt: die
betroffenen Dateien löschen und das Skript erneut laufen lassen. Entfernte
Sätze räumt es selbst auf.

## Neue Lektion ergänzen

1. `lektionen/NN-kurzname.md` nach dem Muster von `01-ankommen.md` anlegen
2. `node scripts/pruefstand.js` zur Kontrolle laufen lassen
3. Audio erzeugen, dann `node scripts/build.js`

Die Startseite verlinkt automatisch alle Lektionen, für die eine
Markdown-Datei existiert. Die übrigen Karten bleiben als Vorschau stehen und
sind mit „in Arbeit" gekennzeichnet.

## Wiederholungen

Nach mehreren Lektionen liegt eine Wiederholung im Lernweg: eine eigene
Seite mit Aufgaben quer durch den bisherigen Stoff. Kein neuer Stoff, kein
Audio, keine Wortschatzliste.

Takt: die erste Wiederholung nach Lektion 4, danach alle drei Lektionen,
also nach 7, 10 und 13. Lektion 15 bleibt der Gesamtrückblick.

Zwei Dateien gehören dazu:

    lektionen/wiederholungen.json    Plan: Nummer, "nach" welcher Lektion,
                                     Umfang, Titel, Akzentfarbe, Kurztext
    lektionen/wiederholung-01.md     Inhalt, erkannt an "typ: wiederholung"

Aufbau der Inhaltsdatei:

    ## Einstieg Deutsch              zweisprachige Einleitung, Pflicht
    ## Einstieg Englisch
    ## Aufgabe: <Titel>              beliebig viele, nummeriert wird beim Bauen
    ### Lösung                       pro Aufgabe, zugeklappt
    ### Beispiellösung               Variante für freie Aufgaben
    ## Rückmeldung                   freiwillig, Rückkanal an uns

Der Prüfstand misst Wiederholungen an eigenen Regeln: mindestens drei
Aufgaben, jede mit Lösung, Einleitung in beiden Sprachen. Wortschatz und
Hörtext werden hier nicht verlangt.

Die Lernreihenfolge baut `scripts/stationen.js` aus beiden JSON-Dateien.
Daraus entsteht die Fußnavigation: nach Lektion 4 führt "Weiter" zur
Wiederholung, erst von dort geht es zu Lektion 5. Jede Lektion nach einer
Wiederholung bekommt zusätzlich einen kleinen Zweitverweis zurück auf sie.

Inhaltliche Regel für die nächsten Wiederholungen: nicht nur die letzten
drei Lektionen abfragen, sondern eine Aufgabe auf noch früheren Stoff
richten. Sonst fällt der Anfang nach einigen Wochen trotzdem heraus.

## Abschluss und Bescheinigung

Hinter der letzten Lektion liegt der Abschluss: Miras Gratulation, der
Fortschrittsstand und der Weg zur Bescheinigung. Erkannt wird die Datei an
`typ: abschluss`, genau wie Wiederholungen an `typ: wiederholung`.

    lektionen/abschluss.md

Aufbau:

    ## Gratulation Deutsch        Lesetext, mehrere Absätze erlaubt, Pflicht
    ## Gratulation Englisch       dieselbe Gratulation hinter dem Umschalter
    ## Gesprochen                 Text für Miras Tonspur, höchstens 500 Zeichen
    ## Bescheinigung Deutsch      Hinweis unten auf der Urkunde
    ## Bescheinigung Englisch     derselbe Hinweis auf Englisch

Der Sprechtext steht getrennt vom Lesetext, weil Gesprochenes kürzer und
einfacher sein muss. `generate_audio.js` macht daraus
`audio/abschluss/gratulation.mp3`.

Fehlt `lektionen/abschluss.md`, baut der Build ohne Abschlussseite und ohne
Bescheinigung durch und sagt das in seiner Schlussmeldung.

### Die Bescheinigung

`dist/zertifikat.html` ist am Bildschirm eine Seite mit Anleitung und auf
Papier eine Urkunde. Das PDF erzeugt der Browser über die Druckfunktion, es
gibt keine PDF-Bibliothek. Name und Datum stehen in Eingabefeldern mitten in
der Urkunde; Eingabefelder drucken ihren Wert mit, und nichts davon wird
gespeichert oder verschickt.

Zwei Festlegungen, die nicht aus Versehen entstanden sind:

Es steht nirgends, ein Niveau sei bestanden. Ein Kurs ohne Prüfung kann das
nicht bescheinigen. Stattdessen führt die Urkunde alle Lektionen mit ihrem
Grammatikfokus auf – für eine Gastfamilie oder Agentur die brauchbarere
Angabe.

Es gibt kein Unterschriftsfeld. Mira ist eine Zeichnung, eine erfundene
Signatur auf einem vorzeigbaren Dokument wäre eine Lüge. Das Siegel nennt
den Kursnamen, die Adresse steht in der Fußzeile der Urkunde.

**Die Urkunde muss auf eine A4-Seite passen.** Fünfzehn Tabellenzeilen plus
Kopf und Fuß sind dafür knapp, deshalb sind im `@media print`-Block alle
Abstände enger als am Bildschirm, das Siegel ist kleiner, und der Hinweis
steht zweispaltig statt untereinander. Wer dort Zeilen ergänzt oder
Schriftgrößen ändert, muss nachmessen. Ohne Browser geht das so:

    msedge --headless=new --disable-gpu --no-pdf-header-footer \
      --print-to-pdf=/tmp/p.pdf "file:///…/dist/zertifikat.html"
    pdftotext /tmp/p.pdf - | grep -c $'\f'    # muss 1 ergeben

Stand Oktober 2026 bleiben dabei rund 20 mm Luft nach unten.

Eine Einschränkung, die man kennen muss: `@page` lässt sich in CSS nicht auf
eine einzelne Seite eingrenzen. Die Angabe `size: A4 portrait` gilt deshalb
beim Drucken für alle 22 Seiten, nicht nur für die Urkunde. Sollen
Lektionsseiten einmal zum Ausdrucken gedacht sein, gehören die Druckregeln
in ein eigenes Stylesheet, das nur die Bescheinigung lädt.

### Fortschritt

`scripts/fortschritt.js` merkt sich im `localStorage` des Browsers, welche
Stationen besucht wurden. Jede Lektions- und Wiederholungsseite meldet sich
über `<body data-station="…">`, die Abschlussseite zeigt die Zahl an. Die
Schlüssel stammen aus `scripts/stationen.js` und müssen zeichengenau
übereinstimmen, sonst bleibt der Zähler stillschweigend bei null.

Gesperrt wird nichts. Wer seinen Browserspeicher verliert, hat nichts falsch
gemacht und kommt trotzdem an seine Bescheinigung. In privaten Fenstern und
bei blockierten Cookies wirft schon der Zugriff auf `localStorage`; dann
verhält sich der Kurs wie vorher und zeigt den Stand einfach nicht an.

## Zeilenenden

Der Parser vereinheitlicht die Zeilenenden, bevor er etwas liest. Das ist
nicht kosmetisch: Git stellt auf Windows mit `core.autocrlf=true` beim
Auschecken auf CRLF um, und ohne diesen Schritt findet schon die
Frontmatter-Suche nichts mehr. Der Build läuft dann auf dem Linux-Server der
CI durch und scheitert auf dem Rechner, auf dem die Inhalte entstehen.

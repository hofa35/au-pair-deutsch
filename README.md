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

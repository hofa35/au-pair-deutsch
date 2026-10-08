// scripts/abschluss.js
//
// Die letzte Station. Kein neuer Stoff, keine Aufgabe: hier wird nur
// festgestellt, dass jemand durch ist, und der Weg zur Bescheinigung
// geöffnet.
//
// Mira steht hier als Standbild. Ein KI-Video wäre möglich, würde aber
// neben fünfzehn gezeichneten Szenenkarten als Fremdkörper wirken, und die
// vertraute Stimme aus den Lektionen trägt mehr als eine neue. Falls später
// doch ein Video kommt, ersetzt es genau das <img> in .abschluss-bild.
const { renderNavigation, mitVersion, ZURUECK_ICON, LAUTSPRECHER_ICON } = require('./renderer.js');
const { escapeHtml } = require('./html.js');

const KONFETTI_ANZAHL = 18;
const KONFETTI_FARBEN = ['var(--pfirsich)', 'var(--rosa)', 'var(--lavendel)', 'var(--gruen)', 'var(--blau)'];

/** Mehrere Absätze aus einem Textblock. Eine Leerzeile trennt. */
function renderAbsaetze(text) {
  return String(text)
    .split(/\n\s*\n/)
    .map((absatz) => absatz.trim())
    .filter((absatz) => absatz !== '')
    .map((absatz) => `<p>${absatz}</p>`)
    .join('\n');
}

/**
 * Konfetti aus einfachen Rechtecken.
 *
 * Lage, Verzögerung und Drehung stammen aus einer festen Rechnung, nicht aus
 * dem Zufall: der Build muss aus derselben Eingabe dieselbe Datei erzeugen,
 * sonst ändert sich bei jedem Lauf die Seite und man sieht im Vergleich
 * nicht mehr, was sich wirklich geändert hat. Die Bewegung selbst steht im
 * Stylesheet und entfällt dort, wenn jemand weniger Bewegung eingestellt hat.
 */
function renderKonfetti(anzahl = KONFETTI_ANZAHL) {
  const schnipsel = [];
  for (let i = 0; i < anzahl; i++) {
    const links = (i * 97) % 100;
    const verzug = ((i * 37) % 24) / 10;
    const dreh = (i * 53) % 360;
    const farbe = KONFETTI_FARBEN[i % KONFETTI_FARBEN.length];
    schnipsel.push(
      `<i class="konfetti-schnipsel" style="left:${links}%;background:${farbe};--verzug:${verzug}s;--dreh:${dreh}deg"></i>`
    );
  }
  return `<div class="konfetti" aria-hidden="true">${schnipsel.join('')}</div>`;
}

/**
 * @param {object} abschluss  Ergebnis von parseDokument bei typ: abschluss
 * @param {object} [navigation]  Ergebnis von baueNavigation
 * @param {{css?: string, js?: string, fortschritt?: string}} [versionen]
 * @param {string[]} [lernwegSchluessel]  alle Lektionen und Wiederholungen,
 *   ohne den Abschluss selbst – daraus macht fortschritt.js die Zahl
 */
function renderAbschlussHtml(abschluss, navigation, versionen = {}, lernwegSchluessel = []) {
  const titel = escapeHtml(abschluss.titel);

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titel} – Deutsch für Au-Pairs</title>
<link rel="stylesheet" href="${mitVersion('styles.css', versionen.css)}">
</head>
<body data-station="abschluss">
<header class="kopfzeile">
  <a class="zurueck" href="index.html">${ZURUECK_ICON}<span>Alle Lektionen</span></a>
  <span class="kopf-hinweis">Abschluss</span>
</header>
<main class="lektion lektion--abschluss">
${renderKonfetti()}

<section class="abschluss-kopf">
  <div class="abschluss-bild">
    <img src="bilder/mira.webp" alt="Mira winkt zum Abschied" width="640" height="1548" decoding="async">
  </div>
  <div class="abschluss-gruss">
    <p class="augenbraue">Geschafft</p>
    <h1>${titel}</h1>
    <p class="abschluss-stand" data-stationen="${lernwegSchluessel.join(',')}">Du bist am Ende des Kurses angekommen.</p>
  </div>
</section>

<section class="block block--audio">
<h2>Mira sagt dir noch etwas</h2>
<div class="audio-karte">
  <div class="audio-kopf">${LAUTSPRECHER_ICON}<span>Anhören</span></div>
  <audio controls preload="none" src="audio/abschluss/gratulation.mp3"></audio>
</div>
</section>

<section class="block block--gratulation">
<div class="erklaerung">
  <div data-sprache="de">
${renderAbsaetze(abschluss.gratulationDe)}
  </div>
  <div data-sprache="en" style="display:none">
${renderAbsaetze(abschluss.gratulationEn)}
  </div>
  <button class="sprach-umschalter" aria-pressed="false">Verstehst du das nicht? Hier auf Englisch</button>
</div>
</section>

<section class="block block--bescheinigung">
<h2>Deine Bescheinigung</h2>
<p>Eine Seite mit allem, was du geübt hast: alle 15 Lektionen und wozu sie gut waren. Du trägst deinen Namen ein und druckst sie aus oder speicherst sie als PDF.</p>
<p class="hero-knopfreihe"><a class="knopf knopf--primaer" href="zertifikat.html">Zur Bescheinigung</a></p>
<p class="hero-kleingedruckt">Das ist eine Teilnahmebescheinigung, keine Prüfung. Dein Name bleibt in deinem Browser.</p>
</section>

${renderNavigation(navigation)}<p class="lektion-fuss"><a class="zurueck" href="index.html">${ZURUECK_ICON}<span>Alle Lektionen in der Übersicht</span></a></p>

</main>
<script src="${mitVersion('toggle.js', versionen.js)}"></script>
<script src="${mitVersion('fortschritt.js', versionen.fortschritt)}"></script>
</body>
</html>`;
}

module.exports = { renderAbschlussHtml, renderAbsaetze, renderKonfetti };

// scripts/verkehr-renderer.js
const { escapeHtml } = require('./html.js');

const ZURUECK_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H6"/><path d="m12 19-7-7 7-7"/></svg>`;

/** Hängt eine kurze Prüfsumme an Stylesheet/Skript, siehe verkehr-build.js. */
function mitVersion(datei, version) {
  return version ? `${datei}?v=${version}` : datei;
}

/**
 * Baut eine zweisprachige Box: Deutsch sichtbar, Englisch hinter dem
 * Umschalter. Der Vertrag (Klasse "erklaerung", [data-sprache],
 * button.sprach-umschalter) kommt unverändert aus toggle.js.
 */
function renderErklaerungsbox(textDe, textEn, zusatzklasse = '') {
  return `<div class="erklaerung${zusatzklasse ? ` ${zusatzklasse}` : ''}">
  <p class="erklaerung-text" data-sprache="de">${textDe}</p>
  <p class="erklaerung-text" data-sprache="en" style="display:none">${textEn}</p>
  <button class="sprach-umschalter" aria-pressed="false">Verstehst du das nicht? Hier auf Englisch</button>
</div>`;
}

function renderAufgabe(aufgabe, index) {
  const richtigIndex = aufgabe.optionen.findIndex((option) => option.richtig);
  const optionenHtml = aufgabe.optionen
    .map(
      (option, i) => `    <label class="option">
      <input type="radio" name="aufgabe-${index}" value="${i}">
      <span>${escapeHtml(option.text)}</span>
    </label>`
    )
    .join('\n');

  return `<section class="aufgabe">
  <h3>${escapeHtml(aufgabe.titel)}</h3>
  <div class="aufgabe-bild">
    <img src="bilder/${aufgabe.bild}" alt="Verkehrssituation: ${escapeHtml(aufgabe.titel)}" width="720" height="480" loading="lazy" decoding="async">
  </div>
  ${renderErklaerungsbox(aufgabe.fragDe, aufgabe.fragEn, 'erklaerung--frage')}
  <form class="optionen" data-richtig="${richtigIndex}">
${optionenHtml}
  </form>
  <p class="rueckmeldung" hidden></p>
  <div class="erklaerung-feld" hidden>
    ${renderErklaerungsbox(aufgabe.erklaerungDe, aufgabe.erklaerungEn)}
  </div>
</section>`;
}

/**
 * @param {object} modul  Ergebnis von parseVerkehrsmodul()
 * @param {{css?: string, js?: string, uebung?: string}} [versionen]
 */
function renderModulHtml(modul, versionen = {}) {
  const aufgabenHtml = modul.aufgaben.map((aufgabe, i) => renderAufgabe(aufgabe, i)).join('\n\n');

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(modul.titel)} – Sicher Rad fahren</title>
<link rel="stylesheet" href="${mitVersion('styles.css', versionen.css)}">
</head>
<body>
<header class="kopfzeile">
  <a class="zurueck" href="index.html">${ZURUECK_ICON}<span>Alle Module</span></a>
  <span class="kopf-hinweis">${escapeHtml(modul.themenbereich)}</span>
</header>
<main class="modul">
<h1>${escapeHtml(modul.titel)}</h1>

${renderErklaerungsbox(modul.einleitungDe, modul.einleitungEn, 'erklaerung--einleitung')}

<section class="block block--regel">
<h2>Die Regel</h2>
${renderErklaerungsbox(modul.regelDe, modul.regelEn)}
</section>

<section class="block block--aufgaben">
<h2>Teste dich selbst</h2>
${aufgabenHtml}
</section>

<p class="modul-fuss"><a class="zurueck" href="index.html">${ZURUECK_ICON}<span>Alle Module in der Übersicht</span></a></p>
</main>
<script src="${mitVersion('toggle.js', versionen.js)}"></script>
<script src="${mitVersion('verkehr-uebung.js', versionen.uebung)}"></script>
</body>
</html>`;
}

module.exports = { renderModulHtml, renderAufgabe, mitVersion, ZURUECK_ICON };

// scripts/wiederholung.js
//
// Baut eine Wiederholungsseite. Sie ist eine Zwischenstation im Lernweg:
// nach mehreren Lektionen kommt kein neuer Stoff, sondern Übungen quer durch
// das bisher Gelernte.
//
// Bewusste Unterschiede zur Lektionsseite:
//   kein Wortschatz, kein Dialog, keine Grammatikerklärung – alles das
//   stand schon in den Lektionen,
//   kein Audio – Hören wird in den Lektionen geübt, hier geht es um
//   Schreiben und Erkennen,
//   beliebig viele Aufgaben statt einer festen Reihenfolge von Abschnitten.
//
// Was bleibt: der Umschalter auf Englisch für die Einleitung und die
// aufklappbaren Lösungen. Beides kennt die Lernende schon.
const { renderLoesung, renderNavigation, mitVersion, ZURUECK_ICON } = require('./renderer.js');

const WIEDERHOLEN_GROSS = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4.5V9h4.5"/></svg>`;

const SPRECHBLASE = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4-.8L3 21l1.9-4.6A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z"/></svg>`;

/**
 * Eine Aufgabe als eigener Block. Die Nummer steht im Kopf, damit man sich
 * in der Rückmeldung darauf beziehen kann ("Aufgabe 3 war schwer").
 */
function renderAufgabe(aufgabe, index) {
  const beschriftung =
    aufgabe.loesungArt === 'Beispiellösung' ? 'Beispiellösung anzeigen' : 'Lösung anzeigen';
  return `
<section class="block block--aufgabe">
<h2><span class="aufgabe-nummer">${index + 1}</span><span class="aufgabe-titel">${aufgabe.titel}</span></h2>
<div class="uebung-text">${aufgabe.text}</div>
${renderLoesung(aufgabe.loesung, beschriftung)}
</section>
`;
}

function renderRueckmeldung(text) {
  if (!text) return '';
  return `
<section class="block block--rueckmeldung">
<h2>Rückmeldung</h2>
<div class="schreib-kopf">${SPRECHBLASE}<span>Sag, was schwer war</span></div>
<div class="uebung-text">${text}</div>
</section>
`;
}

/**
 * @param {object} wiederholung  Ergebnis von parseWiederholung
 * @param {object} [eintrag]  Eintrag aus lektionen/wiederholungen.json –
 *   liefert die Akzentfarbe für den Kopf. Fehlt er, wird schlicht gebaut.
 * @param {object} [navigation]  Ergebnis von baueNavigation
 * @param {{css?: string, js?: string}} [versionen]  Prüfsummen, siehe renderer.js
 */
function renderWiederholungHtml(wiederholung, eintrag, navigation, versionen = {}) {
  const akzent = eintrag && eintrag.akzent ? eintrag.akzent : 'var(--lavendel)';
  const aufgaben = wiederholung.aufgaben.map(renderAufgabe).join('');
  const umfang = wiederholung.umfasst ? ` · Lektion ${wiederholung.umfasst}` : '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${wiederholung.titel} – Deutsch für Au-Pairs</title>
<link rel="stylesheet" href="${mitVersion('styles.css', versionen.css)}">
</head>
<body>
<header class="kopfzeile">
  <a class="zurueck" href="index.html">${ZURUECK_ICON}<span>Alle Lektionen</span></a>
  <span class="kopf-hinweis">Wiederholung ${wiederholung.nr}</span>
</header>
<main class="lektion lektion--wiederholung">

<p class="wdh-marke" style="background:${akzent}">${WIEDERHOLEN_GROSS}<span>Wiederholung ${wiederholung.nr}${umfang}</span></p>
<h1>${wiederholung.titel}</h1>

<div class="lernziel erklaerung">
  <p class="erklaerung-text" data-sprache="de">${wiederholung.einstiegDe}</p>
  <p class="erklaerung-text" data-sprache="en" style="display:none">${wiederholung.einstiegEn}</p>
  <button class="sprach-umschalter" aria-pressed="false">Verstehst du das nicht? Hier auf Englisch</button>
</div>
${aufgaben}${renderRueckmeldung(wiederholung.rueckmeldung)}
${renderNavigation(navigation)}<p class="lektion-fuss"><a class="zurueck" href="index.html">${ZURUECK_ICON}<span>Alle Lektionen in der Übersicht</span></a></p>

</main>
<script src="${mitVersion('toggle.js', versionen.js)}"></script>
</body>
</html>`;
}

module.exports = { renderWiederholungHtml };

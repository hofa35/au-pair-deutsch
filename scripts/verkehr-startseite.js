// scripts/verkehr-startseite.js
//
// Baut die Übersichtsseite des Verkehrsbereichs: ein Raster mit allen
// geplanten Modulen. Anders als beim Sprachkurs gibt es keine Reihenfolge,
// die eingehalten werden muss – jede Karte verlinkt direkt, sobald das
// Modul fertig ist.
const { escapeHtml } = require('./html.js');

const PFEIL_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13"/><path d="m12 5 7 7-7 7"/></svg>`;

function renderModulKarte(eintrag, gebaut) {
  const inneres = `
  <div class="karte-kopf" style="background:${eintrag.akzent}">
    <span class="karte-nummer">${eintrag.id}</span>
    <span class="karte-thema">${escapeHtml(eintrag.themenbereich)}</span>
  </div>
  <h3 class="karte-titel">${escapeHtml(eintrag.titel)}</h3>
  ${gebaut ? `<span class="karte-pfeil">${PFEIL_ICON}</span>` : '<span class="karte-status">in Arbeit</span>'}`;

  if (gebaut) {
    return `<li><a class="karte karte--offen" href="${gebaut.dateiname}">${inneres}
</a></li>`;
  }
  return `<li><div class="karte karte--bald" aria-disabled="true">${inneres}
</div></li>`;
}

/**
 * @param {Array<{id:number,titel:string,themenbereich:string,akzent:string}>} uebersicht
 *   verkehr/module/uebersicht.json – bei fertigen Modulen überschreibt
 *   verkehr-build.js Titel/Themenbereich mit dem Inhalt der echten
 *   Modul-Datei, die JSON-Datei liefert nur die Vorschau für unfertige.
 * @param {Map<number, {titel: string, themenbereich: string, dateiname: string}>} gebautNachId
 * @param {{css?: string}} [versionen]
 */
function renderVerkehrStartseiteHtml(uebersicht, gebautNachId, versionen = {}) {
  const stylesheet = versionen.css ? `styles.css?v=${versionen.css}` : 'styles.css';
  const anzahlFertig = gebautNachId.size;
  const karten = uebersicht
    .map((eintrag) => renderModulKarte(eintrag, gebautNachId.get(eintrag.id)))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sicher Rad fahren – Verkehrsregeln für Au-Pairs</title>
<meta name="description" content="Verkehrsregeln fürs Fahrrad in Deutschland, erklärt mit Bildern und Beispielen – für Au-Pairs, die mit dem Rad unterwegs sind.">
<link rel="stylesheet" href="${stylesheet}">
</head>
<body class="startseite">
<header class="kopfzeile">
  <span class="wortmarke">Sicher Rad fahren</span>
  <span class="kopf-hinweis">Verkehrsregeln für Au-Pairs</span>
</header>
<main>

<section class="hero">
  <div class="hero-text">
    <p class="augenbraue">Fürs Fahrrad in Deutschland</p>
    <h1>Verkehrsregeln, die wirklich zählen</h1>
    <p class="hero-fliess">Kurze, unabhängige Module zu Vorfahrt, Schildern, Ampeln und Sicherheit. Jedes Modul zeigt echte Verkehrssituationen als Bild – schätz selbst ein, wer Vorfahrt hat, dann kommt die Erklärung.</p>
    <p class="hero-kleingedruckt">Kein Konto, keine Anmeldung. Du kannst mit jedem Modul anfangen, das dich interessiert.</p>
  </div>
</section>

<section class="uebersicht" id="module">
  <div class="uebersicht-kopf">
    <h2>Die Module</h2>
    <p class="uebersicht-stand">${anzahlFertig} von ${uebersicht.length} ${anzahlFertig === 1 ? 'ist fertig' : 'sind fertig'}, der Rest kommt nach und nach.</p>
  </div>
  <ul class="karten">
${karten}
  </ul>
</section>

</main>
</body>
</html>`;
}

module.exports = { renderVerkehrStartseiteHtml, renderModulKarte };

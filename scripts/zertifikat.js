// scripts/zertifikat.js
//
// Die Bescheinigung. Am Bildschirm eine Seite mit Anleitung, auf Papier eine
// Urkunde. Das PDF erzeugt der Browser über die Druckfunktion; eine
// PDF-Bibliothek wäre eine zusätzliche Abhängigkeit, müsste Schriften
// einbetten und geht dabei regelmäßig an Umlauten kaputt.
//
// Was hier steht, ist bewusst keine Niveaubehauptung. Ein Kurs ohne Prüfung
// kann kein Niveau bescheinigen. Stattdessen steht konkret da, was geübt
// wurde – für eine Gastfamilie oder Agentur ist das ohnehin die brauchbarere
// Angabe.
//
// Kein Unterschriftsfeld: Mira ist eine Zeichnung, und eine erfundene
// Signatur auf einem Dokument, das jemand vorlegt, wäre eine Lüge. Das
// Siegel nennt Kurs und Adresse, mehr an Prüfbarkeit ist hier ehrlich nicht
// zu haben.
const { mitVersion, ZURUECK_ICON } = require('./renderer.js');
const { escapeHtml } = require('./html.js');

const ADRESSE = 'hofa35.github.io/au-pair-deutsch';

const SIEGEL = `<svg class="siegel" viewBox="0 0 140 140" width="140" height="140" role="img" aria-label="Siegel Deutsch für Au-Pairs">
  <circle cx="70" cy="70" r="66" fill="none" stroke="currentColor" stroke-width="2"/>
  <circle cx="70" cy="70" r="58" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="3 4"/>
  <text x="70" y="58" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor">DEUTSCH</text>
  <text x="70" y="76" text-anchor="middle" font-size="12" fill="currentColor">FÜR</text>
  <text x="70" y="94" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor">AU-PAIRS</text>
</svg>`;

/** "4" / "4 und 7" / "4, 7 und 10" – aufzählen, wie man es spricht. */
function zaehleAuf(werte) {
  if (werte.length === 0) return '';
  if (werte.length === 1) return String(werte[0]);
  return `${werte.slice(0, -1).join(', ')} und ${werte[werte.length - 1]}`;
}

function renderZeilen(lektionen) {
  return lektionen
    .map(
      (lektion) => `      <tr>
        <td class="u-nr">${lektion.id}</td>
        <td class="u-titel">${escapeHtml(lektion.titel)}</td>
        <td class="u-fokus">${escapeHtml(lektion.grammatikfokus || '')}</td>
      </tr>`
    )
    .join('\n');
}

/**
 * @param {Array} lektionen  geparste Lektionen, nach id sortiert
 * @param {Array} wiederholungsplan  Inhalt von lektionen/wiederholungen.json
 * @param {object} abschluss  liefert den zweisprachigen Hinweis
 * @param {{css?: string, urkunde?: string}} [versionen]
 */
function renderZertifikatHtml(lektionen, wiederholungsplan, abschluss, versionen = {}) {
  const anzahlWdh = wiederholungsplan.length;
  const wdhSatz = anzahlWdh
    ? `Dazu ${anzahlWdh} ${anzahlWdh === 1 ? 'Wiederholung ' : 'Wiederholungen '}` +
      `${anzahlWdh === 1 ? 'nach der Lektion' : 'nach den Lektionen'} ` +
      `${zaehleAuf(wiederholungsplan.map((plan) => plan.nach))}: Aufgaben quer durch den bisherigen Stoff, ohne neuen Inhalt.`
    : '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bescheinigung – Deutsch für Au-Pairs</title>
<link rel="stylesheet" href="${mitVersion('styles.css', versionen.css)}">
</head>
<body class="zertifikat-seite">
<header class="kopfzeile nicht-drucken">
  <a class="zurueck" href="abschluss.html">${ZURUECK_ICON}<span>Zurück zum Abschluss</span></a>
  <span class="kopf-hinweis">Bescheinigung</span>
</header>
<main>

<section class="druckhinweis nicht-drucken">
  <h1>Deine Bescheinigung</h1>
  <p>Trag unten deinen Namen ein. Dann druckst du die Seite aus oder speicherst sie als PDF.</p>
  <p>Am Computer ist das am einfachsten. Auf dem Handy können nicht alle Browser drucken.</p>
  <p class="hero-knopfreihe"><button class="knopf knopf--primaer" id="drucken" type="button">Drucken oder als PDF speichern</button></p>
  <p class="hero-kleingedruckt">Dein Name bleibt in deinem Browser. Er wird nirgendwo gespeichert und nirgendwohin geschickt.</p>
</section>

<article class="urkunde">
  <div class="urkunde-kopf">
    <p class="urkunde-art">Teilnahmebescheinigung<span>Confirmation of participation</span></p>
    ${SIEGEL}
  </div>

  <p class="urkunde-vorspann">Diese Bescheinigung bestätigt, dass</p>
  <p class="urkunde-name"><input id="name-feld" type="text" autocomplete="name" placeholder="Dein Name" aria-label="Dein Name"></p>
  <p class="urkunde-satz">den offenen Kurs <strong>Deutsch für Au-Pairs</strong> vollständig durchgearbeitet hat: alle ${lektionen.length} Lektionen von Anfang bis Ende.</p>

  <table class="urkunde-tabelle">
    <thead>
      <tr><th class="u-nr">Nr.</th><th class="u-titel">Lektion</th><th class="u-fokus">Das wurde geübt</th></tr>
    </thead>
    <tbody>
${renderZeilen(lektionen)}
    </tbody>
  </table>

  <p class="urkunde-wdh">${wdhSatz}</p>

  <div class="urkunde-fuss">
    <p class="urkunde-datum"><span class="urkunde-feldname">Datum</span><input id="datum-feld" type="text" aria-label="Datum"></p>
    <p class="urkunde-quelle"><span class="urkunde-feldname">Kurs im Netz</span>${ADRESSE}</p>
  </div>

  <p class="urkunde-hinweis"><span lang="de">${escapeHtml(abschluss.bescheinigungDe)}</span><span lang="en">${escapeHtml(abschluss.bescheinigungEn)}</span></p>
</article>

</main>
<script src="${mitVersion('urkunde.js', versionen.urkunde)}"></script>
</body>
</html>`;
}

module.exports = { renderZertifikatHtml, zaehleAuf };

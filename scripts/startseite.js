// scripts/startseite.js
//
// Baut die Startseite: Mira-Hero, kurze Anleitung, Raster mit allen
// 15 Lektionskarten. Karten ohne fertige Lektionsdatei werden sichtbar,
// aber nicht verlinkt – so sieht man von Anfang an, wohin der Kurs geht.
//
// Zwischen den Lektionskarten sitzen die Wiederholungen. Sie liegen quer
// über die ganze Breite des Rasters, damit man den Takt des Kurses sieht:
// vier Lektionen, dann einmal zurückschauen, dann weiter.

const { escapeHtml } = require('./html.js');

const SPRECHBLASE_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4-.8L3 21l1.9-4.6A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z"/></svg>`;

const PFEIL_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13"/><path d="m12 5 7 7-7 7"/></svg>`;

const WIEDERHOLEN_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4.5V9h4.5"/></svg>`;

/**
 * Wiederholungsband zwischen zwei Lektionskarten.
 *
 * @param {object} plan  Eintrag aus lektionen/wiederholungen.json, bei
 *   fertigen Seiten um titel und dateiname ergänzt.
 */
function renderWiederholungsKarte(plan) {
  const fertig = Boolean(plan.dateiname);
  const inneres = `
  <span class="wkarte-marke" style="background:${plan.akzent}">${WIEDERHOLEN_ICON}Wiederholung ${plan.nr}</span>
  <span class="wkarte-text">
    <span class="wkarte-titel">${escapeHtml(plan.titel)}</span>
    <span class="wkarte-info">${escapeHtml(plan.info || '')}</span>
  </span>
  ${fertig ? `<span class="karte-pfeil">${PFEIL_ICON}</span>` : '<span class="karte-status">in Arbeit</span>'}`;

  if (fertig) {
    return `<li class="zwischenstation"><a class="karte karte--wiederholung" href="${plan.dateiname}">${inneres}
</a></li>`;
  }
  return `<li class="zwischenstation"><div class="karte karte--wiederholung karte--bald" aria-disabled="true">${inneres}
</div></li>`;
}

const SCHRITTE = [
  'Lies den Dialog laut mit. Sprechen üben ist wichtiger als alles zu verstehen.',
  'Hör die Hörübung mehrmals, auch nebenbei beim Aufräumen oder auf dem Weg.',
  'Nimm dir eine Lektion pro Tag. Mehr auf einmal bringt wenig.',
];

function renderKarte(eintrag, lektionsDatei, istErste) {
  const bild = `bilder/lektion-${String(eintrag.nr).padStart(2, '0')}.webp`;
  const fertig = Boolean(lektionsDatei);
  const titel = escapeHtml(eintrag.titel);

  const inneres = `
  <div class="karte-bild" style="background:${eintrag.akzent}">
    <img src="${bild}" alt="Illustration zu Lektion ${eintrag.nr}: ${titel}"
         width="720" height="480"${istErste ? '' : ' loading="lazy"'} decoding="async">
  </div>
  <div class="karte-kopf">
    <span class="karte-nummer">${eintrag.nr}</span>
    <span class="karte-schlagwort" style="background:${eintrag.akzent}">${escapeHtml(eintrag.schlagwort)}</span>
    ${fertig ? `<span class="karte-pfeil">${PFEIL_ICON}</span>` : '<span class="karte-status">in Arbeit</span>'}
  </div>
  <h3 class="karte-titel">${titel}</h3>
  <p class="karte-satz">${SPRECHBLASE_ICON}<span>${escapeHtml(eintrag.satz)}</span></p>`;

  if (fertig) {
    return `<li><a class="karte karte--offen" href="${lektionsDatei}">${inneres}
</a></li>`;
  }
  return `<li><div class="karte karte--bald" aria-disabled="true">${inneres}
</div></li>`;
}

/**
 * @param {Array} uebersicht  Inhalt von lektionen/uebersicht.json
 * @param {Map<number, {titel: string, dateiname: string}>} gebaut  fertige Lektionen
 * @param {{css?: string}} [versionen]  Prüfsumme des Stylesheets, damit
 *   Browser nach einer Änderung nicht am alten Zwischenspeicher hängen
 *   bleiben. Siehe mitVersion() in renderer.js.
 * @param {Array} [wiederholungen]  Wiederholungsplan, bei fertigen Seiten
 *   um dateiname ergänzt. Ohne Angabe erscheint keine.
 */
function renderStartseiteHtml(uebersicht, gebaut, versionen = {}, wiederholungen = []) {
  const stylesheet = versionen.css ? `styles.css?v=${versionen.css}` : 'styles.css';
  const ersteFertige = uebersicht.find((e) => gebaut.has(e.nr));
  const anzahlFertig = gebaut.size;

  // Wiederholungen hinter der Lektion einsortieren, nach der sie stehen.
  const planNach = new Map();
  for (const plan of wiederholungen) {
    if (!planNach.has(plan.nach)) planNach.set(plan.nach, []);
    planNach.get(plan.nach).push(plan);
  }

  const kartenTeile = [];
  uebersicht.forEach((eintrag, index) => {
    const lektion = gebaut.get(eintrag.nr);
    // Titel aus der Lektionsdatei hat Vorrang, die Übersicht ist nur Vorschau.
    const zusammengefuehrt = lektion ? { ...eintrag, titel: lektion.titel } : eintrag;
    kartenTeile.push(renderKarte(zusammengefuehrt, lektion && lektion.dateiname, index === 0));
    for (const plan of planNach.get(eintrag.nr) || []) {
      kartenTeile.push(renderWiederholungsKarte(plan));
    }
  });
  const karten = kartenTeile.join('\n');

  const wiederholungsHinweis = wiederholungen.length
    ? ` Dazwischen liegen ${wiederholungen.length} Wiederholungen.`
    : '';

  const schritte = SCHRITTE.map(
    (text, i) => `<li><span class="schritt-nummer">${i + 1}</span><span>${escapeHtml(text)}</span></li>`
  ).join('\n');

  const startKnopf = ersteFertige
    ? `<a class="knopf knopf--primaer" href="${gebaut.get(ersteFertige.nr).dateiname}">Mit Lektion ${ersteFertige.nr} anfangen ${PFEIL_ICON}</a>`
    : '<span class="knopf knopf--aus">Die erste Lektion kommt bald</span>';

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Deutsch für Au-Pairs</title>
<meta name="description" content="Kostenloses Deutsch auf Niveau A1 für Au-Pairs in Deutschland. 15 Lektionen zu Gastfamilie, Haushalt, Kindern und Alltag – mit Hörübungen und englischer Hilfe auf Knopfdruck.">
<link rel="stylesheet" href="${stylesheet}">
</head>
<body class="startseite">

<header class="kopfzeile">
  <span class="wortmarke">Deutsch für Au-Pairs</span>
  <span class="kopf-hinweis">Niveau A1 · kostenlos</span>
</header>

<main>

<section class="hero">
  <div class="hero-schein" aria-hidden="true"></div>
  <div class="hero-text">
    <p class="augenbraue">Für Au-Pairs in Deutschland</p>
    <h1>Deutsch für deinen Alltag<span class="hero-kursiv">mit Mira durch die ersten Wochen</span></h1>
    <p class="hero-fliess">Fünfzehn Lektionen zu dem, was wirklich jeden Tag vorkommt: Gastfamilie, Haushalt, Kinder, Einkaufen, Termine, Notfälle. Alles steht zuerst auf einfachem Deutsch. Wenn du etwas nicht verstehst, schaltest du mit einem Klick auf Englisch um.</p>
    <p class="hero-knopfreihe">${startKnopf}</p>
    <p class="hero-kleingedruckt">Kein Konto, keine Anmeldung. Es wird nichts gespeichert.</p>
  </div>
  <div class="hero-bild">
    <img src="bilder/mira.webp" alt="Mira winkt zur Begrüßung" width="640" height="1548" decoding="async">
  </div>
</section>

<section class="anleitung">
  <h2>So nutzt du den Kurs</h2>
  <ol class="schritte">
${schritte}
  </ol>
  <p class="anleitung-tipp">Sag die Sätze laut nach, auch wenn sich das am Anfang komisch anfühlt. Genau davon lebt das Sprechen.</p>
</section>

<section class="uebersicht" id="lektionen">
  <div class="uebersicht-kopf">
    <h2>Die 15 Lektionen</h2>
    <p class="uebersicht-stand">${anzahlFertig} von ${uebersicht.length} ${anzahlFertig === 1 ? 'ist fertig' : 'sind fertig'}, der Rest kommt nach und nach.${wiederholungsHinweis}</p>
  </div>
  <ul class="karten">
${karten}
  </ul>
</section>

</main>

<footer class="fusszeile-huelle">
 <div class="fusszeile">
  <img class="fuss-avatar" src="bilder/mira-kopf.webp" alt="" width="240" height="240" loading="lazy" decoding="async">
  <div>
    <p class="fuss-satz">Mira begleitet dich durch alle Lektionen – vom ersten Hallo am Bahnhof bis zum Rückblick auf deine erste Woche.</p>
    <p class="fuss-klein">Offenes Lernangebot, orientiert an der A1-Progression des Goethe-Instituts. Kein Zertifikat, keine Prüfung, kein Konto.</p>
  </div>
 </div>
</footer>

</body>
</html>`;
}

module.exports = { renderStartseiteHtml, renderWiederholungsKarte, escapeHtml };

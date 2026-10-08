function renderWortschatz(wortschatz) {
  return wortschatz
    .map(
      (eintrag) =>
        `<li><span class="deutsch">${eintrag.de}</span> <span class="englisch">(${eintrag.en})</span></li>`
    )
    .join('\n');
}

function renderDialog(dialogText) {
  return dialogText
    .split('\n')
    .filter((zeile) => zeile.trim() !== '')
    .map((zeile) => {
      const match = zeile.match(/^\*\*(.+?):\*\*\s*(.*)$/);
      if (!match) return `<p class="dialog-zeile">${zeile}</p>`;
      const [, sprecher, rest] = match;
      return `<p class="dialog-zeile"><span class="sprecher">${sprecher}:</span> ${rest}</p>`;
    })
    .join('\n');
}

const LAUTSPRECHER_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>`;

const ZURUECK_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H6"/><path d="m12 19-7-7 7-7"/></svg>`;

const WIEDERHOLEN_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4.5V9h4.5"/></svg>`;

const VOR_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13"/><path d="m12 5 7 7-7 7"/></svg>`;

/**
 * Sucht die Nachbarstationen für die Fußnavigation.
 *
 * Eine Station ist entweder eine Lektion oder eine Wiederholung. Die Kette
 * baut build.js zusammen und liefert sie in Lernreihenfolge, die
 * Wiederholungen sitzen dort also schon an ihrem Platz zwischen den
 * Lektionen.
 *
 * Gesprungen wird immer zur nächsten bzw. vorherigen Station, die es
 * wirklich gibt. Lücken werden also übersprungen, damit niemand auf einer
 * toten Verknüpfung landet. Ist danach nichts mehr gebaut, steht aber noch
 * etwas in der Kette, wird die geplante Station als Ausblick gemeldet.
 *
 * @param {number|string} aktuell  Schlüssel der aktuellen Station
 * @param {Array} stationen  Lernreihenfolge, Einträge {schluessel?, nr, titel, marke?}
 * @param {Map} gebaut  Schlüssel -> {titel, dateiname, marke?} der fertigen Seiten
 */
function schluesselVon(eintrag) {
  return eintrag.schluessel !== undefined ? eintrag.schluessel : eintrag.nr;
}

function baueNavigation(aktuell, stationen, gebaut) {
  const reihe = stationen.map(schluesselVon);
  const stelle = reihe.indexOf(aktuell);
  if (stelle === -1) return { vorige: null, naechste: null, ausblick: null };

  const suche = (von, schritt) => {
    for (let i = von; i >= 0 && i < stationen.length; i += schritt) {
      const treffer = gebaut.get(reihe[i]);
      if (treffer) return { nr: stationen[i].nr, ...treffer };
    }
    return null;
  };

  const naechste = suche(stelle + 1, 1);
  const naechsterEintrag = stationen[stelle + 1];

  return {
    vorige: suche(stelle - 1, -1),
    naechste,
    ausblick: !naechste && naechsterEintrag ? naechsterEintrag : null,
  };
}

/**
 * Beschriftung einer Navigationskarte. Lektionen werden durchgezählt,
 * Wiederholungen bringen ihre eigene Marke mit ("Wiederholung 1").
 */
function marke(eintrag) {
  return eintrag.marke || `Lektion ${eintrag.nr}`;
}

function renderNavigation(navigation) {
  if (!navigation) return '';
  const { vorige, naechste, ausblick, wiederholung } = navigation;
  const teile = [];

  if (vorige) {
    teile.push(`  <a class="weiter-karte weiter-karte--zurueck" href="${vorige.dateiname}">
    <span class="weiter-label">${ZURUECK_ICON}${marke(vorige)}</span>
    <span class="weiter-titel">${vorige.titel}</span>
  </a>`);
  }

  if (naechste) {
    teile.push(`  <a class="weiter-karte weiter-karte--vor" href="${naechste.dateiname}">
    <span class="weiter-label">${marke(naechste)}${VOR_ICON}</span>
    <span class="weiter-titel">${naechste.titel}</span>
  </a>`);
  } else if (ausblick) {
    teile.push(`  <div class="weiter-karte weiter-karte--vor weiter-karte--bald">
    <span class="weiter-label">${marke(ausblick)} · in Arbeit</span>
    <span class="weiter-titel">${ausblick.titel}</span>
  </div>`);
  }

  // Zweitrangiger Verweis auf die letzte Wiederholung, die auf dem Weg
  // hierhin schon vorgekommen ist. Bewusst kleiner als die beiden Karten:
  // der Weg nach vorn bleibt die Hauptsache, die Wiederholung ist ein
  // Angebot für den Fall, dass etwas nicht mehr sitzt.
  //
  // Auf der Lektion direkt nach einer Wiederholung entfällt er: dort zeigt
  // schon die Zurück-Karte dorthin, zweimal dasselbe Ziel wäre nur Lärm.
  const schonInDenKarten = [vorige, naechste].some(
    (karte) => karte && wiederholung && karte.dateiname === wiederholung.dateiname
  );
  const nebenlink = wiederholung && !schonInDenKarten
    ? `<p class="weiter-nebenlink"><a href="${wiederholung.dateiname}">${WIEDERHOLEN_ICON}<span>${wiederholung.beschriftung}</span></a></p>
`
    : '';

  if (teile.length === 0) return nebenlink;
  return `<nav class="weiter" aria-label="Weiter im Kurs">
${teile.join('\n')}
</nav>
${nebenlink}`;
}

/**
 * Hängt eine kurze Prüfsumme an Stylesheet und Skript.
 *
 * GitHub Pages liefert diese Dateien mit zehn Minuten Zwischenspeicher aus.
 * Ohne Stempel sieht jemand, der die Seite vorher schon einmal geöffnet
 * hatte, nach einer Änderung neues HTML mit altem CSS – die Seite ist dann
 * unbrauchbar. Mit dem Stempel ändert sich bei jeder Änderung die Adresse,
 * und der Browser holt die Datei von allein neu.
 */
function mitVersion(datei, version) {
  return version ? `${datei}?v=${version}` : datei;
}

const STIFT_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;

const MUND_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/></svg>`;

/**
 * Lösung zum Aufklappen. Bewusst mit <details>: das kann der Browser von
 * Haus aus, funktioniert ohne JavaScript und ist mit Tastatur bedienbar.
 */
function renderLoesung(text, beschriftung) {
  if (!text) return '';
  return `<details class="loesung">
  <summary>${beschriftung}</summary>
  <div class="uebung-text">${text}</div>
</details>`;
}

/** Zweite Übung: selbst schreiben statt Lücken füllen. Freiwilliger Abschnitt. */
function renderSchreibuebung(lektion) {
  if (!lektion.schreibuebung) return '';
  return `<section class="block block--schreiben">
<h2>Selbst schreiben</h2>
<div class="schreib-kopf">${STIFT_ICON}<span>Jetzt bist du dran</span></div>
<div class="uebung-text">${lektion.schreibuebung}</div>
${renderLoesung(lektion.beispielloesung, 'Beispiellösung anzeigen')}
</section>

`;
}

/**
 * Nachsprechübung: jeder Satz mit eigener Audiodatei, damit man einzelne
 * Sätze beliebig oft wiederholen kann. Freiwilliger Abschnitt.
 */
function renderNachsprechen(lektion) {
  if (!lektion.nachsprechen || lektion.nachsprechen.length === 0) return '';
  const zeilen = lektion.nachsprechen
    .map(
      (satz, i) => `  <li class="nachsprech-zeile">
    <p class="nachsprech-satz">${satz}</p>
    <audio controls preload="none" src="audio/${lektion.id}/nachsprechen-${i + 1}.mp3"></audio>
  </li>`
    )
    .join('\n');

  return `
<section class="block block--nachsprechen">
<h2>Nachsprechen</h2>
<div class="schreib-kopf">${MUND_ICON}<span>Hören, anhalten, laut nachsprechen</span></div>
<p class="nachsprech-hinweis">Sprich jeden Satz mehrmals nach, bis er sich leicht anfühlt. Es hört dich niemand.</p>
<ol class="nachsprech-liste">
${zeilen}
</ol>
</section>`;
}

/**
 * @param {object} lektion
 * @param {object} [eintrag]  Eintrag aus lektionen/uebersicht.json – liefert
 *   Akzentfarbe und Szenenbild. Fehlt er, wird die Seite schlicht gebaut.
 * @param {object} [navigation]  Ergebnis von baueNavigation – erzeugt die
 *   Verknüpfungen zur vorherigen und nächsten Lektion am Seitenende.
 * @param {{css?: string, js?: string}} [versionen]  Kurze Prüfsummen von
 *   Stylesheet und Skript. Siehe mitVersion().
 */
function renderLektionHtml(lektion, eintrag, navigation, versionen = {}) {
  const nummer = String(lektion.id).padStart(2, '0');
  const szenenbild = eintrag
    ? `<div class="szenenbild" style="background:${eintrag.akzent}">
  <img src="bilder/lektion-${nummer}.webp" alt="Illustration zu Lektion ${lektion.id}: ${lektion.titel}" width="720" height="480" decoding="async">
</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${lektion.titel} – Deutsch für Au-Pairs</title>
<link rel="stylesheet" href="${mitVersion('styles.css', versionen.css)}">
</head>
<body>
<header class="kopfzeile">
  <a class="zurueck" href="index.html">${ZURUECK_ICON}<span>Alle Lektionen</span></a>
  <span class="kopf-hinweis">Lektion ${lektion.id}</span>
</header>
<main class="lektion">
${szenenbild}
<h1>${lektion.titel}</h1>
<p class="lernziel">${lektion.lernziel}</p>

<section class="block block--wortschatz">
<h2>Wortschatz</h2>
<ul class="wortschatz-liste">
${renderWortschatz(lektion.wortschatz)}
</ul>
</section>

<section class="block block--dialog">
<h2>Dialog</h2>
<div class="dialog">
${renderDialog(lektion.dialog)}
</div>
</section>

<section class="block block--grammatik">
<h2>Grammatik</h2>
<div class="erklaerung">
  <p class="erklaerung-text" data-sprache="de">${lektion.grammatikDe}</p>
  <p class="erklaerung-text" data-sprache="en" style="display:none">${lektion.grammatikEn}</p>
  <button class="sprach-umschalter" aria-pressed="false">Verstehst du das nicht? Hier auf Englisch</button>
</div>
</section>

<section class="block block--uebung">
<h2>Übung</h2>
<div class="uebung-text">${lektion.uebung}</div>
${renderLoesung(lektion.loesung, 'Lösung anzeigen')}
</section>

${renderSchreibuebung(lektion)}
<section class="block block--audio">
<h2>Hörübung</h2>
<div class="audio-karte">
  <div class="audio-kopf">${LAUTSPRECHER_ICON}<span>Anhören</span></div>
  <audio controls preload="metadata" src="audio/${lektion.id}/hoeruebung.mp3"></audio>
  <p class="uebung-text">${lektion.hoertext}</p>
</div>
</section>
${renderNachsprechen(lektion)}

${renderNavigation(navigation)}<p class="lektion-fuss"><a class="zurueck" href="index.html">${ZURUECK_ICON}<span>Alle Lektionen in der Übersicht</span></a></p>

</main>
<script src="${mitVersion('toggle.js', versionen.js)}"></script>
</body>
</html>`;
}

module.exports = {
  renderLektionHtml,
  baueNavigation,
  renderNavigation,
  renderLoesung,
  mitVersion,
  ZURUECK_ICON,
  LAUTSPRECHER_ICON,
};

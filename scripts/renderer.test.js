const test = require('node:test');
const assert = require('node:assert');
const { renderLektionHtml } = require('./renderer.js');

const beispielLektion = {
  id: 1, titel: 'Ankommen', lernziel: 'Sich vorstellen.', grammatikfokus: 'sein',
  wortschatz: [{ de: 'Hallo', en: 'Hello' }],
  dialog: '**A:** Hallo.', grammatikDe: 'Deutscher Text', grammatikEn: 'English text',
  uebung: 'Übe das.', hoertext: 'Hörtext.',
};

test('renderLektionHtml enthält Titel und Lernziel', () => {
  const html = renderLektionHtml(beispielLektion);
  assert.match(html, /Ankommen/);
  assert.match(html, /Sich vorstellen\./);
});

test('renderLektionHtml zeigt Deutsch sichtbar, Englisch versteckt', () => {
  const html = renderLektionHtml(beispielLektion);
  assert.match(html, /data-sprache="de">Deutscher Text</);
  assert.match(html, /data-sprache="en" style="display:none">English text</);
});

test('renderLektionHtml bindet toggle.js ein', () => {
  const html = renderLektionHtml(beispielLektion);
  assert.match(html, /<script src="toggle\.js"><\/script>/);
});

const { baueNavigation } = require('./renderer.js');

const uebersicht = [
  { nr: 1, titel: 'Ankommen' },
  { nr: 2, titel: 'Gastfamilie' },
  { nr: 3, titel: 'Zimmer' },
  { nr: 4, titel: 'Tagesablauf' },
];
const dreiGebaut = new Map([
  [1, { titel: 'Ankommen', dateiname: 'lektion-01.html' }],
  [2, { titel: 'Gastfamilie', dateiname: 'lektion-02.html' }],
  [3, { titel: 'Zimmer', dateiname: 'lektion-03.html' }],
]);

test('baueNavigation findet Vorgaenger und Nachfolger', () => {
  assert.deepEqual(baueNavigation(2, uebersicht, dreiGebaut), {
    vorige: { nr: 1, titel: 'Ankommen', dateiname: 'lektion-01.html' },
    naechste: { nr: 3, titel: 'Zimmer', dateiname: 'lektion-03.html' },
    ausblick: null,
  });
});

test('die erste Lektion hat keinen Vorgaenger', () => {
  const nav = baueNavigation(1, uebersicht, dreiGebaut);
  assert.equal(nav.vorige, null);
  assert.equal(nav.naechste.nr, 2);
});

test('ohne gebauten Nachfolger wird die geplante Lektion als Ausblick gemeldet', () => {
  const nav = baueNavigation(3, uebersicht, dreiGebaut);
  assert.equal(nav.naechste, null);
  assert.equal(nav.ausblick.nr, 4);
  assert.equal(nav.ausblick.titel, 'Tagesablauf');
});

test('die letzte Lektion der Uebersicht bekommt keinen Ausblick', () => {
  const alleVier = new Map(dreiGebaut).set(4, { titel: 'Tagesablauf', dateiname: 'lektion-04.html' });
  const nav = baueNavigation(4, uebersicht, alleVier);
  assert.equal(nav.naechste, null);
  assert.equal(nav.ausblick, null);
});

test('Luecken im Bestand werden uebersprungen statt tot verlinkt', () => {
  const mitLuecke = new Map([
    [1, { titel: 'Ankommen', dateiname: 'lektion-01.html' }],
    [4, { titel: 'Tagesablauf', dateiname: 'lektion-04.html' }],
  ]);
  assert.equal(baueNavigation(1, uebersicht, mitLuecke).naechste.nr, 4);
  assert.equal(baueNavigation(4, uebersicht, mitLuecke).vorige.nr, 1);
});

test('renderLektionHtml zeigt die Weiterverknuepfung am Seitenende', () => {
  const nav = baueNavigation(1, uebersicht, dreiGebaut);
  const html = renderLektionHtml(beispielLektion, undefined, nav);
  assert.match(html, /class="weiter-karte weiter-karte--vor" href="lektion-02\.html"/);
  assert.doesNotMatch(html, /weiter-karte--zurueck/);
});

test('ohne Navigationsdaten bleibt die Seite unveraendert baubar', () => {
  const html = renderLektionHtml(beispielLektion);
  assert.doesNotMatch(html, /class="weiter"/);
  assert.match(html, /href="index\.html"/);
});

const reicheLektion = {
  ...beispielLektion,
  loesung: 'Die Loesung.',
  schreibuebung: 'Schreib drei Saetze.',
  beispielloesung: 'So koennte es aussehen.',
  nachsprechen: ['Erster Satz.', 'Zweiter Satz.'],
};

test('die Loesung steckt in einem aufklappbaren details-Element', () => {
  const html = renderLektionHtml(reicheLektion);
  assert.match(html, /<details class="loesung">\s*<summary>Lösung anzeigen<\/summary>/);
  assert.match(html, /Die Loesung\./);
});

test('die Loesung steht nicht offen im Uebungstext', () => {
  const html = renderLektionHtml(reicheLektion);
  const uebungsblock = html.slice(
    html.indexOf('block--uebung'),
    html.indexOf('<details class="loesung">')
  );
  assert.doesNotMatch(uebungsblock, /Die Loesung\./);
});

test('die Schreibuebung bekommt einen eigenen Block mit Beispielloesung', () => {
  const html = renderLektionHtml(reicheLektion);
  assert.match(html, /block--schreiben/);
  assert.match(html, /<summary>Beispiellösung anzeigen<\/summary>/);
});

test('jeder Nachsprech-Satz bekommt eine eigene Audiodatei', () => {
  const html = renderLektionHtml(reicheLektion);
  assert.match(html, /src="audio\/1\/nachsprechen-1\.mp3"/);
  assert.match(html, /src="audio\/1\/nachsprechen-2\.mp3"/);
  assert.equal(html.match(/nachsprechen-\d+\.mp3/g).length, 2);
});

test('ohne freiwillige Abschnitte fehlen die Bloecke ganz', () => {
  const html = renderLektionHtml({ ...beispielLektion, loesung: 'L', nachsprechen: [] });
  assert.doesNotMatch(html, /block--schreiben/);
  assert.doesNotMatch(html, /block--nachsprechen/);
  assert.match(html, /block--uebung/);
});

test('Nachsprech-Audio wird nicht vorgeladen', () => {
  const html = renderLektionHtml(reicheLektion);
  assert.match(html, /nachsprechen-1\.mp3/);
  assert.doesNotMatch(html, /preload="auto"/);
});

test('Stylesheet und Skript bekommen einen Versionsstempel', () => {
  const html = renderLektionHtml(beispielLektion, undefined, undefined, { css: 'abc123', js: 'def456' });
  assert.match(html, /href="styles\.css\?v=abc123"/);
  assert.match(html, /src="toggle\.js\?v=def456"/);
});

test('ohne Versionen bleiben die Verweise schlicht', () => {
  const html = renderLektionHtml(beispielLektion);
  assert.match(html, /href="styles\.css"/);
  assert.match(html, /src="toggle\.js"/);
});

/* Wiederholungen in der Fußnavigation */

const kette = [
  { schluessel: 'lektion-1', nr: 1, titel: 'Ankommen' },
  { schluessel: 'lektion-2', nr: 2, titel: 'Gastfamilie' },
  { schluessel: 'wiederholung-1', nr: 1, titel: 'Wiederholung: Lektion 1 bis 2', umfasst: '1 bis 2', marke: 'Wiederholung 1' },
  { schluessel: 'lektion-3', nr: 3, titel: 'Zimmer' },
];
const ketteGebaut = new Map([
  ['lektion-1', { titel: 'Ankommen', dateiname: 'lektion-01.html' }],
  ['lektion-2', { titel: 'Gastfamilie', dateiname: 'lektion-02.html' }],
  ['wiederholung-1', { titel: 'Wiederholung: Lektion 1 bis 2', dateiname: 'wiederholung-01.html', marke: 'Wiederholung 1' }],
  ['lektion-3', { titel: 'Zimmer', dateiname: 'lektion-03.html' }],
]);

// Zwei Lektionen hinter der Wiederholung: dort zeigt keine der beiden
// Karten mehr auf sie, der Zweitverweis ist also der einzige Weg zurück.
const langeKette = [...kette, { schluessel: 'lektion-4', nr: 4, titel: 'Tagesablauf' }];
const langeKetteGebaut = new Map(ketteGebaut).set('lektion-4', {
  titel: 'Tagesablauf',
  dateiname: 'lektion-04.html',
});
const zweitverweis = {
  dateiname: 'wiederholung-01.html',
  beschriftung: 'Wiederholung: Lektion 1 bis 2',
};

test('nach der letzten Lektion vor einer Wiederholung führt Weiter dorthin', () => {
  const nav = baueNavigation('lektion-2', kette, ketteGebaut);
  assert.strictEqual(nav.naechste.dateiname, 'wiederholung-01.html');
  const html = renderLektionHtml(beispielLektion, undefined, nav);
  assert.match(html, /weiter-karte--vor" href="wiederholung-01\.html"/);
  assert.match(html, /<span class="weiter-label">Wiederholung 1/);
  assert.doesNotMatch(html, /weiter-label">Lektion 1</);
});

test('die Lektion nach der Wiederholung verweist zurück auf sie', () => {
  const nav = baueNavigation('lektion-3', kette, ketteGebaut);
  assert.strictEqual(nav.vorige.dateiname, 'wiederholung-01.html');
});

test('der Zweitverweis steht unter den Karten, nicht in ihnen', () => {
  const nav = baueNavigation('lektion-4', langeKette, langeKetteGebaut);
  nav.wiederholung = zweitverweis;
  const html = renderLektionHtml(beispielLektion, undefined, nav);
  assert.match(html, /<p class="weiter-nebenlink"><a href="wiederholung-01\.html">/);
  assert.match(html, /Wiederholung: Lektion 1 bis 2/);
  // Erst die Navigation, dann der Zweitverweis, dann der Seitenfuß.
  assert.ok(html.indexOf('</nav>') < html.indexOf('weiter-nebenlink'));
  assert.ok(html.indexOf('weiter-nebenlink') < html.indexOf('lektion-fuss'));
});

test('ohne Zweitverweis bleibt die Fußnavigation wie bisher', () => {
  const html = renderLektionHtml(beispielLektion, undefined, baueNavigation('lektion-3', kette, ketteGebaut));
  assert.doesNotMatch(html, /weiter-nebenlink/);
});

test('eine ungebaute Wiederholung erscheint als Ausblick mit ihrer Marke', () => {
  const nurLektionen = new Map([['lektion-2', { titel: 'Gastfamilie', dateiname: 'lektion-02.html' }]]);
  const nav = baueNavigation('lektion-2', kette, nurLektionen);
  assert.strictEqual(nav.naechste, null);
  assert.strictEqual(nav.ausblick.marke, 'Wiederholung 1');
  const html = renderLektionHtml(beispielLektion, undefined, nav);
  assert.match(html, /Wiederholung 1 · in Arbeit/);
});

test('direkt nach der Wiederholung entfaellt der Zweitverweis', () => {
  // Lektion 3 liegt unmittelbar hinter der Wiederholung: die Zurück-Karte
  // zeigt schon dorthin.
  const nav = baueNavigation('lektion-3', kette, ketteGebaut);
  nav.wiederholung = zweitverweis;
  const html = renderLektionHtml(beispielLektion, undefined, nav);
  assert.doesNotMatch(html, /weiter-nebenlink/);
  assert.match(html, /weiter-karte--zurueck" href="wiederholung-01\.html"/);
});

test('eine Lektion weiter erscheint der Zweitverweis wieder', () => {
  const nav = baueNavigation('lektion-4', langeKette, langeKetteGebaut);
  nav.wiederholung = zweitverweis;
  const html = renderLektionHtml(beispielLektion, undefined, nav);
  assert.match(html, /weiter-nebenlink/);
});

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { renderWiederholungHtml } = require('./wiederholung.js');
const { parseWiederholung } = require('./parser.js');
const { baueNavigation } = require('./renderer.js');
const { baueStationen, letzteWiederholungVor } = require('./stationen.js');

const beispiel = parseWiederholung(path.join(__dirname, 'fixtures', 'test-wiederholung.md'));

test('Titel, Marke und Umfang stehen im Kopf', () => {
  const html = renderWiederholungHtml(beispiel);
  assert.match(html, /<h1>Testwiederholung<\/h1>/);
  assert.match(html, /Wiederholung 7 · Lektion 1 bis 2/);
});

test('jede Aufgabe wird als eigener Block mit Nummer gebaut', () => {
  const html = renderWiederholungHtml(beispiel);
  assert.strictEqual(html.match(/block--aufgabe/g).length, 3);
  assert.match(html, /<span class="aufgabe-nummer">1<\/span>/);
  assert.match(html, /<span class="aufgabe-nummer">3<\/span>/);
  assert.match(html, /Erste Testaufgabe/);
});

test('jede Lösung steckt in einem eigenen Aufklapper', () => {
  const html = renderWiederholungHtml(beispiel);
  assert.strictEqual(html.match(/<details class="loesung">/g).length, 3);
  assert.strictEqual(html.match(/<summary>Lösung anzeigen<\/summary>/g).length, 2);
  assert.match(html, /<summary>Beispiellösung anzeigen<\/summary>/);
});

test('keine Lösung steht offen über ihrem Aufklapper', () => {
  const html = renderWiederholungHtml(beispiel);
  const vorDemAufklapper = html.slice(0, html.indexOf('<details class="loesung">'));
  assert.doesNotMatch(vorDemAufklapper, /Erste Lösung\./);
});

test('die Wiederholungsseite hat kein Audio und keinen Wortschatz', () => {
  const html = renderWiederholungHtml(beispiel);
  assert.doesNotMatch(html, /<audio/);
  assert.doesNotMatch(html, /\.mp3/);
  assert.doesNotMatch(html, /wortschatz/);
  assert.doesNotMatch(html, /block--dialog/);
});

test('die Einleitung ist zweisprachig und startet auf Deutsch', () => {
  const html = renderWiederholungHtml(beispiel);
  assert.match(html, /data-sprache="de">Deutsche Einleitung\./);
  assert.match(html, /data-sprache="en" style="display:none">English introduction\./);
  assert.match(html, /class="sprach-umschalter" aria-pressed="false"/);
  assert.match(html, /<script src="toggle\.js"><\/script>/);
});

test('die Rückmeldung bekommt einen eigenen Block', () => {
  const html = renderWiederholungHtml(beispiel);
  assert.match(html, /block--rueckmeldung/);
  assert.match(html, /Sag, was schwer war\./);
});

test('ohne Rückmeldungsabschnitt fehlt der Block ganz', () => {
  const html = renderWiederholungHtml({ ...beispiel, rueckmeldung: '' });
  assert.doesNotMatch(html, /block--rueckmeldung/);
});

test('die Akzentfarbe kommt aus dem Plan, fehlt sie, bleibt es bei der Grundfarbe', () => {
  assert.match(renderWiederholungHtml(beispiel, { akzent: '#E8E6FF' }), /background:#E8E6FF/);
  assert.match(renderWiederholungHtml(beispiel), /background:var\(--lavendel\)/);
});

test('Stylesheet und Skript bekommen einen Versionsstempel', () => {
  const html = renderWiederholungHtml(beispiel, undefined, undefined, { css: 'abc123', js: 'def456' });
  assert.match(html, /href="styles\.css\?v=abc123"/);
  assert.match(html, /src="toggle\.js\?v=def456"/);
});

test('die Fußnavigation führt zurück in die Lektion und weiter zur nächsten', () => {
  const uebersicht = [
    { nr: 1, titel: 'Ankommen' },
    { nr: 2, titel: 'Gastfamilie' },
    { nr: 3, titel: 'Zimmer' },
  ];
  const plan = [{ nr: 7, nach: 2, umfasst: '1 bis 2', titel: 'Testwiederholung' }];
  const stationen = baueStationen(uebersicht, plan);
  const gebaut = new Map([
    ['lektion-1', { titel: 'Ankommen', dateiname: 'lektion-01.html' }],
    ['lektion-2', { titel: 'Gastfamilie', dateiname: 'lektion-02.html' }],
    ['wiederholung-7', { titel: 'Testwiederholung', dateiname: 'wiederholung-07.html', marke: 'Wiederholung 7' }],
    ['lektion-3', { titel: 'Zimmer', dateiname: 'lektion-03.html' }],
  ]);
  const html = renderWiederholungHtml(
    beispiel,
    undefined,
    baueNavigation('wiederholung-7', stationen, gebaut)
  );
  assert.match(html, /href="lektion-02\.html"[\s\S]*?Lektion 2/);
  assert.match(html, /href="lektion-03\.html"[\s\S]*?Lektion 3/);
  // Auf der Wiederholungsseite selbst gibt es keinen Zweitverweis.
  assert.doesNotMatch(html, /weiter-nebenlink/);
  assert.strictEqual(letzteWiederholungVor('wiederholung-7', stationen, gebaut), null);
});

// scripts/abschluss.test.js
const test = require('node:test');
const assert = require('node:assert');
const { renderAbschlussHtml, renderAbsaetze } = require('./abschluss.js');

function testAbschluss(ueberschreiben = {}) {
  return {
    art: 'abschluss',
    titel: 'Du hast es geschafft',
    gratulationDe: 'Erster Absatz.\n\nZweiter Absatz.',
    gratulationEn: 'First paragraph.',
    gesprochen: 'Du hast es geschafft.',
    bescheinigungDe: 'Keine Prüfung.',
    bescheinigungEn: 'Not an exam.',
    ...ueberschreiben,
  };
}

const LERNWEG = ['lektion-1', 'wiederholung-1', 'lektion-2'];

test('aus einer Leerzeile wird ein neuer Absatz', () => {
  assert.strictEqual(renderAbsaetze('Eins.\n\nZwei.'), '<p>Eins.</p>\n<p>Zwei.</p>');
});

test('leere Absätze fallen weg', () => {
  assert.strictEqual(renderAbsaetze('Eins.\n\n\n\nZwei.'), '<p>Eins.</p>\n<p>Zwei.</p>');
});

test('die Seite trägt den Titel und die Gratulation in beiden Sprachen', () => {
  const html = renderAbschlussHtml(testAbschluss(), null, {}, LERNWEG);
  assert.match(html, /<h1>Du hast es geschafft<\/h1>/);
  assert.match(html, /Erster Absatz\./);
  assert.match(html, /First paragraph\./);
  assert.match(html, /data-sprache="en"[^>]*style="display:none"/);
});

test('die Seite meldet sich selbst als Station abschluss', () => {
  const html = renderAbschlussHtml(testAbschluss(), null, {}, LERNWEG);
  assert.match(html, /<body data-station="abschluss">/);
});

test('der Lernweg steht für die Fortschrittsanzeige in der Seite', () => {
  const html = renderAbschlussHtml(testAbschluss(), null, {}, LERNWEG);
  assert.match(html, /data-stationen="lektion-1,wiederholung-1,lektion-2"/);
});

test('Miras Tonspur wird eingebunden, aber nicht von allein gestartet', () => {
  const html = renderAbschlussHtml(testAbschluss(), null, {}, LERNWEG);
  assert.match(html, /src="audio\/abschluss\/gratulation\.mp3"/);
  assert.ok(!html.includes('autoplay'));
});

test('die Bescheinigung ist von hier aus erreichbar', () => {
  const html = renderAbschlussHtml(testAbschluss(), null, {}, LERNWEG);
  assert.match(html, /href="zertifikat\.html"/);
});

test('Umschalter und Fortschritt werden mit Versionsstempel geladen', () => {
  const html = renderAbschlussHtml(testAbschluss(), null, { js: 'aaa', fortschritt: 'bbb' }, LERNWEG);
  assert.match(html, /src="toggle\.js\?v=aaa"/);
  assert.match(html, /src="fortschritt\.js\?v=bbb"/);
});

test('das Konfetti ist bei gleicher Eingabe immer gleich', () => {
  const eins = renderAbschlussHtml(testAbschluss(), null, {}, LERNWEG);
  const zwei = renderAbschlussHtml(testAbschluss(), null, {}, LERNWEG);
  assert.strictEqual(eins, zwei);
});

test('spitze Klammern im Titel landen nicht als Auszeichnung in der Seite', () => {
  const html = renderAbschlussHtml(testAbschluss({ titel: 'A <b> B' }), null, {}, LERNWEG);
  assert.match(html, /A &lt;b&gt; B/);
});

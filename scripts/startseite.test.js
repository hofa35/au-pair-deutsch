const test = require('node:test');
const assert = require('node:assert');
const { renderStartseiteHtml, escapeHtml } = require('./startseite.js');

const uebersicht = [
  { nr: 1, titel: 'Ankommen', satz: 'Hallo!', schlagwort: 'Start', akzent: '#FFECD2' },
  { nr: 2, titel: 'Gastfamilie & Co', satz: 'Das ist meine Familie.', schlagwort: 'Familie', akzent: '#E8E6FF' },
];

test('verlinkt nur Lektionen, die wirklich gebaut wurden', () => {
  const gebaut = new Map([[1, { titel: 'Ankommen und sich vorstellen', dateiname: 'lektion-01.html' }]]);
  const html = renderStartseiteHtml(uebersicht, gebaut);
  assert.match(html, /<a class="karte karte--offen" href="lektion-01\.html">/);
  assert.match(html, /karte karte--bald/);
  assert.doesNotMatch(html, /href="lektion-02\.html"/);
});

test('zeigt alle Einträge der Übersicht, auch die unfertigen', () => {
  const html = renderStartseiteHtml(uebersicht, new Map());
  assert.match(html, /bilder\/lektion-01\.webp/);
  assert.match(html, /bilder\/lektion-02\.webp/);
  assert.equal(html.match(/class="karte /g).length, 2);
});

test('Titel aus der Lektionsdatei hat Vorrang vor der Übersicht', () => {
  const gebaut = new Map([[1, { titel: 'Ankommen und sich vorstellen', dateiname: 'lektion-01.html' }]]);
  const html = renderStartseiteHtml(uebersicht, gebaut);
  assert.match(html, /Ankommen und sich vorstellen<\/h3>/);
});

test('ohne fertige Lektion gibt es keinen aktiven Startknopf', () => {
  const html = renderStartseiteHtml(uebersicht, new Map());
  assert.match(html, /knopf--aus/);
  assert.doesNotMatch(html, /knopf--primaer/);
});

test('Sonderzeichen in Inhalten werden maskiert', () => {
  const html = renderStartseiteHtml(uebersicht, new Map());
  assert.match(html, /Gastfamilie &amp; Co/);
  assert.equal(escapeHtml('<b>"x" & y</b>'), '&lt;b&gt;&quot;x&quot; &amp; y&lt;/b&gt;');
});

test('nur das erste Bild lädt sofort, der Rest verzögert', () => {
  const html = renderStartseiteHtml(uebersicht, new Map());
  assert.equal(html.match(/loading="lazy"/g).length, 2); // Karte 2 und das Avatar in der Fußzeile
  assert.doesNotMatch(html, /lektion-01\.webp"[^>]*loading="lazy"/);
});

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

test('die Startseite verweist auf das Stylesheet mit Versionsstempel', () => {
  const html = renderStartseiteHtml(uebersicht, new Map(), { css: 'abc123' });
  assert.match(html, /href="styles\.css\?v=abc123"/);
});

test('ohne Version bleibt der Verweis schlicht', () => {
  const html = renderStartseiteHtml(uebersicht, new Map());
  assert.match(html, /href="styles\.css"/);
});

/* Wiederholungen im Lektionsraster */

const plan = [
  {
    nr: 1,
    nach: 1,
    umfasst: '1 bis 1',
    titel: 'Wiederholung: Lektion 1',
    akzent: '#E8E6FF',
    info: 'Aufgaben quer durch die Lektion.',
    dateiname: 'wiederholung-01.html',
  },
  {
    nr: 2,
    nach: 2,
    umfasst: '2 bis 2',
    titel: 'Wiederholung: Lektion 2',
    akzent: '#D9F0E8',
    info: 'Kommt später.',
  },
];

test('eine fertige Wiederholung wird verlinkt, eine geplante nicht', () => {
  const html = renderStartseiteHtml(uebersicht, new Map(), {}, plan);
  assert.match(html, /<a class="karte karte--wiederholung" href="wiederholung-01\.html">/);
  assert.match(html, /karte--wiederholung karte--bald/);
  assert.doesNotMatch(html, /href="wiederholung-02\.html"/);
});

test('das Band sitzt hinter der Lektion, nach der es gehört', () => {
  const html = renderStartseiteHtml(uebersicht, new Map(), {}, plan);
  const ersteLektion = html.indexOf('lektion-01.webp');
  const erstesBand = html.indexOf('wiederholung-01.html');
  const zweiteLektion = html.indexOf('lektion-02.webp');
  assert.ok(ersteLektion < erstesBand && erstesBand < zweiteLektion);
});

test('das Band liegt quer über das Raster', () => {
  const html = renderStartseiteHtml(uebersicht, new Map(), {}, plan);
  assert.strictEqual(html.match(/class="zwischenstation"/g).length, 2);
});

test('der Stand nennt die Wiederholungen mit', () => {
  const html = renderStartseiteHtml(uebersicht, new Map(), {}, plan);
  assert.match(html, /Dazwischen liegen 2 Wiederholungen\./);
});

test('ohne Plan bleibt die Startseite unverändert', () => {
  const html = renderStartseiteHtml(uebersicht, new Map());
  assert.doesNotMatch(html, /zwischenstation/);
  assert.doesNotMatch(html, /Dazwischen liegen/);
});

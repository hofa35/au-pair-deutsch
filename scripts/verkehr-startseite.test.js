const test = require('node:test');
const assert = require('node:assert');
const { renderVerkehrStartseiteHtml } = require('./verkehr-startseite.js');

const uebersicht = [
  { id: 1, titel: 'Vorfahrt im Straßenverkehr', themenbereich: 'Vorfahrt', akzent: '#FFE3B3' },
  { id: 2, titel: 'Verkehrsschilder und Fahrradwege', themenbereich: 'Schilder', akzent: '#CFE8FF' },
];

test('fertige Module werden verlinkt, unfertige als "in Arbeit" markiert', () => {
  const gebaut = new Map([
    [1, { titel: 'Vorfahrt im Straßenverkehr', themenbereich: 'Vorfahrt', dateiname: 'modul-01.html' }],
  ]);
  const html = renderVerkehrStartseiteHtml(uebersicht, gebaut);
  assert.match(html, /<a class="karte karte--offen" href="modul-01\.html">/);
  assert.match(html, /in Arbeit/);
});

test('der Stand-Text zählt fertige von geplanten Modulen', () => {
  const gebaut = new Map([[1, { titel: 'X', themenbereich: 'Y', dateiname: 'modul-01.html' }]]);
  const html = renderVerkehrStartseiteHtml(uebersicht, gebaut);
  assert.match(html, /1 von 2 ist fertig/);
});

test('ohne fertige Module bleibt die Karte unverlinkt', () => {
  const html = renderVerkehrStartseiteHtml(uebersicht, new Map());
  assert.doesNotMatch(html, /karte--offen/);
});

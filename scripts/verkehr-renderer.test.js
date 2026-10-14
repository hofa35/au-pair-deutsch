const test = require('node:test');
const assert = require('node:assert');
const { renderModulHtml } = require('./verkehr-renderer.js');

const beispielModul = {
  id: 1,
  titel: 'Vorfahrt im Straßenverkehr',
  themenbereich: 'Vorfahrt',
  einleitungDe: 'Deutsche Einleitung.',
  einleitungEn: 'English intro.',
  regelDe: 'Deutsche Regel.',
  regelEn: 'English rule.',
  aufgaben: [
    {
      titel: 'Kreuzung ohne Schilder',
      bild: 'vorfahrt-kreuzung-ohne-schilder.webp',
      fragDe: 'Wer hat Vorfahrt?',
      fragEn: 'Who has the right of way?',
      optionen: [
        { text: 'Der Radfahrer von links', richtig: false },
        { text: 'Der Radfahrer von rechts', richtig: true },
      ],
      erklaerungDe: 'Rechts vor links.',
      erklaerungEn: 'Right before left.',
    },
  ],
};

test('renderModulHtml enthält Titel und Themenbereich', () => {
  const html = renderModulHtml(beispielModul);
  assert.match(html, /Vorfahrt im Straßenverkehr/);
  assert.match(html, /Vorfahrt<\/span>/);
});

test('renderModulHtml zeigt Deutsch sichtbar, Englisch versteckt', () => {
  const html = renderModulHtml(beispielModul);
  assert.match(html, /data-sprache="de">Deutsche Regel\./);
  assert.match(html, /data-sprache="en" style="display:none">English rule\./);
});

test('renderModulHtml markiert die richtige Option über data-richtig', () => {
  const html = renderModulHtml(beispielModul);
  assert.match(html, /data-richtig="1"/);
});

test('renderModulHtml bindet toggle.js und verkehr-uebung.js ein', () => {
  const html = renderModulHtml(beispielModul);
  assert.match(html, /<script src="toggle\.js">/);
  assert.match(html, /<script src="verkehr-uebung\.js">/);
});

test('renderModulHtml escaped Optionstexte', () => {
  const modulMitSonderzeichen = {
    ...beispielModul,
    aufgaben: [
      {
        ...beispielModul.aufgaben[0],
        optionen: [{ text: 'A < B', richtig: true }],
      },
    ],
  };
  const html = renderModulHtml(modulMitSonderzeichen);
  assert.match(html, /A &lt; B/);
});

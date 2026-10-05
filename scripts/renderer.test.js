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

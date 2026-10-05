const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { parseLektion } = require('./parser.js');

test('parseLektion liest Frontmatter-Felder', () => {
  const lektion = parseLektion(path.join(__dirname, 'fixtures', 'test-lektion.md'));
  assert.strictEqual(lektion.id, 1);
  assert.strictEqual(lektion.titel, 'Testlektion');
  assert.strictEqual(lektion.lernziel, 'Testziel.');
  assert.strictEqual(lektion.grammatikfokus, 'Testgrammatik');
});

test('parseLektion liest Wortschatz-Tabelle', () => {
  const lektion = parseLektion(path.join(__dirname, 'fixtures', 'test-lektion.md'));
  assert.deepStrictEqual(lektion.wortschatz, [
    { de: 'Hallo', en: 'Hello' },
    { de: 'Danke', en: 'Thank you' },
  ]);
});

test('parseLektion liest Dialog, Grammatik, Übung, Hörübung', () => {
  const lektion = parseLektion(path.join(__dirname, 'fixtures', 'test-lektion.md'));
  assert.match(lektion.dialog, /Hallo zurück/);
  assert.strictEqual(lektion.grammatikDe, 'Deutscher Grammatiktext.');
  assert.strictEqual(lektion.grammatikEn, 'English grammar text.');
  assert.strictEqual(lektion.uebung, 'Übungstext hier.');
  assert.strictEqual(lektion.hoertext, 'Hörtext hier.');
});

test('parseLektion wirft Fehler bei malformed Wortschatz-Zeile', () => {
  assert.throws(() => {
    parseLektion(path.join(__dirname, 'fixtures', 'malformed-wortschatz.md'));
  }, /Malformed wortschatz row/);
});

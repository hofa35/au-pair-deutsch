// scripts/pruefstand.test.js
const test = require('node:test');
const assert = require('node:assert');
const { validateLektion } = require('./pruefstand.js');

function vollstaendigeLektion(ueberschreiben = {}) {
  return {
    id: 1, titel: 'X', lernziel: 'Y', grammatikfokus: 'Z',
    wortschatz: [{ de: 'Hallo', en: 'Hello' }],
    dialog: 'A: Hi', grammatikDe: 'De', grammatikEn: 'En',
    uebung: 'Ü', loesung: 'L', hoertext: 'H', nachsprechen: [],
    ...ueberschreiben,
  };
}

test('vollständige Lektion ist gültig', () => {
  const result = validateLektion(vollstaendigeLektion());
  assert.strictEqual(result.valid, true);
  assert.deepStrictEqual(result.errors, []);
});

test('fehlendes Pflichtfeld wird gemeldet', () => {
  const result = validateLektion(vollstaendigeLektion({ titel: '', wortschatz: [] }));
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes('titel fehlt'));
  assert.ok(result.errors.includes('wortschatz ist leer'));
});

test('eine Übung ohne Lösung wird beanstandet', () => {
  const result = validateLektion(vollstaendigeLektion({ loesung: '' }));
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes('loesung fehlt'));
});

test('freiwillige Abschnitte dürfen ganz fehlen', () => {
  const result = validateLektion(vollstaendigeLektion({ schreibuebung: '', beispielloesung: '' }));
  assert.strictEqual(result.valid, true);
});

test('Schreibübung ohne Beispiellösung wird beanstandet', () => {
  const result = validateLektion(vollstaendigeLektion({ schreibuebung: 'Schreib was.' }));
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes('schreibuebung ohne beispielloesung'));
});

test('Beispiellösung ohne Schreibübung wird beanstandet', () => {
  const result = validateLektion(vollstaendigeLektion({ beispielloesung: 'So geht es.' }));
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes('beispielloesung ohne schreibuebung'));
});

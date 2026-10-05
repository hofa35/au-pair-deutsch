// scripts/pruefstand.test.js
const test = require('node:test');
const assert = require('node:assert');
const { validateLektion } = require('./pruefstand.js');

test('vollständige Lektion ist gültig', () => {
  const lektion = {
    id: 1, titel: 'X', lernziel: 'Y', grammatikfokus: 'Z',
    wortschatz: [{ de: 'Hallo', en: 'Hello' }],
    dialog: 'A: Hi', grammatikDe: 'De', grammatikEn: 'En',
    uebung: 'Ü', hoertext: 'H',
  };
  const result = validateLektion(lektion);
  assert.strictEqual(result.valid, true);
  assert.deepStrictEqual(result.errors, []);
});

test('fehlendes Pflichtfeld wird gemeldet', () => {
  const lektion = {
    id: 1, titel: '', lernziel: 'Y', grammatikfokus: 'Z',
    wortschatz: [], dialog: 'A: Hi', grammatikDe: 'De', grammatikEn: 'En',
    uebung: 'Ü', hoertext: 'H',
  };
  const result = validateLektion(lektion);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes('titel fehlt'));
  assert.ok(result.errors.includes('wortschatz ist leer'));
});

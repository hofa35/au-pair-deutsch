const test = require('node:test');
const assert = require('node:assert');
const { naechsterZustand } = require('./toggle.js');

test('von de wechselt der Zustand zu en', () => {
  assert.strictEqual(naechsterZustand('de'), 'en');
});

test('von en wechselt der Zustand zurück zu de', () => {
  assert.strictEqual(naechsterZustand('en'), 'de');
});

// scripts/urkunde.test.js
const test = require('node:test');
const assert = require('node:assert');
const { heuteAlsText } = require('./urkunde.js');

test('das Datum steht in deutscher Schreibweise mit führenden Nullen', () => {
  assert.strictEqual(heuteAlsText(new Date(2026, 9, 8)), '08.10.2026');
});

test('zweistellige Tage und Monate bleiben zweistellig', () => {
  assert.strictEqual(heuteAlsText(new Date(2026, 10, 23)), '23.11.2026');
});

const test = require('node:test');
const assert = require('node:assert');
const { istAntwortRichtig } = require('./verkehr-uebung.js');

test('richtig gewählter Index gilt als richtig', () => {
  assert.strictEqual(istAntwortRichtig(1, 1), true);
});

test('falsch gewählter Index gilt als falsch', () => {
  assert.strictEqual(istAntwortRichtig(0, 1), false);
});

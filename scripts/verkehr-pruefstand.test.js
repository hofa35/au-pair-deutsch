const test = require('node:test');
const assert = require('node:assert');
const { validateVerkehrsmodul } = require('./verkehr-pruefstand.js');

function gueltigesModul() {
  return {
    id: 1,
    titel: 'Testmodul',
    themenbereich: 'Test',
    einleitungDe: 'DE',
    einleitungEn: 'EN',
    regelDe: 'DE',
    regelEn: 'EN',
    aufgaben: [
      {
        titel: 'A1',
        bild: 'a1.webp',
        fragDe: 'DE?',
        fragEn: 'EN?',
        optionen: [
          { text: 'X', richtig: false },
          { text: 'Y', richtig: true },
        ],
        erklaerungDe: 'DE',
        erklaerungEn: 'EN',
      },
      {
        titel: 'A2',
        bild: 'a2.webp',
        fragDe: 'DE?',
        fragEn: 'EN?',
        optionen: [
          { text: 'X', richtig: true },
          { text: 'Y', richtig: false },
        ],
        erklaerungDe: 'DE',
        erklaerungEn: 'EN',
      },
    ],
  };
}

test('ein vollständiges Modul ist gültig', () => {
  assert.deepStrictEqual(validateVerkehrsmodul(gueltigesModul()), { valid: true, errors: [] });
});

test('fehlende einleitungDe wird gemeldet', () => {
  const modul = gueltigesModul();
  modul.einleitungDe = '';
  const result = validateVerkehrsmodul(modul);
  assert.strictEqual(result.valid, false);
  assert.match(result.errors.join(','), /einleitungDe fehlt/);
});

test('weniger als zwei Aufgaben wird gemeldet', () => {
  const modul = gueltigesModul();
  modul.aufgaben = [modul.aufgaben[0]];
  const result = validateVerkehrsmodul(modul);
  assert.match(result.errors.join(','), /zu wenige Aufgaben/);
});

test('null richtige Optionen werden gemeldet', () => {
  const modul = gueltigesModul();
  modul.aufgaben[0].optionen = [
    { text: 'X', richtig: false },
    { text: 'Y', richtig: false },
  ];
  const result = validateVerkehrsmodul(modul);
  assert.match(result.errors.join(','), /0 statt genau einer richtigen Option/);
});

test('zwei richtige Optionen werden gemeldet', () => {
  const modul = gueltigesModul();
  modul.aufgaben[0].optionen = [
    { text: 'X', richtig: true },
    { text: 'Y', richtig: true },
  ];
  const result = validateVerkehrsmodul(modul);
  assert.match(result.errors.join(','), /2 statt genau einer richtigen Option/);
});

test('weniger als zwei Optionen wird gemeldet', () => {
  const modul = gueltigesModul();
  modul.aufgaben[0].optionen = [{ text: 'X', richtig: true }];
  const result = validateVerkehrsmodul(modul);
  assert.match(result.errors.join(','), /weniger als zwei Optionen/);
});

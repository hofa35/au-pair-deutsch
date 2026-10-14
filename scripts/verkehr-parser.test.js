const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { parseVerkehrsmodul } = require('./verkehr-parser.js');

const fixturePfad = path.join(__dirname, 'fixtures', 'test-verkehrsmodul.md');

test('parseVerkehrsmodul liest Frontmatter-Felder', () => {
  const modul = parseVerkehrsmodul(fixturePfad);
  assert.strictEqual(modul.id, 1);
  assert.strictEqual(modul.titel, 'Testmodul');
  assert.strictEqual(modul.themenbereich, 'Testbereich');
});

test('parseVerkehrsmodul liest Einleitung und Regel zweisprachig', () => {
  const modul = parseVerkehrsmodul(fixturePfad);
  assert.strictEqual(modul.einleitungDe, 'Das ist die deutsche Einleitung.');
  assert.strictEqual(modul.einleitungEn, 'This is the English introduction.');
  assert.strictEqual(modul.regelDe, 'Das ist die deutsche Regel.');
  assert.strictEqual(modul.regelEn, 'This is the English rule.');
});

test('parseVerkehrsmodul liest alle Aufgaben in Reihenfolge', () => {
  const modul = parseVerkehrsmodul(fixturePfad);
  assert.strictEqual(modul.aufgaben.length, 2);
  assert.strictEqual(modul.aufgaben[0].titel, 'Erste Aufgabe');
  assert.strictEqual(modul.aufgaben[1].titel, 'Zweite Aufgabe');
});

test('parseVerkehrsmodul liest Bild, Fragen und Erklärungen einer Aufgabe', () => {
  const modul = parseVerkehrsmodul(fixturePfad);
  const [erste] = modul.aufgaben;
  assert.strictEqual(erste.bild, 'test-bild-1.webp');
  assert.strictEqual(erste.fragDe, 'Was ist richtig?');
  assert.strictEqual(erste.fragEn, 'What is correct?');
  assert.strictEqual(erste.erklaerungDe, 'Weil das die Regel ist.');
  assert.strictEqual(erste.erklaerungEn, 'Because that is the rule.');
});

test('parseVerkehrsmodul markiert genau die richtige Option', () => {
  const modul = parseVerkehrsmodul(fixturePfad);
  const [erste] = modul.aufgaben;
  assert.deepStrictEqual(erste.optionen, [
    { text: 'Falsche Antwort A', richtig: false },
    { text: 'Richtige Antwort', richtig: true },
    { text: 'Falsche Antwort B', richtig: false },
  ]);
});

test('parseVerkehrsmodul wirft Fehler bei falschem typ', () => {
  const pfad = path.join(os.tmpdir(), 'falscher-typ.md');
  fs.writeFileSync(
    pfad,
    ['---', 'id: 9', 'titel: "X"', 'themenbereich: "Y"', 'typ: lektion', '---', ''].join('\n')
  );
  assert.throws(() => parseVerkehrsmodul(pfad), /erwartet Frontmatter "typ: verkehrsmodul"/);
  fs.rmSync(pfad);
});

test('parseVerkehrsmodul wirft Fehler bei malformed Optionen-Zeile', () => {
  assert.throws(() => {
    parseVerkehrsmodul(path.join(__dirname, 'fixtures', 'malformed-optionen.md'));
  }, /Malformed Optionen-Zeile/);
});

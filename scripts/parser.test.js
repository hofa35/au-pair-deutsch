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

test('parseLektion liest die neuen Abschnitte', () => {
  const lektion = parseLektion(path.join(__dirname, 'fixtures', 'test-lektion.md'));
  assert.strictEqual(lektion.loesung, 'Lösungstext hier.');
  assert.strictEqual(lektion.schreibuebung, 'Schreibaufgabe hier.');
  assert.strictEqual(lektion.beispielloesung, 'Beispieltext hier.');
});

test('Lösung und Beispiellösung werden nicht verwechselt', () => {
  const lektion = parseLektion(path.join(__dirname, 'fixtures', 'test-lektion.md'));
  assert.notStrictEqual(lektion.loesung, lektion.beispielloesung);
  assert.doesNotMatch(lektion.loesung, /Beispiel/);
});

test('parseLektion zerlegt Nachsprechen in einzelne Sätze', () => {
  const lektion = parseLektion(path.join(__dirname, 'fixtures', 'test-lektion.md'));
  assert.deepStrictEqual(lektion.nachsprechen, ['Erster Satz.', 'Zweiter Satz.']);
});

test('fehlende freiwillige Abschnitte ergeben leere Werte', () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const knapp = path.join(os.tmpdir(), 'knappe-lektion.md');
  fs.writeFileSync(
    knapp,
    [
      '---', 'id: 9', 'titel: "Knapp"', 'lernziel: "Z"', 'grammatikfokus: "G"', '---',
      '', '## Wortschatz', '', '| Deutsch | Englisch |', '|---|---|', '| Hallo | Hello |',
      '', '## Übung', '', 'Nur eine Übung.', '',
    ].join('\n')
  );
  const lektion = parseLektion(knapp);
  assert.deepStrictEqual(lektion.nachsprechen, []);
  assert.strictEqual(lektion.schreibuebung, '');
  assert.strictEqual(lektion.beispielloesung, '');
  fs.rmSync(knapp);
});

const { parseWiederholung, parseDokument } = require('./parser.js');

const wiederholungsPfad = path.join(__dirname, 'fixtures', 'test-wiederholung.md');

test('parseWiederholung liest Frontmatter und zweisprachige Einleitung', () => {
  const w = parseWiederholung(wiederholungsPfad);
  assert.strictEqual(w.art, 'wiederholung');
  assert.strictEqual(w.nr, 7);
  assert.strictEqual(w.titel, 'Testwiederholung');
  assert.strictEqual(w.umfasst, '1 bis 2');
  assert.strictEqual(w.einstiegDe, 'Deutsche Einleitung.');
  assert.strictEqual(w.einstiegEn, 'English introduction.');
  assert.strictEqual(w.rueckmeldung, 'Sag, was schwer war.');
});

test('parseWiederholung liest beliebig viele Aufgaben in Dateireihenfolge', () => {
  const w = parseWiederholung(wiederholungsPfad);
  assert.deepStrictEqual(
    w.aufgaben.map((a) => a.titel),
    ['Erste Testaufgabe', 'Zweite Testaufgabe', 'Freie Testaufgabe']
  );
  assert.strictEqual(w.aufgaben[0].text, 'Mach das Erste.');
  assert.strictEqual(w.aufgaben[0].loesung, 'Erste Lösung.');
});

test('die Lösung steckt nicht mehr im Aufgabentext', () => {
  const w = parseWiederholung(wiederholungsPfad);
  assert.doesNotMatch(w.aufgaben[0].text, /Lösung/);
});

test('Lösung und Beispiellösung werden unterschieden', () => {
  const w = parseWiederholung(wiederholungsPfad);
  assert.strictEqual(w.aufgaben[1].loesungArt, 'Lösung');
  assert.strictEqual(w.aufgaben[2].loesungArt, 'Beispiellösung');
  assert.strictEqual(w.aufgaben[2].loesung, 'So könnte es aussehen.');
});

test('parseDokument erkennt die Art an der Frontmatter, nicht am Dateinamen', () => {
  assert.strictEqual(parseDokument(wiederholungsPfad).art, 'wiederholung');
  assert.strictEqual(
    parseDokument(path.join(__dirname, 'fixtures', 'test-lektion.md')).art,
    'lektion'
  );
});

const { parseAbschluss } = require('./parser.js');

test('parseAbschluss liest Frontmatter und zweisprachige Gratulation', () => {
  const abschluss = parseAbschluss(path.join(__dirname, 'fixtures', 'test-abschluss.md'));
  assert.strictEqual(abschluss.art, 'abschluss');
  assert.strictEqual(abschluss.titel, 'Testabschluss');
  assert.match(abschluss.gratulationDe, /Erster deutscher Absatz/);
  assert.match(abschluss.gratulationDe, /Zweiter deutscher Absatz/);
  assert.strictEqual(abschluss.gratulationEn, 'First English paragraph.');
});

test('parseAbschluss liest Sprechtext und Bescheinigung', () => {
  const abschluss = parseAbschluss(path.join(__dirname, 'fixtures', 'test-abschluss.md'));
  assert.strictEqual(abschluss.gesprochen, 'Gesprochener Testsatz.');
  assert.strictEqual(abschluss.bescheinigungDe, 'Deutscher Hinweis.');
  assert.strictEqual(abschluss.bescheinigungEn, 'English note.');
});

test('parseDokument erkennt den Typ abschluss am Frontmatter', () => {
  const abschluss = parseDokument(path.join(__dirname, 'fixtures', 'test-abschluss.md'));
  assert.strictEqual(abschluss.art, 'abschluss');
  assert.strictEqual(abschluss.titel, 'Testabschluss');
});

test('der Abschluss liest Gratulation, Sprechtext und Hinweis', () => {
  const abschluss = parseDokument(path.join(__dirname, 'fixtures', 'test-abschluss.md'));
  assert.match(abschluss.gratulationDe, /Erster deutscher Absatz/);
  assert.match(abschluss.gratulationDe, /Zweiter deutscher Absatz/);
  assert.strictEqual(abschluss.gratulationEn, 'First English paragraph.');
  assert.strictEqual(abschluss.gesprochen, 'Gesprochener Testsatz.');
  assert.strictEqual(abschluss.bescheinigungDe, 'Deutscher Hinweis.');
  assert.strictEqual(abschluss.bescheinigungEn, 'English note.');
});

test('eine Datei ohne typ bleibt eine Lektion', () => {
  const lektion = parseDokument(path.join(__dirname, 'fixtures', 'test-lektion.md'));
  assert.strictEqual(lektion.art, 'lektion');
});

const { normalisiereZeilenenden } = require('./parser.js');
const fsTest = require('node:fs');
const osTest = require('node:os');

test('Windows-Zeilenenden werden vor dem Parsen vereinheitlicht', () => {
  assert.strictEqual(normalisiereZeilenenden('a\r\nb\r\n'), 'a\nb\n');
  assert.strictEqual(normalisiereZeilenenden('a\rb'), 'a\nb');
  assert.strictEqual(normalisiereZeilenenden('\uFEFF---\n'), '---\n');
});

test('eine Datei mit CRLF wird genauso gelesen wie mit LF', () => {
  // Git stellt auf Windows beim Auschecken auf CRLF um. Vorher scheiterte
  // schon die Frontmatter-Suche, und zwar nur auf Windows, nicht in der CI.
  const quelle = path.join(__dirname, 'fixtures', 'test-lektion.md');
  const mitCrlf = path.join(osTest.tmpdir(), 'test-lektion-crlf.md');
  fsTest.writeFileSync(mitCrlf, fsTest.readFileSync(quelle, 'utf8').replace(/\n/g, '\r\n'));
  try {
    assert.deepStrictEqual(parseLektion(mitCrlf), parseLektion(quelle));
  } finally {
    fsTest.rmSync(mitCrlf, { force: true });
  }
});

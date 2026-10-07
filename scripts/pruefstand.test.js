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

const { validateWiederholung, validateDokument } = require('./pruefstand.js');

function vollstaendigeWiederholung(ueberschreiben = {}) {
  return {
    art: 'wiederholung',
    nr: 1,
    titel: 'Wiederholung: Lektion 1 bis 4',
    umfasst: '1 bis 4',
    einstiegDe: 'Deutsch',
    einstiegEn: 'English',
    aufgaben: [
      { titel: 'A', text: 'T', loesung: 'L', loesungArt: 'Lösung' },
      { titel: 'B', text: 'T', loesung: 'L', loesungArt: 'Lösung' },
      { titel: 'C', text: 'T', loesung: 'L', loesungArt: 'Beispiellösung' },
    ],
    rueckmeldung: 'R',
    ...ueberschreiben,
  };
}

test('vollständige Wiederholung ist gültig', () => {
  const result = validateWiederholung(vollstaendigeWiederholung());
  assert.strictEqual(result.valid, true);
  assert.deepStrictEqual(result.errors, []);
});

test('die Wiederholung braucht beide Sprachen in der Einleitung', () => {
  const result = validateWiederholung(vollstaendigeWiederholung({ einstiegEn: '' }));
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes('einstiegEn fehlt'));
});

test('zu wenige Aufgaben werden beanstandet', () => {
  const knapp = vollstaendigeWiederholung();
  knapp.aufgaben = knapp.aufgaben.slice(0, 2);
  const result = validateWiederholung(knapp);
  assert.strictEqual(result.valid, false);
  assert.match(result.errors.join(' '), /zu wenige Aufgaben \(2/);
});

test('eine Aufgabe ohne Lösung wird mit ihrer Nummer gemeldet', () => {
  const ohne = vollstaendigeWiederholung();
  ohne.aufgaben[1].loesung = '';
  const result = validateWiederholung(ohne);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes('Aufgabe 2: loesung fehlt'));
});

test('die Wiederholung wird nicht an den Lektionsregeln gemessen', () => {
  // Kein Wortschatz, kein Dialog, kein Hörtext: auf dieser Seite richtig so.
  const result = validateDokument(vollstaendigeWiederholung());
  assert.strictEqual(result.valid, true);
});

test('validateDokument prüft Lektionen weiterhin als Lektionen', () => {
  const result = validateDokument({ ...vollstaendigeLektion(), art: 'lektion', wortschatz: [] });
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes('wortschatz ist leer'));
});

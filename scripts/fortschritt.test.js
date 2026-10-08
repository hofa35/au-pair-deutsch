// scripts/fortschritt.test.js
const test = require('node:test');
const assert = require('node:assert');
const {
  SPEICHER_SCHLUESSEL,
  liesFortschritt,
  merkeStation,
  zaehleBesucht,
  textFuerStand,
} = require('./fortschritt.js');

/** Ein Ersatz für localStorage, damit die Tests ohne Browser laufen. */
function speicherAttrappe(start = {}) {
  const daten = { ...start };
  return {
    getItem: (k) => (k in daten ? daten[k] : null),
    setItem: (k, v) => {
      daten[k] = String(v);
    },
    removeItem: (k) => {
      delete daten[k];
    },
    daten,
  };
}

test('ein leerer Speicher liefert einen leeren Stand', () => {
  assert.deepStrictEqual(liesFortschritt(speicherAttrappe()), { besucht: [] });
});

test('eine besuchte Station wird gemerkt', () => {
  const speicher = speicherAttrappe();
  merkeStation(speicher, 'lektion-1');
  assert.deepStrictEqual(liesFortschritt(speicher), { besucht: ['lektion-1'] });
});

test('dieselbe Station zweimal bleibt ein Eintrag', () => {
  const speicher = speicherAttrappe();
  merkeStation(speicher, 'lektion-1');
  merkeStation(speicher, 'lektion-1');
  assert.deepStrictEqual(liesFortschritt(speicher).besucht, ['lektion-1']);
});

test('kaputter Inhalt im Speicher gilt als leerer Stand', () => {
  const speicher = speicherAttrappe({ [SPEICHER_SCHLUESSEL]: 'kein JSON' });
  assert.deepStrictEqual(liesFortschritt(speicher), { besucht: [] });
});

test('ein Speicher mit fremdem Inhalt gilt als leerer Stand', () => {
  const speicher = speicherAttrappe({ [SPEICHER_SCHLUESSEL]: '{"etwas":"anderes"}' });
  assert.deepStrictEqual(liesFortschritt(speicher), { besucht: [] });
});

test('ein Speicher, der beim Schreiben wirft, bricht nichts ab', () => {
  const speicher = speicherAttrappe();
  speicher.setItem = () => {
    throw new Error('Speicher voll');
  };
  assert.doesNotThrow(() => merkeStation(speicher, 'lektion-1'));
});

test('gezählt werden nur Stationen, die es wirklich gibt', () => {
  const stand = { besucht: ['lektion-1', 'lektion-99', 'wiederholung-1'] };
  assert.strictEqual(zaehleBesucht(stand, ['lektion-1', 'lektion-2', 'wiederholung-1']), 2);
});

test('ohne gemerkten Stand gibt es keinen Vorwurf, sondern eine Erklärung', () => {
  assert.match(textFuerStand(0, 19), /kein Problem/);
});

test('ein Teilstand nennt beide Zahlen', () => {
  assert.match(textFuerStand(7, 19), /7 von 19/);
});

test('ein vollständiger Stand sagt das ausdrücklich', () => {
  assert.match(textFuerStand(19, 19), /allen 19 Stationen/);
});

test('ohne bekannte Stationen bleibt der Text leer', () => {
  assert.strictEqual(textFuerStand(0, 0), '');
});

const test = require('node:test');
const assert = require('node:assert');
const {
  schluesselLektion,
  schluesselWdh,
  baueStationen,
  letzteWiederholungVor,
} = require('./stationen.js');

const uebersicht = [
  { nr: 1, titel: 'Ankommen' },
  { nr: 2, titel: 'Gastfamilie' },
  { nr: 3, titel: 'Zimmer' },
  { nr: 4, titel: 'Tagesablauf' },
  { nr: 5, titel: 'Uhrzeit' },
];
const plan = [
  { nr: 1, nach: 2, umfasst: '1 bis 2', titel: 'Wiederholung: Lektion 1 bis 2' },
  { nr: 2, nach: 4, umfasst: '3 bis 4', titel: 'Wiederholung: Lektion 3 bis 4' },
];

test('die Wiederholung liegt im Weg, nicht daneben', () => {
  const stationen = baueStationen(uebersicht, plan);
  assert.deepStrictEqual(
    stationen.map((s) => s.schluessel),
    [
      'lektion-1',
      'lektion-2',
      'wiederholung-1',
      'lektion-3',
      'lektion-4',
      'wiederholung-2',
      'lektion-5',
    ]
  );
});

test('nur Wiederholungen tragen eine Marke', () => {
  const stationen = baueStationen(uebersicht, plan);
  assert.strictEqual(stationen[1].marke, undefined);
  assert.strictEqual(stationen[2].marke, 'Wiederholung 1');
});

test('ohne Plan bleibt die Kette die reine Lektionsfolge', () => {
  const stationen = baueStationen(uebersicht, []);
  assert.strictEqual(stationen.length, uebersicht.length);
  assert.ok(stationen.every((s) => s.marke === undefined));
});

test('ein Plan nach einer unbekannten Lektion wird gemeldet und übersprungen', () => {
  const meldungen = [];
  const stationen = baueStationen(
    uebersicht,
    [{ nr: 9, nach: 99, umfasst: '98 bis 99', titel: 'Nirgendwo' }],
    (text) => meldungen.push(text)
  );
  assert.strictEqual(stationen.length, uebersicht.length);
  assert.strictEqual(meldungen.length, 1);
  assert.match(meldungen[0], /Lektion 99/);
});

test('Lektionen und Wiederholungen mit gleicher Nummer kollidieren nicht', () => {
  assert.notStrictEqual(schluesselLektion(2), schluesselWdh(2));
});

const gebaut = new Map([
  ['lektion-1', { titel: 'Ankommen', dateiname: 'lektion-01.html' }],
  ['lektion-2', { titel: 'Gastfamilie', dateiname: 'lektion-02.html' }],
  ['wiederholung-1', { titel: 'Wiederholung: Lektion 1 bis 2', dateiname: 'wiederholung-01.html' }],
  ['lektion-3', { titel: 'Zimmer', dateiname: 'lektion-03.html' }],
]);

test('die Lektion nach einer Wiederholung bekommt den Zweitverweis', () => {
  const stationen = baueStationen(uebersicht, plan);
  assert.deepStrictEqual(letzteWiederholungVor('lektion-3', stationen, gebaut), {
    dateiname: 'wiederholung-01.html',
    beschriftung: 'Wiederholung: Lektion 1 bis 2',
  });
});

test('vor der ersten Wiederholung gibt es keinen Zweitverweis', () => {
  const stationen = baueStationen(uebersicht, plan);
  assert.strictEqual(letzteWiederholungVor('lektion-2', stationen, gebaut), null);
});

test('eine geplante, aber ungebaute Wiederholung wird nicht verlinkt', () => {
  const stationen = baueStationen(uebersicht, plan);
  // Wiederholung 2 steht im Plan, ist aber nicht in gebaut: der Verweis von
  // Lektion 5 muss auf die davor liegende Wiederholung 1 zurückfallen.
  assert.strictEqual(
    letzteWiederholungVor('lektion-5', stationen, gebaut).dateiname,
    'wiederholung-01.html'
  );
});

test('auf der Wiederholungsseite selbst wird nichts zurückverwiesen', () => {
  const stationen = baueStationen(uebersicht, plan);
  assert.strictEqual(letzteWiederholungVor('wiederholung-1', stationen, gebaut), null);
});

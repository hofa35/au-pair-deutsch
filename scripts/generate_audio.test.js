// scripts/generate_audio.test.js
const test = require('node:test');
const assert = require('node:assert');
const { buildSpeechRequest } = require('./generate_audio.js');

test('buildSpeechRequest baut die erwartete Anfrage', () => {
  const request = buildSpeechRequest('Hallo, ich heiße Mira.');
  assert.deepStrictEqual(request, {
    input: { text: 'Hallo, ich heiße Mira.' },
    voice: { languageCode: 'de-DE', name: 'de-DE-Neural2-F' },
    audioConfig: { audioEncoding: 'MP3' },
  });
});

const path = require('node:path');
const { brauchtAudio, auftraegeFuer } = require('./generate_audio.js');
const { parseDokument } = require('./parser.js');

test('Lektionen bekommen Audio, Wiederholungen nicht', () => {
  const lektion = parseDokument(path.join(__dirname, 'fixtures', 'test-lektion.md'));
  const wiederholung = parseDokument(path.join(__dirname, 'fixtures', 'test-wiederholung.md'));
  assert.strictEqual(brauchtAudio(lektion), true);
  assert.strictEqual(brauchtAudio(wiederholung), false);
});

test('eine Lektion bekommt Hörübung und einen Auftrag je Nachsprech-Satz', () => {
  const ergebnis = auftraegeFuer({
    art: 'lektion',
    id: 3,
    hoertext: 'Hörtext',
    nachsprechen: ['Satz eins', 'Satz zwei'],
  });
  assert.strictEqual(ergebnis.ordner, '3');
  assert.deepStrictEqual(ergebnis.auftraege, [
    { name: 'hoeruebung.mp3', text: 'Hörtext' },
    { name: 'nachsprechen-1.mp3', text: 'Satz eins' },
    { name: 'nachsprechen-2.mp3', text: 'Satz zwei' },
  ]);
});

test('der Abschluss bekommt genau eine Datei aus dem Sprechtext', () => {
  const ergebnis = auftraegeFuer({ art: 'abschluss', gesprochen: 'Du hast es geschafft.' });
  assert.strictEqual(ergebnis.ordner, 'abschluss');
  assert.deepStrictEqual(ergebnis.auftraege, [
    { name: 'gratulation.mp3', text: 'Du hast es geschafft.' },
  ]);
});

test('eine Wiederholung bekommt kein Audio', () => {
  const ergebnis = auftraegeFuer({ art: 'wiederholung', nr: 1 });
  assert.strictEqual(ergebnis.ordner, null);
  assert.deepStrictEqual(ergebnis.auftraege, []);
  assert.strictEqual(brauchtAudio({ art: 'wiederholung', nr: 1 }), false);
});

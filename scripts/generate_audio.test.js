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
const { brauchtAudio } = require('./generate_audio.js');
const { parseDokument } = require('./parser.js');

test('Lektionen bekommen Audio, Wiederholungen nicht', () => {
  const lektion = parseDokument(path.join(__dirname, 'fixtures', 'test-lektion.md'));
  const wiederholung = parseDokument(path.join(__dirname, 'fixtures', 'test-wiederholung.md'));
  assert.strictEqual(brauchtAudio(lektion), true);
  assert.strictEqual(brauchtAudio(wiederholung), false);
});

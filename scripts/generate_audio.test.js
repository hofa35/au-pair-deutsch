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

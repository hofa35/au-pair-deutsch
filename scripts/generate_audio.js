// scripts/generate_audio.js
const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');
const { parseLektion } = require('./parser.js');

function buildSpeechRequest(text) {
  return {
    input: { text },
    voice: { languageCode: 'de-DE', name: 'de-DE-Neural2-F' },
    audioConfig: { audioEncoding: 'MP3' },
  };
}

function rufeTtsApiAuf(text, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(buildSpeechRequest(text));
    const options = {
      hostname: 'texttospeech.googleapis.com',
      path: `/v1/text:synthesize?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`TTS-API Fehler: ${res.statusCode} ${data}`));
        resolve(JSON.parse(data).audioContent);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) throw new Error('Umgebungsvariable GOOGLE_TTS_API_KEY ist nicht gesetzt');

  const lektion = parseLektion(path.join(__dirname, '..', 'lektionen', '01-ankommen.md'));
  const audioBase64 = await rufeTtsApiAuf(lektion.hoertext, apiKey);

  const zielOrdner = path.join(__dirname, '..', 'audio', String(lektion.id));
  fs.mkdirSync(zielOrdner, { recursive: true });
  fs.writeFileSync(path.join(zielOrdner, 'hoeruebung.mp3'), Buffer.from(audioBase64, 'base64'));
  console.log(`Audio geschrieben: audio/${lektion.id}/hoeruebung.mp3`);
}

if (require.main === module) main().catch((err) => { console.error(err); process.exit(1); });

module.exports = { buildSpeechRequest };

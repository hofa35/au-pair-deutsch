// scripts/generate_audio.js
//
// Erzeugt die Hörübungen über Google Cloud Text-to-Speech.
//
//   node scripts/generate_audio.js          # nur fehlende Audios
//   node scripts/generate_audio.js --neu    # alle neu erzeugen
//
// Der Schlüssel steht in GOOGLE_TTS_API_KEY (lokal in .env, nicht versioniert).
const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');
const { parseDokument } = require('./parser.js');

function buildSpeechRequest(text) {
  return {
    input: { text },
    voice: { languageCode: 'de-DE', name: 'de-DE-Neural2-F' },
    audioConfig: { audioEncoding: 'MP3' },
  };
}

/**
 * Welche Audiodateien gehören zu diesem Dokument, und in welchen Ordner?
 *
 * Wiederholungsseiten haben bewusst kein Audio: dort wird geschrieben und
 * erkannt, gehört wird in den Lektionen. Der Abschluss hat genau eine Datei,
 * Miras Gratulation.
 */
function auftraegeFuer(dokument) {
  if (dokument.art === 'abschluss') {
    return { ordner: 'abschluss', auftraege: [{ name: 'gratulation.mp3', text: dokument.gesprochen }] };
  }
  if (dokument.art !== 'lektion') {
    return { ordner: null, auftraege: [] };
  }
  const auftraege = [{ name: 'hoeruebung.mp3', text: dokument.hoertext }];
  dokument.nachsprechen.forEach((satz, i) => {
    auftraege.push({ name: `nachsprechen-${i + 1}.mp3`, text: satz });
  });
  return { ordner: String(dokument.id), auftraege };
}

function brauchtAudio(dokument) {
  return auftraegeFuer(dokument).auftraege.length > 0;
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

  const alleNeu = process.argv.includes('--neu');
  const lektionenDir = path.join(__dirname, '..', 'lektionen');
  const dateien = fs.readdirSync(lektionenDir).filter((f) => f.endsWith('.md')).sort();

  for (const datei of dateien) {
    const dokument = parseDokument(path.join(lektionenDir, datei));
    const { ordner, auftraege } = auftraegeFuer(dokument);
    if (!ordner) continue;
    const zielOrdner = path.join(__dirname, '..', 'audio', ordner);

    for (const auftrag of auftraege) {
      const ziel = path.join(zielOrdner, auftrag.name);
      if (fs.existsSync(ziel) && !alleNeu) {
        console.log(`${ordner}: ${auftrag.name} existiert bereits, übersprungen`);
        continue;
      }
      const audioBase64 = await rufeTtsApiAuf(auftrag.text, apiKey);
      fs.mkdirSync(zielOrdner, { recursive: true });
      fs.writeFileSync(ziel, Buffer.from(audioBase64, 'base64'));
      console.log(`${ordner}: ${auftrag.name} geschrieben`);
    }

    // Dateien aufräumen, die zu gelöschten Nachsprech-Sätzen gehören.
    // Nur bei Lektionen: nur dort hängt die Dateizahl am Inhalt.
    if (dokument.art === 'lektion' && fs.existsSync(zielOrdner)) {
      const erlaubt = new Set(auftraege.map((a) => a.name));
      for (const vorhanden of fs.readdirSync(zielOrdner)) {
        if (vorhanden.startsWith('nachsprechen-') && !erlaubt.has(vorhanden)) {
          fs.rmSync(path.join(zielOrdner, vorhanden));
          console.log(`${ordner}: ${vorhanden} entfernt, Satz gibt es nicht mehr`);
        }
      }
    }
  }
}

if (require.main === module) main().catch((err) => { console.error(err); process.exit(1); });

module.exports = { buildSpeechRequest, brauchtAudio, auftraegeFuer };

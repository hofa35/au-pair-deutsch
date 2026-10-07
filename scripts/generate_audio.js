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
 * Wiederholungsseiten haben bewusst kein Audio: dort wird geschrieben und
 * erkannt, gehört wird in den Lektionen. Ohne diese Weiche liefe der Aufruf
 * mit leerem Text gegen die API.
 */
function brauchtAudio(dokument) {
  return dokument.art === 'lektion';
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
    if (!brauchtAudio(dokument)) continue;
    const lektion = dokument;
    const zielOrdner = path.join(__dirname, '..', 'audio', String(lektion.id));

    // Hörübung plus je eine Datei pro Nachsprech-Satz, damit einzelne Sätze
    // beliebig oft wiederholt werden können.
    const auftraege = [{ name: 'hoeruebung.mp3', text: lektion.hoertext }];
    lektion.nachsprechen.forEach((satz, i) => {
      auftraege.push({ name: `nachsprechen-${i + 1}.mp3`, text: satz });
    });

    for (const auftrag of auftraege) {
      const ziel = path.join(zielOrdner, auftrag.name);
      if (fs.existsSync(ziel) && !alleNeu) {
        console.log(`Lektion ${lektion.id}: ${auftrag.name} existiert bereits, übersprungen`);
        continue;
      }
      const audioBase64 = await rufeTtsApiAuf(auftrag.text, apiKey);
      fs.mkdirSync(zielOrdner, { recursive: true });
      fs.writeFileSync(ziel, Buffer.from(audioBase64, 'base64'));
      console.log(`Lektion ${lektion.id}: ${auftrag.name} geschrieben`);
    }

    // Dateien aufräumen, die zu gelöschten Nachsprech-Sätzen gehören.
    if (fs.existsSync(zielOrdner)) {
      const erlaubt = new Set(auftraege.map((a) => a.name));
      for (const vorhanden of fs.readdirSync(zielOrdner)) {
        if (vorhanden.startsWith('nachsprechen-') && !erlaubt.has(vorhanden)) {
          fs.rmSync(path.join(zielOrdner, vorhanden));
          console.log(`Lektion ${lektion.id}: ${vorhanden} entfernt, Satz gibt es nicht mehr`);
        }
      }
    }
  }
}

if (require.main === module) main().catch((err) => { console.error(err); process.exit(1); });

module.exports = { buildSpeechRequest, brauchtAudio };

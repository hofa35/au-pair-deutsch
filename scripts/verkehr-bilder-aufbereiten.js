// scripts/verkehr-bilder-aufbereiten.js
//
// Verkleinert die KI-generierten Rohbilder aus verkehr/bildkarten-quelle/
// auf Web-Größe (720x480, WebP) und schreibt sie nach verkehr/bilder/.
//
// Anders als beim Sprachkurs gibt es hier keine Nummerierungs-Verwirrung:
// Rohbild und Zieldatei tragen von Anfang an denselben Namen, weil jedes
// Bild einzeln für genau eine Aufgabe erzeugt und so benannt wird.
//
//   node scripts/verkehr-bilder-aufbereiten.js
//
// Braucht ffmpeg im PATH. Läuft nicht im Build – verkehr/bilder/ ist
// eingecheckt, der Build kopiert die Dateien nur noch.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const WURZEL = path.join(__dirname, '..', 'verkehr');
const QUELLE = path.join(WURZEL, 'bildkarten-quelle');
const ZIEL = path.join(WURZEL, 'bilder');

const BREITE = 720;
const HOEHE = 480;

function ffmpeg(args) {
  return execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { maxBuffer: 1024 * 1024 * 256 });
}

function kb(datei) {
  return Math.round(fs.statSync(datei).size / 1024);
}

function main() {
  if (!fs.existsSync(QUELLE)) {
    throw new Error(`Quellordner fehlt: ${QUELLE}`);
  }
  fs.mkdirSync(ZIEL, { recursive: true });

  const dateien = fs.readdirSync(QUELLE).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  if (dateien.length === 0) {
    console.warn('Keine Rohbilder in verkehr/bildkarten-quelle/ gefunden.');
    return;
  }

  for (const name of dateien) {
    const quelle = path.join(QUELLE, name);
    const zielName = name.replace(/\.(png|jpe?g)$/i, '.webp');
    const ziel = path.join(ZIEL, zielName);
    ffmpeg([
      '-i', quelle,
      '-vf', `scale=${BREITE}:${HOEHE}:force_original_aspect_ratio=increase:flags=lanczos,crop=${BREITE}:${HOEHE}`,
      '-c:v', 'libwebp', '-lossless', '0', '-q:v', '82', '-compression_level', '6',
      '-frames:v', '1',
      ziel,
    ]);
    console.log(`${zielName}  ${kb(quelle)} kB -> ${kb(ziel)} kB`);
  }
  console.log('Fertig.');
}

main();

// scripts/bilder-aufbereiten.js
//
// Einmalige Bildaufbereitung. Liest die Rohbilder aus `bildkarten-quelle/`
// und schreibt web-taugliche Fassungen nach `bilder/`.
//
//   node scripts/bilder-aufbereiten.js
//
// Braucht ffmpeg im PATH. Läuft NICHT im Build und nicht in der CI –
// `bilder/` ist eingecheckt, der Build kopiert die Dateien nur noch.
//
// Zwei Schritte:
//   1. Szenenkarten (bild-01..15) verkleinern: 1920x1280 -> 720x480, WebP.
//   2. Mira (bild-16) freistellen: der Magenta-Hintergrund aus der
//      Bildgenerierung wird per Colorkey entfernt, danach wird auf die
//      Figur zugeschnitten und auf Anzeigegröße skaliert.

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const WURZEL = path.join(__dirname, '..');
const QUELLE = path.join(WURZEL, 'bildkarten-quelle');
const ZIEL = path.join(WURZEL, 'bilder');

// Hintergrundfarbe der Mira-Grafik, aus dem Rohbild ausgelesen.
const MAGENTA = '0xFE01F5';
const KEY_TOLERANZ = 0.30; // wie weit darf die Farbe abweichen
const KEY_WEICHE = 0.08; // weicher Übergang, damit die Kante nicht ausfranst

// Rohbild -> Lektionsnummer.
// Die Nummerierung der extrahierten Bilder entspricht NICHT der
// Lektionsreihenfolge. Maßgeblich ist der Banner-Text, der in jede
// Illustration eingebacken ist; danach wurde diese Tabelle aufgestellt.
// Abweichungen: 06 ist der Schulweg (L10), 07 ist Kochen (L6),
// 10 ist Einkaufen (L7), 11 ist Konflikte klären (L14),
// 12 ist das Gespräch im Kindergarten (L11), 14 ist der Rückblick (L15),
// 15 sind Notfälle (L12).
const ZUORDNUNG = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 10, 7: 6, 8: 8,
  9: 9, 10: 7, 11: 14, 12: 11, 13: 13, 14: 15, 15: 12,
};

/**
 * Retuschen: Stellen, die aus den Rohbildern verschwinden müssen, bevor die
 * Seite öffentlich ausgeliefert wird.
 *
 * Lektion 7 trug auf dem Ladenschild das Logo einer echten Supermarktkette.
 * Ein fremdes Markenzeichen auf einer offenen Lernseite ist weder nötig noch
 * sauber, also wird die Zeile mit der Schildfarbe überdeckt. Übrig bleibt
 * "SUPERMARKT", und das genügt für die Szene.
 *
 * Das Schild hängt schräg. Ein waagerechter Kasten würde oben die Buchstaben
 * anschneiden und unten in den Rahmen laufen, deshalb wird die Fläche aus
 * schmalen Streifen zusammengesetzt, die der Neigung folgen. Alle Angaben in
 * Kartenkoordinaten, also nach dem Verkleinern auf 720x480.
 */
const RETUSCHEN = {
  7: [
    {
      links: 511,
      rechts: 686,
      obenLinks: 68,
      obenRechts: 52,
      untenLinks: 100,
      untenRechts: 85,
      farbe: '0xF7F2E6', // aus dem Schild ausgelesen
      grund: 'Markenlogo einer echten Supermarktkette',
    },
  ],
};

const RETUSCHE_STREIFEN = 15; // schmaler heißt weniger Treppe an den Kanten

const KARTEN_BREITE = 720;
const KARTEN_HOEHE = 480;
const MIRA_BREITE = 640;
const ALPHA_SCHWELLE = 24; // ab hier gilt ein Pixel als "gehört zur Figur"

function ffmpeg(args) {
  return execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], {
    maxBuffer: 1024 * 1024 * 256,
  });
}

/**
 * Baut aus einer schrägen Fläche eine Kette waagerechter Kästen.
 *
 * Für die Oberkante zählt die linke Streifenkante, für die Unterkante die
 * rechte. So bleibt jeder Streifen vollständig innerhalb der Fläche, die
 * überdeckt werden darf, statt über ihren Rand hinauszulaufen.
 */
function retuscheFilter(flaeche) {
  const { links, rechts, obenLinks, obenRechts, untenLinks, untenRechts, farbe } = flaeche;
  const zwischen = (a, b, x) => a + ((b - a) * (x - links)) / (rechts - links);

  const teile = [];
  for (let x = links; x < rechts; x += RETUSCHE_STREIFEN) {
    const breite = Math.min(RETUSCHE_STREIFEN, rechts - x);
    const oben = Math.floor(zwischen(obenLinks, obenRechts, x));
    const unten = Math.floor(zwischen(untenLinks, untenRechts, x + breite));
    teile.push(`drawbox=x=${x}:y=${oben}:w=${breite}:h=${unten - oben}:color=${farbe}:t=fill`);
  }
  return teile.join(',');
}

function masse(datei) {
  const aus = execFileSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', datei],
    { encoding: 'utf8' }
  ).trim();
  const [breite, hoehe] = aus.split(',').map(Number);
  return { breite, hoehe };
}

function kb(datei) {
  return Math.round(fs.statSync(datei).size / 1024);
}

/** Szenenkarten verkleinern und als WebP ablegen. */
function karten() {
  for (const [rohNr, lektionsNr] of Object.entries(ZUORDNUNG)) {
    const name = `bild-${String(rohNr).padStart(2, '0')}.webp`;
    const quelle = path.join(QUELLE, name);
    if (!fs.existsSync(quelle)) {
      console.warn(`  übersprungen: ${name} fehlt`);
      continue;
    }
    const ziel = path.join(ZIEL, `lektion-${String(lektionsNr).padStart(2, '0')}.webp`);
    const retuschen = RETUSCHEN[lektionsNr] || [];
    const filter = [
      `scale=${KARTEN_BREITE}:${KARTEN_HOEHE}:flags=lanczos`,
      ...retuschen.map(retuscheFilter),
    ].join(',');
    ffmpeg([
      '-i', quelle,
      '-vf', filter,
      '-c:v', 'libwebp', '-lossless', '0', '-q:v', '76', '-compression_level', '6',
      '-frames:v', '1',
      ziel,
    ]);
    const nachtrag = retuschen.length
      ? `  (retuschiert: ${retuschen.map((r) => r.grund).join(', ')})`
      : '';
    console.log(`  ${path.basename(ziel)}  ${kb(quelle)} kB -> ${kb(ziel)} kB${nachtrag}`);
  }
}

/**
 * Sucht im freigestellten Bild das kleinste Rechteck, das noch sichtbare
 * Pixel enthält. ffmpeg liefert dafür die Rohdaten, gezählt wird hier.
 */
function figurRahmen(datei, breite, hoehe) {
  const roh = ffmpeg(['-i', datei, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-']);
  let links = breite;
  let rechts = -1;
  let oben = hoehe;
  let unten = -1;

  for (let y = 0; y < hoehe; y++) {
    const zeile = y * breite * 4;
    for (let x = 0; x < breite; x++) {
      if (roh[zeile + x * 4 + 3] < ALPHA_SCHWELLE) continue;
      if (x < links) links = x;
      if (x > rechts) rechts = x;
      if (y < oben) oben = y;
      if (y > unten) unten = y;
    }
  }

  if (rechts < 0) throw new Error('Freistellung ergab ein leeres Bild – Colorkey-Werte prüfen.');
  return { links, oben, breite: rechts - links + 1, hoehe: unten - oben + 1 };
}

/** Mira freistellen, zuschneiden, skalieren. */
function mira() {
  const quelle = path.join(QUELLE, 'bild-16.png');
  if (!fs.existsSync(quelle)) {
    console.warn('  übersprungen: bild-16.png fehlt');
    return;
  }

  const roh = masse(quelle);
  const zwischen = path.join(ZIEL, '.mira-freigestellt.png');

  ffmpeg([
    '-i', quelle,
    '-vf', `colorkey=${MAGENTA}:${KEY_TOLERANZ}:${KEY_WEICHE}`,
    '-frames:v', '1',
    zwischen,
  ]);

  const rahmen = figurRahmen(zwischen, roh.breite, roh.hoehe);
  console.log(`  Figur gefunden: ${rahmen.breite}x${rahmen.hoehe} bei ${rahmen.links},${rahmen.oben}`);

  const ziel = path.join(ZIEL, 'mira.webp');
  ffmpeg([
    '-i', zwischen,
    '-vf',
    `crop=${rahmen.breite}:${rahmen.hoehe}:${rahmen.links}:${rahmen.oben},` +
      `scale=${MIRA_BREITE}:-1:flags=lanczos`,
    '-c:v', 'libwebp', '-lossless', '0', '-q:v', '88', '-compression_level', '6',
    '-pix_fmt', 'yuva420p',
    '-frames:v', '1',
    ziel,
  ]);

  // Zusätzlich ein quadratischer Ausschnitt vom Kopf, für das kleine
  // Avatar in der Fußzeile. Der Ausschnitt bezieht sich auf die bereits
  // skalierte Fassung, deshalb hier noch einmal von mira.webp ausgehen.
  const skaliert = masse(ziel);
  const kante = Math.round(skaliert.breite * 0.62);
  const kopfZiel = path.join(ZIEL, 'mira-kopf.webp');
  ffmpeg([
    '-i', ziel,
    '-vf',
      `crop=${kante}:${kante}:${Math.round((skaliert.breite - kante) / 2 + skaliert.breite * 0.06)}:${Math.round(skaliert.hoehe * 0.028)},` +
      'scale=240:240:flags=lanczos',
    '-c:v', 'libwebp', '-lossless', '0', '-q:v', '88', '-compression_level', '6',
    '-pix_fmt', 'yuva420p',
    '-frames:v', '1',
    kopfZiel,
  ]);

  fs.rmSync(zwischen);
  console.log(`  mira.webp  ${kb(quelle)} kB -> ${kb(ziel)} kB`);
  console.log(`  mira-kopf.webp  ${kb(kopfZiel)} kB`);
}

function main() {
  if (!fs.existsSync(QUELLE)) {
    throw new Error(`Quellordner fehlt: ${QUELLE}`);
  }
  fs.mkdirSync(ZIEL, { recursive: true });

  console.log('Szenenkarten:');
  karten();
  console.log('Mira:');
  mira();
  console.log('Fertig.');
}

main();

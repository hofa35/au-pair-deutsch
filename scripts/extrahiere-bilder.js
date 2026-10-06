// Einmal-Skript: zieht die eingebetteten Bilder aus dem Mira-Artefakt im
// Downloads-Ordner und legt sie als eigene Dateien in bildkarten-quelle/ ab.
// Nicht Teil des Builds, nur Werkzeug für den einmaligen Umzug.
//
// Achtung: die Nummerierung der Ausgabedateien ist die Reihenfolge im
// Artefakt und entspricht NICHT der Lektionsreihenfolge – das Artefakt
// selbst hatte bei sechs Karten das falsche Bild hinterlegt. Die richtige
// Zuordnung steht in scripts/bilder-aufbereiten.js und wurde aus dem
// Banner-Text der Illustrationen abgeleitet.
const fs = require('node:fs');
const path = require('node:path');

const quelle = 'C:\\Users\\User\\Downloads\\Mira-Deutschkurs-Bildkarten.html';
const zielOrdner = path.join(__dirname, '..', 'bildkarten-quelle');
fs.mkdirSync(zielOrdner, { recursive: true });

const inhalt = fs.readFileSync(quelle, 'utf8');
const regex = /data:image\/(png|webp|jpeg);base64,([A-Za-z0-9+/=]+)/g;

let i = 0;
let match;
const bericht = [];
while ((match = regex.exec(inhalt)) !== null) {
  i += 1;
  const [, typ, base64] = match;
  const puffer = Buffer.from(base64, 'base64');
  const dateiname = `bild-${String(i).padStart(2, '0')}.${typ === 'jpeg' ? 'jpg' : typ}`;
  fs.writeFileSync(path.join(zielOrdner, dateiname), puffer);

  // etwas Kontext davor einsammeln, um das Bild später zuordnen zu können
  const start = Math.max(0, match.index - 200);
  const kontextRoh = inhalt.slice(start, match.index);
  const kontext = kontextRoh.replace(/\s+/g, ' ').slice(-150);

  bericht.push({ datei: dateiname, groesseKb: Math.round(puffer.length / 1024), kontextDavor: kontext });
}

fs.writeFileSync(path.join(zielOrdner, '_bericht.json'), JSON.stringify(bericht, null, 2));
console.log(`${i} Bilder extrahiert nach ${zielOrdner}`);
console.table(bericht.map((b) => ({ datei: b.datei, kb: b.groesseKb })));

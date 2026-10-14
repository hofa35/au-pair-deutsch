// scripts/verkehr-pruefstand.js
//
// Prüft die Modul-Dateien auf inhaltliche Vollständigkeit, bevor gebaut
// wird. Bild-Existenz ist bewusst keine harte Prüfung hier: ein fehlendes
// Bild ist unschön, aber nicht sicherheitsrelevant, anders als eine
// fehlende oder falsche Regelerklärung. verkehr-build.js warnt separat,
// wenn eine Bilddatei fehlt (gleiches Muster wie die fehlende Hörübung
// beim Sprachkurs).
const fs = require('node:fs');
const path = require('node:path');
const { parseVerkehrsmodul } = require('./verkehr-parser.js');

const MINDESTENS_AUFGABEN = 2;

function validateVerkehrsmodul(modul) {
  const errors = [];
  if (!modul.id) errors.push('id fehlt');
  if (!modul.titel) errors.push('titel fehlt');
  if (!modul.themenbereich) errors.push('themenbereich fehlt');
  if (!modul.einleitungDe) errors.push('einleitungDe fehlt');
  if (!modul.einleitungEn) errors.push('einleitungEn fehlt');
  if (!modul.regelDe) errors.push('regelDe fehlt');
  if (!modul.regelEn) errors.push('regelEn fehlt');

  const aufgaben = modul.aufgaben || [];
  if (aufgaben.length < MINDESTENS_AUFGABEN) {
    errors.push(`zu wenige Aufgaben (${aufgaben.length}, mindestens ${MINDESTENS_AUFGABEN})`);
  }

  aufgaben.forEach((aufgabe, i) => {
    const marke = `Aufgabe ${i + 1} (${aufgabe.titel || 'ohne Titel'})`;
    if (!aufgabe.titel) errors.push(`${marke}: titel fehlt`);
    if (!aufgabe.bild) errors.push(`${marke}: bild fehlt`);
    if (!aufgabe.fragDe) errors.push(`${marke}: fragDe fehlt`);
    if (!aufgabe.fragEn) errors.push(`${marke}: fragEn fehlt`);
    if (!aufgabe.erklaerungDe) errors.push(`${marke}: erklaerungDe fehlt`);
    if (!aufgabe.erklaerungEn) errors.push(`${marke}: erklaerungEn fehlt`);

    const optionen = aufgabe.optionen || [];
    if (optionen.length < 2) {
      errors.push(`${marke}: weniger als zwei Optionen`);
    }
    const anzahlRichtig = optionen.filter((o) => o.richtig).length;
    if (anzahlRichtig !== 1) {
      errors.push(`${marke}: ${anzahlRichtig} statt genau einer richtigen Option markiert`);
    }
  });

  return { valid: errors.length === 0, errors };
}

function main() {
  const modulDir = path.join(__dirname, '..', 'verkehr', 'module');
  if (!fs.existsSync(modulDir)) {
    console.log('Kein verkehr/module/ Ordner gefunden, nichts zu prüfen.');
    process.exit(0);
  }
  const dateien = fs.readdirSync(modulDir).filter((f) => f.endsWith('.md'));
  let hatFehler = false;
  for (const datei of dateien) {
    try {
      const modul = parseVerkehrsmodul(path.join(modulDir, datei));
      const result = validateVerkehrsmodul(modul);
      if (!result.valid) {
        hatFehler = true;
        console.error(`${datei}: ${result.errors.join(', ')}`);
      } else {
        console.log(`${datei}: OK`);
      }
    } catch (err) {
      hatFehler = true;
      console.error(`${datei}: Fehler beim Einlesen – ${err.message}`);
    }
  }
  process.exit(hatFehler ? 1 : 0);
}

if (require.main === module) main();

module.exports = { validateVerkehrsmodul };

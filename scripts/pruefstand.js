// scripts/pruefstand.js
const fs = require('node:fs');
const path = require('node:path');
const { parseLektion } = require('./parser.js');

function validateLektion(lektion) {
  const errors = [];
  if (!lektion.titel) errors.push('titel fehlt');
  if (!lektion.lernziel) errors.push('lernziel fehlt');
  if (!lektion.grammatikfokus) errors.push('grammatikfokus fehlt');
  if (!lektion.wortschatz || lektion.wortschatz.length === 0) errors.push('wortschatz ist leer');
  if (!lektion.dialog) errors.push('dialog fehlt');
  if (!lektion.grammatikDe) errors.push('grammatikDe fehlt');
  if (!lektion.grammatikEn) errors.push('grammatikEn fehlt');
  if (!lektion.uebung) errors.push('uebung fehlt');
  // Die Lösung steht in einem eigenen Abschnitt, weil sie auf der Seite
  // zugeklappt wird. Ohne sie gäbe es nichts zum Aufklappen.
  if (!lektion.loesung) errors.push('loesung fehlt');
  if (!lektion.hoertext) errors.push('hoertext fehlt');

  // Freiwillige Abschnitte: wenn vorhanden, dann aber vollständig.
  if (lektion.schreibuebung && !lektion.beispielloesung) {
    errors.push('schreibuebung ohne beispielloesung');
  }
  if (lektion.beispielloesung && !lektion.schreibuebung) {
    errors.push('beispielloesung ohne schreibuebung');
  }

  return { valid: errors.length === 0, errors };
}

function main() {
  const lektionenDir = path.join(__dirname, '..', 'lektionen');
  const dateien = fs.readdirSync(lektionenDir).filter((f) => f.endsWith('.md'));
  let hatFehler = false;
  for (const datei of dateien) {
    try {
      const lektion = parseLektion(path.join(lektionenDir, datei));
      const result = validateLektion(lektion);
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

module.exports = { validateLektion };

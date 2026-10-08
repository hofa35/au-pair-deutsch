// scripts/pruefstand.js
//
// Prüft die Inhaltsdateien auf Vollständigkeit, bevor gebaut wird. Lektionen
// und Wiederholungen haben verschiedene Pflichtteile, deshalb gibt es zwei
// Prüfungen und einen Verteiler, der nach "art" entscheidet.
const fs = require('node:fs');
const path = require('node:path');
const { parseDokument } = require('./parser.js');

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

// Unter drei Aufgaben lohnt die eigene Seite nicht – dann kann der Stoff
// genauso gut in die nächste Lektion. Die Zahl ist eine Setzung, sie hält
// nur die Untergrenze fest.
const MINDESTENS_AUFGABEN = 3;

// Eine gesprochene Gratulation, die länger wird, hört niemand zu Ende, und
// jede Sekunde Ton kostet bei der Erzeugung. Die Zahl ist eine Setzung, sie
// hält nur die Obergrenze fest.
const HOECHSTLAENGE_GESPROCHEN = 500;

function validateWiederholung(wiederholung) {
  const errors = [];
  if (!wiederholung.nr) errors.push('nr fehlt');
  if (!wiederholung.titel) errors.push('titel fehlt');
  if (!wiederholung.umfasst) errors.push('umfasst fehlt');
  // Die Einleitung sagt, was auf der Seite passiert. Zweisprachig, weil
  // sonst genau die Lernende aussteigt, die die Wiederholung braucht.
  if (!wiederholung.einstiegDe) errors.push('einstiegDe fehlt');
  if (!wiederholung.einstiegEn) errors.push('einstiegEn fehlt');

  const aufgaben = wiederholung.aufgaben || [];
  if (aufgaben.length < MINDESTENS_AUFGABEN) {
    errors.push(`zu wenige Aufgaben (${aufgaben.length}, mindestens ${MINDESTENS_AUFGABEN})`);
  }
  aufgaben.forEach((aufgabe, i) => {
    const marke = `Aufgabe ${i + 1}`;
    if (!aufgabe.titel) errors.push(`${marke}: titel fehlt`);
    if (!aufgabe.text) errors.push(`${marke}: aufgabentext fehlt`);
    // Ohne Lösung kann niemand allein lernen: es gibt hier keine Lehrkraft,
    // die hinterher drübergeht.
    if (!aufgabe.loesung) errors.push(`${marke}: loesung fehlt`);
  });

  return { valid: errors.length === 0, errors };
}

function validateAbschluss(abschluss) {
  const errors = [];
  if (!abschluss.titel) errors.push('titel fehlt');
  if (!abschluss.gratulationDe) errors.push('gratulationDe fehlt');
  if (!abschluss.gratulationEn) errors.push('gratulationEn fehlt');
  if (!abschluss.gesprochen) errors.push('gesprochen fehlt');
  // Der Hinweis auf der Urkunde ist Pflicht, und zwar in beiden Sprachen:
  // wer die Bescheinigung vorgelegt bekommt, muss lesen können, was sie ist
  // und was sie nicht ist.
  if (!abschluss.bescheinigungDe) errors.push('bescheinigungDe fehlt');
  if (!abschluss.bescheinigungEn) errors.push('bescheinigungEn fehlt');

  if (abschluss.gesprochen && abschluss.gesprochen.length > HOECHSTLAENGE_GESPROCHEN) {
    errors.push(
      `gesprochen ist zu lang (${abschluss.gesprochen.length} Zeichen, höchstens ${HOECHSTLAENGE_GESPROCHEN})`
    );
  }

  return { valid: errors.length === 0, errors };
}

function validateDokument(dokument) {
  if (dokument.art === 'wiederholung') return validateWiederholung(dokument);
  if (dokument.art === 'abschluss') return validateAbschluss(dokument);
  return validateLektion(dokument);
}

function main() {
  const lektionenDir = path.join(__dirname, '..', 'lektionen');
  const dateien = fs.readdirSync(lektionenDir).filter((f) => f.endsWith('.md'));
  let hatFehler = false;
  for (const datei of dateien) {
    try {
      const dokument = parseDokument(path.join(lektionenDir, datei));
      const result = validateDokument(dokument);
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

module.exports = { validateLektion, validateWiederholung, validateAbschluss, validateDokument };

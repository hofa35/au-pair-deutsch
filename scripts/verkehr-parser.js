// scripts/verkehr-parser.js
//
// Liest die Modul-Dateien aus verkehr/module/. Anders als beim Sprachkurs
// gibt es nur eine Art von Dokument (Verkehrsmodul), und Module sind
// unabhängig voneinander – keine Kette, keine Querverweise.
//
// Wiederverwendet werden zwei reine Textfunktionen aus scripts/parser.js:
// parseFrontmatter (inkl. CRLF-Normalisierung) und parseAbschnitte
// (zerlegt den Rumpf in "## "-Abschnitte). Beide sind generisch und
// kettenunabhängig; sie hier zu duplizieren wäre unnötige Dopplung und ein
// Risiko, den dort schon gefundenen Windows-Zeilenende-Fehler erneut
// einzubauen.
const fs = require('node:fs');
const { parseFrontmatter, parseAbschnitte } = require('./parser.js');

const AUFGABE_MUSTER = /^Aufgabe\s*[:·\-–]?\s*(.*)$/;

/**
 * Zerlegt den Inhalt einer Aufgabe in seine "### "-Unterabschnitte
 * (Bild, Frage Deutsch, Frage Englisch, Optionen, Erklärung Deutsch,
 * Erklärung Englisch). Eine Ebene tiefer als parseAbschnitte(), das nur
 * "## " kennt – deshalb eine eigene, kleine Funktion statt parseAbschnitte
 * zu verbiegen.
 */
function parseUnterabschnitte(inhalt) {
  const roh = [];
  const regex = /^### (.+)$/gm;
  let match;
  while ((match = regex.exec(inhalt)) !== null) {
    roh.push({ titel: match[1].trim(), von: regex.lastIndex, bis: inhalt.length });
    if (roh.length > 1) roh[roh.length - 2].bis = match.index;
  }
  return roh.map(({ titel, von, bis }) => ({ titel, inhalt: inhalt.slice(von, bis).trim() }));
}

/**
 * Liest die Optionen-Liste einer Aufgabe. Jede Zeile ist eine
 * Markdown-Checkliste ("- [ ] Text" oder "- [x] Text"); "x" markiert die
 * richtige Option. Ob am Ende genau eine Option als richtig markiert ist,
 * prüft nicht der Parser, sondern der Prüfstand (scripts/verkehr-pruefstand.js)
 * – der Parser meldet nur echte Strukturfehler.
 */
function parseOptionen(text) {
  return text
    .split('\n')
    .map((zeile) => zeile.trim())
    .filter((zeile) => zeile.startsWith('-'))
    .map((zeile) => {
      const match = zeile.match(/^-\s*\[([ xX])\]\s*(.+)$/);
      if (!match) throw new Error(`Malformed Optionen-Zeile: "${zeile}"`);
      return { text: match[2].trim(), richtig: match[1].toLowerCase() === 'x' };
    });
}

function parseAufgabe(titelRoh, inhalt) {
  const treffer = titelRoh.match(AUFGABE_MUSTER);
  const titel = treffer ? treffer[1].trim() : titelRoh.trim();
  const unter = new Map(parseUnterabschnitte(inhalt).map((u) => [u.titel, u.inhalt]));

  return {
    titel,
    bild: (unter.get('Bild') || '').trim(),
    fragDe: unter.get('Frage Deutsch') || '',
    fragEn: unter.get('Frage Englisch') || '',
    optionen: parseOptionen(unter.get('Optionen') || ''),
    erklaerungDe: unter.get('Erklärung Deutsch') || '',
    erklaerungEn: unter.get('Erklärung Englisch') || '',
  };
}

function parseVerkehrsmodul(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);
  if (frontmatter.typ !== 'verkehrsmodul') {
    throw new Error(
      `${filePath}: erwartet Frontmatter "typ: verkehrsmodul", gefunden "${frontmatter.typ || '(fehlt)'}"`
    );
  }

  const sektionen = new Map();
  const aufgaben = [];
  for (const { titel, inhalt } of parseAbschnitte(body)) {
    if (AUFGABE_MUSTER.test(titel)) {
      aufgaben.push(parseAufgabe(titel, inhalt));
    } else {
      sektionen.set(titel, inhalt);
    }
  }

  return {
    id: frontmatter.id,
    titel: frontmatter.titel,
    themenbereich: frontmatter.themenbereich,
    einleitungDe: sektionen.get('Einleitung Deutsch') || '',
    einleitungEn: sektionen.get('Einleitung Englisch') || '',
    regelDe: sektionen.get('Regel Deutsch') || '',
    regelEn: sektionen.get('Regel Englisch') || '',
    aufgaben,
  };
}

module.exports = { parseVerkehrsmodul };

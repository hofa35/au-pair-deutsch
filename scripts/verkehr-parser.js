// scripts/verkehr-parser.js
//
// Liest die Modul-Dateien aus verkehr/module/. Anders als beim Sprachkurs
// gibt es nur eine Art von Dokument (Verkehrsmodul), und Module sind
// unabhängig voneinander – keine Kette, keine Querverweise.
//
// Wiederverwendet werden zwei reine Textfunktionen aus scripts/parser.js:
// parseAbschnitte (zerlegt den Rumpf in "## "-Abschnitte) und
// normalisiereZeilenenden (CRLF/BOM-Behandlung). Beide sind bereits
// exportiert, generisch und kettenunabhängig. Nur die Frontmatter-Parsing-
// *Struktur* selbst (die "---"/Schlüssel-Wert-Auswertung, die parser.js
// nicht eigenständig exportiert) ist lokal kopiert (siehe parseFrontmatter
// unten), damit scripts/parser.js als Teil des fertigen, getesteten
// Sprachkurses nicht verändert werden muss.
const fs = require('node:fs');
const { parseAbschnitte, normalisiereZeilenenden } = require('./parser.js');

const AUFGABE_MUSTER = /^Aufgabe\s*[:·\-–]?\s*(.*)$/;

/**
 * Liest Frontmatter und Rumpf einer Modul-Datei.
 *
 * Eigene, kleine Kopie der gleichnamigen Funktion aus scripts/parser.js,
 * bewusst nicht von dort importiert: scripts/parser.js ist Teil des
 * fertigen, getesteten Sprachkurses und wird für dieses Projekt nicht
 * verändert, auch nicht um einen zusätzlichen Export zu ergänzen. Die
 * CRLF-Normalisierung selbst übernimmt aber die bereits exportierte
 * normalisiereZeilenenden() aus parser.js – nur die "---"/Schlüssel-Wert-
 * Struktur rundherum ist lokal kopiert.
 */
function parseFrontmatter(rohtext) {
  const raw = normalisiereZeilenenden(rohtext);
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Keine Frontmatter gefunden');
  const [, frontmatterRaw, body] = match;
  const frontmatter = {};
  for (const line of frontmatterRaw.split('\n')) {
    const lineMatch = line.match(/^(\w+):\s*(.*)$/);
    if (!lineMatch) continue;
    const [, key, rawValue] = lineMatch;
    let value = rawValue.trim();
    value = value.replace(/^"(.*)"$/, '$1');
    frontmatter[key] = /^\d+$/.test(value) ? Number(value) : value;
  }
  return { frontmatter, body };
}

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

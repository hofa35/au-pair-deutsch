// scripts/parser.js
//
// Liest die Inhaltsdateien aus lektionen/. Es gibt zwei Arten:
//
//   Lektion        – der Regelfall, feste Abschnitte (Wortschatz, Dialog, ...)
//   Wiederholung   – Zwischenstation nach mehreren Lektionen, frei viele
//                    Aufgaben, kein Wortschatz, kein Audio
//
// Unterschieden wird über das Frontmatter-Feld "typ". Fehlt es, ist die
// Datei eine Lektion – so bleiben alle bisherigen Dateien unverändert gültig.
const fs = require('node:fs');

function parseFrontmatter(raw) {
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

function getSection(body, heading) {
  const pattern = new RegExp(`## ${heading}\\n([\\s\\S]*?)(\\n## |$)`);
  const match = body.match(pattern);
  return match ? match[1].trim() : '';
}

function parseWortschatz(body) {
  const section = getSection(body, 'Wortschatz');
  const rows = section.split('\n').filter((line) => line.startsWith('|') && !line.includes('---'));
  return rows.slice(1).map((row) => {
    const [, de, en] = row.split('|').map((cell) => cell.trim());
    if (!de || !en) {
      throw new Error(`Malformed wortschatz row: "${row.slice(0, 60)}" (missing de or en value)`);
    }
    return { de, en };
  });
}

/**
 * Zerlegt den Abschnitt "Nachsprechen" in einzelne Sätze, einen pro Zeile.
 * Jeder Satz bekommt später eine eigene Audiodatei, damit man ihn einzeln
 * wiederholen kann.
 */
function parseNachsprechen(body) {
  const section = getSection(body, 'Nachsprechen');
  if (!section) return [];
  return section
    .split('\n')
    .map((zeile) => zeile.trim())
    .filter((zeile) => zeile !== '');
}

/**
 * Zerlegt einen Rumpf in seine "## "-Abschnitte, in der Reihenfolge der Datei.
 *
 * getSection() sucht gezielt nach einem bekannten Namen. Wiederholungsseiten
 * haben dagegen beliebig viele gleichartige Abschnitte ("Aufgabe: ..."),
 * deshalb braucht es hier den vollständigen Durchlauf.
 *
 * @returns {Array<{titel: string, inhalt: string}>}
 */
function parseAbschnitte(body) {
  const roh = [];
  const regex = /^## (.+)$/gm;
  let match;
  while ((match = regex.exec(body)) !== null) {
    roh.push({ titel: match[1].trim(), von: regex.lastIndex, bis: body.length });
    if (roh.length > 1) roh[roh.length - 2].bis = match.index;
  }
  return roh.map(({ titel, von, bis }) => ({ titel, inhalt: body.slice(von, bis).trim() }));
}

/**
 * Trennt bei einer Aufgabe den Aufgabentext von der Lösung.
 *
 * Die Lösung steht in einer Unterüberschrift, weil sie auf der Seite
 * zugeklappt wird. "Beispiellösung" ist die Variante für freie Aufgaben,
 * bei denen es keine einzig richtige Antwort gibt.
 */
function trenneLoesung(inhalt) {
  const match = inhalt.match(/\n### (Lösung|Beispiellösung)\s*\n([\s\S]*)$/);
  if (!match) return { text: inhalt.trim(), loesung: '', loesungArt: '' };
  return {
    text: inhalt.slice(0, match.index).trim(),
    loesung: match[2].trim(),
    loesungArt: match[1],
  };
}

const AUFGABE_MUSTER = /^Aufgabe\s*[:·\-–]?\s*(.*)$/;

function parseLektionAus(frontmatter, body) {
  return {
    art: 'lektion',
    id: frontmatter.id,
    titel: frontmatter.titel,
    lernziel: frontmatter.lernziel,
    grammatikfokus: frontmatter.grammatikfokus,
    wortschatz: parseWortschatz(body),
    dialog: getSection(body, 'Dialog'),
    grammatikDe: getSection(body, 'Grammatik Deutsch'),
    grammatikEn: getSection(body, 'Grammatik Englisch'),
    uebung: getSection(body, 'Übung'),
    loesung: getSection(body, 'Lösung'),
    schreibuebung: getSection(body, 'Schreibübung'),
    beispielloesung: getSection(body, 'Beispiellösung'),
    hoertext: getSection(body, 'Hörübung'),
    nachsprechen: parseNachsprechen(body),
  };
}

function parseWiederholungAus(frontmatter, body) {
  const aufgaben = [];
  for (const abschnitt of parseAbschnitte(body)) {
    const treffer = abschnitt.titel.match(AUFGABE_MUSTER);
    if (!treffer) continue;
    aufgaben.push({ titel: treffer[1].trim(), ...trenneLoesung(abschnitt.inhalt) });
  }

  return {
    art: 'wiederholung',
    nr: frontmatter.nr,
    titel: frontmatter.titel,
    umfasst: frontmatter.umfasst,
    einstiegDe: getSection(body, 'Einstieg Deutsch'),
    einstiegEn: getSection(body, 'Einstieg Englisch'),
    aufgaben,
    rueckmeldung: getSection(body, 'Rückmeldung'),
  };
}

/**
 * Der Abschluss: die letzte Station, kein Stoff mehr. Die Gratulation steht
 * zweisprachig da wie jede Erklärung im Kurs. "Gesprochen" ist der Text, aus
 * dem Miras Tonspur erzeugt wird – bewusst getrennt vom Lesetext, weil
 * Gesprochenes kürzer und einfacher sein muss als Geschriebenes.
 * "Bescheinigung" ist der Hinweis, der unten auf der Urkunde steht.
 */
function parseAbschlussAus(frontmatter, body) {
  return {
    art: 'abschluss',
    titel: frontmatter.titel,
    gratulationDe: getSection(body, 'Gratulation Deutsch'),
    gratulationEn: getSection(body, 'Gratulation Englisch'),
    gesprochen: getSection(body, 'Gesprochen'),
    bescheinigungDe: getSection(body, 'Bescheinigung Deutsch'),
    bescheinigungEn: getSection(body, 'Bescheinigung Englisch'),
  };
}

function parseAbschluss(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);
  return parseAbschlussAus(frontmatter, body);
}

/** Liest eine Datei und entscheidet anhand von "typ", wie sie gelesen wird. */
function parseDokument(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);
  if (frontmatter.typ === 'wiederholung') return parseWiederholungAus(frontmatter, body);
  if (frontmatter.typ === 'abschluss') return parseAbschlussAus(frontmatter, body);
  return parseLektionAus(frontmatter, body);
}

function parseLektion(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);
  return parseLektionAus(frontmatter, body);
}

function parseWiederholung(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);
  return parseWiederholungAus(frontmatter, body);
}

module.exports = { parseLektion, parseWiederholung, parseAbschluss, parseDokument, parseAbschnitte };

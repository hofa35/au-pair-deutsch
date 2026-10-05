// scripts/parser.js
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

function parseLektion(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);
  return {
    id: frontmatter.id,
    titel: frontmatter.titel,
    lernziel: frontmatter.lernziel,
    grammatikfokus: frontmatter.grammatikfokus,
    wortschatz: parseWortschatz(body),
    dialog: getSection(body, 'Dialog'),
    grammatikDe: getSection(body, 'Grammatik Deutsch'),
    grammatikEn: getSection(body, 'Grammatik Englisch'),
    uebung: getSection(body, 'Übung'),
    hoertext: getSection(body, 'Hörübung'),
  };
}

module.exports = { parseLektion };

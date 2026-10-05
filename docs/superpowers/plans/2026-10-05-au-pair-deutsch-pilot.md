# Deutsch für Au-Pairs – Piloten-Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine vollständig funktionierende Beispiel-Lektion ("Ankommen und sich vorstellen") durch die gesamte Kette ziehen – Inhalt, zweisprachiger Umschalter, Audio, statische Website, Veröffentlichung – als Vorlage für die restlichen 14 Lektionen und als Testfassung für die reale Au-Pair-Testperson.

**Architecture:** Statische Website ohne Server/Backend. Lektionen liegen als Markdown-Dateien mit YAML-Frontmatter vor. Ein Node-Build-Skript (ohne npm-Abhängigkeiten) parst die Lektionsdateien, erzeugt daraus HTML-Seiten mit eingebautem Zweisprachigkeits-Umschalter, bindet vorab erzeugte Audiodateien ein und schreibt alles nach `dist/`. Audio entsteht einmalig zur Build-Zeit über die Google Cloud Text-to-Speech REST-API, nicht zur Laufzeit. Veröffentlichung über GitHub Pages.

**Tech Stack:** Node.js (eingebaute Module: `fs`, `https`, `path`, `node:test`, `node:assert` – keine npm-Pakete), reines HTML/CSS/JavaScript ohne Framework, Google Cloud Text-to-Speech REST-API, Git/GitHub Pages.

**Spec:** `D:\Obsidian\zweites Gehirn\02 Projekte\Deutsch für Au-Pairs.md`

## Global Constraints

- Kein Server, kein Backend, kein Login, kein Fortschritt über Sitzungen hinweg (Pilot-Testform: einmaliger Durchlauf mit Feedback)
- Keine externen npm-Abhängigkeiten – nur Node-Bordmittel
- Erklärungen zuerst auf einfachem Deutsch, Englisch nur hinter einem Umschalter sichtbar
- Audio wird einmalig beim Bauen erzeugt und als Datei ausgeliefert, nicht live pro Besucher generiert
- Lektionsdateien sind YAML-Frontmatter + Markdown-Abschnitte, menschlich lesbar und von einem Content-Agenten befüllbar
- Jede Lektion ist eine in sich geschlossene Einheit (Grund: spätere Erweiterung um Konten/Fortschritt ohne Inhalts-Umbau)

---

## Dateiformat: Lektionsdatei

Jede Lektion ist eine Datei `lektionen/NN-slug.md` mit diesem Aufbau (verbindlich für alle folgenden Tasks):

```markdown
---
id: 1
titel: "Ankommen und sich vorstellen"
lernziel: "Sich und andere auf Deutsch vorstellen können."
grammatikfokus: "Verb \"sein\", Personalpronomen"
---

## Wortschatz

| Deutsch | Englisch |
|---|---|
| Hallo | Hello |
| Guten Tag | Good day |

## Dialog

**Anna:** Hallo, ich heiße Anna.
**Mira:** Ich heiße Mira.

## Grammatik Deutsch

Text auf einfachem Deutsch.

## Grammatik Englisch

Gleicher Inhalt auf Englisch, nur als Hilfe sichtbar.

## Übung

Übungstext.

## Hörübung

Text, der als Audio vorgelesen wird.
```

Abschnitte werden über `## `-Überschriften erkannt, die Wortschatz-Tabelle über Markdown-Tabellensyntax. Diese feste Struktur macht einen Parser ohne YAML-Bibliothek möglich (siehe Task 2).

---

### Task 1: Projekt-Grundgerüst und Git-Repository

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: `lektionen/` (Ordner, leer)
- Create: `scripts/` (Ordner, leer)
- Create: `audio/` (Ordner, leer)
- Create: `dist/` (Ordner, leer)

**Interfaces:**
- Produces: Ordnerstruktur, die alle folgenden Tasks voraussetzen (`lektionen/`, `scripts/`, `audio/`, `dist/`)

- [ ] **Step 1: Ordnerstruktur anlegen**

```bash
cd "C:\Users\User\Desktop\Claude\Sessions\Au Pair Deutsch"
mkdir lektionen scripts audio dist
```

- [ ] **Step 2: `.gitignore` anlegen**

```
dist/
*.log
.env
```

- [ ] **Step 3: `README.md` anlegen**

```markdown
# Deutsch für Au-Pairs – Pilot

Offenes DaF-A1-Lernangebot für Au-Pairs in Deutschland. Statische Website,
kein Backend. Siehe Spezifikation im Obsidian-Vault:
`02 Projekte/Deutsch für Au-Pairs.md`.

## Build

    node scripts/build.js

Ergebnis liegt in `dist/`.

## Audio erzeugen

    set GOOGLE_TTS_API_KEY=dein-key
    node scripts/generate_audio.js
```

- [ ] **Step 4: Git-Repository initialisieren**

```bash
git init
git add .gitignore README.md lektionen scripts audio dist
git commit -m "chore: Projekt-Grundgerüst für Deutsch für Au-Pairs"
```

Hinweis: `dist/` und `audio/` sind zu diesem Zeitpunkt leere Ordner. Git versioniert keine leeren Ordner – lege in jedem eine `.gitkeep`-Datei an, falls der Commit sonst nichts zu erfassen findet:

```bash
touch lektionen/.gitkeep scripts/.gitkeep audio/.gitkeep dist/.gitkeep
git add lektionen scripts audio dist
git commit -m "chore: Ordnerstruktur mit .gitkeep sichern"
```

---

### Task 2: Lektions-Parser

**Files:**
- Create: `scripts/parser.js`
- Test: `scripts/parser.test.js`

**Interfaces:**
- Consumes: eine Lektionsdatei im Format aus dem Abschnitt "Dateiformat: Lektionsdatei"
- Produces: `parseLektion(filePath: string) -> { id: number, titel: string, lernziel: string, grammatikfokus: string, wortschatz: Array<{de: string, en: string}>, dialog: string, grammatikDe: string, grammatikEn: string, uebung: string, hoertext: string }`, exportiert aus `scripts/parser.js` als `module.exports = { parseLektion }`

- [ ] **Step 1: Testordner-Fixture und fehlschlagenden Test schreiben**

Lege zuerst eine Testdatei `scripts/fixtures/test-lektion.md` an:

```markdown
---
id: 1
titel: "Testlektion"
lernziel: "Testziel."
grammatikfokus: "Testgrammatik"
---

## Wortschatz

| Deutsch | Englisch |
|---|---|
| Hallo | Hello |
| Danke | Thank you |

## Dialog

**A:** Hallo.
**B:** Hallo zurück.

## Grammatik Deutsch

Deutscher Grammatiktext.

## Grammatik Englisch

English grammar text.

## Übung

Übungstext hier.

## Hörübung

Hörtext hier.
```

Dann `scripts/parser.test.js`:

```javascript
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { parseLektion } = require('./parser.js');

test('parseLektion liest Frontmatter-Felder', () => {
  const lektion = parseLektion(path.join(__dirname, 'fixtures', 'test-lektion.md'));
  assert.strictEqual(lektion.id, 1);
  assert.strictEqual(lektion.titel, 'Testlektion');
  assert.strictEqual(lektion.lernziel, 'Testziel.');
  assert.strictEqual(lektion.grammatikfokus, 'Testgrammatik');
});

test('parseLektion liest Wortschatz-Tabelle', () => {
  const lektion = parseLektion(path.join(__dirname, 'fixtures', 'test-lektion.md'));
  assert.deepStrictEqual(lektion.wortschatz, [
    { de: 'Hallo', en: 'Hello' },
    { de: 'Danke', en: 'Thank you' },
  ]);
});

test('parseLektion liest Dialog, Grammatik, Übung, Hörübung', () => {
  const lektion = parseLektion(path.join(__dirname, 'fixtures', 'test-lektion.md'));
  assert.match(lektion.dialog, /Hallo zurück/);
  assert.strictEqual(lektion.grammatikDe, 'Deutscher Grammatiktext.');
  assert.strictEqual(lektion.grammatikEn, 'English grammar text.');
  assert.strictEqual(lektion.uebung, 'Übungstext hier.');
  assert.strictEqual(lektion.hoertext, 'Hörtext hier.');
});
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `node --test scripts/parser.test.js`
Expected: FAIL mit "Cannot find module './parser.js'"

- [ ] **Step 3: Parser implementieren**

```javascript
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
```

- [ ] **Step 4: Test ausführen, Erfolg bestätigen**

Run: `node --test scripts/parser.test.js`
Expected: PASS, 3 Tests grün

- [ ] **Step 5: Commit**

```bash
git add scripts/parser.js scripts/parser.test.js scripts/fixtures
git commit -m "feat: Lektions-Parser für Frontmatter und Abschnitte"
```

---

### Task 3: Prüfstand (Validierung)

**Files:**
- Create: `scripts/pruefstand.js`
- Test: `scripts/pruefstand.test.js`

**Interfaces:**
- Consumes: `parseLektion` aus `scripts/parser.js`
- Produces: `validateLektion(lektion: object) -> { valid: boolean, errors: string[] }`, exportiert als `module.exports = { validateLektion }`. Zusätzlich ein CLI-Einstiegspunkt, der alle Dateien in `lektionen/*.md` prüft und bei Fehlern mit Exit-Code 1 beendet.

- [ ] **Step 1: Fehlschlagenden Test schreiben**

```javascript
// scripts/pruefstand.test.js
const test = require('node:test');
const assert = require('node:assert');
const { validateLektion } = require('./pruefstand.js');

test('vollständige Lektion ist gültig', () => {
  const lektion = {
    id: 1, titel: 'X', lernziel: 'Y', grammatikfokus: 'Z',
    wortschatz: [{ de: 'Hallo', en: 'Hello' }],
    dialog: 'A: Hi', grammatikDe: 'De', grammatikEn: 'En',
    uebung: 'Ü', hoertext: 'H',
  };
  const result = validateLektion(lektion);
  assert.strictEqual(result.valid, true);
  assert.deepStrictEqual(result.errors, []);
});

test('fehlendes Pflichtfeld wird gemeldet', () => {
  const lektion = {
    id: 1, titel: '', lernziel: 'Y', grammatikfokus: 'Z',
    wortschatz: [], dialog: 'A: Hi', grammatikDe: 'De', grammatikEn: 'En',
    uebung: 'Ü', hoertext: 'H',
  };
  const result = validateLektion(lektion);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes('titel fehlt'));
  assert.ok(result.errors.includes('wortschatz ist leer'));
});
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `node --test scripts/pruefstand.test.js`
Expected: FAIL mit "Cannot find module './pruefstand.js'"

- [ ] **Step 3: Prüfstand implementieren**

```javascript
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
  if (!lektion.hoertext) errors.push('hoertext fehlt');
  return { valid: errors.length === 0, errors };
}

function main() {
  const lektionenDir = path.join(__dirname, '..', 'lektionen');
  const dateien = fs.readdirSync(lektionenDir).filter((f) => f.endsWith('.md'));
  let hatFehler = false;
  for (const datei of dateien) {
    const lektion = parseLektion(path.join(lektionenDir, datei));
    const result = validateLektion(lektion);
    if (!result.valid) {
      hatFehler = true;
      console.error(`${datei}: ${result.errors.join(', ')}`);
    } else {
      console.log(`${datei}: OK`);
    }
  }
  process.exit(hatFehler ? 1 : 0);
}

if (require.main === module) main();

module.exports = { validateLektion };
```

- [ ] **Step 4: Test ausführen, Erfolg bestätigen**

Run: `node --test scripts/pruefstand.test.js`
Expected: PASS, 2 Tests grün

- [ ] **Step 5: Commit**

```bash
git add scripts/pruefstand.js scripts/pruefstand.test.js
git commit -m "feat: Prüfstand zur Validierung von Lektionsdateien"
```

---

### Task 4: Zweisprachigkeits-Umschalter (isomorphe Logik)

**Files:**
- Create: `scripts/toggle.js`
- Test: `scripts/toggle.test.js`

**Interfaces:**
- Produces: `naechsterZustand(aktuell: 'de' | 'en') -> 'de' | 'en'`, exportiert sowohl für Node (`module.exports`) als auch nutzbar im Browser über `<script src="toggle.js">`, dort hängt die Funktion an `window.AuPairToggle`

- [ ] **Step 1: Fehlschlagenden Test schreiben**

```javascript
// scripts/toggle.test.js
const test = require('node:test');
const assert = require('node:assert');
const { naechsterZustand } = require('./toggle.js');

test('von de wechselt der Zustand zu en', () => {
  assert.strictEqual(naechsterZustand('de'), 'en');
});

test('von en wechselt der Zustand zurück zu de', () => {
  assert.strictEqual(naechsterZustand('en'), 'de');
});
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `node --test scripts/toggle.test.js`
Expected: FAIL mit "Cannot find module './toggle.js'"

- [ ] **Step 3: Toggle-Logik implementieren, isomorph für Node und Browser**

```javascript
// scripts/toggle.js
function naechsterZustand(aktuell) {
  return aktuell === 'de' ? 'en' : 'de';
}

function wendeZustandAufDomAn(zustand) {
  document.querySelectorAll('[data-sprache]').forEach((el) => {
    el.style.display = el.dataset.sprache === zustand ? '' : 'none';
  });
}

function registriereUmschalter() {
  document.querySelectorAll('.sprach-umschalter').forEach((button) => {
    let zustand = 'de';
    button.addEventListener('click', () => {
      zustand = naechsterZustand(zustand);
      const ziel = button.closest('.erklaerung');
      ziel.querySelectorAll('[data-sprache]').forEach((el) => {
        el.style.display = el.dataset.sprache === zustand ? '' : 'none';
      });
    });
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { naechsterZustand };
} else {
  window.AuPairToggle = { naechsterZustand, registriereUmschalter };
  document.addEventListener('DOMContentLoaded', registriereUmschalter);
}
```

- [ ] **Step 4: Test ausführen, Erfolg bestätigen**

Run: `node --test scripts/toggle.test.js`
Expected: PASS, 2 Tests grün

- [ ] **Step 5: Commit**

```bash
git add scripts/toggle.js scripts/toggle.test.js
git commit -m "feat: isomorphe Umschalt-Logik für Deutsch/Englisch-Hilfe"
```

---

### Task 5: HTML-Generator für eine Lektionsseite

**Files:**
- Create: `scripts/renderer.js`
- Test: `scripts/renderer.test.js`

**Interfaces:**
- Consumes: Lektions-Objekt aus `parseLektion` (Task 2)
- Produces: `renderLektionHtml(lektion: object) -> string`, exportiert als `module.exports = { renderLektionHtml }`. Die erzeugte Seite bindet `toggle.js` per `<script src="toggle.js">` ein und referenziert Audiodateien unter `audio/<id>/<slug>.mp3` (Dateinamen aus Task 6).

- [ ] **Step 1: Fehlschlagenden Test schreiben**

```javascript
// scripts/renderer.test.js
const test = require('node:test');
const assert = require('node:assert');
const { renderLektionHtml } = require('./renderer.js');

const beispielLektion = {
  id: 1, titel: 'Ankommen', lernziel: 'Sich vorstellen.', grammatikfokus: 'sein',
  wortschatz: [{ de: 'Hallo', en: 'Hello' }],
  dialog: '**A:** Hallo.', grammatikDe: 'Deutscher Text', grammatikEn: 'English text',
  uebung: 'Übe das.', hoertext: 'Hörtext.',
};

test('renderLektionHtml enthält Titel und Lernziel', () => {
  const html = renderLektionHtml(beispielLektion);
  assert.match(html, /Ankommen/);
  assert.match(html, /Sich vorstellen\./);
});

test('renderLektionHtml zeigt Deutsch sichtbar, Englisch versteckt', () => {
  const html = renderLektionHtml(beispielLektion);
  assert.match(html, /data-sprache="de">Deutscher Text</);
  assert.match(html, /data-sprache="en" style="display:none">English text</);
});

test('renderLektionHtml bindet toggle.js ein', () => {
  const html = renderLektionHtml(beispielLektion);
  assert.match(html, /<script src="toggle\.js"><\/script>/);
});
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `node --test scripts/renderer.test.js`
Expected: FAIL mit "Cannot find module './renderer.js'"

- [ ] **Step 3: Renderer implementieren**

```javascript
// scripts/renderer.js
function renderWortschatz(wortschatz) {
  return wortschatz
    .map(
      (eintrag) => `<li>${eintrag.de} <span class="englisch">(${eintrag.en})</span></li>`
    )
    .join('\n');
}

function renderLektionHtml(lektion) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>${lektion.titel}</title>
</head>
<body>
<h1>${lektion.titel}</h1>
<p class="lernziel">${lektion.lernziel}</p>

<h2>Wortschatz</h2>
<ul>
${renderWortschatz(lektion.wortschatz)}
</ul>

<h2>Dialog</h2>
<p>${lektion.dialog}</p>

<h2>Grammatik</h2>
<div class="erklaerung">
  <p data-sprache="de">${lektion.grammatikDe}</p>
  <p data-sprache="en" style="display:none">${lektion.grammatikEn}</p>
  <button class="sprach-umschalter">Verstehst du das nicht? Hier auf Englisch</button>
</div>

<h2>Übung</h2>
<p>${lektion.uebung}</p>

<h2>Hörübung</h2>
<audio controls src="audio/${lektion.id}/hoeruebung.mp3"></audio>
<p>${lektion.hoertext}</p>

<script src="toggle.js"></script>
</body>
</html>`;
}

module.exports = { renderLektionHtml };
```

- [ ] **Step 4: Test ausführen, Erfolg bestätigen**

Run: `node --test scripts/renderer.test.js`
Expected: PASS, 3 Tests grün

- [ ] **Step 5: Commit**

```bash
git add scripts/renderer.js scripts/renderer.test.js
git commit -m "feat: HTML-Generator für Lektionsseiten mit Umschalter"
```

---

### Task 6: Erste Lektion anlegen – "Ankommen und sich vorstellen"

**Files:**
- Create: `lektionen/01-ankommen.md`

**Interfaces:**
- Consumes: Dateiformat aus dem Abschnitt "Dateiformat: Lektionsdatei"
- Produces: eine gültige Lektionsdatei, die Task 3 (Prüfstand) ohne Fehler durchläuft

- [ ] **Step 1: Lektionsdatei mit echtem Inhalt anlegen**

```markdown
---
id: 1
titel: "Ankommen und sich vorstellen"
lernziel: "Sich und andere auf Deutsch vorstellen können."
grammatikfokus: "Verb \"sein\", Personalpronomen"
---

## Wortschatz

| Deutsch | Englisch |
|---|---|
| Hallo | Hello |
| Guten Tag | Good day |
| Ich heiße ... | My name is ... |
| Wie heißt du? | What's your name? |
| Ich komme aus ... | I come from ... |
| Woher kommst du? | Where are you from? |
| Freut mich | Nice to meet you |
| Auf Wiedersehen | Goodbye |
| bitte | please |
| danke | thank you |

## Dialog

**Anna (Gastmutter):** Hallo! Du bist bestimmt Mira, oder?
**Mira:** Ja, genau. Hallo, ich heiße Mira.
**Anna:** Freut mich, Mira. Ich heiße Anna. Woher kommst du?
**Mira:** Ich komme aus den Philippinen.
**Anna:** Schön. Willkommen in Deutschland!
**Mira:** Danke!

## Grammatik Deutsch

Das Verb "sein" ist unregelmäßig. Hier die Formen im Präsens:

ich bin · du bist · er/sie/es ist · wir sind · ihr seid · sie/Sie sind

Beispiel: "Ich bin Mira." "Du bist meine Gastmutter."

## Grammatik Englisch

The verb "sein" (to be) is irregular. Here are the present-tense forms:

ich bin (I am) · du bist (you are) · er/sie/es ist (he/she/it is) ·
wir sind (we are) · ihr seid (you all are) · sie/Sie sind (they/you formal are)

Example: "Ich bin Mira." (I am Mira.) "Du bist meine Gastmutter." (You are my host mother.)

## Übung

Ergänze die richtige Form von "sein":

1. Ich ___ Mira.
2. Du ___ meine Gastmutter.
3. Wir ___ eine Familie.
4. Wie ___ dein Name?

Lösung: 1. bin, 2. bist, 3. sind, 4. ist

## Hörübung

Hallo, ich heiße Mira. Ich komme aus den Philippinen. Ich bin neu hier in Deutschland. Freut mich, dich kennenzulernen!
```

- [ ] **Step 2: Prüfstand gegen die neue Datei laufen lassen**

Run: `node scripts/pruefstand.js`
Expected: Ausgabe `01-ankommen.md: OK`, Exit-Code 0

- [ ] **Step 3: Commit**

```bash
git add lektionen/01-ankommen.md
git commit -m "content: erste Lektion Ankommen und sich vorstellen"
```

---

### Task 7: Audio-Generierung über Google Cloud Text-to-Speech

**Vorbereitung (einmalig, außerhalb von Git):**
1. Google-Cloud-Konto anlegen (falls noch nicht vorhanden)
2. Im Google Cloud Projekt die "Cloud Text-to-Speech API" aktivieren
3. Einen API-Key erstellen, in der Google Cloud Console auf "Cloud Text-to-Speech API" einschränken
4. Den Key **nicht** in Git einchecken – als Umgebungsvariable setzen:

```bash
set GOOGLE_TTS_API_KEY=dein-api-key-hier
```

**Files:**
- Create: `scripts/generate_audio.js`
- Test: `scripts/generate_audio.test.js`

**Interfaces:**
- Consumes: `parseLektion` aus Task 2, Umgebungsvariable `GOOGLE_TTS_API_KEY`
- Produces: `buildSpeechRequest(text: string) -> { input: {text: string}, voice: {languageCode: 'de-DE', name: 'de-DE-Neural2-F'}, audioConfig: {audioEncoding: 'MP3'} }` (pure, testbar ohne Netzwerk), außerdem eine `main()`-Funktion, die für Lektion 1 eine Datei `audio/1/hoeruebung.mp3` erzeugt

- [ ] **Step 1: Fehlschlagenden Test für die reine Payload-Funktion schreiben**

```javascript
// scripts/generate_audio.test.js
const test = require('node:test');
const assert = require('node:assert');
const { buildSpeechRequest } = require('./generate_audio.js');

test('buildSpeechRequest baut die erwartete Anfrage', () => {
  const request = buildSpeechRequest('Hallo, ich heiße Mira.');
  assert.deepStrictEqual(request, {
    input: { text: 'Hallo, ich heiße Mira.' },
    voice: { languageCode: 'de-DE', name: 'de-DE-Neural2-F' },
    audioConfig: { audioEncoding: 'MP3' },
  });
});
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `node --test scripts/generate_audio.test.js`
Expected: FAIL mit "Cannot find module './generate_audio.js'"

- [ ] **Step 3: Skript implementieren – reine Funktion plus Netzwerk-Aufruf getrennt**

```javascript
// scripts/generate_audio.js
const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');
const { parseLektion } = require('./parser.js');

function buildSpeechRequest(text) {
  return {
    input: { text },
    voice: { languageCode: 'de-DE', name: 'de-DE-Neural2-F' },
    audioConfig: { audioEncoding: 'MP3' },
  };
}

function rufeTtsApiAuf(text, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(buildSpeechRequest(text));
    const options = {
      hostname: 'texttospeech.googleapis.com',
      path: `/v1/text:synthesize?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`TTS-API Fehler: ${res.statusCode} ${data}`));
        resolve(JSON.parse(data).audioContent);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) throw new Error('Umgebungsvariable GOOGLE_TTS_API_KEY ist nicht gesetzt');

  const lektion = parseLektion(path.join(__dirname, '..', 'lektionen', '01-ankommen.md'));
  const audioBase64 = await rufeTtsApiAuf(lektion.hoertext, apiKey);

  const zielOrdner = path.join(__dirname, '..', 'audio', String(lektion.id));
  fs.mkdirSync(zielOrdner, { recursive: true });
  fs.writeFileSync(path.join(zielOrdner, 'hoeruebung.mp3'), Buffer.from(audioBase64, 'base64'));
  console.log(`Audio geschrieben: audio/${lektion.id}/hoeruebung.mp3`);
}

if (require.main === module) main().catch((err) => { console.error(err); process.exit(1); });

module.exports = { buildSpeechRequest };
```

- [ ] **Step 4: Test ausführen, Erfolg bestätigen**

Run: `node --test scripts/generate_audio.test.js`
Expected: PASS, 1 Test grün

- [ ] **Step 5: Skript einmal real ausführen und Ergebnis von Hand prüfen**

Run (mit gesetztem `GOOGLE_TTS_API_KEY`): `node scripts/generate_audio.js`
Expected: Ausgabe "Audio geschrieben: audio/1/hoeruebung.mp3", Datei existiert und lässt sich abspielen

- [ ] **Step 6: Commit**

```bash
git add scripts/generate_audio.js scripts/generate_audio.test.js
git commit -m "feat: Audio-Generierung über Google Cloud Text-to-Speech"
```

Hinweis: `audio/1/hoeruebung.mp3` selbst wird erst in Task 8 versioniert, zusammen mit dem Build-Ergebnis.

---

### Task 8: Build-Skript und erste veröffentlichte Fassung

**Files:**
- Create: `scripts/build.js`
- Modify: `audio/.gitkeep` → wird durch echte Audiodatei ersetzt

**Interfaces:**
- Consumes: `parseLektion` (Task 2), `validateLektion` (Task 3), `renderLektionHtml` (Task 5), `toggle.js` (Task 4)
- Produces: `dist/index.html`, `dist/lektion-01.html`, `dist/toggle.js`, `dist/audio/1/hoeruebung.mp3`

- [ ] **Step 1: Build-Skript implementieren**

```javascript
// scripts/build.js
const fs = require('node:fs');
const path = require('node:path');
const { parseLektion } = require('./parser.js');
const { validateLektion } = require('./pruefstand.js');
const { renderLektionHtml } = require('./renderer.js');

function main() {
  const wurzel = path.join(__dirname, '..');
  const lektionenDir = path.join(wurzel, 'lektionen');
  const distDir = path.join(wurzel, 'dist');

  fs.mkdirSync(distDir, { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'toggle.js'), path.join(distDir, 'toggle.js'));

  const dateien = fs.readdirSync(lektionenDir).filter((f) => f.endsWith('.md'));
  const lektionsListe = [];

  for (const datei of dateien) {
    const lektion = parseLektion(path.join(lektionenDir, datei));
    const result = validateLektion(lektion);
    if (!result.valid) {
      throw new Error(`${datei} ist ungültig: ${result.errors.join(', ')}`);
    }

    const audioQuelle = path.join(wurzel, 'audio', String(lektion.id), 'hoeruebung.mp3');
    const audioZielDir = path.join(distDir, 'audio', String(lektion.id));
    fs.mkdirSync(audioZielDir, { recursive: true });
    if (fs.existsSync(audioQuelle)) {
      fs.copyFileSync(audioQuelle, path.join(audioZielDir, 'hoeruebung.mp3'));
    } else {
      console.warn(`Warnung: kein Audio für Lektion ${lektion.id} gefunden, Seite wird trotzdem gebaut`);
    }

    const html = renderLektionHtml(lektion);
    const dateiname = `lektion-${String(lektion.id).padStart(2, '0')}.html`;
    fs.writeFileSync(path.join(distDir, dateiname), html);
    lektionsListe.push({ id: lektion.id, titel: lektion.titel, dateiname });
  }

  const indexHtml = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><title>Deutsch für Au-Pairs</title></head>
<body>
<h1>Deutsch für Au-Pairs</h1>
<ul>
${lektionsListe.map((l) => `<li><a href="${l.dateiname}">${l.titel}</a></li>`).join('\n')}
</ul>
</body>
</html>`;
  fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);

  console.log(`Build fertig: ${lektionsListe.length} Lektion(en) in dist/`);
}

main();
```

- [ ] **Step 2: Build ausführen**

Run: `node scripts/build.js`
Expected: Ausgabe "Build fertig: 1 Lektion(en) in dist/", Dateien `dist/index.html`, `dist/lektion-01.html`, `dist/toggle.js`, `dist/audio/1/hoeruebung.mp3` existieren

- [ ] **Step 3: Im Browser von Hand prüfen**

Öffne `dist/index.html` per Doppelklick im Browser. Prüfe:
- Link zur Lektion funktioniert
- Wortschatz, Dialog, Übung werden angezeigt
- Grammatik zeigt zuerst Deutsch, Button "Verstehst du das nicht? Hier auf Englisch" blendet Englisch ein und beim erneuten Klick wieder aus
- Audio-Player spielt die Hörübung ab

- [ ] **Step 4: Commit**

```bash
git add scripts/build.js
git commit -m "feat: Build-Skript erzeugt statische Site aus Lektionsdateien"
```

---

### Task 9: Veröffentlichung auf GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `dist/`-Ausgabe aus Task 8
- Produces: eine öffentlich erreichbare URL unter `https://<github-nutzername>.github.io/<repo-name>/`

- [ ] **Step 1: GitHub-Repository anlegen**

Auf github.com ein neues, privates oder öffentliches Repository anlegen, z. B. `au-pair-deutsch`. Lokal verbinden:

```bash
git remote add origin https://github.com/<dein-nutzername>/au-pair-deutsch.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Workflow-Datei für automatisches Bauen und Veröffentlichen anlegen**

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: node scripts/build.js
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
        id: deployment
```

- [ ] **Step 3: GitHub Pages in den Repository-Einstellungen aktivieren**

Unter Settings → Pages → Source → "GitHub Actions" auswählen.

- [ ] **Step 4: Workflow-Datei committen und pushen**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: automatisches Bauen und Veröffentlichen auf GitHub Pages"
git push
```

- [ ] **Step 5: Veröffentlichung prüfen**

Im Reiter "Actions" auf GitHub prüfen, ob der Workflow grün durchläuft. Danach die Pages-URL öffnen (Settings → Pages zeigt sie an) und denselben manuellen Check wie in Task 8 Step 3 wiederholen – jetzt live im Netz.

---

## Nach diesem Plan

Mit Task 9 ist die Kette für Lektion 1 komplett und live: Inhalt, Zweisprachigkeits-Umschalter, Audio, Veröffentlichung. Die verbleibenden 14 Lektionen folgen demselben Muster aus Task 6 (Inhalt anlegen → Prüfstand → Audio generieren → Build → Push). Das ist bewusst kein eigener Task mehr in diesem Plan, weil es keine neue Technik braucht, nur Wiederholung – jede weitere Lektion lässt sich einzeln in einer freien 3-bis-5-Stunden-Woche ergänzen. Vor der nächsten Erweiterungsrunde (z. B. Konten/Fortschritt) lohnt ein neuer Plan, sobald der reale Test mit der Au-Pair-Testperson Rückmeldung gebracht hat.

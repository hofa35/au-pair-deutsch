# Verkehrsregeln fürs Fahrrad (verkehr/) – Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modul 1 ("Vorfahrt im Straßenverkehr") des neuen Verkehrsregeln-Kurses vollständig durch die gesamte Kette ziehen – Inhalt, zweisprachige Erklärungen, bildgestützte Multiple-Choice-Aufgaben, statische Website, Veröffentlichung unter `/verkehr/` auf derselben GitHub-Pages-Seite wie der Sprachkurs – als Vorlage und Machbarkeitsnachweis für die drei folgenden Module.

**Architecture:** Statische Website ohne Server/Backend, im selben Repository wie "Deutsch für Au-Pairs", aber mit einer eigenen, schlanken Pipeline (eigener Parser, Prüfstand, Renderer, Build-Skript). Die Module sind unabhängig voneinander – anders als die Lektionen des Sprachkurses gibt es keine Ketten-/Stationen-Logik. Wiederverwendet werden nur generische, kettenunabhängige Bausteine: `scripts/toggle.js` (Umschalter-Verhalten), `scripts/html.js` (`escapeHtml`) und aus `scripts/parser.js` die beiden reinen Textfunktionen `parseFrontmatter` und `parseAbschnitte` (CRLF-Normalisierung und generisches Zerlegen in `## `-Abschnitte – das Gleiche hier neu zu schreiben wäre unnötige Dopplung und ein Risiko, den schon einmal gefundenen Windows-Zeilenende-Fehler erneut einzubauen). Alles Kettenspezifische (`stationen.js`, `fortschritt.js`, Audio-Skripte, `zertifikat.js`) bleibt unangetastet.

**Tech Stack:** Node.js (eingebaute Module: `fs`, `path`, `crypto`, `node:test`, `node:assert` – keine npm-Pakete), reines HTML/CSS/JavaScript ohne Framework, `ffmpeg` für die Bildnachbearbeitung, die `media-skill` (kie.ai-API) für die Bilderzeugung, Git/GitHub Pages.

**Spec:** `C:\Users\User\Desktop\Claude\Sessions\Au Pair Deutsch\docs\superpowers\specs\2026-10-14-fahrrad-verkehr-modul-design.md`

**Abweichung von der Spec (bewusst, siehe Begründung je Task):** Die Spec sah vor, dass der Prüfstand auch die Existenz der Bilddatei hart prüft. Dieser Plan verschiebt das zu einer weichen Warnung im Build-Skript (wie beim Sprachkurs die fehlende Hörübung) – ein fehlendes Bild ist unschön, aber nicht sicherheitsrelevant, anders als eine fehlende oder falsche Regelerklärung. Das entkoppelt außerdem die Reihenfolge: Build und Inhalt lassen sich fertigstellen und testen, bevor die kostenpflichtige Bilderzeugung läuft.

## Global Constraints

- Kein Server, kein Backend, kein Konto, keine Fortschrittsspeicherung (explizit YAGNI laut Spec)
- Keine externen npm-Abhängigkeiten – nur Node-Bordmittel
- Module sind unabhängig voneinander, keine Ketten-/Stationen-Logik, keine Querverweise zwischen Modulen
- Erklärungen zuerst auf einfachem Deutsch, Englisch hinter dem bestehenden Umschalter (`toggle.js`, Vertrag: bilinguale Inhalte stehen in einem Container mit Klasse `erklaerung`, je ein `<p data-sprache="de">` / `<p data-sprache="en" style="display:none">`, dazu ein `button.sprach-umschalter`)
- Kein Audio
- Kein Zertifikat/keine Bescheinigung in diesem Plan – eigener, späterer Baustein
- Bilder entstehen über die `media-skill` (kie.ai), werden nach `verkehr/bildkarten-quelle/` geladen und über ein eigenes Nachbearbeitungsskript als 720×480-WebP nach `verkehr/bilder/` geschrieben (nicht Teil des Builds, analog zu `bilder-aufbereiten.js`)
- Wiederverwendet wird **nur**: `scripts/toggle.js`, `scripts/html.js` (`escapeHtml`), sowie `parseFrontmatter` und `parseAbschnitte` aus `scripts/parser.js`. Keine Änderung an einer dieser Dateien oder an `stationen.js` / `fortschritt.js` / den Audio-Skripten.
- `verkehr/bildkarten-quelle/` muss nicht zusätzlich in `.gitignore` eingetragen werden – der bestehende Eintrag `bildkarten-quelle/` (ohne führenden Slash) matcht bereits auf jeder Ebene.

---

## Dateiübersicht

**Neu:**

```
verkehr/
  module/
    01-vorfahrt.md
    uebersicht.json
  bilder/                      (WebP, eingecheckt)
  bildkarten-quelle/           (Rohbilder, bereits gitignored)
scripts/
  verkehr-parser.js
  verkehr-parser.test.js
  verkehr-pruefstand.js
  verkehr-pruefstand.test.js
  verkehr-uebung.js
  verkehr-uebung.test.js
  verkehr-renderer.js
  verkehr-renderer.test.js
  verkehr-startseite.js
  verkehr-startseite.test.js
  verkehr-styles.css
  verkehr-bilder-aufbereiten.js
  verkehr-build.js
  fixtures/
    test-verkehrsmodul.md
    malformed-optionen.md
```

**Geändert:**

```
.github/workflows/deploy.yml   (zwei zusätzliche CI-Schritte)
scripts/startseite.js          (ein Verweis auf /verkehr/)
scripts/styles.css             (eine kleine, additive Regel für den Verweis)
README.md                      (neuer Abschnitt zum Verkehrsbereich)
```

---

### Task 1: Verkehrsmodul-Parser

**Files:**
- Create: `scripts/verkehr-parser.js`
- Create: `scripts/fixtures/test-verkehrsmodul.md`
- Create: `scripts/fixtures/malformed-optionen.md`
- Test: `scripts/verkehr-parser.test.js`

**Interfaces:**
- Consumes: `parseFrontmatter(rohtext) -> {frontmatter, body}` und `parseAbschnitte(body) -> [{titel, inhalt}]`, beide aus `scripts/parser.js` (bereits vorhanden, unverändert)
- Produces: `parseVerkehrsmodul(filePath) -> { id: number, titel: string, themenbereich: string, einleitungDe: string, einleitungEn: string, regelDe: string, regelEn: string, aufgaben: Array<{ titel: string, bild: string, fragDe: string, fragEn: string, optionen: Array<{text: string, richtig: boolean}>, erklaerungDe: string, erklaerungEn: string }> }`. Dieses Objekt ist die Eingabe für Task 2 (Prüfstand) und Task 4 (Renderer).

- [ ] **Step 1: Fixture-Dateien anlegen**

`scripts/fixtures/test-verkehrsmodul.md`:

```markdown
---
id: 1
titel: "Testmodul"
themenbereich: "Testbereich"
typ: verkehrsmodul
---

## Einleitung Deutsch

Das ist die deutsche Einleitung.

## Einleitung Englisch

This is the English introduction.

## Regel Deutsch

Das ist die deutsche Regel.

## Regel Englisch

This is the English rule.

## Aufgabe: Erste Aufgabe

### Bild

test-bild-1.webp

### Frage Deutsch

Was ist richtig?

### Frage Englisch

What is correct?

### Optionen

- [ ] Falsche Antwort A
- [x] Richtige Antwort
- [ ] Falsche Antwort B

### Erklärung Deutsch

Weil das die Regel ist.

### Erklärung Englisch

Because that is the rule.

## Aufgabe: Zweite Aufgabe

### Bild

test-bild-2.webp

### Frage Deutsch

Und hier?

### Frage Englisch

And here?

### Optionen

- [x] Richtig
- [ ] Falsch

### Erklärung Deutsch

Erklärung zwei.

### Erklärung Englisch

Explanation two.
```

`scripts/fixtures/malformed-optionen.md`:

```markdown
---
id: 2
titel: "Kaputt"
themenbereich: "Test"
typ: verkehrsmodul
---

## Einleitung Deutsch

X

## Einleitung Englisch

X

## Regel Deutsch

X

## Regel Englisch

X

## Aufgabe: Kaputte Aufgabe

### Bild

x.webp

### Frage Deutsch

X?

### Frage Englisch

X?

### Optionen

- Falsche Zeile ohne Kästchen
- [x] Richtig

### Erklärung Deutsch

X

### Erklärung Englisch

X
```

- [ ] **Step 2: Failing Test schreiben**

`scripts/verkehr-parser.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { parseVerkehrsmodul } = require('./verkehr-parser.js');

const fixturePfad = path.join(__dirname, 'fixtures', 'test-verkehrsmodul.md');

test('parseVerkehrsmodul liest Frontmatter-Felder', () => {
  const modul = parseVerkehrsmodul(fixturePfad);
  assert.strictEqual(modul.id, 1);
  assert.strictEqual(modul.titel, 'Testmodul');
  assert.strictEqual(modul.themenbereich, 'Testbereich');
});

test('parseVerkehrsmodul liest Einleitung und Regel zweisprachig', () => {
  const modul = parseVerkehrsmodul(fixturePfad);
  assert.strictEqual(modul.einleitungDe, 'Das ist die deutsche Einleitung.');
  assert.strictEqual(modul.einleitungEn, 'This is the English introduction.');
  assert.strictEqual(modul.regelDe, 'Das ist die deutsche Regel.');
  assert.strictEqual(modul.regelEn, 'This is the English rule.');
});

test('parseVerkehrsmodul liest alle Aufgaben in Reihenfolge', () => {
  const modul = parseVerkehrsmodul(fixturePfad);
  assert.strictEqual(modul.aufgaben.length, 2);
  assert.strictEqual(modul.aufgaben[0].titel, 'Erste Aufgabe');
  assert.strictEqual(modul.aufgaben[1].titel, 'Zweite Aufgabe');
});

test('parseVerkehrsmodul liest Bild, Fragen und Erklärungen einer Aufgabe', () => {
  const modul = parseVerkehrsmodul(fixturePfad);
  const [erste] = modul.aufgaben;
  assert.strictEqual(erste.bild, 'test-bild-1.webp');
  assert.strictEqual(erste.fragDe, 'Was ist richtig?');
  assert.strictEqual(erste.fragEn, 'What is correct?');
  assert.strictEqual(erste.erklaerungDe, 'Weil das die Regel ist.');
  assert.strictEqual(erste.erklaerungEn, 'Because that is the rule.');
});

test('parseVerkehrsmodul markiert genau die richtige Option', () => {
  const modul = parseVerkehrsmodul(fixturePfad);
  const [erste] = modul.aufgaben;
  assert.deepStrictEqual(erste.optionen, [
    { text: 'Falsche Antwort A', richtig: false },
    { text: 'Richtige Antwort', richtig: true },
    { text: 'Falsche Antwort B', richtig: false },
  ]);
});

test('parseVerkehrsmodul wirft Fehler bei falschem typ', () => {
  const pfad = path.join(os.tmpdir(), 'falscher-typ.md');
  fs.writeFileSync(
    pfad,
    ['---', 'id: 9', 'titel: "X"', 'themenbereich: "Y"', 'typ: lektion', '---', ''].join('\n')
  );
  assert.throws(() => parseVerkehrsmodul(pfad), /erwartet Frontmatter "typ: verkehrsmodul"/);
  fs.rmSync(pfad);
});

test('parseVerkehrsmodul wirft Fehler bei malformed Optionen-Zeile', () => {
  assert.throws(() => {
    parseVerkehrsmodul(path.join(__dirname, 'fixtures', 'malformed-optionen.md'));
  }, /Malformed Optionen-Zeile/);
});
```

- [ ] **Step 3: Test ausführen, Fehlschlag bestätigen**

Run: `node --test scripts/verkehr-parser.test.js`
Expected: FAIL – `Cannot find module './verkehr-parser.js'`

- [ ] **Step 4: Parser implementieren**

`scripts/verkehr-parser.js`:

```js
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
```

- [ ] **Step 5: Test ausführen, Erfolg bestätigen**

Run: `node --test scripts/verkehr-parser.test.js`
Expected: PASS, alle 7 Tests grün

- [ ] **Step 6: Commit**

```bash
git add scripts/verkehr-parser.js scripts/verkehr-parser.test.js scripts/fixtures/test-verkehrsmodul.md scripts/fixtures/malformed-optionen.md
git commit -m "feat(verkehr): Parser für Verkehrsmodul-Dateien"
```

---

### Task 2: Prüfstand für Verkehrsmodule

**Files:**
- Create: `scripts/verkehr-pruefstand.js`
- Test: `scripts/verkehr-pruefstand.test.js`

**Interfaces:**
- Consumes: Modul-Objekt-Form aus Task 1 (`parseVerkehrsmodul`-Rückgabe)
- Produces: `validateVerkehrsmodul(modul) -> { valid: boolean, errors: string[] }`. Wird von Task 8 (`verkehr-build.js`) vor dem Rendern jedes Moduls aufgerufen.

- [ ] **Step 1: Failing Test schreiben**

`scripts/verkehr-pruefstand.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const { validateVerkehrsmodul } = require('./verkehr-pruefstand.js');

function gueltigesModul() {
  return {
    id: 1,
    titel: 'Testmodul',
    themenbereich: 'Test',
    einleitungDe: 'DE',
    einleitungEn: 'EN',
    regelDe: 'DE',
    regelEn: 'EN',
    aufgaben: [
      {
        titel: 'A1',
        bild: 'a1.webp',
        fragDe: 'DE?',
        fragEn: 'EN?',
        optionen: [
          { text: 'X', richtig: false },
          { text: 'Y', richtig: true },
        ],
        erklaerungDe: 'DE',
        erklaerungEn: 'EN',
      },
      {
        titel: 'A2',
        bild: 'a2.webp',
        fragDe: 'DE?',
        fragEn: 'EN?',
        optionen: [
          { text: 'X', richtig: true },
          { text: 'Y', richtig: false },
        ],
        erklaerungDe: 'DE',
        erklaerungEn: 'EN',
      },
    ],
  };
}

test('ein vollständiges Modul ist gültig', () => {
  assert.deepStrictEqual(validateVerkehrsmodul(gueltigesModul()), { valid: true, errors: [] });
});

test('fehlende einleitungDe wird gemeldet', () => {
  const modul = gueltigesModul();
  modul.einleitungDe = '';
  const result = validateVerkehrsmodul(modul);
  assert.strictEqual(result.valid, false);
  assert.match(result.errors.join(','), /einleitungDe fehlt/);
});

test('weniger als zwei Aufgaben wird gemeldet', () => {
  const modul = gueltigesModul();
  modul.aufgaben = [modul.aufgaben[0]];
  const result = validateVerkehrsmodul(modul);
  assert.match(result.errors.join(','), /zu wenige Aufgaben/);
});

test('null richtige Optionen werden gemeldet', () => {
  const modul = gueltigesModul();
  modul.aufgaben[0].optionen = [
    { text: 'X', richtig: false },
    { text: 'Y', richtig: false },
  ];
  const result = validateVerkehrsmodul(modul);
  assert.match(result.errors.join(','), /0 statt genau einer richtigen Option/);
});

test('zwei richtige Optionen werden gemeldet', () => {
  const modul = gueltigesModul();
  modul.aufgaben[0].optionen = [
    { text: 'X', richtig: true },
    { text: 'Y', richtig: true },
  ];
  const result = validateVerkehrsmodul(modul);
  assert.match(result.errors.join(','), /2 statt genau einer richtigen Option/);
});

test('weniger als zwei Optionen wird gemeldet', () => {
  const modul = gueltigesModul();
  modul.aufgaben[0].optionen = [{ text: 'X', richtig: true }];
  const result = validateVerkehrsmodul(modul);
  assert.match(result.errors.join(','), /weniger als zwei Optionen/);
});
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `node --test scripts/verkehr-pruefstand.test.js`
Expected: FAIL – `Cannot find module './verkehr-pruefstand.js'`

- [ ] **Step 3: Prüfstand implementieren**

`scripts/verkehr-pruefstand.js`:

```js
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
```

- [ ] **Step 4: Test ausführen, Erfolg bestätigen**

Run: `node --test scripts/verkehr-pruefstand.test.js`
Expected: PASS, alle 6 Tests grün

- [ ] **Step 5: Commit**

```bash
git add scripts/verkehr-pruefstand.js scripts/verkehr-pruefstand.test.js
git commit -m "feat(verkehr): Prüfstand für Verkehrsmodule"
```

---

### Task 3: Übungs-Auswertung

**Files:**
- Create: `scripts/verkehr-uebung.js`
- Test: `scripts/verkehr-uebung.test.js`

**Interfaces:**
- Produces: reine Funktion `istAntwortRichtig(ausgewaehlterIndex: number, richtigIndex: number) -> boolean`, dazu die DOM-Verdrahtung `registriereUebungen()` (nicht unit-testbar, analog zu `toggle.js`s `registriereUmschalter`). Das Markup, das diese Datei erwartet (`.optionen[data-richtig]`, `.option`, `.rueckmeldung`, `.erklaerung-feld`), wird in Task 4 vom Renderer erzeugt.

- [ ] **Step 1: Failing Test schreiben**

`scripts/verkehr-uebung.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const { istAntwortRichtig } = require('./verkehr-uebung.js');

test('richtig gewählter Index gilt als richtig', () => {
  assert.strictEqual(istAntwortRichtig(1, 1), true);
});

test('falsch gewählter Index gilt als falsch', () => {
  assert.strictEqual(istAntwortRichtig(0, 1), false);
});
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `node --test scripts/verkehr-uebung.test.js`
Expected: FAIL – `Cannot find module './verkehr-uebung.js'`

- [ ] **Step 3: Implementieren**

`scripts/verkehr-uebung.js`:

```js
// scripts/verkehr-uebung.js
//
// Wertet eine Multiple-Choice-Aufgabe sofort im Browser aus, ohne Server:
// richtig/falsch markieren, Erklärung aufdecken. Die Vergleichslogik steht
// in einer reinen Funktion (testbar ohne Browser), der Rest ist
// DOM-Verdrahtung nach dem Muster von toggle.js.

function istAntwortRichtig(ausgewaehlterIndex, richtigIndex) {
  return ausgewaehlterIndex === richtigIndex;
}

function werteAufgabeAus(formular) {
  const richtigIndex = Number(formular.dataset.richtig);
  const ausgewaehlt = formular.querySelector('input[type="radio"]:checked');
  if (!ausgewaehlt) return;

  const istRichtig = istAntwortRichtig(Number(ausgewaehlt.value), richtigIndex);

  formular.querySelectorAll('.option').forEach((label) => {
    label.classList.remove('option--richtig', 'option--falsch');
  });
  const gewaehlteLabel = ausgewaehlt.closest('.option');
  if (gewaehlteLabel) {
    gewaehlteLabel.classList.add(istRichtig ? 'option--richtig' : 'option--falsch');
  }

  const aufgabe = formular.closest('.aufgabe');
  if (!aufgabe) return;

  const rueckmeldung = aufgabe.querySelector('.rueckmeldung');
  if (rueckmeldung) {
    rueckmeldung.hidden = false;
    rueckmeldung.textContent = istRichtig
      ? 'Richtig!'
      : 'Das ist nicht richtig – lies die Erklärung unten.';
    rueckmeldung.classList.toggle('rueckmeldung--richtig', istRichtig);
    rueckmeldung.classList.toggle('rueckmeldung--falsch', !istRichtig);
  }

  const erklaerungFeld = aufgabe.querySelector('.erklaerung-feld');
  if (erklaerungFeld) erklaerungFeld.hidden = false;
}

function registriereUebungen() {
  document.querySelectorAll('.optionen').forEach((formular) => {
    formular.addEventListener('change', () => werteAufgabeAus(formular));
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { istAntwortRichtig };
} else {
  window.VerkehrUebung = { registriereUebungen };
  document.addEventListener('DOMContentLoaded', registriereUebungen);
}
```

- [ ] **Step 4: Test ausführen, Erfolg bestätigen**

Run: `node --test scripts/verkehr-uebung.test.js`
Expected: PASS, beide Tests grün

- [ ] **Step 5: Commit**

```bash
git add scripts/verkehr-uebung.js scripts/verkehr-uebung.test.js
git commit -m "feat(verkehr): Auswertung der Multiple-Choice-Aufgaben"
```

---

### Task 4: Renderer für Modulseiten

**Files:**
- Create: `scripts/verkehr-renderer.js`
- Test: `scripts/verkehr-renderer.test.js`

**Interfaces:**
- Consumes: `escapeHtml` aus `scripts/html.js`; Modul-Objekt aus Task 1; erwartet von `verkehr-uebung.js` (Task 3) die Klassen `.optionen[data-richtig]`, `.option`, `.rueckmeldung`, `.erklaerung-feld`; erwartet von `toggle.js` den Vertrag `.erklaerung` + `[data-sprache]` + `button.sprach-umschalter`
- Produces: `renderModulHtml(modul, versionen = {}) -> string` (volle HTML-Seite). `versionen` hat die Form `{css?: string, js?: string, uebung?: string}`. Aufgerufen von Task 8 (`verkehr-build.js`).

- [ ] **Step 1: Failing Test schreiben**

`scripts/verkehr-renderer.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const { renderModulHtml } = require('./verkehr-renderer.js');

const beispielModul = {
  id: 1,
  titel: 'Vorfahrt im Straßenverkehr',
  themenbereich: 'Vorfahrt',
  einleitungDe: 'Deutsche Einleitung.',
  einleitungEn: 'English intro.',
  regelDe: 'Deutsche Regel.',
  regelEn: 'English rule.',
  aufgaben: [
    {
      titel: 'Kreuzung ohne Schilder',
      bild: 'vorfahrt-kreuzung-ohne-schilder.webp',
      fragDe: 'Wer hat Vorfahrt?',
      fragEn: 'Who has the right of way?',
      optionen: [
        { text: 'Der Radfahrer von links', richtig: false },
        { text: 'Der Radfahrer von rechts', richtig: true },
      ],
      erklaerungDe: 'Rechts vor links.',
      erklaerungEn: 'Right before left.',
    },
  ],
};

test('renderModulHtml enthält Titel und Themenbereich', () => {
  const html = renderModulHtml(beispielModul);
  assert.match(html, /Vorfahrt im Straßenverkehr/);
  assert.match(html, /Vorfahrt<\/span>/);
});

test('renderModulHtml zeigt Deutsch sichtbar, Englisch versteckt', () => {
  const html = renderModulHtml(beispielModul);
  assert.match(html, /data-sprache="de">Deutsche Regel\.</);
  assert.match(html, /data-sprache="en" style="display:none">English rule\.</);
});

test('renderModulHtml markiert die richtige Option über data-richtig', () => {
  const html = renderModulHtml(beispielModul);
  assert.match(html, /data-richtig="1"/);
});

test('renderModulHtml bindet toggle.js und verkehr-uebung.js ein', () => {
  const html = renderModulHtml(beispielModul);
  assert.match(html, /<script src="toggle\.js">/);
  assert.match(html, /<script src="verkehr-uebung\.js">/);
});

test('renderModulHtml escaped Optionstexte', () => {
  const modulMitSonderzeichen = {
    ...beispielModul,
    aufgaben: [
      {
        ...beispielModul.aufgaben[0],
        optionen: [{ text: 'A < B', richtig: true }],
      },
    ],
  };
  const html = renderModulHtml(modulMitSonderzeichen);
  assert.match(html, /A &lt; B/);
});
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `node --test scripts/verkehr-renderer.test.js`
Expected: FAIL – `Cannot find module './verkehr-renderer.js'`

- [ ] **Step 3: Renderer implementieren**

`scripts/verkehr-renderer.js`:

```js
// scripts/verkehr-renderer.js
const { escapeHtml } = require('./html.js');

const ZURUECK_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H6"/><path d="m12 19-7-7 7-7"/></svg>`;

/** Hängt eine kurze Prüfsumme an Stylesheet/Skript, siehe verkehr-build.js. */
function mitVersion(datei, version) {
  return version ? `${datei}?v=${version}` : datei;
}

/**
 * Baut eine zweisprachige Box: Deutsch sichtbar, Englisch hinter dem
 * Umschalter. Der Vertrag (Klasse "erklaerung", [data-sprache],
 * button.sprach-umschalter) kommt unverändert aus toggle.js.
 */
function renderErklaerungsbox(textDe, textEn, zusatzklasse = '') {
  return `<div class="erklaerung${zusatzklasse ? ` ${zusatzklasse}` : ''}">
  <p class="erklaerung-text" data-sprache="de">${textDe}</p>
  <p class="erklaerung-text" data-sprache="en" style="display:none">${textEn}</p>
  <button class="sprach-umschalter" aria-pressed="false">Verstehst du das nicht? Hier auf Englisch</button>
</div>`;
}

function renderAufgabe(aufgabe, index) {
  const richtigIndex = aufgabe.optionen.findIndex((option) => option.richtig);
  const optionenHtml = aufgabe.optionen
    .map(
      (option, i) => `    <label class="option">
      <input type="radio" name="aufgabe-${index}" value="${i}">
      <span>${escapeHtml(option.text)}</span>
    </label>`
    )
    .join('\n');

  return `<section class="aufgabe">
  <h3>${escapeHtml(aufgabe.titel)}</h3>
  <div class="aufgabe-bild">
    <img src="bilder/${aufgabe.bild}" alt="Verkehrssituation: ${escapeHtml(aufgabe.titel)}" width="720" height="480" loading="lazy" decoding="async">
  </div>
  ${renderErklaerungsbox(aufgabe.fragDe, aufgabe.fragEn, 'erklaerung--frage')}
  <form class="optionen" data-richtig="${richtigIndex}">
${optionenHtml}
  </form>
  <p class="rueckmeldung" hidden></p>
  <div class="erklaerung-feld" hidden>
    ${renderErklaerungsbox(aufgabe.erklaerungDe, aufgabe.erklaerungEn)}
  </div>
</section>`;
}

/**
 * @param {object} modul  Ergebnis von parseVerkehrsmodul()
 * @param {{css?: string, js?: string, uebung?: string}} [versionen]
 */
function renderModulHtml(modul, versionen = {}) {
  const aufgabenHtml = modul.aufgaben.map((aufgabe, i) => renderAufgabe(aufgabe, i)).join('\n\n');

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(modul.titel)} – Sicher Rad fahren</title>
<link rel="stylesheet" href="${mitVersion('styles.css', versionen.css)}">
</head>
<body>
<header class="kopfzeile">
  <a class="zurueck" href="index.html">${ZURUECK_ICON}<span>Alle Module</span></a>
  <span class="kopf-hinweis">${escapeHtml(modul.themenbereich)}</span>
</header>
<main class="modul">
<h1>${escapeHtml(modul.titel)}</h1>

${renderErklaerungsbox(modul.einleitungDe, modul.einleitungEn, 'erklaerung--einleitung')}

<section class="block block--regel">
<h2>Die Regel</h2>
${renderErklaerungsbox(modul.regelDe, modul.regelEn)}
</section>

<section class="block block--aufgaben">
<h2>Teste dich selbst</h2>
${aufgabenHtml}
</section>

<p class="modul-fuss"><a class="zurueck" href="index.html">${ZURUECK_ICON}<span>Alle Module in der Übersicht</span></a></p>
</main>
<script src="${mitVersion('toggle.js', versionen.js)}"></script>
<script src="${mitVersion('verkehr-uebung.js', versionen.uebung)}"></script>
</body>
</html>`;
}

module.exports = { renderModulHtml, renderAufgabe, mitVersion, ZURUECK_ICON };
```

- [ ] **Step 4: Test ausführen, Erfolg bestätigen**

Run: `node --test scripts/verkehr-renderer.test.js`
Expected: PASS, alle 5 Tests grün

- [ ] **Step 5: Commit**

```bash
git add scripts/verkehr-renderer.js scripts/verkehr-renderer.test.js
git commit -m "feat(verkehr): Renderer für Modulseiten"
```

---

### Task 5: Startseite des Verkehrsbereichs

**Files:**
- Create: `scripts/verkehr-startseite.js`
- Test: `scripts/verkehr-startseite.test.js`

**Interfaces:**
- Consumes: `escapeHtml` aus `scripts/html.js`; Übersichtsliste `[{id, titel, themenbereich, akzent}]` (Form von `verkehr/module/uebersicht.json`, siehe Task 8); `gebautNachId: Map<number, {titel, themenbereich, dateiname}>`
- Produces: `renderVerkehrStartseiteHtml(uebersicht, gebautNachId, versionen = {}) -> string`. Aufgerufen von Task 8.

- [ ] **Step 1: Failing Test schreiben**

`scripts/verkehr-startseite.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const { renderVerkehrStartseiteHtml } = require('./verkehr-startseite.js');

const uebersicht = [
  { id: 1, titel: 'Vorfahrt im Straßenverkehr', themenbereich: 'Vorfahrt', akzent: '#FFE3B3' },
  { id: 2, titel: 'Verkehrsschilder und Fahrradwege', themenbereich: 'Schilder', akzent: '#CFE8FF' },
];

test('fertige Module werden verlinkt, unfertige als "in Arbeit" markiert', () => {
  const gebaut = new Map([
    [1, { titel: 'Vorfahrt im Straßenverkehr', themenbereich: 'Vorfahrt', dateiname: 'modul-01.html' }],
  ]);
  const html = renderVerkehrStartseiteHtml(uebersicht, gebaut);
  assert.match(html, /<a class="karte karte--offen" href="modul-01\.html">/);
  assert.match(html, /in Arbeit/);
});

test('der Stand-Text zählt fertige von geplanten Modulen', () => {
  const gebaut = new Map([[1, { titel: 'X', themenbereich: 'Y', dateiname: 'modul-01.html' }]]);
  const html = renderVerkehrStartseiteHtml(uebersicht, gebaut);
  assert.match(html, /1 von 2 ist fertig/);
});

test('ohne fertige Module bleibt die Karte unverlinkt', () => {
  const html = renderVerkehrStartseiteHtml(uebersicht, new Map());
  assert.doesNotMatch(html, /karte--offen/);
});
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `node --test scripts/verkehr-startseite.test.js`
Expected: FAIL – `Cannot find module './verkehr-startseite.js'`

- [ ] **Step 3: Implementieren**

`scripts/verkehr-startseite.js`:

```js
// scripts/verkehr-startseite.js
//
// Baut die Übersichtsseite des Verkehrsbereichs: ein Raster mit allen
// geplanten Modulen. Anders als beim Sprachkurs gibt es keine Reihenfolge,
// die eingehalten werden muss – jede Karte verlinkt direkt, sobald das
// Modul fertig ist.
const { escapeHtml } = require('./html.js');

const PFEIL_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13"/><path d="m12 5 7 7-7 7"/></svg>`;

function renderModulKarte(eintrag, gebaut) {
  const inneres = `
  <div class="karte-kopf" style="background:${eintrag.akzent}">
    <span class="karte-nummer">${eintrag.id}</span>
    <span class="karte-thema">${escapeHtml(eintrag.themenbereich)}</span>
  </div>
  <h3 class="karte-titel">${escapeHtml(eintrag.titel)}</h3>
  ${gebaut ? `<span class="karte-pfeil">${PFEIL_ICON}</span>` : '<span class="karte-status">in Arbeit</span>'}`;

  if (gebaut) {
    return `<li><a class="karte karte--offen" href="${gebaut.dateiname}">${inneres}
</a></li>`;
  }
  return `<li><div class="karte karte--bald" aria-disabled="true">${inneres}
</div></li>`;
}

/**
 * @param {Array<{id:number,titel:string,themenbereich:string,akzent:string}>} uebersicht
 *   verkehr/module/uebersicht.json – bei fertigen Modulen überschreibt
 *   verkehr-build.js Titel/Themenbereich mit dem Inhalt der echten
 *   Modul-Datei, die JSON-Datei liefert nur die Vorschau für unfertige.
 * @param {Map<number, {titel: string, themenbereich: string, dateiname: string}>} gebautNachId
 * @param {{css?: string}} [versionen]
 */
function renderVerkehrStartseiteHtml(uebersicht, gebautNachId, versionen = {}) {
  const stylesheet = versionen.css ? `styles.css?v=${versionen.css}` : 'styles.css';
  const anzahlFertig = gebautNachId.size;
  const karten = uebersicht
    .map((eintrag) => renderModulKarte(eintrag, gebautNachId.get(eintrag.id)))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sicher Rad fahren – Verkehrsregeln für Au-Pairs</title>
<meta name="description" content="Verkehrsregeln fürs Fahrrad in Deutschland, erklärt mit Bildern und Beispielen – für Au-Pairs, die mit dem Rad unterwegs sind.">
<link rel="stylesheet" href="${stylesheet}">
</head>
<body class="startseite">
<header class="kopfzeile">
  <span class="wortmarke">Sicher Rad fahren</span>
  <span class="kopf-hinweis">Verkehrsregeln für Au-Pairs</span>
</header>
<main>

<section class="hero">
  <div class="hero-text">
    <p class="augenbraue">Fürs Fahrrad in Deutschland</p>
    <h1>Verkehrsregeln, die wirklich zählen</h1>
    <p class="hero-fliess">Kurze, unabhängige Module zu Vorfahrt, Schildern, Ampeln und Sicherheit. Jedes Modul zeigt echte Verkehrssituationen als Bild – schätz selbst ein, wer Vorfahrt hat, dann kommt die Erklärung.</p>
    <p class="hero-kleingedruckt">Kein Konto, keine Anmeldung. Du kannst mit jedem Modul anfangen, das dich interessiert.</p>
  </div>
</section>

<section class="uebersicht" id="module">
  <div class="uebersicht-kopf">
    <h2>Die Module</h2>
    <p class="uebersicht-stand">${anzahlFertig} von ${uebersicht.length} ${anzahlFertig === 1 ? 'ist fertig' : 'sind fertig'}, der Rest kommt nach und nach.</p>
  </div>
  <ul class="karten">
${karten}
  </ul>
</section>

</main>
</body>
</html>`;
}

module.exports = { renderVerkehrStartseiteHtml, renderModulKarte };
```

- [ ] **Step 4: Test ausführen, Erfolg bestätigen**

Run: `node --test scripts/verkehr-startseite.test.js`
Expected: PASS, alle 3 Tests grün

- [ ] **Step 5: Commit**

```bash
git add scripts/verkehr-startseite.js scripts/verkehr-startseite.test.js
git commit -m "feat(verkehr): Übersichtsseite mit Modulkarten"
```

---

### Task 6: Eigenes Stylesheet

**Files:**
- Create: `scripts/verkehr-styles.css`

**Interfaces:**
- Konsument: Task 8 (`verkehr-build.js`) kopiert diese Datei nach `dist/verkehr/styles.css`. Erwartet die Klassennamen aus Task 4/5: `.kopfzeile`, `.zurueck`, `.hero*`, `.uebersicht*`, `.karte*`, `.erklaerung`, `.erklaerung-text`, `.sprach-umschalter`, `.block`, `.aufgabe*`, `.optionen`, `.option`, `.option--richtig`, `.option--falsch`, `.rueckmeldung`, `.rueckmeldung--richtig`, `.rueckmeldung--falsch`, `.erklaerung-feld`.

Keine automatisierte Prüfung (CSS ist hier wie beim Sprachkurs nicht unit-getestet) – die Sichtkontrolle erfolgt in Task 10, wenn die Seite erstmals im Browser geöffnet wird.

- [ ] **Step 1: Stylesheet schreiben**

`scripts/verkehr-styles.css`:

```css
/* Sicher Rad fahren — Stylesheet für Modulübersicht und Modulseiten.
   Eigenständige Optik, bewusst kein Bezug zur Mira-Palette des
   Sprachkurses. Ausgangspunkt: Verkehrsschild-Farben (Vorfahrtsgelb,
   Verkehrsblau), dazu Grün/Rot für die Richtig/Falsch-Rückmeldung.
   Keine externen Schriften, keine Netzwerk-Aufrufe: System-Schriftstapel. */

:root {
  --grund: #F4F7FB;
  --karte: #FFFFFF;

  --text: #1F2A33;
  --text-sanft: #45545F;
  --text-leise: #5C6B76;

  --primaer: #1C4E80;
  --primaer-dunkel: #15395E;
  --gelb-hell: #FFE9B3;
  --blau-hell: #D9E8F7;
  --violett-hell: #E6DCF5;

  --richtig: #2E7D32;
  --richtig-hell: #E3F3E3;
  --falsch: #C62828;
  --falsch-hell: #FBE4E4;

  --linie: rgba(31, 42, 51, 0.12);
  --linie-zart: rgba(31, 42, 51, 0.07);
  --schatten: 0 1px 2px rgba(31, 42, 51, 0.05), 0 8px 24px -14px rgba(31, 42, 51, 0.35);

  --radius: 1rem;
  --radius-gross: 1.4rem;
}

*, *::before, *::after { box-sizing: border-box; }

html { font-size: 100%; scroll-behavior: smooth; }

body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: var(--text);
  background: var(--grund);
}

img { display: block; max-width: 100%; height: auto; }
a { color: inherit; }
:focus-visible { outline: 3px solid var(--text); outline-offset: 3px; border-radius: 4px; }

.kopfzeile {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem clamp(1rem, 4vw, 2.5rem);
  background: rgba(244, 247, 251, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--linie-zart);
}

.wortmarke { font-weight: 700; letter-spacing: -0.01em; }

.kopf-hinweis {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-leise);
}

.zurueck {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  color: var(--primaer);
}

main { max-width: 56rem; margin: 0 auto; padding: 0 clamp(1rem, 4vw, 2.5rem) 4rem; }

/* Startseite */

.hero { padding: 3rem 0 2rem; }
.augenbraue {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primaer);
  margin: 0 0 0.5rem;
}
.hero h1 { font-size: clamp(1.8rem, 4vw, 2.6rem); margin: 0 0 1rem; }
.hero-fliess { color: var(--text-sanft); max-width: 42rem; }
.hero-kleingedruckt { font-size: 0.85rem; color: var(--text-leise); }

.uebersicht-kopf { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.5rem; margin-bottom: 1.25rem; }
.uebersicht-stand { color: var(--text-leise); font-size: 0.9rem; margin: 0; }

.karten {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 1rem;
}

.karte {
  display: block;
  background: var(--karte);
  border-radius: var(--radius-gross);
  box-shadow: var(--schatten);
  padding: 1.25rem;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease;
}
.karte--offen:hover { transform: translateY(-2px); }
.karte--bald { opacity: 0.6; cursor: default; }

.karte-kopf {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border-radius: calc(var(--radius) - 0.2rem);
  padding: 0.4rem 0.7rem;
  margin-bottom: 0.75rem;
  width: fit-content;
}
.karte-nummer { font-weight: 700; }
.karte-thema { font-size: 0.8rem; font-weight: 600; }
.karte-titel { margin: 0 0 0.5rem; font-size: 1.05rem; }
.karte-status { font-size: 0.75rem; color: var(--text-leise); }
.karte-pfeil { color: var(--primaer); }

/* Modulseite */

.modul h1 { margin-top: 1.5rem; }

.erklaerung {
  background: var(--karte);
  border-radius: var(--radius);
  padding: 1rem 1.25rem;
  box-shadow: var(--schatten);
  margin: 1rem 0;
}
.erklaerung-text { margin: 0; white-space: pre-line; }
.sprach-umschalter {
  margin-top: 0.75rem;
  border: none;
  background: var(--blau-hell);
  color: var(--primaer-dunkel);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  cursor: pointer;
}

.block { margin: 2rem 0; }
.block h2 { margin-bottom: 0.75rem; }

.aufgabe {
  background: var(--karte);
  border-radius: var(--radius-gross);
  box-shadow: var(--schatten);
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}
.aufgabe h3 { margin-top: 0; }
.aufgabe-bild { border-radius: var(--radius); overflow: hidden; margin-bottom: 1rem; }
.aufgabe-bild img { width: 100%; }

.erklaerung--frage { background: var(--gelb-hell); box-shadow: none; }

.optionen { display: flex; flex-direction: column; gap: 0.6rem; margin: 1rem 0; }
.option {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--linie);
  border-radius: var(--radius);
  cursor: pointer;
}
.option input { accent-color: var(--primaer); }
.option--richtig { border-color: var(--richtig); background: var(--richtig-hell); }
.option--falsch { border-color: var(--falsch); background: var(--falsch-hell); }

.rueckmeldung {
  font-weight: 700;
  padding: 0.6rem 0.9rem;
  border-radius: var(--radius);
  margin: 0 0 1rem;
}
.rueckmeldung--richtig { background: var(--richtig-hell); color: var(--richtig); }
.rueckmeldung--falsch { background: var(--falsch-hell); color: var(--falsch); }

.erklaerung-feld .erklaerung { background: var(--violett-hell); box-shadow: none; }

.modul-fuss { margin-top: 2rem; }

@media (max-width: 40rem) {
  main { padding-left: 1rem; padding-right: 1rem; }
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/verkehr-styles.css
git commit -m "feat(verkehr): eigenes Stylesheet"
```

---

### Task 7: Bildnachbearbeitung

**Files:**
- Create: `scripts/verkehr-bilder-aufbereiten.js`

**Interfaces:**
- Liest: alle Bilddateien aus `verkehr/bildkarten-quelle/`
- Schreibt: gleichnamige `.webp`-Dateien (720×480) nach `verkehr/bilder/`
- Kein Test (wie `scripts/bilder-aufbereiten.js` im Sprachkurs nicht unit-getestet – die Prüfung ist das tatsächliche Ausführen mit `ffmpeg`, siehe Task 9)

- [ ] **Step 1: Skript schreiben**

`scripts/verkehr-bilder-aufbereiten.js`:

```js
// scripts/verkehr-bilder-aufbereiten.js
//
// Verkleinert die KI-generierten Rohbilder aus verkehr/bildkarten-quelle/
// auf Web-Größe (720x480, WebP) und schreibt sie nach verkehr/bilder/.
//
// Anders als beim Sprachkurs gibt es hier keine Nummerierungs-Verwirrung:
// Rohbild und Zieldatei tragen von Anfang an denselben Namen, weil jedes
// Bild einzeln für genau eine Aufgabe erzeugt und so benannt wird.
//
//   node scripts/verkehr-bilder-aufbereiten.js
//
// Braucht ffmpeg im PATH. Läuft nicht im Build – verkehr/bilder/ ist
// eingecheckt, der Build kopiert die Dateien nur noch.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const WURZEL = path.join(__dirname, '..', 'verkehr');
const QUELLE = path.join(WURZEL, 'bildkarten-quelle');
const ZIEL = path.join(WURZEL, 'bilder');

const BREITE = 720;
const HOEHE = 480;

function ffmpeg(args) {
  return execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { maxBuffer: 1024 * 1024 * 256 });
}

function kb(datei) {
  return Math.round(fs.statSync(datei).size / 1024);
}

function main() {
  if (!fs.existsSync(QUELLE)) {
    throw new Error(`Quellordner fehlt: ${QUELLE}`);
  }
  fs.mkdirSync(ZIEL, { recursive: true });

  const dateien = fs.readdirSync(QUELLE).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  if (dateien.length === 0) {
    console.warn('Keine Rohbilder in verkehr/bildkarten-quelle/ gefunden.');
    return;
  }

  for (const name of dateien) {
    const quelle = path.join(QUELLE, name);
    const zielName = name.replace(/\.(png|jpe?g)$/i, '.webp');
    const ziel = path.join(ZIEL, zielName);
    ffmpeg([
      '-i', quelle,
      '-vf', `scale=${BREITE}:${HOEHE}:flags=lanczos`,
      '-c:v', 'libwebp', '-lossless', '0', '-q:v', '82', '-compression_level', '6',
      '-frames:v', '1',
      ziel,
    ]);
    console.log(`${zielName}  ${kb(quelle)} kB -> ${kb(ziel)} kB`);
  }
  console.log('Fertig.');
}

main();
```

- [ ] **Step 2: Commit**

```bash
git add scripts/verkehr-bilder-aufbereiten.js
git commit -m "feat(verkehr): Bildnachbearbeitung (Verkleinern, WebP)"
```

---

### Task 8: Build-Skript, Modul-1-Inhalt und Übersicht

**Files:**
- Create: `scripts/verkehr-build.js`
- Create: `verkehr/module/01-vorfahrt.md`
- Create: `verkehr/module/uebersicht.json`

**Interfaces:**
- Consumes: `parseVerkehrsmodul` (Task 1), `validateVerkehrsmodul` (Task 2), `renderModulHtml` (Task 4), `renderVerkehrStartseiteHtml` (Task 5), `scripts/toggle.js`, `scripts/verkehr-uebung.js` (Task 3), `scripts/verkehr-styles.css` (Task 6)
- Produces: `dist/verkehr/index.html`, `dist/verkehr/modul-01.html`, `dist/verkehr/toggle.js`, `dist/verkehr/verkehr-uebung.js`, `dist/verkehr/styles.css`, `dist/verkehr/bilder/*`

Kein eigener Test für `verkehr-build.js` – wie beim Sprachkurs (`build.js` hat ebenfalls keine Testdatei) ist die Prüfung das tatsächliche Ausführen plus die bereits getesteten Bausteine, die es nur verdrahtet.

- [ ] **Step 1: Übersicht schreiben**

`verkehr/module/uebersicht.json`:

```json
[
  { "id": 1, "titel": "Vorfahrt im Straßenverkehr", "themenbereich": "Vorfahrt", "akzent": "#FFE3B3" },
  { "id": 2, "titel": "Verkehrsschilder und Fahrradwege", "themenbereich": "Schilder", "akzent": "#CFE8FF" },
  { "id": 3, "titel": "Ampeln, Fußgängerüberwege, Abbiegen", "themenbereich": "Ampeln", "akzent": "#D9F2D9" },
  { "id": 4, "titel": "Sicherheit und Kindertransport", "themenbereich": "Sicherheit", "akzent": "#E6DCF5" }
]
```

- [ ] **Step 2: Modul-1-Inhalt schreiben**

`verkehr/module/01-vorfahrt.md`:

```markdown
---
id: 1
titel: "Vorfahrt im Straßenverkehr"
themenbereich: "Vorfahrt"
typ: verkehrsmodul
---

## Einleitung Deutsch

In diesem Modul lernst du, wer in typischen Verkehrssituationen zuerst fahren darf. Diese Regeln gelten für dich mit dem Fahrrad genauso wie für Autos – als Radfahrerin oder Radfahrer bist du ein vollwertiger Teil des Straßenverkehrs.

## Einleitung Englisch

In this module you learn who gets to go first in typical traffic situations. These rules apply to you on a bicycle just as much as to cars – as a cyclist, you are a full participant in road traffic.

## Regel Deutsch

Grundregel: "Rechts vor links". An Kreuzungen ohne Vorfahrtsschilder und ohne Ampel hat immer das Fahrzeug Vorfahrt, das von rechts kommt. Das gilt auch für Fahrräder.

Zwei wichtige Ausnahmen:
- Ein gelbes Rautenschild (Vorfahrtsstraße) bedeutet: Du hast Vorfahrt vor allen, die aus einer Seitenstraße kommen, egal ob von rechts oder links.
- Ein rotes Schild mit weißer Spitze nach unten ("Vorfahrt gewähren") oder ein Stoppschild bedeutet: Du musst andere zuerst fahren lassen.

Im Kreisverkehr hat grundsätzlich der Verkehr, der sich schon im Kreis befindet, Vorfahrt vor dem, der einfahren möchte.

## Regel Englisch

Basic rule: "right before left". At intersections without priority signs and without traffic lights, the vehicle coming from the right always has the right of way. This applies to bicycles too.

Two important exceptions:
- A yellow diamond sign (priority road) means: you have the right of way over anyone coming from a side street, regardless of whether they are on your right or left.
- A red sign with a white triangle pointing down ("yield") or a stop sign means: you must let others go first.

In a roundabout, traffic that is already inside the circle generally has the right of way over traffic that wants to enter.

## Aufgabe: Kreuzung ohne Schilder

### Bild

vorfahrt-kreuzung-ohne-schilder.webp

### Frage Deutsch

Du fährst mit dem Fahrrad auf eine Kreuzung zu. Es gibt keine Schilder und keine Ampel. Von rechts kommt ein Auto. Wer hat Vorfahrt?

### Frage Englisch

You're cycling toward an intersection. There are no signs and no traffic light. A car is approaching from your right. Who has the right of way?

### Optionen

- [ ] Du, weil du zuerst an der Kreuzung warst
- [x] Das Auto, weil es von rechts kommt
- [ ] Niemand, ihr müsst euch gegenseitig durchwinken

### Erklärung Deutsch

An Kreuzungen ohne Schilder oder Ampel gilt "rechts vor links" – für alle Fahrzeuge, auch für Fahrräder. Das Auto kommt von rechts, also hat es Vorfahrt. Du musst es zuerst fahren lassen, egal wer zuerst an der Kreuzung war.

### Erklärung Englisch

At intersections without signs or traffic lights, "right before left" applies – to all vehicles, including bicycles. The car is coming from your right, so it has the right of way. You must let it go first, no matter who reached the intersection first.

## Aufgabe: Vorfahrtsstraße

### Bild

vorfahrt-vorfahrtsstrasse-schild.webp

### Frage Deutsch

Du fährst auf einer Straße mit diesem gelben Rautenschild. Aus einer Seitenstraße ohne eigenes Schild kommt ein anderer Radfahrer. Wer hat Vorfahrt?

### Frage Englisch

You're riding on a street marked with this yellow diamond sign. Another cyclist is approaching from a side street with no sign of its own. Who has the right of way?

### Optionen

- [x] Du, weil du auf der Vorfahrtsstraße fährst
- [ ] Der Radfahrer aus der Seitenstraße
- [ ] Ihr müsst beide anhalten und euch verständigen

### Erklärung Deutsch

Das gelbe Rautenschild markiert eine Vorfahrtsstraße. Wer darauf fährt, hat Vorfahrt vor allen, die aus einer Seitenstraße einbiegen wollen – unabhängig davon, ob diese von rechts oder links kommen. Das gilt so lange, bis ein weiteres Schild die Vorfahrtsstraße wieder aufhebt.

### Erklärung Englisch

The yellow diamond sign marks a priority road. Whoever is riding on it has the right of way over anyone turning in from a side street – regardless of whether they come from the right or the left. This stays in effect until another sign cancels the priority road.

## Aufgabe: Kreisverkehr

### Bild

vorfahrt-kreisverkehr.webp

### Frage Deutsch

Du willst mit dem Fahrrad in einen Kreisverkehr einfahren. Von links kommt ein Auto, das schon im Kreisverkehr fährt. Wer hat Vorfahrt?

### Frage Englisch

You want to cycle into a roundabout. A car is approaching from your left, already driving inside the roundabout. Who has the right of way?

### Optionen

- [ ] Du, weil Fahrräder im Kreisverkehr immer Vorfahrt haben
- [x] Das Auto, weil es sich schon im Kreisverkehr befindet
- [ ] Wer zuerst hupt oder klingelt

### Erklärung Deutsch

Im Kreisverkehr hat der Verkehr, der sich bereits im Kreis befindet, grundsätzlich Vorfahrt vor dem, der einfahren möchte. Das zeigt das Schild mit den drei Pfeilen im Kreis am Eingang an. Das gilt auch für dich mit dem Fahrrad: Du musst warten, bis eine Lücke frei ist, bevor du einfährst.

### Erklärung Englisch

In a roundabout, traffic that is already inside the circle generally has the right of way over traffic that wants to enter. This is indicated by the sign with three arrows in a circle at the entrance. This applies to you on a bicycle too: you must wait for a gap before entering.
```

- [ ] **Step 3: Build-Skript schreiben**

`scripts/verkehr-build.js`:

```js
// scripts/verkehr-build.js
//
// Baut den Verkehrsregeln-Bereich (verkehr/) zu statischem HTML. Eigene,
// schlanke Pipeline neben der des Sprachkurses: Module sind unabhängig
// voneinander (keine Kette wie Lektion/Wiederholung), deshalb kommt hier
// keine Stationen-Logik zum Einsatz.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseVerkehrsmodul } = require('./verkehr-parser.js');
const { validateVerkehrsmodul } = require('./verkehr-pruefstand.js');
const { renderModulHtml } = require('./verkehr-renderer.js');
const { renderVerkehrStartseiteHtml } = require('./verkehr-startseite.js');

function kurzpruefsumme(datei) {
  return crypto.createHash('sha1').update(fs.readFileSync(datei)).digest('hex').slice(0, 10);
}

function dateinameFuer(id) {
  return `modul-${String(id).padStart(2, '0')}.html`;
}

function main() {
  const wurzel = path.join(__dirname, '..', 'verkehr');
  const modulDir = path.join(wurzel, 'module');
  const bilderDir = path.join(wurzel, 'bilder');
  const distDir = path.join(__dirname, '..', 'dist', 'verkehr');

  fs.mkdirSync(distDir, { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'toggle.js'), path.join(distDir, 'toggle.js'));
  fs.copyFileSync(path.join(__dirname, 'verkehr-uebung.js'), path.join(distDir, 'verkehr-uebung.js'));
  fs.copyFileSync(path.join(__dirname, 'verkehr-styles.css'), path.join(distDir, 'styles.css'));

  const versionen = {
    css: kurzpruefsumme(path.join(__dirname, 'verkehr-styles.css')),
    js: kurzpruefsumme(path.join(__dirname, 'toggle.js')),
    uebung: kurzpruefsumme(path.join(__dirname, 'verkehr-uebung.js')),
  };

  if (fs.existsSync(bilderDir)) {
    fs.cpSync(bilderDir, path.join(distDir, 'bilder'), { recursive: true });
  } else {
    console.warn('Warnung: Ordner verkehr/bilder/ fehlt, Module werden ohne Bilder gebaut');
  }

  const uebersicht = JSON.parse(fs.readFileSync(path.join(modulDir, 'uebersicht.json'), 'utf8'));

  const dateien = fs.existsSync(modulDir)
    ? fs.readdirSync(modulDir).filter((f) => f.endsWith('.md'))
    : [];

  const module_ = [];
  for (const datei of dateien) {
    const modul = parseVerkehrsmodul(path.join(modulDir, datei));
    const result = validateVerkehrsmodul(modul);
    if (!result.valid) {
      throw new Error(`${datei} ist ungültig: ${result.errors.join(', ')}`);
    }
    for (const aufgabe of modul.aufgaben) {
      if (aufgabe.bild && !fs.existsSync(path.join(bilderDir, aufgabe.bild))) {
        console.warn(
          `Warnung: Modul ${modul.id}, Aufgabe "${aufgabe.titel}" hat kein Bild "${aufgabe.bild}" in verkehr/bilder/`
        );
      }
    }
    module_.push(modul);
  }
  module_.sort((a, b) => a.id - b.id);

  const gebautNachId = new Map();
  for (const modul of module_) {
    const html = renderModulHtml(modul, versionen);
    const dateiname = dateinameFuer(modul.id);
    fs.writeFileSync(path.join(distDir, dateiname), html);
    gebautNachId.set(modul.id, { titel: modul.titel, themenbereich: modul.themenbereich, dateiname });
  }

  // Fertige Module überschreiben Titel/Themenbereich der Vorschau aus
  // uebersicht.json, damit die Modul-Datei die Wahrheit ist und die
  // JSON-Datei nur Vorschautext für noch nicht geschriebene Module liefert
  // (gleiches Muster wie bei der Sprachkurs-Startseite).
  const uebersichtMitStand = uebersicht.map((eintrag) => {
    const fertig = gebautNachId.get(eintrag.id);
    return fertig ? { ...eintrag, titel: fertig.titel, themenbereich: fertig.themenbereich } : eintrag;
  });

  fs.writeFileSync(
    path.join(distDir, 'index.html'),
    renderVerkehrStartseiteHtml(uebersichtMitStand, gebautNachId, versionen)
  );

  console.log(`Verkehr-Build fertig: ${module_.length} von ${uebersicht.length} Modul(en) in dist/verkehr/`);
}

main();
```

- [ ] **Step 4: Prüfstand und Build ausführen**

Run: `node scripts/verkehr-pruefstand.js`
Expected: `01-vorfahrt.md: OK`, Exit-Code 0

Run: `node scripts/verkehr-build.js`
Expected: Ausgabe enthält drei Zeilen `Warnung: Modul 1, Aufgabe "..." hat kein Bild "..." in verkehr/bilder/` (die Bilder kommen erst in Task 9), danach `Verkehr-Build fertig: 1 von 4 Modul(en) in dist/verkehr/`

- [ ] **Step 5: Ergebnis stichprobenartig prüfen**

Run (PowerShell oder Bash, je nach Umgebung):

```bash
test -f dist/verkehr/index.html && test -f dist/verkehr/modul-01.html && echo "beide Dateien vorhanden"
grep -c "Vorfahrt im Straßenverkehr" dist/verkehr/modul-01.html
grep -c "in Arbeit" dist/verkehr/index.html
```

Expected: "beide Dateien vorhanden", mindestens ein Treffer für den Titel, mindestens drei Treffer für "in Arbeit" (Module 2–4 sind noch nicht geschrieben)

- [ ] **Step 6: Commit**

```bash
git add scripts/verkehr-build.js verkehr/module/01-vorfahrt.md verkehr/module/uebersicht.json
git commit -m "feat(verkehr): Build-Skript und Inhalt von Modul 1 (Vorfahrt)"
```

---

### Task 9: Bildgenerierung für Modul 1

**Files:**
- Create: `verkehr/bildkarten-quelle/vorfahrt-kreuzung-ohne-schilder.png` (o. ä., Rohbild, nicht eingecheckt)
- Create: `verkehr/bildkarten-quelle/vorfahrt-vorfahrtsstrasse-schild.png`
- Create: `verkehr/bildkarten-quelle/vorfahrt-kreisverkehr.png`
- Create: `verkehr/bilder/vorfahrt-kreuzung-ohne-schilder.webp` (eingecheckt, Ergebnis von Task 7)
- Create: `verkehr/bilder/vorfahrt-vorfahrtsstrasse-schild.webp`
- Create: `verkehr/bilder/vorfahrt-kreisverkehr.webp`

**Interfaces:**
- Konsument: `verkehr-build.js` (Task 8) erwartet die drei Dateinamen `vorfahrt-kreuzung-ohne-schilder.webp`, `vorfahrt-vorfahrtsstrasse-schild.webp`, `vorfahrt-kreisverkehr.webp` in `verkehr/bilder/` – exakt die Namen, die in den `### Bild`-Abschnitten von `verkehr/module/01-vorfahrt.md` stehen.

**Dies ist der einzige Schritt im Plan, der echtes Geld kostet (Bild-Credits bei kie.ai) und deshalb eine kurze Rückfrage bei Andreas braucht, bevor Bilder erzeugt werden – alles andere in diesem Plan läuft ohne Rückfrage durch.**

- [ ] **Step 1: Stil-Baustein und Szenen-Prompts festlegen**

Fester Stil-Baustein, der in jeden der drei Prompts eingesetzt wird (Englisch, wie bei Bild-/Video-Prompts gegenüber kie.ai üblich):

```
STIL = "Flat vector illustration, slightly elevated three-quarter top-down
view of a German street scene, clean geometric shapes, muted warm pastel
color palette (soft blue sky, light gray asphalt, warm cream buildings),
soft flat shadows, no text or logos anywhere in the image, 4:3 aspect
ratio, friendly educational diagram style similar to a modern
driving-school illustration."
```

Drei Szenen:

1. `vorfahrt-kreuzung-ohne-schilder`: "A cyclist on a city street approaches an intersection with no traffic signs or lights. A car is approaching the same intersection from the cyclist's right side. Clear sense of two paths about to cross."
2. `vorfahrt-vorfahrtsstrasse-schild`: "A street with a large yellow diamond-shaped priority road sign mounted on a post in the foreground. A cyclist rides along this priority road. A side street joins from the right, where another cyclist is waiting to turn in."
3. `vorfahrt-kreisverkehr`: "A small roundabout seen from above at an angle. A car is already driving inside the roundabout, approaching from the left. A cyclist is at one of the entrances, about to enter the roundabout."

- [ ] **Step 2: Preis ermitteln und bei Andreas nachfragen**

Run: `python .claude/skills/media-skill/scripts/kie.py preis --modell nano-banana-2 --anzahl 3`

Ergebnis notieren, Andreas kurz fragen ("3 Bilder für Modul 1, Kosten X, loslegen?") und auf ein Ja warten, bevor Step 3 läuft – genau wie es die `media-skill` für jeden Auftrag ohne vom Nutzer genanntes Modell vorschreibt.

- [ ] **Step 3: Drei Bilder erzeugen**

Run (für jede der drei Szenen aus Step 1, `--eingabe` mit STIL + Szenentext kombiniert):

```bash
python .claude/skills/media-skill/scripts/kie.py erzeugen \
  --modell nano-banana-2 \
  --eingabe '{"prompt": "<STIL> <Szene 1>", "image_size": "4:3"}' \
  --projekt verkehr-vorfahrt \
  --typ bild \
  --prompt "vorfahrt-kreuzung-ohne-schilder"
```

(Analog für Szene 2 und 3.) Ergebnisse landen in `D:\Medien\JJJJ-MM-TT-verkehr-vorfahrt\`.

- [ ] **Step 4: Ergebnisse fachlich prüfen**

Jedes der drei Bilder ansehen und gegen die beabsichtigte Regel abgleichen (richtige Fahrbahnseite, richtiges Schild erkennbar, plausible Kreisverkehr-Anordnung). Bei einem erkennbaren Fehler: diese eine Szene neu erzeugen (Step 3 wiederholen), nicht nachträglich in der Bilddatei flicken.

- [ ] **Step 5: In den Arbeitsordner übernehmen und nachbearbeiten**

```bash
mkdir -p "C:/Users/User/Desktop/Claude/Sessions/Au Pair Deutsch/verkehr/bildkarten-quelle"
cp "D:/Medien/<Datum>-verkehr-vorfahrt/<Datei 1>" \
   "C:/Users/User/Desktop/Claude/Sessions/Au Pair Deutsch/verkehr/bildkarten-quelle/vorfahrt-kreuzung-ohne-schilder.png"
cp "D:/Medien/<Datum>-verkehr-vorfahrt/<Datei 2>" \
   "C:/Users/User/Desktop/Claude/Sessions/Au Pair Deutsch/verkehr/bildkarten-quelle/vorfahrt-vorfahrtsstrasse-schild.png"
cp "D:/Medien/<Datum>-verkehr-vorfahrt/<Datei 3>" \
   "C:/Users/User/Desktop/Claude/Sessions/Au Pair Deutsch/verkehr/bildkarten-quelle/vorfahrt-kreisverkehr.png"
node scripts/verkehr-bilder-aufbereiten.js
```

Expected: drei Zeilen `<name>.webp  <X> kB -> <Y> kB` in der Ausgabe, drei neue Dateien in `verkehr/bilder/`

- [ ] **Step 6: Commit**

```bash
git add verkehr/bilder/vorfahrt-kreuzung-ohne-schilder.webp verkehr/bilder/vorfahrt-vorfahrtsstrasse-schild.webp verkehr/bilder/vorfahrt-kreisverkehr.webp
git commit -m "feat(verkehr): Szenenbilder für Modul 1 (Vorfahrt)"
```

(`verkehr/bildkarten-quelle/` bleibt lokal, siehe Global Constraints zum bestehenden `.gitignore`-Eintrag.)

---

### Task 10: Veröffentlichung

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Modify: `scripts/startseite.js`
- Modify: `scripts/styles.css`
- Modify: `README.md`

**Interfaces:** Keine neuen Funktionen – reine Verdrahtung bestehender Stücke (CI ruft die in Task 1–8 geschaffenen Skripte auf, die Startseite verlinkt die in Task 5/8 gebaute `dist/verkehr/index.html`).

- [ ] **Step 1: CI um den Verkehrsbereich erweitern**

In `.github/workflows/deploy.yml`, nach der Zeile `- run: node scripts/build.js` einfügen:

```yaml
      - run: node scripts/verkehr-pruefstand.js
      - run: node scripts/verkehr-build.js
```

Die bestehenden Zeilen (Test, Sprachkurs-Prüfstand, Sprachkurs-Build, Upload, Deploy) bleiben unverändert; `node --test scripts/*.test.js` erfasst die neuen `verkehr-*.test.js`-Dateien bereits automatisch über den Glob.

- [ ] **Step 2: Verweis auf der Sprachkurs-Startseite ergänzen**

In `scripts/startseite.js`, in der Hero-Sektion direkt nach der Zeile mit `hero-kleingedruckt` einfügen:

```html
    <p class="hero-verweis"><a href="verkehr/index.html">Neu: Sicher Rad fahren – Verkehrsregeln für Au-Pairs</a></p>
```

- [ ] **Step 3: Kleine additive CSS-Regel für den neuen Verweis**

In `scripts/styles.css` ergänzen (z. B. direkt unterhalb der bestehenden `.hero-kleingedruckt`-Regel):

```css
.hero-verweis {
  margin-top: 0.75rem;
  font-weight: 600;
}

.hero-verweis a {
  text-decoration: underline;
}
```

- [ ] **Step 4: README dokumentieren**

An `README.md` anhängen:

```markdown
## Verkehrsregeln fürs Fahrrad (verkehr/)

Zweites, unabhängiges Lernangebot im selben Repository: Module zu
Verkehrsregeln fürs Fahrrad in Deutschland, für Au-Pairs ohne vertraute
Verkehrsregeln. Anders als der Sprachkurs sind die Module unabhängig
voneinander – keine Kette, keine Reihenfolge, kein Audio.

### Build

    node scripts/verkehr-build.js

Ergebnis liegt in `dist/verkehr/`. Liest die Module aus `verkehr/module/`,
die Übersicht aus `verkehr/module/uebersicht.json`, kopiert `verkehr/bilder/`
unverändert mit.

### Tests

    node --test scripts/verkehr-*.test.js

### Prüfstand

    node scripts/verkehr-pruefstand.js

### Neues Modul ergänzen

1. `verkehr/module/NN-slug.md` nach dem Muster von `01-vorfahrt.md` anlegen
   (Frontmatter `id`, `titel`, `themenbereich`, `typ: verkehrsmodul`; Abschnitte
   `Einleitung Deutsch/Englisch`, `Regel Deutsch/Englisch`, beliebig viele
   `Aufgabe: <Titel>` mit `Bild`, `Frage Deutsch/Englisch`, `Optionen`
   (Markdown-Checkliste, genau ein `[x]`), `Erklärung Deutsch/Englisch`)
2. Szenenbilder erzeugen (media-skill) und über
   `node scripts/verkehr-bilder-aufbereiten.js` nach `verkehr/bilder/` bringen
3. `node scripts/verkehr-pruefstand.js` zur Kontrolle laufen lassen
4. `node scripts/verkehr-build.js`

Die Übersichtsseite verlinkt automatisch jedes Modul, für das eine
Markdown-Datei existiert. Die übrigen Einträge aus `uebersicht.json`
bleiben als Vorschau mit „in Arbeit" stehen.
```

- [ ] **Step 5: Vollständige Endkontrolle**

Run:

```bash
node --test scripts/*.test.js
node scripts/pruefstand.js
node scripts/verkehr-pruefstand.js
node scripts/build.js
node scripts/verkehr-build.js
```

Expected: alle Tests grün, beide Prüfstände melden OK, beide Builds laufen ohne Fehler durch, `node scripts/verkehr-build.js` zeigt jetzt **keine** Bild-Warnung mehr (Task 9 hat die Bilder geliefert)

- [ ] **Step 6: Commit und Veröffentlichung**

```bash
git add .github/workflows/deploy.yml scripts/startseite.js scripts/styles.css README.md
git commit -m "feat(verkehr): Veröffentlichung – CI, Verweis von der Startseite, README"
git push
```

Nach dem Push den GitHub-Actions-Lauf abwarten und danach `https://hofa35.github.io/au-pair-deutsch/verkehr/` sowie `https://hofa35.github.io/au-pair-deutsch/verkehr/modul-01.html` im Browser öffnen, Sprachumschalter und mindestens eine Aufgabe (richtige und falsche Antwort) tatsächlich durchklicken.

---

## Danach (nicht Teil dieses Plans)

Module 2–4 ("Verkehrsschilder und Fahrradwege", "Ampeln, Fußgängerüberwege, Abbiegen", "Sicherheit und Kindertransport") folgen im selben Muster wie Modul 1 – Inhalt schreiben, Bilder erzeugen, Prüfstand, Build – ohne dass Parser, Prüfstand, Renderer, Build oder Stylesheet sich nochmal ändern müssen. Das entspricht dem Vorgehen beim Sprachkurs, wo nach der ersten Lektion die übrigen 14 in Batches nachgezogen wurden, statt dafür einen zweiten Implementierungsplan zu schreiben.

Zertifikat/Bescheinigung ist ein eigener, späterer Baustein (siehe Spec), ebenso eine gemeinsame Oberfläche mit dem Sprachkurs.

# Abschluss und Bescheinigung – Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wer den Kurs durchgearbeitet hat, landet auf einer Abschlussseite mit Miras gesprochener Gratulation und kann sich eine ausdruckbare Teilnahmebescheinigung über alle 15 Lektionen holen.

**Architecture:** Der Abschluss ist eine dritte Dokumentart neben Lektion und Wiederholung, erkannt am Frontmatter-Feld `typ`, und die letzte Station im bestehenden Lernweg. Ein neues Browsermodul merkt sich besuchte Stationen im `localStorage` und zeigt den Stand an, ohne etwas zu sperren. Die Bescheinigung ist eine eigene HTML-Seite mit Druckstilen, aus der der Browser selbst das PDF macht – keine PDF-Bibliothek, keine neue Abhängigkeit.

**Tech Stack:** Node (Build und Tests, `node --test`), Vanilla HTML/CSS/JS im Browser, Google Cloud Text-to-Speech für Miras Stimme, ffmpeg nur für die Bildretusche.

**Spec:** `02 Projekte/Deutsch für Au-Pairs.md` im Obsidian-Vault (`D:\Obsidian\zweites Gehirn`), Abschnitte „Status", „Architektur" und „Offene Fragen". Die Festlegungen aus der Sitzung vom 08.10.2026 stehen unten unter „Entscheidungen".

## Global Constraints

- Kein Framework, keine neue Abhängigkeit, keine externen Schriften, kein Netzwerkaufruf zur Laufzeit. Vanilla HTML/CSS/JS.
- Node 20 in der CI (`.github/workflows/deploy.yml`). Nichts verwenden, was dort fehlt.
- Tests laufen mit `node --test scripts/*.test.js`. Die 87 vorhandenen Tests müssen grün bleiben.
- Code, Kommentare, Funktions- und Variablennamen auf Deutsch. Technische Fachbegriffe dürfen englisch bleiben.
- Jede Erklärung für Lernende steht zuerst auf einfachem Deutsch, Englisch nur hinter dem bestehenden `.sprach-umschalter`.
- Keine Emojis. Keine Ausrufezeichen-Häufung. Grundton sachlich und freundlich.
- Textkontrast mindestens 4,5:1 auf dem Creme-Grund `#FFFBF5`.
- Nirgends behaupten, ein Niveau sei „bestanden", „erreicht" oder „zertifiziert". Erlaubt ist ausschließlich: durchgearbeitet, orientiert an der A1-Progression.
- Der Build darf nicht brechen, wenn `lektionen/abschluss.md` fehlt. Dann entfallen Abschlussseite und Bescheinigung stillschweigend, wie bei den Wiederholungen auch.
- Nichts verlässt das Gerät der Lernenden. Kein Konto, kein Server, keine Übertragung von Name oder Fortschritt.
- Farben nur aus den CSS-Variablen in `scripts/styles.css`, keine neuen Festwerte.

## Entscheidungen (vom 08.10.2026, nicht neu verhandeln)

| Frage | Entscheidung | Grund |
| --- | --- | --- |
| Aussteller der Bescheinigung | Siegel mit Kursname und Netzadresse. **Keine Unterschrift, kein Personenname.** | Mira ist eine Zeichnung, eine erfundene Signatur wäre eine Lüge auf einem Dokument, das jemand vorzeigt. |
| Miras Gratulation | Dieselbe Google-Stimme wie in allen 90 Audiodateien, Standbild plus CSS-Bewegung. **Kein KI-Video.** | Die Stimme ist über 15 Lektionen Miras Stimme geworden. Ein Wechsel am Ende wäre ein Bruch. Video bleibt als spätere Kür möglich, deshalb liegt das Bild in einem Bereich, den ein Video ohne Umbau ersetzen kann. |
| Fortschritt | Wird gemerkt und angezeigt, **sperrt aber nichts**. Die Bescheinigung ist auch ohne Fortschritt erreichbar. | Wer seinen Browserspeicher verliert, hat nichts falsch gemacht und soll nicht vor einer verschlossenen Tür stehen. |
| PDF | Druckstile, der Browser erzeugt das PDF. **Keine PDF-Bibliothek.** | Keine Abhängigkeit, dieselben Schriften wie im Kurs, und Umlaute gehen garantiert nicht kaputt. |
| Wiedereinstieg auf der Startseite („mach weiter bei Station 7") | **Nicht in diesem Block.** | YAGNI. Der Fortschritt hat hier einen Zweck, dort noch nicht. |
| Sprechaufnahme auf den Nachsprech-Blöcken | **Nicht in diesem Block**, kommt als Block zwei. | Eigener Plan, eigene Prüfung. |

---

### Task 1: Parser und Prüfstand lernen den Typ `abschluss`

Es gibt bisher zwei Dokumentarten, erkannt am Frontmatter-Feld `typ`: Lektion (Feld fehlt) und Wiederholung. Dazu kommt jetzt der Abschluss. Er hat weder Wortschatz noch Aufgaben, sondern eine zweisprachige Gratulation, einen gesprochenen Satzblock für die Tonspur und den zweisprachigen Hinweis, der später unten auf der Bescheinigung steht.

Der gesprochene Text wird bewusst begrenzt. Eine Gratulation, die zur Ansprache wird, hört niemand zu Ende, und jede Sekunde Ton kostet in der Erzeugung.

**Files:**
- Modify: `scripts/parser.js` (neue Funktion, Verteiler in `parseDokument` erweitern)
- Modify: `scripts/pruefstand.js` (neue Funktion, Verteiler in `validateDokument` erweitern)
- Create: `scripts/fixtures/test-abschluss.md`
- Test: `scripts/parser.test.js`, `scripts/pruefstand.test.js`

**Interfaces:**
- Consumes: `getSection(body, ueberschrift)` aus `parser.js` (vorhanden, nicht exportiert, nur modulintern nutzbar)
- Produces:
  - `parseDokument(pfad)` liefert bei `typ: abschluss` das Objekt
    `{ art: 'abschluss', titel, gratulationDe, gratulationEn, gesprochen, bescheinigungDe, bescheinigungEn }` – alle Werte Strings
  - `parseAbschluss(pfad)` als Einzelfunktion, passend zu `parseLektion` und `parseWiederholung`
  - `validateAbschluss(abschluss)` liefert `{ valid: boolean, errors: string[] }`
  - `validateDokument(dokument)` verteilt jetzt auf drei Arten

- [ ] **Step 1: Fixture anlegen**

`scripts/fixtures/test-abschluss.md`:

```markdown
---
typ: abschluss
titel: Testabschluss
---

## Gratulation Deutsch

Erster deutscher Absatz.

Zweiter deutscher Absatz.

## Gratulation Englisch

First English paragraph.

## Gesprochen

Gesprochener Testsatz.

## Bescheinigung Deutsch

Deutscher Hinweis.

## Bescheinigung Englisch

English note.
```

- [ ] **Step 2: Die fehlschlagenden Tests schreiben**

An das Ende von `scripts/parser.test.js` anhängen:

```js
const { parseDokument } = require('./parser.js');

test('parseDokument erkennt den Typ abschluss am Frontmatter', () => {
  const abschluss = parseDokument(path.join(__dirname, 'fixtures', 'test-abschluss.md'));
  assert.strictEqual(abschluss.art, 'abschluss');
  assert.strictEqual(abschluss.titel, 'Testabschluss');
});

test('der Abschluss liest Gratulation, Sprechtext und Hinweis', () => {
  const abschluss = parseDokument(path.join(__dirname, 'fixtures', 'test-abschluss.md'));
  assert.match(abschluss.gratulationDe, /Erster deutscher Absatz/);
  assert.match(abschluss.gratulationDe, /Zweiter deutscher Absatz/);
  assert.strictEqual(abschluss.gratulationEn, 'First English paragraph.');
  assert.strictEqual(abschluss.gesprochen, 'Gesprochener Testsatz.');
  assert.strictEqual(abschluss.bescheinigungDe, 'Deutscher Hinweis.');
  assert.strictEqual(abschluss.bescheinigungEn, 'English note.');
});

test('eine Datei ohne typ bleibt eine Lektion', () => {
  const lektion = parseDokument(path.join(__dirname, 'fixtures', 'test-lektion.md'));
  assert.strictEqual(lektion.art, 'lektion');
});
```

An das Ende von `scripts/pruefstand.test.js` anhängen:

```js
const { validateAbschluss, validateDokument } = require('./pruefstand.js');

function vollstaendigerAbschluss(ueberschreiben = {}) {
  return {
    art: 'abschluss',
    titel: 'Du hast es geschafft',
    gratulationDe: 'Glückwunsch.',
    gratulationEn: 'Congratulations.',
    gesprochen: 'Du hast es geschafft.',
    bescheinigungDe: 'Keine Prüfung.',
    bescheinigungEn: 'Not an exam.',
    ...ueberschreiben,
  };
}

test('vollständiger Abschluss ist gültig', () => {
  const result = validateAbschluss(vollstaendigerAbschluss());
  assert.strictEqual(result.valid, true);
  assert.deepStrictEqual(result.errors, []);
});

test('fehlende Pflichtfelder des Abschlusses werden gemeldet', () => {
  const result = validateAbschluss(vollstaendigerAbschluss({ gratulationEn: '', gesprochen: '' }));
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes('gratulationEn fehlt'));
  assert.ok(result.errors.includes('gesprochen fehlt'));
});

test('ein zu langer Sprechtext wird beanstandet', () => {
  const result = validateAbschluss(vollstaendigerAbschluss({ gesprochen: 'a'.repeat(501) }));
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((fehler) => fehler.startsWith('gesprochen ist zu lang')));
});

test('validateDokument verteilt auf die richtige Prüfung', () => {
  const result = validateDokument(vollstaendigerAbschluss({ titel: '' }));
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes('titel fehlt'));
});
```

- [ ] **Step 3: Tests laufen lassen, Fehlschlag bestätigen**

Run: `node --test scripts/parser.test.js scripts/pruefstand.test.js`
Expected: FAIL mit `validateAbschluss is not a function` und einem Abschlussobjekt, das `art: 'lektion'` trägt.

- [ ] **Step 4: Parser erweitern**

In `scripts/parser.js` vor `parseDokument` einfügen:

```js
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
```

`parseDokument` ersetzen durch:

```js
/** Liest eine Datei und entscheidet anhand von "typ", wie sie gelesen wird. */
function parseDokument(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);
  if (frontmatter.typ === 'wiederholung') return parseWiederholungAus(frontmatter, body);
  if (frontmatter.typ === 'abschluss') return parseAbschlussAus(frontmatter, body);
  return parseLektionAus(frontmatter, body);
}
```

Export erweitern:

```js
module.exports = { parseLektion, parseWiederholung, parseAbschluss, parseDokument, parseAbschnitte };
```

- [ ] **Step 5: Prüfstand erweitern**

In `scripts/pruefstand.js` vor `validateDokument` einfügen:

```js
// Eine gesprochene Gratulation, die länger wird, hört niemand zu Ende, und
// jede Sekunde Ton kostet bei der Erzeugung. Die Zahl ist eine Setzung, sie
// hält nur die Obergrenze fest.
const HOECHSTLAENGE_GESPROCHEN = 500;

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
```

`validateDokument` ersetzen durch:

```js
function validateDokument(dokument) {
  if (dokument.art === 'wiederholung') return validateWiederholung(dokument);
  if (dokument.art === 'abschluss') return validateAbschluss(dokument);
  return validateLektion(dokument);
}
```

Export erweitern:

```js
module.exports = { validateLektion, validateWiederholung, validateAbschluss, validateDokument };
```

- [ ] **Step 6: Tests laufen lassen**

Run: `node --test scripts/*.test.js`
Expected: PASS, die bisherigen 87 plus die 7 neuen.

- [ ] **Step 7: Commit**

```bash
git add scripts/parser.js scripts/parser.test.js scripts/pruefstand.js scripts/pruefstand.test.js scripts/fixtures/test-abschluss.md
git commit -m "feat: Parser und Pruefstand kennen den Dokumenttyp Abschluss"
```

---

### Task 2: Inhaltsdatei für den Abschluss und Miras Tonspur

Der Text des Abschlusses gehört nach `lektionen/`, nicht in den Code – wie jeder andere Inhalt im Projekt. Dadurch kann das vorhandene Audio-Skript die Tonspur erzeugen, ohne dass jemand von Hand eine MP3 baut.

Das Audio-Skript entscheidet heute über `brauchtAudio(dokument)` und baut die Auftragsliste direkt in `main()`. Das wird in eine reine Funktion gezogen, damit die neue Verzweigung geprüft werden kann, ohne die API zu rufen.

**Files:**
- Create: `lektionen/abschluss.md`
- Modify: `scripts/generate_audio.js`
- Test: `scripts/generate_audio.test.js`

**Interfaces:**
- Consumes: `parseDokument` aus Task 1, Objekt mit `art: 'abschluss'` und `gesprochen`
- Produces:
  - `auftraegeFuer(dokument)` liefert `{ ordner: string|null, auftraege: Array<{name: string, text: string}> }`
  - `brauchtAudio(dokument)` bleibt erhalten und stützt sich auf `auftraegeFuer`
  - Tonspur liegt danach als `audio/abschluss/gratulation.mp3` vor

- [ ] **Step 1: Die fehlschlagenden Tests schreiben**

An das Ende von `scripts/generate_audio.test.js` anhängen. Die vorhandene `require`-Zeile um `auftraegeFuer` ergänzen, statt eine zweite zu schreiben:

```js
test('eine Lektion bekommt Hörübung und einen Auftrag je Nachsprech-Satz', () => {
  const ergebnis = auftraegeFuer({
    art: 'lektion',
    id: 3,
    hoertext: 'Hörtext',
    nachsprechen: ['Satz eins', 'Satz zwei'],
  });
  assert.strictEqual(ergebnis.ordner, '3');
  assert.deepStrictEqual(ergebnis.auftraege, [
    { name: 'hoeruebung.mp3', text: 'Hörtext' },
    { name: 'nachsprechen-1.mp3', text: 'Satz eins' },
    { name: 'nachsprechen-2.mp3', text: 'Satz zwei' },
  ]);
});

test('der Abschluss bekommt genau eine Datei aus dem Sprechtext', () => {
  const ergebnis = auftraegeFuer({ art: 'abschluss', gesprochen: 'Du hast es geschafft.' });
  assert.strictEqual(ergebnis.ordner, 'abschluss');
  assert.deepStrictEqual(ergebnis.auftraege, [
    { name: 'gratulation.mp3', text: 'Du hast es geschafft.' },
  ]);
});

test('eine Wiederholung bekommt kein Audio', () => {
  const ergebnis = auftraegeFuer({ art: 'wiederholung', nr: 1 });
  assert.strictEqual(ergebnis.ordner, null);
  assert.deepStrictEqual(ergebnis.auftraege, []);
  assert.strictEqual(brauchtAudio({ art: 'wiederholung', nr: 1 }), false);
});
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag bestätigen**

Run: `node --test scripts/generate_audio.test.js`
Expected: FAIL mit `auftraegeFuer is not a function`.

- [ ] **Step 3: Audio-Skript umbauen**

In `scripts/generate_audio.js` die Funktion `brauchtAudio` ersetzen durch:

```js
/**
 * Welche Audiodateien gehören zu diesem Dokument, und in welchen Ordner?
 *
 * Wiederholungsseiten haben bewusst kein Audio: dort wird geschrieben und
 * erkannt, gehört wird in den Lektionen. Der Abschluss hat genau eine Datei,
 * Miras Gratulation.
 */
function auftraegeFuer(dokument) {
  if (dokument.art === 'abschluss') {
    return { ordner: 'abschluss', auftraege: [{ name: 'gratulation.mp3', text: dokument.gesprochen }] };
  }
  if (dokument.art !== 'lektion') {
    return { ordner: null, auftraege: [] };
  }
  const auftraege = [{ name: 'hoeruebung.mp3', text: dokument.hoertext }];
  dokument.nachsprechen.forEach((satz, i) => {
    auftraege.push({ name: `nachsprechen-${i + 1}.mp3`, text: satz });
  });
  return { ordner: String(dokument.id), auftraege };
}

function brauchtAudio(dokument) {
  return auftraegeFuer(dokument).auftraege.length > 0;
}
```

Die Schleife in `main()` ersetzen durch:

```js
  for (const datei of dateien) {
    const dokument = parseDokument(path.join(lektionenDir, datei));
    const { ordner, auftraege } = auftraegeFuer(dokument);
    if (!ordner) continue;
    const zielOrdner = path.join(__dirname, '..', 'audio', ordner);

    for (const auftrag of auftraege) {
      const ziel = path.join(zielOrdner, auftrag.name);
      if (fs.existsSync(ziel) && !alleNeu) {
        console.log(`${ordner}: ${auftrag.name} existiert bereits, übersprungen`);
        continue;
      }
      const audioBase64 = await rufeTtsApiAuf(auftrag.text, apiKey);
      fs.mkdirSync(zielOrdner, { recursive: true });
      fs.writeFileSync(ziel, Buffer.from(audioBase64, 'base64'));
      console.log(`${ordner}: ${auftrag.name} geschrieben`);
    }

    // Dateien aufräumen, die zu gelöschten Nachsprech-Sätzen gehören.
    // Nur bei Lektionen: nur dort hängt die Dateizahl am Inhalt.
    if (dokument.art === 'lektion' && fs.existsSync(zielOrdner)) {
      const erlaubt = new Set(auftraege.map((a) => a.name));
      for (const vorhanden of fs.readdirSync(zielOrdner)) {
        if (vorhanden.startsWith('nachsprechen-') && !erlaubt.has(vorhanden)) {
          fs.rmSync(path.join(zielOrdner, vorhanden));
          console.log(`${ordner}: ${vorhanden} entfernt, Satz gibt es nicht mehr`);
        }
      }
    }
  }
```

Export erweitern:

```js
module.exports = { buildSpeechRequest, brauchtAudio, auftraegeFuer };
```

- [ ] **Step 4: Tests laufen lassen**

Run: `node --test scripts/*.test.js`
Expected: PASS.

- [ ] **Step 5: Inhaltsdatei anlegen**

`lektionen/abschluss.md`:

```markdown
---
typ: abschluss
titel: Du hast es geschafft
---

## Gratulation Deutsch

Du hast alle 15 Lektionen und alle 4 Wiederholungen gemacht. Das ist viel Arbeit, und du hast sie allein geschafft, neben deinem Alltag in der Gastfamilie.

Dein Deutsch ist heute besser als am ersten Tag. Du hörst mehr, du verstehst mehr, und du sagst mehr. Niemand spricht nach 15 Lektionen perfekt, das erwartet auch niemand. Aber du kommst durch deinen Tag, und darum ging es.

Unten findest du eine Bescheinigung über alles, was du geübt hast. Du kannst sie ausdrucken oder als PDF speichern und zu deinen Papieren legen.

Und dann: hör nicht auf. Sprich jeden Tag ein bisschen, auch wenn es falsch ist. Falsch sprechen ist besser als nicht sprechen.

## Gratulation Englisch

You have finished all 15 lessons and all 4 review pages. That is a lot of work, and you did it on your own, alongside your daily life with your host family.

Your German today is better than on your first day. You hear more, you understand more, and you say more. Nobody speaks perfectly after 15 lessons, and nobody expects that. But you get through your day, and that was the point.

Below you will find a certificate listing everything you practised. You can print it or save it as a PDF and keep it with your documents.

And then: do not stop. Speak a little every day, even if it is wrong. Speaking badly is better than not speaking at all.

## Gesprochen

Du hast es geschafft. Fünfzehn Lektionen, von Anfang bis Ende. Dein Deutsch ist heute besser als am ersten Tag, und du hast das ganz allein gemacht. Ich bin stolz auf dich. Sprich weiter, jeden Tag ein bisschen. Tschüss, und alles Gute für dich.

## Bescheinigung Deutsch

Dies ist eine Teilnahmebescheinigung, keine Prüfung. Der Kurs folgt der Themen- und Grammatikprogression des Niveaus A1, er wird von keiner Prüfungsstelle abgenommen und ersetzt kein Sprachzertifikat.

## Bescheinigung Englisch

This is a confirmation of participation, not an examination. The course follows the topic and grammar progression of level A1. It is not assessed by any examination body and does not replace a language certificate.
```

- [ ] **Step 6: Prüfstand über die neue Datei laufen lassen**

Run: `node scripts/pruefstand.js`
Expected: `abschluss.md: OK` in der Ausgabe, Rückgabewert 0.

- [ ] **Step 7: Tonspur erzeugen**

Der Schlüssel steht in der nicht versionierten `.env` im Arbeitsordner. In der Git-Bash:

```bash
set -a; . ./.env; set +a
node scripts/generate_audio.js
```

Expected: `abschluss: gratulation.mp3 geschrieben`, alle übrigen Dateien werden als bereits vorhanden übersprungen. Es darf keine einzige Lektionsdatei neu erzeugt werden.

- [ ] **Step 8: Die Tonspur anhören**

`audio/abschluss/gratulation.mp3` abspielen. Prüfen: verständlich, nicht abgeschnitten, Betonung erträglich, Dauer unter 30 Sekunden. Falls die Stimme über eine Stelle stolpert, den Satz in `lektionen/abschluss.md` umformulieren, die MP3 löschen und Schritt 7 wiederholen.

- [ ] **Step 9: Commit**

```bash
git add lektionen/abschluss.md scripts/generate_audio.js scripts/generate_audio.test.js audio/abschluss/gratulation.mp3
git commit -m "content: Abschlusstext und Miras gesprochene Gratulation"
```

---

### Task 3: Fortschritt im Browserspeicher

Ein neues Browsermodul nach dem Muster von `scripts/toggle.js`: reine Funktionen, die unter Node geprüft werden können, dazu eine Registrierung, die nur im Browser läuft.

Die heikle Stelle ist `localStorage` selbst. In privaten Fenstern und bei blockierten Cookies wirft bereits der Zugriff auf die Eigenschaft, nicht erst das Schreiben. Jeder Zugriff liegt deshalb in einem Versuch-Block, und wenn der Speicher fehlt, verhält sich der Kurs genau wie heute.

**Files:**
- Create: `scripts/fortschritt.js`
- Test: `scripts/fortschritt.test.js`

**Interfaces:**
- Consumes: nichts aus anderen Tasks
- Produces:
  - `liesFortschritt(speicher)` → `{ besucht: string[] }`
  - `merkeStation(speicher, schluessel)` → `{ besucht: string[] }`
  - `zaehleBesucht(stand, alleSchluessel)` → `number`
  - `textFuerStand(zahl, gesamt)` → `string`
  - `SPEICHER_SCHLUESSEL` → `'au-pair-deutsch:fortschritt'`
  - im Browser: `window.AuPairFortschritt.registriereFortschritt`, liest `document.body.dataset.station` und füllt das erste Element mit `data-stationen`

- [ ] **Step 1: Die fehlschlagenden Tests schreiben**

`scripts/fortschritt.test.js`:

```js
// scripts/fortschritt.test.js
const test = require('node:test');
const assert = require('node:assert');
const {
  SPEICHER_SCHLUESSEL,
  liesFortschritt,
  merkeStation,
  zaehleBesucht,
  textFuerStand,
} = require('./fortschritt.js');

/** Ein Ersatz für localStorage, damit die Tests ohne Browser laufen. */
function speicherAttrappe(start = {}) {
  const daten = { ...start };
  return {
    getItem: (k) => (k in daten ? daten[k] : null),
    setItem: (k, v) => {
      daten[k] = String(v);
    },
    removeItem: (k) => {
      delete daten[k];
    },
    daten,
  };
}

test('ein leerer Speicher liefert einen leeren Stand', () => {
  assert.deepStrictEqual(liesFortschritt(speicherAttrappe()), { besucht: [] });
});

test('eine besuchte Station wird gemerkt', () => {
  const speicher = speicherAttrappe();
  merkeStation(speicher, 'lektion-1');
  assert.deepStrictEqual(liesFortschritt(speicher), { besucht: ['lektion-1'] });
});

test('dieselbe Station zweimal bleibt ein Eintrag', () => {
  const speicher = speicherAttrappe();
  merkeStation(speicher, 'lektion-1');
  merkeStation(speicher, 'lektion-1');
  assert.deepStrictEqual(liesFortschritt(speicher).besucht, ['lektion-1']);
});

test('kaputter Inhalt im Speicher gilt als leerer Stand', () => {
  const speicher = speicherAttrappe({ [SPEICHER_SCHLUESSEL]: 'kein JSON' });
  assert.deepStrictEqual(liesFortschritt(speicher), { besucht: [] });
});

test('ein Speicher mit fremdem Inhalt gilt als leerer Stand', () => {
  const speicher = speicherAttrappe({ [SPEICHER_SCHLUESSEL]: '{"etwas":"anderes"}' });
  assert.deepStrictEqual(liesFortschritt(speicher), { besucht: [] });
});

test('ein Speicher, der beim Schreiben wirft, bricht nichts ab', () => {
  const speicher = speicherAttrappe();
  speicher.setItem = () => {
    throw new Error('Speicher voll');
  };
  assert.doesNotThrow(() => merkeStation(speicher, 'lektion-1'));
});

test('gezählt werden nur Stationen, die es wirklich gibt', () => {
  const stand = { besucht: ['lektion-1', 'lektion-99', 'wiederholung-1'] };
  assert.strictEqual(zaehleBesucht(stand, ['lektion-1', 'lektion-2', 'wiederholung-1']), 2);
});

test('ohne gemerkten Stand gibt es keinen Vorwurf, sondern eine Erklärung', () => {
  assert.match(textFuerStand(0, 19), /kein Problem/);
});

test('ein Teilstand nennt beide Zahlen', () => {
  assert.match(textFuerStand(7, 19), /7 von 19/);
});

test('ein vollständiger Stand sagt das ausdrücklich', () => {
  assert.match(textFuerStand(19, 19), /allen 19 Stationen/);
});

test('ohne bekannte Stationen bleibt der Text leer', () => {
  assert.strictEqual(textFuerStand(0, 0), '');
});
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag bestätigen**

Run: `node --test scripts/fortschritt.test.js`
Expected: FAIL mit `Cannot find module './fortschritt.js'`.

- [ ] **Step 3: Das Modul schreiben**

`scripts/fortschritt.js`:

```js
// scripts/fortschritt.js
//
// Merkt sich, welche Stationen schon besucht wurden. Nur im Browser der
// Lernenden: es gibt kein Konto und keinen Server, der das annehmen könnte,
// und nichts verlässt das Gerät.
//
// Bewusst kein Türsteher. Der Stand wird angezeigt, aber nichts gesperrt.
// Wer seinen Browserspeicher verliert, hat nichts falsch gemacht und soll
// nicht vor einer verschlossenen Tür stehen.
const SPEICHER_SCHLUESSEL = 'au-pair-deutsch:fortschritt';
const PROBE_SCHLUESSEL = 'au-pair-deutsch:probe';

/**
 * Holt den Browserspeicher, falls er benutzbar ist.
 *
 * In privaten Fenstern und bei blockierten Cookies wirft schon der Zugriff
 * auf die Eigenschaft, nicht erst das Schreiben. Deshalb wird einmal
 * probeweise geschrieben und wieder gelöscht, bevor der Speicher als
 * brauchbar gilt.
 */
function holeSpeicher() {
  try {
    const speicher = window.localStorage;
    speicher.setItem(PROBE_SCHLUESSEL, '1');
    speicher.removeItem(PROBE_SCHLUESSEL);
    return speicher;
  } catch (fehler) {
    return null;
  }
}

/** Liest den Stand. Alles Unerwartete gilt als "noch nichts besucht". */
function liesFortschritt(speicher) {
  try {
    const roh = speicher.getItem(SPEICHER_SCHLUESSEL);
    if (!roh) return { besucht: [] };
    const daten = JSON.parse(roh);
    if (!daten || !Array.isArray(daten.besucht)) return { besucht: [] };
    return { besucht: daten.besucht.filter((eintrag) => typeof eintrag === 'string') };
  } catch (fehler) {
    return { besucht: [] };
  }
}

/** Trägt eine Station ein, falls sie noch nicht drinsteht. */
function merkeStation(speicher, schluessel) {
  const stand = liesFortschritt(speicher);
  if (!schluessel || stand.besucht.includes(schluessel)) return stand;
  const neu = { besucht: [...stand.besucht, schluessel] };
  try {
    speicher.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(neu));
  } catch (fehler) {
    // Speicher voll oder gesperrt. Der Kurs funktioniert auch ohne.
  }
  return neu;
}

/**
 * Zählt nur Stationen, die es im Kurs wirklich gibt. Wird eine Lektion
 * später umbenannt, fällt ihr alter Eintrag damit still heraus, statt die
 * Zahl über das Mögliche zu heben.
 */
function zaehleBesucht(stand, alleSchluessel) {
  const besucht = new Set(stand.besucht);
  return alleSchluessel.filter((schluessel) => besucht.has(schluessel)).length;
}

/**
 * Der Satz unter der Gratulation. Nie tadelnd: wer nichts gemerkt bekommen
 * hat, liest keinen Vorwurf, sondern die Erklärung.
 */
function textFuerStand(zahl, gesamt) {
  if (!gesamt) return '';
  if (zahl === 0) {
    return 'Dein Browser hat sich nichts gemerkt. Das ist kein Problem, deine Bescheinigung bekommst du trotzdem.';
  }
  if (zahl >= gesamt) {
    return `Du warst auf allen ${gesamt} Stationen des Kurses.`;
  }
  return `Du warst auf ${zahl} von ${gesamt} Stationen. Der Rest wartet noch auf dich.`;
}

function registriereFortschritt() {
  const speicher = holeSpeicher();
  if (!speicher) return;

  const station = document.body.dataset.station;
  if (station) merkeStation(speicher, station);

  const anzeige = document.querySelector('[data-stationen]');
  if (!anzeige) return;
  const alle = anzeige.dataset.stationen.split(',').filter((schluessel) => schluessel !== '');
  const text = textFuerStand(zaehleBesucht(liesFortschritt(speicher), alle), alle.length);
  if (text) anzeige.textContent = text;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SPEICHER_SCHLUESSEL, liesFortschritt, merkeStation, zaehleBesucht, textFuerStand };
} else {
  window.AuPairFortschritt = { registriereFortschritt };
  document.addEventListener('DOMContentLoaded', registriereFortschritt);
}
```

- [ ] **Step 4: Tests laufen lassen**

Run: `node --test scripts/*.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/fortschritt.js scripts/fortschritt.test.js
git commit -m "feat: Fortschritt im Browserspeicher merken und anzeigen"
```

---

### Task 4: Der Abschluss als letzte Station im Lernweg

`scripts/stationen.js` baut die Kette aus Lektionen und Wiederholungen. Daran hängt die Fußnavigation. Der Abschluss kommt ans Ende, damit „Weiter" auf Lektion 15 dorthin führt statt ins Nichts.

Er bekommt eine eigene Marke, so wie Wiederholungen eine haben. `baueNavigation` in `renderer.js` beschriftet Karten über `eintrag.marke || 'Lektion ' + nr` und braucht deshalb keine Änderung.

**Files:**
- Modify: `scripts/stationen.js`
- Test: `scripts/stationen.test.js`

**Interfaces:**
- Consumes: `baueStationen(uebersicht, wiederholungsplan, warnen)` (vorhanden)
- Produces:
  - `SCHLUESSEL_ABSCHLUSS` → `'abschluss'`
  - `mitAbschlussStation(stationen, abschluss)` → neues Array; ohne `abschluss` das unveränderte Array

- [ ] **Step 1: Die fehlschlagenden Tests schreiben**

An das Ende von `scripts/stationen.test.js` anhängen. Die vorhandene `require`-Zeile um `SCHLUESSEL_ABSCHLUSS` und `mitAbschlussStation` ergänzen:

```js
test('der Abschluss hängt sich ans Ende der Kette', () => {
  const kette = [{ schluessel: 'lektion-1', nr: 1, titel: 'Erste' }];
  const ergebnis = mitAbschlussStation(kette, { titel: 'Du hast es geschafft' });
  assert.strictEqual(ergebnis.length, 2);
  assert.strictEqual(ergebnis[1].schluessel, SCHLUESSEL_ABSCHLUSS);
  assert.strictEqual(ergebnis[1].titel, 'Du hast es geschafft');
  assert.strictEqual(ergebnis[1].marke, 'Abschluss');
});

test('ohne Abschlussdatei bleibt die Kette, wie sie war', () => {
  const kette = [{ schluessel: 'lektion-1', nr: 1, titel: 'Erste' }];
  assert.deepStrictEqual(mitAbschlussStation(kette, null), kette);
});

test('mitAbschlussStation verändert die übergebene Kette nicht', () => {
  const kette = [{ schluessel: 'lektion-1', nr: 1, titel: 'Erste' }];
  mitAbschlussStation(kette, { titel: 'Ende' });
  assert.strictEqual(kette.length, 1);
});
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag bestätigen**

Run: `node --test scripts/stationen.test.js`
Expected: FAIL mit `mitAbschlussStation is not a function`.

- [ ] **Step 3: Umsetzen**

In `scripts/stationen.js` nach `letzteWiederholungVor` einfügen:

```js
const SCHLUESSEL_ABSCHLUSS = 'abschluss';

/**
 * Hängt den Abschluss ans Ende der Kette. Dadurch führt "Weiter" auf
 * Lektion 15 dorthin statt ins Nichts – bis hierher endete der Kurs ohne
 * Rückmeldung, obwohl das der Punkt ist, an dem eine Rückmeldung zählt.
 *
 * Die Kette wird nicht verändert, sondern neu gebaut: der Aufrufer braucht
 * beide Fassungen. Für die Fortschrittsanzeige zählen nur Lektionen und
 * Wiederholungen, denn auf der Abschlussseite steht man ja gerade.
 *
 * @param {Array} stationen  Ergebnis von baueStationen
 * @param {object|null} abschluss  geparste Abschlussdatei oder null
 */
function mitAbschlussStation(stationen, abschluss) {
  if (!abschluss) return stationen;
  return [
    ...stationen,
    { schluessel: SCHLUESSEL_ABSCHLUSS, titel: abschluss.titel, marke: 'Abschluss' },
  ];
}
```

Export erweitern:

```js
module.exports = {
  schluesselLektion,
  schluesselWdh,
  SCHLUESSEL_ABSCHLUSS,
  baueStationen,
  mitAbschlussStation,
  letzteWiederholungVor,
};
```

- [ ] **Step 4: Tests laufen lassen**

Run: `node --test scripts/*.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/stationen.js scripts/stationen.test.js
git commit -m "feat: Abschluss als letzte Station im Lernweg"
```

---

### Task 5: Die Abschlussseite

Eine eigene Seite nach dem Muster der Wiederholungsseite: derselbe Kopf, dieselbe Fußnavigation, derselbe Sprachumschalter. Neu sind Mira in groß, das Konfetti, Miras Tonspur und der Weg zur Bescheinigung.

Das Konfetti wird nicht zufällig gestreut, sondern nach einer festen Regel. Der Build muss aus derselben Eingabe dieselbe Seite erzeugen, sonst ändert sich bei jedem Lauf die Datei und man sieht im Vergleich nicht mehr, was sich wirklich geändert hat.

`escapeHtml` steckt heute in `scripts/startseite.js`. Damit eine zweite Seite es nutzen kann, ohne von der Startseite abzuhängen, wandert es in ein eigenes kleines Modul.

**Files:**
- Create: `scripts/html.js`
- Create: `scripts/abschluss.js`
- Modify: `scripts/startseite.js` (nutzt `html.js`, exportiert `escapeHtml` weiterhin)
- Modify: `scripts/renderer.js` (`LAUTSPRECHER_ICON` exportieren)
- Test: `scripts/abschluss.test.js`

**Interfaces:**
- Consumes: `renderNavigation`, `mitVersion`, `ZURUECK_ICON`, `LAUTSPRECHER_ICON` aus `renderer.js`; Abschlussobjekt aus Task 1
- Produces:
  - `escapeHtml(text)` aus `scripts/html.js`
  - `renderAbsaetze(text)` → HTML-Absätze, eine Leerzeile trennt
  - `renderKonfetti(anzahl)` → ein `div.konfetti` mit `i.konfetti-schnipsel`
  - `renderAbschlussHtml(abschluss, navigation, versionen, lernwegSchluessel)` → vollständiges HTML
  - erwartet `versionen` als `{css, js, fortschritt}`

- [ ] **Step 1: Die fehlschlagenden Tests schreiben**

`scripts/abschluss.test.js`:

```js
// scripts/abschluss.test.js
const test = require('node:test');
const assert = require('node:assert');
const { renderAbschlussHtml, renderAbsaetze } = require('./abschluss.js');

function testAbschluss(ueberschreiben = {}) {
  return {
    art: 'abschluss',
    titel: 'Du hast es geschafft',
    gratulationDe: 'Erster Absatz.\n\nZweiter Absatz.',
    gratulationEn: 'First paragraph.',
    gesprochen: 'Du hast es geschafft.',
    bescheinigungDe: 'Keine Prüfung.',
    bescheinigungEn: 'Not an exam.',
    ...ueberschreiben,
  };
}

const LERNWEG = ['lektion-1', 'wiederholung-1', 'lektion-2'];

test('aus einer Leerzeile wird ein neuer Absatz', () => {
  assert.strictEqual(renderAbsaetze('Eins.\n\nZwei.'), '<p>Eins.</p>\n<p>Zwei.</p>');
});

test('leere Absätze fallen weg', () => {
  assert.strictEqual(renderAbsaetze('Eins.\n\n\n\nZwei.'), '<p>Eins.</p>\n<p>Zwei.</p>');
});

test('die Seite trägt den Titel und die Gratulation in beiden Sprachen', () => {
  const html = renderAbschlussHtml(testAbschluss(), null, {}, LERNWEG);
  assert.match(html, /<h1>Du hast es geschafft<\/h1>/);
  assert.match(html, /Erster Absatz\./);
  assert.match(html, /First paragraph\./);
  assert.match(html, /data-sprache="en"[^>]*style="display:none"/);
});

test('die Seite meldet sich selbst als Station abschluss', () => {
  const html = renderAbschlussHtml(testAbschluss(), null, {}, LERNWEG);
  assert.match(html, /<body data-station="abschluss">/);
});

test('der Lernweg steht für die Fortschrittsanzeige in der Seite', () => {
  const html = renderAbschlussHtml(testAbschluss(), null, {}, LERNWEG);
  assert.match(html, /data-stationen="lektion-1,wiederholung-1,lektion-2"/);
});

test('Miras Tonspur wird eingebunden, aber nicht von allein gestartet', () => {
  const html = renderAbschlussHtml(testAbschluss(), null, {}, LERNWEG);
  assert.match(html, /src="audio\/abschluss\/gratulation\.mp3"/);
  assert.ok(!html.includes('autoplay'));
});

test('die Bescheinigung ist von hier aus erreichbar', () => {
  const html = renderAbschlussHtml(testAbschluss(), null, {}, LERNWEG);
  assert.match(html, /href="zertifikat\.html"/);
});

test('Umschalter und Fortschritt werden mit Versionsstempel geladen', () => {
  const html = renderAbschlussHtml(testAbschluss(), null, { js: 'aaa', fortschritt: 'bbb' }, LERNWEG);
  assert.match(html, /src="toggle\.js\?v=aaa"/);
  assert.match(html, /src="fortschritt\.js\?v=bbb"/);
});

test('das Konfetti ist bei gleicher Eingabe immer gleich', () => {
  const eins = renderAbschlussHtml(testAbschluss(), null, {}, LERNWEG);
  const zwei = renderAbschlussHtml(testAbschluss(), null, {}, LERNWEG);
  assert.strictEqual(eins, zwei);
});

test('spitze Klammern im Titel landen nicht als Auszeichnung in der Seite', () => {
  const html = renderAbschlussHtml(testAbschluss({ titel: 'A <b> B' }), null, {}, LERNWEG);
  assert.match(html, /A &lt;b&gt; B/);
});
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag bestätigen**

Run: `node --test scripts/abschluss.test.js`
Expected: FAIL mit `Cannot find module './abschluss.js'`.

- [ ] **Step 3: `escapeHtml` in ein eigenes Modul ziehen**

`scripts/html.js` neu anlegen:

```js
// scripts/html.js
//
// Kleine Helfer für die HTML-Erzeugung, die mehr als eine Seite braucht.

/**
 * Macht Text für HTML unschädlich. Inhalte kommen aus Markdown-Dateien,
 * nicht von Fremden, trotzdem gehört ein Titel mit spitzer Klammer als Text
 * auf die Seite und nicht als Auszeichnung.
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { escapeHtml };
```

In `scripts/startseite.js` die dortige Definition von `escapeHtml` löschen und ganz oben einfügen:

```js
const { escapeHtml } = require('./html.js');
```

Der Export am Dateiende bleibt unverändert, damit die bestehenden Tests weiterlaufen.

In `scripts/renderer.js` den Export erweitern:

```js
module.exports = {
  renderLektionHtml,
  baueNavigation,
  renderNavigation,
  renderLoesung,
  mitVersion,
  ZURUECK_ICON,
  LAUTSPRECHER_ICON,
};
```

- [ ] **Step 4: Die Abschlussseite schreiben**

`scripts/abschluss.js`:

```js
// scripts/abschluss.js
//
// Die letzte Station. Kein neuer Stoff, keine Aufgabe: hier wird nur
// festgestellt, dass jemand durch ist, und der Weg zur Bescheinigung
// geöffnet.
//
// Mira steht hier als Standbild. Ein KI-Video wäre möglich, würde aber
// neben fünfzehn gezeichneten Szenenkarten als Fremdkörper wirken, und die
// vertraute Stimme aus den Lektionen trägt mehr als eine neue. Falls später
// doch ein Video kommt, ersetzt es genau das <img> in .abschluss-bild.
const { renderNavigation, mitVersion, ZURUECK_ICON, LAUTSPRECHER_ICON } = require('./renderer.js');
const { escapeHtml } = require('./html.js');

const KONFETTI_ANZAHL = 18;
const KONFETTI_FARBEN = ['var(--pfirsich)', 'var(--rosa)', 'var(--lavendel)', 'var(--gruen)', 'var(--blau)'];

/** Mehrere Absätze aus einem Textblock. Eine Leerzeile trennt. */
function renderAbsaetze(text) {
  return String(text)
    .split(/\n\s*\n/)
    .map((absatz) => absatz.trim())
    .filter((absatz) => absatz !== '')
    .map((absatz) => `<p>${absatz}</p>`)
    .join('\n');
}

/**
 * Konfetti aus einfachen Rechtecken.
 *
 * Lage, Verzögerung und Drehung stammen aus einer festen Rechnung, nicht aus
 * dem Zufall: der Build muss aus derselben Eingabe dieselbe Datei erzeugen,
 * sonst ändert sich bei jedem Lauf die Seite und man sieht im Vergleich
 * nicht mehr, was sich wirklich geändert hat. Die Bewegung selbst steht im
 * Stylesheet und entfällt dort, wenn jemand weniger Bewegung eingestellt hat.
 */
function renderKonfetti(anzahl = KONFETTI_ANZAHL) {
  const schnipsel = [];
  for (let i = 0; i < anzahl; i++) {
    const links = (i * 97) % 100;
    const verzug = ((i * 37) % 24) / 10;
    const dreh = (i * 53) % 360;
    const farbe = KONFETTI_FARBEN[i % KONFETTI_FARBEN.length];
    schnipsel.push(
      `<i class="konfetti-schnipsel" style="left:${links}%;background:${farbe};--verzug:${verzug}s;--dreh:${dreh}deg"></i>`
    );
  }
  return `<div class="konfetti" aria-hidden="true">${schnipsel.join('')}</div>`;
}

/**
 * @param {object} abschluss  Ergebnis von parseDokument bei typ: abschluss
 * @param {object} [navigation]  Ergebnis von baueNavigation
 * @param {{css?: string, js?: string, fortschritt?: string}} [versionen]
 * @param {string[]} [lernwegSchluessel]  alle Lektionen und Wiederholungen,
 *   ohne den Abschluss selbst – daraus macht fortschritt.js die Zahl
 */
function renderAbschlussHtml(abschluss, navigation, versionen = {}, lernwegSchluessel = []) {
  const titel = escapeHtml(abschluss.titel);

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titel} – Deutsch für Au-Pairs</title>
<link rel="stylesheet" href="${mitVersion('styles.css', versionen.css)}">
</head>
<body data-station="abschluss">
<header class="kopfzeile">
  <a class="zurueck" href="index.html">${ZURUECK_ICON}<span>Alle Lektionen</span></a>
  <span class="kopf-hinweis">Abschluss</span>
</header>
<main class="lektion lektion--abschluss">
${renderKonfetti()}

<section class="abschluss-kopf">
  <div class="abschluss-bild">
    <img src="bilder/mira.webp" alt="Mira winkt zum Abschied" width="640" height="1548" decoding="async">
  </div>
  <div class="abschluss-gruss">
    <p class="augenbraue">Geschafft</p>
    <h1>${titel}</h1>
    <p class="abschluss-stand" data-stationen="${lernwegSchluessel.join(',')}">Du bist am Ende des Kurses angekommen.</p>
  </div>
</section>

<section class="block block--audio">
<h2>Mira sagt dir noch etwas</h2>
<div class="audio-karte">
  <div class="audio-kopf">${LAUTSPRECHER_ICON}<span>Anhören</span></div>
  <audio controls preload="none" src="audio/abschluss/gratulation.mp3"></audio>
</div>
</section>

<section class="block block--gratulation">
<div class="erklaerung">
  <div data-sprache="de">
${renderAbsaetze(abschluss.gratulationDe)}
  </div>
  <div data-sprache="en" style="display:none">
${renderAbsaetze(abschluss.gratulationEn)}
  </div>
  <button class="sprach-umschalter" aria-pressed="false">Verstehst du das nicht? Hier auf Englisch</button>
</div>
</section>

<section class="block block--bescheinigung">
<h2>Deine Bescheinigung</h2>
<p>Eine Seite mit allem, was du geübt hast: alle 15 Lektionen und wozu sie gut waren. Du trägst deinen Namen ein und druckst sie aus oder speicherst sie als PDF.</p>
<p class="hero-knopfreihe"><a class="knopf knopf--primaer" href="zertifikat.html">Zur Bescheinigung</a></p>
<p class="hero-kleingedruckt">Das ist eine Teilnahmebescheinigung, keine Prüfung. Dein Name bleibt in deinem Browser.</p>
</section>

${renderNavigation(navigation)}<p class="lektion-fuss"><a class="zurueck" href="index.html">${ZURUECK_ICON}<span>Alle Lektionen in der Übersicht</span></a></p>

</main>
<script src="${mitVersion('toggle.js', versionen.js)}"></script>
<script src="${mitVersion('fortschritt.js', versionen.fortschritt)}"></script>
</body>
</html>`;
}

module.exports = { renderAbschlussHtml, renderAbsaetze, renderKonfetti };
```

- [ ] **Step 5: Tests laufen lassen**

Run: `node --test scripts/*.test.js`
Expected: PASS, auch alle Startseiten-Tests.

- [ ] **Step 6: Commit**

```bash
git add scripts/html.js scripts/abschluss.js scripts/abschluss.test.js scripts/startseite.js scripts/renderer.js
git commit -m "feat: Abschlussseite mit Mira, Gratulation und Fortschrittsanzeige"
```

---

### Task 6: Die Bescheinigung

Eine eigene Seite, die am Bildschirm erklärt und auf Papier eine Urkunde ist. Das PDF erzeugt der Browser über die Druckfunktion.

Inhaltlich gilt die Grenze aus den Entscheidungen: nirgends „A1 bestanden". Stattdessen steht konkret da, was geübt wurde – das überzeugt eine Gastfamilie mehr als eine Stufe, die sie ohnehin nicht einordnen kann.

Name und Datum stehen in Eingabefeldern mitten in der Urkunde. Eingabefelder drucken ihren Wert mit, das ist der einfachste Weg, der ohne Speichern auskommt. Im Druck verlieren sie Rahmen und Hintergrund und sehen aus wie eingetragene Zeilen.

**Files:**
- Create: `scripts/zertifikat.js`
- Create: `scripts/urkunde.js`
- Test: `scripts/zertifikat.test.js`, `scripts/urkunde.test.js`

**Interfaces:**
- Consumes: `mitVersion`, `ZURUECK_ICON` aus `renderer.js`; `escapeHtml` aus `html.js`; Abschlussobjekt aus Task 1; die geparsten Lektionen (`{id, titel, grammatikfokus}`) und `lektionen/wiederholungen.json`
- Produces:
  - `renderZertifikatHtml(lektionen, wiederholungsplan, abschluss, versionen)` → vollständiges HTML
  - `zaehleAuf(werte)` → `'4 und 7'`
  - `heuteAlsText(datum)` aus `urkunde.js` → `'08.10.2026'`
  - erwartet `versionen` als `{css, urkunde}`

- [ ] **Step 1: Die fehlschlagenden Tests schreiben**

`scripts/urkunde.test.js`:

```js
// scripts/urkunde.test.js
const test = require('node:test');
const assert = require('node:assert');
const { heuteAlsText } = require('./urkunde.js');

test('das Datum steht in deutscher Schreibweise mit führenden Nullen', () => {
  assert.strictEqual(heuteAlsText(new Date(2026, 9, 8)), '08.10.2026');
});

test('zweistellige Tage und Monate bleiben zweistellig', () => {
  assert.strictEqual(heuteAlsText(new Date(2026, 10, 23)), '23.11.2026');
});
```

`scripts/zertifikat.test.js`:

```js
// scripts/zertifikat.test.js
const test = require('node:test');
const assert = require('node:assert');
const { renderZertifikatHtml, zaehleAuf } = require('./zertifikat.js');

const LEKTIONEN = [
  { id: 1, titel: 'Ankommen und sich vorstellen', grammatikfokus: 'Verb „sein", Personalpronomen' },
  { id: 2, titel: 'Meine Gastfamilie', grammatikfokus: 'Possessivartikel' },
];

const WIEDERHOLUNGEN = [
  { nr: 1, nach: 4, titel: 'Wiederholung 1', umfasst: '1 bis 4' },
  { nr: 2, nach: 7, titel: 'Wiederholung 2', umfasst: '5 bis 7' },
];

const ABSCHLUSS = {
  art: 'abschluss',
  titel: 'Du hast es geschafft',
  bescheinigungDe: 'Dies ist eine Teilnahmebescheinigung, keine Prüfung.',
  bescheinigungEn: 'This is a confirmation of participation, not an examination.',
};

test('eine Aufzählung wird gesprochen, nicht mit Komma am Ende', () => {
  assert.strictEqual(zaehleAuf([4]), '4');
  assert.strictEqual(zaehleAuf([4, 7]), '4 und 7');
  assert.strictEqual(zaehleAuf([4, 7, 10]), '4, 7 und 10');
});

test('jede Lektion steht mit Titel und Grammatikfokus in der Tabelle', () => {
  const html = renderZertifikatHtml(LEKTIONEN, WIEDERHOLUNGEN, ABSCHLUSS, {});
  assert.match(html, /Ankommen und sich vorstellen/);
  assert.match(html, /Possessivartikel/);
});

test('die Zahl der Lektionen und Wiederholungen wird gezählt, nicht geraten', () => {
  const html = renderZertifikatHtml(LEKTIONEN, WIEDERHOLUNGEN, ABSCHLUSS, {});
  assert.match(html, /alle 2 Lektionen/);
  assert.match(html, /2 Wiederholungen/);
  assert.match(html, /nach den Lektionen 4 und 7/);
});

test('eine einzelne Wiederholung wird im Singular genannt', () => {
  const html = renderZertifikatHtml(LEKTIONEN, [WIEDERHOLUNGEN[0]], ABSCHLUSS, {});
  assert.match(html, /1 Wiederholung /);
  assert.match(html, /nach der Lektion 4/);
});

test('der zweisprachige Hinweis steht auf der Urkunde', () => {
  const html = renderZertifikatHtml(LEKTIONEN, WIEDERHOLUNGEN, ABSCHLUSS, {});
  assert.match(html, /Teilnahmebescheinigung, keine Prüfung/);
  assert.match(html, /not an examination/);
});

test('es wird nirgends ein bestandenes Niveau behauptet', () => {
  const html = renderZertifikatHtml(LEKTIONEN, WIEDERHOLUNGEN, ABSCHLUSS, {});
  assert.ok(!/bestanden/i.test(html));
  assert.ok(!/A1 erreicht/i.test(html));
});

test('es gibt kein Unterschriftsfeld', () => {
  const html = renderZertifikatHtml(LEKTIONEN, WIEDERHOLUNGEN, ABSCHLUSS, {});
  assert.ok(!/Unterschrift/i.test(html));
});

test('Name und Datum sind Felder zum Ausfüllen', () => {
  const html = renderZertifikatHtml(LEKTIONEN, WIEDERHOLUNGEN, ABSCHLUSS, {});
  assert.match(html, /id="name-feld"/);
  assert.match(html, /id="datum-feld"/);
});

test('die Bedienung am Bildschirm wird beim Drucken ausgeblendet', () => {
  const html = renderZertifikatHtml(LEKTIONEN, WIEDERHOLUNGEN, ABSCHLUSS, {});
  assert.match(html, /class="[^"]*nicht-drucken/);
});

test('das Skript für Datum und Druckknopf wird mit Versionsstempel geladen', () => {
  const html = renderZertifikatHtml(LEKTIONEN, WIEDERHOLUNGEN, ABSCHLUSS, { urkunde: 'ccc' });
  assert.match(html, /src="urkunde\.js\?v=ccc"/);
});
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag bestätigen**

Run: `node --test scripts/zertifikat.test.js scripts/urkunde.test.js`
Expected: FAIL, beide Module fehlen.

- [ ] **Step 3: Das Browserskript schreiben**

`scripts/urkunde.js`:

```js
// scripts/urkunde.js
//
// Zwei kleine Dinge auf der Bescheinigungsseite: das Datum vorausfüllen und
// den Druckknopf verdrahten. Beides könnte auch von Hand geschehen, aber ein
// leeres Datumsfeld bleibt erfahrungsgemäß leer.
//
// Nichts wird gespeichert. Name und Datum stehen nur im Formular und sind
// nach dem Schließen weg.

/** Datum in deutscher Schreibweise, ohne Rücksicht auf Spracheinstellungen. */
function heuteAlsText(datum) {
  const zwei = (zahl) => String(zahl).padStart(2, '0');
  return `${zwei(datum.getDate())}.${zwei(datum.getMonth() + 1)}.${datum.getFullYear()}`;
}

function registriereUrkunde() {
  const datumFeld = document.getElementById('datum-feld');
  if (datumFeld && !datumFeld.value) datumFeld.value = heuteAlsText(new Date());

  const knopf = document.getElementById('drucken');
  if (knopf) knopf.addEventListener('click', () => window.print());

  // Der Name ist das Einzige, was hier zu tun ist. Also gleich dorthin.
  const nameFeld = document.getElementById('name-feld');
  if (nameFeld && !nameFeld.value) nameFeld.focus();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { heuteAlsText };
} else {
  window.AuPairUrkunde = { heuteAlsText, registriereUrkunde };
  document.addEventListener('DOMContentLoaded', registriereUrkunde);
}
```

- [ ] **Step 4: Die Bescheinigungsseite schreiben**

`scripts/zertifikat.js`:

```js
// scripts/zertifikat.js
//
// Die Bescheinigung. Am Bildschirm eine Seite mit Anleitung, auf Papier eine
// Urkunde. Das PDF erzeugt der Browser über die Druckfunktion; eine
// PDF-Bibliothek wäre eine zusätzliche Abhängigkeit, müsste Schriften
// einbetten und geht dabei regelmäßig an Umlauten kaputt.
//
// Was hier steht, ist bewusst keine Niveaubehauptung. Ein Kurs ohne Prüfung
// kann kein Niveau bescheinigen. Stattdessen steht konkret da, was geübt
// wurde – für eine Gastfamilie oder Agentur ist das ohnehin die brauchbarere
// Angabe.
//
// Kein Unterschriftsfeld: Mira ist eine Zeichnung, und eine erfundene
// Signatur auf einem Dokument, das jemand vorlegt, wäre eine Lüge. Das
// Siegel nennt Kurs und Adresse, mehr an Prüfbarkeit ist hier ehrlich nicht
// zu haben.
const { mitVersion, ZURUECK_ICON } = require('./renderer.js');
const { escapeHtml } = require('./html.js');

const ADRESSE = 'hofa35.github.io/au-pair-deutsch';

const SIEGEL = `<svg class="siegel" viewBox="0 0 140 140" width="140" height="140" role="img" aria-label="Siegel Deutsch für Au-Pairs">
  <circle cx="70" cy="70" r="66" fill="none" stroke="currentColor" stroke-width="2"/>
  <circle cx="70" cy="70" r="58" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="3 4"/>
  <text x="70" y="58" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor">DEUTSCH</text>
  <text x="70" y="76" text-anchor="middle" font-size="12" fill="currentColor">FÜR</text>
  <text x="70" y="94" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor">AU-PAIRS</text>
</svg>`;

/** "4" / "4 und 7" / "4, 7 und 10" – aufzählen, wie man es spricht. */
function zaehleAuf(werte) {
  if (werte.length === 0) return '';
  if (werte.length === 1) return String(werte[0]);
  return `${werte.slice(0, -1).join(', ')} und ${werte[werte.length - 1]}`;
}

function renderZeilen(lektionen) {
  return lektionen
    .map(
      (lektion) => `      <tr>
        <td class="u-nr">${lektion.id}</td>
        <td class="u-titel">${escapeHtml(lektion.titel)}</td>
        <td class="u-fokus">${escapeHtml(lektion.grammatikfokus || '')}</td>
      </tr>`
    )
    .join('\n');
}

/**
 * @param {Array} lektionen  geparste Lektionen, nach id sortiert
 * @param {Array} wiederholungsplan  Inhalt von lektionen/wiederholungen.json
 * @param {object} abschluss  liefert den zweisprachigen Hinweis
 * @param {{css?: string, urkunde?: string}} [versionen]
 */
function renderZertifikatHtml(lektionen, wiederholungsplan, abschluss, versionen = {}) {
  const anzahlWdh = wiederholungsplan.length;
  const wdhSatz = anzahlWdh
    ? `Dazu ${anzahlWdh} ${anzahlWdh === 1 ? 'Wiederholung ' : 'Wiederholungen '}` +
      `${anzahlWdh === 1 ? 'nach der Lektion' : 'nach den Lektionen'} ` +
      `${zaehleAuf(wiederholungsplan.map((plan) => plan.nach))}: Aufgaben quer durch den bisherigen Stoff, ohne neuen Inhalt.`
    : '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bescheinigung – Deutsch für Au-Pairs</title>
<link rel="stylesheet" href="${mitVersion('styles.css', versionen.css)}">
</head>
<body class="zertifikat-seite">
<header class="kopfzeile nicht-drucken">
  <a class="zurueck" href="abschluss.html">${ZURUECK_ICON}<span>Zurück zum Abschluss</span></a>
  <span class="kopf-hinweis">Bescheinigung</span>
</header>
<main>

<section class="druckhinweis nicht-drucken">
  <h1>Deine Bescheinigung</h1>
  <p>Trag unten deinen Namen ein. Dann druckst du die Seite aus oder speicherst sie als PDF.</p>
  <p>Am Computer ist das am einfachsten. Auf dem Handy können nicht alle Browser drucken.</p>
  <p class="hero-knopfreihe"><button class="knopf knopf--primaer" id="drucken" type="button">Drucken oder als PDF speichern</button></p>
  <p class="hero-kleingedruckt">Dein Name bleibt in deinem Browser. Er wird nirgendwo gespeichert und nirgendwohin geschickt.</p>
</section>

<article class="urkunde">
  <div class="urkunde-kopf">
    <p class="urkunde-art">Teilnahmebescheinigung<span>Confirmation of participation</span></p>
    ${SIEGEL}
  </div>

  <p class="urkunde-vorspann">Diese Bescheinigung bestätigt, dass</p>
  <p class="urkunde-name"><input id="name-feld" type="text" autocomplete="name" placeholder="Dein Name" aria-label="Dein Name"></p>
  <p class="urkunde-satz">den offenen Kurs <strong>Deutsch für Au-Pairs</strong> vollständig durchgearbeitet hat: alle ${lektionen.length} Lektionen von Anfang bis Ende.</p>

  <table class="urkunde-tabelle">
    <thead>
      <tr><th class="u-nr">Nr.</th><th class="u-titel">Lektion</th><th class="u-fokus">Das wurde geübt</th></tr>
    </thead>
    <tbody>
${renderZeilen(lektionen)}
    </tbody>
  </table>

  <p class="urkunde-wdh">${wdhSatz}</p>

  <div class="urkunde-fuss">
    <p class="urkunde-datum"><span class="urkunde-feldname">Datum</span><input id="datum-feld" type="text" aria-label="Datum"></p>
    <p class="urkunde-quelle"><span class="urkunde-feldname">Kurs im Netz</span>${ADRESSE}</p>
  </div>

  <p class="urkunde-hinweis">${escapeHtml(abschluss.bescheinigungDe)}<span lang="en">${escapeHtml(abschluss.bescheinigungEn)}</span></p>
</article>

</main>
<script src="${mitVersion('urkunde.js', versionen.urkunde)}"></script>
</body>
</html>`;
}

module.exports = { renderZertifikatHtml, zaehleAuf };
```

- [ ] **Step 5: Tests laufen lassen**

Run: `node --test scripts/*.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/zertifikat.js scripts/zertifikat.test.js scripts/urkunde.js scripts/urkunde.test.js
git commit -m "feat: Bescheinigung als druckbare Seite ohne Niveaubehauptung"
```

---

### Task 7: Alles im Build verdrahten

Jetzt wird zusammengeführt: der Build liest die Abschlussdatei, hängt die Station an, kopiert die beiden neuen Browserskripte und die Tonspur, schreibt `abschluss.html` und `zertifikat.html`. Lektions- und Wiederholungsseiten melden ab jetzt ihre Station und laden `fortschritt.js`.

Zwei Ketten werden gebraucht: der Lernweg ohne Abschluss für die Fortschrittszahl – auf der Abschlussseite steht man ja schon – und der Lernweg mit Abschluss für die Fußnavigation.

**Files:**
- Modify: `scripts/build.js`
- Modify: `scripts/renderer.js` (body-Attribut, zusätzliches Skript)
- Modify: `scripts/wiederholung.js` (body-Attribut, zusätzliches Skript)
- Test: `scripts/renderer.test.js`, `scripts/wiederholung.test.js`

**Interfaces:**
- Consumes: alles aus Task 1 bis 6
- Produces: `dist/abschluss.html`, `dist/zertifikat.html`, `dist/fortschritt.js`, `dist/urkunde.js`, `dist/audio/abschluss/gratulation.mp3`

- [ ] **Step 1: Die fehlschlagenden Tests schreiben**

An das Ende von `scripts/renderer.test.js` anhängen. Die in dieser Datei schon vorhandene Hilfsfunktion für eine Testlektion benutzen; heißt sie anders als `testLektion`, den dortigen Namen übernehmen und die `id` im Erwartungswert an sie anpassen:

```js
test('eine Lektionsseite meldet sich als Station und lädt den Fortschritt', () => {
  const html = renderLektionHtml(testLektion(), null, null, { fortschritt: 'ddd' });
  assert.match(html, /<body data-station="lektion-1">/);
  assert.match(html, /src="fortschritt\.js\?v=ddd"/);
});
```

An das Ende von `scripts/wiederholung.test.js` anhängen, ebenso mit der dortigen Hilfsfunktion und ihrer Nummer:

```js
test('eine Wiederholungsseite meldet sich als Station und lädt den Fortschritt', () => {
  const html = renderWiederholungHtml(testWiederholung(), null, null, { fortschritt: 'eee' });
  assert.match(html, /<body data-station="wiederholung-1">/);
  assert.match(html, /src="fortschritt\.js\?v=eee"/);
});
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag bestätigen**

Run: `node --test scripts/renderer.test.js scripts/wiederholung.test.js`
Expected: FAIL, `<body>` trägt noch kein Attribut.

- [ ] **Step 3: Die beiden Seitenrenderer anpassen**

In `scripts/renderer.js` in `renderLektionHtml` die Zeile `<body>` ersetzen durch:

```js
<body data-station="lektion-${lektion.id}">
```

und am Seitenende, direkt nach der `toggle.js`-Zeile:

```js
<script src="${mitVersion('fortschritt.js', versionen.fortschritt)}"></script>
```

In `scripts/wiederholung.js` in `renderWiederholungHtml` genauso:

```js
<body data-station="wiederholung-${wiederholung.nr}">
```

und nach der `toggle.js`-Zeile:

```js
<script src="${mitVersion('fortschritt.js', versionen.fortschritt)}"></script>
```

Die Schlüssel müssen genau denen aus `stationen.js` entsprechen (`schluesselLektion`, `schluesselWdh`). Wer hier eine andere Schreibweise wählt, bekommt eine Fortschrittszahl, die immer null bleibt.

- [ ] **Step 4: Tests laufen lassen**

Run: `node --test scripts/*.test.js`
Expected: PASS.

- [ ] **Step 5: Build verdrahten**

In `scripts/build.js` die Importzeilen ergänzen:

```js
const { renderAbschlussHtml } = require('./abschluss.js');
const { renderZertifikatHtml } = require('./zertifikat.js');
const {
  schluesselLektion,
  schluesselWdh,
  SCHLUESSEL_ABSCHLUSS,
  baueStationen,
  mitAbschlussStation,
  letzteWiederholungVor,
} = require('./stationen.js');
```

Kopierzeilen und Versionen erweitern:

```js
  fs.copyFileSync(path.join(__dirname, 'toggle.js'), path.join(distDir, 'toggle.js'));
  fs.copyFileSync(path.join(__dirname, 'fortschritt.js'), path.join(distDir, 'fortschritt.js'));
  fs.copyFileSync(path.join(__dirname, 'urkunde.js'), path.join(distDir, 'urkunde.js'));
  fs.copyFileSync(path.join(__dirname, 'styles.css'), path.join(distDir, 'styles.css'));

  const versionen = {
    css: kurzpruefsumme(path.join(__dirname, 'styles.css')),
    js: kurzpruefsumme(path.join(__dirname, 'toggle.js')),
    fortschritt: kurzpruefsumme(path.join(__dirname, 'fortschritt.js')),
    urkunde: kurzpruefsumme(path.join(__dirname, 'urkunde.js')),
  };
```

Vor der Einlese-Schleife:

```js
  let abschluss = null;
```

In der Schleife den Verteiler ersetzen durch:

```js
    if (dokument.art === 'wiederholung') {
      if (!planNachNr.has(dokument.nr)) {
        console.warn(
          `Warnung: ${datei} fehlt in wiederholungen.json, die Seite wird gebaut, erscheint aber nicht im Lernweg`
        );
      }
      wiederholungen.push(dokument);
    } else if (dokument.art === 'abschluss') {
      abschluss = dokument;
    } else {
      lektionen.push(dokument);
    }
```

Den Kettenaufbau ersetzen durch:

```js
  // Zwei Fassungen der Kette: der Lernweg ohne Abschluss liefert die Zahl
  // für die Fortschrittsanzeige (auf der Abschlussseite steht man ja schon),
  // die Kette mit Abschluss liefert die Fußnavigation.
  const lernweg = baueStationen(uebersicht, wiederholungsplan, (text) =>
    console.warn(`Warnung: ${text}`)
  );
  const stationen = mitAbschlussStation(lernweg, abschluss);
  const lernwegSchluessel = lernweg.map((station) => station.schluessel);
```

Nach den beiden `gebaut.set`-Schleifen ergänzen:

```js
  if (abschluss) {
    gebaut.set(SCHLUESSEL_ABSCHLUSS, {
      titel: abschluss.titel,
      dateiname: 'abschluss.html',
      marke: 'Abschluss',
    });
  }
```

Nach der Schleife über die Wiederholungen, vor dem Bau der Startseite, einfügen:

```js
  if (abschluss) {
    // Miras Gratulation liegt in audio/abschluss/, erzeugt von
    // generate_audio.js. Fehlt sie, wird trotzdem gebaut: ein stummer
    // Abspieler ist weniger schlimm als eine Seite, die gar nicht erscheint.
    const abschlussAudioQuelle = path.join(wurzel, 'audio', 'abschluss');
    const abschlussAudioZiel = path.join(distDir, 'audio', 'abschluss');
    fs.mkdirSync(abschlussAudioZiel, { recursive: true });
    if (fs.existsSync(abschlussAudioQuelle)) {
      fs.cpSync(abschlussAudioQuelle, abschlussAudioZiel, { recursive: true });
    }
    if (!fs.existsSync(path.join(abschlussAudioZiel, 'gratulation.mp3'))) {
      console.warn('Warnung: Miras Gratulation fehlt, die Abschlussseite wird ohne Ton gebaut');
    }

    const navigation = baueNavigation(SCHLUESSEL_ABSCHLUSS, stationen, gebaut);
    fs.writeFileSync(
      path.join(distDir, 'abschluss.html'),
      renderAbschlussHtml(abschluss, navigation, versionen, lernwegSchluessel)
    );
    fs.writeFileSync(
      path.join(distDir, 'zertifikat.html'),
      renderZertifikatHtml(lektionen, wiederholungsplan, abschluss, versionen)
    );
  }
```

Die Abschlussmeldung erweitern:

```js
  console.log(
    `Build fertig: ${lektionen.length} von ${uebersicht.length} Lektion(en), ` +
      `${wiederholungen.length} von ${wiederholungsplan.length} Wiederholung(en)` +
      `${abschluss ? ' und der Abschluss' : ', ohne Abschlussseite'} in dist/`
  );
```

- [ ] **Step 6: Bauen und nachsehen**

Run: `node scripts/build.js`
Expected: `Build fertig: 15 von 15 Lektion(en), 4 von 4 Wiederholung(en) und der Abschluss in dist/`, keine Warnung.

Dann:

```bash
ls dist/abschluss.html dist/zertifikat.html dist/fortschritt.js dist/urkunde.js dist/audio/abschluss/gratulation.mp3
grep -c 'data-station=' dist/lektion-*.html dist/wiederholung-*.html | grep -v ':1$' || echo "jede Seite genau einmal"
```

Expected: alle Dateien vorhanden, jede Lektions- und Wiederholungsseite trägt genau ein `data-station`.

- [ ] **Step 7: Im Browser ansehen**

```bash
node -e "require('node:http').createServer((q,s)=>{const f=require('node:path').join('dist',q.url==='/'?'index.html':q.url.split('?')[0]);require('node:fs').readFile(f,(e,d)=>e?(s.writeHead(404),s.end()):(s.end(d)))}).listen(8123,()=>console.log('http://localhost:8123'))"
```

Von Lektion 15 aus auf „Weiter" klicken und prüfen:
- Die Abschlussseite erscheint
- Miras Tonspur startet erst auf Knopfdruck, nicht von allein
- Der Umschalter auf Englisch wirkt auf die ganze Gratulation
- Der Satz unter der Überschrift nennt eine Stationszahl, nicht den Vorgabetext
- Von der Bescheinigung aus führt „Zurück" wieder zum Abschluss

- [ ] **Step 8: Commit**

```bash
git add scripts/build.js scripts/renderer.js scripts/renderer.test.js scripts/wiederholung.js scripts/wiederholung.test.js
git commit -m "feat: Abschlussseite und Bescheinigung in den Build einhaengen"
```

---

### Task 8: Stilblatt für Abschluss, Konfetti und Druck

Bis hierhin ist die Seite inhaltlich richtig und sieht nach nichts aus. Jetzt kommen die Stile.

Zwei Punkte, an denen Druckseiten üblicherweise scheitern: Browser drucken Hintergrundfarben standardmäßig nicht mit, und Eingabefelder behalten im Druck ihren Rahmen. Beides wird ausdrücklich geregelt. Die Urkunde ist deshalb aus Linien und Typografie gebaut und trägt auch dann, wenn ein Drucker die Flächen weglässt.

**Files:**
- Modify: `scripts/styles.css` (nur anhängen, bestehende Regeln nicht umschreiben)

**Interfaces:**
- Consumes: die Klassennamen aus Task 5 und 6 sowie die vorhandenen Variablen aus `:root`
- Produces: keine Schnittstelle für andere Tasks

- [ ] **Step 1: Stile anhängen**

Ans Ende von `scripts/styles.css`:

```css
/* ---------- Abschlussseite ---------- */

.lektion--abschluss {
  position: relative;
}

.abschluss-kopf {
  display: grid;
  grid-template-columns: minmax(0, 160px) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: end;
  margin-bottom: 2rem;
}

/* Hier steht heute ein Standbild. Falls später ein Video kommt, ersetzt es
   genau das Kind dieses Behälters – die Maße bleiben dieselben. */
.abschluss-bild img {
  width: 100%;
  height: auto;
}

.abschluss-gruss h1 {
  margin: 0.2rem 0 0.6rem;
}

.abschluss-stand {
  margin: 0;
  color: var(--text-sanft);
  font-size: 1.02rem;
}

.block--gratulation .erklaerung p {
  margin: 0 0 0.9rem;
}

.block--gratulation .erklaerung p:last-child {
  margin-bottom: 0;
}

@media (max-width: 620px) {
  .abschluss-kopf {
    grid-template-columns: minmax(0, 110px) minmax(0, 1fr);
    gap: 1rem;
  }
}

/* ---------- Konfetti ---------- */

.konfetti {
  position: absolute;
  inset: 0 0 auto 0;
  height: 70vh;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.konfetti-schnipsel {
  position: absolute;
  top: -8vh;
  width: 9px;
  height: 14px;
  border-radius: 2px;
  opacity: 0;
  animation: konfetti-fall 3.4s var(--verzug, 0s) cubic-bezier(0.3, 0.6, 0.5, 1) forwards;
}

@keyframes konfetti-fall {
  0% {
    opacity: 0;
    transform: translateY(0) rotate(var(--dreh, 0deg));
  }
  10% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(72vh) rotate(calc(var(--dreh, 0deg) + 540deg));
  }
}

/* Wer weniger Bewegung eingestellt hat, bekommt sie auch hier nicht. */
@media (prefers-reduced-motion: reduce) {
  .konfetti {
    display: none;
  }
}

/* ---------- Bescheinigung am Bildschirm ---------- */

.zertifikat-seite main {
  max-width: 52rem;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
}

.druckhinweis {
  margin-bottom: 2rem;
}

.urkunde {
  background: var(--karte);
  border: 2px solid var(--text);
  border-radius: 4px;
  padding: 2.4rem 2.6rem 2rem;
  box-shadow: var(--schatten);
}

.urkunde-kopf {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--linie);
  padding-bottom: 1rem;
}

.urkunde-art {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.urkunde-art span {
  display: block;
  font-size: 0.86rem;
  font-weight: 400;
  color: var(--text-leise);
}

.siegel {
  flex: none;
  color: var(--text-sanft);
}

.urkunde-vorspann {
  margin: 1.6rem 0 0.2rem;
  color: var(--text-sanft);
}

.urkunde-name {
  margin: 0 0 0.4rem;
}

.urkunde-name input {
  width: 100%;
  font: inherit;
  font-size: 1.7rem;
  font-weight: 700;
  color: var(--text);
  padding: 0.2rem 0.1rem;
  background: transparent;
  border: 0;
  border-bottom: 1.5px solid var(--text);
}

.urkunde-name input::placeholder {
  color: var(--text-zart);
  font-weight: 400;
}

.urkunde-satz {
  margin: 0 0 1.6rem;
}

.urkunde-tabelle {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.urkunde-tabelle th {
  text-align: left;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-leise);
  border-bottom: 1px solid var(--text);
  padding: 0 0.5rem 0.3rem 0;
}

.urkunde-tabelle td {
  padding: 0.26rem 0.5rem 0.26rem 0;
  border-bottom: 1px solid var(--linie-zart);
  vertical-align: top;
}

.u-nr {
  width: 2.4rem;
  color: var(--text-leise);
}

.u-fokus {
  width: 42%;
  color: var(--text-sanft);
}

.urkunde-wdh {
  margin: 1rem 0 1.6rem;
  font-size: 0.9rem;
  color: var(--text-sanft);
}

.urkunde-fuss {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  border-top: 1px solid var(--linie);
  padding-top: 1rem;
}

.urkunde-feldname {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-leise);
}

.urkunde-datum,
.urkunde-quelle {
  margin: 0;
  font-size: 0.92rem;
}

.urkunde-datum input {
  font: inherit;
  color: var(--text);
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--linie);
  padding: 0.1rem 0;
  width: 8rem;
}

.urkunde-hinweis {
  margin: 1.2rem 0 0;
  font-size: 0.74rem;
  line-height: 1.45;
  color: var(--text-leise);
}

.urkunde-hinweis span {
  display: block;
  margin-top: 0.2rem;
  font-style: italic;
}

@media (max-width: 620px) {
  .urkunde {
    padding: 1.4rem 1.2rem;
  }
  .urkunde-fuss {
    flex-direction: column;
    gap: 0.8rem;
  }
}

/* ---------- Druck ---------- */

@media print {
  @page {
    size: A4 portrait;
    margin: 12mm;
  }

  .nicht-drucken {
    display: none !important;
  }

  body {
    background: #fff;
  }

  .zertifikat-seite main {
    max-width: none;
    padding: 0;
  }

  /* Browser lassen Hintergrundflächen beim Drucken standardmäßig weg. Die
     Urkunde ist deshalb aus Linien gebaut und trägt auch ohne Flächen; wo
     doch Farbe nötig ist, wird sie hier ausdrücklich verlangt. */
  .urkunde,
  .urkunde * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .urkunde {
    box-shadow: none;
    border: 2px solid #000;
    padding: 10mm 12mm;
    page-break-inside: avoid;
    break-inside: avoid;
    font-size: 10.5pt;
  }

  /* Eingabefelder behalten im Druck sonst Rahmen und Hintergrund und sehen
     aus wie ein Formular statt wie eine ausgefüllte Urkunde. */
  .urkunde input {
    border: 0 !important;
    background: transparent !important;
    color: #000 !important;
  }

  .urkunde-name input {
    font-size: 20pt;
    border-bottom: 1px solid #000 !important;
  }

  .urkunde-tabelle {
    font-size: 8.6pt;
  }

  .urkunde-tabelle td {
    padding: 1.1mm 2mm 1.1mm 0;
  }

  .urkunde-hinweis {
    font-size: 7pt;
  }
}
```

- [ ] **Step 2: Neu bauen und am Bildschirm ansehen**

Run: `node scripts/build.js`, dann den kleinen Server aus Task 7 Schritt 7 starten und `abschluss.html` sowie `zertifikat.html` öffnen.

Prüfen:
- Mira und Überschrift stehen nebeneinander, auf schmalem Fenster untereinander
- Das Konfetti fällt einmal und verschwindet, es bleibt nichts liegen und nichts flackert
- Die Urkunde sieht nach Urkunde aus, nicht nach Formular
- Der Name lässt sich eintippen, das Datum ist vorausgefüllt

- [ ] **Step 3: Die Druckansicht prüfen**

In Chrome oder Edge `zertifikat.html` öffnen, Strg+P. Wirklich hinsehen:

- Die Urkunde passt auf **eine** A4-Seite. Passt sie nicht, in `@media print` die Schriftgrößen von `.urkunde` und `.urkunde-tabelle` sowie die Zeilenhöhe `.urkunde-tabelle td` schrittweise verkleinern. Nicht die Tabelle kürzen: alle 15 Lektionen gehören darauf.
- Kopfzeile und Anleitung sind weg
- Der eingetippte Name steht im Ausdruck
- Ohne Hintergrundgrafiken (die Vorgabe im Druckdialog) ist die Urkunde immer noch vollständig lesbar
- Die Eingabefelder haben keinen Formularrahmen mehr

- [ ] **Step 4: Auf dem Handy ansehen**

`abschluss.html` und `zertifikat.html` auf einem Telefon öffnen, über die Netzadresse des kleinen Servers im selben WLAN.

Prüfen: nichts läuft seitlich aus dem Bild, die Tabelle bleibt lesbar, der Knopf ist mit dem Daumen zu treffen.

- [ ] **Step 5: Commit**

```bash
git add scripts/styles.css
git commit -m "style: Abschlussseite, Konfetti und Druckstile fuer die Bescheinigung"
```

---

### Task 9: Die Startseite sagt die Wahrheit

Auf der Startseite steht heute „Es wird nichts gespeichert", in der Fußzeile „Kein Zertifikat, keine Prüfung, kein Konto". Beides stimmt nach diesem Block nicht mehr. Eine Seite, die über sich selbst falsche Angaben macht, ist schlimmer als eine ohne Angaben.

Dazu kommt der Abschluss als sichtbares Ziel ans Ende des Rasters. Er nutzt das Band, das die Wiederholungen schon haben.

**Files:**
- Modify: `scripts/startseite.js`
- Modify: `scripts/build.js` (Abschluss an die Startseite durchreichen)
- Modify: `scripts/styles.css` (eine Regel für das Abschlussband)
- Test: `scripts/startseite.test.js`

**Interfaces:**
- Consumes: Abschlussobjekt aus Task 1
- Produces: `renderStartseiteHtml(uebersicht, gebaut, versionen, wiederholungen, abschluss)` – fünfter Parameter neu und freiwillig; `renderAbschlussKarte(abschluss)`

- [ ] **Step 1: Die fehlschlagenden Tests schreiben**

An das Ende von `scripts/startseite.test.js` anhängen:

```js
const ABSCHLUSS = { art: 'abschluss', titel: 'Du hast es geschafft' };

test('die Startseite behauptet nicht mehr, es werde nichts gespeichert', () => {
  const html = renderStartseiteHtml([], new Map(), {}, []);
  assert.ok(!html.includes('Es wird nichts gespeichert'));
  assert.match(html, /nur in deinem Browser/);
});

test('die Fußzeile behauptet nicht mehr, es gebe kein Zertifikat', () => {
  const html = renderStartseiteHtml([], new Map(), {}, []);
  assert.ok(!html.includes('Kein Zertifikat'));
  assert.match(html, /Teilnahmebescheinigung/);
});

test('der Abschluss steht als letztes Band im Raster', () => {
  const uebersicht = [{ nr: 1, titel: 'Erste', satz: 'Hallo', schlagwort: 'Start', akzent: '#FFECD2' }];
  const gebaut = new Map([[1, { titel: 'Erste', dateiname: 'lektion-01.html' }]]);
  const html = renderStartseiteHtml(uebersicht, gebaut, {}, [], ABSCHLUSS);
  assert.match(html, /href="abschluss\.html"/);
  assert.match(html, /Du hast es geschafft/);
});

test('ohne Abschlussdatei gibt es kein Abschlussband', () => {
  const uebersicht = [{ nr: 1, titel: 'Erste', satz: 'Hallo', schlagwort: 'Start', akzent: '#FFECD2' }];
  const gebaut = new Map([[1, { titel: 'Erste', dateiname: 'lektion-01.html' }]]);
  const html = renderStartseiteHtml(uebersicht, gebaut, {}, []);
  assert.ok(!html.includes('abschluss.html'));
});
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag bestätigen**

Run: `node --test scripts/startseite.test.js`
Expected: FAIL an den alten Formulierungen und am fehlenden Band.

- [ ] **Step 3: Startseite anpassen**

In `scripts/startseite.js` neben die vorhandenen Icons setzen:

```js
const POKAL_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M17 5h3v2a3 3 0 0 1-3 3"/><path d="M7 5H4v2a3 3 0 0 0 3 3"/></svg>`;
```

Nach `renderWiederholungsKarte` einfügen:

```js
/**
 * Das Abschlussband am Ende des Rasters. Es steht da, bevor jemand dort
 * ankommt: man soll von Anfang an sehen, worauf der Kurs zuläuft.
 */
function renderAbschlussKarte(abschluss) {
  if (!abschluss) return '';
  return `<li class="zwischenstation"><a class="karte karte--wiederholung karte--abschluss" href="abschluss.html">
  <span class="wkarte-marke" style="background:var(--signal)">${POKAL_ICON}Abschluss</span>
  <span class="wkarte-text">
    <span class="wkarte-titel">${escapeHtml(abschluss.titel)}</span>
    <span class="wkarte-info">Am Ende steht eine Bescheinigung über alles, was du geübt hast, zum Ausdrucken.</span>
  </span>
  <span class="karte-pfeil">${PFEIL_ICON}</span>
</a></li>`;
}
```

Die Signatur erweitern:

```js
function renderStartseiteHtml(uebersicht, gebaut, versionen = {}, wiederholungen = [], abschluss = null) {
```

Direkt nach der `forEach`-Schleife über die Übersicht:

```js
  kartenTeile.push(renderAbschlussKarte(abschluss));
  const karten = kartenTeile.filter((teil) => teil !== '').join('\n');
```

Die beiden falschen Sätze ersetzen:

```html
    <p class="hero-kleingedruckt">Kein Konto, keine Anmeldung. Dein Fortschritt bleibt nur in deinem Browser und wird nirgendwohin geschickt.</p>
```

```html
    <p class="fuss-klein">Offenes Lernangebot, orientiert an der A1-Progression des Goethe-Instituts. Am Ende gibt es eine Teilnahmebescheinigung zum Ausdrucken. Keine Prüfung, kein Konto.</p>
```

Export erweitern:

```js
module.exports = { renderStartseiteHtml, renderWiederholungsKarte, renderAbschlussKarte, escapeHtml };
```

- [ ] **Step 4: Build den Abschluss durchreichen lassen**

In `scripts/build.js` den Aufruf der Startseite ersetzen durch:

```js
  fs.writeFileSync(
    path.join(distDir, 'index.html'),
    renderStartseiteHtml(uebersicht, gebauteLektionen, versionen, wdhFuerStartseite, abschluss)
  );
```

- [ ] **Step 5: Eine Stilregel anhängen**

Ans Ende von `scripts/styles.css`:

```css
.karte--abschluss {
  border-color: var(--signal);
}
```

- [ ] **Step 6: Tests laufen lassen und bauen**

Run: `node --test scripts/*.test.js` und `node scripts/build.js`
Expected: PASS, Build ohne Warnung, `dist/index.html` enthält `abschluss.html`.

- [ ] **Step 7: Commit**

```bash
git add scripts/startseite.js scripts/startseite.test.js scripts/build.js scripts/styles.css
git commit -m "fix: Startseite nennt Fortschritt und Bescheinigung richtig"
```

---

### Task 10: Das falsche Bild zu Lektion 5

Die Illustration zu Lektion 5 behauptet an zwei Stellen, 14:10 Uhr sei „Viertel nach zwei". Viertel nach zwei ist 14:15. Die Lektion erklärt es richtig, das Bild widerspricht ihr. Solange nur eine Person den Kurs kannte, war das vertagbar; mit einer Bescheinigung in der Hand empfiehlt sie ihn weiter.

Die Korrektur gehört nach `scripts/bilder-aufbereiten.js` und nicht in die fertige WebP-Datei. Sonst kommt der Fehler beim nächsten Lauf der Bildaufbereitung kommentarlos zurück. Das Muster steht dort schon dreimal, zuletzt für den Rechtschreibfehler in Lektion 14.

Es wird nichts hinzugefügt, nur weggenommen. Übrig bleiben „Die Uhrzeit: 14:10 Uhr" oben und „… ist es 14:10 Uhr" unten – beides richtig und für sich verständlich.

**Voraussetzungen:** `ffmpeg` und `ffprobe` im PATH, Ordner `bildkarten-quelle/` lokal vorhanden (gitignoriert, läuft nicht in der CI).

**Files:**
- Modify: `scripts/bilder-aufbereiten.js` (Eintrag in `RETUSCHEN`)
- Modify: `bilder/lektion-05.webp` (Ergebnis des Laufs)

**Interfaces:**
- Consumes: `RETUSCHEN`, `retuscheFilter` (vorhanden); Koordinaten in Kartenmaßen 720×480
- Produces: keine Schnittstelle für andere Tasks

- [ ] **Step 1: Die beiden Stellen vermessen**

Die genauen Kanten lassen sich nicht aus dem Kopf setzen. Ausschnitte vergrößern und nachmessen:

```bash
cd "C:/Users/User/Desktop/Claude/Sessions/Au Pair Deutsch"
ffmpeg -v error -y -i bilder/lektion-05.webp -vf "crop=300:60:230:20,scale=1200:-1:flags=neighbor" /tmp/banner.png
ffmpeg -v error -y -i bilder/lektion-05.webp -vf "crop=400:40:320:440,scale=1600:-1:flags=neighbor" /tmp/tipp.png
```

Beide PNG ansehen und die Kanten der zu überdeckenden Stellen ablesen, zurückgerechnet auf Bildkoordinaten (Crop-Versatz wieder addieren, Skalierung herausrechnen).

Zu überdecken sind genau zwei Stellen:
1. Im Kopfbanner die zweite Zeile „= Viertel nach zwei". Die erste Zeile „Die Uhrzeit: 14:10 Uhr" bleibt stehen.
2. Im Tippkasten unten das Satzende „= Viertel nach zwei!". Der Rest „Wenn der kleine Zeiger auf die 2 zeigt und der große Zeiger auf die 2 → ist es 14:10 Uhr" bleibt stehen.

Ausgangswerte zum Nachmessen, **nicht ungeprüft übernehmen**: Banner etwa `links 258, rechts 444, oben 36, unten 64`; Tippkasten etwa `links 388, rechts 560, oben 450, unten 468`.

- [ ] **Step 2: Die Füllfarben auslesen**

Die überdeckende Fläche muss die Farbe des Untergrunds haben, sonst sieht man den Kasten. Beide Farben aus dem Bild selbst holen, nicht schätzen:

```bash
ffmpeg -v error -i bilder/lektion-05.webp -vf "crop=6:6:250:48" -f rawvideo -pix_fmt rgb24 - | xxd -l 3 -p
ffmpeg -v error -i bilder/lektion-05.webp -vf "crop=6:6:580:458" -f rawvideo -pix_fmt rgb24 - | xxd -l 3 -p
```

Die ausgelesenen Werte als `0xRRGGBB` notieren. Die Crop-Stellen so wählen, dass sie sicher neben dem Text, aber noch im selben Untergrund liegen.

- [ ] **Step 3: Den Eintrag ergänzen**

In `scripts/bilder-aufbereiten.js` in das Objekt `RETUSCHEN` einfügen, mit den gemessenen Werten statt der Platzhalter:

```js
  // Die Bildunterschrift behauptete, 14:10 Uhr sei "Viertel nach zwei".
  // Viertel nach zwei ist 14:15. Die Lektion erklärt es richtig, das Bild
  // widersprach ihr – und zwar zweimal, oben im Banner und unten im
  // Tippkasten. Beide Male wird nur der falsche Teil überdeckt. Übrig
  // bleiben "Die Uhrzeit: 14:10 Uhr" und "... ist es 14:10 Uhr", beides
  // richtig. Die Flächen sind rechteckig, oben und unten also derselbe Wert.
  5: [
    {
      links: 258,
      rechts: 444,
      obenLinks: 36,
      obenRechts: 36,
      untenLinks: 64,
      untenRechts: 64,
      farbe: '0xFFFFFF', // in Schritt 2 ausgelesen
      grund: 'falsche Uhrzeitangabe im Banner',
    },
    {
      links: 388,
      rechts: 560,
      obenLinks: 450,
      obenRechts: 450,
      untenLinks: 468,
      untenRechts: 468,
      farbe: '0xFFFFFF', // in Schritt 2 ausgelesen
      grund: 'falsche Uhrzeitangabe im Tippkasten',
    },
  ],
```

- [ ] **Step 4: Bildaufbereitung laufen lassen**

Run: `node scripts/bilder-aufbereiten.js`
Expected: Bei `lektion-05.webp` steht der Zusatz `(retuschiert: falsche Uhrzeitangabe im Banner, falsche Uhrzeitangabe im Tippkasten)`. Die drei bisherigen Retuschen für 7, 12 und 14 müssen weiterhin gemeldet werden.

- [ ] **Step 5: Ergebnis ansehen und nachbessern**

`bilder/lektion-05.webp` öffnen und prüfen:
- Beide falschen Stellen sind verschwunden
- Der richtige Rest steht noch vollständig da und ist nicht angeschnitten
- Die überdeckten Flächen fallen nicht als Kasten auf

Stimmt etwas nicht, Koordinaten oder Farbe anpassen und Schritt 4 wiederholen. Nicht die WebP-Datei von Hand bearbeiten: sie wird beim nächsten Lauf überschrieben.

Zusätzlich:

```bash
git diff --stat bilder/
```

Expected: nur `bilder/lektion-05.webp` geändert.

- [ ] **Step 6: Commit**

```bash
git add scripts/bilder-aufbereiten.js bilder/lektion-05.webp
git commit -m "fix: falsche Uhrzeitangabe aus dem Bild zu Lektion 5 entfernen"
```

---

### Task 11: Dokumentation, Gesamtprüfung, Veröffentlichung

**Files:**
- Modify: `README.md`
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: alles aus Task 1 bis 10
- Produces: keine

- [ ] **Step 1: README ergänzen**

Nach dem Abschnitt „Wiederholungen" anhängen:

```markdown
## Abschluss und Bescheinigung

Hinter der letzten Lektion liegt der Abschluss: Miras Gratulation, der
Fortschrittsstand und der Weg zur Bescheinigung. Erkannt wird die Datei an
`typ: abschluss`, genau wie Wiederholungen an `typ: wiederholung`.

    lektionen/abschluss.md

Aufbau:

    ## Gratulation Deutsch        Lesetext, mehrere Absätze erlaubt, Pflicht
    ## Gratulation Englisch       dieselbe Gratulation hinter dem Umschalter
    ## Gesprochen                 Text für Miras Tonspur, höchstens 500 Zeichen
    ## Bescheinigung Deutsch      Hinweis unten auf der Urkunde
    ## Bescheinigung Englisch     derselbe Hinweis auf Englisch

Der Sprechtext steht getrennt vom Lesetext, weil Gesprochenes kürzer und
einfacher sein muss. `generate_audio.js` macht daraus
`audio/abschluss/gratulation.mp3`.

Fehlt `lektionen/abschluss.md`, baut der Build ohne Abschlussseite und ohne
Bescheinigung durch und sagt das in seiner Schlussmeldung.

### Die Bescheinigung

`dist/zertifikat.html` ist am Bildschirm eine Seite mit Anleitung und auf
Papier eine Urkunde. Das PDF erzeugt der Browser über die Druckfunktion, es
gibt keine PDF-Bibliothek. Name und Datum stehen in Eingabefeldern mitten in
der Urkunde; Eingabefelder drucken ihren Wert mit, und nichts davon wird
gespeichert oder verschickt.

Zwei Festlegungen, die nicht aus Versehen entstanden sind:

Es steht nirgends, ein Niveau sei bestanden. Ein Kurs ohne Prüfung kann das
nicht bescheinigen. Stattdessen führt die Urkunde alle Lektionen mit ihrem
Grammatikfokus auf – für eine Gastfamilie oder Agentur die brauchbarere
Angabe.

Es gibt kein Unterschriftsfeld. Mira ist eine Zeichnung, eine erfundene
Signatur auf einem vorzeigbaren Dokument wäre eine Lüge. Das Siegel nennt
Kurs und Netzadresse.

Wer die Druckstile ändert, muss danach die Druckvorschau ansehen: Die
Urkunde muss auf eine A4-Seite passen, und sie muss auch dann lesbar sein,
wenn der Druckdialog Hintergrundgrafiken weglässt.

### Fortschritt

`scripts/fortschritt.js` merkt sich im `localStorage` des Browsers, welche
Stationen besucht wurden. Jede Lektions- und Wiederholungsseite meldet sich
über `<body data-station="...">`, die Abschlussseite zeigt die Zahl an.

Gesperrt wird nichts. Wer seinen Browserspeicher verliert, hat nichts falsch
gemacht und kommt trotzdem an seine Bescheinigung. In privaten Fenstern und
bei blockierten Cookies wirft schon der Zugriff auf `localStorage`; dann
verhält sich der Kurs wie vorher und zeigt den Stand einfach nicht an.
```

- [ ] **Step 2: Die CI die Tests laufen lassen**

Die CI baut heute nur. Ein gebrochener Test fällt dort nicht auf. In `.github/workflows/deploy.yml` vor dem Build-Schritt einfügen:

```yaml
      - run: node --test scripts/*.test.js
```

- [ ] **Step 3: Gesamtprüfung**

```bash
cd "C:/Users/User/Desktop/Claude/Sessions/Au Pair Deutsch"
node --test scripts/*.test.js
node scripts/pruefstand.js
rm -rf dist && node scripts/build.js
```

Expected:
- Alle Tests grün, deutlich mehr als die 87 vom Anfang
- Prüfstand meldet jede Datei als OK, auch `abschluss.md`
- Build ohne eine einzige Warnung, Schlussmeldung nennt 15 Lektionen, 4 Wiederholungen und den Abschluss

- [ ] **Step 4: Den ganzen Weg einmal gehen**

Server starten, dann von der Startseite aus:

- Startseite: unten im Raster steht das Abschlussband, der kleingedruckte Satz nennt den Browserspeicher, die Fußzeile die Teilnahmebescheinigung
- Zwei, drei Lektionen öffnen, dann die Abschlussseite: die Stationszahl muss den geöffneten Seiten entsprechen, nicht null und nicht alle
- Miras Tonspur abspielen
- Zur Bescheinigung, Namen eintippen, Druckvorschau öffnen, eine Seite prüfen
- Zurück auf die Abschlussseite, Seite neu laden: die Zahl darf nicht zurückfallen

- [ ] **Step 5: Commit und Veröffentlichung**

```bash
git add README.md .github/workflows/deploy.yml
git commit -m "docs: Abschluss, Bescheinigung und Fortschritt im README; Tests in der CI"
git push
```

Danach den Lauf der GitHub Action abwarten (etwa 25 Sekunden) und auf
`https://hofa35.github.io/au-pair-deutsch/` nachsehen:

- `abschluss.html` und `zertifikat.html` sind erreichbar
- Miras Tonspur lädt
- Die Bescheinigung lässt sich drucken

Falls der Browser alte Dateien zeigt: die Versionsstempel an `styles.css`,
`toggle.js`, `fortschritt.js` und `urkunde.js` prüfen. GitHub Pages hält
diese Dateien zehn Minuten im Zwischenspeicher, der Stempel umgeht das.

---

## Was dieser Plan ausdrücklich nicht enthält

- **Sprechaufnahme auf den Nachsprech-Blöcken.** Block zwei, eigener Plan. Die 75 vorhandenen Nachsprech-Sätze bleiben vorerst, wie sie sind.
- **Wiedereinstieg auf der Startseite.** Der Fortschritt wird gemerkt, aber die Startseite wertet ihn noch nicht aus.
- **Ein KI-Video von Mira.** Das Standbild sitzt in `.abschluss-bild` und lässt sich dort später ersetzen, ohne etwas anderes anzufassen.
- **A2.** Später, wenn überhaupt.
- **Ein Sperren der Bescheinigung hinter vollständigem Fortschritt.** Bewusst nicht, siehe Entscheidungen.

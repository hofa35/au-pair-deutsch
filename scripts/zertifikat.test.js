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

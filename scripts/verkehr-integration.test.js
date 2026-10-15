// scripts/verkehr-integration.test.js
//
// Ende-zu-Ende-Test über die ganze Kette: parsen -> validieren -> rendern.
// Die einzelnen Bausteine haben eigene Unit-Tests, aber keiner von ihnen
// prüft, ob ihre Schnittstellen tatsächlich zueinander passen (z.B. ob ein
// Feldname im Parser mit dem Feldnamen im Renderer übereinstimmt). Ein
// Tippfehler in einem Feldnamen würde sonst erst im gebauten HTML als
// "undefined" auffallen, nicht in den Tests.
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { parseVerkehrsmodul } = require('./verkehr-parser.js');
const { validateVerkehrsmodul } = require('./verkehr-pruefstand.js');
const { renderModulHtml } = require('./verkehr-renderer.js');

const fixturePfad = path.join(__dirname, 'fixtures', 'test-verkehrsmodul.md');

test('parse -> validate -> render: die Testdatei ergibt ein gültiges, vollständiges HTML', () => {
  const modul = parseVerkehrsmodul(fixturePfad);
  const result = validateVerkehrsmodul(modul);
  assert.strictEqual(result.valid, true, result.errors.join(', '));

  const html = renderModulHtml(modul);

  // Kein Feld ist beim Übergang von einer Stufe zur nächsten verlorengegangen.
  assert.doesNotMatch(html, /undefined/);
  assert.match(html, /Testmodul/);
  assert.match(html, /Das ist die deutsche Einleitung\./);
  assert.match(html, /Was ist richtig\?/);
  assert.match(html, /Richtige Antwort/);
  assert.match(html, /Weil das die Regel ist\./);
  assert.match(html, /Zweite Aufgabe/);
});

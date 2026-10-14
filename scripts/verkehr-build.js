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

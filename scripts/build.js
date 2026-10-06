// scripts/build.js
const fs = require('node:fs');
const path = require('node:path');
const { parseLektion } = require('./parser.js');
const { validateLektion } = require('./pruefstand.js');
const { renderLektionHtml, baueNavigation } = require('./renderer.js');
const { renderStartseiteHtml } = require('./startseite.js');

function dateinameFuer(id) {
  return `lektion-${String(id).padStart(2, '0')}.html`;
}

function main() {
  const wurzel = path.join(__dirname, '..');
  const lektionenDir = path.join(wurzel, 'lektionen');
  const bilderDir = path.join(wurzel, 'bilder');
  const distDir = path.join(wurzel, 'dist');

  fs.mkdirSync(distDir, { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'toggle.js'), path.join(distDir, 'toggle.js'));
  fs.copyFileSync(path.join(__dirname, 'styles.css'), path.join(distDir, 'styles.css'));

  // Bilder sind fertig aufbereitet eingecheckt (siehe scripts/bilder-aufbereiten.js).
  if (fs.existsSync(bilderDir)) {
    fs.cpSync(bilderDir, path.join(distDir, 'bilder'), { recursive: true });
  } else {
    console.warn('Warnung: Ordner bilder/ fehlt, Seite wird ohne Illustrationen gebaut');
  }

  const uebersicht = JSON.parse(
    fs.readFileSync(path.join(lektionenDir, 'uebersicht.json'), 'utf8')
  );
  const uebersichtNachNr = new Map(uebersicht.map((e) => [e.nr, e]));

  // Erst alle Lektionen einlesen und prüfen. Die Fußnavigation braucht die
  // Nachbarn, deshalb muss der Bestand vollständig sein, bevor gerendert wird.
  const dateien = fs.readdirSync(lektionenDir).filter((f) => f.endsWith('.md'));
  const lektionen = [];

  for (const datei of dateien) {
    const lektion = parseLektion(path.join(lektionenDir, datei));
    const result = validateLektion(lektion);
    if (!result.valid) {
      throw new Error(`${datei} ist ungültig: ${result.errors.join(', ')}`);
    }
    lektionen.push(lektion);
  }

  lektionen.sort((a, b) => a.id - b.id);
  const gebaut = new Map(
    lektionen.map((l) => [l.id, { titel: l.titel, dateiname: dateinameFuer(l.id) }])
  );

  for (const lektion of lektionen) {
    // Alle Audiodateien der Lektion mitnehmen: Hörübung und Nachsprech-Sätze.
    const audioQuellDir = path.join(wurzel, 'audio', String(lektion.id));
    const audioZielDir = path.join(distDir, 'audio', String(lektion.id));
    fs.mkdirSync(audioZielDir, { recursive: true });
    if (fs.existsSync(audioQuellDir)) {
      fs.cpSync(audioQuellDir, audioZielDir, { recursive: true });
    }
    if (!fs.existsSync(path.join(audioZielDir, 'hoeruebung.mp3'))) {
      console.warn(`Warnung: keine Hörübung für Lektion ${lektion.id} gefunden, Seite wird trotzdem gebaut`);
    }
    for (let i = 1; i <= lektion.nachsprechen.length; i++) {
      if (!fs.existsSync(path.join(audioZielDir, `nachsprechen-${i}.mp3`))) {
        console.warn(`Warnung: Lektion ${lektion.id}, Nachsprech-Satz ${i} hat kein Audio`);
      }
    }

    const html = renderLektionHtml(
      lektion,
      uebersichtNachNr.get(lektion.id),
      baueNavigation(lektion.id, uebersicht, gebaut)
    );
    fs.writeFileSync(path.join(distDir, dateinameFuer(lektion.id)), html);
  }

  fs.writeFileSync(path.join(distDir, 'index.html'), renderStartseiteHtml(uebersicht, gebaut));

  console.log(`Build fertig: ${gebaut.size} von ${uebersicht.length} Lektion(en) in dist/`);
}

main();

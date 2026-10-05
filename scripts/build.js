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

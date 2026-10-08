// scripts/build.js
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseDokument } = require('./parser.js');
const { validateDokument } = require('./pruefstand.js');
const { renderLektionHtml, baueNavigation } = require('./renderer.js');
const { renderWiederholungHtml } = require('./wiederholung.js');
const { renderStartseiteHtml } = require('./startseite.js');
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

function kurzpruefsumme(datei) {
  return crypto.createHash('sha1').update(fs.readFileSync(datei)).digest('hex').slice(0, 10);
}

function dateinameFuer(id) {
  return `lektion-${String(id).padStart(2, '0')}.html`;
}

function wdhDateinameFuer(nr) {
  return `wiederholung-${String(nr).padStart(2, '0')}.html`;
}

function main() {
  const wurzel = path.join(__dirname, '..');
  const lektionenDir = path.join(wurzel, 'lektionen');
  const bilderDir = path.join(wurzel, 'bilder');
  const distDir = path.join(wurzel, 'dist');

  fs.mkdirSync(distDir, { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'toggle.js'), path.join(distDir, 'toggle.js'));
  fs.copyFileSync(path.join(__dirname, 'fortschritt.js'), path.join(distDir, 'fortschritt.js'));
  fs.copyFileSync(path.join(__dirname, 'urkunde.js'), path.join(distDir, 'urkunde.js'));
  fs.copyFileSync(path.join(__dirname, 'styles.css'), path.join(distDir, 'styles.css'));

  // Prüfsummen von Stylesheet und Skript. Sie hängen als ?v=... an den
  // Verweisen, damit Browser nach einer Änderung nicht altes CSS zu neuem
  // HTML mischen. GitHub Pages speichert diese Dateien zehn Minuten zwischen.
  const versionen = {
    css: kurzpruefsumme(path.join(__dirname, 'styles.css')),
    js: kurzpruefsumme(path.join(__dirname, 'toggle.js')),
    fortschritt: kurzpruefsumme(path.join(__dirname, 'fortschritt.js')),
    urkunde: kurzpruefsumme(path.join(__dirname, 'urkunde.js')),
  };

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

  const wdhPlanPfad = path.join(lektionenDir, 'wiederholungen.json');
  const wiederholungsplan = fs.existsSync(wdhPlanPfad)
    ? JSON.parse(fs.readFileSync(wdhPlanPfad, 'utf8'))
    : [];
  const planNachNr = new Map(wiederholungsplan.map((p) => [p.nr, p]));

  // Erst alles einlesen und prüfen. Die Fußnavigation braucht die Nachbarn,
  // deshalb muss der Bestand vollständig sein, bevor gerendert wird.
  const dateien = fs.readdirSync(lektionenDir).filter((f) => f.endsWith('.md'));
  const lektionen = [];
  const wiederholungen = [];
  let abschluss = null;

  for (const datei of dateien) {
    const dokument = parseDokument(path.join(lektionenDir, datei));
    const result = validateDokument(dokument);
    if (!result.valid) {
      throw new Error(`${datei} ist ungültig: ${result.errors.join(', ')}`);
    }
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
  }

  lektionen.sort((a, b) => a.id - b.id);
  wiederholungen.sort((a, b) => a.nr - b.nr);

  // Zwei Fassungen der Kette: der Lernweg ohne Abschluss liefert die Zahl
  // für die Fortschrittsanzeige (auf der Abschlussseite steht man ja schon),
  // die Kette mit Abschluss liefert die Fußnavigation.
  const lernweg = baueStationen(uebersicht, wiederholungsplan, (text) =>
    console.warn(`Warnung: ${text}`)
  );
  const stationen = mitAbschlussStation(lernweg, abschluss);
  const lernwegSchluessel = lernweg.map((station) => station.schluessel);

  const gebaut = new Map();
  for (const lektion of lektionen) {
    gebaut.set(schluesselLektion(lektion.id), {
      titel: lektion.titel,
      dateiname: dateinameFuer(lektion.id),
    });
  }
  for (const wdh of wiederholungen) {
    gebaut.set(schluesselWdh(wdh.nr), {
      titel: wdh.titel,
      dateiname: wdhDateinameFuer(wdh.nr),
      marke: `Wiederholung ${wdh.nr}`,
    });
  }
  if (abschluss) {
    gebaut.set(SCHLUESSEL_ABSCHLUSS, {
      titel: abschluss.titel,
      dateiname: 'abschluss.html',
      marke: 'Abschluss',
    });
  }

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

    const schluessel = schluesselLektion(lektion.id);
    const navigation = baueNavigation(schluessel, stationen, gebaut);
    navigation.wiederholung = letzteWiederholungVor(schluessel, stationen, gebaut);

    const html = renderLektionHtml(
      lektion,
      uebersichtNachNr.get(lektion.id),
      navigation,
      versionen
    );
    fs.writeFileSync(path.join(distDir, dateinameFuer(lektion.id)), html);
  }

  // Wiederholungsseiten brauchen kein Audio: hier wird geschrieben und
  // erkannt, gehört wird in den Lektionen.
  for (const wdh of wiederholungen) {
    const html = renderWiederholungHtml(
      wdh,
      planNachNr.get(wdh.nr),
      baueNavigation(schluesselWdh(wdh.nr), stationen, gebaut),
      versionen
    );
    fs.writeFileSync(path.join(distDir, wdhDateinameFuer(wdh.nr)), html);
  }

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

  const gebauteLektionen = new Map(
    lektionen.map((l) => [l.id, { titel: l.titel, dateiname: dateinameFuer(l.id) }])
  );
  const wdhFuerStartseite = wiederholungsplan.map((plan) => {
    const fertig = gebaut.get(schluesselWdh(plan.nr));
    return fertig ? { ...plan, titel: fertig.titel, dateiname: fertig.dateiname } : plan;
  });

  fs.writeFileSync(
    path.join(distDir, 'index.html'),
    renderStartseiteHtml(uebersicht, gebauteLektionen, versionen, wdhFuerStartseite)
  );

  console.log(
    `Build fertig: ${lektionen.length} von ${uebersicht.length} Lektion(en), ` +
      `${wiederholungen.length} von ${wiederholungsplan.length} Wiederholung(en)` +
      `${abschluss ? ' und der Abschluss' : ', ohne Abschlussseite'} in dist/`
  );
}

main();

function renderWortschatz(wortschatz) {
  return wortschatz
    .map(
      (eintrag) =>
        `<li><span class="deutsch">${eintrag.de}</span> <span class="englisch">(${eintrag.en})</span></li>`
    )
    .join('\n');
}

function renderDialog(dialogText) {
  return dialogText
    .split('\n')
    .filter((zeile) => zeile.trim() !== '')
    .map((zeile) => {
      const match = zeile.match(/^\*\*(.+?):\*\*\s*(.*)$/);
      if (!match) return `<p class="dialog-zeile">${zeile}</p>`;
      const [, sprecher, rest] = match;
      return `<p class="dialog-zeile"><span class="sprecher">${sprecher}:</span> ${rest}</p>`;
    })
    .join('\n');
}

const LAUTSPRECHER_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>`;

function renderLektionHtml(lektion) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${lektion.titel}</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
<main class="lektion">
<h1>${lektion.titel}</h1>
<p class="lernziel">${lektion.lernziel}</p>

<section class="block block--wortschatz">
<h2>Wortschatz</h2>
<ul class="wortschatz-liste">
${renderWortschatz(lektion.wortschatz)}
</ul>
</section>

<section class="block block--dialog">
<h2>Dialog</h2>
<div class="dialog">
${renderDialog(lektion.dialog)}
</div>
</section>

<section class="block block--grammatik">
<h2>Grammatik</h2>
<div class="erklaerung">
  <p class="erklaerung-text" data-sprache="de">${lektion.grammatikDe}</p>
  <p class="erklaerung-text" data-sprache="en" style="display:none">${lektion.grammatikEn}</p>
  <button class="sprach-umschalter" aria-pressed="false">Verstehst du das nicht? Hier auf Englisch</button>
</div>
</section>

<section class="block block--uebung">
<h2>Übung</h2>
<div class="uebung-text">${lektion.uebung}</div>
</section>

<section class="block block--audio">
<h2>Hörübung</h2>
<div class="audio-karte">
  <div class="audio-kopf">${LAUTSPRECHER_ICON}<span>Anhören</span></div>
  <audio controls src="audio/${lektion.id}/hoeruebung.mp3"></audio>
  <p class="uebung-text">${lektion.hoertext}</p>
</div>
</section>

</main>
<script src="toggle.js"></script>
</body>
</html>`;
}

module.exports = { renderLektionHtml };

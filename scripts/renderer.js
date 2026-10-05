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

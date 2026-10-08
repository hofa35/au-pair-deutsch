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

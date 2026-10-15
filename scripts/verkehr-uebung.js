// scripts/verkehr-uebung.js
//
// Wertet eine Multiple-Choice-Aufgabe sofort im Browser aus, ohne Server:
// richtig/falsch markieren, Erklärung aufdecken. Die Vergleichslogik steht
// in einer reinen Funktion (testbar ohne Browser), der Rest ist
// DOM-Verdrahtung nach dem Muster von toggle.js.

function istAntwortRichtig(ausgewaehlterIndex, richtigIndex) {
  return ausgewaehlterIndex === richtigIndex;
}

function werteAufgabeAus(formular) {
  const richtigIndex = Number(formular.dataset.richtig);
  const ausgewaehlt = formular.querySelector('input[type="radio"]:checked');
  if (!ausgewaehlt) return;

  const istRichtig = istAntwortRichtig(Number(ausgewaehlt.value), richtigIndex);

  formular.querySelectorAll('.option').forEach((label) => {
    label.classList.remove('option--richtig', 'option--falsch');
  });
  const gewaehlteLabel = ausgewaehlt.closest('.option');
  if (gewaehlteLabel) {
    gewaehlteLabel.classList.add(istRichtig ? 'option--richtig' : 'option--falsch');
  }

  const aufgabe = formular.closest('.aufgabe');
  if (!aufgabe) return;

  const rueckmeldung = aufgabe.querySelector('.rueckmeldung');
  if (rueckmeldung) {
    rueckmeldung.hidden = false;
    rueckmeldung.textContent = istRichtig
      ? 'Richtig!'
      : 'Das ist nicht richtig – lies die Erklärung unten.';
    rueckmeldung.classList.toggle('rueckmeldung--richtig', istRichtig);
    rueckmeldung.classList.toggle('rueckmeldung--falsch', !istRichtig);
  }

  const erklaerungFeld = aufgabe.querySelector('.erklaerung-feld');
  if (erklaerungFeld) erklaerungFeld.hidden = false;
}

function registriereUebungen() {
  document.querySelectorAll('.optionen').forEach((formular) => {
    formular.addEventListener('change', () => werteAufgabeAus(formular));
    // Verhindert, dass die Enter-Taste auf einem Options-Feld das Formular
    // absendet und die Seite neu lädt – ohne Absende-Knopf würde das sonst
    // jede gewählte Antwort und jede aufgeklappte Erklärung löschen.
    formular.addEventListener('submit', (ereignis) => ereignis.preventDefault());
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { istAntwortRichtig };
} else {
  window.VerkehrUebung = { registriereUebungen };
  document.addEventListener('DOMContentLoaded', registriereUebungen);
}

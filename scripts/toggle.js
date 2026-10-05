function naechsterZustand(aktuell) {
  return aktuell === 'de' ? 'en' : 'de';
}

function wendeZustandAufDomAn(zustand) {
  document.querySelectorAll('[data-sprache]').forEach((el) => {
    el.style.display = el.dataset.sprache === zustand ? '' : 'none';
  });
}

function registriereUmschalter() {
  const beschriftung = {
    de: 'Verstehst du das nicht? Hier auf Englisch',
    en: 'Zurück auf Deutsch',
  };

  document.querySelectorAll('.sprach-umschalter').forEach((button) => {
    let zustand = 'de';
    button.addEventListener('click', () => {
      zustand = naechsterZustand(zustand);
      const ziel = button.closest('.erklaerung');
      ziel.querySelectorAll('[data-sprache]').forEach((el) => {
        el.style.display = el.dataset.sprache === zustand ? '' : 'none';
      });
      button.textContent = beschriftung[zustand];
      button.setAttribute('aria-pressed', zustand === 'en' ? 'true' : 'false');
    });
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { naechsterZustand };
} else {
  window.AuPairToggle = { naechsterZustand, registriereUmschalter };
  document.addEventListener('DOMContentLoaded', registriereUmschalter);
}

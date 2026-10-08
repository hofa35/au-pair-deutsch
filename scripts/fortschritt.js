// scripts/fortschritt.js
//
// Merkt sich, welche Stationen schon besucht wurden. Nur im Browser der
// Lernenden: es gibt kein Konto und keinen Server, der das annehmen könnte,
// und nichts verlässt das Gerät.
//
// Bewusst kein Türsteher. Der Stand wird angezeigt, aber nichts gesperrt.
// Wer seinen Browserspeicher verliert, hat nichts falsch gemacht und soll
// nicht vor einer verschlossenen Tür stehen.
const SPEICHER_SCHLUESSEL = 'au-pair-deutsch:fortschritt';
const PROBE_SCHLUESSEL = 'au-pair-deutsch:probe';

/**
 * Holt den Browserspeicher, falls er benutzbar ist.
 *
 * In privaten Fenstern und bei blockierten Cookies wirft schon der Zugriff
 * auf die Eigenschaft, nicht erst das Schreiben. Deshalb wird einmal
 * probeweise geschrieben und wieder gelöscht, bevor der Speicher als
 * brauchbar gilt.
 */
function holeSpeicher() {
  try {
    const speicher = window.localStorage;
    speicher.setItem(PROBE_SCHLUESSEL, '1');
    speicher.removeItem(PROBE_SCHLUESSEL);
    return speicher;
  } catch (fehler) {
    return null;
  }
}

/** Liest den Stand. Alles Unerwartete gilt als "noch nichts besucht". */
function liesFortschritt(speicher) {
  try {
    const roh = speicher.getItem(SPEICHER_SCHLUESSEL);
    if (!roh) return { besucht: [] };
    const daten = JSON.parse(roh);
    if (!daten || !Array.isArray(daten.besucht)) return { besucht: [] };
    return { besucht: daten.besucht.filter((eintrag) => typeof eintrag === 'string') };
  } catch (fehler) {
    return { besucht: [] };
  }
}

/** Trägt eine Station ein, falls sie noch nicht drinsteht. */
function merkeStation(speicher, schluessel) {
  const stand = liesFortschritt(speicher);
  if (!schluessel || stand.besucht.includes(schluessel)) return stand;
  const neu = { besucht: [...stand.besucht, schluessel] };
  try {
    speicher.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(neu));
  } catch (fehler) {
    // Speicher voll oder gesperrt. Der Kurs funktioniert auch ohne.
  }
  return neu;
}

/**
 * Zählt nur Stationen, die es im Kurs wirklich gibt. Wird eine Lektion
 * später umbenannt, fällt ihr alter Eintrag damit still heraus, statt die
 * Zahl über das Mögliche zu heben.
 */
function zaehleBesucht(stand, alleSchluessel) {
  const besucht = new Set(stand.besucht);
  return alleSchluessel.filter((schluessel) => besucht.has(schluessel)).length;
}

/**
 * Der Satz unter der Gratulation. Nie tadelnd: wer nichts gemerkt bekommen
 * hat, liest keinen Vorwurf, sondern die Erklärung.
 */
function textFuerStand(zahl, gesamt) {
  if (!gesamt) return '';
  if (zahl === 0) {
    return 'Dein Browser hat sich nichts gemerkt. Das ist kein Problem, deine Bescheinigung bekommst du trotzdem.';
  }
  if (zahl >= gesamt) {
    return `Du warst auf allen ${gesamt} Stationen des Kurses.`;
  }
  return `Du warst auf ${zahl} von ${gesamt} Stationen. Der Rest wartet noch auf dich.`;
}

function registriereFortschritt() {
  const speicher = holeSpeicher();
  if (!speicher) return;

  const station = document.body.dataset.station;
  if (station) merkeStation(speicher, station);

  const anzeige = document.querySelector('[data-stationen]');
  if (!anzeige) return;
  const alle = anzeige.dataset.stationen.split(',').filter((schluessel) => schluessel !== '');
  const text = textFuerStand(zaehleBesucht(liesFortschritt(speicher), alle), alle.length);
  if (text) anzeige.textContent = text;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SPEICHER_SCHLUESSEL, liesFortschritt, merkeStation, zaehleBesucht, textFuerStand };
} else {
  window.AuPairFortschritt = { registriereFortschritt };
  document.addEventListener('DOMContentLoaded', registriereFortschritt);
}

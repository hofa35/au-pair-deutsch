// scripts/stationen.js
//
// Die Lernreihenfolge. Eine Station ist entweder eine Lektion oder eine
// Wiederholung; beide liegen in einer gemeinsamen Kette.
//
// Lektionen und Wiederholungen haben eigene Nummern (Lektion 4 und
// Wiederholung 4 gibt es beide), deshalb bekommt jede Station einen
// Schlüssel mit ihrer Art davor.
const schluesselLektion = (nr) => `lektion-${nr}`;
const schluesselWdh = (nr) => `wiederholung-${nr}`;

/**
 * Baut die Kette: alle Lektionen der Übersicht, dazwischen die
 * Wiederholungen an der Stelle, die ihr Feld "nach" angibt.
 *
 * Nur diese Reihenfolge entscheidet über die Fußnavigation. Eine
 * Wiederholung ist damit keine Abkürzung neben dem Weg, sondern liegt auf
 * ihm: nach Lektion 4 führt "Weiter" zur Wiederholung, erst von dort geht
 * es zu Lektion 5. Freiwillige Wiederholung würde übersprungen, und zwar
 * besonders von denen, die sie brauchen.
 *
 * @param {Array} uebersicht  Inhalt von lektionen/uebersicht.json
 * @param {Array} wiederholungsplan  Inhalt von lektionen/wiederholungen.json
 * @param {function} [warnen]  Meldung für Planeinträge ohne passende Lektion
 */
function baueStationen(uebersicht, wiederholungsplan, warnen = () => {}) {
  const planNach = new Map();
  for (const plan of wiederholungsplan) {
    if (!planNach.has(plan.nach)) planNach.set(plan.nach, []);
    planNach.get(plan.nach).push(plan);
  }

  const bekannt = new Set(uebersicht.map((e) => e.nr));
  for (const plan of wiederholungsplan) {
    if (!bekannt.has(plan.nach)) {
      warnen(
        `Wiederholung ${plan.nr} soll nach Lektion ${plan.nach} stehen, die es in der Übersicht nicht gibt, sie wird übersprungen`
      );
    }
  }

  const stationen = [];
  for (const eintrag of uebersicht) {
    stationen.push({
      schluessel: schluesselLektion(eintrag.nr),
      nr: eintrag.nr,
      titel: eintrag.titel,
    });
    for (const plan of planNach.get(eintrag.nr) || []) {
      stationen.push({
        schluessel: schluesselWdh(plan.nr),
        nr: plan.nr,
        titel: plan.titel,
        umfasst: plan.umfasst,
        // Nur Wiederholungen haben eine eigene Marke. Daran erkennt die
        // Navigation sie wieder, ohne den Schlüssel zerlegen zu müssen.
        marke: `Wiederholung ${plan.nr}`,
      });
    }
  }
  return stationen;
}

/**
 * Sucht die letzte Wiederholung, die vor dieser Station schon vorgekommen
 * und fertig gebaut ist. Daraus wird auf der Lektionsseite der kleine
 * Zweitverweis. Nach vorn wird nie verwiesen: was noch nicht dran war,
 * kann man auch nicht wiederholen.
 */
function letzteWiederholungVor(schluessel, stationen, gebaut) {
  const stelle = stationen.findIndex((s) => s.schluessel === schluessel);
  for (let i = stelle - 1; i >= 0; i--) {
    const station = stationen[i];
    if (!station.marke) continue;
    const fertig = gebaut.get(station.schluessel);
    if (fertig) {
      return {
        dateiname: fertig.dateiname,
        beschriftung: `Wiederholung: Lektion ${station.umfasst}`,
      };
    }
  }
  return null;
}

module.exports = { schluesselLektion, schluesselWdh, baueStationen, letzteWiederholungVor };

// scripts/html.js
//
// Kleine Helfer für die HTML-Erzeugung, die mehr als eine Seite braucht.

/**
 * Macht Text für HTML unschädlich. Inhalte kommen aus Markdown-Dateien,
 * nicht von Fremden, trotzdem gehört ein Titel mit spitzer Klammer als Text
 * auf die Seite und nicht als Auszeichnung.
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { escapeHtml };

# Deutsch für Au-Pairs – Pilot

Offenes DaF-A1-Lernangebot für Au-Pairs in Deutschland. Statische Website,
kein Backend. Siehe Spezifikation im Obsidian-Vault:
`02 Projekte/Deutsch für Au-Pairs.md`.

## Build

    node scripts/build.js

Ergebnis liegt in `dist/`.

## Audio erzeugen

    set GOOGLE_TTS_API_KEY=dein-key
    node scripts/generate_audio.js

# Knuschelmäusli – „Wo ist Flöckli?“ (Mock-up)

Funktionsfähiger Prototyp des Point-&-Click-Abenteuers. Reines HTML/CSS/JavaScript, ohne Installation.

## Starten
- **Doppelklick auf `index.html`** (am besten in **Microsoft Edge** – dort gibt es schöne deutsche/Schweizer Stimmen).
- Ton einschalten. Auf dem Tablet: Querformat, Vollbild-Knopf oben rechts.

## Ablauf
1. **Start** → Intro-Reim
2. **Arven-Höhle & See** – Dinge antippen → das Glöckchen klingelt → **Rucksack-Check** (ziehen oder antippen) → **Glitzerli** antippen → 3 Lichtbläschen → Wanderweg
3. **Grathöhen** – Flöckli im Nebel suchen: Piepsen wird lauter, je näher man tippt (und kommt von links/rechts) → **Knuscheln** (Flöckli gedrückt halten, bis das Herz voll ist) → Belohnung
4. **Gute Nacht** – Sterne antippen, Outro-Reim

Das Glöckchen unten links gibt jederzeit einen Tipp (es wackelt nach 12 s ohne Aktion).

## Für Entwickler
- `index.html?debug` – zeigt Hotspots, Klick-Koordinaten in der Konsole (F12)
- `index.html?scene=see|grat|night` – direkt in eine Szene springen
- Alle Positionen/Texte stehen in `game.js` (oben: `SCENES`, `FLOECKLI`, `CROPS`)

## Platzhalter (bewusst einfach gehalten)
- **Stimmen:** Browser-Sprachausgabe → später durch Piper-TTS-Dateien (Thorsten) ersetzen
- **Klänge:** live erzeugte Synth-Töne (Glöckchen, Piepsen, Wind)

# 🚀 AI-Lab & Mentoring Briefing

Dieses Dokument dient als Gedächtnisstütze für Antigravity in neuen Chat-Sitzungen innerhalb des Projekts `Z:\ai-lab`.

## 👤 Über mich & Meine Ziele
- **Rolle von Antigravity:** Mein persönlicher Tech- & KI-Mentor (Schritt für Schritt erklären, *Learning by Doing*, keine Überforderung).
- **Meine Themen & Interessen (Die 8 Bereiche im Dashboard):**
  1. 🎨 **Vibe Coding & Apps:** Interaktive Tools bauen und verstehen (HTML, Tailwind CSS, JS).
  2. 🐭 **Kreativ & Audio:** Podcast/Hörspiel-Projekt *„Die Abenteuer des Knuschelmäusli“* (Storytelling, TTS, Audio).
  3. 💻 **Terminal, Git & Linux:** Kommandozeile, Versionsverwaltung mit `git`, Backup & Hosting auf `GitHub`, `npm`.
  4. 🐍 **Python & Scripting:** Einfache Scripte lesen, verstehen und für eigene Workflows schreiben.
  5. 🏠 **Smart Home:** Home Assistant ausbauen (speziell lokale/Cloud TTS & STT Sprachsteuerung).
  6. 🌐 **Homepage & Web:** Eigene (fremdgehostete) Webseite modernisieren.
  7. ⚙️ **CAD / Engineering / 3D-Druck:** KI-gestützte Konstruktion und 3D-Druck-Workflows erforschen.
  8. 💡 **Business & 2. Einnahmequelle:** Beim Experimentieren Ideen identifizieren, die auch für andere nützlich sind.

---

## 🛠️ Aktueller Projektstand (`Z:\ai-lab\index.html` – Version 0.5)
Wir haben als erstes Experiment ein eigenes **Single-File Skill-Tree & Kanban Dashboard** gebaut und auf GitHub (`https://github.com/yvesrothermann/ai-lab.git`) veröffentlicht:
- **Features in v0.5:**
  - 4-Spalten-Kanban-Board (`💡 Ideen`, `📋 Geplant`, `🧪 In Arbeit`, `✅ Gelernt & Fertig`) mit **HTML5 Drag & Drop**.
  - **Farbcodierte Kacheln** je nach Bereich + erweiterbares Bereichs-Pulldown.
  - **XP- & Level-Engine:** Aufgaben geben je nach Größe (50 / 150 / 350 / 750 XP) und Fortschritt (Status + abhakbare Mini-Schritte) Erfahrungspunkte.
  - **Klickbares Level-Cockpit:** Öffnet ein Pop-up mit dem **Skill-Radar** (separates Level für jeden der 8 Bereiche).
  - **Globale Live-Suche** in der festen Toolbar (funktioniert über alle Reiter hinweg ohne Fokus-Verlust).
  - **Eigenständige Know-how-Datenbank (Reiter 3):** Freie Notizen, Prompts, Befehle und Code-Snippets erfassen (+25 Wissens-XP je Notiz) und nach Kategorien sortieren.
  - **Sichere Pop-ups & Quest-Editor (Neu in v0.5):**
    - Jede bestehende Quest hat jetzt einen **`✏️`-Bearbeiten-Button** (Titel, Bereich, Größe/XP, Status, Beschreibung und alle Checklisten-Schritte können jederzeit editiert werden).
    - **Kein Textverlust beim Danebenklicken:** Die Pop-ups für Know-how-Notizen und Quests schließen sich **nicht** mehr, wenn man aus Versehen auf den abgedunkelten Hintergrund klickt, sondern nur noch über `💾 Speichern` oder `Verwerfen` (mit Sicherheitsabfrage bei ungespeichertem Text!).
  - **JSON-Backup Export & Import (Neu in v0.5):** Über `📥 Backup (.json)` und `📤 Laden` in der Toolbar lassen sich alle `localStorage`-Daten (Quests, Kategorien, Notizen) als Datei `ai-lab-backup.json` in `Z:\ai-lab` speichern und mit Git auf GitHub sichern.

---

## 🎯 Erreichte Meilensteine & Nächste Schritte
- ✅ **Quest #1 abgeschlossen (`🎨 Vibe Coding & Apps`):** Dashboard bis Version 0.5 ausgebaut.
- ✅ **Quest #3 abgeschlossen (`💻 Terminal, Git & GitHub`):**
  - Lokales Git-Repository auf dem Synology NAS (`Z:\ai-lab` / `//DS918/Yves/ai-lab`) initialisiert und mit `safe.directory` autorisiert.
  - Branch auf `main` gesetzt, GitHub-Repo verknüpft, Personal Access Token (PAT) erstellt und im Windows-Tresor (`wincred`) dauerhaft hinterlegt.
- 🔜 **Nächste spannende Quests zur Auswahl:**
  - **Quest #2 (`🐭 Kreativ & Audio`):** Pilotfolge *„Die Abenteuer des Knuschelmäusli“* (1-Minuten-Story, TTS-Stimme testen, MP3-Workflow).
  - **Quest #4 (`🐍 Python & Scripting`):** Erstes 20-Zeilen-Python-Helfer-Script schreiben und verstehen.

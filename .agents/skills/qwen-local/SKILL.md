---
name: lm-studio-local
description: Delegiert Code-Entwürfe, Text-/Story-Generierung oder Fleißaufgaben an die lokalen LLMs in LM Studio unter http://192.168.0.34:1234 (qwen/qwen3.5-9b, qwen3-coder-next, google/gemma-4-12b-qat, qwen3.8-27b), um Cloud-Tokens zu sparen. Nutze diesen Skill, wenn der User "*local", "/local", "*Qwen" oder das lokale Modell erwähnt, oder um selbstständig größere Text-/Code-Generierungen lokal ausführen zu lassen.
---

# Lokale LLM-Delegation (`qwen_worker.py` via LM Studio)

Auf dem lokalen PC läuft **LM Studio** unter `http://192.168.0.34:1234/v1/chat/completions`.

## Modell-Auswahl nach Aufgabe (Durch den Mentor zu wählen)
- **`qwen/qwen3.5-9b`** oder **`qwen3-coder-next`**: Schnelle Standard-Wahl für Code-Snippets, Datenstrukturen und schnelle Analysen (läuft komplett im VRAM ohne 20-Minuten-Reasoning-Schleife).
- **`google/gemma-4-12b-qat`**: Ideal für deutsche Texte, kreative Geschichten (*Knuschelmäusli*), Dialoge und Zusammenfassungen.
- **`qwen3.8-27b`**: Großes 27B-Reasoning-Modell (~3 tok/s); nur wählen, wenn der User es ausdrücklich wünscht oder extrem tiefes Reasoning ohne Zeitdruck gefragt ist (bei Code-Aufgaben `max_tokens` hochsetzen, da es ~3.500 Tokens für `reasoning_content` nutzt).

## Wie du Aufgaben an LM Studio delegierst

1. Schreibe bei längeren Aufgaben den Prompt in eine Datei oder nutze `--prompt`.
2. Übergib mit `--model <modell-id>` das passende lokale Modell (z. B. `--model qwen/qwen3.5-9b` oder `--model google/gemma-4-12b-qat`).
3. Führe `python qwen_worker.py` mit `BypassSandbox: true` aus.
4. Prüfe danach die Ausgabedatei (`qwen_last_output.md`), kontrolliere die Qualität als Mentor und baue das Ergebnis sauber in das Projekt ein.


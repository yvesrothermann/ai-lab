"""
AI-Lab Lokale LLM-Brücke (LM Studio -> Qwen 3.8 27B) mit LIVE-STREAMING
-----------------------------------------------------------------------
Dieses Python-Script verbindet Antigravity mit deinem lokalen LM Studio Server
unter http://192.168.0.34:1234/v1/chat/completions.

Features:
- Live-Streaming (stream=True): Verhindert Timeouts und schreibt jedes Wort
  sofort live in die Zieldatei und ins Terminal.
- --no-think Schalter: Deaktiviert auf Wunsch langes Reasoning (/no_think),
  damit Qwen sofort mit dem Code startet.
"""

import argparse
import json
import os
import sys
import time
import urllib.request
import urllib.error

DEFAULT_API_URL = "http://192.168.0.34:1234/v1/chat/completions"
DEFAULT_MODEL = "qwen3.8-27b"


def call_local_llm_stream(prompt: str, context_files: list, model: str, api_url: str, system_prompt: str, out_path: str, no_think: bool) -> str:
    full_user_message = ""
    if context_files:
        full_user_message += "### PROJEKT-KONTEXT (DATEIEN):\n\n"
        for filepath in context_files:
            if os.path.exists(filepath):
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                full_user_message += f"--- START DATEI: {filepath} ---\n{content}\n--- ENDE DATEI: {filepath} ---\n\n"
            else:
                print(f"[WARNUNG] Kontext-Datei nicht gefunden: {filepath}", file=sys.stderr)

    full_user_message += f"### AUFGABE:\n{prompt}"
    if no_think:
        full_user_message += "\n/no_think"

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": full_user_message}
        ],
        "temperature": 0.3,
        "max_tokens": 4096,
        "stream": True
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        api_url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    print(f"🚀 Sende Streaming-Auftrag an '{model}' ({api_url})...")
    start_time = time.time()
    collected_chunks = []
    chunk_count = 0

    try:
        with urllib.request.urlopen(req, timeout=300) as response:
            out_file = open(out_path, "w", encoding="utf-8") if out_path else None
            try:
                for raw_line in response:
                    line = raw_line.decode("utf-8", errors="replace").strip()
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk_json = json.loads(data_str)
                        delta = chunk_json["choices"][0].get("delta", {})
                        content_piece = delta.get("content", "")
                        reasoning_piece = delta.get("reasoning_content", "")
                        piece = content_piece or reasoning_piece
                        if piece:
                            if content_piece:
                                collected_chunks.append(content_piece)
                            chunk_count += 1
                            if out_file:
                                out_file.write(piece)
                                out_file.flush()
                            if chunk_count == 1:
                                first_token_time = round(time.time() - start_time, 1)
                                print(f"⚡ Erstes Token empfangen nach {first_token_time}s! Qwen schreibt live...")
                            elif chunk_count % 150 == 0:
                                elapsed = round(time.time() - start_time, 1)
                                tps = round(chunk_count / max(1.0, elapsed - first_token_time), 1)
                                print(f"   ... {chunk_count} Tokens empfangen ({elapsed}s • ~{tps} tok/s)")
                    except json.JSONDecodeError:
                        continue
            finally:
                if out_file:
                    out_file.close()

        duration = round(time.time() - start_time, 1)
        full_text = "".join(collected_chunks)
        print(f"✅ Fertig in {duration}s! ({chunk_count} Stücke, {len(full_text)} Zeichen in '{out_path}')")
        return full_text

    except urllib.error.URLError as e:
        print(f"❌ Verbindungsfehler zu LM Studio ({api_url}): {e}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Beauftragt das lokale LLM in LM Studio per Live-Stream.")
    parser.add_argument("--prompt", type=str, help="Der Aufgabentext an das lokale Modell.")
    parser.add_argument("--prompt-file", type=str, help="Pfad zu einer Datei mit dem Aufgabentext.")
    parser.add_argument("--context", nargs="*", default=[], help="Liste von Dateien, die als Kontext mitgeschickt werden.")
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL, help=f"Modell-ID in LM Studio (Standard: {DEFAULT_MODEL})")
    parser.add_argument("--url", type=str, default=DEFAULT_API_URL, help="LM Studio Endpoint URL")
    parser.add_argument("--out", type=str, default="qwen_last_output.md", help="Zieldatei für die Antwort von Qwen")
    parser.add_argument("--no-think", action="store_true", help="Fügt /no_think an, um langes Reasoning zu überspringen")
    parser.add_argument(
        "--system",
        type=str,
        default="Du bist Qwen, eine präzise lokale KI-Entwicklerin im Projekt AI-Lab. Antworte direkt mit sauberem, funktionierendem Code und kurzen Erklärungen auf Deutsch.",
        help="System-Prompt für das lokale Modell"
    )

    args = parser.parse_args()

    prompt_text = args.prompt or ""
    if args.prompt_file:
        with open(args.prompt_file, "r", encoding="utf-8") as pf:
            prompt_text = pf.read()

    if not prompt_text.strip():
        print("❌ Bitte gib entweder --prompt oder --prompt-file an.", file=sys.stderr)
        sys.exit(1)

    call_local_llm_stream(
        prompt=prompt_text,
        context_files=args.context,
        model=args.model,
        api_url=args.url,
        system_prompt=args.system,
        out_path=args.out,
        no_think=args.no_think
    )


if __name__ == "__main__":
    main()

from __future__ import annotations

import argparse
import subprocess
import sys
import time

from backend.sermon_index.config import get_settings
from backend.sermon_index.db import connect, init_db


def pending_counts(source_slug: str | None = None) -> tuple[int, int]:
    settings = get_settings()
    with connect(settings.database_path) as conn:
        init_db(conn)
        transcribe_sql = """
            SELECT COUNT(*)
            FROM videos v
            LEFT JOIN transcripts t ON t.video_id = v.video_id
            WHERE t.video_id IS NULL
              AND v.status NOT IN ('transcribe_failed')
        """
        summarize_sql = """
            SELECT COUNT(*)
            FROM videos v
            JOIN transcripts t ON t.video_id = v.video_id
            LEFT JOIN summaries s ON s.video_id = t.video_id
            WHERE s.video_id IS NULL
              AND v.status NOT IN ('summary_failed')
        """
        params: list[str] = []
        if source_slug:
            transcribe_sql += " AND v.source_slug = ?"
            summarize_sql += " AND v.source_slug = ?"
            params.append(source_slug)
        to_transcribe = conn.execute(transcribe_sql, params).fetchone()[0]
        to_summarize = conn.execute(summarize_sql, params).fetchone()[0]
    return int(to_transcribe), int(to_summarize)


def run_step(args: list[str]) -> None:
    subprocess.run([sys.executable, *args], check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sleep", type=float, default=0.0, help="Segundos de pausa entre ciclos.")
    parser.add_argument("--no-export-each", action="store_true", help="Exporta solo al final.")
    parser.add_argument("--transcribe-first", action="store_true", help="Transcribe todos los pendientes antes de resumir.")
    parser.add_argument("--transcribe-only", action="store_true", help="Solo transcribe; no ejecuta resumenes.")
    parser.add_argument("--summarize-only", action="store_true", help="Solo resume transcripciones existentes; no descarga ni transcribe.")
    parser.add_argument("--source", help="Procesa solo una fuente, por ejemplo: andres-spyker.")
    args = parser.parse_args()

    cycle = 0
    while True:
        to_transcribe, to_summarize = pending_counts(args.source)
        print(f"Pendientes: transcribir={to_transcribe}, resumir={to_summarize}", flush=True)
        if args.summarize_only and to_summarize == 0:
            break
        if args.transcribe_only and to_transcribe == 0:
            break
        if to_transcribe == 0 and to_summarize == 0:
            break

        cycle += 1
        print(f"--- Ciclo {cycle} ---", flush=True)

        if to_transcribe and not args.summarize_only:
            step = ["-m", "backend.scripts.transcribe", "--limit", "1"]
            if args.source:
                step.extend(["--source", args.source])
            run_step(step)

        if to_summarize and not args.transcribe_only and not (args.transcribe_first and to_transcribe):
            step = ["-m", "backend.scripts.summarize", "--limit", "1"]
            if args.source:
                step.extend(["--source", args.source])
            run_step(step)

        if not args.no_export_each:
            run_step(["-m", "backend.scripts.export_site", "--include-transcripts"])

        if args.sleep:
            time.sleep(args.sleep)

    run_step(["-m", "backend.scripts.export_site", "--include-transcripts"])
    print("Cola terminada.", flush=True)


if __name__ == "__main__":
    main()

from __future__ import annotations

import argparse
import subprocess
import sys
import time

from backend.sermon_index.config import get_settings
from backend.sermon_index.db import connect, init_db


def pending_counts() -> tuple[int, int]:
    settings = get_settings()
    with connect(settings.database_path) as conn:
        init_db(conn)
        to_transcribe = conn.execute(
            """
            SELECT COUNT(*)
            FROM videos v
            LEFT JOIN transcripts t ON t.video_id = v.video_id
            WHERE t.video_id IS NULL
              AND v.status NOT IN ('transcribe_failed')
            """
        ).fetchone()[0]
        to_summarize = conn.execute(
            """
            SELECT COUNT(*)
            FROM transcripts t
            LEFT JOIN summaries s ON s.video_id = t.video_id
            WHERE s.video_id IS NULL
            """
        ).fetchone()[0]
    return int(to_transcribe), int(to_summarize)


def run_step(args: list[str]) -> None:
    subprocess.run([sys.executable, *args], check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sleep", type=float, default=0.0, help="Segundos de pausa entre ciclos.")
    parser.add_argument("--no-export-each", action="store_true", help="Exporta solo al final.")
    args = parser.parse_args()

    cycle = 0
    while True:
        to_transcribe, to_summarize = pending_counts()
        print(f"Pendientes: transcribir={to_transcribe}, resumir={to_summarize}", flush=True)
        if to_transcribe == 0 and to_summarize == 0:
            break

        cycle += 1
        print(f"--- Ciclo {cycle} ---", flush=True)

        if to_transcribe:
            run_step(["-m", "backend.scripts.transcribe", "--limit", "1"])

        if to_summarize or to_transcribe:
            run_step(["-m", "backend.scripts.summarize", "--limit", "1"])

        if not args.no_export_each:
            run_step(["-m", "backend.scripts.export_site", "--include-transcripts"])

        if args.sleep:
            time.sleep(args.sleep)

    run_step(["-m", "backend.scripts.export_site", "--include-transcripts"])
    print("Cola terminada.", flush=True)


if __name__ == "__main__":
    main()

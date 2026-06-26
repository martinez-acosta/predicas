from __future__ import annotations

import argparse

from backend.sermon_index.config import get_settings
from backend.sermon_index.db import connect, init_db, upsert_source, upsert_video
from backend.sermon_index.sources import load_sources
from backend.sermon_index.youtube import extract_videos


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", help="Slug de fuente a procesar.")
    parser.add_argument("--limit", type=int, help="Maximo de videos por fuente.")
    args = parser.parse_args()

    settings = get_settings()
    sources = [source for source in load_sources(settings.sources_path) if source["enabled"]]
    if args.source:
        sources = [source for source in sources if source["slug"] == args.source]
    if not sources:
        raise SystemExit("No hay fuentes habilitadas para procesar.")

    with connect(settings.database_path) as conn:
        init_db(conn)
        for source in sources:
            upsert_source(conn, source)
            print(f"Ingestando {source['name']}...")
            videos = extract_videos(source, limit=args.limit)
            for video in videos:
                upsert_video(conn, video)
            print(f"  {len(videos)} videos encontrados.")


if __name__ == "__main__":
    main()


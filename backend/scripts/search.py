from __future__ import annotations

import argparse

from backend.sermon_index.config import get_settings
from backend.sermon_index.db import connect, init_db, rebuild_fts


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("query")
    parser.add_argument("--limit", type=int, default=20)
    args = parser.parse_args()

    settings = get_settings()
    with connect(settings.database_path) as conn:
        init_db(conn)
        rebuild_fts(conn)
        rows = conn.execute(
            """
            SELECT f.video_id, v.title, v.youtube_url, v.channel_name, bm25(sermon_fts) AS rank
            FROM sermon_fts f
            JOIN videos v ON v.video_id = f.video_id
            WHERE sermon_fts MATCH ?
            ORDER BY rank
            LIMIT ?
            """,
            (args.query, args.limit),
        ).fetchall()

    for row in rows:
        print(f"{row['title']} | {row['channel_name']} | {row['youtube_url']}")


if __name__ == "__main__":
    main()


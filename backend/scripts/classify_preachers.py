from __future__ import annotations

from collections import Counter

from backend.sermon_index.config import get_settings
from backend.sermon_index.db import connect, init_db
from backend.sermon_index.preacher_inference import ICF_SOURCE_SLUG, infer_preacher


def main() -> None:
    settings = get_settings()
    counts: Counter[str] = Counter()
    changed = 0

    with connect(settings.database_path) as conn:
        init_db(conn)
        conn.execute(
            """
            UPDATE sources
            SET name = 'Iglesia Conquistando Fronteras',
                preacher = 'ICF CDMX',
                updated_at = CURRENT_TIMESTAMP
            WHERE slug = ?
            """,
            (ICF_SOURCE_SLUG,),
        )
        rows = conn.execute(
            """
            SELECT video_id, source_slug, title, preacher
            FROM videos
            WHERE source_slug = ?
            """,
            (ICF_SOURCE_SLUG,),
        ).fetchall()
        for row in rows:
            preacher = infer_preacher(row["source_slug"], row["title"], "Varios")
            counts[preacher or "Varios"] += 1
            if preacher and preacher != row["preacher"]:
                conn.execute(
                    "UPDATE videos SET preacher = ?, updated_at = CURRENT_TIMESTAMP WHERE video_id = ?",
                    (preacher, row["video_id"]),
                )
                changed += 1
        conn.commit()

    print(f"Videos ICF reclasificados: {changed}")
    for preacher, count in counts.most_common():
        print(f"{count:>4}  {preacher}")


if __name__ == "__main__":
    main()

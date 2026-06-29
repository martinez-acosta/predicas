from __future__ import annotations

import argparse
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from backend.sermon_index.config import get_settings
from backend.sermon_index.db import connect, init_db, json_dump, json_load, rebuild_fts
from backend.sermon_index.preacher_inference import slugify_preacher


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json_dump(payload) + "\n", encoding="utf-8")


def _format_date(value: str | None) -> str | None:
    if not value:
        return None
    if len(value) == 8 and value.isdigit():
        return f"{value[0:4]}-{value[4:6]}-{value[6:8]}"
    return value


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--include-transcripts", action="store_true", help="Exporta transcripcion completa por predica.")
    args = parser.parse_args()

    settings = get_settings()
    output_dir = settings.frontend_data_dir
    sermon_dir = output_dir / "sermons"

    with connect(settings.database_path) as conn:
        init_db(conn)
        rebuild_fts(conn)
        sources = conn.execute(
            """
            SELECT s.slug, s.name, s.preacher, s.url, COUNT(v.video_id) AS sermon_count
            FROM sources s
            LEFT JOIN videos v ON v.source_slug = s.slug
            WHERE s.enabled = 1
            GROUP BY s.slug
            ORDER BY s.name
            """
        ).fetchall()
        speakers = conn.execute(
            """
            SELECT
              v.source_slug,
              COALESCE(NULLIF(v.preacher, ''), 'Varios') AS preacher,
              COUNT(v.video_id) AS sermon_count
            FROM videos v
            GROUP BY v.source_slug, COALESCE(NULLIF(v.preacher, ''), 'Varios')
            ORDER BY v.source_slug, sermon_count DESC, preacher ASC
            """
        ).fetchall()
        rows = conn.execute(
            """
            SELECT
              v.video_id, v.source_slug, v.channel_name, v.preacher, v.title, v.youtube_url,
              v.published_at, v.duration_seconds, v.thumbnail_url, v.status,
              COALESCE(t.text, '') AS transcript,
              COALESCE(t.segments_json, '[]') AS segments_json,
              COALESCE(s.summary_short, '') AS summary_short,
              COALESCE(s.summary_detailed, '') AS summary_detailed,
              COALESCE(s.outline_json, '[]') AS outline_json,
              COALESCE(s.topics_json, '[]') AS topics_json,
              COALESCE(s.bible_references_json, '[]') AS bible_references_json,
              COALESCE(s.key_quotes_json, '[]') AS key_quotes_json
            FROM videos v
            LEFT JOIN transcripts t ON t.video_id = v.video_id
            LEFT JOIN summaries s ON s.video_id = v.video_id
            ORDER BY COALESCE(v.published_at, '') DESC, v.title ASC
            """
        ).fetchall()

    sermons = []
    search_entries = []
    for row in rows:
        topics = json_load(row["topics_json"], [])
        bible_refs = json_load(row["bible_references_json"], [])
        list_item = {
            "id": row["video_id"],
            "sourceSlug": row["source_slug"],
            "channelName": row["channel_name"],
            "preacher": row["preacher"],
            "title": row["title"],
            "youtubeUrl": row["youtube_url"],
            "publishedAt": _format_date(row["published_at"]),
            "durationSeconds": row["duration_seconds"],
            "thumbnailUrl": row["thumbnail_url"],
            "status": row["status"],
            "summaryShort": row["summary_short"],
            "topics": topics,
            "bibleReferences": bible_refs,
        }
        sermons.append(list_item)
        transcript = row["transcript"] or ""
        search_entries.append(
            {
                "id": row["video_id"],
                "text": "\n".join(
                    [
                        row["title"] or "",
                        row["channel_name"] or "",
                        row["preacher"] or "",
                        row["summary_short"] or "",
                        row["summary_detailed"] or "",
                        " ".join(topics),
                        " ".join(bible_refs),
                        transcript,
                    ]
                ),
            }
        )
        detail = {
            **list_item,
            "summaryDetailed": row["summary_detailed"],
            "outline": json_load(row["outline_json"], []),
            "keyQuotes": json_load(row["key_quotes_json"], []),
            "transcript": transcript if args.include_transcripts else "",
            "segments": json_load(row["segments_json"], []) if args.include_transcripts else [],
        }
        _write_json(sermon_dir / f"{row['video_id']}.json", detail)

    speakers_by_source: dict[str, list[dict[str, Any]]] = {}
    for row in speakers:
        preacher = row["preacher"] or "Varios"
        speakers_by_source.setdefault(row["source_slug"], []).append(
            {
                "key": f"preacher:{row['source_slug']}:{slugify_preacher(preacher)}",
                "sourceSlug": row["source_slug"],
                "name": preacher,
                "sermonCount": row["sermon_count"],
            }
        )

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "stats": {
            "sources": len(sources),
            "sermons": len(sermons),
            "transcribed": sum(1 for item in sermons if item["status"] in {"transcribed", "summarized"}),
            "summarized": sum(1 for item in sermons if item["status"] == "summarized"),
        },
        "preachers": [
            {
                "key": f"source:{row['slug']}",
                "slug": row["slug"],
                "name": row["name"],
                "preacher": row["preacher"],
                "url": row["url"],
                "sermonCount": row["sermon_count"],
                "speakers": speakers_by_source.get(row["slug"], []),
            }
            for row in sources
        ],
        "sermons": sermons,
    }
    _write_json(output_dir / "site-index.json", payload)
    _write_json(output_dir / "search-index.json", {"entries": search_entries})
    print(f"Export listo: {output_dir}")


if __name__ == "__main__":
    main()

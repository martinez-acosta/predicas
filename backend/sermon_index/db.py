from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from backend.sermon_index.preacher_inference import infer_preacher


SCHEMA = """
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sources (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  preacher TEXT,
  url TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS videos (
  video_id TEXT PRIMARY KEY,
  source_slug TEXT NOT NULL REFERENCES sources(slug),
  channel_name TEXT,
  preacher TEXT,
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  published_at TEXT,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  description TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'discovered',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transcripts (
  video_id TEXT PRIMARY KEY REFERENCES videos(video_id) ON DELETE CASCADE,
  language TEXT,
  model TEXT,
  text TEXT NOT NULL,
  segments_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS summaries (
  video_id TEXT PRIMARY KEY REFERENCES videos(video_id) ON DELETE CASCADE,
  provider TEXT,
  model TEXT,
  summary_short TEXT NOT NULL,
  summary_detailed TEXT NOT NULL,
  outline_json TEXT NOT NULL DEFAULT '[]',
  topics_json TEXT NOT NULL DEFAULT '[]',
  bible_references_json TEXT NOT NULL DEFAULT '[]',
  key_quotes_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE VIRTUAL TABLE IF NOT EXISTS sermon_fts USING fts5(
  video_id UNINDEXED,
  title,
  channel_name,
  preacher,
  summary,
  transcript,
  topics,
  bible_references,
  tokenize='unicode61 remove_diacritics 2'
);
"""


@contextmanager
def connect(database_path: Path) -> Iterator[sqlite3.Connection]:
    database_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(database_path)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA foreign_keys = ON")
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA)


def json_dump(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def json_load(value: str | None, default: Any) -> Any:
    if not value:
        return default
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return default


def upsert_source(conn: sqlite3.Connection, source: dict[str, Any]) -> None:
    conn.execute(
        """
        INSERT INTO sources (slug, name, preacher, url, enabled, updated_at)
        VALUES (:slug, :name, :preacher, :url, :enabled, CURRENT_TIMESTAMP)
        ON CONFLICT(slug) DO UPDATE SET
          name = excluded.name,
          preacher = excluded.preacher,
          url = excluded.url,
          enabled = excluded.enabled,
          updated_at = CURRENT_TIMESTAMP
        """,
        {
            "slug": source["slug"],
            "name": source["name"],
            "preacher": source.get("preacher"),
            "url": source["url"],
            "enabled": 1 if source.get("enabled", True) else 0,
        },
    )


def upsert_video(conn: sqlite3.Connection, video: dict[str, Any]) -> None:
    preacher = infer_preacher(video["source_slug"], video["title"], video.get("preacher"))
    conn.execute(
        """
        INSERT INTO videos (
          video_id, source_slug, channel_name, preacher, title, youtube_url,
          published_at, duration_seconds, thumbnail_url, description,
          metadata_json, status, updated_at
        )
        VALUES (
          :video_id, :source_slug, :channel_name, :preacher, :title, :youtube_url,
          :published_at, :duration_seconds, :thumbnail_url, :description,
          :metadata_json, :status, CURRENT_TIMESTAMP
        )
        ON CONFLICT(video_id) DO UPDATE SET
          source_slug = excluded.source_slug,
          channel_name = excluded.channel_name,
          preacher = excluded.preacher,
          title = excluded.title,
          youtube_url = excluded.youtube_url,
          published_at = COALESCE(excluded.published_at, videos.published_at),
          duration_seconds = COALESCE(excluded.duration_seconds, videos.duration_seconds),
          thumbnail_url = COALESCE(excluded.thumbnail_url, videos.thumbnail_url),
          description = COALESCE(excluded.description, videos.description),
          metadata_json = excluded.metadata_json,
          updated_at = CURRENT_TIMESTAMP
        """,
        {
            **video,
            "preacher": preacher,
            "metadata_json": json_dump(video.get("metadata", {})),
            "status": video.get("status", "discovered"),
        },
    )


def save_transcript(
    conn: sqlite3.Connection,
    *,
    video_id: str,
    text: str,
    segments: list[dict[str, Any]],
    language: str | None,
    model: str,
) -> None:
    conn.execute(
        """
        INSERT INTO transcripts (video_id, language, model, text, segments_json, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(video_id) DO UPDATE SET
          language = excluded.language,
          model = excluded.model,
          text = excluded.text,
          segments_json = excluded.segments_json,
          updated_at = CURRENT_TIMESTAMP
        """,
        (video_id, language, model, text, json_dump(segments)),
    )
    conn.execute("UPDATE videos SET status = 'transcribed', updated_at = CURRENT_TIMESTAMP WHERE video_id = ?", (video_id,))


def save_summary(
    conn: sqlite3.Connection,
    *,
    video_id: str,
    provider: str,
    model: str | None,
    summary_short: str,
    summary_detailed: str,
    outline: list[dict[str, Any]],
    topics: list[str],
    bible_references: list[str],
    key_quotes: list[str],
) -> None:
    conn.execute(
        """
        INSERT INTO summaries (
          video_id, provider, model, summary_short, summary_detailed,
          outline_json, topics_json, bible_references_json, key_quotes_json,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(video_id) DO UPDATE SET
          provider = excluded.provider,
          model = excluded.model,
          summary_short = excluded.summary_short,
          summary_detailed = excluded.summary_detailed,
          outline_json = excluded.outline_json,
          topics_json = excluded.topics_json,
          bible_references_json = excluded.bible_references_json,
          key_quotes_json = excluded.key_quotes_json,
          updated_at = CURRENT_TIMESTAMP
        """,
        (
            video_id,
            provider,
            model,
            summary_short,
            summary_detailed,
            json_dump(outline),
            json_dump(topics),
            json_dump(bible_references),
            json_dump(key_quotes),
        ),
    )
    conn.execute("UPDATE videos SET status = 'summarized', updated_at = CURRENT_TIMESTAMP WHERE video_id = ?", (video_id,))


def videos_to_transcribe(conn: sqlite3.Connection, limit: int | None) -> list[sqlite3.Row]:
    sql = """
      SELECT v.*
      FROM videos v
      LEFT JOIN transcripts t ON t.video_id = v.video_id
      WHERE t.video_id IS NULL
        AND v.status NOT IN ('transcribe_failed')
      ORDER BY COALESCE(v.published_at, '') DESC, v.created_at DESC
    """
    if limit:
        sql += " LIMIT ?"
        return list(conn.execute(sql, (limit,)))
    return list(conn.execute(sql))


def mark_video_status(conn: sqlite3.Connection, video_id: str, status: str) -> None:
    conn.execute(
        "UPDATE videos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE video_id = ?",
        (status, video_id),
    )


def transcripts_to_summarize(conn: sqlite3.Connection, limit: int | None) -> list[sqlite3.Row]:
    sql = """
      SELECT v.*, t.text AS transcript_text, t.segments_json
      FROM videos v
      JOIN transcripts t ON t.video_id = v.video_id
      LEFT JOIN summaries s ON s.video_id = v.video_id
      WHERE s.video_id IS NULL
        AND v.status NOT IN ('summary_failed')
      ORDER BY COALESCE(v.published_at, '') DESC, v.created_at DESC
    """
    if limit:
        sql += " LIMIT ?"
        return list(conn.execute(sql, (limit,)))
    return list(conn.execute(sql))


def rebuild_fts(conn: sqlite3.Connection) -> None:
    conn.execute("DELETE FROM sermon_fts")
    rows = conn.execute(
        """
        SELECT
          v.video_id, v.title, v.channel_name, v.preacher,
          COALESCE(s.summary_short, '') || char(10) || COALESCE(s.summary_detailed, '') AS summary,
          COALESCE(t.text, '') AS transcript,
          COALESCE(s.topics_json, '[]') AS topics_json,
          COALESCE(s.bible_references_json, '[]') AS bible_references_json
        FROM videos v
        LEFT JOIN transcripts t ON t.video_id = v.video_id
        LEFT JOIN summaries s ON s.video_id = v.video_id
        """
    ).fetchall()
    for row in rows:
        conn.execute(
            """
            INSERT INTO sermon_fts (
              video_id, title, channel_name, preacher, summary, transcript, topics, bible_references
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                row["video_id"],
                row["title"] or "",
                row["channel_name"] or "",
                row["preacher"] or "",
                row["summary"] or "",
                row["transcript"] or "",
                " ".join(json_load(row["topics_json"], [])),
                " ".join(json_load(row["bible_references_json"], [])),
            ),
        )

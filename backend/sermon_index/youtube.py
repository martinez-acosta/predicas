from __future__ import annotations

from pathlib import Path
from typing import Any

import yt_dlp


SUPPORTED_AUDIO_EXTENSIONS = (".m4a", ".mp3", ".webm", ".wav", ".opus", ".ogg")


def _youtube_url(video_id: str) -> str:
    return f"https://www.youtube.com/watch?v={video_id}"


def _is_video_id(value: str) -> bool:
    return len(value) == 11


def extract_videos(source: dict[str, Any], limit: int | None = None) -> list[dict[str, Any]]:
    opts: dict[str, Any] = {
        "quiet": True,
        "skip_download": True,
        "extract_flat": "in_playlist",
        "ignoreerrors": True,
    }
    if limit:
        opts["playlistend"] = limit

    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(source["url"], download=False)

    entries = (info or {}).get("entries") or []
    videos: list[dict[str, Any]] = []
    for entry in entries:
        if not entry:
            continue
        video_id = entry.get("id")
        if not video_id or not _is_video_id(str(video_id)):
            continue
        title = entry.get("title") or "Sin titulo"
        videos.append(
            {
                "video_id": video_id,
                "source_slug": source["slug"],
                "channel_name": source["name"],
                "preacher": source.get("preacher"),
                "title": title,
                "youtube_url": entry.get("url") if str(entry.get("url", "")).startswith("http") else _youtube_url(video_id),
                "published_at": entry.get("upload_date") or entry.get("release_date"),
                "duration_seconds": entry.get("duration"),
                "thumbnail_url": entry.get("thumbnail"),
                "description": entry.get("description"),
                "metadata": {
                    "extractor": entry.get("extractor"),
                    "view_count": entry.get("view_count"),
                    "channel_id": entry.get("channel_id"),
                },
            }
        )
    return videos


def local_audio_path(video_id: str, audio_dir: Path) -> Path | None:
    for extension in SUPPORTED_AUDIO_EXTENSIONS:
        candidate = audio_dir / f"{video_id}{extension}"
        if candidate.exists():
            return candidate
    return None


def download_audio(video_url: str, video_id: str, audio_dir: Path) -> Path:
    audio_dir.mkdir(parents=True, exist_ok=True)
    existing_audio = local_audio_path(video_id, audio_dir)
    if existing_audio:
        return existing_audio

    output_template = str(audio_dir / f"{video_id}.%(ext)s")
    opts: dict[str, Any] = {
        "format": "bestaudio/best",
        "outtmpl": output_template,
        "quiet": False,
        "noplaylist": True,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "m4a",
            }
        ],
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([video_url])

    candidates = sorted(audio_dir.glob(f"{video_id}.*"))
    if not candidates:
        raise FileNotFoundError(f"No se encontro audio descargado para {video_id}")
    return candidates[0]

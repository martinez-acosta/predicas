from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    root_dir: Path
    database_path: Path
    frontend_data_dir: Path
    audio_dir: Path
    sources_path: Path
    whisper_model: str
    summary_provider: str
    summary_model: str | None
    ollama_base_url: str


def _path_from_env(name: str, default: str) -> Path:
    value = os.getenv(name, default)
    path = Path(value).expanduser()
    if not path.is_absolute():
        path = ROOT_DIR / path
    return path


def get_settings() -> Settings:
    return Settings(
        root_dir=ROOT_DIR,
        database_path=_path_from_env("DATABASE_PATH", "data/predicas.sqlite"),
        frontend_data_dir=_path_from_env("FRONTEND_DATA_DIR", "frontend/public/data"),
        audio_dir=_path_from_env("AUDIO_DIR", "data/audio"),
        sources_path=_path_from_env("SOURCES_PATH", "sources.yaml"),
        whisper_model=os.getenv("WHISPER_MODEL", "small"),
        summary_provider=os.getenv("SUMMARY_PROVIDER", "stub"),
        summary_model=os.getenv("SUMMARY_MODEL") or None,
        ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
    )


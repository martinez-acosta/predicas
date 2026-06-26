from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import yaml


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return re.sub(r"-+", "-", value).strip("-")


def load_sources(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"No existe el archivo de fuentes: {path}")

    payload = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    sources = payload.get("sources") or []
    normalized: list[dict[str, Any]] = []
    for source in sources:
        name = source["name"].strip()
        normalized.append(
            {
                "slug": source.get("slug") or slugify(name),
                "name": name,
                "preacher": source.get("preacher"),
                "url": source["url"].strip(),
                "enabled": bool(source.get("enabled", True)),
            }
        )
    return normalized


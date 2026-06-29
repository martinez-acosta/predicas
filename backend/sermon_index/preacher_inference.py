from __future__ import annotations

import re
import unicodedata
from functools import lru_cache
from pathlib import Path

import yaml


ICF_SOURCE_SLUG = "icf-cdmx"
UNKNOWN_PREACHER = "Varios"
OVERRIDES_PATH = Path(__file__).resolve().parents[2] / "data" / "preacher_overrides.yaml"

ALIAS_TO_PREACHER = {
    "aaron ramirez": "Aarón Ramírez",
    "aaron ramirez": "Aarón Ramírez",
    "alejandro escobed": "Alejandro Escobedo",
    "alejandro escobedo": "Alejandro Escobedo",
    "alenjandro escobed": "Alejandro Escobedo",
    "alenjandro escobedo": "Alejandro Escobedo",
    "alex escobedo": "Alejandro Escobedo",
    "angel flores": "Ángel Flores",
    "alvaro rea": "Álvaro Rea",
    "carlos de armas": "Carlos de Armas",
    "carlos jimenez": "Carlos Jiménez",
    "chepe putzu": "Chepe Putzu",
    "chris richards": "Chris Richards",
    "christopher hopper": "Christopher Hopper",
    "cristian duran": "Cristian Durán",
    "aaron jayne": "Aaron Jayne",
    "andres arango": "Andrés Arango",
    "bernardo perez": "Bernardo Pérez",
    "carlos belart": "Carlos Belart",
    "efrain barboza": "Efraín Barboza",
    "efrain gonzalez": "Efraín González",
    "edwin recinos": "Edwin Recinos",
    "enrique perez": "Enrique Pérez",
    "enrique bremer": "Enrique Bremer",
    "enrique villalba": "Enrique Villalba",
    "felipe del castillo": "Felipe del Castillo",
    "fernando ramirez": "Fernando Ramírez",
    "fernando ramirez de arellano": "Fernando Ramírez de Arellano",
    "igna de suarez": "Igna de Suárez",
    "itiel arroyo": "Itiel Arroyo",
    "ivan hernandez": "Iván Hernández",
    "jaz jacob": "Jaz Jacob",
    "jean marc bigler": "Jean Marc Bigler",
    "jim mccann": "Jim McCann",
    "jonathan rodriguez": "Jonathan Rodríguez",
    "juan pablo lerman": "Juan Pablo Lerman",
    "kharis": "Kharis Millán",
    "kharis millan": "Kharis Millán",
    "king matos": "King Matos",
    "lucas leys": "Lucas Leys",
    "luis ortiz": "Luis Ortíz",
    "marco barrientos": "Marco Barrientos",
    "marta carazo": "Marta Carazo",
    "mike richards": "Mike Richards",
    "misael barrera": "Misael Barrera",
    "paul lewis": "Paul Lewis",
    "paul louis cole": "Paul Louis Cole",
    "paco martinez": "Paco Martínez",
    "rebeca myers": "Rebeca Myers",
    "rebecca myers jacob": "Rebecca Myers Jacob",
    "rob carman": "Rob Carman",
    "roberto evans": "Roberto Evans",
    "robert barriger": "Robert Barriger",
    "rogelio duarte": "Rogelio Duarte",
    "romero solano": "Romero Solano",
    "sergio anaya": "Sergio Anaya",
    "sergio scataglini": "Sergio Scataglini",
    "steve cordon": "Steve Cordon",
    "tony lara": "Tony Lara",
    "vincent fernandez": "Vincent Fernández",
}

NON_PREACHER_TERMS = {
    "banda conquistando fronteras",
    "conversations at the table",
    "episode",
    "episodio",
    "eternal light podcast",
    "ibcf cdmx",
    "jovenes unidos",
    "la tribu",
    "luz eterna podcast",
    "musica icf",
    "origenes podcast",
    "pt",
    "servicio en vivo",
}


def normalize_key(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value)
    stripped = "".join(char for char in decomposed if unicodedata.category(char) != "Mn")
    stripped = re.sub(r"[^a-zA-Z0-9@\s]", " ", stripped)
    return re.sub(r"\s+", " ", stripped).strip().lower()


def slugify_preacher(value: str) -> str:
    normalized = normalize_key(value)
    return re.sub(r"[^a-z0-9]+", "-", normalized).strip("-") or "varios"


@lru_cache(maxsize=1)
def load_preacher_overrides() -> dict[str, str]:
    if not OVERRIDES_PATH.exists():
        return {}
    payload = yaml.safe_load(OVERRIDES_PATH.read_text(encoding="utf-8")) or {}
    overrides: dict[str, str] = {}
    for item in payload.get("overrides") or []:
        video_id = str(item.get("video_id") or "").strip()
        preacher = str(item.get("preacher") or "").strip()
        if video_id and preacher:
            overrides[video_id] = preacher
    return overrides


def clean_candidate(value: str) -> str:
    value = value.replace("\u00a0", " ")
    value = re.sub(r"^@+", "", value.strip())
    value = re.sub(r"^(ps\.?|pastor|pastora|pr\.?)\s*", "", value, flags=re.IGNORECASE)
    value = re.sub(r"\s+", " ", value)
    return value.strip(" -:|/\"'")


def canonical_preacher(value: str, *, allow_unknown: bool = False) -> str | None:
    candidate = clean_candidate(value)
    key = normalize_key(candidate)
    if not key:
        return None
    if key in ALIAS_TO_PREACHER:
        return ALIAS_TO_PREACHER[key]
    if not allow_unknown:
        return None
    if any(term in key for term in NON_PREACHER_TERMS):
        return None
    words = candidate.split()
    if not 2 <= len(words) <= 4:
        return None
    lowercase_allowed = {"de", "del", "la", "las", "los", "y"}
    name_like_words = 0
    for word in words:
        plain = normalize_key(word)
        if plain in lowercase_allowed:
            continue
        if word[:1].isupper() or plain in ALIAS_TO_PREACHER:
            name_like_words += 1
    if name_like_words >= 2:
        return candidate
    return None


def title_candidates(title: str) -> list[str]:
    title = title.replace("\u00a0", " ")
    pieces = [title]
    for separator in ("|", "/", " - "):
        next_pieces: list[str] = []
        for piece in pieces:
            next_pieces.extend(piece.split(separator))
        pieces = next_pieces

    candidates: list[str] = []
    for piece in pieces:
        cleaned = clean_candidate(piece)
        if cleaned:
            candidates.append(cleaned)
        match = re.search(r"\bby\s+(.+)$", cleaned, flags=re.IGNORECASE)
        if match:
            candidates.append(match.group(1))
    return candidates


def infer_preacher(source_slug: str, title: str, fallback: str | None = None, *, video_id: str | None = None) -> str | None:
    if source_slug != ICF_SOURCE_SLUG:
        return fallback

    if video_id:
        override = load_preacher_overrides().get(video_id)
        if override:
            return override

    candidates = title_candidates(title)
    for candidate in candidates:
        preacher = canonical_preacher(candidate)
        if preacher:
            return preacher
    return fallback if fallback and fallback != UNKNOWN_PREACHER else UNKNOWN_PREACHER

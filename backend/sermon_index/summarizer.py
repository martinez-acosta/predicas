from __future__ import annotations

import json
import os
import urllib.request
from typing import Any


SYSTEM_PROMPT = """Eres un asistente que analiza predicas cristianas.
Devuelve solo JSON valido, sin markdown ni texto adicional.
El JSON debe tener exactamente estas llaves:
summary_short, summary_detailed, outline, topics, bible_references, key_quotes.
summary_short y summary_detailed nunca deben venir vacios.
outline debe ser una lista de objetos con title y points.
topics, bible_references y key_quotes deben ser listas de strings.
Si no detectas citas biblicas, usa una lista vacia.
Se fiel al contenido de la transcripcion; no inventes citas biblicas.
"""


def build_prompt(title: str, channel_name: str | None, transcript: str, *, max_chars: int = 120_000) -> str:
    clipped = transcript[:max_chars]
    return f"""Titulo: {title}
Canal/predicador: {channel_name or 'No especificado'}

Transcripcion:
{clipped}

Genera un resumen detallado en espanol, temas, bosquejo y citas biblicas detectadas."""


def stub_summary(title: str, transcript: str) -> dict[str, Any]:
    excerpt = " ".join(transcript.split()[:90])
    return {
        "summary_short": f"Resumen pendiente de generar para: {title}.",
        "summary_detailed": (
            "Este registro ya tiene transcripcion, pero el resumen detallado todavia no se genero "
            "con un proveedor de IA. Fragmento inicial: " + excerpt
        ),
        "outline": [{"title": "Pendiente", "points": ["Ejecutar summarize con provider openai u ollama."]}],
        "topics": [],
        "bible_references": [],
        "key_quotes": [],
    }


def summarize_openai(*, title: str, channel_name: str | None, transcript: str, model: str | None) -> dict[str, Any]:
    from openai import OpenAI

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    selected_model = model or "gpt-4o-mini"
    response = client.chat.completions.create(
        model=selected_model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_prompt(title, channel_name, transcript)},
        ],
    )
    content = response.choices[0].message.content or "{}"
    return json.loads(content)


def summarize_ollama(
    *,
    title: str,
    channel_name: str | None,
    transcript: str,
    model: str | None,
    base_url: str,
) -> dict[str, Any]:
    selected_model = model or "llama3.1"
    max_chars = int(os.getenv("OLLAMA_TRANSCRIPT_CHARS", "120000"))
    timeout_seconds = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "0"))
    body = json.dumps(
        {
            "model": selected_model,
            "stream": False,
            "format": "json",
            "options": {"temperature": 0.2},
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": build_prompt(title, channel_name, transcript, max_chars=max_chars)},
            ],
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}/api/chat",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    timeout = None if timeout_seconds <= 0 else timeout_seconds
    with urllib.request.urlopen(request, timeout=timeout) as response:
        payload = json.loads(response.read().decode("utf-8"))
    content = payload.get("message", {}).get("content", "{}")
    parsed = json.loads(content)
    if not isinstance(parsed, dict):
        raise ValueError("Ollama no devolvio un objeto JSON")
    return parsed


def normalize_summary(payload: dict[str, Any]) -> dict[str, Any]:
    nested = payload.get("summary")
    if isinstance(nested, dict):
        payload = {**payload, **nested}

    resumen = payload.get("resumen")
    if isinstance(resumen, dict):
        payload = {**payload, **resumen}

    def first_text(*keys: str) -> str:
        for key in keys:
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
        return ""

    def first_list(*keys: str) -> list[Any]:
        for key in keys:
            value = payload.get(key)
            if isinstance(value, list):
                return value
        return []

    return {
        "summary_short": first_text("summary_short", "short_summary", "resumen_corto", "resumen_breve", "sintesis"),
        "summary_detailed": first_text(
            "summary_detailed",
            "detailed_summary",
            "long_summary",
            "resumen_detallado",
            "resumen_largo",
            "resumen",
        ),
        "outline": first_list("outline", "bosquejo", "estructura", "puntos"),
        "topics": first_list("topics", "temas"),
        "bible_references": first_list(
            "bible_references",
            "bible_refs",
            "scripture_references",
            "citas_biblicas",
            "referencias_biblicas",
            "pasajes_biblicos",
        ),
        "key_quotes": first_list("key_quotes", "quotes", "citas_clave", "frases_clave"),
    }

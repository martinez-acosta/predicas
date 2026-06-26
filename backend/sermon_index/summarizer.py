from __future__ import annotations

import json
import os
import urllib.request
from typing import Any


SYSTEM_PROMPT = """Eres un asistente que analiza predicas cristianas.
Devuelve JSON valido, sin markdown, con estas llaves:
summary_short, summary_detailed, outline, topics, bible_references, key_quotes.
outline debe ser una lista de objetos con title y points.
topics, bible_references y key_quotes deben ser listas de strings.
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
    return json.loads(content)


def normalize_summary(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "summary_short": str(payload.get("summary_short") or payload.get("resumen_corto") or "").strip(),
        "summary_detailed": str(payload.get("summary_detailed") or payload.get("resumen_detallado") or "").strip(),
        "outline": payload.get("outline") if isinstance(payload.get("outline"), list) else [],
        "topics": payload.get("topics") if isinstance(payload.get("topics"), list) else [],
        "bible_references": payload.get("bible_references") if isinstance(payload.get("bible_references"), list) else [],
        "key_quotes": payload.get("key_quotes") if isinstance(payload.get("key_quotes"), list) else [],
    }

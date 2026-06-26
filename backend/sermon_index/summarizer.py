from __future__ import annotations

import json
import os
import urllib.request
from typing import Any


SUMMARY_JSON_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "summary_short": {"type": "string"},
        "summary_detailed": {"type": "string"},
        "outline": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "points": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["title", "points"],
                "additionalProperties": False,
            },
        },
        "topics": {"type": "array", "items": {"type": "string"}},
        "bible_references": {"type": "array", "items": {"type": "string"}},
        "key_quotes": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "summary_short",
        "summary_detailed",
        "outline",
        "topics",
        "bible_references",
        "key_quotes",
    ],
    "additionalProperties": False,
}


SYSTEM_PROMPT = """Eres un asistente que analiza predicas cristianas.
Devuelve solo JSON valido, sin markdown ni texto adicional.
El JSON debe tener exactamente estas llaves:
summary_short, summary_detailed, outline, topics, bible_references, key_quotes.
summary_short debe ser una frase clara de 18 a 35 palabras.
summary_detailed debe tener 5 a 8 parrafos sustanciosos con los puntos principales, desarrollo pastoral, aplicaciones y advertencias de la predica.
outline debe tener al menos 4 objetos con title y points.
Cada points debe tener 2 a 5 frases cortas.
topics debe tener 5 a 10 strings utiles para busqueda.
bible_references y key_quotes deben ser listas de strings.
Si no detectas citas biblicas, usa una lista vacia.
Si no detectas frases clave textuales, usa una lista vacia.
Se fiel al contenido de la transcripcion; no inventes citas biblicas.
"""


def build_prompt(
    title: str,
    channel_name: str | None,
    transcript: str,
    *,
    max_chars: int = 120_000,
    missing_fields: list[str] | None = None,
    previous_payload: dict[str, Any] | None = None,
) -> str:
    clipped = transcript[:max_chars]
    repair_note = ""
    if missing_fields:
        repair_note = f"""
El intento anterior quedo incompleto. Faltaron estos campos: {", ".join(missing_fields)}.
JSON anterior:
{json.dumps(previous_payload or {}, ensure_ascii=False)[:4000]}

Vuelve a generar el objeto completo, no solo los campos faltantes.
"""
    return f"""Titulo: {title}
Canal/predicador: {channel_name or 'No especificado'}

Transcripcion:
{clipped}

{repair_note}
Genera un resumen detallado en espanol, temas, bosquejo y citas biblicas detectadas.
Responde exclusivamente con este objeto JSON:
{{
  "summary_short": "frase clara de 18 a 35 palabras",
  "summary_detailed": "5 a 8 parrafos sustanciosos de resumen pastoral y tematico",
  "outline": [
    {{"title": "Primer punto principal", "points": ["idea concreta", "idea concreta"]}},
    {{"title": "Segundo punto principal", "points": ["idea concreta", "idea concreta"]}},
    {{"title": "Tercer punto principal", "points": ["idea concreta", "idea concreta"]}},
    {{"title": "Cuarto punto principal", "points": ["idea concreta", "idea concreta"]}}
  ],
  "topics": ["tema 1", "tema 2", "tema 3", "tema 4", "tema 5"],
  "bible_references": [],
  "key_quotes": []
}}"""


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


def summarize_openai(
    *,
    title: str,
    channel_name: str | None,
    transcript: str,
    model: str | None,
    missing_fields: list[str] | None = None,
    previous_payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    from openai import OpenAI

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    selected_model = model or "gpt-5.4"
    reasoning_effort = os.getenv("OPENAI_REASONING_EFFORT", "high").strip() or "high"
    max_output_tokens = int(os.getenv("OPENAI_MAX_OUTPUT_TOKENS", "8000"))
    response = client.responses.create(
        model=selected_model,
        instructions=SYSTEM_PROMPT,
        input=build_prompt(
            title,
            channel_name,
            transcript,
            missing_fields=missing_fields,
            previous_payload=previous_payload,
        ),
        reasoning={"effort": reasoning_effort},
        max_output_tokens=max_output_tokens,
        text={
            "format": {
                "type": "json_schema",
                "name": "sermon_summary",
                "schema": SUMMARY_JSON_SCHEMA,
                "strict": True,
            },
        },
    )
    content = response.output_text or "{}"
    return json.loads(content)


def summarize_ollama(
    *,
    title: str,
    channel_name: str | None,
    transcript: str,
    model: str | None,
    base_url: str,
    missing_fields: list[str] | None = None,
    previous_payload: dict[str, Any] | None = None,
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
                {
                    "role": "user",
                    "content": build_prompt(
                        title,
                        channel_name,
                        transcript,
                        max_chars=max_chars,
                        missing_fields=missing_fields,
                        previous_payload=previous_payload,
                    ),
                },
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

    def string_list(values: list[Any]) -> list[str]:
        normalized = []
        for value in values:
            if isinstance(value, str) and value.strip():
                normalized.append(value.strip())
            elif isinstance(value, (int, float)):
                normalized.append(str(value))
        return normalized

    def outline_list(values: list[Any]) -> list[dict[str, Any]]:
        normalized = []
        for value in values:
            if isinstance(value, dict):
                title = str(value.get("title") or value.get("titulo") or "").strip()
                points = value.get("points") or value.get("puntos") or []
                if isinstance(points, str):
                    points = [points]
                if title:
                    normalized.append({"title": title, "points": string_list(points if isinstance(points, list) else [])})
            elif isinstance(value, str) and value.strip():
                normalized.append({"title": value.strip(), "points": []})
        return normalized

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
        "outline": outline_list(first_list("outline", "bosquejo", "estructura", "puntos")),
        "topics": string_list(first_list("topics", "temas")),
        "bible_references": string_list(
            first_list(
                "bible_references",
                "bible_refs",
                "scripture_references",
                "citas_biblicas",
                "referencias_biblicas",
                "pasajes_biblicos",
            )
        ),
        "key_quotes": string_list(first_list("key_quotes", "quotes", "citas_clave", "frases_clave")),
    }

from __future__ import annotations

import argparse

from backend.sermon_index.config import get_settings
from backend.sermon_index.db import connect, init_db, mark_video_status, save_summary, transcripts_to_summarize
from backend.sermon_index.summarizer import normalize_summary, stub_summary, summarize_ollama, summarize_openai


def summary_quality_errors(summary: dict[str, object]) -> list[str]:
    errors = []
    if not str(summary.get("summary_short") or "").strip():
        errors.append("summary_short")
    if not str(summary.get("summary_detailed") or "").strip():
        errors.append("summary_detailed")
    if not summary.get("outline"):
        errors.append("outline")
    if not summary.get("topics"):
        errors.append("topics")
    return errors


def generate_summary_payload(
    *,
    provider: str,
    title: str,
    channel_name: str | None,
    transcript: str,
    model: str | None,
    ollama_base_url: str,
    missing_fields: list[str] | None = None,
    previous_payload: dict[str, object] | None = None,
) -> dict[str, object]:
    if provider == "openai":
        return summarize_openai(
            title=title,
            channel_name=channel_name,
            transcript=transcript,
            model=model,
            missing_fields=missing_fields,
            previous_payload=previous_payload,
        )
    if provider == "ollama":
        return summarize_ollama(
            title=title,
            channel_name=channel_name,
            transcript=transcript,
            model=model,
            base_url=ollama_base_url,
            missing_fields=missing_fields,
            previous_payload=previous_payload,
        )
    return stub_summary(title, transcript)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, help="Maximo de transcripciones a resumir.")
    parser.add_argument("--provider", choices=["stub", "openai", "ollama"], default=None)
    parser.add_argument("--model", default=None)
    args = parser.parse_args()

    settings = get_settings()
    provider = args.provider or settings.summary_provider
    selected_model = args.model or settings.summary_model

    with connect(settings.database_path) as conn:
        init_db(conn)
        rows = transcripts_to_summarize(conn, args.limit)
        if not rows:
            print("No hay transcripciones pendientes de resumen.")
            return

        for row in rows:
            print(f"Resumiendo: {row['title']} ({row['video_id']})")
            try:
                payload = generate_summary_payload(
                    provider=provider,
                    title=row["title"],
                    channel_name=row["channel_name"],
                    transcript=row["transcript_text"],
                    model=selected_model,
                    ollama_base_url=settings.ollama_base_url,
                )
                summary = normalize_summary(payload)
                quality_errors = summary_quality_errors(summary)
                if quality_errors and provider in {"openai", "ollama"}:
                    print(f"  Reintentando resumen completo; faltaba: {', '.join(quality_errors)}")
                    payload = generate_summary_payload(
                        provider=provider,
                        title=row["title"],
                        channel_name=row["channel_name"],
                        transcript=row["transcript_text"],
                        model=selected_model,
                        ollama_base_url=settings.ollama_base_url,
                        missing_fields=quality_errors,
                        previous_payload=payload,
                    )
                    summary = normalize_summary(payload)
                    quality_errors = summary_quality_errors(summary)
                if quality_errors:
                    raise ValueError(f"El proveedor devolvio un resumen incompleto: {', '.join(quality_errors)}")

                save_summary(
                    conn,
                    video_id=row["video_id"],
                    provider=provider,
                    model=selected_model,
                    summary_short=summary["summary_short"],
                    summary_detailed=summary["summary_detailed"],
                    outline=summary["outline"],
                    topics=[str(item) for item in summary["topics"]],
                    bible_references=[str(item) for item in summary["bible_references"]],
                    key_quotes=[str(item) for item in summary["key_quotes"]],
                )
                print("  OK")
            except Exception as exc:
                mark_video_status(conn, row["video_id"], "summary_failed")
                print(f"  ERROR: se marco como summary_failed: {exc}")


if __name__ == "__main__":
    main()

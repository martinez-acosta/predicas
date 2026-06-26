from __future__ import annotations

import argparse

from faster_whisper import WhisperModel

from backend.sermon_index.config import get_settings
from backend.sermon_index.db import connect, init_db, save_transcript, videos_to_transcribe
from backend.sermon_index.youtube import download_audio


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, help="Maximo de videos a transcribir.")
    parser.add_argument("--model", help="Modelo Whisper/faster-whisper.", default=None)
    parser.add_argument("--device", default="cpu", help="cpu, cuda, auto.")
    parser.add_argument("--compute-type", default="int8", help="int8, float16, float32.")
    parser.add_argument("--language", default="es", help="Idioma esperado.")
    args = parser.parse_args()

    settings = get_settings()
    model_name = args.model or settings.whisper_model

    with connect(settings.database_path) as conn:
        init_db(conn)
        rows = videos_to_transcribe(conn, args.limit)
        if not rows:
            print("No hay videos pendientes de transcripcion.")
            return

        print(f"Cargando Whisper model={model_name} device={args.device} compute={args.compute_type}")
        model = WhisperModel(model_name, device=args.device, compute_type=args.compute_type)

        for row in rows:
            print(f"Transcribiendo: {row['title']} ({row['video_id']})")
            audio_path = download_audio(row["youtube_url"], row["video_id"], settings.audio_dir)
            segments_iter, info = model.transcribe(str(audio_path), language=args.language, vad_filter=True)
            segments = []
            text_parts = []
            for segment in segments_iter:
                item = {
                    "start": round(float(segment.start), 2),
                    "end": round(float(segment.end), 2),
                    "text": segment.text.strip(),
                }
                segments.append(item)
                text_parts.append(item["text"])
            text = "\n".join(text_parts).strip()
            save_transcript(
                conn,
                video_id=row["video_id"],
                text=text,
                segments=segments,
                language=getattr(info, "language", args.language),
                model=model_name,
            )
            print(f"  OK: {len(segments)} segmentos.")


if __name__ == "__main__":
    main()


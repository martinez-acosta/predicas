from __future__ import annotations

import argparse

from faster_whisper import WhisperModel

from backend.sermon_index.config import get_settings
from backend.sermon_index.db import connect, init_db, mark_video_status, save_transcript, videos_to_transcribe
from backend.sermon_index.youtube import download_audio, local_audio_path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, help="Maximo de videos a transcribir.")
    parser.add_argument("--model", help="Modelo Whisper/faster-whisper.", default=None)
    parser.add_argument("--device", default="cpu", help="cpu, cuda, auto.")
    parser.add_argument("--compute-type", default="int8", help="int8, float16, float32.")
    parser.add_argument("--language", default="es", help="Idioma esperado.")
    parser.add_argument("--keep-audio", action="store_true", help="Conserva el audio descargado despues de transcribir.")
    parser.add_argument("--local-only", action="store_true", help="Solo transcribe audios ya existentes en AUDIO_DIR.")
    parser.add_argument("--source", help="Solo transcribe videos de esta fuente.")
    args = parser.parse_args()

    settings = get_settings()
    model_name = args.model or settings.whisper_model

    with connect(settings.database_path) as conn:
        init_db(conn)
        rows = videos_to_transcribe(conn, None if args.local_only else args.limit, source_slug=args.source)
        if args.local_only:
            rows = [row for row in rows if local_audio_path(row["video_id"], settings.audio_dir)]
            if args.limit:
                rows = rows[: args.limit]
        if not rows:
            print("No hay videos pendientes de transcripcion.")
            return

        print(f"Cargando Whisper model={model_name} device={args.device} compute={args.compute_type}")
        model = WhisperModel(model_name, device=args.device, compute_type=args.compute_type)

        for row in rows:
            audio_path = None
            print(f"Transcribiendo: {row['title']} ({row['video_id']})")
            try:
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
            except Exception as exc:
                mark_video_status(conn, row["video_id"], "transcribe_failed")
                print(f"  ERROR: se marco como transcribe_failed: {exc}")
            finally:
                if not args.keep_audio:
                    for candidate in settings.audio_dir.glob(f"{row['video_id']}.*"):
                        candidate.unlink(missing_ok=True)


if __name__ == "__main__":
    main()

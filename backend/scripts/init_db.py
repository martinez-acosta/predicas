from __future__ import annotations

import argparse

from backend.sermon_index.config import get_settings
from backend.sermon_index.db import connect, init_db, save_summary, save_transcript, upsert_source, upsert_video
from backend.sermon_index.sources import load_sources


def seed_sample(conn) -> None:
    source = {
        "slug": "demo",
        "name": "Demo",
        "preacher": "Predicador demo",
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "enabled": True,
    }
    video = {
        "video_id": "demo-jonas",
        "source_slug": "demo",
        "channel_name": "Demo",
        "preacher": "Predicador demo",
        "title": "Jonás y la misericordia de Dios",
        "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "published_at": "2026-01-10",
        "duration_seconds": 3120,
        "thumbnail_url": "",
        "description": "Registro demo para validar el sitio.",
        "metadata": {},
    }
    transcript = (
        "La historia de Jonás nos muestra que la misericordia de Dios no se limita a las fronteras "
        "que nosotros levantamos. Jonás huye de Nínive porque entiende que Dios es compasivo, lento "
        "para la ira y grande en misericordia. La prédica llama a rendir el resentimiento, obedecer "
        "la voz de Dios y celebrar cuando otros reciben gracia."
    )
    upsert_source(conn, source)
    upsert_video(conn, video)
    save_transcript(
        conn,
        video_id=video["video_id"],
        text=transcript,
        segments=[
            {
                "start": 0,
                "end": 45,
                "text": "La historia de Jonás nos muestra la misericordia de Dios.",
            }
        ],
        language="es",
        model="sample",
    )
    save_summary(
        conn,
        video_id=video["video_id"],
        provider="sample",
        model="sample",
        summary_short="Una prédica sobre Jonás, obediencia y la misericordia de Dios hacia Nínive.",
        summary_detailed=(
            "La prédica presenta el libro de Jonás como una confrontación entre el resentimiento humano "
            "y la misericordia divina. Explica que Jonás conoce el carácter compasivo de Dios, pero se "
            "resiste a participar en una misión donde sus enemigos puedan recibir gracia. El llamado "
            "central es obedecer aunque el corazón todavía esté siendo formado, abandonar la superioridad "
            "moral y celebrar la restauración de otros."
        ),
        outline=[
            {"title": "La huida de Jonás", "points": ["Jonás evade el llamado a Nínive.", "La desobediencia revela una batalla interior."]},
            {"title": "El caracter de Dios", "points": ["Dios es compasivo.", "La misericordia alcanza incluso a quienes incomodan."]},
            {"title": "La respuesta del creyente", "points": ["Obedecer.", "Rendir resentimientos.", "Celebrar la gracia."]},
        ],
        topics=["Jonás", "misericordia", "obediencia", "gracia", "Nínive"],
        bible_references=["Jonás 1", "Jonás 3", "Jonás 4"],
        key_quotes=["La misericordia de Dios no cabe dentro de nuestras fronteras."],
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--with-sample", action="store_true", help="Inserta un registro demo para validar el front.")
    args = parser.parse_args()

    settings = get_settings()
    sources = load_sources(settings.sources_path)
    with connect(settings.database_path) as conn:
        init_db(conn)
        for source in sources:
            upsert_source(conn, source)
        if args.with_sample:
            seed_sample(conn)
    print(f"Base inicializada: {settings.database_path}")


if __name__ == "__main__":
    main()

# Predicas

Sistema local para indexar predicas de YouTube, transcribirlas con Whisper, resumirlas y publicar un sitio estatico en GitHub Pages.

## Arquitectura

- `backend/`: scripts Python reanudables.
- `data/predicas.sqlite`: base maestra local en SQLite.
- `frontend/`: sitio Next exportado como HTML estatico.
- `frontend/public/data/`: JSON generado desde SQLite para el sitio.

No hay base de datos en la nube. Python procesa en tu Mac y el front consume archivos estaticos.

## Setup rapido

```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt

cd frontend
npm install
cd ..
```

Inicializa la base y exporta datos demo:

```bash
python -m backend.scripts.init_db --with-sample
python -m backend.scripts.export_site --include-transcripts
```

Corre el sitio:

```bash
cd frontend
npm run dev
```

## Pipeline real

```bash
source backend/.venv/bin/activate

python -m backend.scripts.init_db
python -m backend.scripts.ingest --limit 20
python -m backend.scripts.transcribe --limit 3 --model small
python -m backend.scripts.summarize --limit 3 --provider stub
python -m backend.scripts.export_site --include-transcripts
```

Para resumen con OpenAI:

```bash
export OPENAI_API_KEY="..."
python -m backend.scripts.summarize --provider openai --model "$SUMMARY_MODEL"
```

Para resumen con Ollama local:

```bash
python -m backend.scripts.summarize --provider ollama --model llama3.1
```

## GitHub Pages

El front se genera como sitio estatico:

```bash
cd frontend
npm run build
```

El resultado queda en `frontend/out/`.

Si el sitio se publicara bajo un subpath de GitHub Pages, define:

```bash
NEXT_PUBLIC_BASE_PATH=/nombre-del-repo npm run build
```

El workflow `.github/workflows/pages.yml` construye y publica `frontend/out/`. El pipeline de Whisper no corre en GitHub Actions; debes procesar localmente, exportar JSON y subir esos datos al repo.

## Notas de almacenamiento

- `data/audio/` queda fuera de Git porque crece rapido.
- `data/predicas.sqlite` no esta ignorado; si el repo sera privado, puede funcionar como backup simple.
- Si la base crece demasiado, conviene versionar los JSON exportados y respaldar SQLite por separado.

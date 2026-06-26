PYTHON := backend/.venv/bin/python

.PHONY: setup init ingest transcribe summarize export build dev search

setup:
	python3 -m venv backend/.venv
	backend/.venv/bin/pip install -r backend/requirements.txt
	cd frontend && npm install

init:
	$(PYTHON) -m backend.scripts.init_db

ingest:
	$(PYTHON) -m backend.scripts.ingest

transcribe:
	$(PYTHON) -m backend.scripts.transcribe --limit 1 --model small

summarize:
	$(PYTHON) -m backend.scripts.summarize --limit 1 --provider stub

export:
	$(PYTHON) -m backend.scripts.export_site --include-transcripts

build:
	cd frontend && npm run build

dev:
	cd frontend && npm run dev -- --hostname 127.0.0.1 --port 3000

search:
	$(PYTHON) -m backend.scripts.search "$(q)"


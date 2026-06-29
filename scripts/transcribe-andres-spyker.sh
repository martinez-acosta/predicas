#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p logs

backend/.venv/bin/python -m backend.scripts.ingest --source andres-spyker

caffeinate -dimsu backend/.venv/bin/python -m backend.scripts.process_queue \
  --source andres-spyker \
  --transcribe-only \
  2>&1 | tee -a "logs/transcribe-andres-spyker-$(date +%Y%m%d-%H%M%S).log"

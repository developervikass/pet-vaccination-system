#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ ! -f "../venv/bin/activate" ]]; then
  echo "Error: ../venv/bin/activate not found."
  exit 1
fi

source ../venv/bin/activate

if [[ ! -f ".env" ]]; then
  if [[ -f ".env.example" ]]; then
    cp .env.example .env
    echo "Created .env from .env.example. Update MySQL credentials in backend/.env and re-run."
    exit 1
  else
    echo "Error: .env and .env.example are missing."
    exit 1
  fi
fi

DB_ENGINE_VALUE="$(grep -E '^DB_ENGINE=' .env | cut -d'=' -f2- | tr -d '\"' | tr -d "'" || true)"
if [[ "${DB_ENGINE_VALUE,,}" != "mysql" ]]; then
  echo "Error: DB_ENGINE is not mysql in backend/.env"
  echo "Set DB_ENGINE=mysql and configure DB_NAME/DB_USER/DB_PASSWORD/DB_HOST/DB_PORT."
  exit 1
fi

echo "Running Django migrations on MySQL..."
python manage.py migrate

if [[ -f "sqlite_export.json" ]]; then
  echo "Loading data from sqlite_export.json..."
  python manage.py loaddata sqlite_export.json
else
  echo "sqlite_export.json not found. Skipping data import."
fi

echo "Current Django DB settings:"
python manage.py shell -c "from django.conf import settings; print(settings.DATABASES['default'])"

echo "MySQL migration/import completed."

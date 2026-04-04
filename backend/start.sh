#!/bin/sh
set -e

PORT="${PORT:-8000}"

if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL not set, skipping DB wait and migrations"
else
  echo "Waiting for database (max 60s)..."
  TRIES=0
  until python -c "
import asyncio, asyncpg, os, sys
async def check():
    url = os.environ.get('DATABASE_URL', '').replace('postgresql+asyncpg://', 'postgresql://').replace('postgres://', 'postgresql://')
    conn = await asyncpg.connect(url, timeout=3)
    await conn.close()
asyncio.run(check())
" 2>/dev/null; do
    TRIES=$((TRIES + 1))
    if [ "$TRIES" -ge 30 ]; then
      echo "Database not reachable after 60s, starting anyway..."
      break
    fi
    sleep 2
  done
  echo "Database ready (or timed out). Running migrations..."
  alembic upgrade head || echo "Migrations failed, continuing..."
  echo "Migrations complete."
fi

echo "Starting server on port $PORT..."
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --workers "${UVICORN_WORKERS:-1}"

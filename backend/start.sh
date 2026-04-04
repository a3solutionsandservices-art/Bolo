#!/bin/sh
set -e

echo "Waiting for database..."
until python -c "
import asyncio, asyncpg, os, sys
async def check():
    url = os.environ.get('DATABASE_URL', '').replace('postgresql+asyncpg://', 'postgresql://')
    try:
        conn = await asyncpg.connect(url, timeout=3)
        await conn.close()
    except Exception as e:
        print(f'DB not ready: {e}', file=sys.stderr)
        sys.exit(1)
asyncio.run(check())
"; do
    sleep 2
done
echo "Database ready."

echo "Running migrations..."
alembic upgrade head
echo "Migrations complete."

echo "Starting server..."
PORT="${PORT:-8000}"
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --workers "${UVICORN_WORKERS:-2}"

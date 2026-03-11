# VaaniAI — Implementation Plan

## Configuration
- **Artifacts Path**: `.zenflow/tasks/new-task-f6b9/`
- **Spec**: `.zenflow/tasks/new-task-f6b9/spec.md`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Implementation
<!-- chat-id: c660de76-e4b2-4a31-a57f-c75f3638de7a -->

Full platform implementation covering all deliverables described in `spec.md`.

- [x] Write technical spec (`spec.md`)
- [x] Scaffold monorepo structure + `.gitignore`
- [x] Backend: FastAPI app, models, DB schema, migrations (Alembic)
- [x] Backend: Voice pipeline (Whisper STT, FastText, IndicTrans2, Sarvam TTS)
- [x] Backend: AI conversation agent with RAG (LangChain + Pinecone)
- [x] Backend: Auth (JWT + API keys), multi-tenancy middleware, billing (Stripe), analytics
- [x] Backend: WebSocket real-time voice streaming
- [x] Frontend: Next.js 14 admin dashboard, analytics, knowledge base management, billing
- [x] Widget: Embeddable JS voice widget (`vaani.min.js`)
- [x] Infra: Docker Compose, Dockerfile(s), Nginx config
- [x] Docs: OpenAPI auto-generated + `/docs/api.md` summary
- [x] Backend: Translation refactored to Sarvam Translate (primary) → IndicTrans2 → Google fallback
- [x] Backend: Telephony router — Twilio inbound call + gather webhooks (`/api/v1/telephony`)
- [x] SDK: React Native SDK (`sdk/react-native/`) — `VaaniClient`, `useVaani` hook
- [x] SDK: Plain JS SDK (`sdk/js/`) — `VaaniClient` for browser/Node
- [x] Bug fix: `await stt.transcribe()` in `conversation.py`
- [x] `.env.example` updated with Twilio + Sarvam STT vars
- [x] Bug fix: Whisper STT blocking event loop — wrapped with `asyncio.to_thread`
- [x] Bug fix: Next.js `output: "standalone"` added to `next.config.mjs`
- [x] Bug fix: Frontend Dockerfile dev deps — changed to `npm ci` (all deps)
- [x] Bug fix: Widget embed snippet missing `apiKey` placeholder — added to tenants router
- [x] Bug fix: `get_db()` `AsyncGenerator` return type annotation fixed
- [x] Bug fix: `pypdf` added to `pyproject.toml` dependencies
- [x] Fix: Analytics, settings, billing pages moved under `/dashboard/` layout for auth guard
- [x] Fix: Sidebar nav links updated to `/dashboard/analytics`, `/dashboard/settings`, `/dashboard/settings/billing`
- [x] Fix: Deleted unauthenticated duplicate routes (old `/analytics`, `/settings`, `/settings/billing`)
- [x] Fix: `tests/conftest.py` supports `TEST_DATABASE_URL` env var for PostgreSQL compatibility
- [x] Fix: SECRET_KEY startup validation guard in `main.py` lifespan
- [x] Fix: `telephony.py` — moved `import base64` to module top
- [x] Fix: `tenants.py` widget snippet uses `settings.API_BASE_URL` (configurable)
- [x] Fix: `tasks/voice_clone.py` uses explicit fresh event loop (safe for all Celery pool types)
- [x] Fix: `backend/start.sh` — waits for DB, runs Alembic migrations, starts uvicorn
- [x] Fix: `backend/Dockerfile` CMD updated to use `start.sh`
- [x] Fix: RAG graceful degradation when PINECONE_API_KEY or OPENAI_API_KEY not set
- [x] Fix: `infra/docker-compose.yml` demo-ready (DEBUG=true, UVICORN_WORKERS=1, migration order)
- [x] Fix: `infra/nginx/nginx.local.conf` — HTTP-only nginx for local demo (no SSL certs required)
- [x] Fix: docker-compose uses `nginx.local.conf` instead of SSL-requiring `nginx.conf`
- [x] Fix: Frontend Dockerfile healthcheck uses `wget` (alpine-compatible, not curl)
- [x] Fix: `NEXT_PUBLIC_API_URL` passed as Docker build arg so Next.js bakes it at build time
- [x] Fix: Stripe SDK calls wrapped with `asyncio.to_thread` (non-blocking async)
- [x] Fix: S3 boto3 calls in Celery task wrapped with `asyncio.to_thread`
- [x] Fix: `UsageService.record()` called after STT/TTS/Translation in `send_message`
- [x] Fix: Atomic `document_count` increment via SQL UPDATE in knowledge.py
- [x] Fix: `float(None)` crash in analytics.py — `or 0` fallback
- [x] Fix: `SentimentIntentAnalyzer` guard for missing OPENAI_API_KEY
- [x] Fix: PDF `page.extract_text() or ""` to prevent TypeError
- [x] Fix: Deprecated `event_loop` fixture removed from conftest.py
- [x] Fix: Rate limiter uses `X-Forwarded-For` / `X-Real-IP` headers for proxy-aware IP detection
- [x] Fix: Translation chunks parallelized with `asyncio.gather`
- [x] Fix: Smart document processing dispatch (S3+Celery or BackgroundTasks fallback)
- [x] Fix: WebSocket voice stream supports all 3 modes (translation, conversation, agent)
- [x] Fix: DB-connected health check at `/health`
- [x] Fix: Shared limiter singleton (`app/core/limiter.py`) used by both main.py and voice.py
- [x] Fix: `get_transcript` paginated (skip/limit params)
- [x] Fix: `train_voice_clone` dispatches real Celery task to Sarvam API
- [x] Fix: Voice clone upload guarded with 50 MB file-size limit
- [x] Fix: Dashboard Quick Actions links fixed (`/dashboard/analytics`, `/dashboard/settings`)
- [x] Fix: Widget TypeScript warnings — definite assignment assertions on private fields
- [x] Fix: Widget builds cleanly to `dist/vaani.js` and `dist/vaani.min.js`
- [x] Fix: Frontend ESLint config added (`.eslintrc.json`)
- [x] Fix: `transcribeAndSend` refactored to `useCallback` in new conversation page
- [x] Fix: Shared `split_text_into_chunks` in `constants.py` — eliminates duplication across `tts.py` and `translation.py`
- [x] Fix: Moved inline `import re` (auth.py), `import json` (sentiment.py, knowledge.py), `import io` (knowledge.py, tasks/knowledge.py), `import logging`/`import asyncio` (stt.py, translation.py) to module level

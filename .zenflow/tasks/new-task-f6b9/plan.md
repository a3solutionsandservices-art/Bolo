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

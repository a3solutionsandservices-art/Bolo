# VaaniAI — AI Voice Translation & Conversation Platform
## Technical Specification

---

## 1. Overview

VaaniAI is a multi-tenant SaaS platform enabling real-time speech-to-speech translation and AI-powered conversations in Indian languages. Enterprises can embed a voice widget, use the REST/WebSocket API, and manage everything through an admin dashboard.

---

## 2. Architecture Decisions

| Concern | Decision | Rationale |
|---|---|---|
| STT | OpenAI Whisper (self-hosted via faster-whisper) | Low-latency, Indian language support |
| Language Detection | FastText lid.176.bin | Lightweight, accurate |
| Translation | IndicTrans2 (primary) + Google Translate API (fallback) | Best accuracy for Indian langs |
| TTS | Sarvam AI API | Supports all target Indian languages |
| AI Agent | OpenAI GPT-4o + LangChain RAG | Flexible, production-ready |
| Vector DB | Pinecone (managed) | Simple scaling |
| Primary DB | PostgreSQL via SQLAlchemy | ACID, JSONB for metadata |
| Cache | Redis | Session state, rate limits |
| Realtime | WebSockets + WebRTC signaling | Sub-second latency |
| Billing | Stripe | Subscription + usage metering |
| Deployment | AWS (ECS Fargate + RDS + ElastiCache) | ML workload needs |
| Auth | JWT + API keys | Multi-tenant isolation |
| Monorepo | Single repo, independent packages | Simpler CI/CD |

---

## 3. Monorepo Structure

```
vaaniai/
├── backend/               # FastAPI Python service
│   ├── app/
│   │   ├── api/           # Route handlers
│   │   ├── core/          # Business logic (STT, TTS, NLP)
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # External service integrations
│   │   ├── db/            # DB session, migrations (Alembic)
│   │   └── middleware/    # Auth, rate-limiting, tenant
│   ├── tests/
│   ├── alembic/
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/              # Next.js 14 App Router
│   ├── app/
│   │   ├── (auth)/        # Login/signup
│   │   ├── dashboard/     # Admin dashboard
│   │   ├── analytics/     # Usage analytics
│   │   ├── knowledge/     # Knowledge base management
│   │   └── settings/      # Tenant settings, billing
│   ├── components/
│   ├── lib/
│   └── Dockerfile
├── widget/                # Embeddable JS voice widget
│   ├── src/
│   │   ├── VaaniWidget.ts
│   │   ├── AudioCapture.ts
│   │   ├── WebSocketClient.ts
│   │   └── UI.ts
│   ├── dist/              # Built widget (vaani.min.js)
│   └── package.json
├── infra/
│   ├── docker-compose.yml
│   ├── aws/               # ECS task defs, CDK stacks
│   └── nginx/
└── docs/
    └── api.md
```

---

## 4. Database Schema

### Core Tables

- **tenants** — organisations using the platform (white-label)
- **users** — platform users (admin, agent, viewer roles)
- **api_keys** — developer API keys scoped to tenant
- **conversations** — one session per call
- **messages** — individual turns within a conversation
- **knowledge_bases** — per-tenant document collections
- **knowledge_documents** — individual documents
- **voice_clones** — branded TTS voice models
- **usage_events** — append-only usage for billing
- **subscriptions** — Stripe subscription mapping
- **webhooks** — tenant-configured event hooks

---

## 5. API Surface

### Authentication
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/api-keys` — generate developer key

### Voice & Translation
- `POST /voice/transcribe` — audio file → text (Whisper)
- `POST /voice/synthesize` — text → audio (Sarvam TTS)
- `POST /voice/translate` — text → translated text
- `POST /voice/detect-language` — text/audio → language code
- `WS  /voice/stream` — bidirectional real-time voice stream

### Conversation
- `POST /conversations` — start new session
- `GET  /conversations/{id}` — get full transcript
- `POST /conversations/{id}/message` — send text message
- `WS  /conversations/{id}/stream` — streaming voice conversation
- `GET  /conversations/{id}/sentiment` — sentiment analysis
- `GET  /conversations/{id}/transcript` — formatted transcript

### Knowledge Base (RAG)
- `POST /knowledge-bases` — create knowledge base
- `POST /knowledge-bases/{id}/documents` — upload documents
- `GET  /knowledge-bases/{id}/documents` — list documents
- `DELETE /knowledge-bases/{id}/documents/{doc_id}`
- `POST /knowledge-bases/{id}/query` — semantic search

### Analytics
- `GET /analytics/overview` — usage summary
- `GET /analytics/conversations` — conversation metrics
- `GET /analytics/languages` — language distribution
- `GET /analytics/latency` — pipeline latency stats

### Billing
- `GET  /billing/plans` — available plans
- `POST /billing/subscribe` — create subscription
- `GET  /billing/usage` — current period usage
- `POST /billing/portal` — Stripe customer portal session

### Tenants (White-label)
- `GET  /tenants/me` — current tenant config
- `PATCH /tenants/me` — update branding, settings
- `GET  /tenants/me/widget-config` — widget embed config

### Admin
- `GET  /admin/tenants` — list all tenants (super-admin)
- `GET  /admin/usage` — platform-wide usage

### Developer API (External)
- All endpoints accessible via `Authorization: Bearer <api_key>`
- Rate-limited per plan tier
- OpenAPI spec auto-generated at `/docs`

---

## 6. Voice Pipeline Flow

```
User speaks
    ↓
WebRTC/WebSocket audio chunk arrives at backend
    ↓
VAD (Voice Activity Detection) — filter silence
    ↓
Whisper STT → raw transcript (+ confidence score)
    ↓
FastText language detection → source_lang code
    ↓
Accent/dialect normalization (post-processing rules)
    ↓
Intent & sentiment detection (LLM or classifier)
    ↓
[If translation mode]
    IndicTrans2 / Google Translate → target_lang text
    Sarvam TTS → audio bytes → stream to client
[If conversation mode]
    LangChain RAG → LLM response text
    Translate response to user's language (if needed)
    Sarvam TTS → audio bytes → stream to client
    ↓
Store message in DB → emit usage event
```

---

## 7. Multi-Tenancy

- Each tenant has an isolated namespace (tenant_id UUID)
- Row-level security on all DB tables via `tenant_id`
- Separate Pinecone namespaces per tenant knowledge base
- Custom branding: logo, colors, voice persona, widget domain whitelist
- Per-tenant rate limits and feature flags

---

## 8. Billing Model

| Tier | Price | STT minutes/mo | TTS chars/mo | Conversations |
|---|---|---|---|---|
| Starter | $49/mo | 500 | 1M | 1,000 |
| Growth | $199/mo | 2,500 | 5M | 10,000 |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited |

Overage billed per unit. Tracked via `usage_events` → Stripe metered billing.

---

## 9. Deployment Architecture (AWS)

```
Route53 → CloudFront CDN
                ↓
         ALB (HTTPS)
        /          \
  ECS Fargate    ECS Fargate
  (backend)      (frontend)
       |
  RDS PostgreSQL (Multi-AZ)
  ElastiCache Redis
  S3 (audio storage, knowledge docs)
  ECR (container registry)
```

- ECS auto-scaling on CPU/request count
- RDS read replica for analytics queries
- S3 pre-signed URLs for audio file delivery
- CloudWatch for logs and alarms

# Bolo — Product Requirements Document

**Version**: 1.0  
**Status**: MVP  
**Last Updated**: March 2026  
**Owner**: Praveen Yelukati

---

## 1. Executive Summary

**Bolo** is a multilingual voice AI platform purpose-built for Indian languages. It enables businesses, developers, and content creators to build voice-powered applications — chatbots, IVR systems, translation tools, and conversational agents — across 11 Indian languages without writing AI infrastructure from scratch.

Beyond the B2B SaaS offering, Bolo operates a **Voice Marketplace** where regional celebrities, voice artists, and everyday speakers can monetise their voices via licensing, and simultaneously contribute to a crowd-sourced language data corpus for under-represented Indian languages and dialects.

---

## 2. Problem Statement

| Problem | Who It Affects |
|---------|---------------|
| ~1 billion Indians are not fluent in English and are excluded from AI-powered digital services | End consumers, rural users |
| Businesses building for Bharat must stitch together multiple fragmented APIs (STT, TTS, Translation, LLM) | Developers, product teams |
| 700+ Indian languages and dialects are under-resourced — AI models perform poorly or not at all | Regional language communities |
| Regional voice artists, celebrities, and dialect speakers have no platform to monetise their voice IP | Voice artists, content creators |
| AI4Bharat and government datasets exist but lack commercial licensing, consent documentation, and quality guarantees | Enterprise buyers |

---

## 3. Vision

> **"Make every Indian language a first-class citizen of the AI era."**

Bolo provides the infrastructure layer for voice AI in India — the way Twilio did for telephony or Stripe did for payments.

---

## 4. Target Users

### Primary

| Segment | Description |
|---------|-------------|
| **SMB / D2C Brands** | E-commerce, edtech, fintech companies serving Tier 2/3 India who need vernacular customer support |
| **Enterprise** | Banks, insurance, healthcare, government — deploying IVR or digital assistants at scale |
| **Developers / Agencies** | Building voice-first apps, WhatsApp bots, or Alexa-style assistants for clients |

### Secondary

| Segment | Description |
|---------|-------------|
| **Voice Artists** | Regional language actors, RJ/DJ artists, YouTubers wanting to licence their voice |
| **Language Preservationists** | Linguists, NGOs, academic institutions collecting dialect data |
| **Regional Celebrities** | Film stars, politicians, sports personalities monetising voice IP |

---

## 5. Core Features — MVP

### 5.1 Conversation Engine

- **Modes**: Conversation/Agent, Translation
- **API**: `POST /api/v1/conversations` — create a session; `POST /api/v1/conversations/{id}/messages` — send a message
- **Input**: text or audio (base64-encoded WAV/MP3/WebM)
- **Output**: text response + synthesised audio URL
- **Languages**: Hindi, Tamil, Telugu, Bengali, Gujarati, Marathi, Kannada, Malayalam, Punjabi, Odia, English
- **Custom system prompt**: injection via `system_prompt` field on session creation (capped at 4,000 chars)

### 5.2 Speech-to-Text (STT)

- Provider: **Sarvam AI saaras:v2**
- Returns: transcript, confidence (0–1), duration in seconds
- Endpoint: `POST /api/v1/voice/transcribe`
- Accepts: WAV, MP3, WebM, OGG up to 25 MB

### 5.3 Text-to-Speech (TTS)

- Provider: **Sarvam AI bulbul:v1**
- Returns: Base64 audio or media URL
- Endpoint: `POST /api/v1/voice/synthesize`
- Supports: default Sarvam voices or user-cloned voice

### 5.4 Translation

- Provider: Sarvam AI translate API
- Source → target across all 11 languages
- Auto-detection of source language

### 5.5 RAG Knowledge Base

- Storage: **Pinecone** vector database
- Embeddings: OpenAI `text-embedding-3-small`
- LLM: OpenAI GPT-4o
- Ingestion: PDF, DOCX, TXT (up to 10 MB per file)
- Endpoint: `POST /api/v1/knowledge-bases` + document upload
- Status lifecycle: PENDING → PROCESSING → READY / FAILED

### 5.6 Voice Cloning

- Upload 3–10 minutes of clean speech samples (WAV/MP3)
- WER (Word Error Rate) validation on upload via Sarvam STT
- Sample quality requirements: ≥3 seconds, ≥0.4 STT confidence, ≤120s per sample
- Training produces a custom voice ID usable in TTS
- **Requires Growth plan or above**

### 5.7 Real-Time Voice Streaming (WebSocket)

- Endpoint: `WS /api/v1/voice/stream`
- Authentication: JWT or API key in first WebSocket message
- Audio chunking: 64 KB threshold before STT processing
- Pipeline: audio chunk → STT → (optional translation) → LLM → TTS → audio response

### 5.8 Voice Marketplace

- **Browse**: filter by language, dialect, tier, gender
- **License tiers**: Personal (₹999), Commercial (₹4,999), Broadcast (₹14,999)
- **Artist registration**: upload samples, set languages/dialects, bio, pricing
- **Revenue share**: 70% to artist, 30% to platform
- **License lifecycle**: PENDING → APPROVED / REJECTED / REVOKED
- **Duplicate guard**: one active/pending license per tenant per artist per tier

### 5.9 Language Data Contribution

- Speakers record prompts via browser `MediaRecorder`
- CER (Character Error Rate) validation against Sarvam STT
- DPDP consent (Digital Personal Data Protection Act 2023) captured at registration
- Languages: all 11 core + contributor-supplied dialects
- Compensation: ₹2–5 per accepted recording (tracked; payouts via UPI — roadmap)
- Stats endpoint: `/contribute/my-stats`

### 5.10 Analytics

- Metrics: conversations, messages, language breakdown, sentiment trends, response latency
- Date ranges: 7 / 14 / 30 / 90 days
- Cross-database (PostgreSQL in prod, SQLite in test) via `db_utils.py` compile dispatch
- Endpoints: `GET /api/v1/analytics/summary`, `/language`, `/sentiment`

### 5.11 Billing & Subscriptions

- Provider: **Stripe**
- Plans:

| Plan | Price | Conversations | KBs | Voice Cloning |
|------|-------|--------------|-----|---------------|
| Starter | ₹49/mo | 1,000 | 3 | No |
| Growth | ₹199/mo | 10,000 | 20 | Yes |
| Enterprise | Custom | Unlimited | Unlimited | Yes |

- Usage overages: ₹0.05/min (STT), ₹0.002/char (TTS)
- Webhook: Stripe events processed at `/api/v1/billing/webhook`

### 5.12 Embeddable Widget

- Single `<script>` tag embed
- Configurable: language, voice, colour scheme, Knowledge Base linkage
- Widget Builder (5-step wizard) in dashboard
- Real-time voice streaming via WebSocket

### 5.13 API Keys

- Create / revoke named API keys
- Used as `Authorization: Bearer <key>` header
- Rate limits enforced per plan tier

### 5.14 Support Chat

- GPT-4o powered, injected with Bolo platform knowledge via system prompt
- Local FAQ fallback (10 patterns) when OpenAI is unavailable
- Floating widget in dashboard (bottom-right)
- Covers: onboarding, billing, technical errors, feature questions

---

## 6. Technical Architecture

### Backend

| Component | Technology |
|-----------|-----------|
| API Framework | FastAPI (Python 3.11) |
| ORM | SQLAlchemy 2.0 (async) |
| Database | PostgreSQL 16 (prod), SQLite (test) |
| Migrations | Alembic (5 migrations) |
| Task Queue | Celery + Redis |
| Cache / Broker | Redis 7 |
| Auth | JWT (access + refresh tokens) + API key |
| Rate Limiting | `slowapi` (X-Forwarded-For aware) |
| File Storage | AWS S3 (prod) or local `/app/media` (dev) |
| Vector DB | Pinecone |

### AI Providers

| Provider | Usage |
|----------|-------|
| Sarvam AI | STT (`saaras:v2`), TTS (`bulbul:v1`), Translation |
| OpenAI | GPT-4o (LLM), `text-embedding-3-small` (embeddings), `gpt-4o-mini` (sentiment) |
| Pinecone | Vector storage and similarity search |

### Frontend

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 (App Router) |
| UI | Tailwind CSS v3, custom design tokens |
| State | Zustand with persist (localStorage + cookies) |
| HTTP | Axios with JWT refresh interceptor |
| Auth guard | `mounted` pattern in dashboard layout |

### Infrastructure

| Component | Technology |
|-----------|-----------|
| Containerisation | Docker + Docker Compose |
| Reverse Proxy | nginx (WebSocket proxying, `/media/` static serving) |
| Process Manager | Uvicorn (1–4 workers) |

---

## 7. Data Models

| Model | Key Fields |
|-------|-----------|
| `User` | id, email, hashed_password, role, tenant_id |
| `Tenant` | id, name, slug, plan, stripe_customer_id |
| `Conversation` | id, tenant_id, mode, source/target_language, caller_metadata (JSONB) |
| `Message` | id, conversation_id, role, content_original, content_translated, audio_url, sentiment, intent, rag_sources |
| `KnowledgeBase` | id, tenant_id, name, document_count, total_chunks, pinecone_namespace |
| `VoiceClone` | id, tenant_id, name, status, samples (JSONB), voice_id |
| `VoiceArtist` | id, user_id, display_name, languages (JSONB), dialects (JSONB), sample_urls (JSONB), tier_pricing (JSONB) |
| `VoiceLicense` | id, tenant_id, artist_id, tier, status, price_inr |
| `DataContribution` | id, user_id, language, dialect, audio_url, transcript, cer_score, is_accepted |
| `Subscription` | id, tenant_id, plan, stripe_subscription_id |
| `Usage` | id, tenant_id, conversation_id, event_type, quantity, unit |
| `ApiKey` | id, tenant_id, key_hash, name, last_used_at |
| `Webhook` | id, tenant_id, url, events (JSONB), secret |

---

## 8. Security

- JWT tokens (access: 30 min, refresh: 7 days)
- Passwords hashed with bcrypt
- API keys stored as SHA-256 hashes
- WebSocket auth before `accept()` (code 4001 on failure)
- Rate limiting on all public endpoints
- HTML escaping before `dangerouslySetInnerHTML` in all chat components
- `system_prompt` capped at 4,000 characters (token cost protection)
- DPDP-compliant consent capture for voice data collection
- `skip_validation` on voice uploads restricted to `SUPER_ADMIN` / `TENANT_ADMIN`

---

## 9. Roadmap

### Now (MVP — Live)

- All core features listed in Section 5
- Docker Compose single-node deployment
- Stripe billing (Starter, Growth, Enterprise)
- Voice Marketplace (license + contribute)
- Language data collection with CER validation

### Next (3–6 months)

| Feature | Priority |
|---------|----------|
| Forgot password / email reset flow | High |
| UPI payouts for marketplace contributors | High |
| WhatsApp webhook integration | High |
| Plan-gating enforcement (hard blocks on quota) | High |
| Admin panel (super-admin user management) | Medium |
| Webhook delivery system (retry + logs) | Medium |
| Peer validation for contributed recordings | Medium |
| Multi-user workspace (team seats) | Medium |

### Later (6–12 months)

| Feature | Priority |
|---------|----------|
| Train Sarvam / fine-tune open-source models on Bolo corpus | High |
| Bhojpuri, Maithili, Konkani, Tulu dialect support | High |
| Government licensing of dialect corpus (AI4Bharat partnership) | High |
| Mobile SDK (React Native) | Medium |
| Telephony (Twilio / Exotel IVR) | Medium |
| Flower Celery monitoring dashboard | Low |
| Regional celebrity voice licensing portal | High |

---

## 10. Success Metrics

| Metric | Target (Month 6) |
|--------|-----------------|
| Registered tenants | 500 |
| Active monthly conversations | 50,000 |
| Voice artists on marketplace | 100 |
| Contributed recordings accepted | 10,000 |
| MRR | ₹5,00,000 |
| Languages with dialect coverage | 6 |

---

## 11. Dependencies & Risks

| Risk | Mitigation |
|------|-----------|
| Sarvam AI rate limits / downtime | Local Whisper STT fallback, graceful error messages |
| OpenAI API costs | GPT-4o-mini for sentiment, capped prompts, quota monitoring |
| Pinecone cold-start latency | Pre-warm on first query; local vector fallback not yet implemented |
| AWS S3 not configured | Local `/app/media` fallback implemented |
| `pyproject.toml` / `requirements.txt` drift | Comment in `requirements.txt` documents `poetry export` sync command |
| DPDP compliance | Consent captured at contributor registration; data access controls per tenant |

---

## 12. Out of Scope (v1)

- Native mobile apps (iOS / Android)
- On-premise / self-hosted AI model training
- Video synthesis or lip-sync
- Real-time voice cloning (instant, no training)
- PSTN telephony (inbound/outbound calls)

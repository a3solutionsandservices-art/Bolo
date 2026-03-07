# VaaniAI Developer API Reference

Base URL: `https://api.vaaniai.com/api/v1`

Interactive docs: `https://api.vaaniai.com/docs`

---

## Authentication

All endpoints accept either:
- **JWT Bearer token**: `Authorization: Bearer <access_token>`
- **API Key**: `Authorization: Bearer vai_<key>` (from dashboard → API Keys)

---

## Auth

### POST /auth/register
Create a new tenant + admin user.

```json
{
  "email": "user@company.com",
  "password": "••••••••",
  "full_name": "Rahul Sharma",
  "tenant_name": "Acme Corp",
  "tenant_slug": "acme-corp"
}
```

**Response**: `{ access_token, refresh_token, token_type }`

### POST /auth/login
```json
{ "email": "...", "password": "..." }
```

### POST /auth/refresh
```json
{ "refresh_token": "..." }
```

### POST /auth/api-keys
Generate a developer API key.
```json
{ "name": "Production Widget", "scopes": ["voice:read", "voice:write"] }
```

---

## Voice

### POST /voice/transcribe
Upload audio file for speech-to-text.

- **Content-Type**: `multipart/form-data`
- **Fields**: `audio` (file), `language` (optional, e.g. `hi`)

**Response**:
```json
{
  "text": "नमस्ते, मुझे मदद चाहिए",
  "language": "hi",
  "language_probability": 0.98,
  "duration_seconds": 2.4,
  "confidence": 0.91,
  "processing_time_ms": 420
}
```

### POST /voice/synthesize
Convert text to speech.
```json
{
  "text": "नमस्ते, मैं आपकी कैसे मदद कर सकता हूँ?",
  "language": "hi",
  "voice_id": "meera",
  "speaking_rate": 1.0,
  "return_base64": true
}
```
Returns audio/wav bytes directly (or base64 if `return_base64: true`).

### POST /voice/translate
```json
{
  "text": "Hello, how can I help you?",
  "source_language": "en",
  "target_language": "hi"
}
```

### POST /voice/detect-language
```json
{ "text": "नमस्ते दुनिया" }
```

### WS /voice/stream
WebSocket endpoint for real-time bidirectional voice.

**Query params**: `source_language`, `target_language`, `mode`

Client sends binary audio chunks; server sends JSON events:
```json
{ "type": "transcript", "text": "...", "language": "hi", "is_final": true }
{ "type": "translation", "text": "...", "source_language": "hi", "target_language": "en" }
{ "type": "audio", "data": "<base64>", "format": "wav", "language": "en" }
{ "type": "error", "message": "..." }
```

---

## Conversations

### POST /conversations
```json
{
  "mode": "conversation",
  "source_language": "hi",
  "target_language": "en",
  "knowledge_base_id": "uuid (optional)"
}
```

### GET /conversations
List conversations. Params: `skip`, `limit`.

### GET /conversations/{id}
Full conversation with all messages.

### POST /conversations/{id}/message
```json
{ "content": "मुझे product returns के बारे में बताइए" }
```
**Response**:
```json
{
  "message_id": "...",
  "text": "आप किसी भी product को 30 दिन के भीतर return कर सकते हैं...",
  "audio_base64": "UklGRi...",
  "audio_format": "wav",
  "rag_sources": [{ "content": "...", "score": 0.92 }],
  "sentiment": "neutral",
  "intent": "question",
  "processing_time_ms": 1240
}
```

### GET /conversations/{id}/transcript
Returns full transcript. Param: `format=json|text`.

### PATCH /conversations/{id}/end
Mark conversation as completed.

---

## Knowledge Bases

### POST /knowledge-bases
```json
{ "name": "Product FAQ", "languages": ["en", "hi"] }
```

### POST /knowledge-bases/{id}/documents
Upload a document (PDF, TXT, MD, JSON, CSV).

- **Content-Type**: `multipart/form-data`
- **Fields**: `file`, `title`, `language`

### GET /knowledge-bases/{id}/documents
List documents with status (`pending | processing | ready | failed`).

### DELETE /knowledge-bases/{id}/documents/{doc_id}

### POST /knowledge-bases/{id}/query
Semantic search.
```
POST /knowledge-bases/{id}/query?question=What+is+the+return+policy&top_k=5
```

---

## Analytics

### GET /analytics/overview?days=30
Aggregate usage summary.

### GET /analytics/conversations?days=30
Daily conversation counts + sentiment distribution.

### GET /analytics/languages?days=30
Language pair usage.

### GET /analytics/latency?days=7
Per-hour response latency stats.

---

## Billing

### GET /billing/plans
List available plans.

### POST /billing/subscribe
```json
{
  "plan_tier": "growth",
  "success_url": "https://app.example.com/billing?success=true",
  "cancel_url": "https://app.example.com/billing"
}
```
Returns Stripe Checkout URL.

### POST /billing/portal?return_url=...
Returns Stripe Customer Portal URL.

### GET /billing/usage
Current period usage vs plan limits.

---

## Tenants (White-label)

### GET /tenants/me
Current tenant configuration.

### PATCH /tenants/me
Update branding, language defaults, allowed domains.

### GET /tenants/me/widget-config
Returns widget embed snippet and configuration.

---

## Supported Languages

| Code | Language |
|------|----------|
| `hi` | Hindi    |
| `ta` | Tamil    |
| `te` | Telugu   |
| `bn` | Bengali  |
| `gu` | Gujarati |
| `mr` | Marathi  |
| `en` | English  |

---

## Rate Limits

| Tier     | Default  | Voice    |
|----------|----------|----------|
| Starter  | 100/min  | 30/min   |
| Growth   | 500/min  | 100/min  |
| Enterprise | Custom | Custom |

---

## Errors

Standard HTTP status codes. Error body:
```json
{ "detail": "Human-readable error message" }
```

Common codes:
- `400` Bad Request
- `401` Unauthorized (invalid token/key)
- `403` Forbidden (insufficient role/plan)
- `404` Not Found
- `413` Audio too large (>25MB)
- `422` Validation Error
- `429` Rate limit exceeded
- `500` Internal Server Error

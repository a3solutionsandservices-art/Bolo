"""
missed_call_storage.py
======================
Isolated storage layer for missed-call structured results.

Supports:
  1. JSON-lines file  — always written (no extra deps)
  2. Google Sheets    — written only when GOOGLE_SHEETS_ID +
                        GOOGLE_SERVICE_ACCOUNT_JSON are configured
"""

import asyncio
import json
import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

_SHEETS_HEADERS = [
    "log_id", "caller_number", "called_number", "provider",
    "intent", "intent_confidence",
    "caller_name", "requested_service", "requested_time",
    "language", "status",
    "received_at", "completed_at",
    "transcript_turns",
]


@dataclass
class MissedCallResult:
    log_id: str
    caller_number: str
    called_number: str
    provider: str
    intent: str
    intent_confidence: float
    caller_name: Optional[str]
    requested_service: Optional[str]
    requested_time: Optional[str]
    language: str
    status: str
    received_at: str
    completed_at: Optional[str]
    transcript_turns: int
    raw_entities: dict = field(default_factory=dict)

    def to_row(self) -> list:
        return [
            self.log_id,
            self.caller_number,
            self.called_number,
            self.provider,
            self.intent,
            round(self.intent_confidence * 100, 1),
            self.caller_name or "",
            self.requested_service or "",
            self.requested_time or "",
            self.language,
            self.status,
            self.received_at,
            self.completed_at or "",
            self.transcript_turns,
        ]


# ── JSON-lines file store ─────────────────────────────────────────────────────

def _results_path() -> Path:
    p = Path(settings.MISSED_CALL_RESULTS_DIR)
    p.mkdir(parents=True, exist_ok=True)
    return p / "results.jsonl"


def _write_jsonl(result: MissedCallResult) -> None:
    path = _results_path()
    record = asdict(result)
    record["_written_at"] = datetime.now(timezone.utc).isoformat()
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    logger.debug("JSONL written | path=%s | log_id=%s", path, result.log_id)


async def save_to_jsonl(result: MissedCallResult) -> None:
    try:
        await asyncio.to_thread(_write_jsonl, result)
        logger.info("Stored result to JSONL | log_id=%s | intent=%s", result.log_id, result.intent)
    except Exception as exc:
        logger.error("JSONL write failed for log_id=%s: %s", result.log_id, exc)


# ── Google Sheets store ───────────────────────────────────────────────────────

def _is_sheets_configured() -> bool:
    return bool(settings.GOOGLE_SHEETS_ID and settings.GOOGLE_SERVICE_ACCOUNT_JSON)


def _append_to_sheet(result: MissedCallResult) -> None:
    import gspread
    from google.oauth2.service_account import Credentials

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]

    creds_data = json.loads(settings.GOOGLE_SERVICE_ACCOUNT_JSON)
    creds = Credentials.from_service_account_info(creds_data, scopes=scopes)
    gc = gspread.authorize(creds)
    sh = gc.open_by_key(settings.GOOGLE_SHEETS_ID)

    try:
        ws = sh.worksheet("MissedCalls")
    except gspread.WorksheetNotFound:
        ws = sh.add_worksheet(title="MissedCalls", rows=1000, cols=len(_SHEETS_HEADERS))
        ws.append_row(_SHEETS_HEADERS)

    ws.append_row(result.to_row(), value_input_option="USER_ENTERED")
    logger.debug("Google Sheets row appended | sheet=%s | log_id=%s", settings.GOOGLE_SHEETS_ID, result.log_id)


async def save_to_google_sheets(result: MissedCallResult) -> bool:
    if not _is_sheets_configured():
        return False
    try:
        await asyncio.to_thread(_append_to_sheet, result)
        logger.info("Stored result to Google Sheets | log_id=%s", result.log_id)
        return True
    except ImportError:
        logger.warning("gspread not installed — skipping Google Sheets export")
        return False
    except Exception as exc:
        logger.error("Google Sheets write failed for log_id=%s: %s", result.log_id, exc)
        return False


# ── Combined persist ──────────────────────────────────────────────────────────

async def persist_result(result: MissedCallResult) -> dict[str, bool]:
    jsonl_ok = True
    sheets_ok = False

    await save_to_jsonl(result)

    if _is_sheets_configured():
        sheets_ok = await save_to_google_sheets(result)

    return {"jsonl": jsonl_ok, "google_sheets": sheets_ok}


# ── Read helpers (for the /results endpoint) ──────────────────────────────────

def read_jsonl_results(limit: int = 100, offset: int = 0) -> list[dict]:
    path = _results_path()
    if not path.exists():
        return []
    lines = path.read_text(encoding="utf-8").strip().splitlines()
    lines = list(reversed(lines))
    page = lines[offset: offset + limit]
    results = []
    for line in page:
        try:
            results.append(json.loads(line))
        except json.JSONDecodeError:
            pass
    return results

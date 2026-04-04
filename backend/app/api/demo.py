import base64
import logging

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.core.limiter import limiter
from app.core.tts import get_tts

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/demo", tags=["demo"])


class SpeakRequest(BaseModel):
    text: str
    language: str = "hi-IN"


class SpeakResponse(BaseModel):
    audio_base64: str
    audio_format: str
    language: str


@router.post("/speak", response_model=SpeakResponse)
@limiter.limit("15/minute")
async def demo_speak(request: Request, body: SpeakRequest):
    lang_code = body.language.split("-")[0]
    tts = get_tts(lang_code)
    result = await tts.synthesize(body.text, lang_code)
    return SpeakResponse(
        audio_base64=base64.b64encode(result.audio_bytes).decode(),
        audio_format=result.audio_format,
        language=body.language,
    )

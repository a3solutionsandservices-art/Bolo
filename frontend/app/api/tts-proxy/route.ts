import { NextRequest, NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";

const LANG_VOICE_MAP: Record<string, string> = {
  hi: "pFZP5JQG7iQjIQuC4Bku",
  ta: "XB0fDUnXU5powFXDhCwa",
  te: "XB0fDUnXU5powFXDhCwa",
  bn: "pFZP5JQG7iQjIQuC4Bku",
  kn: "XB0fDUnXU5powFXDhCwa",
  mr: "pFZP5JQG7iQjIQuC4Bku",
  en: "21m00Tcm4TlvDq8ikWAM",
};

async function elevenLabsTTS(text: string, lang: string): Promise<ArrayBuffer> {
  const voiceId = LANG_VOICE_MAP[lang] || LANG_VOICE_MAP.hi;
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
      signal: AbortSignal.timeout(12000),
    }
  );
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
  return res.arrayBuffer();
}

async function googleTTS(text: string, lang: string): Promise<ArrayBuffer> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.substring(0, 200))}&tl=${lang}&client=gtx&ttsspeed=0.9`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Bolo/1.0)",
      "Referer": "https://translate.google.com/",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Google TTS ${res.status}`);
  return res.arrayBuffer();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text") || "";
  const lang = searchParams.get("lang") || "hi";

  try {
    let audio: ArrayBuffer;
    let contentType = "audio/mpeg";

    if (ELEVENLABS_API_KEY) {
      audio = await elevenLabsTTS(text, lang);
    } else {
      audio = await googleTTS(text, lang);
    }

    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "TTS unavailable" }, { status: 503 });
  }
}

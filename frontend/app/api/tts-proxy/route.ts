import { NextRequest, NextResponse } from "next/server";

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || "";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";

const SARVAM_LANG_MAP: Record<string, string> = {
  hi: "hi-IN", ta: "ta-IN", te: "te-IN", bn: "bn-IN",
  kn: "kn-IN", mr: "mr-IN", gu: "gu-IN", ml: "ml-IN",
  pa: "pa-IN", or: "or-IN", en: "en-IN",
};

const SARVAM_SPEAKER_MAP: Record<string, string> = {
  hi: "meera", ta: "anushka", te: "anushka", bn: "meera",
  kn: "anushka", mr: "meera", gu: "meera", ml: "anushka",
  pa: "meera", or: "meera", en: "meera",
};

const ELEVENLABS_VOICE_MAP: Record<string, string> = {
  hi: "pFZP5JQG7iQjIQuC4Bku", ta: "XB0fDUnXU5powFXDhCwa",
  te: "XB0fDUnXU5powFXDhCwa", bn: "pFZP5JQG7iQjIQuC4Bku",
  kn: "XB0fDUnXU5powFXDhCwa", mr: "pFZP5JQG7iQjIQuC4Bku",
  en: "21m00Tcm4TlvDq8ikWAM",
};

async function sarvamTTS(text: string, lang: string): Promise<{ bytes: ArrayBuffer; type: string }> {
  const langCode = SARVAM_LANG_MAP[lang] || "hi-IN";
  const speaker = SARVAM_SPEAKER_MAP[lang] || "meera";

  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: [text.substring(0, 500)],
      target_language_code: langCode,
      speaker,
      model: "bulbul:v1",
      pitch: 0,
      pace: 1.1,
      loudness: 1.5,
      speech_sample_rate: 22050,
      enable_preprocessing: true,
    }),
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) throw new Error(`Sarvam ${res.status}`);
  const data = await res.json();
  const audioB64: string = data.audios[0];
  const binary = Buffer.from(audioB64, "base64");
  return { bytes: binary.buffer, type: "audio/wav" };
}

async function elevenLabsTTS(text: string, lang: string): Promise<{ bytes: ArrayBuffer; type: string }> {
  const voiceId = ELEVENLABS_VOICE_MAP[lang] || ELEVENLABS_VOICE_MAP.hi;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
  return { bytes: await res.arrayBuffer(), type: "audio/mpeg" };
}

async function googleTTS(text: string, lang: string): Promise<{ bytes: ArrayBuffer; type: string }> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.substring(0, 200))}&tl=${lang}&client=gtx&ttsspeed=0.9`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://translate.google.com/" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Google TTS ${res.status}`);
  return { bytes: await res.arrayBuffer(), type: "audio/mpeg" };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text") || "";
  const lang = searchParams.get("lang") || "hi";

  const attempts: (() => Promise<{ bytes: ArrayBuffer; type: string }>)[] = [];
  if (SARVAM_API_KEY) attempts.push(() => sarvamTTS(text, lang));
  if (ELEVENLABS_API_KEY) attempts.push(() => elevenLabsTTS(text, lang));
  attempts.push(() => googleTTS(text, lang));

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      return new NextResponse(result.bytes, {
        status: 200,
        headers: {
          "Content-Type": result.type,
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: "TTS unavailable" }, { status: 503 });
}

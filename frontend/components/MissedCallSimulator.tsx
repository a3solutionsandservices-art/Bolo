"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, PhoneMissed, PhoneIncoming, CheckCircle2, Calendar, HelpCircle, X } from "lucide-react";

// ─── module-level audio state ────────────────────────────────────────────────
let _cur: HTMLAudioElement | null = null;
function stopAll() {
  if (_cur) { _cur.pause(); _cur.currentTime = 0; _cur = null; }
}

// Fetch audio → store as blob-backed Audio element (zero latency at play time)
async function loadBlob(text: string, lang: string): Promise<HTMLAudioElement | null> {
  try {
    const r = await fetch(
      `/api/tts-proxy?text=${encodeURIComponent(text.slice(0, 200))}&lang=${lang}&v=3`
    );
    if (!r.ok) return null;
    const blob = await r.blob();
    return new Audio(URL.createObjectURL(blob));
  } catch { return null; }
}

// Play a blob-backed audio element; resolve when it finishes (or times out)
function playAndWait(audio: HTMLAudioElement | null, fallbackMs = 4000): Promise<void> {
  stopAll();
  if (!audio) return new Promise(r => setTimeout(r, fallbackMs));
  audio.currentTime = 0;
  _cur = audio;
  return new Promise(resolve => {
    const done = () => { _cur = null; resolve(); };
    const timer = setTimeout(done, 15000); // hard safety cap
    audio.addEventListener("ended", () => { clearTimeout(timer); done(); }, { once: true });
    audio.addEventListener("error", () => { clearTimeout(timer); done(); }, { once: true });
    audio.play().catch(() => { clearTimeout(timer); done(); });
  });
}

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

// ─── script ──────────────────────────────────────────────────────────────────
const LANG = "te";
const NUMBER = "+91 98XXX XXXXX";

const GREETING =
  "నమస్కారం! నేను పల్లవిని, City Clinic నుండి. మీ call miss అయింది — ఎలా సహాయపడగలను?";

const BOOKING_LINES: { role: "ai" | "pt"; text: string }[] = [
  { role: "pt", text: "Dr. Mehta తో రేపు appointment కావాలి." },
  { role: "ai", text: "అర్థమైంది! రేపు 10 AM లేదా 3 PM slot ఉంది. ఏది convenient గా ఉంటుంది?" },
  { role: "pt", text: "10 AM బాగుంటుంది." },
  { role: "ai", text: "Confirmed! రేపు 10 AM, Dr. Mehta. Confirmation SMS వస్తుంది. మా clinic ని choose చేసినందుకు చాలా ధన్యవాదాలు!" },
];

const INQUIRY_LINES: { role: "ai" | "pt"; text: string }[] = [
  { role: "pt", text: "OPD charges ఎంత అవుతాయి?" },
  { role: "ai", text: "General OPD 300 rupees, specialist కి 500 rupees అవుతుంది. Appointment కూడా book చేయాలా?" },
  { role: "pt", text: "వద్దు, చాలు. ధన్యవాదాలు." },
  { role: "ai", text: "సహాయం చేయడం సంతోషంగా ఉంది! మా clinic ని choose చేసినందుకు చాలా ధన్యవాదాలు!" },
];

// All AI texts that need audio
const AI_TEXTS = [
  GREETING,
  ...BOOKING_LINES.filter(l => l.role === "ai").map(l => l.text),
  ...INQUIRY_LINES.filter(l => l.role === "ai").map(l => l.text),
];

// ─── sub-components ──────────────────────────────────────────────────────────
function Ring() {
  return (
    <div className="relative flex items-center justify-center">
      <span className="absolute h-20 w-20 rounded-full bg-emerald-500/20 animate-ping" />
      <span className="absolute h-14 w-14 rounded-full bg-emerald-500/30 animate-ping" style={{ animationDelay: "200ms" }} />
      <div className="relative z-10 w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
        <PhoneIncoming className="w-7 h-7 text-white" />
      </div>
    </div>
  );
}

function Orb({ cls }: { cls: string }) {
  return (
    <div className="relative flex items-center justify-center">
      <span className={`absolute h-20 w-20 rounded-full ${cls} opacity-20 animate-ping`} />
      <span className={`absolute h-14 w-14 rounded-full ${cls} opacity-30 animate-ping`} style={{ animationDelay: "150ms" }} />
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
type Phase = "idle" | "incoming" | "missed" | "countdown" | "calling" | "conversation" | "booked" | "inquiry_done";
type Line  = { role: "ai" | "pt"; text: string };

export default function MissedCallSimulator({ onClose }: { onClose?: () => void }) {
  const [phase,      setPhase]      = useState<Phase>("idle");
  const [count,      setCount]      = useState(3);
  const [lines,      setLines]      = useState<Line[]>([]);
  const [showChoice, setShowChoice] = useState(false);
  const chatRef  = useRef<HTMLDivElement>(null);
  const cache    = useRef<Map<string, HTMLAudioElement>>(new Map());
  const cancelled = useRef(false);

  // ── helpers ────────────────────────────────────────────────────────────────
  const reset = () => {
    cancelled.current = true;
    stopAll();
    setPhase("idle"); setCount(3); setLines([]); setShowChoice(false);
  };

  // Kick off parallel pre-loading of all AI audio immediately
  const preloadAll = () => {
    cache.current.clear();
    AI_TEXTS.forEach(text =>
      loadBlob(text, LANG).then(a => { if (a) cache.current.set(text, a); })
    );
  };

  const getAudio = (text: string) => cache.current.get(text) ?? null;

  // ── effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") { reset(); onClose?.(); } };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [lines]);

  // incoming → missed → countdown
  useEffect(() => {
    if (phase === "incoming") { const t = setTimeout(() => setPhase("missed"),     1500); return () => clearTimeout(t); }
    if (phase === "missed")   { const t = setTimeout(() => setPhase("countdown"),   600); return () => clearTimeout(t); }
  }, [phase]);

  // countdown tick → calling
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count === 0) { setPhase("calling"); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, count]);

  // calling → conversation
  useEffect(() => {
    if (phase !== "calling") return;
    const t = setTimeout(() => setPhase("conversation"), 1500);
    return () => clearTimeout(t);
  }, [phase]);

  // conversation: play greeting then show choice
  useEffect(() => {
    if (phase !== "conversation") return;
    cancelled.current = false;

    (async () => {
      setLines([{ role: "ai", text: GREETING }]);
      await playAndWait(getAudio(GREETING));
      if (cancelled.current) return;
      setShowChoice(true);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── choice handler ─────────────────────────────────────────────────────────
  const choose = async (intent: "booking" | "inquiry") => {
    if (cancelled.current) return;
    setShowChoice(false);
    const script = intent === "booking" ? BOOKING_LINES : INQUIRY_LINES;

    for (const line of script) {
      if (cancelled.current) return;
      setLines(prev => [...prev, line]);

      if (line.role === "ai") {
        await playAndWait(getAudio(line.text));
      } else {
        await sleep(900);
      }
    }

    if (!cancelled.current) {
      setPhase(intent === "booking" ? "booked" : "inquiry_done");
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) { reset(); onClose?.(); } }}
    >
      <div className="relative w-full max-w-sm bg-[#0d1117] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

        {/* header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-white/35">Pallavi · City Clinic · Live Demo</span>
          </div>
          <button onClick={() => { reset(); onClose?.(); }} className="text-white/25 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* body */}
        <div className="px-6 py-8 min-h-[420px] flex flex-col items-center justify-center">

          {/* IDLE */}
          {phase === "idle" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
                <Phone className="w-9 h-9 text-brand-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-lg mb-1">Missed Call → Booking</p>
                <p className="text-white/40 text-sm">Simulate a real AI callback in under 30 seconds</p>
              </div>
              <button
                onClick={() => {
                  reset();
                  cancelled.current = false;
                  preloadAll();         // start loading audio immediately
                  setPhase("incoming");
                }}
                className="px-8 py-3.5 rounded-xl font-semibold text-white text-sm"
                style={{ background: "linear-gradient(135deg,#FF6B00,#f97316)", boxShadow: "0 4px 20px rgba(255,107,0,0.35)" }}
              >
                ▶ Start
              </button>
            </div>
          )}

          {/* INCOMING */}
          {phase === "incoming" && (
            <div className="text-center space-y-5">
              <Ring />
              <div>
                <p className="text-white/40 text-xs font-mono mb-1">INCOMING CALL</p>
                <p className="text-white font-semibold text-xl">{NUMBER}</p>
                <p className="text-white/35 text-sm mt-1">City Clinic Helpline</p>
              </div>
              <p className="text-white/25 text-xs animate-pulse">Ringing…</p>
            </div>
          )}

          {/* MISSED */}
          {phase === "missed" && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <PhoneMissed className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-semibold text-lg">Call Missed</p>
                <p className="text-white/35 text-sm mt-1">{NUMBER}</p>
              </div>
              <p className="text-white/30 text-xs">Bolo detected the missed call…</p>
            </div>
          )}

          {/* COUNTDOWN */}
          {phase === "countdown" && (
            <div className="text-center space-y-5">
              <div className="relative flex items-center justify-center">
                <Orb cls="bg-brand-500" />
                <div className="relative z-10 w-16 h-16 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center">
                  <span className="text-3xl font-bold text-brand-300">{count}</span>
                </div>
              </div>
              <div>
                <p className="text-brand-300 font-semibold text-lg">AI calling back in {count}s</p>
                <p className="text-white/35 text-sm mt-1">Preparing personalised callback…</p>
              </div>
            </div>
          )}

          {/* CALLING */}
          {phase === "calling" && (
            <div className="text-center space-y-5">
              <div className="relative flex items-center justify-center">
                <Orb cls="bg-violet-500" />
                <div className="relative z-10 w-16 h-16 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
                  <Phone className="w-7 h-7 text-violet-300 animate-bounce" />
                </div>
              </div>
              <div>
                <p className="text-violet-300 font-semibold text-lg">Calling back…</p>
                <p className="text-white/35 text-sm mt-1">{NUMBER}</p>
              </div>
            </div>
          )}

          {/* CONVERSATION */}
          {phase === "conversation" && (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-400 font-mono">Connected · Pallavi speaking Telugu</span>
              </div>

              <div ref={chatRef} className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                {lines.map((line, i) => (
                  <div key={i} className={`flex gap-2 ${line.role === "ai" ? "" : "flex-row-reverse"}`}>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0
                      ${line.role === "ai"
                        ? "bg-brand-600/30 text-brand-300 border border-brand-500/30"
                        : "bg-white/[0.08] text-white/40"}`}>
                      {line.role === "ai" ? "Pa" : "Pt"}
                    </div>
                    <div className={`max-w-[82%] px-3 py-2 rounded-xl text-[11px] leading-relaxed
                      ${line.role === "ai"
                        ? "bg-brand-600/15 border border-brand-500/20 text-white/80"
                        : "bg-white/[0.05] border border-white/[0.07] text-white/55"}`}>
                      {line.text}
                    </div>
                  </div>
                ))}
              </div>

              {showChoice && (
                <div className="pt-2 space-y-2">
                  <p className="text-[11px] text-white/30 text-center">Patient responds:</p>
                  <button
                    onClick={() => choose("booking")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-600/15 border border-brand-500/25 hover:bg-brand-600/25 text-white/80 text-sm transition-all"
                  >
                    <Calendar className="w-4 h-4 text-brand-400 shrink-0" />
                    Book an Appointment
                  </button>
                  <button
                    onClick={() => choose("inquiry")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] text-white/55 text-sm transition-all"
                  >
                    <HelpCircle className="w-4 h-4 text-white/40 shrink-0" />
                    General Inquiry
                  </button>
                </div>
              )}
            </div>
          )}

          {/* BOOKED */}
          {phase === "booked" && (
            <div className="text-center space-y-5">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 font-bold text-2xl">Appointment Booked ✔</p>
                <p className="text-white/45 text-sm mt-2">Dr. Mehta · Tomorrow 10 AM</p>
                <p className="text-white/25 text-xs mt-1">SMS confirmation sent · Zero human involvement</p>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300/60 font-mono">
                Missed call → booked in under 30 seconds
              </div>
              <button onClick={reset} className="text-xs text-white/25 hover:text-white/50 transition-colors underline underline-offset-2">
                Run again
              </button>
            </div>
          )}

          {/* INQUIRY DONE */}
          {phase === "inquiry_done" && (
            <div className="text-center space-y-5">
              <div className="w-20 h-20 mx-auto rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-brand-400" />
              </div>
              <div>
                <p className="text-brand-300 font-bold text-2xl">Query Resolved ✔</p>
                <p className="text-white/45 text-sm mt-2">Patient received full information</p>
                <p className="text-white/25 text-xs mt-1">No hold time · No missed opportunity</p>
              </div>
              <button onClick={reset} className="text-xs text-white/25 hover:text-white/50 transition-colors underline underline-offset-2">
                Run again
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

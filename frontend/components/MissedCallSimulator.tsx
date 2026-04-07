"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, PhoneMissed, PhoneIncoming, CheckCircle2, Calendar, HelpCircle, X } from "lucide-react";

let _currentAudio: HTMLAudioElement | null = null;

function stopCurrent() {
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio.currentTime = 0;
    _currentAudio = null;
  }
}

function playBlob(audio: HTMLAudioElement | null) {
  stopCurrent();
  if (!audio) return;
  _currentAudio = audio;
  audio.play().catch(() => {});
}

async function fetchAudio(text: string, lang: string): Promise<HTMLAudioElement | null> {
  try {
    const url = `/api/tts-proxy?text=${encodeURIComponent(text.substring(0, 200))}&lang=${lang}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const audio = new Audio(blobUrl);
    audio.onended = () => {
      URL.revokeObjectURL(blobUrl);
      _currentAudio = null;
    };
    return audio;
  } catch {
    return null;
  }
}

type SimPhase =
  | "idle"
  | "incoming"
  | "missed"
  | "countdown"
  | "calling"
  | "conversation"
  | "booked"
  | "inquiry_done";

const MASKED_NUMBER = "+91 98XXX XXXXX";

const GREETING_TE = "నమస్కారం! నేను పల్లవిని, City Clinic నుండి మాట్లాడుతున్నాను. మీ call miss అయింది. మేము మీకు ఎలా సహాయపడగలము?";

const BOOKING_LINES = [
  { role: "user" as const, text: "నాకు Dr. Mehta తో appointment కావాలి." },
  { role: "ai" as const,   text: "అర్థమైంది! Dr. Mehta రేపు 10 AM మరియు 3 PM కి slots available గా ఉన్నాయి. మీకు ఏది convenient గా ఉంటుంది?" },
  { role: "user" as const, text: "10 AM అయితే బాగుంటుంది." },
  { role: "ai" as const,   text: "చాలా బాగుంది! రేపు 10 AM కి Dr. Mehta తో appointment confirm అయింది. మీకు confirmation SMS వస్తుంది." },
];

const INQUIRY_LINES = [
  { role: "user" as const, text: "OPD charges ఎంత అవుతాయి?" },
  { role: "ai" as const,   text: "General OPD ₹300 మరియు specialist కి ₹500 అవుతుంది. మీకు appointment కూడా book చేయాలా?" },
  { role: "user" as const, text: "వద్దు, అంతే. ధన్యవాదాలు." },
  { role: "ai" as const,   text: "సహాయం చేయడం సంతోషంగా ఉంది! ఎప్పుడైనా call చేయండి. మీరు ఆరోగ్యంగా ఉండండి!" },
];

function Ring() {
  return (
    <div className="relative flex items-center justify-center">
      <span className="absolute inline-flex h-20 w-20 rounded-full bg-emerald-500/20 animate-ping" />
      <span className="absolute inline-flex h-14 w-14 rounded-full bg-emerald-500/30 animate-ping" style={{ animationDelay: "200ms" }} />
      <div className="relative z-10 w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
        <PhoneIncoming className="w-7 h-7 text-white" />
      </div>
    </div>
  );
}

function PulseOrb({ color }: { color: string }) {
  return (
    <div className="relative flex items-center justify-center">
      <span className={`absolute inline-flex h-20 w-20 rounded-full ${color} opacity-30 animate-ping`} />
      <span className={`absolute inline-flex h-14 w-14 rounded-full ${color} opacity-40 animate-ping`} style={{ animationDelay: "150ms" }} />
    </div>
  );
}

export default function MissedCallSimulator({ onClose }: { onClose?: () => void }) {
  const [phase, setPhase] = useState<SimPhase>("idle");
  const [count, setCount] = useState(3);
  const [chatLines, setChatLines] = useState<{ role: "ai" | "user"; text: string }[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  const greetingAudio = useRef<HTMLAudioElement | null>(null);
  const bookingAudios = useRef<(HTMLAudioElement | null)[]>([]);
  const inquiryAudios = useRef<(HTMLAudioElement | null)[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const reset = () => {
    clearTimers();
    stopCurrent();
    setPhase("idle");
    setCount(3);
    setChatLines([]);
    greetingAudio.current = null;
    bookingAudios.current = [];
    inquiryAudios.current = [];
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { reset(); onClose?.(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatLines]);

  const start = () => {
    reset();
    setPhase("incoming");
    setCount(3);
  };

  useEffect(() => {
    if (phase === "incoming") {
      const t = setTimeout(() => setPhase("missed"), 2200);
      return () => clearTimeout(t);
    }
    if (phase === "missed") {
      const t = setTimeout(() => setPhase("countdown"), 800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "countdown") return;
    fetchAudio(GREETING_TE, "te").then(a => { greetingAudio.current = a; });
    const aiTexts = [
      BOOKING_LINES[1].text, BOOKING_LINES[3].text,
      INQUIRY_LINES[1].text, INQUIRY_LINES[3].text,
    ];
    const langCode = "te";
    fetchAudio(aiTexts[0], langCode).then(a => { bookingAudios.current[1] = a; });
    fetchAudio(aiTexts[1], langCode).then(a => { bookingAudios.current[3] = a; });
    fetchAudio(aiTexts[2], langCode).then(a => { inquiryAudios.current[1] = a; });
    fetchAudio(aiTexts[3], langCode).then(a => { inquiryAudios.current[3] = a; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (count === 0) { setPhase("calling"); return; }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== "calling") return;
    const t = setTimeout(() => {
      setPhase("conversation");
      setChatLines([{ role: "ai", text: GREETING_TE }]);
      playBlob(greetingAudio.current);
    }, 2000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const choose = (intent: "booking" | "inquiry") => {
    const lines = intent === "booking" ? BOOKING_LINES : INQUIRY_LINES;
    const preloaded = intent === "booking" ? bookingAudios.current : inquiryAudios.current;

    let delay = 0;
    lines.forEach((line, i) => {
      delay += i === 0 ? 0 : 1000;
      const d = delay;
      const t = setTimeout(() => {
        setChatLines((prev) => [...prev, line]);
        if (line.role === "ai") {
          playBlob(preloaded[i] ?? null);
        }
        if (i === lines.length - 1) {
          const end = setTimeout(
            () => setPhase(intent === "booking" ? "booked" : "inquiry_done"),
            1400
          );
          timers.current.push(end);
        }
      }, d);
      timers.current.push(t);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) { reset(); onClose?.(); } }}
    >
      <div className="relative w-full max-w-md bg-[#0d1117] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-white/40">Pallavi · City Clinic · Live Simulation</span>
          </div>
          <button onClick={() => { reset(); onClose?.(); }} className="text-white/30 hover:text-white/70 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-8 min-h-[420px] flex flex-col items-center justify-center">

          {phase === "idle" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
                <Phone className="w-9 h-9 text-brand-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-lg mb-1">Ready to simulate</p>
                <p className="text-white/40 text-sm">Watch Bolo recover a missed clinic call in real-time</p>
              </div>
              <button
                onClick={start}
                className="px-8 py-3.5 rounded-xl font-semibold text-white text-sm transition-all"
                style={{ background: "linear-gradient(135deg,#FF6B00,#f97316)", boxShadow: "0 4px 20px rgba(255,107,0,0.35)" }}
              >
                ▶ Start Simulation
              </button>
            </div>
          )}

          {phase === "incoming" && (
            <div className="text-center space-y-5">
              <Ring />
              <div>
                <p className="text-white/50 text-xs font-mono mb-1">INCOMING CALL</p>
                <p className="text-white font-semibold text-xl">{MASKED_NUMBER}</p>
                <p className="text-white/40 text-sm mt-1">City Clinic Helpline</p>
              </div>
              <div className="flex items-center gap-2 justify-center text-white/30 text-xs animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Ringing…
              </div>
            </div>
          )}

          {phase === "missed" && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <PhoneMissed className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-semibold text-lg">Call Missed</p>
                <p className="text-white/40 text-sm mt-1">{MASKED_NUMBER}</p>
              </div>
              <p className="text-white/30 text-xs">Bolo detected a missed call…</p>
            </div>
          )}

          {phase === "countdown" && (
            <div className="text-center space-y-5">
              <div className="relative flex items-center justify-center">
                <PulseOrb color="bg-brand-500" />
                <div className="relative z-10 w-16 h-16 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center">
                  <span className="text-3xl font-bold text-brand-300">{count}</span>
                </div>
              </div>
              <div>
                <p className="text-brand-300 font-semibold text-lg">AI Callback in {count}s</p>
                <p className="text-white/40 text-sm mt-1">Preparing personalised callback…</p>
              </div>
            </div>
          )}

          {phase === "calling" && (
            <div className="text-center space-y-5">
              <div className="relative flex items-center justify-center">
                <PulseOrb color="bg-violet-500" />
                <div className="relative z-10 w-16 h-16 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
                  <Phone className="w-7 h-7 text-violet-300 animate-bounce" />
                </div>
              </div>
              <div>
                <p className="text-violet-300 font-semibold text-lg">AI Callback Calling…</p>
                <p className="text-white/40 text-sm mt-1">Connecting to {MASKED_NUMBER}</p>
              </div>
            </div>
          )}

          {phase === "conversation" && (
            <div className="w-full space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-mono">Call Connected · Pallavi speaking in Telugu</span>
              </div>

              <div ref={chatRef} className="space-y-3 max-h-52 overflow-y-auto pr-1 sidebar-scroll">
                {chatLines.map((line, i) => (
                  <div key={i} className={`flex gap-2 animate-fade-in ${line.role === "ai" ? "flex-row" : "flex-row-reverse"}`}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${line.role === "ai" ? "bg-brand-600/30 text-brand-300 border border-brand-500/30" : "bg-white/10 text-white/50"}`}>
                      {line.role === "ai" ? "Pa" : "P"}
                    </div>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${line.role === "ai" ? "bg-brand-600/15 border border-brand-500/20 text-white/85" : "bg-white/[0.07] border border-white/[0.08] text-white/70"}`}>
                      {line.text}
                    </div>
                  </div>
                ))}
              </div>

              {chatLines.length === 1 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-white/30 text-center mb-3">Patient selects reason for call:</p>
                  <button
                    onClick={() => choose("booking")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-600/15 border border-brand-500/25 hover:bg-brand-600/25 text-white/80 text-sm transition-all"
                  >
                    <Calendar className="w-4 h-4 text-brand-400 shrink-0" />
                    Book Appointment
                  </button>
                  <button
                    onClick={() => choose("inquiry")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white/60 text-sm transition-all"
                  >
                    <HelpCircle className="w-4 h-4 text-white/40 shrink-0" />
                    General Inquiry
                  </button>
                </div>
              )}
            </div>
          )}

          {phase === "booked" && (
            <div className="text-center space-y-5">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 font-bold text-xl">Appointment Booked ✔</p>
                <p className="text-white/50 text-sm mt-2">Dr. Mehta · Tomorrow 10 AM</p>
                <p className="text-white/30 text-xs mt-1">Confirmation SMS sent to patient</p>
              </div>
              <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300/70">
                Total time: ~45 seconds · Zero human involvement
              </div>
              <button onClick={reset} className="text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-2">
                Run again
              </button>
            </div>
          )}

          {phase === "inquiry_done" && (
            <div className="text-center space-y-5">
              <div className="w-20 h-20 mx-auto rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-brand-400" />
              </div>
              <div>
                <p className="text-brand-300 font-bold text-xl">Query Resolved ✔</p>
                <p className="text-white/50 text-sm mt-2">Patient received all information</p>
                <p className="text-white/30 text-xs mt-1">No hold time · No missed opportunity</p>
              </div>
              <button onClick={reset} className="text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-2">
                Run again
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

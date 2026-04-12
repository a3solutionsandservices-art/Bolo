"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, PhoneMissed, PhoneIncoming, CheckCircle2, X } from "lucide-react";

let _currentAudio: HTMLAudioElement | null = null;

function playTTS(text: string, lang = "te") {
  if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
  const audio = new Audio(
    `/api/tts-proxy?text=${encodeURIComponent(text.substring(0, 200))}&lang=${lang}`
  );
  _currentAudio = audio;
  audio.onended = () => { _currentAudio = null; };
  audio.play().catch(() => {});
}

type Phase = "idle" | "incoming" | "missed" | "countdown" | "calling" | "conversation" | "booked";

const NUMBER = "+91 98XXX XXXXX";

type ScriptLine = { role: "ai" | "patient"; text: string; at: number; speak?: boolean };

const SCRIPT: ScriptLine[] = [
  { role: "ai",      text: "నమస్కారం! నేను పల్లవిని, City Clinic నుండి. మీ call miss అయింది — ఎలా సహాయపడగలను?", at: 0,     speak: true  },
  { role: "patient", text: "Dr. Mehta తో రేపు appointment కావాలి.",                                                 at: 5000,  speak: false },
  { role: "ai",      text: "అర్థమైంది! రేపు 10 AM లేదా 3 PM slot ఉంది. ఏది convenient గా ఉంటుంది?",               at: 6200,  speak: true  },
  { role: "patient", text: "10 AM బాగుంటుంది.",                                                                    at: 10000, speak: false },
  { role: "ai",      text: "Confirmed! రేపు 10 AM — Dr. Mehta. Confirmation SMS వస్తుంది. చాలా ధన్యవాదాలు! ✅",    at: 11200, speak: true  },
];
const BOOKED_AT = 15500;

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

function Orb({ color }: { color: string }) {
  return (
    <div className="relative flex items-center justify-center">
      <span className={`absolute h-20 w-20 rounded-full ${color} opacity-20 animate-ping`} />
      <span className={`absolute h-14 w-14 rounded-full ${color} opacity-30 animate-ping`} style={{ animationDelay: "150ms" }} />
    </div>
  );
}

export default function MissedCallSimulator({ onClose }: { onClose?: () => void }) {
  const [phase, setPhase]       = useState<Phase>("idle");
  const [count, setCount]       = useState(3);
  const [lines, setLines]       = useState<ScriptLine[]>([]);
  const chatRef                 = useRef<HTMLDivElement>(null);
  const timers                  = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const reset = () => {
    clear();
    if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
    setPhase("idle"); setCount(3); setLines([]);
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") { reset(); onClose?.(); } };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [lines]);

  useEffect(() => {
    if (phase === "incoming") {
      const t = setTimeout(() => setPhase("missed"), 1500); return () => clearTimeout(t);
    }
    if (phase === "missed") {
      const t = setTimeout(() => setPhase("countdown"), 600); return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (count === 0) { setPhase("calling"); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== "calling") return;
    const t = setTimeout(() => setPhase("conversation"), 1500);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "conversation") return;

    SCRIPT.forEach(line => {
      const t = setTimeout(() => {
        setLines(prev => [...prev, line]);
        if (line.speak) playTTS(line.text, "te");
      }, line.at);
      timers.current.push(t);
    });

    const end = setTimeout(() => setPhase("booked"), BOOKED_AT);
    timers.current.push(end);

    return clear;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

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
        <div className="px-6 py-8 min-h-[400px] flex flex-col items-center justify-center">

          {phase === "idle" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
                <Phone className="w-9 h-9 text-brand-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-lg mb-1">Missed Call → Booking</p>
                <p className="text-white/40 text-sm">Watch the full AI callback in ~20 seconds</p>
              </div>
              <button
                onClick={() => { reset(); setPhase("incoming"); }}
                className="px-8 py-3.5 rounded-xl font-semibold text-white text-sm"
                style={{ background: "linear-gradient(135deg,#FF6B00,#f97316)", boxShadow: "0 4px 20px rgba(255,107,0,0.35)" }}
              >
                ▶ Start
              </button>
            </div>
          )}

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

          {phase === "missed" && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <PhoneMissed className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-semibold text-lg">Call Missed</p>
                <p className="text-white/35 text-sm mt-1">{NUMBER}</p>
              </div>
            </div>
          )}

          {phase === "countdown" && (
            <div className="text-center space-y-5">
              <div className="relative flex items-center justify-center">
                <Orb color="bg-brand-500" />
                <div className="relative z-10 w-16 h-16 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center">
                  <span className="text-3xl font-bold text-brand-300">{count}</span>
                </div>
              </div>
              <div>
                <p className="text-brand-300 font-semibold text-lg">AI calling back in {count}s</p>
                <p className="text-white/35 text-sm mt-1">Bolo detected the missed call</p>
              </div>
            </div>
          )}

          {phase === "calling" && (
            <div className="text-center space-y-5">
              <div className="relative flex items-center justify-center">
                <Orb color="bg-violet-500" />
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

          {phase === "conversation" && (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-400 font-mono">Connected · Telugu</span>
              </div>
              <div ref={chatRef} className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {lines.map((line, i) => (
                  <div key={i} className={`flex gap-2 ${line.role === "ai" ? "" : "flex-row-reverse"}`}>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0 ${line.role === "ai" ? "bg-brand-600/30 text-brand-300 border border-brand-500/30" : "bg-white/8 text-white/40"}`}>
                      {line.role === "ai" ? "Pa" : "Pt"}
                    </div>
                    <div className={`max-w-[82%] px-3 py-2 rounded-xl text-[11px] leading-relaxed ${line.role === "ai" ? "bg-brand-600/15 border border-brand-500/20 text-white/80" : "bg-white/[0.06] border border-white/[0.07] text-white/55"}`}>
                      {line.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {phase === "booked" && (
            <div className="text-center space-y-5">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 font-bold text-2xl">Appointment Booked ✔</p>
                <p className="text-white/45 text-sm mt-2">Dr. Mehta · Tomorrow 10 AM</p>
                <p className="text-white/25 text-xs mt-1">SMS sent · Zero human involvement</p>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300/60 font-mono">
                Total time: ~18 seconds
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

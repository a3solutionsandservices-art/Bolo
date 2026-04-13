"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, PhoneMissed, PhoneIncoming, CheckCircle2, Calendar, HelpCircle, X } from "lucide-react";

// ─── module-level audio state ────────────────────────────────────────────────
let _cur: HTMLAudioElement | null = null;
function stopAll() {
  if (_cur) { _cur.pause(); _cur.currentTime = 0; _cur = null; }
}

// ─── Web Audio sound effects ──────────────────────────────────────────────────
let _sfxCtx: AudioContext | null = null;
let _sfxNodes: AudioNode[] = [];

function getAudioCtx(): AudioContext | null {
  try {
    if (!_sfxCtx || _sfxCtx.state === "closed") {
      _sfxCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return _sfxCtx;
  } catch { return null; }
}

function stopSfx() {
  _sfxNodes.forEach(n => { try { (n as OscillatorNode).stop?.(); } catch { /* ignore */ } });
  _sfxNodes = [];
}

// Indian phone ring: 400 Hz + 450 Hz, 0.4 s on / 0.2 s off
function playIncomingRing(durationMs: number) {
  stopSfx();
  const ctx = getAudioCtx();
  if (!ctx) return;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  const total = durationMs / 1000;
  [400, 450].forEach(freq => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + total);
    _sfxNodes.push(osc);
  });
  gain.gain.value = 0;
  const cycles = Math.floor(total / 0.6);
  for (let i = 0; i < cycles; i++) {
    gain.gain.setValueAtTime(0.25, now + i * 0.6);
    gain.gain.setValueAtTime(0,    now + i * 0.6 + 0.4);
  }
  _sfxNodes.push(gain);
}

// Disconnect: short descending beep
function playDisconnectSfx() {
  stopSfx();
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(480, now);
  osc.frequency.linearRampToValueAtTime(280, now + 0.35);
  gain.gain.setValueAtTime(0.35, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.35);
  osc.start(now); osc.stop(now + 0.35);
  _sfxNodes.push(osc, gain);
}

// Outbound ring: single 425 Hz pulse (UK/Indian outbound tone)
function playOutboundRing(durationMs: number) {
  stopSfx();
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.value = 425;
  const now = ctx.currentTime;
  const total = durationMs / 1000;
  gain.gain.value = 0;
  const cycles = Math.floor(total / 0.8);
  for (let i = 0; i < cycles; i++) {
    gain.gain.setValueAtTime(0.2, now + i * 0.8);
    gain.gain.setValueAtTime(0,   now + i * 0.8 + 0.4);
  }
  osc.start(now); osc.stop(now + total);
  _sfxNodes.push(osc, gain);
}

// Fetch audio → store as blob-backed Audio element (zero latency at play time)
async function loadBlob(text: string, lang: string): Promise<HTMLAudioElement | null> {
  try {
    const r = await fetch(
      `/api/tts-proxy?text=${encodeURIComponent(text.slice(0, 200))}&lang=${lang}&v=5`
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
  audio.playbackRate = 1.4;
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

// ─── scripts ─────────────────────────────────────────────────────────────────
const NUMBER = "+91 98XXX XXXXX";

type Line = { role: "ai" | "pt"; text: string };
interface LangScript {
  code: string;
  label: string;
  sublabel: string;
  greeting: string;
  booking: Line[];
  inquiry: Line[];
  evening: Line[];
}

const SCRIPTS: Record<"te" | "hi", LangScript> = {
  te: {
    code: "te",
    label: "తెలుగు",
    sublabel: "Telugu",
    greeting: "నమస్కారం! నేను పల్లవిని, City Clinic నుండి. మీ call miss అయింది — ఎలా సహాయపడగలను?",
    booking: [
      { role: "pt", text: "Dr. Mehta తో రేపు appointment కావాలి." },
      { role: "ai", text: "అర్థమైంది! రేపు 10 AM లేదా 3 PM slot ఉంది. ఏది convenient గా ఉంటుంది?" },
      { role: "pt", text: "10 AM బాగుంటుంది." },
      { role: "ai", text: "Confirmed! రేపు 10 AM, Dr. Mehta. Confirmation SMS వస్తుంది. మా clinic ని choose చేసినందుకు చాలా ధన్యవాదాలు!" },
    ],
    inquiry: [
      { role: "pt", text: "OPD charges ఎంత అవుతాయి?" },
      { role: "ai", text: "General OPD 300 rupees, specialist కి 500 rupees అవుతుంది. Appointment కూడా book చేయాలా?" },
      { role: "pt", text: "వద్దు, చాలు. ధన్యవాదాలు." },
      { role: "ai", text: "సహాయం చేయడం సంతోషంగా ఉంది! మా clinic ని choose చేసినందుకు చాలా ధన్యవాదాలు!" },
    ],
    evening: [
      { role: "pt", text: "Dr. Reddy ఈరోజు evening clinic కి వస్తారా?" },
      { role: "ai", text: "అవును! Dr. Reddy ఈరోజు సాయంత్రం 6:30 PM కి clinic లో ఉంటారు. మీకు ముందే token reserve చేయాలా, wait చేయకుండా?" },
      { role: "pt", text: "అవును, please reserve చేయండి." },
      { role: "ai", text: "Token 7 reserve అయింది! సాయంత్రం 7:15 PM కి రండి. Confirmation SMS వస్తుంది. మా clinic ని choose చేసినందుకు చాలా ధన్యవాదాలు!" },
    ],
  },
  hi: {
    code: "hi",
    label: "हिंदी",
    sublabel: "Hindi",
    greeting: "नमस्ते! मैं पल्लवी हूँ, City Clinic से। आपका call miss हो गया — मैं कैसे मदद कर सकती हूँ?",
    booking: [
      { role: "pt", text: "Dr. Mehta से कल appointment चाहिए।" },
      { role: "ai", text: "बिल्कुल! कल 10 AM या 3 PM slot available है। कौनसा time convenient रहेगा?" },
      { role: "pt", text: "10 AM ठीक रहेगा।" },
      { role: "ai", text: "Confirmed! कल 10 AM, Dr. Mehta के साथ। Confirmation SMS आएगा। हमारे clinic को choose करने के लिए बहुत धन्यवाद!" },
    ],
    inquiry: [
      { role: "pt", text: "OPD charges कितने हैं?" },
      { role: "ai", text: "General OPD 300 rupees, specialist के लिए 500 rupees है। Appointment भी book करना है?" },
      { role: "pt", text: "नहीं, बस इतना काफी है। धन्यवाद।" },
      { role: "ai", text: "मदद करके खुशी हुई! हमारे clinic को choose करने के लिए बहुत धन्यवाद!" },
    ],
    evening: [
      { role: "pt", text: "Dr. Reddy आज evening clinic में आएंगे?" },
      { role: "ai", text: "जी हाँ! Dr. Reddy आज शाम 6:30 बजे clinic में होंगे। क्या मैं आपके लिए पहले से token reserve कर दूं ताकि इंतज़ार न करना पड़े?" },
      { role: "pt", text: "हाँ, please reserve करें।" },
      { role: "ai", text: "Token number 7 reserve हो गया! शाम 7:15 बजे आ जाइए। Confirmation SMS भेज रहे हैं। हमारे clinic को choose करने के लिए बहुत धन्यवाद!" },
    ],
  },
};

function aiTexts(s: LangScript) {
  return [
    s.greeting,
    ...s.booking.filter(l => l.role === "ai").map(l => l.text),
    ...s.inquiry.filter(l => l.role === "ai").map(l => l.text),
    ...s.evening.filter(l => l.role === "ai").map(l => l.text),
  ];
}

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
type Phase = "idle" | "incoming" | "missed" | "countdown" | "calling" | "conversation" | "booked" | "inquiry_done" | "evening_done";

export default function MissedCallSimulator({ onClose }: { onClose?: () => void }) {
  const [phase,      setPhase]      = useState<Phase>("idle");
  const [count,      setCount]      = useState(3);
  const [lines,      setLines]      = useState<Line[]>([]);
  const [showChoice, setShowChoice] = useState(false);
  const [langKey,    setLangKey]    = useState<"te" | "hi">("te");
  const script   = SCRIPTS[langKey];
  const chatRef  = useRef<HTMLDivElement>(null);
  const cache    = useRef<Map<string, HTMLAudioElement>>(new Map());
  const cancelled = useRef(false);

  // ── helpers ────────────────────────────────────────────────────────────────
  const reset = () => {
    cancelled.current = true;
    stopAll();
    stopSfx();
    setPhase("idle"); setCount(3); setLines([]); setShowChoice(false);
  };

  // Kick off parallel pre-loading of all AI audio immediately
  const preloadAll = (s: LangScript) => {
    cache.current.clear();
    aiTexts(s).forEach(text =>
      loadBlob(text, s.code).then(a => { if (a) cache.current.set(text, a); })
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

  // incoming → missed → countdown (with sound effects)
  useEffect(() => {
    if (phase === "incoming") {
      playIncomingRing(1400);
      const t = setTimeout(() => setPhase("missed"), 1500);
      return () => { clearTimeout(t); stopSfx(); };
    }
    if (phase === "missed") {
      playDisconnectSfx();
      const t = setTimeout(() => setPhase("countdown"), 600);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // countdown tick → calling
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count === 0) { setPhase("calling"); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, count]);

  // calling → conversation (with outbound ring)
  useEffect(() => {
    if (phase !== "calling") return;
    playOutboundRing(1400);
    const t = setTimeout(() => { stopSfx(); setPhase("conversation"); }, 1500);
    return () => { clearTimeout(t); stopSfx(); };
  }, [phase]);

  // conversation: play greeting then show choice
  useEffect(() => {
    if (phase !== "conversation") return;
    cancelled.current = false;

    (async () => {
      setLines([{ role: "ai", text: script.greeting }]);
      await playAndWait(getAudio(script.greeting));
      if (cancelled.current) return;
      setShowChoice(true);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── choice handler ─────────────────────────────────────────────────────────
  const choose = async (intent: "booking" | "inquiry" | "evening") => {
    if (cancelled.current) return;
    setShowChoice(false);
    const scriptLines = intent === "booking" ? script.booking : intent === "inquiry" ? script.inquiry : script.evening;

    for (const line of scriptLines) {
      if (cancelled.current) return;
      setLines(prev => [...prev, line]);

      if (line.role === "ai") {
        await playAndWait(getAudio(line.text));
      } else {
        await sleep(900);
      }
    }

    if (!cancelled.current) {
      setPhase(intent === "booking" ? "booked" : intent === "inquiry" ? "inquiry_done" : "evening_done");
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

              {/* Language toggle */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-white/30 text-xs mr-1">Try in:</span>
                {(["te", "hi"] as const).map(k => (
                  <button
                    key={k}
                    onClick={() => setLangKey(k)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      langKey === k
                        ? "bg-brand-600/40 border border-brand-500/60 text-white"
                        : "bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/70"
                    }`}
                  >
                    {SCRIPTS[k].label}
                    <span className="ml-1.5 text-[10px] opacity-60">{SCRIPTS[k].sublabel}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  reset();
                  cancelled.current = false;
                  preloadAll(SCRIPTS[langKey]);
                  setPhase("incoming");
                }}
                className="px-8 py-3.5 rounded-xl font-semibold text-white text-sm"
                style={{ background: "linear-gradient(135deg,#FF6B00,#f97316)", boxShadow: "0 4px 20px rgba(255,107,0,0.35)" }}
              >
                ▶ Start in {SCRIPTS[langKey].sublabel}
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
                <span className="text-[11px] text-emerald-400 font-mono">Connected · Pallavi speaking {script.sublabel}</span>
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
                  <button
                    onClick={() => choose("evening")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-300/80 text-sm transition-all"
                  >
                    <Phone className="w-4 h-4 text-amber-400/70 shrink-0" />
                    Evening Clinic Enquiry
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

          {/* EVENING DONE */}
          {phase === "evening_done" && (
            <div className="text-center space-y-5">
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-amber-400" />
              </div>
              <div>
                <p className="text-amber-300 font-bold text-2xl">Token Reserved ✔</p>
                <p className="text-white/45 text-sm mt-2">Dr. Reddy · Tonight 6:30 PM · Token #7</p>
                <p className="text-white/25 text-xs mt-1">SMS sent · No waiting · Zero staff needed</p>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/60 font-mono">
                2 PM inquiry → evening slot secured in 30s
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

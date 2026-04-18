"use client";

import { useState, useRef, useCallback } from "react";
import { Phone, PhoneOff, Loader2, Mic, MicOff } from "lucide-react";

type CallStatus = "idle" | "requesting" | "connecting" | "active" | "ended" | "error" | "not_configured";

const STATUS_LABELS: Record<CallStatus, string> = {
  idle: "Call Pallavi Live",
  requesting: "Getting access…",
  connecting: "Connecting…",
  active: "End Call",
  ended: "Call ended",
  error: "Try again",
  not_configured: "Try again",
};

export default function BrowserCallButton() {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [muted, setMuted] = useState(false);
  const deviceRef = useRef<unknown>(null);
  const callRef = useRef<unknown>(null);

  const startCall = useCallback(async () => {
    if (status === "active") {
      (callRef.current as { disconnect: () => void })?.disconnect();
      return;
    }
    if (status === "connecting" || status === "requesting") return;

    setStatus("requesting");
    try {
      const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend-production-129a.up.railway.app";
      const res = await fetch(`${backendBase}/api/v1/missed-call/voice-token`);
      if (res.status === 503) throw new Error("not_configured");
      if (!res.ok) throw new Error("Token fetch failed");
      const { token } = await res.json();

      setStatus("connecting");
      const { Device } = await import("@twilio/voice-sdk");

      const device = new Device(token, { logLevel: 1, codecPreferences: ["opus", "pcmu"] as never });
      deviceRef.current = device;

      device.on("error", () => setStatus("error"));

      const call = await device.connect();
      callRef.current = call;

      call.on("accept", () => setStatus("active"));
      call.on("disconnect", () => {
        setStatus("ended");
        device.destroy();
        deviceRef.current = null;
        callRef.current = null;
        setTimeout(() => setStatus("idle"), 3000);
      });
      call.on("cancel", () => {
        setStatus("idle");
        device.destroy();
      });
    } catch (err) {
      setStatus((err as Error).message === "not_configured" ? "not_configured" : "error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  }, [status]);

  const toggleMute = useCallback(() => {
    const call = callRef.current as { mute: (m: boolean) => void } | null;
    if (!call) return;
    const next = !muted;
    call.mute(next);
    setMuted(next);
  }, [muted]);

  const isActive = status === "active";
  const isLoading = status === "requesting" || status === "connecting";
  const isNotConfigured = status === "not_configured";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={startCall}
        disabled={isLoading || status === "ended" || status === "error" || isNotConfigured}
        className={[
          "group flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-200 border",
          isActive
            ? "bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 disabled:opacity-40",
        ].join(" ")}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isActive ? (
          <PhoneOff className="w-4 h-4" />
        ) : (
          <Phone className="w-4 h-4" />
        )}
        {STATUS_LABELS[status]}
      </button>

      {isActive && (
        <button
          onClick={toggleMute}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-white/50 hover:text-white/80 transition-colors"
        >
          {muted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          {muted ? "Unmute" : "Mute"}
        </button>
      )}

      {isActive && (
        <p className="text-emerald-400/70 text-xs animate-pulse">
          Live call · Pallavi is listening…
        </p>
      )}
      {status === "ended" && (
        <p className="text-white/30 text-xs">Call ended · Thanks for trying Bolo!</p>
      )}
      {status === "error" && (
        <p className="text-red-400/70 text-xs">Could not connect. Check mic permissions.</p>
      )}
      {isNotConfigured && (
        <p className="text-amber-400/70 text-xs">Browser calling not available — use your phone to test.</p>
      )}
    </div>
  );
}

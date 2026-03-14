"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Lightbulb } from "lucide-react";

export interface TourStep {
  target: string;
  title: string;
  body: string;
  placement?: "top" | "bottom" | "left" | "right";
  icon?: string;
}

interface Rect { top: number; left: number; width: number; height: number }

const PAD = 12;
const PANEL_W = 320;
const PANEL_H = 180;

function getPlacement(
  rect: Rect,
  preferred: TourStep["placement"] = "bottom"
): TourStep["placement"] {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (preferred === "bottom" && rect.top + rect.height + PANEL_H + PAD > vh) return "top";
  if (preferred === "top" && rect.top - PANEL_H - PAD < 0) return "bottom";
  if (preferred === "right" && rect.left + rect.width + PANEL_W + PAD > vw) return "left";
  if (preferred === "left" && rect.left - PANEL_W - PAD < 0) return "right";
  return preferred;
}

function panelPosition(rect: Rect, placement: TourStep["placement"]) {
  const center = rect.left + rect.width / 2;
  const middle = rect.top + rect.height / 2;
  switch (placement) {
    case "top":
      return { top: rect.top - PANEL_H - PAD, left: Math.max(PAD, center - PANEL_W / 2) };
    case "left":
      return { top: Math.max(PAD, middle - PANEL_H / 2), left: rect.left - PANEL_W - PAD };
    case "right":
      return { top: Math.max(PAD, middle - PANEL_H / 2), left: rect.left + rect.width + PAD };
    default:
      return { top: rect.top + rect.height + PAD, left: Math.max(PAD, center - PANEL_W / 2) };
  }
}

export function ProductTour({
  steps,
  onFinish,
  onSkip,
}: {
  steps: TourStep[];
  onFinish: () => void;
  onSkip: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const rafRef = useRef<number | null>(null);
  const step = steps[idx];
  const isLast = idx === steps.length - 1;

  const measureTarget = useCallback(() => {
    const el = document.querySelector(step.target);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step.target]);

  useEffect(() => {
    measureTarget();
    const el = document.querySelector(step.target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setTimeout(measureTarget, 400);
    }

    const loop = () => { measureTarget(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [step.target, measureTarget]);

  const advance = () => {
    if (isLast) onFinish();
    else setIdx((i) => i + 1);
  };

  const placement = rect ? getPlacement(rect, step.placement) : "bottom";
  const pos = rect ? panelPosition(rect, placement) : { top: "50%", left: "50%" };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {rect && (
        <>
          <div
            className="absolute inset-0 pointer-events-auto"
            style={{
              background: `radial-gradient(ellipse ${rect.width + PAD * 2}px ${rect.height + PAD * 2}px at ${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px, transparent 0%, transparent 50%, rgba(0,0,0,0.55) 51%)`,
            }}
            onClick={onSkip}
          />
          <div
            className="absolute border-2 border-brand-400 rounded-xl pointer-events-none animate-pulse"
            style={{
              top: rect.top - PAD / 2,
              left: rect.left - PAD / 2,
              width: rect.width + PAD,
              height: rect.height + PAD,
              boxShadow: "0 0 0 4px rgba(99,102,241,0.25)",
            }}
          />
        </>
      )}

      {!rect && (
        <div
          className="absolute inset-0 bg-black/55 pointer-events-auto"
          onClick={onSkip}
        />
      )}

      <div
        className="absolute bg-white rounded-2xl shadow-2xl pointer-events-auto border border-gray-100"
        style={{
          width: PANEL_W,
          top: rect ? pos.top : "50%",
          left: rect ? pos.left : "50%",
          transform: rect ? "none" : "translate(-50%,-50%)",
          zIndex: 10000,
        }}
      >
        <div className="bg-gradient-to-r from-brand-600 to-violet-600 rounded-t-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{step.icon ?? "💡"}</span>
            <span className="text-white font-semibold text-sm">{step.title}</span>
          </div>
          <button onClick={onSkip} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3">
          <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
        </div>

        <div className="px-4 pb-4 flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-brand-600 w-4" : "bg-gray-200 hover:bg-gray-300"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {idx > 0 && (
              <button
                onClick={() => setIdx((i) => i - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            <button
              onClick={advance}
              className="flex items-center gap-1 px-4 py-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors font-medium"
            >
              {isLast ? "Done 🎉" : "Next"} {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TourLauncher({ onStart }: { onStart: () => void }) {
  return (
    <button
      onClick={onStart}
      className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium transition-colors"
    >
      <Lightbulb className="w-4 h-4" />
      Take the tour
    </button>
  );
}

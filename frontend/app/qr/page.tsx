"use client";

import { QRCodeSVG } from "qrcode.react";
import { Mic, Download } from "lucide-react";
import { useRef } from "react";

const SITE_URL = "https://www.bolospeak.com";

export default function QRPage() {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const svg = printRef.current?.querySelector("svg");
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bolo-qr.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#050a14] flex flex-col items-center justify-center px-6 py-16 text-white">

      <div className="mb-8 flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#FF6B00,#fbbf24)", boxShadow: "0 0 20px rgba(255,107,0,0.35)" }}
        >
          <Mic className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="font-serif text-[22px] text-white tracking-tight">Bolo</span>
      </div>

      <div
        ref={printRef}
        className="rounded-3xl bg-white p-8 shadow-2xl flex flex-col items-center gap-4"
        style={{ maxWidth: 320 }}
      >
        <QRCodeSVG
          value={SITE_URL}
          size={240}
          bgColor="#ffffff"
          fgColor="#0d1117"
          level="H"
          includeMargin={false}
          imageSettings={{
            src: "",
            x: undefined,
            y: undefined,
            height: 0,
            width: 0,
            excavate: false,
          }}
        />
        <div className="text-center">
          <p className="text-[#0d1117] font-bold text-sm tracking-tight">bolospeak.com</p>
          <p className="text-[#6b7280] text-xs mt-0.5">Missed Call Recovery for Clinics</p>
        </div>
      </div>

      <p className="mt-6 text-white/40 text-sm text-center max-w-xs">
        Print and place at your clinic reception, visiting cards, or WhatsApp status.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm"
          style={{ background: "linear-gradient(135deg,#FF6B00,#f97316)", boxShadow: "0 4px 20px rgba(255,107,0,0.35)" }}
        >
          <Download className="w-4 h-4" />
          Download SVG
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white/70 text-sm bg-white/[0.06] border border-white/[0.10] hover:bg-white/[0.10] transition-colors"
        >
          Print
        </button>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          body > * { display: none !important; }
          [data-print] { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

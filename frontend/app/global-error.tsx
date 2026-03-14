"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f9fafb" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{ background: "white", borderRadius: "1rem", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", padding: "2rem", maxWidth: "480px", width: "100%", textAlign: "center" }}>
            <h2 style={{ color: "#dc2626", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Something went wrong</h2>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.5rem" }}>{error.message || "An unexpected error occurred"}</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button onClick={reset} style={{ padding: "0.5rem 1rem", background: "#4f46e5", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}>
                Try again
              </button>
              <button onClick={() => { window.location.href = "/login"; }} style={{ padding: "0.5rem 1rem", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}>
                Back to login
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

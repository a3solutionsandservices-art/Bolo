import { NextRequest, NextResponse } from "next/server";

const SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, clinic, city, source, ts } = body;

    if (!name || !phone || !clinic) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const lead = {
      Timestamp: ts || new Date().toISOString(),
      Name: name,
      Phone: phone,
      Clinic: clinic,
      City: city || "",
      Source: source || "landing_page",
    };

    if (SHEET_WEBHOOK_URL) {
      const r = await fetch(SHEET_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) {
        console.error("Google Sheet webhook failed:", r.status);
      }
    } else {
      console.log("[LEAD]", JSON.stringify(lead));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Lead capture error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

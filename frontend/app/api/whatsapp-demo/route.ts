import { NextRequest, NextResponse } from "next/server";

const ACCOUNT_SID  = process.env.TWILIO_ACCOUNT_SID  || "";
const AUTH_TOKEN   = process.env.TWILIO_AUTH_TOKEN    || "";
const FROM         = "whatsapp:+14155238886";

export async function POST(req: NextRequest) {
  if (!ACCOUNT_SID || !AUTH_TOKEN) {
    return NextResponse.json({ error: "Twilio not configured" }, { status: 503 });
  }

  const { phone, intent, detail } = await req.json();
  if (!phone || !intent) {
    return NextResponse.json({ error: "Missing phone or intent" }, { status: 400 });
  }

  const clean = phone.replace(/\D/g, "");
  const to    = `whatsapp:+${clean.startsWith("91") ? clean : "91" + clean}`;

  const messages: Record<string, string> = {
    booking: `Bolo just recovered a booking for City Clinic.\n\nPatient: ${clean}\nDoctor: Dr. Mehta\nSlot: Tomorrow 10:00 AM\n\nSMS sent to patient. No staff needed.\n\n— City Clinic (via Bolo)`,
    evening: `Bolo just reserved an evening token for City Clinic.\n\nPatient: ${clean}\nDoctor: Dr. Reddy\nToken: #7 · Tonight ${detail || "6:30 PM"}\n\nSMS sent to patient.\n\n— City Clinic (via Bolo)`,
    inquiry: `Bolo just handled a patient inquiry for City Clinic.\n\nPatient asked about OPD charges.\nFee summary sent via WhatsApp automatically.\n\n— City Clinic (via Bolo)`,
  };

  const body = messages[intent] || messages.inquiry;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: FROM, To: to, Body: body }).toString(),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data.message || "Twilio error" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, sid: data.sid });
}

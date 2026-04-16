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
    booking: `Hi! Your appointment with Dr. Mehta is confirmed.\n\n📅 Tomorrow · 10:00 AM\n🏥 City Clinic, OPD\n\nReply CANCEL if you need to reschedule.\n\n— City Clinic`,
    evening: `Hi! Your token has been reserved at City Clinic.\n\n🎫 Token #7 — Dr. Reddy\n🕡 Arrive by 7:15 PM tonight\n📍 City Clinic, Kukatpally\n\nReply CANCEL to release your token.\n\n— City Clinic`,
    inquiry: `Hi! Here is the fee summary you requested from City Clinic.\n\n💊 General OPD: ₹300\n🩺 Specialist: ₹500\n\nTo book an appointment reply BOOK or call us directly.\n\n— City Clinic`,
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

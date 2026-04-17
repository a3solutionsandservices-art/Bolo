import { NextRequest, NextResponse } from "next/server";

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN   || "";
const FROM        = "whatsapp:+14155238886";

const VALID_INTENTS = new Set(["booking", "evening", "inquiry"]);

const ipHits = new Map<string, number>();
setInterval(() => ipHits.clear(), 60_000);

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: NextRequest) {
  if (!ACCOUNT_SID || !AUTH_TOKEN) {
    return NextResponse.json({ error: "Twilio not configured" }, { status: 503 });
  }

  const ip = getIp(req);
  const hits = (ipHits.get(ip) ?? 0) + 1;
  ipHits.set(ip, hits);
  if (hits > 3) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { phone, intent } = body as Record<string, string>;

  const clean = (phone ?? "").replace(/\D/g, "");
  const normalized = clean.startsWith("91") ? clean : "91" + clean;
  if (!/^91\d{10}$/.test(normalized)) {
    return NextResponse.json({ error: "Invalid Indian mobile number" }, { status: 400 });
  }

  const safeIntent = VALID_INTENTS.has(intent) ? intent : "inquiry";
  if (!VALID_INTENTS.has(intent)) {
    console.warn("[whatsapp-demo] unknown intent:", intent);
  }

  const to = `whatsapp:+${normalized}`;

  const messages: Record<string, string> = {
    booking: `Hi! Your appointment with Dr. Mehta is confirmed.\n\nTomorrow, 10:00 AM\nCity Clinic, OPD\n\nReply CANCEL if you need to reschedule.\n\n- City Clinic`,
    evening: `Hi! Your token has been reserved at City Clinic.\n\nToken #7 - Dr. Reddy\nArrive by 7:15 PM tonight\nCity Clinic, Kukatpally\n\nReply CANCEL to release your token.\n\n- City Clinic`,
    inquiry: `Hi! Here is the fee summary from City Clinic.\n\nGeneral OPD: Rs.300\nSpecialist: Rs.500\n\nTo book an appointment reply BOOK or call us.\n\n- City Clinic`,
  };

  const msgBody = messages[safeIntent];

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: FROM, To: to, Body: msgBody }).toString(),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data.message || "Twilio error" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, sid: data.sid });
}

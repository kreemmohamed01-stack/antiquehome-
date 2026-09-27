import { NextResponse, type NextRequest } from "next/server";
import { sql } from "@/lib/db";

// Known bot/crawler/monitoring signatures — kept deliberately broad so
// automated hits never pollute the "real visitor" analytics.
const BOT_UA = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|discordbot|pingdom|uptimerobot|lighthouse|headlesschrome|phantomjs|curl|wget|python-requests|axios|go-http-client|vercel-screenshot|ahrefs|semrush|mj12bot|dotbot/i;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { visitorId, sessionId, path, referrer } = body || {};

    if (!visitorId || !sessionId || typeof path !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const ua = req.headers.get("user-agent") || "";
    if (BOT_UA.test(ua) || !ua) {
      // Silently accept-but-drop so the beacon never errors in devtools.
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Admin/dashboard traffic is real usage but not a "shopper" — keep it
    // out of the storefront visitor counts by flagging it.
    const isAdmin = path.startsWith("/admin");

    await sql`
      INSERT INTO visits (visitor_id, session_id, path, referrer, user_agent, is_admin)
      VALUES (${String(visitorId).slice(0, 64)}, ${String(sessionId).slice(0, 64)}, ${path.slice(0, 300)}, ${referrer ? String(referrer).slice(0, 300) : null}, ${ua.slice(0, 300)}, ${isAdmin})
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

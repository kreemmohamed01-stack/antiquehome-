const { sql } = require("./_db.js");

const BOT_UA = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|discordbot|pingdom|uptimerobot|lighthouse|headlesschrome|phantomjs|curl|wget|python-requests|axios|go-http-client|vercel-screenshot|ahrefs|semrush|mj12bot|dotbot/i;

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};
    const { visitorId, sessionId, path, referrer } = body;
    if (!visitorId || !sessionId || typeof path !== "string") { res.status(400).json({ ok: false }); return; }

    const ua = req.headers["user-agent"] || "";
    if (BOT_UA.test(ua) || !ua) { res.status(200).json({ ok: true, skipped: true }); return; }

    const isAdmin = path.startsWith("/admin") || path.startsWith("/dashboard");

    // Vercel resolves these at the edge from the request IP — no IP address
    // itself is ever read or stored, just the country/city it geo-resolved to.
    const country = req.headers["x-vercel-ip-country"] || null;
    const city = req.headers["x-vercel-ip-city"] ? decodeURIComponent(req.headers["x-vercel-ip-city"]) : null;
    const device = /mobile|iphone|android.*mobile|ipod/i.test(ua) ? "mobile" : /ipad|tablet|android(?!.*mobile)/i.test(ua) ? "tablet" : "desktop";

    await sql`
      INSERT INTO visits (visitor_id, session_id, path, referrer, user_agent, is_admin, country, city, device)
      VALUES (${String(visitorId).slice(0, 64)}, ${String(sessionId).slice(0, 64)}, ${path.slice(0, 300)}, ${referrer ? String(referrer).slice(0, 300) : null}, ${ua.slice(0, 300)}, ${isAdmin}, ${country}, ${city}, ${device})
    `;
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
};

const { sql } = require("./_db.js");

// Fire-and-forget funnel events beyond page views: add_to_cart and
// checkout_started. "purchased" isn't logged here — it's read straight
// from the real orders table so it can never drift from actual sales.
const ALLOWED = new Set(["add_to_cart", "checkout_started"]);

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};
    const { visitorId, sessionId, event, productSlug } = body;
    if (!visitorId || !sessionId || !ALLOWED.has(event)) { res.status(400).json({ ok: false }); return; }

    await sql`
      INSERT INTO cart_events (visitor_id, session_id, event, product_slug)
      VALUES (${String(visitorId).slice(0, 64)}, ${String(sessionId).slice(0, 64)}, ${event}, ${productSlug ? String(productSlug).slice(0, 200) : null})
    `;
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
};

const { sql, edgeCache } = require("./_db.js");
const { getSession } = require("./_auth.js");

// Generic key/value site-settings store, backed by the existing `settings`
// (key text, value jsonb) table. One route handles every settings screen
// (Discounts' site-wide sale, Marketing's social links + announcement bar,
// Content's editable page text) instead of a file per screen — Vercel's
// Hobby plan caps serverless functions per deployment, so consolidating
// here keeps room for the rest of the API.
//
//   GET  /api/settings?key=site_sale           -> public, single value (or default)
//   POST /api/settings?key=site_sale  {...}     -> admin only, upserts that key
//
// Known keys and their shape (each GET/POST caller owns its own shape;
// this endpoint doesn't validate beyond "value is JSON"):
//   site_sale         { active, percent, label }
//   site_social       { whatsapp, instagram, facebook }
//   site_announcement { active, text }
//   site_content      { heroEyebrow, heroTitle, heroSubtitle, heroText,
//                        aboutHeroTitle, aboutHeroText, aboutJourneyText,
//                        aboutPhilosophyText, aboutCtaText,
//                        contactEmail, contactPhone, contactAddress }

const DEFAULTS = {
  site_sale: { active: false, percent: 0, label: "" },
  site_social: { whatsapp: "", instagram: "", facebook: "" },
  site_announcement: { active: false, text: "" },
  site_content: {},
};

async function readBody(req) {
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  return body || {};
}

module.exports = async (req, res) => {
  try {
    const key = String(req.query.key || "").trim();
    if (!key) { res.status(400).json({ error: "Missing key" }); return; }

    // GET /api/settings?key=public -> everything a storefront page needs
    // up front (public settings, categories, featured coupon) in ONE
    // edge-cached response, instead of 5-7 separate requests per page
    // view (each one counts against Vercel's monthly edge-request quota).
    if (req.method === "GET" && key === "public") {
      const keys = ["site_sale", "site_social", "site_announcement", "site_content"];
      const [settings, categories, coupons] = await Promise.all([
        sql`SELECT key, value FROM settings WHERE key = ANY(${keys})`,
        sql`SELECT * FROM categories ORDER BY sort_order ASC, name ASC`,
        sql`SELECT code, percent FROM coupons WHERE active = true ORDER BY created_at DESC LIMIT 1`,
      ]);
      const out = { categories, featuredCoupon: coupons.length ? { code: coupons[0].code, percent: parseFloat(coupons[0].percent) } : null };
      for (const k of keys) out[k] = DEFAULTS[k];
      for (const r of settings) out[r.key] = r.value;
      edgeCache(res);
      res.status(200).json(out);
      return;
    }

    if (req.method === "GET") {
      const rows = await sql`SELECT value FROM settings WHERE key = ${key}`;
      edgeCache(res);
      res.status(200).json(rows.length ? rows[0].value : (DEFAULTS[key] ?? null));
      return;
    }

    const session = getSession(req);
    if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

    if (req.method === "POST") {
      let body = await readBody(req);
      // site_sale keeps its old percent clamp (0-90) now that this route
      // replaces the dedicated /api/sale endpoint.
      if (key === "site_sale") {
        body = {
          active: Boolean(body.active),
          percent: Math.max(0, Math.min(90, Number(body.percent) || 0)),
          label: (body.label || "").trim(),
        };
      }
      await sql`
        INSERT INTO settings (key, value) VALUES (${key}, ${JSON.stringify(body)}::jsonb)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save setting." });
  }
};

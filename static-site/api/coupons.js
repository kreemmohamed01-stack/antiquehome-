const { sql, edgeCache } = require("./_db.js");
const { getSession } = require("./_auth.js");

async function readBody(req) {
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  return body || {};
}

module.exports = async (req, res) => {
  try {
    // POST /api/coupons  { code } -> public, validates a coupon at checkout.
    if (req.method === "POST" && !req.query.admin) {
      const body = await readBody(req);
      const code = (body.code || "").trim().toUpperCase();
      if (!code) { res.status(400).json({ error: "Enter a coupon code." }); return; }
      const rows = await sql`SELECT * FROM coupons WHERE code = ${code} AND active = true`;
      if (!rows.length) { res.status(404).json({ error: "This coupon code is not valid." }); return; }
      res.status(200).json({ code: rows[0].code, percent: parseFloat(rows[0].percent) });
      return;
    }

    // GET /api/coupons?featured=1 -> public, returns the coupon the
    // homepage sale banner should show (the most recently created active
    // one), or null. Kept separate from the admin listing below so the
    // storefront never needs a session just to render the banner.
    if (req.method === "GET" && req.query.featured) {
      const rows = await sql`SELECT code, percent FROM coupons WHERE active = true ORDER BY created_at DESC LIMIT 1`;
      edgeCache(res);
      res.status(200).json(rows.length ? { code: rows[0].code, percent: parseFloat(rows[0].percent) } : null);
      return;
    }

    const session = getSession(req);
    if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM coupons ORDER BY created_at DESC`;
      res.status(200).json(rows);
      return;
    }

    if (req.method === "PUT" || (req.method === "POST" && req.query.admin)) {
      const body = await readBody(req);
      const code = (body.code || "").trim().toUpperCase();
      const percent = Number(body.percent) || 0;
      if (!code) { res.status(400).json({ error: "Code is required." }); return; }
      await sql`
        INSERT INTO coupons (code, percent, active) VALUES (${code}, ${percent}, true)
        ON CONFLICT (code) DO UPDATE SET percent = EXCLUDED.percent, active = true
      `;
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "PATCH") {
      const id = Number(req.query.id);
      const body = await readBody(req);
      await sql`UPDATE coupons SET active = ${Boolean(body.active)} WHERE id = ${id}`;
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "DELETE") {
      const id = Number(req.query.id);
      await sql`DELETE FROM coupons WHERE id = ${id}`;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

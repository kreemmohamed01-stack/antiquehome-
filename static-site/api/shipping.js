const { sql, edgeCache } = require("./_db.js");
const { getSession } = require("./_auth.js");

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM shipping_rates ORDER BY sort_order`;
      edgeCache(res);
      res.status(200).json({ rates: rows });
      return;
    }

    const session = getSession(req);
    if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

    if (req.method === "PATCH") {
      const id = Number(req.query.id);
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
      body = body || {};
      await sql`
        UPDATE shipping_rates SET
          standard_price = ${Number(body.standardPrice) || 0},
          express_price = ${Number(body.expressPrice) || 0},
          per_kg_rate = ${Number(body.perKgRate) || 0}
        WHERE id = ${id}
      `;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ rates: [] });
  }
};

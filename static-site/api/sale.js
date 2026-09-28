const { sql } = require("./_db.js");
const { getSession } = require("./_auth.js");

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const rows = await sql`SELECT value FROM settings WHERE key = 'site_sale'`;
      res.status(200).json(rows.length ? rows[0].value : { active: false, percent: 0, label: "" });
      return;
    }

    const session = getSession(req);
    if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
      body = body || {};
      const active = Boolean(body.active);
      const percent = Math.max(0, Math.min(90, Number(body.percent) || 0));
      const label = (body.label || "").trim();
      await sql`
        INSERT INTO settings (key, value) VALUES ('site_sale', ${JSON.stringify({ active, percent, label })}::jsonb)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update sale settings." });
  }
};

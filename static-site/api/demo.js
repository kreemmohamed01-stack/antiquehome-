const { sql } = require("./_db.js");
const { getSession } = require("./_auth.js");

module.exports = async (req, res) => {
  if (req.method !== "DELETE") { res.status(405).json({ error: "Method not allowed" }); return; }
  const session = getSession(req);
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    await sql`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE is_demo = true)`;
    const res2 = await sql`DELETE FROM orders WHERE is_demo = true RETURNING id`;
    await sql`DELETE FROM products WHERE is_demo = true`;
    res.status(200).json({ ok: true, removed: res2.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove demo data." });
  }
};

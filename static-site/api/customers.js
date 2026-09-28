const { sql } = require("./_db.js");
const { getSession } = require("./_auth.js");

module.exports = async (req, res) => {
  const session = getSession(req);
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const rows = await sql`
      SELECT email, MAX(customer_name) AS name, MAX(phone) AS phone,
             COUNT(*)::int AS order_count, SUM(total)::float AS total_spent,
             MAX(created_at) AS last_order
      FROM orders GROUP BY email ORDER BY total_spent DESC
    `;
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
};

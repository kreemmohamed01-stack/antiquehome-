const { sql } = require("./_db.js");
const { getSession } = require("./_auth.js");

async function readBody(req) {
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  return body || {};
}

// Also carries newsletter signups (?newsletter=1) since they're
// customer-adjacent contact data — kept on this route instead of a new
// file to stay under the Hobby plan's serverless-function cap.
module.exports = async (req, res) => {
  if (req.query.newsletter) {
    if (req.method === "POST") {
      const body = await readBody(req);
      const email = (body.email || "").trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ error: "Enter a valid email." });
        return;
      }
      try {
        await sql`INSERT INTO newsletter_signups (email) VALUES (${email}) ON CONFLICT (email) DO NOTHING`;
        res.status(200).json({ ok: true });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to sign up." });
      }
      return;
    }

    const session = getSession(req);
    if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }
    if (req.method === "GET") {
      const rows = await sql`SELECT id, email, created_at FROM newsletter_signups ORDER BY created_at DESC`;
      res.status(200).json(rows);
      return;
    }
    if (req.method === "DELETE") {
      const id = Number(req.query.id);
      if (!id) { res.status(400).json({ error: "Missing id" }); return; }
      await sql`DELETE FROM newsletter_signups WHERE id = ${id}`;
      res.status(200).json({ ok: true });
      return;
    }
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

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

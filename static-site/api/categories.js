const { sql } = require("./_db.js");
const { getSession } = require("./_auth.js");

function slugify(name) {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function readBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  return body || {};
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM categories ORDER BY sort_order ASC, name ASC`;
      res.status(200).json(rows);
      return;
    }

    const session = getSession(req);
    if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

    if (req.method === "POST") {
      const b = await readBody(req);
      const name = (b.name || "").trim();
      if (!name) { res.status(400).json({ error: "Name is required." }); return; }
      const slug = slugify(name);
      const maxRow = await sql`SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM categories`;
      await sql`
        INSERT INTO categories (slug, name, image_url, sort_order)
        VALUES (${slug}, ${name}, ${b.imageUrl || null}, ${maxRow[0].next})
      `;
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "DELETE") {
      const id = Number(req.query.id);
      if (!id) { res.status(400).json({ error: "Missing id" }); return; }
      await sql`DELETE FROM categories WHERE id = ${id}`;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save category (slug may already exist)." });
  }
};

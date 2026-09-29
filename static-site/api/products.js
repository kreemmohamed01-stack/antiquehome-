const { sql } = require("./_db.js");
const { getSession } = require("./_auth.js");

function slugify(name) {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function num(x) {
  return x === "" || x === null || x === undefined ? null : Number(x);
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
      const { slug, id, category, status } = req.query;

      if (slug) {
        const rows = await sql`SELECT * FROM products WHERE slug = ${slug}`;
        if (!rows.length) { res.status(404).json({ error: "Not found" }); return; }
        res.status(200).json(rows[0]);
        return;
      }
      if (id) {
        const rows = await sql`SELECT * FROM products WHERE id = ${Number(id)}`;
        if (!rows.length) { res.status(404).json({ error: "Not found" }); return; }
        res.status(200).json(rows[0]);
        return;
      }

      let rows;
      if (category && category !== "all") {
        rows = await sql`
          SELECT DISTINCT p.* FROM products p
          LEFT JOIN product_categories pc ON pc.product_id = p.id
          LEFT JOIN categories c ON c.id = pc.category_id OR c.id = p.category_id
          WHERE (c.slug = ${category}) AND p.status = 'active'
          ORDER BY p.created_at DESC
        `;
      } else if (status) {
        rows = await sql`SELECT * FROM products WHERE status = ${status} ORDER BY created_at DESC`;
      } else {
        rows = await sql`
          SELECT p.*, c.name AS category_name,
            COALESCE(
              (SELECT array_agg(pc.category_id) FROM product_categories pc WHERE pc.product_id = p.id),
              ARRAY[]::int[]
            ) AS category_ids
          FROM products p
          LEFT JOIN categories c ON c.id = p.category_id
          ORDER BY p.created_at DESC
        `;
      }
      res.status(200).json(rows);
      return;
    }

    // Everything past this point is an admin write action.
    const session = getSession(req);
    if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

    if (req.method === "POST") {
      const b = await readBody(req);
      const name = String(b.name || "").trim();
      if (!name) { res.status(400).json({ error: "Name is required." }); return; }

      const slug = String(b.slug || slugify(name));
      const categoryIds = Array.isArray(b.categoryIds) ? b.categoryIds : [];
      const primaryCategory = categoryIds.length ? Number(categoryIds[0]) : null;

      // A single statement (CTE) rather than an INSERT followed by a loop
      // of separate category-link INSERTs — either the product and all
      // its category links land together, or (on any failure — a bad
      // category id, a dropped connection) none of it does, instead of
      // risking a product saved with no/partial category links.
      const categoryIdInts = categoryIds.map((c) => Number(c)).filter((n) => Number.isFinite(n));
      const rows = await sql`
        WITH new_product AS (
          INSERT INTO products (
            name, slug, description, price, compare_at_price, category_id, material,
            colors, color_options, variants, size_cm, image_urls, badge,
            sale_percent, sale_label, stock_qty, low_stock_threshold,
            is_new_arrival, status, sku, pricing_mode, price_per_piece, set_size, weight_kg, is_top_seller
          ) VALUES (
            ${name}, ${slug}, ${b.description ? String(b.description) : null},
            ${Number(b.price) || 0}, ${num(b.compareAtPrice)}, ${primaryCategory},
            ${b.material ? String(b.material) : null},
            ${JSON.stringify(Array.isArray(b.colors) ? b.colors : [])},
            ${JSON.stringify(Array.isArray(b.colorOptions) ? b.colorOptions : [])},
            ${JSON.stringify(Array.isArray(b.variants) ? b.variants : [])},
            ${b.sizeCm ? String(b.sizeCm) : null},
            ${JSON.stringify(Array.isArray(b.imageUrls) ? b.imageUrls : [])},
            ${b.badge ? String(b.badge) : null},
            ${num(b.salePercent)}, ${b.saleLabel ? String(b.saleLabel) : null},
            ${Number(b.stockQty) || 0}, ${Number(b.lowStockThreshold) || 5},
            ${Boolean(b.isNewArrival)}, ${b.status ? String(b.status) : "active"},
            ${b.sku ? String(b.sku) : null}, ${b.pricingMode ? String(b.pricingMode) : "unit"},
            ${num(b.pricePerPiece)}, ${num(b.setSize)}, ${num(b.weightKg)}, ${Boolean(b.isTopSeller)}
          ) RETURNING id, slug
        ),
        linked AS (
          INSERT INTO product_categories (product_id, category_id)
          SELECT new_product.id, cid
          FROM new_product, unnest(${categoryIdInts}::int[]) AS cid
          ON CONFLICT DO NOTHING
        )
        SELECT id, slug FROM new_product
      `;
      const id = rows[0].id;
      res.status(200).json({ ok: true, id, slug: rows[0].slug });
      return;
    }

    if (req.method === "PATCH") {
      const pid = Number(req.query.id);
      if (!pid) { res.status(400).json({ error: "Missing id" }); return; }
      const b = await readBody(req);
      const name = String(b.name || "").trim();
      const slug = String(b.slug || "").trim();
      if (!name || !slug) { res.status(400).json({ error: "Name and slug are required." }); return; }

      const categoryIds = Array.isArray(b.categoryIds) ? b.categoryIds : [];
      const primaryCategory = categoryIds.length ? Number(categoryIds[0]) : null;
      const categoryIdInts = categoryIds.map((c) => Number(c)).filter((n) => Number.isFinite(n));

      // One statement (CTE) instead of UPDATE, then a separate DELETE,
      // then a loop of INSERTs — so a mid-sequence failure (bad category
      // id, dropped connection, two saves racing on the same product)
      // can't leave the row updated but its category links stale/empty,
      // which is what a generic 500 on just this step would have looked
      // like to the person saving.
      await sql`
        WITH updated AS (
          UPDATE products SET
            name = ${name}, slug = ${slug},
            description = ${b.description ? String(b.description) : null},
            price = ${Number(b.price) || 0}, compare_at_price = ${num(b.compareAtPrice)},
            category_id = ${primaryCategory},
            material = ${b.material ? String(b.material) : null},
            colors = ${JSON.stringify(Array.isArray(b.colors) ? b.colors : [])},
            color_options = ${JSON.stringify(Array.isArray(b.colorOptions) ? b.colorOptions : [])},
            variants = ${JSON.stringify(Array.isArray(b.variants) ? b.variants : [])},
            size_cm = ${b.sizeCm ? String(b.sizeCm) : null},
            image_urls = ${JSON.stringify(Array.isArray(b.imageUrls) ? b.imageUrls : [])},
            badge = ${b.badge ? String(b.badge) : null},
            sale_percent = ${num(b.salePercent)}, sale_label = ${b.saleLabel ? String(b.saleLabel) : null},
            stock_qty = ${Number(b.stockQty) || 0}, low_stock_threshold = ${Number(b.lowStockThreshold) || 5},
            is_new_arrival = ${Boolean(b.isNewArrival)}, status = ${b.status ? String(b.status) : "active"},
            sku = ${b.sku ? String(b.sku) : null}, pricing_mode = ${b.pricingMode ? String(b.pricingMode) : "unit"},
            price_per_piece = ${num(b.pricePerPiece)}, set_size = ${num(b.setSize)}, weight_kg = ${num(b.weightKg)},
            is_top_seller = ${Boolean(b.isTopSeller)}
          WHERE id = ${pid}
          RETURNING id
        ),
        cleared AS (
          DELETE FROM product_categories WHERE product_id = ${pid}
        )
        INSERT INTO product_categories (product_id, category_id)
        SELECT ${pid}, cid FROM unnest(${categoryIdInts}::int[]) AS cid
        ON CONFLICT DO NOTHING
      `;
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "DELETE") {
      const pid = Number(req.query.id);
      if (!pid) { res.status(400).json({ error: "Missing id" }); return; }
      await sql`DELETE FROM products WHERE id = ${pid}`;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    // Surface the actual database error (e.g. a bad category id, a unique
    // slug clash) instead of a bare "Server error" with no way to tell
    // what actually went wrong — Postgres error messages here never
    // include secrets, just column/constraint names and values.
    const detail = err && err.message ? String(err.message).slice(0, 200) : "";
    res.status(500).json({ error: detail ? `Server error: ${detail}` : "Server error" });
  }
};

const { sql, edgeCache } = require("./_db.js");
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

// Two products can share a name (e.g. two "Porcelain Tissue Box" pieces
// in different colors) — their slug can't collide though (products.slug
// is UNIQUE), and this used to surface as a raw Postgres constraint
// error with no indication of what happened or how to fix it. Appends
// -2, -3, ... until the slug is free, excluding the product's own
// current row on an edit (so re-saving a product unchanged never shifts
// its own slug).
async function uniqueSlug(desired, excludeId) {
  let candidate = desired;
  let n = 2;
  for (;;) {
    const rows = excludeId
      ? await sql`SELECT 1 FROM products WHERE slug = ${candidate} AND id != ${excludeId} LIMIT 1`
      : await sql`SELECT 1 FROM products WHERE slug = ${candidate} LIMIT 1`;
    if (!rows.length) return candidate;
    candidate = `${desired}-${n}`;
    n += 1;
  }
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
      // Storefront reads (single product by slug, a category listing, or
      // the active catalog) are edge-cached; the bare admin listing (no
      // query params) is not.
      if (slug || (category && category !== "all") || status === "active") edgeCache(res);

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
        // Ordered by that category's own sort_order on the join row (set
        // by dragging products in the dashboard's per-category view);
        // products only linked via the legacy single category_id (no
        // product_categories row) have no sort_order of their own, so
        // they fall back to oldest-first and sort after any that do.
        rows = await sql`
          SELECT DISTINCT p.*, COALESCE(pc.sort_order, 0) AS pc_sort_order FROM products p
          LEFT JOIN product_categories pc ON pc.product_id = p.id
          LEFT JOIN categories c ON c.id = pc.category_id OR c.id = p.category_id
          WHERE (c.slug = ${category}) AND p.status = 'active'
          ORDER BY pc_sort_order ASC, p.created_at DESC
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

      const slug = await uniqueSlug(String(b.slug || slugify(name)), null);
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
            name, name_ar, slug, description, description_ar, price, compare_at_price, category_id, material,
            colors, color_options, variants, size_cm, image_urls, badge,
            sale_percent, sale_label, stock_qty, low_stock_threshold,
            is_new_arrival, status, sku, pricing_mode, price_per_piece, set_size, weight_kg, is_top_seller
          ) VALUES (
            ${name}, ${b.nameAr ? String(b.nameAr).trim() : null}, ${slug}, ${b.description ? String(b.description) : null},
            ${b.descriptionAr ? String(b.descriptionAr) : null},
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

    // ?reorder=1 sets the drag-and-drop order of products within one
    // category (the dashboard's per-category products view) instead of
    // editing a single product. Takes { categoryId, orderedIds }: the
    // product ids in their new top-to-bottom order for that category.
    if (req.method === "PATCH" && req.query.reorder) {
      const b = await readBody(req);
      const categoryId = Number(b.categoryId);
      const orderedIds = Array.isArray(b.orderedIds) ? b.orderedIds.map(Number).filter(Number.isFinite) : [];
      if (!categoryId || !orderedIds.length) { res.status(400).json({ error: "Missing categoryId or orderedIds" }); return; }
      // UPDATE ... FROM unnest() WITH ORDINALITY assigns each product its
      // 1-based position in the array in one round trip, instead of one
      // UPDATE per row.
      await sql`
        UPDATE product_categories pc
        SET sort_order = ord.position
        FROM unnest(${orderedIds}::int[]) WITH ORDINALITY AS ord(product_id, position)
        WHERE pc.category_id = ${categoryId} AND pc.product_id = ord.product_id
      `;
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "PATCH") {
      const pid = Number(req.query.id);
      if (!pid) { res.status(400).json({ error: "Missing id" }); return; }
      const b = await readBody(req);
      const name = String(b.name || "").trim();
      let slug = String(b.slug || "").trim();
      if (!name || !slug) { res.status(400).json({ error: "Name and slug are required." }); return; }
      slug = await uniqueSlug(slug, pid);

      const categoryIds = Array.isArray(b.categoryIds) ? b.categoryIds : [];
      const primaryCategory = categoryIds.length ? Number(categoryIds[0]) : null;
      const categoryIdInts = categoryIds.map((c) => Number(c)).filter((n) => Number.isFinite(n));

      // One statement (CTE) instead of UPDATE, then a separate DELETE,
      // then a loop of INSERTs — so a mid-sequence failure (bad category
      // id, dropped connection, two saves racing on the same product)
      // can't leave the row updated but its category links stale/empty,
      // which is what a generic 500 on just this step would have looked
      // like to the person saving.
      //
      // Dropped links are removed and kept/new ones are upserted via
      // ON CONFLICT DO NOTHING — a plain DELETE-then-INSERT would reset
      // sort_order to its default on every save, undoing any dashboard
      // drag-and-drop reordering each time the product form is reopened.
      await sql`
        WITH updated AS (
          UPDATE products SET
            name = ${name}, name_ar = ${b.nameAr ? String(b.nameAr).trim() : null}, slug = ${slug},
            description = ${b.description ? String(b.description) : null},
            description_ar = ${b.descriptionAr ? String(b.descriptionAr) : null},
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
        dropped AS (
          DELETE FROM product_categories
          WHERE product_id = ${pid} AND NOT (category_id = ANY(${categoryIdInts}::int[]))
        )
        INSERT INTO product_categories (product_id, category_id)
        SELECT ${pid}, cid FROM unnest(${categoryIdInts}::int[]) AS cid
        ON CONFLICT (product_id, category_id) DO NOTHING
      `;
      res.status(200).json({ ok: true, slug });
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

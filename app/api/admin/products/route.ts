import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

function slugify(name: string) {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(b.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const slug = String(b.slug || slugify(name));
  const categoryIds = Array.isArray(b.categoryIds) ? (b.categoryIds as number[]) : [];
  const primaryCategory = categoryIds.length ? Number(categoryIds[0]) : null;
  const num = (x: unknown) => (x === "" || x === null || x === undefined ? null : Number(x));

  try {
    const rows = (await sql`
      INSERT INTO products (
        name, slug, description, price, compare_at_price, category_id, material,
        colors, color_options, variants, size_cm, image_urls, badge,
        sale_percent, sale_label, stock_qty, low_stock_threshold,
        is_new_arrival, status, sku, pricing_mode, price_per_piece, set_size
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
        ${num(b.pricePerPiece)}, ${num(b.setSize)}
      ) RETURNING id, slug
    `) as { id: number; slug: string }[];

    const id = rows[0].id;
    for (const cid of categoryIds) {
      await sql`INSERT INTO product_categories (product_id, category_id) VALUES (${id}, ${Number(cid)}) ON CONFLICT DO NOTHING`;
    }

    return NextResponse.json({ ok: true, id, slug: rows[0].slug });
  } catch (err: unknown) {
    console.error(err);
    const message =
      err instanceof Error && err.message.includes("duplicate")
        ? "A product with this slug already exists."
        : "Failed to create product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

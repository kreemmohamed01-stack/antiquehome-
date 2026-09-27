import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const pid = Number(id);

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(b.name || "").trim();
  const slug = String(b.slug || "").trim();
  if (!name || !slug) {
    return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
  }

  const categoryIds = Array.isArray(b.categoryIds) ? (b.categoryIds as number[]) : [];
  const primaryCategory = categoryIds.length ? Number(categoryIds[0]) : null;
  const num = (x: unknown) => (x === "" || x === null || x === undefined ? null : Number(x));

  try {
    await sql`
      UPDATE products SET
        name = ${name},
        slug = ${slug},
        description = ${b.description ? String(b.description) : null},
        price = ${Number(b.price) || 0},
        compare_at_price = ${num(b.compareAtPrice)},
        category_id = ${primaryCategory},
        material = ${b.material ? String(b.material) : null},
        colors = ${JSON.stringify(Array.isArray(b.colors) ? b.colors : [])},
        color_options = ${JSON.stringify(Array.isArray(b.colorOptions) ? b.colorOptions : [])},
        variants = ${JSON.stringify(Array.isArray(b.variants) ? b.variants : [])},
        size_cm = ${b.sizeCm ? String(b.sizeCm) : null},
        image_urls = ${JSON.stringify(Array.isArray(b.imageUrls) ? b.imageUrls : [])},
        badge = ${b.badge ? String(b.badge) : null},
        sale_percent = ${num(b.salePercent)},
        sale_label = ${b.saleLabel ? String(b.saleLabel) : null},
        stock_qty = ${Number(b.stockQty) || 0},
        low_stock_threshold = ${Number(b.lowStockThreshold) || 5},
        is_new_arrival = ${Boolean(b.isNewArrival)},
        status = ${b.status ? String(b.status) : "active"},
        sku = ${b.sku ? String(b.sku) : null},
        pricing_mode = ${b.pricingMode ? String(b.pricingMode) : "unit"},
        price_per_piece = ${num(b.pricePerPiece)},
        set_size = ${num(b.setSize)}
      WHERE id = ${pid}
    `;

    await sql`DELETE FROM product_categories WHERE product_id = ${pid}`;
    for (const cid of categoryIds) {
      await sql`INSERT INTO product_categories (product_id, category_id) VALUES (${pid}, ${Number(cid)}) ON CONFLICT DO NOTHING`;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update product." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await sql`DELETE FROM products WHERE id = ${Number(id)}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete product." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const slug = String(body.slug || slugify(name));
  const price = parseFloat(String(body.price)) || 0;
  const compareAtPrice = body.compareAtPrice ? parseFloat(String(body.compareAtPrice)) : null;
  const categoryId = body.categoryId ? Number(body.categoryId) : null;
  const description = body.description ? String(body.description) : null;
  const material = body.material ? String(body.material) : null;
  const sizeCm = body.sizeCm ? String(body.sizeCm) : null;
  const badge = body.badge ? String(body.badge) : null;
  const stockQty = body.stockQty !== undefined ? Number(body.stockQty) : 0;
  const colors = Array.isArray(body.colors) ? body.colors : [];
  const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls : [];

  try {
    const rows = await sql`
      INSERT INTO products (name, slug, description, price, compare_at_price, category_id, material, colors, size_cm, image_urls, badge, stock_qty)
      VALUES (${name}, ${slug}, ${description}, ${price}, ${compareAtPrice}, ${categoryId}, ${material}, ${JSON.stringify(colors)}, ${sizeCm}, ${JSON.stringify(imageUrls)}, ${badge}, ${stockQty})
      RETURNING id, slug
    `;
    return NextResponse.json({ ok: true, id: rows[0].id, slug: rows[0].slug });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error && err.message.includes("duplicate")
      ? "A product with this slug already exists."
      : "Failed to create product.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

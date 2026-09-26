import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const slug = String(body.slug || "").trim();
  if (!name || !slug) return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });

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
    await sql`
      UPDATE products SET
        name = ${name}, slug = ${slug}, description = ${description},
        price = ${price}, compare_at_price = ${compareAtPrice}, category_id = ${categoryId},
        material = ${material}, colors = ${JSON.stringify(colors)}, size_cm = ${sizeCm},
        image_urls = ${JSON.stringify(imageUrls)}, badge = ${badge}, stock_qty = ${stockQty}
      WHERE id = ${Number(id)}
    `;
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

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

  let body: { name?: string; imageUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  const slug = slugify(name);

  try {
    const maxRow = (await sql`SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM categories`) as { next: number }[];
    await sql`
      INSERT INTO categories (slug, name, image_url, sort_order)
      VALUES (${slug}, ${name}, ${body.imageUrl || null}, ${maxRow[0].next})
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create category (slug may already exist)." }, { status: 500 });
  }
}

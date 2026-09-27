import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { heroTitle?: string; heroSubtitle?: string; heroText?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const value = {
    heroTitle: (body.heroTitle || "").trim(),
    heroSubtitle: (body.heroSubtitle || "").trim(),
    heroText: (body.heroText || "").trim(),
  };

  try {
    await sql`
      INSERT INTO settings (key, value)
      VALUES ('about_content', ${JSON.stringify(value)}::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save content." }, { status: 500 });
  }
}

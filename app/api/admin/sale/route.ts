import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { active?: boolean; percent?: number; label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const active = Boolean(body.active);
  const percent = Math.max(0, Math.min(90, Number(body.percent) || 0));
  const label = (body.label || "").trim();

  try {
    await sql`
      INSERT INTO settings (key, value)
      VALUES ('site_sale', ${JSON.stringify({ active, percent, label })}::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update sale settings." }, { status: 500 });
  }
}

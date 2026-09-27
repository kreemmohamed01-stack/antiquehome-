import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { code?: string; percent?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = (body.code || "").trim().toUpperCase();
  const percent = Number(body.percent);
  if (!code || !percent || percent <= 0 || percent > 90) {
    return NextResponse.json({ error: "Enter a code and a percent between 1 and 90." }, { status: 400 });
  }

  try {
    await sql`
      INSERT INTO coupons (code, percent, active) VALUES (${code}, ${percent}, true)
      ON CONFLICT (code) DO UPDATE SET percent = EXCLUDED.percent, active = true
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save coupon." }, { status: 500 });
  }
}

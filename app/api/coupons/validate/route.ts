import { NextRequest, NextResponse } from "next/server";
import { sql, type Coupon } from "@/lib/db";

export async function POST(req: NextRequest) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const code = (body.code || "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Enter a coupon code." }, { status: 400 });

  try {
    const rows = (await sql`SELECT * FROM coupons WHERE code = ${code} AND active = true`) as Coupon[];
    if (!rows.length) {
      return NextResponse.json({ error: "This coupon code is not valid." }, { status: 404 });
    }
    return NextResponse.json({ code: rows[0].code, percent: parseFloat(rows[0].percent) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to validate coupon." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { sql, type ShippingRate } from "@/lib/db";

export async function GET() {
  try {
    const rows = (await sql`SELECT * FROM shipping_rates ORDER BY sort_order`) as ShippingRate[];
    return NextResponse.json({ rates: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ rates: [] }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** Wipes every row that was seeded as demo data. */
export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await sql`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE is_demo = true)`;
    const res = (await sql`DELETE FROM orders WHERE is_demo = true RETURNING id`) as { id: number }[];
    await sql`DELETE FROM products WHERE is_demo = true`;
    return NextResponse.json({ ok: true, removed: res.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to remove demo data." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { sql, type Order, type OrderItem } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const orders = (await sql`SELECT * FROM orders WHERE id = ${Number(id)} OR order_number = ${id}`) as Order[];
    if (!orders.length) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const order = orders[0];
    const items = (await sql`SELECT * FROM order_items WHERE order_id = ${order.id}`) as OrderItem[];
    return NextResponse.json({ order, items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { status: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowed = ["pending", "processing", "shipped", "delivered"];
  if (!allowed.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    await sql`UPDATE orders SET status = ${body.status} WHERE id = ${Number(id)}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

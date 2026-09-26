import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

type IncomingItem = {
  productId?: number | null;
  name: string;
  price: number;
  image?: string;
  qty: number;
};

export async function POST(req: NextRequest) {
  let body: {
    email: string;
    fullName: string;
    phone: string;
    governorate?: string;
    city?: string;
    address?: string;
    delivery: string;
    payment: string;
    notes?: string;
    items: IncomingItem[];
    subtotal: number;
    shipping: number;
    discount?: number;
    total: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.email || !body.fullName || !body.phone || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const orderNumber = "AH-" + Date.now().toString(36).toUpperCase().slice(-8);

  try {
    const orderRows = (await sql`
      INSERT INTO orders (
        order_number, customer_name, email, phone, governorate, city, address,
        delivery_method, payment_method, notes, subtotal, shipping, discount, total, status
      ) VALUES (
        ${orderNumber}, ${body.fullName}, ${body.email}, ${body.phone},
        ${body.governorate || null}, ${body.city || null}, ${body.address || null},
        ${body.delivery}, ${body.payment}, ${body.notes || null},
        ${body.subtotal}, ${body.shipping}, ${body.discount || 0}, ${body.total}, 'pending'
      ) RETURNING id, order_number
    `) as { id: number; order_number: string }[];

    const order = orderRows[0];

    for (const item of body.items) {
      await sql`
        INSERT INTO order_items (order_id, product_id, name_snapshot, price_snapshot, image_snapshot, qty)
        VALUES (${order.id}, ${item.productId ?? null}, ${item.name}, ${item.price}, ${item.image || null}, ${item.qty})
      `;
      if (item.productId) {
        await sql`UPDATE products SET stock_qty = GREATEST(0, stock_qty - ${item.qty}) WHERE id = ${item.productId}`;
      }
    }

    return NextResponse.json({ id: order.id, orderNumber: order.order_number });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

import { sql, type Order } from "@/lib/db";
import OrdersManager from "@/app/components/admin/OrdersManager";

export const revalidate = 0;
export const metadata = { title: "Orders — Antique Home Admin" };

async function getOrders() {
  try {
    return (await sql`
      SELECT o.*,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id)::int AS item_count,
        COALESCE(
          (SELECT json_agg(oi.image_snapshot) FROM order_items oi
            WHERE oi.order_id = o.id AND oi.image_snapshot IS NOT NULL),
          '[]'::json
        ) AS thumbs
      FROM orders o
      ORDER BY o.created_at DESC
    `) as (Order & { item_count: number; thumbs: string[] })[];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export default async function AdminOrdersPage() {
  const orders = await getOrders();
  return <OrdersManager orders={orders} />;
}

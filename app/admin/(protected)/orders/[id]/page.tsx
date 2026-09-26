import { notFound } from "next/navigation";
import { sql, type Order, type OrderItem } from "@/lib/db";
import OrderStatusSelect from "@/app/components/admin/OrderStatusSelect";

export const revalidate = 0;
export const metadata = { title: "Order Detail — Antique Home Admin" };

function fmt(n: string | number) {
  return "EGP " + Math.round(typeof n === "string" ? parseFloat(n) : n).toLocaleString("en-US");
}

async function getOrder(id: string) {
  try {
    const orders = (await sql`SELECT * FROM orders WHERE id = ${Number(id)}`) as Order[];
    if (!orders.length) return null;
    const order = orders[0];
    const items = (await sql`SELECT * FROM order_items WHERE order_id = ${order.id}`) as OrderItem[];
    return { order, items };
  } catch {
    return null;
  }
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getOrder(id);
  if (!data) notFound();
  const { order, items } = data;

  return (
    <div className="admin__panel">
      <div className="admin__panel-head">
        <h2 className="admin__panel-title">Order {order.order_number}</h2>
        <OrderStatusSelect id={order.id} status={order.status} />
      </div>

      <div className="admin__row admin__row--2" style={{ marginBottom: 20 }}>
        <div>
          <h3 style={{ color: "var(--a-gold)", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
            Customer
          </h3>
          <p style={{ margin: "0 0 3px", fontSize: 13 }}>{order.customer_name}</p>
          <p style={{ margin: "0 0 3px", fontSize: 12, color: "var(--a-text-dim)" }}>{order.email}</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--a-text-dim)" }}>{order.phone}</p>
        </div>
        <div>
          <h3 style={{ color: "var(--a-gold)", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
            Shipping
          </h3>
          <p style={{ margin: "0 0 3px", fontSize: 12 }}>{order.address}</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--a-text-dim)" }}>
            {[order.city, order.governorate].filter(Boolean).join(", ")}
          </p>
        </div>
      </div>

      <table className="admin__table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="admin__cellProduct">
                  {item.image_snapshot ? <img src={item.image_snapshot} alt="" /> : null}
                  <span>{item.name_snapshot}</span>
                </div>
              </td>
              <td>{item.qty}</td>
              <td>{fmt(item.price_snapshot)}</td>
              <td>{fmt(parseFloat(item.price_snapshot) * item.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ maxWidth: 280, marginLeft: "auto", marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--a-text-dim)", marginBottom: 6 }}>
          <span>Subtotal</span>
          <span>{fmt(order.subtotal)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--a-text-dim)", marginBottom: 6 }}>
          <span>Shipping</span>
          <span>{parseFloat(order.shipping) === 0 ? "Free" : fmt(order.shipping)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--a-cream)",
            paddingTop: 10,
            borderTop: "1px solid var(--a-border)",
          }}
        >
          <span>Total</span>
          <span>{fmt(order.total)}</span>
        </div>
      </div>

      {order.notes ? (
        <div style={{ marginTop: 20, padding: 14, borderRadius: 9, background: "var(--a-panel-2)" }}>
          <h3 style={{ color: "var(--a-gold)", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
            Notes
          </h3>
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--a-text-dim)" }}>{order.notes}</p>
        </div>
      ) : null}
    </div>
  );
}

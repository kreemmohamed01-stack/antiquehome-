import { notFound } from "next/navigation";
import Link from "next/link";
import { sql, type Order, type OrderItem } from "@/lib/db";
import OrderStatusSelect from "@/app/components/admin/OrderStatusSelect";

export const revalidate = 0;
export const metadata = { title: "Order Detail — Antique Home Admin" };

function fmt(n: string | number) {
  return "EGP " + Math.round(typeof n === "string" ? parseFloat(n) : n).toLocaleString("en-US");
}

const STEPS = ["pending", "processing", "shipped", "delivered"] as const;

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

  const reachedIdx = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const placed = new Date(order.created_at);

  return (
    <>
      <div className="admin__pageHead">
        <img src={items[0]?.image_snapshot || "/sec 2/main sec 2.jpeg"} alt="" />
        <div className="admin__pageHead-body">
          <p className="admin__crumb">
            <Link href="/admin/orders">Orders</Link>
            <svg viewBox="0 0 12 8" aria-hidden="true"><polyline points="1,1.5 6,6.5 11,1.5" transform="rotate(-90 6 4)" fill="none" /></svg>
            <span>{order.order_number}</span>
          </p>
          <h1 className="admin__pageTitle">Order {order.order_number}</h1>
          <p className="admin__pageSub">
            Placed on {placed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} at{" "}
            {placed.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="admin__pageHead-actions">
          <OrderStatusSelect id={order.id} status={order.status} />
        </div>
      </div>

      <div className="admin__panel">
        <div className="admin__timeline">
          {STEPS.map((s, i) => (
            <div key={s} className={`admin__tstep${reachedIdx >= i ? " is-done" : ""}`}>
              <span className="admin__tdot">
                <svg viewBox="0 0 12 10"><polyline points="1,5 4.5,8.5 11,1.5" /></svg>
              </span>
              <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
            </div>
          ))}
        </div>

        <div className="admin__row admin__row--2" style={{ marginBottom: 20 }}>
          <div className="admin__formCard" style={{ marginBottom: 0 }}>
            <div className="admin__formCard-head">
              <span className="admin__formCard-ico">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></svg>
              </span>
              <span className="admin__formCard-title">Customer</span>
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 13.5, color: "var(--a-cream)" }}>{order.customer_name}</p>
            <p style={{ margin: "0 0 3px", fontSize: 12, color: "var(--a-text-dim)" }}>{order.email}</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--a-text-dim)" }}>{order.phone}</p>
          </div>

          <div className="admin__formCard" style={{ marginBottom: 0 }}>
            <div className="admin__formCard-head">
              <span className="admin__formCard-ico">
                <svg viewBox="0 0 24 24"><path d="M12 21.4S5 15 5 9.8a7 7 0 0 1 14 0c0 5.2-7 11.6-7 11.6Z" /><circle cx="12" cy="9.6" r="2.6" /></svg>
              </span>
              <span className="admin__formCard-title">Shipping Address</span>
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 12.5, color: "var(--a-cream)" }}>{order.address}</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--a-text-dim)" }}>
              {[order.city, order.governorate].filter(Boolean).join(", ")}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "var(--a-text-dim)" }}>
              {order.delivery_method}
              {order.courier ? ` · ${order.courier}` : ""}
              {order.tracking_number ? ` · ${order.tracking_number}` : ""}
            </p>
          </div>
        </div>

        <div className="admin__formCard">
          <div className="admin__formCard-head">
            <span className="admin__formCard-ico">
              <svg viewBox="0 0 24 24"><path d="M5.6 7.8h12.8l1 12.4H4.6z" /><path d="M8.9 9.6V6.6a3.1 3.1 0 0 1 6.2 0v3" /></svg>
            </span>
            <span className="admin__formCard-title">Order Items ({items.length})</span>
          </div>
          {items.map((item) => (
            <div className="admin__prow" key={item.id}>
              {item.image_snapshot ? <img src={item.image_snapshot} alt="" /> : null}
              <div className="admin__prow-main">
                <div className="admin__prow-name">{item.name_snapshot}</div>
                <div className="admin__prow-sku">
                  {[item.color_name, item.variant_label].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <div style={{ flex: "none", textAlign: "right" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--a-cream)" }}>
                  {fmt(parseFloat(item.price_snapshot) * item.qty)}
                </div>
                <div className="admin__prow-sku">Qty: {item.qty}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="admin__formCard" style={{ marginBottom: 0 }}>
          <div className="admin__formCard-head">
            <span className="admin__formCard-ico">
              <svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12.4" rx="1.8" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </span>
            <span className="admin__formCard-title">Order Summary</span>
          </div>
          <div style={{ maxWidth: 320, marginLeft: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--a-text-dim)", marginBottom: 7 }}>
              <span>Subtotal ({items.length} items)</span><span>{fmt(order.subtotal)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--a-green)", marginBottom: 7 }}>
                <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
                <span>- {fmt(order.discount)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--a-text-dim)", marginBottom: 7 }}>
              <span>Shipping</span><span>{Number(order.shipping) === 0 ? "Free" : fmt(order.shipping)}</span>
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              paddingTop: 11, borderTop: "1px solid var(--a-border)",
              fontSize: 16, fontWeight: 700, color: "var(--a-cream)",
            }}>
              <span>Total</span><span>{fmt(order.total)}</span>
            </div>
            <p style={{ textAlign: "right", fontSize: 11, color: "var(--a-text-dim)", marginTop: 8 }}>
              {order.payment_method} · {order.payment_status === "paid" ? "Paid" : "Payment pending"}
            </p>
          </div>
        </div>

        {order.notes ? (
          <div className="admin__formCard" style={{ marginTop: 16, marginBottom: 0 }}>
            <div className="admin__formCard-head">
              <span className="admin__formCard-title">Notes</span>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--a-text-dim)" }}>{order.notes}</p>
          </div>
        ) : null}
      </div>
    </>
  );
}

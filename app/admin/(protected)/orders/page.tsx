import Link from "next/link";
import { sql, type Order } from "@/lib/db";

export const revalidate = 0;
export const metadata = { title: "Orders — Antique Home Admin" };

function fmt(n: string | number) {
  return "EGP " + Math.round(typeof n === "string" ? parseFloat(n) : n).toLocaleString("en-US");
}

function pillClass(status: string) {
  switch (status) {
    case "delivered":
      return "admin__pill admin__pill--delivered";
    case "shipped":
      return "admin__pill admin__pill--shipped";
    case "processing":
      return "admin__pill admin__pill--processing";
    default:
      return "admin__pill admin__pill--pending";
  }
}

async function getOrders() {
  try {
    return (await sql`SELECT * FROM orders ORDER BY created_at DESC`) as Order[];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return (
    <>
      <div className="admin__panel-head" style={{ marginBottom: 0 }}>
        <h2 className="admin__panel-title">Orders</h2>
      </div>

      <div className="admin__panel">
        {orders.length > 0 ? (
          <table className="admin__table">
            <thead>
              <tr>
                <th># Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.order_number}</td>
                  <td>{o.customer_name}</td>
                  <td>{fmt(o.total)}</td>
                  <td>
                    <span className={pillClass(o.status)}>
                      {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                    </span>
                  </td>
                  <td>{new Date(o.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="admin__btn" style={{ padding: "6px 12px" }}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "var(--a-text-dim)" }}>
            No orders yet.
          </div>
        )}
      </div>
    </>
  );
}

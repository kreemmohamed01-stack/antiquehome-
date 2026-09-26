import { sql } from "@/lib/db";

export const revalidate = 0;
export const metadata = { title: "Customers — Antique Home Admin" };

function fmt(n: number) {
  return "EGP " + Math.round(n).toLocaleString("en-US");
}

async function getCustomers() {
  try {
    return (await sql`
      SELECT
        email,
        MAX(customer_name) AS name,
        MAX(phone) AS phone,
        COUNT(*)::int AS order_count,
        SUM(total)::float AS total_spent,
        MAX(created_at) AS last_order
      FROM orders
      GROUP BY email
      ORDER BY total_spent DESC
    `) as {
      email: string;
      name: string;
      phone: string;
      order_count: number;
      total_spent: number;
      last_order: string;
    }[];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export default async function AdminCustomersPage() {
  const customers = await getCustomers();

  return (
    <>
      <div className="admin__panel-head" style={{ marginBottom: 0 }}>
        <h2 className="admin__panel-title">Customers</h2>
      </div>

      <div className="admin__panel">
        {customers.length > 0 ? (
          <table className="admin__table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Last Order</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.email}>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.order_count}</td>
                  <td>{fmt(c.total_spent)}</td>
                  <td>{new Date(c.last_order).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "var(--a-text-dim)" }}>
            No customers yet — they&rsquo;ll appear here once orders come in.
          </div>
        )}
      </div>
    </>
  );
}

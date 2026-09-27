import { sql } from "@/lib/db";

export const revalidate = 0;
export const metadata = { title: "Analytics — Antique Home Admin" };

function fmt(n: number) {
  return "EGP " + Math.round(n).toLocaleString("en-US");
}

async function getAnalytics() {
  const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch (err) {
      console.error(err);
      return fallback;
    }
  };

  const byStatus = await safe(
    async () =>
      (await sql`SELECT status, COUNT(*)::int AS count, COALESCE(SUM(total),0)::float AS total FROM orders GROUP BY status`) as {
        status: string;
        count: number;
        total: number;
      }[],
    []
  );

  const byGovernorate = await safe(
    async () =>
      (await sql`
        SELECT governorate, COUNT(*)::int AS count, COALESCE(SUM(total),0)::float AS total
        FROM orders WHERE governorate IS NOT NULL
        GROUP BY governorate ORDER BY total DESC LIMIT 10
      `) as { governorate: string; count: number; total: number }[],
    []
  );

  const repeatCustomers = await safe(
    async () =>
      (await sql`
        SELECT COUNT(*)::int AS count FROM (
          SELECT email FROM orders GROUP BY email HAVING COUNT(*) > 1
        ) t
      `) as { count: number }[],
    [{ count: 0 }]
  );

  const bestDay = await safe(
    async () =>
      (await sql`
        SELECT to_char(date_trunc('day', created_at), 'FMDay, DD Mon YYYY') AS day, SUM(total)::float AS total
        FROM orders GROUP BY 1 ORDER BY total DESC LIMIT 1
      `) as { day: string; total: number }[],
    []
  );

  const avgItemsPerOrder = await safe(
    async () =>
      (await sql`
        SELECT COALESCE(AVG(item_count), 0)::float AS avg FROM (
          SELECT order_id, SUM(qty) AS item_count FROM order_items GROUP BY order_id
        ) t
      `) as { avg: number }[],
    [{ avg: 0 }]
  );

  return { byStatus, byGovernorate, repeatCustomers: repeatCustomers[0]?.count ?? 0, bestDay: bestDay[0] || null, avgItemsPerOrder: avgItemsPerOrder[0]?.avg ?? 0 };
}

export default async function AdminAnalyticsPage() {
  const { byStatus, byGovernorate, repeatCustomers, bestDay, avgItemsPerOrder } = await getAnalytics();

  return (
    <>
      <div className="admin__stats" style={{ marginBottom: 18 }}>
        <div className="admin__stat">
          <div className="admin__stat-label" style={{ marginBottom: 8 }}>Repeat Customers</div>
          <div className="admin__stat-value">{repeatCustomers}</div>
        </div>
        <div className="admin__stat">
          <div className="admin__stat-label" style={{ marginBottom: 8 }}>Avg. Items / Order</div>
          <div className="admin__stat-value">{avgItemsPerOrder.toFixed(1)}</div>
        </div>
        <div className="admin__stat">
          <div className="admin__stat-label" style={{ marginBottom: 8 }}>Best Sales Day</div>
          <div className="admin__stat-value" style={{ fontSize: 14 }}>{bestDay ? bestDay.day : "—"}</div>
        </div>
        <div className="admin__stat">
          <div className="admin__stat-label" style={{ marginBottom: 8 }}>Best Day Revenue</div>
          <div className="admin__stat-value">{bestDay ? fmt(bestDay.total) : "—"}</div>
        </div>
      </div>

      <div className="admin__row admin__row--2">
        <div className="admin__panel">
          <div className="admin__panel-head">
            <h2 className="admin__panel-title">Orders by Status</h2>
          </div>
          {byStatus.length > 0 ? (
            <table className="admin__table">
              <thead>
                <tr><th>Status</th><th>Orders</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {byStatus.map((s) => (
                  <tr key={s.status}>
                    <td style={{ textTransform: "capitalize" }}>{s.status}</td>
                    <td>{s.count}</td>
                    <td>{fmt(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: "center", color: "var(--a-text-dim)", fontSize: 12, padding: "20px 0" }}>No orders yet.</p>
          )}
        </div>

        <div className="admin__panel">
          <div className="admin__panel-head">
            <h2 className="admin__panel-title">Top Governorates</h2>
          </div>
          {byGovernorate.length > 0 ? (
            <table className="admin__table">
              <thead>
                <tr><th>Governorate</th><th>Orders</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {byGovernorate.map((g) => (
                  <tr key={g.governorate}>
                    <td>{g.governorate}</td>
                    <td>{g.count}</td>
                    <td>{fmt(g.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: "center", color: "var(--a-text-dim)", fontSize: 12, padding: "20px 0" }}>No orders yet.</p>
          )}
        </div>
      </div>
    </>
  );
}

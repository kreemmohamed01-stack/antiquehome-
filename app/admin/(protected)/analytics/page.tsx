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

  // Real human visitor traffic — is_admin=false filters out dashboard
  // sessions, and the /api/track route already drops bot user-agents
  // before any row is written.
  const visitorSummary = await safe(
    async () =>
      (await sql`
        SELECT
          COUNT(DISTINCT visitor_id) FILTER (WHERE created_at >= now() - interval '5 minutes')::int AS live,
          COUNT(DISTINCT visitor_id) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS today_visitors,
          COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS today_views,
          COUNT(DISTINCT visitor_id) FILTER (WHERE created_at >= date_trunc('week', now()))::int AS week_visitors,
          COUNT(*) FILTER (WHERE created_at >= date_trunc('week', now()))::int AS week_views,
          COUNT(DISTINCT visitor_id) FILTER (WHERE created_at >= date_trunc('month', now()))::int AS month_visitors,
          COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now()))::int AS month_views,
          COUNT(DISTINCT visitor_id)::int AS all_time_visitors,
          COUNT(*)::int AS all_time_views
        FROM visits WHERE is_admin = false
      `) as {
        live: number; today_visitors: number; today_views: number;
        week_visitors: number; week_views: number;
        month_visitors: number; month_views: number;
        all_time_visitors: number; all_time_views: number;
      }[],
    [{ live: 0, today_visitors: 0, today_views: 0, week_visitors: 0, week_views: 0, month_visitors: 0, month_views: 0, all_time_visitors: 0, all_time_views: 0 }]
  );

  const dailyVisitors = await safe(
    async () =>
      (await sql`
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
               COUNT(DISTINCT visitor_id)::int AS visitors,
               COUNT(*)::int AS views
        FROM visits
        WHERE is_admin = false AND created_at >= now() - interval '14 days'
        GROUP BY 1 ORDER BY 1
      `) as { day: string; visitors: number; views: number }[],
    []
  );

  const topPages = await safe(
    async () =>
      (await sql`
        SELECT path, COUNT(*)::int AS views, COUNT(DISTINCT visitor_id)::int AS visitors
        FROM visits
        WHERE is_admin = false AND created_at >= now() - interval '30 days'
        GROUP BY path ORDER BY views DESC LIMIT 8
      `) as { path: string; views: number; visitors: number }[],
    []
  );

  return {
    byStatus, byGovernorate,
    repeatCustomers: repeatCustomers[0]?.count ?? 0,
    bestDay: bestDay[0] || null,
    avgItemsPerOrder: avgItemsPerOrder[0]?.avg ?? 0,
    visitors: visitorSummary[0],
    dailyVisitors, topPages,
  };
}

export default async function AdminAnalyticsPage() {
  const { byStatus, byGovernorate, repeatCustomers, bestDay, avgItemsPerOrder, visitors, dailyVisitors, topPages } = await getAnalytics();
  const maxDaily = Math.max(1, ...dailyVisitors.map((d) => d.visitors));

  return (
    <>
      <div className="admin__pageHead" style={{ marginBottom: 18 }}>
        <img src="/sec 2/main sec 2.jpeg" alt="" />
        <div className="admin__pageHead-body">
          <p className="admin__crumb"><span>Dashboard</span></p>
          <h1 className="admin__pageTitle">Analytics</h1>
          <p className="admin__pageSub">Real visitor traffic and sales performance — bots are filtered out automatically.</p>
        </div>
      </div>

      <div className="admin__panel-head" style={{ marginBottom: 8 }}>
        <h2 className="admin__panel-title">Visitor Traffic</h2>
      </div>
      <div className="admin__statStrip admin__statStrip--5" style={{ marginBottom: 18 }}>
        <div className="admin__stat">
          <div className="admin__stat-top">
            <span className="admin__stat-label">Live Now</span>
            <span className="admin__stat-icon" style={{ color: "var(--a-green)", background: "rgba(111,163,107,.14)" }}>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /></svg>
            </span>
          </div>
          <div className="admin__stat-value" style={{ color: visitors.live > 0 ? "var(--a-green)" : undefined }}>{visitors.live}</div>
        </div>
        <div className="admin__stat">
          <div className="admin__stat-top">
            <span className="admin__stat-label">Today</span>
          </div>
          <div className="admin__stat-value">{visitors.today_visitors}</div>
          <div style={{ fontSize: 11, color: "var(--a-text-dim)", marginTop: 2 }}>{visitors.today_views} views</div>
        </div>
        <div className="admin__stat">
          <div className="admin__stat-top">
            <span className="admin__stat-label">This Week</span>
          </div>
          <div className="admin__stat-value">{visitors.week_visitors}</div>
          <div style={{ fontSize: 11, color: "var(--a-text-dim)", marginTop: 2 }}>{visitors.week_views} views</div>
        </div>
        <div className="admin__stat">
          <div className="admin__stat-top">
            <span className="admin__stat-label">This Month</span>
          </div>
          <div className="admin__stat-value">{visitors.month_visitors}</div>
          <div style={{ fontSize: 11, color: "var(--a-text-dim)", marginTop: 2 }}>{visitors.month_views} views</div>
        </div>
        <div className="admin__stat">
          <div className="admin__stat-top">
            <span className="admin__stat-label">All Time</span>
          </div>
          <div className="admin__stat-value">{visitors.all_time_visitors}</div>
          <div style={{ fontSize: 11, color: "var(--a-text-dim)", marginTop: 2 }}>{visitors.all_time_views} views</div>
        </div>
      </div>

      <div className="admin__row admin__row--2" style={{ marginBottom: 18 }}>
        <div className="admin__panel">
          <div className="admin__panel-head">
            <h2 className="admin__panel-title">Visitors — Last 14 Days</h2>
          </div>
          {dailyVisitors.length > 0 ? (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140, padding: "10px 0" }}>
              {dailyVisitors.map((d) => (
                <div key={d.day} title={`${d.day}: ${d.visitors} visitors, ${d.views} views`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 22,
                      height: Math.max(3, (d.visitors / maxDaily) * 110),
                      background: "linear-gradient(180deg, #D9AE63, #B98A3F)",
                      borderRadius: "3px 3px 0 0",
                    }}
                  />
                  <span style={{ fontSize: 9, color: "var(--a-text-dim)" }}>{d.day.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "var(--a-text-dim)", fontSize: 12, padding: "20px 0" }}>No visits recorded yet.</p>
          )}
        </div>

        <div className="admin__panel">
          <div className="admin__panel-head">
            <h2 className="admin__panel-title">Top Pages (30 Days)</h2>
          </div>
          {topPages.length > 0 ? (
            <table className="admin__table">
              <thead><tr><th>Page</th><th>Views</th><th>Visitors</th></tr></thead>
              <tbody>
                {topPages.map((p) => (
                  <tr key={p.path}>
                    <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.path}</td>
                    <td>{p.views}</td>
                    <td>{p.visitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: "center", color: "var(--a-text-dim)", fontSize: 12, padding: "20px 0" }}>No visits recorded yet.</p>
          )}
        </div>
      </div>

      <div className="admin__panel-head" style={{ marginBottom: 8 }}>
        <h2 className="admin__panel-title">Sales</h2>
      </div>
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

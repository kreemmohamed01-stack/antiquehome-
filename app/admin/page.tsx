import Link from "next/link";
import { sql } from "@/lib/db";
import SalesChart from "../components/admin/SalesChart";
import CategoryDonut, { type Slice } from "../components/admin/CategoryDonut";

export const revalidate = 0;
export const metadata = { title: "Dashboard — Antique Home Admin" };

function fmt(n: number) {
  return "EGP " + Math.round(n).toLocaleString("en-US");
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

async function getDashboardData() {
  const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch (err) {
      console.error(err);
      return fallback;
    }
  };

  const totals = await safe(
    async () =>
      (await sql`
        SELECT
          COALESCE(SUM(total), 0)::float AS sales,
          COUNT(*)::int AS orders,
          COUNT(DISTINCT email)::int AS customers
        FROM orders
      `)[0] as { sales: number; orders: number; customers: number },
    { sales: 0, orders: 0, customers: 0 }
  );

  const dailySales = await safe(
    async () =>
      (await sql`
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
               SUM(total)::float AS total
        FROM orders
        WHERE created_at >= now() - interval '30 days'
        GROUP BY 1
        ORDER BY 1
      `) as { day: string; total: number }[],
    []
  );

  const categorySales = await safe(
    async () =>
      (await sql`
        SELECT c.name AS name, COALESCE(SUM(oi.price_snapshot * oi.qty), 0)::float AS revenue
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        JOIN categories c ON c.id = p.category_id
        GROUP BY c.name
        ORDER BY revenue DESC
      `) as { name: string; revenue: number }[],
    []
  );

  const recentOrders = await safe(
    async () =>
      (await sql`
        SELECT o.*, (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id)::int AS item_count
        FROM orders o
        ORDER BY o.created_at DESC
        LIMIT 5
      `) as {
        id: number;
        order_number: string;
        customer_name: string;
        total: string;
        status: string;
        created_at: string;
        item_count: number;
      }[],
    []
  );

  const topProducts = await safe(
    async () =>
      (await sql`
        SELECT p.id, p.name, p.price, p.image_urls,
               SUM(oi.qty)::int AS sold
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        GROUP BY p.id, p.name, p.price, p.image_urls
        ORDER BY sold DESC
        LIMIT 5
      `) as { id: number; name: string; price: string; image_urls: string[]; sold: number }[],
    []
  );

  const lowStock = await safe(
    async () =>
      (await sql`
        SELECT id, name, image_urls, stock_qty
        FROM products
        WHERE stock_qty < 10
        ORDER BY stock_qty ASC
        LIMIT 5
      `) as { id: number; name: string; image_urls: string[]; stock_qty: number }[],
    []
  );

  return { totals, dailySales, categorySales, recentOrders, topProducts, lowStock };
}

export default async function AdminDashboardPage() {
  const { totals, dailySales, categorySales, recentOrders, topProducts, lowStock } = await getDashboardData();

  const chartData = dailySales.map((d) => ({
    date: d.day,
    label: new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: d.total,
  }));

  const categoryTotal = categorySales.reduce((sum, c) => sum + c.revenue, 0);
  const donutSlices: Slice[] = categorySales.slice(0, 6).map((c) => ({
    name: c.name,
    value: c.revenue,
    pct: categoryTotal > 0 ? Math.round((c.revenue / categoryTotal) * 100) : 0,
  }));
  const donutColors = ["#D9AE63", "#B98A3F", "#8A6E48", "#6F93C5", "#6FA36B", "#C5645A"];

  return (
    <>
      <div className="admin__hero">
        <img src="/sec 2/main sec 2.jpeg" alt="" />
        <div className="admin__hero-body">
          <p className="admin__hero-label">Good Evening, Antique Home</p>
          <h1 className="admin__hero-title">Your Store, Your Story.</h1>
          <p className="admin__hero-text">Crafting timeless spaces, one piece at a time.</p>
          <Link href="/" className="admin__hero-btn">
            <span>View Store</span>
            <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
          </Link>
        </div>
        <div className="admin__hero-quote">
          <p>&ldquo;A home should be a collection of what you love.&rdquo;</p>
          <span></span>
        </div>
      </div>

      <div className="admin__statsRow">
        <div className="admin__stats">
          <div className="admin__stat">
            <div className="admin__stat-top">
              <span className="admin__stat-label">Total Sales</span>
              <span className="admin__stat-icon">
                <svg viewBox="0 0 24 24"><line x1="5" y1="19" x2="5" y2="13"></line><line x1="12" y1="19" x2="12" y2="7"></line><line x1="19" y1="19" x2="19" y2="10"></line></svg>
              </span>
            </div>
            <div className="admin__stat-value">{fmt(totals.sales)}</div>
          </div>
          <div className="admin__stat">
            <div className="admin__stat-top">
              <span className="admin__stat-label">Total Orders</span>
              <span className="admin__stat-icon">
                <svg viewBox="0 0 24 24"><path d="M5.6 7.8h12.8l1 12.4H4.6z"></path><path d="M8.9 9.6V6.6a3.1 3.1 0 0 1 6.2 0v3"></path></svg>
              </span>
            </div>
            <div className="admin__stat-value">{totals.orders.toLocaleString("en-US")}</div>
          </div>
          <div className="admin__stat">
            <div className="admin__stat-top">
              <span className="admin__stat-label">Total Customers</span>
              <span className="admin__stat-icon">
                <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.4"></circle><path d="M2.6 19.4c0-3.4 2.9-5.8 6.4-5.8s6.4 2.4 6.4 5.8"></path><circle cx="17.4" cy="9" r="2.4"></circle><path d="M15.4 13.8c2.6.3 4.6 2.2 4.6 5"></path></svg>
              </span>
            </div>
            <div className="admin__stat-value">{totals.customers.toLocaleString("en-US")}</div>
          </div>
          <div className="admin__stat">
            <div className="admin__stat-top">
              <span className="admin__stat-label">Avg. Order Value</span>
              <span className="admin__stat-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.4"></circle><path d="M12 7.6v8.8M9 15.4c0 1.1 1.3 2 3 2s3-.9 3-2-1.3-1.6-3-2-3-.9-3-2 1.3-2 3-2 3 .9 3 2"></path></svg>
              </span>
            </div>
            <div className="admin__stat-value">
              {fmt(totals.orders > 0 ? totals.sales / totals.orders : 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="admin__row admin__row--2">
        <div className="admin__panel">
          <div className="admin__panel-head">
            <h2 className="admin__panel-title">Sales Overview</h2>
            <span className="admin__select">Last 30 Days</span>
          </div>
          {chartData.length > 0 ? (
            <SalesChart data={chartData} />
          ) : (
            <p style={{ color: "var(--a-text-dim)", fontSize: 12.5, padding: "40px 0", textAlign: "center" }}>
              No sales yet — the chart will populate once orders come in.
            </p>
          )}
        </div>

        <div className="admin__panel">
          <div className="admin__panel-head">
            <h2 className="admin__panel-title">Sales by Category</h2>
          </div>
          <CategoryDonut data={donutSlices} total={categoryTotal} />
          {donutSlices.length > 0 ? (
            <ul className="admin__legend" style={{ marginTop: 12 }}>
              {donutSlices.map((s, i) => (
                <li key={s.name}>
                  <span className="dot" style={{ background: donutColors[i % donutColors.length] }}></span>
                  <span className="name">{s.name}</span>
                  <span className="pct">{s.pct}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "var(--a-text-dim)", fontSize: 11.5, marginTop: 12, textAlign: "center" }}>
              No category sales yet.
            </p>
          )}
        </div>
      </div>

      <div className="admin__row admin__row--3">
        <div className="admin__panel">
          <div className="admin__panel-head">
            <h2 className="admin__panel-title">Recent Orders</h2>
            <Link href="/admin/orders" className="admin__panel-link">
              View All
              <svg viewBox="0 0 12 8" width="10" height="7" aria-hidden="true"><polyline points="1,1.5 6,6.5 11,1.5" transform="rotate(-90 6 4)"></polyline></svg>
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <table className="admin__table">
              <thead>
                <tr>
                  <th># Order</th>
                  <th>Customer</th>
                  <th>Products</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.order_number}</td>
                    <td>{o.customer_name}</td>
                    <td>{o.item_count} items</td>
                    <td>{fmt(parseFloat(o.total))}</td>
                    <td>
                      <span className={pillClass(o.status)}>
                        {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: "var(--a-text-dim)", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
              No orders yet.
            </p>
          )}
        </div>

        <div className="admin__panel">
          <div className="admin__panel-head">
            <h2 className="admin__panel-title">Top Selling Products</h2>
            <Link href="/admin/products" className="admin__panel-link">View All</Link>
          </div>
          {topProducts.length > 0 ? (
            <ul className="admin__list">
              {topProducts.map((p, i) => (
                <li key={p.id} className="admin__listRow">
                  <span className="admin__rankNum">{i + 1}</span>
                  <img src={p.image_urls?.[0] || "/logo hero.png"} alt="" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="name">{p.name}</div>
                    <div className="meta">{p.sold} sales</div>
                  </div>
                  <span className="price">{fmt(parseFloat(p.price))}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "var(--a-text-dim)", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
              No sales yet.
            </p>
          )}
        </div>

        <div className="admin__panel">
          <div className="admin__panel-head">
            <h2 className="admin__panel-title">Low Stock Products</h2>
            <Link href="/admin/products" className="admin__panel-link">View All</Link>
          </div>
          {lowStock.length > 0 ? (
            <ul className="admin__list">
              {lowStock.map((p) => (
                <li key={p.id} className="admin__listRow">
                  <img src={p.image_urls?.[0] || "/logo hero.png"} alt="" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="name">{p.name}</div>
                  </div>
                  <span className={p.stock_qty <= 3 ? "admin__pill admin__pill--low" : "admin__pill admin__pill--warn"}>
                    {p.stock_qty} left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "var(--a-text-dim)", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
              No low-stock products.
            </p>
          )}
        </div>
      </div>

      <div className="admin__row admin__row--2">
        <div className="admin__promo">
          <img src="/about/Screenshot 2026-09-26 050451.png" alt="" />
          <div className="admin__promo-body">
            <p className="admin__promo-title">New Arrivals Are Performing Well!</p>
            <Link href="/admin/products" className="admin__promo-btn">
              <span>View Products</span>
              <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
            </Link>
          </div>
        </div>
        <div></div>
      </div>

      <div className="admin__actions">
        <Link href="/admin/products/new" className="admin__action">
          <span className="admin__action-icon">
            <svg viewBox="0 0 24 24"><rect x="4" y="9.4" width="16" height="10.4" rx="1.4"></rect><path d="M8 9.4V7a4 4 0 0 1 8 0v2.4"></path><line x1="12" y1="12.6" x2="12" y2="16.2"></line><line x1="10.2" y1="14.4" x2="13.8" y2="14.4"></line></svg>
          </span>
          <span className="admin__action-title">
            Add Product
            <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
          </span>
          <p className="admin__action-text">Add new products to your store.</p>
        </Link>
        <Link href="/admin/collections" className="admin__action">
          <span className="admin__action-icon">
            <svg viewBox="0 0 24 24"><rect x="3.6" y="3.6" width="7.2" height="7.2" rx="1"></rect><rect x="13.2" y="3.6" width="7.2" height="7.2" rx="1"></rect><rect x="3.6" y="13.2" width="7.2" height="7.2" rx="1"></rect><rect x="13.2" y="13.2" width="7.2" height="7.2" rx="1"></rect></svg>
          </span>
          <span className="admin__action-title">
            Manage Collections
            <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
          </span>
          <p className="admin__action-text">Organize your product collections.</p>
        </Link>
        <Link href="/admin/discounts" className="admin__action">
          <span className="admin__action-icon">
            <svg viewBox="0 0 24 24"><path d="M4.4 11.6 11.6 4.4h7.2v7.2l-7.2 7.2Z"></path><circle cx="15.4" cy="8.6" r="1.5"></circle></svg>
          </span>
          <span className="admin__action-title">
            Create Discount
            <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
          </span>
          <p className="admin__action-text">Set up promotions and discount codes.</p>
        </Link>
        <Link href="/admin/marketing" className="admin__action">
          <span className="admin__action-icon">
            <svg viewBox="0 0 24 24"><path d="M3.4 10.2h4.4l7-5.4v14.4l-7-5.4H3.4Z"></path><path d="M14.8 8.6a4 4 0 0 1 0 6.8"></path></svg>
          </span>
          <span className="admin__action-title">
            Send Campaign
            <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
          </span>
          <p className="admin__action-text">Reach your customers with email campaigns.</p>
        </Link>
        <Link href="/admin/customers" className="admin__action">
          <span className="admin__action-icon">
            <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.4"></circle><path d="M2.6 19.4c0-3.4 2.9-5.8 6.4-5.8s6.4 2.4 6.4 5.8"></path></svg>
          </span>
          <span className="admin__action-title">
            View Customers
            <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
          </span>
          <p className="admin__action-text">Manage and view your customers.</p>
        </Link>
      </div>
    </>
  );
}

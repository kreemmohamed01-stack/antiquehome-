const { sql } = require("./_db.js");
const { getSession } = require("./_auth.js");

async function safe(fn, fallback) {
  try { return await fn(); } catch (err) { console.error(err); return fallback; }
}

module.exports = async (req, res) => {
  const session = getSession(req);
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const totals = await safe(async () => (await sql`
    SELECT COALESCE(SUM(total), 0)::float AS sales, COUNT(*)::int AS orders,
           COUNT(DISTINCT email)::int AS customers
    FROM orders
  `)[0], { sales: 0, orders: 0, customers: 0 });

  const dailySales = await safe(async () => await sql`
    SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, SUM(total)::float AS total
    FROM orders WHERE created_at >= now() - interval '30 days'
    GROUP BY 1 ORDER BY 1
  `, []);

  const categorySales = await safe(async () => await sql`
    SELECT c.name AS name, COALESCE(SUM(oi.price_snapshot * oi.qty), 0)::float AS revenue
    FROM order_items oi JOIN products p ON p.id = oi.product_id
    JOIN categories c ON c.id = p.category_id
    GROUP BY c.name ORDER BY revenue DESC
  `, []);

  const recentOrders = await safe(async () => await sql`
    SELECT o.*, (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id)::int AS item_count
    FROM orders o ORDER BY o.created_at DESC LIMIT 5
  `, []);

  const topProducts = await safe(async () => await sql`
    SELECT p.id, p.name, p.price, p.image_urls, SUM(oi.qty)::int AS sold
    FROM order_items oi JOIN products p ON p.id = oi.product_id
    GROUP BY p.id, p.name, p.price, p.image_urls ORDER BY sold DESC LIMIT 5
  `, []);

  const lowStock = await safe(async () => await sql`
    SELECT id, name, image_urls, stock_qty, low_stock_threshold FROM products
    WHERE stock_qty <= COALESCE(low_stock_threshold, 5) ORDER BY stock_qty ASC LIMIT 5
  `, []);

  const demoCount = await safe(async () =>
    (await sql`SELECT COUNT(*)::int AS c FROM orders WHERE is_demo = true`)[0]?.c ?? 0, 0);

  const visitors = await safe(async () => (await sql`
    SELECT
      COUNT(DISTINCT visitor_id) FILTER (WHERE created_at >= now() - interval '5 minutes')::int AS live,
      COUNT(DISTINCT visitor_id) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS today_visitors,
      COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS today_views,
      COUNT(DISTINCT visitor_id) FILTER (WHERE created_at >= date_trunc('week', now()))::int AS week_visitors,
      COUNT(DISTINCT visitor_id) FILTER (WHERE created_at >= date_trunc('month', now()))::int AS month_visitors,
      COUNT(DISTINCT visitor_id)::int AS all_time_visitors
    FROM visits WHERE is_admin = false
  `)[0], { live: 0, today_visitors: 0, today_views: 0, week_visitors: 0, month_visitors: 0, all_time_visitors: 0 });

  res.status(200).json({ totals, dailySales, categorySales, recentOrders, topProducts, lowStock, demoCount, visitors });
};

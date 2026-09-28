const { sql } = require("./_db.js");
const { getSession } = require("./_auth.js");

async function safe(fn, fallback) {
  try { return await fn(); } catch (err) { console.error(err); return fallback; }
}

// Buckets a path into the "page" categories the funnel/visitor-traffic
// widgets group by, mirroring how the storefront's own routes are named.
function pageBucket(path) {
  if (path === "/" || path === "/index.html") return "Homepage";
  if (path.startsWith("/shop")) return "Shop";
  // covers both the current /product.html?slug=... route and legacy
  // /product?slug=... and /product/<slug> paths from before the static
  // rewrite, so old tracked visits still bucket correctly.
  if (path.startsWith("/product")) return "Product Pages";
  if (path.startsWith("/checkout") || path.startsWith("/order-confirmation")) return "Checkout";
  return "Other";
}

// Buckets a stored referrer URL into a traffic source name. ownHost lets
// an internal referrer (one storefront page linking to another) fall back
// to "Direct" instead of counting the site as its own traffic source.
function hostFromReferrer(ref, ownHost) {
  if (!ref) return "Direct";
  try {
    const h = new URL(ref).hostname.replace(/^www\./, "");
    if (ownHost && h === ownHost) return "Direct";
    if (h.includes("instagram")) return "Instagram";
    if (h.includes("facebook") || h.includes("fb.com") || h.includes("messenger")) return "Facebook";
    if (h.includes("google")) return "Google";
    if (h.includes("whatsapp") || h.includes("wa.me")) return "WhatsApp";
    return h;
  } catch {
    return "Direct";
  }
}

module.exports = async (req, res) => {
  const session = getSession(req);
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  // Range: "today" | "7d" | "30d" | "90d" | "custom" (with from/to ISO dates).
  const range = String(req.query.range || "30d");
  let days = 30;
  if (range === "today") days = 1;
  else if (range === "7d") days = 7;
  else if (range === "90d") days = 90;

  let fromDate, toDate;
  if (range === "custom" && req.query.from && req.query.to) {
    fromDate = new Date(req.query.from + "T00:00:00.000Z");
    toDate = new Date(req.query.to + "T23:59:59.999Z");
  } else {
    toDate = new Date();
    fromDate = new Date(toDate.getTime() - days * 86400000);
  }
  const prevFrom = new Date(fromDate.getTime() - (toDate.getTime() - fromDate.getTime()));
  const prevTo = fromDate;

  // ---- KPI cards (current period + previous period for the delta %) ----
  const kpiNow = await safe(async () => (await sql`
    SELECT
      COALESCE(SUM(total), 0)::float AS revenue,
      COUNT(*)::int AS orders,
      COUNT(DISTINCT email)::int AS customers,
      COALESCE(SUM(CASE WHEN status = 'returned' THEN total ELSE 0 END), 0)::float AS refunds
    FROM orders WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
  `)[0], { revenue: 0, orders: 0, customers: 0, refunds: 0 });

  const kpiPrev = await safe(async () => (await sql`
    SELECT COALESCE(SUM(total), 0)::float AS revenue, COUNT(*)::int AS orders, COUNT(DISTINCT email)::int AS customers
    FROM orders WHERE created_at BETWEEN ${prevFrom.toISOString()} AND ${prevTo.toISOString()}
  `)[0], { revenue: 0, orders: 0, customers: 0 });

  const newCustomersNow = await safe(async () => (await sql`
    SELECT COUNT(*)::int AS c FROM (
      SELECT email, MIN(created_at) AS first_order FROM orders GROUP BY email
    ) f WHERE f.first_order BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
  `)[0]?.c ?? 0, 0);

  const returningCustomersNow = await safe(async () => (await sql`
    SELECT COUNT(DISTINCT o.email)::int AS c FROM orders o
    WHERE o.created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
      AND EXISTS (SELECT 1 FROM orders o2 WHERE o2.email = o.email AND o2.created_at < ${fromDate.toISOString()})
  `)[0]?.c ?? 0, 0);

  const visitorsNow = await safe(async () => (await sql`
    SELECT COUNT(DISTINCT visitor_id)::int AS c FROM visits
    WHERE is_admin = false AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
  `)[0]?.c ?? 0, 0);
  const visitorsPrev = await safe(async () => (await sql`
    SELECT COUNT(DISTINCT visitor_id)::int AS c FROM visits
    WHERE is_admin = false AND created_at BETWEEN ${prevFrom.toISOString()} AND ${prevTo.toISOString()}
  `)[0]?.c ?? 0, 0);

  const conversionNow = visitorsNow > 0 ? (kpiNow.orders / visitorsNow) * 100 : 0;
  const conversionPrev = visitorsPrev > 0 ? (kpiPrev.orders / visitorsPrev) * 100 : 0;

  function delta(now, prev) {
    if (!prev) return now > 0 ? 100 : 0;
    return ((now - prev) / prev) * 100;
  }

  const kpis = {
    revenue: kpiNow.revenue, revenueDelta: delta(kpiNow.revenue, kpiPrev.revenue),
    orders: kpiNow.orders, ordersDelta: delta(kpiNow.orders, kpiPrev.orders),
    aov: kpiNow.orders > 0 ? kpiNow.revenue / kpiNow.orders : 0,
    aovDelta: delta(kpiNow.orders > 0 ? kpiNow.revenue / kpiNow.orders : 0, kpiPrev.orders > 0 ? kpiPrev.revenue / kpiPrev.orders : 0),
    conversion: conversionNow, conversionDelta: delta(conversionNow, conversionPrev),
    customers: kpiNow.customers, customersDelta: delta(kpiNow.customers, kpiPrev.customers),
    newCustomers: newCustomersNow,
    returningCustomers: returningCustomersNow,
    refunds: kpiNow.refunds,
  };

  // ---- Revenue & Orders Overview (daily series) ----
  const daily = await safe(async () => await sql`
    SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
           COALESCE(SUM(total), 0)::float AS revenue,
           COUNT(*)::int AS orders,
           COUNT(DISTINCT email)::int AS customers
    FROM orders WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
    GROUP BY 1 ORDER BY 1
  `, []);

  // ---- Live visitors + by-page breakdown ----
  const live = await safe(async () => (await sql`
    SELECT COUNT(DISTINCT visitor_id)::int AS c FROM visits
    WHERE is_admin = false AND created_at >= now() - interval '5 minutes'
  `)[0]?.c ?? 0, 0);

  const pageRows = await safe(async () => await sql`
    SELECT path FROM visits
    WHERE is_admin = false AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
  `, []);
  const pageCounts = { Homepage: 0, Shop: 0, "Product Pages": 0, Checkout: 0, Other: 0 };
  for (const r of pageRows) pageCounts[pageBucket(r.path)]++;

  // ---- Visitors by location (real geo, from Vercel's edge headers) ----
  const geoRows = await safe(async () => await sql`
    SELECT COALESCE(country, 'Unknown') AS country, COUNT(DISTINCT visitor_id)::int AS c
    FROM visits WHERE is_admin = false AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
    GROUP BY 1 ORDER BY c DESC LIMIT 6
  `, []);
  const geoTotal = geoRows.reduce((s, r) => s + r.c, 0) || 1;
  const visitorsByLocation = geoRows.map((r) => ({ country: r.country, count: r.c, pct: Math.round((r.c / geoTotal) * 100) }));

  // ---- Best sales day / hour, growth ----
  const bestDay = await safe(async () => (await sql`
    SELECT to_char(created_at, 'Day') AS day, SUM(total)::float AS total
    FROM orders WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
    GROUP BY 1 ORDER BY total DESC LIMIT 1
  `)[0], null);
  const bestHour = await safe(async () => (await sql`
    SELECT to_char(created_at, 'HH12:00 AM') AS hour, COUNT(*)::int AS orders
    FROM orders WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
    GROUP BY 1 ORDER BY orders DESC LIMIT 1
  `)[0], null);

  // ---- Conversion funnel (real: visits -> product views -> add_to_cart -> checkout_started -> purchased) ----
  // Each stage counts unique visitors/sessions, not raw event volume, so a
  // visitor who views 3 product pages doesn't inflate this past 100%.
  const funnelVisitors = visitorsNow;
  const funnelProductViews = await safe(async () => (await sql`
    SELECT COUNT(DISTINCT visitor_id)::int AS c FROM visits
    WHERE is_admin = false AND path LIKE '/product%'
      AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
  `)[0]?.c ?? 0, 0);
  const funnelAddToCart = await safe(async () => (await sql`
    SELECT COUNT(DISTINCT session_id)::int AS c FROM cart_events
    WHERE event = 'add_to_cart' AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
  `)[0]?.c ?? 0, 0);
  const funnelCheckout = await safe(async () => (await sql`
    SELECT COUNT(DISTINCT session_id)::int AS c FROM cart_events
    WHERE event = 'checkout_started' AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
  `)[0]?.c ?? 0, 0);
  const funnelPurchased = kpiNow.orders;

  function stagePct(n) { return funnelVisitors > 0 ? Math.min(100, (n / funnelVisitors) * 100) : 0; }
  const funnel = [
    { label: "Visitors", value: funnelVisitors, pct: 100 },
    { label: "Product Views", value: funnelProductViews, pct: stagePct(funnelProductViews) },
    { label: "Add to Cart", value: funnelAddToCart, pct: stagePct(funnelAddToCart) },
    { label: "Checkout", value: funnelCheckout, pct: stagePct(funnelCheckout) },
    { label: "Purchased", value: funnelPurchased, pct: stagePct(funnelPurchased) },
  ];

  // ---- Top products (views via visits path, add-to-cart via cart_events, orders/revenue via order_items) ----
  const topProducts = await safe(async () => await sql`
    SELECT p.id, p.name, p.slug, p.image_urls,
      COALESCE(v.views, 0)::int AS views,
      COALESCE(a.adds, 0)::int AS adds,
      COALESCE(o.orders, 0)::int AS orders,
      COALESCE(o.revenue, 0)::float AS revenue
    FROM products p
    LEFT JOIN (
      -- Extracts the slug from either the current /product.html?slug=X
      -- form or the legacy /product?slug=X and /product/X forms tracked
      -- before the static-site rewrite, so historical visits still count.
      SELECT
        CASE
          WHEN path LIKE '/product%slug=%' THEN split_part(split_part(path, 'slug=', 2), '&', 1)
          WHEN path LIKE '/product/%' THEN split_part(split_part(path, '/product/', 2), '?', 1)
          ELSE NULL
        END AS slug,
        COUNT(*)::int AS views
      FROM visits WHERE path LIKE '/product%' AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
      GROUP BY 1
    ) v ON v.slug = p.slug
    LEFT JOIN (
      SELECT product_slug, COUNT(*)::int AS adds FROM cart_events
      WHERE event = 'add_to_cart' AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
      GROUP BY 1
    ) a ON a.product_slug = p.slug
    LEFT JOIN (
      SELECT oi.product_id, SUM(oi.qty)::int AS orders, SUM(oi.qty * oi.price_snapshot)::float AS revenue
      FROM order_items oi JOIN orders o2 ON o2.id = oi.order_id
      WHERE o2.created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
      GROUP BY 1
    ) o ON o.product_id = p.id
    ORDER BY revenue DESC NULLS LAST, views DESC NULLS LAST
    LIMIT 5
  `, []);
  const topProductsOut = topProducts.map((p) => ({
    ...p,
    conversion: p.views > 0 ? (p.orders / p.views) * 100 : 0,
  }));

  // ---- Traffic sources (real referrer host buckets) ----
  const refRows = await safe(async () => await sql`
    SELECT referrer FROM visits
    WHERE is_admin = false AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
  `, []);
  const ownHost = (req.headers.host || "").replace(/^www\./, "").split(":")[0];
  const srcCounts = {};
  for (const r of refRows) {
    const key = hostFromReferrer(r.referrer, ownHost);
    srcCounts[key] = (srcCounts[key] || 0) + 1;
  }
  const srcTotal = refRows.length || 1;
  const trafficSources = Object.entries(srcCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / srcTotal) * 100) }));

  // ---- Customer analytics: new vs returning, by month (last 6 months) ----
  const custByMonth = await safe(async () => await sql`
    WITH first_orders AS (SELECT email, MIN(created_at) AS first_at FROM orders GROUP BY email)
    SELECT to_char(date_trunc('month', o.created_at), 'Mon') AS month,
      COUNT(DISTINCT o.email) FILTER (WHERE fo.first_at = date_trunc('day', o.created_at) OR fo.first_at >= date_trunc('month', o.created_at))::int AS new_customers,
      COUNT(DISTINCT o.email) FILTER (WHERE fo.first_at < date_trunc('month', o.created_at))::int AS returning_customers
    FROM orders o JOIN first_orders fo ON fo.email = o.email
    WHERE o.created_at >= now() - interval '6 months'
    GROUP BY date_trunc('month', o.created_at), month ORDER BY date_trunc('month', o.created_at)
  `, []);

  const repeatPurchaseRate = await safe(async () => {
    const rows = await sql`SELECT email, COUNT(*)::int AS c FROM orders GROUP BY email`;
    if (!rows.length) return 0;
    const repeat = rows.filter((r) => r.c > 1).length;
    return (repeat / rows.length) * 100;
  }, 0);

  const customerLifetimeValue = await safe(async () => {
    const rows = await sql`SELECT AVG(t)::float AS v FROM (SELECT SUM(total) AS t FROM orders GROUP BY email) x`;
    return rows[0]?.v || 0;
  }, 0);

  // ---- Cart analytics ----
  const cartAdds = await safe(async () => (await sql`
    SELECT COUNT(*)::int AS c FROM cart_events WHERE event = 'add_to_cart' AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
  `)[0]?.c ?? 0, 0);
  const checkoutStarted = await safe(async () => (await sql`
    SELECT COUNT(DISTINCT session_id)::int AS c FROM cart_events WHERE event = 'checkout_started' AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
  `)[0]?.c ?? 0, 0);
  const purchasedSessions = kpiNow.orders; // one order per completed checkout
  const abandonedCarts = Math.max(0, checkoutStarted - purchasedSessions);
  const recoveredCarts = await safe(async () => (await sql`
    SELECT COUNT(DISTINCT ce.session_id)::int AS c
    FROM cart_events ce
    WHERE ce.event = 'checkout_started' AND ce.created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
      AND EXISTS (
        SELECT 1 FROM orders o WHERE o.created_at > ce.created_at + interval '30 minutes'
          AND o.created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
      )
  `)[0]?.c ?? 0, 0);

  // ---- Orders overview (status breakdown) ----
  const statusRows = await safe(async () => await sql`
    SELECT status, COUNT(*)::int AS c FROM orders
    WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
    GROUP BY status
  `, []);

  // ---- Device analytics ----
  const deviceRows = await safe(async () => await sql`
    SELECT COALESCE(device, 'desktop') AS device, COUNT(DISTINCT visitor_id)::int AS c
    FROM visits WHERE is_admin = false AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
    GROUP BY 1
  `, []);
  const deviceTotal = deviceRows.reduce((s, r) => s + r.c, 0) || 1;
  const mobileVisitors = deviceRows.find((r) => r.device === "mobile")?.c || 0;
  const deviceAnalytics = deviceRows.map((r) => ({ device: r.device, count: r.c, pct: Math.round((r.c / deviceTotal) * 100) }));

  res.status(200).json({
    range: { from: fromDate.toISOString(), to: toDate.toISOString() },
    kpis,
    daily,
    live,
    pageCounts,
    visitorsByLocation,
    bestDay: bestDay ? { day: bestDay.day.trim(), total: bestDay.total } : null,
    bestHour: bestHour ? { hour: bestHour.hour, orders: bestHour.orders } : null,
    funnel,
    topProducts: topProductsOut,
    trafficSources,
    custByMonth,
    repeatPurchaseRate,
    customerLifetimeValue,
    cartAnalytics: { adds: cartAdds, checkoutStarted, abandoned: abandonedCarts, recovered: recoveredCarts },
    ordersByStatus: statusRows,
    deviceAnalytics,
  });
};

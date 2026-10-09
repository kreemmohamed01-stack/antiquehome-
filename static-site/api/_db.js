// Shared Neon Postgres client for all API functions. Plain JS, no build
// step — Vercel picks up any file under /api as its own serverless
// function automatically.
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

function stockState(p) {
  const threshold = p.low_stock_threshold ?? 5;
  if (p.stock_qty <= 0) return "out";
  if (p.stock_qty <= threshold) return "low";
  return "in";
}

function effectiveSalePercent(product, siteSale) {
  const own = product.sale_percent ? parseFloat(product.sale_percent) : 0;
  if (own > 0) return own;
  if (siteSale && siteSale.active && siteSale.percent > 0) return siteSale.percent;
  return 0;
}

function priceWithSale(price, salePercent) {
  const base = typeof price === "string" ? parseFloat(price) : price;
  if (!salePercent) return base;
  return Math.round(base * (1 - salePercent / 100));
}

async function getSiteSale() {
  try {
    const rows = await sql`SELECT value FROM settings WHERE key = 'site_sale'`;
    if (!rows.length) return { active: false, percent: 0, label: "" };
    return rows[0].value;
  } catch {
    return { active: false, percent: 0, label: "" };
  }
}

// Lets Vercel's edge CDN serve a public, read-only GET response for 60s
// (and keep serving it for up to 10 more minutes while it refreshes in
// the background) instead of waking a function + querying Postgres on
// every single page view. Only used on storefront reads; admin pages
// bypass it because js/api.js adds a unique cache-busting param to every
// GET made from /admin/*, so edits always show up instantly there.
// Browsers also reuse the response for a short window (capped at 30s), so
// moving between pages doesn't re-request categories/settings/products
// every time (each request counts against the plan's edge-request quota).
function edgeCache(res, sMaxAge = 60, swr = 600) {
  const browser = Math.min(sMaxAge, 30);
  res.setHeader("Cache-Control", `public, max-age=${browser}, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`);
}

module.exports = { sql, stockState, effectiveSalePercent, priceWithSale, getSiteSale, edgeCache };

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
  return Math.round(base * (1 - salePercent / 100) * 100) / 100;
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

module.exports = { sql, stockState, effectiveSalePercent, priceWithSale, getSiteSale };

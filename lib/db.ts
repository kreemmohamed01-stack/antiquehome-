import { neon } from "@neondatabase/serverless";

// Uses pooled DATABASE_URL for runtime queries.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Do not throw at import time in case this is evaluated during build
  // without env vars (e.g. static analysis); throw only when actually used.
  console.warn("DATABASE_URL is not set — database calls will fail.");
}

export const sql = neon(connectionString as string);

export type Category = {
  id: number;
  slug: string;
  name: string;
  image_url: string | null;
  sort_order: number;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compare_at_price: string | null;
  category_id: number | null;
  material: string | null;
  colors: string[] | null;
  size_cm: string | null;
  sizes: string[] | null;
  image_urls: string[] | null;
  badge: string | null;
  sale_percent: string | null;
  sale_label: string | null;
  stock_qty: number;
  rating: string;
  review_count: number;
  created_at: string;
};

export type Coupon = {
  id: number;
  code: string;
  percent: string;
  active: boolean;
  created_at: string;
};

export type ShippingRate = {
  id: number;
  governorate: string;
  standard_price: string;
  express_price: string;
  sort_order: number;
};

export type SiteSale = {
  active: boolean;
  percent: number;
  label: string;
};

export async function getSiteSale(): Promise<SiteSale> {
  try {
    const rows = (await sql`SELECT value FROM settings WHERE key = 'site_sale'`) as { value: SiteSale }[];
    if (!rows.length) return { active: false, percent: 0, label: "" };
    return rows[0].value;
  } catch {
    return { active: false, percent: 0, label: "" };
  }
}

export type AboutContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroText: string;
};

const DEFAULT_ABOUT_CONTENT: AboutContent = {
  heroTitle: "The Art of",
  heroSubtitle: "Living Beautifully",
  heroText:
    "At Antique Home, we believe a home is more than a place, it's a reflection of your story, your taste, and the moments that matter most.",
};

export async function getAboutContent(): Promise<AboutContent> {
  try {
    const rows = (await sql`SELECT value FROM settings WHERE key = 'about_content'`) as { value: AboutContent }[];
    if (!rows.length) return DEFAULT_ABOUT_CONTENT;
    return { ...DEFAULT_ABOUT_CONTENT, ...rows[0].value };
  } catch {
    return DEFAULT_ABOUT_CONTENT;
  }
}

/** Effective sale % for a product: per-product sale wins over the
 *  site-wide sale if both are active. Returns 0 if neither applies. */
export function effectiveSalePercent(
  product: { sale_percent: string | null },
  siteSale: SiteSale
): number {
  const own = product.sale_percent ? parseFloat(product.sale_percent) : 0;
  if (own > 0) return own;
  if (siteSale.active && siteSale.percent > 0) return siteSale.percent;
  return 0;
}

export function priceWithSale(price: string | number, salePercent: number): number {
  const base = typeof price === "string" ? parseFloat(price) : price;
  if (!salePercent) return base;
  return Math.round(base * (1 - salePercent / 100) * 100) / 100;
}

export type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  governorate: string | null;
  city: string | null;
  address: string | null;
  delivery_method: string;
  payment_method: string;
  notes: string | null;
  subtotal: string;
  shipping: string;
  discount: string;
  total: string;
  status: string;
  created_at: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number | null;
  name_snapshot: string;
  price_snapshot: string;
  image_snapshot: string | null;
  qty: number;
};

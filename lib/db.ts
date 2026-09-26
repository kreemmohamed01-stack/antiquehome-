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
  image_urls: string[] | null;
  badge: string | null;
  stock_qty: number;
  rating: string;
  review_count: number;
  created_at: string;
};

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

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL as string);

async function main() {
  console.log("v3: product variants, multi-category, colors with images, stock thresholds…");

  // --- products: new columns -------------------------------------------
  // sizes was a plain text[] of labels; variants carries label+price+stock
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb`;
  // colors as objects: { name, hex, imageUrls[] } so the storefront can
  // swap the gallery when a colour is picked
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS color_options JSONB DEFAULT '[]'::jsonb`;
  // per-set pricing (price of one piece vs. the set)
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS price_per_piece NUMERIC(12,2)`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS set_size INT`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS pricing_mode TEXT DEFAULT 'unit'`;
  // stock alerting
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 5`;
  // merchandising flags
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false`;
  // status: active | draft | archived
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS views INT DEFAULT 0`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false`;

  // --- many-to-many product <-> category --------------------------------
  await sql`
    CREATE TABLE IF NOT EXISTS product_categories (
      product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      PRIMARY KEY (product_id, category_id)
    )
  `;
  // backfill from the existing single category_id
  await sql`
    INSERT INTO product_categories (product_id, category_id)
    SELECT id, category_id FROM products WHERE category_id IS NOT NULL
    ON CONFLICT DO NOTHING
  `;

  // --- orders: demo flag + richer fields ---------------------------------
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT`;

  // order_items: remember which variant/colour was bought
  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_label TEXT`;
  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS color_name TEXT`;

  console.log("v3 complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

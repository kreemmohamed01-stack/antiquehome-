import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL as string);

async function main() {
  console.log("v4: per-category product ordering…");

  // Where a product sits within one specific category's grid — independent
  // per category, since the same product can belong to several categories
  // and show in a different spot in each.
  await sql`ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0`;

  // Seed existing links with their current creation order (oldest product
  // first within each category) so nothing jumps around on first load —
  // from here on the dashboard drag-and-drop owns the ordering.
  await sql`
    WITH ranked AS (
      SELECT product_id, category_id,
        ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY product_id) AS rn
      FROM product_categories
    )
    UPDATE product_categories pc
    SET sort_order = ranked.rn
    FROM ranked
    WHERE pc.product_id = ranked.product_id AND pc.category_id = ranked.category_id
  `;

  console.log("v4 complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

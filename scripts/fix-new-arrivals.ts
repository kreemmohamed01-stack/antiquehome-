import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL as string);

async function main() {
  const before = await sql`SELECT id, name, is_new_arrival FROM products ORDER BY created_at`;
  console.log("Before:", before);

  const res = await sql`
    UPDATE products
    SET is_new_arrival = true
    WHERE status = 'active' AND is_new_arrival = false
    RETURNING id, name
  `;
  console.log(`Flagged ${res.length} products as New Arrival:`, res.map((r: any) => r.name));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

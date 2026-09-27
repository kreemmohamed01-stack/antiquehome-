import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL as string);

// Products 8, 10, 11 were seeded with extra colour swatches (White, Gold)
// that have no photos of their own — clicking them looked broken since
// nothing actually changed. Collapse each product down to the one colour
// that has real photos, until real per-colour shots are uploaded from the
// dashboard.
async function main() {
  const rows = (await sql`SELECT id, name, colors, color_options FROM products ORDER BY id`) as any[];
  for (const r of rows) {
    const opts = r.color_options || [];
    const withPhotos = opts.filter((c: any) => (c.imageUrls?.length ?? 0) > 0);
    if (withPhotos.length === opts.length) continue; // nothing to trim
    const newColors = withPhotos.map((c: any) => c.name);
    await sql`
      UPDATE products
      SET colors = ${JSON.stringify(newColors)}, color_options = ${JSON.stringify(withPhotos)}
      WHERE id = ${r.id}
    `;
    console.log(`Fixed #${r.id} ${r.name}: ${JSON.stringify(r.colors)} -> ${JSON.stringify(newColors)}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

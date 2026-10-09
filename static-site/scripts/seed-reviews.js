// Gives every product a random review count (8–147) and rating (4.3–5.0).
// Run from static-site/:  node scripts/seed-reviews.js
const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const url = (env.match(/^DATABASE_URL=["']?([^"'\r\n]+)/m) || [])[1];
if (!url) throw new Error("DATABASE_URL not found in .env.local");
const sql = neon(url);

(async () => {
  const rows = await sql`
    UPDATE products
    SET review_count = 8 + floor(random() * 140)::int,
        rating = round((4.3 + random() * 0.7)::numeric, 1)
    RETURNING id`;
  console.log(`Updated reviews on ${rows.length} products.`);
})().catch((e) => { console.error(e.message); process.exit(1); });

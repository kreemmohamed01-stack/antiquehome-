/* eslint-disable no-console */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const sql = neon(connectionString);

const CATEGORIES = [
  { slug: "bleu-blanc", name: "Bleu Blanc", image: "/sec 3/category 1.png", sort: 1 },
  { slug: "lighting", name: "Lighting", image: "/sec 3/category 2.png", sort: 2 },
  { slug: "accessories", name: "Accessories", image: "/sec 3/category 3.png", sort: 3 },
  { slug: "antiques", name: "Antiques", image: "/sec 3/category 4.png", sort: 4 },
  { slug: "artificial-plants-garden-stool", name: "Artificial Plants & Garden Stool", image: "/sec 3/category 5.png", sort: 5 },
  { slug: "wall-art-plates", name: "Wall Art & Plates", image: "/sec 3/category 6.png", sort: 6 },
  { slug: "murano-glass", name: "Murano Glass", image: "/sec 3/category 7.png", sort: 7 },
  { slug: "furniture", name: "Furniture", image: "/sec 3/category 8.png", sort: 8 },
  { slug: "sale", name: "Sale", image: "/sec 3/category 9.jpeg", sort: 9 },
];

async function main() {
  console.log("Creating tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      image_url TEXT,
      sort_order INT NOT NULL DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price NUMERIC(12,2) NOT NULL,
      compare_at_price NUMERIC(12,2),
      category_id INT REFERENCES categories(id) ON DELETE SET NULL,
      material TEXT,
      colors JSONB DEFAULT '[]'::jsonb,
      size_cm TEXT,
      image_urls JSONB DEFAULT '[]'::jsonb,
      badge TEXT,
      stock_qty INT NOT NULL DEFAULT 0,
      rating NUMERIC(3,2) NOT NULL DEFAULT 0,
      review_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      governorate TEXT,
      city TEXT,
      address TEXT,
      delivery_method TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      notes TEXT,
      subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
      shipping NUMERIC(12,2) NOT NULL DEFAULT 0,
      discount NUMERIC(12,2) NOT NULL DEFAULT 0,
      total NUMERIC(12,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INT REFERENCES products(id) ON DELETE SET NULL,
      name_snapshot TEXT NOT NULL,
      price_snapshot NUMERIC(12,2) NOT NULL,
      image_snapshot TEXT,
      qty INT NOT NULL DEFAULT 1
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  console.log("Seeding categories...");
  for (const c of CATEGORIES) {
    await sql`
      INSERT INTO categories (slug, name, image_url, sort_order)
      VALUES (${c.slug}, ${c.name}, ${c.image}, ${c.sort})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, image_url = EXCLUDED.image_url, sort_order = EXCLUDED.sort_order
    `;
  }

  console.log("Creating admin user...");
  const existing = await sql`SELECT id FROM admin_users WHERE email = 'admin@antiquehome.com'`;
  let plainPassword: string | null = null;
  if (existing.length === 0) {
    plainPassword = crypto.randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 14) + "!Aa1";
    const hash = await bcrypt.hash(plainPassword, 12);
    await sql`
      INSERT INTO admin_users (email, password_hash) VALUES ('admin@antiquehome.com', ${hash})
    `;
  }

  if (plainPassword) {
    const credsPath = path.resolve(process.cwd(), "ADMIN_CREDENTIALS.md");
    const content = `# Antique Home Admin Credentials

**Generated:** ${new Date().toISOString()}

- URL: /admin/login
- Email: admin@antiquehome.com
- Password: ${plainPassword}

Keep this file private. It is gitignored and must never be committed.
`;
    fs.writeFileSync(credsPath, content, "utf8");
    console.log("Admin credentials written to ADMIN_CREDENTIALS.md");
    console.log("Email: admin@antiquehome.com");
    console.log("Password:", plainPassword);
  } else {
    console.log("Admin user already exists — no new credentials generated.");
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

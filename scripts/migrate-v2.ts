import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL as string);

const GOVERNORATES = [
  "Cairo", "Giza", "Alexandria", "Qalyubia", "Sharqia", "Dakahlia", "Beheira",
  "Gharbia", "Monufia", "Kafr El Sheikh", "Damietta", "Port Said", "Ismailia",
  "Suez", "North Sinai", "South Sinai", "Beni Suef", "Faiyum", "Minya",
  "Asyut", "Sohag", "Qena", "Luxor", "Aswan", "Red Sea", "New Valley", "Matrouh",
];

async function main() {
  console.log("Creating settings table...");
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL
    )
  `;
  // site-wide sale, off by default
  await sql`
    INSERT INTO settings (key, value)
    VALUES ('site_sale', '{"active": false, "percent": 0, "label": ""}'::jsonb)
    ON CONFLICT (key) DO NOTHING
  `;

  console.log("Creating coupons table...");
  await sql`
    CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      percent NUMERIC(5,2) NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  console.log("Creating shipping_rates table...");
  await sql`
    CREATE TABLE IF NOT EXISTS shipping_rates (
      id SERIAL PRIMARY KEY,
      governorate TEXT UNIQUE NOT NULL,
      standard_price NUMERIC(10,2) NOT NULL DEFAULT 100,
      express_price NUMERIC(10,2) NOT NULL DEFAULT 150,
      sort_order INT NOT NULL DEFAULT 0
    )
  `;

  console.log("Seeding shipping_rates for all governorates...");
  for (let i = 0; i < GOVERNORATES.length; i++) {
    const gov = GOVERNORATES[i];
    // simple default: Cairo/Giza/Alexandria cheaper, rest a bit more,
    // all within the requested 80-100 EGP standard range; express = +50
    const standard = i < 3 ? 80 : 100;
    const express = standard + 50;
    await sql`
      INSERT INTO shipping_rates (governorate, standard_price, express_price, sort_order)
      VALUES (${gov}, ${standard}, ${express}, ${i})
      ON CONFLICT (governorate) DO NOTHING
    `;
  }

  console.log("Adding sale + sizes columns to products...");
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_percent NUMERIC(5,2)`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_label TEXT`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb`;

  console.log("Adding coupon_code column to orders...");
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT`;

  console.log("Migration v2 complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

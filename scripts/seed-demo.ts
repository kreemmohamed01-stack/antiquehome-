import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL as string);

const CUSTOMERS = [
  { name: "Sara Mohamed", email: "sara@email.com", phone: "+20 106 123 4567", gov: "Alexandria", city: "Smouha" },
  { name: "Omar Khaled", email: "omar@email.com", phone: "+20 101 222 3344", gov: "Cairo", city: "Nasr City" },
  { name: "Yara Mostafa", email: "yara@email.com", phone: "+20 112 998 7766", gov: "Giza", city: "Dokki" },
  { name: "Ahmed Ali", email: "ahmed@email.com", phone: "+20 100 555 1212", gov: "Cairo", city: "Maadi" },
  { name: "Nada Hassan", email: "nada@email.com", phone: "+20 109 777 8899", gov: "Qalyubia", city: "Banha" },
  { name: "Karim Sameh", email: "karim@email.com", phone: "+20 122 333 4455", gov: "Cairo", city: "Heliopolis" },
  { name: "Dina Magdy", email: "dina@email.com", phone: "+20 128 444 5566", gov: "Alexandria", city: "Gleem" },
  { name: "Mohamed Tarek", email: "mohamed@email.com", phone: "+20 111 666 7788", gov: "Giza", city: "6th October" },
  { name: "Salma Nasser", email: "salma@email.com", phone: "+20 115 888 9900", gov: "Cairo", city: "Zamalek" },
  { name: "Hassan Ibrahim", email: "hassan@email.com", phone: "+20 106 999 0011", gov: "Dakahlia", city: "Mansoura" },
];

const STATUSES = ["delivered", "processing", "shipped", "delivered", "processing", "shipped", "delivered", "pending", "delivered", "processing"];
const PAYMENTS = ["Debit Card", "Cash on Delivery", "Debit Card", "InstaPay", "Cash on Delivery", "InstaPay", "Debit Card", "Cash on Delivery", "Debit Card", "InstaPay"];
const COURIERS = ["Aramex", "Bosta", "Aramex", "Bosta", "Aramex", "Bosta", "Aramex", "Bosta", "Aramex", "Bosta"];

async function main() {
  console.log("Seeding demo orders…");

  // clear any previous demo rows first so re-running doesn't pile up
  await sql`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE is_demo = true)`;
  await sql`DELETE FROM orders WHERE is_demo = true`;

  const products = (await sql`
    SELECT id, name, price, image_urls FROM products ORDER BY id
  `) as { id: number; name: string; price: string; image_urls: string[] }[];

  if (!products.length) {
    console.warn("No products found — run seed-lighting first.");
    return;
  }

  for (let i = 0; i < CUSTOMERS.length; i++) {
    const c = CUSTOMERS[i];
    const status = STATUSES[i];
    const payment = PAYMENTS[i];
    const courier = COURIERS[i];

    // 1–3 line items pulled from the real catalogue
    const itemCount = (i % 3) + 1;
    const picked = Array.from({ length: itemCount }, (_, k) => products[(i + k) % products.length]);

    const items = picked.map((p, k) => ({
      product: p,
      qty: ((i + k) % 2) + 1,
    }));

    const subtotal = items.reduce((s, it) => s + Number(it.product.price) * it.qty, 0);
    const shipping = status === "delivered" ? 80 : 100;
    const discount = i % 4 === 0 ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal - discount + shipping;

    // spread the orders over the last ~30 days
    const daysAgo = i * 3;

    const orderRows = (await sql`
      INSERT INTO orders (
        order_number, customer_name, email, phone, governorate, city, address,
        delivery_method, payment_method, payment_status, courier, tracking_number,
        notes, subtotal, shipping, discount, total, status, is_demo, created_at
      ) VALUES (
        ${"AH-DEMO" + String(1258 - i)}, ${c.name}, ${c.email}, ${c.phone},
        ${c.gov}, ${c.city}, ${"12 " + c.city + " St."},
        'Standard Delivery (2–4 Business Days)', ${payment},
        ${payment === "Cash on Delivery" ? "pending" : "paid"},
        ${courier}, ${"#" + (courier === "Aramex" ? "ARX" : "BOS") + (7845 + i)},
        null, ${subtotal}, ${shipping}, ${discount}, ${total}, ${status}, true,
        now() - (${daysAgo} || ' days')::interval
      ) RETURNING id
    `) as { id: number }[];

    const orderId = orderRows[0].id;

    for (const it of items) {
      await sql`
        INSERT INTO order_items (order_id, product_id, name_snapshot, price_snapshot, image_snapshot, qty)
        VALUES (
          ${orderId}, ${it.product.id}, ${it.product.name}, ${it.product.price},
          ${it.product.image_urls?.[0] || null}, ${it.qty}
        )
      `;
    }

    console.log(`  ✓ demo order for ${c.name} (${status})`);
  }

  console.log("Demo data seeded. Remove it any time from Settings → Remove demo data.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

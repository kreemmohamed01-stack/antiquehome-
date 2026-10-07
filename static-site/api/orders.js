const { sql, effectiveSalePercent, priceWithSale, getSiteSale } = require("./_db.js");
const { getSession } = require("./_auth.js");

async function readBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  return body || {};
}

// Same fallbacks as js/checkout.js when a governorate has no rate row.
const FALLBACK_STANDARD = 100;
const FALLBACK_EXPRESS = 150;

// Re-prices an order from the database instead of trusting the numbers
// the browser sent — otherwise anyone could edit the request and order
// a 3000 EGP piece for 1 EGP. Mirrors the checkout's maths exactly:
// variant price, then product/site-wide sale, then coupon on the
// subtotal, then shipping (base rate for the governorate + per-kg).
// Cart line ids are "slug", "slug::variant", "slug::color" or
// "slug::variant::color". Returns null if any line is unknown/unbuyable.
async function priceOrder(body) {
  const lines = body.items.map((i) => {
    const parts = String(i.id || "").split("::");
    return { slug: parts[0], rest: parts.slice(1), qty: Math.max(1, Math.floor(Number(i.qty) || 0)), image: i.image || null };
  });
  const slugs = [...new Set(lines.map((l) => l.slug))];
  const products = await sql`SELECT * FROM products WHERE slug = ANY(${slugs}) AND status = 'active'`;
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const siteSale = await getSiteSale();

  const items = [];
  for (const l of lines) {
    const p = bySlug.get(l.slug);
    if (!p || l.qty > 100) return null;
    const variant = l.rest.length ? (p.variants || []).find((v) => v.label === l.rest[0]) : null;
    const colorName = l.rest.find((x) => (p.color_options || []).some((c) => c.name === x)) || null;
    const base = variant ? Number(variant.price) : Number(p.price);
    const pct = effectiveSalePercent(p, siteSale);
    const price = pct > 0 ? priceWithSale(base, pct) : base;
    items.push({
      productId: p.id,
      name: p.name,
      price,
      qty: l.qty,
      image: l.image,
      weightKg: Number(p.weight_kg) || 0,
      variantLabel: variant ? variant.label : null,
      colorName,
    });
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  let discount = 0;
  let couponCode = null;
  if (body.couponCode) {
    const c = await sql`SELECT code, percent FROM coupons WHERE code = ${String(body.couponCode).trim().toUpperCase()} AND active = true`;
    if (c.length) {
      couponCode = c[0].code;
      discount = Math.round(subtotal * (parseFloat(c[0].percent) / 100) * 100) / 100;
    }
  }

  const delivery = String(body.delivery || "");
  const isPickup = /pickup/i.test(delivery);
  const isExpress = /express/i.test(delivery);
  let shipping = 0;
  if (!isPickup) {
    const r = await sql`SELECT * FROM shipping_rates WHERE governorate = ${body.governorate || ""}`;
    const rate = r[0];
    const baseShip = isExpress
      ? (rate ? Number(rate.express_price) : FALLBACK_EXPRESS)
      : (rate ? Number(rate.standard_price) : FALLBACK_STANDARD);
    const kg = items.reduce((s, i) => s + i.qty * i.weightKg, 0);
    shipping = baseShip + kg * (rate ? Number(rate.per_kg_rate) || 0 : 0);
  }
  const total = Math.max(0, subtotal - discount) + shipping;
  return { items, subtotal, discount, couponCode, shipping, total };
}

// Automatic WhatsApp alert to the shop owner via Green API (a WhatsApp
// account linked through Linked Devices). Does nothing until
// GREENAPI_ID_INSTANCE, GREENAPI_API_TOKEN and WHATSAPP_NOTIFY_PHONE are
// set in Vercel; GREENAPI_URL is the instance's "apiUrl" from the Green API
// console. Awaited (with a short timeout) because Vercel stops the function
// once the response is sent; a failure here never fails the order itself.
async function notifyOwnerOnWhatsApp(order, b) {
  const idInstance = process.env.GREENAPI_ID_INSTANCE;
  const token = process.env.GREENAPI_API_TOKEN;
  const phone = String(process.env.WHATSAPP_NOTIFY_PHONE || "").replace(/\D/g, "");
  if (!idInstance || !token || !phone) return;
  const apiUrl = (process.env.GREENAPI_URL || "https://api.green-api.com").replace(/\/+$/, "");
  const money = (n) => "EGP " + Math.round(Number(n) || 0).toLocaleString("en-US");
  const items = b.items.map((i) => {
    const extra = [i.variantLabel, i.colorName].filter(Boolean).join(" / ");
    return `- ${i.qty} x ${i.name}${extra ? ` (${extra})` : ""} = ${money(Number(i.price) * Number(i.qty))}`;
  });
  const text = [
    `*New order ${order.order_number}*`,
    `Name: ${b.fullName}`,
    `Phone: ${b.phone}`,
    `Address: ${[b.address, b.city, b.governorate].filter(Boolean).join(", ")}`,
    `Payment: ${b.payment || "-"}`,
    "",
    ...items,
    "",
    `Total: ${money(b.total)}`,
    b.notes ? `Notes: ${b.notes}` : null,
  ].filter((l) => l !== null).join("\n").slice(0, 3000);
  try {
    const r = await fetch(`${apiUrl}/waInstance${idInstance}/sendMessage/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: `${phone}@c.us`, message: text }),
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) console.error("WhatsApp notify failed:", r.status, (await r.text()).slice(0, 200));
  } catch (err) {
    console.error("WhatsApp notify failed:", err && err.message);
  }
}

module.exports = async (req, res) => {
  try {
    // GET /api/orders?id=123  -> single order + items (public, needed by
    // the order-confirmation page right after checkout).
    if (req.method === "GET" && req.query.id) {
      const idOrNumber = req.query.id;
      const orders = await sql`SELECT * FROM orders WHERE id::text = ${idOrNumber} OR order_number = ${idOrNumber}`;
      if (!orders.length) { res.status(404).json({ error: "Order not found" }); return; }
      const order = orders[0];
      const items = await sql`SELECT * FROM order_items WHERE order_id = ${order.id}`;
      res.status(200).json({ order, items });
      return;
    }

    // GET /api/orders  -> admin list, needs a session.
    if (req.method === "GET") {
      const session = getSession(req);
      if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }
      const rows = await sql`
        SELECT o.*, (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id)::int AS item_count
        FROM orders o ORDER BY o.created_at DESC
      `;
      res.status(200).json(rows);
      return;
    }

    // POST /api/orders -> create a new order at checkout (public).
    if (req.method === "POST") {
      const body = await readBody(req);
      if (!body.email || !body.fullName || !body.phone || !Array.isArray(body.items) || body.items.length === 0) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      const priced = await priceOrder(body);
      if (!priced) {
        res.status(409).json({ error: "Some items in your bag are no longer available. Please review your bag and try again." });
        return;
      }
      Object.assign(body, priced);

      const orderNumber = "AH-" + Date.now().toString(36).toUpperCase().slice(-8);

      const orderRows = await sql`
        INSERT INTO orders (
          order_number, customer_name, email, phone, governorate, city, address,
          delivery_method, payment_method, payment_reference, payment_sender_name, notes, subtotal, shipping, discount, coupon_code, total, status
        ) VALUES (
          ${orderNumber}, ${body.fullName}, ${body.email}, ${body.phone},
          ${body.governorate || null}, ${body.city || null}, ${body.address || null},
          ${body.delivery}, ${body.payment}, ${body.paymentReference || null}, ${body.paymentSenderName || null}, ${body.notes || null},
          ${body.subtotal}, ${body.shipping}, ${body.discount || 0}, ${body.couponCode || null}, ${body.total}, 'pending'
        ) RETURNING id, order_number
      `;
      const order = orderRows[0];

      for (const item of body.items) {
        await sql`
          INSERT INTO order_items (order_id, product_id, name_snapshot, price_snapshot, image_snapshot, variant_label, color_name, qty)
          VALUES (${order.id}, ${item.productId}, ${item.name}, ${item.price}, ${item.image}, ${item.variantLabel}, ${item.colorName}, ${item.qty})
        `;
        await sql`UPDATE products SET stock_qty = GREATEST(0, stock_qty - ${item.qty}) WHERE id = ${item.productId}`;
      }

      await notifyOwnerOnWhatsApp(order, body);
      res.status(200).json({ id: order.id, orderNumber: order.order_number });
      return;
    }

    // PATCH /api/orders?id=123 -> admin status update.
    if (req.method === "PATCH") {
      const session = getSession(req);
      if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }
      const id = Number(req.query.id);
      if (!id) { res.status(400).json({ error: "Missing id" }); return; }
      const body = await readBody(req);
      const allowed = ["pending", "processing", "shipped", "delivered", "cancelled"];
      if (!allowed.includes(body.status)) { res.status(400).json({ error: "Invalid status" }); return; }
      await sql`UPDATE orders SET status = ${body.status} WHERE id = ${id}`;
      res.status(200).json({ ok: true });
      return;
    }

    // DELETE /api/orders?demo=1 — wipes the seeded demo orders/products
    // (admin dashboard's "Clear Demo Data" button). Was its own
    // api/demo.js function; merged in here to stay under the Hobby
    // plan's 12-serverless-functions-per-deployment limit once
    // api/sitemap.js was added.
    if (req.method === "DELETE" && req.query.demo) {
      const session = getSession(req);
      if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }
      await sql`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE is_demo = true)`;
      const removed = await sql`DELETE FROM orders WHERE is_demo = true RETURNING id`;
      await sql`DELETE FROM products WHERE is_demo = true`;
      res.status(200).json({ ok: true, removed: removed.length });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

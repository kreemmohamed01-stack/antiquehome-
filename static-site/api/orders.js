const { sql } = require("./_db.js");
const { getSession } = require("./_auth.js");

async function readBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  return body || {};
}

// Free automatic WhatsApp alert to the shop owner via CallMeBot. Does
// nothing until CALLMEBOT_PHONE and CALLMEBOT_APIKEY are set in Vercel.
// Awaited (with a short timeout) because Vercel stops the function once
// the response is sent; a failure here never fails the order itself.
async function notifyOwnerOnWhatsApp(order, b) {
  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) return;
  const money = (n) => "EGP " + Math.round(Number(n) || 0).toLocaleString("en-US");
  const items = b.items.map((i) => {
    const extra = [i.variantLabel, i.colorName].filter(Boolean).join(" / ");
    return `- ${i.qty} x ${i.name}${extra ? ` (${extra})` : ""} = ${money(Number(i.price) * Number(i.qty))}`;
  });
  const text = [
    `New order ${order.order_number}`,
    `Name: ${b.fullName}`,
    `Phone: ${b.phone}`,
    `Address: ${[b.address, b.city, b.governorate].filter(Boolean).join(", ")}`,
    `Payment: ${b.payment || "-"}`,
    "",
    ...items,
    "",
    `Total: ${money(b.total)}`,
    b.notes ? `Notes: ${b.notes}` : null,
  ].filter((l) => l !== null).join("\n").slice(0, 1500);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
  try {
    await fetch(url, { signal: AbortSignal.timeout(6000) });
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
          VALUES (${order.id}, ${item.productId ?? null}, ${item.name}, ${item.price}, ${item.image || null}, ${item.variantLabel || null}, ${item.colorName || null}, ${item.qty})
        `;
        if (item.productId) {
          await sql`UPDATE products SET stock_qty = GREATEST(0, stock_qty - ${item.qty}) WHERE id = ${item.productId}`;
        }
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

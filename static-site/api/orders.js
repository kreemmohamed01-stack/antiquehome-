const { sql } = require("./_db.js");
const { getSession } = require("./_auth.js");

async function readBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  return body || {};
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
          delivery_method, payment_method, notes, subtotal, shipping, discount, coupon_code, total, status
        ) VALUES (
          ${orderNumber}, ${body.fullName}, ${body.email}, ${body.phone},
          ${body.governorate || null}, ${body.city || null}, ${body.address || null},
          ${body.delivery}, ${body.payment}, ${body.notes || null},
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

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

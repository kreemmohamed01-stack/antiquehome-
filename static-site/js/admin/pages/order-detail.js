// Dashboard page script: admin/order-detail.html
  function fmt(n) { return "EGP " + Math.round(Number(n)).toLocaleString("en-US"); }

  (async () => {
    const session = await AdminShell.init({ active: "orders" });
    if (!session) return;

    const id = new URLSearchParams(location.search).get("id");
    if (!id) { location.href = "/admin/orders.html"; return; }

    let order, items;
    try {
      const data = await API.get(`/api/orders?id=${id}`);
      order = data.order; items = data.items;
    } catch {
      document.getElementById("pageHead").innerHTML = `<p>Order not found.</p>`;
      return;
    }

    document.getElementById("pageHead").innerHTML = `
      <img src="${cldUrl(items[0]?.image_snapshot || "/images/home/section-2-main.webp", 600)}" alt="">
      <div class="admin__pageHead-body">
        <p class="admin__crumb"><a href="/admin/index.html">Dashboard</a><a href="/admin/orders.html">Orders</a><span>${order.order_number}</span></p>
        <h1 class="admin__pageTitle">${order.order_number}</h1>
        <p class="admin__pageSub">Placed ${new Date(order.created_at).toLocaleString("en-US")}</p>
      </div>
      <div class="admin__pageHead-actions">
        <select id="statusSelect">
          ${["pending", "processing", "shipped", "delivered", "cancelled"].map((s) =>
            `<option value="${s}" ${order.status === s ? "selected" : ""}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
          ).join("")}
        </select>
      </div>
    `;

    document.getElementById("statusSelect").addEventListener("change", async (e) => {
      try {
        await API.patch(`/api/orders?id=${order.id}`, { status: e.target.value });
        location.reload();
      } catch { alert("Failed to update status."); }
    });

    const steps = ["pending", "processing", "shipped", "delivered"];
    const currentIdx = steps.indexOf(order.status);
    document.getElementById("timeline").innerHTML = steps.map((s, i) => `
      <div class="admin__tstep${i <= currentIdx ? " is-done" : ""}">
        <span class="admin__tdot"></span>
        <span>${s.charAt(0).toUpperCase() + s.slice(1)}</span>
      </div>
    `).join("");

    document.getElementById("customerCard").innerHTML = `
      <div class="admin__panel-head"><h2 class="admin__panel-title">Customer</h2></div>
      <p><strong>${order.customer_name}</strong></p>
      ${order.email ? `<p>${order.email}</p>` : ""}
      <p>${order.phone}</p>
    `;

    document.getElementById("shippingCard").innerHTML = `
      <div class="admin__panel-head"><h2 class="admin__panel-title">Shipping</h2></div>
      <p>${order.governorate || ""} ${order.city ? "· " + order.city : ""}</p>
      <p>${order.address || ""}</p>
      <p style="color:var(--a-text-dim);font-size:12px">${order.delivery_method} · ${order.payment_method}</p>
      ${order.payment_reference ? `<p style="color:var(--a-text-dim);font-size:12px">InstaPay ref: <strong style="color:var(--a-text)">${order.payment_reference}</strong></p>` : ""}
    `;

    document.getElementById("itemsCard").innerHTML = `
      <div class="admin__panel-head"><h2 class="admin__panel-title">Order Items</h2></div>
      ${items.map((it) => `
        <div class="admin__prow">
          <img src="${cldUrl(it.image_snapshot || "/images/brand/logo.png", 80)}" alt="">
          <div class="admin__prow-main">
            <div class="admin__prow-name">${it.name_snapshot}</div>
            <div class="admin__prow-sku">${[it.color_name, it.variant_label].filter(Boolean).join(" · ")}</div>
          </div>
          <div style="flex:none;text-align:right">
            <div>${fmt(it.price_snapshot)} × ${it.qty}</div>
          </div>
        </div>
      `).join("")}
    `;

    document.getElementById("summaryCard").innerHTML = `
      <div class="admin__panel-head"><h2 class="admin__panel-title">Order Summary</h2></div>
      <p>Subtotal: ${fmt(order.subtotal)}</p>
      ${Number(order.discount) > 0 ? `<p>Discount${order.coupon_code ? " (" + order.coupon_code + ")" : ""}: -${fmt(order.discount)}</p>` : ""}
      <p>Shipping: ${fmt(order.shipping)}</p>
      <p style="font-weight:700;font-size:16px">Total: ${fmt(order.total)}</p>
    `;
  })();

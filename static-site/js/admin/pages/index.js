// Dashboard page script: admin/index.html

  function fmt(n) { return "EGP " + Math.round(n).toLocaleString("en-US"); }

  (async () => {
    const session = await AdminShell.init({ active: "dashboard" });
    if (!session) return;

    let data;
    try {
      data = await API.get("/api/analytics?mode=dashboard");
    } catch {
      data = { totals: { sales: 0, orders: 0, customers: 0 }, recentOrders: [], topProducts: [], lowStock: [], demoCount: 0, visitors: {} };
    }

    if (data.demoCount > 0) {
      const bar = document.getElementById("demoBar");
      bar.innerHTML = `
        <div class="admin__demoBar">
          <span><strong>Demo data is on.</strong> ${data.demoCount} sample order${data.demoCount === 1 ? "" : "s"} are shown so you can preview the dashboard. Remove them before you launch.</span>
          <button type="button" id="removeDemoBtn">Remove demo data</button>
        </div>
      `;
      document.getElementById("removeDemoBtn").addEventListener("click", async () => {
        if (!confirm(`Remove all ${data.demoCount} demo orders? Real orders are never touched.`)) return;
        try {
          await API.del("/api/orders?demo=1");
          location.reload();
        } catch {
          alert("Failed to remove demo data.");
        }
      });
    }

    document.getElementById("statsRow").innerHTML = `
      <div class="admin__stat">
        <div class="admin__stat-top"><span class="admin__stat-label">Total Sales</span></div>
        <div class="admin__stat-value">${fmt(data.totals.sales)}</div>
      </div>
      <div class="admin__stat">
        <div class="admin__stat-top"><span class="admin__stat-label">Total Orders</span></div>
        <div class="admin__stat-value">${data.totals.orders.toLocaleString("en-US")}</div>
      </div>
      <div class="admin__stat">
        <div class="admin__stat-top"><span class="admin__stat-label">Total Customers</span></div>
        <div class="admin__stat-value">${data.totals.customers.toLocaleString("en-US")}</div>
      </div>
      <div class="admin__stat">
        <div class="admin__stat-top"><span class="admin__stat-label">Avg. Order Value</span></div>
        <div class="admin__stat-value">${fmt((data.totals.paid_orders ?? data.totals.orders) > 0 ? data.totals.sales / (data.totals.paid_orders ?? data.totals.orders) : 0)}</div>
      </div>
    `;

    const v = data.visitors || {};
    document.getElementById("visitorStrip").innerHTML = `
      <div class="admin__stat">
        <div class="admin__stat-top"><span class="admin__stat-label">Live Now</span></div>
        <div class="admin__stat-value" style="${v.live > 0 ? 'color:var(--a-green)' : ''}">${v.live || 0}</div>
      </div>
      <div class="admin__stat">
        <div class="admin__stat-top"><span class="admin__stat-label">Today</span></div>
        <div class="admin__stat-value">${v.today_visitors || 0}</div>
      </div>
      <div class="admin__stat">
        <div class="admin__stat-top"><span class="admin__stat-label">This Week</span></div>
        <div class="admin__stat-value">${v.week_visitors || 0}</div>
      </div>
      <div class="admin__stat">
        <div class="admin__stat-top"><span class="admin__stat-label">This Month</span></div>
        <div class="admin__stat-value">${v.month_visitors || 0}</div>
      </div>
      <div class="admin__stat">
        <div class="admin__stat-top"><span class="admin__stat-label">All Time</span></div>
        <div class="admin__stat-value">${v.all_time_visitors || 0}</div>
      </div>
    `;

    function pillClass(status) {
      switch (status) {
        case "delivered": return "admin__pill admin__pill--delivered";
        case "shipped": return "admin__pill admin__pill--shipped";
        case "processing": return "admin__pill admin__pill--processing";
        default: return "admin__pill admin__pill--pending";
      }
    }

    const recentOrdersEl = document.getElementById("recentOrders");
    if (data.recentOrders.length > 0) {
      recentOrdersEl.innerHTML = `
        <table class="admin__table">
          <thead><tr><th># Order</th><th>Customer</th><th>Products</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            ${data.recentOrders.map((o) => `
              <tr>
                <td>${o.order_number}</td>
                <td>${o.customer_name}</td>
                <td>${o.item_count} items</td>
                <td>${fmt(parseFloat(o.total))}</td>
                <td><span class="${pillClass(o.status)}">${o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    } else {
      recentOrdersEl.innerHTML = `<p style="color:var(--a-text-dim);font-size:12px;text-align:center;padding:20px 0">No orders yet.</p>`;
    }

    const topProductsEl = document.getElementById("topProducts");
    if (data.topProducts.length > 0) {
      topProductsEl.innerHTML = data.topProducts.map((p, i) => `
        <li class="admin__listRow">
          <span class="admin__rankNum">${i + 1}</span>
          <img src="${cldUrl((p.image_urls || [])[0] || "/images/brand/logo.png", 80)}" alt="">
          <div style="flex:1;min-width:0">
            <div class="name">${p.name}</div>
            <div class="meta">${p.sold} sales</div>
          </div>
          <span class="price">${fmt(parseFloat(p.price))}</span>
        </li>
      `).join("");
    } else {
      topProductsEl.innerHTML = `<p style="color:var(--a-text-dim);font-size:12px;text-align:center;padding:20px 0">No sales yet.</p>`;
    }

    const lowStockEl = document.getElementById("lowStock");
    if (data.lowStock.length > 0) {
      lowStockEl.innerHTML = data.lowStock.map((p) => `
        <li class="admin__listRow">
          <img src="${cldUrl((p.image_urls || [])[0] || "/images/brand/logo.png", 80)}" alt="">
          <div style="flex:1;min-width:0"><div class="name">${p.name}</div></div>
          <span class="${p.stock_qty <= 3 ? "admin__pill admin__pill--low" : "admin__pill admin__pill--warn"}">${p.stock_qty} left</span>
        </li>
      `).join("");
    } else {
      lowStockEl.innerHTML = `<p style="color:var(--a-text-dim);font-size:12px;text-align:center;padding:20px 0">No low-stock products.</p>`;
    }
  })();

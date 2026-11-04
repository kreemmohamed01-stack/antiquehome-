// Dashboard page script: admin/orders.html
  let ALL_ORDERS = [];
  let tab = "all";
  let query = "";
  let page = 1;
  const PAGE_SIZE = 10;

  function fmt(n) { return "EGP " + Math.round(Number(n)).toLocaleString("en-US"); }
  function pillClass(status) {
    switch (status) {
      case "delivered": return "admin__pill admin__pill--delivered";
      case "shipped": return "admin__pill admin__pill--shipped";
      case "processing": return "admin__pill admin__pill--processing";
      case "cancelled": return "admin__pill admin__pill--low";
      default: return "admin__pill admin__pill--pending";
    }
  }

  function render() {
    const counts = { all: ALL_ORDERS.length };
    ["pending", "processing", "shipped", "delivered", "cancelled"].forEach((s) => {
      counts[s] = ALL_ORDERS.filter((o) => o.status === s).length;
    });
    const total = ALL_ORDERS.reduce((s, o) => s + parseFloat(o.total), 0);

    document.getElementById("statStrip").innerHTML = `
      <div class="admin__stat"><div class="admin__stat-top"><span class="admin__stat-label">Total</span></div><div class="admin__stat-value">${counts.all}</div></div>
      <div class="admin__stat"><div class="admin__stat-top"><span class="admin__stat-label">Pending</span></div><div class="admin__stat-value">${counts.pending}</div></div>
      <div class="admin__stat"><div class="admin__stat-top"><span class="admin__stat-label">Processing</span></div><div class="admin__stat-value">${counts.processing}</div></div>
      <div class="admin__stat"><div class="admin__stat-top"><span class="admin__stat-label">Shipped</span></div><div class="admin__stat-value">${counts.shipped}</div></div>
      <div class="admin__stat"><div class="admin__stat-top"><span class="admin__stat-label">Delivered</span></div><div class="admin__stat-value">${counts.delivered}</div></div>
      <div class="admin__stat"><div class="admin__stat-top"><span class="admin__stat-label">Cancelled</span></div><div class="admin__stat-value">${counts.cancelled}</div></div>
    `;

    document.getElementById("tabRow").innerHTML = [
      ["all", `All (${counts.all})`], ["pending", `Pending (${counts.pending})`],
      ["processing", `Processing (${counts.processing})`], ["shipped", `Shipped (${counts.shipped})`],
      ["delivered", `Delivered (${counts.delivered})`], ["cancelled", `Cancelled (${counts.cancelled})`],
    ].map(([key, label]) => `<button type="button" class="admin__chip${tab === key ? " is-active" : ""}" data-tab="${key}">${label}</button>`).join("");
    document.querySelectorAll("[data-tab]").forEach((btn) => btn.addEventListener("click", () => { tab = btn.dataset.tab; page = 1; render(); }));

    let list = ALL_ORDERS;
    if (tab !== "all") list = list.filter((o) => o.status === tab);
    const needle = query.trim().toLowerCase();
    if (needle) list = list.filter((o) => o.order_number.toLowerCase().includes(needle) || o.customer_name.toLowerCase().includes(needle) || o.email.toLowerCase().includes(needle));

    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const current = Math.min(page, totalPages);
    const visible = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

    const listEl = document.getElementById("ordersList");
    if (visible.length === 0) {
      listEl.innerHTML = `<p style="text-align:center;padding:40px;color:var(--a-text-dim)">No orders match this view.</p>`;
    } else {
      listEl.innerHTML = `
        <table class="admin__ordersTable admin__table">
          <thead><tr><th># Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>
            ${visible.map((o) => `
              <tr>
                <td>${o.order_number}</td>
                <td>${o.customer_name}<br><span style="color:var(--a-text-dim);font-size:11px">${o.email}</span></td>
                <td>${o.item_count} items</td>
                <td>${fmt(o.total)}</td>
                <td><span class="${pillClass(o.status)}">${o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span></td>
                <td>${new Date(o.created_at).toLocaleDateString("en-US")}</td>
                <td><a href="/admin/order-detail.html?id=${o.id}" class="admin__iconAct">View</a> <a href="#" class="admin__iconAct" data-del-order="${o.id}" data-num="${o.order_number}" style="color:#c0392b">Delete</a></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="admin__ordersCards">
          ${visible.map((o) => `
            <a href="/admin/order-detail.html?id=${o.id}" class="admin__ocard">
              <div style="display:flex;justify-content:space-between"><strong>${o.order_number}</strong><span class="${pillClass(o.status)}">${o.status}</span></div>
              <div style="color:var(--a-text-dim);font-size:12px">${o.customer_name} · ${o.item_count} items</div>
              <div style="font-weight:600">${fmt(o.total)}</div>
            </a>
          `).join("")}
        </div>
      `;
    }

    listEl.querySelectorAll("[data-del-order]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const ok = await AdminShell.confirm({
          title: "Delete this order?",
          message: `Order ${btn.dataset.num} will be permanently deleted. This cannot be undone.`,
          confirmLabel: "Delete",
        });
        if (!ok) return;
        try {
          await API.del(`/api/orders?id=${btn.dataset.delOrder}`);
          ALL_ORDERS = ALL_ORDERS.filter((o) => String(o.id) !== btn.dataset.delOrder);
          render();
        } catch { alert("Failed to delete order."); }
      });
    });

    const pagerEl = document.getElementById("pager");
    if (totalPages > 1) {
      pagerEl.style.display = "flex";
      pagerEl.innerHTML = Array.from({ length: totalPages }).map((_, i) => `<button type="button" class="${current === i + 1 ? "is-active" : ""}" data-page="${i + 1}">${i + 1}</button>`).join("");
      pagerEl.querySelectorAll("[data-page]").forEach((btn) => btn.addEventListener("click", () => { page = Number(btn.dataset.page); render(); }));
    } else {
      pagerEl.style.display = "none";
    }
  }

  (async () => {
    const session = await AdminShell.init({ active: "orders" });
    if (!session) return;
    ALL_ORDERS = await API.get("/api/orders");
    render();
    document.getElementById("searchInput").addEventListener("input", (e) => { query = e.target.value; page = 1; render(); });
  })();

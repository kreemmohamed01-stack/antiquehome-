// Dashboard page script: admin/customers.html
  (async () => {
    const session = await AdminShell.init({ active: "customers" });
    if (!session) return;
    const customers = await API.get("/api/customers");
    document.getElementById("rows").innerHTML = customers.map((c) => `
      <tr>
        <td>${c.name || "—"}</td><td>${c.email}</td><td>${c.phone || "—"}</td>
        <td>${c.order_count}</td><td>${fmtMoney(c.total_spent)}</td>
        <td>${new Date(c.last_order).toLocaleDateString("en-US")}</td>
      </tr>
    `).join("") || `<tr><td colspan="6" style="text-align:center;color:var(--a-text-dim);padding:20px">No customers yet.</td></tr>`;
  })();

// Dashboard page script: admin/discounts.html
  async function loadCoupons() {
    const coupons = await API.get("/api/coupons");
    document.getElementById("couponList").innerHTML = coupons.map((c) => `
      <div class="admin__prow">
        <div class="admin__prow-main"><div class="admin__prow-name">${c.code}</div><div class="admin__prow-sku">${c.percent}% off</div></div>
        <label style="display:flex;align-items:center;gap:6px"><input type="checkbox" data-toggle="${c.id}" ${c.active ? "checked" : ""}> Active</label>
        <button type="button" class="admin__iconAct admin__iconAct--danger" data-del="${c.id}">Delete</button>
      </div>
    `).join("") || `<p style="color:var(--a-text-dim);padding:20px;text-align:center">No coupons yet.</p>`;

    document.querySelectorAll("[data-toggle]").forEach((cb) => {
      cb.addEventListener("change", async () => {
        await API.patch(`/api/coupons?id=${cb.dataset.toggle}`, { active: cb.checked });
      });
    });
    document.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this coupon?")) return;
        await API.del(`/api/coupons?id=${btn.dataset.del}`);
        await loadCoupons();
      });
    });
  }

  (async () => {
    const session = await AdminShell.init({ active: "discounts" });
    if (!session) return;

    const sale = await API.get("/api/settings?key=site_sale");
    document.getElementById("saleActive").checked = !!sale.active;
    document.getElementById("salePercent").value = sale.percent || 0;
    document.getElementById("saleLabel").value = sale.label || "";

    document.getElementById("saveSaleBtn").addEventListener("click", async () => {
      try {
        await API.post("/api/settings?key=site_sale", {
          active: document.getElementById("saleActive").checked,
          percent: Number(document.getElementById("salePercent").value) || 0,
          label: document.getElementById("saleLabel").value,
        });
        alert("Saved.");
      } catch { alert("Failed to save."); }
    });

    await loadCoupons();

    document.getElementById("addCouponBtn").addEventListener("click", async () => {
      const code = document.getElementById("newCode").value.trim();
      const percent = Number(document.getElementById("newPercent").value) || 0;
      if (!code) return;
      try {
        await API.post("/api/coupons?admin=1", { code, percent });
        document.getElementById("newCode").value = "";
        document.getElementById("newPercent").value = "";
        await loadCoupons();
      } catch (err) { alert(err.message || "Failed to add coupon."); }
    });
  })();

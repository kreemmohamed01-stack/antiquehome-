// Dashboard page script: admin/shipping.html
  (async () => {
    const session = await AdminShell.init({ active: "shipping" });
    if (!session) return;

    const { rates } = await API.get("/api/shipping");
    document.getElementById("rateRows").innerHTML = rates.map((r) => `
      <tr>
        <td>${r.governorate}</td>
        <td><input type="number" data-std="${r.id}" value="${r.standard_price}" style="width:90px"></td>
        <td><input type="number" data-exp="${r.id}" value="${r.express_price}" style="width:90px"></td>
        <td><input type="number" step="0.5" data-perkg="${r.id}" value="${r.per_kg_rate || 0}" style="width:90px"></td>
        <td><button type="button" class="admin__iconAct" data-save="${r.id}">Save</button></td>
      </tr>
    `).join("");

    document.querySelectorAll("[data-save]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.save;
        const standardPrice = document.querySelector(`[data-std="${id}"]`).value;
        const expressPrice = document.querySelector(`[data-exp="${id}"]`).value;
        const perKgRate = document.querySelector(`[data-perkg="${id}"]`).value;
        try {
          await API.patch(`/api/shipping?id=${id}`, { standardPrice, expressPrice, perKgRate });
          btn.textContent = "Saved ✓";
          setTimeout(() => { btn.textContent = "Save"; }, 1500);
        } catch { alert("Failed to save."); }
      });
    });
  })();

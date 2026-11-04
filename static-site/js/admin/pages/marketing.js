// Dashboard page script: admin/marketing.html
  function fmtDate(d) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

  async function loadNewsletter() {
    let rows = [];
    try { rows = await API.get("/api/customers?newsletter=1"); } catch { rows = []; }
    document.getElementById("newsletterCount").textContent = `${rows.length} signup${rows.length === 1 ? "" : "s"}`;
    document.getElementById("newsletterList").innerHTML = rows.length ? rows.map((r) => `
      <div class="admin__prow">
        <div class="admin__prow-main"><div class="admin__prow-name">${r.email}</div><div class="admin__prow-sku">Signed up ${fmtDate(r.created_at)}</div></div>
        <button type="button" class="admin__iconAct admin__iconAct--danger" data-del="${r.id}" aria-label="Remove">
          <svg viewBox="0 0 24 24"><path d="M5.6 7.2h12.8l-1 12.4H6.6Z"></path></svg>
        </button>
      </div>
    `).join("") : `<p style="color:var(--a-text-dim);padding:20px;text-align:center">No newsletter signups yet.</p>`;

    document.querySelectorAll("#newsletterList [data-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await API.del(`/api/customers?newsletter=1&id=${btn.dataset.del}`);
        await loadNewsletter();
      });
    });
  }

  (async () => {
    const session = await AdminShell.init({ active: "marketing" });
    if (!session) return;

    try {
      const social = await API.get("/api/settings?key=site_social");
      document.getElementById("f_whatsapp").value = social?.whatsapp || "";
      document.getElementById("f_instagram").value = social?.instagram || "";
      document.getElementById("f_facebook").value = social?.facebook || "";
    } catch {}

    try {
      const ann = await API.get("/api/settings?key=site_announcement");
      document.getElementById("f_annActive").checked = !!ann?.active;
      document.getElementById("f_annText").value = ann?.text || "";
    } catch {}

    document.getElementById("saveSocialBtn").addEventListener("click", async () => {
      try {
        await API.post("/api/settings?key=site_social", {
          whatsapp: document.getElementById("f_whatsapp").value.trim(),
          instagram: document.getElementById("f_instagram").value.trim(),
          facebook: document.getElementById("f_facebook").value.trim(),
        });
        alert("Saved.");
      } catch { alert("Failed to save."); }
    });

    document.getElementById("saveAnnBtn").addEventListener("click", async () => {
      try {
        await API.post("/api/settings?key=site_announcement", {
          active: document.getElementById("f_annActive").checked,
          text: document.getElementById("f_annText").value.trim(),
        });
        alert("Saved.");
      } catch { alert("Failed to save."); }
    });

    await loadNewsletter();
  })();

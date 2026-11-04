// Dashboard page script: admin/content.html
  const FIELDS = {
    heroEyebrow: "f_heroEyebrow",
    heroTitle1: "f_heroTitle1",
    heroTitle2: "f_heroTitle2",
    heroText: "f_heroText",
    aboutHeroText: "f_aboutHeroText",
    aboutJourneyText: "f_aboutJourneyText",
    aboutPhilosophyText: "f_aboutPhilosophyText",
    aboutCtaText: "f_aboutCtaText",
    contactEmail: "f_contactEmail",
    contactPhone: "f_contactPhone",
    contactAddress: "f_contactAddress",
  };

  // Homepage Instagram tiles: the photo the site ships with, overridden by
  // site_content.igImages[i] when one was uploaded here.
  const IG_DEFAULTS = ["/images/home/instagram-1.webp", "/images/home/instagram-2.webp", "/images/home/instagram-3.webp", "/images/home/instagram-4.webp"];
  let igImages = ["", "", "", ""];

  function renderIg() {
    const wrap = document.getElementById("igEdit");
    wrap.innerHTML = IG_DEFAULTS.map((def, i) => `
      <div class="igEdit__tile">
        <label class="igEdit__pic" id="igPic${i}">
          <img src="${igImages[i] || def}" alt="Instagram photo ${i + 1}">
          <span>Click to replace</span>
          <input type="file" accept="image/*" data-ig="${i}" hidden>
        </label>
        <div class="igEdit__row"><span>Photo ${i + 1}${igImages[i] ? "" : " · original"}</span>${igImages[i] ? `<button type="button" data-ig-reset="${i}">Reset</button>` : ""}</div>
      </div>`).join("");
    wrap.querySelectorAll("[data-ig]").forEach((input) => input.addEventListener("change", async () => {
      const i = Number(input.dataset.ig);
      const file = input.files && input.files[0];
      if (!file) return;
      const pic = document.getElementById("igPic" + i);
      pic.classList.add("is-busy");
      try {
        igImages[i] = await uploadImageFile(file, "instagram");
        renderIg();
      } catch (err) {
        pic.classList.remove("is-busy");
        alert(err.message || "Upload failed.");
      }
    }));
    wrap.querySelectorAll("[data-ig-reset]").forEach((btn) => btn.addEventListener("click", () => {
      igImages[Number(btn.dataset.igReset)] = "";
      renderIg();
    }));
  }

  (async () => {
    const session = await AdminShell.init({ active: "content" });
    if (!session) return;

    let content = {};
    try { content = (await API.get("/api/settings?key=site_content")) || {}; } catch { content = {}; }
    for (const [key, id] of Object.entries(FIELDS)) {
      document.getElementById(id).value = content[key] || "";
    }
    if (Array.isArray(content.igImages)) igImages = IG_DEFAULTS.map((_, i) => content.igImages[i] || "");
    renderIg();

    document.getElementById("saveContentBtn").addEventListener("click", async () => {
      const out = {};
      for (const [key, id] of Object.entries(FIELDS)) {
        out[key] = document.getElementById(id).value.trim();
      }
      out.igImages = igImages.slice();
      try {
        await API.post("/api/settings?key=site_content", out);
        alert("Saved.");
      } catch { alert("Failed to save."); }
    });
  })();

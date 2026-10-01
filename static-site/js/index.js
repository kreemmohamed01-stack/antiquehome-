// Homepage data: New Arrivals rail + sale banner. Ported from app/page.tsx +
// SaleBanner.tsx server components.
(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function bannerMarkup({ eyebrow, pct, btnLabel, btnHref }) {
    return `
      <div class="sale-banner">
        <div class="sale-banner__inner">
          <div>
            <p class="sale-banner__eyebrow">
              <span class="sale-banner__rule" aria-hidden="true"></span>
              ${eyebrow}
              <span class="sale-banner__rule" aria-hidden="true"></span>
            </p>
            <div class="sale-banner__row">
              <span class="sale-banner__diamond" aria-hidden="true"></span>
              <span class="sale-banner__line" aria-hidden="true"></span>
              <span class="sale-banner__pct">${pct}</span>
              <span class="sale-banner__line" aria-hidden="true"></span>
              <span class="sale-banner__diamond" aria-hidden="true"></span>
            </div>
          </div>
          <a href="${btnHref}" class="sale-banner__btn">
            <span>${btnLabel}</span>
            <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
          </a>
        </div>
      </div>`;
  }

  // The section under the hero is the sale's permanent home: it shows the
  // site-wide sale (set from the admin Discounts page) when active, and
  // disappears when it's off. The coupon has its own separate home — the
  // cart drawer (see site-chrome.js) — so it no longer appears here at all.
  function renderSaleBanner(sale) {
    const slot = document.getElementById("saleBannerSlot");
    if (!slot) return;

    if (sale && sale.active && sale.percent > 0) {
      const label = (sale.label && sale.label.trim()) || "Limited Offer";
      slot.innerHTML = bannerMarkup({
        eyebrow: label,
        pct: `UP TO <b>${sale.percent}%</b> OFF`,
        btnLabel: "Shop Sale",
        btnHref: "/shop.html?category=sale",
      });
      return;
    }

    slot.innerHTML = "";
  }

  function featuredCard(p) {
    const img = (p.image_urls || [])[0] || "";
    return `
      <article class="feat rv rv--up in" data-href="/product.html?slug=${encodeURIComponent(p.slug)}">
        <div class="feat__body">
          <div class="feat__top">
            <span class="feat__no">01<i aria-hidden="true"></i></span>
            ${p.badge ? `<span class="pill">${p.badge}</span>` : ""}
          </div>
          <h3 class="feat__name">${p.name}</h3>
          <p class="feat__desc">${p.description || ""}</p>
          <p class="feat__price">EGP ${Number(p.price).toLocaleString("en-US")}</p>
          <div class="feat__actions">
            <button class="btn-gold" type="button" data-add="${p.name}" data-add-id="${p.slug}" data-add-price="${p.price}" data-add-image="${splitFocal(img).src}" data-add-weight="${p.weight_kg || 0}">
              Add to Cart
            </button>
            <button class="fav" type="button" aria-label="Save ${p.name}" aria-pressed="false">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4 4.6 13.2a4.6 4.6 0 1 1 7.4-5.3 4.6 4.6 0 1 1 7.4 5.3Z"></path></svg>
            </button>
          </div>
        </div>
        <figure class="feat__media">
          <img src="${cldUrl(img, 900)}" alt="${p.name}" loading="lazy" style="object-position:${splitFocal(img).position};--zoom:${splitFocal(img).zoom}" />
        </figure>
      </article>`;
  }

  function railCard(p, i) {
    const img = (p.image_urls || [])[0] || "";
    return `
      <article class="card" data-href="/product.html?slug=${encodeURIComponent(p.slug)}">
        <figure class="card__media">
          <img src="${cldUrl(img, 480)}" alt="${p.name}" loading="lazy" style="object-position:${splitFocal(img).position};--zoom:${splitFocal(img).zoom}" />
          <span class="card__no">${String(i + 2).padStart(2, "0")}</span>
          <button class="fav fav--sm" type="button" aria-label="Save ${p.name}" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4 4.6 13.2a4.6 4.6 0 1 1 7.4-5.3 4.6 4.6 0 1 1 7.4 5.3Z"></path></svg>
          </button>
          <button class="add" type="button" data-add="${p.name}" data-add-id="${p.slug}" data-add-price="${p.price}" data-add-image="${splitFocal(img).src}" data-add-weight="${p.weight_kg || 0}" aria-label="Add ${p.name} to cart">
            <span>Add to Cart</span>
          </button>
        </figure>
        <div class="card__body">
          <h3 class="card__name">${p.name}</h3>
          <p class="card__cat">Decor</p>
          <p class="card__price">EGP ${Number(p.price).toLocaleString("en-US")}</p>
        </div>
      </article>`;
  }

  async function loadArrivals() {
    let products = [];
    try {
      const all = await API.get("/api/products?status=active");
      const flagged = all.filter((p) => p.is_new_arrival);
      products = (flagged.length ? flagged : all)
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 7);
    } catch {
      products = [];
    }

    const featuredSlot = document.getElementById("featuredSlot");
    const rail = document.getElementById("productRail");
    if (!products.length) {
      if (featuredSlot) {
        featuredSlot.innerHTML = `<div class="feat rv rv--up empty-state in"><p style="padding:40px;opacity:.7">New arrivals are on their way — check back soon.</p></div>`;
      }
      return;
    }

    const featured = products[0];
    const rest = products.slice(1);
    if (featuredSlot) featuredSlot.innerHTML = featuredCard(featured);
    if (rail) rail.innerHTML = rest.map((p, i) => railCard(p, i)).join("");
  }

  async function loadSaleBanner() {
    let sale = null;
    try {
      sale = await API.get("/api/settings?key=site_sale");
    } catch {
      sale = null;
    }
    renderSaleBanner(sale);
  }

  // Overrides the hardcoded hero copy with admin-edited text from the
  // Content page, when set — left untouched (site defaults) otherwise.
  async function loadHeroContent() {
    let content = null;
    try { content = await API.get("/api/settings?key=site_content"); } catch { content = null; }
    if (!content) return;
    const map = {
      heroEyebrow: "heroEyebrow",
      heroTitle1: "heroTitle1",
      heroTitle2: "heroTitle2",
      heroText: "heroText",
    };
    for (const [key, elId] of Object.entries(map)) {
      const val = content[key];
      const el = document.getElementById(elId);
      if (val && el) el.textContent = val;
    }
  }

  // Category tiles: swap in any image uploaded in Dashboard → Categories.
  // The markup ships the built-in default as src (lazy-loaded, below the
  // fold), so in the normal case this replaces it before it ever downloads.
  async function loadCategoryImages() {
    let categories = [];
    try { categories = await API.get("/api/categories"); } catch { return; }
    document.querySelectorAll("img[data-cat-img]").forEach((img) => {
      const url = categoryImageUrl(img.dataset.catImg, categories, Number(img.dataset.catW));
      if (img.getAttribute("src") !== url) img.src = url;
    });
  }

  ready(function () {
    loadArrivals();
    loadSaleBanner();
    loadHeroContent();
    loadCategoryImages();
  });
})();

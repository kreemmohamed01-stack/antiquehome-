// Homepage data: New Arrivals rail + sale banner. Ported from app/page.tsx +
// SaleBanner.tsx server components.
(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function renderSaleBanner(sale) {
    const slot = document.getElementById("saleBannerSlot");
    if (!slot) return;
    if (!sale || !sale.active || sale.percent <= 0) {
      slot.innerHTML = "";
      return;
    }
    const label = (sale.label && sale.label.trim()) || "Limited Offer";
    slot.innerHTML = `
      <div class="sale-banner">
        <div class="sale-banner__inner">
          <div>
            <p class="sale-banner__eyebrow">
              <span class="sale-banner__rule" aria-hidden="true"></span>
              ${label}
              <span class="sale-banner__rule" aria-hidden="true"></span>
            </p>
            <div class="sale-banner__row">
              <span class="sale-banner__diamond" aria-hidden="true"></span>
              <span class="sale-banner__line" aria-hidden="true"></span>
              <span class="sale-banner__pct">UP TO <b>${sale.percent}%</b> OFF</span>
              <span class="sale-banner__line" aria-hidden="true"></span>
              <span class="sale-banner__diamond" aria-hidden="true"></span>
            </div>
          </div>
          <a href="/shop.html?category=sale" class="sale-banner__btn">
            <span>Shop Sale</span>
            <svg viewBox="0 0 26 12" aria-hidden="true"><line x1="0" y1="6" x2="22" y2="6"></line><polyline points="17.4,1.6 22.4,6 17.4,10.4"></polyline></svg>
          </a>
        </div>
      </div>`;
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
          <img src="${cldUrl(img, 900)}" alt="${p.name}" loading="lazy" style="object-position:${splitFocal(img).position}" />
        </figure>
      </article>`;
  }

  function railCard(p, i) {
    const img = (p.image_urls || [])[0] || "";
    return `
      <article class="card" data-href="/product.html?slug=${encodeURIComponent(p.slug)}">
        <figure class="card__media">
          <img src="${cldUrl(img, 480)}" alt="${p.name}" loading="lazy" style="object-position:${splitFocal(img).position}" />
          <span class="card__no">${String(i + 2).padStart(2, "0")}</span>
          <button class="fav fav--sm" type="button" aria-label="Save ${p.name}" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4 4.6 13.2a4.6 4.6 0 1 1 7.4-5.3 4.6 4.6 0 1 1 7.4 5.3Z"></path></svg>
          </button>
          <button class="add" type="button" data-add="${p.name}" data-add-id="${p.slug}" data-add-price="${p.price}" data-add-image="${splitFocal(img).src}" data-add-weight="${p.weight_kg || 0}" aria-label="Add ${p.name} to cart">
            <svg viewBox="0 0 20 20" aria-hidden="true"><line x1="10" y1="4.4" x2="10" y2="15.6"></line><line x1="4.4" y1="10" x2="15.6" y2="10"></line></svg>
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

  async function loadSale() {
    try {
      const sale = await API.get("/api/sale");
      renderSaleBanner(sale);
    } catch {
      renderSaleBanner(null);
    }
  }

  ready(function () {
    loadArrivals();
    loadSale();
  });
})();

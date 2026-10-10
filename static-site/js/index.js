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

  // ---- New Arrivals: 3D coverflow ----
  // Cards sit on a circular track around the active one; each card's
  // offset from the active index drives its rotateY / depth / scale, so
  // stepping is just updating one number and re-applying transforms (CSS
  // transitions do the motion). Drag/swipe, arrows, dots, keyboard and
  // tapping a side card all step it; tapping the front card opens it.
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4 4.6 13.2a4.6 4.6 0 1 1 7.4-5.3 4.6 4.6 0 1 1 7.4 5.3Z"></path></svg>';
  const pad = (n) => String(n).padStart(2, "0");
  const money = (n) => `EGP ${Number(n).toLocaleString("en-US")}`;

  function arrCard(p, i, total) {
    const img = (p.image_urls || [])[0] || "";
    const f = splitFocal(img);
    return `
      <article class="arr3d__card" data-i="${i}" data-href="/product.html?slug=${encodeURIComponent(p.slug)}">
        <figure class="arr3d__media">
          <img src="${cldUrl(img, 720)}" alt="${esc(p.name)}" loading="${i < 3 || i > total - 3 ? "eager" : "lazy"}" draggable="false" style="object-position:${f.position};--zoom:${f.zoom}" />
          <span class="arr3d__shade" aria-hidden="true"></span>
        </figure>
        <span class="arr3d__frame" aria-hidden="true"></span>
        <span class="arr3d__no"><em>${pad(i + 1)}</em><i></i><small>${pad(total)}</small></span>
        <button class="fav arr3d__fav" type="button" aria-label="Save ${esc(p.name)}" aria-pressed="false">${heart}</button>
      </article>`;
  }

  function arrInfo(p) {
    const img = (p.image_urls || [])[0] || "";
    return `
      <div class="arr3d__panel">
        <a class="arr3d__name" href="/product.html?slug=${encodeURIComponent(p.slug)}" data-pname-en="${esc(p.name)}" data-pname-ar="${esc(p.name_ar || "")}">${esc(AH_I18N.productName(p))}</a>
        <span class="arr3d__rule" aria-hidden="true"><i></i><b></b><i></i></span>
        <p class="arr3d__price">${money(p.price)}</p>
        <button class="arr3d__add" type="button" data-add="${esc(p.name)}" data-add-ar="${esc(p.name_ar || "")}" data-add-id="${esc(p.slug)}" data-add-price="${p.price}" data-add-image="${esc(splitFocal(img).src)}" data-add-weight="${p.weight_kg || 0}">
          <span>${AH_I18N.getLang && AH_I18N.getLang() === "ar" ? "أضف للسلة" : "Add to Cart"}</span>
        </button>
      </div>`;
  }

  function mountArrivals(products) {
    const stage = document.getElementById("arr3dStage");
    const info = document.getElementById("arr3dInfo");
    const ctrl = document.getElementById("arr3dCtrl");
    const dotsEl = document.getElementById("arr3dDots");
    if (!stage) return;
    const n = products.length;
    stage.innerHTML = products.map((p, i) => arrCard(p, i, n)).join("");
    const cards = Array.from(stage.querySelectorAll(".arr3d__card"));
    dotsEl.innerHTML = products.map((p, i) => `<button type="button" data-dot="${i}" aria-label="Go to product ${i + 1}"></button>`).join("");
    const dots = Array.from(dotsEl.children);
    ctrl.hidden = n < 2;

    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let active = 0;
    let drag = 0; // live drag offset, in "cards"

    function offsetOf(i) {
      let d = i - active;
      if (n > 2) { if (d > n / 2) d -= n; if (d < -n / 2) d += n; }
      return d - drag;
    }

    function layout() {
      const w = stage.clientWidth;
      const cardW = cards[0] ? cards[0].offsetWidth : 300;
      const desktop = w >= 900;
      const spread = desktop ? cardW * 0.8 : cardW * 0.66;
      cards.forEach((c, i) => {
        const d = offsetOf(i);
        const a = Math.abs(d);
        const s = Math.sign(d);
        const x = s * (Math.min(a, 1) * spread + Math.max(0, a - 1) * spread * 0.6);
        const z = -Math.min(a, 3.2) * (desktop ? 170 : 130);
        const rot = -s * Math.min(a, 1.4) * 24;
        const scale = 1 - Math.min(a, 3) * 0.06;
        c.style.transform = `translate(-50%, -50%) translate3d(${x}px, 0, ${z}px) rotateY(${rot}deg) scale(${scale})`;
        c.style.opacity = a > 2.6 ? 0 : a > 1.6 ? 0.6 : 1;
        c.style.zIndex = String(100 - Math.round(a * 10));
        c.style.pointerEvents = a > 2.6 ? "none" : "";
        c.style.setProperty("--dim", (Math.min(a, 1.6) * 0.34).toFixed(3));
        c.classList.toggle("is-active", Math.round(a) === 0);
      });
    }

    function paintInfo() {
      info.innerHTML = arrInfo(products[active]);
      dots.forEach((d, i) => d.classList.toggle("is-active", i === active));
    }

    function go(i) {
      active = ((i % n) + n) % n;
      layout();
      paintInfo();
    }

    // gentle autoplay until the visitor interacts; paused off-screen / on hover
    let timer = null, stopped = reduced || n < 2, visible = false;
    function tick() { if (!stopped && visible && !document.hidden) go(active + 1); }
    function startAuto() { if (!stopped && !timer) timer = setInterval(tick, 5200); }
    function stopAuto() { stopped = true; clearInterval(timer); timer = null; }

    // drag / swipe
    let sx = 0, sy = 0, down = false, locked = false, moved = false;
    stage.addEventListener("pointerdown", (e) => {
      if (e.button > 0 || e.target.closest("button")) return;
      down = true; locked = false; moved = false; sx = e.clientX; sy = e.clientY;
    });
    stage.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!locked) {
        if (Math.abs(dx) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) { down = false; return; }
        locked = true; moved = true;
        try { stage.setPointerCapture(e.pointerId); } catch {}
        stage.classList.add("is-dragging");
      }
      drag = -dx / (cards[0].offsetWidth * 0.75);
      layout();
    });
    const end = () => {
      if (!down) return;
      down = false;
      stage.classList.remove("is-dragging");
      if (!locked) return;
      const steps = Math.round(drag + (drag > 0 ? 0.2 : drag < 0 ? -0.2 : 0));
      drag = 0;
      go(active + steps);
      stopAuto();
    };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);

    // tap: side card -> bring it forward, front card -> open the product
    stage.addEventListener("click", (e) => {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; return; }
      if (e.target.closest("button")) return;
      const card = e.target.closest(".arr3d__card");
      if (!card) return;
      e.preventDefault(); e.stopPropagation();
      const i = Number(card.dataset.i);
      if (i === active) location.href = card.dataset.href;
      else { go(i); stopAuto(); }
    }, true);

    document.getElementById("arr3dPrev").addEventListener("click", () => { go(active - 1); stopAuto(); });
    document.getElementById("arr3dNext").addEventListener("click", () => { go(active + 1); stopAuto(); });
    dots.forEach((d, i) => d.addEventListener("click", () => { go(i); stopAuto(); }));
    stage.tabIndex = 0;
    stage.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { go(active - 1); stopAuto(); }
      if (e.key === "ArrowRight") { go(active + 1); stopAuto(); }
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((ents) => { visible = ents[0].isIntersecting; if (visible) startAuto(); }, { threshold: 0.35 }).observe(stage);
    }
    stage.addEventListener("mouseenter", () => { clearInterval(timer); timer = null; });
    stage.addEventListener("mouseleave", startAuto);
    document.addEventListener("ah:langchange", paintInfo);

    window.addEventListener("resize", layout);
    go(0);
    requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add("is-ready")));
  }

  async function loadArrivals() {
    let products = [];
    try {
      const all = await API.get("/api/products?status=active&view=home");
      const flagged = all.filter((p) => p.is_new_arrival);
      // API already returns them in the dashboard's New Arrivals order
      products = (flagged.length ? flagged : all).slice(0, 7);
    } catch {
      products = [];
    }

    const stage = document.getElementById("arr3dStage");
    if (!products.length) {
      if (stage) stage.innerHTML = `<p class="arr3d__loading">New arrivals are on their way — check back soon.</p>`;
      return;
    }
    mountArrivals(products);
  }

  // Product names already on the page follow a language switch in place
  // (re-rendering the cards would replay their reveal animation).
  document.addEventListener("ah:langchange", () => {
    const ar = AH_I18N.getLang() === "ar";
    document.querySelectorAll("[data-pname-en]").forEach((el) => {
      el.textContent = (ar && el.dataset.pnameAr) || el.dataset.pnameEn;
    });
  });

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

  // Category tiles: the image uploaded in Dashboard → Categories, else the
  // built-in default. The markup ships no src (only data-cat-fallback), so
  // a tile with an uploaded photo never also downloads the default.
  async function loadCategoryImages() {
    let categories = [];
    try { categories = await API.get("/api/categories"); } catch {
      document.querySelectorAll("img[data-cat-fallback]:not([src])").forEach((img) => { img.src = img.dataset.catFallback; });
      return;
    }
    document.querySelectorAll("img[data-cat-img]").forEach((img) => {
      const { src, position, zoom } = categoryImageUrl(img.dataset.catImg, categories, Number(img.dataset.catW), img.dataset.catShape);
      if (img.getAttribute("src") !== src) img.src = src;
      img.style.objectPosition = position;
      img.style.setProperty("--cat-zoom", zoom);
    });
  }

  ready(function () {
    loadArrivals();
    loadSaleBanner();
    loadHeroContent();
    loadCategoryImages();
  });
})();

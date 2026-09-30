// Ported from app/product/[slug]/page.tsx + app/components/ProductDetail.tsx.
(function () {
  function t(key, fallbackEn) {
    return window.AH_I18N ? window.AH_I18N.t(key, fallbackEn) : fallbackEn;
  }
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  const state = {
    colorIdx: 0,
    variantIdx: 0,
    qty: 1,
    fav: false,
    lightboxOpen: false,
    openAcc: null,
    activeIdx: 0,
    added: false,
  };

  let product = null;
  let siteSale = { active: false, percent: 0, label: "" };
  let prevSlug = null;
  let nextSlug = null;

  function images() {
    const colorOptions = product.color_options || [];
    const own = colorOptions[state.colorIdx] && colorOptions[state.colorIdx].imageUrls;
    if (own && own.length) return own;
    return product.image_urls && product.image_urls.length ? product.image_urls : ["/logo hero.png"];
  }

  function renderNotFound() {
    document.getElementById("pdpSlot").innerHTML = `
      <div style="min-height:60vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;padding:40px 20px;text-align:center">
        <h1 style="font-family:'Cormorant Garamond',serif;font-size:28px">${t("productNotFound", "Product not found")}</h1>
        <p style="opacity:.7">${t("productNotFoundText", "This product may have been removed or the link is incorrect.")}</p>
        <a class="btn-solid" href="/shop.html"><span>${t("backToShop", "Back to Shop")}</span></a>
      </div>`;
  }

  function render() {
    const colorOptions = product.color_options || [];
    const variants = product.variants || [];
    const imgs = images();
    const activeImg = imgs[Math.min(state.activeIdx, imgs.length - 1)];

    const selectedVariant = variants[state.variantIdx];
    const basePrice = selectedVariant ? Number(selectedVariant.price) : Number(product.price);
    const salePct = effectiveSalePercent(product, siteSale);
    const price = salePct > 0 ? priceWithSale(basePrice, salePct) : basePrice;
    const saleText = salePct > 0 ? (product.sale_label && product.sale_percent ? product.sale_label : `${t("saleBadge", "Sale")} ${salePct}%`) : "";
    const pname = window.AH_I18N ? window.AH_I18N.productName(product) : product.name;
    const pdesc = window.AH_I18N ? window.AH_I18N.productDescription(product) : product.description;
    const compareAt = product.compare_at_price ? Number(product.compare_at_price) : null;
    const off = salePct > 0 ? salePct : compareAt && compareAt > basePrice ? Math.round(((compareAt - basePrice) / compareAt) * 100) : null;

    const stockQty = selectedVariant ? Number(selectedVariant.stock) : product.stock_qty;
    const st = stockState({ stock_qty: stockQty, low_stock_threshold: product.low_stock_threshold });

    const setSize = product.pricing_mode === "set" ? product.set_size : null;
    const perPiece = product.price_per_piece ? Number(product.price_per_piece) : null;

    const thumbsHtml = imgs
      .map(
        (img, i) => `
      <button type="button" class="pdp__thumb${i === state.activeIdx ? " is-active" : ""}" data-thumb="${i}" aria-label="View image ${i + 1}">
        <img src="${cldUrl(img, 160)}" alt="" loading="lazy" />
      </button>`
      )
      .join("");

    let eyebrow = "";
    if (salePct > 0) eyebrow = `<p class="pdp__eyebrow" style="color:#A93B29">${saleText}</p>`;
    else if (product.is_new_arrival) eyebrow = `<p class="pdp__eyebrow">${t("newArrival", "New Arrival")}</p>`;
    else if (product.badge) eyebrow = `<p class="pdp__eyebrow">${product.badge}</p>`;

    const colorHtml = colorOptions.length
      ? `<div class="pdp__option">
          <p class="pdp__option-label">${t("color", "Color")}${colorOptions[state.colorIdx] ? ": " + colorOptions[state.colorIdx].name : ""}</p>
          <div class="pdp__swatches">
            ${colorOptions
              .map(
                (c, i) => `<button type="button" class="pdp__swatch${i === state.colorIdx ? " is-active" : ""}" style="background:${c.hex}" aria-label="${c.name}" title="${c.name}" data-color-idx="${i}"></button>`
              )
              .join("")}
          </div>
        </div>`
      : "";

    const sizesHtml = variants.length
      ? `<div class="pdp__option">
          <p class="pdp__option-label">${t("size", "Size")}</p>
          <div class="pdp__sizes">
            ${variants
              .map((v, i) => {
                const vOut = Number(v.stock) <= 0;
                const vPrice = salePct > 0 ? priceWithSale(v.price, salePct) : Number(v.price);
                return `<button type="button" class="pdp__size${i === state.variantIdx ? " is-active" : ""}" data-variant-idx="${i}" ${vOut ? 'disabled style="opacity:.45;cursor:not-allowed"' : ""}>
                  ${v.label}<small>${vOut ? t("soldOut", "Sold out") : "EGP " + vPrice.toLocaleString("en-US")}</small>
                </button>`;
              })
              .join("")}
          </div>
        </div>`
      : "";

    const stars = Array.from({ length: 5 })
      .map(() => `<svg viewBox="0 0 24 24"><path d="M12 2 14.9 8.6 22 9.3 16.8 13.9 18.4 21 12 17.3 5.6 21 7.2 13.9 2 9.3 9.1 8.6Z"></path></svg>`)
      .join("");

    const accs = [
      { title: t("productDetails", "Product Details"), body: `${pdesc || ""}${product.size_cm ? `\n${t("dimensions", "Dimensions")}: ${product.size_cm}` : ""}${product.sku ? `\nSKU: ${product.sku}` : ""}` },
      { title: t("materialsAndCare", "Materials & Care"), body: `${product.material || t("qualityMaterials", "Quality materials")}. ${t("careInstructions", "Wipe clean with a soft, dry cloth. Avoid harsh chemicals and prolonged direct sunlight.")}` },
      { title: t("shippingAndReturns", "Shipping & Returns"), body: t("shippingReturnsText", "Delivery across Egypt with standard or express shipping, priced by governorate at checkout. Easy returns within 14 days of delivery, provided the item is unused and in its original packaging.") },
    ];
    const accsHtml = accs
      .map(
        (acc, i) => `
      <div class="acc">
        <button type="button" class="acc__head" data-acc="${i}" aria-expanded="${state.openAcc === i}">
          <span>${acc.title}</span>
          <span class="acc__plus" aria-hidden="true"><svg viewBox="0 0 16 16"><line x1="8" y1="2" x2="8" y2="14"></line><line x1="2" y1="8" x2="14" y2="8"></line></svg></span>
        </button>
        <div class="acc__body" style="max-height:${state.openAcc === i ? "400px" : "0px"}">
          <p style="white-space:pre-line">${acc.body}</p>
        </div>
      </div>`
      )
      .join("");

    document.getElementById("pdpSlot").innerHTML = `
    <main class="pdp">
      <div class="pdp__bg" aria-hidden="true">
        <img src="/خلفيه منتجات.png" alt="" loading="eager" />
      </div>

      <div class="pdp__inner">
        <div class="pdp__topbar">
          <p class="crumb">
            <a href="/">${t("home", "Home")}</a>
            <span class="crumb__sep" aria-hidden="true">&rsaquo;</span>
            <a href="/shop.html">${t("shop", "Shop")}</a>
            <span class="crumb__sep" aria-hidden="true">&rsaquo;</span>
            <span class="crumb__here">${pname}</span>
          </p>
          <nav class="pdp__nav" aria-label="Other products">
            ${
              prevSlug
                ? `<a class="pdp__nav-link" href="/product.html?slug=${encodeURIComponent(prevSlug)}"><svg viewBox="0 0 20 14" aria-hidden="true"><line x1="19" y1="7" x2="2" y2="7"></line><polyline points="7.4,1.6 1.6,7 7.4,12.4"></polyline></svg>${t("prev", "Prev")}</a>`
                : `<span class="pdp__nav-link" style="opacity:.4">${t("prev", "Prev")}</span>`
            }
            <span class="pdp__nav-sep" aria-hidden="true">|</span>
            ${
              nextSlug
                ? `<a class="pdp__nav-link" href="/product.html?slug=${encodeURIComponent(nextSlug)}">${t("next", "Next")}<svg viewBox="0 0 20 14" aria-hidden="true"><line x1="1" y1="7" x2="18" y2="7"></line><polyline points="12.6,1.6 18.4,7 12.6,12.4"></polyline></svg></a>`
                : `<span class="pdp__nav-link" style="opacity:.4">${t("next", "Next")}</span>`
            }
          </nav>
        </div>

        <div class="pdp__top">
          <div class="pdp__gallery">
            <div class="pdp__thumbs">${thumbsHtml}</div>

            <figure class="pdp__main">
              <img id="pdpMainImg" src="${cldUrl(activeImg, 900)}" alt="${pname}" loading="eager" />
              <span class="pdp__count">
                <em>${String(state.activeIdx + 1).padStart(2, "0")}</em><i></i><b>${String(imgs.length).padStart(2, "0")}</b>
              </span>
              <button type="button" class="pdp__zoom" id="pdpZoomBtn" aria-label="Zoom image">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3H3v6"></path><path d="M15 21h6v-6"></path><path d="M21 3h-6"></path><path d="M3 21h6"></path></svg>
              </button>
              ${imgs.length > 1 ? `
              <button type="button" class="pdp__mainNav pdp__mainNav--prev" id="pdpMainPrev" aria-label="Previous image" ${state.activeIdx === 0 ? "disabled" : ""}>
                <svg viewBox="0 0 20 14" aria-hidden="true"><line x1="19" y1="7" x2="2" y2="7"></line><polyline points="7.4,1.6 1.6,7 7.4,12.4"></polyline></svg>
              </button>
              <button type="button" class="pdp__mainNav pdp__mainNav--next" id="pdpMainNext" aria-label="Next image" ${state.activeIdx === imgs.length - 1 ? "disabled" : ""}>
                <svg viewBox="0 0 20 14" aria-hidden="true"><line x1="1" y1="7" x2="18" y2="7"></line><polyline points="12.6,1.6 18.4,7 12.6,12.4"></polyline></svg>
              </button>` : ""}
            </figure>
          </div>

          <div class="pdp__info">
            ${eyebrow}
            <h1 class="pdp__title">${pname}</h1>

            <div class="pdp__priceRow">
              <span class="pdp__price"${salePct > 0 ? ' style="color:#A93B29"' : ""}>EGP ${price.toLocaleString("en-US")}</span>
              ${
                salePct > 0
                  ? `<span class="pdp__compare">EGP ${basePrice.toLocaleString("en-US")}</span>`
                  : compareAt
                  ? `<span class="pdp__compare">EGP ${compareAt.toLocaleString("en-US")}</span>`
                  : ""
              }
              ${off ? `<span class="pdp__off">${off}% ${t("off", "OFF")}</span>` : ""}
            </div>

            ${
              setSize
                ? `<p style="margin:-6px 0 14px;font-size:12.5px;color:var(--ink-600)">${t("soldAsSet", "Sold as a set of {n}").replace("{n}", setSize)}${perPiece ? ` — EGP ${perPiece.toLocaleString("en-US")} ${t("perPiece", "per piece")}` : ""}</p>`
                : ""
            }

            <div class="pdp__rating">
              <span class="pdp__stars" aria-hidden="true">${stars}</span>
              <span class="pdp__rating-num">${Number(product.rating || 0).toFixed(1)}</span>
              <span class="pdp__rating-count">(${product.review_count || 0} ${t("reviews", "reviews")})</span>
            </div>

            <p class="pdp__desc">${pdesc || ""}</p>

            <span class="pdp__rule" aria-hidden="true"></span>

            ${colorHtml}
            ${sizesHtml}

            <div class="pdp__qtyRow">
              <div>
                <p class="pdp__option-label">${t("quantity", "Quantity")}:</p>
                <div class="qty pdp__qty" role="group" aria-label="Quantity">
                  <button type="button" class="qty__btn" id="pdpQtyDec" aria-label="Decrease quantity"><svg viewBox="0 0 16 16" aria-hidden="true"><line x1="3" y1="8" x2="13" y2="8"></line></svg></button>
                  <span class="qty__num">${state.qty}</span>
                  <button type="button" class="qty__btn" id="pdpQtyInc" aria-label="Increase quantity"><svg viewBox="0 0 16 16" aria-hidden="true"><line x1="8" y1="3" x2="8" y2="13"></line><line x1="3" y1="8" x2="13" y2="8"></line></svg></button>
                </div>
              </div>
              <p class="pdp__stock">
                <span class="pdp__stock-dot" style="background:${st === "out" ? "#A93B29" : st === "low" ? "#D9A441" : "#5C6B4A"}" aria-hidden="true"></span>
                ${st === "out" ? t("outOfStock", "Out of Stock") : st === "low" ? t("lowStock", "Low Stock") : t("inStock", "In Stock")}
                <br />
                <small>${st === "out" ? t("restockingSoon", "Restocking soon") : st === "low" ? t("onlyLeft", "Only {n} left").replace("{n}", stockQty) : t("readyToShip", "Ready to ship")}</small>
              </p>
            </div>

            <div class="pdp__actions">
              <button type="button" class="pdp-btn pdp-btn--dark" id="pdpAddBtn" ${st === "out" ? "disabled" : ""}>
                <span>${st === "out" ? t("outOfStock", "Out of Stock") : state.added ? t("addedToCart", "Added to Cart ✓") : `${t("addToCartPrice", "Add to Cart —")} <span>EGP ${(price * state.qty).toLocaleString("en-US")}</span>`}</span>
              </button>
              <button type="button" class="pdp-fav" id="pdpFavBtn" aria-label="Save to wishlist" aria-pressed="${state.fav}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4 4.6 13.2a4.6 4.6 0 1 1 7.4-5.3 4.6 4.6 0 1 1 7.4 5.3Z"></path></svg>
              </button>
            </div>

            <ul class="pdp__trust">
              <li><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M2.6 8.4h14v12.8h-14z"></path><path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"></path><circle cx="9.2" cy="24" r="2.6"></circle><circle cx="22.6" cy="24" r="2.6"></circle></svg><span>${t("freeDeliveryShort", "Free Delivery<br />Across Egypt")}</span></li>
              <li><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4.4 9.8A12 12 0 1 1 4 16"></path><polyline points="4.4,4.2 4.4,9.8 10,9.8"></polyline></svg><span>${t("easyReturns", "Easy Returns<br />Within 14 Days")}</span></li>
              <li><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6.4" y="14" width="19.2" height="14" rx="2.4"></rect><path d="M10.8 14V10a5.2 5.2 0 0 1 10.4 0v4"></path><circle cx="16" cy="21" r="1.6"></circle></svg><span>${t("securePayment", "Secure Payment<br />100% Safe")}</span></li>
            </ul>

            <span class="pdp__rule" aria-hidden="true"></span>

            <div class="pdp__accordions">${accsHtml}</div>
          </div>
        </div>

        <section class="pdp__story">
          <p class="pdp__story-kicker">${t("handcraftedTitle", "Handcrafted With Purpose")}</p>
          <h2 class="pdp__story-title">${t("naturalTexture", "Natural Texture,<br />Timeless Beauty.")}</h2>
          <p class="pdp__story-text">${t("handcraftedText", "Each piece is carefully handcrafted, featuring a unique texture and earthy tones that make it a perfect addition to any interior style.")}</p>
          <ul class="pdp__features">
            <li><span class="pdp__feature-ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 4c6 6 6 14 0 24-6-10-6-18 0-24Z"></path></svg></span><strong>${t("handcraftedPct", "100%")}</strong><span>${t("handcrafted", "Handcrafted")}</span></li>
            <li><span class="pdp__feature-ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 3 27 12l-11 17L5 12Z"></path></svg></span><strong>${t("premium", "Premium")}</strong><span>${product.material || t("qualityMaterials", "Quality")} ${t("materialSuffix", "Material")}</span></li>
            <li><span class="pdp__feature-ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M6 12v10a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V12"></path></svg></span><strong>${t("uniquePiece", "Unique")}</strong><span>${t("uniquePieceText", "Each Piece is One of a Kind")}</span></li>
          </ul>
        </section>
      </div>

      <div class="pdp-lightbox" id="pdpLightbox" data-open="${state.lightboxOpen ? "true" : "false"}" aria-hidden="${!state.lightboxOpen}">
        <button type="button" class="pdp-lightbox__scrim" id="pdpLightboxScrim" tabindex="-1" aria-label="Close zoom"></button>
        <div class="pdp-lightbox__stage">
          <img id="pdpLightboxImg" src="${cldUrl(activeImg, 1600)}" alt="${pname}" />
          <button type="button" class="pdp-lightbox__close" id="pdpLightboxClose" aria-label="Close zoom">
            <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="4.6" y1="4.6" x2="19.4" y2="19.4"></line><line x1="19.4" y1="4.6" x2="4.6" y2="19.4"></line></svg>
          </button>
        </div>
      </div>
    </main>`;

    wireEvents();
  }

  function wireEvents() {
    document.querySelectorAll("[data-thumb]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.activeIdx = Number(btn.dataset.thumb);
        render();
      });
    });

    // Small transparent prev/next arrows beside the main image, plus
    // scrolling (wheel or touch swipe) over the main image itself steps
    // through photos the same way. Both paths swap the photo with a quick
    // crossfade instead of the full-page re-render's instant cut, and
    // scroll the matching thumbnail into view in the rail so the customer
    // can always see which photo is active without hunting for it.
    const imgList = images();
    const imgCount = imgList.length;
    function stepImage(dir) {
      const next = state.activeIdx + dir;
      if (next < 0 || next >= imgCount) return;
      state.activeIdx = next;

      const mainImgEl = document.getElementById("pdpMainImg");
      const countEm = document.querySelector(".pdp__count em");
      const prevBtnEl = document.getElementById("pdpMainPrev");
      const nextBtnEl = document.getElementById("pdpMainNext");

      if (mainImgEl) {
        mainImgEl.classList.add("is-fading");
        setTimeout(() => {
          mainImgEl.src = cldUrl(imgList[state.activeIdx], 900);
          mainImgEl.classList.remove("is-fading");
        }, 180);
      }
      if (countEm) countEm.textContent = String(state.activeIdx + 1).padStart(2, "0");
      if (prevBtnEl) prevBtnEl.disabled = state.activeIdx === 0;
      if (nextBtnEl) nextBtnEl.disabled = state.activeIdx === imgCount - 1;

      document.querySelectorAll(".pdp__thumb").forEach((t, i) => t.classList.toggle("is-active", i === state.activeIdx));
      const newActiveThumb = document.querySelectorAll(".pdp__thumb")[state.activeIdx];
      if (newActiveThumb) newActiveThumb.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }
    const prevBtn = document.getElementById("pdpMainPrev");
    const nextBtn = document.getElementById("pdpMainNext");
    if (prevBtn) prevBtn.addEventListener("click", () => stepImage(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => stepImage(1));

    const mainFigure = document.querySelector(".pdp__main");
    if (mainFigure && imgCount > 1) {
      let wheelLock = false;
      mainFigure.addEventListener(
        "wheel",
        (e) => {
          if (wheelLock) return;
          const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
          const delta = horizontal ? e.deltaX : e.deltaY;
          if (Math.abs(delta) < 12) return;
          e.preventDefault();
          wheelLock = true;
          stepImage(delta > 0 ? 1 : -1);
          setTimeout(() => { wheelLock = false; }, 350);
        },
        { passive: false }
      );
    }

    const activeThumb = document.querySelector(".pdp__thumb.is-active");
    if (activeThumb) activeThumb.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });

    document.querySelectorAll("[data-color-idx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.colorIdx = Number(btn.dataset.colorIdx);
        state.activeIdx = 0;
        render();
      });
    });

    document.querySelectorAll("[data-variant-idx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.variantIdx = Number(btn.dataset.variantIdx);
        render();
      });
    });

    const qtyDec = document.getElementById("pdpQtyDec");
    const qtyInc = document.getElementById("pdpQtyInc");
    qtyDec && qtyDec.addEventListener("click", () => {
      state.qty = Math.max(1, state.qty - 1);
      render();
    });
    qtyInc && qtyInc.addEventListener("click", () => {
      const variants = product.variants || [];
      const selectedVariant = variants[state.variantIdx];
      const stockQty = selectedVariant ? Number(selectedVariant.stock) : product.stock_qty;
      state.qty = Math.min(Math.max(1, stockQty || 1), state.qty + 1);
      render();
    });

    const addBtn = document.getElementById("pdpAddBtn");
    addBtn &&
      addBtn.addEventListener("click", () => {
        const variants = product.variants || [];
        const colorOptions = product.color_options || [];
        const selectedVariant = variants[state.variantIdx];
        const stockQty = selectedVariant ? Number(selectedVariant.stock) : product.stock_qty;
        const st = stockState({ stock_qty: stockQty, low_stock_threshold: product.low_stock_threshold });
        if (st === "out") return;

        const basePrice = selectedVariant ? Number(selectedVariant.price) : Number(product.price);
        const salePct = effectiveSalePercent(product, siteSale);
        const price = salePct > 0 ? priceWithSale(basePrice, salePct) : basePrice;
        const imgs = images();

        const id =
          product.slug +
          (selectedVariant ? "::" + selectedVariant.label : "") +
          (colorOptions[state.colorIdx] ? "::" + colorOptions[state.colorIdx].name : "");
        const variantLabel = [colorOptions[state.colorIdx] && colorOptions[state.colorIdx].name, selectedVariant && selectedVariant.label].filter(Boolean).join(" · ") || undefined;

        const cartName = window.AH_I18N ? window.AH_I18N.productName(product) : product.name;
        Cart.add({ id, name: cartName, price, image: splitFocal(imgs[0]).src, variant: variantLabel, weightKg: product.weight_kg ? Number(product.weight_kg) : 0 }, state.qty);
        state.added = true;
        render();
        setTimeout(() => {
          state.added = false;
          render();
        }, 1400);
        document.getElementById("cartBtn") && document.getElementById("cartBtn").click();
      });

    const favBtn = document.getElementById("pdpFavBtn");
    favBtn &&
      favBtn.addEventListener("click", () => {
        state.fav = !state.fav;
        render();
      });

    document.querySelectorAll("[data-acc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.acc);
        state.openAcc = state.openAcc === i ? null : i;
        render();
      });
    });

    const zoomBtn = document.getElementById("pdpZoomBtn");
    const mainImg = document.getElementById("pdpMainImg");
    const openLightbox = () => {
      state.lightboxOpen = true;
      render();
    };
    zoomBtn && zoomBtn.addEventListener("click", openLightbox);
    mainImg && mainImg.addEventListener("click", openLightbox);

    const closeLightbox = () => {
      state.lightboxOpen = false;
      render();
    };
    const lbScrim = document.getElementById("pdpLightboxScrim");
    const lbClose = document.getElementById("pdpLightboxClose");
    const lbImg = document.getElementById("pdpLightboxImg");
    lbScrim && lbScrim.addEventListener("click", closeLightbox);
    lbClose && lbClose.addEventListener("click", closeLightbox);
    lbImg && lbImg.addEventListener("click", closeLightbox);
  }

  async function init() {
    if (!slug) {
      renderNotFound();
      return;
    }
    try {
      const [prod, sale] = await Promise.all([API.get("/api/products?slug=" + encodeURIComponent(slug)), API.get("/api/settings?key=site_sale")]);
      product = prod;
      siteSale = sale;
      document.title = `${window.AH_I18N ? window.AH_I18N.productName(product) : product.name} — Antique Home`;

      // neighbors: same category, newest-first (fetch the full active catalog
      // and filter/sort client-side — /api/products?category= takes a slug,
      // not the numeric category_id we have here).
      try {
        let pool = await API.get("/api/products?status=active");
        pool = pool.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        let filteredPool = pool.filter((p) => p.category_id === product.category_id);
        if (filteredPool.length < 2) filteredPool = pool;
        const idx = filteredPool.findIndex((p) => p.id === product.id);
        prevSlug = idx > 0 ? filteredPool[idx - 1].slug : null;
        nextSlug = idx >= 0 && idx < filteredPool.length - 1 ? filteredPool[idx + 1].slug : null;
      } catch {
        prevSlug = null;
        nextSlug = null;
      }

      render();
    } catch {
      renderNotFound();
    }
  }

  document.addEventListener("ah:langchange", () => {
    if (product) {
      document.title = `${window.AH_I18N ? window.AH_I18N.productName(product) : product.name} — Antique Home`;
      render();
    }
  });
  if (window.AH_I18N) window.AH_I18N.wireLangButtons();

  init();
})();

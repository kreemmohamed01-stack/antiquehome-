// Ported from app/shop/page.tsx + app/category/[slug]/page.tsx + ShopView.tsx.
// Handles both "all products" (no ?category=) and a single category (?category=slug),
// including that category's banner section from category/[slug]/page.tsx's BANNER map.
(function () {
  const PAGE_SIZE = 8;
  // Shorthand for AH_I18N.t — falls back to the English string untouched
  // when i18n.js hasn't loaded yet or the site is in English mode.
  function t(key, fallbackEn) {
    return window.AH_I18N ? window.AH_I18N.t(key, fallbackEn) : fallbackEn;
  }

  const CATEGORY_LIST = [
    { slug: "all", label: "All Products", key: "allProducts" },
    { slug: "bleu-blanc", label: "Bleu Blanc", key: "banner:bleu-blancTitle" },
    { slug: "lighting", label: "Lighting", key: "banner:lightingTitle" },
    { slug: "accessories", label: "Accessories", key: "banner:accessoriesTitle" },
    { slug: "antiques", label: "Antiques", key: "banner:antiquesTitle" },
    { slug: "artificial-plants-garden-stool", label: "Artificial Plants & Garden Stool", key: "banner:artificial-plants-garden-stoolTitle" },
    { slug: "wall-art-plates", label: "Wall Art & Plates", key: "banner:wall-art-platesTitle" },
    { slug: "murano-glass", label: "Murano Glass", key: "banner:murano-glassTitle" },
    { slug: "furniture", label: "Furniture", key: "banner:furnitureTitle" },
    { slug: "sale", label: "Sale", key: "banner:saleTitle" },
  ];

  const BANNER = {
    "bleu-blanc": { title: "BLEU BLANC", text: "Porcelain in classic blue and white, timeless on every table." },
    lighting: { title: "LIGHTING", text: "Chandeliers, lamps and sconces that cast a warm, antique glow." },
    accessories: { title: "ACCESSORIES", text: "Small finishing pieces — busts, boxes and objets for every shelf." },
    antiques: { title: "ANTIQUES", text: "Rare finds with real history, each one a story for your home." },
    "artificial-plants-garden-stool": { title: "ARTIFICIAL PLANTS & GARDEN STOOL", text: "Lush greenery and ceramic stools that never need watering." },
    "wall-art-plates": { title: "WALL ART & PLATES", text: "Framed pieces and decorative plates to dress every wall." },
    "murano-glass": { title: "MURANO GLASS", text: "Hand-blown glass from Venice, colour and light in one form." },
    furniture: { title: "FURNITURE", text: "Statement chairs, consoles and tables built to be inherited." },
    sale: { title: "SALE", text: "Timeless pieces at a kinder price, for a limited time only." },
    // Accessories subcategories — share its category photo until each
    // gets its own; the shop grid below still filters to only that
    // subcategory's products.
    "colored-vases": { title: "COLORED VASES", text: "Hand-finished vases in rich, saturated colour for every shelf." },
    "candle-holder": { title: "CANDLE HOLDERS", text: "Sculptural holders that carry candlelight with quiet elegance." },
    raisin: { title: "RAISIN", text: "Delicate resin pieces, cast with texture and warmth." },
    "tissue-box": { title: "TISSUE BOXES", text: "Everyday essentials dressed in timeless, decorative covers." },
    ashtray: { title: "ASHTRAYS", text: "Finely finished trays that double as tabletop sculpture." },
    "photo-frame": { title: "PHOTO FRAMES", text: "Frames crafted to hold your favourite moments beautifully." },
  };

  const SORT_LABELS_KEYS = {
    newest: "sortNewest",
    "price-asc": "sortPriceAsc",
    "price-desc": "sortPriceDesc",
    "name-asc": "sortNameAsc",
  };
  const SORT_LABELS = {
    newest: "Newest",
    "price-asc": "Price: Low to High",
    "price-desc": "Price: High to Low",
    "name-asc": "Name: A–Z",
  };

  const params = new URLSearchParams(window.location.search);
  const activeCategory = params.get("category") || "all";
  const searchQuery = params.get("q") || "";

  const state = {
    sort: "newest",
    page: 1,
    maxPrice: 20000,
    color: null,
    materials: [],
    view: "grid",
  };

  let allProducts = [];
  let categories = [];
  let categoriesLoaded = false; // until /api/categories answers, category <img>s render without src (no flash of the wrong photo)
  let categoryById = new Map();
  let siteSale = { active: false, percent: 0, label: "" };

  // Category photos (banner background + rail icons) come from Dashboard →
  // Categories when an image was uploaded there, else the built-in default
  // (see categoryImageUrl in api.js). Each <img> is tagged with its slug so
  // applyCategoryImages() can fill/refresh them once categories arrive.
  function catImgAttrs(slug, width, shape) {
    if (!categoriesLoaded) return `data-cat-img="${slug}" data-cat-w="${width}" data-cat-shape="${shape}"`;
    const { src, position, zoom } = categoryImageUrl(slug, categories, width, shape);
    return `data-cat-img="${slug}" data-cat-w="${width}" data-cat-shape="${shape}" src="${src}" style="object-position:${position};--cat-zoom:${zoom}"`;
  }
  function applyCategoryImages() {
    document.querySelectorAll("img[data-cat-img]").forEach((img) => {
      const { src, position, zoom } = categoryImageUrl(img.dataset.catImg, categories, Number(img.dataset.catW), img.dataset.catShape);
      if (img.getAttribute("src") !== src) img.src = src;
      img.style.objectPosition = position;
      img.style.setProperty("--cat-zoom", zoom);
    });
  }

  function renderChrome() {
    const heroSlot = document.getElementById("shopHeroSlot");
    const railSlot = document.getElementById("catRailSlot");

    if (window.AH_SEO) {
      if (activeCategory === "all") {
        window.AH_SEO.setMeta({
          title: "All Products — Antique Home",
          description: "Browse our full collection of curated vases, antiques, lighting and home décor — timeless pieces for every room.",
          path: "/shop.html",
        });
      } else {
        const b = BANNER[activeCategory] || { title: activeCategory.toUpperCase(), text: "" };
        window.AH_SEO.setMeta({
          title: `${b.title.charAt(0)}${b.title.slice(1).toLowerCase()} — Antique Home`,
          description: b.text || `Shop ${b.title.toLowerCase()} at Antique Home — curated pieces for every room.`,
          path: `/shop.html?category=${encodeURIComponent(activeCategory)}`,
          image: categoryImageUrl(activeCategory, categories, 1200, "banner").src,
        });
      }
    }

    if (activeCategory === "all") {
      heroSlot.innerHTML = `
        <section class="shop-hero" id="shopHero">
          <div class="shop-hero__media" aria-hidden="true">
            <picture>
              <source media="(min-width: 900px)" srcset="/هيرو شوب ناو لاب .webp" />
              <img src="/هيرو شوب ناو موبيل .webp" alt="" loading="eager" fetchpriority="high" />
            </picture>
            <div class="shop-hero__tint"></div>
          </div>

          <header class="header">
            <a class="brand" href="/" aria-label="Antique Home — Vase &amp; Decor">
              <img class="brand__logo" src="/logo hero.png" alt="Antique Home — Vase &amp; Decor" />
              <span class="brand__shine" aria-hidden="true"></span>
            </a>
            <button class="icon-btn menu-btn" type="button" id="menuBtn" aria-haspopup="true" aria-expanded="false" aria-controls="sideMenu" aria-label="Open menu">
              <span class="menu-btn__lines" aria-hidden="true"><span></span><span></span><span></span></span>
              <span class="menu-btn__label">${t("menu", "Menu")}</span>
            </button>
            <nav class="header__actions" aria-label="Utilities">
              <button class="icon-btn" type="button" id="searchBtn" aria-haspopup="true" aria-expanded="false" aria-controls="searchDrawer" aria-label="Search">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.4"></circle><line x1="15.7" y1="15.7" x2="20.2" y2="20.2"></line></svg>
              </button>
              <button class="icon-btn cart-btn" type="button" id="cartBtn" aria-haspopup="true" aria-expanded="false" aria-controls="cartDrawer" aria-label="Shopping bag">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.6 7.8h12.8l1 12.4H4.6z"></path><path d="M8.9 9.6V6.6a3.1 3.1 0 0 1 6.2 0v3"></path></svg>
                <span class="cart-btn__count">0</span>
              </button>
              <button class="icon-btn lang-btn" type="button" id="langBtn" aria-label="Switch language">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.4"></circle><path d="M2.6 12h18.8"></path><path d="M12 2.6c2.6 2.6 4 5.9 4 9.4s-1.4 6.8-4 9.4c-2.6-2.6-4-5.9-4-9.4s1.4-6.8 4-9.4Z"></path></svg>
                <span class="lang-btn__label" id="langBtnLabel"></span>
              </button>
            </nav>
          </header>

          <nav class="shop-nav shop-nav--hero" aria-label="Primary">
            <a href="/">${t("home", "Home")}</a>
            <a href="/shop.html" class="is-active">${t("shop", "Shop")}</a>
            <a href="/#collection">${t("collections", "Collections")}</a>
            <a href="/about.html">${t("aboutUs", "About Us")}</a>
            <a href="/#contact">${t("contact", "Contact")}</a>
          </nav>

          <div class="shop-hero__inner">
            <p class="crumb rv rv--left" data-rv>
              <a href="/">${t("home", "Home")}</a>
              <span class="crumb__sep" aria-hidden="true">&rsaquo;</span>
              <span class="crumb__here">${t("allProducts", "All Products")}</span>
            </p>
            <p class="shop-hero__eyebrow rv rv--left" data-rv style="--rd:.06s">${t("discoverCollection", "Discover Our Collection")}</p>
            <h1 class="shop-hero__title rv rv--left" data-rv style="--rd:.12s">${t("allProducts", "All Products")}</h1>
            <p class="shop-hero__text rv rv--left" data-rv style="--rd:.18s">${t("curatedPieces", "Curated pieces for a more beautiful home.")}</p>
          </div>
        </section>`;
      railSlot.innerHTML = catRailHtml("all");
    } else {
      const banner = BANNER[activeCategory] || { title: activeCategory.toUpperCase(), text: "" };
      const bannerTitle = t(`banner:${activeCategory}Title`, banner.title);
      const bannerText = t(`banner:${activeCategory}Text`, banner.text);
      heroSlot.innerHTML = `
        <div class="shop-topbar-wrap">
          <div class="shop-topbar">
            <span class="shop-topbar__ship">
              <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M2.6 8.4h14v12.8h-14z"></path><path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"></path><circle cx="9.2" cy="24" r="2.6"></circle><circle cx="22.6" cy="24" r="2.6"></circle></svg>
              ${t("freeDelivery", "Free Delivery Across Egypt")}
            </span>
            <span class="shop-topbar__right"><span>EGP</span><span>|</span><span>EN</span></span>
          </div>
          <div class="shop-header">
            <header class="header">
              <a class="brand" href="/" aria-label="Antique Home — Vase &amp; Decor">
                <img class="brand__logo" src="/logo hero.png" alt="Antique Home — Vase &amp; Decor" />
                <span class="brand__shine" aria-hidden="true"></span>
              </a>
              <button class="icon-btn menu-btn" type="button" id="menuBtn" aria-haspopup="true" aria-expanded="false" aria-controls="sideMenu" aria-label="Open menu">
                <span class="menu-btn__lines" aria-hidden="true"><span></span><span></span><span></span></span>
                <span class="menu-btn__label">${t("menu", "Menu")}</span>
              </button>
              <nav class="header__actions" aria-label="Utilities">
                <button class="icon-btn" type="button" id="searchBtn" aria-haspopup="true" aria-expanded="false" aria-controls="searchDrawer" aria-label="Search">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.4"></circle><line x1="15.7" y1="15.7" x2="20.2" y2="20.2"></line></svg>
                </button>
                <button class="icon-btn cart-btn" type="button" id="cartBtn" aria-haspopup="true" aria-expanded="false" aria-controls="cartDrawer" aria-label="Shopping bag">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.6 7.8h12.8l1 12.4H4.6z"></path><path d="M8.9 9.6V6.6a3.1 3.1 0 0 1 6.2 0v3"></path></svg>
                  <span class="cart-btn__count">0</span>
                </button>
                <button class="icon-btn lang-btn" type="button" id="langBtn" aria-label="Switch language">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.4"></circle><path d="M2.6 12h18.8"></path><path d="M12 2.6c2.6 2.6 4 5.9 4 9.4s-1.4 6.8-4 9.4c-2.6-2.6-4-5.9-4-9.4s1.4-6.8 4-9.4Z"></path></svg>
                  <span class="lang-btn__label" id="langBtnLabel"></span>
                </button>
              </nav>
            </header>
            <nav class="shop-nav" aria-label="Primary">
              <a href="/">${t("home", "Home")}</a>
              <a href="/shop.html">${t("shop", "Shop")}</a>
              <a href="/#collection">${t("collections", "Collections")}</a>
              <a href="/about.html">${t("aboutUs", "About")}</a>
              <a href="/#contact">${t("contact", "Contact")}</a>
            </nav>
          </div>
        </div>

        <section class="shop shop-banner">
          <div class="shop-banner__bg" aria-hidden="true"><img ${catImgAttrs(activeCategory, 1600, "banner")} alt="" fetchpriority="high" /></div>
          <div class="shop-banner__inner">
            <p class="crumb rv rv--left" data-rv>
              <a href="/">${t("home", "Home")}</a>
              <span class="crumb__sep" aria-hidden="true">&rsaquo;</span>
              <a href="/shop.html">${t("shop", "Shop")}</a>
              <span class="crumb__sep" aria-hidden="true">&rsaquo;</span>
              <span class="crumb__here">${bannerTitle.charAt(0)}${bannerTitle.slice(1).toLowerCase()}</span>
            </p>
            <h1 class="shop-banner__title rv rv--left" data-rv style="--rd:.08s">${bannerTitle}</h1>
            <span class="shop-banner__rule" aria-hidden="true"><i></i><i></i></span>
            <p class="shop-banner__text rv rv--left" data-rv style="--rd:.16s">${bannerText}</p>
          </div>
        </section>
        <div id="subcatRailSlot"></div>`;
      railSlot.innerHTML = "";
      renderSubcatRail();
    }

    if (window.AH_REVEAL) window.AH_REVEAL.scan(heroSlot);
  }

  // When the current category has real subcategories (fetched live from
  // /api/categories, not hardcoded), shows them as a row of pill links
  // right under its banner — e.g. landing on Accessories shows Colored
  // Vases / Candle Holder / Raisin / etc. so a customer can jump straight
  // into one instead of only reaching it via a direct link.
  function renderSubcatRail() {
    const slot = document.getElementById("subcatRailSlot");
    if (!slot) return;
    const current = categories.find((c) => c.slug === activeCategory);
    if (!current) { slot.innerHTML = ""; return; }

    // On a parent category (e.g. Accessories), list its subcategories.
    // On a subcategory itself (e.g. Colored Vases), list its siblings —
    // plus the parent, so it's a one-click way back up to the full group.
    const parentId = current.parent_id || current.id;
    const parent = categories.find((c) => c.id === parentId);
    const subs = categories.filter((c) => c.parent_id === parentId);
    if (!subs.length) { slot.innerHTML = ""; return; }

    const links = current.parent_id
      ? [{ slug: parent.slug, name: parent.name, isParent: true }, ...subs]
      : subs;

    const catName = (c) => (window.AH_I18N ? window.AH_I18N.categoryName(c) : c.name);
    slot.innerHTML = `
      <nav class="subcat-rail" aria-label="Shop ${parent.name} by type">
        <div class="subcat-rail__inner">
          <span class="subcat-rail__label">${t("shopByType", "Shop by type")}</span>
          <div class="subcat-rail__list">
            ${links.map((s) => `<a class="subcat-rail__pill${s.slug === activeCategory ? " is-active" : ""}${s.isParent ? " subcat-rail__pill--all" : ""}" href="/shop.html?category=${s.slug}">${s.isParent ? t("allCategory", "All") + " " + catName(s) : catName(s)}</a>`).join("")}
          </div>
        </div>
      </nav>`;
  }

  function catRailHtml(active) {
    const ITEMS = [
      { slug: "bleu-blanc", key: "catBleuBlanc", label: "Bleu Blanc" },
      { slug: "accessories", key: "catAccessories", label: "Decor Accents" },
      { slug: "lighting", key: "catLighting", label: "Lighting" },
      { slug: "murano-glass", key: "catMurano", label: "Murano Glass" },
      { slug: "wall-art-plates", key: "catWallArtShort", label: "Wall Art" },
      { slug: "furniture", key: "catFurniture", label: "Furniture" },
      { slug: "antiques", key: "catAntiques", label: "Antiques" },
      { slug: "artificial-plants-garden-stool", key: "catTrays", label: "Trays" },
      { slug: "sale", key: "catSale", label: "Sale" },
    ];
    const items = ITEMS.map(
      (it) => `
      <a class="catrail__item${active === it.slug ? " catrail__item--active" : ""}" href="/shop.html?category=${it.slug}">
        <span class="catrail__ico"><img ${catImgAttrs(it.slug, 160, "rail")} alt="" loading="lazy" /></span>
        <span class="catrail__label">${t(it.key, it.label)}</span>
      </a>`
    ).join("");
    return `
      <nav class="catrail" aria-label="Shop by category">
        <div class="catrail__scroll">
          ${items}
          <a class="catrail__item${active === "all" ? " catrail__item--active" : ""}" href="/shop.html">
            <span class="catrail__ico catrail__ico--all">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.6" y="3.6" width="7.2" height="7.2" rx="1"></rect><rect x="13.2" y="3.6" width="7.2" height="7.2" rx="1"></rect><rect x="3.6" y="13.2" width="7.2" height="7.2" rx="1"></rect><rect x="13.2" y="13.2" width="7.2" height="7.2" rx="1"></rect></svg>
            </span>
            <span class="catrail__label">${t("allProducts", "All Products")}</span>
          </a>
        </div>
      </nav>`;
  }

  function renderFilterCats() {
    const el = document.getElementById("filterCats");
    el.innerHTML = CATEGORY_LIST.map(
      (c) => `
      <li data-cat="${c.slug}" class="${activeCategory === c.slug ? "is-active" : ""}">
        <a href="${c.slug === "all" ? "/shop.html" : "/shop.html?category=" + c.slug}">
          <svg viewBox="0 0 12 8" aria-hidden="true"><polyline points="1,1.5 6,6.5 11,1.5"></polyline></svg>
          ${t(c.key, c.label)}
        </a>
      </li>`
    ).join("");
  }

  function applyFilters() {
    return allProducts.filter((p) => {
      if (Number(p.price) > state.maxPrice) return false;
      if (state.color && !(p.colors || []).includes(state.color)) return false;
      if (state.materials.length && !state.materials.includes((p.material || "").toLowerCase())) return false;
      if (searchQuery && window.AH_I18N && !window.AH_I18N.productMatchesQuery(p, searchQuery)) return false;
      if (searchQuery && !window.AH_I18N && !(p.name || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }

  function applySort(list) {
    const copy = list.slice();
    if (state.sort === "price-asc") copy.sort((a, b) => Number(a.price) - Number(b.price));
    else if (state.sort === "price-desc") copy.sort((a, b) => Number(b.price) - Number(a.price));
    else if (state.sort === "name-asc") copy.sort((a, b) => a.name.localeCompare(b.name));
    return copy;
  }

  function productCard(p, idx) {
    const cat = categoryById.get(p.category_id);
    // Stagger each card's reveal by its position in the grid, cycling
    // every 4 cards (one row on most breakpoints) so the whole page
    // doesn't wait on a long tail of delays for a big catalog.
    const rd = ((idx || 0) % 4) * 0.08;
    const pct = effectiveSalePercent(p, siteSale);
    const finalPrice = pct > 0 ? priceWithSale(p.price, pct) : Number(p.price);
    const saleText = pct > 0 ? (p.sale_label && parseFloat(p.sale_percent || "0") > 0 ? p.sale_label : `${t("saleBadge", "Sale")} ${pct}%`) : "";
    const st = stockState(p);
    const pname = window.AH_I18N ? window.AH_I18N.productName(p) : p.name;

    let badge = "";
    if (pct > 0) badge = `<span class="pcard__badge pcard__badge--sale">${saleText}</span>`;
    else if (st === "out") badge = `<span class="pcard__badge pcard__badge--sale">${t("outOfStock", "Out of Stock")}</span>`;
    else if (st === "low") badge = `<span class="pcard__badge" style="background:#D9A441;color:#1C1611">${t("lowStock", "Low Stock")}</span>`;
    else if (p.is_new_arrival) badge = `<span class="pcard__badge">${t("newBadge", "New")}</span>`;
    else if (p.badge) badge = `<span class="pcard__badge">${p.badge}</span>`;

    const img = (p.image_urls || [])[0] || "";
    const stars = Array.from({ length: 5 })
      .map(() => `<svg viewBox="0 0 24 24"><path d="M12 2 14.9 8.6 22 9.3 16.8 13.9 18.4 21 12 17.3 5.6 21 7.2 13.9 2 9.3 9.1 8.6Z"></path></svg>`)
      .join("");

    let priceHtml;
    if (pct > 0) {
      priceHtml = `<s style="opacity:.5;font-weight:400;margin-right:6px">EGP ${Number(p.price).toLocaleString("en-US")}</s><span style="color:#A93B29;font-weight:700">EGP ${finalPrice.toLocaleString("en-US")}</span>`;
    } else {
      priceHtml = "";
      if (p.compare_at_price && Number(p.compare_at_price) > Number(p.price)) {
        priceHtml += `<s style="opacity:.5;font-weight:400;margin-right:6px">EGP ${Number(p.compare_at_price).toLocaleString("en-US")}</s>`;
      }
      priceHtml += `EGP ${Number(p.price).toLocaleString("en-US")}`;
    }

    return `
      <article class="pcard rv rv--zoom" data-rv style="--rd:${rd}s" data-name="${p.name}" data-price="${p.price}" data-size="${p.size_cm || ""}" data-material="${(p.material || "").toLowerCase()}" data-color="${(p.colors || []).join(",")}">
        <a class="pcard__media" href="/product.html?slug=${encodeURIComponent(p.slug)}">
          ${badge}
          <img src="${cldUrl(img, 480)}" alt="${p.name}" loading="lazy" style="object-position:${splitFocal(img).position};--zoom:${splitFocal(img).zoom}" />
          <button class="fav" type="button" aria-label="Save ${p.name}" aria-pressed="false" onclick="event.preventDefault()">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4 4.6 13.2a4.6 4.6 0 1 1 7.4-5.3 4.6 4.6 0 1 1 7.4 5.3Z"></path></svg>
          </button>
          <button class="pcard__add" type="button" data-add="${p.name}" data-add-id="${p.slug}" data-add-price="${p.price}" data-add-image="${splitFocal(img).src}" data-add-weight="${p.weight_kg || 0}" aria-label="Add ${p.name} to cart" onclick="event.preventDefault()">
            <span>${t("addToCart", "Add to Cart")}</span>
          </button>
        </a>
        <div class="pcard__body">
          <p class="pcard__cat">${p.material || (cat ? (window.AH_I18N ? window.AH_I18N.categoryName(cat) : cat.name) : "")}${p.size_cm ? ` • ${p.size_cm} cm` : ""}</p>
          <h3 class="pcard__name"><a href="/product.html?slug=${encodeURIComponent(p.slug)}" style="color:inherit;text-decoration:none">${pname}</a></h3>
          <span class="pcard__stars" aria-hidden="true">${stars}<em>(${p.review_count || 0})</em></span>
          <p class="pcard__price">${priceHtml}</p>
        </div>
      </article>`;
  }

  function render() {
    const filtered = applyFilters();
    const sorted = applySort(filtered);
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    state.page = Math.min(state.page, totalPages);
    const visible = sorted.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

    document.getElementById("shopCount").textContent = `${sorted.length} ${sorted.length === 1 ? t("productSingular", "Product") : t("products", "Products")}`;
    document.getElementById("sortLabel").textContent = t("sortBy", "Sort By") + ": " + t(SORT_LABELS_KEYS[state.sort], SORT_LABELS[state.sort]);
    document.querySelectorAll("#sortList button").forEach((b) => b.classList.toggle("is-active", b.dataset.sort === state.sort));

    const grid = document.getElementById("shopGrid");
    grid.classList.toggle("is-list", state.view === "list");
    if (!visible.length) {
      grid.innerHTML = `<p style="padding:40px 0;opacity:.7;grid-column:1/-1">${t("noProductsFound", "No products found yet — check back soon as we add new pieces.")}</p>`;
    } else {
      grid.innerHTML = visible.map((p, i) => productCard(p, i)).join("");
    }

    const pager = document.getElementById("pager");
    if (totalPages > 1) {
      pager.style.display = "";
      let html = `<button type="button" aria-label="Previous page" ${state.page === 1 ? "disabled" : ""} data-page="prev">
        <svg viewBox="0 0 20 14" aria-hidden="true"><line x1="19" y1="7" x2="2" y2="7"></line><polyline points="7.4,1.6 1.6,7 7.4,12.4"></polyline></svg>
      </button>`;
      for (let i = 1; i <= totalPages; i++) {
        html += `<button type="button" class="${state.page === i ? "is-active" : ""}" data-page="${i}">${i}</button>`;
      }
      html += `<button type="button" aria-label="Next page" ${state.page === totalPages ? "disabled" : ""} data-page="next">
        <svg viewBox="0 0 20 14" aria-hidden="true"><line x1="1" y1="7" x2="18" y2="7"></line><polyline points="12.6,1.6 18.4,7 12.6,12.4"></polyline></svg>
      </button>`;
      pager.innerHTML = html;
    } else {
      pager.style.display = "none";
      pager.innerHTML = "";
    }

    if (window.AH_REVEAL) window.AH_REVEAL.scan(grid);
  }

  function wireControls() {
    document.getElementById("priceRange").addEventListener("input", (e) => {
      state.maxPrice = Number(e.target.value);
      state.page = 1;
      document.getElementById("priceMaxLabel").textContent = `EGP ${state.maxPrice.toLocaleString("en-US")}${state.maxPrice >= 20000 ? "+" : ""}`;
      render();
    });

    document.getElementById("colorSwatches").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-color]");
      if (!btn) return;
      const c = btn.dataset.color;
      state.color = state.color === c ? null : c;
      state.page = 1;
      document.querySelectorAll("#colorSwatches .filters__swatch").forEach((b) => b.setAttribute("aria-pressed", b === btn && state.color === c ? "true" : "false"));
      render();
    });

    document.getElementById("materialChecks").addEventListener("change", (e) => {
      const cb = e.target;
      if (cb.tagName !== "INPUT") return;
      const m = cb.value;
      if (cb.checked) state.materials.push(m);
      else state.materials = state.materials.filter((x) => x !== m);
      state.page = 1;
      render();
    });

    document.getElementById("clearFilters").addEventListener("click", () => {
      state.maxPrice = 20000;
      state.color = null;
      state.materials = [];
      state.page = 1;
      document.getElementById("priceRange").value = 20000;
      document.getElementById("priceMaxLabel").textContent = "EGP 20,000+";
      document.querySelectorAll("#colorSwatches .filters__swatch").forEach((b) => b.setAttribute("aria-pressed", "false"));
      document.querySelectorAll("#materialChecks input").forEach((cb) => (cb.checked = false));
      render();
    });

    // mobile filter drawer
    const filtersAside = document.getElementById("shopFiltersAside");
    const filtersScrim = document.getElementById("filtersScrim");
    const filterToggleBtn = document.getElementById("filterToggle");
    function openFilters() {
      filtersAside.classList.add("is-open");
      filtersScrim.classList.add("is-open");
      filterToggleBtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    function closeFilters() {
      filtersAside.classList.remove("is-open");
      filtersScrim.classList.remove("is-open");
      filterToggleBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
    filterToggleBtn.addEventListener("click", openFilters);
    document.getElementById("filterClose").addEventListener("click", closeFilters);
    filtersScrim.addEventListener("click", closeFilters);

    const sortToggle = document.getElementById("sortToggle");
    const sortPop = document.getElementById("sortPop");
    sortToggle.addEventListener("click", () => {
      const open = sortPop.dataset.open !== "true";
      sortPop.dataset.open = open ? "true" : "false";
      sortToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.getElementById("sortList").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-sort]");
      if (!btn) return;
      state.sort = btn.dataset.sort;
      state.page = 1;
      sortPop.dataset.open = "false";
      render();
    });

    document.getElementById("viewToggle").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-view]");
      if (!btn) return;
      state.view = btn.dataset.view;
      document.querySelectorAll("#viewToggle button").forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });

    document.getElementById("pager").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn) return;
      const p = btn.dataset.page;
      const filtered = applyFilters();
      const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      if (p === "prev") state.page = Math.max(1, state.page - 1);
      else if (p === "next") state.page = Math.min(totalPages, state.page + 1);
      else state.page = Number(p);
      render();
      window.scrollTo({ top: document.getElementById("shopGrid").offsetTop - 100, behavior: "smooth" });
    });
  }

  async function init() {
    renderChrome();
    if (window.AH_I18N) window.AH_I18N.wireLangButtons();
    renderFilterCats();
    wireControls();

    // Products are requested at the same time as categories/sale settings
    // rather than after them.
    const productsReq = API.get(activeCategory === "all"
      ? "/api/products?status=active"
      : "/api/products?category=" + encodeURIComponent(activeCategory)).catch(() => []);

    try {
      const [cats, sale] = await Promise.all([API.get("/api/categories"), API.get("/api/settings?key=site_sale")]);
      categories = cats;
      categoryById = new Map(categories.map((c) => [c.id, c]));
      siteSale = sale;
    } catch {
      categories = [];
      siteSale = { active: false, percent: 0, label: "" };
    }
    categoriesLoaded = true;
    applyCategoryImages();
    renderSubcatRail();

    allProducts = await productsReq;

    render();
  }

  document.addEventListener("ah:langchange", () => {
    renderChrome();
    if (window.AH_I18N) window.AH_I18N.wireLangButtons();
    renderFilterCats();
    renderSubcatRail();
    render();
  });

  init();
})();

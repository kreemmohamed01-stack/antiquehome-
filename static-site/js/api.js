// Storefront reads served from the single /api/settings?key=public
// bundle (one request per page instead of one per setting).
const SITE_BUNDLE_PATHS = {
  "/api/settings?key=site_sale": "site_sale",
  "/api/settings?key=site_social": "site_social",
  "/api/settings?key=site_announcement": "site_announcement",
  "/api/settings?key=site_content": "site_content",
  "/api/categories": "categories",
  "/api/coupons?featured=1": "featuredCoupon",
};

// Small fetch helpers shared by every storefront/admin page.
const API = {
  _site: null,
  site() {
    if (!this._site) {
      this._site = fetch("/api/settings?key=public", { credentials: "same-origin" })
        .then((r) => { if (!r.ok) throw new Error("Request failed: " + r.status); return r.json(); });
      this._site.catch(() => { this._site = null; });
    }
    return this._site;
  },
  async get(path) {
    if (!location.pathname.startsWith("/admin") && SITE_BUNDLE_PATHS[path]) {
      return (await this.site())[SITE_BUNDLE_PATHS[path]];
    }
    // Public GETs are edge-cached for ~60s (see api/_db.js edgeCache).
    // The dashboard must always see its own edits immediately, so every
    // GET made from an /admin/* page gets a unique param = cache miss.
    if (location.pathname.startsWith("/admin")) {
      path += (path.includes("?") ? "&" : "?") + "_fresh=" + Date.now();
    }
    const res = await fetch(path, { credentials: "same-origin" });
    if (!res.ok) throw new Error("Request failed: " + res.status);
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || "Request failed"), { data });
    return data;
  },
  async patch(path, body) {
    const res = await fetch(path, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || "Request failed"), { data });
    return data;
  },
  async del(path) {
    const res = await fetch(path, { method: "DELETE", credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || "Request failed"), { data });
    return data;
  },
};

function fmtMoney(n) {
  return "EGP " + Math.round(Number(n) || 0).toLocaleString("en-US");
}

function stockState(p) {
  const threshold = p.low_stock_threshold ?? 5;
  if (p.stock_qty <= 0) return "out";
  if (p.stock_qty <= threshold) return "low";
  return "in";
}

function effectiveSalePercent(product, siteSale) {
  const own = product.sale_percent ? parseFloat(product.sale_percent) : 0;
  if (own > 0) return own;
  if (siteSale && siteSale.active && siteSale.percent > 0) return siteSale.percent;
  return 0;
}

function priceWithSale(price, salePercent) {
  const base = typeof price === "string" ? parseFloat(price) : price;
  if (!salePercent) return base;
  return Math.round(base * (1 - salePercent / 100));
}

// Strips an admin-set focal point + zoom ("...jpg#62,40,1.35") off a
// stored image URL. Returns { src, position, zoom } — position is a
// ready-to-use CSS object-position value, zoom a scale() factor (both
// default to centered / 1 = no zoom) — so every product photo can be
// visually normalized to the same on-page scale regardless of how
// tightly it was originally cropped.
function splitFocal(url) {
  if (!url) return { src: url || "", position: "50% 50%", zoom: 1 };
  const i = url.lastIndexOf("#");
  if (i === -1) return { src: url, position: "50% 50%", zoom: 1 };
  const parts = url.slice(i + 1).split(",").map(Number);
  const [x, y, zoom] = parts;
  const src = url.slice(0, i);
  if (!isFinite(x) || !isFinite(y)) return { src, position: "50% 50%", zoom: 1 };
  return {
    src,
    position: `${x}% ${y}%`,
    zoom: isFinite(zoom) && zoom > 0 ? zoom : 1,
  };
}

// Opens a draggable/zoomable crop editor on `src`, inside a box shaped
// like `aspectRatio` (e.g. "1" for a square, "21/9" for a wide banner) —
// matches whatever container the photo actually appears in on the
// storefront, so what the admin sees while dragging is what visitors
// see. Starts from startX/startY/startZoom (a previous focal point, or
// 50/50/1 for a fresh photo) and calls onApply(x, y, zoom) once Apply is
// clicked; Cancel/the close button/clicking outside the dialog discard
// changes. Shared by the product editor (always a 1:1 stage) and the
// category editor (matches whichever of the 3 shapes it's currently
// previewing).
function openFocalCropEditor({ src, startX = 50, startY = 50, startZoom = 1, aspectRatio = "1", onApply }) {
  let x = startX, y = startY, zoom = startZoom;

  const overlay = document.createElement("div");
  overlay.className = "admin";
  overlay.id = "cropEditorOverlay";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:10060;display:flex;align-items:center;justify-content:center;padding:20px";
  overlay.innerHTML = `
    <div style="max-width:560px;width:100%;background:var(--a-panel);border:1px solid var(--a-border);border-radius:4px;padding:22px;color:var(--a-text)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <h3 style="margin:0;font-family:var(--serif);font-size:18px">Edit Crop</h3>
        <button type="button" id="cropCloseBtn" class="admin__iconAct" aria-label="Close" style="border-radius:50%">
          <svg viewBox="0 0 24 24"><line x1="4.6" y1="4.6" x2="19.4" y2="19.4"></line><line x1="19.4" y1="4.6" x2="4.6" y2="19.4"></line></svg>
        </button>
      </div>
      <div id="cropStage" style="position:relative;width:100%;aspect-ratio:${aspectRatio};overflow:hidden;border:1px solid var(--a-border);background:#000;cursor:grab;touch-action:none">
        <img id="cropImg" src="${cldUrl(src, 1200)}" draggable="false" style="position:absolute;max-width:none;user-select:none;pointer-events:none">
      </div>
      <label class="admin__mediaZoom" style="margin-top:14px">
        <span>Zoom</span>
        <input type="range" id="cropZoom" min="1" max="2.5" step="0.01" value="${zoom}">
      </label>
      <p class="admin__hint">Drag the photo to reposition it. Use the slider (or scroll/pinch) to zoom. The frame shown here is exactly what visitors will see.</p>
      <div style="display:flex;gap:10px;margin-top:6px">
        <button type="button" class="admin__btn admin__btn--outline" id="cropCancelBtn" style="flex:1">Cancel</button>
        <button type="button" class="admin__btn admin__btn--gold" id="cropApplyBtn" style="flex:1">Apply</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const stage = overlay.querySelector("#cropStage");
  const img = overlay.querySelector("#cropImg");
  const zoomSlider = overlay.querySelector("#cropZoom");

  // Matches object-position's semantics: x/y (0-100%) is the point of the
  // image that should align with that same % point of the frame. The
  // image is first scaled like object-fit:cover (so it fully covers the
  // frame regardless of its own aspect ratio or the frame's), then
  // `zoom` scales further on top of that, then it's positioned so the
  // (x%, y%) point of the image lines up with the (x%, y%) point of the
  // frame.
  function paint() {
    const stageRect = stage.getBoundingClientRect();
    const natW = img.naturalWidth || stageRect.width;
    const natH = img.naturalHeight || stageRect.height;
    const coverScale = Math.max(stageRect.width / natW, stageRect.height / natH);
    const scale = coverScale * zoom;
    const imgW = natW * scale;
    const imgH = natH * scale;
    const left = stageRect.width * (x / 100) - imgW * (x / 100);
    const top = stageRect.height * (y / 100) - imgH * (y / 100);
    img.style.width = `${imgW}px`;
    img.style.height = `${imgH}px`;
    img.style.left = `${left}px`;
    img.style.top = `${top}px`;
    img.style.transform = "none";
  }
  if (img.complete && img.naturalWidth) paint();
  else img.addEventListener("load", paint);
  window.addEventListener("resize", paint);

  let dragging = false;
  let lastClientX = 0, lastClientY = 0;
  function onDown(e) {
    dragging = true;
    stage.style.cursor = "grabbing";
    const p = e.touches ? e.touches[0] : e;
    lastClientX = p.clientX;
    lastClientY = p.clientY;
  }
  function onMove(e) {
    if (!dragging) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - lastClientX;
    const dy = p.clientY - lastClientY;
    lastClientX = p.clientX;
    lastClientY = p.clientY;
    const stageRect = stage.getBoundingClientRect();
    const natW = img.naturalWidth || stageRect.width;
    const natH = img.naturalHeight || stageRect.height;
    const coverScale = Math.max(stageRect.width / natW, stageRect.height / natH);
    const imgW = natW * coverScale * zoom;
    const imgH = natH * coverScale * zoom;
    // Dragging the photo right means the focal point moves left (toward
    // 0%), and vice versa — invert the delta.
    x = Math.min(100, Math.max(0, x - (dx / imgW) * 100));
    y = Math.min(100, Math.max(0, y - (dy / imgH) * 100));
    paint();
    if (e.touches) e.preventDefault();
  }
  function onUp() { dragging = false; stage.style.cursor = "grab"; }
  stage.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  stage.addEventListener("touchstart", onDown, { passive: true });
  stage.addEventListener("touchmove", onMove, { passive: false });
  stage.addEventListener("touchend", onUp);

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoom = Math.min(2.5, Math.max(1, zoom - e.deltaY * 0.0015));
    zoomSlider.value = zoom;
    paint();
  }, { passive: false });

  zoomSlider.addEventListener("input", () => {
    zoom = Number(zoomSlider.value);
    paint();
  });

  function closeEditor() {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    window.removeEventListener("resize", paint);
    document.body.removeChild(overlay);
    document.body.style.overflow = "";
  }
  overlay.querySelector("#cropCloseBtn").addEventListener("click", closeEditor);
  overlay.querySelector("#cropCancelBtn").addEventListener("click", closeEditor);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeEditor(); });
  overlay.querySelector("#cropApplyBtn").addEventListener("click", () => {
    onApply(x, y, zoom);
    closeEditor();
  });
}

function cldUrl(url, width) {
  const { src } = splitFocal(url);
  if (!src) return "";
  const marker = "/upload/";
  const i = src.indexOf(marker);
  if (!src.includes("res.cloudinary.com") || i === -1) return src;
  const transform = width ? `f_auto,q_auto,w_${width}` : "f_auto,q_auto";
  return src.slice(0, i + marker.length) + transform + "/" + src.slice(i + marker.length);
}

// Each category's built-in photo, used whenever no custom image has been
// uploaded for it in Dashboard → Categories (categories.image_url empty).
// Subcategories without their own image borrow their parent's look.
const CATEGORY_DEFAULT_IMAGES = {
  "bleu-blanc": "/sec 3/category 1.webp",
  lighting: "/sec 3/category 2.webp",
  accessories: "/sec 3/category 3.webp",
  antiques: "/sec 3/category 4.webp",
  "artificial-plants-garden-stool": "/sec 3/category 5.webp",
  "wall-art-plates": "/sec 3/category 6.webp",
  "murano-glass": "/sec 3/category 7.webp",
  furniture: "/sec 3/category 8.webp",
  sale: "/sec 3/category 9.jpeg",
  "colored-vases": "/sec 3/category 3.webp",
  "candle-holder": "/sec 3/category 3.webp",
  "raisin-more": "/sec 3/category 3.webp",
  "tissue-box": "/sec 3/category 3.webp",
  ashtray: "/sec 3/category 3.webp",
  "photo-frame": "/sec 3/category 3.webp",
};

// A category's uploaded image can have a different crop per shape it
// appears in (shop banner / homepage tile / round category-bar icon),
// so all three can be centered well even though they're different
// aspect ratios. Stored as up to 3 "#x,y,zoom" suffixes on one URL,
// joined by "|" — e.g. "...jpg#40,30,1.2|60,50,1|50,45,1.4" — one entry
// per shape, in (banner, tile, rail) order; a shape with no entry (an
// older save, or a freshly-uploaded photo not cropped yet) falls back
// to centered/no zoom, same as every other focal point on the site.
const CATEGORY_FOCAL_SHAPES = ["banner", "tile", "rail"];
function splitCategoryFocals(imageUrl) {
  const centered = { x: 50, y: 50, zoom: 1 };
  const out = { banner: { ...centered }, tile: { ...centered }, rail: { ...centered } };
  if (!imageUrl) return out;
  const hashIdx = imageUrl.indexOf("#");
  if (hashIdx === -1) return out;
  imageUrl.slice(hashIdx + 1).split("|").forEach((part, i) => {
    const shape = CATEGORY_FOCAL_SHAPES[i];
    if (!shape) return;
    const [x, y, zoom] = part.split(",").map(Number);
    if (isFinite(x) && isFinite(y)) out[shape] = { x, y, zoom: isFinite(zoom) && zoom > 0 ? zoom : 1 };
  });
  return out;
}
function joinCategoryFocals(src, focals) {
  const bareSrc = src.includes("#") ? src.slice(0, src.indexOf("#")) : src;
  const suffix = CATEGORY_FOCAL_SHAPES.map((shape) => {
    const f = focals[shape] || { x: 50, y: 50, zoom: 1 };
    return `${Math.round(f.x)},${Math.round(f.y)},${(f.zoom || 1).toFixed(2)}`;
  }).join("|");
  return `${bareSrc}#${suffix}`;
}

// The image to show for a category in a given shape ("banner" | "tile" |
// "rail"): its uploaded image (sized via Cloudinary, cropped with that
// shape's own focal point) if one is set, else its built-in default
// (shown centered — the source photos were already chosen/framed for
// this site, so they don't carry per-shape crops). `categories` is the
// /api/categories list (or null while it's still loading). Returns
// { src, position, zoom } — position/zoom are ready-to-use CSS values,
// same shape as splitFocal()'s return.
function categoryImageUrl(slug, categories, width, shape) {
  const c = (categories || []).find((x) => x.slug === slug);
  if (c && c.image_url) {
    const focals = splitCategoryFocals(c.image_url);
    const f = focals[shape] || focals.tile;
    return { src: cldUrl(c.image_url, width), position: `${f.x}% ${f.y}%`, zoom: f.zoom };
  }
  return { src: CATEGORY_DEFAULT_IMAGES[slug] || "/sec 3/category 3.webp", position: "50% 50%", zoom: 1 };
}

// Admin photo upload, shared by the product and category editors.
// Vercel rejects any request body over 4.5MB, and a normal phone/camera
// photo (3-12MB, plus ~33% for base64) blows straight past that, which
// is what made uploads fail. So every image is first shrunk in the
// browser to at most 2400px on its long side and re-encoded as a
// high-quality JPEG (typically 300-900KB, still far sharper than any
// spot the site displays it), stepping quality/size down further only
// if it's somehow still too big. Returns the uploaded Cloudinary URL.
const UPLOAD_MAX_DATAURL = 3.5 * 1024 * 1024;

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("unreadable")); };
    img.src = url;
  });
}

async function compressImageFile(file) {
  let img;
  try {
    img = await loadImageFile(file);
  } catch {
    throw new Error(`"${file.name}" isn't a photo format this browser can open (e.g. HEIC). Please save it as JPG or PNG and try again.`);
  }
  const attempts = [[2400, 0.86], [2000, 0.8], [1600, 0.75], [1200, 0.7]];
  let dataUrl = "";
  for (const [maxDim, quality] of attempts) {
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; // JPEG has no transparency — keep transparent PNG areas white, not black
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= UPLOAD_MAX_DATAURL) return dataUrl;
  }
  return dataUrl;
}

async function uploadImageFile(file, folder) {
  const dataUrl = await compressImageFile(file);
  try {
    const { url } = await API.post("/api/upload", { dataUrl, folder });
    return url;
  } catch (err) {
    throw new Error(`Couldn't upload "${file.name}": ${err.message || "upload failed"}. Please try again.`);
  }
}

// Small "Added to Cart" toast, shared by every add-to-cart path (product
// cards, the PDP button, homepage rail) since they all funnel through
// Cart.add() below.
function showAddedToCartToast(name) {
  try {
    let host = document.getElementById("ahToastHost");
    if (!host) {
      host = document.createElement("div");
      host.id = "ahToastHost";
      host.style.cssText = "position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none";
      document.body.appendChild(host);
    }
    const toast = document.createElement("div");
    toast.style.cssText = "display:flex;align-items:center;gap:10px;background:#14110C;color:#fff;padding:12px 20px;font-family:'Jost',sans-serif;font-size:12.5px;letter-spacing:.02em;box-shadow:0 12px 30px rgba(0,0,0,.28);opacity:0;transform:translateY(-8px);transition:opacity .35s ease,transform .35s ease;white-space:nowrap";
    toast.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" style="flex:none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="#7FBF7F" stroke-width="1.6"/><polyline points="7,12.5 10.3,16 17,8" fill="none" stroke="#7FBF7F" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span><strong>${name}</strong> added to cart</span>`;
    host.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = "1"; toast.style.transform = "translateY(0)"; });
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-8px)";
      setTimeout(() => toast.remove(), 400);
    }, 2200);
  } catch {}
}

// A cart line's display name in the current language. Lines keep the
// English name in `name` (that's what an order records) plus `nameAr`.
function cartLineName(l) {
  if (window.AH_I18N && window.AH_I18N.getLang() === "ar" && l.nameAr) return l.nameAr;
  return l.name;
}

// Cart, stored client-side same as before.
const Cart = {
  KEY: "ah_cart",
  read() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch { return []; }
  },
  write(items) {
    try { localStorage.setItem(this.KEY, JSON.stringify(items)); } catch {}
    document.dispatchEvent(new CustomEvent("cart:changed", { detail: items }));
  },
  add(item, qty) {
    const items = this.read();
    const existing = items.find((i) => i.id === item.id);
    if (existing) existing.qty += qty;
    else items.push({ ...item, qty });
    this.write(items);
    showAddedToCartToast(cartLineName(item));
    trackEvent("add_to_cart", item.id);
  },
  remove(id) {
    this.write(this.read().filter((i) => i.id !== id));
  },
  setQty(id, qty) {
    const items = this.read();
    const it = items.find((i) => i.id === id);
    if (it) it.qty = Math.max(1, qty);
    this.write(items);
  },
  clear() { this.write([]); },
  count() { return this.read().reduce((s, i) => s + i.qty, 0); },
  total() { return this.read().reduce((s, i) => s + i.qty * i.price, 0); },
};

function ahIdFrom(storage, key) {
  let v = storage.getItem(key);
  if (!v) {
    v = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now());
    storage.setItem(key, v);
  }
  return v;
}

function ahBeacon(path, payload) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(path, new Blob([body], { type: "application/json" }));
    } else {
      fetch(path, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    }
  } catch {}
}

// Funnel events beyond page views — add_to_cart / checkout_started.
// Fired best-effort; a failure here never blocks the cart/checkout flow.
function trackEvent(event, productSlug) {
  try {
    ahBeacon("/api/track", {
      visitorId: ahIdFrom(localStorage, "ah_vid"),
      sessionId: ahIdFrom(sessionStorage, "ah_sid"),
      event,
      productSlug: productSlug || null,
    });
  } catch {}
}

// Visitor tracking beacon — fires on every page's load.
(function track() {
  try {
    const visitorId = ahIdFrom(localStorage, "ah_vid");
    const sessionId = ahIdFrom(sessionStorage, "ah_sid");
    ahBeacon("/api/track", {
      visitorId, sessionId,
      path: location.pathname + location.search,
      referrer: document.referrer || null,
    });
  } catch {}
})();

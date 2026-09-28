// Small fetch helpers shared by every storefront/admin page.
const API = {
  async get(path) {
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
  return Math.round(base * (1 - salePercent / 100) * 100) / 100;
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

function cldUrl(url, width) {
  const { src } = splitFocal(url);
  if (!src) return "";
  const marker = "/upload/";
  const i = src.indexOf(marker);
  if (!src.includes("res.cloudinary.com") || i === -1) return src;
  const transform = width ? `f_auto,q_auto,w_${width}` : "f_auto,q_auto";
  return src.slice(0, i + marker.length) + transform + "/" + src.slice(i + marker.length);
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
    showAddedToCartToast(item.name);
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

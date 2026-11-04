// Shared admin chrome: auth guard, sidebar, topbar, mobile tab bar.
// Every admin/*.html page includes this after its own content markup and
// calls AdminShell.init({ active: "dashboard", orderCount: ... }).

const NAV_ITEMS = [
  { href: "/admin/index.html", label: "Dashboard", icon: "dashboard", key: "dashboard" },
  { href: "/admin/orders.html", label: "Orders", icon: "orders", key: "orders", badge: true },
  { href: "/admin/products.html", label: "Products", icon: "products", key: "products" },
  { href: "/admin/categories.html", label: "Categories", icon: "categories", key: "categories" },
  { href: "/admin/customers.html", label: "Customers", icon: "customers", key: "customers" },
  { href: "/admin/content.html", label: "Content", icon: "content", key: "content" },
  { href: "/admin/marketing.html", label: "Marketing", icon: "marketing", key: "marketing" },
  { href: "/admin/discounts.html", label: "Discounts", icon: "discounts", key: "discounts" },
  { href: "/admin/shipping.html", label: "Shipping", icon: "shipping", key: "shipping" },
  { href: "/admin/analytics.html", label: "Analytics", icon: "analytics", key: "analytics" },
  { href: "/admin/settings.html", label: "Settings", icon: "settings", key: "settings" },
];

const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24"><rect x="3.4" y="3.4" width="7.4" height="7.4" rx="1.2"></rect><rect x="13.2" y="3.4" width="7.4" height="7.4" rx="1.2"></rect><rect x="3.4" y="13.2" width="7.4" height="7.4" rx="1.2"></rect><rect x="13.2" y="13.2" width="7.4" height="7.4" rx="1.2"></rect></svg>',
  orders: '<svg viewBox="0 0 24 24"><path d="M5.6 7.8h12.8l1 12.4H4.6z"></path><path d="M8.9 9.6V6.6a3.1 3.1 0 0 1 6.2 0v3"></path></svg>',
  products: '<svg viewBox="0 0 24 24"><path d="M4 15.4 16 5.4l12 10"></path><rect x="4" y="10.4" width="16" height="10" rx="1.4"></rect></svg>',
  categories: '<svg viewBox="0 0 24 24"><path d="M4 6.4h16M4 12h16M4 17.6h10"></path></svg>',
  customers: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.4"></circle><path d="M2.6 19.4c0-3.4 2.9-5.8 6.4-5.8s6.4 2.4 6.4 5.8"></path><circle cx="17.4" cy="9" r="2.4"></circle><path d="M15.4 13.8c2.6.3 4.6 2.2 4.6 5"></path></svg>',
  content: '<svg viewBox="0 0 24 24"><rect x="3.6" y="3.6" width="16.8" height="16.8" rx="2"></rect><line x1="7.2" y1="9" x2="16.8" y2="9"></line><line x1="7.2" y1="13" x2="16.8" y2="13"></line><line x1="7.2" y1="17" x2="13" y2="17"></line></svg>',
  marketing: '<svg viewBox="0 0 24 24"><path d="M3.4 10.2h4.4l7-5.4v14.4l-7-5.4H3.4Z"></path><path d="M14.8 8.6a4 4 0 0 1 0 6.8"></path></svg>',
  discounts: '<svg viewBox="0 0 24 24"><path d="M4.4 11.6 11.6 4.4h7.2v7.2l-7.2 7.2Z"></path><circle cx="15.4" cy="8.6" r="1.5"></circle></svg>',
  analytics: '<svg viewBox="0 0 24 24"><line x1="5" y1="20" x2="5" y2="13"></line><line x1="12" y1="20" x2="12" y2="8"></line><line x1="19" y1="20" x2="19" y2="4"></line></svg>',
  shipping: '<svg viewBox="0 0 24 24"><path d="M2.6 8.4h14v12.8h-14z"></path><path d="M16.6 12.4h6.6l4.2 4.2v4.6h-10.8z"></path></svg>',
  settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"></circle><path d="M4.6 12h1.6M17.8 12h1.6M12 4.6v1.6M12 17.8v1.6M7 7l1.2 1.2M15.8 15.8 17 17M17 7l-1.2 1.2M8.2 15.8 7 17"></path></svg>',
};

const AdminShell = {
  async init(opts) {
    const active = (opts && opts.active) || "";

    // Auth guard — every admin page calls this before rendering its own content.
    let email = "Antique Home";
    try {
      const check = await fetch("/api/auth?action=session", { credentials: "same-origin" });
      if (!check.ok) { location.href = "/admin/login.html"; return null; }
      const data = await check.json();
      email = data.email || email;
    } catch {
      location.href = "/admin/login.html";
      return null;
    }

    let orderCount = 0;
    try {
      const rows = await fetch("/api/orders", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : []));
      orderCount = rows.filter((o) => o.status === "pending" || o.status === "processing").length;
    } catch {}

    const initials = email.slice(0, 2).toUpperCase();
    const root = document.getElementById("admin-root");
    const content = root.innerHTML;

    root.innerHTML = `
      <div class="admin__shell">
        <div class="admin__sidebarScrim" id="sidebarScrim"></div>
        <aside class="admin__sidebar" id="adminSidebar">
          <div class="admin__sidebarClose">
            <button type="button" id="sidebarCloseBtn" aria-label="Close menu">
              <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="4.6" y1="4.6" x2="19.4" y2="19.4"></line><line x1="19.4" y1="4.6" x2="4.6" y2="19.4"></line></svg>
            </button>
          </div>
          <div class="admin__logo">
            <span class="admin__logo-name">ANTIQUE HOME</span>
            <span class="admin__logo-sub">Timeless Living</span>
          </div>
          <ul class="admin__nav">
            ${NAV_ITEMS.map((item) => `
              <li>
                <a href="${item.href}" class="admin__navLink${item.key === active ? " is-active" : ""}">
                  ${ICONS[item.icon] || ""}
                  ${item.label}
                  ${item.badge && orderCount > 0 ? `<span class="admin__navBadge">${orderCount}</span>` : ""}
                </a>
              </li>
            `).join("")}
          </ul>
          <div class="admin__profile">
            <span class="admin__avatar">${initials}</span>
            <div>
              <div class="admin__profile-name">Antique Home</div>
              <div class="admin__profile-role">Admin</div>
            </div>
            <button type="button" class="admin__profile-kebab" id="logoutBtn" aria-label="Log out">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 4.4H6.4A2 2 0 0 0 4.4 6.4v11.2a2 2 0 0 0 2 2H9"></path><path d="M15.6 16.4 20 12l-4.4-4.4"></path><line x1="20" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        </aside>
        <div class="admin__main">
          <header class="admin__topbar">
            <button type="button" class="admin__hamburger" id="mobileMenuBtn" aria-label="Menu">
              <svg viewBox="0 0 24 24"><line x1="4" y1="7" x2="20" y2="7"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="17" x2="20" y2="17"></line></svg>
            </button>
            <a href="/admin/index.html" class="admin__mobileLogo">ANTIQUE HOME<span>TIMELESS LIVING</span></a>
            <div class="admin__search">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.4"></circle><line x1="15.7" y1="15.7" x2="20.2" y2="20.2"></line></svg>
              <input type="text" placeholder="Search orders, products, customers...">
            </div>
            <div class="admin__topActions">
              <button type="button" class="admin__profileChip">
                <span class="admin__avatar">${initials}</span>
                <span>Antique Home</span>
              </button>
            </div>
          </header>
          <div class="admin__content" id="admin-content"></div>
        </div>
      </div>
    `;

    document.getElementById("admin-content").innerHTML = content;
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await fetch("/api/auth?action=logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
      location.href = "/admin/login.html";
    });

    // mobile sidebar drawer
    const sidebar = document.getElementById("adminSidebar");
    const scrim = document.getElementById("sidebarScrim");
    function openSidebar() { sidebar.classList.add("is-open"); scrim.classList.add("is-open"); document.body.style.overflow = "hidden"; }
    function closeSidebar() { sidebar.classList.remove("is-open"); scrim.classList.remove("is-open"); document.body.style.overflow = ""; }
    document.getElementById("mobileMenuBtn").addEventListener("click", openSidebar);
    document.getElementById("sidebarCloseBtn").addEventListener("click", closeSidebar);
    scrim.addEventListener("click", closeSidebar);

    AdminFx.start(document.getElementById("admin-root"));

    return { email, orderCount };
  },

  // Styled "are you sure?" dialog matching the admin's dark/gold theme —
  // used instead of the browser's native confirm() anywhere an action
  // can't be undone (delete, overwriting a save, etc). Returns a Promise
  // that resolves true if the person confirms, false otherwise (Cancel,
  // the scrim, or Escape).
  confirm(opts) {
    const o = typeof opts === "string" ? { message: opts } : (opts || {});
    const title = o.title || "Are you sure?";
    const message = o.message || "This action cannot be undone.";
    const confirmLabel = o.confirmLabel || "Confirm";
    const cancelLabel = o.cancelLabel || "Cancel";
    const danger = o.danger !== false; // red confirm button by default

    return new Promise((resolve) => {
      const wrap = document.createElement("div");
      wrap.className = "admin";
      wrap.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:10050;display:flex;align-items:center;justify-content:center;padding:20px";
      wrap.innerHTML = `
        <div style="max-width:380px;width:100%;background:var(--a-panel);border:1px solid var(--a-border);border-radius:4px;padding:24px;color:var(--a-text)">
          <h3 style="margin:0 0 10px;font-family:var(--serif);font-size:19px">${title}</h3>
          <p style="margin:0 0 20px;font-size:13.5px;color:var(--a-text-dim);line-height:1.5">${message}</p>
          <div style="display:flex;gap:10px">
            <button type="button" class="admin__btn admin__btn--outline" id="adminConfirmCancel" style="flex:1">${cancelLabel}</button>
            <button type="button" class="admin__btn ${danger ? "admin__btn--danger" : "admin__btn--gold"}" id="adminConfirmOk" style="flex:1">${confirmLabel}</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      document.body.style.overflow = "hidden";

      function cleanup(result) {
        document.body.removeChild(wrap);
        document.body.style.overflow = "";
        document.removeEventListener("keydown", onKey);
        resolve(result);
      }
      function onKey(e) { if (e.key === "Escape") cleanup(false); }
      document.addEventListener("keydown", onKey);
      wrap.addEventListener("click", (e) => { if (e.target === wrap) cleanup(false); });
      wrap.querySelector("#adminConfirmCancel").addEventListener("click", () => cleanup(false));
      wrap.querySelector("#adminConfirmOk").addEventListener("click", () => cleanup(true));
    });
  },
};

// ---- Dashboard motion: numbers count up, cards rise in on first load ----
// Watches the admin root for rendered content. A number counts up from 0
// the first time it appears and from its old value when it changes later
// (e.g. Analytics' 30s refresh); a re-render with the same value stays
// still, so polling never replays the animation. Entrance animations
// (css/admin-fx.css, body.fx-intro) only run for the first few seconds,
// and again briefly after a range / chart-tab switch.
const AdminFx = {
  NUM_SEL: ".admin__stat-value, .an__kpiValue, .an__liveNum, .an__donutPct, .an__trioMain, .an__funnelValue, .an__miniStat-value, .an__cartValue, .an__pageRow-val",
  CARD_SEL: ".admin__hero, .admin__stat, .admin__panel, .admin__action, .an__kpi, .an__panel, .an__trioItem, .an__cartItem, .an__funnelStep",
  start(root) {
    if (!root || this.root) return;
    this.root = root;
    this.reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.prev = new Map();      // "class#index" -> last target number
    this.written = new WeakMap(); // element -> last string we wrote into it
    this.intro(2600);
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; this.scan(); });
    }).observe(root, { childList: true, subtree: true, characterData: true });
    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-range], [data-metric]")) this.intro(1800);
    });
    this.scan();
  },
  intro(ms) {
    if (this.reduced) return;
    document.body.classList.add("fx-intro");
    clearTimeout(this.introTimer);
    this.introTimer = setTimeout(() => document.body.classList.remove("fx-intro"), ms);
  },
  scan() {
    const root = this.root;
    let i = 0;
    root.querySelectorAll(this.CARD_SEL).forEach((el) => { el.style.setProperty("--fx-i", Math.min(i++, 14)); });
    const seen = {};
    root.querySelectorAll(this.NUM_SEL).forEach((el) => {
      if (el.children.length) return;
      const cls = el.className.split(" ")[0];
      seen[cls] = (seen[cls] || 0) + 1;
      const key = cls + "#" + seen[cls];
      const text = el.textContent;
      if (this.written.get(el) === text) return; // our own frame
      const m = text.match(/^(\D*?)(-?[\d,]*\.?\d+)(.*)$/s);
      if (!m || /:/.test(text)) return;
      const to = parseFloat(m[2].replace(/,/g, ""));
      if (!isFinite(to)) return;
      const from = this.prev.has(key) ? this.prev.get(key) : 0;
      this.prev.set(key, to);
      if (from === to || this.reduced) return;
      const decimals = (m[2].split(".")[1] || "").length;
      const commas = m[2].includes(",") || Math.abs(to) >= 1000;
      this.animate(el, m[1], m[3], from, to, decimals, commas);
    });
  },
  animate(el, pre, post, from, to, decimals, commas) {
    const dur = 1300;
    const t0 = performance.now();
    const fmt = (v) => pre + (commas
      ? v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : v.toFixed(decimals)) + post;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const e = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // ease-out expo
      const str = fmt(from + (to - from) * e);
      this.written.set(el, str);
      el.textContent = str;
      if (t < 1 && el.isConnected) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },
};

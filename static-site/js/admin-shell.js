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

    return { email, orderCount };
  },
};

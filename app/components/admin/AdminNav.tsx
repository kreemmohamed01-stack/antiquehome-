"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/orders", label: "Orders", icon: "orders", badgeKey: "orders" as const },
  { href: "/admin/products", label: "Products", icon: "products" },
  { href: "/admin/collections", label: "Collections", icon: "collections" },
  { href: "/admin/categories", label: "Categories", icon: "categories" },
  { href: "/admin/customers", label: "Customers", icon: "customers" },
  { href: "/admin/content", label: "Content", icon: "content" },
  { href: "/admin/marketing", label: "Marketing", icon: "marketing" },
  { href: "/admin/discounts", label: "Discounts", icon: "discounts" },
  { href: "/admin/analytics", label: "Analytics", icon: "analytics" },
  { href: "/admin/reviews", label: "Reviews", icon: "reviews" },
  { href: "/admin/ai-assistant", label: "AI Assistant", icon: "ai", isNew: true },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

function Icon({ name }: { name: string }) {
  switch (name) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24"><rect x="3.4" y="3.4" width="7.4" height="7.4" rx="1.2"></rect><rect x="13.2" y="3.4" width="7.4" height="7.4" rx="1.2"></rect><rect x="3.4" y="13.2" width="7.4" height="7.4" rx="1.2"></rect><rect x="13.2" y="13.2" width="7.4" height="7.4" rx="1.2"></rect></svg>
      );
    case "orders":
      return (
        <svg viewBox="0 0 24 24"><path d="M5.6 7.8h12.8l1 12.4H4.6z"></path><path d="M8.9 9.6V6.6a3.1 3.1 0 0 1 6.2 0v3"></path></svg>
      );
    case "products":
      return (
        <svg viewBox="0 0 24 24"><path d="M4 15.4 16 5.4l12 10"></path><path d="M6.4 13.4V26h19.2V13.4" transform="translate(-4 -4) scale(.75)"></path><rect x="4" y="10.4" width="16" height="10" rx="1.4"></rect></svg>
      );
    case "collections":
      return (
        <svg viewBox="0 0 24 24"><rect x="3.6" y="3.6" width="7.2" height="7.2" rx="1"></rect><rect x="13.2" y="3.6" width="7.2" height="7.2" rx="1"></rect><rect x="3.6" y="13.2" width="7.2" height="7.2" rx="1"></rect><rect x="13.2" y="13.2" width="7.2" height="7.2" rx="1"></rect></svg>
      );
    case "categories":
      return (
        <svg viewBox="0 0 24 24"><path d="M4 6.4h16M4 12h16M4 17.6h10"></path></svg>
      );
    case "customers":
      return (
        <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.4"></circle><path d="M2.6 19.4c0-3.4 2.9-5.8 6.4-5.8s6.4 2.4 6.4 5.8"></path><circle cx="17.4" cy="9" r="2.4"></circle><path d="M15.4 13.8c2.6.3 4.6 2.2 4.6 5"></path></svg>
      );
    case "content":
      return (
        <svg viewBox="0 0 24 24"><rect x="3.6" y="3.6" width="16.8" height="16.8" rx="2"></rect><line x1="7.2" y1="9" x2="16.8" y2="9"></line><line x1="7.2" y1="13" x2="16.8" y2="13"></line><line x1="7.2" y1="17" x2="13" y2="17"></line></svg>
      );
    case "marketing":
      return (
        <svg viewBox="0 0 24 24"><path d="M3.4 10.2h4.4l7-5.4v14.4l-7-5.4H3.4Z"></path><path d="M14.8 8.6a4 4 0 0 1 0 6.8"></path></svg>
      );
    case "discounts":
      return (
        <svg viewBox="0 0 24 24"><path d="M4.4 11.6 11.6 4.4h7.2v7.2l-7.2 7.2Z"></path><circle cx="15.4" cy="8.6" r="1.5"></circle></svg>
      );
    case "analytics":
      return (
        <svg viewBox="0 0 24 24"><line x1="5" y1="20" x2="5" y2="13"></line><line x1="12" y1="20" x2="12" y2="8"></line><line x1="19" y1="20" x2="19" y2="4"></line></svg>
      );
    case "reviews":
      return (
        <svg viewBox="0 0 24 24"><path d="M12 3 14.6 8.6 20.6 9.4 16.3 13.4 17.4 19.4 12 16.5 6.6 19.4 7.7 13.4 3.4 9.4 9.4 8.6Z"></path></svg>
      );
    case "ai":
      return (
        <svg viewBox="0 0 24 24"><path d="M12 3 14 9 20 11 14 13 12 19 10 13 4 11 10 9Z"></path></svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"></circle><path d="M4.6 12h1.6M17.8 12h1.6M12 4.6v1.6M12 17.8v1.6M7 7l1.2 1.2M15.8 15.8 17 17M17 7l-1.2 1.2M8.2 15.8 7 17"></path></svg>
      );
    default:
      return null;
  }
}

export function AdminNavList({ orderCount, onNavigate }: { orderCount: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="admin__nav">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`admin__navLink${isActive ? " is-active" : ""}`}
              onClick={onNavigate}
            >
              <Icon name={item.icon} />
              {item.label}
              {item.badgeKey === "orders" && orderCount > 0 ? (
                <span className="admin__navBadge">{orderCount}</span>
              ) : null}
              {item.isNew ? <span className="admin__navPill">NEW</span> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

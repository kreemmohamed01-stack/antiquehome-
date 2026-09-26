"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Dashboard", icon: "M3.4 3.4h7.4v7.4H3.4zM13.2 3.4h7.4v7.4h-7.4zM3.4 13.2h7.4v7.4H3.4zM13.2 13.2h7.4v7.4h-7.4z" },
];

export default function TabBar({ orderCount }: { orderCount: number }) {
  const pathname = usePathname();

  const items = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/orders", label: "Orders", badge: orderCount },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/customers", label: "Customers" },
    { href: "/admin/more", label: "More" },
  ];

  const icons: Record<string, React.ReactNode> = {
    "/admin": (
      <svg viewBox="0 0 24 24"><rect x="3.4" y="3.4" width="7.4" height="7.4" rx="1.2"></rect><rect x="13.2" y="3.4" width="7.4" height="7.4" rx="1.2"></rect><rect x="3.4" y="13.2" width="7.4" height="7.4" rx="1.2"></rect><rect x="13.2" y="13.2" width="7.4" height="7.4" rx="1.2"></rect></svg>
    ),
    "/admin/orders": (
      <svg viewBox="0 0 24 24"><path d="M5.6 7.8h12.8l1 12.4H4.6z"></path><path d="M8.9 9.6V6.6a3.1 3.1 0 0 1 6.2 0v3"></path></svg>
    ),
    "/admin/products": (
      <svg viewBox="0 0 24 24"><rect x="4" y="9.4" width="16" height="10.4" rx="1.4"></rect><path d="M8 9.4V7a4 4 0 0 1 8 0v2.4"></path></svg>
    ),
    "/admin/customers": (
      <svg viewBox="0 0 24 24"><circle cx="12" cy="8.4" r="3.6"></circle><path d="M4.8 20c0-3.7 3.2-6.2 7.2-6.2s7.2 2.5 7.2 6.2"></path></svg>
    ),
    "/admin/more": (
      <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"></circle><circle cx="12" cy="12" r="1.6"></circle><circle cx="19" cy="12" r="1.6"></circle></svg>
    ),
  };

  return (
    <nav className="admin__tabbar" aria-label="Admin quick navigation">
      {items.map((item) => {
        const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`admin__tabbar-item${isActive ? " is-active" : ""}`}
          >
            {icons[item.href]}
            <span>{item.label}</span>
            {item.badge ? <span className="admin__tabbar-badge">{item.badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

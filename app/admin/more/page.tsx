import Link from "next/link";
import { NAV_ITEMS } from "@/lib/admin-nav";

export const metadata = { title: "More — Antique Home Admin" };

export default function MorePage() {
  // Mobile-only landing page for everything not on the bottom tab bar.
  const rest = NAV_ITEMS.filter(
    (item) => !["/admin", "/admin/orders", "/admin/products", "/admin/customers"].includes(item.href)
  );

  return (
    <div className="admin__panel">
      <div className="admin__panel-head">
        <h2 className="admin__panel-title">More</h2>
      </div>
      <ul className="admin__list">
        {rest.map((item) => (
          <li key={item.href} className="admin__listRow">
            <Link href={item.href} className="name" style={{ flex: 1 }}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

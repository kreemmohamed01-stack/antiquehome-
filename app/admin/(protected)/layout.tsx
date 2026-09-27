import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import "@/app/styles/admin.css";
import { AdminNavList } from "@/app/components/admin/AdminNav";
import MobileDrawer from "@/app/components/admin/MobileDrawer";
import TabBar from "@/app/components/admin/TabBar";
import LogoutButton from "@/app/components/admin/LogoutButton";

async function getOrderCount() {
  try {
    const rows = (await sql`SELECT COUNT(*)::int AS count FROM orders WHERE status IN ('pending','processing')`) as {
      count: number;
    }[];
    return rows[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const orderCount = await getOrderCount();
  const initials = session.email.slice(0, 2).toUpperCase();

  return (
    <div className="admin">
      <div className="admin__shell">
        <aside className="admin__sidebar">
          <div className="admin__logo">
            <span className="admin__logo-name">ANTIQUE HOME</span>
            <span className="admin__logo-sub">Timeless Living</span>
          </div>

          <AdminNavList orderCount={orderCount} />

          <div className="admin__profile">
            <span className="admin__avatar">{initials}</span>
            <div>
              <div className="admin__profile-name">Antique Home</div>
              <div className="admin__profile-role">Admin</div>
            </div>
            <LogoutButton className="admin__profile-kebab" />
          </div>
        </aside>

        <div className="admin__main">
          <header className="admin__topbar">
            <MobileDrawer orderCount={orderCount} />

            <Link href="/admin" className="admin__mobileLogo">
              ANTIQUE HOME
              <span>TIMELESS LIVING</span>
            </Link>

            <div className="admin__search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.4"></circle><line x1="15.7" y1="15.7" x2="20.2" y2="20.2"></line></svg>
              <input type="text" placeholder="Search orders, products, customers..." />
              <kbd>Ctrl K</kbd>
            </div>

            <div className="admin__topActions">
              <button type="button" className="admin__iconBtn" aria-label="Toggle theme">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 13.6A8.4 8.4 0 1 1 10.4 3.6a6.8 6.8 0 0 0 10 10Z"></path></svg>
              </button>
              <button type="button" className="admin__iconBtn" aria-label="Notifications">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6a5.2 5.2 0 0 0-5.2 5.2v3l-1.6 3.2h13.6L17.2 11.8v-3A5.2 5.2 0 0 0 12 3.6Z"></path><path d="M10 18.4a2 2 0 0 0 4 0"></path></svg>
                <span className="dot" aria-hidden="true"></span>
              </button>
              <button type="button" className="admin__profileChip">
                <span className="admin__avatar">{initials}</span>
                <span>Antique Home</span>
                <svg viewBox="0 0 12 8" aria-hidden="true"><polyline points="1,1.5 6,6.5 11,1.5"></polyline></svg>
              </button>
            </div>
          </header>

          <div className="admin__content">{children}</div>
        </div>
      </div>

      <TabBar orderCount={orderCount} />
    </div>
  );
}

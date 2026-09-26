"use client";

import { useState } from "react";
import { AdminNavList } from "./AdminNav";

export default function MobileDrawer({ orderCount }: { orderCount: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="admin__hamburger"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24"><line x1="4" y1="7" x2="20" y2="7"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="17" x2="20" y2="17"></line></svg>
      </button>

      <div className="admin__drawer" data-open={open}>
        <button
          type="button"
          className="admin__drawer-scrim"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        ></button>
        <nav className="admin__drawer-panel">
          <div className="admin__logo">
            <span className="admin__logo-name">ANTIQUE HOME</span>
            <span className="admin__logo-sub">Timeless Living</span>
          </div>
          <AdminNavList orderCount={orderCount} onNavigate={() => setOpen(false)} />
        </nav>
      </div>
    </>
  );
}

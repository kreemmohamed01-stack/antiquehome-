"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DemoBar({ count }: { count: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!count) return null;

  async function remove() {
    if (!confirm(`Remove all ${count} demo orders? Real orders are never touched.`)) return;
    setBusy(true);
    const res = await fetch("/api/admin/demo", { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert("Failed to remove demo data.");
  }

  return (
    <div className="admin__demoBar">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style={{ flex: "none", fill: "none", stroke: "currentColor", strokeWidth: 1.6 }}>
        <circle cx="12" cy="12" r="9.4" /><line x1="12" y1="7.6" x2="12" y2="13" /><circle cx="12" cy="16.4" r="0.5" />
      </svg>
      <span>
        <strong>Demo data is on.</strong> {count} sample order{count === 1 ? "" : "s"} are shown so you can preview the
        dashboard. Remove them before you launch.
      </span>
      <button type="button" onClick={remove} disabled={busy}>
        {busy ? "Removing…" : "Remove demo data"}
      </button>
    </div>
  );
}

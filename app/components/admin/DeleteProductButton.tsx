"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteProductButton({ id, name }: { id: number; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setLoading(true);
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to delete product.");
    }
  }

  return (
    <button
      type="button"
      className="admin__btn admin__btn--danger"
      style={{ padding: "6px 12px" }}
      onClick={onDelete}
      disabled={loading}
    >
      {loading ? "…" : "Delete"}
    </button>
  );
}

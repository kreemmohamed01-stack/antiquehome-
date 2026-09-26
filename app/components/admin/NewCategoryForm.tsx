"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCategoryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed to add category.");
      return;
    }
    setName("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
      {error ? <div className="admin__loginError" style={{ flex: "0 0 100%" }}>{error}</div> : null}
      <input
        type="text"
        placeholder="New category name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{
          flex: 1,
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid var(--a-border)",
          background: "var(--a-panel-2)",
          color: "var(--a-text)",
          fontSize: 12.5,
        }}
      />
      <button type="submit" className="admin__btn admin__btn--gold" disabled={saving}>
        {saving ? "Adding…" : "Add Category"}
      </button>
    </form>
  );
}

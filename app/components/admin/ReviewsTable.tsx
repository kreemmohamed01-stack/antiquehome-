"use client";

import { useState } from "react";
import type { Product } from "@/lib/db";

function ReviewRow({ product }: { product: Product }) {
  const [rating, setRating] = useState(product.rating);
  const [reviewCount, setReviewCount] = useState(String(product.review_count));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/admin/products/${product.id}/rating`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: Number(rating), reviewCount: Number(reviewCount) }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } else {
      alert("Failed to save.");
    }
  }

  return (
    <tr>
      <td>
        <div className="admin__cellProduct">
          <img src={product.image_urls?.[0] || "/logo hero.png"} alt="" />
          <span>{product.name}</span>
        </div>
      </td>
      <td>
        <input
          type="number"
          min={0}
          max={5}
          step={0.1}
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          style={{ width: 70, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--a-border)", background: "var(--a-panel-2)", color: "var(--a-text)", fontSize: 12 }}
        />
      </td>
      <td>
        <input
          type="number"
          min={0}
          value={reviewCount}
          onChange={(e) => setReviewCount(e.target.value)}
          style={{ width: 90, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--a-border)", background: "var(--a-panel-2)", color: "var(--a-text)", fontSize: 12 }}
        />
      </td>
      <td>
        <button type="button" className="admin__btn admin__btn--gold" style={{ padding: "6px 14px" }} onClick={save} disabled={saving}>
          {saving ? "…" : saved ? "Saved ✓" : "Save"}
        </button>
      </td>
    </tr>
  );
}

export default function ReviewsTable({ products }: { products: Product[] }) {
  if (!products.length) {
    return <p style={{ textAlign: "center", color: "var(--a-text-dim)", fontSize: 12, padding: "20px 0" }}>No products yet.</p>;
  }
  return (
    <table className="admin__table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Rating (0–5)</th>
          <th>Review Count</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <ReviewRow key={p.id} product={p} />
        ))}
      </tbody>
    </table>
  );
}

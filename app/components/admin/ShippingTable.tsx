"use client";

import { useState } from "react";
import type { ShippingRate } from "@/lib/db";

function RateRow({ rate }: { rate: ShippingRate }) {
  const [standard, setStandard] = useState(rate.standard_price);
  const [express, setExpress] = useState(rate.express_price);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/admin/shipping/${rate.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ standardPrice: Number(standard), expressPrice: Number(express) }),
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
      <td>{rate.governorate}</td>
      <td>
        <input
          type="number"
          min={0}
          value={standard}
          onChange={(e) => setStandard(e.target.value)}
          style={{ width: 90, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--a-border)", background: "var(--a-panel-2)", color: "var(--a-text)", fontSize: 12 }}
        />
      </td>
      <td>
        <input
          type="number"
          min={0}
          value={express}
          onChange={(e) => setExpress(e.target.value)}
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

export default function ShippingTable({ rates }: { rates: ShippingRate[] }) {
  return (
    <table className="admin__table">
      <thead>
        <tr>
          <th>Governorate</th>
          <th>Standard Shipping (EGP)</th>
          <th>Express Shipping (EGP)</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {rates.map((r) => (
          <RateRow key={r.id} rate={r} />
        ))}
      </tbody>
    </table>
  );
}

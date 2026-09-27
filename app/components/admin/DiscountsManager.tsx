"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Coupon, SiteSale } from "@/lib/db";

export default function DiscountsManager({
  initialSale,
  initialCoupons,
}: {
  initialSale: SiteSale;
  initialCoupons: Coupon[];
}) {
  const router = useRouter();

  const [saleActive, setSaleActive] = useState(initialSale.active);
  const [salePercent, setSalePercent] = useState(String(initialSale.percent || ""));
  const [saleLabel, setSaleLabel] = useState(initialSale.label || "");
  const [savingSale, setSavingSale] = useState(false);
  const [saleError, setSaleError] = useState("");

  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("");
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");

  async function saveSale(e: React.FormEvent) {
    e.preventDefault();
    setSaleError("");
    setSavingSale(true);
    const res = await fetch("/api/admin/sale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: saleActive, percent: Number(salePercent) || 0, label: saleLabel }),
    });
    const data = await res.json();
    setSavingSale(false);
    if (!res.ok) {
      setSaleError(data.error || "Failed to save.");
      return;
    }
    router.refresh();
  }

  async function addCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponError("");
    setSavingCoupon(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, percent: Number(percent) }),
    });
    const data = await res.json();
    setSavingCoupon(false);
    if (!res.ok) {
      setCouponError(data.error || "Failed to add coupon.");
      return;
    }
    setCode("");
    setPercent("");
    router.refresh();
  }

  async function toggleCoupon(id: number, active: boolean) {
    await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    router.refresh();
  }

  async function deleteCoupon(id: number, code: string) {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      <div className="admin__panel" style={{ marginBottom: 18 }}>
        <div className="admin__panel-head">
          <h2 className="admin__panel-title">Site-Wide Sale</h2>
        </div>
        <p style={{ fontSize: 12, color: "var(--a-text-dim)", marginBottom: 16 }}>
          Applies a discount to every product on the store and shows a sale banner under the homepage hero.
        </p>
        <form onSubmit={saveSale} className="admin__form" style={{ maxWidth: 480 }}>
          {saleError ? <div className="admin__loginError">{saleError}</div> : null}
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--a-text)" }}>
            <input
              type="checkbox"
              checked={saleActive}
              onChange={(e) => setSaleActive(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            Enable site-wide sale
          </label>
          <div className="admin__field2">
            <div className="admin__field">
              <label>Discount Percent</label>
              <input
                type="number"
                min={1}
                max={90}
                placeholder="20"
                value={salePercent}
                onChange={(e) => setSalePercent(e.target.value)}
              />
            </div>
            <div className="admin__field">
              <label>Banner Label (optional)</label>
              <input
                type="text"
                placeholder="Sale 20% Off Everything"
                value={saleLabel}
                onChange={(e) => setSaleLabel(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="admin__btn admin__btn--gold" disabled={savingSale} style={{ alignSelf: "flex-start" }}>
            {savingSale ? "Saving…" : "Save Sale Settings"}
          </button>
        </form>
      </div>

      <div className="admin__panel">
        <div className="admin__panel-head">
          <h2 className="admin__panel-title">Coupon Codes</h2>
        </div>
        <p style={{ fontSize: 12, color: "var(--a-text-dim)", marginBottom: 16 }}>
          Customers can enter an active coupon code at checkout for an instant discount.
        </p>

        <form onSubmit={addCoupon} style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {couponError ? <div className="admin__loginError" style={{ flex: "0 0 100%" }}>{couponError}</div> : null}
          <input
            type="text"
            placeholder="Code (e.g. WELCOME10)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ flex: "1 1 200px", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--a-border)", background: "var(--a-panel-2)", color: "var(--a-text)", fontSize: 12.5 }}
          />
          <input
            type="number"
            min={1}
            max={90}
            placeholder="% off"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            style={{ width: 100, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--a-border)", background: "var(--a-panel-2)", color: "var(--a-text)", fontSize: 12.5 }}
          />
          <button type="submit" className="admin__btn admin__btn--gold" disabled={savingCoupon}>
            {savingCoupon ? "Adding…" : "Add Coupon"}
          </button>
        </form>

        {initialCoupons.length > 0 ? (
          <table className="admin__table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {initialCoupons.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.code}</td>
                  <td>{c.percent}%</td>
                  <td>
                    <span className={c.active ? "admin__pill admin__pill--delivered" : "admin__pill admin__pill--pending"}>
                      {c.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="admin__btn" style={{ padding: "6px 12px" }} onClick={() => toggleCoupon(c.id, !c.active)}>
                      {c.active ? "Disable" : "Enable"}
                    </button>
                    <button type="button" className="admin__btn admin__btn--danger" style={{ padding: "6px 12px" }} onClick={() => deleteCoupon(c.id, c.code)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: "center", color: "var(--a-text-dim)", fontSize: 12, padding: "20px 0" }}>
            No coupons yet.
          </p>
        )}
      </div>
    </>
  );
}

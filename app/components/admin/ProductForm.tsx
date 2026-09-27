"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ColorOption, ProductVariant } from "@/lib/db";

type Category = { id: number; name: string };

export type ProductFormValues = {
  id?: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  pricingMode: "unit" | "set";
  pricePerPiece: string;
  setSize: string;
  categoryIds: number[];
  material: string;
  colorOptions: ColorOption[];
  variants: ProductVariant[];
  sizeCm: string;
  badge: string;
  salePercent: string;
  saleLabel: string;
  stockQty: string;
  lowStockThreshold: string;
  isNewArrival: boolean;
  status: string;
  sku: string;
  imageUrls: string[];
};

function slugify(name: string) {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const SWATCHES = ["#F4F1EA", "#C9A227", "#27408B", "#3B5EA8", "#F2E8D5", "#1C1611", "#8C7B6B", "#5C6B4A"];

function Card({
  icon, title, sub, children,
}: { icon: React.ReactNode; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="admin__formCard">
      <div className="admin__formCard-head">
        <span className="admin__formCard-ico">{icon}</span>
        <span className="admin__formCard-title">{title}</span>
      </div>
      {sub ? <p className="admin__formCard-sub">{sub}</p> : null}
      {children}
    </div>
  );
}

export default function ProductForm({
  categories,
  initial,
}: {
  categories: Category[];
  initial?: Partial<ProductFormValues>;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [v, setV] = useState<ProductFormValues>({
    name: initial?.name || "",
    slug: initial?.slug || "",
    description: initial?.description || "",
    price: initial?.price || "",
    compareAtPrice: initial?.compareAtPrice || "",
    pricingMode: (initial?.pricingMode as "unit" | "set") || "unit",
    pricePerPiece: initial?.pricePerPiece || "",
    setSize: initial?.setSize || "",
    categoryIds: initial?.categoryIds || [],
    material: initial?.material || "",
    colorOptions: initial?.colorOptions || [],
    variants: initial?.variants || [],
    sizeCm: initial?.sizeCm || "",
    badge: initial?.badge || "",
    salePercent: initial?.salePercent || "",
    saleLabel: initial?.saleLabel || "",
    stockQty: initial?.stockQty || "0",
    lowStockThreshold: initial?.lowStockThreshold || "5",
    isNewArrival: initial?.isNewArrival ?? false,
    status: initial?.status || "active",
    sku: initial?.sku || "",
    imageUrls: initial?.imageUrls || [],
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState(SWATCHES[0]);
  const [activeColor, setActiveColor] = useState(0);

  function set<K extends keyof ProductFormValues>(key: K, val: ProductFormValues[K]) {
    setV((s) => ({ ...s, [key]: val }));
  }

  function onName(name: string) {
    set("name", name);
    if (!slugTouched) set("slug", slugify(name));
  }

  async function uploadFiles(files: FileList, target: "main" | number) {
    setUploading(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed.");
        urls.push(data.url);
      }
      if (target === "main") {
        set("imageUrls", [...v.imageUrls, ...urls]);
      } else {
        const next = [...v.colorOptions];
        next[target] = { ...next[target], imageUrls: [...(next[target].imageUrls || []), ...urls] };
        set("colorOptions", next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function moveImage(i: number, dir: -1 | 1) {
    const next = [...v.imageUrls];
    const t = i + dir;
    if (t < 0 || t >= next.length) return;
    [next[i], next[t]] = [next[t], next[i]];
    set("imageUrls", next);
  }

  function addColor() {
    const name = colorName.trim();
    if (!name) return;
    if (v.colorOptions.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    set("colorOptions", [...v.colorOptions, { name, hex: colorHex, imageUrls: [] }]);
    setColorName("");
  }

  function addVariant() {
    set("variants", [...v.variants, { label: "", price: Number(v.price) || 0, stock: 0 }]);
  }

  function updateVariant(i: number, patch: Partial<ProductVariant>) {
    const next = [...v.variants];
    next[i] = { ...next[i], ...patch };
    set("variants", next);
  }

  const totalVariantStock = v.variants.reduce((s, x) => s + (Number(x.stock) || 0), 0);
  const effectiveStock = v.variants.length ? totalVariantStock : Number(v.stockQty) || 0;
  const stockLabel =
    effectiveStock <= 0 ? "Out of Stock"
      : effectiveStock <= (Number(v.lowStockThreshold) || 5) ? "Low Stock"
      : "In Stock";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      ...v,
      price: v.price,
      variants: v.variants.filter((x) => x.label.trim()),
      colors: v.colorOptions.map((c) => c.name),
      stockQty: v.variants.length ? String(totalVariantStock) : v.stockQty,
    };
    try {
      const url = isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product.");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {error ? <div className="admin__loginError" style={{ marginBottom: 14 }}>{error}</div> : null}

      {/* ---------------- MEDIA ---------------- */}
      <Card
        title="Media"
        sub="Add high-quality images of your product. The first image is the hero shot shown on the storefront."
        icon={<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.6" /><path d="M21 16l-5-5-5 5-2-2-6 6" /></svg>}
      >
        <div className="admin__media">
          {v.imageUrls.map((url, i) => (
            <div key={url} className={`admin__mediaTile${i === 0 ? " admin__mediaTile--hero" : ""}`}>
              <img src={url} alt="" />
              {i === 0 ? <span className="admin__mediaHeroTag">Hero</span> : null}
              <button type="button" className="admin__mediaDel" onClick={() => set("imageUrls", v.imageUrls.filter((u) => u !== url))} aria-label="Remove">
                <svg viewBox="0 0 24 24"><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></svg>
              </button>
              {i > 0 ? (
                <button
                  type="button"
                  className="admin__mediaDel"
                  style={{ right: "auto", left: 6, background: "rgba(10,8,5,.72)" }}
                  onClick={() => moveImage(i, -1)}
                  aria-label="Move earlier"
                >
                  <svg viewBox="0 0 24 24"><polyline points="14,6 8,12 14,18" /></svg>
                </button>
              ) : null}
            </div>
          ))}
          <label className="admin__mediaAdd">
            <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {uploading ? "Uploading…" : "Add Images"}
            <input type="file" accept="image/*" multiple hidden disabled={uploading}
              onChange={(e) => e.target.files && uploadFiles(e.target.files, "main")} />
          </label>
        </div>
      </Card>

      {/* ---------------- INFORMATION ---------------- */}
      <Card
        title="Product Information"
        icon={<svg viewBox="0 0 24 24"><rect x="4" y="3.5" width="16" height="17" rx="2" /><line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></svg>}
      >
        <div className="admin__field">
          <label>Product Name *</label>
          <input type="text" required value={v.name} onChange={(e) => onName(e.target.value)} />
        </div>
        <div className="admin__field">
          <label>Description</label>
          <textarea rows={4} value={v.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="admin__field2">
          <div className="admin__field">
            <label>URL Slug</label>
            <input type="text" required value={v.slug}
              onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} />
          </div>
          <div className="admin__field">
            <label>Status</label>
            <select value={v.status} onChange={(e) => set("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="admin__field">
          <label>Categories — a product can live in more than one</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map((c) => {
              const on = v.categoryIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`admin__pill${on ? " is-active" : ""}`}
                  onClick={() =>
                    set("categoryIds", on ? v.categoryIds.filter((x) => x !== c.id) : [...v.categoryIds, c.id])
                  }
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        <label className="admin__switch" style={{ marginTop: 6 }}>
          <input type="checkbox" checked={v.isNewArrival} onChange={(e) => set("isNewArrival", e.target.checked)} />
          <span className="admin__switchTrack" />
          Show in New Arrivals on the homepage
        </label>
      </Card>

      {/* ---------------- PRICING ---------------- */}
      <Card
        title="Pricing"
        icon={<svg viewBox="0 0 24 24"><path d="M4.4 11.6 11.6 4.4h7.2v7.2l-7.2 7.2Z" /><circle cx="15.4" cy="8.6" r="1.5" /></svg>}
      >
        <div className="admin__field2">
          <div className="admin__field">
            <label>Price (EGP) *</label>
            <input type="number" step="0.01" required value={v.price} onChange={(e) => set("price", e.target.value)} />
          </div>
          <div className="admin__field">
            <label>Compare at Price (EGP)</label>
            <input type="number" step="0.01" value={v.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} />
          </div>
        </div>

        <div className="admin__field">
          <label>How is this sold?</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className={`admin__pill${v.pricingMode === "unit" ? " is-active" : ""}`} onClick={() => set("pricingMode", "unit")}>
              Per piece
            </button>
            <button type="button" className={`admin__pill${v.pricingMode === "set" ? " is-active" : ""}`} onClick={() => set("pricingMode", "set")}>
              Sold as a set
            </button>
          </div>
        </div>

        {v.pricingMode === "set" && (
          <div className="admin__field2">
            <div className="admin__field">
              <label>Pieces per set</label>
              <input type="number" min={1} placeholder="2" value={v.setSize} onChange={(e) => set("setSize", e.target.value)} />
            </div>
            <div className="admin__field">
              <label>Price per single piece (EGP)</label>
              <input type="number" step="0.01" value={v.pricePerPiece} onChange={(e) => set("pricePerPiece", e.target.value)} />
            </div>
          </div>
        )}

        <div style={{ background: "var(--a-panel-2)", border: "1px solid var(--a-border)", borderRadius: 10, padding: 14, marginTop: 4 }}>
          <label style={{ fontSize: 11.5, color: "var(--a-text-dim)", display: "block", marginBottom: 10 }}>
            Sale on this product
          </label>
          <div className="admin__field2">
            <div className="admin__field">
              <label>Discount %</label>
              <input type="number" min={0} max={90} placeholder="20" value={v.salePercent} onChange={(e) => set("salePercent", e.target.value)} />
            </div>
            <div className="admin__field">
              <label>Sale label</label>
              <input type="text" placeholder="Sale 20%" value={v.saleLabel} onChange={(e) => set("saleLabel", e.target.value)} />
            </div>
          </div>
          <p style={{ fontSize: 10.5, color: "var(--a-text-dim)", margin: "4px 0 0" }}>
            Shows in red on the product card and page, and overrides the site-wide sale for this item.
          </p>
        </div>
      </Card>

      {/* ---------------- INVENTORY ---------------- */}
      <Card
        title="Inventory"
        sub="Stock drops automatically as orders come in. Below the alert level the product shows as Low Stock; at zero it shows Out of Stock."
        icon={<svg viewBox="0 0 24 24"><path d="M12 2.6 20.4 7v10L12 21.4 3.6 17V7Z" /><path d="M3.6 7 12 11.4 20.4 7" /><line x1="12" y1="11.4" x2="12" y2="21.4" /></svg>}
      >
        <div className="admin__field2">
          <div className="admin__field">
            <label>SKU</label>
            <input type="text" placeholder="AH-LT-001" value={v.sku} onChange={(e) => set("sku", e.target.value)} />
          </div>
          <div className="admin__field">
            <label>Stock Quantity {v.variants.length ? "(from sizes)" : "*"}</label>
            <input
              type="number"
              value={v.variants.length ? totalVariantStock : v.stockQty}
              disabled={v.variants.length > 0}
              onChange={(e) => set("stockQty", e.target.value)}
            />
          </div>
        </div>
        <div className="admin__field2">
          <div className="admin__field">
            <label>Low-stock alert at</label>
            <input type="number" min={0} value={v.lowStockThreshold} onChange={(e) => set("lowStockThreshold", e.target.value)} />
          </div>
          <div className="admin__field">
            <label>Current state</label>
            <div style={{ paddingTop: 8 }}>
              <span className={
                stockLabel === "Out of Stock" ? "admin__pill admin__pill--low"
                  : stockLabel === "Low Stock" ? "admin__pill admin__pill--warn"
                  : "admin__pill admin__pill--delivered"
              }>
                {stockLabel}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ---------------- OPTIONS ---------------- */}
      <Card
        title="Product Options"
        sub="Sizes each carry their own price and stock. Colours can carry their own photos — the storefront gallery swaps when a customer picks one."
        icon={<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2" /><path d="M4.6 12h1.6M17.8 12h1.6M12 4.6v1.6M12 17.8v1.6" /></svg>}
      >
        <div className="admin__optRow" style={{ alignItems: "flex-start" }}>
          <span className="admin__optLabel" style={{ paddingTop: 7 }}>Colours</span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {v.colorOptions.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  className={`admin__swatch${activeColor === i ? " is-active" : ""}`}
                  style={{ background: c.hex }}
                  title={c.name}
                  onClick={() => setActiveColor(i)}
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Colour name"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }}
                style={{ flex: "1 1 140px", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--a-border)", background: "var(--a-panel-2)", color: "var(--a-text)", fontSize: 12 }}
              />
              <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)}
                style={{ width: 38, height: 34, padding: 0, border: "1px solid var(--a-border)", borderRadius: 8, background: "none" }} />
              <button type="button" className="admin__btn" onClick={addColor}>Add</button>
            </div>

            {v.colorOptions[activeColor] ? (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 11, color: "var(--a-text-dim)", marginBottom: 8 }}>
                  Photos for <strong style={{ color: "var(--a-cream)" }}>{v.colorOptions[activeColor].name}</strong>
                  {" — leave empty to reuse the main gallery."}
                </p>
                <div className="admin__media">
                  {(v.colorOptions[activeColor].imageUrls || []).map((url) => (
                    <div key={url} className="admin__mediaTile">
                      <img src={url} alt="" />
                      <button
                        type="button"
                        className="admin__mediaDel"
                        onClick={() => {
                          const next = [...v.colorOptions];
                          next[activeColor] = {
                            ...next[activeColor],
                            imageUrls: next[activeColor].imageUrls.filter((u) => u !== url),
                          };
                          set("colorOptions", next);
                        }}
                        aria-label="Remove"
                      >
                        <svg viewBox="0 0 24 24"><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></svg>
                      </button>
                    </div>
                  ))}
                  <label className="admin__mediaAdd">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    {uploading ? "Uploading…" : "Add"}
                    <input type="file" accept="image/*" multiple hidden disabled={uploading}
                      onChange={(e) => e.target.files && uploadFiles(e.target.files, activeColor)} />
                  </label>
                </div>
                <button
                  type="button"
                  className="admin__btn admin__btn--danger"
                  style={{ marginTop: 10, padding: "6px 12px" }}
                  onClick={() => {
                    set("colorOptions", v.colorOptions.filter((_, i) => i !== activeColor));
                    setActiveColor(0);
                  }}
                >
                  Remove colour
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="admin__optRow" style={{ alignItems: "flex-start", marginTop: 18 }}>
          <span className="admin__optLabel" style={{ paddingTop: 7 }}>Sizes</span>
          <div style={{ flex: 1, minWidth: 260 }}>
            {v.variants.length > 0 && (
              <div className="admin__variantRow" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 10.5, color: "var(--a-text-dim)" }}>Size</span>
                <span style={{ fontSize: 10.5, color: "var(--a-text-dim)" }}>Price (EGP)</span>
                <span style={{ fontSize: 10.5, color: "var(--a-text-dim)" }}>Stock</span>
                <span />
              </div>
            )}
            {v.variants.map((variant, i) => (
              <div className="admin__variantRow" key={i}>
                <input type="text" placeholder="60 cm" value={variant.label} onChange={(e) => updateVariant(i, { label: e.target.value })} />
                <input type="number" step="0.01" placeholder="3000" value={variant.price} onChange={(e) => updateVariant(i, { price: Number(e.target.value) })} />
                <input type="number" min={0} placeholder="5" value={variant.stock} onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })} />
                <button type="button" className="admin__iconAct admin__iconAct--danger" onClick={() => set("variants", v.variants.filter((_, k) => k !== i))} aria-label="Remove size">
                  <svg viewBox="0 0 24 24"><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></svg>
                </button>
              </div>
            ))}
            <button type="button" className="admin__btn" onClick={addVariant} style={{ marginTop: 4 }}>
              + Add size
            </button>
          </div>
        </div>

        <div className="admin__optRow" style={{ marginTop: 18 }}>
          <span className="admin__optLabel">Material</span>
          <input
            type="text"
            value={v.material}
            onChange={(e) => set("material", e.target.value)}
            style={{ flex: "1 1 180px", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--a-border)", background: "var(--a-panel-2)", color: "var(--a-text)", fontSize: 12 }}
          />
        </div>
        <div className="admin__optRow">
          <span className="admin__optLabel">Dimensions</span>
          <input
            type="text"
            placeholder="height 60 cm"
            value={v.sizeCm}
            onChange={(e) => set("sizeCm", e.target.value)}
            style={{ flex: "1 1 180px", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--a-border)", background: "var(--a-panel-2)", color: "var(--a-text)", fontSize: 12 }}
          />
        </div>
      </Card>

      <div className="admin__formActions">
        <button type="submit" className="admin__btn admin__btn--gold" disabled={saving || uploading}>
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Product"}
        </button>
        <button type="button" className="admin__btn" onClick={() => router.push("/admin/products")}>Cancel</button>
        {isEdit && v.slug ? (
          <a className="admin__btn" href={`/product/${v.slug}`} target="_blank" rel="noreferrer">Preview</a>
        ) : null}
      </div>
    </form>
  );
}

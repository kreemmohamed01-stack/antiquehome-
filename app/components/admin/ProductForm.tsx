"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: number; name: string };

type ProductFormValues = {
  id?: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  categoryId: string;
  material: string;
  colors: string; // comma-separated in the UI
  sizeCm: string;
  sizes: string[];
  badge: string;
  salePercent: string;
  saleLabel: string;
  stockQty: string;
  imageUrls: string[];
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
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

  const [values, setValues] = useState<ProductFormValues>({
    name: initial?.name || "",
    slug: initial?.slug || "",
    description: initial?.description || "",
    price: initial?.price || "",
    compareAtPrice: initial?.compareAtPrice || "",
    categoryId: initial?.categoryId || "",
    material: initial?.material || "",
    colors: initial?.colors || "",
    sizeCm: initial?.sizeCm || "",
    sizes: initial?.sizes || [],
    badge: initial?.badge || "",
    salePercent: initial?.salePercent || "",
    saleLabel: initial?.saleLabel || "",
    stockQty: initial?.stockQty || "0",
    imageUrls: initial?.imageUrls || [],
  });
  const [sizeInput, setSizeInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(isEdit);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function onNameChange(name: string) {
    update("name", name);
    if (!slugTouched) update("slug", slugify(name));
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !files.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed.");
        uploaded.push(data.url);
      }
      update("imageUrls", [...values.imageUrls, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(url: string) {
    update("imageUrls", values.imageUrls.filter((u) => u !== url));
  }

  function moveImage(index: number, dir: -1 | 1) {
    const next = [...values.imageUrls];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update("imageUrls", next);
  }

  function addSize() {
    const val = sizeInput.trim();
    if (!val) return;
    if (!values.sizes.includes(val)) update("sizes", [...values.sizes, val]);
    setSizeInput("");
  }

  function removeSize(val: string) {
    update("sizes", values.sizes.filter((s) => s !== val));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      name: values.name,
      slug: values.slug,
      description: values.description,
      price: values.price,
      compareAtPrice: values.compareAtPrice || null,
      categoryId: values.categoryId || null,
      material: values.material,
      colors: values.colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      sizeCm: values.sizeCm,
      sizes: values.sizes,
      badge: values.badge || null,
      salePercent: values.salePercent || null,
      saleLabel: values.saleLabel || null,
      stockQty: values.stockQty,
      imageUrls: values.imageUrls,
    };

    try {
      const url = isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
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
    <form className="admin__form" onSubmit={onSubmit}>
      {error ? <div className="admin__loginError">{error}</div> : null}

      {/* Images first — this is the first thing an admin fills in */}
      <div className="admin__field">
        <label>Product Images</label>
        <label className="admin__uploader">
          {uploading ? "Uploading…" : "Click to upload image(s) — supports multiple files"}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onFileChange}
            style={{ display: "none" }}
            disabled={uploading}
          />
        </label>
        {values.imageUrls.length > 0 ? (
          <div className="admin__uploadPreview">
            {values.imageUrls.map((url, i) => (
              <div key={url} style={{ position: "relative" }}>
                <img src={url} alt="" />
                {i === 0 ? (
                  <span
                    style={{
                      position: "absolute", bottom: -6, left: -6,
                      background: "var(--a-gold)", color: "#1C1611",
                      fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                    }}
                  >
                    Main
                  </span>
                ) : null}
                <div style={{ position: "absolute", top: -6, left: -6, display: "flex", gap: 2 }}>
                  {i > 0 ? (
                    <button
                      type="button"
                      onClick={() => moveImage(i, -1)}
                      aria-label="Move earlier"
                      style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--a-panel)", color: "var(--a-text)", border: "1px solid var(--a-border)", cursor: "pointer", fontSize: 10, lineHeight: 1 }}
                    >
                      ‹
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#C5645A",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 11,
                    lineHeight: 1,
                  }}
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <p style={{ fontSize: 10.5, color: "var(--a-text-dim)", marginTop: 6 }}>
          The first image is the main product photo. Use the ‹ arrow to reorder.
        </p>
      </div>

      <div className="admin__field">
        <label>Product Name</label>
        <input
          type="text"
          required
          value={values.name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>

      <div className="admin__field">
        <label>Slug</label>
        <input
          type="text"
          required
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            update("slug", e.target.value);
          }}
        />
      </div>

      <div className="admin__field">
        <label>Description</label>
        <textarea
          rows={4}
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </div>

      <div className="admin__field2">
        <div className="admin__field">
          <label>Price (EGP)</label>
          <input
            type="number"
            step="0.01"
            required
            value={values.price}
            onChange={(e) => update("price", e.target.value)}
          />
        </div>
        <div className="admin__field">
          <label>Compare-at Price (optional)</label>
          <input
            type="number"
            step="0.01"
            value={values.compareAtPrice}
            onChange={(e) => update("compareAtPrice", e.target.value)}
          />
        </div>
      </div>

      <div className="admin__field2">
        <div className="admin__field">
          <label>Category</label>
          <select value={values.categoryId} onChange={(e) => update("categoryId", e.target.value)}>
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="admin__field">
          <label>Badge (optional)</label>
          <select value={values.badge} onChange={(e) => update("badge", e.target.value)}>
            <option value="">— None —</option>
            <option value="new">New</option>
            <option value="bestseller">Bestseller</option>
          </select>
        </div>
      </div>

      {/* Per-product sale */}
      <div className="admin__field" style={{ background: "var(--a-panel-2)", padding: 14, borderRadius: 10, border: "1px solid var(--a-border)" }}>
        <label style={{ marginBottom: 10 }}>Sale on this product (optional)</label>
        <div className="admin__field2">
          <div className="admin__field">
            <label>Discount Percent</label>
            <input
              type="number"
              min={0}
              max={90}
              placeholder="e.g. 20"
              value={values.salePercent}
              onChange={(e) => update("salePercent", e.target.value)}
            />
          </div>
          <div className="admin__field">
            <label>Sale Label (optional)</label>
            <input
              type="text"
              placeholder="e.g. Sale 20%"
              value={values.saleLabel}
              onChange={(e) => update("saleLabel", e.target.value)}
            />
          </div>
        </div>
        <p style={{ fontSize: 10.5, color: "var(--a-text-dim)", marginTop: 4 }}>
          Shows in red on the product card and product page. Overrides the site-wide sale for this
          item if both are active. Leave the percent empty to remove any sale from this product.
        </p>
      </div>

      <div className="admin__field2">
        <div className="admin__field">
          <label>Material</label>
          <input type="text" value={values.material} onChange={(e) => update("material", e.target.value)} />
        </div>
        <div className="admin__field">
          <label>Size (cm) — free text, optional</label>
          <input type="text" value={values.sizeCm} onChange={(e) => update("sizeCm", e.target.value)} />
        </div>
      </div>

      <div className="admin__field">
        <label>Size Options (e.g. Small, Medium, Large — your own groups)</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="Type a size and press Add"
            value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSize();
              }
            }}
          />
          <button type="button" className="admin__btn" onClick={addSize}>
            Add
          </button>
        </div>
        {values.sizes.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {values.sizes.map((s) => (
              <span
                key={s}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 10px", borderRadius: 20,
                  background: "var(--a-panel-2)", border: "1px solid var(--a-border)",
                  fontSize: 11.5, color: "var(--a-text)",
                }}
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeSize(s)}
                  style={{ background: "none", border: "none", color: "var(--a-text-dim)", cursor: "pointer", fontSize: 12, lineHeight: 1 }}
                  aria-label={`Remove ${s}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="admin__field2">
        <div className="admin__field">
          <label>Colors (comma-separated)</label>
          <input type="text" placeholder="beige, brown, black" value={values.colors} onChange={(e) => update("colors", e.target.value)} />
        </div>
        <div className="admin__field">
          <label>Stock Quantity</label>
          <input type="number" required value={values.stockQty} onChange={(e) => update("stockQty", e.target.value)} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" className="admin__btn admin__btn--gold" disabled={saving || uploading}>
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Product"}
        </button>
        <button type="button" className="admin__btn" onClick={() => router.push("/admin/products")}>
          Cancel
        </button>
      </div>
    </form>
  );
}

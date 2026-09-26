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
  badge: string;
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
    badge: initial?.badge || "",
    stockQty: initial?.stockQty || "0",
    imageUrls: initial?.imageUrls || [],
  });
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
      badge: values.badge || null,
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
            <option value="sale">Sale</option>
            <option value="bestseller">Bestseller</option>
          </select>
        </div>
      </div>

      <div className="admin__field2">
        <div className="admin__field">
          <label>Material</label>
          <input type="text" value={values.material} onChange={(e) => update("material", e.target.value)} />
        </div>
        <div className="admin__field">
          <label>Size (cm)</label>
          <input type="text" value={values.sizeCm} onChange={(e) => update("sizeCm", e.target.value)} />
        </div>
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
            {values.imageUrls.map((url) => (
              <div key={url} style={{ position: "relative" }}>
                <img src={url} alt="" />
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

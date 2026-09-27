"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/db";
import { stockState } from "@/lib/db";

type Row = Product & { category_name: string | null };

function fmt(n: string | number) {
  return "EGP " + Math.round(typeof n === "string" ? parseFloat(n) : n).toLocaleString("en-US");
}

const PAGE_SIZE = 10;

export default function ProductsManager({ products }: { products: Row[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "active" | "draft" | "archived">("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<number | null>(null);

  const counts = useMemo(
    () => ({
      all: products.length,
      active: products.filter((p) => p.status === "active").length,
      draft: products.filter((p) => p.status === "draft").length,
      archived: products.filter((p) => p.status === "archived").length,
    }),
    [products]
  );

  const stats = useMemo(() => {
    const inStock = products.filter((p) => stockState(p) === "in").length;
    const low = products.filter((p) => stockState(p) === "low").length;
    const out = products.filter((p) => stockState(p) === "out").length;
    const avg = products.length
      ? products.reduce((s, p) => s + Number(p.price), 0) / products.length
      : 0;
    return { total: products.length, inStock, low, out, avg };
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (tab !== "all") list = list.filter((p) => p.status === tab);
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          (p.sku || "").toLowerCase().includes(needle) ||
          (p.category_name || "").toLowerCase().includes(needle)
      );
    }
    return list;
  }, [products, tab, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  async function remove(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setBusy(id);
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) router.refresh();
    else alert("Failed to delete product.");
  }

  function stockPill(p: Row) {
    const s = stockState(p);
    if (s === "out") return <span className="admin__pill admin__pill--low">Out of Stock</span>;
    if (s === "low") return <span className="admin__pill admin__pill--warn">Low Stock</span>;
    return <span className="admin__pill admin__pill--delivered">Active</span>;
  }

  return (
    <>
      <div className="admin__pageHead">
        <img src={products[0]?.image_urls?.[0] || "/sec 2/main sec 2.jpeg"} alt="" />
        <div className="admin__pageHead-body">
          <p className="admin__crumb">
            <Link href="/admin">Dashboard</Link>
            <svg viewBox="0 0 12 8" aria-hidden="true"><polyline points="1,1.5 6,6.5 11,1.5" transform="rotate(-90 6 4)" fill="none" /></svg>
            <span>Products</span>
          </p>
          <h1 className="admin__pageTitle">Products</h1>
          <p className="admin__pageSub">Manage your products, inventory, and collections.</p>
        </div>
        <div className="admin__pageHead-actions">
          <Link href="/admin/products/new" className="admin__btn admin__btn--gold">
            Add New Product
            <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
              <line x1="10" y1="4.4" x2="10" y2="15.6" /><line x1="4.4" y1="10" x2="15.6" y2="10" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="admin__statStrip admin__statStrip--5">
        <div className="admin__stat">
          <div className="admin__stat-top">
            <span className="admin__stat-label">Total Products</span>
            <span className="admin__stat-icon">
              <svg viewBox="0 0 24 24"><path d="M12 2.6 20.4 7v10L12 21.4 3.6 17V7Z" /><path d="M3.6 7 12 11.4 20.4 7" /><line x1="12" y1="11.4" x2="12" y2="21.4" /></svg>
            </span>
          </div>
          <div className="admin__stat-value">{stats.total}</div>
        </div>
        <div className="admin__stat">
          <div className="admin__stat-top">
            <span className="admin__stat-label">In Stock</span>
            <span className="admin__stat-icon"><svg viewBox="0 0 24 24"><polyline points="5,12.5 10,17.5 19,7" /></svg></span>
          </div>
          <div className="admin__stat-value">{stats.inStock}</div>
        </div>
        <div className="admin__stat">
          <div className="admin__stat-top">
            <span className="admin__stat-label">Low Stock</span>
            <span className="admin__stat-icon" style={{ color: "var(--a-amber)", background: "rgba(217,164,65,.12)" }}>
              <svg viewBox="0 0 24 24"><path d="M12 3.6 21.4 20H2.6Z" /><line x1="12" y1="9.6" x2="12" y2="14" /><circle cx="12" cy="16.8" r="0.5" /></svg>
            </span>
          </div>
          <div className="admin__stat-value" style={{ color: stats.low ? "var(--a-amber)" : undefined }}>{stats.low}</div>
        </div>
        <div className="admin__stat">
          <div className="admin__stat-top">
            <span className="admin__stat-label">Out of Stock</span>
            <span className="admin__stat-icon" style={{ color: "var(--a-red)", background: "rgba(197,100,90,.12)" }}>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><line x1="8.5" y1="8.5" x2="15.5" y2="15.5" /></svg>
            </span>
          </div>
          <div className="admin__stat-value" style={{ color: stats.out ? "var(--a-red)" : undefined }}>{stats.out}</div>
        </div>
        <div className="admin__stat">
          <div className="admin__stat-top">
            <span className="admin__stat-label">Avg. Price</span>
            <span className="admin__stat-icon">
              <svg viewBox="0 0 24 24"><line x1="5" y1="19" x2="5" y2="13" /><line x1="12" y1="19" x2="12" y2="7" /><line x1="19" y1="19" x2="19" y2="10" /></svg>
            </span>
          </div>
          <div className="admin__stat-value">{fmt(stats.avg)}</div>
        </div>
      </div>

      <div className="admin__panel">
        <div className="admin__tabRow" style={{ marginBottom: 14 }}>
          {([
            ["all", `All Products (${counts.all})`],
            ["active", `Active (${counts.active})`],
            ["draft", `Draft (${counts.draft})`],
            ["archived", `Archived (${counts.archived})`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`admin__chip${tab === key ? " is-active" : ""}`}
              onClick={() => { setTab(key); setPage(1); }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="admin__toolbar">
          <div className="admin__searchInline">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.4" /><line x1="15.7" y1="15.7" x2="20.2" y2="20.2" /></svg>
            <input
              type="text"
              placeholder="Search products…"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
          <div className="admin__viewToggle">
            <button type="button" className={view === "grid" ? "is-active" : ""} onClick={() => setView("grid")} aria-label="Grid view">
              <svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="1" /><rect x="13.5" y="3.5" width="7" height="7" rx="1" /><rect x="3.5" y="13.5" width="7" height="7" rx="1" /><rect x="13.5" y="13.5" width="7" height="7" rx="1" /></svg>
            </button>
            <button type="button" className={view === "list" ? "is-active" : ""} onClick={() => setView("list")} aria-label="List view">
              <svg viewBox="0 0 24 24"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
            </button>
          </div>
        </div>

        {visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "var(--a-text-dim)" }}>
            <p style={{ marginBottom: 16 }}>No products match this view.</p>
            <Link href="/admin/products/new" className="admin__btn admin__btn--gold">Add Product</Link>
          </div>
        ) : view === "grid" ? (
          <div className="admin__pgrid">
            {visible.map((p) => (
              <div key={p.id} className="admin__pcard">
                <img src={p.image_urls?.[0] || "/logo hero.png"} alt="" />
                <div className="admin__pcard-body">
                  <div className="admin__prow-name" style={{ marginBottom: 2 }}>{p.name}</div>
                  <div className="admin__prow-sku">{p.sku || "—"} · {p.category_name || "Uncategorised"}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--a-cream)" }}>{fmt(p.price)}</span>
                    {stockPill(p)}
                  </div>
                  <div className="admin__prow-actions" style={{ marginTop: 10 }}>
                    <Link href={`/admin/products/${p.id}/edit`} className="admin__iconAct" aria-label="Edit">
                      <svg viewBox="0 0 24 24"><path d="M4 16.4 15.4 5l3.6 3.6L7.6 20H4Z" /></svg>
                    </Link>
                    <Link href={`/product/${p.slug}`} className="admin__iconAct" aria-label="View on site" target="_blank">
                      <svg viewBox="0 0 24 24"><path d="M2.4 12S6 5.6 12 5.6 21.6 12 21.6 12 18 18.4 12 18.4 2.4 12 2.4 12Z" /><circle cx="12" cy="12" r="2.8" /></svg>
                    </Link>
                    <button type="button" className="admin__iconAct admin__iconAct--danger" onClick={() => remove(p.id, p.name)} disabled={busy === p.id} aria-label="Delete">
                      <svg viewBox="0 0 24 24"><path d="M5.6 7.2h12.8l-1 12.4H6.6Z" /><path d="M9.4 7.2V5.4a1.6 1.6 0 0 1 1.6-1.6h2a1.6 1.6 0 0 1 1.6 1.6v1.8" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {visible.map((p) => (
              <div key={p.id} className="admin__prow">
                <img src={p.image_urls?.[0] || "/logo hero.png"} alt="" />
                <div className="admin__prow-main">
                  <div className="admin__prow-name">{p.name}</div>
                  <div className="admin__prow-sku">SKU: {p.sku || "—"} · {p.category_name || "Uncategorised"}</div>
                </div>
                <div style={{ flex: "none", textAlign: "right", minWidth: 90 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--a-cream)" }}>{fmt(p.price)}</div>
                  <div style={{ fontSize: 11, color: stockState(p) === "out" ? "var(--a-red)" : stockState(p) === "low" ? "var(--a-amber)" : "var(--a-green)" }}>
                    {p.stock_qty} in stock
                  </div>
                </div>
                <div style={{ flex: "none" }}>{stockPill(p)}</div>
                <div className="admin__prow-actions">
                  <Link href={`/admin/products/${p.id}/edit`} className="admin__iconAct" aria-label="Edit">
                    <svg viewBox="0 0 24 24"><path d="M4 16.4 15.4 5l3.6 3.6L7.6 20H4Z" /></svg>
                  </Link>
                  <Link href={`/product/${p.slug}`} className="admin__iconAct" aria-label="View on site" target="_blank">
                    <svg viewBox="0 0 24 24"><path d="M2.4 12S6 5.6 12 5.6 21.6 12 21.6 12 18 18.4 12 18.4 2.4 12 2.4 12Z" /><circle cx="12" cy="12" r="2.8" /></svg>
                  </Link>
                  <button type="button" className="admin__iconAct admin__iconAct--danger" onClick={() => remove(p.id, p.name)} disabled={busy === p.id} aria-label="Delete">
                    <svg viewBox="0 0 24 24"><path d="M5.6 7.2h12.8l-1 12.4H6.6Z" /><path d="M9.4 7.2V5.4a1.6 1.6 0 0 1 1.6-1.6h2a1.6 1.6 0 0 1 1.6 1.6v1.8" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="admin__pager">
            <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)}>‹</button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                className={current === i + 1 ? "is-active" : ""}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button type="button" disabled={current === totalPages} onClick={() => setPage(current + 1)}>›</button>
          </div>
        )}
      </div>
    </>
  );
}

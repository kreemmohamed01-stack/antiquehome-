import Link from "next/link";
import { sql } from "@/lib/db";

export const revalidate = 0;
export const metadata = { title: "Collections — Antique Home Admin" };

async function getCollections() {
  try {
    return (await sql`
      SELECT c.id, c.name, c.slug, c.image_url,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id)::int AS product_count,
        (SELECT COALESCE(SUM(price),0) FROM products p WHERE p.category_id = c.id)::float AS total_value
      FROM categories c
      ORDER BY c.sort_order
    `) as { id: number; name: string; slug: string; image_url: string | null; product_count: number; total_value: number }[];
  } catch {
    return [];
  }
}

function fmt(n: number) {
  return "EGP " + Math.round(n).toLocaleString("en-US");
}

export default async function AdminCollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="admin__panel">
      <div className="admin__panel-head">
        <h2 className="admin__panel-title">Collections</h2>
        <Link href="/admin/categories" className="admin__panel-link">Manage Categories</Link>
      </div>
      <p style={{ fontSize: 12, color: "var(--a-text-dim)", marginBottom: 18 }}>
        Each category is a shoppable collection on the storefront. Add or edit products from the
        Products page, or add a new collection from Categories.
      </p>

      {collections.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {collections.map((c) => (
            <div key={c.id} style={{ background: "var(--a-panel-2)", border: "1px solid var(--a-border)", borderRadius: 10, overflow: "hidden" }}>
              {c.image_url ? (
                <img src={c.image_url} alt="" style={{ width: "100%", height: 110, objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: 110, background: "var(--a-panel)" }} />
              )}
              <div style={{ padding: 12 }}>
                <div style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 14, color: "var(--a-cream)", marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "var(--a-text-dim)" }}>{c.product_count} products · {fmt(c.total_value)} total value</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "var(--a-text-dim)", fontSize: 12, padding: "20px 0" }}>No collections yet.</p>
      )}
    </div>
  );
}

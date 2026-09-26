import Link from "next/link";
import { sql } from "@/lib/db";
import DeleteProductButton from "../../components/admin/DeleteProductButton";

export const revalidate = 0;
export const metadata = { title: "Products — Antique Home Admin" };

async function getProducts() {
  try {
    return (await sql`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC
    `) as {
      id: number;
      name: string;
      slug: string;
      price: string;
      image_urls: string[];
      stock_qty: number;
      category_name: string | null;
    }[];
  } catch (err) {
    console.error(err);
    return [];
  }
}

function fmt(n: string | number) {
  return "EGP " + Math.round(typeof n === "string" ? parseFloat(n) : n).toLocaleString("en-US");
}

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <>
      <div className="admin__panel-head" style={{ marginBottom: 0 }}>
        <h2 className="admin__panel-title">Products</h2>
        <Link href="/admin/products/new" className="admin__btn admin__btn--gold">
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><line x1="10" y1="4.4" x2="10" y2="15.6"></line><line x1="4.4" y1="10" x2="15.6" y2="10"></line></svg>
          Add Product
        </Link>
      </div>

      <div className="admin__panel">
        {products.length > 0 ? (
          <table className="admin__table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="admin__cellProduct">
                      <img src={p.image_urls?.[0] || "/logo hero.png"} alt="" />
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td>{p.category_name || "—"}</td>
                  <td>{fmt(p.price)}</td>
                  <td>
                    <span className={p.stock_qty < 10 ? "admin__pill admin__pill--low" : "admin__pill admin__pill--delivered"}>
                      {p.stock_qty}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <Link href={`/admin/products/${p.id}/edit`} className="admin__btn" style={{ padding: "6px 12px" }}>
                      Edit
                    </Link>
                    <DeleteProductButton id={p.id} name={p.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "var(--a-text-dim)" }}>
            <p style={{ marginBottom: 16 }}>No products yet. Add your first product to get started.</p>
            <Link href="/admin/products/new" className="admin__btn admin__btn--gold">
              Add Product
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

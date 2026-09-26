import { sql, type Category } from "@/lib/db";
import NewCategoryForm from "@/app/components/admin/NewCategoryForm";

export const revalidate = 0;
export const metadata = { title: "Categories — Antique Home Admin" };

async function getCategories() {
  try {
    return (await sql`
      SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id)::int AS product_count
      FROM categories c
      ORDER BY sort_order
    `) as (Category & { product_count: number })[];
  } catch {
    return [];
  }
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="admin__panel">
      <div className="admin__panel-head">
        <h2 className="admin__panel-title">Categories</h2>
      </div>

      <NewCategoryForm />

      <table className="admin__table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Slug</th>
            <th>Products</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>
                <div className="admin__cellProduct">
                  {c.image_url ? <img src={c.image_url} alt="" /> : null}
                  <span>{c.name}</span>
                </div>
              </td>
              <td>{c.slug}</td>
              <td>{c.product_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

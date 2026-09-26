import { sql, type Category } from "@/lib/db";
import ProductForm from "../../../components/admin/ProductForm";

export const revalidate = 0;
export const metadata = { title: "Add Product — Antique Home Admin" };

async function getCategories() {
  try {
    return (await sql`SELECT id, name FROM categories ORDER BY sort_order`) as Category[];
  } catch {
    return [];
  }
}

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="admin__panel">
      <div className="admin__panel-head">
        <h2 className="admin__panel-title">Add Product</h2>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}

import Link from "next/link";
import { sql, type Category } from "@/lib/db";
import ProductForm from "@/app/components/admin/ProductForm";

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
    <>
      <div className="admin__pageHead">
        <img src="/sec 2/main sec 2.jpeg" alt="" />
        <div className="admin__pageHead-body">
          <p className="admin__crumb">
            <Link href="/admin/products">Products</Link>
            <svg viewBox="0 0 12 8" aria-hidden="true"><polyline points="1,1.5 6,6.5 11,1.5" transform="rotate(-90 6 4)" fill="none" /></svg>
            <span>Add Product</span>
          </p>
          <h1 className="admin__pageTitle">Add Product</h1>
          <p className="admin__pageSub">Upload photos, set pricing, stock and options.</p>
        </div>
      </div>

      <ProductForm categories={categories} />
    </>
  );
}

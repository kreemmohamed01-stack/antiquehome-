import { sql, type Product } from "@/lib/db";
import ProductsManager from "@/app/components/admin/ProductsManager";

export const revalidate = 0;
export const metadata = { title: "Products — Antique Home Admin" };

async function getProducts() {
  try {
    return (await sql`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC
    `) as (Product & { category_name: string | null })[];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export default async function AdminProductsPage() {
  const products = await getProducts();
  return <ProductsManager products={products} />;
}

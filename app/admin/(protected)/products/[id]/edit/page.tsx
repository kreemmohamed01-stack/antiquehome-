import { notFound } from "next/navigation";
import { sql, type Product, type Category } from "@/lib/db";
import ProductForm from "@/app/components/admin/ProductForm";

export const revalidate = 0;
export const metadata = { title: "Edit Product — Antique Home Admin" };

async function getData(id: string) {
  try {
    const [products, categories] = await Promise.all([
      sql`SELECT * FROM products WHERE id = ${Number(id)}` as unknown as Promise<Product[]>,
      sql`SELECT id, name FROM categories ORDER BY sort_order` as unknown as Promise<Category[]>,
    ]);
    return { product: products[0] || null, categories };
  } catch {
    return { product: null, categories: [] as Category[] };
  }
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { product, categories } = await getData(id);
  if (!product) notFound();

  return (
    <div className="admin__panel">
      <div className="admin__panel-head">
        <h2 className="admin__panel-title">Edit Product</h2>
      </div>
      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description || "",
          price: product.price,
          compareAtPrice: product.compare_at_price || "",
          categoryId: product.category_id ? String(product.category_id) : "",
          material: product.material || "",
          colors: (product.colors || []).join(", "),
          sizeCm: product.size_cm || "",
          sizes: product.sizes || [],
          badge: product.badge || "",
          salePercent: product.sale_percent || "",
          saleLabel: product.sale_label || "",
          stockQty: String(product.stock_qty),
          imageUrls: product.image_urls || [],
        }}
      />
    </div>
  );
}

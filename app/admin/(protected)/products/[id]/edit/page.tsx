import { notFound } from "next/navigation";
import Link from "next/link";
import { sql, type Product, type Category } from "@/lib/db";
import ProductForm from "@/app/components/admin/ProductForm";

export const revalidate = 0;
export const metadata = { title: "Edit Product — Antique Home Admin" };

async function getData(id: string) {
  try {
    const pid = Number(id);
    const [products, categories, links] = await Promise.all([
      sql`SELECT * FROM products WHERE id = ${pid}` as unknown as Promise<Product[]>,
      sql`SELECT id, name FROM categories ORDER BY sort_order` as unknown as Promise<Category[]>,
      sql`SELECT category_id FROM product_categories WHERE product_id = ${pid}` as unknown as Promise<{ category_id: number }[]>,
    ]);
    return {
      product: products[0] || null,
      categories,
      categoryIds: links.map((l) => l.category_id),
    };
  } catch {
    return { product: null, categories: [] as Category[], categoryIds: [] as number[] };
  }
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { product, categories, categoryIds } = await getData(id);
  if (!product) notFound();

  const ids = categoryIds.length
    ? categoryIds
    : product.category_id
    ? [product.category_id]
    : [];

  return (
    <>
      <div className="admin__pageHead">
        <img src={product.image_urls?.[0] || "/sec 2/main sec 2.jpeg"} alt="" />
        <div className="admin__pageHead-body">
          <p className="admin__crumb">
            <Link href="/admin/products">Products</Link>
            <svg viewBox="0 0 12 8" aria-hidden="true"><polyline points="1,1.5 6,6.5 11,1.5" transform="rotate(-90 6 4)" fill="none" /></svg>
            <span>Edit Product</span>
          </p>
          <h1 className="admin__pageTitle">Edit Product</h1>
          <p className="admin__pageSub">Update details, images, pricing, stock and options.</p>
        </div>
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
          pricingMode: (product.pricing_mode as "unit" | "set") || "unit",
          pricePerPiece: product.price_per_piece || "",
          setSize: product.set_size ? String(product.set_size) : "",
          categoryIds: ids,
          material: product.material || "",
          colorOptions: product.color_options || [],
          variants: product.variants || [],
          sizeCm: product.size_cm || "",
          badge: product.badge || "",
          salePercent: product.sale_percent || "",
          saleLabel: product.sale_label || "",
          stockQty: String(product.stock_qty),
          lowStockThreshold: String(product.low_stock_threshold ?? 5),
          isNewArrival: product.is_new_arrival ?? false,
          status: product.status || "active",
          sku: product.sku || "",
          imageUrls: product.image_urls || [],
        }}
      />
    </>
  );
}

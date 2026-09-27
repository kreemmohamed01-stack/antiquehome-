import { notFound } from "next/navigation";
import { sql, getSiteSale, type Product } from "@/lib/db";
import { PromoBar, ShopHeader, ShopTopbar } from "../../components/Header";
import StorefrontChrome from "../../components/StorefrontChrome";
import ProductDetail from "../../components/ProductDetail";

export const revalidate = 0;

// One query: the target product plus every other product in its category,
// so prev/next can be derived without extra round trips.
async function getProductAndNeighbors(slug: string) {
  const rows = (await sql`
    SELECT * FROM products
    WHERE category_id = (SELECT category_id FROM products WHERE slug = ${slug})
       OR slug = ${slug}
    ORDER BY created_at DESC, id DESC
  `) as Product[];

  const current = rows.find((p) => p.slug === slug);
  if (!current) return null;

  // Prefer neighbors from the same category; fall back to the full catalog
  // only if the product has no category (rare).
  let pool = rows.filter((p) => p.category_id === current.category_id);
  if (pool.length < 2) {
    pool = (await sql`SELECT * FROM products ORDER BY created_at DESC, id DESC`) as Product[];
  }
  const idx = pool.findIndex((p) => p.id === current.id);
  const prev = idx > 0 ? pool[idx - 1] : null;
  const next = idx >= 0 && idx < pool.length - 1 ? pool[idx + 1] : null;

  return { product: current, prevSlug: prev?.slug ?? null, nextSlug: next?.slug ?? null };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const rows = (await sql`SELECT name, description FROM products WHERE slug = ${slug}`) as { name: string; description: string | null }[];
    if (!rows.length) return { title: "Product — Antique Home" };
    return { title: `${rows[0].name} — Antique Home`, description: rows[0].description || undefined };
  } catch {
    return { title: "Product — Antique Home" };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let data;
  let siteSale;
  try {
    [data, siteSale] = await Promise.all([getProductAndNeighbors(slug), getSiteSale()]);
  } catch {
    data = null;
    siteSale = await getSiteSale().catch(() => undefined);
  }
  if (!data) notFound();

  return (
    <>
      <PromoBar />
      <ShopTopbar />
      <ShopHeader active="" />

      <ProductDetail product={data.product} prevSlug={data.prevSlug} nextSlug={data.nextSlug} siteSale={siteSale} />

      <StorefrontChrome />
    </>
  );
}

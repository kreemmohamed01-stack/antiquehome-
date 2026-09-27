import { notFound } from "next/navigation";
import { sql, getSiteSale, type Product } from "@/lib/db";
import { PromoBar, ShopHeader, ShopTopbar } from "../../components/Header";
import StorefrontChrome from "../../components/StorefrontChrome";
import ProductDetail from "../../components/ProductDetail";

export const revalidate = 0;

async function getProductAndNeighbors(slug: string) {
  const products = (await sql`SELECT * FROM products WHERE category_id = (SELECT category_id FROM products WHERE slug = ${slug}) ORDER BY created_at DESC, id DESC`) as Product[];
  const product = (await sql`SELECT * FROM products WHERE slug = ${slug}`) as Product[];
  if (!product.length) return null;
  const current = product[0];

  // Prev/Next within the same category, falling back to the full catalog.
  const pool = products.length ? products : ((await sql`SELECT * FROM products ORDER BY created_at DESC, id DESC`) as Product[]);
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
  try {
    data = await getProductAndNeighbors(slug);
  } catch {
    data = null;
  }
  if (!data) notFound();
  const siteSale = await getSiteSale();

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

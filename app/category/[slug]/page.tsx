import { notFound } from "next/navigation";
import { sql, type Product, type Category } from "@/lib/db";
import { ShopHeader, ShopTopbar } from "../../components/Header";
import ShopView from "../../components/ShopView";
import StorefrontChrome from "../../components/StorefrontChrome";

export const revalidate = 0;

const BANNER: Record<string, { title: string; text: string; img: string }> = {
  "bleu-blanc": { title: "BLEU BLANC", text: "Porcelain in classic blue and white, timeless on every table.", img: "/sec 3/category 1.png" },
  lighting: { title: "LIGHTING", text: "Chandeliers, lamps and sconces that cast a warm, antique glow.", img: "/sec 3/category 2.png" },
  accessories: { title: "ACCESSORIES", text: "Small finishing pieces — busts, boxes and objets for every shelf.", img: "/sec 3/category 3.png" },
  antiques: { title: "ANTIQUES", text: "Rare finds with real history, each one a story for your home.", img: "/sec 3/category 4.png" },
  "artificial-plants-garden-stool": { title: "ARTIFICIAL PLANTS & GARDEN STOOL", text: "Lush greenery and ceramic stools that never need watering.", img: "/sec 3/category 5.png" },
  "wall-art-plates": { title: "WALL ART & PLATES", text: "Framed pieces and decorative plates to dress every wall.", img: "/sec 3/category 6.png" },
  "murano-glass": { title: "MURANO GLASS", text: "Hand-blown glass from Venice, colour and light in one form.", img: "/sec 3/category 7.png" },
  furniture: { title: "FURNITURE", text: "Statement chairs, consoles and tables built to be inherited.", img: "/sec 3/category 8.png" },
  sale: { title: "SALE", text: "Timeless pieces at a kinder price, for a limited time only.", img: "/sec 3/category 9.jpeg" },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const banner = BANNER[slug];
  return { title: banner ? `${banner.title.charAt(0)}${banner.title.slice(1).toLowerCase()} — Antique Home` : "Antique Home" };
}

async function getData(slug: string) {
  try {
    const categories = (await sql`SELECT * FROM categories ORDER BY sort_order`) as Category[];
    const category = categories.find((c) => c.slug === slug);
    if (!category) return { category: null, products: [] as Product[], categories };
    const products = (await sql`SELECT * FROM products WHERE category_id = ${category.id} ORDER BY created_at DESC`) as Product[];
    return { category, products, categories };
  } catch {
    return { category: null, products: [] as Product[], categories: [] as Category[] };
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const banner = BANNER[slug];
  if (!banner) notFound();

  const { products, categories } = await getData(slug);

  return (
    <>
      <div className="shop-topbar-wrap">
        <ShopTopbar />
        <ShopHeader active="" />
      </div>

      <section className="shop shop-banner">
        <div className="shop-banner__bg" aria-hidden="true"><img src={banner.img} alt="" loading="lazy" /></div>
        <div className="shop-banner__inner">
          <p className="crumb">
            <a href="/">Home</a>
            <span className="crumb__sep" aria-hidden="true">&rsaquo;</span>
            <a href="/shop">Shop</a>
            <span className="crumb__sep" aria-hidden="true">&rsaquo;</span>
            <span className="crumb__here">{banner.title.charAt(0)}{banner.title.slice(1).toLowerCase()}</span>
          </p>
          <h1 className="shop-banner__title">{banner.title}</h1>
          <span className="shop-banner__rule" aria-hidden="true"><i></i><i></i></span>
          <p className="shop-banner__text">{banner.text}</p>
        </div>
      </section>

      <ShopView products={products} categories={categories} activeCategory={slug} />

      <StorefrontChrome />
    </>
  );
}

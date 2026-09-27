import { sql, getSiteSale, type Product, type Category } from "@/lib/db";
import { PromoBar, ShopHeader } from "../components/Header";
import CategoryRail from "../components/CategoryRail";
import ShopView from "../components/ShopView";
import StorefrontChrome from "../components/StorefrontChrome";

export const revalidate = 0;
export const metadata = { title: "All Products — Antique Home" };

async function getData() {
  try {
    const [products, categories] = await Promise.all([
      sql`SELECT * FROM products WHERE status = 'active' ORDER BY created_at DESC` as unknown as Promise<Product[]>,
      sql`SELECT * FROM categories ORDER BY sort_order` as unknown as Promise<Category[]>,
    ]);
    return { products, categories };
  } catch {
    return { products: [] as Product[], categories: [] as Category[] };
  }
}

export default async function ShopPage() {
  const [{ products, categories }, siteSale] = await Promise.all([getData(), getSiteSale()]);

  return (
    <>
      <PromoBar />

      <section className="shop-hero" id="shopHero">
        <div className="shop-hero__media" aria-hidden="true">
          <picture>
            <source media="(min-width: 900px)" srcSet="/هيرو شوب ناو لاب .png" />
            <img src="/هيرو شوب ناو موبيل .png" alt="" loading="eager" />
          </picture>
          <div className="shop-hero__tint"></div>
        </div>

        <header className="header">
          <a className="brand" href="/" aria-label="Antique Home — Vase &amp; Decor">
            <img className="brand__logo" src="/logo hero.png" alt="Antique Home — Vase &amp; Decor" />
            <span className="brand__shine" aria-hidden="true"></span>
          </a>
          <button className="icon-btn menu-btn" type="button" id="menuBtn" aria-haspopup="true" aria-expanded="false" aria-controls="sideMenu" aria-label="Open menu">
            <span className="menu-btn__lines" aria-hidden="true"><span></span><span></span><span></span></span>
            <span className="menu-btn__label">Menu</span>
          </button>
          <nav className="header__actions" aria-label="Utilities">
            <button className="icon-btn" type="button" id="searchBtn" aria-haspopup="true" aria-expanded="false" aria-controls="searchDrawer" aria-label="Search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.4"></circle><line x1="15.7" y1="15.7" x2="20.2" y2="20.2"></line></svg>
            </button>
            <button className="icon-btn cart-btn" type="button" id="cartBtn" aria-haspopup="true" aria-expanded="false" aria-controls="cartDrawer" aria-label="Shopping bag">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.6 7.8h12.8l1 12.4H4.6z"></path><path d="M8.9 9.6V6.6a3.1 3.1 0 0 1 6.2 0v3"></path></svg>
              <span className="cart-btn__count">0</span>
            </button>
          </nav>
        </header>

        <nav className="shop-nav shop-nav--hero" aria-label="Primary">
          <a href="/">Home</a>
          <a href="/shop" className="is-active">Shop</a>
          <a href="/#collection">Collections</a>
          <a href="/about">About Us</a>
          <a href="/#contact">Contact</a>
        </nav>

        <div className="shop-hero__inner">
          <p className="crumb">
            <a href="/">Home</a>
            <span className="crumb__sep" aria-hidden="true">&rsaquo;</span>
            <span className="crumb__here">All Products</span>
          </p>
          <p className="shop-hero__eyebrow">Discover Our Collection</p>
          <h1 className="shop-hero__title">All Products</h1>
          <p className="shop-hero__text">Curated pieces for a more beautiful home.</p>
        </div>
      </section>

      <CategoryRail active="all" />

      <ShopView products={products} categories={categories} activeCategory="all" siteSale={siteSale} />

      <StorefrontChrome />
    </>
  );
}

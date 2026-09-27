"use client";

import { useMemo, useState } from "react";
import type { Product, Category, SiteSale } from "@/lib/db";
import { effectiveSalePercent, priceWithSale, stockState } from "@/lib/db";
import { cldUrl } from "@/lib/cloudinaryUrl";

type SortValue = "newest" | "price-asc" | "price-desc" | "name-asc";
const PAGE_SIZE = 8;

const CATEGORY_LIST: { slug: string; label: string }[] = [
  { slug: "all", label: "All Products" },
  { slug: "bleu-blanc", label: "Bleu Blanc" },
  { slug: "lighting", label: "Lighting" },
  { slug: "accessories", label: "Accessories" },
  { slug: "antiques", label: "Antiques" },
  { slug: "artificial-plants-garden-stool", label: "Artificial Plants & Garden Stool" },
  { slug: "wall-art-plates", label: "Wall Art & Plates" },
  { slug: "murano-glass", label: "Murano Glass" },
  { slug: "furniture", label: "Furniture" },
  { slug: "sale", label: "Sale" },
];

export default function ShopView({
  products,
  categories,
  activeCategory,
  siteSale,
}: {
  products: Product[];
  categories: Category[];
  activeCategory: string; // "all" or a slug
  siteSale?: SiteSale;
}) {
  const sale = siteSale || { active: false, percent: 0, label: "" };
  const [sort, setSort] = useState<SortValue>("newest");
  const [page, setPage] = useState(1);
  const [maxPrice, setMaxPrice] = useState(20000);
  const [color, setColor] = useState<string | null>(null);
  const [materials, setMaterials] = useState<string[]>([]);
  const [sortOpen, setSortOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const catBySlug = useMemo(() => new Map(categories.map((c) => [c.slug, c])), [categories]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (Number(p.price) > maxPrice) return false;
      if (color && !(p.colors || []).includes(color)) return false;
      if (materials.length && !materials.includes((p.material || "").toLowerCase())) return false;
      return true;
    });
  }, [products, maxPrice, color, materials]);

  const sorted = useMemo(() => {
    const copy = filtered.slice();
    if (sort === "price-asc") copy.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === "price-desc") copy.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === "name-asc") copy.sort((a, b) => a.name.localeCompare(b.name));
    return copy;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const sortLabels: Record<SortValue, string> = {
    newest: "Newest",
    "price-asc": "Price: Low to High",
    "price-desc": "Price: High to Low",
    "name-asc": "Name: A–Z",
  };

  function clearFilters() {
    setMaxPrice(20000);
    setColor(null);
    setMaterials([]);
    setPage(1);
  }

  function toggleMaterial(m: string) {
    setPage(1);
    setMaterials((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  return (
    <div className="shop">
      <div className="shop-toolbar">
        <div className="shop-toolbar__row">
          <button className="tool-btn tool-btn--filter" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7"></line><circle cx="9" cy="7" r="2.2"></circle><line x1="4" y1="17" x2="20" y2="17"></line><circle cx="15" cy="17" r="2.2"></circle></svg>
            Filter
          </button>
          <button className="tool-btn tool-btn--sort" type="button" onClick={() => setSortOpen((v) => !v)}>
            <span className="js-sort-label">Sort By: {sortLabels[sort]}</span>
            <svg className="tool-btn__chev" viewBox="0 0 12 8" aria-hidden="true"><polyline points="1,1.5 6,6.5 11,1.5"></polyline></svg>
          </button>
        </div>
        <div className="shop-toolbar__meta">
          <span id="shopCount">{sorted.length} {sorted.length === 1 ? "Product" : "Products"}</span>
          <div className="sort-pop" data-open={sortOpen ? "true" : "false"}>
            <button className="tool-btn tool-btn--sort" type="button" aria-expanded={sortOpen} onClick={() => setSortOpen((v) => !v)}>
              <span className="js-sort-label">Sort By: {sortLabels[sort]}</span>
              <svg className="tool-btn__chev" viewBox="0 0 12 8" aria-hidden="true"><polyline points="1,1.5 6,6.5 11,1.5"></polyline></svg>
            </button>
            <div className="sort-pop__list">
              {(Object.keys(sortLabels) as SortValue[]).map((s) => (
                <button key={s} type="button" className={s === sort ? "is-active" : ""} onClick={() => { setSort(s); setPage(1); setSortOpen(false); }}>
                  {sortLabels[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="view-toggle">
            <button type="button" className={view === "grid" ? "is-active" : ""} aria-label="Grid view" onClick={() => setView("grid")}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="8" height="8"></rect><rect x="13" y="3" width="8" height="8"></rect><rect x="3" y="13" width="8" height="8"></rect><rect x="13" y="13" width="8" height="8"></rect></svg>
            </button>
            <button type="button" className={view === "list" ? "is-active" : ""} aria-label="List view" onClick={() => setView("list")}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="shop-body">
        <aside className="filters" aria-label="Filters">
          <div className="filters__group">
            <h3 className="filters__title">Category</h3>
            <ul className="filters__cats">
              {CATEGORY_LIST.map((c) => (
                <li key={c.slug} data-cat={c.slug} className={activeCategory === c.slug ? "is-active" : ""}>
                  <a href={c.slug === "all" ? "/shop" : `/category/${c.slug}`}>
                    <svg viewBox="0 0 12 8" aria-hidden="true"><polyline points="1,1.5 6,6.5 11,1.5"></polyline></svg>
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="filters__group filters__price">
            <h3 className="filters__title">Price</h3>
            <input
              type="range"
              className="filters__range"
              min={500}
              max={20000}
              step={100}
              value={maxPrice}
              onChange={(e) => { setMaxPrice(Number(e.target.value)); setPage(1); }}
              aria-label="Maximum price"
            />
            <div className="filters__price-labels">
              <span>EGP 0</span>
              <span className="js-price-max">EGP {maxPrice.toLocaleString("en-US")}{maxPrice >= 20000 ? "+" : ""}</span>
            </div>
          </div>

          <div className="filters__group">
            <h3 className="filters__title">Color</h3>
            <div className="filters__swatches">
              {[
                ["beige", "#D9C8AC"],
                ["brown", "#6B4A32"],
                ["black", "#1C1611"],
                ["green", "#5C6B4A"],
                ["white", "#F6F1E8"],
              ].map(([c, hex]) => (
                <button
                  key={c}
                  type="button"
                  className="filters__swatch"
                  style={{ background: hex }}
                  aria-pressed={color === c}
                  aria-label={c}
                  onClick={() => { setColor(color === c ? null : c); setPage(1); }}
                />
              ))}
            </div>
          </div>

          <div className="filters__group">
            <h3 className="filters__title">Material</h3>
            <div className="filters__check">
              {["ceramic", "glass", "metal", "wood", "marble", "stone", "fabric"].map((m) => (
                <label key={m}>
                  <input type="checkbox" checked={materials.includes(m)} onChange={() => toggleMaterial(m)} />
                  {m[0].toUpperCase() + m.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <button type="button" className="filters__clear js-clear-filters" onClick={clearFilters}>Clear Filters</button>
        </aside>

        <div>
          <div className={`shop-grid${view === "list" ? " is-list" : ""}`} id="shopGrid">
            {visible.length === 0 && (
              <p style={{ padding: "40px 0", opacity: 0.7, gridColumn: "1 / -1" }}>
                No products found yet — check back soon as we add new pieces.
              </p>
            )}
            {visible.map((p) => {
              const cat = catBySlug.get(String(p.category_id));
              const pct = effectiveSalePercent(p, sale);
              const finalPrice = pct > 0 ? priceWithSale(p.price, pct) : Number(p.price);
              const saleText = pct > 0 ? (p.sale_label && parseFloat(p.sale_percent || "0") > 0 ? p.sale_label : `Sale ${pct}%`) : "";
              return (
                <article
                  key={p.id}
                  className="pcard"
                  data-name={p.name}
                  data-price={p.price}
                  data-size={p.size_cm || ""}
                  data-material={(p.material || "").toLowerCase()}
                  data-color={(p.colors || []).join(",")}
                >
                  <a className="pcard__media" href={`/product/${p.slug}`}>
                    {pct > 0 ? (
                      <span className="pcard__badge pcard__badge--sale">{saleText}</span>
                    ) : stockState(p) === "out" ? (
                      <span className="pcard__badge pcard__badge--sale">Out of Stock</span>
                    ) : stockState(p) === "low" ? (
                      <span className="pcard__badge" style={{ background: "#D9A441", color: "#1C1611" }}>Low Stock</span>
                    ) : p.is_new_arrival ? (
                      <span className="pcard__badge">New</span>
                    ) : (
                      p.badge && <span className="pcard__badge">{p.badge}</span>
                    )}
                    <img src={cldUrl((p.image_urls || [])[0], 480)} alt={p.name} loading="lazy" />
                    <button className="fav" type="button" aria-label={`Save ${p.name}`} aria-pressed="false" onClick={(e) => e.preventDefault()}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4 4.6 13.2a4.6 4.6 0 1 1 7.4-5.3 4.6 4.6 0 1 1 7.4 5.3Z"></path></svg>
                    </button>
                    <button
                      className="pcard__add"
                      type="button"
                      data-add={p.name}
                      data-add-id={p.slug}
                      data-add-price={p.price}
                      data-add-image={(p.image_urls || [])[0] || ""}
                      aria-label={`Add ${p.name} to cart`}
                      onClick={(e) => e.preventDefault()}
                    >
                      <svg viewBox="0 0 20 20" aria-hidden="true"><line x1="10" y1="4.4" x2="10" y2="15.6"></line><line x1="4.4" y1="10" x2="15.6" y2="10"></line></svg>
                    </button>
                  </a>
                  <div className="pcard__body">
                    <p className="pcard__cat">{p.material || cat?.name || ""}{p.size_cm ? ` • ${p.size_cm} cm` : ""}</p>
                    <h3 className="pcard__name"><a href={`/product/${p.slug}`} style={{ color: "inherit", textDecoration: "none" }}>{p.name}</a></h3>
                    <span className="pcard__stars" aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg viewBox="0 0 24 24" key={i}><path d="M12 2 14.9 8.6 22 9.3 16.8 13.9 18.4 21 12 17.3 5.6 21 7.2 13.9 2 9.3 9.1 8.6Z"></path></svg>
                      ))}
                      <em>({p.review_count})</em>
                    </span>
                    <p className="pcard__price">
                      {pct > 0 ? (
                        <>
                          <s style={{ opacity: 0.5, fontWeight: 400, marginRight: 6 }}>EGP {Number(p.price).toLocaleString("en-US")}</s>
                          <span style={{ color: "#A93B29", fontWeight: 700 }}>EGP {finalPrice.toLocaleString("en-US")}</span>
                        </>
                      ) : (
                        <>
                          {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
                            <s style={{ opacity: 0.5, fontWeight: 400, marginRight: 6 }}>EGP {Number(p.compare_at_price).toLocaleString("en-US")}</s>
                          )}
                          EGP {Number(p.price).toLocaleString("en-US")}
                        </>
                      )}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav className="pager" aria-label="Pagination">
              <button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <svg viewBox="0 0 20 14" aria-hidden="true"><line x1="19" y1="7" x2="2" y2="7"></line><polyline points="7.4,1.6 1.6,7 7.4,12.4"></polyline></svg>
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} type="button" className={currentPage === i + 1 ? "is-active" : ""} onClick={() => setPage(i + 1)}>
                  {i + 1}
                </button>
              ))}
              <button type="button" aria-label="Next page" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                <svg viewBox="0 0 20 14" aria-hidden="true"><line x1="1" y1="7" x2="18" y2="7"></line><polyline points="12.6,1.6 18.4,7 12.6,12.4"></polyline></svg>
              </button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

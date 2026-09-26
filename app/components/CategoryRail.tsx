const ITEMS = [
  { slug: "bleu-blanc", label: "Bleu Blanc", img: "/sec 3/category 1.png" },
  { slug: "accessories", label: "Decor Accents", img: "/sec 3/category 3.png" },
  { slug: "lighting", label: "Lighting", img: "/sec 3/category 2.png" },
  { slug: "murano-glass", label: "Murano Glass", img: "/sec 3/category 7.png" },
  { slug: "wall-art-plates", label: "Wall Art", img: "/sec 3/category 6.png" },
  { slug: "furniture", label: "Furniture", img: "/sec 3/category 8.png" },
  { slug: "antiques", label: "Antiques", img: "/sec 3/category 4.png" },
  { slug: "artificial-plants-garden-stool", label: "Trays", img: "/sec 3/category 5.png" },
  { slug: "sale", label: "Sale", img: "/sec 3/category 9.jpeg" },
];

export default function CategoryRail({ active }: { active: string }) {
  return (
    <nav className="catrail" aria-label="Shop by category">
      <div className="catrail__scroll">
        {ITEMS.map((it) => (
          <a key={it.slug} className={`catrail__item${active === it.slug ? " catrail__item--active" : ""}`} href={`/category/${it.slug}`}>
            <span className="catrail__ico"><img src={it.img} alt="" loading="lazy" /></span>
            <span className="catrail__label">{it.label}</span>
          </a>
        ))}
        <a className={`catrail__item${active === "all" ? " catrail__item--active" : ""}`} href="/shop">
          <span className="catrail__ico catrail__ico--all">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.6" y="3.6" width="7.2" height="7.2" rx="1"></rect><rect x="13.2" y="3.6" width="7.2" height="7.2" rx="1"></rect><rect x="3.6" y="13.2" width="7.2" height="7.2" rx="1"></rect><rect x="13.2" y="13.2" width="7.2" height="7.2" rx="1"></rect></svg>
          </span>
          <span className="catrail__label">All Products</span>
        </a>
      </div>
    </nav>
  );
}

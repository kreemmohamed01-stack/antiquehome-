// GET /sitemap (rewritten by vercel.json to /api/sitemap?html=1) — the
// human-readable sitemap linked from the footer: every page, category and
// active product as plain links in the raw HTML, so crawlers reach every
// product from one internal page without running JS. Reuses terms.html as
// the page shell (header, footer, styles) and swaps in its own <main>.
const fs = require("fs");
const path = require("path");
const { sql } = require("./_db.js");
const { SITE_URL } = require("./_seo.js");

let template = null;
function loadTemplate() {
  if (!template) template = fs.readFileSync(path.join(__dirname, "..", "terms.html"), "utf8");
  return template;
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const PAGES = [
  ["/", "Home", "home"],
  ["/shop.html", "All Products", "shop"],
  ["/about.html", "About Us", "aboutUs"],
  ["/shipping.html", "Shipping & Delivery", null],
  ["/returns.html", "Returns & Exchanges", null],
  ["/privacy.html", "Privacy Policy", null],
  ["/terms.html", "Terms & Conditions", "footTermsConditions"],
];

const STYLE = `<style>
.smap__grid{display:grid;gap:4px 28px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));list-style:none;margin:0;padding:0}
.smap__grid a{display:block;padding:6px 0;color:inherit;text-decoration:none;border-bottom:1px solid rgba(140,110,70,.14)}
.smap__grid a:hover{color:#a07a4a}
.smap__grid small{opacity:.6;margin-inline-start:6px}
</style>`;

function list(items) {
  return `<ul class="smap__grid">${items.join("")}</ul>`;
}

module.exports = async (req, res) => {
  let categories = [], products = [];
  try {
    [categories, products] = await Promise.all([
      sql`SELECT id, slug, name, name_ar FROM categories ORDER BY sort_order ASC, name ASC`,
      sql`SELECT slug, name, category_id FROM products WHERE status = 'active' ORDER BY name ASC`,
    ]);
  } catch (e) {} // DB down: still serve the static pages

  const pageLinks = PAGES.map(([href, label, key]) =>
    `<li><a href="${href}"${key ? ` data-i18n="${key}"` : ""}>${esc(label)}</a></li>`);
  const catLinks = categories.map((c) =>
    `<li><a href="/shop.html?category=${encodeURIComponent(c.slug)}">${esc(c.name)}${c.name_ar ? `<small lang="ar">${esc(c.name_ar)}</small>` : ""}</a></li>`);

  // Products grouped under their category; anything unassigned goes last.
  const byCat = new Map();
  for (const p of products) {
    const k = p.category_id == null ? "" : String(p.category_id);
    if (!byCat.has(k)) byCat.set(k, []);
    byCat.get(k).push(`<li><a href="/product/${encodeURIComponent(p.slug)}">${esc(p.name)}</a></li>`);
  }
  const groups = categories.filter((c) => byCat.has(String(c.id))).map((c) => [c.name, byCat.get(String(c.id))]);
  const known = new Set(categories.map((c) => String(c.id)));
  const rest = [...byCat].filter(([k]) => !known.has(k)).flatMap(([, v]) => v);
  if (rest.length) groups.push(["More Pieces", rest]);

  const main = `<main class="policy">
  <p class="policy__crumb">
    <a href="/" data-i18n="home">Home</a>
    <svg viewBox="0 0 12 20" aria-hidden="true"><polyline points="2,2 10,10 2,18" fill="none" stroke="currentColor" stroke-width="1.4"></polyline></svg>
    <span data-i18n="footSitemap">Sitemap</span>
  </p>
  <p class="policy__kicker"><i></i><span data-i18n="footCareTitle">Customer Care</span></p>
  <h1 class="policy__title" data-i18n="footSitemap">Sitemap</h1>
  <p class="policy__intro">Every page, collection and piece at Antique Home in one place — ${products.length} products across ${categories.length} collections.</p>
  <section class="policy__section"><h2>Pages</h2>${list(pageLinks)}</section>
  ${catLinks.length ? `<section class="policy__section"><h2 data-i18n="collections">Collections</h2>${list(catLinks)}</section>` : ""}
  ${groups.map(([name, items]) => `<section class="policy__section"><h2>${esc(name)}</h2>${list(items)}</section>`).join("\n  ")}
</main>`;

  const title = "Sitemap — Antique Home";
  const desc = "Browse every page, collection and product at Antique Home — vases, antiques, lighting and home décor.";
  let html = loadTemplate()
    .replace(/<main class="policy">[\s\S]*?<\/main>/, () => main)
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta (?:name|property)="(?:description|og:description|twitter:description)" content=")[^"]*"/g, (_, a) => `${a}${esc(desc)}"`)
    .replace(/(<meta (?:property|name)="(?:og:title|twitter:title)" content=")[^"]*"/g, (_, a) => `${a}${title}"`)
    .replace(/https:\/\/www\.antiqueehome\.com\/terms\.html/g, `${SITE_URL}/sitemap`)
    .replace("</head>", `${STYLE}\n</head>`);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(html);
};

// GET /sitemap.xml (rewritten here by vercel.json) — lists every static
// page plus every active product and every category, generated fresh
// from the database each time so new products/categories show up
// without a redeploy. Cached at the edge for an hour since a sitemap
// doesn't need to be instantly fresh.
const { sql } = require("./_db.js");
const { SITE_URL } = require("./_seo.js");
const productPage = require("./_product-page.js");

const STATIC_PAGES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/shop.html", changefreq: "daily", priority: "0.9" },
  { path: "/about.html", changefreq: "monthly", priority: "0.6" },
  { path: "/shipping.html", changefreq: "yearly", priority: "0.3" },
  { path: "/returns.html", changefreq: "yearly", priority: "0.3" },
  { path: "/terms.html", changefreq: "yearly", priority: "0.2" },
  { path: "/privacy.html", changefreq: "yearly", priority: "0.2" },
];

function xmlEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Cloudinary original -> a 1200px JPG, minus the "#x,y,zoom" focal suffix.
function imgUrl(u) {
  u = String(u || "").split("#")[0];
  if (u.includes("res.cloudinary.com") && u.includes("/upload/")) return u.replace("/upload/", "/upload/f_jpg,q_auto,w_1200/");
  return u.startsWith("http") ? u : SITE_URL + u;
}

function urlEntry(loc, lastmod, changefreq, priority, images) {
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>${(images || []).map((im) => `
    <image:image><image:loc>${xmlEscape(imgUrl(im.url))}</image:loc>${im.title ? `<image:title>${xmlEscape(im.title)}</image:title>` : ""}</image:image>`).join("")}${lastmod ? `
    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

module.exports = async (req, res) => {
  // /product/<slug> is also served from here (see vercel.json) — Vercel
  // Hobby caps a deployment at 12 functions, so it shares this one.
  if (req.query.product !== undefined) return productPage(req, res, String(req.query.product));
  try {
    const [products, categories] = await Promise.all([
      sql`SELECT slug, name, image_urls, created_at FROM products WHERE status = 'active'`,
      sql`SELECT * FROM categories`,
    ]);

    const entries = [
      ...STATIC_PAGES.map((p) => urlEntry(SITE_URL + p.path, null, p.changefreq, p.priority)),
      ...categories.map((c) => urlEntry(`${SITE_URL}/shop.html?category=${encodeURIComponent(c.slug)}`, null, "weekly", "0.7")),
      ...products.map((p) => urlEntry(`${SITE_URL}/product/${encodeURIComponent(p.slug)}`, p.created_at, "weekly", "0.8",
        (Array.isArray(p.image_urls) ? p.image_urls : []).slice(0, 10).map((url, i) => ({ url, title: i ? `${p.name} — view ${i + 1}` : p.name })))),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    res.status(200).send(xml);
  } catch (err) {
    // A broken sitemap (e.g. the updated_at column not existing yet)
    // should never surface as a crawl-breaking 500 — fall back to just
    // the static pages, which never depend on the database.
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_PAGES.map((p) => urlEntry(SITE_URL + p.path, null, p.changefreq, p.priority)).join("\n")}
</urlset>`;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  }
};

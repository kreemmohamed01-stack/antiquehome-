// GET /product/<slug> (rewritten by vercel.json to /api/sitemap?product=<slug>) — serves product.html
// with the product's real title, description, canonical, Open Graph /
// Twitter tags and Product JSON-LD already in the HTML. Search engines and
// social-media link previews (Facebook, WhatsApp, Instagram, X) read the
// raw HTML without running JS, so product.js setting these client-side
// wasn't enough — the static file also ships a <meta robots noindex>,
// which made Google drop every product page. The page JS then loads and
// renders the product exactly as before.
const fs = require("fs");
const path = require("path");
const { sql } = require("./_db.js");
const { SITE_URL } = require("./_seo.js");

let template = null;
function loadTemplate() {
  if (!template) template = fs.readFileSync(path.join(__dirname, "..", "product.html"), "utf8");
  return template;
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function plain(s, max) {
  const t = String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

// Same transform js/product.js's cldUrl() applies: a 1200px-wide JPG/auto
// copy of the Cloudinary original, which is what share previews want.
function shareImage(url) {
  if (url) url = String(url).split("#")[0]; // drop the "#x,y,zoom" focal-point suffix
  if (!url) return `${SITE_URL}/og-image.png`;
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/f_jpg,q_auto,w_1200/");
  }
  return url.startsWith("http") ? url : SITE_URL + url;
}

module.exports = async (req, res, slugParam) => {
  const slug = String(slugParam || "").trim();
  let html = loadTemplate();

  let product = null;
  if (slug) {
    try {
      const rows = await sql`SELECT p.*, c.name AS category_name FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.slug = ${slug} AND p.status = 'active' LIMIT 1`;
      product = rows[0] || null;
    } catch (e) {
      product = null;
    }
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (!product) {
    // Unknown slug: keep the noindex the template ships with, and say 404
    // so Google drops it instead of reporting a "soft 404".
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
    res.status(404).send(html);
    return;
  }

  const url = `${SITE_URL}/product/${encodeURIComponent(product.slug)}`;
  const title = `${product.name} — Antique Home`;
  const desc = plain(product.description, 160) ||
    `${product.name} — a timeless piece from Antique Home's curated collection of vases and home décor in Egypt.`;
  const images = (Array.isArray(product.image_urls) ? product.image_urls : []).map(shareImage);
  const image = images[0] || shareImage(null);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: desc,
    image: images.length ? images.slice(0, 5) : [image],
    sku: product.sku || undefined,
    brand: { "@type": "Brand", name: "Antique Home" },
    category: product.category_name || undefined,
    material: product.material || undefined,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "EGP",
      price: Number(product.price),
      availability: Number(product.stock_qty) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Antique Home" },
    },
    ...(Number(product.review_count) ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Number(product.rating || 0),
        reviewCount: Number(product.review_count),
      },
    } : {}),
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop.html` },
      { "@type": "ListItem", position: 3, name: product.name, item: url },
    ],
  };

  const head = `<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
<link rel="canonical" href="${esc(url)}" />
<meta property="og:type" content="product" />
<meta property="og:site_name" content="Antique Home" />
<meta property="og:locale" content="en_US" />
<meta property="og:locale:alternate" content="ar_EG" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:alt" content="${esc(product.name)}" />
<meta property="product:price:amount" content="${esc(Number(product.price))}" />
<meta property="product:price:currency" content="EGP" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${esc(image)}" />
<script type="application/ld+json" id="productLd">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<script type="application/ld+json">${JSON.stringify(crumbs).replace(/</g, "\\u003c")}</script>`;

  html = html
    .replace(/<title>[\s\S]*?<\/title>\s*/, "")
    .replace(/<meta name="description"[^>]*>\s*/, "")
    .replace(/<meta name="robots"[^>]*>\s*/, "")
    .replace("<link rel=\"manifest\" href=\"/site.webmanifest\" />", (m) => `${m}\n${head}`);

  // Cached at the edge so repeat visits/crawls don't hit the function or DB.
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=600, stale-while-revalidate=86400");
  res.status(200).send(html);
};
